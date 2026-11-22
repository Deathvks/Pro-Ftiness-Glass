/* mobile/src/services/exerciseService.js */
import apiClient from "./apiClient";
import { getOfflineExerciseCatalog } from "./offlineExerciseService";

// Mantenemos la caché en una variable local.
let cachedExerciseList = null;

/**
 * Obtiene la lista completa de ejercicios (con fallback a caché offline).
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
        const offlineCatalog = await getOfflineExerciseCatalog().catch(() => []);
        if (offlineCatalog.length > 0) {
            cachedExerciseList = offlineCatalog.filter(Boolean);
            return cachedExerciseList;
        }
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
 * Obtiene los detalles completos de un ejercicio por su ID desde el catálogo cacheado/offline.
 */
export const getExerciseDetails = async (exerciseId) => {
    try {
        const list = await getExerciseList();
        const found = Array.isArray(list)
            ? list.find((ex) => String(ex?.id) === String(exerciseId))
            : null;
        return found || null;
    } catch (error) {
        console.error(`Failed to fetch details for exercise ${exerciseId}:`, error);
        return null;
    }
};

export const importYouTubePlaylist = async (playlistId) => {
  cachedExerciseList = null;
  return apiClient('/exercise-list/exercises/import-youtube', {
    method: 'POST',
    queueWhenOffline: false,
    body: { playlistId }
  });
};

export const updateExercise = async (id, exerciseData) => {
  cachedExerciseList = null;
  return apiClient(`/exercise-list/exercises/${id}`, {
    method: 'PUT',
    queueWhenOffline: false,
    body: exerciseData
  });
};

export const deleteExercise = async (id) => {
  cachedExerciseList = null;
  return apiClient(`/exercise-list/exercises/${id}`, {
    method: 'DELETE',
    queueWhenOffline: false,
  });
};
