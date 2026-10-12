/* frontend/src/components/Workout/SmartExerciseCoachModal.jsx */
import React, { useMemo, useState } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Dumbbell, 
  Repeat, 
  Clock, 
  Target, 
  Shield, 
  Check, 
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Calendar,
  Flame,
  Info,
  Activity,
  Lightbulb,
  Sparkles,
  ArrowRight,
  UserCheck,
  CheckCircle,
  Radio
} from 'lucide-react';
import ModalPortal from '../ModalPortal';
import { generateSmartCoachPlan } from '../../utils/smartProgressionCoach';
import { saveAppliedCoachStrategy } from '../../utils/coachAppliedHistory';
import { formatDateToShort } from '../../utils/dateUtils';

const SmartExerciseCoachModal = ({
  exercise,
  userProfile,
  workoutLog,
  onClose,
  onApplyWeight,
  onApplyStrategy,
  onNavigateAsesoria
}) => {
  const [showRirHelp, setShowRirHelp] = useState(false);

  const plan = useMemo(() => {
    if (!exercise) return null;
    return generateSmartCoachPlan(exercise, userProfile, workoutLog);
  }, [exercise, userProfile, workoutLog]);

  // Selección de estrategia interactiva
  const [selectedStrategyId, setSelectedStrategyId] = useState(() => {
    return plan?.strategyOptions?.[0]?.id || null;
  });

  // Asegurar que si cambia el plan, se sincronice la estrategia seleccionada
  const activeStrategy = useMemo(() => {
    if (!plan?.strategyOptions || plan.strategyOptions.length === 0) return null;
    const found = plan.strategyOptions.find(s => s.id === selectedStrategyId);
    return found || plan.strategyOptions[0];
  }, [plan, selectedStrategyId]);

  if (!plan) return null;

  const { 
    userGoal, 
    trend, 
    targets, 
    coachingAdvice, 
    actionSteps, 
    sessions, 
    strategyOptions,
    motivationalMessage,
    celebrationData,
    asesoriaRecommendation,
    followUp
  } = plan;

  // Métricas activas computadas según la estrategia seleccionada por el usuario
  const activeSuggestedWeight = activeStrategy?.suggestedWeight !== undefined && activeStrategy.suggestedWeight !== null
    ? activeStrategy.suggestedWeight
    : targets.suggestedWeight;

  const activeSuggestedReps = activeStrategy?.suggestedReps !== undefined && activeStrategy.suggestedReps !== null
    ? activeStrategy.suggestedReps
    : targets.suggestedReps;

  const activeSuggestedSets = activeStrategy?.suggestedSets !== undefined && activeStrategy.suggestedSets !== null
    ? activeStrategy.suggestedSets
    : targets.suggestedSets;

  const getGoalIcon = () => {
    if (userGoal.key === 'gain') return <Dumbbell size={15} strokeWidth={2.5} className="text-accent" />;
    if (userGoal.key === 'lose') return <Flame size={15} strokeWidth={2.5} className="text-emerald-400" />;
    if (userGoal.key === 'recomp') return <Activity size={15} strokeWidth={2.5} className="text-purple-400" />;
    return <Shield size={15} strokeWidth={2.5} className="text-blue-400" />;
  };

  const handleApplySelection = () => {
    const payload = {
      ...(activeStrategy || {}),
      suggestedWeight: activeSuggestedWeight,
      suggestedReps: activeSuggestedReps,
      suggestedSets: activeSuggestedSets,
      exerciseName: exercise.name,
      goal: userGoal.key,
      trendStatus: trend.status
    };

    // Guardar en la persistencia histórica de estrategias
    saveAppliedCoachStrategy(exercise.name, payload);

    if (onApplyStrategy) {
      onApplyStrategy(payload);
    } else if (onApplyWeight && activeSuggestedWeight !== null) {
      onApplyWeight(activeSuggestedWeight);
    }

    onClose();
  };

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-bg-secondary dark:bg-[#121214] border border-glass-border rounded-t-[32px] sm:rounded-2xl shadow-2xl overflow-hidden animate-[slide-up_0.25s_cubic-bezier(0.16,1,0.3,1)] sm:animate-[scale-in_0.2s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Grabber en móvil */}
          <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

          {/* Header */}
          <div className="p-4 sm:p-6 pb-3 border-b border-glass-border flex items-start justify-between gap-3 bg-bg-secondary">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/15 text-accent ring-1 ring-accent/30">
                  {getGoalIcon()}
                  <span>{userGoal.label}</span>
                </span>

                {/* Badge de Diagnóstico */}
                {trend.isWarning ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/40 animate-pulse">
                    <AlertTriangle size={13} className="shrink-0" />
                    <span>{trend.badgeText}</span>
                  </span>
                ) : trend.isProgressing ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40">
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>¡En racha! {trend.badgeText}</span>
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ring-1 ${trend.colorClass}`}>
                    <span>{trend.badgeText}</span>
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight truncate">
                {exercise.name}
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

          {/* Body con Scroll */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[calc(90vh-160px)]">

            {/* 1. SEGUIMIENTO DE LA SESIÓN ANTERIOR (Si existe) */}
            {followUp && (
              <div className={`p-4 rounded-[24px] border border-glass-border transition-all ${
                followUp.color === 'emerald'
                  ? 'bg-emerald-500/10'
                  : followUp.color === 'amber'
                  ? 'bg-amber-500/10'
                  : 'bg-blue-500/10'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-[14px] shrink-0 mt-0.5 ${
                    followUp.color === 'emerald'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : followUp.color === 'amber'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                  }`}>
                    {followUp.color === 'emerald' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        followUp.color === 'emerald'
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}>
                        {followUp.badge}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-text-primary leading-tight">
                      {followUp.title}
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed font-medium">
                      {followUp.description}
                    </p>
                    <p className="text-[11px] font-semibold text-text-muted pt-1">
                      💡 {followUp.actionHint}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CELEBRACIÓN DE PROGRESIÓN (Si está progresando) */}
            {celebrationData?.isCelebrating && (
              <div className="p-4 sm:p-5 rounded-[24px] bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-[14px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 shrink-0">
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

                <div className="space-y-1.5 pt-1 border-t border-emerald-500/20">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    Pautas para sostener este ritmo:
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

            {/* 3. MENSAJE MOTIVACIONAL Y CIENCIA (Si está estancado o con fatiga) */}
            {motivationalMessage && (
              <div className="p-4 rounded-[24px] bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <div className="p-2 rounded-[14px] bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30 shrink-0 mt-0.5">
                  <Lightbulb size={18} />
                </div>
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                    Perspectiva Científica y Motivación
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed font-medium">
                    {motivationalMessage}
                  </p>
                </div>
              </div>
            )}

            {/* 4. SELECCIÓN INTERACTIVA DE ESTRATEGIAS */}
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
                            ? 'bg-accent/15 border-2 border-accent shadow-md shadow-accent/10'
                            : 'bg-black/5 dark:bg-white/5 border border-glass-border hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        {/* Indicador tipo Radio */}
                        <div className={`mt-0.5 shrink-0 rounded-full w-5 h-5 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-accent text-accent-contrast' : 'border border-glass-border text-transparent'
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
                                isSelected ? 'bg-accent text-accent-contrast' : 'bg-black/10 dark:bg-white/10 text-text-secondary'
                              }`}>
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary font-medium leading-relaxed">
                            {opt.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. TITULAR Y CONSEJO GENERAL */}
            <div className="p-4 sm:p-5 rounded-[24px] bg-black/5 dark:bg-white/5 border border-glass-border space-y-2">
              <h3 className="text-sm sm:text-base font-black text-text-primary leading-snug">
                {targets.actionTitle}
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary font-medium leading-relaxed">
                {coachingAdvice}
              </p>

              {actionSteps && actionSteps.length > 0 && (
                <div className="pt-2 space-y-1.5 border-t border-glass-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                    Pasos de ejecución:
                  </span>
                  {actionSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-medium text-text-primary/90">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. GRID DE MÉTRICAS CALCULADAS (OBJETIVOS DINÁMICOS) */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2.5 block px-1">
                Objetivos adaptados a la estrategia seleccionada:
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {/* 1. Peso Sugerido - SIN TRUNCATE */}
                <div className="bg-accent/10 dark:bg-accent/15 p-3.5 rounded-[20px] border border-accent/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-accent mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Peso Sugerido</span>
                    <Dumbbell size={15} />
                  </div>
                  <div className="my-1">
                    <span className="text-xl sm:text-2xl font-black text-accent tracking-tight">
                      {activeSuggestedWeight !== null ? `${activeSuggestedWeight} kg` : 'Calibrar'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-text-secondary leading-tight">
                    {activeStrategy?.badge || targets.weightChangeNote || 'Ajuste adaptado'}
                  </span>
                </div>

                {/* 2. Series */}
                <div className="bg-black/5 dark:bg-white/5 p-3.5 rounded-[20px] border border-glass-border flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Series</span>
                    <Repeat size={15} />
                  </div>
                  <div className="my-1">
                    <span className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                      {activeSuggestedSets}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-text-muted">
                    Series efectivas
                  </span>
                </div>

                {/* 3. Repeticiones */}
                <div className="bg-black/5 dark:bg-white/5 p-3.5 rounded-[20px] border border-glass-border flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Repeticiones</span>
                    <Flame size={15} />
                  </div>
                  <div className="my-1">
                    <span className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                      {activeSuggestedReps}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-text-muted">
                    Rango óptimo
                  </span>
                </div>

                {/* 4. Intensidad & RIR */}
                <div 
                  onClick={() => setShowRirHelp(!showRirHelp)}
                  className="bg-black/5 dark:bg-white/5 p-3.5 rounded-[20px] border border-glass-border flex flex-col justify-between cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-all group"
                  title="Toca para entender cómo medir tu esfuerzo"
                >
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-accent transition-colors">
                      Intensidad
                    </span>
                    <HelpCircle size={14} className="text-text-muted group-hover:text-accent transition-colors shrink-0" />
                  </div>
                  <div className="my-1">
                    <span className="text-xs sm:text-sm font-black text-text-primary tracking-tight leading-tight block">
                      {targets.intensityLabel || 'Esfuerzo Alto'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-text-muted leading-tight">
                    {targets.intensityDesc || 'Parar 1-2 reps antes'}
                  </span>
                </div>
              </div>

              {/* Barra de descanso */}
              <div className="mt-2.5 flex items-center justify-between px-1 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowRirHelp(!showRirHelp)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-accent hover:underline transition-all"
                >
                  <HelpCircle size={13} />
                  <span>{showRirHelp ? 'Ocultar guía de intensidad' : '¿Cómo medir el esfuerzo o qué es el RIR? Ver guía'}</span>
                </button>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted">
                  <Clock size={12} className="text-text-secondary" />
                  <span>Descanso sugerido: <strong className="text-text-primary font-bold">{targets.suggestedRest}</strong></span>
                </div>
              </div>
            </div>

            {/* 7. GUÍA DIDÁCTICA DE INTENSIDAD Y RIR */}
            {showRirHelp && (
              <div className="p-4 sm:p-5 rounded-[24px] bg-accent/10 ring-1 ring-accent/30 backdrop-blur-xl animate-[fade-in_0.2s_ease-out] relative">
                <button
                  type="button"
                  onClick={() => setShowRirHelp(false)}
                  className="absolute top-3.5 right-3.5 p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-text-muted hover:text-text-primary transition-all"
                  aria-label="Cerrar explicación"
                >
                  <X size={15} />
                </button>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-[14px] bg-accent/20 text-accent ring-1 ring-accent/40 shrink-0 mt-0.5">
                    <HelpCircle size={18} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-2 pr-6">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent block">
                        Guía de Intensidad Fácil
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-text-primary leading-tight mt-0.5">
                        ¿Qué significa parar antes del fallo (RIR)?
                      </h4>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed font-medium">
                      El <strong className="text-text-primary">RIR (Repeticiones en Recámara)</strong> indica cuántas repeticiones más podrías haber hecho antes de que el músculo no pudiera levantar el peso.
                    </p>

                    <div className="p-3 rounded-[16px] bg-bg-secondary border border-glass-border text-xs text-text-secondary space-y-2 font-medium">
                      <div className="flex items-start gap-2">
                        <span className="text-red-500 dark:text-red-400 font-bold shrink-0">·</span>
                        <p>
                          <strong className="text-text-primary">Al Fallo (RIR 0):</strong> Ya no pudiste completar ni una repetición más. Agota en exceso el sistema nervioso.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">·</span>
                        <p>
                          <strong className="text-text-primary">Cerca del Fallo (1-2 reps antes):</strong> Te detienes cuando sientes que te quedaba 1 o 2 repeticiones en reserva. Consigues el estímulo óptimo de crecimiento con total seguridad.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">·</span>
                        <p>
                          <strong className="text-text-primary">Moderado (2-3 reps antes):</strong> Margen cómodo para proteger la recuperación o en días de fatiga.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-1 text-[11px] text-text-muted leading-relaxed font-medium">
                      <Lightbulb size={14} className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" strokeWidth={2.5} />
                      <p>
                        <strong className="text-text-primary not-italic">Consejo práctico:</strong> No te compliques con tecnicismos. Solo entrena con un peso que te cueste, deteniéndote cuando sientas que la siguiente repetición comprometería la técnica.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 8. HISTORIAL PREVIO */}
            {sessions && sessions.length > 0 && (
              <div className="bg-black/5 dark:bg-white/5 p-4 sm:p-5 rounded-[24px] border border-glass-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold text-text-primary flex items-center gap-1.5">
                    <Calendar size={14} className="text-accent" />
                    Historial de Cargas Previas
                  </span>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    {sessions.length === 1 ? 'Última sesión' : `Últimas ${Math.min(sessions.length, 4)} sesiones`}
                  </span>
                </div>

                <div className="space-y-2">
                  {sessions.slice(0, 4).map((s, idx) => (
                    <div 
                      key={s.logId || idx}
                      className="flex items-center justify-between p-2.5 rounded-[16px] bg-bg-secondary border border-glass-border text-xs font-semibold gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] flex items-center justify-center font-bold text-text-muted shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-text-secondary font-medium truncate">
                          {formatDateToShort(s.date) || 'Sesión previa'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className="text-text-primary font-bold">
                          {s.topWeight > 0 ? `${s.topWeight} kg` : 'Corporal'} × {s.topReps} reps
                        </span>
                        {s.best1RM > 0 && (
                          <span className="text-accent text-[11px] font-extrabold bg-accent/10 px-2 py-0.5 rounded-md ring-1 ring-accent/20">
                            1RM: {s.best1RM} kg
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. RECOMENDACIÓN DE ASESORÍA CON PREPARADOR REAL */}
            {asesoriaRecommendation?.show && (
              <div className="p-4 sm:p-5 rounded-[24px] bg-gradient-to-br from-amber-500/15 via-yellow-500/5 to-transparent border border-amber-500/30 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-[16px] bg-amber-500/20 text-amber-500 dark:text-amber-400 ring-1 ring-amber-500/30 shrink-0">
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

            {/* Contexto de Objetivo Onboarding */}
            <div className="p-3.5 rounded-[20px] bg-black/5 dark:bg-white/5 border border-glass-border flex items-start gap-3">
              <Info size={16} className="text-accent shrink-0 mt-0.5" />
              <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                Cálculos deportivos adaptados a tu objetivo de <strong className="text-text-primary font-bold">{userGoal.label}</strong> registrado en tu perfil. Cada recomendación prioriza la relación estímulo-fatiga adecuada a tu nivel.
              </p>
            </div>

          </div>

          {/* Footer Buttons */}
          <div className="p-4 sm:p-5 border-t border-glass-border bg-bg-secondary flex items-center gap-3">
            <button
              type="button"
              onClick={handleApplySelection}
              className="flex-1 py-3.5 px-4 rounded-[20px] bg-accent hover:brightness-110 active:scale-95 text-accent-contrast font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent/30 transition-all"
            >
              <Check size={18} strokeWidth={3} />
              <span>
                {activeSuggestedWeight !== null 
                  ? `Aplicar ${activeSuggestedWeight} kg (${activeSuggestedReps} reps)`
                  : `Aplicar pauta (${activeSuggestedReps} reps)`}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-3.5 px-6 rounded-[20px] font-bold text-sm bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-text-primary transition-all active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default SmartExerciseCoachModal;
