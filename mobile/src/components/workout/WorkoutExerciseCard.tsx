/* mobile/src/components/workout/WorkoutExerciseCard.tsx */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import {
  History,
  Target,
  Flame,
  Repeat,
  Bell,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  ChevronRight,
  Zap,
  Calendar,
  TrendingUp,
  Sparkles,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import { ContentCardBackdrop } from '@/components/ui/ContentCardBackdrop';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { calculate1RM } from '@/utils/workoutHelpers';
import {
  getExerciseHistorySessions,
  diagnoseExerciseTrend,
  detectIntraSessionMuscleFatigue,
  getEquipmentDetails,
  calculateIntraSessionFatigueAdjustment,
} from '@/utils/smartProgressionCoach';
import {
  evaluateExerciseFollowUpAndRecovery,
  getAppliedCoachStrategy,
} from '@/utils/coachAppliedHistory';
import { WorkoutSetGrid } from './WorkoutSetGrid';
import { ExerciseMediaPreview } from '@/components/routines/ExerciseMediaPreview';
import { BACKEND_BASE_URL, API_BASE_URL } from '@/services/apiClient';

interface WorkoutExerciseCardProps {
  exercise: any;
  actualExIndex: number;
  hasWorkoutStarted: boolean;
  onSetSelectedExercise?: (exercise: any) => void;
  onSetExerciseToReplace: (exIndex: number) => void;
  onShowHistory?: (exercise: any) => void;
  onShowSmartCoach?: (exercise: any) => void;
  onUpdateSet: (exIdx: number, setIdx: number, field: string, val: string) => void;
  onAddDropset: (exIdx: number, setIdx: number) => void;
  onRemoveDropset: (exIdx: number, setIdx: number) => void;
  onToggleWarmup?: (exIdx: number, setIdx: number) => void;
  onOpenRestModal: (restSeconds: number) => void;
}

export const WorkoutExerciseCard: React.FC<WorkoutExerciseCardProps> = ({
  exercise,
  actualExIndex,
  hasWorkoutStarted,
  onSetSelectedExercise,
  onSetExerciseToReplace,
  onShowHistory,
  onShowSmartCoach,
  onUpdateSet,
  onAddDropset,
  onRemoveDropset,
  onToggleWarmup,
  onOpenRestModal,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const addWarmupSets = useAppStore(state => state.addWarmupSets);
  const setExerciseReminder = useAppStore(state => state.setExerciseReminder);
  const userProfile = useAppStore(state => state.userProfile || (state as any).user);
  const workoutLog = useAppStore(state => state.workoutLog) || [];
  const activeWorkout = useAppStore(state => state.activeWorkout);
  const allExercises = useAppStore(state => state.allExercises) || [];

  const isInAsesoria = Boolean(
    userProfile?.trainer_id ||
    userProfile?.trainer ||
    (userProfile?.role === 'trainee' && userProfile?.trainer_id)
  );

  const { trend, followUp } = useMemo(() => {
    if (!exercise?.name || !workoutLog) return { trend: null, followUp: null };
    const currentRoutineId = activeWorkout?.routine_id || activeWorkout?.routineId || activeWorkout?.id || null;
    const currentRoutineName = activeWorkout?.routine_name || activeWorkout?.routineName || activeWorkout?.name || null;
    const allSessions = getExerciseHistorySessions(exercise.name, workoutLog, currentRoutineId, currentRoutineName) as any;
    const rCtx = allSessions?.routineContext;
    const targetSessions = (currentRoutineId || currentRoutineName)
      ? (rCtx?.sameRoutineSessions || [])
      : allSessions;
    const diagnosedTrend = diagnoseExerciseTrend(targetSessions, currentRoutineId) as any;
    const lastApplied = getAppliedCoachStrategy(exercise.name, currentRoutineId, currentRoutineName) as any;
    const evaluatedFollowUp = evaluateExerciseFollowUpAndRecovery({
      exerciseName: exercise.name,
      sessions: targetSessions,
      allSessions,
      routineContext: rCtx,
      currentTrend: diagnosedTrend,
      lastApplied,
      userProfile,
    } as any) as any;
    // Detección en tiempo real de fatiga acumulada en la sesión activa por ejercicios del mismo músculo
    const fatigue = detectIntraSessionMuscleFatigue(exercise, activeWorkout, allExercises, userProfile) as any;

    let effectiveFollowUp: any = evaluatedFollowUp;
    if (fatigue?.hasFatigue && evaluatedFollowUp?.type !== 'ok_green') {
      const equip = getEquipmentDetails(fatigue.currentEquipment);
      const adj = calculateIntraSessionFatigueAdjustment({
        baseWeight: fatigue.currentEquipment === 'bodyweight' ? 0 : (parseFloat(exercise.weight) || 0),
        targetReps: parseInt(String(exercise.reps || '10').split('-')[0], 10) || 10,
        equipmentType: fatigue.currentEquipment,
        goalKey: fatigue.goalKey,
        severity: fatigue.severity,
        fatigueInfo: fatigue,
      } as any);

      effectiveFollowUp = {
        type: 'intra_session_fatigue',
        badge: `⚡ Fatiga (${fatigue.sharedMuscleName})`,
        badgeShort: '⚡ Ajustado',
        title: `Ajuste en tiempo real (${fatigue.sharedMuscleName})`,
        message: `En ${fatigue.fatiguedExerciseName} levantaste por debajo de lo previsto (${fatigue.performanceSummary}). Carga recalculada a ${adj.adjustedWeight > 0 ? `${adj.adjustedWeight} kg` : `${adj.adjustedReps} reps`} para tu objetivo de ${fatigue.goalLabel} y material (${equip.label}).`,
        actionHint: 'Toca para ver el desglose y aplicar la carga adaptada.',
        color: 'amber',
        intraSessionFatigue: { ...fatigue, ...adj, equipmentDetails: equip },
      };
    }

    return { trend: diagnosedTrend, followUp: effectiveFollowUp };
  }, [
    exercise?.name,
    exercise?.weight,
    exercise?.reps,
    workoutLog,
    userProfile,
    activeWorkout,
    allExercises,
  ]);

  const [showWarmupModal, setShowWarmupModal] = useState(false);
  const [workingWeightInput, setWorkingWeightInput] = useState('');

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderInput, setReminderInput] = useState(exercise.reminder || '');

  // Helper para imágenes en ExerciseMediaPreview
  const getImageUrl = (it: any) => {
    const raw =
      it?.image_url ||
      it?.image ||
      it?.exercise_details?.image_url ||
      it?.exercise_details?.image_url_start ||
      '';
    if (!raw) return '';
    if (raw.startsWith('http')) return raw;
    return `${BACKEND_BASE_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
  };

  // 1RM Estimado del historial
  const estimated1RM = useMemo(() => {
    let best = parseFloat(exercise.last_performance?.estimated_1rm || 0);
    if (!best || best === 0) {
      const sets = exercise.last_performance?.sets || [];
      sets.forEach((s: any) => {
        const w = parseFloat(s.weight_kg || s.weight || 0);
        const r = parseInt(s.reps || 0, 10);
        const rir = parseFloat(s.rir || 0) || 0;
        const cur = calculate1RM(w, r + rir);
        if (cur > best) best = cur;
      });
    }
    return best > 0 ? Math.round(best * 10) / 10 : null;
  }, [exercise]);

  // Calentar: generar series
  const handleApplyWarmup = () => {
    const w = parseFloat(workingWeightInput);
    if (!isNaN(w) && w > 0 && addWarmupSets) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      addWarmupSets(actualExIndex, workingWeightInput);
      setShowWarmupModal(false);
      setWorkingWeightInput('');
    }
  };

  // Meta: guardar recordatorio
  const handleApplyReminder = () => {
    if (setExerciseReminder) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      setExerciseReminder(actualExIndex, reminderInput.trim());
    }
    setShowReminderModal(false);
  };

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        },
      ]}
    >
      <ContentCardBackdrop
        colorScheme={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.cardInner}>
        {/* 1. Imagen / Vídeo grande centrado arriba con acceso directo */}
        <View
          style={[
            styles.mediaHeroContainer,
            {
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <ExerciseMediaPreview
            item={{
              ...exercise,
              ...(exercise.exercise_details || {}),
            }}
            getImageUrl={getImageUrl}
            fitMode="contain"
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              onSetSelectedExercise && onSetSelectedExercise(exercise);
            }}
          />

          {/* Badge Liquid Glass flotante en la esquina superior para ver técnica y vídeo */}
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              onSetSelectedExercise && onSetSelectedExercise(exercise);
            }}
            style={styles.floatingMediaDetailBadge}
          >
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <Info size={12} color="#ffffff" strokeWidth={2.5} style={{ marginRight: 5 }} />
            <Text style={styles.floatingMediaDetailText}>Técnica y Vídeo</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Recordatorio Activo / Meta si existe (idéntico al Frontend) */}
        {exercise.reminder ? (
          <View
            style={[
              styles.reminderBanner,
              {
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                borderColor: 'rgba(245, 158, 11, 0.3)',
              },
            ]}
          >
            <View style={styles.reminderIconBadge}>
              <Bell size={18} color="#d97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderBadgeTitle}>RECORDATORIO / META</Text>
              <Text style={[styles.reminderBadgeText, { color: colors.text }]}>
                {exercise.reminder}
              </Text>
            </View>
          </View>
        ) : null}

        {/* 3. Textos Principales: Título con botón directo a Técnica */}
        <View style={styles.textsBlock}>
          <TouchableOpacity
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              onSetSelectedExercise && onSetSelectedExercise(exercise);
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.titleRowTouchable}
          >
            <Text style={[styles.exerciseTitle, { color: colors.text, flex: 1, paddingRight: 8 }]} numberOfLines={2}>
              {exercise.name}
            </Text>
            <View
              style={[
                styles.headerDetailPill,
                {
                  backgroundColor: colors.tint + '18',
                  borderColor: colors.tint + '38',
                },
              ]}
            >
              <Info size={12} color={colors.tint} strokeWidth={2.5} style={{ marginRight: 4 }} />
              <Text style={[styles.headerDetailPillText, { color: colors.tint }]}>Técnica</Text>
              <ChevronRight size={12} color={colors.tint} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          <View style={styles.metaRow}>
            <Text style={[styles.setsRepsText, { color: colors.tint }]}>
              {exercise.sets} series × {exercise.reps} reps
            </Text>

            <View style={styles.badgesInline}>
              {estimated1RM ? (
                <View
                  style={[
                    styles.oneRmPill,
                    {
                      backgroundColor: colors.tint + '18',
                      borderColor: colors.tint + '35',
                    },
                  ]}
                >
                  <Target size={14} color={colors.tint} strokeWidth={2.5} style={{ marginRight: 5 }} />
                  <Text style={[styles.oneRmPillText, { color: colors.tint }]}>
                    1RM Est: {estimated1RM}kg
                  </Text>
                </View>
              ) : null}

              {!isInAsesoria && onShowSmartCoach ? (
                <TouchableOpacity
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    onShowSmartCoach(exercise);
                  }}
                  style={[
                    styles.coachPill,
                    trend?.isWarning
                      ? {
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          borderColor: 'rgba(245, 158, 11, 0.4)',
                        }
                      : trend?.isProgressing
                      ? {
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          borderColor: 'rgba(16, 185, 129, 0.4)',
                        }
                      : {
                          backgroundColor: colors.tint + '14',
                          borderColor: colors.tint + '30',
                        },
                  ]}
                  activeOpacity={0.75}
                >
                  {trend?.isWarning ? (
                    <AlertTriangle size={14} color="#f59e0b" strokeWidth={2.5} style={{ marginRight: 5 }} />
                  ) : trend?.isProgressing ? (
                    <CheckCircle2 size={14} color="#10b981" strokeWidth={2.5} style={{ marginRight: 5 }} />
                  ) : (
                    <Target size={14} color={colors.tint} strokeWidth={2.5} style={{ marginRight: 5 }} />
                  )}
                  <Text
                    style={[
                      styles.coachPillText,
                      {
                        color: trend?.isWarning
                          ? '#f59e0b'
                          : trend?.isProgressing
                          ? '#10b981'
                          : colors.tint,
                      },
                    ]}
                  >
                    {trend?.isWarning
                      ? (trend.status === 'stagnant' ? 'Mismo peso !' : 'Aviso fatiga !')
                      : trend?.isProgressing
                      ? '¡En racha!'
                      : 'Info Objetivo'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* --- AVISO INTELIGENTE DE SEGUIMIENTO Y RECUPERACIÓN (LIQUID GLASS) --- */}
        {!isInAsesoria && onShowSmartCoach && followUp ? (
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              onShowSmartCoach(exercise);
            }}
            style={[
              styles.followUpCard,
              followUp.type === 'ok_green'
                ? {
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                  }
                : followUp.type === 'intra_session_fatigue'
                ? {
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                  }
                : followUp.type === 'inactivity_warning' || followUp.type === 'recovery_warning'
                ? {
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    borderColor: 'rgba(245, 158, 11, 0.35)',
                  }
                : followUp.type === 'recovery_notice'
                ? {
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                  }
                : {
                    backgroundColor: colors.tint + '18',
                    borderColor: colors.tint + '38',
                  },
            ]}
          >
            <View style={styles.followUpContentRow}>
              <View
                style={[
                  styles.followUpIconWrap,
                  followUp.type === 'ok_green'
                    ? { backgroundColor: 'rgba(16, 185, 129, 0.2)' }
                    : followUp.type === 'intra_session_fatigue' ||
                      followUp.type === 'inactivity_warning' ||
                      followUp.type === 'recovery_warning'
                    ? { backgroundColor: 'rgba(245, 158, 11, 0.22)' }
                    : followUp.type === 'recovery_notice'
                    ? { backgroundColor: 'rgba(59, 130, 246, 0.2)' }
                    : { backgroundColor: colors.tint + '22' },
                ]}
              >
                {followUp.type === 'ok_green' ? (
                  <CheckCircle2 size={18} color="#10b981" strokeWidth={2.5} />
                ) : followUp.type === 'intra_session_fatigue' ? (
                  <Zap size={18} color="#f59e0b" strokeWidth={2.5} />
                ) : followUp.type === 'inactivity_warning' ? (
                  <Calendar size={18} color="#f59e0b" strokeWidth={2.5} />
                ) : followUp.type === 'recovery_warning' ? (
                  <AlertTriangle size={18} color="#f59e0b" strokeWidth={2.5} />
                ) : followUp.type === 'recovery_notice' ? (
                  <Clock size={18} color="#3b82f6" strokeWidth={2.5} />
                ) : followUp.type === 'next_session_target' ? (
                  <TrendingUp size={18} color={colors.tint} strokeWidth={2.5} />
                ) : (
                  <Sparkles size={18} color={colors.tint} strokeWidth={2.5} />
                )}
              </View>

              <View style={styles.followUpTextCol}>
                <View style={styles.followUpBadgeRow}>
                  {followUp.badge ? (
                    <View
                      style={[
                        styles.followUpBadgePill,
                        followUp.type === 'ok_green'
                          ? { backgroundColor: 'rgba(16, 185, 129, 0.2)' }
                          : followUp.type === 'intra_session_fatigue'
                          ? {
                              backgroundColor: 'rgba(245, 158, 11, 0.25)',
                              borderColor: 'rgba(245, 158, 11, 0.4)',
                              borderWidth: 1,
                            }
                          : { backgroundColor: colors.tint + '22' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.followUpBadgeText,
                          followUp.type === 'ok_green'
                            ? { color: '#10b981' }
                            : followUp.type === 'intra_session_fatigue' ||
                              followUp.type === 'inactivity_warning' ||
                              followUp.type === 'recovery_warning'
                            ? { color: '#f59e0b' }
                            : { color: colors.tint },
                        ]}
                      >
                        {followUp.badge}
                      </Text>
                    </View>
                  ) : null}

                  {followUp.timeAgoText ? (
                    <Text style={[styles.followUpTimeAgo, { color: colors.textSecondary }]}>
                      {followUp.timeAgoText}
                    </Text>
                  ) : null}
                </View>

                {followUp.title ? (
                  <Text style={[styles.followUpTitle, { color: colors.text }]} numberOfLines={1}>
                    {followUp.title}
                  </Text>
                ) : null}

                {followUp.message ? (
                  <Text
                    style={[styles.followUpMessage, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {followUp.message}
                  </Text>
                ) : null}
              </View>

              <View style={styles.followUpChevronWrap}>
                <View
                  style={[
                    styles.chevronBubble,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.05)',
                    },
                  ]}
                >
                  <ChevronRight size={16} color={colors.textSecondary} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* 4. Divisor fino */}
        <View
          style={[
            styles.divider,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        />

        {/* 5. Botonera Segmentada de 5 Opciones (idéntica al Frontend) */}
        <View
          style={[
            styles.segmentedToolbar,
            {
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          {/* Historial */}
          <TouchableOpacity
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              if (onShowHistory) onShowHistory(exercise);
            }}
            style={styles.toolBtn}
            activeOpacity={0.7}
          >
            <History size={17} color={colors.textSecondary} />
            <Text style={[styles.toolBtnText, { color: colors.textSecondary }]}>Historial</Text>
          </TouchableOpacity>

          {/* Objetivo */}
          {!isInAsesoria && onShowSmartCoach ? (
            <TouchableOpacity
              onPress={() => {
                try {
                  Haptics.selectionAsync();
                } catch {}
                onShowSmartCoach(exercise);
              }}
              style={styles.toolBtn}
              activeOpacity={0.7}
            >
              {trend?.isWarning ? (
                <AlertTriangle size={17} color="#f59e0b" strokeWidth={2.5} />
              ) : trend?.isProgressing ? (
                <CheckCircle2 size={17} color="#10b981" strokeWidth={2.5} />
              ) : (
                <Target size={17} color={colors.tint} />
              )}
              <Text
                style={[
                  styles.toolBtnText,
                  {
                    color: trend?.isWarning
                      ? '#f59e0b'
                      : trend?.isProgressing
                      ? '#10b981'
                      : colors.tint,
                  },
                ]}
              >
                {trend?.isWarning ? 'Objetivo !' : trend?.isProgressing ? 'Objetivo ✓' : 'Objetivo'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Meta */}
          <TouchableOpacity
            disabled={!hasWorkoutStarted}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setShowReminderModal(true);
            }}
            style={[styles.toolBtn, !hasWorkoutStarted && { opacity: 0.4 }]}
            activeOpacity={0.7}
          >
            <Target size={17} color={exercise.reminder ? '#f59e0b' : colors.textSecondary} />
            <Text
              style={[
                styles.toolBtnText,
                { color: exercise.reminder ? '#f59e0b' : colors.textSecondary },
              ]}
            >
              Meta
            </Text>
          </TouchableOpacity>

          {/* Calentar */}
          <TouchableOpacity
            disabled={!hasWorkoutStarted}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setShowWarmupModal(true);
            }}
            style={[styles.toolBtn, !hasWorkoutStarted && { opacity: 0.4 }]}
            activeOpacity={0.7}
          >
            <Flame size={17} color="#f97316" />
            <Text style={[styles.toolBtnText, { color: '#f97316' }]}>Calentar</Text>
          </TouchableOpacity>

          {/* Sustituir */}
          <TouchableOpacity
            disabled={!hasWorkoutStarted}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              onSetExerciseToReplace(actualExIndex);
            }}
            style={[styles.toolBtn, !hasWorkoutStarted && { opacity: 0.4 }]}
            activeOpacity={0.7}
          >
            <Repeat size={17} color={colors.textSecondary} />
            <Text style={[styles.toolBtnText, { color: colors.textSecondary }]}>Sustituir</Text>
          </TouchableOpacity>
        </View>

        {/* 6. Tabla de Series Grid */}
        <WorkoutSetGrid
          setsDone={exercise.setsDone}
          restSeconds={exercise.rest_seconds || 90}
          actualExIndex={actualExIndex}
          hasWorkoutStarted={hasWorkoutStarted}
          onUpdateSet={onUpdateSet}
          onAddDropset={onAddDropset}
          onRemoveDropset={onRemoveDropset}
          onToggleWarmup={onToggleWarmup}
          onOpenRestModal={onOpenRestModal}
        />
      </View>

      {/* Modal: Calentar (Warm-up Sets) */}
      <Modal visible={showWarmupModal} transparent animationType="fade">
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.4)' }]}
          onPress={() => setShowWarmupModal(false)}
        >
          <Pressable
            onPress={e => e.stopPropagation()}
            style={[
              styles.dialogCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Series de Calentamiento</Text>
            <Text style={[styles.dialogDesc, { color: colors.textSecondary }]}>
              Introduce el peso de tus series efectivas para generar automáticamente 3 series de aproximación progresiva (50%, 70%, 90%).
            </Text>

            <TextInput
              keyboardType="decimal-pad"
              placeholder="Ej: 80 (kg)"
              placeholderTextColor={colors.textSecondary}
              value={workingWeightInput}
              onChangeText={setWorkingWeightInput}
              autoFocus
              style={[
                styles.dialogInput,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
                  color: colors.text,
                },
              ]}
            />

            <View style={styles.dialogActions}>
              <TouchableOpacity
                onPress={() => setShowWarmupModal(false)}
                style={[styles.dialogBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleApplyWarmup}
                style={[styles.dialogBtn, { backgroundColor: colors.tint }]}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>Generar Series</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal: Meta / Recordatorio */}
      <Modal visible={showReminderModal} transparent animationType="fade">
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.4)' }]}
          onPress={() => setShowReminderModal(false)}
        >
          <Pressable
            onPress={e => e.stopPropagation()}
            style={[
              styles.dialogCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Meta / Recordatorio</Text>
            <Text style={[styles.dialogDesc, { color: colors.textSecondary }]}>
              Añade un objetivo para este ejercicio (ej: "Subir a 24kg en la 3ª serie" o "Foco en técnica lenta").
            </Text>

            <TextInput
              placeholder="Escribe tu meta aquí..."
              placeholderTextColor={colors.textSecondary}
              value={reminderInput}
              onChangeText={setReminderInput}
              multiline
              autoFocus
              style={[
                styles.dialogInputMultiline,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
                  color: colors.text,
                },
              ]}
            />

            <View style={styles.dialogActions}>
              <TouchableOpacity
                onPress={() => setShowReminderModal(false)}
                style={[styles.dialogBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleApplyReminder}
                style={[styles.dialogBtn, { backgroundColor: colors.tint }]}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 32,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  cardInner: {
    padding: 18,
    zIndex: 2,
  },
  mediaHeroContainer: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  floatingMediaDetailBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingMediaDetailText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  titleRowTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  headerDetailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  headerDetailPillText: {
    fontSize: 11,
    fontWeight: '800',
    marginRight: 2,
  },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  reminderIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderBadgeTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#d97706',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  reminderBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  textsBlock: {
    marginBottom: 12,
  },
  exerciseTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 32,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'column',
    gap: 8,
  },
  setsRepsText: {
    fontSize: 16,
    fontWeight: '800',
  },
  badgesInline: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  oneRmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  oneRmPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  coachPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  coachPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  segmentedToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 5,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  toolBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 3,
    borderRadius: 16,
  },
  toolBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 1,
    padding: 22,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  dialogInput: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
  },
  dialogInputMultiline: {
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontWeight: '500',
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
  },
  dialogBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followUpCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  followUpContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  followUpIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  followUpTextCol: {
    flex: 1,
    gap: 3,
  },
  followUpBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  followUpBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  followUpBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  followUpTimeAgo: {
    fontSize: 10,
    fontWeight: '700',
  },
  followUpTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  followUpMessage: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  followUpChevronWrap: {
    alignSelf: 'center',
    paddingLeft: 4,
  },
  chevronBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
