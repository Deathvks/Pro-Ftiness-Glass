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
 * Analiza el historial de un ejercicio específico a lo largo de las sesiones del usuario.
 */
export const getExerciseHistorySessions = (exerciseName, workoutLog) => {
  if (!exerciseName || !Array.isArray(workoutLog) || workoutLog.length === 0) {
    return [];
  }

  const searchName = exerciseName.toLowerCase().trim();

  // Filtrar entrenamientos que contengan este ejercicio
  const matchingLogs = workoutLog.filter(log =>
    log.WorkoutLogDetails?.some(d => d.exercise_name?.toLowerCase().trim() === searchName)
  );

  if (matchingLogs.length === 0) return [];

  // Ordenar de más reciente a más antiguo
  matchingLogs.sort((a, b) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime());

  const sessions = [];

  matchingLogs.forEach(log => {
    const detail = log.WorkoutLogDetails.find(
      d => d.exercise_name?.toLowerCase().trim() === searchName
    );
    if (!detail) return;

    const rawSets = detail.WorkoutLogSets || [];
    // Filtrar sets válidos y descartar calentamientos puros para análisis de progresión
    const workingSets = rawSets.filter(s => {
      const isWarmup = s.is_warmup === true || s.is_warmup === 'true' || s.is_warmup === 1;
      const reps = parseInt(s.reps, 10) || 0;
      return !isWarmup && reps > 0;
    });

    if (workingSets.length === 0 && rawSets.length > 0) {
      // Si todos eran calentamientos o sin flag, usamos los sets que tengan reps
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
      date: log.workout_date || log.date || log.created_at || new Date().toISOString(),
      topWeight: Math.round(topWeight * 10) / 10,
      topReps,
      best1RM: Math.round(best1RM * 10) / 10,
      totalVolume: Math.round(totalVolume),
      setsCount: workingSets.length,
      sets: workingSets
    });
  });

  return sessions;
};

/**
 * Diagnostica si el usuario está progresando, estancado o disminuyendo en este ejercicio.
 */
