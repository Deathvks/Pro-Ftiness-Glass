import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import {
  Trash2,
  Clock,
  Flame,
  TrendingUp,
  MapPin,
  CalendarClock,
  Share2,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LiquidCloseButton } from '@/components/ui/GlassButton';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';
import { CardioMap } from '@/components/CardioMap';
import { WorkoutTimeRange } from './WorkoutTimeRange';
import { readCardioNotes, type CardioPoint } from '@/utils/cardio';
import { getContrastTextColor } from '@/utils/colorUtils';
import {
  formatDate,
  formatDateForDisplay,
  getWorkoutTimeWindow,
  splitLocalDateAndTime,
  combineLocalDateAndTime,
} from '@/utils/dateUtils';

interface DailyDetailModalProps {
  visible: boolean;
  logs: any[];
  clientRoutines?: any[];
  onClose: () => void;
}

export function DailyDetailModal({
  visible,
  logs,
  clientRoutines,
  onClose,
}: DailyDetailModalProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentText = getContrastTextColor(colors.tint);

  const ownRoutines = useAppStore(state => state.routines);
  const routines = clientRoutines ?? ownRoutines ?? [];
  const deleteWorkoutLog = useAppStore(state => state.deleteWorkoutLog);
  const updateWorkoutDate = useAppStore(state => state.updateWorkoutDate);
  const showToast = useAppStore(state => state.showToast);

  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [dateOverrides, setDateOverrides] = useState<Record<number, string>>({});
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editingDatePart, setEditingDatePart] = useState<string>('');
  const [editingTimePart, setEditingTimePart] = useState<string>('');
  const [isSavingDate, setIsSavingDate] = useState<boolean>(false);
  const [expandedPath, setExpandedPath] = useState<CardioPoint[] | null>(null);

  useEffect(() => {
    if (visible) {
      setDeletedIds([]);
      setDateOverrides({});
      setEditingLogId(null);
      setExpandedPath(null);
    }
  }, [visible, logs]);

  const openedDayKey = useMemo(
    () => (logs[0]?.workout_date ? formatDate(logs[0].workout_date) : ''),
    [logs]
  );

  const visibleLogs = logs
    .filter(l => !deletedIds.includes(l.id))
    .map(l => (dateOverrides[l.id] ? { ...l, workout_date: dateOverrides[l.id] } : l));

  const headerDateLabel = useMemo(() => {
    const firstDate = visibleLogs[0]?.workout_date || logs[0]?.workout_date;
    return firstDate ? formatDateForDisplay(firstDate) : '';
  }, [visibleLogs, logs]);

  const handleStartEditDate = (log: any) => {
    if (editingLogId === log.id) {
      setEditingLogId(null);
      return;
    }
    const { datePart, timePart } = splitLocalDateAndTime(log.workout_date);
    setEditingLogId(log.id);
    setEditingDatePart(datePart);
    setEditingTimePart(timePart);
  };

  const handleShiftEditing = (deltaDays: number, deltaHours: number, originalDate: any) => {
    const iso = combineLocalDateAndTime(editingDatePart, editingTimePart, originalDate) || originalDate;
    const d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) return;
    if (deltaDays !== 0) d.setDate(d.getDate() + deltaDays);
    if (deltaHours !== 0) d.setHours(d.getHours() + deltaHours);
    const { datePart, timePart } = splitLocalDateAndTime(d);
    setEditingDatePart(datePart);
    setEditingTimePart(timePart);
  };

  const handleSaveDate = async (log: any) => {
    const iso = combineLocalDateAndTime(editingDatePart, editingTimePart, log.workout_date);
    if (!iso) {
      Alert.alert('Fecha inválida', 'Usa el formato AAAA-MM-DD y HH:MM.');
      return;
    }
    if (!updateWorkoutDate) return;

    setIsSavingDate(true);
    const res = await updateWorkoutDate(log.id, iso);
    setIsSavingDate(false);

    if (res?.success) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      showToast?.(res.message || 'Fecha actualizada.');
      const nextDate = res.workout_date || iso;
      setDateOverrides(prev => ({ ...prev, [log.id]: nextDate }));
      setEditingLogId(null);

      const newDayKey = formatDate(nextDate);
      if (openedDayKey && newDayKey && newDayKey !== openedDayKey) {
        const nextDeleted = [...deletedIds, log.id];
        setDeletedIds(nextDeleted);
        if (logs.filter(l => !nextDeleted.includes(l.id)).length === 0) {
          onClose();
        }
      }
    } else {
      Alert.alert('No se pudo actualizar', res?.message || 'Error al actualizar la fecha del entrenamiento.');
    }
  };

  const handleShare = async (log: any) => {
    const routineName = getRoutineName(log);
    const durationSec = log.duration_seconds || log.duration || 0;
    const durationMin = Math.round(durationSec / 60);
    const volume = calculateVolume(log);
    const wInfo = getWorkoutTimeWindow(log.workout_date, durationSec);

    const lines = [`🏋️ ${routineName} — Pro Fitness Glass`];
    if (wInfo) {
      lines.push(`Inicio: ${wInfo.startDateLabel} · ${wInfo.startTimeLabel}`);
      lines.push(`Fin: ${wInfo.endDateLabel} · ${wInfo.endTimeLabel}${wInfo.crossesMidnight ? ' (+1 día)' : ''}`);
    }
    lines.push(`Duración: ${durationMin} min${volume > 0 ? ` · Volumen: ${Math.round(volume).toLocaleString('es-ES')} kg` : ''}${log.calories_burned > 0 ? ` · ${log.calories_burned} kcal` : ''}`);

    try {
      await Share.share({ message: lines.join('\n') });
    } catch {}
  };

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
                <Text style={[styles.subtitle, { color: colors.textSecondary, textTransform: 'capitalize' }]}>
                  {headerDateLabel ? `${headerDateLabel} · ` : ''}
                  {visibleLogs.length}{' '}
                  {visibleLogs.length === 1 ? 'entrenamiento' : 'entrenamientos'}
                </Text>
              </View>
              <LiquidCloseButton
                onPress={onClose}
                iconSize={20}
                iconColor={colors.textSecondary}
                style={styles.closeBtn}
              />
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
                const cardio = readCardioNotes(log.notes);
                const hasCardioNote = cardio.text.startsWith('Sesión GPS:') || cardio.text.startsWith('Cardio Rápido:');

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

                      {!clientRoutines && (
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            accessibilityLabel="Cambiar fecha de inicio"
                            onPress={() => handleStartEditDate(log)}
                            style={[
                              styles.iconActionBtn,
                              {
                                backgroundColor: editingLogId === log.id
                                  ? colors.tint + '24'
                                  : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                              },
                            ]}
                          >
                            <CalendarClock
                              size={16}
                              color={editingLogId === log.id ? colors.tint : colors.textSecondary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            accessibilityLabel="Compartir entrenamiento"
                            onPress={() => handleShare(log)}
                            style={[
                              styles.iconActionBtn,
                              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
                            ]}
                          >
                            <Share2 size={16} color={colors.textSecondary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            accessibilityLabel="Eliminar entrenamiento"
                            onPress={() => handleDelete(log.id)}
                            style={styles.deleteBtn}
                          >
                            <Trash2 size={16} color="#f43f5e" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    <WorkoutTimeRange
                      startDate={log.workout_date}
                      durationSeconds={log.duration_seconds || log.duration || 0}
                      showYear
                      style={{ marginTop: 12 }}
                    />

                    {editingLogId === log.id && (() => {
                      const previewIso = combineLocalDateAndTime(editingDatePart, editingTimePart, log.workout_date);
                      return (
                        <View
                          style={[
                            styles.editDateBox,
                            {
                              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.7)',
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <View style={styles.editDateHeader}>
                            <View style={styles.editDateTitleRow}>
                              <CalendarClock size={14} color={colors.tint} />
                              <Text style={[styles.editDateTitle, { color: colors.text }]}>
                                Ajustar fecha de inicio
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleShiftEditing(-1, 0, log.workout_date)}
                              style={[styles.prevDayBtn, { backgroundColor: colors.tint + '20' }]}
                              activeOpacity={0.75}
                            >
                              <ArrowLeft size={12} color={colors.tint} />
                              <Text style={[styles.prevDayBtnText, { color: colors.tint }]}>
                                Mover al día anterior
                              </Text>
                            </TouchableOpacity>
                          </View>

                          <View style={styles.editControlsRow}>
                            <View
                              style={[
                                styles.stepperField,
                                {
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                                  borderColor: colors.border,
                                },
                              ]}
                            >
                              <TouchableOpacity
                                accessibilityLabel="Día anterior"
                                onPress={() => handleShiftEditing(-1, 0, log.workout_date)}
                                style={styles.stepIconBtn}
                              >
                                <ChevronLeft size={15} color={colors.textSecondary} />
                              </TouchableOpacity>
                              <TextInput
                                value={editingDatePart}
                                onChangeText={setEditingDatePart}
                                placeholder="AAAA-MM-DD"
                                placeholderTextColor={colors.textSecondary}
                                maxLength={10}
                                style={[styles.dateInput, { color: colors.text }]}
                              />
                              <TouchableOpacity
                                accessibilityLabel="Día siguiente"
                                onPress={() => handleShiftEditing(1, 0, log.workout_date)}
                                style={styles.stepIconBtn}
                              >
                                <ChevronRight size={15} color={colors.textSecondary} />
                              </TouchableOpacity>
                            </View>

                            <View
                              style={[
                                styles.stepperField,
                                styles.timeStepperField,
                                {
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                                  borderColor: colors.border,
                                },
                              ]}
                            >
                              <TouchableOpacity
                                accessibilityLabel="Hora menos 1"
                                onPress={() => handleShiftEditing(0, -1, log.workout_date)}
                                style={styles.stepIconBtn}
                              >
                                <ChevronLeft size={15} color={colors.textSecondary} />
                              </TouchableOpacity>
                              <TextInput
                                value={editingTimePart}
                                onChangeText={setEditingTimePart}
                                placeholder="HH:MM"
                                placeholderTextColor={colors.textSecondary}
                                maxLength={5}
                                style={[styles.dateInput, { color: colors.text }]}
                              />
                              <TouchableOpacity
                                accessibilityLabel="Hora más 1"
                                onPress={() => handleShiftEditing(0, 1, log.workout_date)}
                                style={styles.stepIconBtn}
                              >
                                <ChevronRight size={15} color={colors.textSecondary} />
                              </TouchableOpacity>
                            </View>
                          </View>

                          {previewIso && (
                            <WorkoutTimeRange
                              startDate={previewIso}
                              durationSeconds={log.duration_seconds || log.duration || 0}
                              showYear
                            />
                          )}

                          <View style={styles.editActionsRow}>
                            <TouchableOpacity
                              onPress={() => setEditingLogId(null)}
                              style={[
                                styles.cancelEditBtn,
                                { borderColor: colors.border },
                              ]}
                            >
                              <Text style={[styles.cancelEditText, { color: colors.textSecondary }]}>
                                Cancelar
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              disabled={isSavingDate}
                              onPress={() => handleSaveDate(log)}
                              style={[
                                styles.saveEditBtn,
                                { backgroundColor: colors.tint, opacity: isSavingDate ? 0.6 : 1 },
                              ]}
                            >
                              <Check size={14} color={accentText} />
                              <Text style={[styles.saveEditText, { color: accentText }]}>
                                {isSavingDate ? 'Guardando...' : 'Guardar'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })()}

                    {cardio.path.length > 0 && (
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Ampliar ruta GPS"
                        onPress={() => setExpandedPath(cardio.path)}
                        style={[styles.routePreview, { backgroundColor: colors.card, borderColor: colors.border }]}
                      >
                        <View pointerEvents="none" style={styles.routeMap}>
                          <CardioMap path={cardio.path} dark={isDark} color={colors.tint} />
                        </View>
                        <View style={styles.routeLabel}>
                          <MapPin size={14} color={colors.tint} />
                          <Text style={[styles.statPillText, { color: colors.text }]}>Ruta GPS</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    {hasCardioNote && <Text style={[styles.cardioNote, { color: colors.textSecondary }]}>{cardio.text}</Text>}

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
      {visible && expandedPath && (
        <SwipeableBottomSheet
          visible
          scrollable
          isDark={isDark}
          onClose={() => setExpandedPath(null)}
          height="76%"
          backgroundColor={colors.card}
        >
          <View style={[styles.expandedHeader, { borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Ruta GPS</Text>
            <LiquidCloseButton
              accessibilityLabel="Cerrar mapa"
              onPress={() => setExpandedPath(null)}
              iconSize={20}
              iconColor={colors.textSecondary}
              style={styles.closeBtn}
            />
          </View>
          <CardioMap path={expandedPath} dark={isDark} color={colors.tint} />
        </SwipeableBottomSheet>
      )}
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  routePreview: { marginTop: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, overflow: 'hidden' },
  routeMap: { height: 150 },
  routeLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10 },
  cardioNote: { marginTop: 10, fontSize: 13, lineHeight: 18 },
  expandedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    padding: 8,
    borderRadius: 12,
  },
  editDateBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  editDateHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  editDateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editDateTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  prevDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  prevDayBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  editControlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepperField: {
    flexGrow: 1,
    flexBasis: 155,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 4,
    height: 38,
  },
  timeStepperField: {
    flexBasis: 115,
  },
  stepIconBtn: {
    padding: 6,
  },
  dateInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    paddingVertical: 0,
  },
  editActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelEditBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveEditText: {
    fontSize: 12,
    fontWeight: '800',
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
