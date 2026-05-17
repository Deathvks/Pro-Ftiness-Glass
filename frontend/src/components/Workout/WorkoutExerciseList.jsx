/* frontend/src/components/Workout/WorkoutExerciseList.jsx */
import React from 'react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../GlassCard';
import WorkoutExerciseCard from './WorkoutExerciseCard';
import WorkoutSupersetCard from './WorkoutSupersetCard';

const WorkoutExerciseList = ({
  exerciseGroups,
  activeWorkoutExercises,
  hasWorkoutStarted,
  onSetSelectedExercise,
  onSetExerciseToReplace,
  onShowHistory,
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
    <div className="flex flex-col gap-6 sm:gap-8">
      {exerciseGroups.map((group, groupIndex) => {
        // --- CASO SUPERSERIE ---
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
        const exercise = group[0];
        const actualExIndex = activeWorkoutExercises.findIndex((ex) => ex.id === exercise.id);

        if (actualExIndex === -1) {
          console.error('Error: No se encontró el ejercicio en activeWorkout', exercise);
          return null;
        }

        return (
          <GlassCard 
            key={actualExIndex} 
            className="glass p-0 sm:p-2 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-lg transition-all"
          >
            <WorkoutExerciseCard
              t={t}
              exercise={exercise}
              actualExIndex={actualExIndex}
              hasWorkoutStarted={hasWorkoutStarted}
              onSetSelectedExercise={onSetSelectedExercise}
              onSetExerciseToReplace={onSetExerciseToReplace}
              onShowHistory={onShowHistory}
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