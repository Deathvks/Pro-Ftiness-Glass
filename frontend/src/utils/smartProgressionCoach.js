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
 * Listas explícitas de respaldo por nombre de ejercicio para distinguir con precisión
 * qué ejercicios utilizan barra, polea, mancuernas, máquina o peso corporal,
 * incluso si el campo `equipment` / `material` no estuviera definido en algún ejercicio.
 */
export const BARBELL_EXERCISE_LIST = [
  'con barra',
  'en barra',
  'barra z',
  'barra ez',
  'barra recta',
  'barra olímpica',
  'barra olimpica',
  'barra hexagonal',
  'trap bar',
  'barra t',
  't-bar',
  'landmine',
  'multipower',
  'smith',
  'press de banca',
  'press banca',
  'bench press',
  'press inclinado con barra',
  'press declinado con barra',
  'press cerrado',
  'press militar',
  'overhead press',
  'push press',
  'sentadilla con barra',
  'sentadilla libre',
  'sentadilla trasera',
  'sentadilla frontal',
  'back squat',
  'front squat',
  'sentadilla zercher',
  'peso muerto',
  'peso muerto convencional',
  'peso muerto sumo',
  'peso muerto rumano',
  'deadlift',
  'rack pull',
  'buenos días',
  'buenos dias',
  'good morning',
  'hip thrust',
  'puente de glúteo con barra',
  'puente de gluteo con barra',
  'remo con barra',
  'remo pendlay',
  'remo yates',
  'remo en punta',
  'remo en barra t',
  'curl con barra',
  'curl barra',
  'curl predicador con barra',
  'curl araña con barra',
  'press francés',
  'press frances',
  'rompecráneos',
  'rompecraneos',
  'skullcrusher',
  'encogimientos con barra',
  'remo al mentón con barra',
  'remo al menton con barra',
  'clean',
  'snatch',
  'thruster'
];

export const PULLEY_EXERCISE_LIST = [
  'polea',
  'poleas',
  'cable',
  'cables',
  'cuerda',
  'jalón',
  'jalon',
  'pulldown',
  'lat pulldown',
  'cruce de poleas',
  'cruces en polea',
  'cruce de polea',
  'crossover',
  'face pull',
  'facepull',
  'tríceps en polea',
  'triceps en polea',
  'extensión de tríceps en polea',
  'extension de triceps en polea',
  'extensión en polea',
  'extension en polea',
  'curl en polea',
  'curl bayesian',
  'bayesian',
  'remo gironda',
  'remo en polea',
  'remo sentado en polea',
  'pull-over en polea',
  'pullover en polea',
  'patada de glúteo en polea',
  'patada en polea',
  'elevación lateral en polea',
  'elevacion lateral en polea',
  'leñador en polea',
  'woodchopper',
  'crunch en polea'
];

export const DUMBBELL_EXERCISE_LIST = [
  'mancuerna',
  'mancuernas',
  'dumbbell',
  'dumbbells',
  'pesa rusa',
  'pesas rusas',
  'kettlebell',
  'goblet',
  'curl martillo',
  'martillo',
  'hammer curl',
  'curl concentrado',
  'curl alterno',
  'curl inclinado con mancuernas',
  'curl zottman',
  'press arnold',
  'arnold press',
  'press con mancuernas',
  'press inclinado con mancuernas',
  'aperturas con mancuernas',
  'apertura con mancuernas',
  'pullover con mancuerna',
  'zancada con mancuernas',
  'zancadas con mancuernas',
  'sentadilla búlgara',
  'sentadilla bulgara',
  'elevaciones laterales',
  'elevación lateral',
  'elevacion lateral',
  'elevaciones frontales',
  'pájaros',
  'pajaros',
  'remo con mancuerna',
  'remo a una mano',
  'remo kroc',
  'patada de tríceps',
  'patada de triceps',
  'copa a dos manos',
  'extensión tras nuca con mancuerna',
  'encogimientos con mancuernas',
  'paso del granjero',
  'farmer walk'
];

export const MACHINE_EXERCISE_LIST = [
  'máquina',
  'maquina',
  'machine',
  'prensa',
  'leg press',
  'sentadilla hack',
  'hack squat',
  'sentadilla péndulo',
  'sentadilla pendulo',
  'belt squat',
  'extensión de cuádriceps',
  'extension de cuadriceps',
  'leg extension',
  'curl femoral',
  'isquios en máquina',
  'leg curl',
  'abductor',
  'abductores',
  'aductor',
  'aductores',
  'contractora',
  'pec deck',
  'peck deck',
  'chest press',
  'press en máquina',
  'remo en máquina',
  'gemelo en máquina',
  'gemelo sentado',
  'gemelo de pie en máquina',
  'jaca'
];

export const BODYWEIGHT_EXERCISE_LIST = [
  'peso corporal',
  'corporal',
  'bodyweight',
  'calistenia',
  'dominada',
  'dominadas',
  'pull-up',
  'chin-up',
  'flexiones',
  'flexión',
  'flexion',
  'push-up',
  'fondos en paralelas',
  'plancha',
  'plank',
  'burpee',
  'muscle-up'
];

/**
 * Formatea una carga de forma inteligente: si es 0 devuelve "peso corporal" / "Peso corporal",
 * si es mayor que 0 devuelve "X kg" o "Xkg".
 */
export const formatWeightDisplay = (weight, opts = {}) => {
  const num = parseFloat(weight) || 0;
  if (num <= 0) {
    if (opts.badge || opts.capitalized) return 'Peso corporal';
    return 'peso corporal';
  }
  if (opts.noSpace) return `${num}kg`;
  return `${num} kg`;
};

/**
 * Clasifica el material / equipamiento real del ejercicio combinando:
 * 1) El campo `equipment` / `material` del ejercicio (o del catálogo `allExercises`).
 * 2) Las listas explícitas de nombres de ejercicios (`BARBELL_EXERCISE_LIST`, `PULLEY_EXERCISE_LIST`, etc.).
 *
 * Retorna: 'barbell' | 'pulley' | 'dumbbell' | 'machine' | 'bodyweight' | 'other'
 */
