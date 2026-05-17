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
 * Rediseño épico estilo iOS con Glassmorphism, portada completa y soporte OLED nativo.
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
    <div className="relative w-full rounded-[32px] overflow-hidden mb-8 border border-black/5 dark:border-white/10 shadow-lg animate-[fade-in_0.5s_ease-out] bg-bg-primary isolate">
      
      {/* --- FONDO DINÁMICO --- */}
      {isImageLink && !imageError ? (
        // Opción A: Imagen real (Truco de desenfoque trasero + contención + Degradado negro puro para OLED)
        <div className="absolute inset-0 z-0 bg-black">
          {/* Capa 1: Fondo borroso que llena la tarjeta con los colores de la imagen */}
          <img
            src={routineImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125"
          />
          {/* Capa 2: Imagen contenida para no recortar nada */}
          <img
            src={routineImage}
            alt={`Portada de ${routineName}`}
            className="absolute inset-0 w-full h-full object-contain opacity-90 drop-shadow-2xl"
            onError={() => setImageError(true)}
          />
          {/* Capa 3: Degradado NEGRO PURO (Perfecto para fusionar en OLED) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
        </div>
      ) : isCssGradient ? (
        // Opción B: Es un degradado CSS
        <div className="absolute inset-0 z-0" style={{ background: routineImage }}>
           {/* Capa oscura pura encima del degradado */}
           <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
        </div>
      ) : (
        // Opción C: No hay imagen (Fallback integrado con el tema de la app)
        <div className="absolute inset-0 z-0 bg-black/5 dark:bg-white/5" />
      )}

      {/* Determinar el color del texto si hay fondo o no */}
      <div className={`relative z-10 p-6 sm:p-8 flex flex-col items-center text-center ${((isImageLink && !imageError) || isCssGradient) ? 'text-white' : 'text-text-primary'}`}>
        
        {/* Botón Volver */}
        <div className="w-full flex justify-start mb-4">
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/20 text-sm font-bold hover:bg-black/20 dark:hover:bg-white/20 hover:scale-105 transition-all active:scale-95 shadow-sm"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
            Atrás
          </button>
        </div>

        {/* Título de la Rutina */}
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 drop-shadow-lg px-2 break-words text-balance tracking-tight">
          {routineName}
        </h1>

        {/* Aviso de Iniciar Cronómetro */}
        {!hasWorkoutStarted && (
          <div className="mb-5 flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent text-[10px] sm:text-xs font-bold uppercase tracking-widest animate-pulse shadow-sm">
            <Timer size={14} /> Toca Play para Empezar
          </div>
        )}

        {/* Cronómetro Gigante */}
        <div className={`font-mono text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter drop-shadow-md mb-10 transition-colors duration-500 ${hasWorkoutStarted && !isWorkoutPaused ? 'text-accent' : 'opacity-90'}`}>
          {formatTime(timer)}
        </div>

        {/* Controles (Píldora flotante tipo Dynamic Island) */}
        <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-2.5 rounded-full bg-black/60 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl text-white">
          
          <button
            onClick={onShowHeatmap}
            className="p-3.5 sm:p-4 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            title="Mapa Muscular"
          >
            <Activity size={24} />
          </button>
          
          <button
            onClick={onShowCalculator}
            className="p-3.5 sm:p-4 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            title="Calculadora de Discos"
          >
            <Calculator size={24} />
          </button>

          <div className="w-[1px] h-8 bg-white/20 mx-1 sm:mx-2" />

          {/* Botón Principal (Play/Pause) */}
          <button
            onClick={onTogglePause}
            className={`p-4 sm:p-5 rounded-full transition-all flex items-center justify-center active:scale-90 ${
              hasWorkoutStarted && !isWorkoutPaused
                ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                : 'bg-accent text-white hover:scale-105 shadow-lg shadow-accent/40 border border-transparent'
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
            className="p-3.5 sm:p-4 rounded-full text-red/80 hover:text-red hover:bg-red/20 transition-all active:scale-95"
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