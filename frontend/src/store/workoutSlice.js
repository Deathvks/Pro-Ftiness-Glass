/* frontend/src/store/workoutSlice.js */
import * as workoutService from '../services/workoutService';
import { formatDateForQuery } from '../utils/dateUtils';
import { isSameDay } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';
import { Capacitor, registerPlugin } from '@capacitor/core';

// Registramos el plugin nativo aquí
const NativeTimer = Capacitor.isNativePlatform() ? registerPlugin('NativeTimer') : null;

const _getAccentColor = () => {
  try {
    const accent = localStorage.getItem('accent') || 'green';
    const colors = {
      green: '#22c55e', blue: '#3b82f6', violet: '#8b5cf6', amber: '#f59e0b',
      rose: '#f43f5e', teal: '#14b8a6', cyan: '#06b6d4', orange: '#f97316',
      lime: '#84cc16', fuchsia: '#d946ef', emerald: '#10b981', indigo: '#6366f1',
      purple: '#a855f7', pink: '#ec4899', red: '#ef4444', yellow: '#eab308',
      sky: '#0ea5e9', slate: '#64748b', zinc: '#71717a', stone: '#78716c', neutral: '#737373'
    };
    return colors[accent] || '#22c55e';
  } catch {
    return '#22c55e';
  }
};

const stopNativeTimer = () => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android' && NativeTimer) {
    NativeTimer.stopTimer().catch(console.warn);
  }
};

const startNativeTimer = (endTimeMs, title = 'Descanso entre series') => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android' && NativeTimer) {
    NativeTimer.startTimer({
      title,
      endTimeMs,
      color: _getAccentColor()
    }).catch(console.warn);
  }
};

export const initNativeTimerSync = (store) => {
  if (typeof window === 'undefined') return;
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android' && NativeTimer) {
    try {
      NativeTimer.removeAllListeners?.().catch?.(() => {});
      NativeTimer.addListener('timerAction', (data) => {
        if (!data || !data.action) return;
        const state = store.getState();
        if (data.action === 'addTime') {
          state.addRestTime(data.seconds || 30);
        } else if (data.action === 'skip') {
          state.stopRestTimer();
        } else if (data.action === 'complete') {
          state.stopRestTimer();
        }
      });
    } catch (e) {
      console.warn('Error inicializando sincronización con NativeTimer:', e);
    }
  }
};

