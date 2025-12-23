/* frontend/src/components/XPGuideModal.jsx */
import React from 'react';
import {
    X, Trophy, Dumbbell, Calendar, Plus, Activity, Star, Crown,
    Utensils, Droplets, Zap, Rocket, ChefHat, Info, LogIn
} from 'lucide-react';

const XPGuideModal = ({ onClose }) => {
    // Clase base para las tarjetas de acciones diarias
    const dailyCardClass = "flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-accent/30 transition-all duration-300 group";
    // Clase para el texto de XP diario
    const dailyXpClass = "font-bold text-accent text-sm drop-shadow-[0_0_6px_rgba(34,211,238,0.4)] transition-transform group-hover:scale-110 whitespace-nowrap text-right";

    // Clase base para las tarjetas doradas (Hitos)
    const goldCardClass = "flex items-center justify-between p-3 bg-gradient-to-br from-amber-500/5 to-amber-500/15 rounded-xl border border-amber-500/20 hover:border-amber-400/50 transition-all duration-300 group";
    // Clase para el texto de XP dorado
    const goldXpClass = "font-extrabold text-amber-400 text-sm drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] transition-transform group-hover:scale-110 whitespace-nowrap text-right";

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
            {/* Contenedor del Modal */}
            <div className="bg-bg-secondary border border-glass-border rounded-2xl w-full max-w-md max-h-[75vh] flex flex-col shadow-2xl shadow-accent/10 animate-[slide-up_0.3s_ease-out]">

                {/* Header Fijo */}
                <div className="shrink-0 bg-bg-secondary/95 backdrop-blur-md border-b border-glass-border p-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Star className="text-accent fill-accent animate-pulse" size={24} />
                        Guía de Experiencia
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Contenido con Scroll - Padding inferior ajustado a pb-24 para móviles */}
                <div className="p-6 overflow-y-auto custom-scrollbar pb-24">

                    {/* Nota informativa SIN BORDE y alineada arriba */}
                    <div className="bg-accent/10 rounded-xl p-4 flex items-start gap-3 mb-6">
                        <Info className="text-accent shrink-0" size={20} />
                        <p className="text-text-secondary text-sm">
                            Gana XP realizando acciones diarias. <br />
                            <span className="text-accent font-semibold">Nota:</span> Para mantener tu racha, basta con realizar <strong>cualquiera</strong> de estas acciones al menos una vez al día.
                        </p>
                    </div>

                    {/* Acciones Diarias */}
                    <section className="mb-8">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 ml-1 flex items-center gap-1">
                            Acciones Diarias
                        </h3>
                        <div className="space-y-2">
                            {/* Login Diario */}
                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                                        <LogIn size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">Inicio de Sesión</span>
                                        <span className="text-xs text-text-muted">Entra a la app cada día</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+25 XP (1/día)</span>
                            </div>

                            {/* Entreno */}
                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                                        <Dumbbell size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">Completar Entrenamiento</span>
                                        <span className="text-xs text-text-muted">Finaliza una rutina completa</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+50 XP</span>
                            </div>

                            {/* Rutina */}
                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
                                        <Plus size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">Crear Rutina</span>
                                        <span className="text-xs text-text-muted">Diseña un nuevo plan personalizado</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+20 XP</span>
                            </div>

                            {/* Peso */}
                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                                        <Activity size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">Registrar Peso</span>
                                        <span className="text-xs text-text-muted">Actualiza tu peso corporal</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+10 XP</span>
                            </div>

                            {/* Comida */}
                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg">
                                        <Utensils size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">Registrar Comida</span>
                                        <span className="text-xs text-text-muted">Registra cualquier alimento</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+5 XP</span>
                            </div>

                            {/* Agua */}
                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
                                        <Droplets size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">Registrar Agua</span>
                                        <span className="text-xs text-text-muted">Registra tu hidratación</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={dailyXpClass}>+5 XP por avance</span>
                                    <span className="text-[10px] text-text-muted font-medium">Máx 50 XP/día</span>
                                </div>
                            </div>

                            {/* Creatina */}
                            <div className={dailyCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg">
                                        <Zap size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">Registrar Creatina</span>
                                        <span className="text-xs text-text-muted">Marca tu toma diaria</span>
                                    </div>
                                </div>
                                <span className={dailyXpClass}>+5 XP</span>
                            </div>
                        </div>
                    </section>

                    {/* Hitos e Insignias */}
                    <section>
                        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2 drop-shadow-sm">
                            <Crown size={14} className="animate-pulse" /> Insignias y Hitos
                        </h3>
                        <div className="space-y-2">
                            {/* First Login */}
                            <div className={goldCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg ring-1 ring-amber-500/30">
                                        <Rocket size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-amber-100">Primer Paso</span>
                                        <span className="text-xs text-amber-500/70">Por iniciar sesión la primera vez</span>
                                    </div>
                                </div>
                                <span className={goldXpClass}>+50 XP</span>
                            </div>

                            {/* First Workout */}
                            <div className={goldCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg ring-1 ring-amber-500/30">
                                        <Trophy size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-amber-100">Primer Entrenamiento</span>
                                        <span className="text-xs text-amber-500/70">Por completar tu primer entreno</span>
                                    </div>
                                </div>
                                <span className={goldXpClass}>+100 XP</span>
                            </div>

                            {/* Nutrition Master */}
                            <div className={goldCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg ring-1 ring-amber-500/30">
                                        <ChefHat size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-amber-100">Chef</span>
                                        <span className="text-xs text-amber-500/70">Por registrar 5 comidas en total</span>
                                    </div>
                                </div>
                                <span className={goldXpClass}>+100 XP</span>
                            </div>

                            {/* Racha 3 */}
                            <div className={goldCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg ring-1 ring-amber-500/30">
                                        <Calendar size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-amber-100">Racha de 3 Días</span>
                                        <span className="text-xs text-amber-500/70">Cualquier actividad 3 días seguidos</span>
                                    </div>
                                </div>
                                <span className={goldXpClass}>+150 XP</span>
                            </div>

                            {/* Racha 7 */}
                            <div className={goldCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg ring-1 ring-amber-500/30">
                                        <Calendar size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-amber-100">Racha de 7 Días</span>
                                        <span className="text-xs text-amber-500/70">Cualquier actividad 7 días seguidos</span>
                                    </div>
                                </div>
                                <span className={goldXpClass}>+300 XP</span>
                            </div>

                            {/* Racha 30 */}
                            <div className={goldCardClass}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg ring-1 ring-amber-500/30">
                                        <Crown size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-amber-100">Racha de 30 Días</span>
                                        <span className="text-xs text-amber-500/70">Cualquier actividad 30 días seguidos</span>
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