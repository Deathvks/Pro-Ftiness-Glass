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
 * Construye clave compuesta por ejercicio y rutina cuando existe contexto de rutina.
 */
const buildRoutineStorageKey = (exerciseName, routineId, routineName) => {
  const baseKey = normalizeKey(exerciseName);
  const rIdKey = routineId ? normalizeKey(routineId) : '';
  const rNameKey = routineName ? normalizeKey(routineName) : '';
  if (rIdKey) return `${baseKey}__routine_id_${rIdKey}`;
  if (rNameKey) return `${baseKey}__routine_name_${rNameKey}`;
  return baseKey;
};

/**
 * Obtiene la última recomendación aplicada para un ejercicio específico.
 * Si se indica rutina activa, busca únicamente estrategias aplicadas en dicha rutina.
 */
export const getAppliedCoachStrategy = (exerciseName, currentRoutineId = null, currentRoutineName = null) => {
  if (!exerciseName) return null;
  const history = getAllAppliedCoachHistory();
  const baseKey = normalizeKey(exerciseName);

  if (currentRoutineId || currentRoutineName) {
    if (currentRoutineId) {
      const byId = history[`${baseKey}__routine_id_${normalizeKey(currentRoutineId)}`];
      if (byId) return byId;
    }
    if (currentRoutineName) {
      const byName = history[`${baseKey}__routine_name_${normalizeKey(currentRoutineName)}`];
      if (byName) return byName;
    }

    const fallback = history[baseKey];
    if (!fallback) return null;

    // Si el registro tiene rutina asociada, comprobar que coincida con la rutina actual
    if (fallback.routineId || fallback.routineName) {
      const matchesId = currentRoutineId && fallback.routineId && String(fallback.routineId) === String(currentRoutineId);
      const matchesName = currentRoutineName && fallback.routineName && normalizeKey(fallback.routineName) === normalizeKey(currentRoutineName);
      return (matchesId || matchesName) ? fallback : null;
    }

    return fallback;
  }

  return history[baseKey] || null;
};

/**
 * Guarda que el usuario ha aplicado una recomendación del entrenador para un ejercicio.
 */
export const saveAppliedCoachStrategy = (exerciseName, strategyData) => {
  if (!exerciseName || !strategyData) return null;

  try {
    const history = getAllAppliedCoachHistory();
    const key = normalizeKey(exerciseName);
    const routineId = strategyData.routineId || null;
    const routineName = strategyData.routineName || null;

    const record = {
      exerciseName,
      routineId: routineId ? String(routineId) : null,
      routineName: routineName || null,
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
      perSetPlan: Array.isArray(strategyData.perSetPlan) ? strategyData.perSetPlan : null,
      appliedAt: new Date().toISOString()
    };

    history[key] = record;
    if (routineId) {
      history[`${key}__routine_id_${normalizeKey(routineId)}`] = record;
    }
    if (routineName) {
      history[`${key}__routine_name_${normalizeKey(routineName)}`] = record;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('coach-strategy-applied', {
        detail: { exerciseName, record }
      }));
    }

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
  if (!strategy) return 'objetivo planificado';
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
  return parts.length > 0 ? parts.join(' × ') : 'objetivo planificado';
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
  if (calendarDaysDiff < 7) return `hace ${calendarDaysDiff} días`;
  if (calendarDaysDiff < 14) return `hace ${calendarDaysDiff} días (más de 1 semana)`;
  if (calendarDaysDiff < 21) return `hace 2 semanas (${calendarDaysDiff} días)`;
  if (calendarDaysDiff < 28) return `hace 3 semanas (${calendarDaysDiff} días)`;
  if (calendarDaysDiff < 60) return `hace ${Math.floor(calendarDaysDiff / 7)} semanas (${calendarDaysDiff} días)`;
  return `hace más de 2 meses (${calendarDaysDiff} días)`;
};

/**
 * Evalúa el progreso longitudinal y el estado de recuperación fisiológica de un ejercicio:
 * 1. Recuperación en días/horas: Si se intentó hace nada (< 36-40h / hoy o ayer)
 *    - Si en la sesión anterior salió mal/fatiga/estancamiento: Alerta de fatiga (volverá a salir mal, requiere 48-72h).
 *    - Si en la sesión anterior estaba mejorando: Alerta de supercompensación incompleta (carga se sentirá más pesada).
 * 2. Próximo día con descanso adecuado:
 *    - Si aplicó recomendación: "Según lo trabajado en la sesión anterior, ahora deberías poder hacer X".
 * 3. En siguientes sesiones: Seguimiento adaptativo hasta llegar al "OK Verde" cuando rompe el estancamiento o progresa.
 * 4. Día 1 / Sin historial en la rutina actual: Avisa de que está pendiente de recoger datos en esta rutina y que toque para ver recomendaciones.
 */
