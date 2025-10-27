/* frontend/src/components/RoutineEditor/ExerciseSearch/ExerciseSummaryView.jsx */
import React from 'react';
import { ChevronLeft, Trash2, Check } from 'lucide-react';

// Componente para la vista de Resumen/Carrito
const ExerciseSummaryView = ({ stagedExercises, onBack, onUpdate, onRemove, onFinalize, t }) => {

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-glass-border">
        <button onClick={onBack} className="flex items-center gap-2 p-2 -m-2 rounded-lg hover:bg-white/10">
          <ChevronLeft size={24} />
          <span className="font-semibold">{t('exercise_ui:back', 'Volver')}</span>
        </button>
        <h2 className="text-xl font-bold">{t('exercise_ui:review_exercises', 'Revisar Ejercicios')}</h2>
        <div className="w-16"></div>
      </div>

      {/* Lista de ejercicios en carrito */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {stagedExercises.length === 0 ? (
          <p className="text-center text-text-muted pt-10">{t('exercise_ui:cart_empty', 'Tu carrito está vacío.')}</p>
        ) : (
          stagedExercises.map((item) => {
            // --- INICIO DE LA MODIFICACIÓN ---

            // 1. Traducir el nombre (usando namespace 'exercise_names')
            const translatedName = t(item.exercise.name, {
              ns: 'exercise_names',
              defaultValue: item.exercise.name,
            });

            // 2. Traducir grupo muscular (usando 'exercise_muscles')
            const muscleGroup = item.exercise.category || item.exercise.muscle_group;
            const translatedMuscle = t(`exercise_muscles:${muscleGroup}`, {
              defaultValue: muscleGroup,
            });
            
            // --- FIN DE LA MODIFICACIÓN ---

            return (
              <div key={item.exercise.id} className="bg-bg-secondary rounded-xl border border-glass-border p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={item.exercise.image_url_start || '/logo.webp'}
                    alt={`Imagen de ${translatedName}`}
                    className="w-12 h-12 rounded-md object-cover border border-glass-border"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{translatedName}</p> {/* Usar nombre traducido */}
                    <p className="text-sm text-text-muted capitalize">
                      {translatedMuscle} {/* Usar músculo traducido */}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(item.exercise.id)}
                    className="p-2 -m-2 text-text-muted hover:text-red"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex gap-4 mt-4">
                  <div>
                    <label className="text-xs text-text-muted">{t('exercise_ui:sets', 'Series')}</label>
                    <input
                      type="number"
                      value={item.sets}
                      onChange={(e) => onUpdate(item.exercise.id, 'sets', Number(e.target.value))}
                      className="w-full text-center px-3 py-2 rounded-md bg-bg-primary border border-glass-border"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted">{t('exercise_ui:reps', 'Reps')}</label>
                    <input
                      type="text"
                      value={item.reps}
                      onChange={(e) => onUpdate(item.exercise.id, 'reps', e.target.value)}
                      className="w-full text-center px-3 py-2 rounded-md bg-bg-primary border border-glass-border"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted">{t('exercise_ui:rest_s', 'Desc. (s)')}</label>
                    <input
                      type="number"
                      value={item.rest_time}
                      onChange={(e) => onUpdate(item.exercise.id, 'rest_time', Number(e.target.value))}
                      className="w-full text-center px-3 py-2 rounded-md bg-bg-primary border border-glass-border"
                    />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer (Finalizar) */}
      <div className="flex-shrink-0 p-4 border-t border-glass-border bg-bg-primary/80 backdrop-blur-sm">
        <button
          onClick={onFinalize}
          disabled={stagedExercises.length === 0}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-accent text-bg-secondary font-bold text-lg transition hover:scale-105 disabled:opacity-50"
        >
          <Check size={24} />
          {/* Usamos la interpolación 'count' de i18next para manejar singulares/plurales */}
          {t('exercise_ui:add_n_exercises', { count: stagedExercises.length })}
        </button>
      </div>
    </div>
  );
};

export default ExerciseSummaryView;