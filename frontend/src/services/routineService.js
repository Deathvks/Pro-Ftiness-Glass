/* frontend/src/services/routineService.js */
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

/**
 * Obtiene una rutina PÚBLICA o COMPARTIDA por su ID (para vista previa).
 * Este endpoint debería no requerir ser el dueño, pero sí respetar la visibilidad.
 * @param {string} routineId - El ID de la rutina compartida.
 */
export const getPublicRoutine = (routineId) => {
    return apiClient(`/routines/public/${routineId}`);
};

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
 * Clona/Importa una rutina compartida al perfil del usuario actual.
 * @param {string} sourceRoutineId - ID de la rutina original.
 * @param {string} folderName - Nombre de la carpeta (ej: "Compartido de X").
 */
export const forkRoutine = (sourceRoutineId, folderName) => {
    return apiClient(`/routines/${sourceRoutineId}/fork`, {
        method: 'POST',
        body: { folder: folderName }
    });
};

/**
 * Actualiza una rutina existente por su ID.
 * (Asumimos que el backend devuelve la rutina actualizada)
 * @param {string} routineId - El ID de la rutina a actualizar.
 * @param {object} routineData - Los nuevos datos para la rutina (incluye visibility).
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
 * Sube una imagen para la rutina.
 * @param {File} file - El archivo de imagen a subir.
 * @returns {Promise<{imageUrl: string}>} - La URL relativa de la imagen subida.
 */
export const uploadRoutineImage = (file) => {
    const formData = new FormData();
    formData.append('image', file);

    // Nota: Al pasar FormData, el navegador suele establecer automáticamente
    // el header 'Content-Type' con el boundary correcto.
    return apiClient('/routines/upload-image', {
        method: 'POST',
        body: formData,
    });
};

/**
 * Elimina una rutina por su ID.
 * @param {string} routineId - El ID de la rutina a eliminar.
 */
export const deleteRoutine = (routineId) => {
    return apiClient(`/routines/${routineId}`, { method: 'DELETE' });
};