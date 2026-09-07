import apiClient from './apiClient';

/**
 * Obtiene la lista completa de usuarios.
 */
export const getAllUsers = () => {
    return apiClient('/admin/users');
};

/**
 * Actualiza los datos de un usuario.
 * @param {number} userId - ID del usuario a actualizar.
 * @param {object} userData - Datos a actualizar (name, email, role).
 */
export const updateUser = (userId, userData) => {
    return apiClient(`/admin/users/${userId}`, {
        method: 'PUT',
        body: userData,
    });
};

/**
 * Elimina un usuario.
 * @param {number} userId - ID del usuario a eliminar.
 */
export const deleteUser = (userId) => {
    return apiClient(`/admin/users/${userId}`, {
        method: 'DELETE',
    });
};

/**
 * Crea un nuevo usuario.
 * @param {object} userData - Datos del nuevo usuario (name, email, password, role).
 */
export const createUser = (userData) => {
    return apiClient('/admin/users', {
        method: 'POST',
        body: userData,
    });
};

export const getSetting = (key) => {
    return apiClient(`/admin/settings/${key}`);
};

export const updateSetting = (key, value) => {
    return apiClient(`/admin/settings/${key}`, {
        method: 'POST',
        body: { value },
    });
};

export const getPushLogs = (page = 1, status = 'all', title = '', range = 30) => {
    let url = `/admin/push-logs?page=${page}&limit=20&status=${status}&range=${range}`;
    if (title) url += `&title=${encodeURIComponent(title)}`;
    return apiClient(url);
};

export const sendCustomPush = (pushData) => {
    return apiClient('/admin/push-send', {
        method: 'POST',
        body: pushData,
    });
};

export const getCronJobs = () => {
    return apiClient('/admin/cron-jobs');
};

export const testCronJob = (jobId) => {
    return apiClient(`/admin/cron-jobs/test/${jobId}`, {
        method: 'POST',
    });
};