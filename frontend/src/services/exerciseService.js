import apiClient from './apiClient';

/**
 * Busca ejercicios en la base de datos.
 * @param {string} query - El término de búsqueda para encontrar ejercicios.
 */
export const searchExercises = (query) => {
    // El apiClient se encarga de la llamada GET por defecto
    return apiClient(`/exercises?search=${query}`);
};