import * as workoutService from '../services/workoutService';

// --- FUNCIONES DE ALMACENAMIENTO LOCAL ---

// Carga el estado del entrenamiento desde localStorage al iniciar.
const getWorkoutStateFromStorage = () => {
    try {
        const activeWorkout = JSON.parse(localStorage.getItem('activeWorkout'));
        if (!activeWorkout) return {};
        return {
            activeWorkout,
            workoutStartTime: JSON.parse(localStorage.getItem('workoutStartTime')),
            isWorkoutPaused: JSON.parse(localStorage.getItem('isWorkoutPaused')),
            workoutAccumulatedTime: JSON.parse(localStorage.getItem('workoutAccumulatedTime')),
        };
    } catch {
        clearWorkoutInStorage();
        return {};
    }
};

// Carga el estado del temporizador de descanso.
const getRestTimerStateFromStorage = () => {
    try {
        const isResting = JSON.parse(localStorage.getItem('isResting'));
        const restTimerEndTime = JSON.parse(localStorage.getItem('restTimerEndTime'));
        if (isResting && restTimerEndTime && Date.now() < restTimerEndTime) {
            return {
                isResting,
                restTimerEndTime,
                restTimerInitialDuration: JSON.parse(localStorage.getItem('restTimerInitialDuration')),
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
};

export const createWorkoutSlice = (set, get) => ({
    ...initialState,
    ...getWorkoutStateFromStorage(),
    ...getRestTimerStateFromStorage(),

    // Inicia una sesión de entrenamiento a partir de una rutina.
    startWorkout: (routine) => {
        const exercises = (routine.RoutineExercises || routine.TemplateRoutineExercises || []).map((ex) => ({
            ...ex,
            superset_group_id: ex.superset_group_id || null,
            exercise_order: ex.exercise_order !== undefined ? ex.exercise_order : 0,
            setsDone: Array.from({ length: ex.sets }, (_, i) => ({
                set_number: i + 1,
                reps: '',
                weight_kg: '',
                is_dropset: false,
            }))
        }));

        const newState = {
            activeWorkout: { routineId: routine.id || null, routineName: routine.name, exercises },
            workoutStartTime: null,
            isWorkoutPaused: true,
            workoutAccumulatedTime: 0,
        };
        set(newState);
        setWorkoutInStorage(newState);
    },

    // Inicia una sesión de entrenamiento simple (ej. Cardio).
    startSimpleWorkout: (workoutName) => {
        const newState = {
            activeWorkout: { routineId: null, routineName: workoutName, exercises: [] },
            workoutStartTime: null,
            isWorkoutPaused: true,
            workoutAccumulatedTime: 0,
        };
        set(newState);
        setWorkoutInStorage(newState);
    },

    // Pausa o reanuda el cronómetro del entrenamiento.
    togglePauseWorkout: () => {
        const { isWorkoutPaused, workoutStartTime, workoutAccumulatedTime } = get();
        let newState;
        if (!workoutStartTime) { // Primera vez que se inicia
            newState = { isWorkoutPaused: false, workoutStartTime: Date.now() };
        } else if (isWorkoutPaused) { // Reanudar
            newState = { isWorkoutPaused: false, workoutStartTime: Date.now() };
        } else { // Pausar
            const elapsed = Date.now() - workoutStartTime;
            newState = { isWorkoutPaused: true, workoutAccumulatedTime: workoutAccumulatedTime + elapsed };
        }
        set(newState);
        setWorkoutInStorage({ ...get(), ...newState });
    },

    // Detiene y limpia completamente el entrenamiento activo.
    stopWorkout: () => {
        get().clearWorkoutState();
    },

    // Actualiza los datos de una serie específica.
    updateActiveWorkoutSet: (exIndex, setIndex, field, value) => {
        const session = get().activeWorkout;
        if (!session) return;

        const newExercises = JSON.parse(JSON.stringify(session.exercises));
        const parsedValue = value === '' ? '' : parseFloat(value);
        newExercises[exIndex].setsDone[setIndex][field] = isNaN(parsedValue) ? '' : parsedValue;

        const newState = { activeWorkout: { ...session, exercises: newExercises } };
        set(newState);
        setWorkoutInStorage({ ...get(), ...newState });
    },

    // Añade un dropset después de una serie.
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

        const newState = { activeWorkout: { ...session, exercises: newExercises } };
        set(newState);
        setWorkoutInStorage({ ...get(), ...newState });
    },

    // Elimina un dropset.
    removeDropset: (exIndex, setIndex) => {
        const session = get().activeWorkout;
        if (!session) return;

        const newExercises = JSON.parse(JSON.stringify(session.exercises));
        if (newExercises[exIndex].setsDone[setIndex]?.is_dropset) {
            newExercises[exIndex].setsDone.splice(setIndex, 1);
        }

        const newState = { activeWorkout: { ...session, exercises: newExercises } };
        set(newState);
        setWorkoutInStorage({ ...get(), ...newState });
    },

    // Reemplaza un ejercicio en la sesión activa.
    replaceExercise: (exIndex, newExercise) => {
        const session = get().activeWorkout;
        if (!session) return;

        const newExercises = JSON.parse(JSON.stringify(session.exercises));
        const oldExercise = newExercises[exIndex];
        newExercises[exIndex] = {
            ...oldExercise,
            exercise_list_id: newExercise.id,
            name: newExercise.name,
            muscle_group: newExercise.muscle_group,
        };

        const newState = { activeWorkout: { ...session, exercises: newExercises } };
        set(newState);
        setWorkoutInStorage({ ...get(), ...newState });
    },

    // Abre el modal de selección de tiempo de descanso.
    openRestModal: () => set({ isResting: true }),

    // Inicia el temporizador de descanso.
    startRestTimer: (durationInSeconds) => {
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
        clearRestTimerInStorage();
        set({ restTimerEndTime: null, restTimerInitialDuration: null });
    },

    // Detiene y cierra el temporizador de descanso.
    stopRestTimer: () => {
        clearRestTimerInStorage();
        set({ isResting: false, restTimerEndTime: null, restTimerInitialDuration: null });
    },

    // Guarda el entrenamiento en el backend.
    logWorkout: async (workoutData) => {
        try {
            const responseData = await workoutService.logWorkout(workoutData);
            if (responseData.newPRs && responseData.newPRs.length > 0) {
                get().showPRNotification(responseData.newPRs);
            }
            // get().stopWorkout(); // <-- ¡CAMBIO AQUÍ! COMENTAMOS ESTA LÍNEA
            // await get().fetchInitialData(); // <-- REMOVE THIS LINE
            return { success: true, message: 'Entrenamiento guardado.' };
        } catch (error) {
            return { success: false, message: `Error al guardar: ${error.message}` };
        }
    },

    // Elimina un log de entrenamiento.
    deleteWorkoutLog: async (workoutId) => {
        try {
            await workoutService.deleteWorkout(workoutId);
            await get().fetchInitialData();
            return { success: true, message: 'Entrenamiento eliminado.' };
        } catch (error) {
            return { success: false, message: `Error al eliminar: ${error.message}` };
        }
    },

    // Resetea el estado del workout.
    clearWorkoutState: () => {
        clearWorkoutInStorage();
        clearRestTimerInStorage();
        set(initialState);
    }
});