/* frontend/src/utils/coachAppliedHistory.js */

const STORAGE_KEY = 'pro_fitness_coach_history';

/**
 * Normaliza el nombre del ejercicio para indexación unificada.
 */
const normalizeKey = (name) => {
  return String(name || '').toLowerCase().trim();
};

/**
 * Obtiene todo el registro histórico de estrategias aplicadas por el entrenador inteligente.
 */
export const getAllAppliedCoachHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading coach history from localStorage', e);
    return {};
  }
};

/**
 * Obtiene la última recomendación aplicada para un ejercicio específico.
 */
export const getAppliedCoachStrategy = (exerciseName) => {
  if (!exerciseName) return null;
  const history = getAllAppliedCoachHistory();
  const key = normalizeKey(exerciseName);
  return history[key] || null;
};

/**
 * Guarda que el usuario ha aplicado una recomendación del entrenador para un ejercicio.
 */
export const saveAppliedCoachStrategy = (exerciseName, strategyData) => {
  if (!exerciseName || !strategyData) return null;

  try {
    const history = getAllAppliedCoachHistory();
    const key = normalizeKey(exerciseName);

    const record = {
      exerciseName,
      strategyId: strategyData.id || strategyData.strategyId || 'custom',
      strategyTitle: strategyData.title || strategyData.strategyTitle || 'Estrategia personalizada',
      suggestedWeight: strategyData.suggestedWeight !== undefined ? strategyData.suggestedWeight : null,
      suggestedReps: strategyData.suggestedReps !== undefined ? strategyData.suggestedReps : null,
      suggestedSets: strategyData.suggestedSets !== undefined ? strategyData.suggestedSets : null,
      goal: strategyData.goal || null,
      trendAtApplication: strategyData.trendStatus || null,
      appliedAt: new Date().toISOString()
    };

    history[key] = record;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return record;
  } catch (e) {
    console.warn('Error saving coach strategy to localStorage', e);
    return null;
  }
};

/**
 * Evalúa el progreso tras la aplicación de una estrategia previa.
 * Determina si la estrategia funcionó (pasó a progressing), si la meseta persiste,
 * o si la fatiga continúa, recomendando la siguiente fase de acción.
 */
export const evaluateCoachFollowUp = (exerciseName, currentTrend, lastApplied) => {
  if (!lastApplied) return null;

  const appliedTime = new Date(lastApplied.appliedAt).getTime();
  const now = Date.now();
  const diffDays = Math.max(0, Math.round((now - appliedTime) / (1000 * 60 * 60 * 24)));
  const diffWeeks = Math.max(1, Math.round(diffDays / 7));

  const prevTrend = lastApplied.trendAtApplication;
  const currentStatus = currentTrend?.status;

  // 1. Éxito rotundo: Estaba estancado o con fatiga y ahora está progresando
  if ((prevTrend === 'stagnant' || prevTrend === 'decreasing') && currentStatus === 'progressing') {
    return {
      type: 'success_breakthrough',
      badge: '¡Meseta Superada!',
      color: 'emerald',
      title: '¡Estrategia exitosa! Rompiste el estancamiento',
      description: `En tu sesión anterior aplicaste "${lastApplied.strategyTitle}". Hoy tus métricas reflejan una mejora de ${currentTrend.badgeText}. Tu cuerpo ha respondido a la sobrecarga y supercompensación.`,
      actionHint: 'Mantén esta inercia: consolida la técnica y sigue con el plan actual.',
      daysAgo: diffDays,
      lastApplied
    };
  }

  // 2. Estaba progresando y sigue en racha
  if (prevTrend === 'progressing' && currentStatus === 'progressing') {
    return {
      type: 'streak_continued',
      badge: 'En Racha Positiva',
      color: 'emerald',
      title: '¡Racha Imparable!',
      description: `La sobrecarga anterior funcionó a la perfección. Has sumado ${currentTrend.badgeText} manteniendo una progresión constante.`,
      actionHint: 'No te saltes la regla de micro-incrementos para evitar frenar la adaptación.',
      daysAgo: diffDays,
      lastApplied
    };
  }

  // 3. Persiste estancado tras haber aplicado una estrategia
  if (currentStatus === 'stagnant') {
    return {
      type: 'still_stagnant',
      badge: diffDays > 7 ? `Meseta persistente (${diffWeeks} sem)` : 'Meseta en observación',
      color: 'amber',
      title: 'Seguimiento: La meseta aún no ha cedido',
      description: `Aplicaste "${lastApplied.strategyTitle}" hace ${diffDays === 0 ? 'poco' : `${diffDays} días`}. Cuando una estrategia de micro-carga o repeticiones no desbloquea el estímulo, la ciencia del entrenamiento recomienda variar el tiempo bajo tensión o ajustar el orden del ejercicio.`,
      actionHint: 'Hoy activamos la Estrategia Alternativa para obligar a una nueva adaptación neuromuscular.',
      daysAgo: diffDays,
      weeksAgo: diffWeeks,
      lastApplied
    };
  }

  // 4. Persiste fatiga o disminución de fuerza
  if (currentStatus === 'decreasing') {
    return {
      type: 'persistent_fatigue',
      badge: 'Fatiga Neuromuscular Acumulada',
      color: 'amber',
      title: 'Atención: Fatiga residual detectada',
      description: `Habías aplicado "${lastApplied.strategyTitle}", pero tu sistema neuromuscular continúa demandando recuperación. Forzar la carga en este estado eleva el riesgo articular.`,
      actionHint: 'Aplica una descarga táctica o consulta con el preparador físico para reestructurar volumen.',
      daysAgo: diffDays,
      lastApplied
    };
  }

  return {
    type: 'neutral_followup',
    badge: 'Seguimiento Activo',
    color: 'blue',
    title: 'Estrategia previa registrada',
    description: `Última pauta aplicada: "${lastApplied.strategyTitle}" hace ${diffDays} días.`,
    actionHint: 'Continuando calibración de carga según tu respuesta de hoy.',
    daysAgo: diffDays,
    lastApplied
  };
};
