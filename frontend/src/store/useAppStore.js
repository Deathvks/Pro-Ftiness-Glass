import { create } from 'zustand';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import * as routineService from '../services/routineService';
import * as workoutService from '../services/workoutService';
import * as bodyweightService from '../services/bodyweightService';

// Funciones auxiliares para interactuar con localStorage
const getWorkoutFromStorage = () => {
  try {
    const activeWorkout = JSON.parse(localStorage.getItem('activeWorkout'));
    const workoutStartTime = JSON.parse(localStorage.getItem('workoutStartTime'));
    const isWorkoutPaused = JSON.parse(localStorage.getItem('isWorkoutPaused'));
    const workoutAccumulatedTime = JSON.parse(localStorage.getItem('workoutAccumulatedTime'));

    if (activeWorkout) {
      return { activeWorkout, workoutStartTime, isWorkoutPaused, workoutAccumulatedTime };
    }
  } catch {
    // Si hay un error al parsear, limpiamos el almacenamiento para evitar problemas
    clearWorkoutInStorage();
  }
  return { activeWorkout: null, workoutStartTime: null, isWorkoutPaused: false, workoutAccumulatedTime: 0 };
};

const setWorkoutInStorage = (state) => {
  localStorage.setItem('activeWorkout', JSON.stringify(state.activeWorkout));
  localStorage.setItem('workoutStartTime', JSON.stringify(state.workoutStartTime));
  localStorage.setItem('isWorkoutPaused', JSON.stringify(state.isWorkoutPaused));
  localStorage.setItem('workoutAccumulatedTime', JSON.stringify(state.workoutAccumulatedTime));
};

const clearWorkoutInStorage = () => {
  localStorage.removeItem('activeWorkout');
  localStorage.removeItem('workoutStartTime');
  localStorage.removeItem('isWorkoutPaused');
  localStorage.removeItem('workoutAccumulatedTime');
};

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
  ...getWorkoutFromStorage(), // Cargar estado del entreno al iniciar

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
    localStorage.removeItem('lastView');
    clearWorkoutInStorage(); // Limpiar entreno al cerrar sesión
    set({
      isAuthenticated: false,
      token: null,
      userProfile: null,
      routines: [],
      workoutLog: [],
      bodyWeightLog: [],
      isLoading: false,
      activeWorkout: null,
      workoutStartTime: null,
      isWorkoutPaused: false,
      workoutAccumulatedTime: 0,
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

    const newState = {
      activeWorkout: {
        routineId: routine.id, // Guardamos el ID de la rutina
        routineName: routine.name,
        exercises: sessionTemplate,
      },
      workoutStartTime: null,
      isWorkoutPaused: true,
      workoutAccumulatedTime: 0,
    };
    set(newState);
    setWorkoutInStorage(newState); // Guardar en localStorage
  },

  togglePauseWorkout: () => {
    const { isWorkoutPaused, workoutStartTime, workoutAccumulatedTime } = get();
    let newState;

    if (!workoutStartTime) {
      newState = {
        isWorkoutPaused: false,
        workoutStartTime: Date.now(),
      };
    } else if (isWorkoutPaused) {
      newState = {
        isWorkoutPaused: false,
        workoutStartTime: Date.now(),
      };
    } else {
      const elapsed = Date.now() - workoutStartTime;
      newState = {
        isWorkoutPaused: true,
        workoutAccumulatedTime: workoutAccumulatedTime + elapsed,
      };
    }
    set(newState);
    setWorkoutInStorage({ ...get(), ...newState }); // Guardar en localStorage
  },

  stopWorkout: () => {
    clearWorkoutInStorage(); // Limpiar localStorage
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

    const newState = { activeWorkout: { ...session, exercises: newExercises } };
    set(newState);
    setWorkoutInStorage({ ...get(), ...newState }); // Guardar en localStorage
  },

  logWorkout: async (workoutData) => {
    try {
      const responseData = await workoutService.logWorkout(workoutData);
      if (responseData.newPRs && responseData.newPRs.length > 0) {
        get().showPRNotification(responseData.newPRs);
      }
      get().stopWorkout(); // Esto ya limpia el localStorage
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