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
export const generateTopSetBackoffPlan = (
  plannedSets, 
  topWeight, 
  topReps, 
  backOffWeight, 
  backOffReps, 
  topSetRir = 'RIR 1', 
  backOffRir = 'RIR 1-2'
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
export const getExerciseHistorySessions = (exerciseName, workoutLog, currentRoutineId = null) => {
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
    const rId = log.routine_id ? String(log.routine_id) : 'unassigned';
    const rName = log.routine_name || 'Rutina sin nombre';
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

    sessions.push({
      logId: log.id,
      routineId: log.routine_id ? String(log.routine_id) : null,
      routineName: log.routine_name || 'Rutina',
      date: log.workout_date || log.date || log.created_at || new Date().toISOString(),
      topWeight: Math.round(topWeight * 10) / 10,
      topReps,
      best1RM: Math.round(best1RM * 10) / 10,
      totalVolume: Math.round(totalVolume),
      setsCount: workingSets.length,
      sets: workingSets
    });
  });

  const currentRIdStr = currentRoutineId ? String(currentRoutineId) : null;
  const sameRoutineSessions = currentRIdStr
    ? sessions.filter(s => s.routineId === currentRIdStr)
    : [];

  sessions.routineContext = {
    hasMultipleRoutines,
    distinctRoutines,
    currentRoutineId: currentRIdStr,
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

  // Priorizar sesiones de la misma rutina si el ejercicio está presente en varias
  let targetSessions = sessions;
  const rCtx = sessions.routineContext;
  if (rCtx?.hasMultipleRoutines && rCtx.sameRoutineSessions?.length >= 2) {
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
  const sessions = getExerciseHistorySessions(exercise.name, workoutLog, currentRoutineId);
  const trend = diagnoseExerciseTrend(sessions, currentRoutineId);

  // Comprobar si hubo una estrategia aplicada previamente para seguimiento continuo y recuperación
  const lastAppliedStrategy = getAppliedCoachStrategy(exercise.name);
  const followUp = evaluateExerciseFollowUpAndRecovery({
    exerciseName: exercise.name,
    sessions,
    currentTrend: trend,
    lastApplied: lastAppliedStrategy,
    userProfile
  });

  const plannedSets = parseInt(exercise.sets, 10) || 3;
  const rawReps = String(exercise.reps || '10');
  const targetReps = parseInt(rawReps.split('-')[0], 10) || 10;
  const lastSession = sessions[0] || null;

  // Auditoría del rango de repeticiones según objetivo
  const repGoalAudit = auditRepsForGoal(targetReps, goalInfo.key);

  // Detección de repeticiones logradas en la sesión previa vs planificadas
  const actualPreviousReps = lastSession?.topReps || 0;
  const missedTargetInPrevious = actualPreviousReps > 0 && actualPreviousReps < targetReps;
  const isStruggling = difficultyFeedback === 'struggling' || missedTargetInPrevious;
  const isCannotReach = difficultyFeedback === 'cannot_reach';

  const isBodyweight = lastSession ? lastSession.topWeight === 0 : false;
  const currentTopWeight = lastSession?.topWeight || 0;
  const canUseTopSetBackoff = plannedSets >= 3 && !isBodyweight && currentTopWeight >= 15;

  // Incremento realista de gimnasio:
  // En barras estándar, los discos mínimos en el 95% de los gimnasios son de 1.25 kg por lado (+2.5 kg totales).
  // Solo en pesos muy ligeros (< 15 kg, mancuernas de aislamiento o poleas con micro-pin) se usan saltos de 1.25 kg.
  const realisticIncrement = currentTopWeight < 15 ? 1.25 : 2.5;
  const nextWeight = Math.round((currentTopWeight + realisticIncrement) * 10) / 10;

  // Contexto de rutina (para saber si el ejercicio se repite en otras rutinas con fatiga diferente)
  const routineContext = sessions.routineContext ? {
    hasMultipleRoutines: sessions.routineContext.hasMultipleRoutines,
    currentRoutineName: currentRoutineName || (sessions.routineContext.distinctRoutines.find(r => r.id === String(currentRoutineId))?.name) || 'Rutina actual',
    otherRoutines: sessions.routineContext.distinctRoutines.filter(r => r.id !== String(currentRoutineId)),
    note: sessions.routineContext.hasMultipleRoutines
      ? `Este ejercicio también está en otras de tus rutinas. Para que el cansancio o el orden de ejercicios de otros días no interfiera, analizamos prioritariamente tu progreso en esta rutina.`
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
  let suggestedRir = '1-2 del fallo';
  let suggestedRest = '90 - 120 seg';
  let actionTitle = '';
  let actionDirection = 'maintain'; // 'up' | 'down' | 'maintain'
  let weightChangeNote = '';
  let coachingAdvice = '';
  let actionSteps = [];
  let strategyOptions = [];
  let motivationalMessage = null;
  let celebrationData = null;
  let asesoriaRecommendation = null;

  // ============================================================
  // CASO 1: PRIMERA VEZ O ESTABLECIENDO BASE
  // ============================================================
  if (trend.status === 'first_time' || trend.status === 'calibrating') {
    suggestedSets = plannedSets;
    suggestedReps = targetReps;
    suggestedWeight = currentTopWeight > 0 ? currentTopWeight : null;

    asesoriaRecommendation = {
      show: true,
      headline: '¿Quieres dominar este ejercicio desde el primer día?',
      description: 'En la Asesoría Pro Fitness, un entrenador real puede revisar tus vídeos de técnica para evitar malos hábitos o molestias desde el inicio.',
      buttonText: 'Hablar con un Entrenador Real'
    };

    if (goalInfo.key === 'gain') {
      intensityLabel = 'Esfuerzo Alto';
      intensityDesc = 'Parar 1-2 reps antes de fallar';
      actionTitle = 'Calibración de Fuerza e Hipertrofia';
      weightChangeNote = currentTopWeight > 0 ? `${currentTopWeight} kg base` : 'Establecer carga';
      coachingAdvice = 'Para maximizar la ganancia muscular desde el inicio, busca un peso exigente con el que completes tus repeticiones sintiendo que podrías haber hecho como mucho 1 o 2 repeticiones más antes de fallar (RIR 1-2).';
      actionSteps = [
        'Haz 1-2 series de aproximación con poco peso para calentar.',
        'Selecciona una carga con la que llegues a la última repetición con técnica impecable.',
        'Detén cada serie cuando sientas que te quedan 1 o 2 repeticiones en reserva.'
      ];
      strategyOptions = [
        {
          id: 'calibrate_standard',
          title: 'Calibración Estándar de Hipertrofia',
          tag: 'Recomendada',
          badge: 'RIR 1-2',
          suggestedWeight: currentTopWeight > 0 ? currentTopWeight : null,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: 'Al no tener marcas registradas en tu historial, calibrar a RIR 1-2 previene lesionarte con una carga excesiva o quedarte corto con un peso liviano: sitúa de forma inmediata tu estímulo en la zona óptima de hipertrofia muscular.',
          description: 'Carga exigente que te permita completar las repeticiones parando 1-2 antes del fallo muscular.'
        }
      ];
    } else if (goalInfo.key === 'lose') {
      intensityLabel = 'Esfuerzo Moderado';
      intensityDesc = 'Parar 2 reps antes del fallo';
      actionTitle = 'Calibración de Carga para Definición';
      weightChangeNote = currentTopWeight > 0 ? `${currentTopWeight} kg base` : 'Carga moderada';
      coachingAdvice = 'En déficit calórico, tu prioridad es mandar una señal potente de retención muscular con técnica controlada, sin desgastar el sistema nervioso ni acumular fatiga innecesaria.';
      actionSteps = [
        'Prioriza pesos que domines con cadencia controlada (2-3 segundos de bajada).',
        'Detén la serie cuando sientas que te quedan 2 repeticiones antes del fallo para proteger tu recuperación.',
        'Mantén descansos de 90 a 120 segundos para recuperar potencia.'
      ];
      strategyOptions = [
        {
          id: 'calibrate_definition',
          title: 'Calibración Protegida para Definición',
          tag: 'Recomendada',
          badge: 'RIR 2',
          suggestedWeight: currentTopWeight > 0 ? currentTopWeight : null,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: 'En déficit de calorías el cuerpo recupera más despacio. Calibrar con 2 repeticiones de margen (RIR 2) protege tus tendones y masa muscular sin drenar tus reservas de glucógeno.',
          description: 'Peso controlado con 2 repeticiones en recámara para blindar masa muscular sin fatiga extrema.'
        }
      ];
    } else {
      intensityLabel = 'Esfuerzo Controlado';
      intensityDesc = 'Sin llegar al fallo muscular';
      actionTitle = 'Estableciendo Base de Rendimiento';
      weightChangeNote = currentTopWeight > 0 ? `${currentTopWeight} kg base` : 'Establecer carga';
      coachingAdvice = 'Registra tus series de hoy con buena postura para que el sistema aprenda tus cargas reales y pueda proponerte aumentos automáticos en tus siguientes semanas.';
      actionSteps = [
        'Ejecuta con rango completo de movimiento.',
        'Apunta el peso real y las repeticiones logradas.'
      ];
      strategyOptions = [
        {
          id: 'calibrate_general',
          title: 'Registro de Línea Base',
          tag: 'Recomendada',
          badge: 'Control',
          suggestedWeight: currentTopWeight > 0 ? currentTopWeight : null,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: 'Establecer una primera referencia técnica impecable permite al entrenador inteligente programar micro-cargas y progresiones fiables en tus próximas sesiones.',
          description: 'Completa las series con buena postura para que el sistema aprenda tus cargas.'
        }
      ];
    }

  // ============================================================
  // CASO 2: EN PROGRESIÓN (ÉXITO / RITMO CRECIENTE)
  // ============================================================
  } else if (trend.status === 'progressing') {
    actionDirection = isCannotReach ? 'down' : (isStruggling ? 'maintain' : 'up');
    suggestedRest = '120 - 180 seg';

    // Felicitación y celebración según el objetivo
    celebrationData = {
      isCelebrating: true,
      title: '¡Excelente progreso! Estás superando tus marcas',
      subtitle: `Tu rendimiento ha aumentado un ${trend.badgeText} respecto a tu sesión anterior.`,
      tipsToMaintain: [
        'No te apresures: los incrementos graduales (1.25 a 2.5 kg) construyen fuerza sólida a largo plazo.',
        'Mantén la misma profundidad y cadencia estricta que cuando levantabas menos carga.',
        'Prioriza tu recuperación post-entrenamiento: duerme 7-8 horas y consume suficiente proteína para fijar este crecimiento.'
      ]
    };

    asesoriaRecommendation = {
      show: true,
      headline: '¿En racha? Maximiza tus marcas con un preparador',
      description: 'En la Asesoría Pro Fitness, un entrenador real programa tus mesociclos y sobrecargas para que sigas superando récords de forma continua.',
      buttonText: 'Potenciar con Entrenador Real'
    };

    // A. Si el usuario indica que NO LLEGA a las repeticiones (carga excesiva)
    if (isCannotReach) {
      const reducedWeight = Math.max(0, roundToWeightStep(currentTopWeight * 0.9));
      suggestedWeight = reducedWeight;
      weightChangeNote = `-${Math.round((currentTopWeight - reducedWeight) * 10) / 10} kg (-10%)`;
      actionTitle = `Reajuste Táctico: Descarga del 10% para recuperar técnica`;
      coachingAdvice = `Nos indicas que no llegas a las ${targetReps} repeticiones. Para evitar fallos técnicos lesivos o sobrecarga articular, lo más óptimo para tu progreso es hacer una ligera descarga y consolidar el rango de repeticiones con técnica limpia.`;
      actionSteps = [
        `Baja a ${reducedWeight} kg para asegurar que completas las ${targetReps} reps con RIR 2.`,
        'Concéntrate en la velocidad concéntrica y el control del movimiento.',
        'Una descarga a tiempo previene semanas de estancamiento por sobreesfuerzo.'
      ];

      strategyOptions = [
        {
          id: 'prog_reajuste_descarga',
          title: `Descarga Táctica (-10% a ${reducedWeight} kg)`,
          tag: 'Recomendada',
          badge: `Todas a ${reducedWeight}kg`,
          suggestedWeight: reducedWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: `Descargar un 10% permite que tus fibras musculares completen el rango de repeticiones sin trampas posturales, reconstruyendo la adaptación neuromuscular para volver a subir peso pronto.`,
          description: `Ajusta a ${reducedWeight} kg en todas las series para clavar las ${targetReps} reps con margen de seguridad.`
        },
        {
          id: 'prog_reajuste_topset',
          title: `Top Set Reducido + Back-off`,
          tag: 'Mantener Pico',
          badge: `1ª ${currentTopWeight}kg · Resto ${reducedWeight}kg`,
          suggestedWeight: currentTopWeight,
          suggestedReps: Math.max(4, targetReps - 3),
          suggestedSets: plannedSets,
          perSetPlan: generateTopSetBackoffPlan(plannedSets, currentTopWeight, Math.max(4, targetReps - 3), reducedWeight, targetReps, 'RIR 1-2', 'RIR 2'),
          motive: `Toca los ${currentTopWeight} kg solo en la 1ª serie a repeticiones moderadas sin llegar al fallo, y realiza el resto a ${reducedWeight} kg para acumular volumen sin quemarte.`,
          description: `Serie 1 a ${currentTopWeight} kg (${Math.max(4, targetReps - 3)} reps) y series 2-${plannedSets} a ${reducedWeight} kg (${targetReps} reps).`
        }
      ];

    // B. Si el usuario indica que LE CUESTA llegar o no completó las reps la última vez
    } else if (isStruggling) {
      suggestedWeight = currentTopWeight;
      weightChangeNote = 'Consolidar peso';
      actionTitle = `Consolidar Carga: Asegura tus ${currentTopWeight} kg`;
      coachingAdvice = actualPreviousReps > 0 && actualPreviousReps < targetReps
        ? `En tu última sesión completaste ${actualPreviousReps} de las ${targetReps} repeticiones planeadas. Antes de subir kilos o series, el objetivo prioritario para tu musculatura es afianzar unas sólidas ${targetReps} repeticiones con ${currentTopWeight} kg.`
        : `Nos indicas que te cuesta llegar a las ${targetReps} repeticiones. Para no sobrecargar articulaciones ni forzar una serie con mala técnica, te recomendamos afianzar los ${currentTopWeight} kg completando las repeticiones sin subir carga hoy.`;
      
      actionSteps = [
        `Mantén los ${currentTopWeight} kg y céntrate en completar las ${targetReps} repeticiones con técnica perfecta.`,
        'Detén la serie cuando te quede 1 repetición en reserva (RIR 1).',
        'Si sientes mucha fatiga en las últimas series, descansa 3 minutos completos.'
      ];

      const pauseReps = Math.max(5, targetReps - 2);

      strategyOptions = [
        {
          id: 'prog_struggle_consolidate',
          title: `Consolidar ${currentTopWeight} kg (Buscar ${targetReps} reps)`,
          tag: 'Recomendada',
          badge: `Mantener ${currentTopWeight}kg`,
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: `Afianzar las ${targetReps} repeticiones con los ${currentTopWeight} kg actuales consolida el control neuromuscular. Subir de peso cuando aún cuesta llegar solo provocaría acortar el recorrido o usar inercia.`,
          description: `Mantén los ${currentTopWeight} kg y busca clavar las ${targetReps} repeticiones con control total.`
        },
        {
          id: 'prog_struggle_tempo_safe',
          title: `Pausa en Estiramiento a Reps Reducidas (${pauseReps} reps)`,
          tag: 'Técnica & Tensión',
          badge: `${pauseReps} reps con pausa`,
          suggestedWeight: currentTopWeight,
          suggestedReps: pauseReps,
          suggestedSets: plannedSets,
          motive: `Hacer pausas de 2 segundos en el punto de estiramiento aumenta la dificultad un 15-20%. Como cuesta llegar a las repeticiones, reducimos a ${pauseReps} reps para que la pausa isométrica sea 100% controlada sin riesgo de fallo prematuro.`,
          description: `Mantén ${currentTopWeight} kg, haz ${pauseReps} reps y pausa 2 segundos abajo. Máximo estímulo muscular sin llegar al agotamiento.`
        }
      ];

      if (canUseTopSetBackoff) {
        const struggleBackOff = roundToWeightStep(currentTopWeight * 0.9);
        strategyOptions.push({
          id: 'prog_struggle_topset_backoff',
          title: 'Top Set + Back-off Protector',
          tag: 'Menos Fatiga',
          badge: `1ª ${currentTopWeight}kg · Resto ${struggleBackOff}kg`,
          suggestedWeight: currentTopWeight,
          suggestedReps: Math.max(5, targetReps - 2),
          suggestedSets: plannedSets,
          perSetPlan: generateTopSetBackoffPlan(plannedSets, currentTopWeight, Math.max(5, targetReps - 2), struggleBackOff, targetReps, 'RIR 1-2', 'RIR 2'),
          motive: `Hacer la 1ª serie a ${currentTopWeight} kg con ${Math.max(5, targetReps - 2)} reps aprovecha tu energía fresca, y descargar a ${struggleBackOff} kg en las series restantes te permite acumular volumen sin agotar tu sistema nervioso.`,
          description: `Serie 1 a ${currentTopWeight} kg (${Math.max(5, targetReps - 2)} reps) + Series 2-${plannedSets} con descarga a ${struggleBackOff} kg para no agotarte.`
        });
      }

    // C. Progresión Normal (Llega bien / con energía)
    } else {
      suggestedWeight = nextWeight;
      weightChangeNote = `+${realisticIncrement} kg`;
      actionTitle = `Sobrecarga Progresiva: Sube a ${nextWeight} kg`;
      coachingAdvice = `Al haber asimilado tu carga previa, tus fibras musculares ya toleran esa tensión. En barras estándar los discos mínimos habituales son de 1.25 kg por lado (+2.5 kg totales). Si dispones de micro-discos (+0.5 kg por lado = +1 kg total) úsalos; si no, aplica el salto realista de +2.5 kg o progresa en repeticiones.`;
      actionSteps = [
        `Trabaja con ${nextWeight} kg buscando mantener una técnica estricta.`,
        `Si notas el salto de peso muy exigente, mantén el rango de ${Math.max(6, targetReps - 2)}-${targetReps} reps con RIR 1-2.`,
        'Descansa entre 2 y 3 minutos para restaurar tus reservas de fosfocreatina.'
      ];

      const linearOption = {
        id: 'prog_weight',
        title: `Sobrecarga Lineal (+${realisticIncrement} kg)`,
        tag: 'Carga Uniforme',
        badge: `Todas a ${nextWeight}kg`,
        suggestedWeight: nextWeight,
        suggestedReps: targetReps,
        suggestedSets: plannedSets,
        motive: `Subir +${realisticIncrement} kg (1.25 kg a cada lado de la barra) en todas tus series introduce una tensión mecánica constante, el estímulo principal para forzar nueva síntesis proteica muscular.`,
        description: `Sube a ${nextWeight} kg en todas tus series de trabajo (+1.25 kg por lado o micro-discos si tienes).`
      };

      const repsOption = {
        id: 'prog_reps',
        title: 'Consolidar Carga (+1 Repetición)',
        tag: 'Alternativa Suave',
        badge: '+1 rep',
        suggestedWeight: currentTopWeight,
        suggestedReps: targetReps + 1,
        suggestedSets: plannedSets,
        motive: `Si el salto de discos de tu gimnasio es demasiado grande, consolidar 1 repetición más con los mismos ${currentTopWeight} kg aumenta el tonelaje efectivo con cero riesgo articular.`,
        description: `Mantén los ${currentTopWeight} kg y busca 1 repetición adicional por serie antes de meter más discos.`
      };

      if (canUseTopSetBackoff && currentTopWeight >= 20) {
        const progTopReps = Math.max(6, targetReps - 2);
        const topSetOption = {
          id: 'prog_topset_backoff',
          title: 'Top Set + Back-off (Pico de Sobrecarga)',
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

  // ============================================================
  // CASO 3: ESTANCADO (MISMO PESO DETECTADO)
  // ============================================================
  } else if (trend.status === 'stagnant') {
    const weeksCount = trend.weeksStagnant || 2;
    suggestedRest = '150 - 180 seg';

    // A. Si el usuario indica que NO LLEGA a las repes
    if (isCannotReach) {
      const reducedWeight = Math.max(0, roundToWeightStep(currentTopWeight * 0.9));
      suggestedWeight = reducedWeight;
      weightChangeNote = `-${Math.round((currentTopWeight - reducedWeight) * 10) / 10} kg (-10%)`;
      actionTitle = `Descarga Estratégica: Romper Estancamiento con -10%`;
      coachingAdvice = `Llevas ${weeksCount} semanas con ${currentTopWeight} kg y la carga resulta excesiva. Para romper este bloqueo neuromuscular, el método más efectivo es dar un paso atrás del 10% para reiniciar el ciclo con técnica impecable y velocidad.`;
      actionSteps = [
        `Baja a ${reducedWeight} kg para clavar las ${targetReps} repeticiones parando 2 antes del fallo.`,
        'Enfócate en la aceleración concéntrica y el recorrido completo.',
        'En tu próxima sesión tus fibras responderán con mucha mayor frescura.'
      ];

      strategyOptions = [
        {
          id: 'stag_cannot_deload',
          title: `Descarga Táctica (-10% a ${reducedWeight} kg)`,
          tag: 'Recomendada',
          badge: `Todas a ${reducedWeight}kg`,
          suggestedWeight: reducedWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: `Descargar un 10% disipa la fatiga acumulada en los tendones y el sistema nervioso central, permitiendo que el músculo vuelva a responder al estímulo.`,
          description: `Ajusta a ${reducedWeight} kg en todas las series para recuperar velocidad y técnica impecable.`
        }
      ];

    // B. Si el usuario indica que LE CUESTA llegar o no completó las reps la última vez
    } else if (isStruggling) {
      suggestedWeight = currentTopWeight;
      weightChangeNote = 'Consolidar y Pausa Adaptada';
      actionTitle = `Mismo peso (${weeksCount} sem): Consolidar sin forzar fallo`;
      coachingAdvice = `Llevas ${weeksCount} semanas con ${currentTopWeight} kg y te cuesta llegar a las ${targetReps} repeticiones. La solución inteligente no es subir peso ni forzar repeticiones inalcanzables, sino afianzar el control o aplicar pausas isométricas reduciendo repeticiones para que sea productivo.`;
      actionSteps = [
        `Céntrate en completar ${targetReps} repeticiones limpias con ${currentTopWeight} kg.`,
        'Si aplicas pausas, reduce a repeticiones controladas para no fallar a mitad de serie.',
        'Asegura un descanso de 2 a 3 minutos entre series.'
      ];

      const safePauseReps = Math.max(5, targetReps - 2);

      strategyOptions = [
        {
          id: 'stag_struggle_solid',
          title: `Afianzar ${targetReps} reps con ${currentTopWeight} kg`,
          tag: 'Recomendada',
          badge: `Control ${currentTopWeight}kg`,
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: `Al costarte llegar a las repeticiones objetivo, afianzar ${targetReps} reps sin perder técnica es la vía más rápida para consolidar tu fuerza antes de meter más discos.`,
          description: `Mantén los ${currentTopWeight} kg y busca clavar las ${targetReps} repeticiones con buena técnica y RIR 1.`
        },
        {
          id: 'stag_struggle_pause_safe',
          title: `Pausa en Estiramiento a Reps Reducidas (${safePauseReps} reps)`,
          tag: 'Técnica Adaptada',
          badge: `${safePauseReps} reps con pausa`,
          suggestedWeight: currentTopWeight,
          suggestedReps: safePauseReps,
          suggestedSets: plannedSets,
          motive: `La pausa isométrica en estiramiento aumenta la dificultad un 15-20%. Reducir a ${safePauseReps} repeticiones evita el fallo prematuro y garantiza un estímulo hipertrófico puro sin desgastar articulaciones.`,
          description: `Mantén ${currentTopWeight} kg, haz ${safePauseReps} reps y pausa 2 segundos en el estiramiento. Estímulo brutal sin llegar al fallo.`
        }
      ];

      if (canUseTopSetBackoff) {
        const stagSafeBackOff = roundToWeightStep(currentTopWeight * 0.9);
        strategyOptions.push({
          id: 'stag_struggle_topset',
          title: `Top Set + Back-off Protector`,
          tag: 'Volumen Seguro',
          badge: `1ª ${currentTopWeight}kg · Resto ${stagSafeBackOff}kg`,
          suggestedWeight: currentTopWeight,
          suggestedReps: Math.max(5, targetReps - 2),
          suggestedSets: plannedSets,
          perSetPlan: generateTopSetBackoffPlan(plannedSets, currentTopWeight, Math.max(5, targetReps - 2), stagSafeBackOff, targetReps, 'RIR 1-2', 'RIR 2'),
          motive: `1ª serie a ${currentTopWeight} kg con repeticiones controladas para enviar señal de fuerza, y series siguientes con -10% de peso para acumular volumen sin quemarte.`,
          description: `Serie 1 a ${currentTopWeight} kg (${Math.max(5, targetReps - 2)} reps) + Series 2-${plannedSets} con descarga a ${stagSafeBackOff} kg.`
        });
      }

    // C. Si el usuario LLEGA BIEN (Normal / con energía)
    } else {
      actionDirection = 'up';
      intensityLabel = 'Esfuerzo Alto';
      intensityDesc = 'Exigente con buena técnica';
      suggestedWeight = nextWeight;
      weightChangeNote = `+${realisticIncrement} kg`;
      actionTitle = `Mismo peso (${weeksCount} sem): Elige cómo avanzar hoy`;
      coachingAdvice = `Tu musculatura ya domina este peso. Para superar este estancamiento y reactivar la ganancia de músculo y fuerza, te recomendamos elegir una de las siguientes opciones realistas para tu sesión de hoy:`;
      actionSteps = [
        `Pon +${realisticIncrement} kg (1.25 kg por lado en barra o micro-discos si tienes) en tu 1ª serie y haz ${Math.max(6, targetReps - 2)} reps.`,
        `O mantén los ${currentTopWeight} kg e intenta sacar 1 o 2 repeticiones más antes de soltar la barra.`,
        'Descansa entre 2 y 3 minutos antes de la serie más pesada para recuperar fuerzas.'
      ];

      strategyOptions = [
        {
          id: 'stag_microload',
          title: `Subir peso en todas las series (+${realisticIncrement} kg)`,
          tag: 'Sobrecarga Lineal',
          badge: `Todas a ${nextWeight}kg`,
          suggestedWeight: nextWeight,
          suggestedReps: Math.max(6, targetReps - 2),
          suggestedSets: plannedSets,
          motive: `Llevas ${weeksCount} semanas con ${currentTopWeight} kg. Probar +${realisticIncrement} kg (1.25 kg por lado) obliga a tu sistema neuromuscular a reclutar unidades motoras de alto umbral que estaban dormidas.`,
          description: `Sube a ${nextWeight} kg en todas tus series de trabajo (+1.25 kg por lado en barra o micro-discos).`
        },
        {
          id: 'stag_volume_reps',
          title: 'Mantener peso y sumar repeticiones (+1 a 2 reps)',
          tag: 'Alternativa Suave',
          badge: `Mantener ${currentTopWeight} kg`,
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps + 1,
          suggestedSets: plannedSets,
          motive: `Sacar 1 repetición extra con los mismos ${currentTopWeight} kg eleva el tonelaje total de la sesión, reactivando la hipertrofia metabólica sin forzar articulaciones con más discos.`,
          description: `Mantén los ${currentTopWeight} kg y esfuérzate en sacar 1 repetición más antes de soltar la barra.`
        },
        {
          id: 'stag_tempo',
          title: 'Mantener peso y bajar más despacio (3 seg)',
          tag: 'Más Control',
          badge: 'Control 3s',
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: `Frenar la bajada en 3 segundos multiplica el tiempo bajo tensión (TUT) y el estímulo muscular con los mismos ${currentTopWeight} kg, superando el estancamiento con seguridad absoluta.`,
          description: `Mantén ${currentTopWeight} kg y frena la bajada contando 3 segundos. Tu músculo trabajará mucho más sin castigar tus articulaciones.`
        }
      ];

      if (canUseTopSetBackoff) {
        const backOffWeight = Math.min(currentTopWeight, roundToWeightStep(nextWeight * 0.88));
        const topReps = Math.max(5, targetReps - 2);
        strategyOptions.unshift({
          id: 'stag_topset_backoff',
          title: `Top Set + Back-off (1ª Serie Récord + ${plannedSets - 1} Volumen)`,
          tag: 'Romper Estancamiento',
          badge: `1ª ${nextWeight}kg · Resto ${backOffWeight}kg`,
          suggestedWeight: nextWeight,
          suggestedReps: topReps,
          suggestedSets: plannedSets,
          perSetPlan: generateTopSetBackoffPlan(plannedSets, nextWeight, topReps, backOffWeight, targetReps),
          motive: `Llevas ${weeksCount} semanas levantando ${currentTopWeight} kg. Probar ${nextWeight} kg en la 1ª serie aprovecha tu frescura neuromuscular para reclutar fibras rápidas, mientras que las series siguientes a ${backOffWeight} kg acumulan volumen sin fatiga extrema.`,
          description: `Serie 1 a ${nextWeight} kg (${topReps} reps) para romper la adaptación + Series 2-${plannedSets} a ${backOffWeight} kg (${targetReps} reps) para acumular volumen sin fallar.`
        });
      }
    }

  // ============================================================
  // CASO 4: DISMINUIDO / FATIGA RESIDUAL DETECTADA
  // ============================================================
  } else if (trend.status === 'decreasing') {
    const reducedWeight = Math.max(
      0,
      Math.round((currentTopWeight * 0.92) / 2.5) * 2.5 || Math.max(0, currentTopWeight - 2.5)
    );
    suggestedWeight = reducedWeight;
    actionDirection = 'down';

    const diffKg = Math.round((currentTopWeight - reducedWeight) * 10) / 10;
    weightChangeNote = `-${diffKg} kg (-8%)`;

    intensityLabel = 'Esfuerzo Controlado';
    intensityDesc = 'Priorizar técnica y recuperación';
    actionTitle = 'Gestión de Fatiga: Descarga Estratégica';
    coachingAdvice = 'Detectamos una bajada en tus marcas previas. Lejos de ser un retroceso, es una señal de tu sistema nervioso pidiendo descanso activo. Te recomendamos una micro-descarga del 8-10% para disipar la fatiga.';
    actionSteps = [
      `Baja la carga a ${reducedWeight} kg en tus series de hoy.`,
      `Mantén un RIR 2-3 (parar cuando sientas que podrías hacer 2 o 3 repeticiones más).`,
      'Descansa bien esta noche para permitir la supercompensación de tus fibras musculares.'
    ];

    strategyOptions = [
      {
        id: 'fatigue_deload',
        title: `Descarga Táctica (-${diffKg} kg)`,
        tag: 'Recomendada',
        badge: `Todas a ${reducedWeight}kg`,
        suggestedWeight: reducedWeight,
        suggestedReps: targetReps,
        suggestedSets: plannedSets,
        motive: 'Reducir la intensidad disipa la fatiga periférica y central acumulada, permitiendo que tus tendones se recuperen para volver a levantar más peso en tu próxima sesión.',
        description: `Baja a ${reducedWeight} kg para completar las series con RIR 2 y permitir que tus fibras se recuperen al 100%.`
      },
      {
        id: 'fatigue_sets_reduction',
        title: `Mantener ${currentTopWeight} kg pero reducir 1 serie`,
        tag: 'Alternativa',
        badge: `${Math.max(2, plannedSets - 1)} series`,
        suggestedWeight: currentTopWeight,
        suggestedReps: targetReps,
        suggestedSets: Math.max(2, plannedSets - 1),
        motive: 'Si quieres mantener la sensación de peso alto, restar 1 serie de trabajo reduce el volumen de fatiga total a la mitad sin perder tensión mecánica.',
        description: `Haz ${Math.max(2, plannedSets - 1)} series con tus ${currentTopWeight} kg habituales en vez de ${plannedSets}, eliminando la serie final de fatiga.`
      }
    ];
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
