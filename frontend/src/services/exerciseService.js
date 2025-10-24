/* frontend/src/services/exerciseService.js */
import apiClient from './apiClient';

/**
 * Busca ejercicios en la base de datos.
 * @param {string} query - El término de búsqueda para encontrar ejercicios.
 * @param {string} muscleGroup - El grupo muscular por el que filtrar.
 */
export const searchExercises = (query, muscleGroup) => {
    const params = new URLSearchParams();
    if (query) {
        params.append('search', query);
    }
    if (muscleGroup && muscleGroup !== 'Todos') {
        params.append('muscle_group', muscleGroup);
    }

    // --- INICIO DE LA CORRECCIÓN ---
    // Cambiamos el endpoint de '/exercises' a '/exercise-list/exercises'
    return apiClient(`/exercise-list/exercises?${params.toString()}`);
    // --- FIN DE LA CORRECCIÓN ---
};