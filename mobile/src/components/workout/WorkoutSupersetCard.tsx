/* mobile/src/components/workout/WorkoutSupersetCard.tsx */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import {
  Link2,
  Clock,
  Flame,
  Repeat,
  Target,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { normalizeDecimalInput, normalizeIntegerInput } from '@/utils/workoutHelpers';
import { getExerciseHistorySessions, diagnoseExerciseTrend } from '@/utils/smartProgressionCoach';
import { BACKEND_BASE_URL } from '@/services/apiClient';

interface WorkoutSupersetCardProps {
  group: any[];
  allExercises: any[];
  hasWorkoutStarted: boolean;
  onSetSelectedExercise?: (exercise: any) => void;
  onSetExerciseToReplace: (exIndex: number) => void;
  onUpdateSet: (exIdx: number, setIdx: number, field: string, val: string) => void;
  onToggleWarmup?: (exIdx: number, setIdx: number) => void;
  onOpenRestModal: (restSeconds: number) => void;
  onShowSmartCoach?: (exercise: any) => void;
}

export const WorkoutSupersetCard: React.FC<WorkoutSupersetCardProps> = ({
  group,
  allExercises,
  hasWorkoutStarted,
  onSetSelectedExercise,
  onSetExerciseToReplace,
  onUpdateSet,
  onToggleWarmup,
  onOpenRestModal,
  onShowSmartCoach,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const userProfile = useAppStore(state => state.userProfile || (state as any).user);
  const workoutLog = useAppStore(state => state.workoutLog) || [];

  const isInAsesoria = Boolean(
    userProfile?.trainer_id ||
    userProfile?.trainer ||
    (userProfile?.role === 'trainee' && userProfile?.trainer_id)
  );

  const maxSets = Math.max(...group.map((ex: any) => (ex.setsDone || []).length), 1);

  const getRealIndex = (exerciseId: string) => {
    return allExercises.findIndex((ex: any) => ex.id === exerciseId);
  };

  const getFullImageUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BACKEND_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const lastExercise = group[group.length - 1];
  const restSeconds = lastExercise?.rest_seconds || 90;

  return (
    <View
      style={[
        styles.supersetCard,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        },
      ]}
    >
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      {/* 1. Header con Badge de Superserie */}
      <View style={styles.headerRow}>
        <View style={[styles.badgePill, { backgroundColor: colors.tint }]}>
          <Text style={styles.badgeText}>SUPERSERIE</Text>
        </View>
      </View>

      {/* 2. Lista horizontal de ejercicios de la superserie (idéntica al Frontend) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.exerciseHScroll}
      >
        {group.map((ex: any) => {
          const imgUri = getFullImageUrl(
            ex.image_url ||
            ex.image_url_start ||
            ex.exercise_details?.image_url ||
            ex.exercise_details?.image_url_start
          );
          const realIdx = getRealIndex(ex.id);
          const exSessions = getExerciseHistorySessions(ex.name, workoutLog);
          const exTrend = diagnoseExerciseTrend(exSessions);

          return (
            <View
              key={ex.id}
              style={[
                styles.miniExerciseCard,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              {/* Miniatura */}
              <TouchableOpacity
                onPress={() => onSetSelectedExercise && onSetSelectedExercise(ex)}
                style={styles.miniImgWrapper}
                activeOpacity={0.8}
              >
                {imgUri ? (
                  <Image source={{ uri: imgUri }} style={styles.miniImg} resizeMode="contain" />
                ) : (
                  <View style={[styles.miniImgFallback, { backgroundColor: colors.tint + '15' }]}>
                    <Link2 size={16} color={colors.tint} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Título y reps */}
              <View style={styles.miniInfoCol}>
                <TouchableOpacity
                  onPress={() => onSetSelectedExercise && onSetSelectedExercise(ex)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.miniTitle, { color: colors.text }]} numberOfLines={1}>
                    {ex.name}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.miniSubtitle, { color: colors.textSecondary }]}>
                  {ex.sets} Series × {ex.reps} Reps
                </Text>
              </View>

              {/* Acciones del mini card */}
              <View style={styles.miniActionsCol}>
                {!isInAsesoria && onShowSmartCoach ? (
                  <TouchableOpacity
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                      onShowSmartCoach(ex);
                    }}
                    style={styles.miniIconBtn}
                    activeOpacity={0.7}
                  >
                    {exTrend?.isWarning ? (
                      <AlertTriangle size={15} color="#f59e0b" strokeWidth={2.5} />
                    ) : exTrend?.isProgressing ? (
                      <CheckCircle2 size={15} color="#10b981" strokeWidth={2.5} />
                    ) : (
                      <Target size={15} color={colors.tint} />
                    )}
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  disabled={!hasWorkoutStarted}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    onSetExerciseToReplace(realIdx);
                  }}
                  style={[styles.miniIconBtn, !hasWorkoutStarted && { opacity: 0.4 }]}
                  activeOpacity={0.7}
                >
                  <Repeat size={15} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* 3. Cabecera del Grid Unificado de Superseries */}
      <View style={styles.gridHeaderRow}>
        <Text style={[styles.gridColTitle, { width: 34, color: colors.textSecondary }]}>#</Text>
        {group.map((ex: any) => (
          <Text
            key={ex.id}
            style={[styles.gridColTitle, { flex: 1, color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {ex.name?.split(' ')[0] || 'Ex'}
          </Text>
        ))}
        <View style={{ width: 40, alignItems: 'center' }}>
          <Clock size={14} color={colors.textSecondary} />
        </View>
      </View>

      {/* 4. Filas del Grid Unificado */}
      <View style={styles.gridRowsWrapper}>
        {Array.from({ length: maxSets }).map((_, rowIndex) => {
          const isWarmup = Boolean(group[0]?.setsDone?.[rowIndex]?.is_warmup);

          return (
            <View key={rowIndex} style={styles.supersetRow}>
              {/* Número de Serie / Calentamiento (afecta a todos) */}
              <TouchableOpacity
                disabled={!hasWorkoutStarted}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  group.forEach((ex: any) => {
                    const realIndex = getRealIndex(ex.id);
                    if (ex.setsDone?.[rowIndex] && onToggleWarmup) {
                      onToggleWarmup(realIndex, rowIndex);
                    }
                  });
                }}
                style={[
                  styles.supersetSetNumBtn,
                  isWarmup
                    ? {
                        backgroundColor: 'rgba(249, 115, 22, 0.15)',
                        borderColor: 'rgba(249, 115, 22, 0.4)',
                      }
                    : {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                      },
                  !hasWorkoutStarted && { opacity: 0.5 },
                ]}
                activeOpacity={0.7}
              >
                {isWarmup ? (
                  <Flame size={14} color="#f97316" strokeWidth={2.5} />
                ) : (
                  <Text style={[styles.setNumText, { color: colors.text }]}>{rowIndex + 1}</Text>
                )}
              </TouchableOpacity>

              {/* Inputs por cada ejercicio del grupo */}
              {group.map((ex: any) => {
                const set = ex.setsDone?.[rowIndex];
                const realIndex = getRealIndex(ex.id);

                if (!set) {
                  return (
                    <View
                      key={ex.id}
                      style={[
                        styles.emptySetCell,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                        },
                      ]}
                    />
                  );
                }

                return (
                  <View key={ex.id} style={styles.dualInputsCell}>
                    <TextInput
                      keyboardType="decimal-pad"
                      placeholder="kg"
                      placeholderTextColor={colors.textSecondary + '70'}
                      value={set.weight_kg !== undefined && set.weight_kg !== null ? String(set.weight_kg) : ''}
                      editable={hasWorkoutStarted}
                      onChangeText={(val) =>
                        onUpdateSet(realIndex, rowIndex, 'weight_kg', normalizeDecimalInput(val))
                      }
                      style={[
                        styles.halfInput,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                          color: colors.text,
                          opacity: hasWorkoutStarted ? 1 : 0.5,
                        },
                      ]}
                    />

                    <TextInput
                      keyboardType="number-pad"
                      placeholder="reps"
                      placeholderTextColor={colors.textSecondary + '70'}
                      value={set.reps !== undefined && set.reps !== null ? String(set.reps) : ''}
                      editable={hasWorkoutStarted}
                      onChangeText={(val) =>
                        onUpdateSet(realIndex, rowIndex, 'reps', normalizeIntegerInput(val))
                      }
                      style={[
                        styles.halfInput,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                          color: colors.text,
                          opacity: hasWorkoutStarted ? 1 : 0.5,
                        },
                      ]}
                    />
                  </View>
                );
              })}

              {/* Botón único de Descanso para la fila */}
              <TouchableOpacity
                disabled={!hasWorkoutStarted}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch {}
                  onOpenRestModal(restSeconds);
                }}
                style={[
                  styles.supersetClockBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                    opacity: hasWorkoutStarted ? 1 : 0.4,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Clock size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  supersetCard: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  headerRow: {
    marginBottom: 12,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.8,
  },
  exerciseHScroll: {
    gap: 10,
    paddingBottom: 12,
  },
  miniExerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 18,
    borderWidth: 1,
    width: 240,
    gap: 8,
  },
  miniImgWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  miniImg: {
    width: '100%',
    height: '100%',
  },
  miniImgFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniInfoCol: {
    flex: 1,
  },
  miniTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  miniSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  miniActionsCol: {
    gap: 4,
  },
  miniIconBtn: {
    padding: 4,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
    marginTop: 6,
    marginBottom: 8,
  },
  gridColTitle: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  gridRowsWrapper: {
    gap: 8,
  },
  supersetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  supersetSetNumBtn: {
    width: 34,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumText: {
    fontSize: 13,
    fontWeight: '800',
  },
  dualInputsCell: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  halfInput: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    paddingHorizontal: 2,
  },
  emptySetCell: {
    flex: 1,
    height: 42,
    borderRadius: 12,
  },
  supersetClockBtn: {
    width: 40,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
