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
    const [isExpanded, setIsExpanded] = useState(false);

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

    const handlePressStart = () => {
        isLongPressRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            ignoreClickRef.current = true;

            setIsExpanded(true);
            if (navigator.vibrate) navigator.vibrate(50);

            setTimeout(() => { ignoreClickRef.current = false; }, 1000);
        }, 400);
    };

    const handlePressEnd = () => {
        clearTimeout(longPressTimerRef.current);
    };

    const handleShortClick = (e, action) => {
        e.stopPropagation();
        if (!isLongPressRef.current) {
            action();
        }
    };

    const handleOverlayInteraction = (e) => {
        e.stopPropagation();
        if (e.type === 'touchstart') {
            e.preventDefault();
        }
        setIsExpanded(false);
    };

    const handleBackgroundClick = (e) => {
        e.stopPropagation();
        if (ignoreClickRef.current) {
            ignoreClickRef.current = false;
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
            {isExpanded && (
                <div
                    className="fixed inset-0 z-[90] bg-black/10 backdrop-blur-[2px] transition-all duration-300"
                    onClick={handleOverlayInteraction}
                    onTouchStart={handleOverlayInteraction}
                />
            )}

            <div
                ref={containerRef}
                className="fixed top-[calc(env(safe-area-inset-top,0px)+12px)] left-1/2 -translate-x-1/2 z-[100] animate-[fade-in_0.3s_ease-out] flex flex-col items-center"
            >
                <div className={`
                    relative bg-black text-white shadow-2xl 
                    transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] overflow-hidden select-none
                    ${isExpanded
                        ? 'w-[340px] h-[240px] rounded-[48px] ring-1 ring-white/10'
                        : 'w-[210px] h-11 rounded-[22px] ring-1 ring-white/5'
                    }
                    ${isFinished
                        ? (isBlinking
                            ? 'shadow-[0_0_25px] shadow-accent/60 ring-1 ring-accent'
                            : 'shadow-none'
                        )
                        : ''
                    }
                `}>

                    {/* Barra de progreso inferior */}
                    <div
                        className={`absolute bottom-0 left-0 h-[2px] bg-accent transition-opacity duration-300 ${!isExpanded && !isFinished ? 'opacity-100' : 'opacity-0'}`}
                        style={{ width: `${progress}%` }}
                    />

                    {/* --- ESTADO CONTRAÍDO --- */}
                    <div className={`
                        absolute inset-0 flex items-center justify-between pl-1 pr-1
                        transition-all duration-300
                        ${!isExpanded ? 'opacity-100 scale-100 delay-75 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'}
                    `}>
                        <button
                            onMouseDown={handlePressStart}
                            onMouseUp={handlePressEnd}
                            onTouchStart={handlePressStart}
                            onTouchEnd={handlePressEnd}
                            onMouseLeave={handlePressEnd}
                            onClick={(e) => handleShortClick(e, () => setRestTimerMode('modal'))}
                            className="flex-1 flex items-center gap-3 px-3 h-full hover:bg-white/5 transition-colors cursor-pointer focus:outline-none rounded-l-[22px]"
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <div className={`p-1.5 rounded-full ${isFinished ? 'bg-accent/20' : 'bg-white/10'}`}>
                                <Timer size={14} className={isFinished ? 'text-accent' : 'text-accent'} />
                            </div>
                            <span className={`font-mono text-base font-bold tracking-widest pt-0.5 ${isFinished ? 'text-accent' : ''}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </button>

                        <div className="w-px h-5 bg-white/10 mx-1"></div>

                        <div className="flex items-center gap-1">
                            <button
                                onMouseDown={handlePressStart}
                                onMouseUp={handlePressEnd}
                                onTouchStart={handlePressStart}
                                onTouchEnd={handlePressEnd}
                                onMouseLeave={handlePressEnd}
                                onClick={(e) => handleShortClick(e, togglePauseRestTimer)}
                                onContextMenu={(e) => e.preventDefault()}
                                className={`
                                    px-3 py-1.5 rounded-[14px] flex items-center justify-center transition-all focus:outline-none active:scale-95
                                    ${isRestTimerPaused
                                        ? 'bg-accent text-white hover:opacity-90 shadow-sm shadow-accent/30'
                                        : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                                    }
                                `}
                            >
                                {isRestTimerPaused ? (
                                    <Play size={12} fill="currentColor" className="ml-0.5" />
                                ) : (
                                    <Pause size={12} fill="currentColor" />
                                )}
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    stopRestTimer();
                                }}
                                className="p-1.5 rounded-full hover:bg-red/20 text-gray-400 hover:text-red transition-colors ml-1 mr-1 focus:outline-none"
                                aria-label="Cerrar temporizador"
                            >
                                <X size={14} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    {/* --- ESTADO EXPANDIDO --- */}
                    <div
                        onClick={handleBackgroundClick}
                        className={`
                            absolute inset-0 flex flex-col px-8 py-7 h-full w-full cursor-pointer
                            transition-all duration-300
                            ${isExpanded ? 'opacity-100 scale-100 delay-75 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
                        `}
                    >
                        <div className="flex items-center justify-between mb-4 pointer-events-none">
                            <div className="flex items-center gap-2 text-gray-400 text-sm font-bold uppercase tracking-wider">
                                <span>En descanso</span>
                            </div>
                            <div className={`font-mono text-4xl font-black tracking-widest ${isFinished ? 'text-accent animate-pulse' : 'text-white'}`}>
                                {formatTime(timeLeft)}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-6 cursor-default">
                            <button onClick={(e) => { e.stopPropagation(); handleAddOption(15); }} className="bg-white/10 hover:bg-white/20 active:bg-white/30 ring-1 ring-white/5 rounded-[16px] py-3 text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5">
                                <Plus size={14} /> 15s
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleAddOption(30); }} className="bg-white/10 hover:bg-white/20 active:bg-white/30 ring-1 ring-white/5 rounded-[16px] py-3 text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5">
                                <Plus size={14} /> 30s
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleAddOption(60); }} className="bg-white/10 hover:bg-white/20 active:bg-white/30 ring-1 ring-white/5 rounded-[16px] py-3 text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5">
                                <Plus size={14} /> 1m
                            </button>
                        </div>

                        <div className="flex items-center justify-between mt-auto cursor-default">
                            <button
                                onClick={(e) => { e.stopPropagation(); stopRestTimer(); }}
                                className="p-3.5 rounded-full bg-red/20 text-red hover:bg-red/30 ring-1 ring-red/30 transition-all active:scale-95"
                                title="Detener"
                            >
                                <X size={22} strokeWidth={2.5} />
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); togglePauseRestTimer(); }}
                                className={`p-4 rounded-full transition-all active:scale-95 ${isRestTimerPaused ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'bg-white/10 text-white ring-1 ring-white/10 hover:bg-white/20'}`}
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
                                className="p-3.5 rounded-full bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white ring-1 ring-white/5 transition-all active:scale-95"
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