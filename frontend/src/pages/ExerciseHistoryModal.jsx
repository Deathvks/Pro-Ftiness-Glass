/* frontend/src/pages/ExerciseHistoryModal.jsx */
import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../store/useAppStore';

export default function ExerciseHistoryModal({ exercise, onClose }) {
  // 1. Obtenemos el historial global desde el store
  const workoutLog = useAppStore((state) => state.workoutLog);

  const { t } = useTranslation('exercise_names');
  const { t: tCommon } = useTranslation('translation');

  // 2. Extraemos el nombre de forma segura
  const exerciseName = exercise?.name;

  const historyByDay = useMemo(() => {
    if (!exerciseName) return [];

    // Aseguramos que workoutLog sea un array válido
    const logs = Array.isArray(workoutLog) ? workoutLog : [];
    const groups = {};

    for (const log of logs) {
      // Filtramos por nombre de ejercicio
      const details = (log.WorkoutLogDetails || []).filter(d => d.exercise_name === exerciseName);
      if (!details.length) continue;

      const dateKey = new Date(log.workout_date).toISOString().split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];

      for (const d of details) {
        const sets = d.WorkoutLogSets && d.WorkoutLogSets.length > 0 ? d.WorkoutLogSets : [];
        sets.sort((a, b) => (a.set_number || 0) - (b.set_number || 0));
        groups[dateKey].push(...sets);
      }
    }

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .map(([dateKey, sets]) => ({ dateKey, sets }));
  }, [workoutLog, exerciseName]);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  if (!exercise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.25s_ease-out] p-4">
      {/* 3. Contenedor Modal Responsive:
          - max-h-[85vh] evita que se salga de la pantalla en móviles
          - flex-col para mantener header fijo y cuerpo scrollable 
      */}
      <div className="relative w-full max-w-lg md:max-w-2xl rounded-3xl border border-glass-border bg-bg-secondary shadow-2xl flex flex-col max-h-[85vh] md:max-h-[80vh] animate-scale-in overflow-hidden">

        {/* Header Fijo */}
        <div className="p-5 md:p-6 border-b border-glass-border flex justify-between items-start shrink-0 bg-bg-secondary z-10">
          <h2 className="text-xl md:text-2xl font-extrabold text-text-primary pr-8 leading-tight">
            {tCommon('Historial de', { defaultValue: 'Historial de' })}{' '}
            <span className="text-accent block md:inline mt-1 md:mt-0">
              {t(exerciseName, { defaultValue: exerciseName })}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors p-1"
            aria-label={tCommon('Cerrar', { defaultValue: 'Cerrar' })}
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="overflow-y-auto p-4 md:p-6 custom-scrollbar bg-bg-secondary/50">
          {historyByDay.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted opacity-60">
              <span className="text-4xl mb-3">📅</span>
              <p>{tCommon('No hay registros previos para este ejercicio.', { defaultValue: 'No hay registros previos para este ejercicio.' })}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {historyByDay.map(({ dateKey, sets }, idx) => (
                <div key={dateKey} className="animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <h3 className="text-accent/90 text-sm font-bold mb-3 uppercase tracking-wider flex items-center gap-2 sticky top-0 bg-bg-secondary/95 backdrop-blur py-2 z-10">
                    <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(var(--accent),0.5)]"></span>
                    {formatDate(dateKey)}
                  </h3>

                  <div className="space-y-2 pl-2 border-l-2 border-glass-border ml-1">
                    {sets.map((set, i) => (
                      <div
                        key={`${dateKey}-${i}`}
                        className="flex items-center justify-between rounded-xl px-4 py-3 bg-bg-primary/50 border border-glass-border/50 hover:border-accent/30 transition-colors ml-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-text-muted w-6">#{set.set_number ?? i + 1}</span>
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                            <span className="text-lg font-bold text-text-primary">
                              {Number(set.weight_kg ?? 0).toFixed(1).replace('.0', '')} <span className="text-xs text-text-secondary font-normal">kg</span>
                            </span>
                            <span className="hidden sm:inline text-text-muted/50">×</span>
                            <span className="text-base font-semibold text-text-secondary">
                              {Number(set.reps ?? 0)} <span className="text-xs font-normal">reps</span>
                            </span>
                          </div>
                        </div>

                        {set.is_dropset && (
                          <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-1 rounded-md border border-red-500/20 shadow-sm">
                            DROP
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer (Solo visible en móvil para facilitar el cierre con una mano) */}
        <div className="p-4 border-t border-glass-border md:hidden shrink-0 bg-bg-secondary z-10">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-bg-primary rounded-xl text-text-secondary font-semibold border border-glass-border active:scale-[0.98] transition-transform shadow-sm"
          >
            {tCommon('Cerrar', { defaultValue: 'Cerrar' })}
          </button>
        </div>
      </div>
    </div>
  );
}