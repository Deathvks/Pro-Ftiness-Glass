import * as workoutService from '../services/workoutService';
import { getWorkoutStateFromStorage, setWorkoutInStorage, clearWorkoutInStorage } from './workoutLocalStorage';

// Estado inicial relacionado con las acciones principales del workout
const initialWorkoutActionsState = {
    activeWorkout: null,
    workoutStartTime: null,
    isWorkoutPaused: true, // Empezar pausado por defecto si no hay workout cargado
    workoutAccumulatedTime: 0,
    ...(getWorkoutStateFromStorage()), // Cargar estado persistido
};

// Slice para gestionar las acciones principales del workout
export const createWorkoutActionsSlice = (set, get) => ({
    ...initialWorkoutActionsState,

    // Comprueba si hay un workout persistido en localStorage y lo carga si es necesario.
    checkForPersistedWorkout: () => {
        try {
            const storedState = getWorkoutStateFromStorage();
            if (storedState.activeWorkout && !get().activeWorkout) {
                console.log("Found persisted workout, restoring state:", storedState);
                set(storedState); // Restaura el estado
            } else if (!storedState.activeWorkout && get().activeWorkout) {
                 console.warn("Workout in memory but not in storage, clearing memory state.");
                 get().clearWorkoutState(); // Limpia estado en memoria si no coincide
            } else {
                 console.log("No persisted workout found or already loaded.");
            }
        } catch (error) {
            console.error("Error checking for persisted workout:", error);
            get().clearWorkoutState(); // Limpia todo si hay error al cargar
        }
    },

    // Inicia una sesión de entrenamiento a partir de una rutina o plantilla.
    startWorkout: (routine) => {
        // Extrae los ejercicios independientemente de si vienen de una rutina normal o plantilla
        const exercisesSource = routine.RoutineExercises || routine.TemplateRoutineExercises || [];

        // --- INICIO DE LA MODIFICACIÓN (Unique tempId) ---
        const exercises = exercisesSource.map((ex, index) => ({
            // Mantenemos el id original si existe (puede ser útil para referencias)
            originalId: ex.id || null,
            // Creamos un tempId único para esta sesión específica
            tempId: `session-ex-${Date.now()}-${index}-${Math.random().toString(36).substring(7)}`,
            exercise_list_id: ex.exercise_list_id || null,
            name: ex.name,
            muscle_group: ex.muscle_group || '',
            sets: ex.sets,
            reps: ex.reps,
            superset_group_id: ex.superset_group_id || null,
            exercise_order: ex.exercise_order !== undefined ? ex.exercise_order : 0,
            // Crea las series vacías a completar
            setsDone: Array.from({ length: ex.sets }, (_, i) => ({
                set_number: i + 1,
                reps: '',
                weight_kg: '',
                set_type: null, // Tipo de serie (null = normal)
            }))
        }));
        // --- FIN DE LA MODIFICACIÓN ---

        const newState = {
            activeWorkout: {
                routineId: routine.id || null, // ID de la rutina original (si existe)
                routineName: routine.name,
                exercises // Usar los ejercicios con el nuevo tempId
            },
            workoutStartTime: null, // No iniciar crono automáticamente
            isWorkoutPaused: true,  // Empezar pausado
            workoutAccumulatedTime: 0,
        };
        set(newState);
        setWorkoutInStorage(newState); // Guardar en localStorage
        get().clearRestTimerState();   // Limpiar timer de descanso al empezar nuevo workout
    },

    // Inicia una sesión de entrenamiento simple (ej. Cardio).
    startSimpleWorkout: (workoutName) => {
        const newState = {
            activeWorkout: {
                routineId: null, // No asociado a rutina
                routineName: workoutName,
                exercises: [] // Sin ejercicios predefinidos
            },
            workoutStartTime: null, // No iniciar crono automáticamente
            isWorkoutPaused: true,  // Empezar pausado
            workoutAccumulatedTime: 0,
        };
        set(newState);
        setWorkoutInStorage(newState);
        get().clearRestTimerState(); // Limpiar timer de descanso
    },

    // Pausa o reanuda el cronómetro del entrenamiento.
    togglePauseWorkout: () => {
        const { isWorkoutPaused, workoutStartTime, workoutAccumulatedTime } = get();
        let newState;
        if (!workoutStartTime && isWorkoutPaused) { // Primera vez que se inicia (play desde estado pausado inicial)
            newState = { isWorkoutPaused: false, workoutStartTime: Date.now(), workoutAccumulatedTime: workoutAccumulatedTime };
        } else if (isWorkoutPaused) { // Reanudar
            newState = { isWorkoutPaused: false, workoutStartTime: Date.now() }; // El tiempo acumulado ya está guardado
        } else { // Pausar
            const elapsed = Date.now() - workoutStartTime;
            newState = { isWorkoutPaused: true, workoutAccumulatedTime: workoutAccumulatedTime + elapsed, workoutStartTime: null }; // Acumula tiempo y resetea startTime
        }
        set(newState);
        setWorkoutInStorage({ ...get(), ...newState }); // Guardar el estado completo actualizado
    },

    // Detiene y limpia completamente el entrenamiento activo.
    stopWorkout: () => {
        get().clearWorkoutState(); // Llama a la acción que limpia todo
    },

    // Guarda el entrenamiento en el backend.
    logWorkout: async (workoutData) => {
        try {
            // Prepara los datos asegurándose que set_type se envía correctamente
            const preparedData = {
                ...workoutData,
                details: workoutData.details.map(ex => ({
                    ...ex,
                    // Filtra series vacías y asegura que set_type sea null si no está definido
                    setsDone: ex.setsDone
                        .filter(set => set.reps !== '' || set.weight_kg !== '') // Considerar series vacías si tienen tipo?
                        .map(set => ({
                            set_number: set.set_number,
                            reps: set.reps === '' ? 0 : parseInt(set.reps, 10) || 0, // Enviar 0 si está vacío o no es número
                            weight_kg: set.weight_kg === '' ? 0 : parseFloat(set.weight_kg) || 0, // Enviar 0 si está vacío o no es número
                            set_type: set.set_type || null // Asegura que se envía null si no hay tipo
                        }))
                }))
                // Filtra ejercicios que no tengan ninguna serie registrada (importante si se edita y vacían todas)
                .filter(ex => ex.setsDone.length > 0)
            };

            // Validar si hay algo que guardar después de filtrar
            if (preparedData.details.length === 0 && workoutData.details?.length > 0) { // Comprobamos si había ejercicios originalmente
                 // Si había ejercicios pero todos quedaron vacíos
                 return { success: false, message: 'No se registraron datos en ninguna serie.' };
            }

            const responseData = await workoutService.logWorkout(preparedData);

            // Mostrar notificación de PR si existe
            if (responseData.newPRs && responseData.newPRs.length > 0) {
                get().showPRNotification(responseData.newPRs); // Asume que existe en dataSlice
            }

            get().clearWorkoutState();      // Limpia el estado local DESPUÉS de guardar
            await get().fetchInitialData(); // Refresca datos generales (asume existe en dataSlice)
            return { success: true, message: 'Entrenamiento guardado.' };
        } catch (error) {
            console.error("Error logging workout:", error);
            // Devuelve un mensaje de error genérico o específico si es posible
            return { success: false, message: `Error al guardar: ${error.message || 'Error desconocido'}` };
        }
    },

    // Elimina un log de entrenamiento del historial.
    deleteWorkoutLog: async (workoutId) => {
        try {
            await workoutService.deleteWorkout(workoutId);
            await get().fetchInitialData(); // Refresca datos generales (asume existe en dataSlice)
            return { success: true, message: 'Entrenamiento eliminado.' };
        } catch (error) {
            console.error("Error deleting workout log:", error);
            return { success: false, message: `Error al eliminar: ${error.message || 'Error desconocido'}` };
        }
    },

    // Resetea completamente el estado del workout (memoria y localStorage).
    clearWorkoutState: () => {
        clearWorkoutInStorage();    // Limpia localStorage del workout
        get().clearRestTimerState(); // Limpia estado y localStorage del timer de descanso
        set(initialWorkoutActionsState); // Resetea el estado en memoria a su valor inicial
    },
});