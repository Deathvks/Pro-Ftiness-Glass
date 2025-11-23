/* frontend/src/services/authService.js */
import apiClient from './apiClient';

export const loginUser = (credentials) => {
    return apiClient('/auth/login', { body: credentials, method: 'POST' });
};

export const registerUser = (userData) => {
    return apiClient('/auth/register', { body: userData, method: 'POST' });
};

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

export const forgotPassword = (email) => {
  return apiClient('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
};

export const resetPassword = (resetData) => {
  return apiClient('/auth/reset-password', {
    method: 'POST',
    body: resetData,
  });
};

export const googleLogin = (token) => {
  return apiClient('/auth/google-login', {
    method: 'POST',
    body: { token },
  });
};

// --- FUNCIONES 2FA (Login) ---

export const verify2FALogin = (data) => {
    return apiClient('/2fa/login/verify', { 
        method: 'POST',
        body: data 
    });
};

export const resend2FACode = (data) => {
    return apiClient('/2fa/login/resend', { 
        method: 'POST',
        body: data 
    });
};

// --- FUNCIONES 2FA (Configuración) ---

export const setup2FAApp = () => {
    return apiClient('/2fa/setup/app', { method: 'POST' });
};

export const enable2FAApp = (data) => {
    // data: { token, secret }
    return apiClient('/2fa/enable/app', { method: 'POST', body: data });
};

export const setup2FAEmail = () => {
    return apiClient('/2fa/setup/email', { method: 'POST' });
};

export const enable2FAEmail = (data) => {
    // data: { code }
    return apiClient('/2fa/enable/email', { method: 'POST', body: data });
};

export const disable2FA = () => {
    return apiClient('/2fa/disable', { method: 'POST' });
};