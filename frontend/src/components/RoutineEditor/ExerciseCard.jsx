import React, { useMemo } from 'react';
import { Trash2, GripVertical, Repeat, Sparkles } from 'lucide-react';
import GlassCard from '../GlassCard';
import ExerciseSearchInput from '../ExerciseSearchInput';
import { useTranslation } from 'react-i18next';
import EditableMuscleGroup from './EditableMuscleGroup';
import ExerciseMedia from '../ExerciseMedia';

const baseInputClasses = "w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[16px] px-3 py-3 text-text-primary focus:ring-2 focus:ring-accent/50 outline-none transition-all font-medium text-center placeholder:text-text-muted";
const baseLabelClasses = "block text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 text-center";

const ExerciseCard = ({
  exercise,
  errors,
  onFieldChange,
  onExerciseSelect,
  removeExercise,
  dragHandleProps,
  onReplaceClick,
}) => {
  const { t: tName } = useTranslation('exercise_names');
  const { t: tMuscles } = useTranslation('exercise_muscles');
  const { t: tCommon } = useTranslation('translation');

  const identifier = exercise.tempId || exercise.id;
  const translatedName = tName(exercise.name, { defaultValue: exercise.name });

  const displayMuscleGroup = useMemo(() => {
    if (exercise.is_manual) return exercise.muscle_group;
    if (!exercise.muscle_group) return '';

    return exercise.muscle_group
      .split(',')
      .map(m => tMuscles(m.trim(), { defaultValue: m.trim() }))
      .join(', ');
  }, [exercise.muscle_group, exercise.is_manual, tMuscles]);

  return (
    <GlassCard className="glass relative p-5 sm:p-6 rounded-[24px] border-none ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 hover:shadow-lg">
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
        
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="shrink-0 text-text-muted cursor-grab self-start mt-2 hover:text-text-primary transition-colors"
            title="Reordenar"
          >
            <GripVertical size={20} />
          </div>
        )}

        {/* CAMBIO AQUÍ: object-contain en lugar de object-cover y un pequeño padding (p-2) */}
        <ExerciseMedia
          details={exercise}
          className="shrink-0 w-full sm:w-32 md:w-40 h-40 sm:h-32 md:h-40 rounded-[20px] object-contain p-2 ring-1 ring-black/5 dark:ring-white/10 bg-black/5 dark:bg-white/5"
        />

        <div className="flex-1 min-w-0 w-full flex flex-col">
          <ExerciseSearchInput
            initialQuery={translatedName}
            onExerciseSelect={(ex) => onExerciseSelect(identifier, ex)}
            className="w-full pr-24 sm:pr-0" 
          />

          <div className="mt-4">
            <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">
              {tCommon('Grupo Muscular', { defaultValue: 'Grupo Muscular' })}
            </label>
            <EditableMuscleGroup
              initialValue={displayMuscleGroup || ''}
              onSave={(newValue) => onFieldChange(identifier, 'muscle_group', newValue)}
              isManual={exercise.is_manual}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div>
              <label className={baseLabelClasses}>{tCommon('Series', { defaultValue: 'Series' })}</label>
              <input
                type="number"
                min="1"
                placeholder="3"
                value={exercise.sets || ''}
                onChange={(e) => onFieldChange(identifier, 'sets', e.target.value)}
                className={baseInputClasses}
              />
              {errors?.sets && <p className="text-red-500 text-[10px] mt-1.5 font-medium text-center">{errors.sets}</p>}
            </div>

            <div>
              <label className={baseLabelClasses}>{tCommon('Reps', { defaultValue: 'Reps' })}</label>
              <input
                type="text"
                placeholder="8-12"
                value={exercise.reps || ''}
                onChange={(e) => onFieldChange(identifier, 'reps', e.target.value)}
                className={baseInputClasses}
              />
              {errors?.reps && <p className="text-red-500 text-[10px] mt-1.5 font-medium text-center">{errors.reps}</p>}
            </div>

            <div>
              <label className={baseLabelClasses}>{tCommon('Descanso (s)', { defaultValue: 'Descanso' })}</label>
              <input
                type="number"
                min="0"
                placeholder="60"
                value={exercise.rest_seconds || ''}
                onChange={(e) => onFieldChange(identifier, 'rest_seconds', e.target.value)}
                className={baseInputClasses}
              />
            </div>
          </div>

          {exercise.ai_reason && (
            <div className="mt-5 p-4 rounded-[16px] bg-accent/5 ring-1 ring-accent/20 flex gap-3 items-start">
              <Sparkles className="w-5 h-5 text-accent shrink-0" />
              <p className="text-xs font-medium text-text-primary leading-relaxed">{exercise.ai_reason}</p>
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4 sm:static flex sm:flex-col justify-end sm:justify-start gap-2 shrink-0">
          <button
            onClick={() => onReplaceClick(identifier)}
            className="p-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-accent/10 hover:text-accent transition-all active:scale-95"
            title="Reemplazar ejercicio"
          >
            <Repeat size={18} />
          </button>
          <button
            onClick={() => removeExercise(identifier)}
            className="p-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95"
            title="Eliminar ejercicio"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

export default ExerciseCard;