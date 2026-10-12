/* frontend/src/utils/smartNutritionCoach.js */
import { getAppliedNutritionStrategy } from './nutritionCoachHistory';

/**
 * Normaliza y clasifica el objetivo del usuario.
 */
export const normalizeNutritionGoal = (rawGoal) => {
  const g = String(rawGoal || '').toLowerCase().trim();
  if (g === 'gain' || g === 'muscle') {
    return {
      key: 'gain',
      label: 'Ganar Masa Muscular',
      shortLabel: 'Hipertrofia',
      badge: 'Superávit & Anabolismo',
      color: 'accent',
      description: 'Superávit calórico controlado y consumo proteico constante para maximizar la síntesis proteica muscular (MPS) y el glucógeno.'
    };
  }
  if (g === 'lose' || g === 'weight_loss') {
    return {
      key: 'lose',
      label: 'Perder Grasa / Definición',
      shortLabel: 'Definición',
      badge: 'Déficit & Protección Muscular',
      color: 'emerald-500',
      description: 'Déficit calórico estricto con alta proteína para oxidar grasa corporal reteniendo al 100% la masa muscular magra.'
    };
  }
  if (g === 'recomp') {
    return {
      key: 'recomp',
      label: 'Recomposición Corporal',
      shortLabel: 'Recomposición',
      badge: 'Balance Normocalórico',
      color: 'purple-500',
      description: 'Ingesta normocalórica con proteína elevada para promover simultáneamente pérdida de tejido graso y ganancia muscular.'
    };
  }
  return {
    key: 'maintain',
    label: 'Mantenimiento & Salud',
    shortLabel: 'Mantenimiento',
    badge: 'Energía & Rendimiento',
    color: 'blue-500',
    description: 'Aporte equilibrado de macronutrientes, micronutrientes y correcta hidratación para sostener la salud y vitalidad diaria.'
  };
};

/**
 * Diagnostica el estado nutricional del día según datos reales y objetivos científicos.
 */
export const generateSmartNutritionCoachPlan = ({
  userProfile,
  totals = { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0 },
  targets = {},
  waterLog = { quantity_ml: 0 },
  todaysCreatineLog = [],
  meals = {},
  nutritionLog = [],
  selectedDate = new Date().toISOString().split('T')[0],
  latestWeight = 70
}) => {
  const goalInfo = normalizeNutritionGoal(userProfile?.goal);

  const calorieTarget = targets.calorieTarget || 2000;
  const proteinTarget = targets.proteinTarget || Math.round(latestWeight * (goalInfo.key === 'gain' ? 2.0 : 1.8));
  const carbsTarget = targets.carbsTarget || 250;
  const fatsTarget = targets.fatsTarget || 60;
  const sugarTarget = targets.sugarTarget || Math.round((calorieTarget * 0.10) / 4);
  const waterTarget = targets.waterTarget || Math.round(latestWeight * 35);
  const creatineTarget = targets.creatineTarget || 5;

  const caloriesConsumed = Math.round(totals.calories || 0);
  const proteinConsumed = Math.round(totals.protein || 0);
  const carbsConsumed = Math.round(totals.carbs || 0);
  const fatsConsumed = Math.round(totals.fats || 0);
  const sugarConsumed = Math.round(totals.sugar || 0);
  const waterConsumed = Math.round(waterLog?.quantity_ml || 0);
  const creatineCount = Array.isArray(todaysCreatineLog) ? todaysCreatineLog.length : 0;
  const foodCount = Array.isArray(nutritionLog) ? nutritionLog.length : 0;

  // Comprobar si hubo una estrategia aplicada previamente hoy
  const previousStrategy = getAppliedNutritionStrategy(selectedDate);

  // --- PILARES DE DIAGNÓSTICO NUTRICIONAL ---
  const pillars = [];
  let warningsCount = 0;
  let optimalCount = 0;

  // 1. CALORÍAS
  const calPct = Math.round((caloriesConsumed / calorieTarget) * 100);
  let calStatus = 'optimal';
  let calMessage = '';
  let calScience = '';

  if (goalInfo.key === 'lose') {
    if (caloriesConsumed > calorieTarget + 150) {
      calStatus = 'warning';
      warningsCount++;
      calMessage = `Superávit en definición (+${caloriesConsumed - calorieTarget} kcal sobre la meta).`;
      calScience = 'En fase de pérdida de grasa, exceder el objetivo calórico detiene la lipólisis (quema de grasa). Ajusta la siguiente comida.';
    } else if (caloriesConsumed < calorieTarget * 0.45 && foodCount >= 2) {
      calStatus = 'warning';
      warningsCount++;
      calMessage = `Déficit extremo (${calPct}% consumido).`;
      calScience = 'Un déficit excesivamente agresivo eleva el cortisol y puede inducir catabolismo de masa muscular.';
    } else {
      calStatus = 'optimal';
      optimalCount++;
      calMessage = `Déficit óptimo para quemar grasa (${calPct}% completado).`;
      calScience = 'Consistencia calórica ideal: permite la oxidación de ácidos grasos mientras se preserva el tejido magro.';
    }
  } else if (goalInfo.key === 'gain') {
    if (caloriesConsumed < calorieTarget * 0.65 && foodCount >= 2) {
      calStatus = 'warning';
      warningsCount++;
      calMessage = `Calorías insuficientes para hipertrofia (${caloriesConsumed}/${calorieTarget} kcal).`;
      calScience = 'El crecimiento muscular requiere superávit o normocaloría. Con déficit calórico, el anabolismo se frena drásticamente.';
    } else if (caloriesConsumed > calorieTarget * 1.25) {
      calStatus = 'warning';
      warningsCount++;
      calMessage = `Superávit excesivo (+${caloriesConsumed - calorieTarget} kcal).`;
      calScience = 'Más de 400-500 kcal de superávit diario suele traducirse en acumulación de tejido adiposo innecesario.';
    } else {
      calStatus = 'optimal';
      optimalCount++;
      calMessage = `Aporte calórico perfecto para hipertrofia (${calPct}%).`;
      calScience = 'Energía suficiente para la síntesis de nuevas proteínas contráctiles y reposición de glucógeno.';
    }
  } else {
    if (Math.abs(caloriesConsumed - calorieTarget) > 350) {
      calStatus = 'warning';
      warningsCount++;
      calMessage = caloriesConsumed > calorieTarget ? 'Calorías por encima de mantenimiento.' : 'Calorías por debajo de mantenimiento.';
      calScience = 'Mantenerse cerca de tu gasto energético total promueve la estabilidad metabólica y longevidad.';
    } else {
      calStatus = 'optimal';
      optimalCount++;
      calMessage = 'Balance calórico equilibrado.';
      calScience = 'Gasto e ingesta en armonía.';
    }
  }

  pillars.push({
    id: 'calories',
    name: 'Calorías Totales',
    icon: 'Flame',
    color: calStatus === 'optimal' ? 'emerald' : 'amber',
    consumed: caloriesConsumed,
    target: calorieTarget,
    unit: 'kcal',
    pct: calPct,
    status: calStatus,
    isWarning: calStatus !== 'optimal',
    message: calMessage,
    science: calScience
  });

  // 2. PROTEÍNA
  const proteinPct = Math.round((proteinConsumed / proteinTarget) * 100);
  let proteinStatus = 'optimal';
  let proteinMessage = '';
  let proteinScience = '';

  if (proteinPct < 70) {
    proteinStatus = 'warning';
    warningsCount++;
    proteinMessage = `Déficit proteico (${proteinConsumed}/${proteinTarget}g). Faltan ${proteinTarget - proteinConsumed}g.`;
    proteinScience = 'La síntesis proteica muscular (MPS) requiere pulsos regulares de leucina y aminoácidos esenciales para no perder masa.';
  } else if (proteinPct >= 70 && proteinPct < 90) {
    proteinStatus = 'warning';
    proteinMessage = `Cerca del objetivo: faltan solo ${proteinTarget - proteinConsumed}g para el óptimo.`;
    proteinScience = 'Cerrar la meta proteica con un snack o en la cena blindará tu balance de nitrógeno diario.';
  } else {
    proteinStatus = 'optimal';
    optimalCount++;
    proteinMessage = `¡Excelente! Rango anabólico completado (${proteinConsumed}g).`;
    proteinScience = 'Tu ingesta cubre con creces el recambio proteico muscular (1.8 a 2.2 g/kg de peso).';
  }

  pillars.push({
    id: 'protein',
    name: 'Proteína',
    icon: 'Beef',
    color: proteinStatus === 'optimal' ? 'emerald' : 'amber',
    consumed: proteinConsumed,
    target: proteinTarget,
    unit: 'g',
    pct: proteinPct,
    status: proteinStatus,
    isWarning: proteinStatus === 'warning' && proteinPct < 70,
    message: proteinMessage,
    science: proteinScience
  });

  // 3. AZÚCAR (LÍMITE MÁXIMO)
  const isSugarHigh = sugarConsumed > sugarTarget;
  let sugarStatus = isSugarHigh ? 'warning' : 'optimal';
  let sugarMessage = isSugarHigh
    ? `Exceso de azúcares libres (${sugarConsumed}/${sugarTarget}g superados).`
    : `Azúcares bajo control (${sugarConsumed}/${sugarTarget}g).`;
  let sugarScience = isSugarHigh
    ? 'El exceso de azúcar libre genera picos de insulina y somnolencia post-prandial. Prioriza carbohidratos complejos o fruta entera con fibra.'
    : 'Mantener el azúcar por debajo del 10% de las calorías protege la sensibilidad a la insulina y la energía sostenida.';

  if (isSugarHigh) warningsCount++; else optimalCount++;

  pillars.push({
    id: 'sugar',
    name: 'Azúcar Libre',
    icon: 'IceCream',
    color: isSugarHigh ? 'red' : 'emerald',
    consumed: sugarConsumed,
    target: sugarTarget,
    unit: 'g',
    pct: Math.round((sugarConsumed / sugarTarget) * 100),
    status: sugarStatus,
    isWarning: isSugarHigh,
    message: sugarMessage,
    science: sugarScience
  });

  // 4. AGUA (HIDRATACIÓN)
  const waterPct = Math.round((waterConsumed / waterTarget) * 100);
  let waterStatus = 'optimal';
  let waterMessage = '';
  let waterScience = '';

  if (waterPct < 60) {
    waterStatus = 'warning';
    warningsCount++;
    waterMessage = `Hidratación baja (${waterConsumed}/${waterTarget} ml). Faltan ${waterTarget - waterConsumed} ml.`;
    waterScience = 'Una deshidratación del 2% disminuye la potencia muscular hasta un 15% y reduce la tasa de síntesis proteica.';
  } else if (waterPct < 85) {
    waterStatus = 'good';
    waterMessage = `Buen avance en hidratación (${waterConsumed} ml). Un vaso más completará la meta.`;
    waterScience = 'Mantener la osmolalidad celular óptima mejora la digestión y el volumen celular muscular.';
  } else {
    waterStatus = 'optimal';
    optimalCount++;
    waterMessage = `Hidratación completada con éxito (${waterConsumed} ml).`;
    waterScience = 'Células musculares completamente voluminizadas e intercambio de electrolitos optimizado.';
  }

  pillars.push({
    id: 'water',
    name: 'Agua & Hidratación',
    icon: 'Droplet',
    color: waterStatus === 'optimal' ? 'blue' : 'amber',
    consumed: waterConsumed,
    target: waterTarget,
    unit: 'ml',
    pct: waterPct,
    status: waterStatus,
    isWarning: waterStatus === 'warning',
    message: waterMessage,
    science: waterScience
  });

  // 5. CREATINA
  const isCreatineLogged = creatineCount > 0;
  let creatineStatus = isCreatineLogged ? 'optimal' : 'warning';
  let creatineMessage = isCreatineLogged
    ? 'Creatina registrada hoy (depósitos de fosfocreatina cubiertos).'
    : `Toma de creatina pendiente hoy (~${creatineTarget}g).`;
  let creatineScience = isCreatineLogged
    ? 'La constancia diaria mantiene al 100% las reservas intramusculares de PCr para esfuerzos de alta intensidad.'
    : 'La creatina no actúa de forma aguda sino por saturación crónica. Tomarla a diario sin saltarse días es lo que maximiza sus beneficios.';

  if (!isCreatineLogged) warningsCount++; else optimalCount++;

  pillars.push({
    id: 'creatine',
    name: 'Creatina',
    icon: 'Zap',
    color: isCreatineLogged ? 'purple' : 'amber',
    consumed: isCreatineLogged ? 'Registrada' : 'Pendiente',
    target: `~${creatineTarget}g`,
    unit: 'día',
    pct: isCreatineLogged ? 100 : 0,
    status: creatineStatus,
    isWarning: !isCreatineLogged,
    message: creatineMessage,
    science: creatineScience
  });

  // 6. CARBOHIDRATOS & GRASAS (ENERGÍA Y HORMONAS)
  const carbsPct = Math.round((carbsConsumed / carbsTarget) * 100);
  const fatsPct = Math.round((fatsConsumed / fatsTarget) * 100);
  const isFatsLow = fatsConsumed < fatsTarget * 0.5 && foodCount >= 2;
  const macroBalanceStatus = isFatsLow ? 'warning' : 'optimal';

  pillars.push({
    id: 'macros_balance',
    name: 'Carbos & Grasas Saludables',
    icon: 'Wheat',
    color: macroBalanceStatus === 'optimal' ? 'emerald' : 'amber',
    consumed: `${carbsConsumed}g C / ${fatsConsumed}g G`,
    target: `${carbsTarget}g C / ${fatsTarget}g G`,
    unit: 'macros',
    pct: Math.round((carbsPct + fatsPct) / 2),
    status: macroBalanceStatus,
    isWarning: isFatsLow,
    message: isFatsLow
      ? 'Grasas excesivamente bajas. Se requiere un mínimo de ácidos grasos para la síntesis hormonal (testosterona/estrógenos).'
      : 'Reparto energético de carbohidratos y grasas en buena proporción.',
    science: 'Las grasas regulan la absorción de vitaminas liposolubles (A, D, E, K) y los carbos rellenan el glucógeno hepático y muscular.'
  });

  // --- DETERMINAR ESTADO GLOBAL ---
  const isWarning = warningsCount >= 2 || (proteinPct < 65 && foodCount >= 2) || (goalInfo.key === 'lose' && caloriesConsumed > calorieTarget + 200);
  const isOptimal = warningsCount === 0 || (warningsCount === 1 && optimalCount >= 4);

  let overallStatus = 'balanced';
  let overallBadgeText = 'Balance en curso';

  if (isOptimal) {
    overallStatus = 'optimal';
    overallBadgeText = '¡Día Nutricional Impecable!';
  } else if (isWarning) {
    overallStatus = 'warning';
    overallBadgeText = `Aviso: ${warningsCount} alertas detectadas`;
  } else {
    overallStatus = 'balanced';
    overallBadgeText = `${optimalCount}/6 metas en rango`;
  }

  // --- CELEBRACIÓN / FELICITACIÓN ---
  let celebrationData = null;
  if (isOptimal) {
    celebrationData = {
      isCelebrating: true,
      title: '¡Nutrición Impecable! Estás clavando tus macros 🚀',
      subtitle: `Tus calorías, proteína y micronutrientes están alineados con tu objetivo de ${goalInfo.label}.`,
      tipsToMaintain: [
        'Mantén la misma constancia en los próximos días: los resultados físicos son el reflejo de semanas acumuladas en rango óptimo.',
        'Asegura un sueño reparador de 7-8 horas para que tu cuerpo utilice estos nutrientes durante la fase de regeneración celular.',
        'Si sientes apetito nocturno, opta por una infusión caliente o agua para no alterar la digestión previa al descanso.'
      ]
    };
  }

  // --- MENSAJE MOTIVACIONAL Y CIENCIA ---
  let motivationalMessage = null;
  if (isWarning) {
    motivationalMessage = `No te castigues: la nutrición no consiste en perfección estricta, sino en saber compensar y tomar decisiones inteligentes. Con un par de ajustes en tu siguiente ingesta, volverás a colocar tu día en balance óptimo.`;
  }

  // --- ESTRATEGIAS RECOMENDADAS SELECCIONABLES ---
  const strategyOptions = [];

  // Estrategia 1: Proteína
  if (proteinConsumed < proteinTarget) {
    const proteinGap = proteinTarget - proteinConsumed;
    strategyOptions.push({
      id: 'boost_protein',
      title: `Añadir Snack de Proteína Magra (+${Math.min(35, Math.max(20, proteinGap))}g)`,
      tag: 'Recomendada',
      badge: `+${Math.min(35, Math.max(20, proteinGap))}g Proteína`,
      description: `Consume una fuente rápida de proteína (batido de aislado/whey, 200g de queso fresco batido o 120g de pechuga) para asegurar el estímulo de síntesis proteica muscular.`,
      actionHint: 'Añadir a la próxima comida o snack antes de dormir.'
    });
  }

  // Estrategia 2: Calorías en Definición vs Hipertrofia
  if (goalInfo.key === 'lose') {
    if (caloriesConsumed >= calorieTarget - 150) {
      strategyOptions.push({
        id: 'volumetric_dinner',
        title: 'Cena Volumétrica de Baja Densidad Calórica',
        tag: 'Saciedad Total',
        badge: 'Bajo en kcal',
        description: 'Prioriza verduras de hoja verde, calabacín, espárragos y pescados blancos o claras. Te aportará gran saciedad estomacal con un impacto calórico mínimo.',
        actionHint: 'Ideal para la cena para no exceder las calorías en definición.'
      });
      strategyOptions.push({
        id: 'fasting_window',
        title: 'Cierre de Ventana Digestiva',
        tag: 'Control Calórico',
        badge: 'Hidratación',
        description: 'Da por cerrado el consumo calórico de hoy. Toma una infusión digestiva o agua fría para evitar antojos emocionales tardíos.',
        actionHint: 'Cierra tu ingesta 2-3 horas antes de dormir.'
      });
    }
  } else if (goalInfo.key === 'gain') {
    if (caloriesConsumed < calorieTarget - 200) {
      const calGap = calorieTarget - caloriesConsumed;
      strategyOptions.push({
        id: 'calorie_density',
        title: `Densidad Calórica Saludable (+${Math.min(500, Math.max(250, calGap))} kcal)`,
        tag: 'Recomendada',
        badge: '+300-400 kcal',
        description: 'Añade 30g de frutos secos (nueces/almendras), una cucharada de crema de cacahuete pura o aceite de oliva virgen extra. Aumenta calorías sin sobrecargar el estómago.',
        actionHint: 'Añadir como complemento sin sensación de pesadez.'
      });
      strategyOptions.push({
        id: 'anabolic_shake',
        title: 'Batido Anabólico de Avena y Fruta',
        tag: 'Energía Rápida',
        badge: 'Glucógeno & Músculo',
        description: 'Mezcla leche o bebida vegetal con 40g de copos de avena, un plátano y tu proteína para rellenar los depósitos de glucógeno y apoyar la hipertrofia.',
        actionHint: 'Consumir post-entrenamiento o entre comidas.'
      });
    }
  }

  // Estrategia 3: Azúcar alto
  if (isSugarHigh) {
    strategyOptions.push({
      id: 'post_meal_walk',
      title: 'Paseo Activo Post-Prandial (15-20 min)',
      tag: 'Control Glucémico',
      badge: 'Bajar Insulina',
      description: 'Una caminata suave activa la contracción muscular, permitiendo captar la glucosa en sangre a través de transportadores GLUT4 sin necesidad de secretar exceso de insulina.',
      actionHint: 'Realizar una caminata ligera después de comer.'
    });
  }

  // Estrategia 4: Hidratación o Creatina
  if (waterConsumed < waterTarget * 0.70) {
    strategyOptions.push({
      id: 'hydration_protocol',
      title: 'Protocolo de Hidratación Rápida (+500-750 ml)',
      tag: 'Hidratación',
      badge: '+750 ml Agua',
      description: 'Bebe 2 vasos grandes de agua ahora y mantén una botella a la vista. La reposición hídrica disipa la fatiga y optimiza la función renal.',
      actionHint: 'Beber a sorbos constantes en la próxima hora.'
    });
  }

  if (!isCreatineLogged) {
    strategyOptions.push({
      id: 'take_creatine',
      title: `Registrar Toma de Creatina (~${creatineTarget}g)`,
      tag: 'Fuerza Muscular',
      badge: `${creatineTarget}g Creatina`,
      description: 'Toma tu dosis diaria de creatina con agua o zumo. La creatina celular previene la caída de fuerza durante la semana de entrenamiento.',
      actionHint: 'Tomar con un vaso de agua antes de finalizar el día.'
    });
  }

  // Si todo está perfecto, ofrecer estrategias de optimización
  if (strategyOptions.length === 0) {
    strategyOptions.push({
      id: 'maintain_momentum',
      title: 'Consolidar Timing Nutricional',
      tag: 'Recomendada',
      badge: 'Consistencia',
      description: 'Tu distribución de hoy es ejemplar. Repite esta estructura de alimentos en tus días de entrenamiento para consolidar tus hábitos a largo plazo.',
      actionHint: 'Mantener pautas habituales.'
    });
    strategyOptions.push({
      id: 'sleep_prep',
      title: 'Preparación para el Descanso Anabólico',
      tag: 'Recuperación',
      badge: 'Cena Ligera',
      description: 'Asegura que tu última comida ocurra al menos 90 minutos antes de acostarte para permitir que la hormona de crecimiento se libere sin interferencias de digestión pesada.',
      actionHint: 'Cenar temprano y relajarse.'
    });
  }

  // Recomendación de Asesoría Pro Fitness con nutricionista/preparador real
  const asesoriaRecommendation = {
    show: isWarning,
    headline: '¿Te cuesta cuadrar tus macros o calorías?',
    description: 'En la Asesoría Pro Fitness, un preparador físico y dietista real diseña tu menú a medida con los alimentos que te gustan, garantizando resultados sin pasar hambre ni estancarte.',
    buttonText: 'Hablar con mi Nutricionista / Entrenador'
  };

  return {
    selectedDate,
    userGoal: goalInfo,
    overallStatus,
    overallBadgeText,
    isWarning,
    isOptimal,
    warningsCount,
    optimalCount,
    foodCount,
    pillars,
    motivationalMessage,
    celebrationData,
    strategyOptions,
    asesoriaRecommendation,
    previousStrategy,
    totals: {
      calories: caloriesConsumed,
      protein: proteinConsumed,
      carbs: carbsConsumed,
      fats: fatsConsumed,
      sugar: sugarConsumed,
      water: waterConsumed,
      creatineCount
    },
    targets: {
      calorieTarget,
      proteinTarget,
      carbsTarget,
      fatsTarget,
      sugarTarget,
      waterTarget,
      creatineTarget
    }
  };
};
