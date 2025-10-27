/* frontend/src/services/exerciseService.js */
import apiClient from './apiClient';

/**
 * Obtiene la lista completa de ejercicios del backend.
 */
export const getExerciseList = () => {
  // --- INICIO DE LA MODIFICACIÓN ---
  // Corregido: La ruta correcta es '/exercise-list/exercises' según el backend
  return apiClient('/exercise-list/exercises');
  // --- FIN DE LA MODIFICACIÓN ---
};

export const getExerciseHistory = (exerciseName) => {
    return apiClient(`/exercises/history/${encodeURIComponent(exerciseName)}`);
};