export const diagnoseExerciseTrend = (sessions) => {
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

  if (sessions.length === 1) {
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

  const s0 = sessions[0]; // Más reciente
  const s1 = sessions[1]; // Anterior
  const delta1RM = Math.round((s0.best1RM - s1.best1RM) * 10) / 10;
  const deltaWeight = Math.round((s0.topWeight - s1.topWeight) * 10) / 10;
  const deltaReps = s0.topReps - s1.topReps;

  const baseline1RM = s1.best1RM > 0 ? s1.best1RM : (s1.topWeight || 1);
  const pctChange = Math.round(((s0.best1RM - s1.best1RM) / baseline1RM) * 1000) / 10;

  // Comprobar semanas estancado si son varias sesiones iguales
  let weeksStagnant = 0;

  if (sessions.length >= 2) {
    const isWeightSame = Math.abs(deltaWeight) < 0.5;
    const isRepsSameOrLower = deltaReps <= 0;

    if (isWeightSame && isRepsSameOrLower) {
      const earliestDate = new Date(sessions[Math.min(sessions.length - 1, 3)].date);
      const latestDate = new Date(s0.date);
      const eTime = earliestDate.getTime();
      const lTime = latestDate.getTime();
      const diffDays = (!isNaN(eTime) && !isNaN(lTime))
        ? Math.max(7, Math.round((lTime - eTime) / (1000 * 60 * 60 * 24)))
        : 7;
      weeksStagnant = Math.max(1, Math.round(diffDays / 7));
    }
  }

  // Criterios de clasificación:
  // 1. Progresando: subió 1RM >= +1kg, subió peso, o mantuvo peso y subió repeticiones
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

  // 2. Disminuido / Fatiga: bajó 1RM <= -2kg o bajó peso o bajó 2+ reps al mismo peso
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
 * según el objetivo, el historial científico del ejercicio y el seguimiento previo.
 */
export const generateSmartCoachPlan = (exercise, userProfile, workoutLog) => {
  const goalInfo = normalizeUserGoal(userProfile?.goal);
  const sessions = getExerciseHistorySessions(exercise.name, workoutLog);
  const trend = diagnoseExerciseTrend(sessions);

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

  const isBodyweight = lastSession ? lastSession.topWeight === 0 : false;
  const currentTopWeight = lastSession?.topWeight || 0;
  // Criterio científico para esquemas Top Set + Back-off: mínimo 3 series, ejercicio con peso real y carga mínima de 15kg
  const canUseTopSetBackoff = plannedSets >= 3 && !isBodyweight && currentTopWeight >= 15;

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
    const isHeavy = currentTopWeight >= 40;
    const increment = isHeavy ? 2.5 : 1.25;
    const nextWeight = Math.round((currentTopWeight + increment) * 10) / 10;
    const s1 = sessions[1];
    const prevWeight = s1 ? s1.topWeight : currentTopWeight;
    const prevReps = s1 ? s1.topReps : lastSession.topReps;

    actionDirection = 'up';
    suggestedRest = '120 - 180 seg';

    // Felicitación y celebración según el objetivo
    celebrationData = {
      isCelebrating: true,
      title: '¡Excelente progreso! Estás superando tus marcas',
      subtitle: `Tu rendimiento ha aumentado un ${trend.badgeText} respecto a tu sesión anterior.`,
      tipsToMaintain: [
        'No te apresures: los micro-incrementos constantes (1.25 a 2.5 kg) construyen fuerza sólida a largo plazo.',
        'Mantén la misma profundidad y cadencia estricta que cuando levantabas menos carga.',
        'Prioriza tu recuperación post-entrenamiento: duerme 7-8 horas y consume suficiente proteína para fijar este crecimiento.'
      ]
    };

    // Recomendación de Asesoría Pro Fitness con preparador real (Siempre disponible)
    asesoriaRecommendation = {
      show: true,
      headline: '¿En racha? Maximiza tus marcas con un preparador',
      description: 'En la Asesoría Pro Fitness, un entrenador real programa tus mesociclos y sobrecargas para que sigas superando récords de forma continua.',
      buttonText: 'Potenciar con Entrenador Real'
    };

    if (goalInfo.key === 'gain') {
      intensityLabel = 'Esfuerzo Alto';
      intensityDesc = 'Parar 1-2 reps antes de fallar';
      suggestedWeight = nextWeight;
      weightChangeNote = `+${increment} kg`;
      actionTitle = `Sobrecarga Progresiva: Sube a ${nextWeight} kg`;
      coachingAdvice = `Al haber asimilado tu carga previa, tus fibras musculares ya toleran esa tensión. Te recomendamos aplicar sobrecarga progresiva subiendo hoy +${increment} kg o consolidando repeticiones adicionales.`;
      actionSteps = [
        `Trabaja con ${nextWeight} kg buscando mantener una técnica estricta.`,
        `Si notas la carga exigente, mantén el rango de ${Math.max(6, targetReps - 2)}-${targetReps} reps parando justo cuando sientas que te quedan 1-2 reps antes del fallo.`,
        'Descansa entre 2 y 3 minutos para restaurar tus reservas de fosfocreatina.'
      ];

      const linearOption = {
        id: 'prog_weight',
        title: `Sobrecarga Lineal (+${increment} kg)`,
        tag: 'Carga Uniforme',
        badge: `Todas a ${nextWeight}kg`,
        suggestedWeight: nextWeight,
        suggestedReps: targetReps,
        suggestedSets: plannedSets,
        motive: `Tus músculos ya dominan los ${currentTopWeight} kg. Subir +${increment} kg en todas tus series introduce una tensión mecánica constante sobre las fibras, el estímulo biológico principal para forzar nueva síntesis de proteínas contráctiles.`,
        description: `Sube a ${nextWeight} kg en todas tus series de trabajo para mantener una progresión lineal completa.`
      };

      const repsOption = {
        id: 'prog_reps',
        title: 'Consolidar Carga (+1 o 2 Reps)',
        tag: 'Alternativa',
        badge: '+1-2 reps',
        suggestedWeight: currentTopWeight,
        suggestedReps: targetReps + 1,
        suggestedSets: plannedSets,
        motive: `Consolidar 1 repetición adicional con los mismos ${currentTopWeight} kg afianza tu adaptación neuromuscular y volumen de entrenamiento antes de añadir más kilos, con cero riesgo articular.`,
        description: `Mantén los ${currentTopWeight} kg y busca 1 repetición adicional por serie antes de subir kilos, asegurando control absoluto.`
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
          motive: `Estás en racha positiva. Aplicar ${nextWeight} kg solo en la 1ª serie estimula la tensión mecánica máxima aprovechando tu energía intacta, mientras que las series siguientes a ${currentTopWeight} kg consolidan el volumen total de trabajo sin riesgo de fatiga neural.`,
          description: `Sube a ${nextWeight} kg solo en tu 1ª serie récord (${progTopReps} reps) y mantén ${currentTopWeight} kg en las series 2-${plannedSets} (${targetReps} reps) para no agotarte.`
        };

        strategyOptions = [topSetOption, linearOption, repsOption];
      } else {
        linearOption.tag = 'Recomendada';
        strategyOptions = [linearOption, repsOption];
      }
    } else if (goalInfo.key === 'lose') {
      intensityLabel = 'Esfuerzo Moderado';
      intensityDesc = 'Parar 2 reps antes del fallo';
      suggestedWeight = currentTopWeight;
      weightChangeNote = 'Consolidar fuerza';
      actionTitle = `Potencia en Déficit: Mantén ${currentTopWeight} kg y consolida`;
      coachingAdvice = `Estás ganando fuerza incluso en déficit calórico. Al disponer de menor energía para recuperación, te recomendamos mantener los ${currentTopWeight} kg y consolidar repeticiones limpias sin forzar aumentos bruscos de peso.`;
      actionSteps = [
        `Consolida series limpias con ${currentTopWeight} kg sin descuidar la técnica.`,
        'Si sientes mucha energía en la 1ª serie, busca 1 repetición adicional.',
        'No entrenes al fallo absoluto: detén la serie cuando sientas que podrías hacer 2 repeticiones más.'
      ];

      strategyOptions = [
        {
          id: 'prog_lose_reps',
          title: 'Consolidar y +1 Repetición',
          tag: 'Recomendada',
          badge: 'Fuerza limpia',
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps + 1,
          suggestedSets: plannedSets,
          motive: `En restricción calórica, sumar 1 repetición manteniendo 2 en recámara (RIR 2) estimula la retención de masa muscular magra sin vaciar las reservas de glucógeno ni desgastar articulaciones.`,
          description: `Mantén ${currentTopWeight} kg e intenta sumar 1 repetición manteniendo 2 en reserva para no comprometer el glucógeno.`
        },
        {
          id: 'prog_lose_weight',
          title: `Micro-Carga en 1ª Serie (+${increment} kg)`,
          tag: 'Si estás con energía',
          badge: `1ª ${nextWeight}kg · Resto ${currentTopWeight}kg`,
          suggestedWeight: nextWeight,
          suggestedReps: Math.max(6, targetReps - 2),
          suggestedSets: plannedSets,
          perSetPlan: generateTopSetBackoffPlan(plannedSets, nextWeight, Math.max(6, targetReps - 2), currentTopWeight, targetReps, 'RIR 1-2', 'RIR 2'),
          motive: `Si hoy tu descanso y energía son plenos, probar una micro-carga (+${increment} kg) en la 1ª serie envía un pulso de tensión máxima al sistema nervioso sin comprometer tu recuperación en déficit.`,
          description: `Prueba ${nextWeight} kg en tu 1ª serie y mantén ${currentTopWeight} kg en las series 2-${plannedSets}.`
        }
      ];

      if (canUseTopSetBackoff && currentTopWeight >= 20) {
        const loseBackOff = roundToWeightStep(currentTopWeight * 0.88);
        strategyOptions.push({
          id: 'prog_lose_topset_backoff',
          title: 'Top Set + Back-off en Definición',
          tag: 'Pico Controlado',
          badge: `1ª ${nextWeight}kg · Resto ${loseBackOff}kg`,
          suggestedWeight: nextWeight,
          suggestedReps: Math.max(6, targetReps - 2),
          suggestedSets: plannedSets,
          perSetPlan: generateTopSetBackoffPlan(plannedSets, nextWeight, Math.max(6, targetReps - 2), loseBackOff, targetReps, 'RIR 1-2', 'RIR 2'),
          motive: `Tocar ${nextWeight} kg en la 1ª serie envía un pulso de tensión pura para retener masa muscular, y descargar a ${loseBackOff} kg en las series restantes protege tus reservas de glucógeno.`,
          description: `Serie 1 a ${nextWeight} kg + Series 2-${plannedSets} a ${loseBackOff} kg para proteger tu recuperación en déficit.`
        });
      }
    } else {
      intensityLabel = 'Esfuerzo Alto';
      intensityDesc = 'Parar 1-2 reps antes de fallar';
      suggestedWeight = nextWeight;
      weightChangeNote = `+${increment} kg`;
      actionTitle = `Consistencia en Aumento: Sube a ${nextWeight} kg`;
      coachingAdvice = `Tu rendimiento sigue una curva ascendente. Añade una micro-carga de +${increment} kg o suma repeticiones para seguir estimulando la densidad muscular.`;
      actionSteps = [
        `Añade la micro-carga de +${increment} kg en tus series de trabajo.`,
        'Mantén la tensión muscular continua en cada repetición.'
      ];

      const genLinearOption = {
        id: 'prog_general_weight',
        title: `Sobrecarga Lineal (+${increment} kg)`,
        tag: 'Carga Uniforme',
        badge: `Todas a ${nextWeight}kg`,
        suggestedWeight: nextWeight,
        suggestedReps: targetReps,
        suggestedSets: plannedSets,
        motive: `Añadir una micro-carga de +${increment} kg en todas las series mantiene el estímulo de tensión progresiva sin saltos drásticos de peso.`,
        description: `Sube a ${nextWeight} kg en todas tus series de trabajo para mantener el estímulo progresivo.`
      };

      const genRepsOption = {
        id: 'prog_general_reps',
        title: 'Consolidación de Reps',
        tag: 'Alternativa',
        badge: '+1 rep',
        suggestedWeight: currentTopWeight,
        suggestedReps: targetReps + 1,
        suggestedSets: plannedSets,
        motive: `Sumar una repetición extra con ${currentTopWeight} kg incrementa el volumen efectivo garantizando un control postural seguro.`,
        description: `Mantén los ${currentTopWeight} kg y suma una repetición extra con buena técnica.`
      };

      if (canUseTopSetBackoff && currentTopWeight >= 20) {
        const topSetGenOption = {
          id: 'prog_gen_topset_backoff',
          title: 'Top Set + Back-off de Rendimiento',
          tag: 'Recomendada (Escalonada)',
          badge: `1ª ${nextWeight}kg · Resto ${currentTopWeight}kg`,
          suggestedWeight: nextWeight,
          suggestedReps: Math.max(6, targetReps - 2),
          suggestedSets: plannedSets,
          perSetPlan: generateTopSetBackoffPlan(plannedSets, nextWeight, Math.max(6, targetReps - 2), currentTopWeight, targetReps),
          motive: `Combina una primera serie de alta intensidad con series de volumen para mantenerte atlético y versátil sin sobrecargar tus articulaciones.`,
          description: `Serie 1 a ${nextWeight} kg + Series 2-${plannedSets} a ${currentTopWeight} kg.`
        };

        strategyOptions = [topSetGenOption, genLinearOption, genRepsOption];
      } else {
        genLinearOption.tag = 'Recomendada';
        strategyOptions = [genLinearOption, genRepsOption];
      }
    }

  // ============================================================
  // CASO 3: ESTANCADO (MISMO PESO DETECTADO)
  // ============================================================
  } else if (trend.status === 'stagnant') {
    const microLoad = currentTopWeight >= 40 ? 1.25 : 1.0;
    const testWeight = Math.round((currentTopWeight + microLoad) * 10) / 10;
    const weeksCount = trend.weeksStagnant || 2;

    suggestedRest = '150 - 180 seg';

    // Explicación motivadora y clara sin palabras difíciles
    motivationalMessage = 'La adaptación a una carga es un paso natural del progreso. Un pequeño ajuste en tu serie de hoy te permitirá seguir avanzando con seguridad.';

    // Recomendación de Asesoría Pro Fitness con preparador real
    asesoriaRecommendation = {
      show: true,
      headline: '¿Llevas tiempo sin subir de peso o tienes dudas?',
      description: 'Un entrenador personal oficial en Pro Fitness puede revisar tus vídeos de técnica y planificar tus entrenamientos para que sigas mejorando de forma constante.',
      buttonText: 'Hablar con un Entrenador Real'
    };

    if (goalInfo.key === 'gain') {
      actionDirection = 'up';
      intensityLabel = 'Esfuerzo Alto';
      intensityDesc = 'Exigente con buena técnica';
      suggestedWeight = testWeight;
      weightChangeNote = `+${microLoad} kg`;
      actionTitle = `Mismo peso (${weeksCount} sem): Elige cómo avanzar hoy`;
      coachingAdvice = 'Tu musculatura ya domina este peso. Para superar este estancamiento y reactivar la ganancia de músculo y fuerza, te recomendamos elegir una de las siguientes opciones para tu sesión de hoy:';
      actionSteps = [
        `Pon ${testWeight} kg (un poquito más) en tu 1ª serie y haz ${Math.max(6, targetReps - 2)} reps con buena técnica.`,
        `O mantén los ${currentTopWeight} kg e intenta sacar 1 o 2 repeticiones más antes de soltar la barra.`,
        'Descansa entre 2 y 3 minutos antes de la serie más pesada para recuperar fuerzas.'
      ];

      strategyOptions = [
        {
          id: 'stag_microload',
          title: `Subir peso en todas las series (+${microLoad} kg)`,
          tag: 'Sobrecarga Lineal',
          badge: `Todas a ${testWeight}kg`,
          suggestedWeight: testWeight,
          suggestedReps: Math.max(6, targetReps - 2),
          suggestedSets: plannedSets,
          motive: `Llevas ${weeksCount} semanas con ${currentTopWeight} kg. Probar +${microLoad} kg en todas tus series obliga a tu sistema neuromuscular a reclutar unidades motoras de alto umbral que estaban dormidas, rompiendo la adaptación.`,
          description: `Sube a ${testWeight} kg en todas tus series de trabajo para forzar una nueva adaptación neuromuscular completa.`
        },
        {
          id: 'stag_volume_reps',
          title: 'Mantener peso y sumar repeticiones (+1 a 2 reps)',
          tag: 'Alternativa',
          badge: `Mantener ${currentTopWeight} kg`,
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps + 2,
          suggestedSets: plannedSets,
          motive: `Sacar 1 o 2 repeticiones extra con los mismos ${currentTopWeight} kg eleva el tonelaje total de la sesión, reactivando la hipertrofia metabólica sin forzar articulaciones con más peso.`,
          description: `Mantén los ${currentTopWeight} kg y esfuérzate en sacar 1 o 2 repeticiones más antes de soltar la barra.`
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
        const backOffWeight = Math.min(currentTopWeight, roundToWeightStep(testWeight * 0.88));
        const topReps = Math.max(5, targetReps - 2);
        strategyOptions.unshift({
          id: 'stag_topset_backoff',
          title: `Top Set + Back-off (1ª Serie Récord + ${plannedSets - 1} Volumen)`,
          tag: 'Romper Estancamiento',
          badge: `1ª ${testWeight}kg · Resto ${backOffWeight}kg`,
          suggestedWeight: testWeight,
          suggestedReps: topReps,
          suggestedSets: plannedSets,
          perSetPlan: generateTopSetBackoffPlan(plannedSets, testWeight, topReps, backOffWeight, targetReps),
          motive: `Llevas ${weeksCount} semanas levantando ${currentTopWeight} kg. Probar ${testWeight} kg en la 1ª serie aprovecha tu frescura neuromuscular para reclutar fibras rápidas dormidas, mientras que las series siguientes a ${backOffWeight} kg acumulan volumen de hipertrofia sin fatiga extrema.`,
          description: `Serie 1 a ${testWeight} kg (${topReps} reps) para romper la adaptación + Series 2-${plannedSets} a ${backOffWeight} kg (${targetReps} reps) para acumular volumen sin fallar.`
        });
      }
    } else if (goalInfo.key === 'lose') {
      actionDirection = 'maintain';
      intensityLabel = 'Esfuerzo Moderado';
      intensityDesc = 'Mantener músculo sin agotamiento';
      suggestedWeight = currentTopWeight;
      weightChangeNote = 'Mantener carga';
      actionTitle = `Excelente: Mantén tus ${currentTopWeight} kg firmes`;
      coachingAdvice = 'Mantener el mismo peso durante una etapa de definición o pérdida de peso es una excelente noticia: confirma que estás conservando tu masa muscular intacta mientras pierdes grasa corporal.';
      actionSteps = [
        `No fuerces aumentos bruscos de peso que puedan lesionarte: mantén firmes tus ${currentTopWeight} kg.`,
        'Baja el peso despacio y controlado para estimular bien el músculo con seguridad.',
        'Asegura un descanso de 2 minutos entre series.'
      ];

      strategyOptions = [
        {
          id: 'stag_lose_lock',
          title: `Mantener peso firme (${currentTopWeight} kg)`,
          tag: 'Recomendada',
          badge: 'Conservar músculo',
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: `En déficit calórico, mantener intactos tus ${currentTopWeight} kg durante ${weeksCount} semanas es un gran éxito: demuestra que tu cuerpo está quemando grasa mientras preserva el 100% de tu masa muscular.`,
          description: `Mantén exactamente ${currentTopWeight} kg. En pérdida de grasa, no bajar de peso en los ejercicios es la mayor victoria para mantener tu masa muscular.`
        },
        {
          id: 'stag_lose_microreps',
          title: 'Buscar 1 repetición más limpia',
          tag: 'Alternativa',
          badge: '+1 rep',
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps + 1,
          suggestedSets: plannedSets,
          motive: `Buscar 1 repetición extra añade estímulo metabólico adicional sin riesgo de sobreentrenar.`,
          description: `Intenta sacar 1 repetición extra manteniendo la técnica estricta con tus ${currentTopWeight} kg.`
        }
      ];

      if (canUseTopSetBackoff && currentTopWeight >= 20) {
        const loseBackOff = roundToWeightStep(currentTopWeight * 0.88);
        strategyOptions.push({
          id: 'stag_lose_topset_backoff',
          title: `Top Set + Descarga (1ª Fuerte + ${plannedSets - 1} Protegidas)`,
          tag: 'Cuidar Glucógeno',
          badge: `1ª ${currentTopWeight}kg · Resto ${loseBackOff}kg`,
          suggestedWeight: currentTopWeight,
          suggestedReps: Math.max(5, targetReps - 2),
          suggestedSets: plannedSets,
          perSetPlan: generateTopSetBackoffPlan(plannedSets, currentTopWeight, Math.max(5, targetReps - 2), loseBackOff, targetReps, 'RIR 1-2', 'RIR 2'),
          motive: `En déficit calórico, hacer todas las series pesadas drena rápidamente el glucógeno y aumenta la fatiga articular. Hacer una 1ª serie fuerte a ${currentTopWeight} kg envía la señal de blindar la masa muscular, y bajar a ${loseBackOff} kg en las siguientes protege tu recuperación.`,
          description: `Serie 1 a ${currentTopWeight} kg (${Math.max(5, targetReps - 2)} reps) para blindar fuerza + Series 2-${plannedSets} con descarga a ${loseBackOff} kg para acumular repeticiones limpias sin agotar glucógeno.`
        });
      }
    } else {
      actionDirection = 'maintain';
      intensityLabel = 'Controlado';
      intensityDesc = 'Control y buena técnica';
      suggestedWeight = currentTopWeight;
      weightChangeNote = 'Variar estímulo';
      actionTitle = `Mismo peso en sesiones previas: Prueba una variación`;
      coachingAdvice = `Tu cuerpo ya asimiló esta carga. Te recomendamos variar el estímulo manteniendo los ${currentTopWeight} kg con bajada controlada (3 seg), o probando un kilo más.`;
      actionSteps = [
        'Baja el peso más despacio (en 3 segundos) para que el músculo trabaje más.',
        'O intenta sacar 1 repetición más en tus series de trabajo.'
      ];

      strategyOptions = [
        {
          id: 'stag_gen_tempo',
          title: 'Bajar el peso más despacio (3 seg)',
          tag: 'Recomendada',
          badge: 'Control 3s',
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: `Bajar en 3 segundos controlados con ${currentTopWeight} kg da un estímulo neuromuscular nuevo sin subir peso.`,
          description: `Baja el peso en 3 segundos controlados con ${currentTopWeight} kg para darle un estímulo nuevo al músculo sin subir peso.`
        },
        {
          id: 'stag_gen_micro',
          title: `Probar un poco más de peso (+${microLoad} kg)`,
          tag: 'Alternativa',
          badge: `+${microLoad} kg`,
          suggestedWeight: testWeight,
          suggestedReps: Math.max(6, targetReps - 2),
          suggestedSets: plannedSets,
          motive: `Probar una micro-carga de +${microLoad} kg estimula la adaptación de fuerza con 1-2 repeticiones menos.`,
          description: `Prueba ${testWeight} kg haciendo 1-2 repeticiones menos para notar una exigencia mayor.`
        }
      ];

      if (canUseTopSetBackoff) {
        const genBackOff = roundToWeightStep(testWeight * 0.88);
        strategyOptions.push({
          id: 'stag_gen_topset_backoff',
          title: `Top Set + Back-off (Romper Monotonía)`,
          tag: 'Variedad de Carga',
          badge: `1ª ${testWeight}kg · Resto ${genBackOff}kg`,
          suggestedWeight: testWeight,
          suggestedReps: Math.max(5, targetReps - 2),
          suggestedSets: plannedSets,
          perSetPlan: generateTopSetBackoffPlan(plannedSets, testWeight, Math.max(5, targetReps - 2), genBackOff, targetReps),
          motive: `Variar la carga entre series rompe la monotonía y estimula diferentes tipos de fibras musculares.`,
          description: `Prueba ${testWeight} kg en la 1ª serie y ajusta a ${genBackOff} kg en las series 2-${plannedSets}.`
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

    const dropPct = Math.abs(trend.pctChange);
    const prevWeight = sessions[1]?.topWeight || currentTopWeight;

    // Mensaje motivador enfocado en longevidad deportiva
    motivationalMessage = `Escuchar la fatiga y saber modular la carga es la cualidad que distingue a los deportistas inteligentes. Bajar un poco hoy permite a tus tendones y sistema nervioso regenerarse para volver con más fuerza la próxima semana.`;

    asesoriaRecommendation = {
      show: true,
      headline: '¿Sientes fatiga o estancamiento repetido?',
      description: 'En la Asesoría Pro Fitness, tu entrenador ajusta el volumen semanal, los días de descanso y tu alimentación para que nunca acumules fatiga lesiva.',
      buttonText: 'Consultar con Entrenador Real'
    };

    if (goalInfo.key === 'gain') {
      intensityLabel = 'Descarga Controlada';
      intensityDesc = 'Parar 2-3 reps antes del fallo';
      suggestedRir = '2-3 del fallo';
      actionTitle = `Descarga Táctica por Fatiga: Elige tu ajuste`;
      coachingAdvice = 'Esta bajada no se debe a pérdida de masa muscular, sino a fatiga acumulada en tu sistema nervioso central, sueño insuficiente o estrés. Modular la carga hoy permite disipar la fatiga y proteger tus articulaciones para volver al 100% la próxima semana.';
      actionSteps = [
        `Opción A (Descarga de Carga): Baja a ${reducedWeight} kg para una sesión técnica de alta calidad.`,
        `Opción B (Reducción de Volumen): Mantén ${currentTopWeight} kg pero recorta una serie (${Math.max(2, plannedSets - 1)} series).`,
        'Enfócate en la contracción y detén cada serie dejando 2-3 repeticiones en reserva.'
      ];

      strategyOptions = [
        {
          id: 'dec_tactical_deload',
          title: `Descarga Táctica (-8% a ${reducedWeight} kg)`,
          tag: 'Recomendada',
          badge: `${reducedWeight} kg`,
          suggestedWeight: reducedWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: `Reducir la carga un 8% hoy permite disipar la fatiga neuromuscular acumulada manteniendo el patrón técnico del movimiento, para que tus tendones y sistema nervioso se regeneren y vuelvas con fuerza la próxima semana.`,
          description: `Baja a ${reducedWeight} kg hoy. Haz repeticiones limpias parando 2-3 antes del fallo para disipar la fatiga del sistema nervioso.`
        },
        {
          id: 'dec_reduce_sets',
          title: `Reducción de Volumen (-1 serie)`,
          tag: 'Alternativa',
          badge: `${Math.max(2, plannedSets - 1)} series`,
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps,
          suggestedSets: Math.max(2, plannedSets - 1),
          motive: `Hacer 1 serie menos recorta el estrés acumulado de la sesión en un 25-33%, permitiéndote entrenar pesado (${currentTopWeight} kg) pero sin vaciar por completo tus recursos energéticos.`,
          description: `Mantén ${currentTopWeight} kg pero haz solo ${Math.max(2, plannedSets - 1)} series en lugar de ${plannedSets} para reducir el estrés neuromuscular.`
        }
      ];
    } else if (goalInfo.key === 'lose') {
      intensityLabel = 'Carga Reducida';
      intensityDesc = 'Sin forzar articulaciones';
      suggestedRir = '2-3 del fallo';
      suggestedSets = Math.max(2, plannedSets - 1);
      actionTitle = `Gestión de Energía en Déficit: Ajuste hoy`;
      coachingAdvice = 'En déficit calórico es totalmente normal tener días con reservas de energía más bajas. Modular la carga hoy previene sobrecargas articulares y te permite seguir progresando con regularidad.';
      actionSteps = [
        `Trabaja hoy con ${reducedWeight} kg ejecutando repeticiones limpias sin rebotes.`,
        `Si te sientes agotado, quédate en ${Math.max(2, plannedSets - 1)} series en lugar de ${plannedSets}.`,
        'Prioriza descansar bien y beber suficiente agua entre series.'
      ];

      strategyOptions = [
        {
          id: 'dec_lose_deload',
          title: `Ajuste Preventivo (${reducedWeight} kg)`,
          tag: 'Recomendada',
          badge: `${reducedWeight} kg`,
          suggestedWeight: reducedWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: `Bajar a ${reducedWeight} kg alivia la tensión sobre articulaciones y tejido conectivo en días de baja energía calórica.`,
          description: `Ajusta a ${reducedWeight} kg para completar un estímulo muscular seguro en déficit calórico.`
        },
        {
          id: 'dec_lose_sets',
          title: `Recorte de Volumen (${Math.max(2, plannedSets - 1)} series)`,
          tag: 'Alternativa',
          badge: `${Math.max(2, plannedSets - 1)} series`,
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps,
          suggestedSets: Math.max(2, plannedSets - 1),
          motive: `Recortar una serie previene el catabolismo excesivo por vaciado de glucógeno cuando la energía es baja.`,
          description: `Haz ${Math.max(2, plannedSets - 1)} series en lugar de ${plannedSets} con ${currentTopWeight} kg para proteger tu recuperación.`
        }
      ];
    } else {
      intensityLabel = 'Descarga Suave';
      intensityDesc = 'Recuperación activa';
      suggestedRir = '2-3 del fallo';
      actionTitle = `Ajuste por Fatiga: Descarga técnica`;
      coachingAdvice = 'Tu cuerpo pide un respiro táctico. Ajustar la carga o recortar una serie hoy te ayudará a disipar el estrés articular y neuromuscular.';
      actionSteps = [
        `Baja a ${reducedWeight} kg para una sesión técnica impecable.`,
        'Enfócate en la conexión mente-músculo y rango articular completo.'
      ];

      strategyOptions = [
        {
          id: 'dec_gen_deload',
          title: `Descarga Técnica (${reducedWeight} kg)`,
          tag: 'Recomendada',
          badge: `${reducedWeight} kg`,
          suggestedWeight: reducedWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: `Bajar un 8% el peso permite que el sistema nervioso se recupere completamente para tu próxima semana.`,
          description: `Usa ${reducedWeight} kg con técnica estricta para estimular sin fatiga residual.`
        },
        {
          id: 'dec_gen_sets',
          title: `Reducir a ${Math.max(2, plannedSets - 1)} series`,
          tag: 'Alternativa',
          badge: `${Math.max(2, plannedSets - 1)} series`,
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps,
          suggestedSets: Math.max(2, plannedSets - 1),
          motive: `Reducir una serie disminuye la fatiga acumulada en los tejidos sin tener que reducir los ${currentTopWeight} kg que ya levantas.`,
          description: `Haz ${Math.max(2, plannedSets - 1)} series efectivas en lugar de ${plannedSets} con tus ${currentTopWeight} kg habituales.`
        }
      ];
    }
  }

  return {
    exerciseName: exercise.name,
    userGoal: goalInfo,
    trend,
    sessions,
    hasHistory: sessions.length > 0,
    currentTopWeight,
    isBodyweight,
    targets: {
      suggestedWeight,
      weightChangeNote,
      suggestedSets,
      suggestedReps,
      suggestedRir,
      intensityLabel,
      intensityDesc,
      suggestedRest,
      actionDirection,
      actionTitle
    },
    coachingAdvice,
    actionSteps,
    strategyOptions,
    motivationalMessage,
    celebrationData,
    asesoriaRecommendation,
    followUp
  };
};
