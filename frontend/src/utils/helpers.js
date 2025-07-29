export const calculateCalories = (durationInSeconds, userWeight = 75) => {
  const MET_VALUE = 5.0;
  const hours = durationInSeconds / 3600;
  return Math.round(MET_VALUE * userWeight * hours);
};

// --- FUNCIÓN getBestSet CORREGIDA Y SIMPLIFICADA ---
export const getBestSet = (sets) => {
  if (!sets || sets.length === 0) {
    return { weight_kg: 0, reps: 0 };
  }

  // Empieza asumiendo que la primera serie es la mejor
  let bestSet = sets[0];

  // Recorre el resto de las series para compararlas
  for (let i = 1; i < sets.length; i++) {
    const currentSet = sets[i];
    const currentWeight = parseFloat(currentSet.weight_kg) || 0;
    const bestWeight = parseFloat(bestSet.weight_kg) || 0;

    // Si encuentra una serie con más peso, la actualiza como la nueva mejor
    if (currentWeight > bestWeight) {
      bestSet = currentSet;
    }
  }

  return bestSet;
};