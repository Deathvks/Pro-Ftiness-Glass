/* frontend/src/utils/nutritionCoachHistory.js */

const STORAGE_KEY = 'pro_fitness_nutrition_coach_history';

/**
 * Obtiene todo el registro de pautas nutricionales aplicadas.
 */
export const getAllAppliedNutritionHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading nutrition coach history from localStorage', e);
    return {};
  }
};

/**
 * Obtiene la última pauta nutricional aplicada para una fecha concreta (o la más reciente).
 */
export const getAppliedNutritionStrategy = (dateString) => {
  if (!dateString) return null;
  const history = getAllAppliedNutritionHistory();
  return history[dateString] || null;
};

/**
 * Guarda que el usuario ha seleccionado y aplicado una pauta nutricional para la fecha.
 */
export const saveAppliedNutritionStrategy = (dateString, strategyData) => {
  if (!dateString || !strategyData) return null;

  try {
    const history = getAllAppliedNutritionHistory();
    const record = {
      date: dateString,
      strategyId: strategyData.id || 'custom',
      title: strategyData.title || 'Pauta nutricional personalizada',
      tag: strategyData.tag || 'Recomendada',
      badge: strategyData.badge || null,
      description: strategyData.description || '',
      goal: strategyData.goal || null,
      appliedAt: new Date().toISOString()
    };

    history[dateString] = record;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return record;
  } catch (e) {
    console.warn('Error saving nutrition strategy to localStorage', e);
    return null;
  }
};
