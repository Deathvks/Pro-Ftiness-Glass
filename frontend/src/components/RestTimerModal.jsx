import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, X, ArrowLeft } from 'lucide-react';
import GlassCard from './GlassCard';

const RestTimerModal = ({ onClose }) => {
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [view, setView] = useState('select');
  
  // --- INICIO DE LA MODIFICACIÓN ---
  // Usamos una 'ref' para guardar la hora exacta en que el contador debe terminar.
  // Esto no se pierde si el navegador se congela.
  const endTimeRef = useRef(null);

  // Función para recalcular el tiempo restante basándose en la hora de finalización.
  const updateTimer = useCallback(() => {
    if (!endTimeRef.current) return;
    
    const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
    const newTimeLeft = Math.max(0, remaining);

    if (newTimeLeft === 0) {
      setIsActive(false);
      // Opcional: Sonido de notificación al finalizar
    }
    setTimeLeft(newTimeLeft);
  }, []);

  // Efecto principal que maneja el intervalo del contador.
  useEffect(() => {
    if (!isActive) return;

    const intervalId = setInterval(updateTimer, 500); // Se ejecuta más frecuente para mayor precisión visual
    return () => clearInterval(intervalId);
  }, [isActive, updateTimer]);

  // Efecto que detecta cuando el usuario vuelve a la pestaña del navegador.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        updateTimer(); // Actualiza el tiempo inmediatamente al volver.
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, updateTimer]);

  const startTimer = (selectedDuration) => {
    setDuration(selectedDuration);
    setTimeLeft(selectedDuration);
    // Calculamos y guardamos la hora de finalización.
    endTimeRef.current = Date.now() + selectedDuration * 1000;
    setIsActive(true);
    setView('timer');
  };

  const togglePause = () => {
    setIsActive(currentIsActive => {
      const newIsActive = !currentIsActive;
      if (newIsActive) {
        // Al reanudar, calculamos una nueva hora de finalización.
        endTimeRef.current = Date.now() + timeLeft * 1000;
      } else {
        // Al pausar, simplemente detenemos el intervalo (se hace en el useEffect).
        updateTimer(); // Aseguramos que el tiempo se guarde con precisión al pausar.
      }
      return newIsActive;
    });
  };

  const adjustTime = (seconds) => {
    if (endTimeRef.current) {
        endTimeRef.current += seconds * 1000;
        updateTimer();
    }
  };

  // --- FIN DE LA MODIFICACIÓN ---

  const goBackToSelect = () => {
    setIsActive(false);
    endTimeRef.current = null;
    setView('select');
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = view === 'timer' && duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
      <GlassCard 
        className="relative p-8 m-4 w-full max-w-sm text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"><X size={20} /></button>
        
        {view === 'select' && (
          <div>
            <h3 className="text-xl font-bold mb-6">Seleccionar Descanso</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[60, 120, 180].map(time => (
                <button 
                  key={time} 
                  onClick={() => startTimer(time)}
                  className="p-4 bg-bg-secondary rounded-md border border-glass-border hover:border-accent transition"
                >
                  <span className="font-bold text-xl">{time / 60}</span>
                  <span className="text-xs text-text-muted">min</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                placeholder="Segundos"
                onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
                className="w-full text-center bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition"
              />
              <button 
                onClick={() => startTimer(duration)}
                className="px-6 py-3 rounded-md bg-accent text-bg-secondary font-semibold whitespace-nowrap"
              >
                Iniciar
              </button>
            </div>
          </div>
        )}

        {view === 'timer' && (
          <div>
            <button onClick={goBackToSelect} className="absolute top-4 left-4 text-text-secondary hover:text-text-primary"><ArrowLeft size={20} /></button>
            <h3 className="text-xl font-bold mb-4">Tiempo de Descanso</h3>
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-glass-border" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <circle
                  className="text-accent"
                  strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * progress) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                />
              </svg>
              <div className="absolute font-mono text-5xl font-bold">
                {formatTime(timeLeft)}
              </div>
            </div>
            <div className="flex justify-center items-center gap-6 mt-6">
              <button onClick={() => adjustTime(-10)} className="p-4 rounded-full bg-bg-secondary hover:bg-white/10 transition font-semibold">
                -10s
              </button>
              <button onClick={togglePause} className="p-5 rounded-full bg-accent text-bg-secondary transition hover:scale-105">
                {isActive ? <Pause size={28} /> : <Play size={28} />}
              </button>
              <button onClick={() => adjustTime(10)} className="p-4 rounded-full bg-bg-secondary hover:bg-white/10 transition font-semibold">
                +10s
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default RestTimerModal;