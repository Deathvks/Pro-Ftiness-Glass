/* frontend/src/utils/smartProgressionCoach.js */
import { calculate1RM } from './helpers';
import { getAppliedCoachStrategy, evaluateCoachFollowUp, evaluateExerciseFollowUpAndRecovery } from './coachAppliedHistory';

/**
 * Normaliza y clasifica el objetivo del usuario del perfil / onboarding.
 */
export const normalizeUserGoal = (rawGoal) => {
  const g = String(rawGoal || '').toLowerCase().trim();
  if (g === 'gain' || g === 'muscle') {
    return {
      key: 'gain',
      label: 'Ganar Masa Muscular',
      shortLabel: 'Hipertrofia',
      badge: 'Fuerza & Tensión Mecánica',
      iconName: 'Dumbbell',
      color: 'accent',
      description: 'Superávit y sobrecarga progresiva sistemática para maximizar la síntesis proteica y el crecimiento miofibrilar.'
    };
  }
  if (g === 'strength') {
    return {
      key: 'strength',
      label: 'Ganar Fuerza Máxima',
      shortLabel: 'Fuerza',
      badge: 'Adaptación Neuromuscular',
      iconName: 'Dumbbell',
      color: 'purple-500',
      description: 'Cargas altas y descansos amplios para reclutar unidades motoras de alto umbral y máxima eficiencia neural.'
    };
  }
  if (g === 'lose' || g === 'weight_loss') {
    return {
      key: 'lose',
      label: 'Perder Grasa / Definición',
      shortLabel: 'Definición',
      badge: 'Preservación Muscular',
      iconName: 'Flame',
      color: 'emerald-500',
      description: 'Déficit calórico enfocado en mantener la fuerza mecánica para proteger el tejido muscular magro ganado.'
    };
  }
  if (g === 'recomp') {
    return {
      key: 'recomp',
      label: 'Recomposición Corporal',
      shortLabel: 'Recomposición',
      badge: 'Músculo & Grasa',
      iconName: 'Activity',
      color: 'purple-500',
      description: 'Equilibrio entre estímulo neuromuscular óptimo y partición eficiente de nutrientes.'
    };
  }
  return {
    key: 'maintain',
    label: 'Mantenimiento & Salud',
    shortLabel: 'Mantenimiento',
    badge: 'Rendimiento Óptimo',
    iconName: 'Shield',
    color: 'blue-500',
    description: 'Consistencia deportiva, longevidad articular y rendimiento constante.'
  };
};

/**
 * Redondea un peso al incremento estándar de gimnasio (múltiplos de 1.25 o 2.5 kg).
 */
export const roundToWeightStep = (w) => {
  if (w <= 0) return 0;
  if (w >= 30) {
    return Math.round(w / 2.5) * 2.5;
  }
  return Math.round(w / 1.25) * 1.25;
};

/**
 * Auditoría del rango de repeticiones planificado respecto al objetivo del usuario.
 */
export const auditRepsForGoal = (targetReps, goalKey) => {
  const reps = parseInt(targetReps, 10) || 10;
  if (goalKey === 'gain') {
    if (reps < 5) {
      return {
        isSuboptimal: true,
        tag: 'Fuerza Neural (<5 reps)',
        message: 'Para hipertrofia máxima, las series de menos de 5 reps priorizan adaptaciones neurales antes que crecimiento de masa. Lo óptimo para hipertrofia es moverse en 6-12 repeticiones.'
      };
    }
    if (reps > 14) {
      return {
        isSuboptimal: true,
        tag: 'Exceso de Reps (>14 reps)',
        message: 'Hacer más de 14 repeticiones genera excesiva fatiga metabólica y cardiovascular. Para máxima tensión mecánica hipertrófica, se recomienda subir peso y trabajar entre 8 y 12 reps.'
      };
    }
    return {
      isSuboptimal: false,
      tag: 'Rango Óptimo (6-12 reps)',
      message: 'Rango ideal de hipertrofia (6-12 reps): maximiza el reclutamiento motor y la tensión mecánica.'
    };
  }
  if (goalKey === 'strength') {
    if (reps > 6) {
      return {
        isSuboptimal: true,
        tag: 'Reps Altas para Fuerza',
        message: 'Para maximizar fuerza pura neuromuscular, el rango óptimo son 3 a 6 repeticiones pesadas con descansos amplios.'
      };
    }
    return {
      isSuboptimal: false,
      tag: 'Rango Óptimo de Fuerza',
      message: 'Rango óptimo para adaptaciones de fuerza neuromuscular (3-6 reps).'
    };
  }
  if (goalKey === 'lose') {
    if (reps > 14) {
      return {
        isSuboptimal: true,
        tag: 'Riesgo de Catabolismo',
        message: 'En definición, hacer series muy largas (>14 reps) no quema más grasa y puede degradar masa magra. Mantén cargas sólidas entre 6 y 10 reps para preservar tu tejido muscular.'
      };
    }
    return {
      isSuboptimal: false,
      tag: 'Protección Muscular',
      message: 'Rango óptimo para preservar masa muscular en déficit calórico (6-10 reps).'
    };
  }
  return {
    isSuboptimal: false,
    tag: 'Rango Equilibrado',
    message: 'Rango adecuado para rendimiento constante y salud articular (8-12 reps).'
  };
};

/**
 * Genera la estructura de desglose serie a serie para estrategias escalonadas
 * como Top Set (1ª serie récord/fuerza) + Back-off sets (series siguientes de volumen/hipertrofia).
 */
/**
 * Calcula una estimación de peso inicial sensata y segura cuando un ejercicio
 * no cuenta con registros históricos ni peso configurado por el usuario.
 */
