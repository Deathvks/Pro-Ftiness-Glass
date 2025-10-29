import apiClient from './apiClient';

/**
 * Obtiene todas las rutinas del usuario.
 */
export const getRoutines = () => {
    return apiClient('/routines');
};

/**
 * Obtiene una rutina específica por su ID.
 * @param {string} routineId - El ID de la rutina a obtener.
 */
export const getRoutineById = (routineId) => {
    return apiClient(`/routines/${routineId}`);
};

// --- INICIO DE LA MODIFICACIÓN ---

/**
 * Crea una nueva rutina.
 * (Asumimos que el backend devuelve la rutina recién creada con su ID)
 * @param {object} routineData - Los datos de la rutina a crear.
 */
export const createRoutine = (routineData) => {
    // Aseguramos que no se envíe un 'id' en el body de un POST
    const { id, ...data } = routineData; 
    
    return apiClient('/routines', { 
        body: data, 
        method: 'POST' 
    });
    // apiClient devuelve la respuesta JSON del backend (la nueva rutina)
};

/**
 * Actualiza una rutina existente por su ID.
 * (Asumimos que el backend devuelve la rutina actualizada)
 * @param {string} routineId - El ID de la rutina a actualizar.
 * @param {object} routineData - Los nuevos datos para la rutina.
 */
export const updateRoutine = (routineId, routineData) => {
    // Quitamos el 'id' del body para evitar conflictos, usamos el de la URL
    const { id, ...data } = routineData;

    return apiClient(`/routines/${routineId}`, { 
        body: data, 
        method: 'PUT' 
    });
    // apiClient devuelve la respuesta JSON del backend (la rutina actualizada)
};


/**
 * Elimina una rutina por su ID.
 * @param {string} routineId - El ID de la rutina a eliminar.
 */
export const deleteRoutine = (routineId) => {
    return apiClient(`/routines/${routineId}`, { method: 'DELETE' });
};

// La función 'saveRoutine' original ha sido reemplazada por 
// 'createRoutine' y 'updateRoutine' para ser más explícitas 
// y alinearse con 'dataSlice.js'.

// --- FIN DE LA MODIFICACIÓN ---