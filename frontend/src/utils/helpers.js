/* frontend/src/utils/helpers.js */
export const calculateCalories = (durationInSeconds, userWeight = 75) => {
  const MET_VALUE = 5.0;
  const hours = durationInSeconds / 3600;
  return Math.round(MET_VALUE * userWeight * hours);
};

export const getBestSet = (sets) => {
  if (!sets || sets.length === 0) {
    return { weight_kg: 0, reps: 0 };
  }

  let bestSet = sets[0];

  for (let i = 1; i < sets.length; i++) {
    const currentSet = sets[i];
    const currentWeight = parseFloat(currentSet.weight_kg) || 0;
    const bestWeight = parseFloat(bestSet.weight_kg) || 0;

    if (currentWeight > bestWeight) {
      bestSet = currentSet;
    }
  }

  return bestSet;
};

// --- FUNCIÓN AÑADIDA ---
export const isSameDay = (dateA, dateB) => {
    const date1 = new Date(dateA);
    const date2 = new Date(dateB);
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

// --- INICIO DE LA MODIFICACIÓN ---
/**
 * Estima el 1RM (One Repetition Maximum) usando la fórmula de Epley.
 * @param {number} weight - El peso levantado.
 * @param {number} reps - El número de repeticiones realizadas.
 * @returns {number} El 1RM estimado, redondeado a 2 decimales. Devuelve 0 si las repeticiones son 0.
 */
export const calculate1RM = (weight, reps) => {
  const weightNum = parseFloat(weight);
  const repsNum = parseInt(reps, 10);

  if (isNaN(weightNum) || isNaN(repsNum) || weightNum <= 0 || repsNum <= 0) {
    return 0;
  }
  // Fórmula de Epley: 1RM = weight * (1 + reps / 30)
  const estimated1RM = weightNum * (1 + repsNum / 30);
  // Redondeamos a 2 decimales
  return Math.round(estimated1RM * 100) / 100;
};
// --- FIN DE LA MODIFICACIÓN ---

// --- INICIO DE LA MODIFICACIÓN (FIX BUG) ---
/**
 * Reordena un array moviendo un elemento de un índice a otro.
 * @param {Array} list - El array original.
 * @param {number} startIndex - El índice del elemento a mover.
 * @param {number} endIndex - El índice donde se insertará el elemento.
 * @returns {Array} Un nuevo array reordenado.
 */
export const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};
// --- FIN DE LA MODIFICACIÓN (FIX BUG) ---