export const estimateExerciseInitialWeight = (exerciseName, userProfile = {}) => {
  if (!exerciseName) return 10;
  const name = exerciseName.toLowerCase().trim();
  const gender = userProfile?.gender || userProfile?.sex || 'male';
  const isFemale = gender === 'female' || gender === 'f';

  // 1. Ejercicios corporales / sin carga externa inicial
  if (
    name.includes('dominada') || name.includes('pull-up') || name.includes('chin-up') ||
    name.includes('flexion') || name.includes('flexión') || name.includes('push-up') ||
    name.includes('fondo') || name.includes('dip') ||
    name.includes('plancha') || name.includes('plank') ||
    name.includes('crunch') || name.includes('abdominal') ||
    name.includes('salto') || name.includes('jump') ||
    name.includes('burpee') || name.includes('mountain') ||
    name.includes('gemelo corporal') || name.includes('elevacion talon corporal')
  ) {
    return 0;
  }

  // 2. Pierna pesada (Prensa, Sentadilla Hack)
  if (name.includes('prensa') || name.includes('leg press') || name.includes('hack')) {
    return isFemale ? 40 : 60;
  }

  // 3. Sentadilla con barra / Peso muerto
  if (name.includes('peso muerto') || name.includes('deadlift')) {
    if (name.includes('rumano') && (name.includes('mancuerna') || name.includes('dumbbell'))) {
      return isFemale ? 8 : 14;
    }
    return isFemale ? 25 : 40;
  }
  if (name.includes('sentadilla') || name.includes('squat')) {
    if (name.includes('búlgara') || name.includes('bulgarian') || name.includes('goblet') || name.includes('mancuerna')) {
      return isFemale ? 6 : 10;
    }
    return isFemale ? 20 : 35;
  }

  // 4. Pecho con barra vs mancuerna
  if (name.includes('press banca') || name.includes('bench press') || name.includes('press de banca') || name.includes('pecho barra')) {
    return isFemale ? 15 : 30; // Barra olímpica (20kg) o barra guiada con discos ligeros
  }

  // 5. Ejercicios de aislamiento ligero (Elevaciones laterales, pájaros)
  if (name.includes('lateral') || name.includes('pájaro') || name.includes('pajaro') || name.includes('rear delt') || name.includes('face pull')) {
    return isFemale ? 3 : 6;
  }

  // 6. Brazos (Bíceps / Tríceps)
  if (name.includes('curl') || name.includes('biceps') || name.includes('bíceps') || name.includes('triceps') || name.includes('tríceps')) {
    if (name.includes('polea') || name.includes('cable')) {
      return isFemale ? 10 : 15;
    }
    return isFemale ? 5 : 9;
  }

  // 7. Espalda (Jalones / Remos)
  if (name.includes('jalón') || name.includes('jalon') || name.includes('lat pulldown')) {
    return isFemale ? 20 : 30;
  }
  if (name.includes('remo') || name.includes('row')) {
    if (name.includes('mancuerna')) return isFemale ? 8 : 14;
    return isFemale ? 15 : 25;
  }

  // 8. Hombro (Press militar / hombros)
  if (name.includes('militar') || name.includes('overhead') || name.includes('shoulder press')) {
    if (name.includes('mancuerna')) return isFemale ? 6 : 10;
    return isFemale ? 15 : 20;
  }

  // 9. Poleas generales
  if (name.includes('polea') || name.includes('cable')) {
    return isFemale ? 10 : 15;
  }

  // 10. Mancuernas generales
  if (name.includes('mancuerna') || name.includes('dumbbell')) {
    return isFemale ? 6 : 10;
  }

  // 11. Valor seguro por defecto
  return isFemale ? 10 : 15;
};

export const generateTopSetBackoffPlan = (
  plannedSets, 
  topWeight, 
  topReps, 
  backOffWeight, 
  backOffReps, 
  topSetRir = '1 rep de margen', 
  backOffRir = '1-2 reps de margen'
) => {
  const setsCount = Math.max(3, parseInt(plannedSets, 10) || 3);
  const plan = [];

  // Serie 1: Top Set (frescura neural máxima)
  plan.push({
    set_number: 1,
    type: 'top_set',
    label: 'Serie 1: Top Set',
    badge: 'Pico de Fuerza',
    weight: topWeight,
    reps: topReps,
    rir: topSetRir,
    note: 'Aprovecha tu máxima frescura neuromuscular para mover la carga récord con técnica impecable.'
  });

  // Series 2 a N: Back-off Sets (volumen de hipertrofia con peso descargado)
  for (let i = 2; i <= setsCount; i++) {
    plan.push({
      set_number: i,
      type: 'back_off',
      label: `Serie ${i}: Back-off`,
      badge: 'Volumen Hipertrofia',
      weight: backOffWeight,
      reps: backOffReps,
      rir: backOffRir,
      note: 'Descarga de carga (-10 a 15%) para acumular volumen efectivo sin fallo técnico.'
    });
  }

  return plan;
};

/**
 * Analiza el historial de un ejercicio específico a lo largo de las sesiones del usuario,
 * diferenciando si el ejercicio se realiza en múltiples rutinas para aislar niveles de fatiga.
 */
