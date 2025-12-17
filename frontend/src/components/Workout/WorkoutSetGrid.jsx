/* frontend/src/components/Workout/WorkoutSetGrid.jsx */
import React from 'react';
import { CornerDownRight, X, Clock, Flame } from 'lucide-react';

/**
 * Normaliza el valor de un input para que sea un decimal válido.
 * Acepta tanto ',' como '.' como separadores decimales.
 * @param {string} value - El valor crudo del input.
 * @returns {string} - El valor normalizado.
 */
const normalizeDecimalInput = (value) => {
  if (value === null || value === undefined) return '';

  let strValue = String(value);

  // 1. Reemplazar comas por puntos
  strValue = strValue.replace(',', '.');

  // 2. Eliminar caracteres no válidos (todo excepto números y el primer punto)
  strValue = strValue.replace(/[^0-9.]/g, '');

  // 3. Asegurar que solo haya un punto decimal
  const firstDotIndex = strValue.indexOf('.');
  if (firstDotIndex !== -1) {
    // Si se encontró un punto, eliminar todos los puntos subsiguientes
    strValue =
      strValue.substring(0, firstDotIndex + 1) +
      strValue.substring(firstDotIndex + 1).replace(/\./g, '');
  }

  return strValue;
};


/**
 * Muestra la cuadrícula de series (inputs y botones) para un ejercicio.
 * Es un componente "tonto" que recibe todo su estado y manejadores
 * como props.
 */
const WorkoutSetGrid = ({
  setsDone,
  restSeconds,
  actualExIndex,
  hasWorkoutStarted,
  baseInputClasses,
  onUpdateSet,
  onAddDropset,
  onRemoveDropset,
  onToggleWarmup, // <--- NUEVA PROP: Para manejar el click en calentamiento
  onOpenRestModal,
  onDisabledInputClick,
  onDisabledButtonClick,
}) => {
  return (
    <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 items-center">
      {/* --- Cabecera de la Cuadrícula --- */}
      <div className="text-center font-semibold text-text-secondary text-sm">
        Serie
      </div>
      <div className="text-center font-semibold text-text-secondary text-sm">
        Peso (kg)
      </div>
      <div className="text-center font-semibold text-text-secondary text-sm">
        Reps
      </div>
      <div className="text-center font-semibold text-text-secondary text-sm">
        Dropset
      </div>
      <div className="text-center font-semibold text-text-secondary text-sm">
        Descanso
      </div>

      {/* --- Filas de Series --- */}
      {setsDone.map((set, setIndex) => (
        <div key={setIndex} className="contents">
          {/* --- CAMBIO: Ahora es interactivo (onClick) --- */}
          <span
            onClick={
              hasWorkoutStarted
                ? () => onToggleWarmup && onToggleWarmup(actualExIndex, setIndex)
                : onDisabledButtonClick
            }
            className={`
              text-center font-bold text-sm rounded-md px-1 py-3 flex items-center justify-center transition-all duration-200 select-none
              ${hasWorkoutStarted ? 'cursor-pointer hover:brightness-110 active:scale-95' : 'cursor-not-allowed opacity-70'}
              ${set.is_dropset
                ? 'bg-red-500/10 text-red-500' // Dropset
                : set.is_warmup
                  ? 'bg-accent/10 text-accent' // Calentamiento: Solo fondo, sin borde
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80' // Normal
              }
            `}
            title={
              hasWorkoutStarted
                ? "Click para marcar/desmarcar como Calentamiento"
                : "Inicia el entrenamiento para editar"
            }
          >
            {set.is_dropset ? 'DS' : set.is_warmup ? <Flame size={16} strokeWidth={2.5} /> : set.set_number}
          </span>

          {/* Input: Peso (kg) */}
          <input
            type="text"
            placeholder="0"
            value={set.weight_kg}
            onChange={
              hasWorkoutStarted
                ? (e) => {
                  const value = normalizeDecimalInput(e.target.value);
                  onUpdateSet(actualExIndex, setIndex, 'weight_kg', value);
                }
                : undefined
            }
            onClick={!hasWorkoutStarted ? onDisabledInputClick : undefined}
            className={baseInputClasses}
            disabled={!hasWorkoutStarted}
            readOnly={!hasWorkoutStarted}
          />

          {/* Input: Reps */}
          <input
            type="text"
            placeholder="0"
            value={set.reps}
            onChange={
              hasWorkoutStarted
                ? (e) => {
                  const value = normalizeDecimalInput(e.target.value);
                  onUpdateSet(actualExIndex, setIndex, 'reps', value);
                }
                : undefined
            }
            onClick={!hasWorkoutStarted ? onDisabledInputClick : undefined}
            className={baseInputClasses}
            disabled={!hasWorkoutStarted}
            readOnly={!hasWorkoutStarted}
          />

          {/* Botón: Añadir/Quitar Dropset */}
          {set.is_dropset ? (
            <button
              onClick={
                hasWorkoutStarted
                  ? () => onRemoveDropset(actualExIndex, setIndex)
                  : onDisabledButtonClick
              }
              className={`p-3 rounded-md border transition h-full flex items-center justify-center ${hasWorkoutStarted
                ? 'bg-bg-primary border-glass-border text-text-muted hover:bg-red/20 hover:text-red'
                : 'bg-bg-primary border-glass-border text-text-muted opacity-50 cursor-not-allowed'
                }`}
              title={
                hasWorkoutStarted
                  ? 'Eliminar Dropset'
                  : 'Inicia el cronómetro para eliminar dropsets'
              }
              disabled={!hasWorkoutStarted}
            >
              <X size={20} />
            </button>
          ) : (
            <button
              onClick={
                hasWorkoutStarted
                  ? () => onAddDropset(actualExIndex, setIndex)
                  : onDisabledButtonClick
              }
              className={`p-3 rounded-md border transition h-full flex items-center justify-center ${hasWorkoutStarted
                ? 'bg-bg-primary border-glass-border text-text-secondary hover:text-accent hover:border-accent/50'
                : 'bg-bg-primary border-glass-border text-text-muted opacity-50 cursor-not-allowed'
                }`}
              title={
                hasWorkoutStarted
                  ? 'Añadir Dropset'
                  : 'Inicia el cronómetro para añadir dropsets'
              }
              disabled={!hasWorkoutStarted}
            >
              <CornerDownRight size={20} />
            </button>
          )}

          {/* Botón: Descanso */}
          <button
            onClick={
              hasWorkoutStarted
                ? () => onOpenRestModal(restSeconds)
                : onDisabledButtonClick
            }
            className={`p-3 rounded-md border transition h-full flex items-center justify-center ${hasWorkoutStarted
              ? 'bg-bg-primary border-glass-border text-text-secondary hover:text-accent hover:border-accent/50'
              : 'bg-bg-primary border-glass-border text-text-muted opacity-50 cursor-not-allowed'
              }`}
            title={
              hasWorkoutStarted
                ? 'Iniciar descanso'
                : 'Inicia el cronómetro para usar el temporizador de descanso'
            }
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