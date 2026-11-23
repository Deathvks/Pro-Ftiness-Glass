/* mobile/src/utils/nutritionCoachHistory.ts */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pro_fitness_nutrition_coach_history';

let inMemoryCache: Record<string, any> | null = null;

/**
 * Obtiene todo el registro de pautas nutricionales aplicadas.
 */
export const getAllAppliedNutritionHistory = (): Record<string, any> => {
  if (inMemoryCache) return inMemoryCache;

  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        inMemoryCache = JSON.parse(raw);
        return inMemoryCache || {};
      }
    }
  } catch (e) {
    console.warn('Error reading nutrition coach history from localStorage', e);
  }
  return {};
};

/**
 * Obtiene la última pauta nutricional aplicada para una fecha concreta (o la más reciente).
 */
export const getAppliedNutritionStrategy = (dateString?: string) => {
  if (!dateString) return null;
  const history = getAllAppliedNutritionHistory();
  return history[dateString] || null;
};

/**
 * Guarda que el usuario ha seleccionado y aplicado una pauta nutricional para la fecha.
 */
export const saveAppliedNutritionStrategy = (dateString: string, strategyData: any) => {
  if (!dateString || !strategyData) return null;

  try {
    const history = { ...getAllAppliedNutritionHistory() };
    const record = {
      date: dateString,
      strategyId: strategyData.id || 'custom',
      title: strategyData.title || 'Pauta nutricional personalizada',
      tag: strategyData.tag || 'Recomendada',
      badge: strategyData.badge || null,
      description: strategyData.description || '',
      goal: strategyData.goal || null,
      appliedAt: new Date().toISOString(),
    };

    history[dateString] = record;
    inMemoryCache = history;

    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history)).catch(() => {});
    return record;
  } catch (e) {
    console.warn('Error saving nutrition strategy to localStorage/AsyncStorage', e);
    return null;
  }
};
