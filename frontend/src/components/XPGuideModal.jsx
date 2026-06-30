/* frontend/src/components/XPGuideModal.jsx */
import React, { useRef, useState } from 'react';
import {
    X, Trophy, Dumbbell, Calendar, Plus, Activity, Star, Crown,
    Utensils, Droplets, Zap, Rocket, ChefHat, Info, LogIn, Flame,
    Footprints, Shield
} from 'lucide-react';
import LevelBadge from './LevelBadge';

const XPGuideModal = ({ onClose }) => {
    const carouselRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftPos, setScrollLeftPos] = useState(0);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - carouselRef.current.offsetLeft);
        setScrollLeftPos(carouselRef.current.scrollLeft);
    };

    const handleMouseLeave = () => setIsDragging(false);
    const handleMouseUp = () => setIsDragging(false);

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - carouselRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        carouselRef.current.scrollLeft = scrollLeftPos - walk;
    };

    const dailyCardClass = "flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 group shadow-sm gap-3";
    const dailyXpClass = "font-black text-accent text-[11px] sm:text-xs transition-transform group-hover:scale-105 whitespace-nowrap text-right shrink-0 px-3 py-1.5 bg-accent/10 rounded-lg ring-1 ring-accent/30 tracking-wide";

    const goldCardClass = "flex items-center justify-between p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/20 rounded-[24px] ring-1 ring-amber-500/30 hover:ring-amber-500/50 transition-all duration-300 group shadow-sm gap-3";
    const goldXpClass = "font-black text-amber-500 text-[11px] sm:text-xs transition-transform group-hover:scale-105 whitespace-nowrap text-right shrink-0 px-3 py-1.5 bg-amber-500/20 rounded-lg ring-1 ring-amber-500/40 tracking-wide";

    const rankPreviews = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out] !pt-[calc(1rem+env(safe-area-inset-top,24px))] !pb-[calc(1rem+env(safe-area-inset-bottom,24px))]">
            {/* AQUÍ EL CAMBIO A 85dvh */}
            <div className="bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 rounded-[32px] w-full max-w-md max-h-[85dvh] flex flex-col shadow-2xl animate-[slide-up_0.3s_ease-out]">

                <div className="shrink-0 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/10 p-6 flex items-center justify-between rounded-t-[32px] z-10">
                    <h2 className="text-xl font-extrabold flex items-center gap-3 text-text-primary tracking-tight">
                        <div className="p-2.5 bg-accent/10 rounded-[14px] ring-1 ring-accent/30 shrink-0 shadow-sm">
                            <Star className="text-accent fill-accent animate-pulse" size={20} strokeWidth={1.5} />
                        </div>
                        Guía de Experiencia
                    </h2>
                    <button onClick={onClose} className="p-2.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors text-text-secondary hover:text-text-primary active:scale-95">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto overflow-x-hidden custom-scrollbar pb-8 w-full">
                    
                    <div className="bg-accent/10 rounded-[24px] p-5 flex items-start gap-4 mb-8 ring-1 ring-accent/30 shadow-sm w-full">
                        <div className="p-2 bg-accent rounded-[12px] text-white shrink-0 mt-0.5 shadow-md">
                            <Info size={18} strokeWidth={2.5} />
                        </div>
                        <p className="text-text-secondary text-sm font-medium leading-relaxed">
                            Gana XP realizando acciones diarias. <br />
                            <span className="text-accent font-extrabold tracking-widest uppercase text-[10px] mt-2 block">Nota importante:</span> 
                            Para mantener tu racha, basta con realizar <strong>cualquiera</strong> de estas acciones al menos una vez al día.
                        </p>
                    </div>

                    <section className="mb-10 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[28px] p-5 w-full overflow-hidden shadow-inner">
                        <h3 className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-widest mb-5 flex items-center gap-2">
                            <Shield size={16} className="text-accent" strokeWidth={2.5} />
                            Jerarquía de Rangos
                        </h3>
                        <div 
                            ref={carouselRef}
                            onMouseDown={handleMouseDown}
                            onMouseLeave={handleMouseLeave}
                            onMouseUp={handleMouseUp}
                            onMouseMove={handleMouseMove}
                            className={`flex gap-3 overflow-x-auto custom-scrollbar pb-4 px-1 items-stretch select-none w-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                        >
                            {rankPreviews.map(level => (
                                <div key={level} className="flex-shrink-0 flex flex-col items-center justify-between gap-3 w-[135px] p-4 bg-bg-primary rounded-[20px] ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
                                    <div className="pointer-events-none flex flex-col items-center justify-center flex-1 w-full whitespace-nowrap">
                                        <LevelBadge level={level} size="md" showName={true} />
                                    </div>
                                    <span className="text-[10px] text-text-secondary font-bold bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-[8px] ring-1 ring-black/5 dark:ring-white/10 pointer-events-none mt-2 uppercase tracking-wider shrink-0 w-max">
                                        Nv. {level}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="mb-10 w-full">
                        <h3 className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                            Acciones Diarias
                        </h3>
                        <div className="space-y-3 w-full">
                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-blue-500 rounded-[14px] shrink-0 shadow-sm">
                                        <LogIn size={20} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-extrabold text-sm text-text-primary truncate tracking-tight">Inicio de Sesión</span>
                                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary truncate mt-0.5">Entra a la app cada día</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+25 XP (1/d)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-blue-500 rounded-[14px] shrink-0 shadow-sm">
                                        <Dumbbell size={20} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-extrabold text-sm text-text-primary truncate tracking-tight">Entrenamiento</span>
                                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary truncate mt-0.5">Finaliza una rutina</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+50 XP (2/d)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-emerald-500 rounded-[14px] shrink-0 shadow-sm">
                                        <Footprints size={20} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-extrabold text-sm text-text-primary truncate tracking-tight">Sesión de Cardio</span>
                                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary truncate mt-0.5">Registra actividad cardio</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+50 XP (2/d)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-green rounded-[14px] shrink-0 shadow-sm">
                                        <Plus size={20} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-extrabold text-sm text-text-primary truncate tracking-tight">Crear Rutina</span>
                                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary truncate mt-0.5">Nuevo plan personalizado</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+20 XP (1/d)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-purple-500 rounded-[14px] shrink-0 shadow-sm">
                                        <Activity size={20} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-extrabold text-sm text-text-primary truncate tracking-tight">Registrar Peso</span>
                                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary truncate mt-0.5">Actualiza tu peso</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+10 XP (1/d)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-orange-500 rounded-[14px] shrink-0 shadow-sm">
                                        <Utensils size={20} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-extrabold text-sm text-text-primary truncate tracking-tight">Registrar Comida</span>
                                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary truncate mt-0.5">Añade un alimento</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+5 XP (5/d)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-red rounded-[14px] shrink-0 shadow-sm">
                                        <Flame size={20} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-extrabold text-sm text-text-primary truncate tracking-tight">Meta Calorías</span>
                                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary truncate mt-0.5">Alcanza tu objetivo</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+30 XP (1/d)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-cyan-500 rounded-[14px] shrink-0 shadow-sm">
                                        <Droplets size={20} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-extrabold text-sm text-text-primary truncate tracking-tight">Registrar Agua</span>
                                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary truncate mt-0.5">Registra tu hidratación</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                    <span className={dailyXpClass}>+5 XP /vaso</span>
                                    <span className="text-[9px] text-text-muted font-bold mt-1 uppercase tracking-widest">Máx 50 XP/d</span>
                                </div>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-yellow-500 rounded-[14px] shrink-0 shadow-sm">
                                        <Zap size={20} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-extrabold text-sm text-text-primary truncate tracking-tight">Registrar Creatina</span>
                                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary truncate mt-0.5">Marca tu toma diaria</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+5 XP (1/d)</span>
                            </div>
                        </div>
                    </section>

                    <section className="w-full">
                        <h3 className="text-[11px] sm:text-xs font-bold text-amber-500 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2 drop-shadow-sm">
                            <Crown size={16} className="animate-pulse shrink-0" strokeWidth={2.5} /> Insignias y Hitos
                        </h3>
                        <div className="space-y-3 w-full">
                            <div className={goldCardClass}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="p-3 bg-bg-primary text-amber-500 rounded-[14px] ring-1 ring-amber-500/30 shrink-0 shadow-sm">
                                        <Rocket size={20} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-extrabold text-sm text-text-primary truncate tracking-tight">Primer Paso</span>
                                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary truncate mt-0.5">Por iniciar sesión 1ª vez</span>
                                    </div>
                                </div>
                                <span className={goldXpClass}>+50 XP</span>
                            </div>

                            <div className={goldCardClass}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="p-3 bg-bg-primary text-amber-500 rounded-[14px] ring-1 ring-amber-500/30 shrink-0 shadow-sm">
                                        <Trophy size={20} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-extrabold text-sm text-text-primary truncate tracking-tight">1º Entrenamiento</span>
                                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary truncate mt-0.5">Al completar el primero</span>
                                    </div>
                                </div>
                                <span className={goldXpClass}>+100 XP</span>
                            </div>

                            <div className={goldCardClass}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="p-3 bg-bg-primary text-amber-500 rounded-[14px] ring-1 ring-amber-500/30 shrink-0 shadow-sm">
                                        <ChefHat size={20} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-extrabold text-sm text-text-primary truncate tracking-tight">Chef</span>
                                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary truncate mt-0.5">Por registrar 5 comidas</span>
                                    </div>
                                </div>
                                <span className={goldXpClass}>+100 XP</span>
                            </div>

                            <div className={goldCardClass}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="p-3 bg-bg-primary text-amber-500 rounded-[14px] ring-1 ring-amber-500/30 shrink-0 shadow-sm">
                                        <Calendar size={20} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-extrabold text-sm text-text-primary truncate tracking-tight">Racha de 3 Días</span>
                                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary truncate mt-0.5">3 días seguidos activo</span>
                                    </div>
                                </div>
                                <span className={goldXpClass}>+150 XP</span>
                            </div>

                            <div className={goldCardClass}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="p-3 bg-bg-primary text-amber-500 rounded-[14px] ring-1 ring-amber-500/30 shrink-0 shadow-sm">
                                        <Calendar size={20} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-extrabold text-sm text-text-primary truncate tracking-tight">Racha de 7 Días</span>
                                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary truncate mt-0.5">7 días seguidos activo</span>
                                    </div>
                                </div>
                                <span className={goldXpClass}>+300 XP</span>
                            </div>

                            <div className={goldCardClass}>
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="p-3 bg-bg-primary text-amber-500 rounded-[14px] ring-1 ring-amber-500/30 shrink-0 shadow-sm">
                                        <Crown size={20} strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-extrabold text-sm text-text-primary truncate tracking-tight">Racha de 30 Días</span>
                                        <span className="text-[10px] sm:text-xs font-medium text-text-secondary truncate mt-0.5">30 días seguidos activo</span>
                                    </div>
                                </div>
                                <span className={goldXpClass}>+1000 XP</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default XPGuideModal;