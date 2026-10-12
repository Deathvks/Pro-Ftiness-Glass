/* frontend/src/utils/smartProgressionCoach.js */
import { calculate1RM } from './helpers';

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
      badge: 'Fuerza & Volumen',
      iconName: 'Zap',
      color: 'accent',
      description: 'Superávit y sobrecarga progresiva para maximizar la síntesis proteica y crecimiento miofibrilar.'
    };
  }
  if (g === 'lose' || g === 'weight_loss') {
    return {
      key: 'lose',
      label: 'Perder Grasa / Definición',
      shortLabel: 'Definición',
      badge: 'Preservación Muscular',
      iconName: 'Target',
      color: 'emerald-500',
      description: 'Déficit calórico enfocado en mantener la fuerza mecánica para proteger el músculo ganado.'
    };
  }
  if (g === 'recomp') {
    return {
      key: 'recomp',
      label: 'Recomposición Corporal',
      shortLabel: 'Recomposición',
      badge: 'Músculo & Grasa',
      iconName: 'Sparkles',
      color: 'purple-500',
      description: 'Equilibrio entre estímulo neuromuscular y optimización de grasa corporal.'
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
      date: log.workout_date,
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
  if (sessions.length === 0) {
    return {
      status: 'first_time',
      label: 'Sesión Inicial',
      badgeText: 'Calibración inicial',
      colorClass: 'text-accent border-accent/30 bg-accent/10',
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
  let isMultiStagnant = false;

  if (sessions.length >= 2) {
    const isWeightSame = Math.abs(deltaWeight) < 0.5;
    const isRepsSameOrLower = deltaReps <= 0;

    if (isWeightSame && isRepsSameOrLower) {
      isMultiStagnant = true;
      // Calcular semanas entre la primera sesión de la meseta y la última
      const earliestDate = new Date(sessions[Math.min(sessions.length - 1, 3)].date);
      const latestDate = new Date(s0.date);
      const diffDays = Math.max(7, Math.round((latestDate - earliestDate) / (1000 * 60 * 60 * 24)));
      weeksStagnant = Math.max(1, Math.round(diffDays / 7));
    }
  }

  // Criterios claros de clasificación:
  // 1. Progresando: subió 1RM >= +1kg, subió peso, o mantuvo peso y subió repeticiones
  if (delta1RM >= 1.0 || deltaWeight > 0 || (Math.abs(deltaWeight) < 0.5 && deltaReps >= 1)) {
    return {
      status: 'progressing',
      label: 'En Progresión',
      badgeText: `+${Math.abs(pctChange)}% fuerza`,
      colorClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      delta1RM,
      deltaWeight,
      deltaReps,
      weeksStagnant: 0,
      pctChange
    };
  }

  // 2. Disminuido: bajó 1RM <= -2kg o bajó peso o bajó 2+ reps al mismo peso
  if (delta1RM <= -2.0 || deltaWeight < -1.0 || (Math.abs(deltaWeight) < 0.5 && deltaReps <= -2)) {
    return {
      status: 'decreasing',
      label: 'Rendimiento Reducido',
      badgeText: `${pctChange}% de fatiga`,
      colorClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
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
    delta1RM,
    deltaWeight,
    deltaReps,
    weeksStagnant: weeksStagnant || 1,
    pctChange
  };
};

/**
 * Genera el plan inteligente de peso, series, repeticiones y recomendaciones según objetivo y estado.
 */
export const generateSmartCoachPlan = (exercise, userProfile, workoutLog) => {
  const goalInfo = normalizeUserGoal(userProfile?.goal);
  const sessions = getExerciseHistorySessions(exercise.name, workoutLog);
  const trend = diagnoseExerciseTrend(sessions);

  const plannedSets = parseInt(exercise.sets, 10) || 3;
  const rawReps = String(exercise.reps || '10');
  const targetReps = parseInt(rawReps.split('-')[0], 10) || 10;
  const lastSession = sessions[0] || null;

  const isBodyweight = lastSession ? lastSession.topWeight === 0 : false;
  const currentTopWeight = lastSession?.topWeight || 0;

  let suggestedWeight = currentTopWeight;
  let suggestedSets = plannedSets;
  let suggestedReps = targetReps;
  let suggestedRir = 'RIR 1-2';
  let suggestedRest = '90 - 120 seg';
  let actionTitle = '';
  let actionDirection = 'maintain'; // 'up' | 'down' | 'maintain'
  let weightChangeNote = '';
  let coachingAdvice = '';
  let actionSteps = [];

  // --- LÓGICA ESPECÍFICA SEGÚN OBJETIVO Y ESTADO ---

  if (trend.status === 'first_time' || trend.status === 'calibrating') {
    suggestedSets = plannedSets;
    suggestedReps = targetReps;
    suggestedWeight = currentTopWeight > 0 ? currentTopWeight : null;

    if (goalInfo.key === 'gain') {
      actionTitle = 'Calibración de Fuerza e Hipertrofia';
      actionDirection = 'maintain';
      coachingAdvice = 'Para maximizar la hipertrofia, localiza un peso exigente donde te queden exactamente 1 o 2 repeticiones en recámara (RIR 1-2) para completar tus series.';
      actionSteps = [
        'Haz 1-2 series de aproximación con poco peso.',
        'Selecciona una carga con la que llegues a la última repetición con esfuerzo alto pero técnica limpia.',
        'Apunta cada serie para que el sistema calcule tu sobrecarga la próxima vez.'
      ];
    } else if (goalInfo.key === 'lose') {
      actionTitle = 'Calibración de Carga para Definición';
      actionDirection = 'maintain';
      coachingAdvice = 'En déficit calórico tu objetivo es mandar una señal fuerte al cuerpo para conservar masa muscular sin desgastar en exceso las articulaciones.';
      actionSteps = [
        'Prioriza pesos que domines con cadencia controlada (2-3 segundos de bajada).',
        'Guarda 2 repeticiones en recámara (RIR 2) para no acumular fatiga excesiva.',
        'Mantén descansos de 90 a 120 segundos para recuperar potencia.'
      ];
    } else {
      actionTitle = 'Estableciendo Base de Rendimiento';
      actionDirection = 'maintain';
      coachingAdvice = 'Registra tus series de hoy con buena forma. A partir de esta sesión, el entrenador inteligente calculará tus incrementos de peso óptimos.';
      actionSteps = [
        'Ejecuta con rango completo de movimiento.',
        'Apunta el peso real y las repeticiones logradas.'
      ];
    }
  } else if (trend.status === 'progressing') {
    // --- ESTADO: PROGRESANDO ---
    if (goalInfo.key === 'gain') {
      actionDirection = 'up';
      // Sobrecarga progresiva: micro-carga
      const increment = currentTopWeight >= 40 ? 2.5 : 1.25;
      suggestedWeight = Math.round((currentTopWeight + increment) * 10) / 10;
      weightChangeNote = `+${increment} kg respecto a la sesión anterior`;
      actionTitle = `🚀 Sobrecarga Progresiva: Sube a ${suggestedWeight} kg`;
      coachingAdvice = `¡Excelente progresión! Tu 1RM estimado ha crecido un ${trend.badgeText}. Para tu objetivo de ganancia muscular, aplica el principio de sobrecarga progresiva subiendo hoy +${increment} kg.`;
      actionSteps = [
        `Intenta completar tu primera serie pesada con ${suggestedWeight} kg.`,
        `Si notas la carga exigente, mantén el rango de ${Math.max(6, targetReps - 2)}-${targetReps} reps con RIR 1-2.`,
        'Descansa entre 2 y 3 minutos para restaurar tus reservas de fosfocreatina.'
      ];
      suggestedRest = '120 - 180 seg';
    } else if (goalInfo.key === 'lose') {
      actionDirection = 'maintain';
      suggestedWeight = currentTopWeight;
      weightChangeNote = 'Mantén el peso para blindar tu masa muscular';
      actionTitle = `🔥 Potencia en Déficit: Mantén ${currentTopWeight} kg y consolida reps`;
      coachingAdvice = `Estás ganando fuerza incluso en déficit calórico (${trend.badgeText}). Para no comprometer la recuperación en restricción calórica, mantén los ${currentTopWeight} kg y busca 1 repetición más antes de subir peso en kilos.`;
      actionSteps = [
        `Consolida series limpias con ${currentTopWeight} kg sin descuidar la técnica.`,
        'Si sientes mucha energía en la 1ª serie, busca 1 repetición adicional.',
        'No entrenes al fallo absoluto: quédate a RIR 2 para controlar el cortisol.'
      ];
    } else {
      actionDirection = 'up';
      const increment = currentTopWeight >= 40 ? 2.0 : 1.0;
      suggestedWeight = Math.round((currentTopWeight + increment) * 10) / 10;
      weightChangeNote = `+${increment} kg progresivo`;
      actionTitle = `📈 Consistencia en Aumento: Sube a ${suggestedWeight} kg`;
      coachingAdvice = `Tu rendimiento sigue una curva ascendente. Añade una micro-carga de +${increment} kg para seguir estimulando la densidad muscular.`;
      actionSteps = [
        `Añade la micro-carga de ${increment} kg en las primeras series.`,
        'Mantén la tensión muscular continua en cada repetición.'
      ];
    }
  } else if (trend.status === 'stagnant') {
    // --- ESTADO: ESTANCADO ---
    if (goalInfo.key === 'gain') {
      actionDirection = 'up';
      // Llevan semanas con el mismo peso y reps
      const microLoad = currentTopWeight >= 40 ? 1.25 : 1.0;
      const testWeight = Math.round((currentTopWeight + microLoad) * 10) / 10;

      actionTitle = `⏸️ Rompe el Estancamiento (${trend.weeksStagnant} sem): Micro-carga o +2 Reps`;
      weightChangeNote = `Opción A: +${microLoad} kg micro-carga | Opción B: Mantén y saca +2 reps`;
      suggestedWeight = testWeight;
      coachingAdvice = `Llevas ${trend.weeksStagnant} semanas con ${currentTopWeight} kg. En fase de ganancia de masa, el músculo necesita un nuevo estímulo mecánico para no acomodarse.`;
      actionSteps = [
        `Estrategia 1 (Recomendada): Pon ${testWeight} kg (micro-carga) en tu 1ª serie y trabaja en el límite inferior (${Math.max(6, targetReps - 2)} reps).`,
        `Estrategia 2: Mantén los ${currentTopWeight} kg pero oblígate a conseguir 1 o 2 repeticiones extra en la primera serie antes de soltar la barra.`,
        'Aumenta el tiempo de descanso a 2.5 - 3 minutos antes de la serie pesada.'
      ];
      suggestedRest = '150 - 180 seg';
    } else if (goalInfo.key === 'lose') {
      actionDirection = 'maintain';
      suggestedWeight = currentTopWeight;
      weightChangeNote = 'Estancarse en definición es un ÉXITO: retienes tu masa magra';
      actionTitle = `🛡️ Blindaje Muscular: Mantén ${currentTopWeight} kg`;
      coachingAdvice = `Estar estancado en peso levantado durante una fase de déficit o pérdida de grasa es la MEJOR señal posible: significa que tu masa muscular se está conservando intacta a pesar de comer menos calorías.`;
      actionSteps = [
        `No fuerces aumentos bruscos de peso que puedan lesionarte en déficit: mantén firmes tus ${currentTopWeight} kg.`,
        'Concéntrate en la fase excéntrica (bajada lenta de 3 segundos) para maximizar tensión sin dañar articulaciones.',
        'Asegura un descanso de 2 minutos para disipar la fatiga del sistema nervioso.'
      ];
    } else {
      actionDirection = 'maintain';
      suggestedWeight = currentTopWeight;
      actionTitle = `⚖️ Meseta Detectada: Ajusta Rango o Cadencia`;
      weightChangeNote = `Mantén ${currentTopWeight} kg y varía el tiempo bajo tensión`;
      coachingAdvice = `Llevas varias sesiones con la misma carga. Para reactivar el progreso, mantén los ${currentTopWeight} kg pero aplica una cadencia de 3 segundos en bajada o suma 1 repetición.`;
      actionSteps = [
        'Aumenta el tiempo bajo tensión bajando el peso en 3 segundos.',
        'Explora si puedes sumar 1 repetición más en las series iniciales.'
      ];
    }
  } else if (trend.status === 'decreasing') {
    // --- ESTADO: DISMINUIDO / FATIGA ---
    const reducedWeight = Math.max(0, Math.round((currentTopWeight * 0.92) / 2.5) * 2.5 || currentTopWeight - 2.5);
    suggestedWeight = reducedWeight;
    actionDirection = 'down';

    if (goalInfo.key === 'gain') {
      actionTitle = `📉 Descarga Táctica por Fatiga: Baja a ${reducedWeight} kg`;
      weightChangeNote = `Baja ~8-10% (-${Math.round((currentTopWeight - reducedWeight) * 10) / 10} kg) hoy`;
      coachingAdvice = `Has registrado una bajada de rendimiento respecto a tus sesiones anteriores (${trend.badgeText}). En ganancia muscular, esto suele deberse a fatiga neuromuscular acumulada. Forzar el peso hoy solo aumenta el riesgo de lesión.`;
      actionSteps = [
        `Reduce el peso a ${reducedWeight} kg para hacer una sesión de descarga técnica de alta calidad.`,
        'Enfócate en la contracción muscular perfecta y guarda 2-3 repeticiones en recámara (RIR 2-3).',
        'Revisa tu hidratación, consumo de carbohidratos previos y horas de sueño de anoche.'
      ];
      suggestedRir = 'RIR 2-3';
    } else if (goalInfo.key === 'lose') {
      actionTitle = `🔋 Gestión de Energía en Déficit: Ajusta a ${reducedWeight} kg`;
      weightChangeNote = `Ajuste preventivo (-${Math.round((currentTopWeight - reducedWeight) * 10) / 10} kg) por glucógeno bajo`;
      coachingAdvice = `En pérdida de grasa es habitual tener días con menores niveles de glucógeno y energía. No te castigues: ajustar un poco la carga previene lesiones y te permite seguir entrenando con regularidad.`;
      actionSteps = [
        `Trabaja hoy con ${reducedWeight} kg ejecutando repeticiones limpias sin rebotes.`,
        `Si te sientes agotado, quédate en ${Math.max(2, plannedSets - 1)} series en lugar de ${plannedSets}.`,
        'Prioriza descansar bien y beber agua entre series.'
      ];
      suggestedSets = Math.max(2, plannedSets - 1);
      suggestedRir = 'RIR 2-3';
    } else {
      actionTitle = `🔄 Ajuste de Carga por Fatiga: ${reducedWeight} kg`;
      weightChangeNote = `Reducción preventiva de peso`;
      coachingAdvice = `Ligera disminución en la curva de fuerza. Ajusta el peso hoy a ${reducedWeight} kg para recuperar la frescura neuromuscular.`;
      actionSteps = [
        `Utiliza ${reducedWeight} kg con velocidad controlada.`,
        'Prioriza la recuperación post-entrenamiento.'
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
      suggestedRest,
      actionDirection,
      actionTitle
    },
    coachingAdvice,
    actionSteps
  };
};
