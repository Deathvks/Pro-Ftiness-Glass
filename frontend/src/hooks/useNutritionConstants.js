/* frontend/src/hooks/useNutritionConstants.js */

export const initialManualFormState = {
  formData: {
    description: '',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fats_g: '',
    weight_g: '',
    image_url: null,
    // --- INICIO DE LA MODIFICACIÓN ---
    micronutrients: null,
    // --- FIN DE LA MODIFICACIÓN ---
  },
  per100Data: { calories: '', protein_g: '', carbs_g: '', fats_g: '' },
  per100Mode: false,
  isFavorite: false,
};

export const ITEMS_PER_PAGE = 5;

export const mealTitles = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snacks',
};

/**
 * Redondea un valor a un número específico de decimales.
 * @param {string | number} val - El valor a redondear.
 * @param {number} [d=1] - El número de decimales.
 * @returns {string} - El valor redondeado como string, o un string vacío si no es un número.
 */
export const round = (val, d = 1) => {
  const n = parseFloat(val);
  return isNaN(n)
    ? ''
    : (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
};