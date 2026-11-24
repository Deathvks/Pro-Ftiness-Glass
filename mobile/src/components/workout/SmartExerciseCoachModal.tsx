/* mobile/src/components/workout/SmartExerciseCoachModal.tsx */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Dumbbell,
  Flame,
  Activity,
  Shield,
  Lightbulb,
  Check,
  Repeat,
  Clock,
  HelpCircle,
  Calendar,
  Info,
  Sparkles,
  ArrowRight,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  RefreshCw,
  CornerDownRight,
  Zap,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { LiquidCloseButton } from '@/components/ui/GlassButton';
import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';
import { getThemedModalBorderColor } from '@/components/ui/ModalThemeBackground';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { generateSmartCoachPlan } from '@/utils/smartProgressionCoach';
import { saveAppliedCoachStrategy } from '@/utils/coachAppliedHistory';
import { formatDateToShort } from '@/utils/dateUtils';
import { getContrastTextColor } from '@/utils/colorUtils';

interface SmartExerciseCoachModalProps {
  visible: boolean;
  exercise: any;
  currentRoutineId?: number | string | null;
  currentRoutineName?: string | null;
  onClose: () => void;
  onApplyWeight?: (weight: number) => void;
  onApplyStrategy?: (strategy: any) => void;
  onNavigateAsesoria?: () => void;
  readOnly?: boolean;
}

