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
  // Filtramos las clases para quitar el 'ring' (el brillo/borde doble) y dejar solo el borde de acento.
  const inputClasses = useMemo(() => {
    if (!baseInputClasses) return '';
    // Elimina cualquier clase que empiece por focus:ring-
    return baseInputClasses.replace(/focus:ring-[^\s]+/g, '').trim() + ' focus:ring-0 focus:outline-none border-glass-border focus:border-accent';
  }, [baseInputClasses]);

  return (
    <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 items-center">
      {/* Cabecera */}
      <div className="text-center font-semibold text-text-secondary text-sm">Serie</div>
      <div className="text-center font-semibold text-text-secondary text-sm">Peso (kg)</div>
      <div className="text-center font-semibold text-text-secondary text-sm">Reps</div>
      <div className="text-center font-semibold text-text-secondary text-sm">Dropset</div>
      <div className="text-center font-semibold text-text-secondary text-sm">Descanso</div>

      {/* Filas */}
      {setsDone.map((set, setIndex) => (
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
                p-3 rounded-md border transition h-full flex items-center justify-center w-full
                ${hasWorkoutStarted ? 'cursor-pointer hover:brightness-110 active:scale-95' : 'cursor-not-allowed opacity-70'}
                ${set.is_dropset
                  ? 'bg-red-500/10 text-red-500 border-red-500/20'
                  : set.is_warmup
                    ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                    : 'bg-bg-primary border-glass-border text-text-secondary hover:text-accent hover:border-accent/50'
                }
              `}
              title={hasWorkoutStarted ? "Marcar como Calentamiento" : "Inicia el entrenamiento para editar"}
              disabled={!hasWorkoutStarted}
            >
              {set.is_dropset ? <span className="font-bold text-xs">DS</span> : set.is_warmup ? <Flame size={18} /> : <span className="font-bold text-sm">{set.set_number}</span>}
            </button>
          </div>

          {/* Input: Peso (kg) */}
          <input
            type="text"
            placeholder="0"
            value={set.weight_kg}
            onChange={hasWorkoutStarted ? (e) => onUpdateSet(actualExIndex, setIndex, 'weight_kg', normalizeDecimalInput(e.target.value)) : undefined}
            onClick={!hasWorkoutStarted ? onDisabledInputClick : undefined}
            className={inputClasses}
            disabled={!hasWorkoutStarted}
            readOnly={!hasWorkoutStarted}
          />

          {/* Input: Reps */}
          <input
            type="text"
            placeholder="0"
            value={set.reps}
            onChange={hasWorkoutStarted ? (e) => onUpdateSet(actualExIndex, setIndex, 'reps', normalizeDecimalInput(e.target.value)) : undefined}
            onClick={!hasWorkoutStarted ? onDisabledInputClick : undefined}
            className={inputClasses}
            disabled={!hasWorkoutStarted}
            readOnly={!hasWorkoutStarted}
          />

          {/* Botón: Dropset */}
          <button
            onClick={hasWorkoutStarted ? () => { triggerHaptic(HapticType.selection); set.is_dropset ? onRemoveDropset(actualExIndex, setIndex) : onAddDropset(actualExIndex, setIndex); } : onDisabledButtonClick}
            className={`p-3 rounded-md border transition h-full flex items-center justify-center ${hasWorkoutStarted
              ? (set.is_dropset ? 'bg-bg-primary border-glass-border text-text-muted hover:bg-red/20 hover:text-red' : 'bg-bg-primary border-glass-border text-text-secondary hover:text-accent hover:border-accent/50')
              : 'bg-bg-primary border-glass-border text-text-muted opacity-50 cursor-not-allowed'
              }`}
            title={hasWorkoutStarted ? (set.is_dropset ? 'Eliminar Dropset' : 'Añadir Dropset') : 'Inicia el cronómetro'}
            disabled={!hasWorkoutStarted}
          >
            {set.is_dropset ? <X size={20} /> : <CornerDownRight size={20} />}
          </button>

          {/* Botón: Descanso */}
          <button
            onClick={hasWorkoutStarted ? () => { triggerHaptic(HapticType.selection); onOpenRestModal(restSeconds); } : onDisabledButtonClick}
            className={`p-3 rounded-md border transition h-full flex items-center justify-center ${hasWorkoutStarted
              ? 'bg-bg-primary border-glass-border text-text-secondary hover:text-accent hover:border-accent/50'
              : 'bg-bg-primary border-glass-border text-text-muted opacity-50 cursor-not-allowed'
              }`}
            title={hasWorkoutStarted ? 'Iniciar descanso' : 'Inicia el cronómetro'}
            disabled={!hasWorkoutStarted}
          >
            <Clock size={20} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default WorkoutSetGrid;