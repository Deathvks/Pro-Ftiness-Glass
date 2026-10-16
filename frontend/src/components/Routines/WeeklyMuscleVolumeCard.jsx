import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Dumbbell, FolderKanban, Layers, Target, X } from 'lucide-react';
import { MUSCLE_NAMES_ES } from '../../utils/muscleUtils';
import ModalPortal from '../ModalPortal';
import useModalLock from '../../hooks/useModalLock';

const GOAL_RANGES = {
  gain: {
    label: 'Ganar músculo',
    min: 10,
    max: 20,
    advice: 'Busca progresar y reparte el volumen si muchas series de un músculo quedan en una sola sesión.'
  },
  recomp: {
    label: 'Recomposición',
    min: 8,
    max: 16,
    advice: 'Mantén un volumen sostenible y prioriza la progresión junto con una buena recuperación.'
  },
  lose: {
    label: 'Perder grasa',
    min: 6,
    max: 12,
    advice: 'Prioriza series de calidad y ajusta el volumen si notas que cae tu rendimiento o recuperación.'
  },
  maintain: {
    label: 'Mantener',
    min: 6,
    max: 12,
    advice: 'Un volumen moderado puede ayudarte a mantener el estímulo; conserva cargas y técnica.'
  }
};

const TRACKED_MUSCLES = [
  {
    key: 'chest',
    label: 'Pecho',
    includedMuscles: ['Pectoral mayor', 'Pectoral superior (clavicular)', 'Pectoral inferior', 'Serrato anterior'],
    aliases: ['chest', 'pecho', 'pechos', 'pectoral', 'pectorals', 'pectoralis major', 'pectoral mayor']
  },
  {
    key: 'back',
    label: 'Espalda',
    includedMuscles: ['Dorsal ancho', 'Espalda alta y romboides', 'Trapecio medio/inferior', 'Zona lumbar'],
    aliases: ['back', 'espalda', 'dorsal', 'dorsales', 'dorsal ancho', 'lats', 'latissimus dorsi', 'upper back', 'lower back', 'upper-back', 'lower-back', 'lumbar', 'lumbares']
  },
  {
    key: 'shoulders',
    label: 'Hombros',
    includedMuscles: ['Deltoides anterior (frontal)', 'Deltoides lateral (medio)', 'Deltoides posterior', 'Trapecio superior'],
    aliases: ['shoulder', 'shoulders', 'hombro', 'hombros', 'deltoid', 'deltoids', 'deltoides', 'deltoides anterior', 'deltoides posterior', 'deltoides medio', 'anterior deltoid', 'posterior deltoid', 'front-deltoids', 'back-deltoids']
  },
  {
    key: 'biceps',
    label: 'Bíceps',
    includedMuscles: ['Bíceps braquial (cabeza larga y corta)', 'Braquial anterior', 'Braquiorradial'],
    aliases: ['biceps', 'bíceps', 'biceps brachii', 'biceps braquial', 'brachialis', 'braquial']
  },
  {
    key: 'triceps',
    label: 'Tríceps',
    includedMuscles: ['Tríceps braquial', 'Cabeza larga', 'Cabeza lateral', 'Cabeza medial'],
    aliases: ['triceps', 'tríceps', 'triceps brachii', 'tríceps braquial']
  },
  {
    key: 'quadriceps',
    label: 'Cuádriceps',
    includedMuscles: ['Recto femoral', 'Vasto lateral', 'Vasto medial', 'Vasto intermedio'],
    aliases: ['quadriceps', 'quadriceps femoris', 'quads', 'cuadriceps', 'cuádriceps']
  },
  {
    key: 'hamstring',
    label: 'Isquios',
    includedMuscles: ['Bíceps femoral', 'Semitendinoso', 'Semimembranoso', 'Isquiotibiales'],
    aliases: ['hamstring', 'hamstrings', 'isquios', 'isquiotibiales', 'femorales', 'femoral', 'biceps femoris']
  },
  {
    key: 'gluteal',
    label: 'Glúteos',
    includedMuscles: ['Glúteo mayor', 'Glúteo medio', 'Glúteo menor'],
    aliases: ['gluteal', 'glutes', 'gluteos', 'glúteos', 'gluteo', 'glúteo', 'gluteus maximus']
  },
  {
    key: 'calves',
    label: 'Gemelos',
    includedMuscles: ['Gastrocnemio (gemelos)', 'Sóleo'],
    aliases: ['calves', 'calf', 'gemelos', 'gemelo', 'pantorrillas', 'pantorrilla', 'gastrocnemius', 'soleus']
  },
  {
    key: 'core',
    label: 'Core',
    includedMuscles: ['Recto abdominal', 'Oblicuos internos y externos', 'Transverso abdominal'],
    aliases: ['core', 'abs', 'abdominal', 'abdominales', 'abdominals', 'obliques', 'oblicuos', 'oblicuo']
  }
];

const normalizeKey = (value = '') => String(value)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[_-]+/g, ' ')
  .trim();

