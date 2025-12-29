/* frontend/src/components/Workout/WorkoutExerciseList.jsx */
import React from 'react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../GlassCard';
import WorkoutExerciseCard from './WorkoutExerciseCard';
import WorkoutSupersetCard from './WorkoutSupersetCard';

/**
 * Componente que renderiza la lista de grupos de ejercicios (superseries).
 * Decide si renderizar una tarjeta de superserie unificada o tarjetas individuales.
 */
const WorkoutExerciseList = ({
  exerciseGroups,
  activeWorkoutExercises, // La lista plana de useAppStore
  hasWorkoutStarted,
  onSetSelectedExercise,
  onSetExerciseToReplace,
  // Nueva prop para pasar hacia abajo
  onShowHistory,

  // --- Props para pasar a los hijos ---
  baseInputClasses,
  onUpdateSet,
  onAddDropset,
  onRemoveDropset,
  onToggleWarmup,
  onOpenRestModal,
  onDisabledInputClick,
  onDisabledButtonClick,
  normalizeDecimalInput,
}) => {
  const { t } = useTranslation('exercise_names');

  return (
    <div className="flex flex-col gap-6">
      {exerciseGroups.map((group, groupIndex) => {
        // --- CASO SUPERSERIE (Más de 1 ejercicio) ---
        if (group.length > 1) {
          return (
            <WorkoutSupersetCard
              key={`group-${groupIndex}`}
              group={group}
              allExercises={activeWorkoutExercises}
              t={t}
              hasWorkoutStarted={hasWorkoutStarted}
              onSetSelectedExercise={onSetSelectedExercise}
              onSetExerciseToReplace={onSetExerciseToReplace}
              onUpdateSet={onUpdateSet}
              onAddDropset={onAddDropset}
              onRemoveDropset={onRemoveDropset}
              onToggleWarmup={onToggleWarmup}
              onOpenRestModal={onOpenRestModal}
              onDisabledInputClick={onDisabledInputClick}
              onDisabledButtonClick={onDisabledButtonClick}
              baseInputClasses={baseInputClasses}
              onShowHistory={onShowHistory}
            />
          );
        }

        // --- CASO EJERCICIO INDIVIDUAL ---
        // Si el grupo solo tiene 1, extraemos ese ejercicio
        const exercise = group[0];

        // Buscamos el índice real en la lista plana para las actualizaciones del store
        const actualExIndex = activeWorkoutExercises.findIndex(
          (ex) => ex.id === exercise.id
        );

        // Fallback de seguridad
        if (actualExIndex === -1) {
          console.error(
            'Error: No se encontró el ejercicio en activeWorkout',
            exercise
          );
          return null;
        }

        return (
          <GlassCard key={actualExIndex} className="p-1 rounded-lg">
            <WorkoutExerciseCard
              t={t}
              exercise={exercise}
              actualExIndex={actualExIndex}
              hasWorkoutStarted={hasWorkoutStarted}
              onSetSelectedExercise={onSetSelectedExercise}
              onSetExerciseToReplace={onSetExerciseToReplace}
              onShowHistory={onShowHistory}
              // Props para el grid (prop-drilling)
              baseInputClasses={baseInputClasses}
              onUpdateSet={onUpdateSet}
              onAddDropset={onAddDropset}
              onRemoveDropset={onRemoveDropset}
              onToggleWarmup={onToggleWarmup}
              onOpenRestModal={onOpenRestModal}
              onDisabledInputClick={onDisabledInputClick}
              onDisabledButtonClick={onDisabledButtonClick}
              normalizeDecimalInput={normalizeDecimalInput}
            />
          </GlassCard>
        );
      })}
    </div>
  );
};

export default WorkoutExerciseList;