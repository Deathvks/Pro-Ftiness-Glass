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
  Radio,
  ChevronDown,
  ChevronUp
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
  onNavigateAsesoria,
  readOnly = false
}) => {
  const [showRirHelp, setShowRirHelp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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
    sessions, 
    strategyOptions,
    motivationalMessage,
    celebrationData,
    asesoriaRecommendation,
    followUp,
    currentTopWeight
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
    if (readOnly) {
      onClose();
      return;
    }

    const payload = {
      ...(activeStrategy || {}),
      suggestedWeight: activeSuggestedWeight,
      suggestedReps: activeSuggestedReps,
      suggestedSets: activeSuggestedSets,
      exerciseName: exercise.name,
      goal: userGoal.key,
      trendStatus: trend.status,
      baselineWeight: sessions?.[0]?.topWeight ?? currentTopWeight,
      baselineReps: sessions?.[0]?.topReps ?? null,
      baseline1RM: sessions?.[0]?.best1RM ?? null
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
          className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-bg-secondary ring-1 ring-black/5 dark:ring-white/10 border-none rounded-t-[32px] sm:rounded-2xl shadow-2xl overflow-hidden animate-[slide-up_0.25s_cubic-bezier(0.16,1,0.3,1)] sm:animate-[scale-in_0.2s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 pt-3 sm:pt-6 pb-3 border-b border-black/5 dark:border-white/10 flex flex-col gap-2 bg-bg-secondary shrink-0">
            {/* Top Grabber en móvil */}
            <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-1 sm:hidden shrink-0" />

            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/15 text-accent">
                  {getGoalIcon()}
                  <span>{userGoal.label}</span>
                </span>

                {/* Badge de Diagnóstico o Seguimiento */}
                {followUp?.isOkGreen ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>{followUp.badge}</span>
                  </span>
                ) : followUp?.isTooSoon ? (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    followUp.type === 'recovery_warning'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse'
                      : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  }`}>
                    {followUp.type === 'recovery_warning' ? <AlertTriangle size={13} /> : <Clock size={13} />}
                    <span>{followUp.badge}</span>
                  </span>
                ) : followUp?.type === 'next_session_target' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/15 text-accent">
                    <TrendingUp size={13} className="shrink-0" />
                    <span>{followUp.badge}</span>
                  </span>
                ) : trend.isWarning ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse">
                    <AlertTriangle size={13} className="shrink-0" />
                    <span>{trend.badgeText}</span>
                  </span>
                ) : trend.isProgressing ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>¡En racha! {trend.badgeText}</span>
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${trend.colorClass}`}>
                    <span>{trend.badgeText}</span>
                  </span>
                )}

                {readOnly && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/5 dark:bg-white/10 text-text-secondary">
                    <span>Guía de Progreso</span>
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight truncate">
                {exercise.displayName || exercise.name}
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
          </div>

          {/* Body con Scroll */}
          <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">

            {/* 1. ASESORÍA CON PREPARADOR REAL (SIEMPRE VISIBLE) */}
            {asesoriaRecommendation && (
              <div className="p-3 sm:p-3.5 rounded-[20px] bg-accent/10 ring-1 ring-black/5 dark:ring-white/10 border-none flex items-center justify-between gap-3">
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

            {/* 2. SEGUIMIENTO LONGITUDINAL Y ESTADO DE RECUPERACIÓN */}
            {followUp && (followUp.isTooSoon || followUp.isOkGreen || followUp.type === 'next_session_target') && (
              <div
                className={`p-3.5 sm:p-4 rounded-[22px] ring-1 ring-black/5 dark:ring-white/10 border-none flex flex-col gap-2.5 shadow-sm ${
                  followUp.type === 'ok_green'
                    ? 'bg-emerald-500/10'
                    : followUp.type === 'recovery_warning'
                    ? 'bg-amber-500/15 ring-amber-500/30'
                    : followUp.type === 'recovery_notice'
                    ? 'bg-blue-500/10'
                    : followUp.type === 'next_session_target'
                    ? 'bg-accent/10'
                    : 'bg-amber-500/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-[10px] shrink-0 ${
                        followUp.type === 'ok_green'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : followUp.type === 'recovery_warning'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          : followUp.type === 'recovery_notice'
                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          : followUp.type === 'next_session_target'
                          ? 'bg-accent/20 text-accent'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {followUp.type === 'ok_green' ? (
                        <CheckCircle2 size={16} strokeWidth={2.5} />
                      ) : followUp.type === 'recovery_warning' ? (
                        <AlertTriangle size={16} strokeWidth={2.5} />
                      ) : followUp.type === 'recovery_notice' ? (
                        <Clock size={16} strokeWidth={2.5} />
                      ) : followUp.type === 'next_session_target' ? (
                        <TrendingUp size={16} strokeWidth={2.5} />
                      ) : (
                        <AlertTriangle size={16} strokeWidth={2.5} />
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        followUp.type === 'ok_green'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : followUp.type === 'recovery_warning'
                          ? 'text-amber-600 dark:text-amber-400'
                          : followUp.type === 'recovery_notice'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-accent'
                      }`}
                    >
                      {followUp.badge}
                    </span>
                  </div>

                  {followUp.timeAgoText && (
                    <span className="text-[10px] font-bold text-text-muted">
                      {followUp.timeAgoText}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-text-primary leading-tight">
                    {followUp.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-text-secondary leading-relaxed">
                    {followUp.message}
                  </p>
                </div>

                {followUp.actionHint && (
                  <div className="pt-1 border-t border-black/5 dark:border-white/10 flex items-start gap-1.5 text-[11px] font-medium text-text-muted">
                    <span className="font-bold text-text-primary shrink-0">Consejo:</span>
                    <span>{followUp.actionHint}</span>
                  </div>
                )}
              </div>
            )}

            {/* 3. ¿QUÉ HEMOS DETECTADO EN TU RENDIMIENTO? */}
            <div className={`p-3.5 sm:p-4 rounded-[22px] space-y-2 ring-1 ring-black/5 dark:ring-white/10 border-none ${
              trend.isWarning 
                ? 'bg-amber-500/10' 
                : trend.isProgressing 
                ? 'bg-emerald-500/10' 
                : 'bg-black/5 dark:bg-white/5'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-[10px] shrink-0 ${
                  trend.isWarning 
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' 
                    : trend.isProgressing 
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-accent/20 text-accent'
                }`}>
                  {trend.isWarning ? (
                    <AlertTriangle size={15} strokeWidth={2.5} />
                  ) : trend.isProgressing ? (
                    <Sparkles size={15} />
                  ) : (
                    <Info size={15} />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-text-muted block">
                    ¿Qué hemos detectado en tu rendimiento?
                  </span>
                  <h3 className="text-xs sm:text-sm font-black text-text-primary leading-tight">
                    {trend.status === 'stagnant'
                      ? `Estancamiento detectado: Llevas ${trend.weeksStagnant || 2} semanas levantando ${currentTopWeight > 0 ? `${currentTopWeight} kg` : 'peso corporal'}`
                      : trend.status === 'decreasing'
                      ? `Aviso: Fatiga residual detectada (${trend.badgeText})`
                      : trend.isProgressing
                      ? `¡Gran progresión! Has aumentado tu fuerza (${trend.badgeText})`
                      : trend.status === 'first_time'
                      ? `Sin marcas previas: Calibración inicial para ${userGoal.label}`
                      : `1 sesión previa: Estableciendo base para ${userGoal.label}`}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed font-medium">
                {coachingAdvice}
              </p>

              {motivationalMessage && (
                <div className="p-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 border-none text-[11px] text-text-secondary leading-relaxed font-medium flex items-start gap-2">
                  <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>{motivationalMessage}</span>
                </div>
              )}
            </div>

            {/* 4. OBJETIVO CALCULADO PARA HOY (MÉTRICAS CLAVE EN VISTA RÁPIDA) */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-text-muted">
                  Tu objetivo para hoy:
                </span>
                <span className="text-[11px] font-bold text-accent">
                  {activeStrategy?.badge || targets.weightChangeNote || 'Ajuste adaptado'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {/* 1. Peso Sugerido */}
                <div className="bg-accent/10 dark:bg-accent/15 p-3 rounded-[18px] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-accent mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Peso</span>
                    <Dumbbell size={14} />
                  </div>
                  <div className="my-0.5">
                    <span className="text-xl sm:text-2xl font-black text-accent tracking-tight">
                      {activeSuggestedWeight !== null ? `${activeSuggestedWeight} kg` : 'Calibrar'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-text-secondary truncate">
                    {targets.weightChangeNote || 'Carga sugerida'}
                  </span>
                </div>

                {/* 2. Series */}
                <div className="bg-black/5 dark:bg-white/5 p-3 rounded-[18px] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-secondary mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Series</span>
                    <Repeat size={14} />
                  </div>
                  <div className="my-0.5">
                    <span className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                      {activeSuggestedSets}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-text-muted">
                    Series efectivas
                  </span>
                </div>

                {/* 3. Repeticiones */}
                <div className="bg-black/5 dark:bg-white/5 p-3 rounded-[18px] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-secondary mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Reps</span>
                    <Flame size={14} />
                  </div>
                  <div className="my-0.5">
                    <span className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                      {activeSuggestedReps}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-text-muted">
                    Rango óptimo
                  </span>
                </div>

                {/* 4. Intensidad / Esfuerzo */}
                <div 
                  onClick={() => setShowRirHelp(!showRirHelp)}
                  className="bg-black/5 dark:bg-white/5 p-3 rounded-[18px] flex flex-col justify-between cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-all group"
                  title="Toca para ver ayuda de intensidad"
                >
                  <div className="flex items-center justify-between text-text-secondary mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider group-hover:text-accent transition-colors">
                      Esfuerzo
                    </span>
                    <HelpCircle size={13} className="text-text-muted group-hover:text-accent transition-colors shrink-0" />
                  </div>
                  <div className="my-0.5">
                    <span className="text-xs sm:text-sm font-black text-text-primary tracking-tight leading-tight block truncate">
                      {targets.intensityLabel || 'Alto'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-accent leading-tight">
                    {showRirHelp ? 'Ocultar guía' : '¿Cómo medirlo?'}
                  </span>
                </div>
              </div>

              {/* Descanso sugerido */}
              <div className="mt-2 flex items-center justify-between px-1 text-[11px] font-semibold text-text-muted">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-text-secondary" />
                  <span>Descanso: <strong className="text-text-primary font-bold">{targets.suggestedRest}</strong> entre series</span>
                </div>
              </div>
            </div>

            {/* GUÍA DE INTENSIDAD / RIR (SOLO SE DESPLIEGA SI SE TOCA) */}
            {showRirHelp && (
              <div className="p-3.5 sm:p-4 rounded-[20px] bg-accent/10 space-y-2 text-xs text-text-secondary animate-[fade-in_0.15s_ease-out]">
                <div className="flex items-center justify-between">
                  <span className="font-black text-text-primary flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-accent" />
                    Cómo regular tu esfuerzo sin tecnicismos
                  </span>
                  <button onClick={() => setShowRirHelp(false)} className="text-text-muted hover:text-text-primary p-1">
                    <X size={14} />
                  </button>
                </div>
                <p className="leading-relaxed">
                  No hace falta llegar al fallo extremo en cada serie. La ciencia demuestra que parar cuando sientes que te quedaban <strong className="text-text-primary font-bold">1 o 2 repeticiones en reserva</strong> da el mismo crecimiento muscular pero sin agotar tu sistema nervioso ni lesionarte.
                </p>
                <div className="p-2.5 rounded-[12px] bg-bg-secondary space-y-1.5 text-[11px]">
                  <p className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <span className="leading-snug">
                      <strong className="text-text-primary">1-2 reps antes de no poder más:</strong> Rango ideal para ganar masa y fuerza con seguridad.
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <span className="leading-snug">
                      <strong className="text-text-primary">2-3 reps antes:</strong> Si estás cansado o cuidando una articulación.
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* 5. OPCIONES DE ESTRATEGIA (INTERACTIVAS Y DIRECTAS) */}
            {strategyOptions && strategyOptions.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-text-muted block px-1">
                  {readOnly ? 'Estrategias recomendadas para tus próximas sesiones:' : 'Elige cómo quieres enfocar el ejercicio hoy:'}
                </span>

                <div className="grid grid-cols-1 gap-2">
                  {strategyOptions.map((opt) => {
                    const isSelected = activeStrategy?.id === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedStrategyId(opt.id)}
                        className={`p-3 sm:p-3.5 rounded-[20px] transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isSelected
                            ? 'bg-accent/15 ring-1 ring-accent shadow-sm border-none'
                            : 'bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 border-none hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className={`mt-0.5 shrink-0 rounded-full w-5 h-5 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-accent text-accent-contrast' : 'bg-black/10 dark:bg-white/10 text-transparent'
                        }`}>
                          <Check size={12} strokeWidth={3} />
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5">
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

            {/* 6. HISTORIAL DE CARGAS PREVIAS (PLEGABLE PARA NO OCUPAR ESPACIO EN MÓVIL) */}
            {sessions && sessions.length > 0 && (
              <div className="rounded-[20px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 border-none overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full p-3 sm:p-3.5 flex items-center justify-between text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <Calendar size={14} className="text-accent" />
                    Historial de cargas ({sessions.length} sesiones)
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-accent">
                    <span>{showHistory ? 'Ocultar' : 'Ver detalle'}</span>
                    {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {showHistory && (
                  <div className="p-3 pt-0 space-y-1.5 border-t border-black/5 dark:border-white/10 animate-[fade-in_0.15s_ease-out]">
                    {sessions.slice(0, 4).map((s, idx) => (
                      <div 
                        key={s.logId || idx}
                        className="flex items-center justify-between p-2 rounded-[14px] bg-bg-secondary text-xs font-semibold gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] flex items-center justify-center font-bold text-text-muted shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="text-text-secondary font-medium truncate">
                            {formatDateToShort(s.date) || 'Sesión previa'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-text-primary font-bold">
                            {s.topWeight > 0 ? `${s.topWeight} kg` : 'Corporal'} × {s.topReps} reps
                          </span>
                          {s.best1RM > 0 && (
                            <span className="text-accent text-[10px] font-extrabold bg-accent/10 px-1.5 py-0.5 rounded">
                              1RM: {s.best1RM}kg
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Contexto de Objetivo Onboarding (Discreto) */}
            <p className="text-[11px] text-text-muted text-center px-2 leading-relaxed">
              Adaptado a tu objetivo de <strong className="text-text-primary font-bold">{userGoal.label}</strong>.
            </p>

          </div>

          {/* Footer Buttons */}
          <div className="p-4 sm:p-5 border-t border-black/5 dark:border-white/10 bg-bg-secondary flex items-center gap-3">
            {!readOnly && (onApplyStrategy || onApplyWeight) ? (
              <>
                <button
                  type="button"
                  onClick={handleApplySelection}
                  className="flex-1 py-3.5 px-4 rounded-[20px] bg-accent hover:brightness-110 active:scale-95 text-accent-contrast font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent/30 transition-all"
                >
                  <Check size={18} strokeWidth={3} />
                  <span>
                    {activeSuggestedWeight !== null 
                      ? (activeSuggestedSets && activeSuggestedSets !== parseInt(exercise.sets, 10)
                          ? `Aplicar ${activeSuggestedSets} series con ${activeSuggestedWeight} kg`
                          : `Aplicar ${activeSuggestedWeight} kg (${activeSuggestedReps} reps)`)
                      : (activeSuggestedSets && activeSuggestedSets !== parseInt(exercise.sets, 10)
                          ? `Aplicar ${activeSuggestedSets} series (${activeSuggestedReps} reps)`
                          : `Aplicar objetivo (${activeSuggestedReps} reps)`)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3.5 px-6 rounded-[20px] font-bold text-sm bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-text-primary transition-all active:scale-95"
                >
                  Entendido
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 px-6 rounded-[20px] bg-accent hover:brightness-110 active:scale-95 text-accent-contrast font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent/30 transition-all"
                style={{ color: "var(--btn-accent-text, #000)" }}
              >
                <Check size={18} strokeWidth={3} />
                <span>Entendido</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default SmartExerciseCoachModal;
