/* mobile/src/components/workout/ExerciseHistoryModal.tsx */
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
import { History, X, Calendar, Flame, Dumbbell } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

interface ExerciseHistoryModalProps {
  visible: boolean;
  exercise: any;
  onClose: () => void;
}

export const ExerciseHistoryModal: React.FC<ExerciseHistoryModalProps> = ({
  visible,
  exercise,
  onClose,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const workoutLog = useAppStore(state => state.workoutLog) || [];

  const exerciseName = exercise?.name || '';

  const historyByDay = useMemo(() => {
    if (!exerciseName) return [];

    const logs = Array.isArray(workoutLog) ? workoutLog : [];
    const groups: { [key: string]: { date: string; sets: any[] } } = {};

    for (const log of logs) {
      const details = (log.WorkoutLogDetails || []).filter(
        (d: any) => (d.exercise_name || '').toLowerCase().trim() === exerciseName.toLowerCase().trim()
      );
      if (!details.length) continue;

      const dateStr = log.workout_date;
      const dateKey = new Date(dateStr).toISOString().split('T')[0];

      if (!groups[dateKey]) {
        groups[dateKey] = { date: dateStr, sets: [] };
      }

      for (const d of details) {
        const sets = (d.WorkoutLogSets || []).slice();
        sets.sort((a: any, b: any) => (a.set_number || 0) - (b.set_number || 0));
        groups[dateKey].sets.push(...sets);
      }
    }

    return Object.values(groups).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [workoutLog, exerciseName]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (!visible) return null;

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
                <History size={18} color={colors.tint} style={{ marginRight: 6 }} />
                <Text style={[styles.title, { color: colors.text }]}>Historial de Rendimiento</Text>
              </View>
              <Text style={[styles.exerciseSub, { color: colors.tint }]} numberOfLines={1}>
                {exerciseName}
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

          {/* List of sessions */}
          <ScrollView contentContainerStyle={styles.scrollList}>
            {historyByDay.length === 0 ? (
              <View style={styles.emptyBox}>
                <Dumbbell size={36} color={colors.textSecondary} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin entrenamientos previos</Text>
                <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                  Cuando completes series en esta rutina, tu progresión aparecerá registrada aquí.
                </Text>
              </View>
            ) : (
              historyByDay.map((session, sIdx) => (
                <View
                  key={sIdx}
                  style={[
                    styles.sessionCard,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <View style={styles.sessionDateRow}>
                    <Calendar size={14} color={colors.tint} style={{ marginRight: 6 }} />
                    <Text style={[styles.sessionDateText, { color: colors.text }]}>
                      {formatDate(session.date)}
                    </Text>
                  </View>

                  {/* Sets */}
                  <View style={styles.setsList}>
                    {session.sets.map((set: any, idx: number) => {
                      const w = set.weight_kg || set.weight || 0;
                      const r = set.reps || 0;
                      const rir = set.rir !== undefined && set.rir !== null ? ` • RIR ${set.rir}` : '';

                      return (
                        <View
                          key={idx}
                          style={[
                            styles.setChip,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                            },
                          ]}
                        >
                          <Text style={[styles.setNumber, { color: colors.textSecondary }]}>
                            #{idx + 1}
                          </Text>
                          <Text style={[styles.setMetrics, { color: colors.text }]}>
                            <Text style={{ fontWeight: '800', color: colors.tint }}>{w} kg</Text> × {r} reps
                            {rir}
                          </Text>
                          {set.is_dropset ? (
                            <Text style={styles.dsTag}>DS</Text>
                          ) : set.is_warmup ? (
                            <Flame size={12} color="#f97316" />
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
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
    maxHeight: '80%',
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
  scrollList: {
    padding: 18,
    gap: 14,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  sessionCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  sessionDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionDateText: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  setsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  setNumber: {
    fontSize: 11,
    fontWeight: '700',
  },
  setMetrics: {
    fontSize: 12,
    fontWeight: '600',
  },
  dsTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ef4444',
  },
});