export const detectExerciseEquipmentType = (exercise, allExercises = []) => {
  if (!exercise) return 'other';

  const rawName = String(exercise.name || exercise.exercise_name || '').toLowerCase().trim();

  // Buscar material directo en el objeto o en el catálogo global de ejercicios
  let rawEquipment = String(
    exercise.equipment ||
    exercise.material ||
    exercise.exercise_details?.equipment ||
    exercise.exercise_details?.material ||
    exercise.Exercise?.equipment ||
    ''
  ).toLowerCase().trim();

  if ((!rawEquipment || rawEquipment === 'other' || rawEquipment === 'none' || rawEquipment === 'desconocido') && Array.isArray(allExercises) && allExercises.length > 0 && rawName) {
    const matched = allExercises.find(
      (ex) => String(ex?.name || '').toLowerCase().trim() === rawName
    );
    if (matched?.equipment) {
      rawEquipment = String(matched.equipment).toLowerCase().trim();
    }
  }

  // 1. Prioridad a menciones específicas en el nombre del ejercicio cuando desambiguan variantes
  // (ej. "Peso muerto rumano con mancuernas" o "Elevación lateral en polea")
  if (rawName.includes('polea') || rawName.includes('cable')) return 'pulley';
  if (rawName.includes('mancuerna') || rawName.includes('dumbbell') || rawName.includes('kettlebell') || rawName.includes('pesa rusa')) return 'dumbbell';
  if (rawName.includes('máquina') || rawName.includes('maquina') || rawName.includes('prensa') || rawName.includes('contractora') || rawName.includes('pec deck')) return 'machine';
  if (rawName.includes('barra') || rawName.includes('barbell') || rawName.includes('multipower') || rawName.includes('smith')) return 'barbell';

  // 2. Clasificación por el campo de material / equipamiento ("barra", "polea" / "poleas", "mancuerna", "máquina", etc.)
  if (rawEquipment) {
    if (rawEquipment.includes('polea') || rawEquipment.includes('cable') || rawEquipment.includes('cuerda')) {
      return 'pulley';
    }
    if (rawEquipment.includes('mancuerna') || rawEquipment.includes('dumbbell') || rawEquipment.includes('pesa rusa') || rawEquipment.includes('kettlebell')) {
      return 'dumbbell';
    }
    if (rawEquipment.includes('barra') || rawEquipment.includes('barbell') || rawEquipment.includes('ez') || rawEquipment.includes('multipower') || rawEquipment.includes('smith')) {
      return 'barbell';
    }
    if (rawEquipment.includes('máquina') || rawEquipment.includes('maquina') || rawEquipment.includes('machine') || rawEquipment.includes('disco') || rawEquipment.includes('placa')) {
      return 'machine';
    }
    if (rawEquipment.includes('corporal') || rawEquipment.includes('bodyweight') || rawEquipment.includes('ninguno')) {
      return 'bodyweight';
    }
  }

  // 3. Respaldo mediante las listas explícitas en el fichero por si algún ejercicio no tiene material asignado
  if (PULLEY_EXERCISE_LIST.some((kw) => rawName.includes(kw))) return 'pulley';
  if (DUMBBELL_EXERCISE_LIST.some((kw) => rawName.includes(kw))) return 'dumbbell';
  if (MACHINE_EXERCISE_LIST.some((kw) => rawName.includes(kw))) return 'machine';
  if (BARBELL_EXERCISE_LIST.some((kw) => rawName.includes(kw))) return 'barbell';
  if (BODYWEIGHT_EXERCISE_LIST.some((kw) => rawName.includes(kw))) return 'bodyweight';

  return 'other';
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

    const topWeightSets = workingSets.filter(s => Math.abs((parseFloat(s.weight_kg) || 0) - topWeight) < 0.5);
    const topWeightRepsList = topWeightSets.map(s => parseInt(s.reps, 10) || 0).filter(r => r > 0);
    const minRepsAtTopWeight = topWeightRepsList.length > 0 ? Math.min(...topWeightRepsList) : topReps;
    const avgRepsAtTopWeight = topWeightRepsList.length > 0
      ? Math.round((topWeightRepsList.reduce((acc, r) => acc + r, 0) / topWeightRepsList.length) * 10) / 10
      : topReps;
    const loggedRirs = topWeightSets
      .filter(s => s.rir !== undefined && s.rir !== null && s.rir !== '')
      .map(s => parseFloat(s.rir))
      .filter(r => !isNaN(r));
    const minRirAtTopWeight = loggedRirs.length > 0 ? Math.min(...loggedRirs) : null;

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
      minRepsAtTopWeight,
      avgRepsAtTopWeight,
      topWeightSetsCount: topWeightSets.length,
      minRirAtTopWeight,
      best1RM: Math.round(best1RM * 10) / 10,
      totalVolume: Math.round(totalVolume),
      setsCount: workingSets.length,
      sets: workingSets
    });
  });

  // Filtrado de sesiones de la MISMA rutina (por ID o por nombre)
  const sameRoutineSessions = sessions.filter(s => s.isCurrentRoutine);

  // Extraer fecha del último entreno registrado para esta rutina
  let lastRoutineDate = null;
  if (Array.isArray(workoutLog) && (currentRIdStr || currentRNameNorm)) {
    const routineLog = workoutLog.find(log => {
      const rawId = log.routine_id || log.routineId;
      const resolvedName = log.routine_name || log.routineName;
      const matchesId = currentRIdStr && rawId && String(rawId) === currentRIdStr;
      const matchesName = currentRNameNorm && resolvedName && resolvedName.toLowerCase().trim() === currentRNameNorm;
      return matchesId || matchesName;
    });
    if (routineLog) {
      lastRoutineDate = routineLog.workout_date || routineLog.date || routineLog.created_at || null;
    }
  }

  sessions.routineContext = {
    hasMultipleRoutines,
    distinctRoutines,
    currentRoutineId: currentRIdStr,
    currentRoutineName: currentRoutineName || null,
    sameRoutineSessionsCount: sameRoutineSessions.length,
    sameRoutineSessions,
    lastRoutineDate
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
      stagnantSessionsCount: 0,
      pctChange: 0
    };
  }

  // Priorizar sesiones de la misma rutina si existe contexto de rutina activa
  let targetSessions = sessions;
  const rCtx = sessions.routineContext;
  if (rCtx && (currentRoutineId || rCtx.currentRoutineId || rCtx.currentRoutineName)) {
    targetSessions = rCtx.sameRoutineSessions || [];
  } else if (rCtx?.sameRoutineSessions && rCtx.sameRoutineSessions.length > 0) {
    targetSessions = rCtx.sameRoutineSessions;
  }

  if (targetSessions.length === 0) {
    return {
      status: 'first_time',
      label: 'Sesión Inicial',
      badgeText: 'Pendiente de datos',
      colorClass: 'text-accent border-accent/30 bg-accent/10',
      isWarning: false,
      isProgressing: false,
      delta1RM: 0,
      deltaWeight: 0,
      deltaReps: 0,
      weeksStagnant: 0,
      stagnantSessionsCount: 0,
      pctChange: 0
    };
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
      stagnantSessionsCount: 1,
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

  // Comprobar semanas y número de sesiones estancado si son varias sesiones iguales
  let weeksStagnant = 0;
  let stagnantSessionsCount = 1;

  if (targetSessions.length >= 2) {
    for (let i = 1; i < targetSessions.length; i++) {
      const prev = targetSessions[i];
      if (Math.abs(prev.topWeight - s0.topWeight) < 0.5 && prev.topReps >= s0.topReps) {
        stagnantSessionsCount++;
      } else {
        break;
      }
    }

    const isWeightSame = Math.abs(deltaWeight) < 0.5;
    const isRepsSameOrLower = deltaReps <= 0;

    if (isWeightSame && isRepsSameOrLower) {
      const earliestIdx = Math.min(targetSessions.length - 1, Math.max(1, stagnantSessionsCount - 1));
      const earliestDate = new Date(targetSessions[earliestIdx].date);
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
    const isBW = s0.topWeight === 0;
    return {
      status: 'progressing',
      label: isBW ? 'Más Repeticiones' : 'En Progresión',
      badgeText: isBW ? `+${deltaReps} rep${deltaReps > 1 ? 's' : ''}` : `+${Math.abs(pctChange)}% fuerza`,
      colorClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      isWarning: false,
      isProgressing: true,
      delta1RM,
      deltaWeight,
      deltaReps,
      weeksStagnant: 0,
      stagnantSessionsCount: 0,
      pctChange
    };
  }

  // 2. Disminuido / Fatiga
  if (delta1RM <= -2.0 || deltaWeight < -1.0 || (Math.abs(deltaWeight) < 0.5 && deltaReps <= -2)) {
    const isBW = s0.topWeight === 0;
    return {
      status: 'decreasing',
      label: isBW ? 'Menos Repeticiones' : 'Rendimiento Reducido',
      badgeText: isBW ? `${deltaReps} reps fatiga` : `${pctChange}% de fatiga`,
      colorClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      isWarning: true,
      isProgressing: false,
      delta1RM,
      deltaWeight,
      deltaReps,
      weeksStagnant: 0,
      stagnantSessionsCount: 0,
      pctChange
    };
  }

  // 3. Estancado (Mismo peso / mismas reps en varias sesiones)
  const isBW = s0.topWeight === 0;
  // Limitar weeksStagnant por stagnantSessionsCount para que una pausa de inactividad de 2 semanas no infle falsamente las semanas de estancamiento
  const effectiveWeeks = Math.min(stagnantSessionsCount, weeksStagnant || 1);
  return {
    status: 'stagnant',
    label: isBW ? 'Mismas Reps' : 'Mismo Peso',
    badgeText: isBW
      ? (stagnantSessionsCount > 1 ? `Mismas reps (${stagnantSessionsCount} ses)` : 'Mismas reps')
      : (effectiveWeeks > 1 ? `Mismo peso (${effectiveWeeks} sem)` : 'Mismo peso reciente'),
    colorClass: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
    isWarning: true,
    isProgressing: false,
    delta1RM,
    deltaWeight,
    deltaReps,
    weeksStagnant: effectiveWeeks,
    stagnantSessionsCount: Math.max(2, stagnantSessionsCount),
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
    difficultyFeedback = 'normal',
    allExercises = []
  } = (typeof options === 'object' && options !== null) ? options : {};

  const equipmentType = detectExerciseEquipmentType(exercise, allExercises);
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
  const lastAppliedStrategy = getAppliedCoachStrategy(exercise.name, currentRoutineId, currentRoutineName);
  const followUp = evaluateExerciseFollowUpAndRecovery({
    exerciseName: exercise.name,
    sessions: targetSessions,
    allSessions: sessions,
    routineContext: rCtx,
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

  // Detección de repeticiones y solvencia serie a serie en la sesión previa de ESTA rutina
  const actualPreviousReps = lastSession?.topReps || 0;
  const minRepsInLastSession = lastSession?.minRepsAtTopWeight ?? actualPreviousReps;
  const topWeightSetsInLastSession = lastSession?.topWeightSetsCount ?? (lastSession?.setsCount || 0);
  const expectedWorkingSets = Math.min(plannedSets, lastSession?.setsCount || plannedSets);
  const missedTargetInPrevious = actualPreviousReps > 0 && actualPreviousReps < targetReps;
  const incompleteSetsInPrevious = Boolean(
    lastSession &&
    !missedTargetInPrevious &&
    (minRepsInLastSession < targetReps || (expectedWorkingSets >= 2 && topWeightSetsInLastSession < expectedWorkingSets))
  );
  const hitFailureInPrevious = Boolean(
    lastSession &&
    lastSession.minRirAtTopWeight !== null &&
    lastSession.minRirAtTopWeight <= 0 &&
    minRepsInLastSession <= targetReps
  );

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
  const isBodyweight = currentTopWeight === 0 || equipmentType === 'bodyweight';
  const isCalibratingSession = targetSessions.length === 0;
  const canUseTopSetBackoff = plannedSets >= 3 && !isBodyweight && currentTopWeight >= 15;

  // Incremento realista de gimnasio según material y carga actual (discos parten de 1.25 kg)
  const realisticIncrement = equipmentType === 'barbell' ? 2.5 : (currentTopWeight < 15 ? 1.25 : 2.5);
  const nextWeight = Math.round((currentTopWeight + realisticIncrement) * 10) / 10;

  // Evaluación científica de si el usuario realmente puede asumir el salto de peso hoy:
  // 1) Porcentaje de salto relativo (ej. subir +2.5 kg en barra sobre 20 kg es un +12.5%, un salto exigente que requiere colchón de reps).
  const relativeJumpPct = currentTopWeight > 0
    ? Math.round((realisticIncrement / currentTopWeight) * 1000) / 10
    : 0;
  const isSteepRelativeJump = relativeJumpPct > 8.5;
  // 2) ¿Acaba de subir de peso en la última sesión?
  const justIncreasedWeight = Boolean(
    targetSessions.length >= 2 &&
    (targetSessions[0].topWeight - targetSessions[1].topWeight) >= 0.5
  );
  // 3) ¿Solo lleva 1 sesión en esta rutina?
  const hasOnlyOneSession = targetSessions.length === 1;
  // 4) ¿Tiene colchón de repeticiones por encima del objetivo (ej. +1 rep en todas las series o +2 reps en su mejor serie)?
  const hasRepSurplus = Boolean(
    minRepsInLastSession >= (targetReps + 1) ||
    (actualPreviousReps >= (targetReps + 2) && minRepsInLastSession >= targetReps)
  );
  // 5) ¿Necesita ganar colchón de repeticiones antes de arriesgar un salto de discos?
  const needsStrengthBufferBeforeJump = Boolean(
    !isBodyweight &&
    (isSteepRelativeJump || justIncreasedWeight || hasOnlyOneSession) &&
    !hasRepSurplus
  );
  const isStagnant = trend.status === 'stagnant';
  const stagnantCount = trend.stagnantSessionsCount || 2;
  const isTooSoonToPush = Boolean(followUp?.isTooSoon);
  const isInactive = Boolean(followUp?.isInactive);
  const inactiveDays = followUp?.inactiveDays || 0;
  const isAlreadyAppliedInSession = Boolean(followUp?.isOkGreen && lastAppliedStrategy);
  const jumpLabelText = equipmentType === 'barbell'
    ? `+${realisticIncrement} kg (1.25 kg a cada lado)`
    : `+${realisticIncrement} kg`;

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

  // Textos adaptados al tipo de material (barra, polea, mancuernas, máquina) y al salto exacto (+1.25 kg vs +2.5 kg)
  let coachingEquipmentHint = '';
  let linearDetailMotive = '';
  let linearDetailDescription = '';
  let repsOptionMotive = '';
  let repsOptionDescription = '';
  let plateNote = {
    standardJump: realisticIncrement,
    equipmentType,
    title: `Salto de carga recomendado (+${realisticIncrement} kg)`,
    text: ''
  };

  if (equipmentType === 'barbell') {
    coachingEquipmentHint = 'Al ser un ejercicio con barra, el salto mínimo con discos de 1.25 kg es de +2.5 kg en total (colocando 1.25 kg a cada lado de la barra); si ese salto aún te resulta pesado, progresa sumando repeticiones.';
    linearDetailMotive = `Subir +2.5 kg en total (un disco de 1.25 kg a cada lado de la barra) en todas tus series introduce una tensión mecánica constante, el estímulo principal para forzar nueva síntesis proteica muscular.`;
    linearDetailDescription = `Sube a ${nextWeight} kg en todas tus series de trabajo (+1.25 kg a cada lado de la barra para sumar +2.5 kg totales).`;
    plateNote = {
      standardJump: realisticIncrement,
      equipmentType,
      title: `Saltos de discos en barra (+${realisticIncrement} kg)`,
      text: `Nota sobre barra: Como los discos pequeños parten de 1.25 kg, en barra el salto mínimo simétrico es de +2.5 kg en total (1.25 kg a cada lado). El sistema solo te recomienda dar este salto cuando ve en tu historial que dominas todas tus series con margen; si hoy te pesa demasiado, usa "+1 Repetición".`
    };
    repsOptionMotive = `Si añadir un disco de 1.25 kg a cada lado de la barra (+2.5 kg totales) te resulta todavía pesado, consolidar 1 repetición más con los mismos ${currentTopWeight} kg aumenta el tonelaje efectivo con cero riesgo articular.`;
    repsOptionDescription = `Mantén los ${currentTopWeight} kg y busca 1 repetición adicional (${targetReps + 1} reps) por serie antes de añadir más discos a la barra.`;
  } else if (equipmentType === 'pulley') {
    coachingEquipmentHint = `Al ser un ejercicio en polea, puedes subir +${realisticIncrement} kg usando el selector intermedio o acoplando una micro-pesa en la torre; si tu polea da saltos más grandes entre placas, progresa sumando repeticiones.`;
    linearDetailMotive = `Subir +${realisticIncrement} kg en la polea en todas tus series introduce una tensión mecánica constante, el estímulo principal para forzar nueva síntesis proteica muscular.`;
    linearDetailDescription = `Sube a ${nextWeight} kg en todas tus series de trabajo (+${realisticIncrement} kg en el selector de la polea o con micro-pesa).`;
    repsOptionMotive = `En muchas poleas el salto de una placa a la siguiente es de 2.5 a 5 kg; consolidar 1 repetición más con los mismos ${currentTopWeight} kg aumenta tu fuerza sin forzar un salto brusco de placa.`;
    repsOptionDescription = `Mantén los ${currentTopWeight} kg en la polea y busca 1 repetición adicional (${targetReps + 1} reps) por serie antes de bajar el pin a la siguiente placa.`;
    plateNote = {
      standardJump: realisticIncrement,
      equipmentType,
      title: `Saltos de carga en polea (+${realisticIncrement} kg)`,
      text: `Nota sobre poleas: El incremento ideal sugerido es de +${realisticIncrement} kg en total usando el selector gradual o una micro-pesa acoplable sobre las placas. Si la torre de tu gimnasio salta de 5 en 5 kg y no tiene ajuste intermedio, elige la opción de "+1 Repetición" con tu peso actual.`
    };
  } else if (equipmentType === 'dumbbell') {
    coachingEquipmentHint = `Al trabajar con mancuernas, busca un incremento de +${realisticIncrement} kg pasando a la siguiente mancuerna disponible; si el salto en el rack de tu gimnasio es mayor y te resulta muy pesado, progresa sumando repeticiones.`;
    linearDetailMotive = `Subir +${realisticIncrement} kg con las mancuernas en todas tus series introduce una tensión mecánica constante, el estímulo principal para forzar nueva síntesis proteica muscular.`;
    linearDetailDescription = `Sube a ${nextWeight} kg en todas tus series de trabajo (+${realisticIncrement} kg pasando a la siguiente mancuerna).`;
    repsOptionMotive = `Cuando el salto al siguiente par de mancuernas del gimnasio es demasiado exigente, sumar 1 repetición más con los mismos ${currentTopWeight} kg consolida tu fuerza con total control articular.`;
    repsOptionDescription = `Mantén las mancuernas de ${currentTopWeight} kg y busca 1 repetición adicional (${targetReps + 1} reps) por serie antes de pasar a las siguientes mancuernas.`;
    plateNote = {
      standardJump: realisticIncrement,
      equipmentType,
      title: `Saltos de carga en mancuernas (+${realisticIncrement} kg)`,
      text: `Nota sobre mancuernas: El incremento sugerido es de +${realisticIncrement} kg. Si el rack de mancuernas de tu gimnasio salta de 2 en 2 kg o de 2.5 en 2.5 kg y notas el cambio muy brusco, la opción óptima es elegir "+1 Repetición" con tus mancuernas actuales hasta dominar el peso.`
    };
  } else if (equipmentType === 'machine') {
    coachingEquipmentHint = `Al ser un ejercicio en máquina, sube +${realisticIncrement} kg en total en el selector o soporte de carga; si el salto mínimo de la máquina es mayor, progresa sumando repeticiones.`;
    linearDetailMotive = `Subir +${realisticIncrement} kg en total en la máquina en todas tus series introduce una tensión mecánica constante, el estímulo principal para forzar nueva síntesis proteica muscular.`;
    linearDetailDescription = `Sube a ${nextWeight} kg en todas tus series de trabajo (+${realisticIncrement} kg en total en la máquina).`;
    repsOptionMotive = `Si el salto entre niveles de la máquina es demasiado grande, consolidar 1 repetición más con los mismos ${currentTopWeight} kg aumenta el estímulo muscular sin sobrecargar las articulaciones.`;
    repsOptionDescription = `Mantén los ${currentTopWeight} kg en la máquina y busca 1 repetición adicional (${targetReps + 1} reps) por serie antes de subir la carga.`;
    plateNote = {
      standardJump: realisticIncrement,
      equipmentType,
      title: `Saltos de carga en máquina (+${realisticIncrement} kg)`,
      text: `Nota sobre máquinas: El incremento recomendado es de +${realisticIncrement} kg en total. Si tu máquina es de placas con saltos mayores, utiliza el selector gradual si dispone de él o elige la opción de "+1 Repetición" con tu carga actual.`
    };
  } else if (equipmentType === 'bodyweight' || currentTopWeight === 0) {
    coachingEquipmentHint = 'Al ser un ejercicio de peso corporal (calistenia), la sobrecarga progresiva se logra sumando repeticiones limpias o aumentando el control excéntrico antes de añadir lastre.';
    linearDetailMotive = 'Completar más repeticiones con peso corporal o añadir un lastre ligero (+1.25 a +2.5 kg) estimula la síntesis proteica muscular aumentando la tensión mecánica sin sobrecargar los tendones.';
    linearDetailDescription = `Añade lastre ligero (+${realisticIncrement} kg con cinturón o mancuerna) en tus series de trabajo.`;
    repsOptionMotive = `En ejercicios de peso corporal como ${exercise.name}, consolidar 1 repetición más con técnica limpia es la forma más segura y efectiva de progresar.`;
    repsOptionDescription = `Mantén tu peso corporal y busca 1 repetición adicional (${targetReps + 1} reps) por serie antes de plantearte añadir lastre.`;
    plateNote = {
      standardJump: realisticIncrement,
      equipmentType,
      title: 'Progresión en ejercicios de peso corporal',
      text: 'Nota sobre ejercicios corporales: Progresa primero alcanzando y superando el rango objetivo de repeticiones con técnica estricta. Si superas las 10-12 repeticiones con solvencia, puedes empezar a lastrarte gradualmente (+1.25 a +2.5 kg).'
    };
  } else {
    coachingEquipmentHint = `Te sugerimos un incremento progresivo de +${realisticIncrement} kg en total; si el salto mínimo de tu material es mayor, puedes progresar sumando repeticiones.`;
    linearDetailMotive = `Subir +${realisticIncrement} kg en total en todas tus series introduce una tensión mecánica constante, el estímulo principal para forzar nueva síntesis proteica muscular.`;
    linearDetailDescription = `Sube a ${nextWeight} kg en todas tus series de trabajo (+${realisticIncrement} kg en total sobre tu marca anterior).`;
    repsOptionMotive = `Si el salto mínimo de peso de tu material es demasiado grande, consolidar 1 repetición más con los mismos ${currentTopWeight} kg aumenta el tonelaje efectivo con cero riesgo articular.`;
    repsOptionDescription = `Mantén los ${currentTopWeight} kg y busca 1 repetición adicional (${targetReps + 1} reps) por serie antes de subir de peso.`;
    plateNote = {
      standardJump: realisticIncrement,
      equipmentType,
      title: `Salto de carga recomendado (+${realisticIncrement} kg)`,
      text: `Nota sobre progresión: El incremento recomendado es de +${realisticIncrement} kg en total (no por lado). Si el material que utilizas tiene saltos mínimos mayores, elige la opción de "+1 Repetición" con tu peso actual para progresar con seguridad.`
    };
  }

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
    const isBW = isBodyweight;
    suggestedWeight = isBW ? 0 : (reducedWeight > 0 ? reducedWeight : currentTopWeight);
    suggestedReps = isBW ? safeReducedReps : targetReps;
    suggestedSets = plannedSets;
    actionDirection = 'down';
    intensityLabel = isBW ? 'Ajuste de Repeticiones' : 'Descarga Táctica';
    intensityDesc = isBW ? 'Priorizar técnica y velocidad' : 'Priorizar técnica limpia';
    suggestedRir = '2 reps en recámara';
    suggestedRest = '120 - 150 seg';
    weightChangeNote = isBW ? `${safeReducedReps} reps (peso corporal)` : (reducedWeight > 0 ? `-${diffReducedKg} kg (-10%)` : 'Reducir repeticiones');
    actionTitle = isBW
      ? `Ajuste Táctico: ${safeReducedReps} reps en peso corporal para técnica limpia`
      : 'Descarga Táctica: -10% para clavar repeticiones con técnica limpia';
    coachingAdvice = isBW
      ? `Nos indicas que no llegas a las ${targetReps} repeticiones en peso corporal. Para evitar tirones o trampas con inercia, ajustamos a ${safeReducedReps} repeticiones estrictas en ${activeRoutineName} para consolidar la fuerza base con técnica perfecta.`
      : `Nos indicas que no llegas a las ${targetReps} repeticiones. Para evitar fallos técnicos o sobrecarga articular, lo más óptimo para tu progreso en ${activeRoutineName} es aplicar una ligera descarga y consolidar el rango de repeticiones con técnica limpia.`;
    actionSteps = isBW
      ? [
        `Detén cada serie en ${safeReducedReps} repeticiones en peso corporal con técnica impecable.`,
        'Concéntrate en la velocidad concéntrica y el control en la bajada.',
        'Ajustar repeticiones a tiempo evita lesiones y consolida la base muscular.'
      ]
      : [
        `Baja a ${suggestedWeight} kg para asegurar que completas las ${targetReps} reps con 2 repeticiones de margen antes de fallar.`,
        'Concéntrate en la velocidad concéntrica y el control del movimiento.',
        'Una descarga a tiempo previene semanas de estancamiento por sobreesfuerzo.'
      ];

    if (isBW) {
      strategyOptions = [
        {
          id: 'strat_reduce_reps_cannot_reach',
          title: `🔴 Reducir a ${safeReducedReps} reps en Peso Corporal`,
          tag: 'Recomendada',
          badge: `${safeReducedReps} reps · Corporal`,
          suggestedWeight: 0,
          suggestedReps: safeReducedReps,
          suggestedSets: plannedSets,
          motive: `Recortar a ${safeReducedReps} repeticiones evita el fallo forzado y mantiene el movimiento a máxima velocidad concéntrica y rango completo.`,
          description: `Mantén tu peso corporal pero detén cada serie en ${safeReducedReps} repeticiones limpias, parando 1 o 2 antes del agotamiento.`
        }
      ];
    } else {
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
          motive: `Si prefieres mantener los ${currentTopWeight} kg, recortar a ${safeReducedReps} repeticiones evita el fallo forzado y mantiene el movimiento a máxima velocidad concéntrica.`,
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
    }

  // ------------------------------------------------------------
  // CASO B: EL USUARIO INDICA "ME CUESTA" (🟡 AL LÍMITE / CONSOLIDAR)
  // ------------------------------------------------------------
  } else if (isStruggling) {
    const isBW = isBodyweight;
    suggestedWeight = currentTopWeight;
    suggestedReps = targetReps;
    suggestedSets = plannedSets;
    actionDirection = 'maintain';
    intensityLabel = 'Consolidar Control';
    intensityDesc = 'Parar 1 rep antes del fallo';
    suggestedRir = '1 rep en recámara';
    suggestedRest = '120 - 180 seg';
    weightChangeNote = isBW ? 'Consolidar peso corporal' : `Consolidar ${currentTopWeight} kg`;
    actionTitle = isBW
      ? 'Consolidar Control: Afianza tus repeticiones en peso corporal'
      : `Consolidar Carga: Afianza tus ${currentTopWeight} kg`;
    coachingAdvice = isBW
      ? (actualPreviousReps > 0 && actualPreviousReps < targetReps
        ? `En tu última sesión de ${activeRoutineName} completaste ${actualPreviousReps} de las ${targetReps} repeticiones en peso corporal. Antes de plantearte añadir lastre o más volumen, el objetivo prioritario es afianzar unas sólidas ${targetReps} repeticiones limpias.`
        : `Nos indicas que te cuesta llegar a las ${targetReps} repeticiones en peso corporal. Te recomendamos consolidar las repeticiones manteniendo buena técnica sin impulsos ni balanceos.`)
      : (actualPreviousReps > 0 && actualPreviousReps < targetReps
        ? `En tu última sesión de ${activeRoutineName} completaste ${actualPreviousReps} de las ${targetReps} repeticiones planeadas. Antes de subir kilos o series, el objetivo prioritario para tu musculatura es afianzar unas sólidas ${targetReps} repeticiones con ${currentTopWeight} kg.`
        : `Nos indicas que te cuesta llegar a las ${targetReps} repeticiones. Para no sobrecargar articulaciones ni forzar una serie con mala técnica, te recomendamos afianzar los ${currentTopWeight} kg completando las repeticiones sin subir carga hoy.`);
    actionSteps = isBW
      ? [
        `Mantén tu peso corporal y céntrate en completar las ${targetReps} repeticiones con técnica perfecta y sin balanceos.`,
        'Detén la serie cuando sientas que te queda 1 repetición en reserva antes de fallar.',
        'Si sientes mucha fatiga en las últimas series, descansa 3 minutos completos.'
      ]
      : [
        `Mantén los ${currentTopWeight} kg y céntrate en completar las ${targetReps} repeticiones con técnica perfecta.`,
        'Detén la serie cuando sientas que te queda 1 repetición en reserva antes de fallar.',
        'Si sientes mucha fatiga en las últimas series, descansa 3 minutos completos.'
      ];

    if (isBW) {
      strategyOptions = [
        {
          id: 'strat_consolidate_struggling',
          title: `🟡 Consolidar en Peso Corporal (Buscar ${targetReps} reps)`,
          tag: 'Recomendada',
          badge: `${targetReps} reps · Corporal`,
          suggestedWeight: 0,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: `Afianzar las ${targetReps} repeticiones con peso corporal consolida el control neuromuscular y la estabilidad articular sin riesgo de sobrecarga.`,
          description: `Mantén tu peso corporal y busca clavar las ${targetReps} repeticiones con control total y 1 repetición de margen.`
        },
        {
          id: 'strat_pause_struggling',
          title: `🟡 Pausa en Estiramiento a Reps Reducidas (${pauseReps} reps)`,
          tag: 'Técnica & Tensión',
          badge: `Pausa 2s · ${pauseReps} reps`,
          suggestedWeight: 0,
          suggestedReps: pauseReps,
          suggestedSets: plannedSets,
          motive: `Hacer pausas de 2 segundos en el punto de máximo estiramiento elimina el balanceo o inercia y fortalece el inicio del movimiento. Reducimos a ${pauseReps} reps para que la pausa isométrica sea 100% controlada.`,
          description: `Haz ${pauseReps} reps con peso corporal y pausa 2 segundos abajo con control estricto.`
        }
      ];
    } else {
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
    }

  // ------------------------------------------------------------
  // CASO C: EL USUARIO INDICA "LLEGO BIEN" (🟢 EVALUACIÓN INTELIGENTE DE HISTORIAL)
  // ------------------------------------------------------------
  } else {
    // C0. Estrategia ya aplicada en el entrenamiento activo actual (blindaje contra doble ajuste en la misma rutina)
    if (isAlreadyAppliedInSession && lastAppliedStrategy) {
      const activeWeight = lastAppliedStrategy.suggestedWeight !== undefined && lastAppliedStrategy.suggestedWeight !== null
        ? lastAppliedStrategy.suggestedWeight
        : currentTopWeight;
      const activeReps = lastAppliedStrategy.suggestedReps || targetReps;
      const activeSets = lastAppliedStrategy.suggestedSets || plannedSets;
      const isAppliedBW = activeWeight === 0 || isBodyweight;

      suggestedWeight = activeWeight;
      suggestedReps = activeReps;
      suggestedSets = activeSets;
      actionDirection = 'maintain';
      intensityLabel = 'Estrategia Activa';
      intensityDesc = 'Configuración fijada para la sesión de hoy';
      suggestedRir = lastAppliedStrategy.perSetPlan ? 'Según series' : '1-2 reps en recámara';
      suggestedRest = '120 - 180 seg';
      weightChangeNote = isAppliedBW
        ? 'Peso corporal (activo)'
        : `${activeWeight} kg (activo)`;
      actionTitle = `Estrategia activa para hoy: ${lastAppliedStrategy.strategyTitle}`;
      coachingAdvice = `Ya has aplicado la recomendación del entrenador para esta rutina (${formatTargetText(lastAppliedStrategy)}). Tus series de trabajo ya están configuradas en tu pantalla. Para desbloquear el siguiente ajuste de progresión (subir kilos o repeticiones), primero debes completar este entrenamiento y registrar tus series.`;
      actionSteps = [
        `Tus series de hoy están listas con ${formatTargetText(lastAppliedStrategy)}.`,
        'Concéntrate en completar las repeticiones con técnica limpia y dejando margen antes del fallo.',
        'Al terminar tu rutina, el sistema registrará los datos reales y te habilitará la siguiente progresión para tu próxima sesión.'
      ];

      const currentActiveOption = {
        id: lastAppliedStrategy.strategyId || 'strat_active_current',
        title: `🟢 ${lastAppliedStrategy.strategyTitle}`,
        tag: 'Plan Activo para Hoy',
        badge: isAppliedBW ? `${activeReps} reps · Corporal` : `${activeWeight}kg · Activa`,
        suggestedWeight: activeWeight,
        suggestedReps: activeReps,
        suggestedSets: activeSets,
        perSetPlan: lastAppliedStrategy.perSetPlan || null,
        motive: 'Esta es la pauta que has fijado para tu sesión de hoy. Mantén el foco en completar las series con buena ejecución técnica.',
        description: `Pauta activa para hoy: ${formatTargetText(lastAppliedStrategy)}.`,
        isCurrentActive: true
      };

      const altOptions = [currentActiveOption];

      if (lastAppliedStrategy.perSetPlan) {
        altOptions.push({
          id: 'strat_alt_uniform',
          title: `🟡 Alternativa: Carga Uniforme (${isAppliedBW ? 'Corporal' : `${activeWeight} kg`} en todas las series)`,
          tag: 'Cambiar a carga fija',
          badge: isAppliedBW ? 'Corporal fijo' : `Todas a ${activeWeight}kg`,
          suggestedWeight: activeWeight,
          suggestedReps: activeReps,
          suggestedSets: activeSets,
          motive: 'Si prefieres no hacer series escalonadas (Top Set) hoy, puedes cambiar a realizar todas las series con la misma carga.',
          description: `Todas las series a ${isAppliedBW ? 'peso corporal' : `${activeWeight} kg`} (${activeReps} reps).`,
          isCurrentActive: false
        });
      } else {
        altOptions.push({
          id: 'strat_alt_conservative',
          title: '🟡 Alternativa: Conservar Más Margen (-1 Repetición)',
          tag: 'Más margen técnico',
          badge: isAppliedBW ? `${Math.max(4, activeReps - 1)} reps · Corporal` : `${activeWeight}kg · -1 rep`,
          suggestedWeight: activeWeight,
          suggestedReps: Math.max(4, activeReps - 1),
          suggestedSets: activeSets,
          motive: 'Si notas cansancio acumulado antes de empezar, puedes ajustar el objetivo a 1 repetición menos para asegurar un RIR más seguro.',
          description: `Haz ${Math.max(4, activeReps - 1)} repeticiones con control estricto dejando 2 reps en recámara.`,
          isCurrentActive: false
        });
      }

      strategyOptions = altOptions;

    // C1. Sesión de calibración inicial (sin registros previos en esta rutina)
    } else if (isCalibratingSession) {
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
        `Si notas el peso muy ligero, sube +${realisticIncrement} kg en la siguiente serie; si te cuesta, mantén o baja un poco.`
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

    // C2. No alcanzó las repeticiones objetivo en la última sesión, cayó en las últimas series, llegó al fallo estricto o viene con caída de rendimiento
    } else if (missedTargetInPrevious || trend.status === 'decreasing' || incompleteSetsInPrevious || hitFailureInPrevious) {
      suggestedWeight = currentTopWeight;
      suggestedReps = targetReps;
      suggestedSets = plannedSets;
      actionDirection = 'maintain';
      intensityLabel = 'Consolidar Control';
      intensityDesc = 'Parar 1-2 reps antes de fallar';
      suggestedRir = '1-2 reps en recámara';
      suggestedRest = '120 - 180 seg';
      weightChangeNote = isBodyweight ? 'Peso corporal' : `Consolidar ${currentTopWeight} kg`;

      if (isBodyweight) {
        if (missedTargetInPrevious) {
          actionTitle = `Consolidar peso corporal (lograste ${actualPreviousReps}/${targetReps} reps)`;
          coachingAdvice = `Según los datos recogidos de tu último entrenamiento en ${activeRoutineName}, completaste ${actualPreviousReps} repeticiones en peso corporal (objetivo: ${targetReps} reps). En calistenia, la clave es consolidar el rango completo de movimiento en todas las series antes de buscar añadir repeticiones forzadas o lastre.`;
        } else if (trend.status === 'decreasing') {
          actionTitle = 'Consolidar peso corporal (ajuste por fatiga previa)';
          coachingAdvice = `Según tu historial en ${activeRoutineName}, detectamos una disminución de repeticiones en la última sesión (${trend.badgeText}). Antes de exigir más volumen, hoy toca afianzar tus repeticiones en peso corporal con técnica limpia, sin tirones ni balanceo.`;
        } else if (incompleteSetsInPrevious) {
          actionTitle = `Consolidar todas las series a ${targetReps} reps en peso corporal`;
          coachingAdvice = `En tu última sesión lograste ${actualPreviousReps} reps en tu primera serie, pero en las siguientes caíste hasta ${minRepsInLastSession} repeticiones. Para progresar de verdad en peso corporal necesitas sostener las ${targetReps} repeticiones en todas las ${plannedSets} series.`;
        } else {
          actionTitle = 'Consolidar peso corporal con margen (sin llegar al fallo)';
          coachingAdvice = `En tu último entreno completaste las ${targetReps} reps en peso corporal pero llegando al fallo muscular absoluto. Antes de avanzar, domina las ${targetReps} reps dejando al menos 1 repetición de margen técnico (RIR 1).`;
        }

        actionSteps = [
          `Mantén tu peso corporal buscando completar todas las ${plannedSets} series a ${targetReps} repeticiones estrictas.`,
          'Evita el balanceo (kipping) y realiza una fase excéntrica controlada de 2 segundos.',
          'Descansa entre 2 y 3 minutos entre series para recuperar la potencia muscular.'
        ];

        const consolidateBwOption = {
          id: 'strat_auto_consolidate_normal',
          title: `🟢 Consolidar en Peso Corporal (${plannedSets}×${targetReps} reps sólidas)`,
          tag: 'Recomendada según tu historial',
          badge: `${targetReps} reps · Corporal`,
          suggestedWeight: 0,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: incompleteSetsInPrevious
            ? `En la sesión anterior tus repeticiones cayeron de ${actualPreviousReps} a ${minRepsInLastSession} en las últimas series. Sostener ${targetReps} reps en todas las series es indispensable antes de plantear sobrecarga.`
            : `Afianzar las ${targetReps} repeticiones estrictas en peso corporal garantiza adaptaciones tendinosas y articulares sólidas.`,
          description: `Mantén tu peso corporal hoy para completar todas las series de ${targetReps} repeticiones con control.`
        };

        const repsBwOption = {
          id: 'strat_reps_normal',
          title: `🟢 Buscar +1 Rep en 1ª Serie (${targetReps + 1} reps en peso corporal)`,
          tag: 'Progresión Suave',
          badge: `+1 rep · Corporal`,
          suggestedWeight: 0,
          suggestedReps: targetReps + 1,
          suggestedSets: plannedSets,
          motive: `Si hoy llegas con energía fresca, intentar 1 repetición extra en la primera serie te permite testear si tu adaptación neuromuscular ya se ha completado.`,
          description: `Intenta sacar ${targetReps + 1} reps en la 1ª serie y mantén ${targetReps} reps en el resto.`
        };

        strategyOptions = [consolidateBwOption, repsBwOption];
      } else {
        if (missedTargetInPrevious) {
          actionTitle = `Consolidar ${currentTopWeight} kg (lograste ${actualPreviousReps}/${targetReps} reps)`;
          coachingAdvice = `Según los datos recogidos de tu último entrenamiento en ${activeRoutineName}, registraste ${actualPreviousReps} repeticiones con ${currentTopWeight} kg (objetivo: ${targetReps} reps). No te recomendamos subir ${jumpLabelText} todavía: primero consolida los ${currentTopWeight} kg hasta clavar las ${targetReps} repeticiones.`;
        } else if (trend.status === 'decreasing') {
          actionTitle = `Consolidar ${currentTopWeight} kg (ajuste por fatiga previa)`;
          coachingAdvice = `Según el historial de tus entrenamientos en ${activeRoutineName}, detectamos una caída de rendimiento en la última sesión. Antes de pensar en subir ${jumpLabelText}, hoy toca afianzar los ${currentTopWeight} kg con técnica limpia.`;
        } else if (incompleteSetsInPrevious) {
          actionTitle = `Consolidar todas las series a ${targetReps} reps con ${currentTopWeight} kg`;
          coachingAdvice = `En tu última sesión lograste ${actualPreviousReps} reps en tu mejor serie con ${currentTopWeight} kg, pero en el resto de series caíste hasta ${minRepsInLastSession} repeticiones. Subir ${jumpLabelText} ahora sería precipitado; primero completa todas las ${plannedSets} series clavando las ${targetReps} repeticiones.`;
        } else {
          actionTitle = `Consolidar ${currentTopWeight} kg con margen (sin llegar al fallo)`;
          coachingAdvice = `En tu último entreno completaste las ${targetReps} reps con ${currentTopWeight} kg pero llegando al límite (0 reps en recámara). Antes de subir ${jumpLabelText}, domina los ${currentTopWeight} kg dejando 1-2 repeticiones de margen.`;
        }

        actionSteps = [
          `Mantén ${currentTopWeight} kg buscando completar todas las ${plannedSets} series a ${targetReps} repeticiones limpias.`,
          'Cuando completes todas las series sin caer de repeticiones ni llegar al fallo forzado, el sistema te habilitará la subida de peso.',
          'Descansa entre 2 y 3 minutos entre series.'
        ];

        const consolidateAutoOption = {
          id: 'strat_auto_consolidate_normal',
          title: `🟢 Consolidar ${currentTopWeight} kg (${plannedSets}×${targetReps} reps sólidas)`,
          tag: 'Recomendada según tu historial',
          badge: `Mantener ${currentTopWeight}kg`,
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: incompleteSetsInPrevious
            ? `En la sesión anterior tus repeticiones cayeron de ${actualPreviousReps} a ${minRepsInLastSession} en las últimas series. Completar todas las series a ${targetReps} reps con ${currentTopWeight} kg es indispensable antes de añadir discos.`
            : `Afianzar el rango de ${targetReps} repeticiones con ${currentTopWeight} kg antes de subir carga garantiza progreso real sin sobrecarga articular.`,
          description: `Mantén los ${currentTopWeight} kg hoy para completar todas las series de ${targetReps} repeticiones con solvencia.`
        };

        const repsOption = {
          id: 'strat_reps_normal',
          title: `🟢 Buscar +1 Repetición (${targetReps + 1} reps con ${currentTopWeight} kg)`,
          tag: 'Progresión Suave',
          badge: `+1 rep con ${currentTopWeight}kg`,
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps + 1,
          suggestedSets: plannedSets,
          motive: repsOptionMotive,
          description: repsOptionDescription
        };

        const linearOption = {
          id: 'strat_linear_normal',
          title: `🟢 Sobrecarga Lineal (+${realisticIncrement} kg a ${nextWeight} kg)`,
          tag: 'Solo si vas muy sobrado',
          badge: `Todas a ${nextWeight}kg`,
          suggestedWeight: nextWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: `Opción disponible solo si hoy te sientes excepcionalmente fuerte y con margen para subir ${jumpLabelText}.`,
          description: linearDetailDescription
        };

        strategyOptions = [consolidateAutoOption, repsOption, linearOption];
      }

    // C2_B. Inactividad prolongada (10+ días o semanas sin hacer esta rutina): readaptación y reactivación segura
    } else if (isInactive) {
      const isSevere = inactiveDays >= 28;
      const lightReactivationWeight = isBodyweight ? 0 : roundToWeightStep(currentTopWeight * (isSevere ? 0.85 : 0.9));

      suggestedWeight = isSevere ? lightReactivationWeight : currentTopWeight;
      suggestedReps = targetReps;
      suggestedSets = plannedSets;
      actionDirection = 'maintain';
      intensityLabel = isSevere ? 'Re-adaptación Progresiva' : 'Reactivación Muscular';
      intensityDesc = 'Parar 2-3 reps antes del fallo (RIR 2-3)';
      suggestedRir = '2 - 3 reps en recámara';
      suggestedRest = '120 - 180 seg';
      weightChangeNote = isBodyweight
        ? 'Peso corporal (reactivación)'
        : (isSevere
          ? `${lightReactivationWeight} kg (toma de contacto)`
          : `Mantener ${currentTopWeight} kg (reactivación)`);
      actionTitle = isBodyweight
        ? (isSevere
          ? 'Re-adaptación: Peso corporal con margen tras más de 1 mes'
          : `Reactivación: Peso corporal tras ${followUp?.timeAgoText || `${inactiveDays} días`}`)
        : (isSevere
          ? `Re-adaptación: Carga ligera tras más de 1 mes (${suggestedWeight} kg)`
          : `Reactivación: Carga de control tras ${followUp?.timeAgoText || `${inactiveDays} días`}`);

      // ATENCIÓN: NUNCA duplicar followUp?.message aquí.
      // followUp.message ya se muestra en la tarjeta superior de inactividad de la rutina.
      // coachingAdvice debe aportar la referencia de rendimiento del ejercicio concreto:
      if (isBodyweight) {
        coachingAdvice = `En tu última sesión registrada de este ejercicio completaste ${actualPreviousReps || targetReps} repeticiones con peso corporal. Tras ${followUp?.timeAgoText || `${inactiveDays} días`} de pausa, tu tejido conectivo y fuerza neuromuscular necesitan reconectar con el patrón de movimiento. El plan de hoy es completar tus series en peso corporal parando 2 o 3 repeticiones antes de llegar al fallo (RIR 2-3), priorizando un rango de recorrido estricto para reanudar el estímulo sin provocar agujetas extremas.`;
      } else {
        coachingAdvice = `En tu última sesión de este ejercicio levantaste ${currentTopWeight} kg (${actualPreviousReps || targetReps} reps). Tras ${followUp?.timeAgoText || `${inactiveDays} días`} de pausa, el objetivo hoy no es batir marcas ni subir kilos, sino reactivar los husos neuromusculares y lubricar articulaciones con ${suggestedWeight} kg manteniendo 2-3 repeticiones de margen antes de fallar (RIR 2-3).`;
      }

      actionSteps = isBodyweight ? [
        `Usa tu peso corporal en tus series de hoy para evaluar cómo responde tu musculatura tras ${followUp?.timeAgoText || `${inactiveDays} días`}.`,
        'Detén cada serie con al menos 2 o 3 repeticiones en recámara (sin llegar al fallo muscular).',
        'En tu próxima sesión, una vez reactivado el patrón motor, el entrenador te guiará para volver a progresar en repeticiones.'
      ] : [
        `Usa ${suggestedWeight} kg en tus series de hoy para evaluar cómo responde tu musculatura tras ${followUp?.timeAgoText || `${inactiveDays} días`}.`,
        'Detén cada serie con al menos 2 o 3 repeticiones en recámara (sin llegar al fallo muscular).',
        'En tu próxima sesión, una vez reactivado el patrón motor, el entrenador te habilitará volver a subir cargas.'
      ];

      if (isBodyweight) {
        strategyOptions = [
          {
            id: 'strat_reactivation_safe',
            title: `🟢 Sesión de Reactivación en Peso Corporal (${targetReps} reps con RIR 2-3)`,
            tag: 'Recomendada (Vuelta al entreno)',
            badge: 'Corporal · RIR 2-3',
            suggestedWeight: 0,
            suggestedReps: targetReps,
            suggestedSets: plannedSets,
            motive: `Tras ${followUp?.timeAgoText || `${inactiveDays} días`} sin realizar este ejercicio, tus fibras musculares necesitan reactivarse con peso corporal sin provocar sobrecarga ni agujetas invalidantes.`,
            description: 'Realiza tus series en peso corporal parando 2 o 3 repeticiones antes de no poder subir más.'
          },
          {
            id: 'strat_reactivation_tempo',
            title: '🟡 Tempo Controlado en Peso Corporal (Bajada en 3 seg)',
            tag: 'Protección Tendinosa',
            badge: 'Tempo 3s · Corporal',
            suggestedWeight: 0,
            suggestedReps: Math.max(4, targetReps - 2),
            suggestedSets: plannedSets,
            motive: 'Una bajada de 3 segundos en peso corporal reactiva los mecanorreceptores musculares y fortalece tendones sin necesidad de hacer repeticiones al límite.',
            description: `Haz ${Math.max(4, targetReps - 2)} reps por serie con 3 segundos de bajada controlada y sin balanceo.`
          }
        ];
      } else {
        strategyOptions = [
          {
            id: 'strat_reactivation_safe',
            title: `🟢 Sesión de Reactivación (${suggestedWeight} kg × ${targetReps} reps con RIR 2-3)`,
            tag: 'Recomendada (Vuelta al entreno)',
            badge: `${suggestedWeight} kg · RIR 2-3`,
            suggestedWeight: suggestedWeight,
            suggestedReps: targetReps,
            suggestedSets: plannedSets,
            motive: `Tras ${followUp?.timeAgoText || `${inactiveDays} días`} de inactividad, tus fibras musculares necesitan volver a familiarizarse con la tensión sin generar agujetas extremas ni sobrecargar los tendones.`,
            description: `Realiza tus series con ${suggestedWeight} kg dejando 2 o 3 repeticiones de margen antes del fallo.`
          },
          {
            id: 'strat_reactivation_conservative',
            title: `🟡 Toma de Contacto Más Ligera (${lightReactivationWeight} kg, -10%)`,
            tag: 'Más Margen',
            badge: `${lightReactivationWeight} kg (-10%)`,
            suggestedWeight: lightReactivationWeight,
            suggestedReps: targetReps,
            suggestedSets: plannedSets,
            motive: 'Empezar un 10% por debajo de tu marca previa te asegura una sesión fluida, reactiva la memoria muscular y previene cualquier molestia articular.',
            description: `Comienza con ${lightReactivationWeight} kg con bajada controlada y máxima concentración técnica.`
          }
        ];

        if (!isSevere && currentTopWeight > 0) {
          strategyOptions.push({
            id: 'strat_reactivation_test',
            title: `🟢 Tantear Carga Previa (${currentTopWeight} kg solo si te notas al 100%)`,
            tag: 'Solo si vas sobrado',
            badge: `${currentTopWeight} kg`,
            suggestedWeight: currentTopWeight,
            suggestedReps: targetReps,
            suggestedSets: plannedSets,
            motive: 'Opción disponible si durante el calentamiento te has notado con fuerza y energía plena, manteniendo siempre 1-2 reps en recámara.',
            description: `Haz tu 1ª serie con ${currentTopWeight} kg; si notas pesadez o falta de ritmo, baja a ${lightReactivationWeight} kg.`
          });
        }
      }

    // C3. Entrenado hace menos de 36h (descanso incompleto): no recomendar subir discos sin haber supercompensado
    } else if (isTooSoonToPush) {
      suggestedWeight = currentTopWeight;
      suggestedReps = targetReps;
      suggestedSets = plannedSets;
      actionDirection = 'maintain';
      intensityLabel = 'Recuperación Activa';
      intensityDesc = 'Sin forzar subida de peso hoy';
      suggestedRir = '2 reps en recámara';
      suggestedRest = '120 - 150 seg';
      weightChangeNote = isBodyweight ? 'Peso corporal' : `Mantener ${currentTopWeight} kg`;
      actionTitle = isBodyweight
        ? 'Mantener peso corporal (descanso menor a 48h)'
        : `Mantener ${currentTopWeight} kg (descanso menor a 48h)`;
      coachingAdvice = isBodyweight
        ? `Entrenaste este ejercicio ${followUp?.timeAgoText || 'hace muy poco'}. Aunque cumpliste tus repeticiones en la última sesión, tu musculatura dorsal y sistema nervioso aún están recuperándose (requieren 48-72h). No fuerces hoy repeticiones al límite ni intentes añadir lastre: mantén tus series en peso corporal con técnica limpia y 2 reps de margen.`
        : `Entrenaste este ejercicio ${followUp?.timeAgoText || 'hace muy poco'}. Aunque cumpliste tus repeticiones en la última sesión, tu musculatura y sistema nervioso aún están recuperándose (requieren 48-72h). No te recomendamos subir ${jumpLabelText} hoy: mantén ${currentTopWeight} kg con buena técnica.`;
      actionSteps = isBodyweight ? [
        'Mantén tu peso corporal hoy para no interferir con la recuperación muscular.',
        'Deja al menos 2 repeticiones en recámara sin llegar al fallo.',
        'En tu próxima sesión tras descansar 48-72h podrás atacar la subida de repeticiones.'
      ] : [
        `Mantén los ${currentTopWeight} kg hoy para no interferir con la recuperación muscular.`,
        'Deja al menos 2 repeticiones en recámara sin llegar al fallo.',
        `En tu próxima sesión tras descansar 48-72h podrás atacar el salto a ${nextWeight} kg.`
      ];

      if (isBodyweight) {
        strategyOptions = [
          {
            id: 'strat_recovery_maintain',
            title: `🟢 Mantener Carga de Control (Peso corporal × ${targetReps} reps)`,
            tag: 'Recomendada (En recuperación)',
            badge: 'Corporal · RIR 2',
            suggestedWeight: 0,
            suggestedReps: targetReps,
            suggestedSets: plannedSets,
            motive: 'Con menos de 48h de descanso la supercompensación no ha terminado. Mantener peso corporal con margen protege tus tendones.',
            description: 'Realiza tus series en peso corporal buscando fluidez y control sin llegar al límite.'
          },
          {
            id: 'strat_reps_normal',
            title: `🟢 Sumar +1 Repetición (${targetReps + 1} reps en peso corporal)`,
            tag: 'Solo si vas muy fresco',
            badge: '+1 rep · Corporal',
            suggestedWeight: 0,
            suggestedReps: targetReps + 1,
            suggestedSets: plannedSets,
            motive: 'Si a pesar del descanso breve te sientes en tu mejor estado físico, puedes probar a sacar 1 repetición extra en tu primera serie.',
            description: `Busca ${targetReps + 1} reps en la 1ª serie y mantén ${targetReps} en las siguientes.`
          }
        ];
      } else {
        strategyOptions = [
          {
            id: 'strat_recovery_maintain',
            title: `🟢 Mantener Carga de Control (${currentTopWeight} kg × ${targetReps} reps)`,
            tag: 'Recomendada (En recuperación)',
            badge: `Mantener ${currentTopWeight}kg`,
            suggestedWeight: currentTopWeight,
            suggestedReps: targetReps,
            suggestedSets: plannedSets,
            motive: `Con menos de 48h de descanso la supercompensación no ha terminado. Mantener ${currentTopWeight} kg protege tus tendones y evita pinchar con un peso nuevo.`,
            description: `Realiza tus series con ${currentTopWeight} kg buscando fluidez y control.`
          },
          {
            id: 'strat_reps_normal',
            title: `🟢 Sumar +1 Repetición (${targetReps + 1} reps con ${currentTopWeight} kg)`,
            tag: 'Alternativa sin subir kilos',
            badge: `+1 rep con ${currentTopWeight}kg`,
            suggestedWeight: currentTopWeight,
            suggestedReps: targetReps + 1,
            suggestedSets: plannedSets,
            motive: repsOptionMotive,
            description: repsOptionDescription
          }
        ];
      }

    // C4. Estancamiento detectado (2+ sesiones repitiendo mismo peso y mismas reps): NO mandar subir peso a lo loco, primero desbloquear
    } else if (isStagnant) {
      if (isBodyweight) {
        suggestedWeight = 0;
        suggestedReps = targetReps + 1;
        suggestedSets = plannedSets;
        actionDirection = 'maintain';
        intensityLabel = 'Desbloqueo Progresivo';
        intensityDesc = 'Romper meseta de repeticiones';
        suggestedRir = '1 rep en recámara';
        suggestedRest = '120 - 180 seg';
        weightChangeNote = '+1 rep en corporal';
        actionTitle = `Meseta en peso corporal: Desbloquea buscando ${targetReps + 1} reps`;
        coachingAdvice = `Llevas ${stagnantCount} sesiones consecutivas completando ${actualPreviousReps || targetReps} repeticiones con peso corporal en ${activeRoutineName}. En ejercicios de calistenia, la meseta ocurre porque el sistema nervioso se habitúa al umbral de repeticiones habitual y deja de reclutar nuevas unidades motoras. Para desbloquear el progreso en ganancia muscular, aplicamos la Doble Progresión: tu meta hoy es arrancar 1 repetición más (${targetReps + 1} reps) en tu primera serie o aumentar el tiempo bajo tensión con bajada excéntrica controlada.`;
        actionSteps = [
          `Mantén tu peso corporal y da el 100% de enfoque en tu primera serie para alcanzar las ${targetReps + 1} repeticiones.`,
          'En la fase de bajada cuenta 2-3 segundos de descenso controlado para activar más fibras musculares.',
          'Descansa entre 2.5 y 3 minutos completos para restaurar los niveles de ATP en los músculos dorsales.'
        ];

        const unlockBwRepsOption = {
          id: 'strat_reps_normal',
          title: `🟢 Desbloqueo por Doble Progresión (+1 Rep a ${targetReps + 1} reps)`,
          tag: 'Recomendada (Romper Meseta)',
          badge: `${targetReps + 1} reps · Corporal`,
          suggestedWeight: 0,
          suggestedReps: targetReps + 1,
          suggestedSets: plannedSets,
          motive: `Al llevar ${stagnantCount} sesiones clavado en ${actualPreviousReps || targetReps} reps en peso corporal, añadir 1 sola repetición extra rompe la habituación neuromuscular y reactiva la señal de hipertrofia.`,
          description: `Mantén tu peso corporal y concéntrate en sacar ${targetReps + 1} repeticiones limpias en tu primera serie.`
        };

        const eccentricBwOption = {
          id: 'strat_eccentric_bw',
          title: '🟡 Sobrecarga por Tempo Excéntrico (3s de bajada)',
          tag: 'Mayor Tensión Mecánica',
          badge: 'Tempo 3s · Corporal',
          suggestedWeight: 0,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: 'Frenar la fase excéntrica durante 3 segundos completos aumenta el tiempo bajo tensión y el estímulo hipertrófico sin necesidad de discos ni lastre.',
          description: `Haz ${targetReps} reps con peso corporal bajando en 3 segundos estrictos en cada repetición.`
        };

        const lastreBwOption = {
          id: 'strat_lastre_bw',
          title: '🟢 Iniciar Sobrecarga con Lastre (+2.5 kg)',
          tag: 'Paso a Calistenia Lastrada',
          badge: '+2.5 kg lastre',
          suggestedWeight: 2.5,
          suggestedReps: Math.max(5, targetReps - 2),
          suggestedSets: plannedSets,
          motive: 'Si ya dominas las repeticiones en peso corporal y buscas romper la meseta por la vía de carga, añadir un micro-lastre de +2.5 kg despierta el reclutamiento de fibras de alta potencia.',
          description: `Usa cinturón de lastre o mancuerna con 2.5 kg buscando ${Math.max(5, targetReps - 2)} reps estrictas.`
        };

        strategyOptions = [unlockBwRepsOption, eccentricBwOption, lastreBwOption];
      } else {
        suggestedWeight = currentTopWeight;
        suggestedReps = targetReps + 1;
        suggestedSets = plannedSets;
        actionDirection = 'maintain';
        intensityLabel = 'Desbloqueo Progresivo';
        intensityDesc = 'Romper meseta antes de subir kilos';
        suggestedRir = '1 rep en recámara';
        suggestedRest = '120 - 180 seg';
        weightChangeNote = `+1 rep (${currentTopWeight} kg)`;
        actionTitle = `Desbloqueo: Busca ${targetReps + 1} reps con ${currentTopWeight} kg antes de subir peso`;
        coachingAdvice = `Llevas ${stagnantCount} sesiones seguidas repitiendo ${currentTopWeight} kg × ${actualPreviousReps} reps en ${activeRoutineName} sin lograr subir marcas. Si te recomendásemos meter ${jumpLabelText} ahora mismo a lo loco, perderías repeticiones y técnica. La forma inteligente de romper el estancamiento es sacar primero +1 repetición (${targetReps + 1} reps) con ${currentTopWeight} kg${canUseTopSetBackoff ? ` o tantear ${nextWeight} kg únicamente en la 1ª serie (Top Set)` : ''}.`;
        actionSteps = [
          `Mantén ${currentTopWeight} kg y concéntrate en arrancar 1 repetición más (${targetReps + 1} reps) que en tus sesiones anteriores.`,
          'Descansa 2-3 minutos completos entre series para disipar la fatiga neural.',
          `En cuanto rompas la barrera de repeticiones, el sistema te dará luz verde para subir a ${nextWeight} kg.`
        ];

        const unlockRepsOption = {
          id: 'strat_reps_normal',
          title: `🟢 Desbloqueo por Doble Progresión (+1 Rep a ${targetReps + 1} reps)`,
          tag: 'Recomendada (Romper Estancamiento)',
          badge: `${targetReps + 1} reps con ${currentTopWeight}kg`,
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps + 1,
          suggestedSets: plannedSets,
          motive: `Al llevar ${stagnantCount} sesiones clavado en ${currentTopWeight} kg × ${actualPreviousReps} reps, sumar 1 repetición rompe la adaptación neuromuscular sin el bloqueo que supondría añadir ${jumpLabelText} en todas las series.`,
          description: repsOptionDescription
        };

        strategyOptions = [unlockRepsOption];

        if (canUseTopSetBackoff) {
          const progTopReps = Math.max(5, targetReps - 2);
          strategyOptions.push({
            id: 'strat_topset_normal',
            title: '🟢 Top Set de Desbloqueo + Back-off',
            tag: 'Estímulo Neural',
            badge: `1ª ${nextWeight}kg · Resto ${currentTopWeight}kg`,
            suggestedWeight: nextWeight,
            suggestedReps: progTopReps,
            suggestedSets: plannedSets,
            perSetPlan: generateTopSetBackoffPlan(plannedSets, nextWeight, progTopReps, currentTopWeight, targetReps),
            motive: `En vez de subir a ${nextWeight} kg en todas las series, tocas ese peso solo en la 1ª serie a ${progTopReps} reps para despertar al sistema nervioso y vuelves a ${currentTopWeight} kg en el resto.`,
            description: `1ª serie a ${nextWeight} kg (${progTopReps} reps) y series 2-${plannedSets} a ${currentTopWeight} kg (${targetReps} reps).`
          });
        }

        if (stagnantCount >= 3 && reducedWeight > 0) {
          strategyOptions.push({
            id: 'strat_deload_stagnant',
            title: `🟡 Descarga de Supercompensación (-10% a ${reducedWeight} kg)`,
            tag: 'Llevas 3+ sesiones igual',
            badge: `Todas a ${reducedWeight}kg`,
            suggestedWeight: reducedWeight,
            suggestedReps: targetReps,
            suggestedSets: plannedSets,
            motive: `Cuando llevas ${stagnantCount} sesiones bloqueado en el mismo peso, a menudo hay fatiga acumulada invisible. Bajar una sesión a ${reducedWeight} kg permite rebotar con más fuerza la semana siguiente.`,
            description: `Baja hoy a ${reducedWeight} kg con velocidad explosiva para recargar articulaciones y sistema nervioso.`
          });
        }

        strategyOptions.push({
          id: 'strat_linear_normal',
          title: `🟢 Sobrecarga Lineal (+${realisticIncrement} kg a ${nextWeight} kg)`,
          tag: 'Solo si hoy te ves muy fuerte',
          badge: `Todas a ${nextWeight}kg`,
          suggestedWeight: nextWeight,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: linearDetailMotive,
          description: linearDetailDescription
        });
      }

    // C5. Necesita ganar colchón de fuerza antes de dar el salto de discos (salto porcentual grande >8.5%, acaba de subir peso la sesión pasada o solo lleva 1 sesión)
    } else if (needsStrengthBufferBeforeJump) {
      suggestedWeight = currentTopWeight;
      suggestedReps = targetReps + 1;
      suggestedSets = plannedSets;
      actionDirection = 'maintain';
      intensityLabel = 'Ganar Colchón (+1 Rep)';
      intensityDesc = 'Preparar el salto de discos con seguridad';
      suggestedRir = '1-2 reps en recámara';
      suggestedRest = '120 - 150 seg';
      weightChangeNote = `+1 rep (${currentTopWeight} kg)`;
      actionTitle = `Prepara el salto: Busca ${targetReps + 1} reps con ${currentTopWeight} kg`;

      if (isSteepRelativeJump) {
        coachingAdvice = `¡Buen trabajo completando las ${targetReps} reps con ${currentTopWeight} kg! Sin embargo, subir ${jumpLabelText} desde ${currentTopWeight} kg supone un salto fuerte del +${Math.round(relativeJumpPct)}% de peso de golpe. Para no fallar ni perder técnica al meter discos, haz primero ${targetReps + 1} repeticiones con ${currentTopWeight} kg hoy; cuando tengas ese colchón de fuerza, te recomendaremos subir a ${nextWeight} kg.`;
      } else if (justIncreasedWeight) {
        coachingAdvice = `En tu último entrenamiento de ${activeRoutineName} ya subiste de peso hasta ${currentTopWeight} kg y cumpliste las ${targetReps} reps. Antes de encadenar otro salto de ${jumpLabelText} seguido, asienta este peso buscando ${targetReps + 1} repeticiones hoy para que tus tendones y músculos consoliden la carga.`;
      } else {
        coachingAdvice = `Solo llevas 1 sesión registrada con ${currentTopWeight} kg en ${activeRoutineName}. Antes de mandarte subir ${jumpLabelText} en tu segunda sesión, confirma que dominas el peso sacando ${targetReps + 1} repeticiones limpias en todas tus series.`;
      }

      actionSteps = [
        `Mantén ${currentTopWeight} kg y busca alcanzar ${targetReps + 1} repeticiones en todas tus series de trabajo.`,
        `Conseguir +1 o +2 repeticiones extra te dará el colchón de fuerza exacto para poder mover ${nextWeight} kg en la próxima sesión.`,
        'Mantén la técnica estricta sin acortar el recorrido.'
      ];

      const bufferRepsOption = {
        id: 'strat_reps_normal',
        title: `🟢 Ganar Colchón de Fuerza (+1 Rep a ${targetReps + 1} reps con ${currentTopWeight} kg)`,
        tag: 'Recomendada (Paso Previo Seguro)',
        badge: `${targetReps + 1} reps con ${currentTopWeight}kg`,
        suggestedWeight: currentTopWeight,
        suggestedReps: targetReps + 1,
        suggestedSets: plannedSets,
        motive: isSteepRelativeJump
          ? `Pasar de ${currentTopWeight} kg a ${nextWeight} kg es un incremento del +${Math.round(relativeJumpPct)}%. Ganar 1 repetición extra hoy asegura que tu musculatura pueda con el nuevo peso sin venirse abajo.`
          : `Consolidar ${targetReps + 1} repeticiones con ${currentTopWeight} kg demuestra dominio total antes de añadir ${jumpLabelText}.`,
        description: repsOptionDescription
      };

      strategyOptions = [bufferRepsOption];

      if (canUseTopSetBackoff) {
        const progTopReps = Math.max(5, targetReps - 2);
        strategyOptions.push({
          id: 'strat_topset_normal',
          title: `🟢 Top Set + Back-off (Probar ${nextWeight} kg solo en la 1ª serie)`,
          tag: 'Transición Gradual',
          badge: `1ª ${nextWeight}kg · Resto ${currentTopWeight}kg`,
          suggestedWeight: nextWeight,
          suggestedReps: progTopReps,
          suggestedSets: plannedSets,
          perSetPlan: generateTopSetBackoffPlan(plannedSets, nextWeight, progTopReps, currentTopWeight, targetReps),
          motive: `Si quieres tantear los ${nextWeight} kg sin arriesgarte a fallar en el resto del entrenamiento, úsalos solo en la 1ª serie y vuelve a ${currentTopWeight} kg en las demás.`,
          description: `1ª serie a ${nextWeight} kg (${progTopReps} reps) y series 2-${plannedSets} a ${currentTopWeight} kg (${targetReps} reps).`
        });
      }

      strategyOptions.push({
        id: 'strat_linear_normal',
        title: `🟢 Sobrecarga Lineal (+${realisticIncrement} kg a ${nextWeight} kg)`,
        tag: 'Subir Carga Ya',
        badge: `Todas a ${nextWeight}kg`,
        suggestedWeight: nextWeight,
        suggestedReps: targetReps,
        suggestedSets: plannedSets,
        motive: linearDetailMotive,
        description: linearDetailDescription
      });

    // C6. ¡PREPARADO DE VERDAD SEGÚN SU HISTORIAL! (Domina todas las series, sin estancamiento, descansado y con colchón de fuerza suficiente)
    } else {
      if (isBodyweight) {
        suggestedWeight = 0;
        suggestedReps = targetReps + 1;
        suggestedSets = plannedSets;
        actionDirection = 'up';
        intensityLabel = 'Sobrecarga en Repeticiones';
        intensityDesc = 'Buscar +1 rep con técnica estricta';
        suggestedRir = '1 rep en recámara';
        suggestedRest = '120 - 180 seg';
        weightChangeNote = '+1 rep (peso corporal)';
        actionTitle = 'Sobrecarga Progresiva: Supera tus marcas (+1 rep o iniciar lastre)';
        coachingAdvice = `Tu historial en ${activeRoutineName} confirma un dominio excelente de las ${targetReps} reps con peso corporal. En calistenia, la sobrecarga progresiva se logra sumando repeticiones limpias (Doble Progresión) o iniciando un lastre ligero (+2.5 kg) para mantener el estímulo de hipertrofia.`;
        actionSteps = [
          `Concéntrate en sacar ${targetReps + 1} repeticiones limpias en tu primera serie de trabajo.`,
          'Mantén la técnica estricta: barbilla arriba de la barra y bajada controlada sin usar inercia.',
          'Si completas más de 10-12 reps con solvencia, tu musculatura está lista para la opción de añadir lastre (+2.5 kg).'
        ];

        const bwPlusRepOption = {
          id: 'strat_reps_normal',
          title: `🟢 Doble Progresión: Sumar +1 Repetición (${targetReps + 1} reps)`,
          tag: 'Recomendada',
          badge: `${targetReps + 1} reps · Corporal`,
          suggestedWeight: 0,
          suggestedReps: targetReps + 1,
          suggestedSets: plannedSets,
          motive: 'Sumar 1 repetición más en peso corporal eleva el volumen total de entrenamiento sin comprometer articulaciones ni sobrecargar el sistema conectivo.',
          description: `Mantén tu peso corporal y busca alcanzar las ${targetReps + 1} repeticiones en tus series de hoy.`
        };

        const bwLastreOption = {
          id: 'strat_lastre_normal',
          title: '🟢 Iniciar Sobrecarga con Lastre (+2.5 kg)',
          tag: 'Mayor Tensión Mecánica',
          badge: '+2.5 kg lastre',
          suggestedWeight: 2.5,
          suggestedReps: Math.max(5, targetReps - 2),
          suggestedSets: plannedSets,
          motive: 'Si te sientes con energía máxima, pasar a calistenia lastrada con un micro-lastre de +2.5 kg acelera la hipertrofia dorsal.',
          description: `Añade un cinturón con 2.5 kg y realiza ${Math.max(5, targetReps - 2)} reps con técnica impecable.`
        };

        const bwTempoOption = {
          id: 'strat_pause_normal',
          title: '🟡 Pausa en Contracción Máxima (2s arriba)',
          tag: 'Calidad Técnica',
          badge: 'Pausa 2s · Corporal',
          suggestedWeight: 0,
          suggestedReps: targetReps,
          suggestedSets: plannedSets,
          motive: 'Hacer una pausa isométrica de 2 segundos en el punto de máxima contracción maximiza el reclutamiento del dorsal ancho.',
          description: `Haz ${targetReps} reps en peso corporal aguantando 2 segundos arriba en cada repetición.`
        };

        strategyOptions = [bwPlusRepOption, bwLastreOption, bwTempoOption];
      } else {
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
        coachingAdvice = `Tu historial en ${activeRoutineName} confirma que estás listo para subir de peso: completaste todas tus series con ${currentTopWeight} kg (llegando a ${actualPreviousReps} reps con solvencia y sin estancamiento). ${coachingEquipmentHint}`;
        actionSteps = [
          `Trabaja con ${nextWeight} kg (${jumpLabelText}) buscando mantener una técnica estricta.`,
          `Si notas el salto de peso exigente en las últimas series, mantén el rango de ${Math.max(6, targetReps - 2)}-${targetReps} reps parando 1-2 antes del fallo.`,
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
          motive: linearDetailMotive,
          description: linearDetailDescription
        };

        const repsOption = {
          id: 'strat_reps_normal',
          title: '🟢 Consolidar Carga (+1 Repetición)',
          tag: 'Alternativa Suave',
          badge: `+1 rep con ${currentTopWeight}kg`,
          suggestedWeight: currentTopWeight,
          suggestedReps: targetReps + 1,
          suggestedSets: plannedSets,
          motive: repsOptionMotive,
          description: repsOptionDescription
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
    currentTopWeight,
    isBodyweight,
    isAlreadyAppliedInSession,
    lastAppliedStrategy
  };
};
