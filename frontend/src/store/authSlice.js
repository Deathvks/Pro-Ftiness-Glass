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
    
    // --- INICIO MODIFICACIÓN 2FA ---
    // Estado para saber si estamos esperando el código de segunda fase
    twoFactorPending: null, // Contendrá { userId, method, email? } si se requiere 2FA
    // --- FIN MODIFICACIÓN 2FA ---

    // Inicializamos leyendo directamente para evitar "flash" del banner.
    // Usamos la clave global 'cookie_consent' para coincidir con GoogleTermsModal.
    cookieConsent: localStorage.getItem('cookie_consent') || null, 

    // --- ACCIONES ---

    // Inicia sesión: guarda el token, actualiza el estado y carga los datos iniciales.
    handleLogin: async (credentials) => {
        const response = await authService.loginUser(credentials);
        
        // --- INICIO MODIFICACIÓN 2FA ---
        // Si el backend indica que se requiere 2FA, guardamos estado y paramos aquí.
        if (response.requires2FA) {
            set({ 
                twoFactorPending: { 
                    userId: response.userId, 
                    method: response.method,
                    email: credentials.email // Útil para mostrar "enviado a..."
                } 
            });
            return;
        }
        // --- FIN MODIFICACIÓN 2FA ---

        // Flujo normal si no hay 2FA o ya devolvió token
        const { token } = response;
        
        localStorage.removeItem('fittrack_token'); 

        localStorage.setItem('pro_fitness_token', token);
        set({ token, isAuthenticated: true, twoFactorPending: null });
        await get().fetchInitialData();
    },

    // Inicia sesión con Google
    handleGoogleLogin: async (googleToken) => {
        const response = await authService.googleLogin(googleToken);

        // --- INICIO MODIFICACIÓN 2FA ---
        if (response.requires2FA) {
            set({ 
                twoFactorPending: { 
                    userId: response.userId, 
                    method: response.method
                } 
            });
            return;
        }
        // --- FIN MODIFICACIÓN 2FA ---

        const { token } = response;

        localStorage.removeItem('fittrack_token');
        localStorage.setItem('pro_fitness_token', token);
        
        set({ token, isAuthenticated: true, twoFactorPending: null });
        await get().fetchInitialData();
    },

    // --- INICIO MODIFICACIÓN 2FA ---
    // Nueva acción para completar el login con el código 2FA
    handleVerify2FA: async (verificationData) => {
        // verificationData trae { userId, token/code, method }
        const { token } = await authService.verify2FALogin(verificationData);

        localStorage.removeItem('fittrack_token'); 
        localStorage.setItem('pro_fitness_token', token);
        
        // Limpiamos el estado pendiente y marcamos autenticado
        set({ token, isAuthenticated: true, twoFactorPending: null });
        await get().fetchInitialData();
    },

    // Acción para cancelar el proceso de 2FA y volver al login normal
    cancelTwoFactor: () => {
        set({ twoFactorPending: null });
    },
    // --- FIN MODIFICACIÓN 2FA ---

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
            twoFactorPending: null, // Limpiamos también esto por si acaso
            // NO reseteamos cookieConsent aquí
        });
    },

    // Maneja la EXPIRACIÓN DE SESIÓN (LOGOUT AUTOMÁTICO)
    handleSessionExpiry: () => {
        clearAuthStorage();
        // Mantenemos el workout activo en localStorage
        get().clearDataState();
        
        set({
            isAuthenticated: false,
            token: null,
            userProfile: null,
            isLoading: false,
            twoFactorPending: null,
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

    // --- GESTIÓN DE COOKIES ---
    checkCookieConsent: () => {
        const consent = localStorage.getItem('cookie_consent');
        set({ cookieConsent: consent }); 
    },

    handleAcceptCookies: () => {
        localStorage.setItem('cookie_consent', 'accepted');
        set({ cookieConsent: 'accepted' });
    },

    handleDeclineCookies: () => {
        localStorage.setItem('cookie_consent', 'declined');
        set({ cookieConsent: 'declined' });
        localStorage.removeItem('theme');
        localStorage.removeItem('accent');
    },

    resetCookieConsent: () => {
        localStorage.removeItem('cookie_consent');
        set({ cookieConsent: null });
    },
});