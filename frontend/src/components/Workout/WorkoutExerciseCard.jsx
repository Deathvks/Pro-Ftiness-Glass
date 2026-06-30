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
}) => {
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
    if (setExerciseReminder) {
      setExerciseReminder(actualExIndex, reminderText);
    }
    setShowReminderInput(false);
  };

  const getWeight = (set) => parseFloat(set?.weight_kg || set?.weight || 0);
  const getReps = (set) => parseInt(set?.reps || 0, 10);
  
  // NUEVO: Obtenemos el RIR para el cálculo avanzado de 1RM
  const getRir = (set) => {
    const val = parseFloat(set?.rir);
    return isNaN(val) ? 0 : val;
  };

  let estimated1RM = parseFloat(exercise.last_performance?.estimated_1rm || 0);

  // Si no viene calculado del backend, lo calculamos al vuelo mejorado con el RIR
  if (!estimated1RM || estimated1RM === 0) {
    if (exercise.last_performance?.sets?.length > 0) {
      const validSets = exercise.last_performance.sets.filter(s => getWeight(s) > 0 && getReps(s) > 0);

      if (validSets.length > 0) {
        let best1RM = 0;
        
        for (let i = 0; i < validSets.length; i++) {
          const weight = getWeight(validSets[i]);
          const reps = getReps(validSets[i]);
          const rir = getRir(validSets[i]);
          
          // Sumamos el RIR a las repeticiones para calcular el potencial real
          const effectiveReps = reps + rir;
          const current1RM = calculate1RM(weight, effectiveReps);
          
          if (current1RM > best1RM) {
            best1RM = current1RM;
          }
        }
        
        if (best1RM > 0) {
          estimated1RM = Math.round(best1RM * 100) / 100;
        }
      }
    }
  }

  return (
    <div className="p-4 sm:p-6 relative flex flex-col gap-6 sm:gap-8">
      
      {/* --- Imagen --- */}
      <button
        onClick={() => onSetSelectedExercise(exercise)}
        className="w-full text-left transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] group"
        title="Ver detalles del ejercicio"
      >
        <ExerciseMedia
          details={exercise}
          className="w-full lg:max-w-lg mx-auto mb-2 transition-all rounded-[24px] overflow-hidden relative shadow-lg ring-1 ring-black/5 dark:ring-white/10 dark:filter dark:grayscale dark:brightness-110"
        />
      </button>

      {/* --- Recordatorio Activo (si existe) --- */}
      {exercise.reminder && (
        <div className="bg-yellow-500/10 ring-1 ring-yellow-500/30 rounded-[20px] p-4 flex items-start gap-4 animate-[fade-in_0.3s_ease-out] shadow-sm">
          <div className="p-2 bg-yellow-500/20 rounded-[14px] shrink-0">
            <Bell size={20} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-[10px] sm:text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-1">Recordatorio / Meta</p>
            <p className="text-sm font-medium text-text-primary leading-relaxed">{exercise.reminder}</p>
          </div>
        </div>
      )}

      {/* --- Contenedor de Textos --- */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => onSetSelectedExercise(exercise)}
          className="text-left group w-full outline-none focus:outline-none"
        >
          <h3 className="text-3xl font-extrabold text-text-primary leading-tight group-hover:text-accent transition-colors break-words text-balance tracking-tight">
            {t(exercise.name, { ns: 'exercise_names' })}
          </h3>
        </button>

        <div className="flex flex-col gap-3">
          <p className="text-lg font-bold text-accent">
            {exercise.sets} series × {exercise.reps} reps
          </p>
          
          {/* 1RM Estimado del historial */}
          {estimated1RM > 0 && (
            <div className="flex w-fit items-center gap-2 bg-accent/10 ring-1 ring-accent/30 rounded-full px-4 py-2 animate-[fade-in_0.3s_ease-out] shadow-sm">
              <Target size={16} className="text-accent shrink-0" strokeWidth={2.5} />
              <span className="text-sm font-bold text-accent">
                1RM Est: {estimated1RM}kg
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-px bg-black/5 dark:bg-white/10" />

      {/* --- Botonera Segmentada sin bordes --- */}
      <div className="flex flex-wrap sm:flex-nowrap bg-black/5 dark:bg-white/5 p-1.5 rounded-[24px] shadow-inner gap-1 ring-1 ring-black/5 dark:ring-white/10">
        
        {/* Historial */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onShowHistory) onShowHistory(exercise);
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[20px] text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 hover:shadow-sm transition-all duration-300 active:scale-95 outline-none"
        >
          <History size={20} />
          <span className="text-sm font-bold hidden sm:block">Historial</span>
        </button>

        {/* Meta / Recordatorio */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasWorkoutStarted) setShowReminderInput(true);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[20px] transition-all duration-300 active:scale-95 outline-none ${
            hasWorkoutStarted
              ? 'text-text-secondary hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-500/10 hover:shadow-sm'
              : 'text-text-muted opacity-50 cursor-not-allowed'
          }`}
          disabled={!hasWorkoutStarted}
        >
          <Target size={20} className={hasWorkoutStarted && exercise.reminder ? "text-yellow-600 dark:text-yellow-400" : ""} />
          <span className="text-sm font-bold hidden sm:block">Meta</span>
        </button>

        {/* Calentar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasWorkoutStarted) setShowWarmupInput(true);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[20px] transition-all duration-300 active:scale-95 outline-none ${
            hasWorkoutStarted
              ? 'text-text-secondary hover:text-orange-500 hover:bg-orange-500/10 hover:shadow-sm'
              : 'text-text-muted opacity-50 cursor-not-allowed'
          }`}
          disabled={!hasWorkoutStarted}
        >
          <Flame size={20} className={hasWorkoutStarted ? "text-orange-500/80" : ""} />
          <span className="text-sm font-bold hidden sm:block">Calentar</span>
        </button>

        {/* Sustituir */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetExerciseToReplace(actualExIndex);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[20px] transition-all duration-300 active:scale-95 outline-none ${
            hasWorkoutStarted
              ? 'text-text-secondary hover:text-accent hover:bg-accent/10 hover:shadow-sm'
              : 'text-text-muted opacity-50 cursor-not-allowed'
          }`}
          disabled={!hasWorkoutStarted}
        >
          <Repeat size={20} />
          <span className="text-sm font-bold hidden sm:block">Sustituir</span>
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

      {/* --- MODAL RECORDATORIO --- */}
      {showReminderInput && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out] !pt-[calc(1rem+env(safe-area-inset-top,24px))] !pb-[calc(1rem+env(safe-area-inset-bottom,24px))]">
          <div className="absolute inset-0" onClick={() => setShowReminderInput(false)} />
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="glass bg-bg-primary w-full max-w-sm p-6 sm:p-8 rounded-t-[32px] sm:rounded-[32px] rounded-b-none sm:rounded-b-[32px] shadow-2xl relative z-10 animate-[slide-up_0.3s_ease-out] border-none ring-1 ring-black/5 dark:ring-white/10"
          >
            {/* Indicador de arrastre para móviles */}
            <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-6 sm:hidden" />

            <div className="flex flex-col items-center mb-6">
              <div className="p-3 bg-yellow-500/10 rounded-[20px] mb-4 ring-2 ring-yellow-500/30">
                <Target size={32} className="text-yellow-500" strokeWidth={1.5} />
              </div>
              <h4 className="text-2xl font-extrabold text-text-primary mb-2 tracking-tight text-center">
                Meta / Recordatorio
              </h4>
              <p className="text-sm font-medium text-text-secondary text-center px-2 leading-relaxed">
                Añade un objetivo para tu próximo entrenamiento (ej. Levantar 100kg).
              </p>
            </div>

            <form onSubmit={handleReminderSubmit} className="space-y-6 pb-6 sm:pb-0">
              <textarea
                autoFocus
                value={reminderText}
                onChange={(e) => setReminderText(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] px-5 py-4 text-sm font-medium text-text-primary focus:ring-2 focus:ring-accent/50 outline-none transition-all shadow-inner resize-none h-32 placeholder:text-text-muted"
                placeholder="Escribe tu meta..."
              />
              
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  className="w-full py-4 rounded-[20px] bg-yellow-500 text-white font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-yellow-500/20"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setShowReminderInput(false)}
                  className="w-full py-4 rounded-[20px] bg-black/5 dark:bg-white/5 text-text-primary font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CALENTAMIENTO --- */}
      {showWarmupInput && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out] !pt-[calc(1rem+env(safe-area-inset-top,24px))] !pb-[calc(1rem+env(safe-area-inset-bottom,24px))]">
          <div className="absolute inset-0" onClick={() => setShowWarmupInput(false)} />
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass bg-bg-primary w-full max-w-sm p-6 sm:p-8 rounded-t-[32px] sm:rounded-[32px] rounded-b-none sm:rounded-b-[32px] shadow-2xl relative z-10 animate-[slide-up_0.3s_ease-out] border-none ring-1 ring-black/5 dark:ring-white/10"
          >
            {/* Indicador de arrastre para móviles */}
            <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-6 sm:hidden" />

            <div className="flex flex-col items-center mb-6">
              <div className="p-3 bg-orange-500/10 rounded-[20px] mb-4 ring-2 ring-orange-500/30">
                <Flame size={32} className="text-orange-500" strokeWidth={1.5} />
              </div>
              <h4 className="text-2xl font-extrabold text-text-primary mb-2 tracking-tight text-center">
                Calentamiento
              </h4>
              <p className="text-sm font-medium text-text-secondary text-center px-2 leading-relaxed">
                Genera 3 series progresivas hacia tu peso objetivo.
              </p>
            </div>

            <form onSubmit={handleWarmupSubmit} className="space-y-6 pb-6 sm:pb-0">
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest text-center block mb-3">
                  Peso Objetivo (kg)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  autoFocus
                  value={workingWeight}
                  onChange={(e) => setWorkingWeight(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] px-5 py-6 text-5xl font-black text-center text-text-primary focus:ring-2 focus:ring-accent/50 outline-none transition-all shadow-inner [&::-webkit-inner-spin-button]:appearance-none placeholder:text-text-muted/30"
                  placeholder="0"
                />
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={!workingWeight}
                  className="w-full py-4 rounded-[20px] bg-orange-500 text-white font-bold hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg shadow-orange-500/20"
                >
                  Generar Series
                </button>
                <button
                  type="button"
                  onClick={() => setShowWarmupInput(false)}
                  className="w-full py-4 rounded-[20px] bg-black/5 dark:bg-white/5 text-text-primary font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  Cancelar
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