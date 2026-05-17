/* frontend/src/components/RoutineEditor/ExerciseSearch/ExerciseSummaryView.jsx */
import React, { useMemo } from 'react';
import { ChevronLeft, Trash2, Check, Dumbbell, ShoppingCart } from 'lucide-react';

// Componente para la vista de Resumen/Carrito
const ExerciseSummaryView = ({ stagedExercises, onBack, onUpdate, onRemove, onFinalize, t }) => {

  const isCartValid = useMemo(() => {
    if (stagedExercises.length === 0) {
      return false;
    }

    return stagedExercises.every(item => {
      const setsNum = parseInt(item.sets, 10);
      const isSetsValid = !isNaN(setsNum) && setsNum > 0;

      const repsVal = String(item.reps).trim();
      let isRepsValid = false;
      if (repsVal !== '') {
        const repsNum = parseInt(repsVal, 10);

        if (String(repsNum) === repsVal) {
          isRepsValid = repsNum > 0;
        } else {
          isRepsValid = true;
        }
      }

      const restNum = parseInt(item.rest_seconds, 10);
      const isRestValid = !isNaN(restNum) && restNum >= 0;

      return isSetsValid && isRepsValid && isRestValid;
    });
  }, [stagedExercises]);

  const inputClasses = "w-full text-center px-4 py-3.5 rounded-[16px] bg-bg-primary border-none ring-1 ring-black/5 dark:ring-white/10 focus:ring-2 focus:ring-accent/50 outline-none transition-all font-bold text-text-primary";
  const labelClasses = "block text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 text-center";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-6 sm:p-8 pb-4 border-b border-black/5 dark:border-white/10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 -ml-2 mb-4 rounded-full bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary transition-colors font-bold w-fit"
        >
          <ChevronLeft size={20} />
          <span>{t('exercise_ui:back', 'Volver')}</span>
        </button>
        <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight">
          {t('exercise_ui:review_exercises', 'Revisar Ejercicios')}
        </h2>
      </div>

      {/* Lista de ejercicios en carrito */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 custom-scrollbar">
        {stagedExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 mt-10 max-w-sm mx-auto text-center animate-[fade-in_0.3s_ease-out] bg-black/5 dark:bg-white/5 rounded-[32px] ring-1 ring-black/5 dark:ring-white/10">
            <div className="w-20 h-20 bg-bg-primary rounded-[24px] flex items-center justify-center mb-6 ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
              <ShoppingCart size={36} className="text-text-muted" />
            </div>
            <h3 className="text-xl font-extrabold text-text-primary mb-2">
              {t('exercise_ui:cart_empty', 'Tu carrito está vacío')}
            </h3>
            <p className="text-text-secondary text-sm font-medium">
              Vuelve al buscador y añade algunos ejercicios a tu rutina.
            </p>
          </div>
        ) : (
          stagedExercises.map((item) => {
            const translatedName = t(item.exercise.name, {
              ns: 'exercise_names',
              defaultValue: item.exercise.name,
            });

            // Prioridad: 1. muscle_group, 2. muscles, 3. target, 4. category, 5. 'Other'
            const rawMuscleGroup = item.exercise.muscle_group || item.exercise.muscles || item.exercise.target || item.exercise.category || 'Other';

            const translatedMuscle = rawMuscleGroup
              .split(',')
              .map((m) => {
                const trimmed = m.trim();
                return t(trimmed, {
                  ns: 'exercise_muscles',
                  defaultValue: trimmed,
                });
              })
              .join(', ');

            // Lógica de imagen/icono
            const displayImage = item.exercise.image_url_start;

            return (
              <div key={item.exercise.id} className="bg-black/5 dark:bg-white/5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 p-5 transition-all duration-300 hover:shadow-md group">
                <div className="flex items-start gap-4">
                  {/* Imagen o Icono */}
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={`Imagen de ${translatedName}`}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-[16px] object-contain p-1.5 ring-1 ring-black/5 dark:ring-white/10 bg-bg-primary shadow-sm transition-transform duration-300 group-hover:scale-105 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-[16px] bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center text-text-muted shadow-sm transition-transform duration-300 group-hover:scale-105 shrink-0">
                      <Dumbbell size={28} className="opacity-50" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 py-1">
                    <p className="font-bold text-base sm:text-lg text-text-primary truncate">{translatedName}</p>
                    <p className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider truncate mt-1">
                      {translatedMuscle}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => onRemove(item.exercise.id)}
                    className="p-3 rounded-[16px] bg-red/10 text-red hover:bg-red hover:text-white transition-all active:scale-95 shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 size={20} strokeWidth={2.5} />
                  </button>
                </div>
                
                <div className="flex gap-3 sm:gap-4 mt-5">
                  <div className="flex-1">
                    <label className={labelClasses}>{t('exercise_ui:sets', 'Series')}</label>
                    <input
                      type="number"
                      min="1"
                      value={item.sets}
                      onChange={(e) => onUpdate(item.exercise.id, 'sets', e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={labelClasses}>{t('exercise_ui:reps', 'Reps')}</label>
                    <input
                      type="text"
                      value={item.reps}
                      onChange={(e) => onUpdate(item.exercise.id, 'reps', e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={labelClasses}>{t('exercise_ui:rest_s', 'Desc. (s)')}</label>
                    <input
                      type="number"
                      min="0"
                      value={item.rest_seconds}
                      onChange={(e) => onUpdate(item.exercise.id, 'rest_seconds', e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer (Finalizar) */}
      <div className="flex-shrink-0 p-6 border-t border-black/5 dark:border-white/10 bg-bg-primary/80 backdrop-blur-md pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-8">
        <button
          onClick={onFinalize}
          disabled={stagedExercises.length === 0 || !isCartValid}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-[20px] bg-accent text-white font-bold text-base sm:text-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100 shadow-lg shadow-accent/20"
        >
          <Check size={24} strokeWidth={2.5} />
          {t('exercise_ui:add_n_exercises', { count: stagedExercises.length })}
        </button>
      </div>
    </div>
  );
};

export default ExerciseSummaryView;