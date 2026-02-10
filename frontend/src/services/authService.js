/* frontend/src/services/authService.js */
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import apiClient from './apiClient';

// ID de Cliente Web explícito para forzar la configuración en Android
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

export const logoutUser = () => {
    // Intentamos cerrar sesión también en el plugin de Google por seguridad
    try {
        GoogleAuth.signOut();
    } catch (e) {
        console.error('Error signing out from Google:', e);
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

// Esta función envía el token al backend para verificarlo y crear sesión
export const googleLogin = (token) => {
  return apiClient('/auth/google-login', {
    method: 'POST',
    body: { token },
  });
};

// --- GOOGLE AUTH PLUGIN (Nativo + Web) ---

export const initGoogleAuth = () => {
    // Inicializa el plugin pasando explícitamente el Client ID
    // Esto asegura que Android use este ID y no otro, solucionando el Error 10
    GoogleAuth.initialize({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
    });
};

export const signInWithGoogle = async () => {
    // Abre el popup o flujo nativo de Google y retorna el usuario con el idToken
    return await GoogleAuth.signIn();
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