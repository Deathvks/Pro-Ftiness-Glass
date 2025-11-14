/* frontend/src/store/workoutSlice.js */
import * as workoutService from '../services/workoutService';

// --- FUNCIONES DE ALMACENAMIENTO LOCAL ---
// (Funciones de localStorage sin cambios)
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
    const restTimerEndTime = JSON.parse(
      localStorage.getItem('restTimerEndTime')
    );
    if (isResting && restTimerEndTime && Date.now() < restTimerEndTime) {
      return {
        isResting,
        restTimerEndTime,
        restTimerInitialDuration: JSON.parse(
          localStorage.getItem('restTimerInitialDuration')
        ),
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
};
const clearRestTimerInStorage = () => {
  localStorage.removeItem('isResting');
  localStorage.removeItem('restTimerEndTime');
  localStorage.removeItem('restTimerInitialDuration');
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

      // (Esta modificación tuya anterior se mantiene)
      const exerciseDetails = {
        ...(fullDetails || {}), // 1. Base (name, description_es, etc.)
        name: exerciseKeyName, // 2. Aseguramos el 'name' (clave del título)

        // 3. ¡LA CORRECCIÓN!
        // Creamos un campo 'description' unificado que el modal SÍ espera.
        description:
          fullDetails?.description_es || fullDetails?.description || null,

        // 4. Sobrescribimos con media específica de la rutina si existe
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

        // Asignamos el objeto COMPLETO Y NORMALIZADO
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

  // Inicia una sesión de entrenamiento simple (ej. Cardio).
  startSimpleWorkout: (workoutName) => {
    // ... (sin cambios) ...
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

  // Pausa o reanuda el cronómetro del entrenamiento.
  togglePauseWorkout: () => {
    // ... (sin cambios) ...
    const { isWorkoutPaused, workoutStartTime, workoutAccumulatedTime } = get();
    let newState;
    if (!workoutStartTime) {
      // Primera vez que se inicia
      newState = { isWorkoutPaused: false, workoutStartTime: Date.now() };
    } else if (isWorkoutPaused) {
      // Reanudar
      newState = { isWorkoutPaused: false, workoutStartTime: Date.now() };
    } else {
      // Pausar
      const elapsed = Date.now() - workoutStartTime;
      newState = {
        isWorkoutPaused: true,
        workoutAccumulatedTime: workoutAccumulatedTime + elapsed,
      };
    }
    set(newState);
    setWorkoutInStorage({ ...get(), ...newState });
  },

  // Detiene y limpia completely el entrenamiento activo.
  stopWorkout: () => {
    // ... (sin cambios) ...
    get().clearWorkoutState();
  },

  // Actualiza los datos de una serie específica.
  updateActiveWorkoutSet: (exIndex, setIndex, field, value) => {
    // ... (sin cambios) ...
    const session = get().activeWorkout;
    if (!session) return;
    const newExercises = JSON.parse(JSON.stringify(session.exercises));

    // (Esta modificación tuya anterior se mantiene)
    newExercises[exIndex].setsDone[setIndex][field] = value;

    const newState = {
      activeWorkout: { ...session, exercises: newExercises },
    };
    set(newState);
    setWorkoutInStorage({ ...get(), ...newState });
  },

  // Añade un dropset después de una serie.
  addDropset: (exIndex, setIndex) => {
    // ... (sin cambios) ...
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

  // Elimina un dropset.
  removeDropset: (exIndex, setIndex) => {
    // ... (sin cambios) ...
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

  // Reemplaza un ejercicio en la sesión activa.
  replaceExercise: (exIndex, newExercise) => {
    const session = get().activeWorkout;
    if (!session) return;
    const newExercises = JSON.parse(JSON.stringify(session.exercises));
    const oldExercise = newExercises[exIndex];

    // --- INICIO DE LA MODIFICACIÓN ---
    // 'newExercise' es el objeto completo de la BBDD.
    // Debemos aplicar la misma normalización que en 'startWorkout'
    // para que los componentes (ej. modal) lo muestren correctamente.
    const normalizedDetails = {
      ...newExercise,
      // 1. Normalizamos la descripción (el modal espera 'description')
      description: newExercise.description_es || newExercise.description || null,
      // 2. La media (image_url, video_url) ya está correcta
      //    gracias al spread (...newExercise).
    };
    // --- FIN DE LA MODIFICACIÓN ---

    newExercises[exIndex] = {
      ...oldExercise,
      name: newExercise.name,
      // exercise_details: newExercise, // <-- LÍNEA ANTIGUA CON BUG
      exercise_details: normalizedDetails, // <-- LÍNEA CORREGIDA

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

  // (Esta modificación tuya anterior se mantiene)
  updateActiveExerciseDetails: (exerciseKeyName, fullDetails) => {
    const session = get().activeWorkout;
    if (!session) return;

    const newExercises = session.exercises.map((ex) => {
      if (ex.name === exerciseKeyName) {
        const updatedDetails = {
          ...ex.exercise_details, // Mantiene media específica
          ...fullDetails, // Añade lo que faltaba
          name: exerciseKeyName, // Asegura la clave
          // NORMALIZACIÓN: Aseguramos que 'description' esté aquí también
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

  // Abre el modal y guarda el tiempo de descanso planificado
  openRestModal: (plannedTime) =>
    set({
      // ... (sin cambios) ...
      isResting: true,
      plannedRestTime: plannedTime || 90, // 90s por defecto si no se pasa
    }),

  // Inicia el temporizador de descanso.
  startRestTimer: (durationInSeconds) => {
    // ... (sin cambios) ...
    const newState = {
      isResting: true,
      restTimerEndTime: Date.now() + durationInSeconds * 1000,
      restTimerInitialDuration: durationInSeconds,
    };
    set(newState);
    setRestTimerInStorage(newState);
  },

  // Añade o resta tiempo al temporizador de descanso actual.
  addRestTime: (secondsToAdd) => {
    // ... (sin cambios) ...
    set((state) => {
      if (!state.restTimerEndTime) return {};
      const newEndTime = state.restTimerEndTime + secondsToAdd * 1000;
      const newInitial = (state.restTimerInitialDuration || 0) + secondsToAdd;
      const newState = {
        restTimerEndTime: Math.max(Date.now(), newEndTime),
        restTimerInitialDuration: Math.max(1, newInitial),
      };
      setRestTimerInStorage({ ...state, ...newState });
      return newState;
    });
  },

  // Resetea el tiempo de descanso pero mantiene el modal abierto.
  resetRestTimer: () => {
    // ... (sin cambios) ...
    clearRestTimerInStorage();
    set({ restTimerEndTime: null, restTimerInitialDuration: null });
  },

  // Detiene y cierra el temporizador de descanso.
  stopRestTimer: () => {
    // ... (sin cambios) ...
    clearRestTimerInStorage();
    set({
      isResting: false,
      restTimerEndTime: null,
      restTimerInitialDuration: null,
      plannedRestTime: null,
    });
  },

  // Guarda el entrenamiento en el backend.
  logWorkout: async (workoutData) => {
    // ... (sin cambios) ...
    try {
      const responseData = await workoutService.logWorkout(workoutData);
      if (responseData.newPRs && responseData.newPRs.length > 0) {
        // Comportamiento existente: mostrar Toast in-app
        get().showPRNotification(responseData.newPRs);

        // (Esta modificación tuya anterior se mantiene)
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

  // Elimina un log de entrenamiento.
  deleteWorkoutLog: async (workoutId) => {
    // ... (sin cambios) ...
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

  // (Esta modificación tuya anterior se mantiene)
  _showLocalPRNotification: async (newPRs) => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('Notificaciones no soportadas por el navegador.');
      return;
    }

    try {
      const permission = Notification.permission;
      // Solo actuar si el permiso ya está concedido. No lo pedimos aquí.
      if (permission !== 'granted') {
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        console.error('Service Worker no está listo para la notificación.');
        return;
      }

      // Crear el mensaje
      const title = '¡Nuevo Récord Personal!';
      const body =
        newPRs.length === 1
          ? `¡Has conseguido un nuevo PR en tu entrenamiento!`
          : `¡Felicidades! Has conseguido ${newPRs.length} nuevos PRs.`;

      const options = {
        body: body,
        icon: '/pwa-192x192.webp', // Icono por defecto
        badge: '/pwa-192x192.webp', // Icono para Android
        tag: 'pr-notification', // Agrupa notificaciones de PRs
        data: {
          url: '/progress', // URL que abrirá el SW al hacer click
        },
      };

      // Mostrar la notificación
      await registration.showNotification(title, options);
    } catch (err) {
      console.error('Error al mostrar notificación local de PR:', err);
    }
  },

  // Resetea el estado del workout.
  clearWorkoutState: () => {
    // ... (sin cambios) ...
    clearWorkoutInStorage();
    clearRestTimerInStorage();
    set({ ...initialState, plannedRestTime: null });
  },
});