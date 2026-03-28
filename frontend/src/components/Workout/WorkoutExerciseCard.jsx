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
    <div className="p-4 sm:p-6 relative flex flex-col gap-6">
      
      {/* --- Imagen (Mantenido tamaño original, añadido efecto OLED gris en modo oscuro) --- */}
      <button
        onClick={() => onSetSelectedExercise(exercise)}
        className="w-full text-left transition-transform active:scale-[0.99] group"
        title="Ver detalles del ejercicio"
      >
        <ExerciseMedia
          details={exercise.exercise_details}
          className="w-full lg:max-w-lg mx-auto mb-4 transition rounded-xl overflow-hidden relative shadow-sm border border-glass-border dark:filter dark:grayscale dark:brightness-110"
        />
      </button>

      {/* --- Contenedor de Textos (Jerarquía iOS suave) --- */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => onSetSelectedExercise(exercise)}
          className="text-left group w-full"
        >
          <h3 className="text-2xl font-extrabold text-text-primary leading-tight group-hover:text-accent transition-colors break-words text-balance">
            {t(exercise.name, { ns: 'exercise_names' })}
          </h3>
        </button>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Objetivo */}
          <p className="text-base font-semibold text-accent">
            {exercise.sets} series × {exercise.reps} reps
          </p>
          
          {/* Historial (En pastilla suave) */}
          {exercise.last_performance && (
            <div className="flex items-center gap-2 bg-bg-primary/60 border border-[--glass-border] rounded-full px-3 py-1 animate-fade-in shadow-sm">
              <History size={13} className="text-accent shrink-0" />
              <span className="text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">
                  {new Date(exercise.last_performance.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}:
                </span>{' '}
                {formatLastPerformance(exercise.last_performance)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-[1px] bg-[--glass-border]" />

      {/* --- Botonera Segmentada (Estilo iOS unificado) --- */}
      <div className="flex bg-bg-primary p-1 rounded-2xl border border-[--glass-border] shadow-inner gap-1">
        
        {/* Historial */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onShowHistory) onShowHistory(exercise);
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-secondary hover:shadow-sm transition active:scale-95"
        >
          <History size={18} />
          <span className="text-xs font-semibold hidden sm:block">Ver Historial</span>
        </button>

        <div className="w-[1px] bg-[--glass-border] my-2" />

        {/* Calentar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasWorkoutStarted) setShowWarmupInput(true);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition active:scale-95 ${
            hasWorkoutStarted
              ? 'text-text-secondary hover:text-orange-500 hover:bg-orange-500/10 hover:shadow-sm'
              : 'text-text-muted opacity-50 cursor-not-allowed'
          }`}
          disabled={!hasWorkoutStarted}
        >
          <Flame size={18} className={hasWorkoutStarted ? "text-orange-500/80" : ""} />
          <span className="text-xs font-semibold hidden sm:block">Calentar</span>
        </button>

        <div className="w-[1px] bg-[--glass-border] my-2" />

        {/* Sustituir */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetExerciseToReplace(actualExIndex);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition active:scale-95 ${
            hasWorkoutStarted
              ? 'text-text-secondary hover:text-accent hover:bg-accent/10 hover:shadow-sm'
              : 'text-text-muted opacity-50 cursor-not-allowed'
          }`}
          disabled={!hasWorkoutStarted}
        >
          <Repeat size={18} />
          <span className="text-xs font-semibold hidden sm:block">Sustituir</span>
        </button>
      </div>

      <WorkoutSetGrid
        setsDone={exercise.setsDone}
        restSeconds={exercise.rest_seconds}
        actualExIndex={actualExIndex}
        hasWorkoutStarted={hasWorkoutStarted}
        baseInputClasses={baseInputClasses}
        onUpdateSet={onUpdateSet}
        onAddDropset={onAddDropset}
        onRemoveDropset={onRemoveDropset} // Mantener fix
        onToggleWarmup={onToggleWarmup}
        onOpenRestModal={onOpenRestModal}
        onDisabledInputClick={onDisabledInputClick}
        onDisabledButtonClick={onDisabledButtonClick}
        normalizeDecimalInput={normalizeDecimalInput}
      />

      {/* MODAL CALENTAMIENTO (Mantenido Glassmorphism) */}
      {showWarmupInput && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/60 backdrop-blur-md rounded-[2rem] animate-[fade-in_0.2s_ease-out]"
          onClick={() => setShowWarmupInput(false)}
        >
          <div 
            className="bg-[--glass-bg] border border-[--glass-border] rounded-[2rem] p-6 w-full max-w-xs shadow-2xl animate-[scale-in_0.2s_ease-out]" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 bg-orange-500/10 rounded-full">
                <Flame size={24} className="text-orange-500" />
              </div>
            </div>
            
            <h4 className="text-xl font-bold text-center text-text-primary mb-1">
              Calentamiento
            </h4>
            <p className="text-xs text-center text-text-secondary mb-6 px-2">
              Genera 3 series progresivas hacia tu peso objetivo.
            </p>

            <form onSubmit={handleWarmupSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider text-center block">
                  Peso Objetivo (kg)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  autoFocus
                  value={workingWeight}
                  onChange={(e) => setWorkingWeight(e.target.value)}
                  className="w-full bg-bg-primary border border-[--glass-border] rounded-2xl px-4 py-4 text-4xl font-black text-center text-text-primary focus:ring-2 focus:ring-accent focus:outline-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                  placeholder="0"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWarmupInput(false)}
                  className="flex-1 py-3 rounded-xl border border-[--glass-border] bg-bg-primary/50 text-text-primary font-semibold hover:bg-bg-secondary transition-colors active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 active:scale-95"
                >
                  Generar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutExerciseCard;