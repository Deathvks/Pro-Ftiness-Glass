import apiClient from './apiClient';

/**
 * @param {string} endpoint
 * @param {'POST' | 'PUT' | 'PATCH' | 'DELETE'} method
 * @param {object} [body]
 * @param {{ timeout?: number }} [options]
 */
export const adminWrite = (endpoint, method, body, options = {}) =>
    apiClient(endpoint, { ...options, method, body, queueWhenOffline: false });

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
    return adminWrite(`/admin/users/${userId}`, 'PUT', userData);
};

/**
 * Elimina un usuario.
 * @param {number} userId - ID del usuario a eliminar.
 */
export const deleteUser = (userId) => {
    return adminWrite(`/admin/users/${userId}`, 'DELETE');
};

/**
 * Crea un nuevo usuario.
 * @param {object} userData - Datos del nuevo usuario (name, email, password, role).
 */
export const createUser = (userData) => {
    return adminWrite('/admin/users', 'POST', userData);
};

export const getSetting = (key) => {
    return apiClient(`/admin/settings/${key}`);
};

export const updateSetting = (key, value) => {
    return adminWrite(`/admin/settings/${key}`, 'POST', { value });
};

export const getPushLogs = (page = 1, status = 'all', title = '', range = 30) => {
    let url = `/admin/push-logs?page=${page}&limit=20&status=${status}&range=${range}`;
    if (title) url += `&title=${encodeURIComponent(title)}`;
    return apiClient(url);
};

export const sendCustomPush = (pushData) => {
    return adminWrite('/admin/push-send', 'POST', pushData);
};

export const getCronJobs = () => {
    return apiClient('/admin/cron-jobs');
};

export const testCronJob = (jobId) => {
    return adminWrite(`/admin/cron-jobs/test/${jobId}`, 'POST');
};
