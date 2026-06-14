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
        <div className="absolute inset-0 z-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {/* Capa 1: Fondo borroso */}
          <img
            src={finalImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 scale-125"
          />
          {/* Capa 2: Imagen contenida */}
          <img
            src={finalImageUrl}
            alt={`Portada de ${routineName}`}
            className="absolute inset-0 w-full h-full object-contain opacity-80"
            onError={() => setImageError(true)}
          />
          
          {/* Capa 3: Degradado superior e inferior (Scrim) usando variables de tema */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, 
                var(--bg-primary) 0%, 
                transparent 30%, 
                transparent 70%, 
                var(--bg-primary) 100%)`
            }}
          />
          {/* Capa 4: Veladura base para asegurar legibilidad en el centro */}
          <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundColor: 'var(--bg-primary)' }} />
        </div>
      ) : isCssGradient ? (
        // Opción B: Es un degradado CSS
        <div className="absolute inset-0 z-0" style={{ background: routineImage }}>
          {/* Usamos el color de fondo primario para el overlay para adaptarlo al tema (claro/oscuro) */}
          <div className="absolute inset-0 backdrop-blur-sm opacity-80" style={{ backgroundColor: 'var(--bg-primary)' }} />
        </div>
      ) : (
        // Opción C: No hay imagen
        <div className="absolute inset-0 z-0 bg-black/5 dark:bg-white/5" />
      )}

      {/* Contenido (Texto se adapta al tema con text-text-primary). Añadido w-full para restringir el ancho */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col items-center text-center text-text-primary w-full">
        
        {/* Botón Volver */}
        <div className="w-full flex justify-start mb-6">
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-bg-secondary/60 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10 text-sm font-bold hover:bg-bg-secondary/80 hover:scale-105 transition-all active:scale-95 shadow-sm text-text-primary"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
            Atrás
          </button>
        </div>

        {/* Título de la Rutina forzado a saltar línea si es necesario */}
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 px-2 w-full break-words whitespace-normal leading-tight tracking-tight">
          {routineName}
        </h1>

        {/* Aviso de Iniciar Cronómetro */}
        {!hasWorkoutStarted && (
          <div className="mb-6 mt-2 flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 ring-1 ring-accent/30 text-accent text-[10px] sm:text-xs font-bold uppercase tracking-widest animate-pulse shadow-sm backdrop-blur-md">
            <Timer size={14} /> Toca Play para Empezar
          </div>
        )}

        {/* Cronómetro Gigante */}
        <div className={`font-mono text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter drop-shadow-sm mb-10 transition-colors duration-500 ${hasWorkoutStarted && !isWorkoutPaused ? 'text-accent' : 'text-text-primary'}`}>
          {formatTime(timer)}
        </div>

        {/* Controles (Píldora flotante tipo Dynamic Island adaptada al tema Glass) */}
        <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-2.5 rounded-full bg-bg-secondary/80 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 shadow-xl text-text-primary">
          
          <button
            onClick={onShowHeatmap}
            className="p-3.5 sm:p-4 rounded-full text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-95"
            title="Mapa Muscular"
          >
            <Activity size={24} />
          </button>
          
          <button
            onClick={onShowCalculator}
            className="p-3.5 sm:p-4 rounded-full text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-95"
            title="Calculadora de Discos"
          >
            <Calculator size={24} />
          </button>

          <div className="w-[1px] h-8 bg-black/10 dark:bg-white/10 mx-1 sm:mx-2" />

          {/* Botón Principal (Play/Pause) */}
          <button
            onClick={onTogglePause}
            className={`p-4 sm:p-5 rounded-full transition-all flex items-center justify-center active:scale-90 ${
              hasWorkoutStarted && !isWorkoutPaused
                ? 'bg-black/5 dark:bg-white/10 text-text-primary hover:bg-black/10 dark:hover:bg-white/20 ring-1 ring-black/5 dark:ring-white/10'
                : 'bg-accent text-white hover:scale-105 shadow-lg shadow-accent/40 ring-1 ring-accent/50'
            }`}
          >
            {isWorkoutPaused ? (
              <Play size={28} fill="currentColor" className="ml-1" />
            ) : (
              <Pause size={28} fill="currentColor" />
            )}
          </button>

          <div className="w-[1px] h-8 bg-black/10 dark:bg-white/10 mx-1 sm:mx-2" />

          <button
            onClick={onFinishClick}
            className="p-3.5 sm:p-4 rounded-full text-red-500/80 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
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