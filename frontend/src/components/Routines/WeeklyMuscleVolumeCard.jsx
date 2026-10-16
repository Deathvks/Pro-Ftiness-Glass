import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ChevronDown, Dumbbell, Target } from 'lucide-react';
import { MUSCLE_NAMES_ES } from '../../utils/muscleUtils';

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
  { key: 'chest', label: 'Pecho', aliases: ['chest', 'pecho', 'pechos', 'pectoral', 'pectorals', 'pectoralis major', 'pectoral mayor'] },
  { key: 'back', label: 'Espalda', aliases: ['back', 'espalda', 'dorsal', 'dorsales', 'dorsal ancho', 'lats', 'latissimus dorsi', 'upper back', 'lower back', 'upper-back', 'lower-back', 'lumbar', 'lumbares'] },
  { key: 'shoulders', label: 'Hombros', aliases: ['shoulder', 'shoulders', 'hombro', 'hombros', 'deltoid', 'deltoids', 'deltoides', 'deltoides anterior', 'deltoides posterior', 'deltoides medio', 'anterior deltoid', 'posterior deltoid', 'front-deltoids', 'back-deltoids'] },
  { key: 'biceps', label: 'Bíceps', aliases: ['biceps', 'bíceps', 'biceps brachii', 'biceps braquial', 'brachialis', 'braquial'] },
  { key: 'triceps', label: 'Tríceps', aliases: ['triceps', 'tríceps', 'triceps brachii', 'tríceps braquial'] },
  { key: 'quadriceps', label: 'Cuádriceps', aliases: ['quadriceps', 'quadriceps femoris', 'quads', 'cuadriceps', 'cuádriceps'] },
  { key: 'hamstring', label: 'Isquios', aliases: ['hamstring', 'hamstrings', 'isquios', 'isquiotibiales', 'femorales', 'femoral', 'biceps femoris'] },
  { key: 'gluteal', label: 'Glúteos', aliases: ['gluteal', 'glutes', 'gluteos', 'glúteos', 'gluteo', 'glúteo', 'gluteus maximus'] },
  { key: 'calves', label: 'Gemelos', aliases: ['calves', 'calf', 'gemelos', 'gemelo', 'pantorrillas', 'pantorrilla', 'gastrocnemius', 'soleus'] },
  { key: 'core', label: 'Core', aliases: ['core', 'abs', 'abdominal', 'abdominales', 'abdominals', 'obliques', 'oblicuos', 'oblicuo'] }
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

const WeeklyMuscleVolumeCard = ({ routines = [], goal }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const goalRange = getGoalRange(goal);

  const volumeRows = useMemo(() => {
    const directTotals = Object.fromEntries(TRACKED_MUSCLES.map(muscle => [muscle.key, 0]));
    const indirectTotals = Object.fromEntries(TRACKED_MUSCLES.map(muscle => [muscle.key, 0]));
    const extraMuscles = new Map();
    let routinesCounted = 0;

    (Array.isArray(routines) ? routines : []).forEach(routine => {
      const exercises = getRoutineExercises(routine);
      if (exercises.length === 0) return;

      routinesCounted += 1;
      exercises.forEach(exercise => {
        const sets = getPlannedSets(exercise);
        if (!sets) return;

        const { primary, secondary, extra } = classifyExerciseMuscles(exercise);

        primary.forEach(canonicalKey => {
          if (canonicalKey in directTotals) {
            directTotals[canonicalKey] += sets;
          }
        });

        secondary.forEach(canonicalKey => {
          if (canonicalKey in indirectTotals) {
            indirectTotals[canonicalKey] += sets;
          }
        });

        if (primary.length === 0 && secondary.length === 0) {
          extra.forEach(normalizedKey => {
            const rawLabel = String(exercise.muscle_group || exercise.exercise?.muscle_group || exercise.exercise_details?.muscle_group || exercise.target || normalizedKey);
            const label = MUSCLE_NAMES_ES[rawLabel] || rawLabel.replace(/[_-]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
            const existing = extraMuscles.get(normalizedKey);
            extraMuscles.set(normalizedKey, {
              key: `extra:${normalizedKey}`,
              label,
              directSets: (existing?.directSets || 0) + sets,
              indirectSets: existing?.indirectSets || 0
            });
          });
        }
      });
    });

    const rows = [
      ...TRACKED_MUSCLES.map(muscle => ({
        key: muscle.key,
        label: muscle.label,
        directSets: directTotals[muscle.key],
        indirectSets: indirectTotals[muscle.key]
      })),
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

      return {
        ...row,
        sets: directSets,
        directSets,
        indirectSets,
        effectiveSets,
        status,
        recommendation,
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
                ? 'Distingue series directas e indirectas (como tríceps en press de banca o bíceps en remos) para no inflar el volumen.'
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
                ? { text: 'text-red-600 dark:text-red-400', fill: 'bg-red-500', surface: 'border-red-500/20 bg-red-500/5', icon: <AlertTriangle size={14} /> }
                : row.status === 'orange'
                  ? { text: 'text-orange-600 dark:text-orange-400', fill: 'bg-orange-500', surface: 'border-orange-500/20 bg-orange-500/5', icon: <AlertTriangle size={14} /> }
                  : { text: 'text-emerald-600 dark:text-emerald-400', fill: 'bg-emerald-500', surface: 'border-emerald-500/15 bg-emerald-500/5', icon: <CheckCircle2 size={14} /> };

              return (
                <article key={row.key} className={`rounded-2xl border p-3.5 ${colors.surface}`}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="truncate text-sm font-bold text-text-primary">{row.label}</h3>
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
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-[10px] leading-relaxed text-text-muted">
          Se muestran las series directas por músculo y, aparte (+ind.), las de ejercicios compuestos donde actúa como músculo secundario (p. ej. tríceps en press de banca o bíceps en dominadas). El trabajo indirecto ayuda a alcanzar el mínimo efectivo sin penalizar por exceso. {goalRange.advice}
        </p>
      </div>
    </section>
  );
};

export default WeeklyMuscleVolumeCard;
