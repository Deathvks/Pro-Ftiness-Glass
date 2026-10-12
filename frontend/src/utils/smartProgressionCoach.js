/* frontend/src/utils/smartProgressionCoach.js */
import { calculate1RM } from './helpers';
import { getAppliedCoachStrategy, evaluateCoachFollowUp } from './coachAppliedHistory';

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

  // 3. Estancado
  return {
    status: 'stagnant',
    label: 'Estancado',
    badgeText: weeksStagnant > 1 ? `Meseta de ${weeksStagnant} semanas` : 'Misma carga reciente',
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

  // Comprobar si hubo una estrategia aplicada previamente para seguimiento continuo
  const lastAppliedStrategy = getAppliedCoachStrategy(exercise.name);
  const followUp = evaluateCoachFollowUp(exercise.name, trend, lastAppliedStrategy);

  const plannedSets = parseInt(exercise.sets, 10) || 3;
  const rawReps = String(exercise.reps || '10');
  const targetReps = parseInt(rawReps.split('-')[0], 10) || 10;
  const lastSession = sessions[0] || null;

  const isBodyweight = lastSession ? lastSession.topWeight === 0 : false;
  const currentTopWeight = lastSession?.topWeight || 0;

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

    if (goalInfo.key === 'gain') {
      intensityLabel = 'Esfuerzo Alto';
      intensityDesc = 'Parar 1-2 reps antes de fallar';
      actionTitle = 'Calibración de Fuerza e Hipertrofia';
      weightChangeNote = currentTopWeight > 0 ? `${currentTopWeight} kg base` : 'Establecer carga';
      coachingAdvice = 'Para maximizar la ganancia muscular, busca un peso exigente con el que completes tus repeticiones sintiendo que podrías haber hecho como mucho 1 o 2 repeticiones más antes de fallar.';
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
          description: 'Carga exigente que te permita completar las repeticiones parando 1-2 antes del fallo muscular.'
        }
      ];
    } else if (goalInfo.key === 'lose') {
      intensityLabel = 'Esfuerzo Moderado';
      intensityDesc = 'Parar 2 reps antes del fallo';
      actionTitle = 'Calibración de Carga para Definición';
      weightChangeNote = currentTopWeight > 0 ? `${currentTopWeight} kg base` : 'Carga moderada';
      coachingAdvice = 'En déficit calórico tu objetivo es mandar una señal fuerte al cuerpo para conservar masa muscular sin desgastar en exceso las articulaciones ni agotar tu energía.';
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
          description: 'Peso controlado con 2 repeticiones en recámara para blindar masa muscular sin fatiga extrema.'
        }
      ];
    } else {
      intensityLabel = 'Esfuerzo Controlado';
      intensityDesc = 'Sin llegar al fallo muscular';
      actionTitle = 'Estableciendo Base de Rendimiento';
      weightChangeNote = currentTopWeight > 0 ? `${currentTopWeight} kg base` : 'Establecer carga';
      coachingAdvice = 'Registra tus series de hoy con buena forma. A partir de esta sesión, el entrenador inteligente calculará tus incrementos de peso óptimos.';
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

    actionDirection = 'up';
    suggestedRest = '120 - 180 seg';

    // Felicitación y celebración según el objetivo
    celebrationData = {
      isCelebrating: true,
      title: '¡Excelente progreso! Estás superando tus marcas 🚀',
      subtitle: `Tu rendimiento ha aumentado un ${trend.badgeText} respecto a tu sesión anterior.`,
      tipsToMaintain: [
        'No te apresures: los micro-incrementos constantes (1.25 a 2.5 kg) construyen fuerza sólida a largo plazo.',
        'Mantén la misma profundidad y cadencia estricta que cuando levantabas menos carga.',
        'Prioriza tu recuperación post-entrenamiento: duerme 7-8 horas y consume suficiente proteína para fijar este crecimiento.'
      ]
    };

    if (goalInfo.key === 'gain') {
      intensityLabel = 'Esfuerzo Alto';
      intensityDesc = 'Parar 1-2 reps antes de fallar';
      suggestedWeight = nextWeight;
      weightChangeNote = `+${increment} kg`;
      actionTitle = `Sobrecarga Progresiva: Sube a ${nextWeight} kg`;
      coachingAdvice = `¡Gran trabajo! Tu 1RM estimado ha crecido un ${trend.badgeText}. Para tu meta de ganancia muscular, aplica el principio de sobrecarga progresiva subiendo hoy +${increment} kg o consolidando repeticiones.`;
      actionSteps = [
        `Intenta completar tu primera serie pesada con ${nextWeight} kg.`,
        `Si notas la carga exigente, mantén el rango de ${Math.max(6, targetReps - 2)}-${targetReps} reps parando justo cuando sientas que te quedan 1-2 reps antes del fallo.`,
        'Descansa entre 2 y 3 minutos para restaurar tus reservas de fosfocreatina.'
      ];

      strategyOptions = [
        {
          id: 'prog_weight',
          title: `Sobrecarga de Carga (+${increment} kg)`,
          tag: 'Recomendada',
          badge: `+${increment} kg`,
          suggestedWeight: nextWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          description: `Sube a ${nextWeight} kg en tus primeras series para seguir estimulando la tensión mecánica y el crecimiento miofibrilar.`
        },
        {
          id: 'prog_reps',
          title: 'Consolidar Carga (+1 o 2 Reps)',
          tag: 'Alternativa',
          badge: '+1-2 reps',
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps + 1,
          suggestedSets: plannedSets,
          description: `Mantén los ${currentTopWeight} kg y busca 1 repetición adicional por serie antes de subir kilos, asegurando control absoluto.`
        }
      ];
    } else if (goalInfo.key === 'lose') {
      intensityLabel = 'Esfuerzo Moderado';
      intensityDesc = 'Parar 2 reps antes del fallo';
      suggestedWeight = currentTopWeight;
      weightChangeNote = 'Consolidar fuerza';
      actionTitle = `Potencia en Déficit: Mantén ${currentTopWeight} kg y consolida`;
      coachingAdvice = `Estás ganando fuerza incluso en déficit calórico (${trend.badgeText}). Para no comprometer la recuperación en restricción de energía, mantén los ${currentTopWeight} kg y busca consolidar repeticiones.`;
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
          description: `Mantén ${currentTopWeight} kg e intenta sumar 1 repetición manteniendo 2 en reserva para no comprometer el glucógeno.`
        },
        {
          id: 'prog_lose_weight',
          title: `Micro-Carga Opcional (+${increment} kg)`,
          tag: 'Si estás con energía',
          badge: `+${increment} kg`,
          suggestedWeight: nextWeight,
          suggestedReps: Math.max(6, targetReps - 2),
          suggestedSets: plannedSets,
          description: `Prueba ${nextWeight} kg en tu 1ª serie solo si hoy sientes energía plena y descanso óptimo.`
        }
      ];
    } else {
      intensityLabel = 'Esfuerzo Alto';
      intensityDesc = 'Parar 1-2 reps antes de fallar';
      suggestedWeight = nextWeight;
      weightChangeNote = `+${increment} kg`;
      actionTitle = `Consistencia en Aumento: Sube a ${nextWeight} kg`;
      coachingAdvice = `Tu rendimiento sigue una curva ascendente. Añade una micro-carga de +${increment} kg para seguir estimulando la densidad muscular.`;
      actionSteps = [
        `Añade la micro-carga de ${increment} kg en las primeras series.`,
        'Mantén la tensión muscular continua en cada repetición.'
      ];

      strategyOptions = [
        {
          id: 'prog_general_weight',
          title: `Incremento de Carga (+${increment} kg)`,
          tag: 'Recomendada',
          badge: `+${increment} kg`,
          suggestedWeight: nextWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          description: `Aumenta a ${nextWeight} kg para mantener el estímulo progresivo.`
        },
        {
          id: 'prog_general_reps',
          title: 'Consolidación de Reps',
          tag: 'Alternativa',
          badge: '+1 rep',
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps + 1,
          suggestedSets: plannedSets,
          description: `Mantén los ${currentTopWeight} kg y suma una repetición extra con buena técnica.`
        }
      ];
    }

  // ============================================================
  // CASO 3: ESTANCADO (MESETA DETECTADA)
  // ============================================================
  } else if (trend.status === 'stagnant') {
    const microLoad = currentTopWeight >= 40 ? 1.25 : 1.0;
    const testWeight = Math.round((currentTopWeight + microLoad) * 10) / 10;
    suggestedRest = '150 - 180 seg';

    // Texto motivador fundamentado en ciencias del deporte
    motivationalMessage = `No te frustres: las mesetas no son un estancamiento real, sino el proceso natural donde tu sistema neuromuscular consolida adaptaciones antes del siguiente salto de fuerza. Con una pequeña variación en la estrategia hoy, romperás este techo.`;

    // Recomendación de Asesoría Pro Fitness con preparador real
    asesoriaRecommendation = {
      show: true,
      headline: '¿Llevas varias semanas sin avanzar?',
      description: 'Un preparador físico oficial en la Asesoría Pro Fitness puede revisar tus vídeos de técnica, periodizar tus cargas y ajustar tu nutrición para romper esta meseta de inmediato.',
      buttonText: 'Hablar con un Entrenador Real'
    };

    if (goalInfo.key === 'gain') {
      actionDirection = 'up';
      intensityLabel = 'Esfuerzo Alto';
      intensityDesc = 'Exigente sin perder técnica';
      suggestedWeight = testWeight;
      weightChangeNote = `+${microLoad} kg`;
      actionTitle = `Rompe la Meseta (${trend.weeksStagnant} sem): Elige tu estrategia`;
      coachingAdvice = `Llevas ${trend.weeksStagnant} semanas con ${currentTopWeight} kg. En fase de ganancia de masa, el músculo necesita una nueva demanda de tensión mecánica para no acomodarse.`;
      actionSteps = [
        `Opción A: Pon ${testWeight} kg (micro-carga) en tu 1ª serie y trabaja en el límite inferior (${Math.max(6, targetReps - 2)} reps).`,
        `Opción B: Mantén los ${currentTopWeight} kg pero oblígate a conseguir 1 o 2 repeticiones extra en la primera serie antes de soltar la barra.`,
        'Aumenta el tiempo de descanso a 2.5 - 3 minutos antes de la serie más pesada.'
      ];

      strategyOptions = [
        {
          id: 'stag_microload',
          title: `Estrategia A: Micro-carga (+${microLoad} kg)`,
          tag: 'Recomendada',
          badge: `Probar ${testWeight} kg`,
          suggestedWeight: testWeight,
          suggestedReps: Math.max(6, targetReps - 2),
          suggestedSets: plannedSets,
          description: `Sube a ${testWeight} kg en la primera serie. Al tolerar 1-2 repeticiones menos, obligas a tus unidades motoras de alto umbral a activarse.`
        },
        {
          id: 'stag_volume_reps',
          title: `Estrategia B: Sobrecarga por Reps (+2 reps)`,
          tag: 'Alternativa',
          badge: `Mantener ${currentTopWeight} kg`,
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps + 2,
          suggestedSets: plannedSets,
          description: `Mantén los ${currentTopWeight} kg pero busca entre 1 y 2 repeticiones más en tu serie inicial para elevar el volumen efectivo.`
        },
        {
          id: 'stag_tempo',
          title: 'Estrategia C: Tempo Excéntrico (3 seg)',
          tag: 'Tensión Máxima',
          badge: 'Cadencia 3s',
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          description: `Mantén ${currentTopWeight} kg pero frena la bajada durante 3 segundos enteros. Dispara el tiempo bajo tensión sin riesgo articular.`
        }
      ];
    } else if (goalInfo.key === 'lose') {
      actionDirection = 'maintain';
      intensityLabel = 'Esfuerzo Moderado';
      intensityDesc = 'Retener masa sin agotamiento';
      suggestedWeight = currentTopWeight;
      weightChangeNote = 'Mantener carga';
      actionTitle = `Blindaje Muscular: Mantén ${currentTopWeight} kg`;
      coachingAdvice = `¡Estar en meseta de fuerza durante definición es una EXCELENTE noticia! Significa que estás conservando intacta tu masa muscular magra a pesar de comer menos calorías.`;
      actionSteps = [
        `No fuerces aumentos bruscos de peso que puedan lesionarte en déficit: mantén firmes tus ${currentTopWeight} kg.`,
        'Concéntrate en la fase excéntrica (bajada lenta de 3 segundos) para maximizar tensión sin dañar articulaciones.',
        'Asegura un descanso de 2 minutos para disipar la fatiga del sistema nervioso.'
      ];

      strategyOptions = [
        {
          id: 'stag_lose_lock',
          title: `Blindaje de Carga (${currentTopWeight} kg)`,
          tag: 'Recomendada',
          badge: 'Preservar músculo',
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          description: `Mantén exactamente ${currentTopWeight} kg. Cada sesión en la que no bajas peso en definición es una victoria directa para tu composición corporal.`
        },
        {
          id: 'stag_lose_microreps',
          title: 'Buscar +1 Repetición Limpia',
          tag: 'Alternativa',
          badge: '+1 rep',
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps + 1,
          suggestedSets: plannedSets,
          description: `Intenta sacar 1 repetición más solo en la 1ª serie y mantén 2 repeticiones en recámara en las siguientes.`
        }
      ];
    } else {
      actionDirection = 'maintain';
      intensityLabel = 'Controlado';
      intensityDesc = 'Mayor tiempo bajo tensión';
      suggestedWeight = currentTopWeight;
      weightChangeNote = 'Variar estímulo';
      actionTitle = `Meseta Detectada: Ajusta Rango o Cadencia`;
      coachingAdvice = `Llevas varias sesiones con la misma carga. Para reactivar el progreso, mantén los ${currentTopWeight} kg pero aplica una cadencia de 3 segundos en bajada o suma 1 repetición.`;
      actionSteps = [
        'Aumenta el tiempo bajo tensión bajando el peso en 3 segundos.',
        'Explora si puedes sumar 1 repetición más en las series iniciales.'
      ];

      strategyOptions = [
        {
          id: 'stag_gen_tempo',
          title: 'Variar Cadencia Excéntrica (3s)',
          tag: 'Recomendada',
          badge: 'Tempo 3s',
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          description: `Baja el peso en 3 segundos controlados con ${currentTopWeight} kg para romper la adaptación neuromuscular.`
        },
        {
          id: 'stag_gen_micro',
          title: `Micro-Carga (+${microLoad} kg)`,
          tag: 'Alternativa',
          badge: `+${microLoad} kg`,
          suggestedWeight: testWeight,
          suggestedReps: Math.max(6, targetReps - 2),
          suggestedSets: plannedSets,
          description: `Prueba ${testWeight} kg para dar un estímulo más intenso a nivel mecánico.`
        }
      ];
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
      coachingAdvice = `Has registrado una bajada de rendimiento respecto a sesiones previas (${trend.badgeText}). En ganancia muscular, esto suele deberse a fatiga neuromuscular acumulada. Forzar el peso hoy solo eleva el riesgo de lesión.`;
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
          description: `Mantén ${currentTopWeight} kg pero haz solo ${Math.max(2, plannedSets - 1)} series en lugar de ${plannedSets} para reducir el estrés neuromuscular.`
        }
      ];
    } else if (goalInfo.key === 'lose') {
      intensityLabel = 'Carga Reducida';
      intensityDesc = 'Sin forzar articulaciones';
      suggestedRir = '2-3 del fallo';
      suggestedSets = Math.max(2, plannedSets - 1);
      actionTitle = `Gestión de Energía en Déficit: Ajuste hoy`;
      coachingAdvice = `En pérdida de grasa es totalmente normal tener días con reservas de glucógeno y energía bajas. No te castigues: ajustar un poco la carga previene lesiones y te permite seguir entrenando con regularidad.`;
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
          description: `Mantén los ${currentTopWeight} kg pero recorta una serie para proteger tu recuperación.`
        }
      ];
    } else {
      intensityLabel = 'Descarga Preventiva';
      intensityDesc = 'Velocidad controlada';
      actionTitle = `Ajuste de Carga por Fatiga: ${reducedWeight} kg`;
      coachingAdvice = `Ligera disminución en la curva de fuerza. Ajusta el peso hoy a ${reducedWeight} kg para recuperar la frescura neuromuscular.`;
      actionSteps = [
        `Utiliza ${reducedWeight} kg con velocidad controlada.`,
        'Prioriza la recuperación post-entrenamiento.'
      ];

      strategyOptions = [
        {
          id: 'dec_gen_deload',
          title: `Descarga Preventiva (${reducedWeight} kg)`,
          tag: 'Recomendada',
          badge: `${reducedWeight} kg`,
          suggestedWeight: reducedWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          description: `Ajusta a ${reducedWeight} kg para recuperar la frescura física.`
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
