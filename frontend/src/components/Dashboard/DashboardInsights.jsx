/* frontend/src/components/Dashboard/DashboardInsights.jsx */
import React, { useMemo, useState, useEffect } from 'react';
import {
  Lightbulb,
  Flame,
  Scale,
  Dumbbell,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Play,
  ArrowRight,
  Salad,
  Sparkles,
  Clock,
  Calendar,
  ChevronDown,
  Layers
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import GlassCard from '../GlassCard';
import {
  getExerciseHistorySessions,
  diagnoseExerciseTrend
} from '../../utils/smartProgressionCoach';
import {
  getAppliedCoachStrategy,
  evaluateExerciseFollowUpAndRecovery
} from '../../utils/coachAppliedHistory';
import { generateSmartNutritionCoachPlan } from '../../utils/smartNutritionCoach';

const DashboardInsights = ({ setView }) => {
  const {
    routines,
    workoutLog,
    bodyWeightLog,
    nutritionLog,
    waterLog,
    todaysCreatineLog,
    userProfile,
    startWorkout,
    activeWorkout,
    completedRoutineIdsToday
  } = useAppStore(
    useShallow((state) => ({
      routines: state.routines || [],
      workoutLog: state.workoutLog || [],
      bodyWeightLog: state.bodyWeightLog || [],
      nutritionLog: state.nutritionLog || [],
      waterLog: state.waterLog,
      todaysCreatineLog: state.todaysCreatineLog || [],
      userProfile: state.userProfile,
      startWorkout: state.startWorkout,
      activeWorkout: state.activeWorkout,
      completedRoutineIdsToday: state.completedRoutineIdsToday || []
    }))
  );

  const [coachTick, setCoachTick] = useState(0);

  useEffect(() => {
    const handleCoachUpdate = () => setCoachTick((v) => v + 1);
    window.addEventListener('coach-strategy-applied', handleCoachUpdate);
    window.addEventListener('nutrition-strategy-applied', handleCoachUpdate);
    return () => {
      window.removeEventListener('coach-strategy-applied', handleCoachUpdate);
      window.removeEventListener('nutrition-strategy-applied', handleCoachUpdate);
    };
  }, []);

  // Peso más reciente para cálculos nutricionales
  const latestWeight = useMemo(() => {
    if (Array.isArray(bodyWeightLog) && bodyWeightLog.length > 0) {
      const sorted = [...bodyWeightLog].sort(
        (a, b) => new Date(b.log_date) - new Date(a.log_date)
      );
      const parsed = parseFloat(sorted[0]?.weight_kg);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return parseFloat(userProfile?.weight) || 70;
  }, [bodyWeightLog, userProfile?.weight]);

  // 1. EVALUACIÓN DE EJERCICIOS POR RUTINA SEGÚN EL MODAL DE SEGUIMIENTO
  const exerciseTrackingSummary = useMemo(() => {
    const progressingByRoutine = [];
    const warningsByRoutine = [];
    let totalProgressingCount = 0;
    let totalWarningCount = 0;

    try {
      if (!Array.isArray(routines) || routines.length === 0 || !Array.isArray(workoutLog) || workoutLog.length === 0) {
        return {
          progressingByRoutine,
          warningsByRoutine,
          totalProgressingCount: 0,
          totalWarningCount: 0
        };
      }

      routines.forEach((routine) => {
        try {
          if (!routine) return;
          const routineExercises =
            routine.RoutineExercises || routine.exercises || [];
          if (!Array.isArray(routineExercises) || routineExercises.length === 0) return;

          const routineProgressing = [];
          const routineWarnings = [];
          const seenNames = new Set();

          routineExercises.forEach((ex) => {
            try {
              const exerciseName = (ex?.name || ex?.exercise_name || '').trim();
              if (!exerciseName) return;
              const normKey = exerciseName.toLowerCase();
              if (seenNames.has(normKey)) return;
              seenNames.add(normKey);

              const allSessions = getExerciseHistorySessions(
                exerciseName,
                workoutLog,
                routine.id,
                routine.name
              );
              const rCtx = allSessions?.routineContext;
              const targetSessions = rCtx?.sameRoutineSessions || [];

              // Solo evaluamos ejercicios que ya tienen historial registrado en esta rutina
              if (!targetSessions || targetSessions.length === 0) return;

              const diagnosedTrend = diagnoseExerciseTrend(targetSessions, routine.id);
              const lastApplied = getAppliedCoachStrategy(
                exerciseName,
                routine.id,
                routine.name
              );
              const followUp = evaluateExerciseFollowUpAndRecovery({
                exerciseName,
                sessions: targetSessions,
                allSessions,
                routineContext: rCtx,
                currentTrend: diagnosedTrend,
                lastApplied,
                userProfile
              });

              if (followUp?.isInactive || followUp?.isWarning) {
                routineWarnings.push({
                  name: exerciseName,
                  isInactive: Boolean(followUp?.isInactive),
                  badge: followUp?.badgeShort || (followUp?.isInactive ? 'Inactividad' : 'Aviso'),
                  timeAgoText: followUp?.timeAgoText || null
                });
                totalWarningCount++;
              } else if (followUp?.isOkGreen || diagnosedTrend?.isProgressing) {
                routineProgressing.push({
                  name: exerciseName,
                  badge:
                    diagnosedTrend?.isProgressing && diagnosedTrend?.badgeText
                      ? diagnosedTrend.badgeText
                      : followUp?.badgeShort || '¡OK Verde!'
                });
                totalProgressingCount++;
              } else if (diagnosedTrend?.isWarning) {
                routineWarnings.push({
                  name: exerciseName,
                  isInactive: false,
                  badge: 'Aviso',
                  timeAgoText: null
                });
                totalWarningCount++;
              }
            } catch (exErr) {
              console.warn('[DashboardInsights] Error procesando ejercicio individual:', exErr);
            }
          });

          if (routineProgressing.length > 0) {
            progressingByRoutine.push({
              routine,
              routineId: routine.id,
              routineName: routine.name,
              exercises: routineProgressing
            });
          }

          if (routineWarnings.length > 0) {
            warningsByRoutine.push({
              routine,
              routineId: routine.id,
              routineName: routine.name,
              exercises: routineWarnings
            });
          }
        } catch (rErr) {
          console.warn('[DashboardInsights] Error procesando rutina:', rErr);
        }
      });
    } catch (summaryErr) {
      console.warn('[DashboardInsights] Error en exerciseTrackingSummary:', summaryErr);
    }

    return {
      progressingByRoutine,
      warningsByRoutine,
      totalProgressingCount,
      totalWarningCount
    };
  }, [routines, workoutLog, userProfile, coachTick]);

  // 2. EVALUACIÓN DE NUTRICIÓN SEGÚN EL MODAL DE SEGUIMIENTO NUTRICIONAL
  const nutritionTracking = useMemo(() => {
    try {
      const { gender, age, height, activity_level = 1.2, goal } = userProfile || {};
      let calorieTarget = 2000;
      let proteinTarget = Math.round(latestWeight * (goal === 'gain' ? 2.0 : 1.8));
      let waterTarget = Math.round(latestWeight * 35);
      let sugarTarget = 50;

      if (latestWeight && height && age && gender && goal) {
        const bmr =
          10 * latestWeight +
          6.25 * height -
          5 * age +
          (gender === 'male' ? 5 : -161);
        let cal = Math.round(bmr * activity_level);
        if (goal === 'lose') cal -= 500;
        if (goal === 'gain') cal += 500;
        const protMult = goal === 'gain' ? 2.0 : goal === 'lose' ? 1.8 : 1.6;
        calorieTarget = cal;
        proteinTarget = Math.round(latestWeight * protMult);
        waterTarget = Math.round(latestWeight * 35);
        sugarTarget = Math.round((cal * 0.1) / 4);
      }

      const totals = (nutritionLog || []).reduce(
        (acc, log) => ({
          calories: acc.calories + (Number(log?.calories) || 0),
          protein: acc.protein + (parseFloat(log?.protein_g) || 0),
          carbs: acc.carbs + (parseFloat(log?.carbs_g) || 0),
          fats: acc.fats + (parseFloat(log?.fats_g) || 0),
          sugar: acc.sugar + (parseFloat(log?.sugars_g || log?.sugar_g) || 0)
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0 }
      );

      const hasAnyNutritionActivity =
        (nutritionLog && nutritionLog.length > 0) ||
        (waterLog?.quantity_ml || 0) > 0 ||
        (todaysCreatineLog && todaysCreatineLog.length > 0);

      const plan = generateSmartNutritionCoachPlan({
        userProfile,
        totals,
        targets: {
          calorieTarget,
          proteinTarget,
          waterTarget,
          sugarTarget
        },
        waterLog,
        todaysCreatineLog,
        nutritionLog,
        latestWeight
      });

      const optimalPillars = (plan?.pillars || []).filter(
        (p) => p.status === 'optimal'
      );
      const warningPillars = (plan?.pillars || []).filter((p) => p.isWarning);

      return {
        plan,
        hasAnyNutritionActivity,
        optimalPillars,
        warningPillars
      };
    } catch (e) {
      console.warn('[DashboardInsights] Error en nutritionTracking:', e);
      return {
        plan: null,
        hasAnyNutritionActivity: false,
        optimalPillars: [],
        warningPillars: []
      };
    }
  }, [
    userProfile,
    nutritionLog,
    waterLog,
    todaysCreatineLog,
    latestWeight,
    coachTick
  ]);

  const handleStartRoutineDirect = async (routine) => {
    if (!routine || !setView) return;
    const isActive =
      activeWorkout && String(activeWorkout.routineId) === String(routine.id);
    if (isActive) {
      setView('workout');
      return;
    }
    await startWorkout(routine);
    setView('workout');
  };

  const handleOpenNutritionCoach = () => {
    if (!setView) return;
    setView('nutrition', { reopenNutritionCoach: true });
  };

  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem('profitness_insights_expanded');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const handleToggleExpanded = (val) => {
    setIsExpanded((prev) => {
      const next = typeof val === 'boolean' ? val : !prev;
      try {
        localStorage.setItem('profitness_insights_expanded', String(next));
      } catch {}
      return next;
    });
  };

  const {
    progressingByRoutine,
    warningsByRoutine,
    totalProgressingCount,
    totalWarningCount
  } = exerciseTrackingSummary;
  const { plan: nutritionPlan, hasAnyNutritionActivity, optimalPillars, warningPillars } =
    nutritionTracking;

  // 3. CALIBRACIÓN DE ENTRENADOR INTELIGENTE (Primeros 3 entrenamientos / Marcas base)
  const calibrationSummary = useMemo(() => {
    try {
      const logs = Array.isArray(workoutLog) ? workoutLog : [];
      const strengthLogs = logs
        .filter((l) => Array.isArray(l?.WorkoutLogDetails) && l.WorkoutLogDetails.length > 0)
        .sort((a, b) => new Date(b.workout_date || b.created_at || 0) - new Date(a.workout_date || a.created_at || 0));

      const completedSessions = strengthLogs.length;
      const step = Math.min(completedSessions, 3);

      const marksMap = new Map();
      const routineNames = [];

      strengthLogs.forEach((log) => {
        const rName = (log?.routine_name || log?.routineName || '').trim();
        if (rName && !routineNames.includes(rName)) {
          routineNames.push(rName);
        }

        (log.WorkoutLogDetails || []).forEach((detail) => {
          const exName = (detail?.exercise_name || '').trim();
          if (!exName) return;
          const norm = exName.toLowerCase();
          if (marksMap.has(norm)) return;

          const sets = Array.isArray(detail?.WorkoutLogSets) ? detail.WorkoutLogSets : [];
          const workingSets = sets.filter(
            (s) => !(s.is_warmup === true || s.is_warmup === 'true' || s.is_warmup === 1) && (parseInt(s.reps, 10) || 0) > 0
          );
          const effectiveSets = workingSets.length > 0 ? workingSets : sets.filter((s) => (parseInt(s.reps, 10) || 0) > 0);
          if (effectiveSets.length === 0) return;

          let bestWeight = 0;
          let bestReps = 0;
          effectiveSets.forEach((s) => {
            const w = parseFloat(s.weight_kg) || 0;
            const r = parseInt(s.reps, 10) || 0;
            if (w > bestWeight || (w === bestWeight && r > bestReps)) {
              bestWeight = w;
              bestReps = r;
            }
          });

          const markLabel = bestWeight > 0 ? `${Math.round(bestWeight * 10) / 10} kg × ${bestReps}` : `${bestReps} reps`;
          marksMap.set(norm, { name: exName, mark: markLabel });
        });
      });

      const allMarks = Array.from(marksMap.values());
      const showCalibrationCard =
        completedSessions < 3 || (totalProgressingCount === 0 && totalWarningCount === 0);

      return {
        completedSessions,
        step,
        totalBaselineExercises: allMarks.length,
        topMarks: allMarks.slice(0, 5),
        latestRoutineName: routineNames[0] || null,
        routineNames,
        showCalibrationCard
      };
    } catch (e) {
      return {
        completedSessions: 0,
        step: 0,
        totalBaselineExercises: 0,
        topMarks: [],
        latestRoutineName: null,
        routineNames: [],
        showCalibrationCard: totalProgressingCount === 0 && totalWarningCount === 0
      };
    }
  }, [workoutLog, totalProgressingCount, totalWarningCount]);

  const showWelcomeCard = calibrationSummary.showCalibrationCard;

  const hasGreenProgress =
    totalProgressingCount > 0 ||
    Boolean(nutritionPlan?.isOptimal) ||
    (hasAnyNutritionActivity && optimalPillars.length > 0);

  const totalCardsCount = [
    totalProgressingCount > 0,
    totalWarningCount > 0,
    Boolean(nutritionPlan),
    showWelcomeCard
  ].filter(Boolean).length || 1;

  return (
    <div className="w-full flex flex-col gap-3.5 animate-[fade-in_0.4s_ease-out]">
      <div className="flex items-center justify-between gap-2 mb-1 px-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent shrink-0 shadow-sm">
            <Lightbulb size={18} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight">
                Seguimiento y Progreso
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                Entrenamiento y Nutrición
              </span>
            </div>
          </div>
        </div>

        {/* Único botón de cabecera solo cuando está desplegado para volver a solapar */}
        {isExpanded && (
          <button
            type="button"
            onClick={() => handleToggleExpanded(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-text-secondary hover:text-text-primary border border-glass-border transition-all active:scale-95 cursor-pointer shrink-0"
            aria-label="Solapar tarjetas"
          >
            <Layers size={13} className="text-accent shrink-0" />
            <span>Solapar</span>
          </button>
        )}
      </div>

      {!isExpanded ? (
        /* VISTA DE TARJETAS SOLAPADAS CON PROFUNDIDAD Y UN SOLO ACCIÓN */
        <div
          onClick={() => handleToggleExpanded(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggleExpanded(true);
            }
          }}
          className="cursor-pointer group select-none"
        >
          {/* Varias tarjetas representadas con sombras estratificadas, sin capas que puedan saltar */}
          <GlassCard
            style={{
              boxShadow: '0 5px 0 -1px var(--bg-primary), 0 6px 0 0 var(--glass-border), 0 11px 0 -2px var(--bg-primary), 0 12px 0 -1px var(--glass-border), var(--glass-shadow)'
            }}
            className={`glass relative z-10 flex flex-col gap-3 p-4 sm:p-5 rounded-[26px] border-none shadow-lg transition-all duration-300 ring-1 group-hover:ring-accent/40 ${
              totalWarningCount > 0 || (nutritionPlan?.isWarning && hasAnyNutritionActivity)
                ? 'ring-amber-500/40 bg-amber-500/10'
                : hasGreenProgress
                ? 'ring-emerald-500/35 bg-emerald-500/10'
                : 'ring-accent/35 bg-accent/10'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2.5 rounded-[16px] shrink-0 ring-1 ${
                    totalWarningCount > 0 || (nutritionPlan?.isWarning && hasAnyNutritionActivity)
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-amber-500/30'
                      : hasGreenProgress
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30'
                      : 'bg-accent/20 text-accent ring-accent/30'
                  }`}
                >
                  {totalWarningCount > 0 || (nutritionPlan?.isWarning && hasAnyNutritionActivity) ? (
                    <AlertTriangle size={20} strokeWidth={2.5} />
                  ) : hasGreenProgress ? (
                    <CheckCircle2 size={20} strokeWidth={2.5} />
                  ) : (
                    <Dumbbell size={20} strokeWidth={2.5} />
                  )}
                </div>

                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5 mb-0.5">
                    <Layers size={11} className="text-accent shrink-0" />
                    <span>{totalCardsCount > 1 ? `${totalCardsCount} tarjetas de seguimiento` : 'Resumen de seguimiento'}</span>
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-text-primary leading-tight truncate">
                    {totalProgressingCount > 0 && totalWarningCount > 0
                      ? `${totalProgressingCount} en verde y ${totalWarningCount} ${
                          totalWarningCount === 1 ? 'aviso' : 'avisos'
                        } en rutinas`
                      : totalWarningCount > 0
                      ? `${totalWarningCount} ${
                          totalWarningCount === 1
                            ? 'ejercicio requiere'
                            : 'ejercicios requieren'
                        } ajuste en tus rutinas`
                      : totalProgressingCount > 0
                      ? `¡Mejorando en ${totalProgressingCount} ${
                          totalProgressingCount === 1 ? 'ejercicio' : 'ejercicios'
                        }!`
                      : calibrationSummary.step === 1
                      ? `Calibración 1/3: ${calibrationSummary.totalBaselineExercises} marcas base fijadas`
                      : calibrationSummary.step === 2
                      ? `Calibración 2/3: Mapa muscular activo · Falta 1 sesión`
                      : calibrationSummary.step >= 3 && calibrationSummary.totalBaselineExercises > 0
                      ? `Base calibrada (${calibrationSummary.totalBaselineExercises} ejercicios) · Repite rutina para ver mejoras`
                      : 'Calibración 0/3: Completa tu 1er entreno para fijar marcas base'}
                  </h4>
                </div>
              </div>

              {/* Único botón indicador en la tarjeta solapada */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-accent-contrast text-xs font-black shadow-sm group-hover:brightness-110 transition-all shrink-0">
                <span>Ver detalles</span>
                <ChevronDown size={14} className="shrink-0 group-hover:translate-y-0.5 transition-transform" />
              </div>
            </div>

            {/* Píldoras de resumen del contenido solapado */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {totalProgressingCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold">
                  <CheckCircle2 size={12} className="shrink-0" />
                  <span>
                    {totalProgressingCount}{' '}
                    {totalProgressingCount === 1 ? 'ejercicio' : 'ejercicios'} en verde
                  </span>
                </span>
              )}

              {totalWarningCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 ring-1 ring-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold">
                  <AlertTriangle size={12} className="shrink-0" />
                  <span>
                    {totalWarningCount}{' '}
                    {totalWarningCount === 1 ? 'aviso' : 'avisos'} en rutinas
                  </span>
                </span>
              )}

              {showWelcomeCard && (
                <>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-accent/15 ring-1 ring-accent/30 text-accent text-[11px] font-extrabold">
                    <Dumbbell size={12} className="shrink-0" />
                    <span>
                      {calibrationSummary.step === 0
                        ? 'Calibración 0/3: Inicia una rutina para fijar marcas'
                        : calibrationSummary.step < 3
                        ? `Calibración ${calibrationSummary.step}/3 · ${3 - calibrationSummary.step} ${3 - calibrationSummary.step === 1 ? 'sesión' : 'sesiones'} para curvas 1RM`
                        : `Calibración 3/3 lista (${calibrationSummary.totalBaselineExercises} marcas base)`}
                    </span>
                  </span>
                  {calibrationSummary.topMarks.slice(0, 2).map((item, idx) => (
                    <span
                      key={`${item.name}-${idx}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/10 ring-1 ring-glass-border text-text-primary text-[11px] font-bold"
                    >
                      <span className="truncate max-w-[130px]">{item.name}:</span>
                      <span className="text-accent font-black">{item.mark}</span>
                    </span>
                  ))}
                </>
              )}

              {nutritionPlan && (
                <>
                  {nutritionPlan.isOptimal ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold">
                      <Sparkles size={12} className="shrink-0" />
                      <span>Nutrición en verde ({nutritionPlan.optimalCount} pilares OK)</span>
                    </span>
                  ) : nutritionPlan.isWarning && hasAnyNutritionActivity ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 ring-1 ring-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold">
                      <AlertTriangle size={12} className="shrink-0" />
                      <span>
                        Nutrición: {warningPillars.length}{' '}
                        {warningPillars.length === 1 ? 'aviso' : 'avisos'} hoy
                      </span>
                    </span>
                  ) : hasAnyNutritionActivity && optimalPillars.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold">
                      <TrendingUp size={12} className="shrink-0" />
                      <span>
                        Nutrición en progreso ({optimalPillars.length} en verde)
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 ring-1 ring-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold">
                      <Salad size={12} className="shrink-0" />
                      <span>Nutrición de hoy sin registrar</span>
                    </span>
                  )}
                </>
              )}
            </div>
          </GlassCard>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-[fade-in_0.25s_ease-out]">
        {/* ============================================================
            1. PROGRESO EN VERDE DE EJERCICIOS
           ============================================================ */}
        {totalProgressingCount > 0 && (
          <GlassCard className="glass flex flex-col justify-between gap-4 p-5 rounded-[26px] border-none ring-1 ring-emerald-500/35 bg-emerald-500/10 shadow-sm transition-all">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-[16px] shrink-0 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30">
                    <CheckCircle2 size={20} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-1">
                      <TrendingUp size={11} strokeWidth={2.5} />
                      <span>¡OK Verde! En Progresión</span>
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-text-primary leading-tight">
                      Estás mejorando en {totalProgressingCount}{' '}
                      {totalProgressingCount === 1 ? 'ejercicio' : 'ejercicios'}
                    </h4>
                  </div>
                </div>
              </div>

              <p className="text-xs font-medium text-text-secondary leading-relaxed">
                Según el seguimiento de tus entrenamientos, has superado marcas o consolidado mejoras en:
              </p>

              <div className="space-y-2.5">
                {progressingByRoutine.map((group) => {
                  const isActive =
                    activeWorkout &&
                    String(activeWorkout.routineId) === String(group.routineId);
                  return (
                    <div
                      key={group.routineId || group.routineName}
                      className="p-3 rounded-[18px] bg-black/5 dark:bg-white/5 ring-1 ring-emerald-500/25 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-text-primary flex items-center gap-1.5">
                          <Dumbbell size={13} className="text-emerald-500 shrink-0" />
                          <span>Rutina: {group.routineName}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStartRoutineDirect(group.routine)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-[11px] font-black transition-all active:scale-95 cursor-pointer shrink-0"
                        >
                          <Play size={11} fill="currentColor" />
                          <span>
                            {isActive ? 'Continuar rutina' : 'Iniciar rutina'}
                          </span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {group.exercises.map((ex, idx) => (
                          <span
                            key={`${ex.name}-${idx}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold"
                          >
                            <span>{ex.name}</span>
                            {ex.badge && (
                              <span className="text-[10px] font-black opacity-90 px-1.5 py-0.2 rounded bg-emerald-500/20">
                                {ex.badge}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        )}

        {/* ============================================================
            2. AVISOS EN EJERCICIOS (SOLO EJERCICIOS Y RUTINA + ENLACE DIRECTO)
           ============================================================ */}
        {totalWarningCount > 0 && (
          <GlassCard className="glass flex flex-col justify-between gap-4 p-5 rounded-[26px] border-none ring-1 ring-amber-500/40 bg-amber-500/10 shadow-sm transition-all">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-[16px] shrink-0 bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30">
                    <AlertTriangle size={20} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 mb-1">
                      <span>Aviso de Seguimiento · Ejercicios</span>
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-text-primary leading-tight">
                      Ejercicios que requieren ajuste en tus rutinas
                    </h4>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {warningsByRoutine.map((group) => {
                  const isActive =
                    activeWorkout &&
                    String(activeWorkout.routineId) === String(group.routineId);
                  return (
                    <div
                      key={group.routineId || group.routineName}
                      className="p-3 rounded-[18px] bg-black/5 dark:bg-white/5 ring-1 ring-amber-500/25 flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-text-primary flex items-center gap-1.5">
                          <Dumbbell size={13} className="text-amber-500 shrink-0" />
                          <span>Rutina: {group.routineName}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleStartRoutineDirect(group.routine)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black hover:brightness-110 text-[11px] font-black transition-all active:scale-95 cursor-pointer shadow-sm shrink-0"
                        >
                          <Play size={11} fill="currentColor" />
                          <span>
                            {isActive
                              ? `Ir a ${group.routineName}`
                              : `Iniciar ${group.routineName}`}
                          </span>
                        </button>
                      </div>

                                            <div className="flex flex-wrap gap-1.5">
                        {group.exercises.map((ex, idx) => (
                          <span
                            key={`${ex.name}-${idx}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-bold"
                          >
                            {ex.isInactive ? (
                              <Calendar size={11} className="shrink-0 animate-pulse text-amber-500" />
                            ) : (
                              <AlertTriangle size={11} className="shrink-0" />
                            )}
                            <span>{ex.name}</span>
                            {ex.badge && (
                              <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-amber-500/20 font-semibold opacity-90">
                                {ex.badge}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-300/90 leading-relaxed pt-1 border-t border-amber-500/20">
                Para ver los detalles y aplicar las recomendaciones en el modal de seguimiento, inicia la rutina correspondiente desde el enlace directo.
              </p>
            </div>
          </GlassCard>
        )}

        {/* ============================================================
            3. SEGUIMIENTO DE NUTRICIÓN (EN VERDE O AVISO SEGÚN EL MODAL)
           ============================================================ */}
        {nutritionPlan && (
          <>
            {nutritionPlan.isOptimal ? (
              <GlassCard className="glass flex flex-col justify-between gap-4 p-5 rounded-[26px] border-none ring-1 ring-emerald-500/35 bg-emerald-500/10 shadow-sm transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-[16px] shrink-0 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30">
                        <CheckCircle2 size={20} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-1">
                          <Sparkles size={11} />
                          <span>{nutritionPlan.overallBadgeText}</span>
                        </span>
                        <h4 className="text-sm sm:text-base font-black text-text-primary leading-tight">
                          ¡Progreso nutricional en verde hoy!
                        </h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-text-secondary leading-relaxed">
                    Estás cumpliendo tus objetivos nutricionales para{' '}
                    <strong className="text-text-primary font-bold">
                      {nutritionPlan.userGoal?.label}
                    </strong>{' '}
                    ({nutritionPlan.optimalCount} pilares en rango óptimo).
                  </p>

                  {optimalPillars.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {optimalPillars.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold"
                        >
                          <CheckCircle2 size={11} className="shrink-0" />
                          <span>{p.name}: OK</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-[11px] font-semibold text-text-secondary">
                    Consulta el desglose completo en el seguimiento nutricional
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenNutritionCoach}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-black transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <span>Ver seguimiento</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </GlassCard>
            ) : nutritionPlan.isWarning && hasAnyNutritionActivity ? (
              <GlassCard className="glass flex flex-col justify-between gap-4 p-5 rounded-[26px] border-none ring-1 ring-amber-500/40 bg-amber-500/10 shadow-sm transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-[16px] shrink-0 bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30">
                        <AlertTriangle size={20} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 mb-1">
                          <span>Aviso de Seguimiento · Nutrición</span>
                        </span>
                        <h4 className="text-sm sm:text-base font-black text-text-primary leading-tight">
                          Ajustes recomendados en tu nutrición de hoy
                        </h4>
                      </div>
                    </div>
                  </div>

                  {warningPillars.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-text-secondary block">
                        Apartados con aviso en el seguimiento nutricional:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {warningPillars.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-bold"
                          >
                            <AlertTriangle size={11} className="shrink-0" />
                            <span>{p.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {optimalPillars.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {optimalPillars.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold"
                        >
                          <CheckCircle2 size={10} className="shrink-0" />
                          <span>{p.name} en verde</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300/90">
                    Para ver los detalles y pautas recomendadas, abre el seguimiento en Nutrición:
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenNutritionCoach}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-black hover:brightness-110 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm shrink-0"
                  >
                    <span>Ir a Nutrición</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </GlassCard>
            ) : hasAnyNutritionActivity && optimalPillars.length > 0 ? (
              <GlassCard className="glass flex flex-col justify-between gap-4 p-5 rounded-[26px] border-none ring-1 ring-emerald-500/30 bg-emerald-500/10 shadow-sm transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-[16px] shrink-0 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30">
                        <TrendingUp size={20} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-1">
                          <span>En Progreso · {nutritionPlan.overallBadgeText}</span>
                        </span>
                        <h4 className="text-sm sm:text-base font-black text-text-primary leading-tight">
                          Vas avanzando bien en tu nutrición de hoy
                        </h4>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-text-secondary leading-relaxed">
                    Ya tienes <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{optimalPillars.length} {optimalPillars.length === 1 ? 'pilar' : 'pilares'} en verde</strong> hoy sin alertas activas. Sigue registrando tus comidas para completar tu meta diaria.
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {optimalPillars.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold"
                      >
                        <CheckCircle2 size={11} className="shrink-0" />
                        <span>{p.name} OK</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-[11px] font-semibold text-text-secondary">
                    Revisa las sugerencias para completar el resto del día
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenNutritionCoach}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-black transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <span>Ver seguimiento</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="glass flex flex-col justify-between gap-4 p-5 rounded-[26px] border-none ring-1 ring-amber-500/35 bg-amber-500/10 shadow-sm transition-all">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-[16px] shrink-0 bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30">
                      <Salad size={20} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 mb-1">
                        <span>Aviso · Nutrición Pendiente</span>
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-text-primary leading-tight">
                        Aún no has registrado tu nutrición de hoy
                      </h4>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-text-secondary leading-relaxed">
                    Registra tus comidas, agua y creatina para que el modal de seguimiento nutricional evalúe tus 6 pilares del día en verde.
                  </p>
                </div>

                <div className="pt-2.5 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300/90">
                    Abre Nutrición para registrar y ver detalles:
                  </span>
                  <button
                    type="button"
                    onClick={() => setView && setView('nutrition')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-black hover:brightness-110 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm shrink-0"
                  >
                    <span>Ir a Nutrición</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </GlassCard>
            )}
          </>
        )}

        {/* ============================================================
            4. CALIBRACIÓN DE ENTRENADOR INTELIGENTE (SESIONES 0/3 -> 3/3)
           ============================================================ */}
        {showWelcomeCard && (
          <GlassCard className="glass flex flex-col justify-between gap-4 p-5 rounded-[26px] border-none ring-1 ring-accent/35 bg-accent/10 shadow-sm transition-all">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-[16px] shrink-0 bg-accent/20 text-accent ring-1 ring-accent/30">
                    <Dumbbell size={20} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/20 text-accent mb-1">
                      <Sparkles size={11} />
                      <span>
                        {calibrationSummary.step === 0
                          ? 'Calibración Inicial · Paso 0 de 3'
                          : calibrationSummary.step === 1
                          ? 'Calibración 1/3 · Marcas Base Fijadas'
                          : calibrationSummary.step === 2
                          ? 'Calibración 2/3 · Recuperación Muscular Activa'
                          : 'Calibración 3/3 Completada · Listo para Sobrecarga'}
                      </span>
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-text-primary leading-tight">
                      {calibrationSummary.step === 0
                        ? 'Completa tu 1er entreno para fijar tus marcas base'
                        : calibrationSummary.step === 1
                        ? `¡Ya tenemos tus marcas base en ${calibrationSummary.totalBaselineExercises} ${
                            calibrationSummary.totalBaselineExercises === 1 ? 'ejercicio' : 'ejercicios'
                          }!`
                        : calibrationSummary.step === 2
                        ? `${calibrationSummary.totalBaselineExercises} ejercicios calibrados · ¡Solo falta 1 sesión!`
                        : `Base fijada en ${calibrationSummary.totalBaselineExercises} ejercicios`}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Barra visual de los 3 pasos de calibración */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                {[
                  { idx: 1, label: '1. Marcas base' },
                  { idx: 2, label: '2. Mapa muscular' },
                  { idx: 3, label: '3. Curvas 1RM' }
                ].map((s) => {
                  const done = calibrationSummary.step >= s.idx;
                  const isNext = calibrationSummary.step + 1 === s.idx;
                  return (
                    <div
                      key={s.idx}
                      className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-extrabold flex items-center justify-between gap-1 transition-all ${
                        done
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                          : isNext
                          ? 'bg-accent/20 border-accent/40 text-accent'
                          : 'bg-black/5 dark:bg-white/5 border-glass-border text-text-muted'
                      }`}
                    >
                      <span className="truncate">{s.label}</span>
                      {done && <CheckCircle2 size={11} className="shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {calibrationSummary.topMarks.length > 0 && (
                <div className="space-y-1.5 pt-0.5">
                  <span className="text-[11px] font-bold text-text-secondary block">
                    Marcas base memorizadas para guiarte en tu siguiente sesión:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {calibrationSummary.topMarks.map((item, idx) => (
                      <span
                        key={`${item.name}-${idx}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 ring-1 ring-accent/25 text-text-primary text-[11px] font-bold"
                      >
                        <span>{item.name}</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                          {item.mark}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs font-medium text-text-secondary leading-relaxed">
                {calibrationSummary.step === 0
                  ? 'Al registrar tu primera sesión, la app memorizará tus pesos y repeticiones en cada serie para indicarte cuánto subir en el próximo entrenamiento.'
                  : calibrationSummary.step === 1
                  ? `En tu próxima sesión${
                      calibrationSummary.latestRoutineName ? ` de "${calibrationSummary.latestRoutineName}"` : ''
                    }, la app te sugerirá automáticamente cuántas repeticiones o kilos subir en cada serie. Haz 1 entreno más (2/3) para calibrar tu mapa de fatiga y equilibrio muscular.`
                  : calibrationSummary.step === 2
                  ? 'Tu mapa de calor muscular ya registra qué grupos están en recuperación y cuáles tienes frescos al 100%. Completa 1 sesión más (3/3) para desbloquear tus gráficas de evolución y 1RM real.'
                  : 'Tus marcas base están listas. En cuanto repitas cualquiera de tus rutinas, verás aquí en verde cada ejercicio en el que superes tus repeticiones o cargas anteriores.'}
              </p>
            </div>

            <div className="pt-2.5 border-t border-accent/20 flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-[11px] font-semibold text-text-secondary">
                {calibrationSummary.step > 0
                  ? 'Revisa tu mapa muscular o inicia tu siguiente sesión:'
                  : 'Elige o crea tu rutina para registrar tu 1ª sesión:'}
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {calibrationSummary.step > 0 && (
                  <button
                    type="button"
                    onClick={() => setView && setView('progress')}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-text-primary text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <Flame size={13} className="text-accent" />
                    <span>Mapa Muscular</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setView && setView('routines', { forceTab: 'myRoutines' })}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent text-accent-contrast hover:brightness-110 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm shrink-0"
                >
                  <span>{calibrationSummary.step > 0 ? 'Siguiente Entreno' : 'Ver Rutinas'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </GlassCard>
        )}

        </div>
      )}
    </div>
  );
};

export default DashboardInsights;
