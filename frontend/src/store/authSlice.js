/* frontend/src/store/authSlice.js */
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { APP_VERSION } from '../config/version';

// Esta función se encarga de limpiar el almacenamiento local relacionado con la sesión.
const clearAuthStorage = () => {
    localStorage.removeItem('pro_fitness_token'); // Cambiado de 'fittrack_token'
    localStorage.removeItem('lastView');
    localStorage.removeItem('templateRoutinesSearchQuery');
    localStorage.removeItem('templateRoutinesSelectedCategory');
    localStorage.removeItem('templateRoutinesSelectedDifficulty');
    localStorage.removeItem('templateRoutinesShowFilters');
};

// ELIMINADA la función getInitialCookieConsent ya que no se usa

// Definimos el "slice" o parte del store que gestiona la autenticación y el perfil.
export const createAuthSlice = (set, get) => ({
    // --- ESTADO INICIAL ---
    isAuthenticated: !!localStorage.getItem('pro_fitness_token'), // Cambiado de 'fittrack_token'
    token: localStorage.getItem('pro_fitness_token'), // Cambiado de 'fittrack_token'
    userProfile: null,
    isLoading: true,
    showWelcomeModal: false,
    // Inicializamos cookieConsent en null, checkCookieConsent lo establecerá al cargar perfil
    cookieConsent: null,

    // --- ACCIONES ---

    // Inicia sesión: guarda el token, actualiza el estado y carga los datos iniciales.
    handleLogin: async (credentials) => {
        const { token } = await authService.loginUser(credentials);
        
        // --- INICIO DE LA MODIFICACIÓN ---
        // Limpiamos el token antiguo (si existía) al iniciar sesión exitosamente
        localStorage.removeItem('fittrack_token'); 
        // --- FIN DE LA MODIFICACIÓN ---

        localStorage.setItem('pro_fitness_token', token); // Guardamos el nuevo token
        set({ token, isAuthenticated: true });
        await get().fetchInitialData(); // Llama a la acción del dataSlice
    },

    // Cierra sesión (LOGOUT MANUAL): limpia el token, el almacenamiento y resetea el estado completo.
    handleLogout: () => {
        clearAuthStorage();
        get().clearWorkoutState(); // Llama a la acción del workoutSlice (BORRA LOCALSTORAGE DEL WORKOUT)
        get().clearDataState();   // Llama a la acción del dataSlice
        set({
            isAuthenticated: false,
            token: null,
            userProfile: null,
            isLoading: false,
            cookieConsent: null, // Resetea el consentimiento al cerrar sesión
        });
    },

    /**
     * Maneja la EXPIRACIÓN DE SESIÓN (LOGOUT AUTOMÁTICO por 401/403).
     * Limpia el estado de autenticación pero MANTIENE el workout activo
     * en localStorage para que pueda ser reanudado.
     */
    handleSessionExpiry: () => {
        clearAuthStorage(); // Limpia el token de localStorage
        
        // ¡NO LLAMAMOS A get().clearWorkoutState()!
        // Esta es la diferencia clave: el workout en localStorage sobrevive.

        get().clearDataState();   // Limpia el estado de datos en memoria (rutinas, logs, etc.)
        
        // Resetea el estado de autenticación en memoria
        set({
            isAuthenticated: false,
            token: null,
            userProfile: null,
            isLoading: false,
            // Mantenemos el cookieConsent, ya que el usuario es el mismo.
        });
    },

    // Actualiza el perfil del usuario en el backend y refresca los datos.
    updateUserProfile: async (formData) => {
        try {
            await userService.updateUserProfile(formData);
            await get().fetchInitialData(); // Refresca todos los datos
            return { success: true, message: 'Perfil actualizado.' };
        } catch (error) {
            return { success: false, message: `Error: ${error.message}` };
        }
    },

    // Comprueba si se debe mostrar el modal de bienvenida comparando versiones.
    checkWelcomeModal: () => {
        const lastSeenVersion = localStorage.getItem('lastSeenVersion');
        if (lastSeenVersion !== APP_VERSION) {
            set({ showWelcomeModal: true });
        }
    },

    // Cierra el modal de bienvenida y guarda la versión actual.
    closeWelcomeModal: () => {
        localStorage.setItem('lastSeenVersion', APP_VERSION);
        set({ showWelcomeModal: false });
    },

    // Comprueba el consentimiento de cookies para el usuario actual.
    checkCookieConsent: async (userId) => {
        const consent = localStorage.getItem(`cookie_consent_${userId}`);
        if (consent === 'true') {
            set({ cookieConsent: true });
        } else if (consent === 'false') {
            set({ cookieConsent: false });
        } else {
            set({ cookieConsent: null });
        }
        return Promise.resolve();
    },

    // Acepta las cookies y guarda la preferencia para el usuario actual.
    handleAcceptCookies: () => {
        const userId = get().userProfile?.id;
        if (userId) {
            localStorage.setItem(`cookie_consent_${userId}`, 'true');
            set({ cookieConsent: true });
        }
    },

    // Rechaza las cookies y guarda la preferencia para el usuario actual.
    handleDeclineCookies: () => {
        const userId = get().userProfile?.id;
        if (userId) {
            localStorage.setItem(`cookie_consent_${userId}`, 'false');
            set({ cookieConsent: false });
            localStorage.removeItem('theme');
            localStorage.removeItem('accent');
        }
    },

    // Resetea el consentimiento de cookies para que el banner vuelva a aparecer.
    resetCookieConsent: () => {
        const userId = get().userProfile?.id;
        if (userId) {
            localStorage.removeItem(`cookie_consent_${userId}`);
            set({ cookieConsent: null });
        }
    },
});