const ALIAS_TO_MUSCLE = new Map(
  TRACKED_MUSCLES.flatMap(muscle => muscle.aliases.map(alias => [normalizeKey(alias), muscle.key]))
);
const MUSCLE_BY_KEY = new Map(TRACKED_MUSCLES.map(muscle => [muscle.key, muscle]));

const getGoalRange = (goal) => {
  const normalizedGoal = normalizeKey(goal);
  if (['gain', 'muscle', 'build muscle', 'ganar musculo'].includes(normalizedGoal)) return GOAL_RANGES.gain;
  if (['recomp', 'recomposition', 'recomposicion', 'hybrid'].includes(normalizedGoal)) return GOAL_RANGES.recomp;
  if (['lose', 'lose weight', 'lose fat', 'perder grasa', 'weight loss'].includes(normalizedGoal)) return GOAL_RANGES.lose;
  return GOAL_RANGES.maintain;
};

const getRoutineExercises = (routine) => {
  const exercises = routine?.RoutineExercises || routine?.exercises || [];
  if (!Array.isArray(exercises)) return [];
  return exercises.map(exercise => ({
    ...exercise,
    name: exercise.name || exercise.exercise?.name || exercise.exercise_details?.name || '',
    muscle_group: exercise.muscle_group || exercise.exercise?.muscle_group || exercise.exercise_details?.muscle_group || exercise.target || ''
  }));
};

const getPlannedSets = (exercise) => {
  const rawSets = exercise?.sets ?? exercise?.set_count ?? exercise?.number_of_sets;
  if (Array.isArray(rawSets)) return rawSets.length;
  const sets = Number(rawSets);
  return Number.isFinite(sets) && sets > 0 ? sets : 0;
};

const getExerciseMuscles = (exercise) => {
  const rawMuscles = exercise.muscle_group || exercise.exercise?.muscle_group || exercise.exercise_details?.muscle_group || exercise.target || '';
  const muscles = Array.isArray(rawMuscles) ? rawMuscles : String(rawMuscles).split(/[,;/]/);
  return [...new Set(muscles.map(normalizeKey).filter(muscle => muscle && !['unknown', 'other', 'otro', 'sin clasificar'].includes(muscle)))];
};

const hasAnyTerm = (text, terms) => terms.some(term => text.includes(term));

