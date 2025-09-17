import apiClient from './apiClient';

/**
 * Obtiene todas las rutinas del usuario.
 */
export const getRoutines = () => {
    return apiClient('/routines');
};

/**
 * Guarda una rutina. Si la rutina tiene un ID, la actualiza (PUT).
 * Si no tiene ID, la crea (POST).
 * @param {object} routineData - Los datos de la rutina a guardar.
 */
export const saveRoutine = (routineData) => {
    const { id, ...data } = routineData;
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/routines/${id}` : '/routines';

    return apiClient(endpoint, { body: data, method });
};

/**
 * Elimina una rutina por su ID.
 * @param {number} routineId - El ID de la rutina a eliminar.
 */
export const deleteRoutine = (routineId) => {
    return apiClient(`/routines/${routineId}`, { method: 'DELETE' });
};