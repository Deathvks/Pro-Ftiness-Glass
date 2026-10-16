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

const WeeklyMuscleVolumeCard = ({ routines = [], goal }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const goalRange = getGoalRange(goal);

  const volumeRows = useMemo(() => {
    const totals = Object.fromEntries(TRACKED_MUSCLES.map(muscle => [muscle.key, 0]));
    const extraMuscles = new Map();
    let routinesCounted = 0;

    (Array.isArray(routines) ? routines : []).forEach(routine => {
      const exercises = getRoutineExercises(routine);
      if (exercises.length === 0) return;

      routinesCounted += 1;
      exercises.forEach(exercise => {
        const sets = getPlannedSets(exercise);
        if (!sets) return;

        getExerciseMuscles(exercise).forEach(normalizedKey => {
          const canonicalKey = ALIAS_TO_MUSCLE.get(normalizedKey);
          if (canonicalKey) {
            totals[canonicalKey] += sets;
            return;
          }

          const rawLabel = String(exercise.muscle_group || exercise.exercise?.muscle_group || exercise.exercise_details?.muscle_group || exercise.target || normalizedKey);
          const label = MUSCLE_NAMES_ES[rawLabel] || rawLabel.replace(/[_-]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
          const existing = extraMuscles.get(normalizedKey);
          extraMuscles.set(normalizedKey, {
            key: `extra:${normalizedKey}`,
            label,
            sets: (existing?.sets || 0) + sets
          });
        });
      });
    });

    const rows = [
      ...TRACKED_MUSCLES.map(muscle => ({ key: muscle.key, label: muscle.label, sets: totals[muscle.key] })),
      ...Array.from(extraMuscles.values())
    ];

    const withStatus = rows.map(row => {
      const sets = Math.round(row.sets * 10) / 10;
      const isOver = sets > goalRange.max;
      const isBelow = sets < goalRange.min;
      const isNearMinimum = sets >= goalRange.min && sets < goalRange.min + 2;
      const status = isOver ? 'red' : isBelow || isNearMinimum ? 'orange' : 'green';
      const recommendation = isOver
        ? `Supera el máximo orientativo en ${Math.ceil(sets - goalRange.max)} ${Math.ceil(sets - goalRange.max) === 1 ? 'serie' : 'series'}. Revisa si puedes reducir o repartir ese volumen.`
        : isBelow
          ? sets === 0
            ? 'No hay series planificadas. Añade trabajo de forma progresiva si quieres incluir este músculo.'
            : `Faltan aproximadamente ${Math.ceil(goalRange.min - sets)} ${Math.ceil(goalRange.min - sets) === 1 ? 'serie' : 'series'} para llegar al mínimo orientativo.`
          : isNearMinimum
            ? 'Está cerca del límite inferior. Valora añadir 1–2 series si recuperas bien.'
            : 'Volumen dentro del rango recomendado para tu objetivo.';

      return {
        ...row,
        sets,
        status,
        recommendation,
        progress: Math.min(100, (sets / goalRange.max) * 100),
        statusLabel: status === 'red' ? 'Por encima' : status === 'orange' ? 'Ajustar' : 'En rango'
      };
    });

    const statusOrder = { red: 0, orange: 1, green: 2 };
    withStatus.sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || b.sets - a.sets);

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
                ? 'Suma las series planificadas en tus rutinas guardadas, contando cada rutina una vez por semana.'
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
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <span className={`text-xl font-black tabular-nums ${colors.text}`}>{row.sets}</span>
                    <span className="text-[10px] font-semibold text-text-muted">series planificadas · objetivo {goalRange.min}–{goalRange.max}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <div className={`h-full rounded-full ${colors.fill}`} style={{ width: `${row.progress}%` }} />
                  </div>
                  {row.status !== 'green' && (
                    <p className={`mt-2 text-[11px] leading-relaxed ${colors.text}`}>{row.recommendation}</p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-[10px] leading-relaxed text-text-muted">
          El cálculo usa las series definidas en cada rutina, no las series realizadas en tus entrenamientos. Si un ejercicio está asociado a varios músculos, sus series cuentan para cada uno. {goalRange.advice}
        </p>
      </div>
    </section>
  );
};

export default WeeklyMuscleVolumeCard;
