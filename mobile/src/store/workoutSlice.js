/* frontend/src/store/workoutSlice.js */
import * as workoutService from '../services/workoutService';
import { formatDateForQuery } from '../utils/dateUtils';
import * as Crypto from 'expo-crypto';

const stopNativeTimer = () => {
  // TODO: Implementar temporizador nativo para React Native en el futuro si es necesario.
};

const getAccentColor = () => {
  try {
    const accent = (typeof localStorage !== 'undefined' ? localStorage.getItem('accent') : null) || 'green';
    const colors = {
      green: '#22c55e', blue: '#3b82f6', violet: '#8b5cf6', amber: '#f59e0b',
      rose: '#f43f5e', teal: '#14b8a6', cyan: '#06b6d4', orange: '#f97316',
      lime: '#84cc16', fuchsia: '#d946ef', emerald: '#10b981', indigo: '#6366f1',
      purple: '#a855f7', pink: '#ec4899', red: '#ef4444', yellow: '#eab308',
      sky: '#0ea5e9', slate: '#64748b', zinc: '#71717a', stone: '#78716c', neutral: '#737373'
    };
    return colors[accent] || '#22c55e';
  } catch (e) {
    return '#22c55e';
  }
};

// stopNativeTimer original eliminado

const normalizeExerciseName = (name) => name?.toLowerCase().trim();
let workoutStartRevision = 0;

const findLastPerformance = (workoutLog, exerciseName) => {
  if (!Array.isArray(workoutLog) || !exerciseName) return null;

  const searchName = normalizeExerciseName(exerciseName);
  let latest = null;
  let latestTime = -Infinity;
  for (const log of workoutLog) {
    const detail = log.WorkoutLogDetails?.find(d => normalizeExerciseName(d.exercise_name) === searchName);
    if (!detail) continue;
    const time = Date.parse(log.workout_date);
    const dateOrder = Number.isNaN(time) ? -Infinity : time;
    if (latest && dateOrder <= latestTime) continue;
    latestTime = dateOrder;
    latest = {
      date: log.workout_date,
      sets: detail.WorkoutLogSets || [],
      estimated_1rm: detail.estimated_1rm || 0,
    };
  }
  return latest;
};

const getWorkoutExerciseDetails = (ex, fullDetails) => {
  const embedded = ex.exercise || ex.ExerciseList || {};
  const name = fullDetails?.name || embedded.name || ex.name;
  const mediaUrl = ex.image_url || ex.gifUrl || ex.gif_url ||
    fullDetails?.image_url || fullDetails?.gifUrl || fullDetails?.gif_url ||
    ex.image_url_start || embedded.image_url_start || fullDetails?.image_url_start || null;

  return {
    name,
    exercise_details: {
      ...embedded,
      ...(fullDetails || {}),
      name,
      description: fullDetails?.description_es || fullDetails?.description || embedded.description || null,
      image_url: mediaUrl,
      image_url_start: fullDetails?.image_url_start || ex.image_url_start || embedded.image_url_start,
      image_url_end: fullDetails?.image_url_end || ex.image_url_end || embedded.image_url_end,
      images: fullDetails?.images || ex.images || embedded.images,
      video_url: ex.video_url || embedded.video_url || fullDetails?.video_url || null,
    },
    exercise_list_id: fullDetails?.id || ex.exercise_list_id || ex.exercise_id || embedded.id || null,
    muscle_group: ex.muscle_group || fullDetails?.muscle_group || embedded.muscle_group || null,
  };
};

const findCatalogExercise = (catalog, ex) => {
  const id = ex.exercise_list_id || ex.exercise_id || ex.exercise?.id || ex.ExerciseList?.id;
  const name = normalizeExerciseName(ex.name || ex.exercise?.name || ex.ExerciseList?.name);
  return (id && catalog.find(detail => String(detail.id) === String(id))) ||
    (name && catalog.find(detail => normalizeExerciseName(detail.name) === name));
};

