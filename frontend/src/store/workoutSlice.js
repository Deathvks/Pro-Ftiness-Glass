/* frontend/src/store/workoutSlice.js */
import * as workoutService from '../services/workoutService';

// --- FUNCIONES DE ALMACENAMIENTO LOCAL ---
const getWorkoutStateFromStorage = () => {
  try {
    const activeWorkout = JSON.parse(localStorage.getItem('activeWorkout'));
    if (!activeWorkout) return {};
    return {
      activeWorkout,
      workoutStartTime: JSON.parse(localStorage.getItem('workoutStartTime')),
      isWorkoutPaused: JSON.parse(localStorage.getItem('isWorkoutPaused')),
      workoutAccumulatedTime: JSON.parse(
        localStorage.getItem('workoutAccumulatedTime')
      ),
    };
  } catch {
    clearWorkoutInStorage();
    return {};
  }
};

const getRestTimerStateFromStorage = () => {
  try {
    const isResting = JSON.parse(localStorage.getItem('isResting'));
    // --- INICIO MODIFICACIÓN ---
    const isRestTimerPaused = JSON.parse(localStorage.getItem('isRestTimerPaused')) || false;
    const restTimerRemaining = JSON.parse(localStorage.getItem('restTimerRemaining'));

    // Si está pausado, no comprobamos si el tiempo ha expirado contra Date.now()
    if (isResting) {
      return {
        isResting,
        restTimerEndTime: JSON.parse(localStorage.getItem('restTimerEndTime')),
        restTimerInitialDuration: JSON.parse(localStorage.getItem('restTimerInitialDuration')),
        restTimerMode: localStorage.getItem('restTimerMode') || 'modal',
        isRestTimerPaused,
        restTimerRemaining,
      };
    }
    // --- FIN MODIFICACIÓN ---

    clearRestTimerInStorage();
    return {};
  } catch {
    clearRestTimerInStorage();
    return {};
  }
};

const setWorkoutInStorage = (state) => {
  localStorage.setItem('activeWorkout', JSON.stringify(state.activeWorkout));
  localStorage.setItem(
    'workoutStartTime',
    JSON.stringify(state.workoutStartTime)
  );
  localStorage.setItem('isWorkoutPaused', JSON.stringify(state.isWorkoutPaused));
  localStorage.setItem(
    'workoutAccumulatedTime',
    JSON.stringify(state.workoutAccumulatedTime)
  );
};

const clearWorkoutInStorage = () => {
  localStorage.removeItem('activeWorkout');
  localStorage.removeItem('workoutStartTime');
  localStorage.removeItem('isWorkoutPaused');
  localStorage.removeItem('workoutAccumulatedTime');
};

const setRestTimerInStorage = (state) => {
  localStorage.setItem('isResting', JSON.stringify(state.isResting));
  localStorage.setItem(
    'restTimerEndTime',
    JSON.stringify(state.restTimerEndTime)
  );
  localStorage.setItem(
    'restTimerInitialDuration',
    JSON.stringify(state.restTimerInitialDuration)
  );
  localStorage.setItem('restTimerMode', state.restTimerMode);
  // --- INICIO MODIFICACIÓN ---
  localStorage.setItem('isRestTimerPaused', JSON.stringify(state.isRestTimerPaused));
  localStorage.setItem('restTimerRemaining', JSON.stringify(state.restTimerRemaining));
  // --- FIN MODIFICACIÓN ---
};

const clearRestTimerInStorage = () => {
  localStorage.removeItem('isResting');
  localStorage.removeItem('restTimerEndTime');
  localStorage.removeItem('restTimerInitialDuration');
  localStorage.removeItem('restTimerMode');
  // --- INICIO MODIFICACIÓN ---
  localStorage.removeItem('isRestTimerPaused');
  localStorage.removeItem('restTimerRemaining');
  // --- FIN MODIFICACIÓN ---
};

// --- SLICE DE ZUSTAND ---
const initialState = {
  activeWorkout: null,
  workoutStartTime: null,
  isWorkoutPaused: false,
  workoutAccumulatedTime: 0,
  isResting: false,
  restTimerEndTime: null,
  restTimerInitialDuration: null,
  plannedRestTime: null,
  restTimerMode: 'modal',
  // --- INICIO MODIFICACIÓN ---
  isRestTimerPaused: false,
  restTimerRemaining: null, // Tiempo restante en ms cuando está pausado
  // --- FIN MODIFICACIÓN ---
};

