/* frontend/src/components/Workout/WorkoutHeader.jsx */
import React from 'react';
import { ChevronLeft, Play, Pause, Square, Calculator } from 'lucide-react';
import GlassCard from '../GlassCard';

// NOTA: Mantenemos esta función helper aquí por ahora para que 
// el componente sea autónomo.
const formatTime = (timeInSeconds) => {
  const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(timeInSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Cabecera de la página de Workout.
 * Muestra el nombre, el cronómetro y los controles principales.
 */
const WorkoutHeader = ({
  routineName,
  timer,
  isWorkoutPaused,
  hasWorkoutStarted,
  onBackClick,
  onTogglePause,
  onFinishClick,
  onShowCalculator, // <--- Nueva prop
}) => {
  return (
    <div className="w-full">
      <button
        onClick={onBackClick}
        className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4"
      >
        <ChevronLeft size={20} />
        Volver
      </button>

      <GlassCard className="p-6 mb-6">
        <h1 className="text-3xl font-bold text-center sm:text-left">
          {routineName}
        </h1>
        <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 mt-4">
          <div className="font-mono text-4xl sm:text-5xl font-bold">
            {formatTime(timer)}
          </div>
          <div className="flex gap-4">
            {/* Botón para abrir la calculadora */}
            <button
              onClick={onShowCalculator}
              className="p-4 rounded-full bg-bg-secondary border border-glass-border text-text-primary transition hover:bg-white/10 active:scale-95"
              aria-label="Calculadora de Platos"
              title="Calculadora de Platos"
            >
              <Calculator size={24} />
            </button>

            <button
              onClick={onTogglePause}
              className="p-4 rounded-full transition text-bg-secondary bg-accent hover:bg-accent/80 active:scale-95"
              aria-label={isWorkoutPaused ? 'Reanudar' : 'Pausar'}
            >
              {isWorkoutPaused ? <Play size={24} /> : <Pause size={24} />}
            </button>
            <button
              onClick={onFinishClick}
              className="p-4 rounded-full bg-red text-bg-secondary transition hover:bg-red/80 active:scale-95"
              aria-label="Finalizar"
            >
              <Square size={24} />
            </button>
          </div>
        </div>
        {!hasWorkoutStarted && (
          <div className="mt-4 p-3 bg-accent-transparent border border-accent-border rounded-md text-center">
            <p className="text-accent font-medium">
              ⏱️ Inicia el cronómetro para comenzar a registrar datos
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default WorkoutHeader;