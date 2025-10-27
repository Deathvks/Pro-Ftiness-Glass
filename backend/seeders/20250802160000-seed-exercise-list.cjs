/* backend/seeders/20250802160000-seed-exercise-list.cjs */
'use strict';
const axios = require('axios'); //

// --- HELPER FUNCTIONS ---

const stripHtml = (html) => { //
    if (!html) return null; //
    const text = html //
        .replace(/<p>|<\/p>|<br\s*\/?>|<li>|<\/li>/gi, '\n') //
        .replace(/<[^>]*>?/gm, '') //
        .replace(/&nbsp;/g, ' ') //
        .replace(/\n{3,}/g, '\n\n') //
        .trim(); //
    return text === '' ? null : text; //
};


const fetchAllPages = async (url, resourceName = 'items') => { //
    let results = []; //
    let nextUrl = url; //
    let page = 1; //

    console.log(`Fetching ${resourceName}...`); //
    while (nextUrl) { //
        try {
            const response = await axios.get(nextUrl); //
            if (response.data && response.data.results) { //
                results = results.concat(response.data.results); //
                nextUrl = response.data.next; //
                page++; //
                // await new Promise(resolve => setTimeout(resolve, 50)); //
                 //
            } else { //
                console.warn(`Unexpected response structure from ${nextUrl}. Stopping pagination.`); //
                nextUrl = null; //
            } //
        } catch (error) { //
            console.error(`Error fetching page ${page} (${resourceName}) from ${nextUrl}: ${error.message}`); //
            if (error.response?.status === 404) { //
               console.error(`   Endpoint ${nextUrl} returned 404 Not Found. Please check the API endpoint URL.`); //
            } else if (error.response?.status === 429) { //
                console.warn(`   Rate limited by API. Waiting 5 seconds before retrying...`); //
                await new Promise(resolve => setTimeout(resolve, 5000)); //
            } else { //
                nextUrl = null; //
            } //
        } //
    } //
    console.log(` -> Fetched ${results.length} ${resourceName}.`); //
    return results; //
};

// --- SEEDER ---

