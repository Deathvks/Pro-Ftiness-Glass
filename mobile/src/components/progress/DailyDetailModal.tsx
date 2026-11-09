import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import {
  X,
  Trash2,
  Clock,
  Flame,
  TrendingUp,
  Dumbbell,
  BarChartHorizontal,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';

interface DailyDetailModalProps {
  visible: boolean;
  logs: any[];
  onClose: () => void;
}

export function DailyDetailModal({
  visible,
  logs,
  onClose,
}: DailyDetailModalProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const routines = useAppStore(state => state.routines) || [];
  const deleteWorkoutLog = useAppStore(state => state.deleteWorkoutLog);

  const [deletedIds, setDeletedIds] = useState<number[]>([]);

  const visibleLogs = logs.filter(l => !deletedIds.includes(l.id));

  const handleDelete = (logId: number) => {
    Alert.alert(
      'Eliminar entrenamiento',
      '¿Estás seguro de que quieres eliminar esta sesión de entrenamiento? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (deleteWorkoutLog) {
              const res = await deleteWorkoutLog(logId);
              if (res?.success) {
                try {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                  );
                } catch {}
                const next = [...deletedIds, logId];
                setDeletedIds(next);
                if (logs.filter(l => !next.includes(l.id)).length === 0) {
                  onClose();
                }
              }
            }
          },
        },
      ]
    );
  };

  const getRoutineName = (log: any) => {
    const found = routines.find((r: any) => r.id === log.routine_id);
    return found?.name || log.routine_name || 'Entrenamiento';
  };

  const calculateVolume = (log: any) => {
    let vol = 0;
    log?.WorkoutLogDetails?.forEach((d: any) => {
      d.WorkoutLogSets?.forEach((s: any) => {
        vol += (parseFloat(s.weight_kg) || 0) * (parseFloat(s.reps) || 0);
      });
    });
    return vol;
  };

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
                <Text style={[styles.title, { color: colors.text }]}>
                  Detalles de Sesión
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {visibleLogs.length}{' '}
                  {visibleLogs.length === 1 ? 'entrenamiento' : 'entrenamientos'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content List */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 24, gap: 16 }}
            >
              {visibleLogs.map(log => {
                const routineName = getRoutineName(log);
                const durationMin = Math.round(
                  (log.duration_seconds || log.duration || 0) / 60
                );
                const volume = calculateVolume(log);
                const details = log.WorkoutLogDetails || [];

                return (
                  <View
                    key={log.id}
                    style={[
                      styles.logCard,
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
                    {/* Log Card Header */}
                    <View style={styles.logHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.routineName, { color: colors.text }]}>
                          {routineName}
                        </Text>
                        <View style={styles.statsRow}>
                          <View style={styles.statPill}>
                            <Clock size={12} color={colors.tint} />
                            <Text
                              style={[styles.statPillText, { color: colors.text }]}
                            >
                              {durationMin} min
                            </Text>
                          </View>
                          {volume > 0 && (
                            <View style={styles.statPill}>
                              <TrendingUp size={12} color="#a855f7" />
                              <Text
                                style={[styles.statPillText, { color: colors.text }]}
                              >
                                {volume.toLocaleString('es-ES')} kg
                              </Text>
                            </View>
                          )}
                          {log.calories_burned > 0 && (
                            <View style={styles.statPill}>
                              <Flame size={12} color="#f59e0b" />
                              <Text
                                style={[styles.statPillText, { color: colors.text }]}
                              >
                                {log.calories_burned} kcal
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleDelete(log.id)}
                        style={styles.deleteBtn}
                      >
                        <Trash2 size={16} color="#f43f5e" />
                      </TouchableOpacity>
                    </View>

                    {/* Exercises List */}
                    <View style={{ gap: 12, marginTop: 12 }}>
                      {details.map((ex: any, eIdx: number) => {
                        const sets = ex.WorkoutLogSets || [];
                        const warmupSets = sets.filter((s: any) => s.is_warmup);
                        const workSets = sets.filter((s: any) => !s.is_warmup);

                        return (
                          <View key={eIdx} style={styles.exerciseBox}>
                            <View style={styles.exerciseHeader}>
                              <Text
                                style={[
                                  styles.exerciseName,
                                  { color: colors.text },
                                ]}
                              >
                                {ex.exercise_name}
                              </Text>
                              <Text
                                style={[
                                  styles.exerciseMeta,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                Vol: {ex.total_volume || 0}kg · Max:{' '}
                                {ex.best_set_weight || 0}kg
                              </Text>
                            </View>

                            {/* Warmup sets */}
                            {warmupSets.length > 0 && (
                              <View style={{ gap: 4, marginBottom: 4 }}>
                                <Text style={styles.warmupTitle}>
                                  Calentamiento
                                </Text>
                                {warmupSets.map((s: any, idx: number) => (
                                  <View
                                    key={idx}
                                    style={[
                                      styles.setRow,
                                      {
                                        backgroundColor:
                                          'rgba(249, 115, 22, 0.1)',
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.setText,
                                        { color: '#f97316' },
                                      ]}
                                    >
                                      {s.reps} reps × {s.weight_kg} kg
                                      {s.rir !== null && s.rir !== undefined
                                        ? ` @${s.rir} rir`
                                        : ''}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}

                            {/* Work sets */}
                            <View style={{ gap: 4 }}>
                              {workSets.map((s: any, idx: number) => (
                                <View
                                  key={idx}
                                  style={[
                                    styles.setRow,
                                    {
                                      backgroundColor: isDark
                                        ? 'rgba(255, 255, 255, 0.05)'
                                        : 'rgba(0, 0, 0, 0.03)',
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.setText,
                                      { color: colors.text },
                                    ]}
                                  >
                                    <Text
                                      style={{
                                        color: colors.tint,
                                        fontWeight: '800',
                                      }}
                                    >
                                      {s.reps}
                                    </Text>{' '}
                                    reps ×{' '}
                                    <Text
                                      style={{
                                        color: colors.text,
                                        fontWeight: '800',
                                      }}
                                    >
                                      {s.weight_kg}
                                    </Text>{' '}
                                    kg
                                    {s.rir !== null && s.rir !== undefined
                                      ? ` @${s.rir} rir`
                                      : ''}
                                  </Text>
                                  {s.is_dropset ? (
                                    <View style={styles.dropBadge}>
                                      <Text style={styles.dropBadgeText}>
                                        DROP
                                      </Text>
                                    </View>
                                  ) : null}
                                </View>
                              ))}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
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
    maxWidth: 440,
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
    marginBottom: 16,
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
  logCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  exerciseBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  exerciseMeta: {
    fontSize: 10,
    fontWeight: '600',
  },
  warmupTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f97316',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  setText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dropBadge: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dropBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f43f5e',
  },
});
