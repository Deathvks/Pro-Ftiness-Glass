/* frontend/src/components/Workout/WorkoutSetGrid.jsx */
import React, { useMemo } from 'react';
import { CornerDownRight, X, Clock, Flame } from 'lucide-react';
import { triggerHaptic, HapticType } from '../../utils/haptics';

const normalizeDecimalInput = (value) => {
  if (value === null || value === undefined) return '';
  let strValue = String(value).replace(',', '.').replace(/[^0-9.]/g, '');
  const firstDotIndex = strValue.indexOf('.');
  if (firstDotIndex !== -1) {
    strValue = strValue.substring(0, firstDotIndex + 1) + strValue.substring(firstDotIndex + 1).replace(/\./g, '');
  }
  return strValue;
};

// NUEVO: Normalizador estricto para números enteros (sin decimales)
const normalizeIntegerInput = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[^0-9]/g, ''); 
};

const WorkoutSetGrid = ({
  setsDone,
  restSeconds,
  actualExIndex,
  hasWorkoutStarted,
  baseInputClasses,
  onUpdateSet,
  onAddDropset,
  onRemoveDropset,
  onToggleWarmup,
  onOpenRestModal,
  onDisabledInputClick,
  onDisabledButtonClick,
}) => {
  // Estilizamos los inputs para el nuevo diseño Glass
  const inputClasses = useMemo(() => {
    if (!baseInputClasses) return '';
    return baseInputClasses.replace(/focus:ring-[^\s]+/g, '').trim() + ' focus:ring-0 focus:outline-none ring-1 ring-black/5 dark:ring-white/10 focus:ring-2 focus:ring-accent/50 text-center font-bold rounded-[14px] font-mono';
  }, [baseInputClasses]);

  return (
    <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 items-center">
      {/* Cabecera */}
      <div className="text-center font-bold text-text-tertiary uppercase tracking-wider text-[10px]">Serie</div>
      <div className="text-center font-bold text-text-tertiary uppercase tracking-wider text-[10px]">Peso (kg)</div>
      <div className="text-center font-bold text-text-tertiary uppercase tracking-wider text-[10px]">Reps</div>
      <div className="text-center font-bold text-text-tertiary uppercase tracking-wider text-[10px]">Dropset</div>
      <div className="text-center font-bold text-text-tertiary uppercase tracking-wider text-[10px]">Descanso</div>

      {/* Filas */}
      {setsDone.map((set, setIndex) => {
        // Lógica para detectar si la serie actual ya está completada
        const hasWeight = set.weight_kg !== null && set.weight_kg !== undefined && String(set.weight_kg).trim() !== '';
        const hasReps = set.reps !== null && set.reps !== undefined && String(set.reps).trim() !== '';
        const isSetCompleted = hasWeight && hasReps;

        return (
          <div key={setIndex} className="contents">
            {/* Toggle Calentamiento */}
            <div className="flex items-center justify-center h-full">
              <button
                onClick={
                  hasWorkoutStarted
                    ? () => {
                      triggerHaptic(HapticType.selection);
                      if (onToggleWarmup) onToggleWarmup(actualExIndex, setIndex);
                    }
                    : onDisabledButtonClick
                }
                className={`
                  p-3 rounded-[14px] border-none ring-1 transition-all h-full flex items-center justify-center w-full
                  ${hasWorkoutStarted ? 'cursor-pointer active:scale-95' : 'cursor-not-allowed opacity-50'}
                  ${set.is_dropset
                    ? 'bg-red-500/10 text-red-500 ring-red-500/20 hover:bg-red-500/20'
                    : set.is_warmup
                      ? 'bg-orange-500/10 text-orange-500 ring-orange-500/20 hover:bg-orange-500/20'
                      : 'bg-black/5 dark:bg-white/5 ring-transparent text-text-secondary hover:text-accent hover:bg-black/10 dark:hover:bg-white/10'
                  }
                `}
                title={hasWorkoutStarted ? "Marcar como Calentamiento" : "Inicia el entrenamiento para editar"}
                disabled={!hasWorkoutStarted}
              >
                {set.is_dropset ? <span className="font-black text-xs">DS</span> : set.is_warmup ? <Flame size={18} strokeWidth={2.5} /> : <span className="font-black text-sm">{set.set_number}</span>}
              </button>
            </div>

            {/* Input: Peso (kg) */}
            <input
              type="text"
              placeholder="0"
              inputMode="decimal"
              value={set.weight_kg}
              onChange={hasWorkoutStarted ? (e) => onUpdateSet(actualExIndex, setIndex, 'weight_kg', normalizeDecimalInput(e.target.value)) : undefined}
              onClick={!hasWorkoutStarted ? onDisabledInputClick : undefined}
              className={inputClasses}
              disabled={!hasWorkoutStarted}
              readOnly={!hasWorkoutStarted}
            />

            {/* Input: Reps (forzado a entero) */}
            <input
              type="text"
              placeholder="0"
              inputMode="numeric"
              value={set.reps}
              onChange={hasWorkoutStarted ? (e) => onUpdateSet(actualExIndex, setIndex, 'reps', normalizeIntegerInput(e.target.value)) : undefined}
              onClick={!hasWorkoutStarted ? onDisabledInputClick : undefined}
              className={inputClasses}
              disabled={!hasWorkoutStarted}
              readOnly={!hasWorkoutStarted}
            />

            {/* Botón: Dropset */}
            <button
              onClick={hasWorkoutStarted ? () => { triggerHaptic(HapticType.selection); set.is_dropset ? onRemoveDropset(actualExIndex, setIndex) : onAddDropset(actualExIndex, setIndex); } : onDisabledButtonClick}
              className={`p-3 rounded-[14px] border-none ring-1 transition-all h-full flex items-center justify-center ${hasWorkoutStarted
                ? (set.is_dropset ? 'bg-red-500/10 ring-red-500/20 text-red-500 hover:bg-red-500/20' : 'bg-black/5 dark:bg-white/5 ring-transparent text-text-secondary hover:text-accent hover:bg-black/10 dark:hover:bg-white/10')
                : 'bg-black/5 dark:bg-white/5 ring-transparent text-text-muted opacity-50 cursor-not-allowed'
                }`}
              title={hasWorkoutStarted ? (set.is_dropset ? 'Eliminar Dropset' : 'Añadir Dropset') : 'Inicia el cronómetro'}
              disabled={!hasWorkoutStarted}
            >
              {set.is_dropset ? <X size={20} strokeWidth={3} /> : <CornerDownRight size={20} strokeWidth={2.5} />}
            </button>

            {/* Botón: Descanso (Se desactiva si el peso y las reps están completados) */}
            <button
              onClick={hasWorkoutStarted && !isSetCompleted ? () => { triggerHaptic(HapticType.selection); onOpenRestModal(restSeconds); } : onDisabledButtonClick}
              className={`p-3 rounded-[14px] border-none ring-1 transition-all h-full flex items-center justify-center ${hasWorkoutStarted && !isSetCompleted
                ? 'bg-black/5 dark:bg-white/5 ring-transparent text-text-secondary hover:text-accent hover:bg-black/10 dark:hover:bg-white/10'
                : 'bg-black/5 dark:bg-white/5 ring-transparent text-text-muted opacity-30 cursor-not-allowed'
                }`}
              title={hasWorkoutStarted ? (isSetCompleted ? 'Serie completada (Usa el reloj de la siguiente)' : 'Iniciar descanso') : 'Inicia el entrenamiento'}
              disabled={!hasWorkoutStarted || isSetCompleted}
            >
              <Clock size={20} strokeWidth={2.5} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default WorkoutSetGrid;