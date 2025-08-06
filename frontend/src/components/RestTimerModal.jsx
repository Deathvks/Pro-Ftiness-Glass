import React, { useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import GlassCard from './GlassCard';
import useAppStore from '../store/useAppStore';

const RestTimerModal = () => {
  const {
    isResting,
    restTimerEndTime,
    startRestTimer,
    stopRestTimer,
  } = useAppStore(state => ({
    isResting: state.isResting,
    restTimerEndTime: state.restTimerEndTime,
    startRestTimer: state.startRestTimer,
    stopRestTimer: state.stopRestTimer,
  }));

  const [timeLeft, setTimeLeft] = useState(0);
  const [view, setView] = useState(restTimerEndTime ? 'timer' : 'select');
  const [customDuration, setCustomDuration] = useState(60);

  useEffect(() => {
    if (!isResting || !restTimerEndTime) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.round((restTimerEndTime - Date.now()) / 1000);
      const newTimeLeft = Math.max(0, remaining);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft === 0) {
        stopRestTimer();
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 500);
    return () => clearInterval(intervalId);
  }, [isResting, restTimerEndTime, stopRestTimer]);

  const handleStart = (duration) => {
    if(duration > 0) {
      startRestTimer(duration);
      setView('timer');
    }
  };

  const goBackToSelect = () => {
    stopRestTimer();
    setView('select');
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const totalDuration = restTimerEndTime ? (restTimerEndTime - (Date.now() - timeLeft * 1000)) / 1000 : 0;
  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
      <GlassCard 
        className="relative p-8 m-4 w-full max-w-sm text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={stopRestTimer} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"><X size={20} /></button>
        
        {view === 'select' && (
          <div>
            <h3 className="text-xl font-bold mb-6">Seleccionar Descanso</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[60, 120, 180].map(time => (
                <button 
                  key={time} 
                  onClick={() => handleStart(time)}
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
                value={customDuration}
                onChange={(e) => setCustomDuration(parseInt(e.target.value, 10) || 0)}
                className="w-full text-center bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition"
              />
              <button 
                onClick={() => handleStart(customDuration)}
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
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default RestTimerModal;