const inferMusclesFromExerciseName = (rawName = '') => {
  const name = normalizeKey(rawName);
  if (!name) return null;

  // 1. Tríceps (aislamiento y compuestos dominantes de tríceps)
  const isCloseGripOrDip = hasAnyTerm(name, [
    'agarre cerrado', 'agarre estrecho', 'close grip', 'close-grip', 'bankdrucken eng', 'jm press', 'tate press'
  ]) || (hasAnyTerm(name, ['fondos', 'dips', 'dip']) && !hasAnyTerm(name, ['pecho', 'chest']));

  if (isCloseGripOrDip) {
    return { primary: ['triceps'], secondary: ['chest', 'shoulders'] };
  }

  if (hasAnyTerm(name, [
    'tricep', 'trizeps', 'pushdown', 'press frances', 'frenchpress', 'french press',
    'skullcrusher', 'skull crusher', 'rompecraneos', 'kickback', 'patada de tricep',
    'extension de tricep', 'extensiones de tricep', 'copa'
  ])) {
    return { primary: ['triceps'], secondary: [] };
  }

  // 2. Bíceps (aislamiento)
  const isLegOrOtherCurl = hasAnyTerm(name, [
    'femoral', 'leg curl', 'curl de pierna', 'hamstring', 'isquio', 'beinbeuger',
    'nordic', 'nordico', 'jefferson', 'wrist', 'muneca', 'antebrazo', 'forearm', 'neck', 'cuello', 'abdominal'
  ]);
  if (!isLegOrOtherCurl && (hasAnyTerm(name, [
    'bicep', 'bizeps', 'predicador', 'preacher', 'scott', 'spider curl', 'concentrado',
    'concentration', 'hammer', 'martillo', 'zottman', 'bayesian', 'bayesiano', 'waiter curl'
  ]) || name.includes('curl'))) {
    return { primary: ['biceps'], secondary: [] };
  }

  // 3. Pecho (compuestos de empuje vs aislamiento)
  if (hasAnyTerm(name, [
    'apertura', 'fly', 'fliegende', 'butterfly', 'pec deck', 'contractor', 'contratista',
    'cruce de polea', 'cruces en polea', 'crossover', 'cross over', 'kabelcross', 'svend'
  ])) {
    return { primary: ['chest'], secondary: [] };
  }

  if (hasAnyTerm(name, [
    'bench press', 'press de banca', 'press banca', 'bankdrucken', 'schragbankdrucken',
    'negativ bankdrucken', 'incline press', 'decline press', 'press inclinado', 'press declinado',
    'chest press', 'press de pecho', 'press pecho', 'push up', 'push-up', 'flexion', 'lagartija',
    'floor press', 'hex press', 'spoto', 'guillotine', 'fondos en paralelas para pecho', 'chest dip'
  ])) {
    return { primary: ['chest'], secondary: ['triceps', 'shoulders'] };
  }

  // 4. Hombros (empuje vertical vs elevaciones/aislamiento)
  if (hasAnyTerm(name, [
    'military press', 'press militar', 'overhead press', 'shoulder press', 'press de hombro',
    'press hombro', 'arnold press', 'press arnold', 'schulterdrucken', 'schultermaschine',
    'push press', 'viking press', 'z press', 'handstand push'
  ])) {
    return { primary: ['shoulders'], secondary: ['triceps'] };
  }

  if (hasAnyTerm(name, [
    'face pull', 'facepull', 'pajaro', 'rear delt', 'deltoides posterior', 'reverse fly',
    'vuelos posteriores', 'remo al menton', 'upright row', 'rudern aufrecht'
  ])) {
    return { primary: ['shoulders'], secondary: ['back'] };
  }

  if (hasAnyTerm(name, [
    'elevacion lateral', 'elevaciones laterales', 'lateral raise', 'seitheben',
    'elevacion frontal', 'elevaciones frontales', 'front raise', 'frontheben',
    'encogimiento', 'shrug', 'y raise', 'lu raise', 'hombro', 'shoulder', 'deltoid'
  ])) {
    return { primary: ['shoulders'], secondary: [] };
  }

  // 5. Espalda (tracción vertical/horizontal vs aislamiento/lumbar)
  if (hasAnyTerm(name, ['pullover', 'pull over', 'straight arm pulldown', 'jalon con brazos rectos'])) {
    return {
      primary: [name.includes('mancuerna') ? 'chest' : 'back'],
      secondary: [name.includes('mancuerna') ? 'back' : 'chest']
    };
  }

  if (hasAnyTerm(name, ['hyperextension', 'hiperextension', 'back extension', 'extension lumbar', 'superman', 'rack pull'])) {
    return { primary: ['back'], secondary: ['gluteal', 'hamstring'] };
  }

  if (hasAnyTerm(name, [
    'pull up', 'pull-up', 'pullup', 'chin up', 'chin-up', 'chinup', 'dominada', 'klimmzuge',
    'lat pulldown', 'pulldown', 'jalon', 'latzug', 'row', 'remo', 'rudern', 'long pulley',
    'seal row', 'pendlay', 't bar', 'barra t', 'meadows', 'kroc', 'espalda', 'dorsal'
  ])) {
    return { primary: ['back'], secondary: ['biceps'] };
  }

  // 6. Pierna: Isquios / Bisagra de cadera / Peso muerto
  if (hasAnyTerm(name, [
    'romanian deadlift', 'rdl', 'peso muerto rumano', 'stiff leg', 'piernas rigidas',
    'good morning', 'buenos dias', 'glute ham raise', 'ghr'
  ])) {
    return { primary: ['hamstring'], secondary: ['gluteal', 'back'] };
  }

  if (hasAnyTerm(name, [
    'leg curl', 'curl femoral', 'curl de pierna', 'isquio', 'hamstring', 'beinbeuger', 'nordic', 'nordico'
  ])) {
    return { primary: ['hamstring'], secondary: [] };
  }

  if (hasAnyTerm(name, ['deadlift', 'peso muerto', 'kreuzheben'])) {
    if (name.includes('sumo')) {
      return { primary: ['gluteal', 'hamstring'], secondary: ['quadriceps', 'back'] };
    }
    return { primary: ['back', 'hamstring'], secondary: ['gluteal'] };
  }

  // 7. Pierna: Glúteos
  if (hasAnyTerm(name, ['hip thrust', 'glute bridge', 'puente de gluteo', 'puente gluteo', 'kas glute', 'pull through'])) {
    return { primary: ['gluteal'], secondary: ['hamstring'] };
  }

  if (hasAnyTerm(name, [
    'patada de gluteo', 'glute kickback', 'kickback de gluteo', 'abduccion', 'abductor',
    'abduktor', 'monster walk', 'clamshell', 'frog pump', 'gluteo', 'glute'
  ])) {
    return { primary: ['gluteal'], secondary: [] };
  }

  // 8. Pierna: Cuádriceps (aislamiento vs compuestos)
  if (hasAnyTerm(name, [
    'leg extension', 'extension de cuadriceps', 'extensiones de cuadriceps',
    'extension de pierna', 'beinstrecker', 'sissy'
  ])) {
    return { primary: ['quadriceps'], secondary: [] };
  }

  if (hasAnyTerm(name, [
    'squat', 'sentadilla', 'kniebeuge', 'leg press', 'prensa', 'beinpresse', 'hack',
    'lunge', 'zancada', 'estocada', 'ausfallschritte', 'bulgara', 'bulgarian',
    'step up', 'subida al cajon', 'goblet', 'wall ball', 'thruster'
  ])) {
    return {
      primary: ['quadriceps'],
      secondary: name.includes('thruster') ? ['gluteal', 'shoulders'] : ['gluteal', 'hamstring']
    };
  }

  // 9. Gemelos
  if (hasAnyTerm(name, ['calf', 'calves', 'gemelo', 'pantorrilla', 'soleo', 'soleus', 'waden', 'elevacion de talon'])) {
    return { primary: ['calves'], secondary: [] };
  }

  // 10. Core
  if (hasAnyTerm(name, [
    'crunch', 'plank', 'plancha', 'sit up', 'sit-up', 'abdominal', 'ab wheel', 'rueda abdominal',
    'russian twist', 'giro ruso', 'pallof', 'woodchop', 'lenador', 'leg raise', 'elevacion de pierna',
    'hanging knee', 'toes to bar', 'beinheben', 'hollow', 'dead bug', 'bird dog', 'v-up', 'dragon flag', 'core'
  ])) {
    return { primary: ['core'], secondary: [] };
  }

  return null;
};