export const evaluateExerciseFollowUpAndRecovery = ({
  exerciseName,
  sessions = [],
  allSessions = null,
  routineContext = null,
  currentTrend = null,
  lastApplied = null,
  userProfile = null
}) => {
  const lastSession = sessions && sessions.length > 0 ? sessions[0] : null;
  const hasRoutineSessions = Boolean(sessions && sessions.length > 0);
  const totalGlobalSessions = Array.isArray(allSessions) ? allSessions.length : (routineContext?.distinctRoutines?.reduce((acc, r) => acc + (r.count || 0), 0) || sessions.length);
  const hasOtherRoutineHistory = !hasRoutineSessions && totalGlobalSessions > 0;

  // 1. Cálculo del tiempo transcurrido desde la última sesión registrada en esta rutina
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
  const trendStatus = currentTrend?.status || (hasRoutineSessions ? 'calibrating' : 'first_time');

  const appliedAtTime = lastApplied?.appliedAt ? new Date(lastApplied.appliedAt).getTime() : 0;
  const isCurrentSessionApplied = appliedAtTime > 0 && (Date.now() - appliedAtTime) < (4 * 60 * 60 * 1000); // Aplicado en las últimas 4h

  // Si se aplicó la recomendación para la sesión actual, reflejar inmediatamente el estado verde
  if (isCurrentSessionApplied && lastApplied) {
    return {
      type: 'ok_green',
      status: 'ok_green',
      badge: 'Estrategia Aplicada',
      badgeShort: 'Plan Activo',
      title: `Estrategia activa: ${lastApplied.strategyTitle}`,
      message: `Has configurado tus series según la recomendación del entrenador (${targetText || 'Pauta ajustada'}). ¡A por ello!`,
      actionHint: 'Completa tus series con esta pauta para consolidar el progreso.',
      targetText,
      color: 'emerald',
      isTooSoon: false,
      diffHours,
      calendarDaysDiff,
      timeAgoText: 'Ahora',
      lastApplied,
      lastSession,
      isOkGreen: true,
      isWarning: false
    };
  }

  // ============================================================
  // SIN HISTORIAL EN ESTA RUTINA: PENDIENTE DE RECOGER DATOS
  // ============================================================
  if (!hasRoutineSessions || trendStatus === 'first_time') {
    const routineLabel = routineContext?.currentRoutineName ? `"${routineContext.currentRoutineName}"` : 'esta rutina';
    return {
      type: 'calibrating',
      status: 'calibrating',
      badge: 'Pendiente de recoger datos',
      badgeShort: 'Pendiente de datos',
      title: `Sin historial en ${routineLabel} · Pendiente de recoger datos`,
      message: hasOtherRoutineHistory
        ? 'Aún no se han registrado datos de este ejercicio en esta rutina (aunque tengas registros en otras). Toca aquí para ver las recomendaciones iniciales y los detalles.'
        : 'Aún no se han registrado datos de este ejercicio en esta rutina. Toca aquí para ver las recomendaciones iniciales y los detalles.',
      actionHint: 'Toca para ver la carga inicial recomendada para hoy.',
      targetText: '',
      color: 'accent',
      isTooSoon: false,
      diffHours: null,
      calendarDaysDiff: null,
      timeAgoText: '',
      lastApplied: null,
      lastSession: null,
      isOkGreen: false,
      isWarning: false
    };
  }

  // ============================================================
  // CONDICIÓN A: INTENTADO HACE POCO EN ESTA RUTINA (< 36-40h / hoy o ayer)
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
  // CONDICIÓN C: INACTIVIDAD PROLONGADA (10+ días o semanas sin hacer esta rutina)
  // ============================================================
  if (calendarDaysDiff !== null && calendarDaysDiff >= 10) {
    const isSevere = calendarDaysDiff >= 28;
    const isModerate = calendarDaysDiff >= 14;
    const weeksCount = Math.floor(calendarDaysDiff / 7);
    const routineLabel = routineContext?.currentRoutineName
      ? `la rutina "${routineContext.currentRoutineName}"`
      : 'esta rutina';

    const badge = isSevere
      ? `Inactividad: +${weeksCount} semanas`
      : isModerate
      ? `Inactividad: ${weeksCount} semanas`
      : `Inactividad: ${calendarDaysDiff} días`;

    const badgeShort = isSevere
      ? `+1 mes sin ${routineContext?.currentRoutineName ? 'rutina' : 'entreno'}`
      : isModerate
      ? `${weeksCount} sem sin ${routineContext?.currentRoutineName ? 'rutina' : 'entreno'}`
      : `${calendarDaysDiff}d sin ${routineContext?.currentRoutineName ? 'rutina' : 'entreno'}`;

    const title = isSevere
      ? `Llevas más de 1 mes sin hacer ${routineLabel} (${calendarDaysDiff} días)`
      : isModerate
      ? `Llevas ${weeksCount} semanas sin hacer ${routineLabel} (${calendarDaysDiff} días)`
      : `Llevas ${calendarDaysDiff} días sin hacer ${routineLabel}`;

    const message = isSevere
      ? `Llevas ${timeAgoText} sin registrar este ejercicio en ${routineLabel}. Aunque la memoria muscular te permitirá recuperar tus marcas rápidamente, tus tendones y sistema neuromuscular requieren una readaptación progresiva. Te aconsejamos una carga moderada (-15% o peso cómodo) y parar a 2-3 reps del fallo (RIR 2-3) para evitar agujetas severas o sobrecargas.`
      : isModerate
      ? `Llevas ${timeAgoText} sin entrenar este ejercicio en ${routineLabel}. Tras 2-3 semanas de descanso, la tolerancia muscular y articular ha disminuido. No te recomendamos forzar subidas de peso hoy de golpe: lo óptimo es una sesión de reactivación manteniendo tu carga previa o un 10% menor con RIR 2-3.`
      : `Llevas ${timeAgoText} sin realizar ${routineLabel}. Tus adaptaciones neuromusculares están algo frías. Te sugerimos realizar una serie de aproximación controlada y completar la sesión con margen (RIR 2) antes de volver a forzar saltos de peso.`;

    const actionHint = isModerate || isSevere
      ? 'Sesión de reactivación recomendada: prioriza sensaciones y RIR 2-3 antes de forzar récords.'
      : 'Toma de contacto sugerida: mantén la carga previa con margen antes de subir peso.';

    return {
      type: 'inactivity_warning',
      status: 'inactivity_warning',
      badge,
      badgeShort,
      title,
      message,
      actionHint,
      targetText,
      color: 'amber',
      isTooSoon: false,
      isInactive: true,
      inactiveDays: calendarDaysDiff,
      inactiveWeeks: weeksCount,
      diffHours,
      calendarDaysDiff,
      timeAgoText,
      lastApplied,
      lastSession,
      isOkGreen: false,
      isWarning: true
    };
  }

  // ============================================================
  // CONDICIÓN B: TIEMPO DE RECUPERACIÓN ÓPTIMO (>= 48h con historial en esta rutina)
  // ============================================================

  // Comprobar si la estrategia aplicada sigue vigente para la sesión actual/inmediata,
  // o si el usuario ya registró entrenamientos posteriores por su cuenta sin pulsar "Aplicar".
  const lastSessionTime = lastSession?.date ? new Date(lastSession.date).getTime() : 0;
  const isAppliedStillRelevant = Boolean(
    lastApplied &&
    appliedAtTime > 0 &&
    (!lastSessionTime || (lastSessionTime - appliedAtTime) <= (12 * 60 * 60 * 1000))
  );
  const activeApplied = isAppliedStillRelevant ? lastApplied : null;

  // B1. OK VERDE: El usuario ha aplicado la pauta para este entrenamiento o superó el estancamiento
  const hasAchievedTarget = activeApplied && lastSession && (
    (activeApplied.suggestedWeight !== null && lastSession.topWeight >= activeApplied.suggestedWeight) ||
    trendStatus === 'progressing'
  );

  if (trendStatus === 'progressing' || hasAchievedTarget) {
    const progressionDetail = currentTrend?.badgeText || (currentTrend?.deltaWeight > 0 ? `+${currentTrend.deltaWeight} kg` : 'en progresión');
    return {
      type: 'ok_green',
      status: 'ok_green',
      badge: '¡OK Verde! Progreso Confirmado',
      badgeShort: '¡OK Verde!',
      title: '¡Objetivo superado! Progreso registrado',
      message: activeApplied
        ? `Según lo trabajado en tus sesiones anteriores, aplicaste "${activeApplied.strategyTitle}" y lograste el objetivo (${progressionDetail}). Tu rendimiento está completamente normalizado y en progresión positiva.`
        : `Según los datos registrados en tus entrenamientos (${lastSession?.topWeight > 0 ? `${lastSession.topWeight} kg × ${lastSession.topReps} reps` : `${lastSession?.topReps || 0} reps`}), tu rendimiento está progresando (${progressionDetail}). Toca para ver tu nuevo objetivo ajustado.`,
      actionHint: 'Consolida la técnica y continúa aplicando sobrecarga progresiva sin apresurar los saltos de peso.',
      targetText,
      color: 'emerald',
      isTooSoon: false,
      diffHours,
      calendarDaysDiff,
      timeAgoText,
      lastApplied: activeApplied,
      lastSession,
      isOkGreen: true,
      isWarning: false
    };
  }

  // B2. SIGUIENTE SESIÓN TRAS APLICAR RECOMENDACIÓN (Fase de adaptación hacia el objetivo)
  if (activeApplied) {
    return {
      type: 'next_session_target',
      status: 'next_session_target',
      badge: 'Objetivo Sesión Anterior',
      badgeShort: 'Tu objetivo',
      title: 'Objetivo según lo trabajado en la sesión anterior',
      message: `Según lo trabajado en la sesión anterior (aplicaste "${activeApplied.strategyTitle}"), ahora deberías poder hacer ${targetText}.`,
      actionHint: 'Aplica el objetivo planificado y registra tus repeticiones para evaluar el avance hacia el OK verde.',
      targetText,
      color: 'accent',
      isTooSoon: false,
      diffHours,
      calendarDaysDiff,
      timeAgoText,
      lastApplied: activeApplied,
      lastSession,
      isOkGreen: false,
      isWarning: false
    };
  }

  // B3. DETECTADO ESTANCAMIENTO O FATIGA EN LOS ENTRENAMIENTOS REGISTRADOS
  if (currentTrend?.isWarning) {
    const isStagnant = trendStatus === 'stagnant';
    const stagnantCount = currentTrend.stagnantSessionsCount || 2;
    const isBW = !lastSession?.topWeight || parseFloat(lastSession.topWeight) === 0;
    const weightLabel = isBW ? 'peso corporal' : `${lastSession.topWeight} kg`;
    return {
      type: 'needs_improvement',
      status: isStagnant ? 'needs_improvement_stagnant' : 'needs_improvement_fatigue',
      badge: isStagnant ? 'Mejora Requerida' : 'Fatiga Detectada',
      badgeShort: isStagnant ? (isBW ? 'Mismas reps !' : 'Mismo peso !') : 'Aviso fatiga !',
      title: isStagnant
        ? (isBW
          ? 'Debes mejorar este ejercicio: meseta en repeticiones'
          : 'Debes mejorar este ejercicio: estancamiento detectado')
        : 'Debes mejorar este ejercicio: fatiga acumulada',
      message: isStagnant
        ? (isBW
          ? `Llevas ${stagnantCount} sesiones completando las mismas ${lastSession?.topReps || 0} repeticiones en peso corporal. Tu musculatura se ha habituado a este volumen y necesita un estímulo planificado para romper el techo de repeticiones.`
          : `Llevas ${stagnantCount} sesiones repitiendo la misma carga (${weightLabel}). Tu musculatura se ha adaptado y necesita un estímulo planificado para seguir avanzando.`)
        : 'Hemos detectado una caída en tus métricas de fuerza en las últimas series. Tu sistema neuromuscular necesita un micro-ajuste táctico.',
      actionHint: null,
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

  // B4. CON 1 SESIÓN PREVIA REGISTRADA EN ESTA RUTINA (SIN HABER PULSADO "APLICAR")
  const prevMarkText = lastSession
    ? `${lastSession.topWeight > 0 ? `${lastSession.topWeight} kg` : 'peso corporal'} × ${lastSession.topReps} reps`
    : null;
  return {
    type: 'next_session_target',
    status: 'calibrating',
    badge: 'Recomendación Ajustada',
    badgeShort: 'Ver objetivo',
    title: prevMarkText
      ? `Objetivo ajustado según tu última sesión (${prevMarkText})`
      : 'Estableciendo base en esta rutina (1 sesión previa)',
    message: prevMarkText
      ? `Recogimos tu marca anterior de ${prevMarkText} en esta rutina y hemos ajustado tus recomendaciones para hoy. Toca aquí para ver los detalles.`
      : 'Ya contamos con tu primera referencia en esta rutina. Toca aquí para ver las recomendaciones y detalles para tu sesión de hoy.',
    actionHint: null,
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
