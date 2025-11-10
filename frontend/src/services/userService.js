/* frontend/src/services/userService.js */
import apiClient from './apiClient';

export const getMyProfile = () => {
    return apiClient('/users/me');
};

export const updateUserProfile = (profileData) => {
    return apiClient('/users/me', { body: profileData, method: 'PUT' });
};

export const updateUserAccount = (accountData) => {
    return apiClient('/users/me/account', { body: accountData, method: 'PUT' });
};

// --- INICIO DE LA MODIFICACIÓN ---

/**
 * Borra todos los datos del usuario (entrenamientos, nutrición, etc.)
 * Requiere la contraseña del usuario para confirmación.
 * @param {string} password - La contraseña actual del usuario.
 */
export const deleteMyData = (password) => {
  return apiClient('/users/me/data', {
    body: { password },
    method: 'DELETE',
  });
};

/**
 * Borra permanentemente la cuenta completa del usuario.
 * Requiere la contraseña del usuario para confirmación.
 * @param {string} password - La contraseña actual del usuario.
 */
export const deleteMyAccount = (password) => {
  return apiClient('/users/me', {
    body: { password },
    method: 'DELETE',
  });
};
// --- FIN DE LA MODIFICACIÓN ---