const classifyExerciseMuscles = (exercise) => {
  const rawNormalized = getExerciseMuscles(exercise);
  const inferred = inferMusclesFromExerciseName(exercise.name);

  const mappedFromField = [];
  const unmappedFromField = [];

  rawNormalized.forEach(normKey => {
    const canonical = ALIAS_TO_MUSCLE.get(normKey);
    if (canonical) {
      if (!mappedFromField.includes(canonical)) mappedFromField.push(canonical);
    } else if (!unmappedFromField.includes(normKey)) {
      unmappedFromField.push(normKey);
    }
  });

  if (inferred) {
    const primary = [...new Set(inferred.primary)];
    const secondary = [
      ...new Set([
        ...inferred.secondary,
        ...mappedFromField.filter(key => !primary.includes(key))
      ])
    ];
    return { primary, secondary, extra: unmappedFromField };
  }

  if (mappedFromField.length > 0) {
    return {
      primary: [mappedFromField[0]],
      secondary: mappedFromField.slice(1),
      extra: unmappedFromField
    };
  }

  return { primary: [], secondary: [], extra: unmappedFromField };
};

// Peso que aporta una serie indirecta/sinergista para alcanzar el volumen mínimo efectivo
const INDIRECT_SET_FACTOR = 0.35;

const formatMuscleTag = (rawTag = '') => {
  const clean = String(rawTag).trim();
  if (!clean) return '';
  const lower = clean.toLowerCase();
  if (MUSCLE_NAMES_ES[lower]) return MUSCLE_NAMES_ES[lower];
  const canonical = ALIAS_TO_MUSCLE.get(normalizeKey(clean));
  if (canonical && MUSCLE_BY_KEY.has(canonical)) {
    return MUSCLE_BY_KEY.get(canonical).label;
  }
  return clean.replace(/[_-]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
};

const WeeklyMuscleVolumeCard = ({ routines = [], goal }) => {
  const { t } = useTranslation(['exercise_names']);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMuscleKey, setSelectedMuscleKey] = useState(null);
  const goalRange = getGoalRange(goal);

  useModalLock(Boolean(selectedMuscleKey));

  const volumeRows = useMemo(() => {
    const directTotals = Object.fromEntries(TRACKED_MUSCLES.map(muscle => [muscle.key, 0]));
    const indirectTotals = Object.fromEntries(TRACKED_MUSCLES.map(muscle => [muscle.key, 0]));
    const contributionsByMuscle = Object.fromEntries(TRACKED_MUSCLES.map(muscle => [muscle.key, []]));
    const detectedSubMuscles = Object.fromEntries(TRACKED_MUSCLES.map(muscle => [muscle.key, new Set()]));
    const extraMuscles = new Map();
    let routinesCounted = 0;

    (Array.isArray(routines) ? routines : []).forEach((routine, routineIdx) => {
      const exercises = getRoutineExercises(routine);
      if (exercises.length === 0) return;

      routinesCounted += 1;
      const routineId = routine.id ?? `routine-${routineIdx}`;
      const routineName = routine.name || routine.routine_name || `Rutina ${routineIdx + 1}`;

      exercises.forEach((exercise, exIdx) => {
        const sets = getPlannedSets(exercise);
        if (!sets) return;

        const { primary, secondary, extra } = classifyExerciseMuscles(exercise);
        const rawMuscleString = exercise.muscle_group || exercise.exercise?.muscle_group || exercise.exercise_details?.muscle_group || exercise.target || '';
        const rawTokens = Array.isArray(rawMuscleString)
          ? rawMuscleString
          : String(rawMuscleString).split(/[,;/]/).map(s => s.trim()).filter(Boolean);

        const rawLabels = [...new Set(rawTokens.map(formatMuscleTag).filter(Boolean))];
        const primaryLabels = primary.map(key => MUSCLE_BY_KEY.get(key)?.label || formatMuscleTag(key));
        const secondaryLabels = secondary.map(key => MUSCLE_BY_KEY.get(key)?.label || formatMuscleTag(key));

        primary.forEach(canonicalKey => {
          if (canonicalKey in directTotals) {
            directTotals[canonicalKey] += sets;
            rawLabels.forEach(lbl => {
              if (ALIAS_TO_MUSCLE.get(normalizeKey(lbl)) === canonicalKey) {
                detectedSubMuscles[canonicalKey].add(lbl);
              }
            });
            contributionsByMuscle[canonicalKey].push({
              id: `${routineId}-${exIdx}-direct`,
              routineId,
              routineName,
              rawExerciseName: exercise.name || 'Ejercicio',
              sets,
              role: 'direct',
              primaryLabels,
              secondaryLabels,
              rawLabels
            });
          }
        });

        secondary.forEach(canonicalKey => {
          if (canonicalKey in indirectTotals) {
            indirectTotals[canonicalKey] += sets;
            rawLabels.forEach(lbl => {
              if (ALIAS_TO_MUSCLE.get(normalizeKey(lbl)) === canonicalKey) {
                detectedSubMuscles[canonicalKey].add(lbl);
              }
            });
            contributionsByMuscle[canonicalKey].push({
              id: `${routineId}-${exIdx}-indirect`,
              routineId,
              routineName,
              rawExerciseName: exercise.name || 'Ejercicio',
              sets,
              role: 'indirect',
              primaryLabels,
              secondaryLabels,
              rawLabels
            });
          }
        });

        if (primary.length === 0 && secondary.length === 0) {
          extra.forEach(normalizedKey => {
            const rawLabel = String(exercise.muscle_group || exercise.exercise?.muscle_group || exercise.exercise_details?.muscle_group || exercise.target || normalizedKey);
            const label = MUSCLE_NAMES_ES[rawLabel] || rawLabel.replace(/[_-]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
            const existing = extraMuscles.get(normalizedKey);
            const nextContributions = [
              ...(existing?.contributions || []),
              {
                id: `${routineId}-${exIdx}-extra`,
                routineId,
                routineName,
                rawExerciseName: exercise.name || 'Ejercicio',
                sets,
                role: 'direct',
                primaryLabels: [label],
                secondaryLabels: [],
                rawLabels: [label]
              }
            ];
            extraMuscles.set(normalizedKey, {
              key: `extra:${normalizedKey}`,
              label,
              includedMuscles: [label],
              directSets: (existing?.directSets || 0) + sets,
              indirectSets: existing?.indirectSets || 0,
              contributions: nextContributions
            });
          });
        }
      });
    });

    const rows = [
      ...TRACKED_MUSCLES.map(muscle => {
        const extraDetected = Array.from(detectedSubMuscles[muscle.key] || []);
        const allIncluded = [...new Set([...(muscle.includedMuscles || [muscle.label]), ...extraDetected])];
        return {
          key: muscle.key,
          label: muscle.label,
          includedMuscles: allIncluded,
          directSets: directTotals[muscle.key],
          indirectSets: indirectTotals[muscle.key],
          contributions: contributionsByMuscle[muscle.key] || []
        };
      }),
      ...Array.from(extraMuscles.values())
    ];

    const withStatus = rows.map(row => {
      const directSets = Math.round(row.directSets * 10) / 10;
      const indirectSets = Math.round(row.indirectSets * 10) / 10;
      // Las series indirectas (ej. tríceps en press de banca o bíceps en dominadas)
      // aportan estímulo complementario hasta un tope razonable (60% del mínimo),
      // pero nunca disparan alertas de sobrevolumen por sí solas.
      const maxIndirectContribution = Math.ceil(goalRange.min * 0.6);
      const indirectContribution = Math.min(maxIndirectContribution, Math.round(indirectSets * INDIRECT_SET_FACTOR * 10) / 10);
      const effectiveSets = directSets >= goalRange.min
        ? directSets
        : Math.min(goalRange.max, Math.round((directSets + indirectContribution) * 10) / 10);

      // Solo marcamos exceso ("Por encima") cuando las series DIRECTAS superan el máximo
      const isOver = directSets > goalRange.max;
      const isBelow = effectiveSets < goalRange.min;
      const isNearMinimum = !isOver && !isBelow && effectiveSets < goalRange.min + 2 && directSets < goalRange.min;
      const status = isOver ? 'red' : isBelow || isNearMinimum ? 'orange' : 'green';

      let recommendation = 'Volumen dentro del rango recomendado para tu objetivo.';
      if (isOver) {
        const excess = Math.ceil(directSets - goalRange.max);
        recommendation = `Supera el máximo orientativo en ${excess} ${excess === 1 ? 'serie directa' : 'series directas'}. Revisa si puedes reducir o repartir ese volumen.`;
      } else if (isBelow) {
        const missing = Math.max(1, Math.ceil(goalRange.min - effectiveSets));
        if (directSets === 0 && indirectSets > 0) {
          recommendation = `Recibe trabajo indirecto en otros ejercicios (${indirectSets} ${indirectSets === 1 ? 'serie' : 'series'}, ≈ ${Math.round(indirectContribution)} efectivas). Añade unas ${missing} ${missing === 1 ? 'serie directa' : 'series directas'} si quieres cubrir el mínimo.`;
        } else if (directSets === 0) {
          recommendation = 'No hay series planificadas. Añade trabajo de forma progresiva si quieres incluir este músculo.';
        } else if (indirectSets > 0) {
          recommendation = `Con el apoyo indirecto (+${indirectSets} series) suma ≈ ${Math.round(effectiveSets)} series efectivas. Añade ${missing} ${missing === 1 ? 'serie directa' : 'series directas'} para llegar al mínimo.`;
        } else {
          recommendation = `Faltan aproximadamente ${missing} ${missing === 1 ? 'serie' : 'series'} para llegar al mínimo orientativo.`;
        }
      } else if (isNearMinimum) {
        recommendation = indirectSets > 0
          ? `Cumple el mínimo gracias al trabajo indirecto (+${indirectSets} series). Valora añadir 1–2 series directas si buscas priorizar este músculo.`
          : 'Está cerca del límite inferior. Valora añadir 1–2 series si recuperas bien.';
      } else if (directSets < goalRange.min && indirectSets > 0) {
        recommendation = `En rango combinando ${directSets} directas y ${indirectSets} indirectas (≈ ${Math.round(effectiveSets)} efectivas).`;
      }

      // Agrupar contribuciones por rutina para el modal de desglose
      const routineGroupsMap = new Map();
      (row.contributions || []).forEach(item => {
        const existingGroup = routineGroupsMap.get(item.routineId) || {
          routineId: item.routineId,
          routineName: item.routineName,
          directSets: 0,
          indirectSets: 0,
          exercises: []
        };
        if (item.role === 'direct') {
          existingGroup.directSets += item.sets;
        } else {
          existingGroup.indirectSets += item.sets;
        }
        existingGroup.exercises.push(item);
        routineGroupsMap.set(item.routineId, existingGroup);
      });

      return {
        ...row,
        sets: directSets,
        directSets,
        indirectSets,
        effectiveSets,
        indirectContribution,
        status,
        recommendation,
        routineGroups: Array.from(routineGroupsMap.values()),
        progress: Math.min(100, (effectiveSets / goalRange.max) * 100),
        statusLabel: status === 'red' ? 'Por encima' : status === 'orange' ? 'Ajustar' : 'En rango'
      };
    });

    const statusOrder = { red: 0, orange: 1, green: 2 };
    withStatus.sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || b.directSets - a.directSets || b.indirectSets - a.indirectSets);

    return { rows: withStatus, routinesCounted };
  }, [routines, goalRange]);

  const greenCount = volumeRows.rows.filter(row => row.status === 'green').length;
  const alertCount = volumeRows.rows.length - greenCount;
  const selectedRow = useMemo(
    () => volumeRows.rows.find(row => row.key === selectedMuscleKey) || null,
    [volumeRows.rows, selectedMuscleKey]
  );

  const translateExerciseName = (rawName = '') => {
    if (!rawName) return 'Ejercicio';
    return t(rawName, { ns: 'exercise_names', defaultValue: rawName });
  };

  return (
    <section className="mb-6 overflow-hidden rounded-[28px] border border-glass-border bg-bg-secondary shadow-sm">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls="weekly-muscle-volume-content"
        onClick={() => setIsExpanded(expanded => !expanded)}
        className={`flex w-full items-center justify-between gap-3 bg-gradient-to-br from-accent/10 via-bg-secondary to-bg-primary p-4 text-left transition-colors hover:brightness-[1.03] sm:p-5 ${isExpanded ? 'border-b border-glass-border' : ''}`}
      >
        <span className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Activity size={22} />
          </span>
          <span className="min-w-0">
            <span className="block font-extrabold text-text-primary">Volumen muscular semanal</span>
            <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
              {isExpanded
                ? 'Toca cualquier músculo para ver qué subgrupos cuentan en la suma y en qué rutina están.'
                : `${greenCount} músculos en rango · ${alertCount} a revisar`}
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-[11px] font-bold text-accent">
                <Target size={13} /> {goalRange.label}
              </span>
              <span className="rounded-full bg-black/5 px-3 py-1.5 text-[11px] font-bold text-text-secondary dark:bg-white/5">
                Rango: {goalRange.min}–{goalRange.max} series
              </span>
            </span>
          </span>
        </span>
        <ChevronDown size={20} className={`shrink-0 text-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <div id="weekly-muscle-volume-content" hidden={!isExpanded} className="p-4 sm:p-5">
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-black/5 p-3 dark:bg-white/5">
            <span className="block text-lg font-black text-text-primary">{volumeRows.routinesCounted}</span>
            <span className="text-[10px] font-semibold text-text-secondary">Rutinas/semana</span>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 p-3">
            <span className="block text-lg font-black text-emerald-600 dark:text-emerald-400">{greenCount}</span>
            <span className="text-[10px] font-semibold text-text-secondary">En rango</span>
          </div>
          <div className={`rounded-2xl p-3 ${alertCount ? 'bg-orange-500/10' : 'bg-black/5 dark:bg-white/5'}`}>
            <span className={`block text-lg font-black ${alertCount ? 'text-orange-600 dark:text-orange-400' : 'text-text-primary'}`}>{alertCount}</span>
            <span className="text-[10px] font-semibold text-text-secondary">A revisar</span>
          </div>
        </div>

        {volumeRows.routinesCounted === 0 ? (
          <div className="rounded-2xl border border-dashed border-glass-border px-4 py-6 text-center">
            <Dumbbell className="mx-auto mb-2 text-text-muted" size={22} />
            <p className="text-sm font-bold text-text-primary">Aún no hay rutinas con ejercicios</p>
            <p className="mt-1 text-xs text-text-secondary">Cuando añadas ejercicios, verás aquí las series semanales estimadas por músculo.</p>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {volumeRows.rows.map(row => {
              const colors = row.status === 'red'
                ? { text: 'text-red-600 dark:text-red-400', fill: 'bg-red-500', surface: 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10', icon: <AlertTriangle size={14} /> }
                : row.status === 'orange'
                  ? { text: 'text-orange-600 dark:text-orange-400', fill: 'bg-orange-500', surface: 'border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10', icon: <AlertTriangle size={14} /> }
                  : { text: 'text-emerald-600 dark:text-emerald-400', fill: 'bg-emerald-500', surface: 'border-emerald-500/15 bg-emerald-500/5 hover:bg-emerald-500/10', icon: <CheckCircle2 size={14} /> };

              return (
                <button
                  key={row.key}
                  type="button"
                  onClick={() => setSelectedMuscleKey(row.key)}
                  className={`group w-full rounded-2xl border p-3.5 text-left transition-all duration-200 active:scale-[0.99] ${colors.surface}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <h3 className="truncate text-sm font-bold text-text-primary">{row.label}</h3>
                      <ChevronRight size={14} className="shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className={`inline-flex shrink-0 items-center gap-1 text-[10px] font-bold ${colors.text}`}>
                      {colors.icon} {row.statusLabel}
                    </span>
                  </div>
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xl font-black tabular-nums ${colors.text}`}>{row.directSets}</span>
                      <span className="text-[10px] font-semibold text-text-muted">directas</span>
                      {row.indirectSets > 0 && (
                        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-text-secondary dark:bg-white/10">
                          +{row.indirectSets} ind.
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-text-muted">objetivo {goalRange.min}–{goalRange.max}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <div className={`h-full rounded-full ${colors.fill}`} style={{ width: `${row.progress}%` }} />
                  </div>
                  {(row.status !== 'green' || (row.directSets < goalRange.min && row.indirectSets > 0)) && (
                    <p className={`mt-2 text-[11px] leading-relaxed ${colors.text}`}>{row.recommendation}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-[10px] leading-relaxed text-text-muted">
          Toca cualquier músculo para ver el detalle por rutina y ejercicio. Se muestran las series directas y, aparte (+ind.), las de ejercicios compuestos donde actúa como músculo secundario. {goalRange.advice}
        </p>
      </div>

      {selectedRow && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 !pt-[calc(1rem+var(--safe-top,env(safe-area-inset-top,0px)))] sm:p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]"
            onClick={() => setSelectedMuscleKey(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="muscle-volume-breakdown-title"
              className="relative mt-auto mb-0 sm:my-0 w-[90%] sm:w-full max-w-lg max-h-[calc(90dvh-var(--safe-top,env(safe-area-inset-top,0px)))] sm:max-h-[85vh] flex flex-col bg-bg-primary rounded-t-[32px] rounded-b-none sm:rounded-[32px] border border-glass-border ring-1 ring-black/5 dark:ring-white/10 shadow-2xl overflow-hidden animate-[slide-up_0.3s_ease-out] sm:animate-[scale-in_0.2s_ease-out]"
              onClick={event => event.stopPropagation()}
            >
              {/* Barra indicadora de deslizar hacia abajo en móvil */}
              <div className="shrink-0 bg-bg-secondary pt-3 sm:hidden">
                <div
                  className="mx-auto mb-1 h-1.5 w-12 rounded-full bg-black/15 dark:bg-white/20"
                  aria-hidden="true"
                />
              </div>

              {/* Cabecera */}
              <div className="flex items-start justify-between gap-3 border-b border-glass-border bg-bg-secondary px-5 py-4 shrink-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="muscle-volume-breakdown-title" className="text-lg font-black text-text-primary sm:text-xl">
                      {selectedRow.label}
                    </h2>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      selectedRow.status === 'red'
                        ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                        : selectedRow.status === 'orange'
                          ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {selectedRow.status === 'red' || selectedRow.status === 'orange' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                      {selectedRow.statusLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    Objetivo semanal ({goalRange.label.toLowerCase()}): <span className="font-bold text-text-primary">{goalRange.min}–{goalRange.max} series</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMuscleKey(null)}
                  aria-label="Cerrar desglose"
                  className="rounded-full p-2 text-text-secondary transition hover:bg-bg-primary hover:text-text-primary border border-transparent hover:border-glass-border shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Contenido scrolleable */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 pb-[calc(1.5rem+var(--safe-bottom,env(safe-area-inset-bottom,0px)))] sm:pb-6 space-y-5">
                {/* Resumen numérico */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-2xl border border-glass-border bg-bg-secondary p-3 text-center">
                    <span className="block text-xl font-black tabular-nums text-text-primary">{selectedRow.directSets}</span>
                    <span className="text-[10px] font-bold text-text-secondary">Series directas</span>
                  </div>
                  <div className="rounded-2xl border border-glass-border bg-bg-secondary p-3 text-center">
                    <span className="block text-xl font-black tabular-nums text-text-secondary">+{selectedRow.indirectSets}</span>
                    <span className="text-[10px] font-bold text-text-secondary">Indirectas</span>
                  </div>
                  <div className="rounded-2xl border border-accent/20 bg-accent/10 p-3 text-center">
                    <span className="block text-xl font-black tabular-nums text-accent">{selectedRow.effectiveSets}</span>
                    <span className="text-[10px] font-bold text-accent">Efectivas est.</span>
                  </div>
                </div>

                {/* Músculos que cuentan en la suma */}
                <div className="rounded-2xl border border-glass-border bg-bg-secondary/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-text-secondary">
                    <Layers size={14} className="text-accent shrink-0" />
                    <span>Músculos que cuentan en la suma</span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {(selectedRow.includedMuscles || [selectedRow.label]).map(muscleName => (
                      <span
                        key={muscleName}
                        className="rounded-full border border-glass-border bg-bg-primary px-2.5 py-1 text-[11px] font-semibold text-text-primary"
                      >
                        {muscleName}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2.5 text-[11px] leading-relaxed text-text-secondary">
                    Las series donde <strong>{selectedRow.label.toLowerCase()}</strong> es el músculo principal suman al 100% como <strong>directas</strong>. Cuando participa como músculo secundario en ejercicios compuestos, se registran aparte como <strong>indirectas (+ind.)</strong>.
                  </p>
                </div>

                {/* Desglose por rutina */}
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-text-secondary">
                      <FolderKanban size={14} className="text-accent shrink-0" />
                      <span>Rutinas donde se trabaja ({selectedRow.routineGroups.length})</span>
                    </div>
                  </div>

                  {selectedRow.routineGroups.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-glass-border bg-bg-secondary/40 px-4 py-6 text-center">
                      <Dumbbell className="mx-auto mb-2 text-text-muted" size={20} />
                      <p className="text-xs font-bold text-text-primary">Sin ejercicios para {selectedRow.label.toLowerCase()}</p>
                      <p className="mt-1 text-[11px] text-text-secondary">
                        Ninguna de tus rutinas activas incluye ejercicios que trabajen este grupo muscular directa o indirectamente.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedRow.routineGroups.map(group => (
                        <div
                          key={group.routineId}
                          className="overflow-hidden rounded-2xl border border-glass-border bg-bg-secondary"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-glass-border bg-black/5 px-4 py-2.5 dark:bg-white/5">
                            <span className="truncate text-xs font-extrabold text-text-primary">
                              {group.routineName}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold">
                              {group.directSets > 0 && (
                                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-accent">
                                  {group.directSets} {group.directSets === 1 ? 'directa' : 'directas'}
                                </span>
                              )}
                              {group.indirectSets > 0 && (
                                <span className="rounded-full bg-black/10 px-2.5 py-0.5 text-text-secondary dark:bg-white/10">
                                  +{group.indirectSets} ind.
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="divide-y divide-glass-border">
                            {group.exercises.map(item => {
                              const isDirect = item.role === 'direct';
                              const otherPrimary = item.primaryLabels.filter(Boolean).join(', ');
                              const allInvolved = [
                                ...new Set([...item.primaryLabels, ...item.secondaryLabels, ...item.rawLabels])
                              ].filter(Boolean);

                              return (
                                <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-bold text-text-primary">
                                      {translateExerciseName(item.rawExerciseName)}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-text-secondary">
                                      {isDirect ? (
                                        <>
                                          Músculo principal: <span className="font-semibold text-text-primary">{otherPrimary || selectedRow.label}</span>
                                          {item.secondaryLabels.length > 0 && (
                                            <span className="text-text-muted"> · Secundario: {item.secondaryLabels.join(', ')}</span>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          Secundario en ejercicio de <span className="font-semibold text-text-primary">{otherPrimary || allInvolved[0] || 'compuesto'}</span>
                                        </>
                                      )}
                                    </p>
                                  </div>

                                  <span
                                    className={`shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-extrabold tabular-nums ${
                                      isDirect
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-black/5 text-text-secondary dark:bg-white/10'
                                    }`}
                                  >
                                    {isDirect ? `${item.sets} ${item.sets === 1 ? 'serie' : 'series'}` : `+${item.sets} ind.`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </section>
  );
};

export default WeeklyMuscleVolumeCard;
