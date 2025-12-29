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
                // await new Promise(resolve => setTimeout(resolve, 50));
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
            let usedSpanishNameCount = 0;
            let usedEnglishNameCount = 0;
            let usedApiDefaultNameCount = 0;
            let usedSpanishDescCount = 0;
            let usedEnglishDescCount = 0;
            let usedApiDefaultDescCount = 0;

            exercises.forEach(exInfo => {
                try {
                    if (!exInfo || !exInfo.id) return;

                    // --- Name processing (Spanish > English > API Default > Skip) ---
                    let exerciseName = null;
                    let nameLang = null;

                    if (exInfo.translations) {
                        const spanishTranslation = exInfo.translations.find(t => t.language === SPANISH_LANG_ID);
                        if (spanishTranslation && spanishTranslation.name?.trim()) {
                            exerciseName = spanishTranslation.name.trim();
                            nameLang = 'es';
                            usedSpanishNameCount++;
                        }
                    }

                    if (!exerciseName && exInfo.translations) {
                        const englishTranslation = exInfo.translations.find(t => t.language === ENGLISH_LANG_ID);
                        if (englishTranslation && englishTranslation.name?.trim()) {
                            exerciseName = englishTranslation.name.trim();
                            nameLang = 'en';
                            usedEnglishNameCount++;
                        }
                    }

                    if (!exerciseName && exInfo.name?.trim()) {
                        exerciseName = exInfo.name.trim();
                        nameLang = 'api_default';
                        usedApiDefaultNameCount++;
                    }

                    if (!exerciseName) {
                        missingNameCount++;
                        return;
                    }

                    // --- Duplicate check (Based on final name found) ---
                    const lowerCaseName = exerciseName.toLowerCase();
                    if (namesSeen.has(lowerCaseName)) {
                        return;
                    }

                    // --- Description processing (Spanish > English > API Default > null) ---
                    let description = null;
                    let descLang = null;

                    if (exInfo.translations) {
                        const spanishTranslation = exInfo.translations.find(t => t.language === SPANISH_LANG_ID);
                        if (spanishTranslation && spanishTranslation.description) {
                            const cleanedDesc = stripHtml(spanishTranslation.description);
                            if (cleanedDesc) {
                                description = cleanedDesc;
                                descLang = 'es';
                                usedSpanishDescCount++;
                            }
                        }
                    }

                    if (!description && exInfo.translations) {
                        const englishTranslation = exInfo.translations.find(t => t.language === ENGLISH_LANG_ID);
                        if (englishTranslation && englishTranslation.description) {
                            const cleanedDesc = stripHtml(englishTranslation.description);
                            if (cleanedDesc) {
                                description = cleanedDesc;
                                descLang = 'en';
                                usedEnglishDescCount++;
                            }
                        }
                    }

                    if (!description && exInfo.description) {
                        const cleanedDesc = stripHtml(exInfo.description);
                        if (cleanedDesc) {
                            description = cleanedDesc;
                            descLang = 'api_default';
                            usedApiDefaultDescCount++;
                        }
                    }

                    if (!description) {
                        missingDescriptionCount++;
                    }


                    // --- Other fields ---
                    const categoryName = categoryMap.get(exInfo.category?.id) || 'Various';

                    let muscleGroupName = categoryName;

                    // --- CORRECCIÓN: Tratar 'muscles' como array de objetos ---
                    // La API /exerciseinfo/ devuelve: muscles: [{id: 10, name: '...'}, ...]
                    if (exInfo.muscles && exInfo.muscles.length > 0) {
                        const specificMuscles = exInfo.muscles
                            .map(m => {
                                // Si es un objeto, usamos m.id. Si (raramente) fuera un int, usamos m.
                                const mId = (typeof m === 'object' && m !== null) ? m.id : m;
                                return muscleMap.get(mId);
                            })
                            .filter(Boolean);

                        if (specificMuscles.length > 0) {
                            muscleGroupName = specificMuscles.join(', ');
                        }
                    }

                    // --- MEJORA PARA ANTEBRAZOS (FOREARMS) ---
                    // Detectar si el ejercicio es de antebrazo basándose en el nombre o músculos específicos
                    const lowerName = exerciseName.toLowerCase();
                    const lowerMuscleGroup = muscleGroupName.toLowerCase();

                    const forearmKeywords = [
                        'wrist', 'muñeca',
                        'forearm', 'antebrazo',
                        'brachioradialis', 'braquiorradial',
                        'reverse curl', 'curl invertido',
                        'pronator', 'pronación',
                        'supinator', 'supinación'
                    ];

                    const isForearm = forearmKeywords.some(kw => lowerName.includes(kw) || lowerMuscleGroup.includes(kw));

                    // Si se detecta contexto de antebrazo y no está explícito en el grupo, lo añadimos
                    if (isForearm && !lowerMuscleGroup.includes('forearms')) {
                        muscleGroupName += ', Forearms';
                    }
                    // ------------------------------------------

                    const equipmentNames = exInfo.equipment?.length > 0
                        ? exInfo.equipment.map(eq => equipmentMap.get(eq.id) || `Equipment ${eq.id}`).join(', ')
                        : 'Bodyweight';

                    const exerciseId = exInfo.id;
                    const imageUrlStart = mainImageMap.get(exerciseId) || endImageMap.get(exerciseId) || null;
                    const imageUrlEnd = endImageMap.get(exerciseId) || imageUrlStart;

                    if (!imageUrlStart) {
                        return;
                    }

                    // --- Add to list ---
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
            console.log(` -> Formatting complete. ${formattedExercises.length} unique exercises ready for insertion.`);
            // Stats logging...
            if (missingNameCount > 0) console.warn(` -> ${missingNameCount} skipped (no name).`);
            if (usedSpanishNameCount > 0) console.log(` -> ES Names: ${usedSpanishNameCount}`);
            if (usedEnglishNameCount > 0) console.log(` -> EN Names: ${usedEnglishNameCount}`);
            if (usedApiDefaultNameCount > 0) console.log(` -> Default Names: ${usedApiDefaultNameCount}`);

            console.log('\nCleaning existing exercise_list table...');
            await queryInterface.bulkDelete('exercise_list', null, {});
            console.log(' -> Table cleared.');

            if (formattedExercises.length > 0) {
                console.log(`\nInserting ${formattedExercises.length} exercises into database...`);
                const chunkSize = 500;
                for (let i = 0; i < formattedExercises.length; i += chunkSize) {
                    const chunk = formattedExercises.slice(i, i + chunkSize);
                    console.log(` -> Inserting chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(formattedExercises.length / chunkSize)}`);
                    await queryInterface.bulkInsert('exercise_list', chunk, { timeout: 60000 });
                }
                console.log('✅ Successfully seeded exercise_list from wger API (Specific muscles + Forearms fix).');
            } else {
                console.warn('⚠️ No exercises were formatted after filtering. Seeding skipped.');
            }

        } catch (error) {
            console.error('❌ Error during wger API seeding process:', error);
            if (error.name === 'SequelizeUniqueConstraintError') {
                console.error(' -> Duplicate entry error.');
            }
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('exercise_list', null, {});
        console.log('Reverted seed: cleared exercise_list table.');
    }
};