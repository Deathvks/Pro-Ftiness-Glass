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
            workoutAccumulatedTime: JSON.parse(localStorage.getItem('workoutAccumulatedTime')),
        };
    } catch {
        clearWorkoutInStorage();
        return {};
    }
};
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
    plannedRestTime: null,
};

export const createWorkoutSlice = (set, get) => ({
    ...initialState,
    ...getWorkoutStateFromStorage(),
    ...getRestTimerStateFromStorage(), 

    // --- INICIO DE LA MODIFICACIÓN (YA LA TIENES) ---
    // Inicia una sesión de entrenamiento a partir de una rutina.
    // 1. Convertida a 'async'
    startWorkout: async (routine) => {
        // 2. Usamos la función segura 'getOrFetchAllExercises' y la esperamos (await)
        const allExercises = await get().getOrFetchAllExercises();
    // --- FIN DE LA MODIFICACIÓN (YA LA TIENES) ---

        const sortedExercises = [...(routine.RoutineExercises || routine.TemplateRoutineExercises || [])]
            .sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0));

        const exercises = sortedExercises.map((ex) => {
            // 'ex' es el ejercicio de la rutina (ej. RoutineExercises[0])
            // 'fullDetails' es el ejercicio de la lista maestra (allExercises)
            const fullDetails = allExercises.find(detail => detail.id === ex.exercise_list_id);
            
            // 'fullDetails.name' ES la clave (caótica) que usaremos para el TÍTULO
            const exerciseKeyName = fullDetails ? fullDetails.name : (ex.exercise?.name || ex.name);

            // --- INICIO DE LA MODIFICACIÓN (YA LA TIENES) ---
            // En lugar de crear un objeto 'newDetailsObject' limitado,
            // fusionamos 'fullDetails' (que tiene description_es) 
            // con las imágenes/videos específicos de la rutina ('ex').
            const exerciseDetails = {
                ...(fullDetails || {}), // 1. Base (name, description, description_es, etc.)
                name: exerciseKeyName,  // 2. Aseguramos el 'name' (clave del título)
                // 3. Sobrescribimos con media específica de la rutina si existe
                image_url: ex.image_url_start || fullDetails?.image_url, 
                video_url: ex.video_url || fullDetails?.video_url,
            };
            // --- FIN DE LA MODIFICACIÓN (YA LA TIENES) ---

            return {
                id: ex.id,
                // Forzamos que el 'name' principal del ejercicio también sea la CLAVE
                name: exerciseKeyName,
                sets: ex.sets,
                reps: ex.reps,
                superset_group_id: ex.superset_group_id || null,
                exercise_order: ex.exercise_order !== undefined ? ex.exercise_order : 0,
                rest_seconds: ex.rest_seconds !== undefined ? ex.rest_seconds : 90, 
                
                // Asignamos el objeto COMPLETO Y FUSIONADO
                exercise_details: exerciseDetails,

                setsDone: Array.from({ length: ex.sets }, (_, i) => ({
                    set_number: i + 1,
                    reps: '',
                    weight_kg: '',
                    is_dropset: false,
                }))
            };
        });

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
    // ... (sin cambios) ...
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
    // ... (sin cambios) ...
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
    // ... (sin cambios) ...
        get().clearWorkoutState();
    },

    // Actualiza los datos de una serie específica.
    updateActiveWorkoutSet: (exIndex, setIndex, field, value) => {
    // ... (sin cambios) ...
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
        const newState = { activeWorkout: { ...session, exercises: newExercises } };
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
        const newState = { activeWorkout: { ...session, exercises: newExercises } };
        set(newState);
        setWorkoutInStorage({ ...get(), ...newState });
    },

    // Reemplaza un ejercicio en la sesión activa.
    replaceExercise: (exIndex, newExercise) => {
    // ... (sin cambios) ...
        const session = get().activeWorkout;
        if (!session) return;
        const newExercises = JSON.parse(JSON.stringify(session.exercises));
        const oldExercise = newExercises[exIndex];
        
        newExercises[exIndex] = {
            ...oldExercise,
            name: newExercise.name,
            exercise_details: newExercise, 
            
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
        const newState = { activeWorkout: { ...session, exercises: newExercises } };
        set(newState);
        setWorkoutInStorage({ ...get(), ...newState });
    },

    // --- INICIO DE LA MODIFICACIÓN (YA LA TIENES) ---
    /**
     * Actualiza los 'exercise_details' de un ejercicio en el workout activo.
     * Esto es para que el modal pueda auto-corregir datos faltantes (ej. descripciones).
     * @param {string} exerciseKeyName - El 'name' (clave) del ejercicio a actualizar.
     * @param {object} fullDetails - El objeto completo de detalles del ejercicio.
     */
    updateActiveExerciseDetails: (exerciseKeyName, fullDetails) => {
        const session = get().activeWorkout;
        if (!session) return;

        // Creamos una nueva copia de los ejercicios
        const newExercises = session.exercises.map(ex => {
            // Buscamos el ejercicio por su 'name' (que es la clave única)
            if (ex.name === exerciseKeyName) {
                // Creamos un nuevo objeto de detalles, fusionando lo que ya teníamos
                // con los detalles completos que acabamos de encontrar.
                const updatedDetails = {
                    ...ex.exercise_details, // Mantiene media específica (video_url, etc.)
                    ...fullDetails,         // Añade lo que faltaba (description)
                    name: exerciseKeyName   // Asegura que la clave 'name' no cambie
                };
                
                // Devolvemos el ejercicio actualizado
                return {
                    ...ex,
                    exercise_details: updatedDetails
                };
            }
            // Devolvemos el resto de ejercicios sin cambios
            return ex;
        });

        // Actualizamos el estado y el localStorage
        const newState = { activeWorkout: { ...session, exercises: newExercises } };
        set(newState);
        setWorkoutInStorage({ ...get(), ...newState });
    },
    // --- FIN DE LA MODIFICACIÓN (YA LA TIENES) ---

    // Abre el modal y guarda el tiempo de descanso planificado
    openRestModal: (plannedTime) => set({ 
    // ... (sin cambios) ...
        isResting: true, 
        plannedRestTime: plannedTime || 90 // 90s por defecto si no se pasa
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
        set({ isResting: false, restTimerEndTime: null, restTimerInitialDuration: null, plannedRestTime: null });
    },

    // Guarda el entrenamiento en el backend.
    logWorkout: async (workoutData) => {
    // ... (sin cambios) ...
        try {
            const responseData = await workoutService.logWorkout(workoutData);
            if (responseData.newPRs && responseData.newPRs.length > 0) {
                get().showPRNotification(responseData.newPRs);
            }
            return { success: true, message: 'Entrenamiento guardado.' };
        } catch (error) {
            return { success: false, message: `Error al guardar: ${error.message}` };
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
            return { success: false, message: `Error al eliminar: ${error.message}` };
        }
    },

    // Resetea el estado del workout.
    clearWorkoutState: () => {
    // ... (sin cambios) ...
        clearWorkoutInStorage();
        clearRestTimerInStorage();
        set({...initialState, plannedRestTime: null});
    }
});