import { create } from 'zustand';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import * as routineService from '../services/routineService';
import * as workoutService from '../services/workoutService';
import * as bodyweightService from '../services/bodyweightService';

// --- ARCHIVO REFACTORIZADO PARA GESTIONAR EL TOKEN ---

const useAppStore = create((set, get) => ({
  // --- ESTADO ---
  isAuthenticated: !!localStorage.getItem('fittrack_token'), // La autenticación ahora depende de si hay token
  token: localStorage.getItem('fittrack_token'), // El token se carga desde localStorage
  userProfile: null,
  routines: [],
  workoutLog: [],
  bodyWeightLog: [],
  isLoading: true,
  prNotification: null,

  // --- ACCIONES ---
  
  showPRNotification: (newPRs) => {
    set({ prNotification: newPRs });
    setTimeout(() => set({ prNotification: null }), 7000);
  },
  
  // Nueva acción para manejar el login
  handleLogin: async (credentials) => {
    const { token } = await authService.loginUser(credentials);
    localStorage.setItem('fittrack_token', token);
    set({ token, isAuthenticated: true });
    await get().fetchInitialData();
  },

  fetchInitialData: async () => {
    // Si no hay token, no intentes cargar datos.
    if (!get().token) {
        set({ isAuthenticated: false, isLoading: false });
        return;
    }
    
    set({ isLoading: true });
    try {
      const profileData = await userService.getMyProfile();
      set({ userProfile: profileData, isAuthenticated: true });

      if (profileData.goal) {
        const [routines, workouts, bodyweight] = await Promise.all([
          routineService.getRoutines(),
          workoutService.getWorkouts(),
          bodyweightService.getHistory()
        ]);
        set({
          routines,
          workoutLog: workouts,
          bodyWeightLog: bodyweight,
        });
      }
    } catch (error) {
      console.error("Error de autenticación:", error);
      get().handleLogout();
    } finally {
      set({ isLoading: false });
    }
  },

  handleLogout: async () => {
    // Ya no es necesario llamar a la API para desloguearse
    localStorage.removeItem('fittrack_token');
    set({
      isAuthenticated: false,
      token: null,
      userProfile: null,
      routines: [],
      workoutLog: [],
      bodyWeightLog: [],
      isLoading: false,
    });
  },

  logWorkout: async (workoutData) => {
    try {
      const responseData = await workoutService.logWorkout(workoutData);
      if (responseData.newPRs && responseData.newPRs.length > 0) {
        get().showPRNotification(responseData.newPRs);
      }
      await get().fetchInitialData(); 
      return { success: true, message: 'Entrenamiento guardado.' };
    } catch (error) {
      return { success: false, message: `Error al guardar: ${error.message}` };
    }
  },
  
  deleteWorkoutLog: async (workoutId) => {
    try {
        await workoutService.deleteWorkout(workoutId);
        await get().fetchInitialData();
        return { success: true, message: 'Entrenamiento eliminado.' };
    } catch (error) {
        return { success: false, message: `Error al eliminar: ${error.message}` };
    }
  },

  updateUserProfile: async (formData) => {
    try {
        await userService.updateUserProfile(formData);
        await get().fetchInitialData();
        return { success: true, message: 'Perfil actualizado.' };
    } catch (error) {
        return { success: false, message: `Error: ${error.message}` };
    }
  },

  logBodyWeight: async (weightData) => {
    try {
        await bodyweightService.logWeight(weightData);
        await get().fetchInitialData();
        return { success: true, message: 'Peso registrado con éxito.' };
    } catch (error) {
        return { success: false, message: `Error al guardar: ${error.message}` };
    }
  },

  updateTodayBodyWeight: async (weightData) => {
    try {
        await bodyweightService.updateTodaysWeight(weightData);
        await get().fetchInitialData();
        return { success: true, message: 'Peso actualizado con éxito.' };
    } catch (error) {
        return { success: false, message: `Error al actualizar: ${error.message}` };
    }
  },
}));

export default useAppStore;