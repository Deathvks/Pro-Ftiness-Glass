/* frontend/src/components/Workout/SmartExerciseCoachModal.jsx */
import React, { useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Dumbbell, 
  Repeat, 
  Clock, 
  Target, 
  Zap, 
  Shield, 
  Check, 
  HelpCircle,
  Calendar,
  Flame,
  Info
} from 'lucide-react';
import ModalPortal from '../ModalPortal';
import { generateSmartCoachPlan } from '../../utils/smartProgressionCoach';
import { formatDateToShort } from '../../utils/dateUtils';

const SmartExerciseCoachModal = ({
  exercise,
  userProfile,
  workoutLog,
  onClose,
  onApplyWeight
}) => {
  const plan = useMemo(() => {
    if (!exercise) return null;
    return generateSmartCoachPlan(exercise, userProfile, workoutLog);
  }, [exercise, userProfile, workoutLog]);

  if (!plan) return null;

  const { userGoal, trend, targets, coachingAdvice, actionSteps, sessions } = plan;

  const getTrendIcon = () => {
    if (trend.status === 'progressing') return <TrendingUp size={18} className="text-emerald-400" strokeWidth={2.5} />;
    if (trend.status === 'decreasing') return <TrendingDown size={18} className="text-amber-400" strokeWidth={2.5} />;
    if (trend.status === 'stagnant') return <Minus size={18} className="text-amber-500" strokeWidth={2.5} />;
    return <Sparkles size={18} className="text-accent" strokeWidth={2.5} />;
  };

  const getGoalIcon = () => {
    if (userGoal.key === 'gain') return <Zap size={15} className="text-accent" />;
    if (userGoal.key === 'lose') return <Target size={15} className="text-emerald-400" />;
    if (userGoal.key === 'recomp') return <Sparkles size={15} className="text-purple-400" />;
    return <Shield size={15} className="text-blue-400" />;
  };

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-bg-secondary/95 dark:bg-[#121214]/95 backdrop-blur-2xl rounded-t-[36px] sm:rounded-[36px] ring-1 ring-white/10 dark:ring-white/15 shadow-2xl overflow-hidden animate-[slide-up_0.25s_cubic-bezier(0.16,1,0.3,1)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Grabber / Drag indicator en móvil */}
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

          {/* Header */}
          <div className="p-5 sm:p-6 pb-3 border-b border-white/5 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-accent/10 ring-1 ring-accent/30 text-accent">
                  <Sparkles size={12} className="animate-pulse" />
                  Coach Inteligente
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/5 ring-1 ring-white/10 text-text-secondary">
                  {getGoalIcon()}
                  {userGoal.label}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight truncate capitalize">
                {exercise.name}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all active:scale-90"
              aria-label="Cerrar"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Modal Content Scrollable */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 hide-scrollbar">
            
            {/* Banner de Diagnóstico según Historial */}
            <div className="bg-black/5 dark:bg-white/5 p-4 sm:p-5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 space-y-3 shadow-inner">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-[14px] bg-white/5 ring-1 ring-white/10">
                    {getTrendIcon()}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                      Estado de Rendimiento
                    </span>
                    <span className="text-sm font-extrabold text-text-primary">
                      {trend.label}
                    </span>
                  </div>
                </div>

                <span className={`text-xs font-bold px-3 py-1 rounded-full ring-1 ${trend.colorClass}`}>
                  {trend.badgeText}
                </span>
              </div>

              {/* Titular de acción */}
              <div className="pt-2 border-t border-black/5 dark:border-white/5">
                <h3 className="text-base sm:text-lg font-black text-text-primary leading-snug">
                  {targets.actionTitle}
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary font-medium mt-1 leading-relaxed">
                  {coachingAdvice}
                </p>
              </div>

              {/* Puntos clave / Pasos sugeridos */}
              {actionSteps && actionSteps.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
                    Pautas recomendadas para hoy:
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

            {/* Grid de Métricas Calculadas Objetivo */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2.5 block px-1">
                Objetivos Calculados para esta sesión:
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {/* 1. Peso Sugerido */}
                <div className="bg-accent/10 dark:bg-accent/15 p-3.5 rounded-[20px] ring-1 ring-accent/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-accent mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Peso Sugerido</span>
                    <Dumbbell size={15} />
                  </div>
                  <div className="my-1">
                    <span className="text-xl sm:text-2xl font-black text-accent tracking-tight">
                      {targets.suggestedWeight !== null ? `${targets.suggestedWeight} kg` : 'Calibrar'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-text-secondary truncate" title={targets.weightChangeNote}>
                    {targets.weightChangeNote || 'Según esfuerzo RIR'}
                  </span>
                </div>

                {/* 2. Series */}
                <div className="bg-black/5 dark:bg-white/5 p-3.5 rounded-[20px] ring-1 ring-black/5 dark:ring-white/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Series</span>
                    <Repeat size={15} />
                  </div>
                  <div className="my-1">
                    <span className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                      {targets.suggestedSets}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-text-muted">
                    Series efectivas
                  </span>
                </div>

                {/* 3. Repeticiones */}
                <div className="bg-black/5 dark:bg-white/5 p-3.5 rounded-[20px] ring-1 ring-black/5 dark:ring-white/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Repeticiones</span>
                    <Flame size={15} />
                  </div>
                  <div className="my-1">
                    <span className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                      {targets.suggestedReps}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-text-muted">
                    Rango óptimo
                  </span>
                </div>

                {/* 4. RIR & Descanso */}
                <div className="bg-black/5 dark:bg-white/5 p-3.5 rounded-[20px] ring-1 ring-black/5 dark:ring-white/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-secondary mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Intensidad</span>
                    <Clock size={15} />
                  </div>
                  <div className="my-1">
                    <span className="text-sm sm:text-base font-black text-text-primary tracking-tight leading-tight">
                      {targets.suggestedRir}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-text-muted">
                    Descanso: {targets.suggestedRest}
                  </span>
                </div>
              </div>
            </div>

            {/* Evolución Histórica de Sesiones Previas */}
            {sessions && sessions.length > 0 && (
              <div className="bg-black/5 dark:bg-white/5 p-4 sm:p-5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10">
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
                      className="flex items-center justify-between p-2.5 rounded-[16px] bg-black/5 dark:bg-white/5 text-xs font-semibold gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] flex items-center justify-center font-bold text-text-muted shrink-0">
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

            {/* Contexto de Objetivo Onboarding */}
            <div className="p-3.5 rounded-[20px] bg-white/5 ring-1 ring-white/10 flex items-start gap-3">
              <Info size={16} className="text-accent shrink-0 mt-0.5" />
              <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                Cálculos basados en tu meta de <strong className="text-text-primary font-bold">{userGoal.label}</strong> establecida en tu perfil. Cada ajuste está diseñado para mantener el balance ideal entre estímulo muscular y recuperación sin sobrecargar el SNC.
              </p>
            </div>

          </div>

          {/* Footer Buttons */}
          <div className="p-4 sm:p-5 border-t border-white/5 bg-black/10 dark:bg-white/5 flex items-center gap-3">
            {targets.suggestedWeight !== null && onApplyWeight && (
              <button
                type="button"
                onClick={() => onApplyWeight(targets.suggestedWeight)}
                className="flex-1 py-3.5 px-4 rounded-[20px] bg-accent hover:brightness-110 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent/30 transition-all"
                style={{ color: "var(--btn-accent-text, #fff)" }}
              >
                <Check size={18} strokeWidth={3} />
                <span>Aplicar {targets.suggestedWeight} kg a mis series</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`py-3.5 px-6 rounded-[20px] font-bold text-sm bg-white/10 hover:bg-white/15 text-text-primary transition-all active:scale-95 ${
                targets.suggestedWeight === null || !onApplyWeight ? 'w-full' : ''
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

export default SmartExerciseCoachModal;
