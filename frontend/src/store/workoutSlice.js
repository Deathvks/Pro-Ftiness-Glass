import * as workoutService from '../services/workoutService';

// --- FUNCIONES DE ALMACENAMIENTO LOCAL ---

// Carga el estado del entrenamiento desde localStorage al iniciar.
const getWorkoutStateFromStorage = () => {
    try {
        const activeWorkout = JSON.parse(localStorage.getItem('activeWorkout'));
        if (!activeWorkout) return {};
        // --- INICIO DE LA MODIFICACIÓN ---
        // Asegurarse de que los valores numéricos se parsean correctamente
        const workoutStartTime = JSON.parse(localStorage.getItem('workoutStartTime') || 'null');
        const workoutAccumulatedTime = JSON.parse(localStorage.getItem('workoutAccumulatedTime') || '0');
        const isWorkoutPaused = JSON.parse(localStorage.getItem('isWorkoutPaused') || 'true'); // Default to paused if found

        // Validar que los datos cargados tienen sentido
        if (typeof workoutStartTime !== 'number' && workoutStartTime !== null) {
             throw new Error("Invalid workoutStartTime in localStorage");
        }
         if (typeof workoutAccumulatedTime !== 'number') {
             throw new Error("Invalid workoutAccumulatedTime in localStorage");
        }
         if (typeof isWorkoutPaused !== 'boolean') {
             throw new Error("Invalid isWorkoutPaused in localStorage");
        }

        return {
            activeWorkout,
            workoutStartTime,
            isWorkoutPaused,
            workoutAccumulatedTime,
        };
        // --- FIN DE LA MODIFICACIÓN ---
    } catch (err){
        console.error("Error loading workout state from storage:", err);
        clearWorkoutInStorage(); // Limpiar si hay error
        return {};
    }
};