// --- HELPER CORREGIDO: Buscar último rendimiento (AHORA LEE BIEN EL BACKEND) ---
const findLastPerformance = (workoutLog, exerciseName) => {
  if (!workoutLog || !Array.isArray(workoutLog) || !exerciseName) return null;

  const searchName = exerciseName.toLowerCase().trim();

  // Buscar logs que contengan WorkoutLogDetails con el ejercicio
  const relevantLogs = workoutLog.filter(log =>
    log.WorkoutLogDetails?.some(d => d.exercise_name?.toLowerCase().trim() === searchName)
  );

  if (relevantLogs.length === 0) return null;

  // Ordenar de más reciente a más antiguo
  relevantLogs.sort((a, b) => new Date(b.workout_date) - new Date(a.workout_date));

  const lastLog = relevantLogs[0];
  const detail = lastLog.WorkoutLogDetails.find(
    d => d.exercise_name?.toLowerCase().trim() === searchName
  );

  // Extraer los sets y el 1RM estimado directamente de la DB
  return detail ? { 
    date: lastLog.workout_date, 
    sets: detail.WorkoutLogSets || [],
    estimated_1rm: detail.estimated_1rm || 0
  } : null;
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

const getCompletedRoutinesFromStorage = () => {
  try {
    const raw = localStorage.getItem('pro_fitness_completed_routines_today');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const todayStr = formatDateForQuery(new Date());
    if (parsed && parsed.date === todayStr && Array.isArray(parsed.ids)) {
      return parsed.ids;
    }
    // Si la fecha guardada no es hoy, limpiar inmediatamente el residuo caducado
    try {
      localStorage.removeItem('pro_fitness_completed_routines_today');
    } catch {}
    return [];
  } catch {
    return [];
  }
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
  completedRoutineIdsToday: getCompletedRoutinesFromStorage(),
};

export const createWorkoutSlice = (set, get) => ({
  ...initialState,
  ...getWorkoutStateFromStorage(),
  ...getRestTimerStateFromStorage(),

  fetchTodaysCompletedRoutines: async () => {
    try {
      const today = new Date();
      const todayQuery = formatDateForQuery(today);

      const workouts = await workoutService.getWorkouts({
        date: todayQuery
      });

      const apiCompletedIds = Array.isArray(workouts)
        ? workouts.map(w => w.routine_id || w.routineId).filter(id => id != null)
        : [];

      // Validar estrictamente con workoutLog asegurando que sea el mismo día de hoy
      const stateLogs = get().workoutLog || [];
      const localCompletedIds = stateLogs
        .filter(log => {
          if (!log?.routine_id || !log?.workout_date) return false;
          return isSameDay(log.workout_date, today);
        })
        .map(log => log.routine_id);

      // Leemos de almacenamiento únicamente si coincide con la fecha de hoy
      const stored = getCompletedRoutinesFromStorage();

      // Verificar que los IDs almacenados no pertenezcan exclusivamente a días previos
      const verifiedStored = stored.filter(storedId => {
        const matchingLogs = stateLogs.filter(l => String(l?.routine_id) === String(storedId));
        if (matchingLogs.length > 0) {
          return matchingLogs.some(l => isSameDay(l.workout_date, today));
        }
        return true;
      });

      // Solo rutinas que realmente correspondan a HOY (no arrastrar estado en memoria de días pasados)
      const merged = [...new Set([...verifiedStored, ...apiCompletedIds, ...localCompletedIds])];
      set({ completedRoutineIdsToday: merged });

      try {
        if (merged.length > 0) {
          localStorage.setItem('pro_fitness_completed_routines_today', JSON.stringify({
            date: todayQuery,
            ids: merged
          }));
        } else {
          localStorage.removeItem('pro_fitness_completed_routines_today');
        }
      } catch (e) {
        console.warn('Error saving completed routines to storage', e);
      }
    } catch (error) {
      console.error("Error obteniendo rutinas completadas hoy:", error);
    }
  },

  startWorkout: async (routine) => {
    const state = get();
    const allExercises = await state.getOrFetchAllExercises();
    const workoutLog = state.workoutLog || [];

    const sortedExercises = [
      ...(routine.RoutineExercises || routine.TemplateRoutineExercises || []),
    ].sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0));

    const exercises = sortedExercises.map((ex) => {
      const targetId = ex.exercise_list_id || ex.exercise_id;
      let fullDetails = allExercises.find((detail) => detail.id === targetId);

      if (!fullDetails && ex.name) {
        const normName = ex.name.toLowerCase().trim();
        fullDetails = allExercises.find(d => d.name.toLowerCase().trim() === normName);
      }

      const exerciseKeyName = fullDetails?.name || ex.exercise?.name || ex.name;

      const mediaUrl =
        ex.image_url ||
        ex.gifUrl ||
        ex.gif_url ||
        fullDetails?.image_url ||
        fullDetails?.gifUrl ||
        fullDetails?.gif_url ||
        ex.image_url_start ||
        ex.exercise?.image_url_start ||
        fullDetails?.image_url_start ||
        null;

      const videoUrl = ex.video_url || ex.exercise?.video_url || fullDetails?.video_url || null;

      const exerciseDetails = {
        ...(ex.exercise || {}),
        ...(fullDetails || {}),
        name: exerciseKeyName,
        description: fullDetails?.description_es || fullDetails?.description || ex.exercise?.description || null,
        image_url: mediaUrl,
        video_url: videoUrl,
      };

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
          is_warmup: false,
          rir: null, // NUEVO CAMPO
        })),
        exercise_list_id: fullDetails?.id || null,
        muscle_group: ex.muscle_group || fullDetails?.muscle_group || null,
        last_performance: lastPerformance,
        reminder: ex.reminder || null, // Cargamos el reminder de la rutina si existe
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
  },

  startSimpleWorkout: (workoutName) => {
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

  applyCoachStrategyToExercise: (exIndex, strategy) => {
    const session = get().activeWorkout;
    if (!session || !session.exercises || !session.exercises[exIndex]) return;

    const newExercises = JSON.parse(JSON.stringify(session.exercises));
    const targetExercise = newExercises[exIndex];
    if (!targetExercise) return;

    const { suggestedSets, suggestedWeight, suggestedReps, perSetPlan } = strategy || {};

    // 1. Modificar número de series si la recomendación indica un conteo específico
    const targetSetsCount = parseInt(suggestedSets || (Array.isArray(perSetPlan) ? perSetPlan.length : null), 10);
    if (!isNaN(targetSetsCount) && targetSetsCount > 0) {
      const currentSets = targetExercise.setsDone || [];
      if (currentSets.length > targetSetsCount) {
        // Reducir series para este entrenamiento (ej. de 3 a 2 series)
        targetExercise.setsDone = currentSets.slice(0, targetSetsCount);
      } else if (currentSets.length < targetSetsCount) {
        // Aumentar series si la pauta sugiere más volumen
        while (targetExercise.setsDone.length < targetSetsCount) {
          const newIdx = targetExercise.setsDone.length;
          const planSet = perSetPlan && perSetPlan[newIdx] ? perSetPlan[newIdx] : null;
          targetExercise.setsDone.push({
            set_number: targetExercise.setsDone.length + 1,
            reps: planSet?.reps !== undefined && planSet?.reps !== null ? String(planSet.reps) : (suggestedReps !== null && suggestedReps !== undefined ? String(suggestedReps) : ''),
            weight_kg: planSet?.weight !== undefined && planSet?.weight !== null ? String(planSet.weight) : (suggestedWeight !== null && suggestedWeight !== undefined ? String(suggestedWeight) : ''),
            is_dropset: false,
            is_warmup: false,
            rir: null,
          });
        }
      }

      // Re-numerar series de forma correlativa
      let nonDropsetCount = 0;
      targetExercise.setsDone.forEach((s) => {
        if (!s.is_dropset) {
          nonDropsetCount++;
          s.set_number = nonDropsetCount;
        }
      });
      targetExercise.sets = targetSetsCount;
    }

    // 2. Aplicar peso y repeticiones sugeridas a las series de trabajo
    if (targetExercise.setsDone && targetExercise.setsDone.length > 0) {
      if (perSetPlan && Array.isArray(perSetPlan) && perSetPlan.length > 0) {
        // Asignación diferenciada por serie (ej: Top Set + Back-off sets)
        let workingIdx = 0;
        targetExercise.setsDone.forEach((set) => {
          if (set.is_warmup || set.is_dropset) return;
          const planSet = perSetPlan[workingIdx] || perSetPlan[perSetPlan.length - 1];
          if (planSet) {
            if (planSet.weight !== null && planSet.weight !== undefined) {
              set.weight_kg = planSet.weight;
            }
            if (planSet.reps !== null && planSet.reps !== undefined) {
              set.reps = planSet.reps;
            }
          }
          workingIdx++;
        });
      } else {
        let appliedWeightCount = 0;
        let appliedRepsCount = 0;

        // Completar series que estén vacías
        targetExercise.setsDone.forEach((set) => {
          if (set.is_warmup) return;
          if (suggestedWeight !== null && suggestedWeight !== undefined) {
            if (set.weight_kg === '' || set.weight_kg === null || set.weight_kg === undefined) {
              set.weight_kg = suggestedWeight;
              appliedWeightCount++;
            }
          }
          if (suggestedReps !== null && suggestedReps !== undefined) {
            if (set.reps === '' || set.reps === null || set.reps === undefined) {
              set.reps = suggestedReps;
              appliedRepsCount++;
            }
          }
        });

        // Si ninguna serie estaba vacía, actualizar todas las series de trabajo a la pauta
        if (appliedWeightCount === 0 && suggestedWeight !== null && suggestedWeight !== undefined) {
          targetExercise.setsDone.forEach((set) => {
            if (!set.is_warmup) {
              set.weight_kg = suggestedWeight;
            }
          });
        }
        if (appliedRepsCount === 0 && suggestedReps !== null && suggestedReps !== undefined) {
          targetExercise.setsDone.forEach((set) => {
            if (!set.is_warmup) {
              set.reps = suggestedReps;
            }
          });
        }
      }
    }

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
    
    let insertIndex = setIndex + 1;
    while (
      insertIndex < targetExercise.setsDone.length && 
      targetExercise.setsDone[insertIndex].set_number === parentSet.set_number && 
      targetExercise.setsDone[insertIndex].is_dropset
    ) {
      insertIndex++;
    }

    targetExercise.setsDone.splice(insertIndex, 0, {
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
      id: uuidv4(),
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
    startNativeTimer(endTimeMs);
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
      startNativeTimer(newEndTime);
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
      startNativeTimer(newEndTime);

      return newState;
    });
  },

  resetRestTimer: () => {
    clearRestTimerInStorage();
    stopNativeTimer();
    set({ restTimerEndTime: null, restTimerInitialDuration: null, isRestTimerPaused: false, restTimerRemaining: null });
  },

  stopRestTimer: () => {
    clearRestTimerInStorage();
    stopNativeTimer();
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

  finishWorkout: async () => {
    const state = get();
    const activeWorkout = state.activeWorkout;
    if (!activeWorkout || !activeWorkout.startTime) return;

    const elapsed =
      (state.workoutAccumulatedTime || 0) +
      (!state.isWorkoutPaused && state.workoutStartTime
        ? Date.now() - state.workoutStartTime
        : 0);
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
        // Al alcanzar el límite sin datos, cancelamos y retiramos la sesión activa.
        state.clearWorkoutState();
        return { success: false, cancelled: true, message: 'Entrenamiento cancelado sin datos.' };
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

    const result = await state.logWorkout(workoutData);
    if (result?.success) {
      // logWorkout limpia el almacenamiento, pero el autolímite también debe
      // limpiar el estado en memoria para retirar el entrenamiento activo.
      get().clearWorkoutState();
    }
    return result;
  },

  logWorkout: async (workoutData) => {
    try {
      const state = get();
      const workoutDate = state.activeWorkout?.startTime || new Date().toISOString();

      // INTERCEPTOR: Borramos/Consumimos las metas que no hayan sido actualizadas hoy
      let processedDetails = workoutData.details;
      if (processedDetails && Array.isArray(processedDetails)) {
          processedDetails = processedDetails.map(detail => {
              const stateEx = state.activeWorkout?.exercises?.find(e => e.id === detail.id);
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
        visibility: state.activeWorkout?.is_from_trainer ? 'private' : (localStorage.getItem('globalWorkoutVisibility') || 'friends'), 
        notifyFriends: localStorage.getItem('globalNotifyFriends') !== 'false'
      };

      const responseData = await workoutService.logWorkout(finalWorkoutData);

      if (workoutData.routineId) {
        const current = get().completedRoutineIdsToday || [];
        const normId = workoutData.routineId;
        if (!current.some(id => String(id) === String(normId))) {
          const updated = [...current, normId];
          set({ completedRoutineIdsToday: updated });
          try {
            const todayStr = formatDateForQuery(new Date());
            localStorage.setItem('pro_fitness_completed_routines_today', JSON.stringify({
              date: todayStr,
              ids: updated
            }));
          } catch (e) {
            console.warn('Error saving completed routines to storage', e);
          }
        }
      }

      if (responseData.gamificationEvents && responseData.gamificationEvents.length > 0) {
        if (get().addGamificationEvents) {
          get().addGamificationEvents(responseData.gamificationEvents);
        }
      } else if (get().addXp && responseData.xpAdded > 0) {
        get().addXp(responseData.xpAdded, 'Entrenamiento guardado');
      }

      if (responseData.streak !== undefined && responseData.streak !== null) {
        set((s) => ({
          gamification: {
            ...s.gamification,
            streak: responseData.streak,
            lastActivityDate: formatDateForQuery(new Date())
          }
        }));
      }
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

      clearWorkoutInStorage();
      clearRestTimerInStorage();
      stopNativeTimer();

      return { success: true, message: 'Entrenamiento guardado exitosamente.', newPRs: responseData?.newPRs || [] };
    } catch (error) {
      const errMsg = (error?.message || '').toLowerCase();
      const isNetworkFailure = 
        (typeof navigator !== 'undefined' && !navigator.onLine) ||
        errMsg.includes('conexión inestable') ||
        errMsg.includes('guardado localmente') ||
        errMsg.includes('failed to fetch') ||
        errMsg.includes('networkerror') ||
        errMsg.includes('load failed') ||
        errMsg.includes('abort') ||
        errMsg.includes('timeout') ||
        errMsg.includes('no se pudo conectar');

      if (isNetworkFailure) {
        console.warn('Guardado en cola offline resiliente (Modo Búnker):', error.message);

        // Aseguramos que esté en la cola de sincronización
        if (get().addToSyncQueue) {
          get().addToSyncQueue({
            endpoint: '/workouts',
            options: {
              method: 'POST',
              body: finalWorkoutData
            }
          });
        }

        // Marcamos la rutina como completada en local para hoy
        if (workoutData.routineId) {
          const current = get().completedRoutineIdsToday || [];
          const normId = workoutData.routineId;
          if (!current.some(id => String(id) === String(normId))) {
            const updated = [...current, normId];
            set({ completedRoutineIdsToday: updated });
            try {
              const todayStr = formatDateForQuery(new Date());
              localStorage.setItem('pro_fitness_completed_routines_today', JSON.stringify({
                date: todayStr,
                ids: updated
              }));
            } catch (e) {
              console.warn('Error saving completed routines to storage', e);
            }
          }
        }

        // Limpiamos el entrenamiento activo en el dispositivo
        clearWorkoutInStorage();
        clearRestTimerInStorage();
        stopNativeTimer();

        return {
          success: true,
          isOffline: true,
          message: 'Entrenamiento guardado en tu móvil. Se sincronizará automáticamente al recuperar conexión.',
          finalWorkoutData
        };
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
    const currentCompleted = getCompletedRoutinesFromStorage();
    set({
      ...initialState,
      completedRoutineIdsToday: currentCompleted,
      plannedRestTime: null
    });
  },
});
