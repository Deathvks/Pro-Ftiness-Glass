/* frontend/src/store/authSlice.js */
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { APP_VERSION } from '../config/version';

// Esta función se encarga de limpiar el almacenamiento local relacionado con la sesión.
const clearAuthStorage = () => {
    localStorage.removeItem('fittrack_token');
    localStorage.removeItem('lastView');
    localStorage.removeItem('templateRoutinesSearchQuery');
    localStorage.removeItem('templateRoutinesSelectedCategory');
    localStorage.removeItem('templateRoutinesSelectedDifficulty');
    localStorage.removeItem('templateRoutinesShowFilters');
};

// --- INICIO DE LA MODIFICACIÓN (EXISTENTE) ---
// ELIMINADA la función getInitialCookieConsent ya que no se usa
// --- FIN DE LA MODIFICACIÓN (EXISTENTE) ---

// Definimos el "slice" o parte del store que gestiona la autenticación y el perfil.
export const createAuthSlice = (set, get) => ({
    // --- ESTADO INICIAL ---
    isAuthenticated: !!localStorage.getItem('fittrack_token'),
    token: localStorage.getItem('fittrack_token'),
    userProfile: null,
    isLoading: true,
    showWelcomeModal: false,
    // Inicializamos cookieConsent en null, checkCookieConsent lo establecerá al cargar perfil
    cookieConsent: null,

    // --- ACCIONES ---

    // Inicia sesión: guarda el token, actualiza el estado y carga los datos iniciales.
    handleLogin: async (credentials) => {
        const { token } = await authService.loginUser(credentials);
        localStorage.setItem('fittrack_token', token);
        set({ token, isAuthenticated: true });
        await get().fetchInitialData(); // Llama a la acción del dataSlice

        // --- INICIO DE LA MODIFICACIÓN ---
        // ELIMINADA la llamada duplicada a checkCookieConsent.
        // fetchInitialData (en dataSlice) ya se encarga de esto.
        // --- FIN DE LA MODIFICACIÓN ---
    },

    // Cierra sesión: limpia el token, el almacenamiento y resetea el estado completo.
    handleLogout: () => {
        clearAuthStorage();
        get().clearWorkoutState(); // Llama a la acción del workoutSlice
        get().clearDataState();   // Llama a la acción del dataSlice
        set({
            isAuthenticated: false,
            token: null,
            userProfile: null,
            isLoading: false,
            cookieConsent: null, // Resetea el consentimiento al cerrar sesión
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
    // --- INICIO DE LA MODIFICACIÓN ---
    // Convertida a 'async' para que dataSlice.js pueda 'await' su finalización.
    checkCookieConsent: async (userId) => {
        // Esta función ahora simplemente lee y actualiza el estado.
        const consent = localStorage.getItem(`cookie_consent_${userId}`);
        if (consent === 'true') {
            set({ cookieConsent: true });
        } else if (consent === 'false') {
            set({ cookieConsent: false });
        } else {
            set({ cookieConsent: null });
        }
        // Devolvemos una promesa resuelta para que el 'await' en dataSlice.js funcione.
        return Promise.resolve();
    },
    // --- FIN DE LA MODIFICACIÓN ---

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
            // Opcional: limpiar las cookies/storage si se rechazan
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