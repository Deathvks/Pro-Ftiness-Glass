import apiClient from './apiClient';

/**
 * Obtiene los récords personales del usuario de forma paginada y filtrada.
 * @param {number} page - El número de página a solicitar.
 * @param {string} exerciseName - El nombre del ejercicio por el que filtrar.
 */
// --- INICIO DE LA MODIFICACIÓN ---
export const getPersonalRecords = (page = 1, exerciseName = 'all') => {
    const params = new URLSearchParams({ page, limit: 6 });
    if (exerciseName && exerciseName !== 'all') {
        params.append('exerciseName', exerciseName);
    }
    return apiClient(`/records?${params.toString()}`);
};

/**
 * Obtiene una lista con los nombres de todos los ejercicios
 * para los que el usuario tiene un récord personal.
 */
export const getPersonalRecordExerciseNames = () => {
    return apiClient('/records/exercises');
};
// --- FIN DE LA MODIFICACIÓN ---