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

// Definimos el "slice" o parte del store que gestiona la autenticación y el perfil.
export const createAuthSlice = (set, get) => ({
    // --- ESTADO INICIAL ---
    isAuthenticated: !!localStorage.getItem('fittrack_token'),
    token: localStorage.getItem('fittrack_token'),
    userProfile: null,
    isLoading: true,
    showWelcomeModal: false,

    // --- ACCIONES ---

    // Inicia sesión: guarda el token, actualiza el estado y carga los datos iniciales.
    handleLogin: async (credentials) => {
        const { token } = await authService.loginUser(credentials);
        localStorage.setItem('fittrack_token', token);
        set({ token, isAuthenticated: true });
        await get().fetchInitialData(); // Llama a la acción del dataSlice
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
});