import ModalPortal from './ModalPortal';
/* frontend/src/components/XPGuideModal.jsx */
import React, { useRef, useState, useEffect } from 'react';
import {
  X, Trophy, Dumbbell, Palette, Calendar, Plus, Star, Crown,
  Utensils, Droplets, Zap, Rocket, ChefHat, LogIn, Flame,
  Footprints, Shield, History, ArrowRight, Clock, Sparkles, ChevronRight
} from 'lucide-react';
import LevelBadge from './LevelBadge';
import { getXPHistory } from '../services/gamificationService';
import useModalLock from '../hooks/useModalLock';
import useAppStore from '../store/useAppStore';
import {
  formatXpBoostCountdown,
  formatXpMultiplier,
  getActiveXpBoost,
  getBoostedXpAmount,
  getNextXpBoostMilestone,
} from '../utils/xpBoost';

const PERSONALIZATION_UNLOCKS = [
  { level: 5, title: 'Nivel 5', tag: 'x1,5 XP', desc: '5 tonos pastel: Menta, Melocotón, Rosas, Lavanda y Azul.' },
  { level: 10, title: 'Nivel 10', tag: 'x2 XP', desc: '5 pasteles vibrantes: Atardecer, Pistacho, Mango, Lima y Cerezo.' },
  { level: 15, title: 'Nivel 15', tag: 'x1,5 XP', desc: 'Degradados: Aurora, Sunset, Cyberpunk, Océano y Oro.' },
  { level: 20, title: 'Nivel 20', tag: 'x2 XP', desc: 'Acentos animados + atmósfera Aurora en el inicio.' },
];

const DAILY_ACTIONS = [
  { id: 'login', title: 'Conexión Diaria', desc: 'Por entrar a la app hoy', baseXp: 25, icon: LogIn, color: 'text-emerald-500' },
  { id: 'workout', title: 'Entrenamiento', desc: 'Completa una sesión hoy (Reto)', baseXp: 100, icon: Dumbbell, color: 'text-blue-500' },
  { id: 'meals', title: '5 Comidas', desc: 'Registra al menos 5 alimentos (Reto)', baseXp: 50, icon: Utensils, color: 'text-orange-500' },
  { id: 'calories', title: 'Objetivo Calórico', desc: 'Alcanza tu meta diaria de calorías', baseXp: 50, icon: Flame, color: 'text-red-500' },
  { id: 'protein', title: 'Objetivo Proteína', desc: 'Alcanza tu meta diaria de proteína', baseXp: 50, icon: ChefHat, color: 'text-rose-500' },
  { id: 'water', title: 'Hidratación', desc: 'Completa el agua recomendada hoy', baseXp: 30, icon: Droplets, color: 'text-cyan-500' },
  { id: 'wall_post', title: 'Publicar Entreno', desc: 'Comparte sesión en el Muro', baseXp: 25, icon: Plus, color: 'text-emerald-500' },
  { id: 'wall_comment', title: 'Comentar Sesiones', desc: 'Comenta 2 posts en el Muro', baseXp: 25, icon: Footprints, color: 'text-indigo-500' },
  { id: 'wall_react', title: 'Reacciones Muro', desc: 'Envía 2 reacciones rápidas', baseXp: 25, icon: Zap, color: 'text-pink-500' },
];

const MILESTONES = [
  { title: 'Primer Paso', desc: 'Primera sesión iniciada', baseXp: 50, icon: Rocket },
  { title: '1º Entrenamiento', desc: 'Al completar el primero', baseXp: 100, icon: Trophy },
  { title: 'Chef', desc: 'Por registrar 5 comidas', baseXp: 100, icon: ChefHat },
  { title: 'Racha 3 Días', desc: '3 días seguidos activo', baseXp: 150, icon: Calendar },
  { title: 'Racha 7 Días', desc: '7 días seguidos activo', baseXp: 300, icon: Calendar },
  { title: 'Racha 30 Días', desc: '30 días seguidos activo', baseXp: 1000, icon: Crown },
];

