import apiClient from './apiClient';

export const loginUser = (credentials) => {
    return apiClient('/auth/login', { body: credentials, method: 'POST' });
};

// Esta función ya es genérica. 'userData' contendrá {username, email, password}
// No necesita cambios.
export const registerUser = (userData) => {
    return apiClient('/auth/register', { body: userData, method: 'POST' });
};

// Nueva función para verificar el código de email
export const verifyEmail = (verificationData) => {
    return apiClient('/auth/verify-email', { body: verificationData, method: 'POST' });
};

export const logoutUser = () => {
    return apiClient('/auth/logout', { method: 'POST' });
};

export const resendVerificationEmail = (email) => {
  return apiClient('/auth/resend-verification', {
    method: 'POST',
    body: { email }
  });
};

export const updateEmailForVerification = (newEmail) => {
  return apiClient('/auth/update-email-verification', {
    method: 'PUT',
    body: { email: newEmail }
  });
};

/**
 * Envía una solicitud para restablecer la contraseña de un usuario.
 * @param {string} email - El email del usuario.
 */
export const forgotPassword = (email) => {
  return apiClient('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
};

/**
 * Restablece la contraseña de un usuario usando un token.
 * @param {object} resetData - Datos con el token y la nueva contraseña.
 * @param {string} resetData.token - El token de restablecimiento.
 * @param {string} resetData.password - La nueva contraseña.
 */
export const resetPassword = (resetData) => {
  return apiClient('/auth/reset-password', {
    method: 'POST',
    body: resetData,
  });
};

// --- INICIO DE LA MODIFICACIÓN ---
/**
 * Inicia sesión o registra al usuario usando el token de Google.
 * @param {string} token - El credential (ID Token) devuelto por Google.
 */
export const googleLogin = (token) => {
  return apiClient('/auth/google-login', {
    method: 'POST',
    body: { token }, // Enviamos el token en el cuerpo
  });
};
// --- FIN DE LA MODIFICACIÓN ---