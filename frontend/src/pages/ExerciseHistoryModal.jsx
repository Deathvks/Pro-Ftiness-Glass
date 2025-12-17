/* frontend/src/pages/ExerciseHistoryModal.jsx */
import React, { useMemo, useState } from 'react';
import { X, Calendar, Filter, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../store/useAppStore';
import CustomSelect from '../components/CustomSelect';

export default function ExerciseHistoryModal({ exercise, onClose }) {
  const workoutLog = useAppStore((state) => state.workoutLog);
  const { t } = useTranslation('exercise_names');
  const { t: tCommon } = useTranslation('translation');

  const exerciseName = exercise?.name;

  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');

  const { availableYears, availableMonths } = useMemo(() => {
    const yearsSet = new Set();
    const monthsSet = new Set();

    if (!exerciseName) return { availableYears: [], availableMonths: [] };

    const logs = Array.isArray(workoutLog) ? workoutLog : [];

    for (const log of logs) {
      const hasExercise = (log.WorkoutLogDetails || []).some(
        (d) => d.exercise_name === exerciseName
      );
      if (!hasExercise) continue;

      const date = new Date(log.workout_date);
      const year = date.getFullYear();
      const month = date.getMonth();

      yearsSet.add(year);

      if (selectedYear === 'all' || String(year) === String(selectedYear)) {
        monthsSet.add(month);
      }
    }

    return {
      availableYears: Array.from(yearsSet).sort((a, b) => b - a),
      availableMonths: Array.from(monthsSet).sort((a, b) => a - b),
    };
  }, [workoutLog, exerciseName, selectedYear]);

  const historyByDay = useMemo(() => {
    if (!exerciseName) return [];

    const logs = Array.isArray(workoutLog) ? workoutLog : [];
    const groups = {};

    for (const log of logs) {
      const details = (log.WorkoutLogDetails || []).filter(
        (d) => d.exercise_name === exerciseName
      );
      if (!details.length) continue;

      const date = new Date(log.workout_date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const dateKey = date.toISOString().split('T')[0];

      if (selectedYear !== 'all' && String(year) !== String(selectedYear)) continue;
      if (selectedMonth !== 'all' && String(month) !== String(selectedMonth)) continue;

      if (!groups[dateKey]) groups[dateKey] = [];

      for (const d of details) {
        const sets = d.WorkoutLogSets && d.WorkoutLogSets.length > 0 ? d.WorkoutLogSets : [];
        // Ordenar series por número
        sets.sort((a, b) => (a.set_number || 0) - (b.set_number || 0));
        groups[dateKey].push(...sets);
      }
    }

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .map(([dateKey, sets]) => ({ dateKey, sets }));
  }, [workoutLog, exerciseName, selectedYear, selectedMonth]);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // --- INICIO CAMBIO: Textos "Año" y "Mes" ---
  const yearOptions = [
    { value: 'all', label: 'Año' }, // Antes "Historial"
    ...availableYears.map((y) => ({ value: y, label: String(y) })),
  ];

  const monthOptions = [
    { value: 'all', label: 'Mes' }, // Antes "Todo el año"
    ...availableMonths.map((m) => ({ value: m, label: monthNames[m] })),
  ];
  // --- FIN CAMBIO ---

  React.useEffect(() => {
    if (selectedMonth !== 'all' && !availableMonths.includes(Number(selectedMonth))) {
      setSelectedMonth('all');
    }
  }, [selectedYear, availableMonths]);


  if (!exercise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fade-in_0.25s_ease-out] p-4">
      <div className="relative w-full max-w-lg md:max-w-2xl rounded-3xl bg-bg-secondary shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] animate-scale-in overflow-hidden">

        {/* Header Fijo */}
        <div className="p-5 md:p-6 flex flex-col gap-4 bg-bg-secondary z-10 shrink-0">
          <div className="flex justify-between items-start gap-4">
            <h2 className="text-xl md:text-2xl font-extrabold text-text-primary leading-tight break-words whitespace-normal">
              {tCommon('Historial de', { defaultValue: 'Historial de' })}{' '}
              <span className="text-accent block mt-1">
                {t(exerciseName, { defaultValue: exerciseName })}
              </span>
            </h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-full p-2 transition-colors -mr-2 -mt-2 shrink-0"
              aria-label={tCommon('Cerrar', { defaultValue: 'Cerrar' })}
            >
              <X size={24} />
            </button>
          </div>

          {/* Filtros */}
          <div className="flex flex-row gap-3">
            <div className="flex-1 min-w-[140px]">
              <CustomSelect
                value={selectedYear}
                onChange={setSelectedYear}
                options={yearOptions}
                placeholder="Año"
                className="w-full"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <CustomSelect
                value={selectedMonth}
                onChange={setSelectedMonth}
                options={monthOptions}
                placeholder="Mes"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Contenido Scrollable */}
        <div className="overflow-y-auto p-4 md:p-6 custom-scrollbar bg-bg-secondary">
          {historyByDay.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted opacity-60">
              <span className="text-4xl mb-3">📅</span>
              <p>
                {tCommon(
                  'No hay registros para los filtros seleccionados.',
                  { defaultValue: 'No hay registros para los filtros seleccionados.' }
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {historyByDay.map(({ dateKey, sets }, idx) => (
                <div
                  key={dateKey}
                  className="animate-fade-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <h3 className="text-accent/90 text-sm font-bold mb-3 uppercase tracking-wider flex items-center gap-2 sticky top-0 bg-bg-secondary py-2 z-10 rounded-md pl-1">
                    <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(var(--accent),0.5)]"></span>
                    {formatDate(dateKey)}
                  </h3>

                  <div className="space-y-2 pl-2 border-l-2 border-white/5 ml-1">
                    {sets.map((set, i) => (
                      <div
                        key={`${dateKey}-${i}`}
                        className="group flex items-center justify-between rounded-xl px-4 py-3 bg-bg-primary hover:bg-bg-primary/80 transition-all duration-200 ml-2 cursor-default shadow-sm"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <span className="text-xs font-bold text-text-muted w-6 group-hover:text-accent/70 transition-colors">
                            #{set.set_number ?? i + 1}
                          </span>

                          <div className="flex flex-row items-baseline gap-2 flex-wrap">
                            <span className="text-lg font-bold text-text-primary group-hover:scale-105 transition-transform origin-left">
                              {Number(set.weight_kg ?? 0)
                                .toFixed(1)
                                .replace('.0', '')}{' '}
                              <span className="text-xs text-text-secondary font-normal group-hover:text-text-primary transition-colors">
                                kg
                              </span>
                            </span>
                            <span className="text-text-muted/50 text-sm">×</span>
                            <span className="text-base font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
                              {Number(set.reps ?? 0)}{' '}
                              <span className="text-xs font-normal">reps</span>
                            </span>
                          </div>
                        </div>

                        {/* Badges para Calentamiento e Intensidad */}
                        <div className="flex flex-col gap-1 items-end shrink-0">
                          {/* Badge de Calentamiento */}
                          {set.is_warmup && (
                            <span className="bg-accent/10 text-accent text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                              <Flame size={10} strokeWidth={3} /> C
                            </span>
                          )}
                          {/* Badge de Dropset */}
                          {set.is_dropset && (
                            <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-1 rounded-md">
                              DROP
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Móvil */}
        <div className="p-4 md:hidden shrink-0 bg-bg-secondary z-10">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-bg-primary rounded-xl text-text-secondary font-semibold active:scale-[0.98] transition-transform shadow-sm hover:text-text-primary"
          >
            {tCommon('Cerrar', { defaultValue: 'Cerrar' })}
          </button>
        </div>
      </div>
    </div>
  );
}