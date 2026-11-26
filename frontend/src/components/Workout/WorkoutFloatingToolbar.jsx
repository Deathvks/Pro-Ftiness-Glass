/* frontend/src/components/Workout/WorkoutFloatingToolbar.jsx */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Timer, Calculator, Activity, CheckCheck, Play, Pause } from 'lucide-react';
import { triggerHaptic, HapticType } from '../../utils/haptics';

/**
 * Barra inferior flotante tipo Expressive / Liquid Glass que aparece durante el entrenamiento
 * al desplazarse por debajo de la cabecera (paridad con el cliente nativo en Web y Capacitor).
 */
const WorkoutFloatingToolbar = ({
  visible,
  isWorkoutPaused,
  hasWorkoutStarted,
  isResting = false,
  onOpenRest,
  onShowCalculator,
  onShowHeatmap,
  onFinishClick,
  onTogglePause,
}) => {
  const [containerBounds, setContainerBounds] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateBounds = () => {
      if (window.innerWidth < 768) {
        setContainerBounds(null);
        return;
      }
      const mainEl = document.querySelector('main.flex-1.overflow-y-auto');
      if (!mainEl) {
        setContainerBounds(null);
        return;
      }
      const rect = mainEl.getBoundingClientRect();
      setContainerBounds((prev) => {
        if (prev && prev.left === rect.left && prev.width === rect.width) return prev;
        return { left: rect.left, width: rect.width };
      });
    };

    updateBounds();

    const mainEl = document.querySelector('main.flex-1.overflow-y-auto');
    let ro = null;
    if (mainEl && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateBounds);
      ro.observe(mainEl);
    }
    window.addEventListener('resize', updateBounds);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateBounds);
    };
  }, []);

  if (typeof document === 'undefined') return null;

  const isPausedOrIdle = !hasWorkoutStarted || isWorkoutPaused;

  const positionStyle = containerBounds
    ? { left: `${containerBounds.left}px`, width: `${containerBounds.width}px` }
    : { left: 0, right: 0 };

  return createPortal(
    <div
      style={positionStyle}
      className={`fixed bottom-[calc(var(--safe-bottom)+5.5rem)] md:bottom-6 z-40 flex justify-center px-4 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-6 scale-95'
      }`}
      aria-hidden={!visible}
    >
      <div
        className={`liquid-glass-navbar flex items-center gap-1 sm:gap-1.5 px-2.5 py-2 shadow-2xl ${
          visible ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        role="toolbar"
        aria-label="Controles rápidos del entrenamiento"
      >
        <button
          type="button"
          tabIndex={visible ? 0 : -1}
          onClick={() => {
            triggerHaptic(HapticType.selection);
            onOpenRest();
          }}
          className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 focus:outline-none ${
            isResting
              ? 'bg-accent/15 text-accent'
              : 'text-accent hover:bg-black/5 dark:hover:bg-white/10'
          }`}
          title="Temporizador de descanso"
          aria-label="Temporizador de descanso"
        >
          <Timer size={20} />
          {isResting && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent animate-pulse" />
          )}
        </button>

        <button
          type="button"
          tabIndex={visible ? 0 : -1}
          onClick={() => {
            triggerHaptic(HapticType.selection);
            onShowCalculator();
          }}
          className="w-11 h-11 rounded-full flex items-center justify-center text-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-90 focus:outline-none"
          title="Calculadora de discos"
          aria-label="Calculadora de discos"
        >
          <Calculator size={20} />
        </button>

        <button
          type="button"
          tabIndex={visible ? 0 : -1}
          onClick={() => {
            triggerHaptic(HapticType.selection);
            onShowHeatmap();
          }}
          className="w-11 h-11 rounded-full flex items-center justify-center text-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-90 focus:outline-none"
          title="Mapa muscular"
          aria-label="Mapa muscular"
        >
          <Activity size={20} />
        </button>

        <button
          type="button"
          tabIndex={visible ? 0 : -1}
          onClick={() => {
            triggerHaptic(HapticType.success);
            onFinishClick();
          }}
          className="w-11 h-11 rounded-full flex items-center justify-center text-emerald-500 hover:bg-emerald-500/12 transition-all active:scale-90 focus:outline-none"
          title="Finalizar entrenamiento"
          aria-label="Finalizar entrenamiento"
        >
          <CheckCheck size={20} strokeWidth={2.4} />
        </button>

        <div className="w-px h-6 bg-black/10 dark:bg-white/15 mx-1" aria-hidden="true" />

        <button
          type="button"
          tabIndex={visible ? 0 : -1}
          onClick={() => {
            triggerHaptic(HapticType.selection);
            onTogglePause();
          }}
          className={`h-11 px-4 rounded-full bg-accent text-accent-contrast flex items-center justify-center shadow-lg shadow-accent/35 hover:scale-105 active:scale-90 transition-all focus:outline-none ${
            isPausedOrIdle ? 'ring-2 ring-accent/40 ring-offset-2 ring-offset-transparent' : ''
          }`}
          title={isPausedOrIdle ? (hasWorkoutStarted ? 'Reanudar entrenamiento' : 'Iniciar entrenamiento') : 'Pausar entrenamiento'}
          aria-label={isPausedOrIdle ? (hasWorkoutStarted ? 'Reanudar entrenamiento' : 'Iniciar entrenamiento') : 'Pausar entrenamiento'}
        >
          {isPausedOrIdle ? (
            <Play size={20} fill="currentColor" className="ml-0.5" />
          ) : (
            <Pause size={20} fill="currentColor" />
          )}
        </button>
      </div>
    </div>,
    document.body
  );
};

export default WorkoutFloatingToolbar;
