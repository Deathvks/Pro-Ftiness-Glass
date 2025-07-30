import { create } from 'zustand';
// 1. Importar todos los servicios
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import * as routineService from '../services/routineService';
import * as workoutService from '../services/workoutService';
import * as bodyweightService from '../services/bodyweightService';
// 'personalRecordService' ha sido eliminado porque no se usa aquí

const useAppStore = create((set, get) => ({
  // --- ESTADO (Sin cambios) ---
  isAuthenticated: false,
  userProfile: null,
  routines: [],
  workoutLog: [],
  bodyWeightLog: [],
  isLoading: true,
  prNotification: null,

  // --- ACCIONES REFACTORIZADAS ---
  
  showPRNotification: (newPRs) => {
    set({ prNotification: newPRs });
    setTimeout(() => set({ prNotification: null }), 7000);
  },

  /**
   * Carga todos los datos iniciales del usuario autenticado usando los servicios.
   */
  fetchInitialData: async () => {
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
      get().handleLogout(); // Llama a otra acción del store si falla
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Cierra la sesión del usuario.
   */
  handleLogout: async () => {
    try {
      await authService.logoutUser();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      set({
        isAuthenticated: false,
        userProfile: null,
        routines: [],
        workoutLog: [],
        bodyWeightLog: [],
        isLoading: false,
      });
    }
  },

  /**
   * Registra una nueva sesión de entrenamiento.
   */
  logWorkout: async (workoutData) => {
    try {
      const responseData = await workoutService.logWorkout(workoutData);
      if (responseData.newPRs && responseData.newPRs.length > 0) {
        get().showPRNotification(responseData.newPRs);
      }
      await get().fetchInitialData(); 
      return { success: true, message: 'Entrenamiento guardado.' };
    } catch (error) {
      return { success: false, message: `Error al guardar: ${error}` };
    }
  },
  
  /**
   * Elimina un registro de entrenamiento.
   */
  deleteWorkoutLog: async (workoutId) => {
    try {
        await workoutService.deleteWorkout(workoutId);
        await get().fetchInitialData();
        return { success: true, message: 'Entrenamiento eliminado.' };
    } catch (error) {
        return { success: false, message: `Error al eliminar: ${error}` };
    }
  },

  /**
   * Actualiza el perfil del usuario (onboarding o edición).
   */
  updateUserProfile: async (formData) => {
    try {
        await userService.updateUserProfile(formData);
        await get().fetchInitialData();
        return { success: true, message: 'Perfil actualizado.' };
    } catch (error) {
        return { success: false, message: `Error: ${error}` };
    }
  },

  /**
   * Registra un nuevo peso corporal.
   */
  logBodyWeight: async (weightData) => {
    try {
        await bodyweightService.logWeight(weightData);
        await get().fetchInitialData();
        return { success: true, message: 'Peso registrado con éxito.' };
    } catch (error) {
        return { success: false, message: `Error al guardar: ${error}` };
    }
  },

  /**
   * Actualiza el peso corporal del día.
   */
  updateTodayBodyWeight: async (weightData) => {
    try {
        await bodyweightService.updateTodaysWeight(weightData);
        await get().fetchInitialData();
        return { success: true, message: 'Peso actualizado con éxito.' };
    } catch (error) {
        return { success: false, message: `Error al actualizar: ${error}` };
    }
  },
}));

export default useAppStore;