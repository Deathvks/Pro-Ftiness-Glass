/* frontend/src/services/exerciseService.js */
import apiClient from "./apiClient";

// Mantenemos la caché en una variable local.
let cachedExerciseList = null;

/**
 * Obtiene la lista completa de ejercicios (con caché).
 */
export const getExerciseList = async () => {
    // Si la caché existe, la devolvemos.
    if (cachedExerciseList) {
        return cachedExerciseList;
    }

    try {
        // Corregido: La ruta correcta es '/exercise-list/exercises' 
        const data = await apiClient('/exercise-list/exercises');
        
        // ¡FIX! Filtramos cualquier entrada nula o indefinida 
        cachedExerciseList = data.filter(Boolean);

        return cachedExerciseList;
    } catch (error) {
        console.error("Failed to fetch exercise list:", error);
        // Si falla, reseteamos la caché para que pueda reintentar.
        cachedExerciseList = null; 
        throw error;
    }
};

// Se restaura la función getExerciseHistory que se había perdido.
export const getExerciseHistory = (exerciseName) => {
    return apiClient(`/exercises/history/${encodeURIComponent(exerciseName)}`);
};

/**
 * Obtiene los detalles completos de un ejercicio por su ID.
 * (No utiliza la caché 'cachedExerciseList' porque esta 
 * puede ser una lista simplificada. Hacemos una llamada dedicada.)
 */
export const getExerciseDetails = async (exerciseId) => {
    try {
        // Se ajusta la ruta para que sea consistente con la de la lista.
        const data = await apiClient(`/exercise-list/exercises/${exerciseId}`);
        return data;
    } catch (error) {
        console.error(`Failed to fetch details for exercise ${exerciseId}:`, error);
        throw error;
    }
};

export const importYouTubePlaylist = async (playlistId) => {
  cachedExerciseList = null;
  return apiClient('/exercise-list/exercises/import-youtube', {
    method: 'POST',
    body: { playlistId }
  });
};

export const updateExercise = async (id, exerciseData) => {
  cachedExerciseList = null;
  return apiClient(`/exercise-list/exercises/${id}`, {
    method: 'PUT',
    body: exerciseData
  });
};

export const deleteExercise = async (id) => {
  cachedExerciseList = null;
  return apiClient(`/exercise-list/exercises/${id}`, {
    method: 'DELETE'
  });
};
