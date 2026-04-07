/* frontend/src/components/Workout/WorkoutExerciseCard.jsx */
import React, { useState } from 'react';
import { Repeat, Flame, History, Target, Bell } from 'lucide-react';
import ExerciseMedia from '../ExerciseMedia';
import WorkoutSetGrid from './WorkoutSetGrid';
import useAppStore from '../../store/useAppStore';
import { calculate1RM } from '../../utils/helpers';

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
  onShowHistory
  // ELIMINADO: onSaveReminder de las props
}) => {
  // AÑADIDO: setExerciseReminder extraído directamente del store global
  const { addWarmupSets, setExerciseReminder } = useAppStore(state => ({ 
    addWarmupSets: state.addWarmupSets,
    setExerciseReminder: state.setExerciseReminder 
  }));

  const [showWarmupInput, setShowWarmupInput] = useState(false);
  const [workingWeight, setWorkingWeight] = useState('');

  const [showReminderInput, setShowReminderInput] = useState(false);
  const [reminderText, setReminderText] = useState(exercise.reminder || '');

  const handleWarmupSubmit = (e) => {
    e.preventDefault();
    if (!workingWeight) return;
    addWarmupSets(actualExIndex, workingWeight);
    setShowWarmupInput(false);
    setWorkingWeight('');
  };

  const handleReminderSubmit = (e) => {
    e.preventDefault();
    // AÑADIDO: Llamamos a la función del store directamente
    if (setExerciseReminder) {
      setExerciseReminder(actualExIndex, reminderText);
    }
    setShowReminderInput(false);
  };

  const getWeight = (set) => parseFloat(set?.weight_kg || set?.weight || 0);
  const getReps = (set) => parseInt(set?.reps || 0, 10);

  let estimated1RM = parseFloat(exercise.last_performance?.estimated_1rm || 0);

  if (!estimated1RM || estimated1RM === 0) {
    if (exercise.last_performance?.sets?.length > 0) {
      const validSets = exercise.last_performance.sets.filter(s => getWeight(s) > 0 && getReps(s) > 0);

      if (validSets.length > 0) {
        let bestSet = validSets[0];
        for (let i = 1; i < validSets.length; i++) {
          if (getWeight(validSets[i]) > getWeight(bestSet)) {
            bestSet = validSets[i];
          }
        }
        
        const finalWeight = getWeight(bestSet);
        if (finalWeight > 0) {
          estimated1RM = calculate1RM(finalWeight, getReps(bestSet));
        }
      }
    }
  }

  return (
    <div className="p-4 sm:p-6 relative flex flex-col gap-6">
      
      {/* --- Imagen --- */}
      <button
        onClick={() => onSetSelectedExercise(exercise)}
        className="w-full text-left transition-transform active:scale-[0.99] group"
        title="Ver detalles del ejercicio"
      >
        <ExerciseMedia
          details={exercise.exercise_details}
          className="w-full lg:max-w-lg mx-auto mb-4 transition rounded-xl overflow-hidden relative shadow-sm border border-[--glass-border] dark:border-white/10 dark:filter dark:grayscale dark:brightness-110"
        />
      </button>

      {/* --- Recordatorio Activo (si existe) --- */}
      {exercise.reminder && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 dark:border-white/10 rounded-xl p-3 flex items-start gap-3 animate-fade-in shadow-sm">
          <Bell size={18} className="text-yellow-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider mb-0.5">Recordatorio / Meta</p>
            <p className="text-sm text-text-primary">{exercise.reminder}</p>
          </div>
        </div>
      )}

      {/* --- Contenedor de Textos --- */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => onSetSelectedExercise(exercise)}
          className="text-left group w-full"
        >
          <h3 className="text-2xl font-extrabold text-text-primary leading-tight group-hover:text-accent transition-colors break-words text-balance">
            {t(exercise.name, { ns: 'exercise_names' })}
          </h3>
        </button>

        <div className="flex flex-col gap-2">
          <p className="text-base font-semibold text-accent">
            {exercise.sets} series × {exercise.reps} reps
          </p>
          
          {/* 1RM Estimado del historial */}
          {estimated1RM > 0 && (
            <div className="flex w-fit items-center gap-1.5 bg-accent/10 border border-accent/20 dark:border-white/10 rounded-full px-3 py-1 animate-fade-in shadow-sm">
              <Target size={13} className="text-accent shrink-0" />
              <span className="text-xs font-bold text-accent">
                1RM Est: {estimated1RM}kg
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-[1px] bg-[--glass-border] dark:bg-white/10" />

      {/* --- Botonera Segmentada --- */}
      <div className="flex flex-wrap sm:flex-nowrap bg-bg-primary p-1 rounded-2xl border border-[--glass-border] dark:border-white/10 shadow-inner gap-1">
        
        {/* Historial */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onShowHistory) onShowHistory(exercise);
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-secondary hover:shadow-sm transition active:scale-95"
        >
          <History size={18} />
          <span className="text-xs font-semibold hidden sm:block">Historial</span>
        </button>

        <div className="w-[1px] bg-[--glass-border] dark:bg-white/10 my-2 hidden sm:block" />

        {/* Meta / Recordatorio */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasWorkoutStarted) setShowReminderInput(true);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition active:scale-95 ${
            hasWorkoutStarted
              ? 'text-text-secondary hover:text-yellow-500 hover:bg-yellow-500/10 hover:shadow-sm'
              : 'text-text-muted opacity-50 cursor-not-allowed'
          }`}
          disabled={!hasWorkoutStarted}
        >
          <Target size={18} className={hasWorkoutStarted && exercise.reminder ? "text-yellow-500" : ""} />
          <span className="text-xs font-semibold hidden sm:block">Meta</span>
        </button>

        <div className="w-[1px] bg-[--glass-border] dark:bg-white/10 my-2 hidden sm:block" />

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

        <div className="w-[1px] bg-[--glass-border] dark:bg-white/10 my-2 hidden sm:block" />

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
        onRemoveDropset={onRemoveDropset}
        onToggleWarmup={onToggleWarmup}
        onOpenRestModal={onOpenRestModal}
        onDisabledInputClick={onDisabledInputClick}
        onDisabledButtonClick={onDisabledButtonClick}
        normalizeDecimalInput={normalizeDecimalInput}
      />

      {/* MODAL RECORDATORIO */}
      {showReminderInput && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/60 backdrop-blur-md rounded-[2rem] animate-[fade-in_0.2s_ease-out]"
          onClick={() => setShowReminderInput(false)}
        >
          <div 
            className="bg-[--glass-bg] border border-[--glass-border] dark:border-white/10 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-[scale-in_0.2s_ease-out]" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 bg-yellow-500/10 rounded-full">
                <Target size={24} className="text-yellow-500" />
              </div>
            </div>
            
            <h4 className="text-xl font-bold text-center text-text-primary mb-1">
              Meta / Recordatorio
            </h4>
            <p className="text-xs text-center text-text-secondary mb-6 px-2">
              Añade un objetivo para tu próximo entrenamiento (ej. Levantar 100kg, intentar 1RM).
            </p>

            <form onSubmit={handleReminderSubmit} className="space-y-6">
              <div className="space-y-2">
                <textarea
                  autoFocus
                  value={reminderText}
                  onChange={(e) => setReminderText(e.target.value)}
                  className="w-full bg-bg-primary border border-[--glass-border] dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-text-primary focus:ring-2 focus:ring-accent focus:outline-none shadow-inner resize-none h-24"
                  placeholder="Escribe tu meta..."
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReminderInput(false)}
                  className="flex-1 py-3 rounded-xl border border-[--glass-border] dark:border-white/10 bg-bg-primary/50 text-text-primary font-semibold hover:bg-bg-secondary transition-colors active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-yellow-500 text-white font-bold hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-500/20 active:scale-95"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CALENTAMIENTO */}
      {showWarmupInput && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/60 backdrop-blur-md rounded-[2rem] animate-[fade-in_0.2s_ease-out]"
          onClick={() => setShowWarmupInput(false)}
        >
          <div 
            className="bg-[--glass-bg] border border-[--glass-border] dark:border-white/10 rounded-[2rem] p-6 w-full max-w-xs shadow-2xl animate-[scale-in_0.2s_ease-out]" 
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
                  className="w-full bg-bg-primary border border-[--glass-border] dark:border-white/10 rounded-2xl px-4 py-4 text-4xl font-black text-center text-text-primary focus:ring-2 focus:ring-accent focus:outline-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                  placeholder="0"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWarmupInput(false)}
                  className="flex-1 py-3 rounded-xl border border-[--glass-border] dark:border-white/10 bg-bg-primary/50 text-text-primary font-semibold hover:bg-bg-secondary transition-colors active:scale-95"
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