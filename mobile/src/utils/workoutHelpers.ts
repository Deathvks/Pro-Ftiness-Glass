/* mobile/src/utils/workoutHelpers.ts */

/**
 * Calcula las calorías quemadas usando MET 5.0 (fuerza tradicional / hipertrofia).
 */
export const calculateCalories = (durationInSeconds: number, userWeight: number = 75): number => {
  const MET_VALUE = 5.0;
  const hours = durationInSeconds / 3600;
  return Math.round(MET_VALUE * userWeight * hours);
};

/**
 * Estima el 1RM (One Repetition Maximum) usando la fórmula de Epley:
 * 1RM = weight * (1 + reps / 30)
 */
export const calculate1RM = (weight: number | string, reps: number | string): number => {
  const weightNum = parseFloat(String(weight));
  const repsNum = parseInt(String(reps), 10);

  if (isNaN(weightNum) || isNaN(repsNum) || weightNum <= 0 || repsNum <= 0) {
    return 0;
  }
  const estimated1RM = weightNum * (1 + repsNum / 30);
  return Math.round(estimated1RM * 100) / 100;
};

/**
 * Formatea segundos a HH:MM:SS o MM:SS.
 */
export const formatWorkoutTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
};

/**
 * Normaliza valores decimales con coma o punto (solo permite un punto).
 */
export const normalizeDecimalInput = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  let strValue = String(value).replace(',', '.').replace(/[^0-9.]/g, '');
  const firstDotIndex = strValue.indexOf('.');
  if (firstDotIndex !== -1) {
    strValue = strValue.substring(0, firstDotIndex + 1) + strValue.substring(firstDotIndex + 1).replace(/\./g, '');
  }
  return strValue;
};

/**
 * Normaliza entradas a números enteros positivos.
 */
export const normalizeIntegerInput = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[^0-9]/g, '');
};

/**
 * Obtiene la mejor serie de un conjunto de sets completados.
 */
export const getBestSet = (sets: any[]): { weight_kg: number; reps: number } => {
  if (!sets || sets.length === 0) {
    return { weight_kg: 0, reps: 0 };
  }

  let bestSet = sets[0];

  for (let i = 1; i < sets.length; i++) {
    const currentWeight = parseFloat(sets[i]?.weight_kg) || 0;
    const bestWeight = parseFloat(bestSet?.weight_kg) || 0;

    if (currentWeight > bestWeight) {
      bestSet = sets[i];
    }
  }

  return {
    weight_kg: parseFloat(bestSet?.weight_kg) || 0,
    reps: parseInt(bestSet?.reps, 10) || 0,
  };
};

/**
 * Agrupa ejercicios por superserie de manera contigua.
 */
export const groupWorkoutExercises = (exercises: any[]): { group: any[]; isSuperset: boolean; supersetId?: string }[] => {
  if (!exercises || exercises.length === 0) return [];

  const groups: { group: any[]; isSuperset: boolean; supersetId?: string }[] = [];
  let currentGroup: any[] = [];

  exercises.forEach((ex) => {
    if (
      !ex.superset_group_id ||
      (currentGroup.length > 0 && ex.superset_group_id !== currentGroup[0].superset_group_id)
    ) {
      if (currentGroup.length > 0) {
        groups.push({
          group: currentGroup,
          isSuperset: currentGroup.length > 1,
          supersetId: currentGroup[0]?.superset_group_id,
        });
      }
      currentGroup = [ex];
    } else {
      currentGroup.push(ex);
    }
  });

  if (currentGroup.length > 0) {
    groups.push({
      group: currentGroup,
      isSuperset: currentGroup.length > 1,
      supersetId: currentGroup[0]?.superset_group_id,
    });
  }

  return groups;
};
