import '@/utils/localStoragePolyfill';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { APP_VERSION, CURRENT_WELCOME_TITLE, hasSeenCurrentWelcome } from '../config/version';

let welcomeDismissedInSession = false;

// Esta función se encarga de limpiar el almacenamiento local relacionado con la sesión.
const clearAuthStorage = () => {
    localStorage.removeItem('pro_fitness_token');
    localStorage.removeItem('lastView');
    localStorage.removeItem('templateRoutinesSearchQuery');
    localStorage.removeItem('templateRoutinesSelectedCategory');
    localStorage.removeItem('templateRoutinesSelectedDifficulty');
    localStorage.removeItem('templateRoutinesShowFilters');
};

// Completa la sesión tras login/2FA/OAuth sin exponer un perfil parcial sin `goal`
// antes de que fetchInitialData() cargue el perfil completo desde el backend.
const completeAuthenticatedSession = (set, { token, user }) => {
    localStorage.removeItem('fittrack_token');
    localStorage.setItem('pro_fitness_token', token);
    const hasFullProfile = Boolean(user && Object.prototype.hasOwnProperty.call(user, 'goal'));
    set({
        token,
        isAuthenticated: true,
        twoFactorPending: null,
        userProfile: hasFullProfile ? user : null,
        sessionExpired: false,
        isLoading: !hasFullProfile,
    });
};

