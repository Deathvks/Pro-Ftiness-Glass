/* frontend/src/components/Workout/WorkoutExerciseCard.jsx */
import React, { useState } from 'react';
import { Repeat, Flame, History } from 'lucide-react';
import ExerciseMedia from '../ExerciseMedia';
import WorkoutSetGrid from './WorkoutSetGrid';
import useAppStore from '../../store/useAppStore';

const WorkoutExerciseCard = ({
  t,
  exercise,
  actualExIndex,
  hasWorkoutStarted,
  onSetSelectedExercise,
  onSetExerciseToReplace,
  baseInputClasses,
  onUpdateSet,
  onAddDropset,
  onRemoveDropset,
  onToggleWarmup,
  onOpenRestModal,
  onDisabledInputClick,
  onDisabledButtonClick,
  normalizeDecimalInput,
  onShowHistory,
}) => {
  const { addWarmupSets } = useAppStore(state => ({ addWarmupSets: state.addWarmupSets }));

  const [showWarmupInput, setShowWarmupInput] = useState(false);
  const [workingWeight, setWorkingWeight] = useState('');

  const handleWarmupSubmit = (e) => {
    e.preventDefault();
    if (!workingWeight) return;
    addWarmupSets(actualExIndex, workingWeight);
    setShowWarmupInput(false);
    setWorkingWeight('');
  };

  const formatLastPerformance = (perf) => {
    if (!perf || !perf.sets || perf.sets.length === 0) return 'Sin datos';
    const validSets = perf.sets.filter(s => s.weight_kg > 0 && s.reps > 0);
    if (validSets.length === 0) return 'Sin series efectivas';
    return validSets.map(s => `${s.weight_kg}x${s.reps}`).join(', ');
  };

  return (
    <div className="p-4 relative">
      <button
        onClick={() => onSetSelectedExercise(exercise)}
        className="w-full text-left transition-transform active:scale-[0.99] group"
        title="Ver detalles del ejercicio"
      >
        <ExerciseMedia
          details={exercise.exercise_details}
          className="w-full lg:max-w-lg mx-auto mb-4 transition rounded-xl overflow-hidden relative shadow-sm border border-glass-border"
        />
      </button>

      <button
        onClick={() => onSetSelectedExercise(exercise)}
        className="w-full text-left mb-2 group"
      >
        <h3 className="text-lg font-semibold truncate group-hover:text-accent">
          {t(exercise.name, { ns: 'exercise_names' })}
        </h3>
      </button>

      <div className="flex items-end justify-between gap-3 mb-4">
        <button
          onClick={() => onSetSelectedExercise(exercise)}
          className="flex-1 min-w-0 text-left group flex flex-col gap-1"
          title="Ver detalles del ejercicio"
        >
          <span className="text-sm font-semibold text-accent">
            {exercise.sets} series × {exercise.reps} reps
          </span>

          {exercise.last_performance && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted/80 animate-fade-in">
              <History size={12} className="text-accent/70 shrink-0" />
              <span className="truncate">
                <span className="font-medium text-text-secondary">
                  {new Date(exercise.last_performance.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}:
                </span>{' '}
                {formatLastPerformance(exercise.last_performance)}
              </span>
            </div>
          )}
        </button>

        <div className="flex gap-2 items-center shrink-0">
          {/* Botón Historial */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onShowHistory) {
                onShowHistory(exercise);
              }
            }}
            className="p-2 rounded-xl transition shrink-0 bg-bg-primary text-text-secondary hover:text-accent hover:shadow-md hover:shadow-accent/10"
            title="Ver Historial"
          >
            <History size={18} />
          </button>

          {/* Botón Calentamiento - AHORA COINCIDE CON EL ESTILO */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasWorkoutStarted) setShowWarmupInput(true);
            }}
            // CAMBIO: Estilo igualado al de Historial y Reemplazar (bg-bg-primary, text-secondary)
            className={`p-2 rounded-xl transition shrink-0 ${hasWorkoutStarted
              ? 'bg-bg-primary text-text-secondary hover:text-accent hover:shadow-md hover:shadow-accent/10'
              : 'bg-bg-primary text-text-muted opacity-50 cursor-not-allowed'
              }`}
            title={hasWorkoutStarted ? "Generar series de calentamiento" : "Inicia el entrenamiento primero"}
            disabled={!hasWorkoutStarted}
          >
            <Flame size={18} />
          </button>

          {/* Botón Reemplazar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSetExerciseToReplace(actualExIndex);
            }}
            className={`p-2 rounded-xl transition shrink-0 ${hasWorkoutStarted
              ? 'bg-bg-primary text-text-secondary hover:text-accent hover:shadow-md hover:shadow-accent/10'
              : 'bg-bg-primary text-text-muted opacity-50 cursor-not-allowed'
              }`}
            title={hasWorkoutStarted ? 'Reemplazar ejercicio' : 'Inicia el cronómetro para reemplazar ejercicios'}
            disabled={!hasWorkoutStarted}
          >
            <Repeat size={18} />
          </button>
        </div>
      </div>

      {showWarmupInput && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm rounded-xl animate-fade-in"
          onClick={() => setShowWarmupInput(false)}
        >
          <div className="bg-bg-secondary border border-glass-border rounded-xl p-5 w-full max-w-xs shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold mb-1 flex items-center gap-2 text-text-primary">
              <Flame size={20} className="text-accent" />
              Calentamiento
            </h4>
            <p className="text-sm text-text-muted mb-4">
              Genera series (50%, 70%, 90%) según peso objetivo.
            </p>

            <form onSubmit={handleWarmupSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Peso de Trabajo (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  autoFocus
                  value={workingWeight}
                  onChange={(e) => setWorkingWeight(e.target.value)}
                  className="w-full bg-bg-primary border border-glass-border rounded-lg px-4 py-3 text-xl font-bold text-center text-text-primary focus:ring-2 focus:ring-accent focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWarmupInput(false)}
                  className="flex-1 py-2.5 rounded-lg border border-glass-border text-text-secondary font-medium hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-accent text-bg-secondary font-bold hover:bg-accent/80 transition-colors shadow-lg shadow-accent/20"
                >
                  Generar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <WorkoutSetGrid
        setsDone={exercise.setsDone}
        restSeconds={exercise.rest_seconds}
        actualExIndex={actualExIndex}
        hasWorkoutStarted={hasWorkoutStarted}
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
    </div>
  );
};

export default WorkoutExerciseCard;