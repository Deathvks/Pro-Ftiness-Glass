/* frontend/src/services/userService.js */
import apiClient from './apiClient';
import useAppStore from '../store/useAppStore';

export const getMyProfile = () => {
  return apiClient('/users/me');
};

export const updateUserProfile = (profileData) => {
  return apiClient('/users/me', { body: profileData, method: 'PUT' });
};

export const updateUserAccount = (accountData) => {
  return apiClient('/users/me/account', { body: accountData, method: 'PUT' });
};

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

// --- INICIO DE LA MODIFICACIÓN ---
/**
 * Exporta los datos del usuario en el formato especificado (JSON o CSV).
 * @param {'json' | 'csv'} format 
 * @returns {Promise<Blob>}
 */
export const exportMyData = async (format = 'json') => {
  const token = useAppStore.getState().token;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Usamos fetch directamente para manejar la respuesta como Blob (archivo)
  const response = await fetch(`${API_BASE_URL}/users/me/export?format=${format}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Error al exportar los datos. Inténtalo de nuevo.');
  }

  return response.blob();
};
// --- FIN DE LA MODIFICACIÓN ---