module.exports = { //
    async up(queryInterface, Sequelize) { //
        // --- INICIO DE LA MODIFICACIÓN ---
        console.log('Starting to seed exercises from wger API (Fetching ALL, then Name/Desc: ES > EN > Default, Handling duplicates)...'); // Mensaje actualizado
        // --- FIN DE LA MODIFICACIÓN ---
        try { //
            const BASE_URL = 'https://wger.de/api/v2'; //
            // Definimos IDs de idioma para usarlos al buscar en las traducciones
            const SPANISH_LANG_ID = 1; //
            const ENGLISH_LANG_ID = 2; //
            const LIMIT = 'limit=100'; //
            // Quitamos el parámetro de idioma de los endpoints para obtener *todos* los datos
            const EXERCISE_INFO_ENDPOINT = `${BASE_URL}/exerciseinfo/?${LIMIT}&status=2`; //
            const CATEGORY_ENDPOINT = `${BASE_URL}/exercisecategory/?${LIMIT}`; //
            const EQUIPMENT_ENDPOINT = `${BASE_URL}/equipment/?${LIMIT}`; //
            const IMAGE_ENDPOINT_MAIN = `${BASE_URL}/exerciseimage/?limit=${LIMIT}&is_main=True`; //
            const IMAGE_ENDPOINT_ALL = `${BASE_URL}/exerciseimage/?limit=${LIMIT}`; //

            console.log('\nFetching data sources (Using API default language)...'); //
            const [
                exercises, //
                categories, //
                equipmentList, //
                mainImages, //
                allImages //
            ] = await Promise.all([ //
                fetchAllPages(EXERCISE_INFO_ENDPOINT, 'exercises (info)'), //
                fetchAllPages(CATEGORY_ENDPOINT, 'categories'), //
                fetchAllPages(EQUIPMENT_ENDPOINT, 'equipment'), //
                fetchAllPages(IMAGE_ENDPOINT_MAIN, 'main images'), //
                fetchAllPages(IMAGE_ENDPOINT_ALL, 'all images') //
            ]); //

            if (exercises.length === 0) { //
                console.error("Failed to fetch exercises from /exerciseinfo/. Check API endpoint and status."); //
                throw new Error("No exercises fetched from API."); //
            } //

            console.log('\nCreating lookup maps...'); //
            // Usamos el nombre por defecto de la API para los mapas, o un fallback genérico
            const categoryMap = new Map(categories.map(c => [c.id, c.name || `Category ${c.id}`])); //
            const equipmentMap = new Map(equipmentList.map(e => [e.id, e.name || `Equipment ${e.id}`])); //


            const mainImageMap = new Map(); //
            mainImages.forEach(img => { //
                if (img.exercise && !mainImageMap.has(img.exercise)) { //
                    mainImageMap.set(img.exercise, img.image); //
                } //
            }); //
             const endImageMap = new Map(); //
             allImages.forEach(img => { //
                  if (img.exercise) { //
                     if (!img.is_main && mainImageMap.has(img.exercise)) { //
                          endImageMap.set(img.exercise, img.image); //
                     } //
                      else if (!endImageMap.has(img.exercise)) { //
                          endImageMap.set(img.exercise, img.image); //
                     } //
                  } //
              }); //


            console.log(` -> Maps created (Categories: ${categoryMap.size}, Equipment: ${equipmentMap.size}, Main Images: ${mainImageMap.size}, End Images: ${endImageMap.size})`); //

            // --- INICIO DE LA MODIFICACIÓN ---
            console.log('\nFormatting exercises, removing duplicates, using Name/Desc: ES > EN > API Default fallback...'); // Mensaje actualizado
            // --- FIN DE LA MODIFICACIÓN ---
            const formattedExercises = []; //
            const namesSeen = new Set(); //
            let missingNameCount = 0; //
            let missingDescriptionCount = 0; //
            let usedSpanishNameCount = 0; // Contador para nombres en español
            let usedEnglishNameCount = 0; //
            let usedApiDefaultNameCount = 0; //
            let usedSpanishDescCount = 0; // Contador para descripciones en español
            let usedEnglishDescCount = 0; //
            let usedApiDefaultDescCount = 0; //

            exercises.forEach(exInfo => { //
                try { //
                    if (!exInfo || !exInfo.id) return; //

                    // --- Name processing (Spanish > English > API Default > Skip) --- Restaurado
                    let exerciseName = null; //
                    let nameLang = null; //

                    // 1. Intenta obtener nombre en Español de las traducciones
                    if (exInfo.translations) { //
                        const spanishTranslation = exInfo.translations.find(t => t.language === SPANISH_LANG_ID); //
                        if (spanishTranslation && spanishTranslation.name?.trim()) { //
                            exerciseName = spanishTranslation.name.trim(); //
                            nameLang = 'es'; //
                            usedSpanishNameCount++; // Incrementa contador español
                        } //
                    } //

                    // 2. Si no hay español, busca Inglés en traducciones
                    if (!exerciseName && exInfo.translations) { //
                        const englishTranslation = exInfo.translations.find(t => t.language === ENGLISH_LANG_ID); //
                        if (englishTranslation && englishTranslation.name?.trim()) { //
                            exerciseName = englishTranslation.name.trim(); //
                            nameLang = 'en'; //
                            usedEnglishNameCount++; //
                        } //
                    } //

                    // 3. Si sigue sin nombre, usa el nombre principal (exInfo.name)
                    if (!exerciseName && exInfo.name?.trim()) { //
                        exerciseName = exInfo.name.trim(); //
                        nameLang = 'api_default'; //
                        usedApiDefaultNameCount++; //
                    } //


                    // 4. Si después de todo no hay nombre, se omite
                    if (!exerciseName) { //
                        missingNameCount++; //
                        // console.log(`Skipping exercise ID ${exInfo.id} due to missing any name.`); //
                        return; //
                    } //

                    // --- Duplicate check (Based on final name found) ---
                    const lowerCaseName = exerciseName.toLowerCase(); //
                    if (namesSeen.has(lowerCaseName)) { //
                        // console.log(`Skipping duplicate name (${nameLang}): "${exerciseName}" (ID: ${exInfo.id})`); //
                        return; //
                    } //

                    // --- Description processing (Spanish > English > API Default > null) --- Restaurado
                    let description = null; //
                    let descLang = null; //

                    // 1. Busca descripción Española en traducciones
                    if (exInfo.translations) { //
                        const spanishTranslation = exInfo.translations.find(t => t.language === SPANISH_LANG_ID); //
                        if (spanishTranslation && spanishTranslation.description) { //
                            const cleanedDesc = stripHtml(spanishTranslation.description); //
                            if(cleanedDesc) { //
                                description = cleanedDesc; //
                                descLang = 'es'; //
                                usedSpanishDescCount++; // Incrementa contador español
                            } //
                        } //
                    } //

                    // 2. Si no hay española, busca descripción Inglesa en traducciones
                    if (!description && exInfo.translations) { //
                         const englishTranslation = exInfo.translations.find(t => t.language === ENGLISH_LANG_ID); //
                         if (englishTranslation && englishTranslation.description) { //
                             const cleanedDesc = stripHtml(englishTranslation.description); //
                             if (cleanedDesc) { //
                                 description = cleanedDesc; //
                                 descLang = 'en'; //
                                 usedEnglishDescCount++; //
                             } //
                         } //
                    } //

                    // 3. Si sigue sin descripción, usa la descripción principal (exInfo.description) limpia
                    if (!description && exInfo.description) { //
                         const cleanedDesc = stripHtml(exInfo.description); //
                         if (cleanedDesc) { //
                             description = cleanedDesc; //
                             descLang = 'api_default'; //
                             usedApiDefaultDescCount++; //
                         } //
                    } //


                    // 4. Si no hay descripción en absoluto, cuenta como faltante (se guardará null)
                    if (!description) { //
                        missingDescriptionCount++; //
                        // console.log(`No description found for: "${exerciseName}" (${nameLang}) (ID: ${exInfo.id})`); //
                    } //


                    // --- Other fields ---
                    // Usamos los mapas con los nombres por defecto de la API
                    const muscleGroupName = categoryMap.get(exInfo.category?.id) || 'Various'; //
                    const equipmentNames = exInfo.equipment?.length > 0 //
                        ? exInfo.equipment.map(eqId => equipmentMap.get(eqId) || `Equipment ${eqId}`).join(', ') //
                        : 'Bodyweight'; //
                    const exerciseId = exInfo.id; //
                    const imageUrlStart = mainImageMap.get(exerciseId) || endImageMap.get(exerciseId) || null; //
                    const imageUrlEnd = endImageMap.get(exerciseId) || imageUrlStart; //

                    // Mantenemos la lógica de omitir si no hay imagen
                    if (!imageUrlStart) { //
                         // console.log(`Skipping exercise "${exerciseName}" (ID: ${exInfo.id}) due to missing image.`); //
                         return; //
                    } //

                    // --- Add to list ---
                    formattedExercises.push({ //
                        name: exerciseName, // Nombre en es > en > default
                        muscle_group: muscleGroupName, //
                        wger_id: exInfo.id, //
                        description: description, // Descripción en es > en > default > null
                        category: muscleGroupName, //
                        equipment: equipmentNames, //
                        image_url_start: imageUrlStart, //
                        image_url_end: imageUrlEnd, //
                        video_url: null, //
                    }); //
                    namesSeen.add(lowerCaseName); //

                } catch (mapError) { //
                    console.error(`Error processing exercise info with id ${exInfo?.id}:`, mapError); //
                } //
            }); //

            console.log(` -> Formatting complete. ${formattedExercises.length} unique exercises ready for insertion.`); //
            if (missingNameCount > 0) { //
                 console.warn(` -> ${missingNameCount} exercises were skipped due to missing any usable name.`); //
            } //
            // --- INICIO DE LA MODIFICACIÓN: Actualizar logs de idiomas ---
             if (usedSpanishNameCount > 0) {
                 console.log(` -> Used Spanish name for ${usedSpanishNameCount} exercises.`);
             }
             if (usedEnglishNameCount > 0) { //
                console.log(` -> Used English name for ${usedEnglishNameCount} exercises.`); //
            } //
            if (usedApiDefaultNameCount > 0) { //
                console.log(` -> Used API default name for ${usedApiDefaultNameCount} exercises.`); //
            } //
            if (missingDescriptionCount > 0) { //
                console.warn(` -> ${missingDescriptionCount} exercises had no description available (saved as NULL).`); //
            } //
             if (usedSpanishDescCount > 0) {
                 console.log(` -> Used Spanish description for ${usedSpanishDescCount} exercises.`);
             }
             if (usedEnglishDescCount > 0) { //
                console.log(` -> Used English description for ${usedEnglishDescCount} exercises.`); //
            } //
            if (usedApiDefaultDescCount > 0) { //
                 console.log(` -> Used API default description for ${usedApiDefaultDescCount} exercises.`); //
            } //
            // --- FIN DE LA MODIFICACIÓN ---


            console.log('\nCleaning existing exercise_list table...'); //
            await queryInterface.bulkDelete('exercise_list', null, {}); //
            console.log(' -> Table cleared.'); //

            if (formattedExercises.length > 0) { //
                console.log(`\nInserting ${formattedExercises.length} exercises into database...`); //
                const chunkSize = 500; //
                 for (let i = 0; i < formattedExercises.length; i += chunkSize) { //
                     const chunk = formattedExercises.slice(i, i + chunkSize); //
                     console.log(` -> Inserting chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(formattedExercises.length / chunkSize)} (${chunk.length} exercises)`); //
                     await queryInterface.bulkInsert('exercise_list', chunk, { timeout: 60000 }); //
                 } //
                 // --- INICIO DE LA MODIFICACIÓN ---
                console.log('✅ Successfully seeded exercise_list from wger API (Name/Desc: ES > EN > Default fallback).'); // Mensaje actualizado
                // --- FIN DE LA MODIFICACIÓN ---
            } else { //
                console.warn('⚠️ No exercises were formatted after filtering. Seeding skipped.'); //
            } //

        } catch (error) { //
            console.error('❌ Error during wger API seeding process:', error); //
            if (error.name === 'SequelizeUniqueConstraintError') { //
                console.error(' -> Duplicate entry error during bulk insert. This might indicate an issue with the duplicate filtering logic or unexpected API data.'); //
            } //
            throw error; //
        } //
    },

    async down(queryInterface, Sequelize) { //
        await queryInterface.bulkDelete('exercise_list', null, {}); //
        console.log('Reverted seed: cleared exercise_list table.'); //
    } //
}; //