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
  ChevronRight 
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
          className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-bg-secondary/95 dark:bg-[#121214]/95 backdrop-blur-2xl rounded-t-[36px] sm:rounded-[36px] ring-1 ring-white/10 dark:ring-white/15 shadow-2xl overflow-hidden animate-[slide-up_0.25s_cubic-bezier(0.16,1,0.3,1)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Grabber en móvil */}
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

          {/* Header */}
          <div className="p-4 sm:p-6 pb-3 border-b border-white/5 flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/15 text-accent ring-1 ring-accent/30">
                  <Target size={13} strokeWidth={2.5} />
                  <span>{userGoal.label}</span>
                </span>

                {isWarning ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40 animate-pulse">
                    <AlertTriangle size={13} className="shrink-0" />
                    <span>{overallBadgeText}</span>
                  </span>
                ) : isOptimal ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40">
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>{overallBadgeText}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30">
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
              className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-text-muted hover:text-text-primary transition-all active:scale-95 shrink-0"
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[calc(92vh-160px)]">

            {/* 1. SEGUIMIENTO DE PAUTA APLICADA HOY */}
            {previousStrategy && (
              <div className="p-3.5 sm:p-4 rounded-[22px] bg-accent/10 ring-1 ring-accent/30 flex items-start gap-3">
                <div className="p-2 rounded-[14px] bg-accent/20 text-accent ring-1 ring-accent/30 shrink-0 mt-0.5">
                  <Check size={16} strokeWidth={3} />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-accent block">
                    Pauta Seleccionada Hoy
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

            {/* 2. BANNER DE CELEBRACIÓN (Si está óptimo) */}
            {celebrationData?.isCelebrating && (
              <div className="p-4 sm:p-5 rounded-[24px] bg-emerald-500/10 ring-1 ring-emerald-500/30 backdrop-blur-xl space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-[14px] bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30 shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-black text-emerald-400 leading-tight">
                      {celebrationData.title}
                    </h4>
                    <p className="text-xs text-text-secondary font-medium mt-0.5">
                      {celebrationData.subtitle}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                    Pautas para sostener esta consistencia:
                  </span>
                  {celebrationData.tipsToMaintain.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-medium text-text-primary/90">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. MENSAJE MOTIVACIONAL Y CIENCIA (Si hay avisos) */}
            {motivationalMessage && (
              <div className="p-4 rounded-[24px] bg-amber-500/10 ring-1 ring-amber-500/25 flex items-start gap-3">
                <div className="p-2 rounded-[14px] bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30 shrink-0 mt-0.5">
                  <Lightbulb size={18} />
                </div>
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                    Perspectiva Científica y Sin Culpa
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed font-medium">
                    {motivationalMessage}
                  </p>
                </div>
              </div>
            )}

            {/* 4. GRID DE LOS 6 PILARES NUTRICIONALES */}
            <div>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-text-muted">
                  Diagnóstico de los 6 Pilares del Día:
                </span>
                <span className="text-[10px] font-bold text-text-secondary">
                  {optimalCount} en rango • {warningsCount} a mejorar
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {pillars.map((pillar) => (
                  <div
                    key={pillar.id}
                    className={`p-3.5 rounded-[22px] ring-1 transition-all flex flex-col justify-between ${
                      pillar.isWarning
                        ? 'bg-amber-500/10 ring-amber-500/30 dark:bg-amber-500/15'
                        : pillar.status === 'optimal'
                        ? 'bg-black/5 dark:bg-white/5 ring-black/5 dark:ring-white/10'
                        : 'bg-black/5 dark:bg-white/5 ring-black/5 dark:ring-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-[10px] bg-black/5 dark:bg-white/10">
                          {getPillarIcon(pillar.icon)}
                        </div>
                        <span className="text-xs font-bold text-text-primary">
                          {pillar.name}
                        </span>
                      </div>

                      {pillar.isWarning ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30">
                          Alerta
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                          OK
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
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
                    <p className="text-[10px] text-text-muted font-normal mt-1 leading-snug border-t border-black/5 dark:border-white/5 pt-1">
                      🔬 {pillar.science}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. SELECCIÓN INTERACTIVA DE ESTRATEGIAS */}
            {strategyOptions && strategyOptions.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Target size={14} />
                    Pautas recomendadas para hoy (Selecciona una):
                  </span>
                  <span className="text-[10px] font-bold text-text-muted uppercase">
                    {strategyOptions.length > 1 ? `${strategyOptions.length} opciones` : 'Pauta activa'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {strategyOptions.map((opt) => {
                    const isSelected = activeStrategy?.id === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedStrategyId(opt.id)}
                        className={`p-3.5 sm:p-4 rounded-[22px] transition-all cursor-pointer relative flex items-start gap-3 select-none ${
                          isSelected
                            ? 'bg-accent/15 ring-2 ring-accent shadow-md shadow-accent/10'
                            : 'bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        {/* Radio Check */}
                        <div className={`mt-0.5 shrink-0 rounded-full w-5 h-5 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-accent text-white' : 'ring-1 ring-white/20 text-transparent'
                        }`}>
                          <Check size={13} strokeWidth={3} />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-black text-text-primary leading-tight">
                              {opt.title}
                            </span>
                            {opt.badge && (
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-accent text-white' : 'bg-black/10 dark:bg-white/10 text-text-secondary'
                              }`}>
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary font-medium leading-relaxed">
                            {opt.description}
                          </p>
                          {opt.actionHint && (
                            <span className="text-[10px] font-semibold text-accent block pt-0.5">
                              📌 {opt.actionHint}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 6. RECOMENDACIÓN DE ASESORÍA CON PREPARADOR/DIETISTA REAL */}
            {asesoriaRecommendation?.show && (
              <div className="p-4 sm:p-5 rounded-[24px] bg-gradient-to-br from-amber-500/15 via-yellow-500/5 to-transparent border border-amber-500/30 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-[16px] bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30 shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-sm font-black text-text-primary">
                      {asesoriaRecommendation.headline}
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed font-medium">
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
                    className="w-full py-3 px-4 rounded-[18px] bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all active:scale-95"
                  >
                    <UserCheck size={16} strokeWidth={2.5} />
                    <span>{asesoriaRecommendation.buttonText}</span>
                    <ArrowRight size={15} />
                  </button>
                )}
              </div>
            )}

            {/* Contexto científico de cierre */}
            <div className="p-3.5 rounded-[20px] bg-white/5 ring-1 ring-white/10 flex items-start gap-3">
              <Shield size={16} className="text-accent shrink-0 mt-0.5" />
              <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                Cálculos nutricionales basados en tu perfil corporal ({latestWeight} kg) y objetivo de <strong className="text-text-primary font-bold">{userGoal.label}</strong>. Sin dietas milagro: solo balance energético, reparto proteico óptimo e hidratación celular.
              </p>
            </div>

          </div>

          {/* Footer Buttons */}
          <div className="p-4 sm:p-5 border-t border-white/5 bg-black/10 dark:bg-white/5 flex items-center gap-3">
            {activeStrategy && (
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 py-3.5 px-4 rounded-[20px] bg-accent hover:brightness-110 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent/30 transition-all"
                style={{ color: "var(--btn-accent-text, #fff)" }}
              >
                <Check size={18} strokeWidth={3} />
                <span className="truncate">
                  Aplicar: {activeStrategy.title}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`py-3.5 px-6 rounded-[20px] font-bold text-sm bg-white/10 hover:bg-white/15 text-text-primary transition-all active:scale-95 ${
                !activeStrategy ? 'w-full' : ''
              }`}
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default SmartNutritionCoachModal;
