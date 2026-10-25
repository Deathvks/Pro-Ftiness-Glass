/* frontend/src/services/exerciseService.js */
import apiClient from "./apiClient";

// Mantenemos la caché en memoria y persistida en localStorage para modo offline (búnker)
const CACHE_KEY = 'pfg_cached_exercise_list';
let cachedExerciseList = null;

const loadPersistedExerciseList = () => {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (_) {}
    return null;
};

/**
 * Obtiene la lista completa de ejercicios (con caché en memoria y fallback offline persistente).
 */
export const getExerciseList = async () => {
    // 1. Si la caché en memoria existe, la devolvemos.
    if (cachedExerciseList && cachedExerciseList.length > 0) {
        return cachedExerciseList;
    }

    // 2. Intentamos recuperar de localStorage si no había en memoria
    const persisted = loadPersistedExerciseList();
    if (persisted) {
        cachedExerciseList = persisted;
    }

    try {
        const data = await apiClient('/exercise-list/exercises');
        const cleanData = (Array.isArray(data) ? data : []).filter(Boolean);
        if (cleanData.length > 0) {
            cachedExerciseList = cleanData;
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(cleanData));
            } catch (_) {}
        }
        return cachedExerciseList || cleanData;
    } catch (error) {
        console.warn("Failed to fetch exercise list from network:", error);
        // Fallback offline: si hay lista persistida en el dispositivo, la devolvemos sin romper
        if (cachedExerciseList && cachedExerciseList.length > 0) {
            return cachedExerciseList;
        }
        cachedExerciseList = null;
        throw error;
    }
};

export const getExerciseHistory = (exerciseName) => {
    return apiClient(`/exercises/history/${encodeURIComponent(exerciseName)}`);
};

/**
 * Obtiene los detalles completos de un ejercicio por su ID.
 */
export const getExerciseDetails = async (exerciseId) => {
    try {
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