export const createWorkoutSlice = (set, get) => ({
  ...initialState,
  ...getWorkoutStateFromStorage(),
  ...getRestTimerStateFromStorage(),

  startWorkout: async (routine) => {
    const allExercises = await get().getOrFetchAllExercises();

    const sortedExercises = [
      ...(routine.RoutineExercises || routine.TemplateRoutineExercises || []),
    ].sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0));

    const exercises = sortedExercises.map((ex) => {
      const fullDetails = allExercises.find(
        (detail) => detail.id === ex.exercise_list_id
      );
      const exerciseKeyName =
        fullDetails?.name || ex.exercise?.name || ex.name;

      const exerciseDetails = {
        ...(fullDetails || {}),
        name: exerciseKeyName,
        description:
          fullDetails?.description_es || fullDetails?.description || null,
        image_url: ex.image_url_start || fullDetails?.image_url,
        video_url: ex.video_url || fullDetails?.video_url,
      };

      return {
        id: ex.id,
        name: exerciseKeyName,
        sets: ex.sets,
        reps: ex.reps,
        superset_group_id: ex.superset_group_id || null,
        exercise_order: ex.exercise_order !== undefined ? ex.exercise_order : 0,
        rest_seconds: ex.rest_seconds !== undefined ? ex.rest_seconds : 90,
        exercise_details: exerciseDetails,
        setsDone: Array.from({ length: ex.sets }, (_, i) => ({
          set_number: i + 1,
          reps: '',
          weight_kg: '',
          is_dropset: false,
        })),
      };
    });

    const newState = {
      activeWorkout: {
        routineId: routine.id || null,
        routineName: routine.name,
        exercises,
      },
      workoutStartTime: null,
      isWorkoutPaused: true,
      workoutAccumulatedTime: 0,
    };
    set(newState);
    setWorkoutInStorage(newState);
  },

  startSimpleWorkout: (workoutName) => {
    const newState = {
      activeWorkout: {
        routineId: null,
        routineName: workoutName,
        exercises: [],
      },
      workoutStartTime: null,
      isWorkoutPaused: true,
      workoutAccumulatedTime: 0,
    };
    set(newState);
    setWorkoutInStorage(newState);
  },

  togglePauseWorkout: () => {
    const { isWorkoutPaused, workoutStartTime, workoutAccumulatedTime } = get();
    let newState;
    if (!workoutStartTime) {
      newState = { isWorkoutPaused: false, workoutStartTime: Date.now() };
    } else if (isWorkoutPaused) {
      newState = { isWorkoutPaused: false, workoutStartTime: Date.now() };
    } else {
      const elapsed = Date.now() - workoutStartTime;
      newState = {
        isWorkoutPaused: true,
        workoutAccumulatedTime: workoutAccumulatedTime + elapsed,
      };
    }
    set(newState);
    setWorkoutInStorage({ ...get(), ...newState });
  },

  stopWorkout: () => {
    get().clearWorkoutState();
  },

  updateActiveWorkoutSet: (exIndex, setIndex, field, value) => {
    const session = get().activeWorkout;
    if (!session) return;
    const newExercises = JSON.parse(JSON.stringify(session.exercises));

    newExercises[exIndex].setsDone[setIndex][field] = value;

    const newState = {
      activeWorkout: { ...session, exercises: newExercises },
    };
    set(newState);
    setWorkoutInStorage({ ...get(), ...newState });
  },

  addDropset: (exIndex, setIndex) => {
    const session = get().activeWorkout;
    if (!session) return;
    const newExercises = JSON.parse(JSON.stringify(session.exercises));
    const targetExercise = newExercises[exIndex];
    const parentSet = targetExercise.setsDone[setIndex];
    targetExercise.setsDone.splice(setIndex + 1, 0, {
      set_number: parentSet.set_number,
      reps: '',
      weight_kg: '',
      is_dropset: true,
    });
    const newState = {
      activeWorkout: { ...session, exercises: newExercises },
    };
    set(newState);
    setWorkoutInStorage({ ...get(), ...newState });
  },

  removeDropset: (exIndex, setIndex) => {
    const session = get().activeWorkout;
    if (!session) return;
    const newExercises = JSON.parse(JSON.stringify(session.exercises));
    if (newExercises[exIndex].setsDone[setIndex]?.is_dropset) {
      newExercises[exIndex].setsDone.splice(setIndex, 1);
    }
    const newState = {
      activeWorkout: { ...session, exercises: newExercises },
    };
    set(newState);
    setWorkoutInStorage({ ...get(), ...newState });
  },

  replaceExercise: (exIndex, newExercise) => {
    const session = get().activeWorkout;
    if (!session) return;
    const newExercises = JSON.parse(JSON.stringify(session.exercises));
    const oldExercise = newExercises[exIndex];

    const normalizedDetails = {
      ...newExercise,
      description: newExercise.description_es || newExercise.description || null,
    };

    newExercises[exIndex] = {
      ...oldExercise,
      name: newExercise.name,
      exercise_details: normalizedDetails,
      setsDone: Array.from({ length: oldExercise.sets }, (_, i) => ({
        set_number: i + 1,
        reps: '',
        weight_kg: '',
        is_dropset: false,
      })),
      id: null,
      exercise_list_id: newExercise.id,
      muscle_group: newExercise.muscle_group,
    };
    const newState = {
      activeWorkout: { ...session, exercises: newExercises },
    };
    set(newState);
    setWorkoutInStorage({ ...get(), ...newState });
  },

  updateActiveExerciseDetails: (exerciseKeyName, fullDetails) => {
    const session = get().activeWorkout;
    if (!session) return;

    const newExercises = session.exercises.map((ex) => {
      if (ex.name === exerciseKeyName) {
        const updatedDetails = {
          ...ex.exercise_details,
          ...fullDetails,
          name: exerciseKeyName,
          description:
            fullDetails?.description_es ||
            fullDetails?.description ||
            ex.exercise_details?.description ||
            null,
        };

        return {
          ...ex,
          exercise_details: updatedDetails,
        };
      }
      return ex;
    });

    const newState = {
      activeWorkout: { ...session, exercises: newExercises },
    };
    set(newState);
    setWorkoutInStorage({ ...get(), ...newState });
  },

  openRestModal: (plannedTime) =>
    set({
      isResting: true,
      plannedRestTime: plannedTime || 90,
      restTimerMode: 'modal',
      isRestTimerPaused: false, // Resetear pausa al abrir
    }),

  startRestTimer: (durationInSeconds) => {
    const newState = {
      isResting: true,
      restTimerEndTime: Date.now() + durationInSeconds * 1000,
      restTimerInitialDuration: durationInSeconds,
      restTimerMode: 'modal',
      isRestTimerPaused: false, // Inicia siempre sin pausa
      restTimerRemaining: null,
    };
    set(newState);
    setRestTimerInStorage(newState);
  },

  setRestTimerMode: (mode) => {
    const newState = { restTimerMode: mode };
    set(newState);
    setRestTimerInStorage({ ...get(), ...newState });
  },

  // --- INICIO MODIFICACIÓN: Pausar/Reanudar Descanso ---
  togglePauseRestTimer: () => {
    const { isRestTimerPaused, restTimerEndTime, restTimerRemaining } = get();
    let newState;

    if (isRestTimerPaused) {
      // REANUDAR: Calculamos nueva fecha fin basada en lo que quedaba
      // restTimerRemaining está en ms
      const newEndTime = Date.now() + restTimerRemaining;
      newState = {
        isRestTimerPaused: false,
        restTimerEndTime: newEndTime,
        restTimerRemaining: null,
      };
    } else {
      // PAUSAR: Guardamos cuánto falta
      // Si el tiempo ya pasó (negativo), guardamos 0 o el negativo?
      // Mejor guardamos la diferencia real para que si estaba en 0 se mantenga en 0.
      const now = Date.now();
      const remaining = restTimerEndTime ? restTimerEndTime - now : 0;

      newState = {
        isRestTimerPaused: true,
        restTimerRemaining: remaining,
        // Opcional: poner restTimerEndTime a null o dejarlo (se ignorará por el flag de pausa)
        // Lo dejamos para referencia si se necesitara, pero el flag manda.
      };
    }

    set(newState);
    setRestTimerInStorage({ ...get(), ...newState });
  },
  // --- FIN MODIFICACIÓN ---

  addRestTime: (secondsToAdd) => {
    set((state) => {
      // Si estamos pausados, sumamos al tiempo restante almacenado
      if (state.isRestTimerPaused) {
        const currentRemaining = state.restTimerRemaining || 0;
        // Si ya había terminado (negativo o 0), empezamos desde 0 + segundos
        // Si estaba a la mitad, sumamos
        const newRemaining = (currentRemaining <= 0 ? 0 : currentRemaining) + (secondsToAdd * 1000);

        const newInitial = (state.restTimerInitialDuration || 0) + secondsToAdd;
        const newState = {
          restTimerRemaining: newRemaining,
          restTimerInitialDuration: Math.max(1, newInitial),
        };
        setRestTimerInStorage({ ...state, ...newState });
        return newState;
      }

      // Lógica normal (sin pausa)
      if (!state.restTimerEndTime) return {};
      const now = Date.now();
      let newEndTime;

      if (state.restTimerEndTime < now) {
        newEndTime = now + (secondsToAdd * 1000);
      } else {
        newEndTime = state.restTimerEndTime + (secondsToAdd * 1000);
      }

      const newInitial = (state.restTimerInitialDuration || 0) + secondsToAdd;

      const newState = {
        restTimerEndTime: newEndTime,
        restTimerInitialDuration: Math.max(1, newInitial),
      };
      setRestTimerInStorage({ ...state, ...newState });
      return newState;
    });
  },

  resetRestTimer: () => {
    clearRestTimerInStorage();
    set({ restTimerEndTime: null, restTimerInitialDuration: null, isRestTimerPaused: false, restTimerRemaining: null });
  },

  stopRestTimer: () => {
    clearRestTimerInStorage();
    set({
      isResting: false,
      restTimerEndTime: null,
      restTimerInitialDuration: null,
      plannedRestTime: null,
      restTimerMode: 'modal',
      isRestTimerPaused: false,
      restTimerRemaining: null,
    });
  },

  logWorkout: async (workoutData) => {
    try {
      const responseData = await workoutService.logWorkout(workoutData);
      if (responseData.newPRs && responseData.newPRs.length > 0) {
        get().showPRNotification(responseData.newPRs);
        get()._showLocalPRNotification(responseData.newPRs);
      }
      return { success: true, message: 'Entrenamiento guardado.' };
    } catch (error) {
      return {
        success: false,
        message: `Error al guardar: ${error.message}`,
      };
    }
  },

  deleteWorkoutLog: async (workoutId) => {
    try {
      await workoutService.deleteWorkout(workoutId);
      await get().fetchInitialData();
      return { success: true, message: 'Entrenamiento eliminado.' };
    } catch (error) {
      return {
        success: false,
        message: `Error al eliminar: ${error.message}`,
      };
    }
  },

  _showLocalPRNotification: async (newPRs) => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('Notificaciones no soportadas por el navegador.');
      return;
    }

    try {
      const permission = Notification.permission;
      if (permission !== 'granted') {
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        console.error('Service Worker no está listo para la notificación.');
        return;
      }

      const title = '¡Nuevo Récord Personal!';
      const body =
        newPRs.length === 1
          ? `¡Has conseguido un nuevo PR en tu entrenamiento!`
          : `¡Felicidades! Has conseguido ${newPRs.length} nuevos PRs.`;

      const options = {
        body: body,
        icon: '/pwa-192x192.webp',
        badge: '/pwa-192x192.webp',
        tag: 'pr-notification',
        data: {
          url: '/progress',
        },
      };

      await registration.showNotification(title, options);
    } catch (err) {
      console.error('Error al mostrar notificación local de PR:', err);
    }
  },

  clearWorkoutState: () => {
    clearWorkoutInStorage();
    clearRestTimerInStorage();
    set({ ...initialState, plannedRestTime: null });
  },
});