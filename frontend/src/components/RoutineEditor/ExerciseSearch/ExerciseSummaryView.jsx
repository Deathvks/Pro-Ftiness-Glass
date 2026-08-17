/* frontend/src/components/RoutineEditor/ExerciseSearch/ExerciseSummaryView.jsx */
import React, { useMemo } from 'react';
import { ChevronLeft, Trash2, Check, Dumbbell, ListChecks } from 'lucide-react';
import ExerciseMedia from '../../ExerciseMedia';

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

  const inputClasses = "w-full text-center px-4 py-3.5 rounded-[16px] bg-bg-primary border-none ring-1 ring-black/5 dark:ring-white/10 focus:ring-2 focus:ring-accent/50 outline-none transition-all font-bold text-text-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
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
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 no-scrollbar pb-[calc(1.5rem+var(--safe-bottom))]">
        {stagedExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 mt-10 max-w-sm mx-auto text-center animate-[fade-in_0.3s_ease-out] bg-black/5 dark:bg-white/5 rounded-[32px] ring-1 ring-black/5 dark:ring-white/10">
            <div className="w-20 h-20 bg-bg-primary rounded-[24px] flex items-center justify-center mb-6 ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
              <ListChecks size={36} className="text-text-muted" />
            </div>
            <h3 className="text-xl font-extrabold text-text-primary mb-2">
              {t('exercise_ui:cart_empty', 'Sin selección')}
            </h3>
            <p className="text-text-secondary text-sm font-medium">
              Vuelve al buscador y añade algunos ejercicios a tu rutina.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stagedExercises.map((item) => {
              const translatedName = t(item.exercise.name, {
                ns: 'exercise_names',
                defaultValue: item.exercise.name,
              });

              const rawMuscleGroup = item.exercise.muscle_group || item.exercise.muscles || item.exercise.target || item.exercise.category || 'Other';
              const translatedMusclesList = rawMuscleGroup
                .split(',')
                .map((m) => t(m.trim(), { ns: 'exercise_muscles', defaultValue: m.trim() }));

              return (
                <div key={item.exercise.id} className="flex flex-col bg-black/5 dark:bg-white/5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 group overflow-hidden shadow-sm relative">
                  
                  {/* Trash Button - Absolute Top Right */}
                  <button
                    onClick={() => onRemove(item.exercise.id)}
                    className="absolute top-2 right-2 p-2.5 rounded-[16px] bg-red/90 backdrop-blur-md text-white hover:bg-red transition-all active:scale-95 z-20 shadow-lg ring-1 ring-white/20"
                    title="Eliminar"
                  >
                    <Trash2 size={18} strokeWidth={2.5} />
                  </button>

                  {/* Media (Top) */}
                  <div className="w-full aspect-square bg-transparent flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => onSelect(item.exercise)}>
                    <ExerciseMedia 
                      details={item.exercise}
                      fitMode="cover"
                      className="w-full h-full opacity-90 group-hover:opacity-100 transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>

                  {/* Content (Bottom) */}
                  <div className="flex flex-col p-4 bg-bg-primary/50 flex-1">
                    <p className="font-bold text-lg text-text-primary line-clamp-2 leading-tight mb-2">{translatedName}</p>
                    
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {translatedMusclesList.map((muscle, idx) => (
                        <span key={idx} className="bg-black/10 dark:bg-white/10 text-text-secondary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[6px]">
                          {muscle}
                        </span>
                      ))}
                    </div>

                    {/* Inputs */}
                    <div className="flex gap-2 sm:gap-3 mt-auto pt-4 border-t border-black/5 dark:border-white/10">
                      <div className="flex-1">
                        <label className={labelClasses}>{t('exercise_ui:sets', 'Series')}</label>
                        <input
                          type="number"
                          min="1"
                          value={item.sets}
                          onChange={(e) => onUpdate(item.exercise.id, 'sets', e.target.value)}
                          className={inputClasses + " !px-2"}
                        />
                      </div>
                      <div className="flex-1">
                        <label className={labelClasses}>{t('exercise_ui:reps', 'Reps')}</label>
                        <input
                          type="text"
                          value={item.reps}
                          onChange={(e) => onUpdate(item.exercise.id, 'reps', e.target.value)}
                          className={inputClasses + " !px-2"}
                        />
                      </div>
                      <div className="flex-1">
                        <label className={labelClasses}>{t('exercise_ui:rest_s', 'Desc. (s)')}</label>
                        <input
                          type="number"
                          min="0"
                          value={item.rest_seconds}
                          onChange={(e) => onUpdate(item.exercise.id, 'rest_seconds', e.target.value)}
                          className={inputClasses + " !px-2"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer (Finalizar) */}
      <div className="flex-shrink-0 p-6 border-t border-black/5 dark:border-white/10 bg-bg-primary/80 backdrop-blur-md pb-[calc(1.5rem+var(--safe-bottom))] md:pb-8">
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