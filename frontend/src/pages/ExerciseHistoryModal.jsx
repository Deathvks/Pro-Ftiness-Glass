/* frontend/src/pages/ExerciseHistoryModal.jsx */
import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // <-- Añadido

export default function ExerciseHistoryModal({ exerciseName, workoutLog = [], onClose }) {
  // --- Añadido ---
  const { t } = useTranslation('exercises'); // Para el nombre del ejercicio
  const { t: tCommon } = useTranslation('translation'); // Para UI general
  // --- Fin Añadido ---

  const historyByDay = useMemo(() => {
    const groups = {};
    for (const log of workoutLog || []) {
      // Filtra usando el 'exerciseName' original (sin traducir)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.25s_ease-out]">
      {/* ⬇️ más espacio en desktop */}
      <div className="relative w-full max-w-2xl m-4 sm:m-6 md:m-12 lg:m-16 rounded-3xl border border-[--glass-border] bg-bg-secondary shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"
          // --- Modificado ---
          aria-label={tCommon('Cerrar', { defaultValue: 'Cerrar' })}
          // --- Fin Modificado ---
        >
          <X size={22} />
        </button>

        {/* --- INICIO DE LA MODIFICACIÓN --- */}
        {/* Añadimos 'break-words' y traducimos */}
        <h2 className="text-2xl md:text-3xl font-extrabold text-center px-8 break-words">
          {tCommon('Historial de', { defaultValue: 'Historial de' })}{' '}
          {t(exerciseName, { defaultValue: exerciseName })}
        </h2>
        {/* --- FIN DE LA MODIFICACIÓN --- */}

        <div className="h-px bg-[--glass-border] my-4" />

        <div className="rounded-3xl bg-bg-primary border border-[--glass-border] p-4 md:p-5 max-h-[60vh] overflow-y-auto">
          {historyByDay.length === 0 ? (
            <div className="text-center text-text-muted py-12">
              {/* --- Modificado --- */}
              {tCommon('No hay series registradas para este ejercicio.', { defaultValue: 'No hay series registradas para este ejercicio.' })}
              {/* --- Fin Modificado --- */}
            </div>
          ) : (
            historyByDay.map(({ dateKey, sets }, idx) => (
              <div
                key={dateKey}
                className={idx > 0 ? 'pt-5 mt-5 border-t border-[--glass-border]' : ''}
              >
                <h3 className="text-accent font-bold mb-3 capitalize">
                  {formatDate(dateKey)}
                </h3>

                {sets.length === 0 ? (
                  // --- Modificado ---
                  <div className="text-text-muted text-sm">{tCommon('No se registraron series.', { defaultValue: 'No se registraron series.' })}</div>
                  // --- Fin Modificado ---
                ) : (
                  <ul className="space-y-3">
                    {sets.map((set, i) => (
                      <li
                        key={`${dateKey}-${i}`}
                        className="flex items-center justify-between rounded-2xl px-4 py-2 text-sm bg-bg-secondary/60 border border-[--glass-border]"
                      >
                        {/* --- Modificado --- */}
                        <span>
                          {tCommon('Serie', { defaultValue: 'Serie' })} {set.set_number ?? i + 1}:{' '}
                          <strong>{Number(set.reps ?? 0)} {tCommon('reps', { defaultValue: 'reps' })}</strong> {tCommon('con', 'con')}{' '}
                          <strong>{Number(set.weight_kg ?? 0).toFixed(2)} kg</strong>
                        </span>
                        {/* --- Fin Modificado --- */}

                        {set.is_dropset && (
                          <span className="ml-3 shrink-0 bg-accent/20 text-accent font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {tCommon('DROPSET', { defaultValue: 'DROPSET' })}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}