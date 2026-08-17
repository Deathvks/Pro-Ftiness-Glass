import ModalPortal from './ModalPortal';
/* frontend/src/components/XPGuideModal.jsx */
import React, { useRef, useState, useEffect } from 'react';
import {
  X, Trophy, Dumbbell, Calendar, Plus, Activity, Star, Crown,
  Utensils, Droplets, Zap, Rocket, ChefHat, Info, LogIn, Flame,
  Footprints, Shield, History, ArrowRight } from
'lucide-react';
import LevelBadge from './LevelBadge';
import { getXPHistory } from '../services/gamificationService';
import useModalLock from '../hooks/useModalLock';

const XPGuideModal = ({ onClose }) => {
  const carouselRef = useRef(null);

  // --- Bloquear scroll del fondo y swipe entre páginas ---
  useModalLock();

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const [activeTab, setActiveTab] = useState('guide'); // 'guide' or 'history'
  const [xpHistory, setXpHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await getXPHistory(50);
      setXpHistory(data);
    } catch (error) {
      console.error('Error fetching XP history', error);
    } finally {
      setLoadingHistory(false);
    }
  };

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

  return <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
            <div className="bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 rounded-[32px] w-full max-w-md max-h-[85dvh] flex flex-col shadow-2xl animate-[slide-up_0.3s_ease-out]">

                <div className="shrink-0 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/10 p-6 pb-0 flex flex-col gap-4 rounded-t-[32px] z-10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-extrabold flex items-center gap-3 text-text-primary tracking-tight">
                            <div className="p-2.5 bg-accent/10 rounded-[14px] ring-1 ring-accent/30 shrink-0 shadow-sm">
                                <Star className="text-accent fill-accent animate-pulse" size={20} strokeWidth={1.5} />
                            </div>
                            Sistema XP
                        </h2>
                        <button onClick={onClose} className="p-2.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors text-text-secondary hover:text-text-primary active:scale-95">
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <button
              className={`pb-3 font-bold text-sm tracking-wide transition-colors border-b-2 ${activeTab === 'guide' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
              onClick={() => setActiveTab('guide')}>
              
                            Guía
                        </button>
                        <button
              className={`pb-3 font-bold text-sm tracking-wide transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'history' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
              onClick={() => setActiveTab('history')}>
              
                            <History size={16} strokeWidth={2.5} /> Historial
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto overflow-x-hidden no-scrollbar pb-8 w-full flex-1 min-h-0">
                    
                    {activeTab === 'guide' &&
          <div className="animate-[fade-in_0.3s_ease-out]">
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
                className={`flex gap-3 overflow-x-auto no-scrollbar pb-4 px-1 items-stretch select-none w-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
                
                                    {rankPreviews.map((level) =>
                <div key={level} className="flex-shrink-0 flex flex-col items-center justify-between gap-3 w-[135px] p-4 bg-bg-primary rounded-[20px] ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
                                            <div className="pointer-events-none flex flex-col items-center justify-center flex-1 w-full whitespace-nowrap">
                                                <LevelBadge level={level} size="md" showName={true} />
                                            </div>
                                            <span className="text-[10px] text-text-secondary font-bold bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-[8px] ring-1 ring-black/5 dark:ring-white/10 pointer-events-none mt-2 uppercase tracking-wider shrink-0 w-max">
                                                Nv. {level}
                                            </span>
                                        </div>
                )}
                                </div>
                            </section>

                            <section className="mb-10 w-full">
                                <h3 className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                                    Acciones Diarias
                                </h3>
                                <div className="space-y-3 w-full">
                                    <div className={dailyCardClass}>
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-emerald-500 rounded-[14px] shrink-0 shadow-sm">
                                                <LogIn size={20} strokeWidth={2} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-extrabold text-sm text-text-primary tracking-tight">Conexión Diaria</span>
                                                <span className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">Por entrar a la app hoy</span>
                                            </div>
                                        </div>
                                        <span className={dailyXpClass}>+25 XP</span>
                                    </div>

                                    <div className={dailyCardClass}>
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-blue-500 rounded-[14px] shrink-0 shadow-sm">
                                                <Dumbbell size={20} strokeWidth={2} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-extrabold text-sm text-text-primary tracking-tight">¡A sudar!</span>
                                                <span className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">Realiza un entrenamiento hoy</span>
                                            </div>
                                        </div>
                                        <span className={dailyXpClass}>+100 XP (Reto)</span>
                                    </div>

                                    <div className={dailyCardClass}>
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-orange-500 rounded-[14px] shrink-0 shadow-sm">
                                                <Utensils size={20} strokeWidth={2} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-extrabold text-sm text-text-primary tracking-tight">Registra 5 comidas</span>
                                                <span className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">Registra al menos 5 alimentos hoy</span>
                                            </div>
                                        </div>
                                        <span className={dailyXpClass}>+50 XP (Reto)</span>
                                    </div>

                                    <div className={dailyCardClass}>
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-red-500 rounded-[14px] shrink-0 shadow-sm">
                                                <Flame size={20} strokeWidth={2} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-extrabold text-sm text-text-primary tracking-tight">Calorías completadas</span>
                                                <span className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">Alcanza tu objetivo calórico diario</span>
                                            </div>
                                        </div>
                                        <span className={dailyXpClass}>+50 XP (Reto)</span>
                                    </div>
                                    
                                    <div className={dailyCardClass}>
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-red-500 rounded-[14px] shrink-0 shadow-sm">
                                                <ChefHat size={20} strokeWidth={2} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-extrabold text-sm text-text-primary tracking-tight">Proteína completada</span>
                                                <span className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">Alcanza tu objetivo de proteínas diario</span>
                                            </div>
                                        </div>
                                        <span className={dailyXpClass}>+50 XP (Reto)</span>
                                    </div>

                                    <div className={dailyCardClass}>
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-cyan-500 rounded-[14px] shrink-0 shadow-sm">
                                                <Droplets size={20} strokeWidth={2} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-extrabold text-sm text-text-primary tracking-tight">Mantente hidratado</span>
                                                <span className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">Registra el agua recomendada hoy</span>
                                            </div>
                                        </div>
                                        <span className={dailyXpClass}>+30 XP (Reto)</span>
                                    </div>
                                    
                                    <div className={dailyCardClass}>
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-emerald-500 rounded-[14px] shrink-0 shadow-sm">
                                                <Plus size={20} strokeWidth={2} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-extrabold text-sm text-text-primary tracking-tight">Presume tu esfuerzo</span>
                                                <span className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">Registra un entrenamiento en el mural</span>
                                            </div>
                                        </div>
                                        <span className={dailyXpClass}>+25 XP (Reto)</span>
                                    </div>

                                    <div className={dailyCardClass}>
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-indigo-500 rounded-[14px] shrink-0 shadow-sm">
                                                <Footprints size={20} strokeWidth={2} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-extrabold text-sm text-text-primary tracking-tight">Conversador</span>
                                                <span className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">Comenta en publicaciones del mural</span>
                                            </div>
                                        </div>
                                        <span className={dailyXpClass}>+25 XP (Reto)</span>
                                    </div>

                                    <div className={dailyCardClass}>
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-pink-500 rounded-[14px] shrink-0 shadow-sm">
                                                <Flame size={20} strokeWidth={2} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-extrabold text-sm text-text-primary tracking-tight">Buen rollo</span>
                                                <span className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">Dale like a publicaciones</span>
                                            </div>
                                        </div>
                                        <span className={dailyXpClass}>+25 XP (Reto)</span>
                                    </div>

                                    <div className={dailyCardClass}>
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="p-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 text-purple-500 rounded-[14px] shrink-0 shadow-sm">
                                                <Star size={20} strokeWidth={2} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-extrabold text-sm text-text-primary tracking-tight">Y muchos más...</span>
                                                <span className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">Visita la pestaña "Retos" para descubrirlos</span>
                                            </div>
                                        </div>
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
                                                <span className="font-extrabold text-sm text-text-primary tracking-tight">Primer Paso</span>
                                                <span className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">Por iniciar sesión 1ª vez</span>
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
                                                <span className="font-extrabold text-sm text-text-primary tracking-tight">1º Entrenamiento</span>
                                                <span className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">Al completar el primero</span>
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
                                                <span className="font-extrabold text-sm text-text-primary tracking-tight">Chef</span>
                                                <span className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">Por registrar 5 comidas</span>
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
                                                <span className="font-extrabold text-sm text-text-primary tracking-tight">Racha de 3 Días</span>
                                                <span className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">3 días seguidos activo</span>
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
                                                <span className="font-extrabold text-sm text-text-primary tracking-tight">Racha de 7 Días</span>
                                                <span className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">7 días seguidos activo</span>
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
                                                <span className="font-extrabold text-sm text-text-primary tracking-tight">Racha de 30 Días</span>
                                                <span className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">30 días seguidos activo</span>
                                            </div>
                                        </div>
                                        <span className={goldXpClass}>+1000 XP</span>
                                    </div>
                                </div>
                            </section>
                        </div>
          }

                    {activeTab === 'history' &&
          <div className="animate-[fade-in_0.3s_ease-out]">
                            {loadingHistory ?
            <div className="flex flex-col items-center justify-center py-10 opacity-70">
                                    <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3"></div>
                                    <span className="text-sm font-medium text-text-secondary">Cargando historial...</span>
                                </div> :
            xpHistory.length === 0 ?
            <div className="flex flex-col items-center justify-center py-10 bg-black/5 dark:bg-white/5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10">
                                    <History size={40} className="text-text-muted mb-3" strokeWidth={1.5} />
                                    <span className="text-sm font-bold text-text-secondary">No hay historial de XP aún</span>
                                    <span className="text-[11px] text-text-muted mt-1 text-center px-4">Completa retos diarios o entrenamientos para ganar XP.</span>
                                </div> :

            <div className="space-y-3 relative before:absolute before:inset-y-4 before:left-5 before:w-0.5 before:bg-glass-border">
                                    {xpHistory.map((log) =>
              <div key={log.id} className="relative flex gap-4 items-start group">
                                            <div className="w-10 h-10 shrink-0 rounded-full bg-bg-primary ring-4 ring-bg-primary flex items-center justify-center z-10 shadow-sm">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.amount > 0 ? 'bg-accent/10 text-accent' : 'bg-red-500/10 text-red-500'}`}>
                                                    <Star size={14} strokeWidth={2.5} />
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-[20px] p-4 ring-1 ring-black/5 dark:ring-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors shadow-sm">
                                                <div className="flex justify-between items-start gap-2 mb-2">
                                                    <span className="font-extrabold text-sm text-text-primary tracking-tight">
                                                        {log.reason || 'XP Obtenida'}
                                                    </span>
                                                    <span className={`font-black text-xs shrink-0 px-2 py-1 rounded-md ${log.amount > 0 ? 'bg-accent/10 text-accent ring-1 ring-accent/30' : 'bg-red-500/10 text-red-500 ring-1 ring-red-500/30'}`}>
                                                        {log.amount > 0 ? '+' : ''}{log.amount} XP
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 text-[11px] font-bold text-text-secondary bg-black/5 dark:bg-white/5 w-max px-3 py-1.5 rounded-lg ring-1 ring-black/5 dark:ring-white/10">
                                                    <span className="opacity-70">{log.previous_xp} XP</span>
                                                    <ArrowRight size={10} className="text-text-muted" strokeWidth={3} />
                                                    <span className="text-text-primary">{log.new_xp} XP</span>
                                                </div>
                                                
                                                <div className="mt-3 text-[10px] text-text-muted font-medium flex items-center gap-1.5">
                                                    <Calendar size={10} />
                                                    {new Date(log.created_at).toLocaleString('es-ES', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                                                </div>
                                            </div>
                                        </div>
              )}
                                </div>
            }
                        </div>
          }
                </div>
            </div>
        </div></ModalPortal>;

};

export default XPGuideModal;