// Definimos el "slice" o parte del store que gestiona la autenticación y el perfil.
export const createAuthSlice = (set, get) => ({
    // --- ESTADO INICIAL ---
    isAuthenticated: typeof localStorage !== 'undefined' && !!localStorage.getItem('pro_fitness_token'),
    token: typeof localStorage !== 'undefined' ? localStorage.getItem('pro_fitness_token') : null,
    userProfile: null,
    isLoading: true,
    showWelcomeModal: false,
    welcomeRemoteData: null,
    welcomeRemoteVersion: null,
    tourActive: false,
    sessionExpired: false, // <-- NUEVO: Estado para el modal instantáneo de caducidad

    // --- INICIO MODIFICACIÓN 2FA ---
    // Estado para saber si estamos esperando el código de segunda fase
    twoFactorPending: null, // Contendrá { userId, method, email? } si se requiere 2FA
    // --- FIN MODIFICACIÓN 2FA ---

    // Inicializamos leyendo directamente para evitar "flash" del banner.
    // Usamos la clave global 'cookie_consent' para coincidir con GoogleTermsModal.
    cookieConsent: localStorage.getItem('cookie_consent') || null,

    // --- ACCIONES ---

    // Inicia sesión: guarda el token, actualiza el estado.
    // MODIFICADO: Ahora guarda también el userProfile si viene en la respuesta.
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
        completeAuthenticatedSession(set, response);
    },

    // Inicia sesión con Google
    handleGoogleLogin: async (payload) => {
        // CORRECCIÓN: Compatibilidad con LoginScreen.jsx (si llega string, lo hace objeto)
        const finalPayload = typeof payload === 'string' ? { token: payload } : payload;
        const response = await authService.googleLogin(finalPayload);

        if (response.requires2FA) {
            set({
                twoFactorPending: {
                    userId: response.userId,
                    method: response.method
                }
            });
            return;
        }

        completeAuthenticatedSession(set, response);
    },

    // Inicia sesión con Discord
    handleDiscordLogin: async (payload) => {
        // CORRECCIÓN: Compatibilidad con LoginScreen.jsx
        const finalPayload = typeof payload === 'string' ? { token: payload } : payload;
        const response = await authService.discordLogin(finalPayload);

        if (response.requires2FA) {
            set({
                twoFactorPending: {
                    userId: response.userId,
                    method: response.method
                }
            });
            return;
        }

        completeAuthenticatedSession(set, response);
    },

    // Inicia sesión con Facebook
    handleFacebookLogin: async (payload) => {
        // CORRECCIÓN: Compatibilidad con LoginScreen.jsx
        const finalPayload = typeof payload === 'string' ? { token: payload } : payload;
        const response = await authService.facebookLogin(finalPayload);

        if (response.requires2FA) {
            set({
                twoFactorPending: {
                    userId: response.userId,
                    method: response.method
                }
            });
            return;
        }

        completeAuthenticatedSession(set, response);
    },

    // Inicia sesión con X
    handleXLogin: async (payload) => {
        // payload siempre suele ser objeto { code, redirectUri, codeVerifier }
        const response = await authService.xLogin(payload);

        if (response.requires2FA) {
            set({
                twoFactorPending: {
                    userId: response.userId,
                    method: response.method
                }
            });
            return;
        }

        completeAuthenticatedSession(set, response);
    },

    // Inicia sesión con GitHub
    handleGithubLogin: async (payload) => {
        // CORRECCIÓN: Compatibilidad con LoginScreen.jsx (GitHub usa 'code')
        const finalPayload = typeof payload === 'string' ? { code: payload } : payload;
        const response = await authService.githubLogin(finalPayload);

        if (response.requires2FA) {
            set({
                twoFactorPending: {
                    userId: response.userId,
                    method: response.method
                }
            });
            return;
        }

        completeAuthenticatedSession(set, response);
    },

    // Inicia sesión con Spotify
    handleSpotifyLogin: async (payload) => {
        // payload siempre suele ser objeto { code, redirectUri }
        const response = await authService.spotifyLogin(payload);

        if (response.requires2FA) {
            set({
                twoFactorPending: {
                    userId: response.userId,
                    method: response.method
                }
            });
            return;
        }

        completeAuthenticatedSession(set, response);
    },

    // --- INICIO MODIFICACIÓN 2FA ---
    // Nueva acción para completar el login con el código 2FA
    handleVerify2FA: async (verificationData) => {
        // verificationData trae { userId, token/code, method }
        const response = await authService.verify2FALogin(verificationData);
        completeAuthenticatedSession(set, response);
    },

    // Acción para cancelar el proceso de 2FA y volver al login normal
    cancelTwoFactor: () => {
        set({ twoFactorPending: null });
    },
    // --- FIN MODIFICACIÓN 2FA ---

    // Cierra sesión (LOGOUT MANUAL)
    handleLogout: () => {
        clearAuthStorage();
        get().clearStories();
        // MODIFICACIÓN: No limpiamos el estado del workout para que persista
        // get().clearWorkoutState(); 
        get().clearDataState();
        set({
            isAuthenticated: false,
            token: null,
            userProfile: null,
            isLoading: false,
            twoFactorPending: null,
            sessionExpired: false
            // NO reseteamos cookieConsent aquí
        });
    },

    // Maneja la EXPIRACIÓN DE SESIÓN (LOGOUT AUTOMÁTICO)
    handleSessionExpiry: () => {
        clearAuthStorage();
        get().clearStories();
        // Mantenemos el workout activo en localStorage (NO llamamos a clearWorkoutState)
        get().clearDataState();

        // <-- MODIFICADO: Solo eliminamos el token y activamos la caducidad.
        // Mantenemos isAuthenticated en true temporalmente y el perfil para que no salte al login y la interfaz de fondo no cambie bruscamente.
        set({
            token: null,
            isLoading: false,
            twoFactorPending: null,
            sessionExpired: true // Activamos el modal
        });
    },

    // Actualiza el perfil del usuario (llamada completa al backend + recarga)
    updateUserProfile: async (formData) => {
        try {
            await userService.updateUserProfile(formData);
            await get().fetchInitialData();
            return { success: true, message: 'Perfil actualizado.' };
        } catch (error) {
            return { success: false, message: `Error: ${error.message}` };
        }
    },

    // Acción para actualizar manualmente el estado del perfil localmente (sin llamada al backend)
    // Útil para actualizaciones optimistas o cambios simples.
    setUserProfile: (profile) => {
        set({ userProfile: profile });
    },

    // Comprueba si se debe mostrar el modal de bienvenida
    checkWelcomeModal: async () => {
        if (welcomeDismissedInSession) return;
        let lastSeenVersion = localStorage.getItem('lastSeenVersion');
        let lastSeenTitle = localStorage.getItem('lastSeenWelcomeTitle');
        try {
            const pairs = await AsyncStorage.multiGet(['lastSeenVersion', 'lastSeenWelcomeTitle']);
            const map = Object.fromEntries(pairs);
            lastSeenVersion = map.lastSeenVersion || lastSeenVersion;
            lastSeenTitle = map.lastSeenWelcomeTitle || lastSeenTitle;
        } catch {}
        if (lastSeenVersion === APP_VERSION || hasSeenCurrentWelcome(lastSeenTitle, CURRENT_WELCOME_TITLE)) {
            welcomeDismissedInSession = true;
            return;
        }
        set({ showWelcomeModal: true });
    },

    // Cierra el modal de bienvenida
    closeWelcomeModal: () => {
        welcomeDismissedInSession = true;
        const remoteData = get().welcomeRemoteData;
        const titleToSave = remoteData?.welcome?.title || CURRENT_WELCOME_TITLE;
        const remoteVersion = remoteData?.version || APP_VERSION;
        localStorage.setItem('lastSeenVersion', String(APP_VERSION));
        localStorage.setItem('lastSeenWelcomeTitle', String(titleToSave));
        localStorage.setItem('lastSeenRemoteVersion', String(remoteVersion));
        AsyncStorage.multiSet([
            ['lastSeenVersion', String(APP_VERSION)],
            ['lastSeenWelcomeTitle', String(titleToSave)],
            ['lastSeenRemoteVersion', String(remoteVersion)],
        ]).catch(() => {});
        set({
            showWelcomeModal: false,
            welcomeRemoteData: null,
            welcomeRemoteVersion: null,
        });
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

    setTourActive: (val) => set({ tourActive: Boolean(val) }),
});