// --- FUNCIONES DE ALMACENAMIENTO LOCAL ---
const getWorkoutStateFromStorage = () => {
  try {
    const activeWorkout = JSON.parse((typeof localStorage !== 'undefined' ? localStorage.getItem('activeWorkout') : null));
    if (!activeWorkout) return {};
    return {
      activeWorkout,
      workoutStartTime: JSON.parse((typeof localStorage !== 'undefined' ? localStorage.getItem('workoutStartTime') : null)),
      isWorkoutPaused: JSON.parse((typeof localStorage !== 'undefined' ? localStorage.getItem('isWorkoutPaused') : null)),
      workoutAccumulatedTime: JSON.parse(
        (typeof localStorage !== 'undefined' ? localStorage.getItem('workoutAccumulatedTime') : null)
      ),
    };
  } catch {
    clearWorkoutInStorage();
    return {};
  }
};

const getRestTimerStateFromStorage = () => {
  try {
    const isResting = JSON.parse((typeof localStorage !== 'undefined' ? localStorage.getItem('isResting') : null));
    const isRestTimerPaused = JSON.parse((typeof localStorage !== 'undefined' ? localStorage.getItem('isRestTimerPaused') : null)) || false;
    const restTimerRemaining = JSON.parse((typeof localStorage !== 'undefined' ? localStorage.getItem('restTimerRemaining') : null));

    if (isResting) {
      return {
        isResting,
        restTimerEndTime: JSON.parse((typeof localStorage !== 'undefined' ? localStorage.getItem('restTimerEndTime') : null)),
        restTimerInitialDuration: JSON.parse((typeof localStorage !== 'undefined' ? localStorage.getItem('restTimerInitialDuration') : null)),
        restTimerMode: (typeof localStorage !== 'undefined' ? localStorage.getItem('restTimerMode') : null) || 'hidden',
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

const setRestTimerInStorage = (state) => {
  localStorage.setItem('isResting', JSON.stringify(state.isResting));
  localStorage.setItem('restTimerEndTime', JSON.stringify(state.restTimerEndTime));
  localStorage.setItem('restTimerInitialDuration', JSON.stringify(state.restTimerInitialDuration));
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
  restTimerMode: 'hidden',
  isRestTimerPaused: false,
  restTimerRemaining: null,
  completedRoutineIdsToday: [],
};

export const createWorkoutSlice = (set, get) => ({
  ...initialState,
  ...getWorkoutStateFromStorage(),
  ...getRestTimerStateFromStorage(),

  fetchTodaysCompletedRoutines: async () => {
    try {
      const todayQuery = formatDateForQuery(new Date());

      const workouts = await workoutService.getWorkouts({
        date: todayQuery
      });

      if (Array.isArray(workouts)) {
        const completedIds = workouts
          .map(w => w.routine_id || w.routineId)
          .filter(id => id != null);

        set({ completedRoutineIdsToday: [...new Set(completedIds)] });
      }
    } catch (error) {
      console.error("Error obteniendo rutinas completadas hoy:", error);
    }
  },

  startWorkout: (routine) => {
    const state = get();
    const revision = ++workoutStartRevision;
    const catalog = state.allExercises || [];
    const sortedExercises = [
      ...(routine.RoutineExercises || routine.TemplateRoutineExercises || routine.exercises || []),
    ].sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0));

    const exercises = sortedExercises.map((ex, index) => {
      const details = getWorkoutExerciseDetails(ex, findCatalogExercise(catalog, ex));
      return {
        ...details,
        id: ex.id ?? ('routine-exercise-' + index),
        sets: ex.sets,
        reps: ex.reps,
        superset_group_id: ex.superset_group_id || null,
        exercise_order: ex.exercise_order !== undefined ? ex.exercise_order : 0,
        rest_seconds: ex.rest_seconds !== undefined ? ex.rest_seconds : 90,
        setsDone: Array.from({ length: ex.sets }, (_, i) => ({
          set_number: i + 1,
          reps: '',
          weight_kg: '',
          is_dropset: false,
          is_warmup: false,
          rir: null,
        })),
        last_performance: findLastPerformance(state.workoutLog, details.name),
        reminder: ex.reminder || null,
      };
    });

    const newState = {
      activeWorkout: {
        routineId: routine.id || null,
        routineName: routine.name,
        is_from_trainer: routine.is_from_trainer || false,
        image_url: routine.imageUrl || routine.image_url || null,
        imageUrl: routine.imageUrl || routine.image_url || null,
        exercises,
        startTime: new Date().toISOString(),
      },
      workoutStartTime: null,
      isWorkoutPaused: true,
      workoutAccumulatedTime: 0,
    };
    set(newState);
    setWorkoutInStorage(newState);

    if (catalog.length || !exercises.length) return;

    void state.getOrFetchAllExercises().then((loadedCatalog) => {
      const current = get();
      const session = current.activeWorkout;
      if (!loadedCatalog.length || revision !== workoutStartRevision ||
          session?.startTime !== newState.activeWorkout.startTime ||
          session.routineId !== newState.activeWorkout.routineId) return;

      let enriched = false;
      const updatedExercises = session.exercises.map((exercise, index) => {
        // Replacements get a new row ID. Preserve them and any series edits made during the request.
        if (exercise.id !== exercises[index]?.id) return exercise;
        const original = sortedExercises[index];
        const fullDetails = findCatalogExercise(loadedCatalog, original);
        if (!fullDetails) return exercise;

        enriched = true;
        const details = getWorkoutExerciseDetails(original, fullDetails);
        return {
          ...exercise,
          ...details,
          last_performance: exercise.name === details.name
            ? exercise.last_performance
            : findLastPerformance(current.workoutLog, details.name),
        };
      });

      if (enriched) {
        const activeWorkout = { ...session, exercises: updatedExercises };
        set({ activeWorkout });
        setWorkoutInStorage({ ...current, activeWorkout });
      }
    });
  },

  startSimpleWorkout: (workoutName) => {
    workoutStartRevision++;
    const newState = {
      activeWorkout: {
        routineId: null,
        routineName: workoutName,
        image_url: null,
        imageUrl: null,
        exercises: [],
        startTime: new Date().toISOString(), 
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

  addSetToExercise: (exIndex) => {
    const session = get().activeWorkout;
    if (!session) return;
    const newExercises = JSON.parse(JSON.stringify(session.exercises));
    const targetExercise = newExercises[exIndex];
    if (!targetExercise) return;
    const currentSets = targetExercise.setsDone || [];
    currentSets.push({
      set_number: currentSets.length + 1,
      reps: '',
      weight_kg: '',
      is_dropset: false,
      is_warmup: false,
      rir: null,
    });
    targetExercise.setsDone = currentSets;
    targetExercise.sets = currentSets.length;
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
      is_warmup: false,
      rir: null, // NUEVO CAMPO
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

  addWarmupSets: (exIndex, workingWeight) => {
    const session = get().activeWorkout;
    if (!session) return;
    const newExercises = JSON.parse(JSON.stringify(session.exercises));
    const targetExercise = newExercises[exIndex];

    const weight = parseFloat(workingWeight);
    if (!weight || weight <= 0) return;

    const getSmartRoundedWeight = (w) => {
      if (weight < 20) return Math.round(w);
      return Math.round(w / 2.5) * 2.5;
    };

    const warmupSets = [
      { p: 0.5, reps: 12 },
      { p: 0.7, reps: 8 },
      { p: 0.9, reps: 4 },
    ].map((stage) => {
      let calculatedW = getSmartRoundedWeight(weight * stage.p);

      if (calculatedW >= weight) {
        const decrement = weight < 20 ? 1 : 2.5;
        calculatedW = Math.max(0, weight - decrement);
      }

      return {
        reps: stage.reps,
        weight_kg: calculatedW,
        is_dropset: false,
        is_warmup: true,
        rir: null, // NUEVO CAMPO
      };
    });

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
        is_warmup: false,
        rir: null, // NUEVO CAMPO
      })),
      id: Crypto.randomUUID(),
      exercise_list_id: newExercise.id,
      muscle_group: newExercise.muscle_group,
      last_performance: lastPerformance,
      reminder: null, // Reset del reminder al cambiar ejercicio
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

  // --- FUNCIÓN PARA GUARDAR EL RECORDATORIO ---
  setExerciseReminder: (exIndex, reminderText) => {
    const session = get().activeWorkout;
    if (!session) return;
    
    const newExercises = JSON.parse(JSON.stringify(session.exercises));
    newExercises[exIndex].reminder = reminderText;
    newExercises[exIndex].reminderUpdated = true; // <--- FLAG PARA SABER QUE SE EDITÓ HOY

    const newState = {
      activeWorkout: { ...session, exercises: newExercises },
    };
    set(newState);
    setWorkoutInStorage({ ...get(), ...newState });
  },
  // --------------------------------------------------

  openRestModal: (plannedTime) =>
    set({
      isResting: true,
      plannedRestTime: plannedTime || 90,
      restTimerMode: 'modal',
      isRestTimerPaused: false,
    }),

  startRestTimer: (durationInSeconds) => {
    const endTimeMs = Date.now() + durationInSeconds * 1000;
    const newState = {
      isResting: true,
      restTimerEndTime: endTimeMs,
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
      stopNativeTimer();
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
    stopNativeTimer();
    set({ restTimerEndTime: null, restTimerInitialDuration: null, isRestTimerPaused: false, restTimerRemaining: null, restTimerMode: 'hidden' });
  },

  stopRestTimer: () => {
    clearRestTimerInStorage();
    stopNativeTimer();
    set({
      isResting: false,
      restTimerEndTime: null,
      restTimerInitialDuration: null,
      plannedRestTime: null,
      restTimerMode: 'hidden',
      isRestTimerPaused: false,
      restTimerRemaining: null,
    });
  },

  finishWorkout: async () => {
    const state = get();
    const activeWorkout = state.activeWorkout;
    if (!activeWorkout || !activeWorkout.startTime) return;

    const elapsed = Date.now() - new Date(activeWorkout.startTime).getTime();
    const duration_seconds = Math.floor(elapsed / 1000);
    // Estimación genérica si el usuario no introduce calorías (aprox 400 kcal/h)
    const calories_burned = Math.round((duration_seconds / 3600) * 400);

    const isSimpleWorkout = activeWorkout.isSimpleWorkout;
    
    // Comprobar si hay al menos una serie completada
    const isAnySetFilled = isSimpleWorkout || (activeWorkout.exercises && activeWorkout.exercises.some(ex => 
        ex.setsDone && ex.setsDone.some(set => 
            (set.reps !== undefined && String(set.reps).trim() !== '') || 
            (set.weight_kg !== undefined && String(set.weight_kg).trim() !== '')
        )
    ));

    if (!isAnySetFilled) {
        // Si no hay datos, limpiamos la sesión sin guardarla
        state.clearWorkoutState();
        return;
    }

    const safeParseFloat = (value) => parseFloat(String(value).replace(',', '.')) || 0;

    const workoutData = {
        routineId: activeWorkout.routineId,
        routineName: activeWorkout.routineName || 'Entrenamiento libre',
        duration_seconds: duration_seconds,
        notes: "Autoguardado por límite de 4 horas.",
        calories_burned: calories_burned,
        details: isSimpleWorkout
            ? []
            : activeWorkout.exercises.map((ex) => ({
                id: ex.id, 
                exerciseName: ex.name,
                superset_group_id: ex.superset_group_id,
                reminder: ex.reminder, 
                setsDone: ex.setsDone
                    .filter(
                        (set) =>
                            (set.reps !== '' && set.reps !== null) ||
                            (set.weight_kg !== '' && set.weight_kg !== null)
                    )
                    .map((set) => ({
                        set_number: set.set_number,
                        reps: safeParseFloat(set.reps),
                        weight_kg: safeParseFloat(set.weight_kg),
                        is_dropset: set.is_dropset || false,
                        is_warmup: set.is_warmup || false,
                        rir: set.rir !== undefined && set.rir !== null && set.rir !== '' ? Number(set.rir) : null,
                    })),
            })),
    };

    await state.logWorkout(workoutData);
  },

  logWorkout: async (workoutData, { standalone = false } = {}) => {
    try {
      const state = get();
      const activeWorkout = standalone ? null : state.activeWorkout;
      const workoutDate = (standalone ? workoutData.workout_date : activeWorkout?.startTime) || new Date().toISOString();

      // INTERCEPTOR: Borramos/Consumimos las metas que no hayan sido actualizadas hoy
      let processedDetails = workoutData.details;
      if (processedDetails && Array.isArray(processedDetails)) {
          processedDetails = processedDetails.map(detail => {
              const stateEx = activeWorkout?.exercises?.find(e => e.id === detail.id);
              if (stateEx && !stateEx.reminderUpdated) {
                  return { ...detail, reminder: null };
              }
              return detail;
          });
      }

      const finalWorkoutData = {
        ...workoutData,
        details: processedDetails || workoutData.details,
        date: workoutDate, 
        visibility: activeWorkout?.is_from_trainer ? 'private' : ((typeof localStorage !== 'undefined' ? localStorage.getItem('globalWorkoutVisibility') : null) || 'friends'),
        notifyFriends: (typeof localStorage !== 'undefined' ? localStorage.getItem('globalNotifyFriends') : null) !== 'false'
      };

      const cardioUserId = standalone ? state.userProfile?.id : undefined;
      const offlineOptions = standalone ? { cardioUserId, queueWhenOffline: cardioUserId != null } : undefined;
      const responseData = await workoutService.logWorkout(finalWorkoutData, offlineOptions);

      if (workoutData.routineId) {
        const current = get().completedRoutineIdsToday;
        if (!current.includes(workoutData.routineId)) {
          set({ completedRoutineIdsToday: [...current, workoutData.routineId] });
        }
      }

      if (responseData.gamificationEvents && responseData.gamificationEvents.length > 0) {
        if (get().addGamificationEvents) {
          get().addGamificationEvents(responseData.gamificationEvents);
        }
      } else if (get().addXp && responseData.xpAdded > 0) {
        get().addXp(responseData.xpAdded, 'Entrenamiento guardado');
      }

      const todayStr = formatDateForQuery(new Date());
      if (get().checkStreak) get().checkStreak(todayStr);
      if (get().unlockBadge) get().unlockBadge('first_workout');

      if (responseData.newPRs && responseData.newPRs.length > 0) {
        get().showPRNotification(responseData.newPRs);
        get()._showLocalPRNotification(responseData.newPRs);
        
        if (get().addLocalPersonalRecords) {
            const recordsWithDate = responseData.newPRs.map(pr => ({
                ...pr,
                date: pr.date || workoutDate
            }));
            get().addLocalPersonalRecords(recordsWithDate);
        }
      }

      if (!standalone) {
        clearWorkoutInStorage();
        clearRestTimerInStorage();
        stopNativeTimer();
      }

      return { success: true, message: 'Entrenamiento guardado exitosamente.' };
    } catch (error) {
      if (standalone && error.isQueued) {
        return { success: true, offline: true, message: 'Sesión guardada en este dispositivo. Se sincronizará al recuperar la conexión.' };
      }
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
    stopNativeTimer();
    set({ ...initialState, plannedRestTime: null });
  },
});
