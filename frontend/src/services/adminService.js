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