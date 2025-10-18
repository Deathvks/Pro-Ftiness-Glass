import { createWorkoutActionsSlice } from './workoutActionsSlice';
import { createWorkoutSessionSlice } from './workoutSessionSlice';
import { createRestTimerSlice } from './restTimerSlice';

// Combina los diferentes slices relacionados con el workout en uno solo.
// Cada 'create...Slice' función recibe 'set' y 'get' de Zustand
// y devuelve un objeto con su estado inicial y acciones.
// Al usar el operador '...' se fusionan estos objetos en uno solo.
export const createWorkoutSlice = (set, get) => ({
    ...createWorkoutActionsSlice(set, get), // Estado y acciones generales del workout (start, stop, pause, log, etc.)
    ...createWorkoutSessionSlice(set, get), // Acciones para modificar la sesión activa (series, ejercicios)
    ...createRestTimerSlice(set, get),     // Estado y acciones del temporizador de descanso
});