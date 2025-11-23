/* frontend/src/store/authSlice.js */
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { APP_VERSION } from '../config/version';

// Esta función se encarga de limpiar el almacenamiento local relacionado con la sesión.
const clearAuthStorage = () => {
    localStorage.removeItem('pro_fitness_token');
    localStorage.removeItem('lastView');
    localStorage.removeItem('templateRoutinesSearchQuery');
    localStorage.removeItem('templateRoutinesSelectedCategory');
    localStorage.removeItem('templateRoutinesSelectedDifficulty');
    localStorage.removeItem('templateRoutinesShowFilters');
};

// Definimos el "slice" o parte del store que gestiona la autenticación y el perfil.
export const createAuthSlice = (set, get) => ({
    // --- ESTADO INICIAL ---
    isAuthenticated: !!localStorage.getItem('pro_fitness_token'),
    token: localStorage.getItem('pro_fitness_token'),
    userProfile: null,
    isLoading: true,
    showWelcomeModal: false,
    
    // INICIO CORRECCIÓN COOKIES: 
    // Inicializamos leyendo directamente para evitar "flash" del banner.
    // Usamos la clave global 'cookie_consent' para coincidir con GoogleTermsModal.
    cookieConsent: localStorage.getItem('cookie_consent') || null, 

    // --- ACCIONES ---

    // Inicia sesión: guarda el token, actualiza el estado y carga los datos iniciales.
    handleLogin: async (credentials) => {
        const { token } = await authService.loginUser(credentials);
        
        // Limpiamos el token antiguo
        localStorage.removeItem('fittrack_token'); 

        localStorage.setItem('pro_fitness_token', token);
        set({ token, isAuthenticated: true });
        await get().fetchInitialData();
    },

    // Inicia sesión con Google
    handleGoogleLogin: async (googleToken) => {
        const { token } = await authService.googleLogin(googleToken);

        localStorage.removeItem('fittrack_token');
        localStorage.setItem('pro_fitness_token', token);
        
        set({ token, isAuthenticated: true });
        await get().fetchInitialData();
    },

    // Cierra sesión (LOGOUT MANUAL)
    handleLogout: () => {
        clearAuthStorage();
        get().clearWorkoutState();
        get().clearDataState();
        set({
            isAuthenticated: false,
            token: null,
            userProfile: null,
            isLoading: false,
            // NO reseteamos cookieConsent aquí, la preferencia de cookies suele ser por dispositivo/navegador
        });
    },

    // Maneja la EXPIRACIÓN DE SESIÓN (LOGOUT AUTOMÁTICO)
    handleSessionExpiry: () => {
        clearAuthStorage();
        // Mantenemos el workout activo en localStorage (no llamamos a clearWorkoutState)
        get().clearDataState();
        
        set({
            isAuthenticated: false,
            token: null,
            userProfile: null,
            isLoading: false,
        });
    },

    // Actualiza el perfil del usuario
    updateUserProfile: async (formData) => {
        try {
            await userService.updateUserProfile(formData);
            await get().fetchInitialData();
            return { success: true, message: 'Perfil actualizado.' };
        } catch (error) {
            return { success: false, message: `Error: ${error.message}` };
        }
    },

    // Comprueba si se debe mostrar el modal de bienvenida
    checkWelcomeModal: () => {
        const lastSeenVersion = localStorage.getItem('lastSeenVersion');
        if (lastSeenVersion !== APP_VERSION) {
            set({ showWelcomeModal: true });
        }
    },

    // Cierra el modal de bienvenida
    closeWelcomeModal: () => {
        localStorage.setItem('lastSeenVersion', APP_VERSION);
        set({ showWelcomeModal: false });
    },

    // --- GESTIÓN DE COOKIES (CORREGIDA) ---
    // Usamos la clave global 'cookie_consent' y strings 'accepted'/'declined'
    
    // Esta función ahora es más simple, solo sincroniza el estado si es necesario
    checkCookieConsent: () => {
        const consent = localStorage.getItem('cookie_consent');
        set({ cookieConsent: consent }); // consent será 'accepted', 'declined' o null
    },

    handleAcceptCookies: () => {
        localStorage.setItem('cookie_consent', 'accepted');
        set({ cookieConsent: 'accepted' });
    },

    handleDeclineCookies: () => {
        localStorage.setItem('cookie_consent', 'declined');
        set({ cookieConsent: 'declined' });
        // Limpiar preferencias locales si se rechaza
        localStorage.removeItem('theme');
        localStorage.removeItem('accent');
    },

    resetCookieConsent: () => {
        localStorage.removeItem('cookie_consent');
        set({ cookieConsent: null });
    },
});