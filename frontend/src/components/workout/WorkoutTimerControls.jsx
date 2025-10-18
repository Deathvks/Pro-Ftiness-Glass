import React from 'react';
import { Play, Pause, Square } from 'lucide-react';
import GlassCard from '../GlassCard';

/**
 * Formatea segundos a HH:MM:SS.
 * @param {number} timeInSeconds - El tiempo total en segundos.
 * @returns {string} - El tiempo formateado como HH:MM:SS.
 */
const formatTime = (timeInSeconds) => {
    const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(timeInSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

/**
 * Muestra el temporizador del entrenamiento y los botones de control (Play/Pause, Finish).
 */
const WorkoutTimerControls = ({
    timer,
    isWorkoutPaused,
    hasWorkoutStarted,
    onTogglePause,
    onFinishClick,
}) => {
    return (
        <GlassCard className="p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4">
                {/* Temporizador */}
                <div className="font-mono text-4xl sm:text-5xl font-bold">{formatTime(timer)}</div>

                {/* Botones de control */}
                <div className="flex gap-4">
                    <button
                        onClick={onTogglePause}
                        className="p-4 rounded-full transition text-bg-secondary bg-accent hover:bg-accent/80"
                        aria-label={isWorkoutPaused ? "Reanudar entrenamiento" : "Pausar entrenamiento"}
                    >
                        {isWorkoutPaused ? <Play size={24} /> : <Pause size={24} />}
                    </button>
                    <button
                        onClick={onFinishClick}
                        className="p-4 rounded-full bg-red text-bg-secondary transition hover:bg-red/80"
                        aria-label="Finalizar entrenamiento"
                    >
                        <Square size={24} />
                    </button>
                </div>
            </div>

            {/* Aviso si el temporizador no ha empezado */}
            {!hasWorkoutStarted && (
                <div className="mt-4 p-3 bg-yellow/10 border border-yellow/20 rounded-md text-center">
                    <p className="text-yellow font-medium text-sm">⏱️ Inicia el cronómetro para comenzar a registrar datos</p>
                </div>
            )}
        </GlassCard>
    );
};

export default WorkoutTimerControls;