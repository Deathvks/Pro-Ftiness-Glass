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
  const calRemaining = Math.max(0, calorieTarget - caloriesConsumed);
  const calSurplus = Math.max(0, caloriesConsumed - calorieTarget);
  let calStatus = 'in_progress';
  let calMessage = '';
  let calScience = '';

  if (goalInfo.key === 'lose') {
    if (caloriesConsumed > calorieTarget + 120) {
      calStatus = 'warning';
      warningsCount++;
      calMessage = `Superávit en definición (+${calSurplus} kcal sobre el límite).`;
      calScience = 'En fase de pérdida de grasa, superar tu meta calórica detiene la movilización de ácidos grasos (lipólisis). Compensa en tu siguiente comida.';
    } else if (calPct < 60) {
      calStatus = 'in_progress';
      calMessage = `Llevas ${caloriesConsumed} kcal (${calPct}%). Te quedan ${calRemaining} kcal disponibles para hoy manteniendo tu déficit.`;
      calScience = 'Distribuye las calorías restantes en alimentos con buen volumen y proteína para preservar masa muscular y evitar pasar hambre.';
    } else {
      calStatus = 'optimal';
      optimalCount++;
      calMessage = `Déficit óptimo para quemar grasa (${caloriesConsumed}/${calorieTarget} kcal - ${calPct}%).`;
      calScience = 'Consistencia calórica ideal: permite la oxidación de ácidos grasos mientras se preserva el tejido magro.';
    }
  } else if (goalInfo.key === 'gain') {
    if (calPct < 65) {
      calStatus = 'in_progress';
      calMessage = `Llevas ${caloriesConsumed} de ${calorieTarget} kcal (${calPct}%). Te faltan ${calRemaining} kcal para alcanzar el superávit anabólico del día.`;
      calScience = 'Para construir nuevo tejido muscular (hipertrofia), el organismo requiere un aporte calórico completo. Con un consumo bajo, el cuerpo prioriza funciones basales y no tiene excedente para sintetizar masa muscular.';
    } else if (calPct >= 65 && calPct < 85) {
      calStatus = 'in_progress';
      calMessage = `Buen avance: ${caloriesConsumed}/${calorieTarget} kcal (${calPct}%). Restan ${calRemaining} kcal para tu meta diaria.`;
      calScience = 'Aprovecha las comidas restantes para cubrir las calorías que faltan con fuentes densas y limpias según lo que tengas en casa.';
    } else if (caloriesConsumed > calorieTarget * 1.20) {
      calStatus = 'warning';
      warningsCount++;
      calMessage = `Superávit excesivo (+${calSurplus} kcal sobre la meta).`;
      calScience = 'Un superávit demasiado elevado (más de 300-500 kcal extra) no aumenta la masa muscular, sino la acumulación de tejido graso.';
    } else {
      calStatus = 'optimal';
      optimalCount++;
      calMessage = `Aporte calórico en rango ideal para hipertrofia (${caloriesConsumed}/${calorieTarget} kcal - ${calPct}%).`;
      calScience = 'Superávit anabólico controlado: energía suficiente para la síntesis de nuevas proteínas contráctiles y reposición de glucógeno sin acumular grasa extra.';
    }
  } else {
    // Recomposición / Mantenimiento
    if (calPct < 70) {
      calStatus = 'in_progress';
      calMessage = `Llevas ${caloriesConsumed} de ${calorieTarget} kcal (${calPct}%). Faltan ${calRemaining} kcal para tu equilibrio calórico.`;
      calScience = 'Mantenerse cerca de tu gasto energético total promueve la estabilidad metabólica y longevidad.';
    } else if (caloriesConsumed > calorieTarget * 1.15) {
      calStatus = 'warning';
      warningsCount++;
      calMessage = `Calorías por encima de mantenimiento (+${calSurplus} kcal).`;
      calScience = 'Consumir por encima del gasto sostenido aumentará gradualmente el porcentaje de grasa corporal.';
    } else {
      calStatus = 'optimal';
      optimalCount++;
      calMessage = `Balance calórico equilibrado (${caloriesConsumed}/${calorieTarget} kcal).`;
      calScience = 'Gasto e ingesta en armonía metabólica.';
    }
  }

  pillars.push({
    id: 'calories',
    name: 'Calorías Totales',
    icon: 'Flame',
    color: calStatus === 'optimal' ? 'emerald' : calStatus === 'warning' ? 'amber' : 'blue',
    consumed: caloriesConsumed,
    target: calorieTarget,
    unit: 'kcal',
    pct: calPct,
    status: calStatus,
    isWarning: calStatus === 'warning',
    message: calMessage,
    science: calScience
  });

  // 2. PROTEÍNA
  const proteinPct = Math.round((proteinConsumed / proteinTarget) * 100);
  const proteinRemaining = Math.max(0, proteinTarget - proteinConsumed);
  let proteinStatus = 'in_progress';
  let proteinMessage = '';
  let proteinScience = '';

  if (proteinPct < 70) {
    proteinStatus = foodCount >= 2 ? 'warning' : 'in_progress';
    if (proteinStatus === 'warning') warningsCount++;
    proteinMessage = `Llevas ${proteinConsumed}g de ${proteinTarget}g (${proteinPct}%). Faltan ${proteinRemaining}g para el umbral óptimo.`;
    proteinScience = 'La síntesis proteica muscular (MPS) requiere pulsos regulares de leucina y aminoácidos esenciales para retener o construir músculo.';
  } else if (proteinPct >= 70 && proteinPct < 90) {
    proteinStatus = 'in_progress';
    proteinMessage = `Cerca del objetivo: faltan ${proteinRemaining}g de proteína para el rango óptimo.`;
    proteinScience = 'Completar la meta proteica en tu siguiente comida o cena blindará tu balance de nitrógeno diario.';
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
    color: proteinStatus === 'optimal' ? 'emerald' : proteinStatus === 'warning' ? 'amber' : 'blue',
    consumed: proteinConsumed,
    target: proteinTarget,
    unit: 'g',
    pct: proteinPct,
    status: proteinStatus,
    isWarning: proteinStatus === 'warning',
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
  let waterStatus = 'in_progress';
  let waterMessage = '';
  let waterScience = '';

  if (waterPct < 60) {
    waterStatus = foodCount >= 2 ? 'warning' : 'in_progress';
    if (waterStatus === 'warning') warningsCount++;
    waterMessage = `Llevas ${waterConsumed} de ${waterTarget} ml (${waterPct}%). Faltan ${waterTarget - waterConsumed} ml.`;
    waterScience = 'Una deshidratación del 2% disminuye la potencia muscular hasta un 15% y reduce la tasa de síntesis proteica.';
  } else if (waterPct < 85) {
    waterStatus = 'in_progress';
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
    color: waterStatus === 'optimal' ? 'blue' : waterStatus === 'warning' ? 'amber' : 'blue',
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
  let creatineStatus = isCreatineLogged ? 'optimal' : 'in_progress';
  let creatineMessage = isCreatineLogged
    ? 'Creatina registrada hoy (depósitos de fosfocreatina cubiertos).'
    : `Toma de creatina pendiente hoy (~${creatineTarget}g).`;
  let creatineScience = isCreatineLogged
    ? 'La constancia diaria mantiene al 100% las reservas intramusculares de PCr para esfuerzos de alta intensidad.'
    : 'La creatina no actúa de forma aguda sino por saturación crónica. Tomarla a diario sin saltarse días es lo que maximiza sus beneficios.';

  if (isCreatineLogged) optimalCount++;

  pillars.push({
    id: 'creatine',
    name: 'Creatina',
    icon: 'Zap',
    color: isCreatineLogged ? 'purple' : 'blue',
    consumed: isCreatineLogged ? 'Registrada' : 'Pendiente',
    target: `~${creatineTarget}g`,
    unit: 'día',
    pct: isCreatineLogged ? 100 : 0,
    status: creatineStatus,
    isWarning: false,
    message: creatineMessage,
    science: creatineScience
  });

  // 6. CARBOHIDRATOS & GRASAS (ENERGÍA Y HORMONAS)
  const carbsPct = Math.round((carbsConsumed / carbsTarget) * 100);
  const fatsPct = Math.round((fatsConsumed / fatsTarget) * 100);
  const carbsRemaining = Math.max(0, carbsTarget - carbsConsumed);
  const fatsRemaining = Math.max(0, fatsTarget - fatsConsumed);

  let macroBalanceStatus = 'in_progress';
  let macroMessage = '';
  let isMacroWarning = false;

  if (fatsPct > 130 || carbsPct > 130) {
    macroBalanceStatus = 'warning';
    isMacroWarning = true;
    warningsCount++;
    macroMessage = `Exceso en macronutrientes energéticos (${carbsPct}% carbos, ${fatsPct}% grasas). Modera fuentes densas en las siguientes ingestas.`;
  } else if (fatsConsumed < fatsTarget * 0.4 && foodCount >= 2) {
    macroBalanceStatus = 'warning';
    isMacroWarning = true;
    warningsCount++;
    macroMessage = `Grasas bajas (${fatsConsumed}/${fatsTarget}g). Tu cuerpo necesita un mínimo de ácidos grasos para la producción hormonal.`;
  } else if (carbsPct >= 75 && carbsPct <= 115 && fatsPct >= 75 && fatsPct <= 115) {
    macroBalanceStatus = 'optimal';
    optimalCount++;
    macroMessage = 'Reparto energético de carbohidratos y grasas en rango óptimo.';
  } else {
    macroBalanceStatus = 'in_progress';
    macroMessage = `En curso: faltan ${carbsRemaining}g de carbohidratos y ${fatsRemaining}g de grasas para completar tus metas del día.`;
  }

  pillars.push({
    id: 'macros_balance',
    name: 'Carbos & Grasas Saludables',
    icon: 'Wheat',
    color: macroBalanceStatus === 'optimal' ? 'emerald' : macroBalanceStatus === 'warning' ? 'amber' : 'blue',
    consumed: `${carbsConsumed}g C / ${fatsConsumed}g G`,
    target: `${carbsTarget}g C / ${fatsTarget}g G`,
    unit: 'macros',
    pct: Math.round((carbsPct + fatsPct) / 2),
    status: macroBalanceStatus,
    isWarning: isMacroWarning,
    message: macroMessage,
    science: 'Las grasas regulan la absorción de vitaminas liposolubles (A, D, E, K) y síntesis hormonal, mientras los carbos recargan el glucógeno muscular.'
  });

  // --- DETERMINAR ESTADO GLOBAL ---
  const isCaloriesPending = (goalInfo.key === 'gain' && calPct < 80) || (goalInfo.key !== 'gain' && calPct < 60);
  const isWarning = warningsCount >= 1 || (goalInfo.key === 'lose' && caloriesConsumed > calorieTarget + 120);
  const isOptimal = !isWarning && !isCaloriesPending && optimalCount >= 3;

  let overallStatus = 'in_progress';
  let overallBadgeText = 'Balance en curso';

  if (isOptimal) {
    overallStatus = 'optimal';
    overallBadgeText = '¡Día Nutricional Impecable!';
  } else if (isWarning) {
    overallStatus = 'warning';
    overallBadgeText = `Aviso: ${warningsCount} ${warningsCount === 1 ? 'alerta' : 'alertas'}`;
  } else {
    overallStatus = 'in_progress';
    overallBadgeText = `Día en curso • ${calPct}% calorías`;
  }

  // --- CELEBRACIÓN / FELICITACIÓN (SOLO SI REALMENTE ESTÁ COMPLETO) ---
  let celebrationData = null;
  if (isOptimal) {
    celebrationData = {
      isCelebrating: true,
      title: '¡Nutrición Impecable! Estás clavando tus metas',
      subtitle: `Tus calorías, proteína y micronutrientes están alineados con tu objetivo de ${goalInfo.label}.`,
      tipsToMaintain: [
        'Mantén la misma constancia en los próximos días: los resultados físicos son el reflejo de semanas acumuladas en rango óptimo.',
        'Asegura un sueño reparador de 7-8 horas para que tu cuerpo utilice estos nutrientes durante la fase de regeneración celular.',
        'Si sientes apetito tardío, opta por una infusión caliente o agua para no alterar la digestión previa al descanso.'
      ]
    };
  }

  // --- MENSAJE MOTIVACIONAL Y CIENCIA ---
  let motivationalMessage = null;
  if (isWarning) {
    motivationalMessage = `No te castigues: la nutrición no consiste en perfección estricta, sino en saber compensar y tomar decisiones inteligentes. Con un par de ajustes en tus siguientes comidas volverás a colocar tu día en balance óptimo.`;
  }

  // --- PAUTAS Y SUGERENCIAS PRÁCTICAS FLEXIBLES (SIN OBLIGAR A COMIDAS FIJAS) ---
  const strategyOptions = [];

  // Pauta 1: Proteína
  if (proteinConsumed < proteinTarget) {
    const proteinGap = proteinTarget - proteinConsumed;
    strategyOptions.push({
      id: 'boost_protein',
      title: `Ideas para completar tu proteína (+${Math.min(35, Math.max(20, proteinGap))}g)`,
      tag: 'Sugerencia Práctica',
      badge: `+${Math.min(35, Math.max(20, proteinGap))}g Proteína`,
      description: `Elige según lo que tengas en casa: atún, 2-3 huevos/claras, pechuga de pollo/pavo, queso fresco batido o un batido de proteína. Cada opción eleva la síntesis proteica de forma limpia.`,
      actionHint: 'Añádelo a tu próxima comida o cena según lo que tengas disponible.'
    });
  }

  // Pauta 2: Calorías en Definición vs Hipertrofia
  if (goalInfo.key === 'lose') {
    if (caloriesConsumed >= calorieTarget - 200) {
      strategyOptions.push({
        id: 'volumetric_dinner',
        title: 'Cena ligera de volumen saciante',
        tag: 'Control Calórico',
        badge: 'Bajo en kcal',
        description: 'Si ya estás cerca de tu límite de calorías, prioriza verduras abundantes (ensalada, calabacín, espinacas) con pescado blanco o claras para cenar saciado sin sumar calorías extra.',
        actionHint: 'Ajusta tu cena con los alimentos que tengas a mano.'
      });
      strategyOptions.push({
        id: 'fasting_window',
        title: 'Cierre de ingesta con infusión',
        tag: 'Saciedad Nocturna',
        badge: 'Hidratación',
        description: 'Una infusión digestiva caliente o un vaso grande de agua fría calma los antojos tardíos y facilita un descanso profundo sin digestión pesada.',
        actionHint: 'Ideal para tomar 1-2 horas antes de dormir.'
      });
    }
  } else if (goalInfo.key === 'gain') {
    if (calRemaining > 200) {
      strategyOptions.push({
        id: 'calorie_density',
        title: `Aporte calórico saludable y fácil (+${Math.min(450, calRemaining)} kcal)`,
        tag: 'Densidad Nutritiva',
        badge: '+300-400 kcal',
        description: 'Si te cuesta llegar a tus calorías, añade alimentos densos que tengas a mano: un puñado de frutos secos (nueces, almendras), una cucharada de crema de frutos secos o un chorrito extra de aceite de oliva.',
        actionHint: 'Complemento rápido sin sensación de pesadez estomacal.'
      });
      strategyOptions.push({
        id: 'carb_boost',
        title: 'Aporte de carbohidratos para energía y glucógeno',
        tag: 'Energía & Músculo',
        badge: 'Glucógeno',
        description: 'Fruta madura (plátano), avena, arroz o patata en tu siguiente comida te darán los carbohidratos necesarios para rendir y reponer glucógeno.',
        actionHint: 'Consúmelo en tu comida principal o merienda.'
      });
    }
  }

  // Pauta 3: Azúcar alto
  if (isSugarHigh) {
    strategyOptions.push({
      id: 'post_meal_walk',
      title: 'Paseo activo o movimiento post-comida (15-20 min)',
      tag: 'Control Glucémico',
      badge: 'Sensibilidad Insulina',
      description: 'Una caminata suave activa la contracción muscular, permitiendo captar la glucosa en sangre de forma natural sin necesidad de secretar exceso de insulina.',
      actionHint: 'Un paseo ligero después de comer ayuda a regular el azúcar.'
    });
  }

  // Pauta 4: Hidratación o Creatina
  if (waterConsumed < waterTarget * 0.70) {
    strategyOptions.push({
      id: 'hydration_protocol',
      title: 'Suma hidratación constante',
      tag: 'Hidratación',
      badge: '+500-750 ml',
      description: 'Ten un vaso o botella de agua siempre a la vista. Mantenerte hidratado disipa la fatiga y optimiza la función celular muscular.',
      actionHint: 'Bebe a sorbos regulares en la próxima hora.'
    });
  }

  if (!isCreatineLogged) {
    strategyOptions.push({
      id: 'take_creatine',
      title: `Recuerda tu toma diaria de creatina (~${creatineTarget}g)`,
      tag: 'Fuerza Muscular',
      badge: `${creatineTarget}g Creatina`,
      description: 'Tómala en el momento del día que mejor te encaje con agua o zumo. La constancia diaria es lo que mantiene la saturación intramuscular.',
      actionHint: 'Tomar con un vaso de agua antes de terminar el día.'
    });
  }

  // Si todo está perfecto
  if (strategyOptions.length === 0) {
    strategyOptions.push({
      id: 'maintain_momentum',
      title: 'Consolidar este patrón alimentario',
      tag: 'Consistencia',
      badge: 'Hábitos Sólidos',
      description: 'Tu distribución de hoy es ejemplar. Repite esta estructura de alimentos en tus días habituales para consolidar resultados a largo plazo.',
      actionHint: 'Mantén tus pautas habituales.'
    });
    strategyOptions.push({
      id: 'sleep_prep',
      title: 'Preparación para el descanso y recuperación',
      tag: 'Recuperación',
      badge: 'Descanso Óptimo',
      description: 'Asegura que tu última comida ocurra al menos 90 minutos antes de acostarte para permitir que los procesos de regeneración muscular actúen sin digestiones pesadas.',
      actionHint: 'Cenar temprano y favorecer el descanso nocturno.'
    });
  }

  // Recomendación de Asesoría Pro Fitness con nutricionista/preparador real (Siempre activa)
  const asesoriaRecommendation = {
    show: true,
    headline: '¿Quieres una pauta nutricional 100% personalizada?',
    description: 'En la Asesoría Pro Fitness, un preparador físico y dietista real diseña tu menú a medida con los alimentos que tienes disponibles en casa, sin dietas estrictas ni pasar hambre.',
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
