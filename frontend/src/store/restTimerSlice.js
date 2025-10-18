import {
    getRestTimerStateFromStorage,
    setRestTimerInStorage,
    clearRestTimerInStorage
} from './workoutLocalStorage';

// Estado inicial para el temporizador de descanso, cargado desde localStorage
const initialRestTimerState = {
    isResting: false,
    restTimerEndTime: null,
    restTimerInitialDuration: null,
    ...(getRestTimerStateFromStorage()),
};

// Slice para gestionar el temporizador de descanso
export const createRestTimerSlice = (set, get) => ({
    ...initialRestTimerState,

    // Abre el modal de selección de tiempo de descanso.
    openRestModal: () => set({ isResting: true }), // Mantiene isResting para mostrar el modal

    // Inicia el temporizador de descanso.
    startRestTimer: (durationInSeconds) => {
        const newState = {
            isResting: true, // Asegura que el modal permanezca abierto al iniciar
            restTimerEndTime: Date.now() + durationInSeconds * 1000,
            restTimerInitialDuration: durationInSeconds,
        };
        set(newState);
        setRestTimerInStorage(newState); // Guarda en localStorage
    },

    // Añade o resta tiempo al temporizador de descanso actual.
    addRestTime: (secondsToAdd) => {
        set((state) => {
            if (!state.restTimerEndTime) return {}; // No hacer nada si no hay timer activo
            const newEndTime = state.restTimerEndTime + secondsToAdd * 1000;
            const newInitialDuration = (state.restTimerInitialDuration || 0) + secondsToAdd;
            const newState = {
                restTimerEndTime: Math.max(Date.now(), newEndTime), // No permitir tiempo negativo
                restTimerInitialDuration: Math.max(1, newInitialDuration), // Mínimo 1 segundo
            };
            setRestTimerInStorage({ ...state, ...newState }); // Guardar en localStorage
            return newState;
        });
    },

    // Resetea el tiempo de descanso pero mantiene el modal abierto (isResting = true).
    resetRestTimer: () => {
        clearRestTimerInStorage();
        // Mantenemos isResting true para que el modal no se cierre,
        // pero reseteamos los valores del temporizador.
        set({ isResting: true, restTimerEndTime: null, restTimerInitialDuration: null });
    },

    // Detiene y cierra el temporizador de descanso.
    stopRestTimer: () => {
        clearRestTimerInStorage();
        // Ponemos isResting a false para cerrar el modal.
        set({ isResting: false, restTimerEndTime: null, restTimerInitialDuration: null });
    },

    // Limpia el estado del temporizador (usado al limpiar el workout completo).
    clearRestTimerState: () => {
        clearRestTimerInStorage();
        set(initialRestTimerState); // Resetea al estado inicial vacío
    }
});