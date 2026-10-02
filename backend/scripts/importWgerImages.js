/* backend/scripts/importWgerImages.js */
import 'dotenv/config';
import db from '../models/index.js';

const { ExerciseList } = db;

const WGER_BASE_URL = 'https://wger.de/api/v2';

const MUSCLE_MAP = {
  1: 'brazos', // Biceps brachii
  2: 'hombros', // Anterior deltoid
  3: 'pecho', // Serratus anterior
  4: 'pecho', // Pectoralis major
  5: 'brazos', // Triceps brachii
  6: 'core', // Rectus abdominis
  7: 'piernas', // Gastrocnemius
  8: 'piernas', // Gluteus maximus
  9: 'hombros', // Trapezius
  10: 'piernas', // Quadriceps femoris
  11: 'piernas', // Biceps femoris
  12: 'espalda', // Latissimus dorsi
  13: 'brazos', // Brachialis
  14: 'core', // Obliquus externus abdominis
  15: 'piernas' // Soleus
};

const CATEGORY_MAP = {
  8: 'Brazos',
  9: 'Piernas',
  10: 'Core',
  11: 'Pecho',
  12: 'Espalda',
  13: 'Hombros',
  14: 'Piernas' // Calves
};

const fetchPaginated = async (url) => {
  let results = [];
  let nextUrl = url;
  
  while (nextUrl) {
    console.log(`Fetching: ${nextUrl}`);
    const res = await fetch(nextUrl);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();
    results = results.concat(data.results);
    nextUrl = data.next;
  }
  return results;
};

const run = async () => {
  try {
    console.log('--- Iniciando sincronización de ejercicios de Wger con imágenes ---');
    
    // 1. Obtener todas las imágenes de Wger
    console.log('1. Descargando índice de imágenes de Wger...');
    const allImages = await fetchPaginated(`${WGER_BASE_URL}/exerciseimage/`);
    
    // 2. Agrupar imágenes por ID de ejercicio
    const imagesByExercise = {};
    for (const img of allImages) {
      // En Wger, exercise_base agrupa las traducciones. 
      // Si no existe, usamos exercise.
      const exId = img.exercise_base || img.exercise;
      if (!imagesByExercise[exId]) {
        imagesByExercise[exId] = [];
      }
      imagesByExercise[exId].push(img.image);
    }

    console.log(`> Encontradas imágenes para ${Object.keys(imagesByExercise).length} ejercicios.`);

    // 3. Obtener ejercicios en Español (language = 4)
    console.log('2. Descargando catálogo de ejercicios en Español...');
    const spanishExercises = await fetchPaginated(`${WGER_BASE_URL}/exerciseinfo/?language=4`);

    console.log(`> Descargados ${spanishExercises.length} ejercicios en Español.`);

    // 4. Filtrar y procesar
    console.log('3. Cruzando datos y preparando para base de datos local...');
    
    let addedCount = 0;
    let updatedCount = 0;

    for (const ex of spanishExercises) {
      // Intentar mapear las imágenes
      const exBaseId = ex.exercise_base || ex.id;
      let exImages = imagesByExercise[exBaseId] || [];
      
      // A veces Wger las devuelve en el array 'images' nativo
      if (exImages.length === 0 && ex.images && ex.images.length > 0) {
        exImages = ex.images.map(i => i.image);
      }

      if (exImages.length === 0) continue; // Ignorar ejercicios sin imagen

      // Formatear músculos
      const muscleSet = new Set();
      if (ex.muscles) {
        ex.muscles.forEach(m => {
          if (MUSCLE_MAP[m.id || m]) muscleSet.add(MUSCLE_MAP[m.id || m]);
        });
      }
      if (ex.muscles_secondary) {
        ex.muscles_secondary.forEach(m => {
          if (MUSCLE_MAP[m.id || m]) muscleSet.add(MUSCLE_MAP[m.id || m]);
        });
      }

      const muscleGroupsArray = Array.from(muscleSet);
      // Usar 'full body' o un valor por defecto si no hay músculos
      const primaryMuscle = muscleGroupsArray.length > 0 ? muscleGroupsArray.join(', ') : 'full body';
      
      const categoryName = CATEGORY_MAP[ex.category?.id || ex.category] || 'Otros';

      const imageUrlStart = exImages[0];
      const imageUrlEnd = exImages.length > 1 ? exImages[1] : null;

      // Limpiar HTML de la descripción
      const descriptionText = ex.description ? ex.description.replace(/<[^>]*>?/gm, '').trim() : '';

      // Usar el nombre proporcionado, limitando caracteres por si acaso
      let finalName = (ex.name || 'Sin Nombre').substring(0, 255);

      try {
        // Encontrar si ya existe por wger_id o por nombre
        let existingRecord = null;
        if (exBaseId) {
          existingRecord = await ExerciseList.findOne({ where: { wger_id: exBaseId } });
        }
        
        if (!existingRecord) {
          existingRecord = await ExerciseList.findOne({ where: { name: finalName } });
        }

        if (existingRecord) {
          // Actualizar
          await existingRecord.update({
            wger_id: exBaseId, // asegurar que esté linkeado
            muscle_group: primaryMuscle,
            description: descriptionText,
            category: categoryName,
            image_url_start: imageUrlStart,
            image_url_end: imageUrlEnd,
            equipment: (ex.equipment && ex.equipment.length > 0) ? 'Sí' : 'No'
          });
          updatedCount++;
        } else {
          // Crear
          await ExerciseList.create({
            wger_id: exBaseId,
            name: finalName,
            muscle_group: primaryMuscle,
            description: descriptionText,
            category: categoryName,
            image_url_start: imageUrlStart,
            image_url_end: imageUrlEnd,
            equipment: (ex.equipment && ex.equipment.length > 0) ? 'Sí' : 'No'
          });
          addedCount++;
        }
      } catch (e) {
        console.warn(`! Fallo guardando ejercicio '${finalName}':`, e.message);
      }
    }

    console.log(`✅ Sincronización completada.`);
    console.log(`> Nuevos ejercicios insertados: ${addedCount}`);
    console.log(`> Ejercicios actualizados: ${updatedCount}`);

  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
  } finally {
    process.exit(0);
  }
};

run();
