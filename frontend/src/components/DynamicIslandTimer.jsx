/* frontend/src/components/DynamicIslandTimer.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { X, Timer, Pause, Play, Plus } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const DynamicIslandTimer = () => {
    const {
        restTimerEndTime,
        restTimerInitialDuration,
        stopRestTimer,
        setRestTimerMode,
        addRestTime,
        togglePauseRestTimer,
        isRestTimerPaused,
        restTimerRemaining,
    } = useAppStore(state => ({
        restTimerEndTime: state.restTimerEndTime,
        restTimerInitialDuration: state.restTimerInitialDuration,
        stopRestTimer: state.stopRestTimer,
        setRestTimerMode: state.setRestTimerMode,
        addRestTime: state.addRestTime,
        togglePauseRestTimer: state.togglePauseRestTimer,
        isRestTimerPaused: state.isRestTimerPaused,
        restTimerRemaining: state.restTimerRemaining,
    }));

    const [timeLeft, setTimeLeft] = useState(0);
    const [progress, setProgress] = useState(100);
    const [isBlinking, setIsBlinking] = useState(true);

    // Estado para la expansión de la isla
    const [isExpanded, setIsExpanded] = useState(false);

    // Refs para controlar el Long Press y evitar clicks fantasma
    const longPressTimerRef = useRef(null);
    const isLongPressRef = useRef(false);
    const containerRef = useRef(null);
    const ignoreClickRef = useRef(false);

    useEffect(() => {
        if (!restTimerEndTime && !isRestTimerPaused) return;

        const updateTimer = () => {
            let diff;

            if (isRestTimerPaused && restTimerRemaining !== null) {
                diff = Math.ceil(restTimerRemaining / 1000);
            } else {
                const now = Date.now();
                diff = Math.ceil((restTimerEndTime - now) / 1000);
            }

            if (diff <= 0) {
                setTimeLeft(0);
                setProgress(0);
            } else {
                setTimeLeft(diff);
                const total = restTimerInitialDuration || 1;
                const p = Math.min(100, Math.max(0, (diff / total) * 100));
                setProgress(p);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 100);

        return () => clearInterval(interval);
    }, [restTimerEndTime, restTimerInitialDuration, isRestTimerPaused, restTimerRemaining]);

    const isFinished = timeLeft === 0;

    useEffect(() => {
        if (isFinished) {
            const blinkInterval = setInterval(() => {
                setIsBlinking(prev => !prev);
            }, 500);
            return () => clearInterval(blinkInterval);
        } else {
            setIsBlinking(true);
        }
    }, [isFinished]);


    // --- Lógica de Long Press Mejorada ---
    const handlePressStart = () => {
        isLongPressRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            ignoreClickRef.current = true; // Activar escudo para evitar click inmediato al soltar

            setIsExpanded(true);
            if (navigator.vibrate) navigator.vibrate(50);

            setTimeout(() => { ignoreClickRef.current = false; }, 1000);
        }, 400);
    };

    const handlePressEnd = () => {
        // Solo limpiamos el timer. La acción corta se maneja en onClick.
        clearTimeout(longPressTimerRef.current);
    };

    // --- Handler para el Click Corto (Play/Pausa o Maximizar) ---
    const handleShortClick = (e, action) => {
        e.stopPropagation();
        // Solo ejecutamos si NO fue un long press
        if (!isLongPressRef.current) {
            action();
        }
    };

    const handleBackgroundClick = (e) => {
        if (ignoreClickRef.current) {
            ignoreClickRef.current = false;
            e.stopPropagation();
            return;
        }
        setIsExpanded(false);
    };

    const handleAddOption = (seconds) => {
        addRestTime(seconds);
        setIsExpanded(false);
    };

    const formatTime = (seconds) => {
        if (seconds < 0) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!restTimerEndTime && !isRestTimerPaused) return null;

    return (
        <>
            {/* Overlay invisible para atrapar clicks cuando está expandida */}
            {isExpanded && (
                <div 
                    className="fixed inset-0 z-[90]" 
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(false);
                    }}
                    onTouchStart={(e) => {
                        e.stopPropagation();
                        setIsExpanded(false);
                    }}
                />
            )}

            <div
                ref={containerRef}
                className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] animate-[fade-in_0.3s_ease-out] flex flex-col items-center"
            >
                <div className={`
                    relative bg-black text-white shadow-2xl 
                    transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] overflow-hidden select-none
                    ${isExpanded
                        ? 'w-[320px] h-[220px] rounded-[2.5rem]'
                        : 'w-[210px] h-11 rounded-[22px]'
                    }
                    ${isFinished
                        ? (isBlinking
                            ? 'border border-gray-800 shadow-[0_0_20px] shadow-accent'
                            : 'border border-gray-800 shadow-none'
                        )
                        : 'border border-gray-800'
                    }
                `}>

                    {/* --- PROGRESS BAR (Solo visible en modo píldora) --- */}
                    <div
                        className={`absolute bottom-0 left-0 h-[2px] bg-accent transition-opacity duration-300 ${!isExpanded && !isFinished ? 'opacity-80' : 'opacity-0'}`}
                        style={{ width: `${progress}%` }}
                    />

                    {/* --- CONTENIDO MODO PÍLDORA (Overlay) --- */}
                    <div className={`
                        absolute inset-0 flex items-center justify-between pl-1 pr-1
                        transition-all duration-300
                        ${!isExpanded ? 'opacity-100 scale-100 delay-75 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'}
                    `}>
                        <button
                            // Eventos Long Press
                            onMouseDown={handlePressStart}
                            onMouseUp={handlePressEnd}
                            onTouchStart={handlePressStart}
                            onTouchEnd={handlePressEnd}
                            onMouseLeave={handlePressEnd}
                            // Evento Click Corto
                            onClick={(e) => handleShortClick(e, () => setRestTimerMode('modal'))}
                            // Estilos
                            className="flex-1 flex items-center gap-3 px-3 h-full hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <div className={`p-1.5 rounded-full ${isFinished ? 'bg-accent/20' : 'bg-gray-900'}`}>
                                <Timer size={14} className={isFinished ? 'text-accent' : 'text-accent'} />
                            </div>
                            <span className={`font-mono text-base font-bold tracking-wider pt-0.5 ${isFinished ? 'text-accent' : ''}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </button>

                        <div className="w-[1px] h-4 bg-gray-800 mx-1"></div>

                        <div className="flex items-center gap-1">
                            {/* --- BOTÓN PLAY/PAUSA --- */}
                            <button
                                onMouseDown={handlePressStart}
                                onMouseUp={handlePressEnd}
                                onTouchStart={handlePressStart}
                                onTouchEnd={handlePressEnd}
                                onMouseLeave={handlePressEnd}
                                onClick={(e) => handleShortClick(e, togglePauseRestTimer)}
                                onContextMenu={(e) => e.preventDefault()}
                                className={`
                                    px-3 py-1.5 rounded-md flex items-center justify-center transition-colors focus:outline-none
                                    ${isRestTimerPaused
                                        ? 'bg-accent text-bg-secondary hover:bg-accent/90'
                                        : 'bg-gray-900 text-gray-300 border border-gray-700 hover:bg-gray-800 hover:text-white'
                                    }
                                `}
                            >
                                {isRestTimerPaused ? (
                                    <Play size={12} fill="currentColor" />
                                ) : (
                                    <Pause size={12} fill="currentColor" />
                                )}
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    stopRestTimer();
                                }}
                                className="p-1.5 rounded-full hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors ml-1 focus:outline-none"
                                aria-label="Cerrar temporizador"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* --- CONTENIDO MODO EXPANDIDO (Overlay) --- */}
                    <div
                        onClick={handleBackgroundClick}
                        className={`
                            absolute inset-0 flex flex-col p-6 h-full w-full cursor-pointer
                            transition-all duration-300
                            ${isExpanded ? 'opacity-100 scale-100 delay-75 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
                        `}
                    >
                        <div className="flex items-center justify-between mb-2 pointer-events-none">
                            <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                                <span>En descanso</span>
                            </div>
                            <div className={`font-mono text-4xl font-bold tracking-widest ${isFinished ? 'text-accent animate-pulse' : 'text-white'}`}>
                                {formatTime(timeLeft)}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4 cursor-default">
                            <button onClick={(e) => { e.stopPropagation(); handleAddOption(15); }} className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-xl py-3 text-xs font-bold transition flex flex-col items-center justify-center gap-1">
                                <Plus size={12} /> 15s
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleAddOption(30); }} className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-xl py-3 text-xs font-bold transition flex flex-col items-center justify-center gap-1">
                                <Plus size={12} /> 30s
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleAddOption(60); }} className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-xl py-3 text-xs font-bold transition flex flex-col items-center justify-center gap-1">
                                <Plus size={12} /> 1m
                            </button>
                        </div>

                        <div className="flex items-center justify-between mt-auto cursor-default">
                            <button
                                onClick={(e) => { e.stopPropagation(); stopRestTimer(); }}
                                className="p-3 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                                title="Detener"
                            >
                                <X size={22} />
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); togglePauseRestTimer(); }}
                                className={`p-4 rounded-full transition-transform active:scale-95 ${isRestTimerPaused ? 'bg-accent text-bg-secondary' : 'bg-gray-700 text-white'}`}
                                title={isRestTimerPaused ? "Reanudar" : "Pausar"}
                            >
                                {isRestTimerPaused ? <Play size={28} fill="currentColor" className="ml-1" /> : <Pause size={28} fill="currentColor" />}
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(false);
                                    setRestTimerMode('modal');
                                }}
                                className="p-3 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
                                title="Abrir en grande"
                            >
                                <Timer size={22} />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default DynamicIslandTimer;