/* frontend/src/hooks/useRoutineLoader.js */
import { useEffect } from 'react';
// Importamos los servicios necesarios
import { getRoutineById } from '../services/routineService';
import { getExerciseList } from '../services/exerciseService';
// Importamos el generador de IDs únicos
import { v4 as uuidv4 } from 'uuid';

/**
 * Hook para manejar la carga (hidratación) inicial de la rutina
 * cuando se proporciona un 'id'.
 *
 * @param {Object} params
 * @param {string} params.id - El ID de la rutina a cargar (si existe).
 * @param {function} params.addToast - Función para mostrar notificaciones.
 * @param {function} params.onCancel - Función a llamar si la carga falla.
 * @param {function} params.setIsLoading - Setter para el estado de carga.
 * @param {function} params.setRoutineName - Setter para el nombre de la rutina.
 * @param {function} params.setDescription - Setter para la descripción.
 * @param {function} params.setExercises - Setter para la lista de ejercicios.
 */
export const useRoutineLoader = ({
  id,
  addToast,
  onCancel,
  setIsLoading,
  setRoutineName,
  setDescription,
  setExercises,
  // --- INICIO DE LA MODIFICACIÓN (Persistencia de Borrador) ---
  exercises, // 1. Recibimos el array de ejercicios (posiblemente del borrador)
  // --- FIN DE LA MODIFICACIÓN (Persistencia de Borrador) ---
}) => {
  useEffect(() => {
    const loadRoutine = async () => {
      // Si no hay ID, es una rutina nueva, no hay nada que cargar.
      if (!id) {
        setIsLoading(false);
        return;
      }

      // --- INICIO DE LA MODIFICACIÓN (Persistencia de Borrador) ---
      // 2. Si ya hay ejercicios cargados (desde el borrador), no sobrescribir.
      if (exercises && exercises.length > 0) {
        setIsLoading(false); // Ya está cargado (el borrador)
        return;
      }
      // --- FIN DE LA MODIFICACIÓN (Persistencia de Borrador) ---

      // Si hay ID pero no hay ejercicios (borrador), cargar desde la BD
      setIsLoading(true);
      try {
        // 1. Obtenemos los datos maestros (lista de ejercicios y datos de la rutina)
        const allExercisesData = await getExerciseList();
        const routine = await getRoutineById(id);

        // 2. Actualizamos el estado simple (nombre, descripción)
        setRoutineName(routine.name);
        setDescription(routine.description);

        // 3. Formateamos los ejercicios de la rutina
        const exercisesToFormat = routine.RoutineExercises || routine.exercises || [];

        const formattedExercises = exercisesToFormat.map((ex) => {
          // 1. Intentar buscar por ID (método preferido)
          let fullExercise = allExercisesData.find(e => String(e.id) === String(ex.exercise_list_id));

          // 2. FALLBACK: Si no se encuentra por ID, intentar buscar por nombre
          if (!fullExercise && ex.name) {
            fullExercise = allExercisesData.find(e => e.name === ex.name);
          }
          
          if (!fullExercise) {
            // Caso 1: Ejercicio manual o no encontrado en la BD
            // (Este caso ya era correcto, coge ex.muscle_group)
            return {
              tempId: uuidv4(), // ID temporal para el UI
              id: ex.exercise_list_id, 
              name: ex.name,
              muscle_group: ex.muscle_group, // <-- Correcto
              sets: ex.sets,
              reps: ex.reps,
              rest_seconds: ex.rest_seconds ?? ex.rest_time ?? 60, 
              superset_group_id: ex.superset_group_id,
              exercise_order: ex.exercise_order,
              is_manual: true,
              image_url_start: ex.image_url_start || null,
              video_url: ex.video_url || null,
            };
          }

          // Caso 2: Ejercicio encontrado (enlazado desde la BD)
          return {
            ...fullExercise, // Traemos los datos del template (imágenes, etc.)
            tempId: uuidv4(),
            id: fullExercise.id, // Aseguramos el ID correcto
            name: ex.name, 
            
            // --- INICIO DE LA MODIFICACIÓN (EL BUG ESTABA AQUÍ) ---
            // Priorizamos el 'muscle_group' guardado en la rutina (ej: "Pechito")
            // Si no existe, usamos el del template (ej: "chest")
            muscle_group: ex.muscle_group || fullExercise.category || fullExercise.muscle_group, 
            // --- FIN DE LA MODIFICACIÓN ---
            
            sets: ex.sets, // Usamos los datos guardados en la rutina
            reps: ex.reps, // Usamos los datos guardados en la rutina
            // (FIX: Mantiene el valor 'rest_seconds' guardado en la rutina,
            // ej: 99, sobreescribiendo el valor del template 'fullExercise')
            rest_seconds: ex.rest_seconds ?? ex.rest_time ?? 60,
            superset_group_id: ex.superset_group_id,
            exercise_order: ex.exercise_order,
            image_url_start: fullExercise.image_url_start,
            image_url_end: fullExercise.image_url_end,
            video_url: fullExercise.video_url,
          };
        });
        
        // 4. Actualizamos el estado de los ejercicios
        setExercises(formattedExercises);

      } catch (error) {
        addToast(error.message || 'Error al cargar la rutina', 'error');
        onCancel(); // Volvemos atrás si hay un error
      } finally {
        setIsLoading(false);
      }
    };
    
    // Ejecutamos la carga
    loadRoutine();
    
    // --- INICIO DE LA MODIFICACIÓN (Persistencia de Borrador) ---
    // 3. Añadimos 'exercises' al array de dependencias.
  }, [id, addToast, onCancel, setIsLoading, setRoutineName, setDescription, setExercises, exercises]);
  // --- FIN DE LA MODIFICACIÓN (Persistencia de Borrador) ---
};