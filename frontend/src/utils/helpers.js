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

// --- INICIO DE LA MODIFICACIÓN (I18N FIX) ---
/**
 * Normaliza una cadena de texto para usarla como clave de traducción.
 * Elimina saltos de línea, espacios múltiples y espacios al inicio/final.
 * Esto es crucial para que las descripciones largas en DB coincidan con las claves JSON.
 * @param {string} text - El texto a normalizar.
 * @returns {string} El texto normalizado.
 */
export const normalizeText = (text) => {
  if (!text) return '';
  return text
    .replace(/[\r\n]+/g, ' ') // Reemplaza saltos de línea por espacios
    .replace(/\s+/g, ' ')     // Colapsa múltiples espacios en uno
    .trim();                  // Elimina espacios al inicio y final
};
// --- FIN DE LA MODIFICACIÓN (I18N FIX) ---

// --- NUEVO: ESTIMACIÓN DE TIEMPO DE RUTINA ---
/**
 * Calcula el tiempo estimado (en minutos) de una rutina en base a sus ejercicios, repeticiones y el objetivo del usuario.
 */
export const calculateRoutineEstimatedTime = (exercises, userGoal = 'maintenance') => {
  if (!exercises || exercises.length === 0) return 0;

  let totalSeconds = 0;

  // Agrupamos por superserie para no duplicar los descansos
  const groups = {};
  exercises.forEach(ex => {
    const groupId = ex.superset_group_id || `single_${ex.id || ex.tempId || Math.random()}`;
    if (!groups[groupId]) groups[groupId] = [];
    groups[groupId].push(ex);
  });

  Object.values(groups).forEach(group => {
    const maxSets = Math.max(...group.map(ex => parseInt(ex.sets, 10) || 0), 0);
    if (maxSets === 0) return;

    // 1. Tiempo Activo (ejecución de los ejercicios)
    let activeTime = 0;
    group.forEach(ex => {
      const sets = parseInt(ex.sets, 10) || 0;
      let reps = 10; // Promedio por defecto
      
      // Manejamos si las repeticiones vienen como rango (ej: "8-12")
      if (typeof ex.reps === 'string') {
         const parts = ex.reps.split('-');
         if (parts.length > 1) reps = (parseInt(parts[0], 10) + parseInt(parts[1], 10)) / 2;
         else reps = parseInt(ex.reps, 10) || 10;
      } else if (typeof ex.reps === 'number') {
         reps = ex.reps;
      }
      
      // Asumimos 4 segundos por repetición (Tiempo Bajo Tensión promedio)
      activeTime += sets * reps * 4; 
    });

    // 2. Tiempo de Descanso adaptado al objetivo del usuario
    let baseRest = 60;
    if (userGoal === 'gain_muscle') baseRest = 45; // Descansos más cortos
    else if (userGoal === 'lose_weight') baseRest = 75; // Descansos más largos
    
    // Tomamos el descanso configurado o el base
    const maxRest = Math.max(...group.map(ex => parseInt(ex.rest_seconds, 10) || baseRest));
    
    // Aplicamos el factor del objetivo incluso sobre el descanso elegido por el usuario
    let restMultiplier = 1;
    if (userGoal === 'gain_muscle') restMultiplier = 0.85; 
    if (userGoal === 'lose_weight') restMultiplier = 1.15; 

    const restTime = maxSets * (maxRest * restMultiplier);

    totalSeconds += activeTime + restTime;
  });

  // Retornamos los minutos totales (mínimo 1 minuto)
  return Math.max(1, Math.round(totalSeconds / 60));
};