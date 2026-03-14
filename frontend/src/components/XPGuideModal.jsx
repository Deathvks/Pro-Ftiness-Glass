/* frontend/src/components/XPGuideModal.jsx */
import React, { useRef, useState } from 'react';
import {
    X, Trophy, Dumbbell, Calendar, Plus, Activity, Star, Crown,
    Utensils, Droplets, Zap, Rocket, ChefHat, Info, LogIn, Flame,
    Footprints, Shield, CheckCircle
} from 'lucide-react';
import LevelBadge from './LevelBadge';
import useAppStore from '../store/useAppStore';

const XPGuideModal = ({ onClose }) => {
    // Obtenemos las insignias desbloqueadas del estado global
    const unlockedBadges = useAppStore(state => state.gamification?.unlockedBadges || []);

    // Referencia y estados para el Drag-to-Scroll en PC
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
        const walk = (x - startX) * 2; // Velocidad de arrastre
        carouselRef.current.scrollLeft = scrollLeftPos - walk;
    };

    const dailyCardClass = "flex items-center justify-between p-3 bg-bg-primary rounded-xl border border-glass-border hover:border-accent/30 transition-all duration-300 group shadow-sm gap-2";
    const dailyXpClass = "font-bold text-accent text-xs sm:text-sm drop-shadow-[0_0_6px_rgba(34,211,238,0.4)] transition-transform group-hover:scale-110 whitespace-nowrap text-right shrink-0";

    const rankPreviews = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    // Lista de hitos e insignias
    const milestones = [
        { id: 'first_login', icon: Rocket, title: 'Primer Paso', desc: 'Por iniciar sesión 1ª vez', xp: 50 },
        { id: 'first_workout', icon: Trophy, title: '1º Entrenamiento', desc: 'Al completar el primero', xp: 100 },
        { id: 'nutrition_master', icon: ChefHat, title: 'Chef', desc: 'Por registrar 5 comidas', xp: 100 },
        { id: 'streak_3', icon: Calendar, title: 'Racha de 3 Días', desc: '3 días seguidos activo', xp: 150 },
        { id: 'streak_7', icon: Calendar, title: 'Racha de 7 Días', desc: '7 días seguidos activo', xp: 300 },
        { id: 'streak_14', icon: Shield, title: 'Muro de Acero', desc: '14 días seguidos activo', xp: 500 },
        { id: 'streak_30', icon: Crown, title: 'Leyenda', desc: '30 días seguidos activo', xp: 1000 },
        { id: 'streak_60', icon: Flame, title: 'Dios del Gym', desc: '60 días seguidos activo', xp: 2000 },
        { id: 'streak_100', icon: Zap, title: 'Titán', desc: '100 días seguidos activo', xp: 5000 },
        { id: 'streak_365', icon: Star, title: 'Inmortal', desc: '365 días seguidos activo', xp: 10000 },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-20 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
            <div className="bg-bg-secondary border border-glass-border rounded-2xl w-full max-w-md max-h-[70vh] mb-20 md:mb-0 flex flex-col shadow-2xl shadow-accent/10 animate-[slide-up_0.3s_ease-out]">

                <div className="shrink-0 bg-bg-secondary/95 backdrop-blur-md border-b border-glass-border p-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-text-primary">
                        <Star className="text-accent fill-accent animate-pulse" size={24} />
                        Guía de Experiencia
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-bg-primary rounded-full transition-colors text-text-secondary hover:text-text-primary">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden custom-scrollbar pb-6 w-full">
                    <div className="bg-accent/10 rounded-xl p-4 flex items-start gap-3 mb-6 border border-glass-border w-full">
                        <Info className="text-accent shrink-0 mt-0.5" size={20} />
                        <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">
                            Gana XP realizando acciones diarias. <br />
                            <span className="text-accent font-semibold">Nota:</span> Para mantener tu racha, basta con realizar <strong>cualquiera</strong> de estas acciones al menos una vez al día.
                        </p>
                    </div>

                    <section className="mb-8 bg-bg-primary border border-glass-border rounded-xl p-3 sm:p-4 w-full overflow-hidden">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Shield size={14} className="text-accent" />
                            Jerarquía de Rangos
                        </h3>
                        <div 
                            ref={carouselRef}
                            onMouseDown={handleMouseDown}
                            onMouseLeave={handleMouseLeave}
                            onMouseUp={handleMouseUp}
                            onMouseMove={handleMouseMove}
                            className={`flex gap-2 overflow-x-auto custom-scrollbar pb-4 px-2 items-center select-none w-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                        >
                            {rankPreviews.map(level => (
                                <div key={level} className="flex-shrink-0 flex flex-col items-center gap-2 w-[120px]">
                                    <div className="pointer-events-none">
                                        <LevelBadge level={level} size="md" showName={true} />
                                    </div>
                                    <span className="text-[10px] text-text-muted font-bold bg-bg-secondary px-2 py-0.5 rounded-full border border-glass-border pointer-events-none mt-1">
                                        Nv. {level}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="mb-8 w-full">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 ml-1 flex items-center gap-1">
                            Acciones Diarias
                        </h3>
                        <div className="space-y-2 w-full">
                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
                                        <LogIn size={18} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm text-text-primary truncate">Inicio de Sesión</span>
                                        <span className="text-[10px] sm:text-xs text-text-muted truncate">Entra a la app cada día</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+25 XP (1/día)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
                                        <Dumbbell size={18} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm text-text-primary truncate">Entrenamiento</span>
                                        <span className="text-[10px] sm:text-xs text-text-muted truncate">Finaliza una rutina</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+50 XP (Máx 2/día)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
                                        <Footprints size={18} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm text-text-primary truncate">Sesión de Cardio</span>
                                        <span className="text-[10px] sm:text-xs text-text-muted truncate">Registra actividad cardio</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+50 XP (Máx 2/día)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="p-2 bg-green-500/10 text-green-500 rounded-lg shrink-0">
                                        <Plus size={18} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm text-text-primary truncate">Crear Rutina</span>
                                        <span className="text-[10px] sm:text-xs text-text-muted truncate">Nuevo plan personalizado</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+20 XP (1/día)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg shrink-0">
                                        <Activity size={18} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm text-text-primary truncate">Registrar Peso</span>
                                        <span className="text-[10px] sm:text-xs text-text-muted truncate">Actualiza tu peso</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+10 XP (1/día)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg shrink-0">
                                        <Utensils size={18} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm text-text-primary truncate">Registrar Comida</span>
                                        <span className="text-[10px] sm:text-xs text-text-muted truncate">Añade un alimento</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+5 XP (Máx 5/día)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="p-2 bg-red-500/10 text-red-500 rounded-lg shrink-0">
                                        <Flame size={18} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm text-text-primary truncate">Meta de Calorías</span>
                                        <span className="text-[10px] sm:text-xs text-text-muted truncate">Alcanza tu objetivo</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+30 XP (1/día)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="p-2 bg-cyan-500/10 text-cyan-500 rounded-lg shrink-0">
                                        <Droplets size={18} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm text-text-primary truncate">Registrar Agua</span>
                                        <span className="text-[10px] sm:text-xs text-text-muted truncate">Registra tu hidratación</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                    <span className={dailyXpClass}>+5 XP por vaso</span>
                                    <span className="text-[10px] text-text-muted font-medium">Máx 50 XP/día</span>
                                </div>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg shrink-0">
                                        <Zap size={18} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm text-text-primary truncate">Registrar Creatina</span>
                                        <span className="text-[10px] sm:text-xs text-text-muted truncate">Marca tu toma diaria</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+5 XP (1/día)</span>
                            </div>
                        </div>
                    </section>

                    <section className="w-full">
                        <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2 drop-shadow-sm">
                            <Crown size={14} className="animate-pulse shrink-0" /> Insignias y Hitos
                        </h3>
                        <div className="space-y-2 w-full">
                            {milestones.map(m => {
                                const isUnlocked = unlockedBadges.includes(m.id);
                                const Icon = m.icon;
                                
                                return (
                                    <div 
                                        key={m.id} 
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 group shadow-sm gap-2 
                                            ${isUnlocked 
                                                ? 'bg-gradient-to-br from-amber-500/10 to-amber-500/20 border-amber-500/30' 
                                                : 'bg-bg-primary border-glass-border opacity-60 hover:opacity-80 grayscale-[30%]'
                                            }`
                                        }
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className={`p-2 rounded-lg ring-1 shrink-0 transition-colors 
                                                ${isUnlocked 
                                                    ? 'bg-amber-500/20 text-amber-500 ring-amber-500/30' 
                                                    : 'bg-white/5 text-text-muted ring-white/10'
                                                }`}
                                            >
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className={`font-bold text-sm truncate transition-colors ${isUnlocked ? 'text-text-primary' : 'text-text-secondary'}`}>
                                                    {m.title}
                                                </span>
                                                <span className="text-[10px] sm:text-xs text-text-tertiary truncate">
                                                    {m.desc}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`font-extrabold text-xs sm:text-sm whitespace-nowrap text-right transition-colors
                                                ${isUnlocked ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'text-text-muted'}`}
                                            >
                                                +{m.xp} XP
                                            </span>
                                            {isUnlocked && (
                                                <CheckCircle size={16} className="text-amber-500 shrink-0 drop-shadow-sm" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default XPGuideModal;