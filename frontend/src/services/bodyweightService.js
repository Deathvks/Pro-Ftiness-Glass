import apiClient from './apiClient';

/**
 * Obtiene el historial completo de peso corporal del usuario.
 */
export const getHistory = () => {
    return apiClient('/bodyweight');
};

/**
 * Registra un nuevo peso corporal para el día actual.
 * @param {object} weightData - Objeto con el peso. Ej: { weight: 80.5 }
 */
export const logWeight = (weightData) => {
    return apiClient('/bodyweight', { body: weightData, method: 'POST' });
};

/**
 * Actualiza el registro de peso corporal del día actual.
 * @param {object} weightData - Objeto con el peso. Ej: { weight: 80.5 }
 */
export const updateTodaysWeight = (weightData) => {
    return apiClient('/bodyweight/today', { body: weightData, method: 'PUT' });
};