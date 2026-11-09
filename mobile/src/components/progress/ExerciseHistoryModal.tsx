import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { X, Calendar as CalendarIcon, Flame, Dumbbell } from 'lucide-react-native';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';

interface ExerciseHistoryModalProps {
  visible: boolean;
  exerciseName: string;
  onClose: () => void;
}

export function ExerciseHistoryModal({
  visible,
  exerciseName,
  onClose,
}: ExerciseHistoryModalProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const workoutLog = useAppStore(state => state.workoutLog) || [];

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const { availableYears, historyByDay } = useMemo(() => {
    const yearsSet = new Set<number>();
    const groups: Record<string, any[]> = {};

    if (!exerciseName) return { availableYears: [], historyByDay: [] };

    for (const log of workoutLog) {
      const details = (log.WorkoutLogDetails || []).filter(
        (d: any) => d.exercise_name?.toLowerCase() === exerciseName?.toLowerCase()
      );
      if (!details.length) continue;

      const date = new Date(log.workout_date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`;

      yearsSet.add(year);

      if (selectedYear !== 'all' && String(year) !== selectedYear) continue;
      if (selectedMonth !== 'all' && String(month) !== selectedMonth) continue;

      if (!groups[dateKey]) groups[dateKey] = [];

      for (const d of details) {
        const sets = (d.WorkoutLogSets || []).slice();
        sets.sort((a: any, b: any) => (a.set_number || 0) - (b.set_number || 0));
        groups[dateKey].push(...sets);
      }
    }

    const history = Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([dateKey, sets]) => ({ dateKey, sets }));

    return {
      availableYears: Array.from(yearsSet).sort((a, b) => b - a),
      historyByDay: history,
    };
  }, [workoutLog, exerciseName, selectedYear, selectedMonth]);

  return (
    <SwipeableBottomSheet
      scrollable
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.card}
      height="86%"
      maxHeight="88%"
    >
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 4 }}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                  Historial: {exerciseName}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {historyByDay.length}{' '}
                  {historyByDay.length === 1 ? 'sesión registrada' : 'sesiones registradas'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Year Filters */}
            {availableYears.length > 1 && (
              <View style={styles.filterRow}>
                <TouchableOpacity
                  onPress={() => setSelectedYear('all')}
                  style={[
                    styles.filterPill,
                    selectedYear === 'all' && { backgroundColor: colors.tint },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      { color: selectedYear === 'all' ? '#000' : colors.textSecondary },
                    ]}
                  >
                    Todos
                  </Text>
                </TouchableOpacity>
                {availableYears.map(y => (
                  <TouchableOpacity
                    key={y}
                    onPress={() => setSelectedYear(String(y))}
                    style={[
                      styles.filterPill,
                      selectedYear === String(y) && { backgroundColor: colors.tint },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        {
                          color: selectedYear === String(y) ? '#000' : colors.textSecondary,
                        },
                      ]}
                    >
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Content List */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
            >
              {historyByDay.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No hay sesiones registradas en este período
                  </Text>
                </View>
              ) : (
                historyByDay.map(({ dateKey, sets }) => {
                  const date = new Date(dateKey);
                  const formatted = date.toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <View
                      key={dateKey}
                      style={[
                        styles.dayCard,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.03)',
                          borderColor: isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}
                    >
                      <View style={styles.dayHeader}>
                        <CalendarIcon size={13} color={colors.tint} />
                        <Text style={[styles.dayTitle, { color: colors.text }]}>
                          {formatted}
                        </Text>
                        <Text style={[styles.dayCount, { color: colors.textSecondary }]}>
                          ({sets.length} series)
                        </Text>
                      </View>

                      <View style={{ gap: 6 }}>
                        {sets.map((set, sIdx) => {
                          const isWarmup = !!set.is_warmup;
                          const isDropset = !!set.is_dropset;

                          return (
                            <View
                              key={sIdx}
                              style={[
                                styles.setRow,
                                {
                                  backgroundColor: isWarmup
                                    ? 'rgba(249, 115, 22, 0.1)'
                                    : isDark
                                    ? 'rgba(255, 255, 255, 0.04)'
                                    : 'rgba(0, 0, 0, 0.03)',
                                },
                              ]}
                            >
                              <Text style={[styles.setNum, { color: colors.textSecondary }]}>
                                #{sIdx + 1}
                              </Text>

                              <View style={styles.metricsRow}>
                                <Text
                                  style={[
                                    styles.weightVal,
                                    { color: isWarmup ? '#f97316' : colors.text },
                                  ]}
                                >
                                  {set.weight_kg}{' '}
                                  <Text style={styles.unitText}>kg</Text>
                                </Text>
                                <Text style={styles.crossText}>×</Text>
                                <Text
                                  style={[
                                    styles.repsVal,
                                    { color: isWarmup ? '#f97316' : colors.tint },
                                  ]}
                                >
                                  {set.reps}{' '}
                                  <Text style={styles.unitText}>reps</Text>
                                </Text>
                                {set.rir !== null && set.rir !== undefined && (
                                  <Text style={[styles.rirText, { color: colors.textSecondary }]}>
                                    @{set.rir} rir
                                  </Text>
                                )}
                              </View>

                              {isWarmup && (
                                <View style={styles.warmupBadge}>
                                  <Flame size={10} color="#f97316" />
                                  <Text style={styles.warmupBadgeText}>Calent.</Text>
                                </View>
                              )}
                              {isDropset && (
                                <View style={styles.dropsetBadge}>
                                  <Text style={styles.dropsetBadgeText}>Drop</Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
      </View>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollArea: {
    flexGrow: 1,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dayTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  dayCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 10,
  },
  setNum: {
    fontSize: 11,
    fontWeight: '800',
    width: 24,
  },
  metricsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weightVal: {
    fontSize: 14,
    fontWeight: '900',
  },
  crossText: {
    fontSize: 12,
    color: '#888',
  },
  repsVal: {
    fontSize: 14,
    fontWeight: '900',
  },
  unitText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
  },
  rirText: {
    fontSize: 11,
    fontWeight: '700',
  },
  warmupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
  },
  warmupBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f97316',
  },
  dropsetBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  dropsetBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ef4444',
  },
});