export const getExerciseHistorySessions = (exerciseName, workoutLog, currentRoutineId = null, currentRoutineName = null) => {
  if (!exerciseName || !Array.isArray(workoutLog) || workoutLog.length === 0) {
    return [];
  }

  const searchName = exerciseName.toLowerCase().trim();

  // Filtrar entrenamientos que contengan este ejercicio
  const matchingLogs = workoutLog.filter(log =>
    log.WorkoutLogDetails?.some(d => d.exercise_name?.toLowerCase().trim() === searchName)
  );

  if (matchingLogs.length === 0) return [];

  // Detectar presencia del ejercicio en múltiples rutinas distintas
  const routineMap = {};
  matchingLogs.forEach(log => {
    const rawRId = log.routine_id || log.routineId;
    const rId = rawRId ? String(rawRId) : 'unassigned';
    const rName = log.routine_name || log.routineName || 'Rutina sin nombre';
    if (!routineMap[rId]) {
      routineMap[rId] = { id: rId, name: rName, count: 0 };
    }
    routineMap[rId].count++;
  });
  const distinctRoutines = Object.values(routineMap);
  const hasMultipleRoutines = distinctRoutines.length > 1;

  // Ordenar de más reciente a más antiguo
  matchingLogs.sort((a, b) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime());

  const sessions = [];
  const currentRIdStr = currentRoutineId ? String(currentRoutineId) : null;
  const currentRNameNorm = currentRoutineName ? String(currentRoutineName).toLowerCase().trim() : null;

  matchingLogs.forEach(log => {
    const detail = log.WorkoutLogDetails.find(
      d => d.exercise_name?.toLowerCase().trim() === searchName
    );
    if (!detail) return;

    const rawSets = detail.WorkoutLogSets || [];
    const workingSets = rawSets.filter(s => {
      const isWarmup = s.is_warmup === true || s.is_warmup === 'true' || s.is_warmup === 1;
      const reps = parseInt(s.reps, 10) || 0;
      return !isWarmup && reps > 0;
    });

    if (workingSets.length === 0 && rawSets.length > 0) {
      workingSets.push(...rawSets.filter(s => (parseInt(s.reps, 10) || 0) > 0));
    }

    if (workingSets.length === 0) return;

    let topWeight = 0;
    let topReps = 0;
    let best1RM = parseFloat(detail.estimated_1rm) || 0;
    let totalVolume = 0;

    workingSets.forEach(s => {
      const weight = parseFloat(s.weight_kg) || 0;
      const reps = parseInt(s.reps, 10) || 0;
      const rir = parseFloat(s.rir) || 0;
      const effectiveReps = reps + rir;
      const set1RM = calculate1RM(weight, effectiveReps);

      totalVolume += weight * reps;

      if (weight > topWeight) {
        topWeight = weight;
        topReps = reps;
      } else if (weight === topWeight && reps > topReps) {
        topReps = reps;
      }

      if (set1RM > best1RM) {
        best1RM = set1RM;
      }
    });

    const rawId = log.routine_id || log.routineId;
    const resolvedName = log.routine_name || log.routineName || 'Rutina';
    const isCurrent = Boolean(
      (currentRIdStr && rawId && String(rawId) === currentRIdStr) ||
      (currentRNameNorm && resolvedName && resolvedName.toLowerCase().trim() === currentRNameNorm)
    );

    sessions.push({
      logId: log.id,
      routineId: rawId ? String(rawId) : null,
      routineName: resolvedName,
      isCurrentRoutine: isCurrent,
      date: log.workout_date || log.date || log.created_at || new Date().toISOString(),
      topWeight: Math.round(topWeight * 10) / 10,
      topReps,
      best1RM: Math.round(best1RM * 10) / 10,
      totalVolume: Math.round(totalVolume),
      setsCount: workingSets.length,
      sets: workingSets
    });
  });

  // Filtrado de sesiones de la MISMA rutina (por ID o por nombre)
  const sameRoutineSessions = sessions.filter(s => s.isCurrentRoutine);

  sessions.routineContext = {
    hasMultipleRoutines,
    distinctRoutines,
    currentRoutineId: currentRIdStr,
    currentRoutineName: currentRoutineName || null,
    sameRoutineSessionsCount: sameRoutineSessions.length,
    sameRoutineSessions
  };

  return sessions;
};

/**
 * Diagnostica si el usuario está progresando, estancado o disminuyendo en este ejercicio.
 * Si el ejercicio está en varias rutinas, prioriza el historial de la misma rutina.
 */
