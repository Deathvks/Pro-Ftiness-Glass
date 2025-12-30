/* frontend/src/components/Workout/WorkoutHeader.jsx */
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, Pause, Square, Calculator, Activity, Timer } from 'lucide-react';
import GlassCard from '../GlassCard';

// NOTA: Mantenemos esta función helper aquí por ahora.
const formatTime = (timeInSeconds) => {
  const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(timeInSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Cabecera de la página de Workout.
 * Muestra el nombre, cronómetro, controles e imagen de la rutina (si existe).
 */
const WorkoutHeader = ({
  routineName,
  routineImage, // Nueva prop
  timer,
  isWorkoutPaused,
  hasWorkoutStarted,
  onBackClick,
  onTogglePause,
  onFinishClick,
  onShowCalculator,
  onShowHeatmap,
}) => {
  const [imageError, setImageError] = useState(false);

  // Reseteamos el error si cambia la imagen (ej. al cambiar de rutina sin desmontar)
  useEffect(() => {
    setImageError(false);
  }, [routineImage]);

  return (
    <div className="w-full">
      <button
        onClick={onBackClick}
        className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4"
      >
        <ChevronLeft size={20} />
        Volver
      </button>

      {/* Renderizado Condicional de la Imagen */}
      {routineImage && !imageError && (
        <div className="w-full h-32 sm:h-48 mb-6 rounded-xl overflow-hidden relative shadow-lg animate-[fade-in_0.5s_ease-out]">
          <img
            src={routineImage}
            alt={`Portada de ${routineName}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-bg-primary/40 to-transparent pointer-events-none" />

          {/* Título sobre la imagen (opcional, estilo moderno) */}
          <div className="absolute bottom-4 left-4 right-4 z-10 sm:hidden">
            <h1 className="text-2xl font-bold text-white drop-shadow-md truncate">
              {routineName}
            </h1>
          </div>
        </div>
      )}

      <GlassCard className="p-6 mb-6 relative z-10">
        {/* Si hay imagen, ocultamos el título aquí en móvil para no duplicar, 
            o lo dejamos si preferimos el diseño estándar. 
            En este caso, lo mantengo visible siempre por consistencia visual 
            con o sin imagen, pero ajustando márgenes. */}
        <h1 className={`text-3xl font-bold text-center sm:text-left ${routineImage && !imageError ? 'hidden sm:block' : ''}`}>
          {routineName}
        </h1>

        <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 mt-4">
          <div className="font-mono text-4xl sm:text-5xl font-bold text-accent drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]">
            {formatTime(timer)}
          </div>
          <div className="flex gap-4">
            <button
              onClick={onShowHeatmap}
              className="p-4 rounded-full bg-bg-secondary border border-glass-border text-text-primary transition hover:bg-white/10 active:scale-95"
              title="Mapa de Músculos"
            >
              <Activity size={24} />
            </button>

            <button
              onClick={onShowCalculator}
              className="p-4 rounded-full bg-bg-secondary border border-glass-border text-text-primary transition hover:bg-white/10 active:scale-95"
              title="Calculadora de Platos"
            >
              <Calculator size={24} />
            </button>

            <button
              onClick={onTogglePause}
              className="p-4 rounded-full transition text-bg-secondary bg-accent hover:bg-accent/80 active:scale-95 shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)]"
              aria-label={isWorkoutPaused ? 'Reanudar' : 'Pausar'}
            >
              {isWorkoutPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
            </button>
            <button
              onClick={onFinishClick}
              className="p-4 rounded-full bg-red text-bg-secondary transition hover:bg-red/80 active:scale-95 shadow-lg shadow-red/20"
              aria-label="Finalizar"
            >
              <Square size={24} fill="currentColor" />
            </button>
          </div>
        </div>
        {!hasWorkoutStarted && (
          <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center gap-2 animate-pulse">
            <Timer size={20} className="text-accent shrink-0" />
            <p className="text-accent font-medium text-center text-sm">
              Inicia el cronómetro para comenzar a registrar datos
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default WorkoutHeader;