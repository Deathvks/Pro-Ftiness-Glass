/* backend/seeders/20250802160000-seed-exercise-list.cjs */
'use strict';
const axios = require('axios');

// --- HELPER FUNCTIONS ---

const stripHtml = (html) => {
    if (!html) return null;
    const text = html
        .replace(/<p>|<\/p>|<br\s*\/?>|<li>|<\/li>/gi, '\n')
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    return text === '' ? null : text;
};

const fetchAllPages = async (url, resourceName = 'items') => {
    let results = [];
    let nextUrl = url;
    let page = 1;

    console.log(`Fetching ${resourceName}...`);
    while (nextUrl) {
        try {
            const response = await axios.get(nextUrl);
            if (response.data && response.data.results) {
                results = results.concat(response.data.results);
                nextUrl = response.data.next;
                page++;
            } else {
                console.warn(`Unexpected response structure from ${nextUrl}. Stopping pagination.`);
                nextUrl = null;
            }
        } catch (error) {
            console.error(`Error fetching page ${page} (${resourceName}) from ${nextUrl}: ${error.message}`);
            if (error.response?.status === 404) {
                console.error(`   Endpoint ${nextUrl} returned 404 Not Found. Please check the API endpoint URL.`);
            } else if (error.response?.status === 429) {
                console.warn(`   Rate limited by API. Waiting 5 seconds before retrying...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                nextUrl = null;
            }
        }
    }
    console.log(` -> Fetched ${results.length} ${resourceName}.`);
    return results;
};

// --- SEEDER ---

module.exports = {
    async up(queryInterface, Sequelize) {
        console.log('Starting to seed exercises from wger API (Fetching ALL, then Name/Desc: ES > EN > Default, Handling duplicates)...');
        try {
            const BASE_URL = 'https://wger.de/api/v2';
            const SPANISH_LANG_ID = 1;
            const ENGLISH_LANG_ID = 2;
            const LIMIT = 'limit=100';
            const EXERCISE_INFO_ENDPOINT = `${BASE_URL}/exerciseinfo/?${LIMIT}&status=2`;
            const CATEGORY_ENDPOINT = `${BASE_URL}/exercisecategory/?${LIMIT}`;
            const EQUIPMENT_ENDPOINT = `${BASE_URL}/equipment/?${LIMIT}`;
            const MUSCLE_ENDPOINT = `${BASE_URL}/muscle/?${LIMIT}`;
            const IMAGE_ENDPOINT_MAIN = `${BASE_URL}/exerciseimage/?limit=${LIMIT}&is_main=True`;
            const IMAGE_ENDPOINT_ALL = `${BASE_URL}/exerciseimage/?limit=${LIMIT}`;

            console.log('\nFetching data sources (Using API default language)...');
            const [
                exercises,
                categories,
                equipmentList,
                musclesList,
                mainImages,
                allImages
            ] = await Promise.all([
                fetchAllPages(EXERCISE_INFO_ENDPOINT, 'exercises (info)'),
                fetchAllPages(CATEGORY_ENDPOINT, 'categories'),
                fetchAllPages(EQUIPMENT_ENDPOINT, 'equipment'),
                fetchAllPages(MUSCLE_ENDPOINT, 'muscles'),
                fetchAllPages(IMAGE_ENDPOINT_MAIN, 'main images'),
                fetchAllPages(IMAGE_ENDPOINT_ALL, 'all images')
            ]);

            if (exercises.length === 0) {
                console.error("Failed to fetch exercises from /exerciseinfo/. Check API endpoint and status.");
                throw new Error("No exercises fetched from API.");
            }

            console.log('\nCreating lookup maps...');
            const categoryMap = new Map(categories.map(c => [c.id, c.name || `Category ${c.id}`]));
            const equipmentMap = new Map(equipmentList.map(e => [e.id, e.name || `Equipment ${e.id}`]));
            const muscleMap = new Map(musclesList.map(m => [m.id, m.name || `Muscle ${m.id}`]));

            const mainImageMap = new Map();
            mainImages.forEach(img => {
                if (img.exercise && !mainImageMap.has(img.exercise)) {
                    mainImageMap.set(img.exercise, img.image);
                }
            });
            const endImageMap = new Map();
            allImages.forEach(img => {
                if (img.exercise) {
                    if (!img.is_main && mainImageMap.has(img.exercise)) {
                        endImageMap.set(img.exercise, img.image);
                    }
                    else if (!endImageMap.has(img.exercise)) {
                        endImageMap.set(img.exercise, img.image);
                    }
                }
            });

            console.log(` -> Maps created (Categories: ${categoryMap.size}, Equipment: ${equipmentMap.size}, Muscles: ${muscleMap.size}, Main Images: ${mainImageMap.size}, End Images: ${endImageMap.size})`);
            console.log('\nFormatting exercises, removing duplicates, using Name/Desc: ES > EN > API Default fallback...');
            
            const formattedExercises = [];
            const namesSeen = new Set();
            
            let missingNameCount = 0;
            let missingDescriptionCount = 0;

            exercises.forEach(exInfo => {
                try {
                    if (!exInfo || !exInfo.id) return;

                    // --- Name processing ---
                    let exerciseName = null;

                    if (exInfo.translations) {
                        const spanishTranslation = exInfo.translations.find(t => t.language === SPANISH_LANG_ID);
                        if (spanishTranslation && spanishTranslation.name?.trim()) exerciseName = spanishTranslation.name.trim();
                    }

                    if (!exerciseName && exInfo.translations) {
                        const englishTranslation = exInfo.translations.find(t => t.language === ENGLISH_LANG_ID);
                        if (englishTranslation && englishTranslation.name?.trim()) exerciseName = englishTranslation.name.trim();
                    }

                    if (!exerciseName && exInfo.name?.trim()) exerciseName = exInfo.name.trim();

                    if (!exerciseName) {
                        missingNameCount++;
                        return;
                    }

                    const lowerCaseName = exerciseName.toLowerCase();
                    if (namesSeen.has(lowerCaseName)) return;

                    // --- Description processing ---
                    let description = null;

                    if (exInfo.translations) {
                        const spanishTranslation = exInfo.translations.find(t => t.language === SPANISH_LANG_ID);
                        if (spanishTranslation && spanishTranslation.description) {
                            const cleanedDesc = stripHtml(spanishTranslation.description);
                            if (cleanedDesc) description = cleanedDesc;
                        }
                    }

                    if (!description && exInfo.translations) {
                        const englishTranslation = exInfo.translations.find(t => t.language === ENGLISH_LANG_ID);
                        if (englishTranslation && englishTranslation.description) {
                            const cleanedDesc = stripHtml(englishTranslation.description);
                            if (cleanedDesc) description = cleanedDesc;
                        }
                    }

                    if (!description && exInfo.description) {
                        const cleanedDesc = stripHtml(exInfo.description);
                        if (cleanedDesc) description = cleanedDesc;
                    }

                    if (!description) missingDescriptionCount++;

                    // --- Other fields ---
                    const categoryName = categoryMap.get(exInfo.category?.id) || 'Various';
                    let muscleGroupName = categoryName;

                    if (exInfo.muscles && exInfo.muscles.length > 0) {
                        const specificMuscles = exInfo.muscles
                            .map(m => {
                                const mId = (typeof m === 'object' && m !== null) ? m.id : m;
                                return muscleMap.get(mId);
                            })
                            .filter(Boolean);

                        if (specificMuscles.length > 0) muscleGroupName = specificMuscles.join(', ');
                    }

                    // --- MEJORA PARA ANTEBRAZOS (FOREARMS) ---
                    const lowerName = exerciseName.toLowerCase();
                    const lowerMuscleGroup = muscleGroupName.toLowerCase();
                    const forearmKeywords = ['wrist', 'muñeca', 'forearm', 'antebrazo', 'brachioradialis', 'braquiorradial', 'reverse curl', 'curl invertido', 'pronator', 'pronación', 'supinator', 'supinación'];

                    const isForearm = forearmKeywords.some(kw => lowerName.includes(kw) || lowerMuscleGroup.includes(kw));

                    if (isForearm && !lowerMuscleGroup.includes('forearms')) {
                        muscleGroupName += ', Forearms';
                    }

                    const equipmentNames = exInfo.equipment?.length > 0
                        ? exInfo.equipment.map(eq => equipmentMap.get(eq.id) || `Equipment ${eq.id}`).join(', ')
                        : 'Bodyweight';

                    const exerciseId = exInfo.id;
                    const imageUrlStart = mainImageMap.get(exerciseId) || endImageMap.get(exerciseId) || null;
                    const imageUrlEnd = endImageMap.get(exerciseId) || imageUrlStart;

                    if (!imageUrlStart) return;

                    formattedExercises.push({
                        name: exerciseName,
                        muscle_group: muscleGroupName,
                        wger_id: exInfo.id,
                        description: description,
                        category: categoryName,
                        equipment: equipmentNames,
                        image_url_start: imageUrlStart,
                        image_url_end: imageUrlEnd,
                        video_url: null,
                    });
                    namesSeen.add(lowerCaseName);

                } catch (mapError) {
                    console.error(`Error processing exercise info with id ${exInfo?.id}:`, mapError);
                }
            });

            console.log(` -> Formatting complete. ${formattedExercises.length} unique exercises ready for sync.`);

            // --- INICIO SYNC SEGURO ---
            console.log('\nSynchronizing with database (Preserving existing IDs & Preventing name collisions)...');
            
            const existingRecords = await queryInterface.sequelize.query(
                'SELECT id, wger_id, name FROM exercise_list',
                { type: Sequelize.QueryTypes.SELECT }
            );

            const existingByWgerId = new Map();
            const existingByName = new Map();

            existingRecords.forEach(record => {
                if (record.wger_id) existingByWgerId.set(record.wger_id.toString(), record);
                if (record.name) existingByName.set(record.name.toLowerCase(), record);
            });

            const toInsert = [];
            const toUpdate = [];

            formattedExercises.forEach(ex => {
                const lowerName = ex.name.toLowerCase();
                let existingRecord = null;

                if (ex.wger_id && existingByWgerId.has(ex.wger_id.toString())) {
                    existingRecord = existingByWgerId.get(ex.wger_id.toString());
                } else if (existingByName.has(lowerName)) {
                    existingRecord = existingByName.get(lowerName);
                }

                if (existingRecord) {
                    // PREVENCIÓN DE COLISIÓN
                    const ownerOfName = existingByName.get(lowerName);
                    if (ownerOfName && ownerOfName.id !== existingRecord.id) {
                        return; // Omitimos para no violar el UNIQUE
                    }
                    
                    toUpdate.push({ ...ex, id: existingRecord.id });
                } else {
                    if (!existingByName.has(lowerName)) {
                        toInsert.push(ex);
                    }
                }
            });

            if (toInsert.length > 0) {
                console.log(` -> Inserting ${toInsert.length} NEW exercises...`);
                const chunkSize = 500;
                for (let i = 0; i < toInsert.length; i += chunkSize) {
                    const chunk = toInsert.slice(i, i + chunkSize);
                    await queryInterface.bulkInsert('exercise_list', chunk, { timeout: 60000 });
                }
            } else {
                console.log(' -> No new exercises to insert.');
            }

            if (toUpdate.length > 0) {
                console.log(` -> Updating ${toUpdate.length} EXISTING exercises to refresh data...`);
                const updateChunkSize = 100;
                for (let i = 0; i < toUpdate.length; i += updateChunkSize) {
                    const chunk = toUpdate.slice(i, i + updateChunkSize);
                    
                    // Actualizamos de uno en uno o en lotes pequeños, aislando errores
                    await Promise.all(chunk.map(async (ex) => {
                        const { id, ...updateFields } = ex;
                        try {
                            await queryInterface.bulkUpdate('exercise_list', updateFields, { id });
                        } catch (err) {
                            if (err.name === 'SequelizeUniqueConstraintError' || err.code === 'ER_DUP_ENTRY') {
                                console.warn(`   [Warning] Skipped update for ID ${id} (${ex.name}) to avoid duplicate name collision.`);
                            } else {
                                throw err;
                            }
                        }
                    }));
                }
            } else {
                 console.log(' -> No existing exercises to update.');
            }
            // --- FIN SYNC SEGURO ---

            console.log('✅ Successfully synchronized exercise_list with wger API.');

        } catch (error) {
            console.error('❌ Error during wger API seeding process:', error);
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('exercise_list', null, {});
        console.log('Reverted seed: cleared exercise_list table.');
    }
};