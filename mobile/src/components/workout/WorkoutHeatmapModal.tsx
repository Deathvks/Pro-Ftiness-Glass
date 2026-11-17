/* mobile/src/components/workout/WorkoutHeatmapModal.tsx */
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity, X } from 'lucide-react-native';

import {
  HEATMAP_INTENSITY_LEVELS,
  SessionMuscleHeatmap,
  getWorkoutMuscleData,
} from '@/components/workout/SessionMuscleHeatmap';
import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';
import { getUnselectedControlColors } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { MUSCLE_NAMES_ES } from '@/utils/muscleUtils';

interface WorkoutHeatmapModalProps {
  visible: boolean;
  exercises: any[];
  onClose: () => void;
}

export const WorkoutHeatmapModal: React.FC<WorkoutHeatmapModalProps> = ({
  visible,
  exercises = [],
  onClose,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const borderTone = colors.border || (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)');
  const subtleBg = getUnselectedControlColors(theme).backgroundColor;
  const themedCardStyle = getAppleSheetCardStyle(isDark, 16, theme);

  const muscleData = useMemo(() => getWorkoutMuscleData(exercises), [exercises]);

  const muscleBreakdown = useMemo(() => {
    const scores: Record<string, number> = {};
    exercises.forEach((ex: any) => {
      const rawMuscle = ex?.muscle_group || ex?.exercise_details?.muscle_group || '';
      const muscles = String(rawMuscle)
        .split(',')
        .map(m => m.trim())
        .filter(Boolean);
      const setsCount = Array.isArray(ex?.setsDone)
        ? Math.max(1, ex.setsDone.length)
        : parseInt(String(ex?.sets), 10) || 3;

      muscles.forEach(m => {
        scores[m] = (scores[m] || 0) + setsCount;
      });
    });

    return Object.entries(scores).sort((a, b) => b[1] - a[1]);
  }, [exercises]);

  const getIntensityInfo = (sets: number) => {
    if (sets >= 12) return HEATMAP_INTENSITY_LEVELS[3];
    if (sets >= 8) return HEATMAP_INTENSITY_LEVELS[2];
    if (sets >= 4) return HEATMAP_INTENSITY_LEVELS[1];
    return HEATMAP_INTENSITY_LEVELS[0];
  };

  return (
    <SwipeableBottomSheet
      scrollable
      edgeToEdge
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.card}
      height="88%"
      maxHeight="88%"
    >
      <View style={[styles.headerRow, { borderBottomColor: borderTone }]}>
        <View style={styles.headerTitleWrap}>
          <View style={[styles.iconCircle, { backgroundColor: colors.tint + '1A' }]}>
            <Activity size={20} color={colors.tint} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.title, { color: colors.text }]}>Músculos Trabajados</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Volumen e intensidad de esta sesión
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.closeBtn, { backgroundColor: subtleBg }]}
        >
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, minHeight: 0 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {Object.keys(muscleData).length > 0 ? (
            <>
              <SessionMuscleHeatmap muscleData={muscleData} />

              <View style={styles.legendRow}>
                {HEATMAP_INTENSITY_LEVELS.map(level => (
                  <View key={level.label} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        {
                          backgroundColor: level.color,
                          shadowColor: level.color,
                        },
                      ]}
                    />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                      {level.label}
                    </Text>
                  </View>
                ))}
              </View>

              {muscleBreakdown.length > 0 && (
                <View style={styles.breakdownList}>
                  {muscleBreakdown.map(([muscle, count]) => {
                    const intensity = getIntensityInfo(count);
                    const normalized = muscle.trim().toLowerCase();
                    const label = MUSCLE_NAMES_ES[normalized] || muscle;
                    return (
                      <View key={muscle} style={[styles.muscleRow, themedCardStyle]}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.muscleName, { color: colors.text }]} numberOfLines={1}>
                            {label}
                          </Text>
                          <Text style={[styles.setsCount, { color: colors.textSecondary }]}>
                            {count} {count === 1 ? 'serie estimada' : 'series estimadas'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.intensityPill,
                            {
                              backgroundColor: intensity.color + '20',
                              borderColor: intensity.color + '55',
                            },
                          ]}
                        >
                          <Text style={[styles.intensityText, { color: intensity.color }]}>
                            {intensity.label}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No se han detectado grupos musculares.
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Asegúrate de que tus ejercicios tengan asignado un grupo muscular específico.
              </Text>
            </View>
          )}

          <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
            La intensidad del color indica el volumen de series en esta sesión.
          </Text>
          <SafeAreaView edges={['bottom']} />
        </ScrollView>
      </View>
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    shadowOpacity: 0.75,
    shadowRadius: 5,
    elevation: 2,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  breakdownList: {
    gap: 8,
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  muscleName: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  setsCount: {
    fontSize: 12,
    marginTop: 2,
  },
  intensityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    flexShrink: 0,
  },
  intensityText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyWrap: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  footerNote: {
    fontSize: 11.5,
    textAlign: 'center',
    opacity: 0.8,
  },
});
