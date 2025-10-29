/* frontend/src/services/exerciseService.js */
import apiClient from "./apiClient";

// --- INICIO DE LA MODIFICACIÓN ---
// Mantenemos la caché en una variable local.
let cachedExerciseList = null;
// --- FIN DE LA MODIFICACIÓN ---

/**
 * Obtiene la lista completa de ejercicios (con caché).
 */
export const getExerciseList = async () => {
    // Si la caché existe, la devolvemos.
    if (cachedExerciseList) {
        return cachedExerciseList;
    }

    try {
        // --- INICIO DE LA MODIFICACIÓN (FIX) ---
        // Corregido: La ruta correcta es '/exercise-list/exercises' 
        // (la que tenías en tu versión anterior).
        const data = await apiClient('/exercise-list/exercises');
        // --- FIN DE LA MODIFICACIÓN (FIX) ---
        
        // --- INICIO DE LA MODIFICACIÓN ---
        // ¡FIX! Filtramos cualquier entrada nula o indefinida 
        // que pueda venir de la base de datos antes de cachearla.
        cachedExerciseList = data.filter(Boolean);
        // --- FIN DE LA MODIFICACIÓN ---

        return cachedExerciseList;
    } catch (error) {
        console.error("Failed to fetch exercise list:", error);
        // Si falla, reseteamos la caché para que pueda reintentar.
        cachedExerciseList = null; 
        throw error;
    }
};

// --- INICIO DE LA MODIFICACIÓN (FIX) ---
// Se restaura la función getExerciseHistory que se había perdido.
export const getExerciseHistory = (exerciseName) => {
    return apiClient(`/exercises/history/${encodeURIComponent(exerciseName)}`);
};
// --- FIN DE LA MODIFICACIÓN (FIX) ---

/**
 * Obtiene los detalles completos de un ejercicio por su ID.
 * (No utiliza la caché 'cachedExerciseList' porque esta 
 * puede ser una lista simplificada. Hacemos una llamada dedicada.)
 */
export const getExerciseDetails = async (exerciseId) => {
    try {
        // --- INICIO DE LA MODIFICACIÓN (FIX) ---
        // Se ajusta la ruta para que sea consistente con la de la lista.
        const data = await apiClient(`/exercise-list/exercises/${exerciseId}`);
        // --- FIN DE LA MODIFICACIÓN (FIX) ---
        return data;
    } catch (error) {
        console.error(`Failed to fetch details for exercise ${exerciseId}:`, error);
        throw error;
    }
};