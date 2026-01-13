/* frontend/src/components/RestTimerModal.jsx */
import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Plus, Minus, Minimize2, Play, Pause } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { triggerHaptic, HapticType } from '../utils/haptics';

const RestTimerModal = () => {
  const {
    restTimerEndTime,
    restTimerInitialDuration,
    startRestTimer,
    stopRestTimer,
    addRestTime,
    resetRestTimer,
    plannedRestTime,
    setRestTimerMode,
    togglePauseRestTimer,
    isRestTimerPaused,
    restTimerRemaining,
  } = useAppStore(state => ({
    restTimerEndTime: state.restTimerEndTime,
    restTimerInitialDuration: state.restTimerInitialDuration,
    startRestTimer: state.startRestTimer,
    stopRestTimer: state.stopRestTimer,
    addRestTime: state.addRestTime,
    resetRestTimer: state.resetRestTimer,
    plannedRestTime: state.plannedRestTime,
    setRestTimerMode: state.setRestTimerMode,
    togglePauseRestTimer: state.togglePauseRestTimer,
    isRestTimerPaused: state.isRestTimerPaused,
    restTimerRemaining: state.restTimerRemaining,
  }));

  const [timeLeft, setTimeLeft] = useState(0);
  const [view, setView] = useState((restTimerEndTime || isRestTimerPaused) ? 'timer' : 'select');
  const [customDuration, setCustomDuration] = useState('');

  useEffect(() => {
    if (!restTimerEndTime && !isRestTimerPaused) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      let remaining = 0;

      if (isRestTimerPaused && restTimerRemaining !== null) {
        remaining = Math.ceil(restTimerRemaining / 1000);
      } else if (restTimerEndTime) {
        remaining = Math.round((restTimerEndTime - Date.now()) / 1000);
      }

      const newTimeLeft = Math.max(0, remaining);

      setTimeLeft(prevTimeLeft => {
        if (prevTimeLeft > 0 && newTimeLeft === 0) {
          triggerHaptic(HapticType.timer);
        }
        return newTimeLeft;
      });
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 100);

    return () => clearInterval(intervalId);
  }, [restTimerEndTime, isRestTimerPaused, restTimerRemaining]);

  const parseTimeToSeconds = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return 0;

    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      const minutes = parseInt(parts[0] || '0', 10);
      const seconds = parseInt(parts[1] || '0', 10);
      return (minutes * 60) + seconds;
    }

    const parsedSeconds = parseInt(timeString, 10);
    return isNaN(parsedSeconds) ? 0 : parsedSeconds;
  };

  const handleStartCustom = () => {
    const durationInSeconds = parseTimeToSeconds(customDuration);
    if (durationInSeconds > 0) {
      triggerHaptic(HapticType.success);
      startRestTimer(durationInSeconds);
      setTimeLeft(durationInSeconds);
      setView('timer');
    }
  };

  const handleCustomDurationChange = (e) => {
    const value = e.target.value;
    if (/^[0-9:]*$/.test(value) && (value.match(/:/g) || []).length <= 1) {
      setCustomDuration(value);
    }
  };

  const handleStartPreset = (duration) => {
    if (duration > 0) {
      triggerHaptic(HapticType.success);
      startRestTimer(duration);
      setTimeLeft(duration);
      setView('timer');
    }
  };

  const goBackToSelect = () => {
    triggerHaptic(HapticType.selection);
    resetRestTimer();
    setView('select');
  };

  const handleClose = () => {
    triggerHaptic(HapticType.selection);
    stopRestTimer();
  };

  const handleMinimize = () => {
    triggerHaptic(HapticType.selection);
    setRestTimerMode('minimized');
  };

  const handlePauseToggle = () => {
    triggerHaptic(HapticType.selection);
    togglePauseRestTimer();
  };

  const handleAddTime = (seconds) => {
    triggerHaptic(HapticType.selection);
    addRestTime(seconds);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = restTimerInitialDuration > 0 && timeLeft > 0
    ? ((restTimerInitialDuration - timeLeft) / restTimerInitialDuration) * 100
    : timeLeft === 0 ? 100 : 0;

  const planned = plannedRestTime || 90;
  const formattedPlanned = formatTime(planned);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
      <div
        className="relative p-8 m-4 w-full max-w-sm text-center bg-bg-primary rounded-2xl border border-glass-border shadow-2xl animate-[scale-in_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={handleClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"><X size={20} /></button>

        {view === 'select' && (
          <div>
            <h3 className="text-xl font-bold mb-6 text-text-primary">Seleccionar Descanso</h3>

            <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-glass-border" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <circle
                  className="text-accent"
                  strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset={283}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                />
              </svg>
              <div className="absolute font-mono text-5xl font-bold text-text-secondary">
                {restTimerEndTime ? formatTime(timeLeft) : '0:00'}
              </div>
            </div>

            <button
              onClick={() => handleStartPreset(planned)}
              // CAMBIO: Eliminado 'border border-accent/50' para quitar el borde.
              className="w-full p-4 mb-4 bg-accent text-bg-secondary rounded-xl hover:bg-accent/80 transition font-bold text-lg shadow-lg shadow-accent/20"
            >
              Iniciar Planeado ({formattedPlanned})
            </button>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[60, 120, 180].map(time => (
                <button
                  key={time}
                  onClick={() => handleStartPreset(time)}
                  className="p-4 bg-bg-secondary rounded-xl border border-glass-border hover:border-accent transition text-text-primary hover:text-accent"
                >
                  <span className="font-bold text-xl">{time / 60}</span>
                  <span className="text-xs text-text-muted block">min</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="M:SS"
                value={customDuration}
                onChange={handleCustomDurationChange}
                className="w-full text-center bg-bg-secondary border border-glass-border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition placeholder-text-tertiary"
              />
              <button
                onClick={handleStartCustom}
                className="px-6 py-3 rounded-xl bg-accent text-bg-secondary font-bold whitespace-nowrap shadow-md shadow-accent/10"
              >
                Iniciar
              </button>
            </div>
          </div>
        )}

        {view === 'timer' && (
          <div>
            <button onClick={goBackToSelect} className="absolute top-4 left-4 text-text-secondary hover:text-text-primary"><ArrowLeft size={20} /></button>

            <button
              onClick={handleMinimize}
              className="absolute top-4 right-14 text-text-secondary hover:text-accent transition-colors"
              title="Minimizar a Isla Dinámica"
            >
              <Minimize2 size={20} />
            </button>

            <h3 className="text-xl font-bold mb-4 text-text-primary">Tiempo de Descanso</h3>
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-glass-border" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <circle
                  className={timeLeft > 0 ? "text-accent" : "text-red"}
                  strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * progress) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.5s linear, stroke 0.5s linear' }}
                />
              </svg>
              <div className={`absolute font-mono text-5xl font-bold ${timeLeft === 0 ? 'animate-pulse text-red' : 'text-text-primary'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-6">
              <div className="flex justify-center">
                <button
                  onClick={handlePauseToggle}
                  className={`
                            p-4 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center
                            ${isRestTimerPaused
                      ? 'bg-accent text-bg-secondary hover:bg-accent/90'
                      : 'bg-bg-tertiary border border-glass-border text-text-primary hover:border-accent'
                    }
                        `}
                  title={isRestTimerPaused ? "Reanudar" : "Pausar"}
                >
                  {isRestTimerPaused
                    ? <Play size={32} fill="currentColor" className="ml-1" />
                    : <Pause size={32} fill="currentColor" />
                  }
                </button>
              </div>

              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => handleAddTime(-10)}
                  disabled={timeLeft === 0}
                  className={`px-5 py-3 flex items-center justify-center gap-2 rounded-full border transition ${timeLeft === 0
                    ? 'bg-gray-200 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-bg-secondary border-glass-border text-text-primary hover:border-accent'
                    }`}
                >
                  <Minus size={18} />
                  <span className="font-semibold text-sm">-10 seg</span>
                </button>
                <button
                  onClick={() => handleAddTime(10)}
                  className="px-5 py-3 flex items-center justify-center gap-2 rounded-full bg-bg-secondary border border-glass-border text-text-primary hover:border-accent transition"
                >
                  <Plus size={18} />
                  <span className="font-semibold text-sm">+10 seg</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestTimerModal;