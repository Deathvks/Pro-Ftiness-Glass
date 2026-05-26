/* frontend/src/components/Workout/WorkoutHeader.jsx */
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, Pause, Square, Calculator, Activity, Timer } from 'lucide-react';

const formatTime = (timeInSeconds) => {
  const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(timeInSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// --- AÑADIDO: Lógica robusta para formatear URLs de imagen ---
const isCssBackground = (value) => {
  return value && (value.startsWith('linear-gradient') || value.startsWith('var(--'));
};

const getDisplayImageUrl = (path) => {
  if (!path || isCssBackground(path)) return null;
  if (path.startsWith('blob:')) return path;

  let cleanPath = path.replace(/http:\/\/localhost:\d+/g, '');
  if (cleanPath.startsWith('http')) return cleanPath;

  const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
  let base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

  if (base.endsWith('/api')) {
    base = base.slice(0, -4);
  }

  if (cleanPath.startsWith('/uploads') || cleanPath.startsWith('/images')) {
    return `${base}${cleanPath}`;
  }
  return cleanPath;
};
// -----------------------------------------------------------

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

  // Usamos la nueva lógica para la imagen final
  const isCssGradient = isCssBackground(routineImage);
  const finalImageUrl = !isCssGradient ? getDisplayImageUrl(routineImage) : null;
  const hasValidImage = finalImageUrl && !imageError;

  return (
    <div className="relative w-full rounded-[32px] overflow-hidden mb-8 border-none ring-1 ring-black/5 dark:ring-white/10 shadow-xl animate-[fade-in_0.5s_ease-out] bg-bg-primary isolate">
      
      {/* --- FONDO DINÁMICO --- */}
      {hasValidImage ? (
        // Opción A: Imagen real (Truco de desenfoque trasero + contención + Degradado negro puro para OLED)
        <div className="absolute inset-0 z-0 bg-black">
          {/* Capa 1: Fondo borroso que llena la tarjeta con los colores de la imagen */}
          <img
            src={finalImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125"
          />
          {/* Capa 2: Imagen contenida para no recortar nada */}
          <img
            src={finalImageUrl}
            alt={`Portada de ${routineName}`}
            className="absolute inset-0 w-full h-full object-contain opacity-90 drop-shadow-2xl"
            onError={() => setImageError(true)}
          />
          {/* Capa 3: Degradado oscuro */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
        </div>
      ) : isCssGradient ? (
        // Opción B: Es un degradado CSS
        <div className="absolute inset-0 z-0" style={{ background: routineImage }}>
           {/* Capa oscura pura encima del degradado */}
           <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        </div>
      ) : (
        // Opción C: No hay imagen (Fallback integrado con el tema de la app)
        <div className="absolute inset-0 z-0 bg-black/5 dark:bg-white/5" />
      )}

      {/* Determinar el color del texto si hay fondo o no */}
      <div className={`relative z-10 p-6 sm:p-8 flex flex-col items-center text-center ${hasValidImage || isCssGradient ? 'text-white' : 'text-text-primary'}`}>
        
        {/* Botón Volver */}
        <div className="w-full flex justify-start mb-6">
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/20 dark:bg-white/10 backdrop-blur-md ring-1 ring-white/10 text-sm font-bold hover:bg-black/40 dark:hover:bg-white/20 hover:scale-105 transition-all active:scale-95 shadow-sm text-white"
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
          <div className="mb-6 mt-2 flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 ring-1 ring-accent/30 text-accent text-[10px] sm:text-xs font-bold uppercase tracking-widest animate-pulse shadow-sm backdrop-blur-md">
            <Timer size={14} /> Toca Play para Empezar
          </div>
        )}

        {/* Cronómetro Gigante */}
        <div className={`font-mono text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter drop-shadow-lg mb-10 transition-colors duration-500 ${hasWorkoutStarted && !isWorkoutPaused ? 'text-accent' : (hasValidImage || isCssGradient ? 'text-white/90' : 'text-text-primary')}`}>
          {formatTime(timer)}
        </div>

        {/* Controles (Píldora flotante tipo Dynamic Island) */}
        <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-2.5 rounded-full bg-black/60 dark:bg-black/80 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl text-white">
          
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
                ? 'bg-white/10 text-white hover:bg-white/20 ring-1 ring-white/10'
                : 'bg-accent text-white hover:scale-105 shadow-lg shadow-accent/40 ring-1 ring-accent/50'
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
            className="p-3.5 sm:p-4 rounded-full text-red-500/80 hover:text-red-500 hover:bg-red-500/20 transition-all active:scale-95"
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