export const SmartExerciseCoachModal: React.FC<SmartExerciseCoachModalProps> = ({
  visible,
  exercise,
  currentRoutineId = null,
  currentRoutineName = null,
  onClose,
  onApplyWeight,
  onApplyStrategy,
  onNavigateAsesoria,
  readOnly = false,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const tintContrastText = getContrastTextColor(colors.tint);

  const userProfile = useAppStore(state => state.userProfile || (state as any).user);
  const workoutLog = useAppStore(state => state.workoutLog) || [];
  const allExercises = useAppStore(state => state.allExercises) || [];
  const getOrFetchAllExercises = useAppStore(state => (state as any).getOrFetchAllExercises);
  const activeWorkout = useAppStore(state => state.activeWorkout);

  const [showRirHelp, setShowRirHelp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [difficultyFeedback, setDifficultyFeedback] = useState<'normal' | 'struggling' | 'cannot_reach'>('normal');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && (!allExercises || allExercises.length === 0) && typeof getOrFetchAllExercises === 'function') {
      getOrFetchAllExercises().catch(() => {});
    }
  }, [visible, allExercises, getOrFetchAllExercises]);

  const plan = useMemo(() => {
    if (!exercise) return null;
    try {
      return generateSmartCoachPlan(exercise, userProfile, workoutLog, {
        currentRoutineId,
        currentRoutineName,
        difficultyFeedback,
        allExercises,
        activeWorkout,
        allRoutineExercises: activeWorkout?.exercises || [],
      }) as any;
    } catch (e) {
      console.warn('Error generating coach plan:', e);
      return null;
    }
  }, [
    exercise,
    userProfile,
    workoutLog,
    currentRoutineId,
    currentRoutineName,
    difficultyFeedback,
    allExercises,
    activeWorkout,
  ]);

  const activeStrategy = useMemo(() => {
    if (!plan?.strategyOptions || plan.strategyOptions.length === 0) return null;
    if (selectedStrategyId) {
      const found = plan.strategyOptions.find((s: any) => s.id === selectedStrategyId);
      if (found) return found;
    }
    if (plan.isAlreadyAppliedInSession && plan.lastAppliedStrategy) {
      const active = plan.strategyOptions.find(
        (s: any) => s.isCurrentActive || s.id === plan.lastAppliedStrategy.strategyId
      );
      if (active) return active;
    }
    return plan.strategyOptions[0];
  }, [plan, selectedStrategyId]);

  const handleDifficultyChange = (newFeedback: 'normal' | 'struggling' | 'cannot_reach') => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setDifficultyFeedback(newFeedback);
    setSelectedStrategyId(null);
  };

  if (!exercise || !plan) {
    return (
      <SwipeableBottomSheet
        scrollable
        visible={visible}
        onClose={onClose}
        isDark={isDark}
        height="88%"
        maxHeight="88%"
      >
        <View />
      </SwipeableBottomSheet>
    );
  }

  const {
    userGoal,
    trend,
    routineContext,
    repGoalAudit,
    plateNote,
    targets,
    coachingAdvice,
    sessions = [],
    strategyOptions = [],
    motivationalMessage,
    asesoriaRecommendation,
    followUp,
    currentTopWeight,
    actualPreviousReps,
    isBodyweight,
    isAlreadyAppliedInSession,
    lastAppliedStrategy,
  } = plan;

  const isBW = Boolean(isBodyweight || currentTopWeight === 0);

  const activeSuggestedWeight =
    activeStrategy?.suggestedWeight !== undefined && activeStrategy.suggestedWeight !== null
      ? activeStrategy.suggestedWeight
      : targets?.suggestedWeight;

  const activeSuggestedReps =
    activeStrategy?.suggestedReps !== undefined && activeStrategy.suggestedReps !== null
      ? activeStrategy.suggestedReps
      : targets?.suggestedReps;

  const activeSuggestedSets =
    activeStrategy?.suggestedSets !== undefined && activeStrategy.suggestedSets !== null
      ? activeStrategy.suggestedSets
      : targets?.suggestedSets;

  const renderGoalIcon = () => {
    if (userGoal?.key === 'gain') return <Dumbbell size={13} color={colors.tint} strokeWidth={2.5} />;
    if (userGoal?.key === 'lose') return <Flame size={13} color="#10b981" strokeWidth={2.5} />;
    if (userGoal?.key === 'recomp') return <Activity size={13} color="#a855f7" strokeWidth={2.5} />;
    return <Shield size={13} color="#3b82f6" strokeWidth={2.5} />;
  };

  const handleApplySelection = () => {
    if (readOnly) {
      onClose();
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const payload = {
      ...(activeStrategy || {}),
      suggestedWeight: activeSuggestedWeight,
      suggestedReps: activeSuggestedReps,
      suggestedSets: activeSuggestedSets,
      perSetPlan: activeStrategy?.perSetPlan || null,
      exerciseName: exercise.name,
      routineId: currentRoutineId,
      routineName: currentRoutineName,
      goal: userGoal?.key,
      trendStatus: trend?.status,
      baselineWeight: sessions?.[0]?.topWeight ?? currentTopWeight,
      baselineReps: sessions?.[0]?.topReps ?? null,
      baseline1RM: sessions?.[0]?.best1RM ?? null,
    };

    try {
      saveAppliedCoachStrategy(exercise.name, payload);
    } catch {}

    if (onApplyStrategy) {
      onApplyStrategy(payload);
    } else if (onApplyWeight && activeSuggestedWeight !== null && activeSuggestedWeight !== undefined) {
      onApplyWeight(activeSuggestedWeight);
    }

    onClose();
  };

  const subtleCardBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  const subtleCardBorder = isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.07)';
  const headerBorder = getThemedModalBorderColor(theme);

  const followBg =
    followUp?.type === 'ok_green'
      ? 'rgba(16, 185, 129, 0.12)'
      : followUp?.type === 'inactivity_warning' || followUp?.type === 'recovery_warning'
      ? 'rgba(245, 158, 11, 0.14)'
      : followUp?.type === 'recovery_notice'
      ? 'rgba(59, 130, 246, 0.12)'
      : followUp?.type === 'next_session_target'
      ? colors.tint + '18'
      : 'rgba(245, 158, 11, 0.12)';

  const followAccent =
    followUp?.type === 'ok_green'
      ? '#10b981'
      : followUp?.type === 'recovery_notice'
      ? '#3b82f6'
      : followUp?.type === 'next_session_target'
      ? colors.tint
      : '#f59e0b';

  const statusBadgeText = followUp?.isInactive
    ? followUp.badge
    : followUp?.isOkGreen
    ? followUp.badge
    : followUp?.isTooSoon
    ? followUp.badge
    : followUp?.type === 'next_session_target'
    ? followUp.badge
    : trend?.isWarning
    ? trend.badgeText
    : trend?.isProgressing
    ? `¡En racha! ${trend.badgeText}`
    : trend?.badgeText;

  const statusBadgeBg = followUp?.isOkGreen || trend?.isProgressing
    ? 'rgba(16, 185, 129, 0.16)'
    : followUp?.type === 'recovery_notice'
    ? 'rgba(59, 130, 246, 0.16)'
    : followUp?.isInactive || followUp?.isTooSoon || trend?.isWarning
    ? 'rgba(245, 158, 11, 0.18)'
    : colors.tint + '22';

  const statusBadgeColor = followUp?.isOkGreen || trend?.isProgressing
    ? '#10b981'
    : followUp?.type === 'recovery_notice'
    ? '#3b82f6'
    : followUp?.isInactive || followUp?.isTooSoon || trend?.isWarning
    ? '#f59e0b'
    : colors.tint;

  const performanceTitle = isAlreadyAppliedInSession
    ? `Estrategia activa para hoy: ${lastAppliedStrategy?.strategyTitle || 'Plan en curso'}`
    : followUp?.isInactive
    ? isBW
      ? `Reactivación tras pausa: Base en peso corporal (${actualPreviousReps || targets?.suggestedReps} reps)`
      : `Reactivación tras pausa: Carga previa de ${currentTopWeight} kg (${actualPreviousReps || targets?.suggestedReps} reps)`
    : trend?.status === 'stagnant'
    ? isBW
      ? `Meseta en repeticiones: Llevas ${trend.stagnantSessionsCount || 2} sesiones con ${actualPreviousReps || targets?.suggestedReps} reps en peso corporal`
      : `Estancamiento detectado: Llevas ${trend.weeksStagnant || 2} semanas levantando ${currentTopWeight} kg`
    : trend?.status === 'decreasing'
    ? `Aviso: Fatiga residual detectada (${trend.badgeText})`
    : trend?.isProgressing
    ? `¡Gran progresión! Has aumentado tu fuerza (${trend.badgeText})`
    : trend?.status === 'first_time'
    ? `Sin historial en ${routineContext?.currentRoutineName || 'esta rutina'}: Pendiente de recoger datos`
    : `1 sesión previa: Estableciendo base para ${userGoal?.label || 'tu objetivo'}`;

  const isCurrentActiveSelected =
    isAlreadyAppliedInSession &&
    (activeStrategy?.isCurrentActive ||
      activeStrategy?.id === lastAppliedStrategy?.strategyId ||
      !selectedStrategyId);

  return (
    <SwipeableBottomSheet
      scrollable
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.card}
      height="90%"
      maxHeight="90%"
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: headerBorder }]}>
        <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
          <View style={styles.badgesWrap}>
            <View style={[styles.headerPill, { backgroundColor: colors.tint + '1F' }]}>
              {renderGoalIcon()}
              <Text style={[styles.headerPillText, { color: colors.tint }]}>
                {userGoal?.label || 'Objetivo Personal'}
              </Text>
            </View>

            {statusBadgeText ? (
              <View style={[styles.headerPill, { backgroundColor: statusBadgeBg }]}>
                {followUp?.isInactive ? (
                  <Calendar size={12} color={statusBadgeColor} />
                ) : followUp?.isOkGreen || trend?.isProgressing ? (
                  <CheckCircle2 size={12} color={statusBadgeColor} />
                ) : followUp?.type === 'recovery_notice' ? (
                  <Clock size={12} color={statusBadgeColor} />
                ) : followUp?.type === 'next_session_target' ? (
                  <TrendingUp size={12} color={statusBadgeColor} />
                ) : trend?.isWarning || followUp?.isTooSoon ? (
                  <AlertTriangle size={12} color={statusBadgeColor} />
                ) : null}
                <Text style={[styles.headerPillText, { color: statusBadgeColor }]}>
                  {statusBadgeText}
                </Text>
              </View>
            ) : null}

            {plan.isSuperset ? (
              <View style={[styles.headerPill, { backgroundColor: 'rgba(6, 182, 212, 0.16)' }]}>
                <Repeat size={11} color="#06b6d4" />
                <Text style={[styles.headerPillText, { color: '#06b6d4' }]}>
                  Superserie{plan.partnerExerciseName ? ` con ${plan.partnerExerciseName}` : ''}
                </Text>
              </View>
            ) : null}

            {plan.hasDropsetFatigue ? (
              <View style={[styles.headerPill, { backgroundColor: 'rgba(245, 158, 11, 0.16)' }]}>
                <CornerDownRight size={11} color="#f59e0b" />
                <Text style={[styles.headerPillText, { color: '#f59e0b' }]}>
                  Fatiga / Dropset previo
                </Text>
              </View>
            ) : null}

            {plan.intraSessionFatigue?.hasFatigue ? (
              <View style={[styles.headerPill, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <Zap size={11} color="#f59e0b" />
                <Text style={[styles.headerPillText, { color: '#f59e0b' }]}>
                  Ajuste Fatiga ({plan.intraSessionFatigue.sharedMuscleName})
                </Text>
              </View>
            ) : null}

            {readOnly ? (
              <View style={[styles.headerPill, { backgroundColor: subtleCardBg }]}>
                <Text style={[styles.headerPillText, { color: colors.textSecondary }]}>
                  Guía de Progreso
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {exercise.displayName || exercise.name}
          </Text>
        </View>

        <LiquidCloseButton
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          iconColor={colors.textSecondary}
          style={styles.closeBtn}
        />
      </View>

      {/* Body con Scroll */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. ASESORÍA CON PREPARADOR REAL */}
        {asesoriaRecommendation ? (
          <View
            style={[
              styles.cardBox,
              {
                backgroundColor: colors.tint + '16',
                borderColor: colors.tint + '30',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
              <View style={[styles.iconBoxSmall, { backgroundColor: colors.tint + '28' }]}>
                <UserCheck size={15} color={colors.tint} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.cardTitleSm, { color: colors.text }]}>
                  {asesoriaRecommendation.headline}
                </Text>
                <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>
                  {asesoriaRecommendation.description}
                </Text>
              </View>
            </View>

            {onNavigateAsesoria ? (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onNavigateAsesoria();
                }}
                activeOpacity={0.85}
                style={[styles.asesoriaBtn, { backgroundColor: colors.tint }]}
              >
                <Text style={[styles.asesoriaBtnText, { color: tintContrastText }]}>Asesoría</Text>
                <ArrowRight size={13} color={tintContrastText} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* 2. SEGUIMIENTO LONGITUDINAL / RECUPERACIÓN */}
        {followUp &&
        (followUp.isInactive ||
          followUp.isTooSoon ||
          followUp.isOkGreen ||
          followUp.type === 'next_session_target') ? (
          <View
            style={[
              styles.cardBox,
              {
                backgroundColor: followBg,
                borderColor: followAccent + '40',
                gap: 8,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={[styles.iconBoxSmall, { backgroundColor: followAccent + '28' }]}>
                  {followUp.type === 'ok_green' ? (
                    <CheckCircle2 size={15} color={followAccent} strokeWidth={2.5} />
                  ) : followUp.type === 'inactivity_warning' ? (
                    <Calendar size={15} color={followAccent} strokeWidth={2.5} />
                  ) : followUp.type === 'recovery_notice' ? (
                    <Clock size={15} color={followAccent} strokeWidth={2.5} />
                  ) : followUp.type === 'next_session_target' ? (
                    <TrendingUp size={15} color={followAccent} strokeWidth={2.5} />
                  ) : (
                    <AlertTriangle size={15} color={followAccent} strokeWidth={2.5} />
                  )}
                </View>
                <Text style={[styles.microHeader, { color: followAccent }]}>
                  {followUp.badge}
                </Text>
              </View>
              {followUp.timeAgoText ? (
                <Text style={[styles.timeAgoText, { color: colors.textSecondary }]}>
                  {followUp.timeAgoText}
                </Text>
              ) : null}
            </View>

            <Text style={[styles.cardTitleSm, { color: colors.text }]}>{followUp.title}</Text>
            <Text style={[styles.cardDescSm, { color: colors.textSecondary }]}>{followUp.message}</Text>

            {followUp.actionHint ? (
              <View style={[styles.dividerTop, { borderTopColor: subtleCardBorder }]}>
                <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>
                  <Text style={{ fontWeight: '800', color: colors.text }}>Consejo: </Text>
                  {followUp.actionHint}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* 3. AJUSTE EN TIEMPO REAL POR FATIGA INTRA-SESIÓN */}
        {plan.intraSessionFatigue?.hasFatigue ? (
          <View
            style={[
              styles.cardBox,
              {
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                borderColor: 'rgba(245, 158, 11, 0.42)',
                gap: 10,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={[styles.iconBoxSmall, { backgroundColor: 'rgba(245, 158, 11, 0.25)' }]}>
                  <Zap size={15} color="#f59e0b" strokeWidth={2.5} />
                </View>
                <Text style={[styles.microHeader, { color: '#f59e0b', flex: 1 }]}>
                  Ajuste en Tiempo Real · Fatiga en {plan.intraSessionFatigue.sharedMuscleName}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(245, 158, 11, 0.22)' }}>
                <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#f59e0b' }}>SESIÓN ACTIVA</Text>
              </View>
            </View>

            <Text style={[styles.cardTitleSm, { color: colors.text }]}>
              Ajustado por fatiga previa en {plan.intraSessionFatigue.fatiguedExerciseName}
            </Text>
            <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>
              En tu ejercicio anterior ({plan.intraSessionFatigue.fatiguedExerciseName}), que también trabaja{' '}
              {plan.intraSessionFatigue.sharedMuscleName}, {plan.intraSessionFatigue.performanceSummary}. Arrastras
              fatiga neuromuscular acumulada en esta misma rutina.
            </Text>

            <View style={[styles.subInfoBox, { backgroundColor: subtleCardBg, borderColor: subtleCardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Target size={12} color={colors.tint} />
                <Text style={[styles.microHeader, { color: colors.tint }]}>
                  Por qué se modifica ({plan.intraSessionFatigue.goalLabel})
                </Text>
              </View>
              <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>
                {plan.intraSessionFatigue.goalExplanation}
              </Text>
            </View>

            <View style={[styles.subInfoBox, { backgroundColor: subtleCardBg, borderColor: subtleCardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Dumbbell size={12} color="#a855f7" />
                <Text style={[styles.microHeader, { color: '#a855f7' }]}>
                  Material ({plan.intraSessionFatigue.equipmentDetails?.label || 'Equipamiento'})
                </Text>
              </View>
              <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>
                {plan.intraSessionFatigue.equipmentExplanation}
              </Text>
            </View>

            <View
              style={[
                styles.dividerTop,
                { borderTopColor: 'rgba(245, 158, 11, 0.28)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
              ]}
            >
              <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>Carga recalculada:</Text>
              <Text style={{ fontSize: 12.5, fontWeight: '900', color: '#f59e0b' }}>
                {plan.intraSessionFatigue.adjustedSuggestedWeight > 0
                  ? `${plan.intraSessionFatigue.adjustedSuggestedWeight} kg (${plan.intraSessionFatigue.adjustedSuggestedReps} reps)`
                  : `${plan.intraSessionFatigue.adjustedSuggestedReps} reps (corporal)`}
              </Text>
            </View>
          </View>
        ) : null}

        {/* 4. FATIGA POR DROPSET ANTERIOR */}
        {plan.hasDropsetFatigue ? (
          <View
            style={[
              styles.cardBox,
              {
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderColor: 'rgba(245, 158, 11, 0.3)',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
              },
            ]}
          >
            <View style={[styles.iconBoxSmall, { backgroundColor: 'rgba(245, 158, 11, 0.22)' }]}>
              <CornerDownRight size={15} color="#f59e0b" strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.microHeader, { color: '#f59e0b', marginBottom: 3 }]}>
                Dropset en Sesión Anterior · Fatiga Detectada
              </Text>
              <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>
                Utilizaste dropset en tu última sesión. Conviene consolidar las series efectivas completas con este peso antes de subir kilos.
              </Text>
            </View>
          </View>
        ) : null}

        {/* 5. SUPERSERIE */}
        {plan.isSuperset ? (
          <View
            style={[
              styles.cardBox,
              {
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                borderColor: 'rgba(6, 182, 212, 0.3)',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
              },
            ]}
          >
            <View style={[styles.iconBoxSmall, { backgroundColor: 'rgba(6, 182, 212, 0.22)' }]}>
              <Repeat size={15} color="#06b6d4" strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.microHeader, { color: '#06b6d4', marginBottom: 3 }]}>
                Ejercicio en Superserie{plan.partnerExerciseName ? ` con ${plan.partnerExerciseName}` : ''}
              </Text>
              <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>
                Realiza la transición directa (0-20s) y reserva el descanso completo (90-120s) al terminar la ronda de ambos ejercicios.
              </Text>
            </View>
          </View>
        ) : null}

        {/* 6. ¿QUÉ HEMOS DETECTADO EN TU RENDIMIENTO? */}
        <View
          style={[
            styles.cardBox,
            {
              backgroundColor: trend?.isWarning
                ? 'rgba(245, 158, 11, 0.1)'
                : trend?.isProgressing
                ? 'rgba(16, 185, 129, 0.1)'
                : subtleCardBg,
              borderColor: subtleCardBorder,
              gap: 8,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <View
              style={[
                styles.iconBoxSmall,
                {
                  backgroundColor: isAlreadyAppliedInSession || trend?.isProgressing
                    ? 'rgba(16, 185, 129, 0.2)'
                    : followUp?.isInactive
                    ? 'rgba(59, 130, 246, 0.2)'
                    : trend?.isWarning
                    ? 'rgba(245, 158, 11, 0.2)'
                    : colors.tint + '24',
                },
              ]}
            >
              {isAlreadyAppliedInSession ? (
                <CheckCircle2 size={15} color="#10b981" strokeWidth={2.5} />
              ) : followUp?.isInactive ? (
                <Clock size={15} color="#3b82f6" strokeWidth={2.5} />
              ) : trend?.isWarning ? (
                <AlertTriangle size={15} color="#f59e0b" strokeWidth={2.5} />
              ) : trend?.isProgressing ? (
                <Sparkles size={15} color="#10b981" />
              ) : (
                <Info size={15} color={colors.tint} />
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.microMuted, { color: colors.textSecondary }]}>
                ¿Qué hemos detectado en tu rendimiento?
              </Text>
              <Text style={[styles.cardTitleSm, { color: colors.text }]}>{performanceTitle}</Text>
            </View>
          </View>

          <Text style={[styles.cardDescSm, { color: colors.textSecondary }]}>{coachingAdvice}</Text>

          {motivationalMessage ? (
            <View style={[styles.subInfoBox, { backgroundColor: subtleCardBg, borderColor: subtleCardBorder, flexDirection: 'row', gap: 8 }]}>
              <Lightbulb size={15} color="#f59e0b" style={{ marginTop: 1 }} />
              <Text style={[styles.cardDescXs, { color: colors.textSecondary, flex: 1 }]}>
                {motivationalMessage}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 7. AISLAMIENTO POR RUTINA */}
        {routineContext?.hasMultipleRoutines ? (
          <View
            style={[
              styles.cardBox,
              {
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgba(59, 130, 246, 0.28)',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
              },
            ]}
          >
            <View style={[styles.iconBoxSmall, { backgroundColor: 'rgba(59, 130, 246, 0.22)' }]}>
              <Layers size={15} color="#3b82f6" strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.microHeader, { color: '#3b82f6', marginBottom: 2 }]}>
                Ejercicio en múltiples rutinas
              </Text>
              <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>
                Aislamos y priorizamos tu historial en {routineContext.currentRoutineName} para no distorsionar tu progresión.
              </Text>
            </View>
          </View>
        ) : null}

        {/* 8. AUDITORÍA DE REPETICIONES */}
        {repGoalAudit?.isSuboptimal ? (
          <View
            style={[
              styles.cardBox,
              {
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderColor: 'rgba(245, 158, 11, 0.3)',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
              },
            ]}
          >
            <View style={[styles.iconBoxSmall, { backgroundColor: 'rgba(245, 158, 11, 0.22)' }]}>
              <AlertTriangle size={15} color="#f59e0b" strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.microHeader, { color: '#f59e0b', marginBottom: 2 }]}>
                Ajuste de Repeticiones ({repGoalAudit.tag})
              </Text>
              <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>
                {repGoalAudit.message}
              </Text>
            </View>
          </View>
        ) : null}

        {/* 9. SELECTOR INTERACTIVO DE SENSACIONES / DIFICULTAD */}
        <View style={[styles.cardBox, { backgroundColor: subtleCardBg, borderColor: subtleCardBorder, gap: 10 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.microMuted, { color: colors.textSecondary, flex: 1 }]}>
              ¿Cómo sientes este peso y repeticiones?
            </Text>
            {actualPreviousReps > 0 ? (
              <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>
                Última vez: <Text style={{ fontWeight: '800', color: colors.text }}>{actualPreviousReps} reps</Text>
              </Text>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { id: 'normal' as const, label: 'Llego bien', sub: 'Con energía', color: '#10b981' },
              { id: 'struggling' as const, label: 'Me cuesta', sub: 'Al límite', color: '#f59e0b' },
              { id: 'cannot_reach' as const, label: 'No llego', sub: 'Carga alta', color: '#f43f5e' },
            ].map(opt => {
              const selected = difficultyFeedback === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => handleDifficultyChange(opt.id)}
                  activeOpacity={0.8}
                  style={[
                    styles.feedbackBtn,
                    {
                      backgroundColor: selected ? opt.color + '24' : subtleCardBg,
                      borderColor: selected ? opt.color : subtleCardBorder,
                      borderWidth: selected ? 1.5 : 1,
                    },
                  ]}
                >
                  <View style={[styles.feedbackDot, { backgroundColor: opt.color }]} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: selected ? '800' : '700',
                      color: selected ? opt.color : colors.text,
                    }}
                    numberOfLines={1}
                  >
                    {opt.label}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.textSecondary }} numberOfLines={1}>
                    {opt.sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {difficultyFeedback === 'struggling' ? (
            <Text style={[styles.cardDescXs, { color: '#f59e0b', fontWeight: '600' }]}>
              Reajustado: Consolidamos tu peso actual o proponemos pausas con repeticiones reducidas para no fallar a mitad de serie.
            </Text>
          ) : null}
          {difficultyFeedback === 'cannot_reach' ? (
            <Text style={[styles.cardDescXs, { color: '#f43f5e', fontWeight: '600' }]}>
              Reajustado: Aplicamos una descarga táctica del 10% para completar el rango con técnica limpia y margen.
            </Text>
          ) : null}
        </View>

        {/* 10. OBJETIVO CALCULADO PARA HOY (2x2 GRID) */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 }}>
            <Text style={[styles.microMuted, { color: colors.textSecondary }]}>Tu objetivo para hoy:</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.tint }}>
              {activeStrategy?.badge || targets?.weightChangeNote || 'Ajuste adaptado'}
            </Text>
          </View>

          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, { backgroundColor: colors.tint + '1A', borderColor: colors.tint + '35' }]}>
              <View style={styles.kpiTop}>
                <Text style={[styles.kpiLabel, { color: colors.tint }]}>
                  {isBW && activeSuggestedWeight === 0 ? 'CARGA' : 'PESO'}
                </Text>
                <Dumbbell size={13} color={colors.tint} />
              </View>
              <Text style={[styles.kpiValue, { color: colors.tint }]} numberOfLines={1} adjustsFontSizeToFit>
                {activeStrategy?.perSetPlan
                  ? `${activeStrategy.perSetPlan[0].weight > 0 ? `${activeStrategy.perSetPlan[0].weight}kg` : 'Corporal'} / ${
                      activeStrategy.perSetPlan[1]?.weight > 0 ? `${activeStrategy.perSetPlan[1].weight}kg` : 'Corporal'
                    }`
                  : activeSuggestedWeight === 0
                  ? 'Corporal'
                  : activeSuggestedWeight !== null && activeSuggestedWeight !== undefined
                  ? `${activeSuggestedWeight} kg`
                  : 'Calibrar'}
              </Text>
              <Text style={[styles.kpiSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {activeStrategy?.perSetPlan
                  ? '1ª Top · Resto Back-off'
                  : targets?.weightChangeNote || (isBW ? 'Peso corporal' : 'Carga sugerida')}
              </Text>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: subtleCardBg, borderColor: subtleCardBorder }]}>
              <View style={styles.kpiTop}>
                <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>SERIES</Text>
                <Repeat size={13} color={colors.textSecondary} />
              </View>
              <Text style={[styles.kpiValue, { color: colors.text }]}>{activeSuggestedSets}</Text>
              <Text style={[styles.kpiSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {activeStrategy?.perSetPlan ? `1 Top + ${Math.max(0, activeSuggestedSets - 1)} Back-off` : 'Series efectivas'}
              </Text>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: subtleCardBg, borderColor: subtleCardBorder }]}>
              <View style={styles.kpiTop}>
                <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>REPS</Text>
                <Flame size={13} color={colors.textSecondary} />
              </View>
              <Text style={[styles.kpiValue, { color: colors.text }]}>{activeSuggestedReps}</Text>
              <Text style={[styles.kpiSub, { color: colors.textSecondary }]}>Rango óptimo</Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowRirHelp(prev => !prev)}
              activeOpacity={0.8}
              style={[styles.kpiCard, { backgroundColor: subtleCardBg, borderColor: subtleCardBorder }]}
            >
              <View style={styles.kpiTop}>
                <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>ESFUERZO</Text>
                <HelpCircle size={13} color={colors.tint} />
              </View>
              <Text style={[styles.kpiValueSm, { color: colors.text }]} numberOfLines={2}>
                {targets?.intensityLabel || 'Alto'}
              </Text>
              <Text style={[styles.kpiSub, { color: colors.tint }]}>
                {showRirHelp ? 'Ocultar guía' : '¿Cómo medirlo?'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Desglose Top Set + Back-off */}
          {activeStrategy?.perSetPlan && activeStrategy.perSetPlan.length > 0 ? (
            <View
              style={[
                styles.cardBox,
                {
                  backgroundColor: colors.tint + '14',
                  borderColor: colors.tint + '35',
                  gap: 8,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Layers size={13} color={colors.tint} />
                  <Text style={[styles.microHeader, { color: colors.tint }]} numberOfLines={1}>
                    Desglose por Serie (Top Set + Back-off)
                  </Text>
                </View>
                <Text style={{ fontSize: 10, fontWeight: '800', color: colors.tint }}>
                  {activeStrategy.perSetPlan.length} Series
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {activeStrategy.perSetPlan.map((s: any) => (
                  <View
                    key={s.set_number}
                    style={[
                      styles.perSetRow,
                      {
                        backgroundColor: s.type === 'top_set' ? colors.tint + '1E' : subtleCardBg,
                        borderColor: s.type === 'top_set' ? colors.tint + '45' : subtleCardBorder,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>
                        Serie {s.set_number} ·{' '}
                        <Text style={{ fontWeight: '900', color: colors.text, fontSize: 13 }}>
                          {s.weight > 0 ? `${s.weight} kg` : 'Corporal'} × {s.reps} reps
                        </Text>
                      </Text>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                          backgroundColor: s.type === 'top_set' ? colors.tint : subtleCardBg,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9.5,
                            fontWeight: '800',
                            color: s.type === 'top_set' ? tintContrastText : colors.textSecondary,
                          }}
                        >
                          {s.badge || (s.type === 'top_set' ? 'TOP SET' : 'BACK-OFF')}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 10.5, color: colors.tint, fontWeight: '700', marginTop: 3 }}>
                      {s.rir ? (s.rir.includes('RIR') ? s.rir.replace('RIR', 'Margen:') : s.rir) : '1 rep en recámara'} ·{' '}
                      <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
                        {s.type === 'top_set' ? 'Fuerza máxima' : 'Hipertrofia'}
                      </Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
            <Clock size={12} color={colors.textSecondary} />
            <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>
              {plan.isSuperset ? 'Descanso Superserie: ' : 'Descanso recomendado: '}
              <Text style={{ fontWeight: '800', color: colors.text }}>{targets?.suggestedRest}</Text>
            </Text>
          </View>
        </View>

        {/* GUÍA DE ESFUERZO / RIR */}
        {showRirHelp ? (
          <View style={[styles.cardBox, { backgroundColor: colors.tint + '16', borderColor: colors.tint + '35', gap: 8 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <HelpCircle size={14} color={colors.tint} />
                <Text style={[styles.cardTitleSm, { color: colors.text }]}>
                  Cómo regular tu esfuerzo sin tecnicismos
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowRirHelp(false)} style={{ padding: 4 }}>
                <X size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>
              Parar sintiendo que te quedan 1 o 2 repeticiones en la recámara aporta el mismo crecimiento muscular sin agotar el sistema nervioso ni aumentar el riesgo de lesión.
            </Text>
            <View style={[styles.subInfoBox, { backgroundColor: subtleCardBg, borderColor: subtleCardBorder, gap: 6 }]}>
              <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>
                <Text style={{ fontWeight: '800', color: '#10b981' }}>• 1-2 reps en recámara: </Text>
                Rango ideal para ganar fuerza y masa con seguridad.
              </Text>
              <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>
                <Text style={{ fontWeight: '800', color: '#f59e0b' }}>• 2-3 reps antes: </Text>
                Si estás fatigado o cuidando una articulación.
              </Text>
            </View>
          </View>
        ) : null}

        {/* 11. OPCIONES DE ESTRATEGIA INTERACTIVAS */}
        {strategyOptions.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text style={[styles.microMuted, { color: colors.textSecondary, paddingHorizontal: 2 }]}>
              {isAlreadyAppliedInSession
                ? 'Estrategia activa para la sesión de hoy:'
                : readOnly
                ? 'Estrategias recomendadas para tus próximas sesiones:'
                : 'Elige cómo quieres enfocar el ejercicio hoy:'}
            </Text>

            {strategyOptions.map((opt: any) => {
              const isSelected = activeStrategy?.id === opt.id;
              const isGreen = isSelected && opt.isCurrentActive;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setSelectedStrategyId(opt.id);
                  }}
                  activeOpacity={0.85}
                  style={[
                    styles.strategyCard,
                    {
                      backgroundColor: isGreen
                        ? 'rgba(16, 185, 129, 0.14)'
                        : isSelected
                        ? colors.tint + '18'
                        : subtleCardBg,
                      borderColor: isGreen
                        ? '#10b981'
                        : isSelected
                        ? colors.tint
                        : subtleCardBorder,
                      borderWidth: isGreen || isSelected ? 1.5 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        backgroundColor: isGreen
                          ? '#10b981'
                          : isSelected
                          ? colors.tint
                          : subtleCardBg,
                      },
                    ]}
                  >
                    {isSelected ? (
                      <Check size={12} color={isGreen ? '#ffffff' : tintContrastText} strokeWidth={3} />
                    ) : null}
                  </View>

                  <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                      <Text style={[styles.cardTitleSm, { color: colors.text, flexShrink: 1 }]}>{opt.title}</Text>
                      {opt.badge ? (
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 999,
                            backgroundColor: isGreen ? '#10b981' : isSelected ? colors.tint : subtleCardBg,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '800',
                              color: isGreen ? '#ffffff' : isSelected ? tintContrastText : colors.textSecondary,
                            }}
                          >
                            {opt.badge}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>{opt.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* 12. NOTA SOBRE SALTOS DE CARGA */}
        {plateNote ? (
          <View
            style={[
              styles.cardBox,
              { backgroundColor: subtleCardBg, borderColor: subtleCardBorder, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
            ]}
          >
            <View style={[styles.iconBoxSmall, { backgroundColor: colors.tint + '22' }]}>
              <Dumbbell size={14} color={colors.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.microMuted, { color: colors.textSecondary, marginBottom: 2 }]}>
                {plateNote.title || `Salto de carga recomendado (+${plateNote.standardJump} kg)`}
              </Text>
              <Text style={[styles.cardDescXs, { color: colors.textSecondary }]}>{plateNote.text}</Text>
            </View>
          </View>
        ) : null}

        {/* 13. HISTORIAL PLEGABLE */}
        {sessions.length > 0 ? (
          <View style={[styles.historyWrapper, { backgroundColor: subtleCardBg, borderColor: subtleCardBorder }]}>
            <TouchableOpacity
              onPress={() => setShowHistory(prev => !prev)}
              activeOpacity={0.8}
              style={styles.historyToggle}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Calendar size={14} color={colors.tint} />
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.text }}>
                  Historial de cargas ({sessions.length} sesiones)
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.tint }}>
                  {showHistory ? 'Ocultar' : 'Ver detalle'}
                </Text>
                {showHistory ? <ChevronUp size={14} color={colors.tint} /> : <ChevronDown size={14} color={colors.tint} />}
              </View>
            </TouchableOpacity>

            {showHistory ? (
              <View style={[styles.historyList, { borderTopColor: subtleCardBorder }]}>
                {sessions.slice(0, 5).map((s: any, idx: number) => (
                  <View
                    key={s.logId || idx}
                    style={[styles.historyRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.7)' }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                      <View style={[styles.historyIndex, { backgroundColor: subtleCardBg }]}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textSecondary }}>#{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                            {s.routineName || 'Rutina'}
                          </Text>
                          {s.isCurrentRoutine ? (
                            <View style={{ paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 5, backgroundColor: colors.tint + '24' }}>
                              <Text style={{ fontSize: 9, fontWeight: '800', color: colors.tint }}>ESTA RUTINA</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                          {formatDateToShort(s.date) || 'Sesión previa'}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>
                        {s.topWeight > 0 ? `${s.topWeight} kg` : 'Corporal'} × {s.topReps} reps
                      </Text>
                      {s.best1RM > 0 ? (
                        <Text style={{ fontSize: 10, fontWeight: '800', color: colors.tint }}>
                          1RM: {s.best1RM}kg
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 2 }}>
          Adaptado a tu objetivo de <Text style={{ fontWeight: '800', color: colors.text }}>{userGoal?.label || 'entrenamiento'}</Text>.
        </Text>
      </ScrollView>

      {/* Footer fijo */}
      <View style={[styles.footerBar, { borderTopColor: headerBorder }]}>
        {!readOnly && (onApplyStrategy || onApplyWeight) ? (
          isCurrentActiveSelected ? (
            <>
              <View style={styles.appliedPill}>
                <CheckCircle2 size={16} color="#10b981" strokeWidth={2.5} />
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#10b981' }} numberOfLines={1}>
                  Plan ya aplicado para hoy
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.85}
                style={[styles.secondaryFooterBtn, { backgroundColor: colors.tint }]}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: tintContrastText }}>Entendido</Text>
              </TouchableOpacity>
            </>
          ) : isAlreadyAppliedInSession ? (
            <>
              <TouchableOpacity
                onPress={handleApplySelection}
                activeOpacity={0.85}
                style={[styles.primaryFooterBtn, { backgroundColor: '#f59e0b' }]}
              >
                <RefreshCw size={15} color="#ffffff" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#ffffff' }} numberOfLines={1}>
                  Cambiar a esta alternativa
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.85}
                style={[styles.secondaryFooterBtn, { backgroundColor: subtleCardBg }]}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={handleApplySelection}
                activeOpacity={0.85}
                style={[styles.primaryFooterBtn, { backgroundColor: colors.tint }]}
              >
                <Check size={16} color={tintContrastText} strokeWidth={3} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: tintContrastText }} numberOfLines={1}>
                  {activeStrategy?.perSetPlan && activeStrategy.perSetPlan.length > 0
                    ? `Aplicar Top Set (${activeStrategy.perSetPlan[0].weight > 0 ? `${activeStrategy.perSetPlan[0].weight}kg` : 'Corporal'} / ${
                        activeStrategy.perSetPlan[1]?.weight > 0 ? `${activeStrategy.perSetPlan[1].weight}kg` : 'Corporal'
                      })`
                    : activeSuggestedWeight !== null && activeSuggestedWeight !== undefined && activeSuggestedWeight > 0
                    ? `Aplicar ${activeSuggestedWeight} kg (${activeSuggestedReps} reps)`
                    : isBW
                    ? `Aplicar en Corporal (${activeSuggestedReps} reps)`
                    : `Aplicar objetivo (${activeSuggestedReps} reps)`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.85}
                style={[styles.secondaryFooterBtn, { backgroundColor: subtleCardBg }]}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Entendido</Text>
              </TouchableOpacity>
            </>
          )
        ) : (
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            style={[styles.primaryFooterBtn, { backgroundColor: colors.tint }]}
          >
            <Check size={16} color={tintContrastText} strokeWidth={3} />
            <Text style={{ fontSize: 14, fontWeight: '800', color: tintContrastText }}>Entendido</Text>
          </TouchableOpacity>
        )}
      </View>
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  badgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  headerPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  cardBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  iconBoxSmall: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microHeader: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  microMuted: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  timeAgoText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitleSm: {
    fontSize: 13.5,
    fontWeight: '800',
    lineHeight: 18,
  },
  cardDescSm: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  cardDescXs: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },
  dividerTop: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  subInfoBox: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  asesoriaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
  },
  asesoriaBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  feedbackBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    gap: 3,
  },
  feedbackDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    width: '48.7%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  kpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  kpiValueSm: {
    fontSize: 13.5,
    fontWeight: '900',
  },
  kpiSub: {
    fontSize: 10,
    fontWeight: '600',
  },
  perSetRow: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  strategyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 13,
    borderRadius: 18,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  historyWrapper: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
  },
  historyList: {
    padding: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 9,
    borderRadius: 12,
    gap: 8,
  },
  historyIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryFooterBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 14,
  },
  secondaryFooterBtn: {
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  appliedPill: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 12,
  },
});
