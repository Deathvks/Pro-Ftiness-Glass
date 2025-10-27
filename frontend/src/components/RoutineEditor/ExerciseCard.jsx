/* frontend/src/components/RoutineEditor/ExerciseCard.jsx */
import React from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import GlassCard from '../GlassCard';
import ExerciseSearchInput from '../ExerciseSearchInput';
import { useTranslation } from 'react-i18next';

const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";

const ExerciseCard = ({
  exercise,
  exIndex,
  errors,
  onFieldChange,
  onExerciseSelect,
  removeExercise,
  dragHandleProps,
}) => {
  // --- INICIO DE LA MODIFICACIÓN ---
  // (No hay cambios aquí, tName y tMuscle ya estaban bien)
  const { t: tName } = useTranslation('exercise_names');
  const { t: tMuscle } = useTranslation('exercise_muscles');
  const { t: tCommon } = useTranslation('translation');

  // Obtenemos los valores traducidos
  const translatedName = tName(exercise.name, { defaultValue: exercise.name });
  const translatedMuscle = tMuscle(exercise.muscle_group, { defaultValue: exercise.muscle_group || '' });
  // --- FIN DE LA MODIFICACIÓN ---

  const handleExerciseSelected = (selectedExercise) => {
    // Esta función del hook (padre) actualizará el estado
    // Rellenará automáticamente el nombre Y el grupo muscular
    onExerciseSelect(exIndex, selectedExercise);
  };

  // --- INICIO DE LA MODIFICACIÓN ---
  // Quitamos 'pb-64' de GlassCard para arreglar el overlap
  return (
    <GlassCard className="p-4 bg-bg-secondary/50 relative">
  {/* --- FIN DE LA MODIFICACIÓN --- */}
      <div className="flex items-start gap-2 mb-4">
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="flex-shrink-0 pt-3 text-text-muted cursor-grab"
            title="Arrastrar para reordenar"
          >
            <GripVertical size={18} />
          </div>
        )}

        <div className="flex-grow">
          <ExerciseSearchInput
            initialQuery={translatedName} // Le pasamos el nombre guardado
            onExerciseSelect={handleExerciseSelected}
            // --- INICIO DE LA MODIFICACIÓN ---
            // Quitamos el onBlur de aquí. El hijo (ExerciseSearchInput)
            // gestionará su propio estado de blur/focus para revertir
            // el texto si no se selecciona nada.
            // --- FIN DE LA MODIFICACIÓN ---
          />
        </div>
        <div className="flex-shrink-0 pt-1">
          <button
            onClick={() => removeExercise(exercise.tempId)}
            className="p-2 h-full rounded-md text-text-muted hover:bg-red/20 hover:text-red transition"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <input
            type="number"
            placeholder={tCommon('Series', { defaultValue: 'Series' })}
            value={exercise.sets || ''}
            onChange={(e) => onFieldChange(exIndex, 'sets', e.target.value)}
            className={baseInputClasses}
          />
          {errors?.sets && <p className="text-red text-xs mt-1">{errors.sets}</p>}
        </div>
        <div>
          <input
            type="text"
            placeholder={tCommon('Reps (ej: 8-12)', { defaultValue: 'Reps (ej: 8-12)' })}
            value={exercise.reps || ''}
            onChange={(e) => onFieldChange(exIndex, 'reps', e.target.value)}
            className={baseInputClasses}
          />
          {errors?.reps && <p className="text-red text-xs mt-1">{errors.reps}</p>}
        </div>
        <input
          type="text"
          placeholder={tCommon('Grupo Muscular', { defaultValue: 'Grupo Muscular' })}
          // El valor viene del estado padre (traducido). Se rellenará automáticamente
          // cuando 'handleExerciseSelected' actualice el estado.
          value={translatedMuscle}
          onChange={(e) => onFieldChange(exIndex, 'muscle_group', e.target.value)}
          className={baseInputClasses}
        />
      </div>
    </GlassCard>
  );
};

export default ExerciseCard;