export const diagnoseExerciseTrend = (sessions, currentRoutineId = null) => {
  if (!sessions || sessions.length === 0) {
    return {
      status: 'first_time',
      label: 'Sesión Inicial',
      badgeText: 'Calibración inicial',
      colorClass: 'text-accent border-accent/30 bg-accent/10',
      isWarning: false,
      isProgressing: false,
      delta1RM: 0,
      deltaWeight: 0,
      deltaReps: 0,
      weeksStagnant: 0,
      pctChange: 0
    };
  }

  // Priorizar sesiones de la misma rutina si existen en routineContext
  let targetSessions = sessions;
  const rCtx = sessions.routineContext;
  if (rCtx?.sameRoutineSessions && rCtx.sameRoutineSessions.length > 0) {
    targetSessions = rCtx.sameRoutineSessions;
  }

  if (targetSessions.length === 1) {
    return {
      status: 'calibrating',
      label: 'Estableciendo Base',
      badgeText: '1 sesión previa registrada',
      colorClass: 'text-accent border-accent/30 bg-accent/10',
      isWarning: false,
      isProgressing: false,
      delta1RM: 0,
      deltaWeight: 0,
      deltaReps: 0,
      weeksStagnant: 0,
      pctChange: 0
    };
  }

  const s0 = targetSessions[0]; // Más reciente
  const s1 = targetSessions[1]; // Anterior
  const delta1RM = Math.round((s0.best1RM - s1.best1RM) * 10) / 10;
  const deltaWeight = Math.round((s0.topWeight - s1.topWeight) * 10) / 10;
  const deltaReps = s0.topReps - s1.topReps;

  const baseline1RM = s1.best1RM > 0 ? s1.best1RM : (s1.topWeight || 1);
  const pctChange = Math.round(((s0.best1RM - s1.best1RM) / baseline1RM) * 1000) / 10;

  // Comprobar semanas estancado si son varias sesiones iguales
  let weeksStagnant = 0;

  if (targetSessions.length >= 2) {
    const isWeightSame = Math.abs(deltaWeight) < 0.5;
    const isRepsSameOrLower = deltaReps <= 0;

    if (isWeightSame && isRepsSameOrLower) {
      const earliestDate = new Date(targetSessions[Math.min(targetSessions.length - 1, 3)].date);
      const latestDate = new Date(s0.date);
      const eTime = earliestDate.getTime();
      const lTime = latestDate.getTime();
      const diffDays = (!isNaN(eTime) && !isNaN(lTime))
        ? Math.max(7, Math.round((lTime - eTime) / (1000 * 60 * 60 * 24)))
        : 7;
      weeksStagnant = Math.max(1, Math.round(diffDays / 7));
    }
  }

  // 1. Progresando
  if (delta1RM >= 1.0 || deltaWeight > 0 || (Math.abs(deltaWeight) < 0.5 && deltaReps >= 1)) {
    return {
      status: 'progressing',
      label: 'En Progresión',
      badgeText: `+${Math.abs(pctChange)}% fuerza`,
      colorClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      isWarning: false,
      isProgressing: true,
      delta1RM,
      deltaWeight,
      deltaReps,
      weeksStagnant: 0,
      pctChange
    };
  }

  // 2. Disminuido / Fatiga
  if (delta1RM <= -2.0 || deltaWeight < -1.0 || (Math.abs(deltaWeight) < 0.5 && deltaReps <= -2)) {
    return {
      status: 'decreasing',
      label: 'Rendimiento Reducido',
      badgeText: `${pctChange}% de fatiga`,
      colorClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      isWarning: true,
      isProgressing: false,
      delta1RM,
      deltaWeight,
      deltaReps,
      weeksStagnant: 0,
      pctChange
    };
  }

  // 3. Estancado (Mismo peso en varias sesiones)
  return {
    status: 'stagnant',
    label: 'Mismo Peso',
    badgeText: weeksStagnant > 1 ? `Mismo peso (${weeksStagnant} sem)` : 'Mismo peso reciente',
    colorClass: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
    isWarning: true,
    isProgressing: false,
    delta1RM,
    deltaWeight,
    deltaReps,
    weeksStagnant: weeksStagnant || 1,
    pctChange
  };
};

/**
 * Genera el plan inteligente de peso, series, repeticiones y opciones seleccionables
 * según el objetivo, el historial científico del ejercicio, el feedback de dificultad
 * y los incrementos de discos reales de gimnasio.
 */
