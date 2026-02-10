/* frontend/src/services/authService.js */
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import apiClient from './apiClient';

// ID de Cliente Web (Debe coincidir con el de la consola de Google Cloud - Tipo Aplicación Web)
// Este ID se usa para la inicialización en Web y para validar tokens en el backend.
const GOOGLE_CLIENT_ID = '459101292666-53tga4c1l8u2se5k21gsf5rk85825udq.apps.googleusercontent.com';

export const loginUser = (credentials) => {
    return apiClient('/auth/login', { body: credentials, method: 'POST' });
};

export const registerUser = (userData) => {
    return apiClient('/auth/register', { body: userData, method: 'POST' });
};

export const verifyEmail = (verificationData) => {
    return apiClient('/auth/verify-email', { body: verificationData, method: 'POST' });
};

export const logoutUser = async () => {
    // Intentamos cerrar sesión en Google (silenciosamente si falla o no hay sesión)
    try {
        await GoogleAuth.signOut();
    } catch (e) {
        console.warn('Error signing out from Google:', e);
    }
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

// --- GOOGLE AUTH PLUGIN ---

export const initGoogleAuth = () => {
    // Inicialización para WEB. 
    // NOTA: En Android/iOS esta función NO debe llamarse si se usa capacitor.config.json,
    // ya que el plugin se autoconfigura. (Controlado en LoginScreen.jsx)
    try {
        GoogleAuth.initialize({
            clientId: GOOGLE_CLIENT_ID,
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
        });
    } catch (e) {
        console.warn('GoogleAuth initialize warning:', e);
    }
};

export const signInWithGoogle = async () => {
    // Retorna { authentication: { idToken: '...' }, ... }
    return await GoogleAuth.signIn();
};

// --- FUNCIONES 2FA ---

export const verify2FALogin = (data) => apiClient('/2fa/login/verify', { method: 'POST', body: data });

export const resend2FACode = (data) => apiClient('/2fa/login/resend', { method: 'POST', body: data });

export const setup2FAApp = () => apiClient('/2fa/setup/app', { method: 'POST' });

export const enable2FAApp = (data) => apiClient('/2fa/enable/app', { method: 'POST', body: data });

export const setup2FAEmail = () => apiClient('/2fa/setup/email', { method: 'POST' });

export const enable2FAEmail = (data) => apiClient('/2fa/enable/email', { method: 'POST', body: data });

export const disable2FA = () => apiClient('/2fa/disable', { method: 'POST' });