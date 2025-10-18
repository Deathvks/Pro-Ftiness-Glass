import { create } from 'zustand';
import { createAuthSlice } from './authSlice';
import { createDataSlice } from './dataSlice';
// Importa el creador del slice combinado de workout
import { createWorkoutSlice } from './workoutSlice';

// El store principal ahora combina los slices de Auth, Data y el Workout combinado
const useAppStore = create((set, get) => ({
    ...createAuthSlice(set, get),     // Autenticación y perfil de usuario
    ...createDataSlice(set, get),     // Datos generales (rutinas, logs, nutrición, etc.)
    ...createWorkoutSlice(set, get),  // Todo lo relacionado con el workout (estado, acciones, sesión, timer)
}));

export default useAppStore;