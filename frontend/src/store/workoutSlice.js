/* frontend/src/store/workoutSlice.js */
import * as workoutService from '../services/workoutService';
// --- INICIO DE LA MODIFICACIÓN ---
import { formatDateForQuery } from '../utils/dateUtils';
// --- FIN DE LA MODIFICACIÓN ---

// --- HELPER: Buscar último rendimiento ---
const findLastPerformance = (workoutLog, exerciseName) => {
  if (!workoutLog || !Array.isArray(workoutLog) || !exerciseName) return null;

  // Filtramos los logs que contienen el ejercicio
  const relevantLogs = workoutLog.filter(log =>
    log.details?.some(d => d.exerciseName === exerciseName)
  );

  if (relevantLogs.length === 0) return null;

  // Ordenamos por fecha descendente (el más reciente primero)
  relevantLogs.sort((a, b) => new Date(b.workout_date) - new Date(a.workout_date));

  const lastLog = relevantLogs[0];
  const detail = lastLog.details.find(d => d.exerciseName === exerciseName);

  return detail ? { date: lastLog.workout_date, sets: detail.setsDone } : null;
};

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
    const isRestTimerPaused = JSON.parse(localStorage.getItem('isRestTimerPaused')) || false;
    const restTimerRemaining = JSON.parse(localStorage.getItem('restTimerRemaining'));

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
  localStorage.setItem('isRestTimerPaused', JSON.stringify(state.isRestTimerPaused));
  localStorage.setItem('restTimerRemaining', JSON.stringify(state.restTimerRemaining));
};

const clearRestTimerInStorage = () => {
  localStorage.removeItem('isResting');
  localStorage.removeItem('restTimerEndTime');
  localStorage.removeItem('restTimerInitialDuration');
  localStorage.removeItem('restTimerMode');
  localStorage.removeItem('isRestTimerPaused');
  localStorage.removeItem('restTimerRemaining');
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
  isRestTimerPaused: false,
  restTimerRemaining: null,
  completedRoutineIdsToday: [], // <--- NUEVO
};

