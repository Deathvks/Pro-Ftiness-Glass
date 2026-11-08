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

/**
 * Actualiza la foto de perfil de un entrenador.
 * @param {number} userId - ID del entrenador.
 * @param {FormData} formData - Objeto FormData con 'profileImage'.
 */
export const updateTrainerProfileImage = (userId, formData) => {
    return apiClient(`/admin/users/${userId}/profile-image`, {
        method: 'POST',
        body: formData,
    });
};

/**
 * Elimina la foto de perfil de un entrenador.
 * @param {number} userId - ID del entrenador.
 */
export const deleteTrainerProfileImage = (userId) => {
    return apiClient(`/admin/users/${userId}/profile-image`, {
        method: 'DELETE',
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
export const freeServerMemory = () => {
    return apiClient('/admin/free-memory', {
        method: 'POST',
    });
};

export const getSystemStats = () => {
    return apiClient('/admin/system-stats');
};


export const getEmailLogs = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiClient('/admin/email-logs?' + qs);
};

export const getEmailStats = (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiClient('/admin/email-stats?' + qs);
};

export const getEmailUnsubscribeTestStatus = () => apiClient('/admin/email-unsubscribe-test', { cache: 'no-store' });

export const sendEmailUnsubscribeTest = (category, checkOnly) => apiClient('/admin/email-unsubscribe-test', {
    method: 'POST',
    body: { category, checkOnly },
    queueWhenOffline: false,
    timeout: 30000
});

export const getNotificationTestStatus = () => apiClient('/admin/notification-tests/status', { cache: 'no-store' });

export const getNotificationReview = () => apiClient('/admin/notification-tests/review', { cache: 'no-store' });

export const updateNotificationReview = (check, reviewed) => apiClient('/admin/notification-tests/review', {
    method: 'PUT', body: { check, reviewed }, queueWhenOffline: false
});

export const sendPushDeviceTest = (endpoint, purpose) => apiClient('/admin/notification-tests/push', {
    method: 'POST', body: { endpoint, purpose }, queueWhenOffline: false, timeout: 30000
});

export const sendEmailMailboxTest = () => apiClient('/admin/email-mailbox-test', {
    method: 'POST',
    body: {},
    queueWhenOffline: false,
    timeout: 30000
});


export const getRetentionRescueDashboard = () => {
    return apiClient('/admin/retention-rescue');
};

export const triggerRetentionRescue = (payload = {}) => {
    return apiClient('/admin/retention-rescue/send', {
        method: 'POST',
        body: payload,
    });
};

/**
 * Obtiene el estado y métricas detalladas de los recursos del servidor VPS.
 */
export const getServerResources = () => {
    return apiClient('/admin/server-resources');
};
