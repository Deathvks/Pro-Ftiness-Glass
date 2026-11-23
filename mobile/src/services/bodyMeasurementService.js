/* frontend/src/services/bodyMeasurementService.js */
import apiClient from './apiClient';

/**
 * Obtiene el historial de medidas.
 * @param {string} [type] - Opcional. Tipo de medida (ej: 'biceps').
 */
export const getHistory = (type) => {
    const query = type ? `?type=${type}` : '';
    return apiClient(`/measurements${query}`);
};

/**
 * Registra una nueva medida.
 * @param {object} data - { measure_type, value, unit }
 */
export const logMeasurement = (data) => {
    return apiClient('/measurements', { body: data, method: 'POST' });
};

/**
 * Actualiza la medida del día actual para un tipo específico.
 * @param {object} data - { measure_type, value }
 */
export const updateTodayMeasurement = (data) => {
    return apiClient('/measurements/today', { body: data, method: 'PUT' });
};

/**
 * Elimina un registro de medida.
 * @param {number} id - ID del registro a eliminar.
 */
export const deleteMeasurement = (id) => {
    return apiClient(`/measurements/${id}`, { method: 'DELETE' });
};