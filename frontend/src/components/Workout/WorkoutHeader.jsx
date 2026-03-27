/* frontend/src/components/Workout/WorkoutHeader.jsx */
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, Pause, Square, Calculator, Activity, Timer } from 'lucide-react';

const formatTime = (timeInSeconds) => {
  const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(timeInSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Cabecera de la página de Workout.
 * Rediseño épico estilo iOS con Glassmorphism y la portada de fondo.
 */
const WorkoutHeader = ({
  routineName,
  routineImage,
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

  useEffect(() => {
    setImageError(false);
  }, [routineImage]);

  // Lógica para detectar si es un link de imagen real o un código CSS de degradado
  const isImageLink = routineImage && (
    routineImage.startsWith('http') || 
    routineImage.startsWith('/') || 
    routineImage.startsWith('data:') || 
    routineImage.startsWith('blob:')
  );
  
  const isCssGradient = routineImage && routineImage.includes('gradient');

  return (
    <div className="relative w-full rounded-[2rem] overflow-hidden mb-6 shadow-lg border backdrop-blur-glass bg-[--glass-bg] border-[--glass-border] animate-[fade-in_0.5s_ease-out]">
      
      {/* --- FONDO DINÁMICO --- */}
      {isImageLink && !imageError ? (
        // Opción A: Es una imagen real (Efecto cristal translúcido)
        <div className="absolute inset-0 z-0">
          <img
            src={routineImage}
            alt={`Portada de ${routineName}`}
            className="w-full h-full object-cover opacity-60 scale-105"
            onError={() => setImageError(true)}
          />
          {/* Capas de oscurecimiento y blur */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-bg-primary/30" />
          <div className="absolute inset-0 backdrop-blur-[6px]" />
        </div>
      ) : isCssGradient ? (
        // Opción B: Es un degradado CSS (como el del log, efecto cristal)
        <div className="absolute inset-0 z-0" style={{ background: routineImage }}>
           {/* Capa oscura y blur encima del degradado para suavizarlo */}
           <div className="absolute inset-0 bg-bg-primary/60 backdrop-blur-[4px]" />
        </div>
      ) : (
        // Opción C: No hay imagen ni patrón (Fallback al color estándar de tarjetas)
        // Eliminado el degradado fuerte, ahora se ve el color suave transparente del GlassCard gracias a las clases del contenedor.
        null
      )}

      {/* --- CONTENIDO DE LA CABECERA --- */}
      <div className="relative z-10 p-6 flex flex-col items-center text-center">
        
        {/* Botón Volver */}
        <div className="w-full flex justify-start mb-4">
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 backdrop-blur-md border border-[--glass-border] text-white/90 text-sm font-medium hover:bg-black/40 hover:text-white transition active:scale-95"
          >
            <ChevronLeft size={18} />
            Atrás
          </button>
        </div>

        {/* Título de la Rutina */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 drop-shadow-lg px-4 break-words text-balance">
          {routineName}
        </h1>

        {/* Aviso de Iniciar Cronómetro */}
        {!hasWorkoutStarted && (
          <div className="mb-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-[--glass-border] text-accent text-xs font-semibold uppercase tracking-wider animate-pulse">
            <Timer size={14} /> Toca Play para Empezar
          </div>
        )}

        {/* Cronómetro Gigante */}
        <div className={`font-mono text-6xl sm:text-8xl font-black tracking-tighter drop-shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] mb-8 transition-colors duration-500 ${hasWorkoutStarted && !isWorkoutPaused ? 'text-accent' : 'text-white/80'}`}>
          {formatTime(timer)}
        </div>

        {/* Controles (Píldora flotante iOS) */}
        <div className="flex items-center gap-1 sm:gap-2 p-2 rounded-full bg-black/40 backdrop-blur-xl border border-[--glass-border] shadow-xl">
          
          <button
            onClick={onShowHeatmap}
            className="p-3 sm:p-4 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition active:scale-95"
            title="Mapa Muscular"
          >
            <Activity size={24} />
          </button>
          
          <button
            onClick={onShowCalculator}
            className="p-3 sm:p-4 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition active:scale-95"
            title="Calculadora de Discos"
          >
            <Calculator size={24} />
          </button>

          <div className="w-[1px] h-8 bg-white/20 mx-1 sm:mx-2" />

          {/* Botón Principal (Play/Pause) */}
          <button
            onClick={onTogglePause}
            className={`p-4 sm:p-5 rounded-full transition shadow-lg flex items-center justify-center active:scale-90 ${
              hasWorkoutStarted && !isWorkoutPaused
                ? 'bg-white/10 text-white hover:bg-white/20 border border-[--glass-border]'
                : 'bg-accent text-bg-secondary hover:bg-accent/90 hover:scale-105 shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)]'
            }`}
          >
            {isWorkoutPaused ? (
              <Play size={28} fill="currentColor" className="ml-1" />
            ) : (
              <Pause size={28} fill="currentColor" />
            )}
          </button>

          <div className="w-[1px] h-8 bg-white/20 mx-1 sm:mx-2" />

          <button
            onClick={onFinishClick}
            className="p-3 sm:p-4 rounded-full text-red/80 hover:text-red hover:bg-red/10 transition active:scale-95"
            title="Finalizar Entrenamiento"
          >
            <Square size={24} fill="currentColor" />
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default WorkoutHeader;