export const generateSmartCoachPlan = (exercise, userProfile, workoutLog, options = {}) => {
  const { 
    currentRoutineId = null, 
    currentRoutineName = null, 
    difficultyFeedback = 'normal' 
  } = (typeof options === 'object' && options !== null) ? options : {};

  const goalInfo = normalizeUserGoal(userProfile?.goal);
  const sessions = getExerciseHistorySessions(exercise.name, workoutLog, currentRoutineId, currentRoutineName);

  // AISLAMIENTO ESTRICTO DE RUTINA:
  // Si hay registros en esta rutina, las recomendaciones y baselines se calculan 100% sobre esta rutina
  const rCtx = sessions.routineContext;
  const isRoutineIsolated = Boolean(rCtx?.sameRoutineSessions && rCtx.sameRoutineSessions.length > 0);
  const targetSessions = (currentRoutineId || currentRoutineName)
    ? (rCtx?.sameRoutineSessions || [])
    : sessions;

  const trend = diagnoseExerciseTrend(targetSessions, currentRoutineId);

  // Comprobar si hubo una estrategia aplicada previamente para seguimiento continuo y recuperación
  const lastAppliedStrategy = getAppliedCoachStrategy(exercise.name);
  const followUp = evaluateExerciseFollowUpAndRecovery({
    exerciseName: exercise.name,
    sessions: targetSessions,
    currentTrend: trend,
    lastApplied: lastAppliedStrategy,
    userProfile
  });

  const plannedSets = parseInt(exercise.sets, 10) || 3;
  const rawReps = String(exercise.reps || '10');
  const targetReps = parseInt(rawReps.split('-')[0], 10) || 10;
  const lastSession = targetSessions[0] || null;

  // Auditoría del rango de repeticiones según objetivo
  const repGoalAudit = auditRepsForGoal(targetReps, goalInfo.key);

  // Detección de repeticiones logradas en la sesión previa de ESTA rutina
  const actualPreviousReps = lastSession?.topReps || 0;
  const missedTargetInPrevious = actualPreviousReps > 0 && actualPreviousReps < targetReps;

  // Feedback interactivo directo del usuario:
  const isCannotReach = difficultyFeedback === 'cannot_reach';
  const isStruggling = difficultyFeedback === 'struggling';
  const isNormal = difficultyFeedback === 'normal';

  // Detección de carga base / histórica o estimación inteligente
  let calculatedInitialWeight = 0;
  let initialWeightSource = 'session_history'; // 'session_history' | 'routine_history' | 'exercise_preset' | 'estimated'

  if (lastSession && lastSession.topWeight !== undefined) {
    calculatedInitialWeight = lastSession.topWeight;
    initialWeightSource = 'session_history';
  } else if (sessions.length > 0 && sessions[0].topWeight > 0) {
    calculatedInitialWeight = sessions[0].topWeight;
    initialWeightSource = 'routine_history';
  } else if (parseFloat(exercise.weight) > 0) {
    calculatedInitialWeight = parseFloat(exercise.weight);
    initialWeightSource = 'exercise_preset';
  } else {
    calculatedInitialWeight = estimateExerciseInitialWeight(exercise.name, userProfile);
    initialWeightSource = 'estimated';
  }

  const currentTopWeight = calculatedInitialWeight;
  const isBodyweight = currentTopWeight === 0;
  const isCalibratingSession = targetSessions.length === 0;
  const canUseTopSetBackoff = plannedSets >= 3 && !isBodyweight && currentTopWeight >= 15;

  // Incremento realista de gimnasio:
  // En barras estándar, los discos mínimos en el 95% de los gimnasios son de 1.25 kg por lado (+2.5 kg totales).
  // Solo en pesos muy ligeros (< 15 kg, mancuernas de aislamiento o poleas con micro-pin) se usan saltos de 1.25 kg.
  const realisticIncrement = currentTopWeight < 15 ? 1.25 : 2.5;
  const nextWeight = Math.round((currentTopWeight + realisticIncrement) * 10) / 10;

  // Contexto de rutina
  const activeRoutineName = currentRoutineName || (sessions.routineContext?.distinctRoutines.find(r => r.id === String(currentRoutineId))?.name) || 'Rutina actual';
  const routineContext = sessions.routineContext ? {
    hasMultipleRoutines: sessions.routineContext.hasMultipleRoutines,
    currentRoutineName: activeRoutineName,
    otherRoutines: sessions.routineContext.distinctRoutines.filter(r => r.id !== String(currentRoutineId)),
    sameRoutineSessionsCount: rCtx?.sameRoutineSessions?.length || 0,
    isRoutineIsolated,
    note: isRoutineIsolated
      ? `Recomendaciones basadas al 100% en tu historial de ${activeRoutineName} (${rCtx.sameRoutineSessions.length} sesiones). Aislamos la fatiga de otros entrenamientos.`
      : sessions.routineContext.hasMultipleRoutines
      ? `Detectamos este ejercicio en otras rutinas. Calculamos una carga inicial para ${activeRoutineName} sin arrastrar fatiga.`
      : null
  } : null;

  // Nota explicativa sobre discos y barras
  const plateNote = {
    standardJump: realisticIncrement,
    text: `Nota sobre discos: En barra estándar, el salto mínimo habitual son discos de 1.25 kg por lado (+2.5 kg totales). Si tu gimnasio cuenta con micro-discos (+0.5 kg por lado = +1 kg total) o polea con micro-pin, úsalos para una progresión más suave. Si +2.5 kg te resulta muy pesado, la opción óptima es progresar sumando repeticiones con tu peso actual.`
  };

  let suggestedWeight = currentTopWeight;
  let suggestedSets = plannedSets;
  let suggestedReps = targetReps;
  let intensityLabel = 'Esfuerzo Alto';
  let intensityDesc = 'Parar 1-2 reps antes de fallar';
  let suggestedRir = '1-2 reps en recámara';
  let suggestedRest = '90 - 120 seg';
  let actionTitle = '';
  let actionDirection = 'maintain'; // 'up' | 'down' | 'maintain'
  let weightChangeNote = '';
  let coachingAdvice = '';
  let actionSteps = [];
  let strategyOptions = [];
  let motivationalMessage = null;
  let celebrationData = null;
  let asesoriaRecommendation = {
    show: true,
    headline: '¿Quieres optimizar tu técnica y progreso?',
    description: 'En la Asesoría Pro Fitness, un entrenador real analiza tus vídeos de levantamiento y programa tus sobrecargas para avanzar con total seguridad.',
    buttonText: 'Consultar Entrenador Real'
  };

  const reducedWeight = Math.max(0, roundToWeightStep(currentTopWeight * 0.9));
  const diffReducedKg = Math.round((currentTopWeight - reducedWeight) * 10) / 10;
  const pauseReps = Math.max(5, targetReps - 2);
  const safeReducedReps = Math.max(4, targetReps - 2);

  // ============================================================
  // GENERACIÓN DE OBJETIVOS Y ESTRATEGIAS SEGÚN SENSACIÓN DEL USUARIO
  // ============================================================

  // ------------------------------------------------------------
  // CASO A: EL USUARIO INDICA "NO LLEGO" (🔴 CARGA ALTA / FALLO TÉCNICO)
  // ------------------------------------------------------------
  if (isCannotReach) {
    suggestedWeight = reducedWeight > 0 ? reducedWeight : currentTopWeight;
    suggestedReps = targetReps;
    suggestedSets = plannedSets;
    actionDirection = 'down';
    intensityLabel = 'Descarga Táctica';
    intensityDesc = 'Priorizar técnica limpia';
    suggestedRir = '2 reps en recámara';
    suggestedRest = '120 - 150 seg';
    weightChangeNote = reducedWeight > 0 ? `-${diffReducedKg} kg (-10%)` : 'Reducir repeticiones';
    actionTitle = 'Descarga Táctica: -10% para clavar repeticiones con técnica limpia';
    coachingAdvice = `Nos indicas que no llegas a las ${targetReps} repeticiones. Para evitar fallos técnicos o sobrecarga articular, lo más óptimo para tu progreso en ${activeRoutineName} es aplicar una ligera descarga y consolidar el rango de repeticiones con técnica limpia.`;
    actionSteps = [
      `Baja a ${suggestedWeight} kg para asegurar que completas las ${targetReps} reps con 2 repeticiones de margen antes de fallar.`,
      'Concéntrate en la velocidad concéntrica y el control del movimiento.',
      'Una descarga a tiempo previene semanas de estancamiento por sobreesfuerzo.'
    ];

    strategyOptions = [
      {
        id: 'strat_deload_cannot_reach',
        title: `🔴 Descarga Táctica (-10% a ${reducedWeight} kg)`,
        tag: 'Recomendada',
        badge: `Todas a ${reducedWeight}kg`,
        suggestedWeight: reducedWeight,
        suggestedReps: targetReps,
        suggestedSets: plannedSets,
        motive: `Bajar un 10% la carga disipa la fatiga acumulada en articulaciones y tendones, permitiendo que tus fibras musculares completen las ${targetReps} reps con técnica impecable y margen de seguridad (parando 2 repeticiones antes de no poder más).`,
        description: `Ajusta a ${reducedWeight} kg en todas las series para clavar las ${targetReps} repeticiones sin trampas.`
      },
      {
        id: 'strat_reduce_reps_cannot_reach',
        title: `🔴 Reducir Repeticiones (${safeReducedReps} reps con ${currentTopWeight} kg)`,
        tag: 'Mantener Carga',
        badge: `${safeReducedReps} reps con ${currentTopWeight}kg`,
        suggestedWeight: currentTopWeight,
        suggestedReps: safeReducedReps,
        suggestedSets: plannedSets,
        motive: `Si prefieres mantener los ${currentTopWeight} kg, recortar a ${safeReducedReps} repeticiones evita el fallo forzado y mantiene la barra a máxima velocidad concéntrica.`,
        description: `Mantén ${currentTopWeight} kg pero detén cada serie en ${safeReducedReps} repeticiones limpias, parando 1 o 2 antes del agotamiento.`
      }
    ];

    if (canUseTopSetBackoff) {
      const topCannotReps = Math.max(4, targetReps - 3);
      strategyOptions.push({
        id: 'strat_topset_cannot_reach',
        title: '🔴 Top Set Reducido + Back-off Protector',
        tag: 'Carga Mixta',
        badge: `1ª ${currentTopWeight}kg · Resto ${reducedWeight}kg`,
        suggestedWeight: currentTopWeight,
        suggestedReps: topCannotReps,
        suggestedSets: plannedSets,
        perSetPlan: generateTopSetBackoffPlan(plannedSets, currentTopWeight, topCannotReps, reducedWeight, targetReps, '1 rep de margen', '2 reps de margen'),
        motive: `Toca los ${currentTopWeight} kg únicamente en la 1ª serie a ${topCannotReps} reps para mantener el estímulo de fuerza sin quemarte, y realiza las series restantes a ${reducedWeight} kg para acumular volumen seguro.`,
        description: `1ª serie a ${currentTopWeight} kg (${topCannotReps} reps) + ${plannedSets - 1} series a ${reducedWeight} kg (${targetReps} reps).`
      });
    }

  // ------------------------------------------------------------
  // CASO B: EL USUARIO INDICA "ME CUESTA" (🟡 AL LÍMITE / CONSOLIDAR)
  // ------------------------------------------------------------
  } else if (isStruggling) {
    suggestedWeight = currentTopWeight;
    suggestedReps = targetReps;
    suggestedSets = plannedSets;
    actionDirection = 'maintain';
    intensityLabel = 'Consolidar Control';
    intensityDesc = 'Parar 1 rep antes del fallo';
    suggestedRir = '1 rep en recámara';
    suggestedRest = '120 - 180 seg';
    weightChangeNote = `Consolidar ${currentTopWeight} kg`;
    actionTitle = `Consolidar Carga: Afianza tus ${currentTopWeight} kg`;
    coachingAdvice = actualPreviousReps > 0 && actualPreviousReps < targetReps
      ? `En tu última sesión de ${activeRoutineName} completaste ${actualPreviousReps} de las ${targetReps} repeticiones planeadas. Antes de subir kilos o series, el objetivo prioritario para tu musculatura es afianzar unas sólidas ${targetReps} repeticiones con ${currentTopWeight} kg.`
      : `Nos indicas que te cuesta llegar a las ${targetReps} repeticiones. Para no sobrecargar articulaciones ni forzar una serie con mala técnica, te recomendamos afianzar los ${currentTopWeight} kg completando las repeticiones sin subir carga hoy.`;
    actionSteps = [
      `Mantén los ${currentTopWeight} kg y céntrate en completar las ${targetReps} repeticiones con técnica perfecta.`,
      'Detén la serie cuando sientas que te queda 1 repetición en reserva antes de fallar.',
      'Si sientes mucha fatiga en las últimas series, descansa 3 minutos completos.'
    ];

    strategyOptions = [
      {
        id: 'strat_consolidate_struggling',
        title: `🟡 Consolidar ${currentTopWeight} kg (Buscar ${targetReps} reps)`,
        tag: 'Recomendada',
        badge: `Mantener ${currentTopWeight}kg`,
        suggestedWeight: currentTopWeight,
        suggestedReps: targetReps,
        suggestedSets: plannedSets,
        motive: `Afianzar las ${targetReps} repeticiones con los ${currentTopWeight} kg actuales consolida el control neuromuscular. Subir de peso cuando aún cuesta llegar solo provocaría acortar el recorrido o usar inercia.`,
        description: `Mantén los ${currentTopWeight} kg y busca clavar las ${targetReps} repeticiones con control total y 1 repetición de margen.`
      },
      {
        id: 'strat_pause_struggling',
        title: `🟡 Pausa en Estiramiento a Reps Reducidas (${pauseReps} reps)`,
        tag: 'Técnica & Tensión',
        badge: `Pausa 2s · ${pauseReps} reps`,
        suggestedWeight: currentTopWeight,
        suggestedReps: pauseReps,
        suggestedSets: plannedSets,
        motive: `Hacer pausas de 2 segundos en el punto de estiramiento elimina el rebote y aumenta la dificultad un 15-20%. Como cuesta llegar a ${targetReps} reps, reducimos a ${pauseReps} reps para que la pausa isométrica sea 100% controlada sin riesgo de fallo prematuro.`,
        description: `Mantén ${currentTopWeight} kg, haz ${pauseReps} reps y pausa 2 segundos abajo. Máximo estímulo muscular sin llegar al agotamiento.`
      }
    ];

    if (canUseTopSetBackoff) {
      const struggleBackOff = roundToWeightStep(currentTopWeight * 0.9);
      strategyOptions.push({
        id: 'strat_topset_struggling',
        title: '🟡 Top Set Protector + Back-off',
        tag: 'Menos Fatiga',
        badge: `1ª ${currentTopWeight}kg · Resto ${struggleBackOff}kg`,
        suggestedWeight: currentTopWeight,
        suggestedReps: Math.max(5, targetReps - 2),
        suggestedSets: plannedSets,
        perSetPlan: generateTopSetBackoffPlan(plannedSets, currentTopWeight, Math.max(5, targetReps - 2), struggleBackOff, targetReps, '1 rep de margen', '2 reps de margen'),
        motive: `Hacer la 1ª serie a ${currentTopWeight} kg con ${Math.max(5, targetReps - 2)} reps aprovecha tu energía fresca, y descargar a ${struggleBackOff} kg en las series restantes te permite acumular volumen sin agotar tu sistema nervioso.`,
        description: `Serie 1 a ${currentTopWeight} kg (${Math.max(5, targetReps - 2)} reps) + Series 2-${plannedSets} con descarga a ${struggleBackOff} kg para no agotarte.`
      });
    }

  // ------------------------------------------------------------
  // CASO C: EL USUARIO INDICA "LLEGO BIEN" (🟢 CON ENERGÍA / SOBRECARGA)
  // ------------------------------------------------------------
  } else {
    // Si es una sesión de calibración inicial (sin registros previos en esta rutina)
    if (isCalibratingSession) {
      suggestedWeight = currentTopWeight;
      suggestedReps = targetReps;
      suggestedSets = plannedSets;
      actionDirection = 'maintain';
      intensityLabel = 'Calibración Inicial';
      intensityDesc = 'Parar 1-2 reps antes de no poder más';
      suggestedRir = '1-2 reps en recámara';
      suggestedRest = '90 - 120 seg';
      weightChangeNote = currentTopWeight > 0 ? `${currentTopWeight} kg inicial` : 'Peso corporal';
      actionTitle = initialWeightSource === 'routine_history' 
        ? `Carga Base: ${currentTopWeight} kg según tu historial`
        : initialWeightSource === 'estimated'
        ? `Carga Inicial Sugerida: ${currentTopWeight > 0 ? `${currentTopWeight} kg` : 'Corporal'}`
        : `Carga Base: ${currentTopWeight} kg`;

      if (initialWeightSource === 'routine_history') {
        coachingAdvice = `Al ser tu primera sesión de este ejercicio en ${activeRoutineName}, calculamos una carga inicial de ${currentTopWeight} kg basándonos en tu historial en ${sessions[0]?.routineName || 'otra de tus rutinas'}. Te sugerimos hacer tu primera serie con este peso y ajustar si el orden de los ejercicios de hoy te hace llegar con más o menos energía.`;
      } else if (initialWeightSource === 'exercise_preset') {
        coachingAdvice = `Al ser tu primera sesión en ${activeRoutineName}, tomamos como base los ${currentTopWeight} kg guardados en tu rutina. Haz tu primera serie con este peso para comprobar si terminas las ${targetReps} repeticiones cansado pero con fuerza para 1 o 2 más.`;
      } else {
        coachingAdvice = `Al no tener datos registrados de este ejercicio, hemos calculado una carga inicial sugerida de ${currentTopWeight > 0 ? `${currentTopWeight} kg` : 'peso corporal'} para que puedas tantear el movimiento. Haz tu primera serie con este peso: si vas muy sobrado sube un poco en la siguiente, y si te cuesta baja para completar las repeticiones con buena técnica sin llegar al límite.`;
      }

      actionSteps = [
        `Prueba con ${currentTopWeight > 0 ? `${currentTopWeight} kg` : 'peso corporal'} en tu primera serie de trabajo.`,
        'Detén la serie cuando sientas que podrías hacer como mucho 1 o 2 repeticiones más.',
        'Si notas el peso muy ligero, sube 2.5 kg en la siguiente serie; si te cuesta, mantén o baja un poco.'
      ];

      const calibOptions = [
        {
          id: 'strat_calib_recommended_normal',
          title: `🟢 Carga Inicial Sugerida (${currentTopWeight > 0 ? `${currentTopWeight} kg` : 'Corporal'})`,
          tag: 'Recomendada',
          badge: currentTopWeight > 0 ? `Todas a ${currentTopWeight}kg` : 'Corporal',
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: initialWeightSource === 'routine_history'
            ? `Basada en los ${currentTopWeight} kg que levantaste en ${sessions[0]?.routineName || 'otra de tus rutinas'}. Te sirve como referencia directa para esta sesión.`
            : `Carga calculada automáticamente para un inicio seguro. Te permite tantear el ejercicio sin riesgo de sobrecarga ni lesión.`,
          description: `Prueba con ${currentTopWeight > 0 ? `${currentTopWeight} kg` : 'peso corporal'} en tu 1ª serie y ajusta según cómo notes el esfuerzo.`
        }
      ];

      if (currentTopWeight > 5) {
        const lightCalibWeight = Math.max(0, roundToWeightStep(currentTopWeight * 0.8));
        calibOptions.push({
          id: 'strat_calib_conservative_normal',
          title: `🟢 Inicio Más Ligero (${lightCalibWeight} kg)`,
          tag: 'Más Margen',
          badge: `${lightCalibWeight} kg`,
          suggestedWeight: lightCalibWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: 'Empezar un 20% más ligero asegura que tus tendones y articulaciones se adapten a la trayectoria del ejercicio sin fatiga ni molestias.',
          description: `Comienza con ${lightCalibWeight} kg con bajada controlada para aprender bien el movimiento.`
        });
      }

      strategyOptions = calibOptions;
    } else {
      // Progresión normal con carga previa registrada en esta rutina
      suggestedWeight = nextWeight;
      suggestedReps = targetReps;
      suggestedSets = plannedSets;
      actionDirection = 'up';
      intensityLabel = 'Esfuerzo Alto';
      intensityDesc = 'Parar 1-2 reps antes de fallar';
      suggestedRir = '1-2 reps en recámara';
      suggestedRest = '120 - 180 seg';
      weightChangeNote = `+${realisticIncrement} kg`;
      actionTitle = `Sobrecarga Progresiva: Sube a ${nextWeight} kg`;
      coachingAdvice = `Al haber asimilado tu carga previa en ${activeRoutineName}, tus fibras musculares ya toleran esa tensión. En barras estándar los discos mínimos habituales son de 1.25 kg por lado (+2.5 kg totales). Si dispones de micro-discos (+0.5 kg por lado = +1 kg total) úsalos; si no, aplica el salto realista de +2.5 kg o progresa en repeticiones.`;
      actionSteps = [
        `Trabaja con ${nextWeight} kg buscando mantener una técnica estricta.`,
        `Si notas el salto de peso muy exigente, mantén el rango de ${Math.max(6, targetReps - 2)}-${targetReps} reps parando 1-2 antes del fallo.`,
        'Descansa entre 2 y 3 minutos para restaurar tus reservas de fosfocreatina.'
      ];

      const linearOption = {
        id: 'strat_linear_normal',
        title: `🟢 Sobrecarga Lineal (+${realisticIncrement} kg)`,
        tag: 'Carga Uniforme',
        badge: `Todas a ${nextWeight}kg`,
        suggestedWeight: nextWeight,
        suggestedReps: targetReps,
        suggestedSets: plannedSets,
        motive: `Subir +${realisticIncrement} kg (1.25 kg a cada lado de la barra o micro-discos) en todas tus series introduce una tensión mecánica constante, el estímulo principal para forzar nueva síntesis proteica muscular.`,
        description: `Sube a ${nextWeight} kg en todas tus series de trabajo (+1.25 kg por lado o micro-discos si tienes).`
      };

      const repsOption = {
        id: 'strat_reps_normal',
        title: '🟢 Consolidar Carga (+1 Repetición)',
        tag: 'Alternativa Suave',
        badge: `+1 rep con ${currentTopWeight}kg`,
        suggestedWeight: currentTopWeight,
        suggestedReps: targetReps + 1,
        suggestedSets: plannedSets,
        motive: `Si el salto de discos de tu gimnasio es demasiado grande, consolidar 1 repetición más con los mismos ${currentTopWeight} kg aumenta el tonelaje efectivo con cero riesgo articular.`,
        description: `Mantén los ${currentTopWeight} kg y busca 1 repetición adicional (${targetReps + 1} reps) por serie antes de meter más discos.`
      };

      if (canUseTopSetBackoff) {
        const progTopReps = Math.max(5, targetReps - 2);
        const topSetOption = {
          id: 'strat_topset_normal',
          title: '🟢 Top Set + Back-off (Pico de Sobrecarga)',
          tag: 'Recomendada (Escalonada)',
          badge: `1ª ${nextWeight}kg · Resto ${currentTopWeight}kg`,
          suggestedWeight: nextWeight,
          suggestedReps: progTopReps,
          suggestedSets: plannedSets,
          perSetPlan: generateTopSetBackoffPlan(plannedSets, nextWeight, progTopReps, currentTopWeight, targetReps),
          motive: `Subir a ${nextWeight} kg solo en la 1ª serie estimula la tensión mecánica máxima aprovechando tu energía intacta, mientras que las series siguientes a ${currentTopWeight} kg consolidan el volumen sin fatiga excesiva.`,
          description: `Sube a ${nextWeight} kg en tu 1ª serie récord (${progTopReps} reps) y mantén ${currentTopWeight} kg en las series 2-${plannedSets} (${targetReps} reps) para no agotarte.`
        };

        strategyOptions = [topSetOption, linearOption, repsOption];
      } else {
        linearOption.tag = 'Recomendada';
        strategyOptions = [linearOption, repsOption];
      }
    }
  }

  // Celebraciones contextuales según tendencia
  if (trend.status === 'progressing') {
    celebrationData = {
      isCelebrating: true,
      title: '¡Excelente progreso! Estás superando tus marcas',
      subtitle: `Tu rendimiento ha aumentado un ${trend.badgeText} respecto a tu sesión anterior en ${activeRoutineName}.`,
      tipsToMaintain: [
        'No te apresures: los incrementos graduales (1.25 a 2.5 kg) construyen fuerza sólida a largo plazo.',
        'Mantén la misma profundidad y cadencia estricta que cuando levantabas menos carga.',
        'Prioriza tu recuperación post-entrenamiento: duerme 7-8 horas y consume suficiente proteína.'
      ]
    };
  }

  return {
    userGoal: goalInfo,
    trend,
    routineContext,
    repGoalAudit,
    plateNote,
    difficultyFeedback,
    missedTargetInPrevious,
    actualPreviousReps,
    targets: {
      suggestedWeight,
      suggestedSets,
      suggestedReps,
      intensityLabel,
      intensityDesc,
      suggestedRir,
      suggestedRest,
      actionTitle,
      actionDirection,
      weightChangeNote,
      actionSteps
    },
    coachingAdvice,
    sessions,
    strategyOptions,
    motivationalMessage,
    celebrationData,
    asesoriaRecommendation,
    followUp,
    currentTopWeight
  };
};