// Carga el estado del temporizador de descanso.
const getRestTimerStateFromStorage = () => {
    try {
        const isResting = JSON.parse(localStorage.getItem('isResting') || 'false');
        const restTimerEndTime = JSON.parse(localStorage.getItem('restTimerEndTime') || 'null');
        const restTimerInitialDuration = JSON.parse(localStorage.getItem('restTimerInitialDuration') || 'null');

        // Validar datos cargados
        if (typeof isResting !== 'boolean' || (isResting && typeof restTimerEndTime !== 'number')) {
            throw new Error("Invalid rest timer state in localStorage");
        }
        if (isResting && Date.now() < restTimerEndTime) {
            return {
                isResting,
                restTimerEndTime,
                restTimerInitialDuration,
            };
        }
        clearRestTimerInStorage();
        return {};
    } catch (err) {
         console.error("Error loading rest timer state from storage:", err);
        clearRestTimerInStorage(); // Limpiar si hay error
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
    isWorkoutPaused: false, // Iniciar como no pausado si no hay workout
    workoutAccumulatedTime: 0,
    isResting: false,
    restTimerEndTime: null,
    restTimerInitialDuration: null,
    // --- INICIO DE LA MODIFICACIÓN ---
    // Cargar estado inicial desde localStorage al crear el slice
    ...(getWorkoutStateFromStorage()),
    ...(getRestTimerStateFromStorage()),
    // --- FIN DE LA MODIFICACIÓN ---
};


export const createWorkoutSlice = (set, get) => ({
    ...initialState,

    // --- INICIO DE LA MODIFICACIÓN ---
    // Nueva función para comprobar y cargar workout persistido
    checkForPersistedWorkout: () => {
        try {
            const storedState = getWorkoutStateFromStorage();
            if (storedState.activeWorkout && !get().activeWorkout) {
                console.log("Found persisted workout, restoring state:", storedState);
                // Restaurar el estado encontrado en localStorage
                set(storedState);
                // Opcional: Mostrar un toast informando al usuario
                // get().addToast('Entrenamiento anterior recuperado.', 'info');
            } else if (!storedState.activeWorkout && get().activeWorkout) {
                 // Si no hay nada en storage pero sí en memoria, limpiar memoria (caso raro)
                 console.warn("Workout in memory but not in storage, clearing memory state.");
                 get().clearWorkoutState();
            } else {
                 console.log("No persisted workout found or already loaded.");
            }
        } catch (error) {
            console.error("Error checking for persisted workout:", error);
            // Si hay un error al cargar, limpiar todo para evitar estado corrupto
            get().clearWorkoutState();
        }
    },
    // --- FIN DE LA MODIFICACIÓN ---

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
            workoutStartTime: null, // No iniciar crono automáticamente
            isWorkoutPaused: true,  // Empezar pausado
            workoutAccumulatedTime: 0,
        };
        set(newState);
        setWorkoutInStorage(newState);
        // Limpiar temporizador de descanso al empezar nuevo workout
        get().stopRestTimer();
    },

    // Inicia una sesión de entrenamiento simple (ej. Cardio).
    startSimpleWorkout: (workoutName) => {
        const newState = {
            activeWorkout: { routineId: null, routineName: workoutName, exercises: [] },
            workoutStartTime: null, // No iniciar crono automáticamente
            isWorkoutPaused: true,  // Empezar pausado
            workoutAccumulatedTime: 0,
        };
        set(newState);
        setWorkoutInStorage(newState);
         // Limpiar temporizador de descanso al empezar nuevo workout
        get().stopRestTimer();
    },

    // Pausa o reanuda el cronómetro del entrenamiento.
    togglePauseWorkout: () => {
        const { isWorkoutPaused, workoutStartTime, workoutAccumulatedTime } = get();
        let newState;
        if (!workoutStartTime) { // Primera vez que se inicia (play desde estado pausado inicial)
            newState = { isWorkoutPaused: false, workoutStartTime: Date.now(), workoutAccumulatedTime: workoutAccumulatedTime }; // Mantiene el tiempo acumulado (debería ser 0)
        } else if (isWorkoutPaused) { // Reanudar
            // Iniciar tiempo desde ahora, el tiempo acumulado ya está guardado
            newState = { isWorkoutPaused: false, workoutStartTime: Date.now() };
        } else { // Pausar
            const elapsed = Date.now() - workoutStartTime;
            // Guardar el tiempo acumulado + el recién transcurrido, poner startTime a null
            newState = { isWorkoutPaused: true, workoutAccumulatedTime: workoutAccumulatedTime + elapsed, workoutStartTime: null };
        }
        set(newState);
        // Guardar el estado completo actualizado en localStorage
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

        // --- INICIO DE LA MODIFICACIÓN ---
        // Asegurarse de que el valor vacío se guarda como tal, y los números como números
        let processedValue;
        if (value === '') {
            processedValue = '';
        } else {
             const numValue = parseFloat(value);
             processedValue = isNaN(numValue) ? '' : numValue; // Si no es número válido, guardar como vacío
        }
        newExercises[exIndex].setsDone[setIndex][field] = processedValue;
         // --- FIN DE LA MODIFICACIÓN ---

        const newState = { activeWorkout: { ...session, exercises: newExercises } };
        set(newState);
        setWorkoutInStorage({ ...get(), ...newState }); // Guardar en localStorage inmediatamente
    },


    // Añade un dropset después de una serie.
    addDropset: (exIndex, setIndex) => {
        const session = get().activeWorkout;
        if (!session) return;

        const newExercises = JSON.parse(JSON.stringify(session.exercises));
        const targetExercise = newExercises[exIndex];
        const parentSet = targetExercise.setsDone[setIndex];

        targetExercise.setsDone.splice(setIndex + 1, 0, {
            set_number: parentSet.set_number, // Mantiene el número de la serie padre visualmente
            reps: '',
            weight_kg: '',
            is_dropset: true,
        });

        // --- INICIO DE LA MODIFICACIÓN ---
        // Re-enumerar visualmente las series siguientes (solo para mostrar, no afecta set_number real)
        // Esto es opcional y puede complicar si se quieren borrar dropsets intermedios.
        // Por ahora, lo mantenemos simple: el 'set_number' del dropset es el del padre.
        // --- FIN DE LA MODIFICACIÓN ---

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

             // --- INICIO DE LA MODIFICACIÓN ---
            // Re-enumerar visualmente si es necesario (opcional)
            // --- FIN DE LA MODIFICACIÓN ---

            const newState = { activeWorkout: { ...session, exercises: newExercises } };
            set(newState);
            setWorkoutInStorage({ ...get(), ...newState });
        } else {
            console.warn("Attempted to remove a non-dropset set using removeDropset");
        }
    },


    // Reemplaza un ejercicio en la sesión activa.
    replaceExercise: (exIndex, newExercise) => {
        const session = get().activeWorkout;
        if (!session) return;

        const newExercises = JSON.parse(JSON.stringify(session.exercises));
        const oldExercise = newExercises[exIndex];
        // Crear nuevas 'setsDone' basadas en las series de la rutina (si existe) o mantener las antiguas
        const newSets = newExercise.sets ? Array.from({ length: newExercise.sets }, (_, i) => ({
            set_number: i + 1, reps: '', weight_kg: '', is_dropset: false
        })) : oldExercise.setsDone; // Mantener si el nuevo no especifica

        newExercises[exIndex] = {
            ...oldExercise, // Mantener superset_group_id, exercise_order si existen
            exercise_list_id: newExercise.id,
            name: newExercise.name,
            muscle_group: newExercise.muscle_group,
             // --- INICIO DE LA MODIFICACIÓN ---
            sets: newExercise.sets || oldExercise.sets, // Actualizar número de series
            reps: newExercise.reps || oldExercise.reps, // Actualizar reps objetivo
            setsDone: newSets, // Usar las nuevas setsDone creadas
            // --- FIN DE LA MODIFICACIÓN ---
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
            // --- INICIO DE LA MODIFICACIÓN ---
            // Asegurarse de que initialDuration se actualiza correctamente
            const newInitialDuration = (state.restTimerInitialDuration || 0) + secondsToAdd;
            const newState = {
                restTimerEndTime: Math.max(Date.now(), newEndTime), // No permitir tiempo negativo
                restTimerInitialDuration: Math.max(1, newInitialDuration), // Mínimo 1 segundo
            };
            setRestTimerInStorage({ ...state, ...newState }); // Guardar en localStorage
            return newState;
            // --- FIN DE LA MODIFICACIÓN ---
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
            get().stopWorkout(); // Limpia el estado local DESPUÉS de guardar
            await get().fetchInitialData(); // Refresca datos generales
            return { success: true, message: 'Entrenamiento guardado.' };
        } catch (error) {
            return { success: false, message: `Error al guardar: ${error.message}` };
        }
    },


    // Elimina un log de entrenamiento.
    deleteWorkoutLog: async (workoutId) => {
        try {
            await workoutService.deleteWorkout(workoutId);
            await get().fetchInitialData(); // Refresca datos generales
            return { success: true, message: 'Entrenamiento eliminado.' };
        } catch (error) {
            return { success: false, message: `Error al eliminar: ${error.message}` };
        }
    },

    // Resetea el estado del workout y limpia localStorage.
    clearWorkoutState: () => {
        clearWorkoutInStorage();
        clearRestTimerInStorage();
        // --- INICIO DE LA MODIFICACIÓN ---
        // Reiniciar al estado inicial base, sin recargar de localStorage
        set({
            activeWorkout: null,
            workoutStartTime: null,
            isWorkoutPaused: false,
            workoutAccumulatedTime: 0,
            isResting: false,
            restTimerEndTime: null,
            restTimerInitialDuration: null,
        });
         // --- FIN DE LA MODIFICACIÓN ---
    }
});