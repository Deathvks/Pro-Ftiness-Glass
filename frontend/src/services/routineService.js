import apiClient from './apiClient';

/**
 * Obtiene todas las rutinas del usuario.
 */
export const getRoutines = () => {
    return apiClient('/routines');
};

// --- INICIO MODIFICACIÓN ---
/**
 * Obtiene una rutina específica por su ID.
 * @param {number} routineId - El ID de la rutina a obtener.
 */
export const getRoutineById = (routineId) => {
    return apiClient(`/routines/${routineId}`);
};
// --- FIN MODIFICACIÓN ---

/**
 * Guarda una rutina. Si la rutina tiene un ID, la actualiza (PUT).
 * Si no tiene ID, la crea (POST).
 * @param {object} routineData - Los datos de la rutina a guardar.
 */
export const saveRoutine = (routineData) => {
    // --- INICIO MODIFICACIÓN ---
    // Aseguramos que el id sea numérico si existe, si no, es undefined
    const id = routineData.id ? Number(routineData.id) : undefined;
    const data = { ...routineData };
    delete data.id; // Quitamos el id del cuerpo de datos
    // --- FIN MODIFICACIÓN ---

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