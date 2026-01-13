/* frontend/src/components/XPGuideModal.jsx */
import React from 'react';
import {
    X, Trophy, Dumbbell, Calendar, Plus, Activity, Star, Crown,
    Utensils, Droplets, Zap, Rocket, ChefHat, Info, LogIn, Flame,
    Footprints
} from 'lucide-react';

const XPGuideModal = ({ onClose }) => {
    // CAMBIOS:
    // - bg-white/5 -> bg-bg-primary: Para que tenga fondo sólido (blanco en light, oscuro en dark)
    // - border-white/5 -> border-glass-border: Para que el borde sea sutil y adaptable
    const dailyCardClass = "flex items-center justify-between p-3 bg-bg-primary rounded-xl border border-glass-border hover:border-accent/30 transition-all duration-300 group shadow-sm";

    const dailyXpClass = "font-bold text-accent text-sm drop-shadow-[0_0_6px_rgba(34,211,238,0.4)] transition-transform group-hover:scale-110 whitespace-nowrap text-right";

    // CAMBIOS:
    // - Ajustado el gradiente para que sea sutil en ambos modos
    const goldCardClass = "flex items-center justify-between p-3 bg-gradient-to-br from-amber-500/10 to-amber-500/20 rounded-xl border border-amber-500/20 hover:border-amber-400/50 transition-all duration-300 group shadow-sm";

    const goldXpClass = "font-extrabold text-amber-500 text-sm drop-shadow-[0_0_8px_rgba(251,191,36,0.4)] transition-transform group-hover:scale-110 whitespace-nowrap text-right";

    return (
        // Modificado: z-[60] para superar al navbar (z-50)
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-20 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
            {/* Modificado: max-h-[70vh] y mb-20 para dar espacio inferior en móvil (INTACTO) */}
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

                {/* Modificado: pb-6 en lugar de pb-24 para reducir espacio excesivo al final */}
                <div className="p-6 overflow-y-auto custom-scrollbar pb-6">
                    {/* CAMBIO: border-accent/20 por border-glass-border para borde suave */}
                    <div className="bg-accent/10 rounded-xl p-4 flex items-start gap-3 mb-6 border border-glass-border">
                        <Info className="text-accent shrink-0" size={20} />
                        <p className="text-text-secondary text-sm">
                            Gana XP realizando acciones diarias. <br />
                            <span className="text-accent font-semibold">Nota:</span> Para mantener tu racha, basta con realizar <strong>cualquiera</strong> de estas acciones al menos una vez al día.
                        </p>
                    </div>

                    <section className="mb-8">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 ml-1 flex items-center gap-1">
                            Acciones Diarias
                        </h3>
                        <div className="space-y-2">
                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                        <LogIn size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-text-primary">Inicio de Sesión</span>
                                        <span className="text-xs text-text-muted">Entra a la app cada día</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+25 XP (1/día)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                        <Dumbbell size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-text-primary">Completar Entrenamiento</span>
                                        <span className="text-xs text-text-muted">Finaliza una rutina completa</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+50 XP (Máx 2/día)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                        <Footprints size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-text-primary">Sesión de Cardio</span>
                                        <span className="text-xs text-text-muted">Registra una actividad de cardio</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+50 XP (Máx 2/día)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                                        <Plus size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-text-primary">Crear Rutina</span>
                                        <span className="text-xs text-text-muted">Diseña un nuevo plan personalizado</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+20 XP (1/día)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                                        <Activity size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-text-primary">Registrar Peso</span>
                                        <span className="text-xs text-text-muted">Actualiza tu peso corporal</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+10 XP (1/día)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                                        <Utensils size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-text-primary">Registrar Comida</span>
                                        <span className="text-xs text-text-muted">Registra cualquier alimento</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+5 XP (Máx 5/día)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                                        <Flame size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-text-primary">Meta de Calorías</span>
                                        <span className="text-xs text-text-muted">Alcanza tu objetivo diario</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+30 XP (1/día)</span>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-cyan-500/10 text-cyan-500 rounded-lg">
                                        <Droplets size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-text-primary">Registrar Agua</span>
                                        <span className="text-xs text-text-muted">Registra tu hidratación</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={dailyXpClass}>+5 XP por avance</span>
                                    <span className="text-[10px] text-text-muted font-medium">Máx 50 XP/día</span>
                                </div>
                            </div>

                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg">
                                        <Zap size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-text-primary">Registrar Creatina</span>
                                        <span className="text-xs text-text-muted">Marca tu toma diaria</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+5 XP (1/día)</span>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2 drop-shadow-sm">
                            <Crown size={14} className="animate-pulse" /> Insignias y Hitos
                        </h3>
                        <div className="space-y-2">
                            {/* Ajuste de colores en tarjetas Gold para legibilidad en Modo Claro: text-text-primary */}
                            <div className={goldCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg ring-1 ring-amber-500/30">
                                        <Rocket size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-text-primary">Primer Paso</span>
                                        <span className="text-xs text-text-secondary">Por iniciar sesión la primera vez</span>
                                    </div>
                                </div>
                                <span className={goldXpClass}>+50 XP</span>
                            </div>

                            <div className={goldCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg ring-1 ring-amber-500/30">
                                        <Trophy size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-text-primary">Primer Entrenamiento</span>
                                        <span className="text-xs text-text-secondary">Por completar tu primer entreno</span>
                                    </div>
                                </div>
                                <span className={goldXpClass}>+100 XP</span>
                            </div>

                            <div className={goldCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg ring-1 ring-amber-500/30">
                                        <ChefHat size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-text-primary">Chef</span>
                                        <span className="text-xs text-text-secondary">Por registrar 5 comidas en total</span>
                                    </div>
                                </div>
                                <span className={goldXpClass}>+100 XP</span>
                            </div>

                            <div className={goldCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg ring-1 ring-amber-500/30">
                                        <Calendar size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-text-primary">Racha de 3 Días</span>
                                        <span className="text-xs text-text-secondary">Cualquier actividad 3 días seguidos</span>
                                    </div>
                                </div>
                                <span className={goldXpClass}>+150 XP</span>
                            </div>

                            <div className={goldCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg ring-1 ring-amber-500/30">
                                        <Calendar size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-text-primary">Racha de 7 Días</span>
                                        <span className="text-xs text-text-secondary">Cualquier actividad 7 días seguidos</span>
                                    </div>
                                </div>
                                <span className={goldXpClass}>+300 XP</span>
                            </div>

                            <div className={goldCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg ring-1 ring-amber-500/30">
                                        <Crown size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-text-primary">Racha de 30 Días</span>
                                        <span className="text-xs text-text-secondary">Cualquier actividad 30 días seguidos</span>
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