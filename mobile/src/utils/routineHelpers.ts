/* mobile/src/utils/routineHelpers.ts */
import { BACKEND_BASE_URL } from '@/services/apiClient';

/**
 * Calcula el tiempo estimado (en minutos) de una rutina en base a sus ejercicios,
 * repeticiones y el objetivo del usuario (idéntico al frontend).
 */
export const calculateRoutineEstimatedTime = (exercises: any[], userGoal: string = 'maintenance'): number => {
  if (!exercises || exercises.length === 0) return 0;

  let totalSeconds = 0;

  // Agrupamos por superserie para no duplicar los descansos
  const groups: { [key: string]: any[] } = {};
  exercises.forEach((ex, idx) => {
    const groupId = ex.superset_group_id || `single_${ex.id || ex.tempId || idx}`;
    if (!groups[groupId]) groups[groupId] = [];
    groups[groupId].push(ex);
  });

  Object.values(groups).forEach(group => {
    const maxSets = Math.max(...group.map(ex => parseInt(String(ex.sets), 10) || 0), 0);
    if (maxSets === 0) return;

    // 1. Tiempo Activo (ejecución de los ejercicios)
    let activeTime = 0;
    group.forEach(ex => {
      const sets = parseInt(String(ex.sets), 10) || 0;
      let reps = 10;
      
      if (typeof ex.reps === 'string') {
        const parts = ex.reps.split('-');
        if (parts.length > 1) {
          reps = (parseInt(parts[0], 10) + parseInt(parts[1], 10)) / 2;
        } else {
          reps = parseInt(ex.reps, 10) || 10;
        }
      } else if (typeof ex.reps === 'number') {
        reps = ex.reps;
      }
      
      // Asumimos 4 segundos por repetición (Tiempo Bajo Tensión)
      activeTime += sets * reps * 4; 
    });

    // 2. Tiempo de Descanso adaptado al objetivo
    let baseRest = 60;
    if (userGoal === 'gain_muscle' || userGoal === 'gain') baseRest = 45;
    else if (userGoal === 'lose_weight' || userGoal === 'lose') baseRest = 75;
    
    const maxRest = Math.max(...group.map(ex => parseInt(String(ex.rest_seconds), 10) || baseRest));
    
    let restMultiplier = 1;
    if (userGoal === 'gain_muscle' || userGoal === 'gain') restMultiplier = 0.85; 
    if (userGoal === 'lose_weight' || userGoal === 'lose') restMultiplier = 1.15; 

    const restTime = maxSets * (maxRest * restMultiplier);
    totalSeconds += activeTime + restTime;
  });

  return Math.max(1, Math.round(totalSeconds / 60));
};

/**
 * Agrupa ejercicios consecutivos por superserie (idéntico al frontend).
 */
export const groupExercises = (exercises: any[]): any[][] => {
  if (!exercises || exercises.length === 0) return [];
  const groups: any[][] = [];
  let currentGroup: any[] = [];

  const sortedExercises = [...exercises]
    .filter(ex => !!ex)
    .sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0));

  for (const ex of sortedExercises) {
    if (currentGroup.length === 0) {
      currentGroup.push(ex);
      continue;
    }

    if (
      ex.superset_group_id !== null &&
      ex.superset_group_id !== undefined &&
      currentGroup[0].superset_group_id !== null &&
      currentGroup[0].superset_group_id !== undefined &&
      ex.superset_group_id === currentGroup[0].superset_group_id
    ) {
      currentGroup.push(ex);
    } else {
      groups.push(currentGroup);
      currentGroup = [ex];
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};

/**
 * Normaliza la URL de imagen de rutina para que cargue correctamente.
 */
export const getDisplayImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('blob:') || path.startsWith('file:')) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_BASE_URL}${cleanPath}`;
};