export const createWorkoutSlice = (set, get) => ({
  ...initialState,
  ...getWorkoutStateFromStorage(),
  ...getRestTimerStateFromStorage(),

  // --- NUEVA ACCIÓN: Obtener rutinas completadas hoy ---
  fetchTodaysCompletedRoutines: async () => {
    try {
      // --- INICIO DE LA MODIFICACIÓN ---
      // Usamos la nueva utilidad para obtener la fecha local formateada (YYYY-MM-DD)
      // Esto evita el problema de las zonas horarias con toISOString()
      const todayQuery = formatDateForQuery(new Date());

      // Llamar al servicio con la fecha exacta
      const workouts = await workoutService.getWorkouts({
        date: todayQuery
      });
      // --- FIN DE LA MODIFICACIÓN ---

      if (Array.isArray(workouts)) {
        // Extraer IDs de rutinas completadas
        const completedIds = workouts
          .map(w => w.routine_id || w.routineId)
          .filter(id => id != null);

        // Guardar sin duplicados
        set({ completedRoutineIdsToday: [...new Set(completedIds)] });
      }
    } catch (error) {
      console.error("Error obteniendo rutinas completadas hoy:", error);
    }
  },

  startWorkout: async (routine) => {
    // 1. Obtener toda la biblioteca de ejercicios y el historial
    const state = get();
    const allExercises = await state.getOrFetchAllExercises();
    const workoutLog = state.workoutLog || [];

    const sortedExercises = [
      ...(routine.RoutineExercises || routine.TemplateRoutineExercises || []),
    ].sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0));

    const exercises = sortedExercises.map((ex) => {
      // 2. Intentar encontrar el ejercicio en la biblioteca
      const targetId = ex.exercise_list_id || ex.exercise_id;
      let fullDetails = allExercises.find((detail) => detail.id === targetId);

      // Backup: Match por nombre
      if (!fullDetails && ex.name) {
        const normName = ex.name.toLowerCase().trim();
        fullDetails = allExercises.find(d => d.name.toLowerCase().trim() === normName);
      }

      // Nombre final
      const exerciseKeyName = fullDetails?.name || ex.exercise?.name || ex.name;

      // 3. Resolución de Media
      const mediaUrl =
        ex.image_url ||
        ex.gifUrl ||
        ex.gif_url ||
        fullDetails?.image_url ||
        fullDetails?.gifUrl ||
        fullDetails?.gif_url ||
        ex.image_url_start ||
        fullDetails?.image_url_start ||
        null;

      const videoUrl = ex.video_url || fullDetails?.video_url || null;

      const exerciseDetails = {
        ...(fullDetails || {}),
        name: exerciseKeyName,
        description: fullDetails?.description_es || fullDetails?.description || null,
        image_url: mediaUrl,
        video_url: videoUrl,
      };

      // 4. Buscar Último Rendimiento
      const lastPerformance = findLastPerformance(workoutLog, exerciseKeyName);

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
        exercise_list_id: fullDetails?.id || null,
        muscle_group: fullDetails?.muscle_group || null,
        last_performance: lastPerformance, // <--- NUEVO
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

  // --- Generador de Calentamiento ---
  addWarmupSets: (exIndex, workingWeight) => {
    const session = get().activeWorkout;
    if (!session) return;
    const newExercises = JSON.parse(JSON.stringify(session.exercises));
    const targetExercise = newExercises[exIndex];

    const weight = parseFloat(workingWeight);
    if (!weight || weight <= 0) return;

    const roundTo2_5 = (w) => Math.round(w / 2.5) * 2.5;

    const warmupSets = [
      { p: 0.5, reps: 12 },
      { p: 0.7, reps: 8 },
      { p: 0.9, reps: 4 },
    ].map((stage) => ({
      reps: stage.reps,
      weight_kg: roundTo2_5(weight * stage.p),
      is_dropset: false,
      is_warmup: true,
    }));

    targetExercise.setsDone = [...warmupSets, ...targetExercise.setsDone];

    targetExercise.setsDone.forEach((set, index) => {
      set.set_number = index + 1;
    });

    targetExercise.sets = targetExercise.setsDone.length;

    const newState = {
      activeWorkout: { ...session, exercises: newExercises },
    };
    set(newState);
    setWorkoutInStorage({ ...get(), ...newState });
  },

  replaceExercise: (exIndex, newExercise) => {
    const state = get();
    const session = state.activeWorkout;
    if (!session) return;
    const newExercises = JSON.parse(JSON.stringify(session.exercises));
    const oldExercise = newExercises[exIndex];
    const workoutLog = state.workoutLog || [];

    const normalizedDetails = {
      ...newExercise,
      description: newExercise.description_es || newExercise.description || null,
    };

    // Buscar rendimiento para el nuevo ejercicio
    const lastPerformance = findLastPerformance(workoutLog, newExercise.name);

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
      last_performance: lastPerformance, // <--- NUEVO
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
      isRestTimerPaused: false,
    }),

  startRestTimer: (durationInSeconds) => {
    const newState = {
      isResting: true,
      restTimerEndTime: Date.now() + durationInSeconds * 1000,
      restTimerInitialDuration: durationInSeconds,
      restTimerMode: 'modal',
      isRestTimerPaused: false,
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

  togglePauseRestTimer: () => {
    const { isRestTimerPaused, restTimerEndTime, restTimerRemaining } = get();
    let newState;

    if (isRestTimerPaused) {
      const newEndTime = Date.now() + restTimerRemaining;
      newState = {
        isRestTimerPaused: false,
        restTimerEndTime: newEndTime,
        restTimerRemaining: null,
      };
    } else {
      const now = Date.now();
      const remaining = restTimerEndTime ? restTimerEndTime - now : 0;

      newState = {
        isRestTimerPaused: true,
        restTimerRemaining: remaining,
      };
    }

    set(newState);
    setRestTimerInStorage({ ...get(), ...newState });
  },

  addRestTime: (secondsToAdd) => {
    set((state) => {
      if (state.isRestTimerPaused) {
        const currentRemaining = state.restTimerRemaining || 0;
        const newRemaining = (currentRemaining <= 0 ? 0 : currentRemaining) + (secondsToAdd * 1000);
        const newInitial = (state.restTimerInitialDuration || 0) + secondsToAdd;
        const newState = {
          restTimerRemaining: newRemaining,
          restTimerInitialDuration: Math.max(1, newInitial),
        };
        setRestTimerInStorage({ ...state, ...newState });
        return newState;
      }

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

      // --- ACTUALIZACIÓN DE RUTINAS COMPLETADAS HOY ---
      if (workoutData.routineId) {
        const current = get().completedRoutineIdsToday;
        if (!current.includes(workoutData.routineId)) {
          set({ completedRoutineIdsToday: [...current, workoutData.routineId] });
        }
      }

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
      // Nota: Si borramos un workout, idealmente deberíamos refrescar completedRoutineIdsToday
      // o quitarlo del array, pero por simplicidad dejaremos que fetchInitialData maneje la recarga global si es necesario
      // o el usuario recargue. Para ser consistentes podríamos llamar a fetchTodaysCompletedRoutines aquí.
      await get().fetchTodaysCompletedRoutines();

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