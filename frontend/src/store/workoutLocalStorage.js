// --- FUNCIONES DE ALMACENAMIENTO LOCAL ---

// Carga el estado del entrenamiento desde localStorage al iniciar.
export const getWorkoutStateFromStorage = () => {
    try {
        const activeWorkout = JSON.parse(localStorage.getItem('activeWorkout'));
        if (!activeWorkout) return {};
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
    } catch (err){
        console.error("Error loading workout state from storage:", err);
        clearWorkoutInStorage(); // Limpiar si hay error
        return {};
    }
};

// Carga el estado del temporizador de descanso.
export const getRestTimerStateFromStorage = () => {
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

// Guarda el estado completo del workout en localStorage.
export const setWorkoutInStorage = (state) => {
    if (state.activeWorkout) {
        localStorage.setItem('activeWorkout', JSON.stringify(state.activeWorkout));
        localStorage.setItem('workoutStartTime', JSON.stringify(state.workoutStartTime));
        localStorage.setItem('isWorkoutPaused', JSON.stringify(state.isWorkoutPaused));
        localStorage.setItem('workoutAccumulatedTime', JSON.stringify(state.workoutAccumulatedTime));
    } else {
        clearWorkoutInStorage();
    }
};

// Limpia el estado del workout de localStorage.
export const clearWorkoutInStorage = () => {
    localStorage.removeItem('activeWorkout');
    localStorage.removeItem('workoutStartTime');
    localStorage.removeItem('isWorkoutPaused');
    localStorage.removeItem('workoutAccumulatedTime');
};

// Guarda el estado del temporizador de descanso en localStorage.
export const setRestTimerInStorage = (state) => {
    if (state.isResting && state.restTimerEndTime) {
        localStorage.setItem('isResting', JSON.stringify(state.isResting));
        localStorage.setItem('restTimerEndTime', JSON.stringify(state.restTimerEndTime));
        localStorage.setItem('restTimerInitialDuration', JSON.stringify(state.restTimerInitialDuration));
    } else {
        clearRestTimerInStorage();
    }
};

// Limpia el estado del temporizador de descanso de localStorage.
export const clearRestTimerInStorage = () => {
    localStorage.removeItem('isResting');
    localStorage.removeItem('restTimerEndTime');
    localStorage.removeItem('restTimerInitialDuration');
};