const RANK_PREVIEWS = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const XPGuideModal = ({ onClose, targetDays = 3 }) => {
  const carouselRef = useRef(null);
  useModalLock();

  const gamification = useAppStore((state) => state.gamification);
  const currentLevel = Number(gamification?.level || 1);
  const rawBoost = gamification?.xpBoost;

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [activeTab, setActiveTab] = useState('guide');
  const [xpHistory, setXpHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const activeBoost = getActiveXpBoost(rawBoost, nowMs);
  const nextMilestone = getNextXpBoostMilestone(currentLevel);

  useEffect(() => {
    if (!rawBoost?.expiresAt) return undefined;
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [rawBoost?.expiresAt]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await getXPHistory(50);
      setXpHistory(Array.isArray(data) ? data : []);
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

  const rowCardClass =
    'flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl ring-1 ring-black/[0.06] dark:ring-white/10';
  const goldCardClass =
    'flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/15 rounded-2xl ring-1 ring-amber-500/30';

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]"
        onClick={onClose}
      >
        <div
          className="bg-bg-primary ring-1 ring-black/10 dark:ring-white/10 rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-[slide-up_0.3s_ease-out] mt-auto sm:mt-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header moderno + tabs segmentados */}
          <div className="shrink-0 bg-black/[0.03] dark:bg-white/[0.03] border-b border-black/[0.06] dark:border-white/10 px-4 sm:px-6 pt-3 sm:pt-5 pb-4 flex flex-col gap-3.5 z-10">
            <div className="w-12 h-1.5 bg-black/15 dark:bg-white/20 rounded-full mx-auto sm:hidden shrink-0" />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-accent text-accent-contrast flex items-center justify-center shrink-0 shadow-sm">
                  <Star className="fill-current" size={18} strokeWidth={2} />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-lg sm:text-xl font-black text-text-primary tracking-tight whitespace-nowrap">
                    Sistema XP
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-accent/15 text-accent whitespace-nowrap shrink-0">
                    Nv. {currentLevel}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors text-text-secondary hover:text-text-primary shrink-0 cursor-pointer"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('guide')}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'guide'
                    ? 'bg-accent text-accent-contrast shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Sparkles size={14} className="shrink-0" />
                <span>Guía XP</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-accent text-accent-contrast shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <History size={14} className="shrink-0" />
                <span>Historial</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden no-scrollbar pb-[calc(1.5rem+var(--safe-bottom))] sm:pb-6 w-full flex-1 min-h-0">
            {activeTab === 'guide' && (
              <div className="space-y-6 animate-[fade-in_0.25s_ease-out]">
                {/* 1. Estado del Multiplicador Semanal + Contador */}
                {activeBoost ? (
                  <div
                    className={`rounded-2xl p-4 border shadow-sm ${
                      activeBoost.multiplier >= 2
                        ? 'bg-amber-500/12 border-amber-500/35'
                        : 'bg-accent/12 border-accent/35'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            activeBoost.multiplier >= 2
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-accent text-accent-contrast'
                          }`}
                        >
                          <Zap size={15} strokeWidth={2.6} />
                        </div>
                        <span className="text-sm font-black text-text-primary truncate whitespace-nowrap">
                          Boost {formatXpMultiplier(activeBoost.multiplier)} en curso
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black tabular-nums whitespace-nowrap shrink-0 ${
                          activeBoost.multiplier >= 2
                            ? 'bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/40'
                            : 'bg-accent text-accent-contrast'
                        }`}
                      >
                        <Clock size={12} strokeWidth={2.5} className="shrink-0" />
                        {formatXpBoostCountdown(activeBoost.remainingMs)}
                      </span>
                    </div>

                    <div className="h-2 w-full bg-black/15 dark:bg-white/10 rounded-full overflow-hidden mb-2.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          activeBoost.multiplier >= 2 ? 'bg-amber-500' : 'bg-accent'
                        }`}
                        style={{ width: `${activeBoost.progressRemainingPct}%` }}
                      />
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">
                      Activado al llegar al <strong className="text-text-primary">Nivel {activeBoost.level}</strong>. Lo que vale 200 XP ahora suma{' '}
                      <strong className={activeBoost.multiplier >= 2 ? 'text-amber-500' : 'text-accent'}>
                        {Math.round(200 * activeBoost.multiplier)} XP
                      </strong>
                      . Al terminar la semana vuelve a x1.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl p-4 bg-black/[0.04] dark:bg-white/[0.04] ring-1 ring-black/[0.07] dark:ring-white/10">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock size={15} className="text-accent shrink-0" strokeWidth={2.4} />
                        <span className="text-sm font-black text-text-primary truncate whitespace-nowrap">
                          Multiplicador: x1
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-accent/15 text-accent whitespace-nowrap shrink-0">
                        Próx: Nv. {nextMilestone.level} ({formatXpMultiplier(nextMilestone.multiplier)})
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Al llegar a niveles en <strong className="text-text-primary">5</strong> o <strong className="text-text-primary">0</strong> activas 1 semana de XP multiplicada.
                    </p>
                  </div>
                )}

                {/* 2. Reglas de Multiplicadores por Nivel */}
                <section className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 px-0.5">
                    <h3 className="text-[11px] font-black text-text-secondary uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                      <Zap size={13} className="text-accent shrink-0" />
                      <span>Multiplicadores Semanales</span>
                    </h3>
                    <span className="text-[10px] font-bold text-text-muted whitespace-nowrap">7 días por hito</span>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2.5">
                    <div className="p-3.5 rounded-2xl bg-accent/[0.08] border border-accent/25 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-text-primary whitespace-nowrap">
                          Niveles en ...5
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-accent text-accent-contrast text-[11px] font-black whitespace-nowrap shrink-0">
                          x1,5 XP
                        </span>
                      </div>
                      <span className="text-[11px] text-text-secondary leading-snug">
                        Nv. 5, 15, 25, 35... · 200 → <strong className="text-text-primary">300 XP</strong>
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-text-primary whitespace-nowrap">
                          Niveles en ...0
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[11px] font-black whitespace-nowrap shrink-0">
                          x2 XP
                        </span>
                      </div>
                      <span className="text-[11px] text-text-secondary leading-snug">
                        Nv. 10, 20, 30, 40... · 200 → <strong className="text-text-primary">400 XP</strong>
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-muted px-0.5 leading-snug">
                    Pasada la semana vuelve todo a la normalidad (x1). Solo aplica en los niveles terminados en 5 o 0.
                  </p>
                </section>

                {/* 3. Escudo de Racha Semanal */}
                <section className="p-4 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/25">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs sm:text-sm font-black text-text-primary whitespace-nowrap flex items-center gap-2">
                      <Shield size={15} className="text-emerald-500 shrink-0" />
                      <span>Escudo Semanal</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-500 whitespace-nowrap shrink-0">
                      {targetDays} {targetDays === 1 ? 'día/sem' : 'días/sem'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Completa tu meta semanal para blindar tu racha el resto de la semana. Fines de semana y hasta 2 días laborables están protegidos.
                  </p>
                </section>

                {/* 4. Jerarquía de Rangos */}
                <section className="bg-black/[0.04] dark:bg-white/[0.04] ring-1 ring-black/[0.06] dark:ring-white/10 rounded-2xl p-4 w-full overflow-hidden">
                  <h3 className="text-[11px] font-black text-text-secondary uppercase tracking-wider mb-3.5 flex items-center gap-2 whitespace-nowrap">
                    <Crown size={13} className="text-accent shrink-0" />
                    <span>Jerarquía de Rangos</span>
                  </h3>
                  <div
                    ref={carouselRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    className={`flex gap-2.5 overflow-x-auto no-scrollbar pb-1 items-stretch select-none w-full ${
                      isDragging ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                  >
                    {RANK_PREVIEWS.map((level) => (
                      <div
                        key={level}
                        className="shrink-0 flex flex-col items-center justify-between gap-2 w-[124px] p-3 bg-bg-primary rounded-2xl ring-1 ring-black/[0.06] dark:ring-white/10 shadow-sm"
                      >
                        <div className="pointer-events-none flex flex-col items-center justify-center flex-1 w-full whitespace-nowrap">
                          <LevelBadge level={level} size="md" showName={true} />
                        </div>
                        <span className="text-[10px] text-text-secondary font-extrabold bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-md pointer-events-none uppercase tracking-wider whitespace-nowrap">
                          Nv. {level}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 5. Recompensas por Nivel */}
                <section className="space-y-2.5">
                  <h3 className="text-[11px] font-black text-text-secondary uppercase tracking-wider px-0.5 flex items-center gap-2 whitespace-nowrap">
                    <Palette size={13} className="text-accent shrink-0" />
                    <span>Desbloqueos de Estilo</span>
                  </h3>
                  <div className="space-y-2">
                    {PERSONALIZATION_UNLOCKS.map((item) => (
                      <div key={item.level} className={rowCardClass}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-text-primary whitespace-nowrap truncate">
                              {item.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">{item.desc}</p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black whitespace-nowrap shrink-0 ${
                            item.level % 10 === 0
                              ? 'bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/35'
                              : 'bg-accent/15 text-accent ring-1 ring-accent/30'
                          }`}
                        >
                          {item.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 6. Acciones Diarias */}
                <section className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 px-0.5">
                    <h3 className="text-[11px] font-black text-text-secondary uppercase tracking-wider whitespace-nowrap">
                      Acciones Diarias
                    </h3>
                    {activeBoost && (
                      <span className="text-[10px] font-black text-accent whitespace-nowrap">
                        Valores con {formatXpMultiplier(activeBoost.multiplier)} aplicado
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {DAILY_ACTIONS.map((action) => {
                      const Icon = action.icon;
                      const displayedXp = getBoostedXpAmount(action.baseXp, activeBoost);
                      return (
                        <div key={action.id} className={rowCardClass}>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-10 h-10 rounded-xl bg-bg-primary ring-1 ring-black/[0.06] dark:ring-white/10 ${action.color} flex items-center justify-center shrink-0`}>
                              <Icon size={18} strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block font-extrabold text-sm text-text-primary truncate whitespace-nowrap">
                                {action.title}
                              </span>
                              <span className="block text-[11px] text-text-secondary mt-0.5 leading-snug">
                                {action.desc}
                              </span>
                            </div>
                          </div>
                          <span className="font-black text-accent-contrast text-[11px] whitespace-nowrap shrink-0 px-2.5 py-1 bg-accent rounded-lg shadow-sm tabular-nums">
                            +{displayedXp} XP
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 7. Insignias y Hitos */}
                <section className="space-y-2.5">
                  <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-wider px-0.5 flex items-center gap-1.5 whitespace-nowrap">
                    <Crown size={14} className="shrink-0" strokeWidth={2.5} />
                    <span>Insignias y Hitos</span>
                  </h3>
                  <div className="space-y-2">
                    {MILESTONES.map((milestone) => {
                      const Icon = milestone.icon;
                      const displayedXp = getBoostedXpAmount(milestone.baseXp, activeBoost);
                      return (
                        <div key={milestone.title} className={goldCardClass}>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-bg-primary text-amber-500 ring-1 ring-amber-500/30 flex items-center justify-center shrink-0">
                              <Icon size={18} strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block font-extrabold text-sm text-text-primary truncate whitespace-nowrap">
                                {milestone.title}
                              </span>
                              <span className="block text-[11px] text-text-secondary mt-0.5 leading-snug">
                                {milestone.desc}
                              </span>
                            </div>
                          </div>
                          <span className="font-black text-amber-500 text-[11px] whitespace-nowrap shrink-0 px-2.5 py-1 bg-amber-500/20 rounded-lg ring-1 ring-amber-500/35 tabular-nums">
                            +{displayedXp} XP
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="animate-[fade-in_0.25s_ease-out]">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-12 opacity-75">
                    <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3" />
                    <span className="text-sm font-medium text-text-secondary">Cargando historial...</span>
                  </div>
                ) : xpHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl ring-1 ring-black/[0.06] dark:ring-white/10">
                    <History size={38} className="text-text-muted mb-3" strokeWidth={1.6} />
                    <span className="text-sm font-bold text-text-secondary">No hay historial de XP aún</span>
                    <span className="text-xs text-text-muted mt-1 text-center px-4">
                      Completa retos diarios o entrenamientos para ganar XP.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3 relative before:absolute before:inset-y-4 before:left-4 before:w-0.5 before:bg-glass-border">
                    {xpHistory.map((log) => (
                      <div key={log.id} className="relative flex gap-3 items-start">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-bg-primary ring-4 ring-bg-primary flex items-center justify-center z-10 shadow-sm mt-1">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center ${
                              log.amount > 0 ? 'bg-accent text-accent-contrast' : 'bg-red-500/15 text-red-500'
                            }`}
                          >
                            <Star size={13} strokeWidth={2.5} />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl p-3.5 ring-1 ring-black/[0.06] dark:ring-white/10">
                          <div className="flex justify-between items-center gap-2 mb-2">
                            <span className="font-extrabold text-xs sm:text-sm text-text-primary truncate whitespace-nowrap">
                              {log.reason || 'XP Obtenida'}
                            </span>
                            <span
                              className={`font-black text-[11px] shrink-0 whitespace-nowrap px-2 py-0.5 rounded-md tabular-nums ${
                                log.amount > 0
                                  ? 'bg-accent text-accent-contrast'
                                  : 'bg-red-500/15 text-red-500'
                              }`}
                            >
                              {log.amount > 0 ? '+' : ''}
                              {log.amount} XP
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-2 text-[11px] font-bold text-text-secondary bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg tabular-nums whitespace-nowrap">
                              <span className="opacity-70">{log.previous_xp} XP</span>
                              <ArrowRight size={10} className="text-text-muted shrink-0" strokeWidth={3} />
                              <span className="text-text-primary">{log.new_xp} XP</span>
                            </div>

                            <span className="text-[10px] text-text-muted font-medium flex items-center gap-1 whitespace-nowrap">
                              <Calendar size={10} />
                              {new Date(log.created_at).toLocaleString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default XPGuideModal;
