/* frontend/src/components/Workout/WorkoutExerciseList.jsx */
import React from 'react';
import { Link2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../GlassCard';
import WorkoutExerciseCard from './WorkoutExerciseCard';

/**
 * Componente que renderiza la lista de grupos de ejercicios (superseries).
 * Itera sobre los grupos y delega la renderización de cada ejercicio
 * a WorkoutExerciseCard.
 */
const WorkoutExerciseList = ({
  exerciseGroups,
  activeWorkoutExercises, // La lista plana de useAppStore
  hasWorkoutStarted,
  onSetSelectedExercise,
  onSetExerciseToReplace,
  // Nueva prop para pasar hacia abajo
  onShowHistory,

  // --- Props para pasar a WorkoutExerciseCard ---
  // Estas se pasarán "hacia abajo"
  baseInputClasses,
  onUpdateSet,
  onAddDropset,
  onRemoveDropset,
  onToggleWarmup, // <--- NUEVA PROP RECIBIDA
  onOpenRestModal,
  onDisabledInputClick,
  onDisabledButtonClick,
  normalizeDecimalInput,
}) => {
  const { t } = useTranslation('exercise_names');

  return (
    <div className="flex flex-col gap-6">
      {exerciseGroups.map((group, groupIndex) => (
        <GlassCard
          key={groupIndex}
          className={`p-1 rounded-lg ${group.length > 1 ? 'bg-accent/10 border border-accent/20' : ''
            }`}
        >
          {group.length > 1 && (
            <div className="flex items-center gap-2 p-3 text-accent font-semibold">
              <Link2 size={16} />
              <span>Superserie</span>
            </div>
          )}
          <div className="flex flex-col gap-4">
            {group.map((exercise) => {
              // BUGFIX: Usar 'exercise.id' (que es el routine_exercise_id)
              // para encontrar el índice real en la lista plana del store.
              const actualExIndex = activeWorkoutExercises.findIndex(
                (ex) => ex.id === exercise.id
              );

              // Fallback
              if (actualExIndex === -1) {
                console.error(
                  'Error: No se encontró el ejercicio en activeWorkout',
                  exercise
                );
                return null;
              }

              return (
                <WorkoutExerciseCard
                  key={actualExIndex}
                  t={t}
                  exercise={exercise}
                  actualExIndex={actualExIndex}
                  hasWorkoutStarted={hasWorkoutStarted}
                  onSetSelectedExercise={onSetSelectedExercise}
                  onSetExerciseToReplace={onSetExerciseToReplace}
                  onShowHistory={onShowHistory} // Pasamos la función

                  // Props para el grid (prop-drilling)
                  baseInputClasses={baseInputClasses}
                  onUpdateSet={onUpdateSet}
                  onAddDropset={onAddDropset}
                  onRemoveDropset={onRemoveDropset}
                  onToggleWarmup={onToggleWarmup} // <--- SE PASA AL CARD
                  onOpenRestModal={onOpenRestModal}
                  onDisabledInputClick={onDisabledInputClick}
                  onDisabledButtonClick={onDisabledButtonClick}
                  normalizeDecimalInput={normalizeDecimalInput}
                />
              );
            })}
          </div>
        </GlassCard>
      ))}
    </div>
  );
};

export default WorkoutExerciseList;