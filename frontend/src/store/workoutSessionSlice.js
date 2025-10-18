import { setWorkoutInStorage } from './workoutLocalStorage';

// Estado inicial: solo necesita saber sobre el workout activo (que hereda de workoutActionsSlice)
const initialWorkoutSessionState = {
    // El activeWorkout se gestiona principalmente en workoutActionsSlice,
    // pero las acciones aquí lo modificarán.
};

// Slice para gestionar la sesión de entrenamiento activa (ejercicios y series)
export const createWorkoutSessionSlice = (set, get) => ({
    ...initialWorkoutSessionState,

    // Actualiza los datos de una serie específica (peso, reps, tipo).
    updateActiveWorkoutSet: (exIndex, setIndex, field, value) => {
        const session = get().activeWorkout;
        if (!session || !session.exercises || !session.exercises[exIndex]?.setsDone?.[setIndex]) {
            console.error("Attempted to update a non-existent set");
            return;
        }

        // Crea una copia profunda para evitar mutaciones directas
        const newExercises = JSON.parse(JSON.stringify(session.exercises));
        const setToUpdate = newExercises[exIndex].setsDone[setIndex];

        // Procesa el valor: vacío como '', números como números, tipo como string/null
        let processedValue;
        if (field === 'set_type') {
            processedValue = value; // set_type es string o null
        } else if (value === '') {
            processedValue = ''; // Guardar vacíos como tal
        } else {
            const numValue = parseFloat(value);
            // Si no es un número válido, guardar como vacío, sino como número
            processedValue = isNaN(numValue) ? '' : numValue;
        }
        setToUpdate[field] = processedValue;

        // Actualiza el estado y guarda en localStorage
        const newState = { activeWorkout: { ...session, exercises: newExercises } };
        set(newState);
        setWorkoutInStorage({ ...get(), ...newState }); // Guardar estado completo actualizado
    },


    // Añade una serie de tipo avanzado (ej. Dropset) después de una serie existente.
    addAdvancedSet: (exIndex, setIndex, setType = 'dropset') => {
        const session = get().activeWorkout;
        if (!session || !session.exercises || !session.exercises[exIndex]?.setsDone?.[setIndex]) {
            console.error("Attempted to add advanced set after non-existent set");
            return;
        }

        const newExercises = JSON.parse(JSON.stringify(session.exercises));
        const targetExercise = newExercises[exIndex];
        const parentSet = targetExercise.setsDone[setIndex];

        // Inserta la nueva serie justo después de la serie padre
        targetExercise.setsDone.splice(setIndex + 1, 0, {
            set_number: parentSet.set_number, // Mantiene el número visual de la serie padre
            reps: '',
            weight_kg: '',
            set_type: setType, // Marca el tipo de serie avanzada
        });

        // Actualiza el estado y guarda en localStorage
        const newState = { activeWorkout: { ...session, exercises: newExercises } };
        set(newState);
        setWorkoutInStorage({ ...get(), ...newState });
    },

    // Elimina una serie avanzada O resetea el tipo de una serie normal marcada como avanzada.
    removeSetTypeOrAdvancedSet: (exIndex, setIndex) => {
        const session = get().activeWorkout;
        if (!session || !session.exercises || !session.exercises[exIndex]?.setsDone?.[setIndex]) {
            console.error("Attempted to remove type from non-existent set");
            return;
        }

        const newExercises = JSON.parse(JSON.stringify(session.exercises));
        const exerciseSets = newExercises[exIndex].setsDone;
        const setToModify = exerciseSets[setIndex];

        // Verifica si la serie es una avanzada añadida dinámicamente
        // (mismo set_number que la anterior Y tiene un set_type)
        const isDynamicallyAddedAdvancedSet = setIndex > 0
            && exerciseSets[setIndex - 1]?.set_number === setToModify.set_number
            && setToModify.set_type;

        if (isDynamicallyAddedAdvancedSet) {
            // Si fue añadida dinámicamente, la eliminamos
            exerciseSets.splice(setIndex, 1);
        } else if (setToModify.set_type) {
            // Si es la serie original pero marcada como avanzada, solo reseteamos el tipo
            setToModify.set_type = null;
        } else {
            console.warn("Attempted to remove type from a normal set.");
            return; // No hacer nada si es una serie normal sin tipo
        }

        // Actualiza el estado y guarda en localStorage
        const newState = { activeWorkout: { ...session, exercises: newExercises } };
        set(newState);
        setWorkoutInStorage({ ...get(), ...newState });
    },


    // Reemplaza un ejercicio completo en la sesión activa.
    replaceExercise: (exIndex, newExerciseData) => {
        const session = get().activeWorkout;
        if (!session || !session.exercises || !session.exercises[exIndex]) {
            console.error("Attempted to replace a non-existent exercise");
            return;
        }

        const newExercises = JSON.parse(JSON.stringify(session.exercises));
        const oldExercise = newExercises[exIndex];

        // Determina el número de series para el nuevo ejercicio
        const numSets = newExerciseData.sets || oldExercise.sets || 3; // Usa nuevo, viejo, o 3 por defecto

        // Crea las nuevas series vacías
        const newSetsDone = Array.from({ length: numSets }, (_, i) => ({
            set_number: i + 1,
            reps: '',
            weight_kg: '',
            set_type: null,
        }));

        // Actualiza los datos del ejercicio en el índice correspondiente
        newExercises[exIndex] = {
            ...oldExercise, // Mantiene superset_group_id, exercise_order si existen
            exercise_list_id: newExerciseData.id || null, // ID de la lista de ejercicios si existe
            name: newExerciseData.name,
            muscle_group: newExerciseData.muscle_group || oldExercise.muscle_group || '', // Actualiza grupo muscular
            sets: numSets, // Actualiza número de series objetivo
            reps: newExerciseData.reps || oldExercise.reps || '', // Actualiza reps objetivo
            setsDone: newSetsDone, // Reemplaza las series a completar
        };

        // Actualiza el estado y guarda en localStorage
        const newState = { activeWorkout: { ...session, exercises: newExercises } };
        set(newState);
        setWorkoutInStorage({ ...get(), ...newState });
    },
});