/* frontend/src/components/nutrition/SmartNutritionCoachModal.jsx */
import React, { useMemo, useState } from 'react';
import { 
  X, 
  Flame, 
  Beef, 
  Wheat, 
  Droplet, 
  Zap, 
  IceCream, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Lightbulb, 
  UserCheck, 
  ArrowRight, 
  Target, 
  Shield, 
  Activity, 
  Clock, 
  ChevronRight,
  FlaskConical
} from 'lucide-react';
import ModalPortal from '../ModalPortal';
import { generateSmartNutritionCoachPlan } from '../../utils/smartNutritionCoach';
import { saveAppliedNutritionStrategy } from '../../utils/nutritionCoachHistory';

const SmartNutritionCoachModal = ({
  userProfile,
  totals,
  targets,
  waterLog,
  todaysCreatineLog,
  meals,
  nutritionLog,
  selectedDate,
  latestWeight,
  onClose,
  onNavigateAsesoria,
  onApplyStrategy
}) => {
  const plan = useMemo(() => {
    return generateSmartNutritionCoachPlan({
      userProfile,
      totals,
      targets,
      waterLog,
      todaysCreatineLog,
      meals,
      nutritionLog,
      selectedDate,
      latestWeight
    });
  }, [userProfile, totals, targets, waterLog, todaysCreatineLog, meals, nutritionLog, selectedDate, latestWeight]);

  const [selectedStrategyId, setSelectedStrategyId] = useState(() => {
    return plan?.strategyOptions?.[0]?.id || null;
  });

  const activeStrategy = useMemo(() => {
    if (!plan?.strategyOptions || plan.strategyOptions.length === 0) return null;
    return plan.strategyOptions.find(s => s.id === selectedStrategyId) || plan.strategyOptions[0];
  }, [plan, selectedStrategyId]);

  if (!plan) return null;

  const {
    userGoal,
    overallBadgeText,
    isWarning,
    isOptimal,
    warningsCount,
    optimalCount,
    pillars,
    motivationalMessage,
    celebrationData,
    strategyOptions,
    asesoriaRecommendation,
    previousStrategy
  } = plan;

  const handleApply = () => {
    if (activeStrategy) {
      saveAppliedNutritionStrategy(selectedDate, {
        ...activeStrategy,
        goal: userGoal.key
      });
      if (onApplyStrategy) {
        onApplyStrategy(activeStrategy);
      }
    }
    onClose();
  };

  const getPillarIcon = (iconName) => {
    switch (iconName) {
      case 'Flame': return <Flame size={18} className="text-orange-500" />;
      case 'Beef': return <Beef size={18} className="text-red-500" />;
      case 'Droplet': return <Droplet size={18} className="text-blue-500" />;
      case 'Zap': return <Zap size={18} className="text-purple-400" />;
      case 'IceCream': return <IceCream size={18} className="text-pink-500" />;
      default: return <Wheat size={18} className="text-amber-500" />;
    }
  };

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-bg-secondary dark:bg-[#121214] border-none rounded-t-[32px] sm:rounded-2xl shadow-2xl overflow-hidden animate-[slide-up_0.25s_cubic-bezier(0.16,1,0.3,1)] sm:animate-[scale-in_0.2s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Grabber en móvil */}
          <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

          {/* Header */}
          <div className="p-4 sm:p-6 pb-3 border-b border-black/5 dark:border-transparent flex items-start justify-between gap-3 bg-bg-secondary">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/15 text-accent">
                  <Target size={13} strokeWidth={2.5} />
                  <span>{userGoal.label}</span>
                </span>

                {isWarning ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse">
                    <AlertTriangle size={13} className="shrink-0" />
                    <span>{overallBadgeText}</span>
                  </span>
                ) : isOptimal ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>{overallBadgeText}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    <Activity size={13} className="shrink-0" />
                    <span>{overallBadgeText}</span>
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight truncate">
                Diagnóstico Nutricional Inteligente
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-muted hover:text-text-primary transition-all active:scale-95 shrink-0"
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[calc(92vh-160px)]">

            {/* 1. SEGUIMIENTO DE PAUTA DE HOY */}
            {previousStrategy && (
              <div className="p-3.5 sm:p-4 rounded-[22px] bg-accent/10 flex items-start gap-3">
                <div className="p-2 rounded-[14px] bg-accent/20 text-accent shrink-0 mt-0.5">
                  <Check size={16} strokeWidth={3} />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-accent block">
                    Pauta de Hoy
                  </span>
                  <h4 className="text-xs sm:text-sm font-black text-text-primary">
                    {previousStrategy.title}
                  </h4>
                  <p className="text-[11px] text-text-secondary font-medium">
                    {previousStrategy.description}
                  </p>
                </div>
              </div>
            )}

            {/* 2. RECOMENDACIÓN DE ASESORÍA CON NUTRICIONISTA / PREPARADOR REAL (SIEMPRE VISIBLE ARRIBA) */}
            {asesoriaRecommendation && (
              <div className="p-3 sm:p-3.5 rounded-[20px] bg-accent/10 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-[10px] bg-accent/20 text-accent shrink-0 mt-0.5">
                    <UserCheck size={16} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black text-text-primary leading-tight">
                      {asesoriaRecommendation.headline}
                    </h4>
                    <p className="text-[11px] text-text-secondary font-medium leading-snug truncate sm:whitespace-normal">
                      {asesoriaRecommendation.description}
                    </p>
                  </div>
                </div>

                {onNavigateAsesoria && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateAsesoria();
                    }}
                    className="py-2 px-3 rounded-[14px] bg-accent hover:brightness-110 text-accent-contrast font-black text-xs shrink-0 flex items-center gap-1 shadow-sm transition-all active:scale-95"
                    style={{ color: "var(--btn-accent-text, #000)" }}
                  >
                    <span>Asesoría</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            )}

            {/* 3. BANNER DE CELEBRACIÓN (Si está óptimo) */}
            {celebrationData?.isCelebrating && (
              <div className="p-4 sm:p-5 rounded-[24px] bg-emerald-500/10 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-[14px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                      {celebrationData.title}
                    </h4>
                    <p className="text-xs text-text-secondary font-medium mt-0.5">
                      {celebrationData.subtitle}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    Pautas para sostener esta consistencia:
                  </span>
                  {celebrationData.tipsToMaintain.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-medium text-text-primary/90">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. MENSAJE MOTIVACIONAL Y CIENCIA (Si hay avisos) */}
            {motivationalMessage && (
              <div className="p-4 rounded-[24px] bg-amber-500/10 flex items-start gap-3">
                <div className="p-2 rounded-[14px] bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <Lightbulb size={18} />
                </div>
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                    Perspectiva Científica y Sin Culpa
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed font-medium">
                    {motivationalMessage}
                  </p>
                </div>
              </div>
            )}

            {/* 5. GRID DE LOS 6 PILARES NUTRICIONALES */}
            <div>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-text-muted">
                  Diagnóstico de los 6 Pilares del Día:
                </span>
                <span className="text-[10px] font-bold text-text-secondary">
                  {optimalCount} en rango • {warningsCount} a mejorar
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {pillars.map((pillar) => (
                  <div
                    key={pillar.id}
                    className={`p-3 rounded-[18px] transition-all flex flex-col justify-between ${
                      pillar.isWarning
                        ? 'bg-amber-500/10'
                        : pillar.status === 'in_progress'
                        ? 'bg-black/5 dark:bg-white/5'
                        : 'bg-black/5 dark:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-[8px] bg-black/5 dark:bg-white/10">
                          {getPillarIcon(pillar.icon)}
                        </div>
                        <span className="text-xs font-bold text-text-primary">
                          {pillar.name}
                        </span>
                      </div>

                      {pillar.isWarning ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          Alerta
                        </span>
                      ) : pillar.status === 'in_progress' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400">
                          En curso
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          OK
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-base sm:text-lg font-black text-text-primary">
                        {typeof pillar.consumed === 'number' ? pillar.consumed.toLocaleString('es-ES') : pillar.consumed} {pillar.unit !== 'macros' && pillar.unit !== 'día' ? pillar.unit : ''}
                      </span>
                      <span className="text-[11px] font-semibold text-text-muted">
                        Meta: {pillar.target} {pillar.unit !== 'macros' && pillar.unit !== 'día' ? pillar.unit : ''}
                      </span>
                    </div>

                    <p className="text-[11px] text-text-secondary font-medium leading-snug">
                      {pillar.message}
                    </p>
                    <div className="text-[10px] text-text-muted font-normal mt-1 leading-snug border-t border-black/5 dark:border-white/5 pt-1 flex items-start gap-1.5">
                      <FlaskConical size={11} className="shrink-0 mt-0.5 text-accent" />
                      <span>{pillar.science}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. PAUTAS Y SUGERENCIAS PRÁCTICAS FLEXIBLES */}
            {strategyOptions && strategyOptions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Target size={14} />
                    Pautas y sugerencias para hoy:
                  </span>
                  <span className="text-[10px] font-bold text-text-muted uppercase">
                    Guía flexible
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {strategyOptions.map((opt) => (
                    <div
                      key={opt.id}
                      className="p-3 sm:p-3.5 rounded-[18px] bg-black/5 dark:bg-white/5 flex items-start gap-2.5 transition-all"
                    >
                      <div className="mt-0.5 shrink-0 rounded-full w-5 h-5 flex items-center justify-center bg-accent/20 text-accent font-black text-[10px]">
                        <Check size={12} strokeWidth={3} />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-black text-text-primary leading-tight">
                            {opt.title}
                          </span>
                          {opt.badge && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.motive && (
                          <p className="text-[11px] text-accent font-medium leading-snug">
                            <strong className="font-bold">Motivo:</strong> {opt.motive}
                          </p>
                        )}
                        <p className="text-xs text-text-secondary font-medium leading-relaxed">
                          {opt.description}
                        </p>
                        {opt.actionHint && (
                          <span className="text-[10px] font-semibold text-accent flex items-center gap-1 pt-0.5">
                            <Sparkles size={11} className="shrink-0" />
                            <span>{opt.actionHint}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contexto científico de cierre */}
            <div className="p-3.5 rounded-[20px] bg-black/5 dark:bg-white/5 flex items-start gap-3">
              <Shield size={16} className="text-accent shrink-0 mt-0.5" />
              <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                Cálculos nutricionales basados en tu perfil corporal ({latestWeight} kg) y objetivo de <strong className="text-text-primary font-bold">{userGoal.label}</strong>. Sin dietas milagro: solo balance energético, reparto proteico óptimo e hidratación celular.
              </p>
            </div>

          </div>

          {/* Footer Buttons */}
          <div className="p-4 sm:p-5 border-t border-black/5 dark:border-transparent bg-bg-secondary flex items-center">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-[20px] bg-accent hover:brightness-110 active:scale-95 text-accent-contrast font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent/30 transition-all"
              style={{ color: "var(--btn-accent-text, #000)" }}
            >
              <Check size={18} strokeWidth={3} />
              <span>Entendido, lo registro por mi cuenta</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default SmartNutritionCoachModal;
