/* frontend/src/components/Workout/WorkoutExerciseCard.jsx */
import React from 'react';
import { Repeat } from 'lucide-react';
import ExerciseMedia from '../ExerciseMedia';
import WorkoutSetGrid from './WorkoutSetGrid';

/**
 * Muestra la tarjeta para un único ejercicio dentro del entrenamiento.
 * Incluye la cabecera (media, título) y la cuadrícula de series (WorkoutSetGrid).
 */
const WorkoutExerciseCard = ({
  t, // i18n function 't'
  exercise,
  actualExIndex,
  hasWorkoutStarted,
  onSetSelectedExercise,
  onSetExerciseToReplace,

  // Props para pasar a WorkoutSetGrid
  baseInputClasses,
  onUpdateSet,
  onAddDropset,
  onRemoveDropset,
  onOpenRestModal,
  onDisabledInputClick,
  onDisabledButtonClick,
  normalizeDecimalInput,
}) => {
  return (
    <div className="p-4">
      {/* Botón que envuelve la media para abrir el modal */}
      <button
        onClick={() => onSetSelectedExercise(exercise)}
        className="w-full text-left transition-transform active:scale-[0.99] group"
        title="Ver detalles del ejercicio"
      >
        {/* MODIFICACIÓN: Cambiado 'rounded-lg' a 'rounded-xl' para asegurar bordes redondos */}
        <ExerciseMedia
          details={exercise.exercise_details}
          className="w-full lg:max-w-lg mx-auto mb-4 group-hover:brightness-110 transition rounded-xl overflow-hidden relative shadow-sm"
        />
      </button>

      {/* Contenedor flex para el título y el botón de reemplazar */}
      <div className="flex items-start justify-between gap-4 mb-4">
        {/* Botón que envuelve el título/texto para abrir el modal */}
        <button
          onClick={() => onSetSelectedExercise(exercise)}
          className="flex-1 min-w-0 text-left group"
          title="Ver detalles del ejercicio"
        >
          <h3 className="text-lg font-semibold truncate group-hover:text-accent">
            {t(exercise.name, { ns: 'exercise_names' })}
          </h3>
          <span className="text-sm font-semibold text-accent">
            {exercise.sets} series × {exercise.reps} reps
          </span>
        </button>

        {/* Botón de Reemplazar */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Evita que el click se propague
            onSetExerciseToReplace(actualExIndex);
          }}
          className={`p-2 rounded-md transition shrink-0 ${hasWorkoutStarted
              ? 'bg-bg-primary border border-glass-border text-text-secondary hover:text-accent hover:border-accent/50'
              : 'bg-bg-primary border border-glass-border text-text-muted opacity-50 cursor-not-allowed'
            }`}
          title={
            hasWorkoutStarted
              ? 'Reemplazar ejercicio'
              : 'Inicia el cronómetro para reemplazar ejercicios'
          }
          disabled={!hasWorkoutStarted}
        >
          <Repeat size={16} />
        </button>
      </div>

      {/* Delegamos la cuadrícula de series a su propio componente */}
      <WorkoutSetGrid
        setsDone={exercise.setsDone}
        restSeconds={exercise.rest_seconds}
        actualExIndex={actualExIndex}
        hasWorkoutStarted={hasWorkoutStarted}
        baseInputClasses={baseInputClasses}
        onUpdateSet={onUpdateSet}
        onAddDropset={onAddDropset}
        onRemoveDropset={onRemoveDropset}
        onOpenRestModal={onOpenRestModal}
        onDisabledInputClick={onDisabledInputClick}
        onDisabledButtonClick={onDisabledButtonClick}
        normalizeDecimalInput={normalizeDecimalInput}
      />
    </div>
  );
};

export default WorkoutExerciseCard;