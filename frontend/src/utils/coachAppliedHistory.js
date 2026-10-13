/* frontend/src/utils/coachAppliedHistory.js */

const STORAGE_KEY = 'pro_fitness_coach_history';

/**
 * Normaliza el nombre del ejercicio para indexación unificada.
 */
export const normalizeKey = (name) => {
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
      baselineWeight: strategyData.baselineWeight !== undefined ? strategyData.baselineWeight : null,
      baselineReps: strategyData.baselineReps !== undefined ? strategyData.baselineReps : null,
      baseline1RM: strategyData.baseline1RM !== undefined ? strategyData.baseline1RM : null,
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
 * Formatea el texto legible de la meta (series x reps con peso).
 */
export const formatTargetText = (strategy) => {
  if (!strategy) return 'objetivo pautado';
  const parts = [];
  if (strategy.suggestedSets) parts.push(`${strategy.suggestedSets} series`);
  if (strategy.suggestedReps) parts.push(`${strategy.suggestedReps} reps`);
  if (strategy.suggestedWeight !== null && strategy.suggestedWeight !== undefined) {
    const w = parseFloat(strategy.suggestedWeight);
    if (!isNaN(w) && w > 0) {
      parts.push(`con ${strategy.suggestedWeight} kg`);
    } else {
      parts.push('con peso corporal');
    }
  }
  return parts.length > 0 ? parts.join(' × ') : 'objetivo pautado';
};

/**
 * Formatea el tiempo transcurrido en formato amigable y conciso.
 */
export const formatTimeAgo = (diffHours, calendarDaysDiff) => {
  if (diffHours === null || diffHours === undefined) return '';
  if (calendarDaysDiff === 0) {
    if (diffHours < 2) return 'hace menos de 2 horas (hoy)';
    return `hace ${Math.round(diffHours)} horas (hoy)`;
  }
  if (calendarDaysDiff === 1) return 'hace 1 día (ayer)';
  return `hace ${calendarDaysDiff} días`;
};

/**
 * Evalúa el progreso longitudinal y el estado de recuperación fisiológica de un ejercicio:
 * 1. Recuperación en días/horas: Si se intentó hace nada (< 36-40h / hoy o ayer)
 *    - Si en la sesión anterior salió mal/fatiga/estancamiento: Alerta de fatiga (volverá a salir mal, requiere 48-72h).
 *    - Si en la sesión anterior estaba mejorando: Alerta de supercompensación incompleta (carga se sentirá más pesada).
 * 2. Próximo día con descanso adecuado:
 *    - Si aplicó recomendación: "Según lo trabajado en la sesión anterior, ahora deberías poder hacer X".
 * 3. En siguientes sesiones: Seguimiento adaptativo hasta llegar al "OK Verde" cuando rompe el estancamiento o progresa.
 * 4. Día 1 / Sin recomendación: "Debes mejorar esto X..."
 */
export const evaluateExerciseFollowUpAndRecovery = ({
  exerciseName,
  sessions = [],
  currentTrend = null,
  lastApplied = null,
  userProfile = null
}) => {
  const lastSession = sessions && sessions.length > 0 ? sessions[0] : null;

  // 1. Cálculo del tiempo transcurrido desde la última sesión registrada
  let diffMs = null;
  let diffHours = null;
  let calendarDaysDiff = null;
  let timeAgoText = '';
  let isTooSoon = false;

  if (lastSession?.date) {
    const sessionDate = new Date(lastSession.date);
    if (!isNaN(sessionDate.getTime())) {
      const now = new Date();
      diffMs = Math.max(0, now.getTime() - sessionDate.getTime());
      diffHours = diffMs / (1000 * 60 * 60);

      const sessionDayStart = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      calendarDaysDiff = Math.max(0, Math.round((todayStart - sessionDayStart) / (1000 * 60 * 60 * 24)));

      timeAgoText = formatTimeAgo(diffHours, calendarDaysDiff);

      // Si se intentó el mismo día o al día siguiente (< 36 horas / <= 1 día calendario)
      if (calendarDaysDiff < 2 || diffHours < 36) {
        isTooSoon = true;
      }
    }
  }

  const targetText = lastApplied ? formatTargetText(lastApplied) : '';
  const trendStatus = currentTrend?.status || 'first_time';

  // ============================================================
  // CONDICIÓN A: INTENTADO HACE POCO (< 36-40h / hoy o ayer)
  // ============================================================
  if (isTooSoon) {
    // Subcaso A1: En la sesión anterior salió mal / fatiga / estancamiento
    if (trendStatus === 'stagnant' || trendStatus === 'decreasing') {
      return {
        type: 'recovery_warning',
        status: 'too_soon_fatigue',
        badge: 'Descanso Incompleto',
        badgeShort: 'Descanso !',
        title: 'Aviso de descanso: ejercicio realizado hace poco',
        message: `Intentaste este ejercicio ${timeAgoText}. Como en la sesión anterior el rendimiento no fue óptimo o hubo fatiga acumulada, el sistema neuromuscular y articular necesita entre 48 y 72 horas para recuperarse. Si lo fuerzas hoy, es muy probable que vuelva a salir mal o sufras sobrecarga.`,
        actionHint: 'Te recomendamos posponer este ejercicio hoy o realizar series de técnica ligera (descarga). Dale al menos 48h de recuperación.',
        targetText,
        color: 'amber',
        isTooSoon: true,
        diffHours,
        calendarDaysDiff,
        timeAgoText,
        lastApplied,
        lastSession,
        isOkGreen: false,
        isWarning: true
      };
    }

    // Subcaso A2: En la sesión anterior estaba mejorando / en racha positiva
    if (trendStatus === 'progressing') {
      return {
        type: 'recovery_notice',
        status: 'too_soon_progressing',
        badge: 'Supercompensación en Curso',
        badgeShort: 'Recuperación',
        title: 'Aviso de recuperación: poco tiempo de descanso',
        message: `Entrenaste este ejercicio ${timeAgoText}. Aunque en la sesión anterior estabas mejorando, tus depósitos de glucógeno y la supercompensación aún están en proceso (requieren 48-72h). No ha dado tiempo a recuperarte al 100%, por lo que es normal si hoy notas la carga más pesada o te cuesta igualar marcas.`,
        actionHint: 'Si decides entrenarlo hoy, modera el volumen sin llegar al fallo muscular para no cortar la adaptación.',
        targetText,
        color: 'blue',
        isTooSoon: true,
        diffHours,
        calendarDaysDiff,
        timeAgoText,
        lastApplied,
        lastSession,
        isOkGreen: false,
        isWarning: false
      };
    }
  }

  // ============================================================
  // CONDICIÓN B: TIEMPO DE RECUPERACIÓN ÓPTIMO (>= 48h o sin registros)
  // ============================================================

  // B1. OK VERDE: El usuario ha superado el estancamiento o está en progresión confirmada
  const hasAchievedTarget = lastApplied && lastSession && (
    (lastApplied.suggestedWeight !== null && lastSession.topWeight >= lastApplied.suggestedWeight) ||
    trendStatus === 'progressing'
  );

  if (trendStatus === 'progressing' || hasAchievedTarget) {
    const progressionDetail = currentTrend?.badgeText || (currentTrend?.deltaWeight > 0 ? `+${currentTrend.deltaWeight} kg` : 'en progresión');
    return {
      type: 'ok_green',
      status: 'ok_green',
      badge: '¡OK Verde! Progreso Confirmado',
      badgeShort: '¡OK Verde!',
      title: '¡Objetivo superado! Rompiste el estancamiento',
      message: lastApplied
        ? `Según lo trabajado en tus sesiones anteriores, aplicaste "${lastApplied.strategyTitle}" y lograste el objetivo (${progressionDetail}). Tu rendimiento está completamente normalizado y en progresión positiva.`
        : `¡Excelente ritmo! Tu rendimiento está progresando de manera óptima (${progressionDetail}). Mantén esta sobrecarga gradual.`,
      actionHint: 'Consolida la técnica y continúa aplicando sobrecarga progresiva sin apresurar los saltos de peso.',
      targetText,
      color: 'emerald',
      isTooSoon: false,
      diffHours,
      calendarDaysDiff,
      timeAgoText,
      lastApplied,
      lastSession,
      isOkGreen: true,
      isWarning: false
    };
  }

  // B2. SIGUIENTE SESIÓN TRAS APLICAR RECOMENDACIÓN (Fase de adaptación hacia el objetivo)
  if (lastApplied) {
    return {
      type: 'next_session_target',
      status: 'next_session_target',
      badge: 'Pauta Sesión Anterior',
      badgeShort: 'Pauta IA',
      title: 'Objetivo según lo trabajado en la sesión anterior',
      message: `Según lo trabajado en la sesión anterior (aplicaste "${lastApplied.strategyTitle}"), ahora deberías poder hacer ${targetText}.`,
      actionHint: 'Aplica el objetivo planificado y registra tus repeticiones para evaluar el avance hacia el OK verde.',
      targetText,
      color: 'accent',
      isTooSoon: false,
      diffHours,
      calendarDaysDiff,
      timeAgoText,
      lastApplied,
      lastSession,
      isOkGreen: false,
      isWarning: false
    };
  }

  // B3. DÍA 1 / SIN RECOMENDACIÓN APLICADA: DETECTADO ESTANCAMIENTO O FATIGA
  if (currentTrend?.isWarning) {
    const isStagnant = trendStatus === 'stagnant';
    const weeksStagnant = currentTrend.weeksStagnant || 1;
    return {
      type: 'needs_improvement',
      status: isStagnant ? 'needs_improvement_stagnant' : 'needs_improvement_fatigue',
      badge: isStagnant ? 'Mejora Requerida' : 'Fatiga Detectada',
      badgeShort: isStagnant ? 'Mismo peso !' : 'Aviso fatiga !',
      title: isStagnant
        ? 'Debes mejorar este ejercicio: estancamiento detectado'
        : 'Debes mejorar este ejercicio: fatiga acumulada',
      message: isStagnant
        ? `Llevas ${weeksStagnant > 1 ? `${weeksStagnant} semanas` : 'varias sesiones'} repitiendo la misma carga (${lastSession?.topWeight || 0} kg). Tu musculatura se ha adaptado y necesita un estímulo planificado para seguir avanzando.`
        : 'Hemos detectado una caída en tus métricas de fuerza en las últimas series. Tu sistema neuromuscular necesita un micro-ajuste táctico.',
      actionHint: 'Toca aquí para ver las recomendaciones del entrenador y aplicar un plan de sobrecarga.',
      targetText: '',
      color: 'amber',
      isTooSoon: false,
      diffHours,
      calendarDaysDiff,
      timeAgoText,
      lastApplied: null,
      lastSession,
      isOkGreen: false,
      isWarning: true
    };
  }

  // B4. CALIBRACIÓN / PRIMERA VEZ
  return {
    type: 'calibrating',
    status: 'calibrating',
    badge: 'Calibración Inicial',
    badgeShort: 'Info Objetivo',
    title: 'Estableciendo umbral de partida',
    message: 'Registra tus marcas hoy manteniendo 1-2 repeticiones en reserva (RIR 1-2) para calibrar tus futuras progresiones.',
    actionHint: 'Toca aquí para ver recomendaciones de técnica y volumen para tu objetivo.',
    targetText: '',
    color: 'accent',
    isTooSoon: false,
    diffHours,
    calendarDaysDiff,
    timeAgoText,
    lastApplied: null,
    lastSession,
    isOkGreen: false,
    isWarning: false
  };
};

/**
 * Función heredada para compatibilidad directa.
 */
export const evaluateCoachFollowUp = (exerciseName, currentTrend, lastApplied) => {
  return evaluateExerciseFollowUpAndRecovery({
    exerciseName,
    sessions: [],
    currentTrend,
    lastApplied
  });
};
