/* mobile/src/components/workout/SmartExerciseCoachModal.tsx */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import {
  Target,
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Dumbbell,
  Flame,
  Activity,
  Shield,
  Lightbulb,
  Check,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { generateSmartCoachPlan } from '@/utils/smartProgressionCoach';

interface SmartExerciseCoachModalProps {
  visible: boolean;
  exercise: any;
  onClose: () => void;
  onApplyWeight?: (weight: number) => void;
}

export const SmartExerciseCoachModal: React.FC<SmartExerciseCoachModalProps> = ({
  visible,
  exercise,
  onClose,
  onApplyWeight,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const userProfile = useAppStore(state => state.userProfile);
  const workoutLog = useAppStore(state => state.workoutLog) || [];

  const plan = useMemo(() => {
    if (!exercise) return null;
    try {
      return generateSmartCoachPlan(exercise, userProfile, workoutLog);
    } catch (e) {
      console.warn('Error generating coach plan:', e);
      return null;
    }
  }, [exercise, userProfile, workoutLog]);

  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);

  const activeStrategy = useMemo(() => {
    if (!plan?.strategyOptions || plan.strategyOptions.length === 0) return null;
    if (!selectedStrategyId) return plan.strategyOptions[0];
    return plan.strategyOptions.find((s: any) => s.id === selectedStrategyId) || plan.strategyOptions[0];
  }, [plan, selectedStrategyId]);

  if (!visible || !plan) return null;

  const {
    userGoal,
    trend,
    coachingAdvice,
    actionSteps = [],
    motivationalMessage,
    currentTopWeight,
  } = plan;

  const suggestedWeight = activeStrategy?.suggestedWeight || plan.targets?.suggestedWeight;

  const handleApply = () => {
    if (suggestedWeight && onApplyWeight) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      onApplyWeight(suggestedWeight);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }]}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Target size={18} color={colors.tint} style={{ marginRight: 6 }} />
                <Text style={[styles.title, { color: colors.text }]}>Entrenador Inteligente</Text>
              </View>
              <Text style={[styles.exerciseSub, { color: colors.tint }]} numberOfLines={1}>
                {exercise.name}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Goal badge */}
            <View
              style={[
                styles.goalBadge,
                {
                  backgroundColor: colors.tint + '15',
                  borderColor: colors.tint + '35',
                },
              ]}
            >
              <Dumbbell size={14} color={colors.tint} style={{ marginRight: 6 }} />
              <Text style={[styles.goalBadgeText, { color: colors.tint }]}>
                {userGoal?.label || 'Objetivo Personal'}
              </Text>
            </View>

            {/* Diagnostic advice card */}
            <View
              style={[
                styles.adviceCard,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              <View style={styles.adviceHeaderRow}>
                <Lightbulb size={18} color="#eab308" style={{ marginRight: 8 }} />
                <Text style={[styles.adviceHeaderTitle, { color: colors.text }]}>
                  Diagnóstico y Estrategia
                </Text>
              </View>

              <Text style={[styles.adviceText, { color: colors.text }]}>
                {coachingAdvice || motivationalMessage}
              </Text>
            </View>

            {/* Action Steps */}
            {actionSteps.length > 0 ? (
              <View style={styles.stepsSection}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  PAUTAS RECOMENDADAS PARA HOY:
                </Text>

                {actionSteps.map((step: any, idx: number) => (
                  <View
                    key={idx}
                    style={[
                      styles.stepCard,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    <CheckCircle2 size={16} color={colors.tint} style={{ marginRight: 10, marginTop: 1 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
                      <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{step.detail}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Suggested Weight Button */}
            {suggestedWeight ? (
              <TouchableOpacity
                onPress={handleApply}
                style={[
                  styles.applyWeightBtn,
                  {
                    backgroundColor: colors.tint,
                    shadowColor: colors.tint,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 10,
                    elevation: 6,
                  },
                ]}
                activeOpacity={0.82}
              >
                <Check size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.applyWeightBtnText}>
                  Aplicar carga recomendada ({suggestedWeight} kg)
                </Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxHeight: '82%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  exerciseSub: {
    fontSize: 13,
    fontWeight: '700',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  goalBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  adviceCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  adviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adviceHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  adviceText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  stepsSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  applyWeightBtn: {
    height: 52,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  applyWeightBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
