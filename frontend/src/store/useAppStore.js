import { create } from 'zustand';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import * as routineService from '../services/routineService';
import * as workoutService from '../services/workoutService';
import * as bodyweightService from '../services/bodyweightService';

const useAppStore = create((set, get) => ({
  // --- ESTADO ---
  isAuthenticated: !!localStorage.getItem('fittrack_token'),
  token: localStorage.getItem('fittrack_token'),
  userProfile: null,
  routines: [],
  workoutLog: [],
  bodyWeightLog: [],
  isLoading: true,
  prNotification: null,
  activeWorkout: null,
  workoutStartTime: null,
  isWorkoutPaused: false,
  workoutAccumulatedTime: 0,

  // --- ACCIONES ---
  
  showPRNotification: (newPRs) => {
    set({ prNotification: newPRs });
    setTimeout(() => set({ prNotification: null }), 7000);
  },
  
  handleLogin: async (credentials) => {
    const { token } = await authService.loginUser(credentials);
    localStorage.setItem('fittrack_token', token);
    set({ token, isAuthenticated: true });
    await get().fetchInitialData();
  },

  fetchInitialData: async () => {
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

  startWorkout: (routine) => {
    const exercises = routine.RoutineExercises || [];
    const sessionTemplate = exercises.map(ex => ({
        ...ex,
        setsDone: Array.from({ length: ex.sets }, (_, i) => ({
            set_number: i + 1,
            reps: '',
            weight_kg: ''
        }))
    }));

    set({
      activeWorkout: {
        routineName: routine.name,
        exercises: sessionTemplate,
      },
      workoutStartTime: null,
      isWorkoutPaused: true, // Se considera pausado hasta que se pulsa Play
      workoutAccumulatedTime: 0,
    });
  },

  togglePauseWorkout: () => {
    const { isWorkoutPaused, workoutStartTime, workoutAccumulatedTime } = get();
    
    // Si es la primera vez que se pulsa play
    if (!workoutStartTime) {
      set({
        isWorkoutPaused: false,
        workoutStartTime: Date.now(),
      });
      return;
    }

    if (isWorkoutPaused) {
      // Reanudar
      set({
        isWorkoutPaused: false,
        workoutStartTime: Date.now(), // Reinicia el punto de partida
      });
    } else {
      // Pausar
      const elapsed = Date.now() - workoutStartTime;
      set({
        isWorkoutPaused: true,
        workoutAccumulatedTime: workoutAccumulatedTime + elapsed, // Acumula el tiempo
      });
    }
  },

  stopWorkout: () => {
    set({
      activeWorkout: null,
      workoutStartTime: null,
      isWorkoutPaused: false,
      workoutAccumulatedTime: 0,
    });
  },

  updateActiveWorkoutSet: (exIndex, setIndex, field, value) => {
    const session = get().activeWorkout;
    if (!session) return;

    const newExercises = [...session.exercises];
    const parsedValue = value === '' ? '' : parseFloat(value);
    newExercises[exIndex].setsDone[setIndex][field] = isNaN(parsedValue) ? '' : parsedValue;

    set({
      activeWorkout: { ...session, exercises: newExercises }
    });
  },

  logWorkout: async (workoutData) => {
    try {
      const responseData = await workoutService.logWorkout(workoutData);
      if (responseData.newPRs && responseData.newPRs.length > 0) {
        get().showPRNotification(responseData.newPRs);
      }
      get().stopWorkout(); // Limpiar la sesión activa después de guardarla
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