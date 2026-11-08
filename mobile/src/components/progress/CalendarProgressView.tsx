import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Flame,
  Clock,
  Dumbbell,
  TrendingUp,
  Sparkles,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { DailyDetailModal } from './DailyDetailModal';
import { StatBadge } from './StatBadge';
import { getContrastTextColor } from '@/utils/colorUtils';

export function CalendarProgressView() {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentText = getContrastTextColor(colors.tint);

  const workoutLog = useAppStore(state => state.workoutLog) || [];
  const routines = useAppStore(state => state.routines) || [];

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(now.getDate()).padStart(2, '0')}`;

  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Group workouts by local YYYY-MM-DD
  const workoutsByDate = useMemo(() => {
    return (workoutLog || []).reduce((acc: Record<string, any[]>, log: any) => {
      if (!log?.workout_date) return acc;
      const d = new Date(log.workout_date);
      if (isNaN(d.getTime())) return acc;
      const localStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(d.getDate()).padStart(2, '0')}`;

      if (!acc[localStr]) acc[localStr] = [];

      const isDuplicate = acc[localStr].some(
        (l: any) =>
          (l.id && log.id && String(l.id) === String(log.id)) ||
          (l.routine_id &&
            log.routine_id &&
            String(l.routine_id) === String(log.routine_id) &&
            l.workout_date === log.workout_date)
      );

      if (!isDuplicate) acc[localStr].push(log);
      return acc;
    }, {});
  }, [workoutLog]);

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleString('es-ES', { month: 'long' });

  // Calculate log volume
  const calculateVolume = (log: any) => {
    let vol = 0;
    log?.WorkoutLogDetails?.forEach((d: any) => {
      d.WorkoutLogSets?.forEach((s: any) => {
        vol += (parseFloat(s.weight_kg) || 0) * (parseFloat(s.reps) || 0);
      });
    });
    return vol;
  };

  const getRoutineName = (log: any) => {
    const found = routines.find((r: any) => r.id === log.routine_id);
    return found?.name || log.routine_name || 'Entrenamiento';
  };

  // Month Statistics
  const monthStats = useMemo(() => {
    const logsInMonth = (workoutLog || []).filter((log: any) => {
      if (!log?.workout_date) return false;
      const d = new Date(log.workout_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    let totalSeconds = 0;
    let totalCalories = 0;
    let totalVolumeKg = 0;

    logsInMonth.forEach((log: any) => {
      totalSeconds += log.duration_seconds || log.duration || 0;
      totalCalories += log.calories_burned || 0;
      totalVolumeKg += calculateVolume(log);
    });

    const uniqueDays = new Set(
      logsInMonth.map((l: any) => {
        const d = new Date(l.workout_date);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    ).size;

    return {
      count: logsInMonth.length,
      uniqueDays,
      totalSeconds,
      totalCalories,
      totalVolumeKg,
    };
  }, [workoutLog, year, month]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  };

  const formatVolume = (kg: number) => {
    if (kg >= 10000) {
      return `${(kg / 1000).toLocaleString('es-ES', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} t`;
    }
    return `${Math.round(kg).toLocaleString('es-ES')} kg`;
  };

  // Month Grid Calculation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Monday as first day of week: offset 0 for Mon, 6 for Sun
  const startDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
  const currentDayNum = now.getDate();

  const handlePrevMonth = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleResetToday = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setCalendarDate(new Date());
    setSelectedDateStr(todayStr);
  };

  const selectedDayLogs = workoutsByDate[selectedDateStr] || [];

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDateStr) return '';
    const parts = selectedDateStr.split('-');
    const d = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
    return d.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDateStr]);

  return (
    <View style={styles.container}>
      {/* 1. Month KPIs */}
      <View style={styles.kpiRow}>
        <StatBadge
          label="Sesiones"
          value={monthStats.count}
          trend={`${monthStats.uniqueDays} días act.`}
          icon={Dumbbell}
        />
        <StatBadge
          label="Tiempo"
          value={formatDuration(monthStats.totalSeconds)}
          trend={monthName}
          icon={Clock}
        />
      </View>
      <View style={styles.kpiRow}>
        <StatBadge
          label="Volumen"
          value={formatVolume(monthStats.totalVolumeKg)}
          trend="Carga total"
          icon={TrendingUp}
        />
        <StatBadge
          label="Calorías"
          value={
            monthStats.totalCalories > 0
              ? monthStats.totalCalories.toLocaleString('es-ES')
              : '—'
          }
          unit="kcal"
          icon={Flame}
        />
      </View>

      {/* 2. Calendar Glass Card */}
      <View
        style={[
          styles.calendarCard,
          {
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        {/* Month Navigator Header */}
        <View style={styles.calHeader}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.calNavBtn}>
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.calTitleWrap}>
            <CalendarIcon size={16} color={colors.tint} />
            <Text style={[styles.calMonthTitle, { color: colors.text }]}>
              {monthName} <Text style={{ color: colors.tint }}>{year}</Text>
            </Text>
            {!isCurrentMonth && (
              <TouchableOpacity
                onPress={handleResetToday}
                style={[styles.todayPill, { backgroundColor: colors.tint }]}
              >
                <RotateCcw size={10} color={accentText} />
                <Text style={[styles.todayPillText, { color: accentText }]}>
                  Hoy
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity onPress={handleNextMonth} style={styles.calNavBtn}>
            <ChevronRight size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Weekday headers */}
        <View style={styles.weekdaysRow}>
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <Text
              key={d}
              style={[styles.weekdayText, { color: colors.textSecondary }]}
            >
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar Days Grid */}
        <View style={styles.daysGrid}>
          {/* Empty leading cells */}
          {Array.from({ length: startDayOffset }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}

          {/* Month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
              dayNum
            ).padStart(2, '0')}`;
            const dayLogs = workoutsByDate[dayStr] || [];
            const hasWorkout = dayLogs.length > 0;
            const isToday = isCurrentMonth && currentDayNum === dayNum;
            const isSelected = selectedDateStr === dayStr;

            return (
              <TouchableOpacity
                key={dayNum}
                activeOpacity={0.7}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setSelectedDateStr(dayStr);
                }}
                style={[
                  styles.dayCell,
                  hasWorkout && {
                    backgroundColor: colors.tint,
                  },
                  isToday &&
                    !hasWorkout && {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.06)',
                    },
                  isSelected && {
                    borderWidth: 2,
                    borderColor: hasWorkout ? '#ffffff' : colors.tint,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayNumText,
                    {
                      color: hasWorkout
                        ? accentText
                        : isToday
                        ? colors.text
                        : colors.textSecondary,
                      fontWeight: hasWorkout || isToday ? '800' : '600',
                    },
                  ]}
                >
                  {dayNum}
                </Text>

                {hasWorkout && dayLogs.length > 1 && (
                  <View style={styles.multiBadge}>
                    <Text style={styles.multiBadgeText}>{dayLogs.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View
          style={[
            styles.calLegend,
            {
              borderTopColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.tint }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              Entrenamiento
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
            />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              Descanso
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                {
                  borderWidth: 2,
                  borderColor: colors.tint,
                  backgroundColor: 'transparent',
                },
              ]}
            />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              Seleccionado
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Selected Day Summary Card */}
      <View
        style={[
          styles.daySummaryCard,
          {
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.summaryHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.summarySubtitle, { color: colors.tint }]}>
              Día Seleccionado
            </Text>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              {formattedSelectedDate}
            </Text>
          </View>
          {selectedDayLogs.length > 0 && (
            <View
              style={[
                styles.sessionsCountPill,
                { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
              ]}
            >
              <Text
                style={[styles.sessionsCountPillText, { color: colors.tint }]}
              >
                {selectedDayLogs.length}{' '}
                {selectedDayLogs.length === 1 ? 'sesión' : 'sesiones'}
              </Text>
            </View>
          )}
        </View>

        {selectedDayLogs.length > 0 ? (
          <View style={{ gap: 10, marginTop: 12 }}>
            {selectedDayLogs.map((log: any) => {
              const exercisesCount = log.WorkoutLogDetails?.length || 0;
              const setsCount =
                log.WorkoutLogDetails?.reduce(
                  (acc: number, ex: any) =>
                    acc + (ex.WorkoutLogSets?.length || 0),
                  0
                ) || 0;
              const durationMin = Math.round(
                (log.duration_seconds || log.duration || 0) / 60
              );
              const volume = calculateVolume(log);

              return (
                <View
                  key={log.id}
                  style={[
                    styles.sessionItem,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.03)',
                    },
                  ]}
                >
                  <View style={styles.sessionTop}>
                    <Text style={[styles.sessionRoutine, { color: colors.text }]}>
                      {getRoutineName(log)}
                    </Text>
                    <View style={styles.durationPill}>
                      <Clock size={11} color={colors.tint} />
                      <Text
                        style={[styles.durationPillText, { color: colors.tint }]}
                      >
                        {durationMin} min
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[styles.sessionMeta, { color: colors.textSecondary }]}
                  >
                    {exercisesCount} ejercicios · {setsCount} series
                  </Text>

                  {volume > 0 && (
                    <View style={styles.sessionMetricsRow}>
                      <Text
                        style={[
                          styles.sessionMetricText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Volumen:{' '}
                        <Text style={{ color: colors.text, fontWeight: '700' }}>
                          {formatVolume(volume)}
                        </Text>
                      </Text>
                      {log.calories_burned > 0 && (
                        <Text
                          style={[
                            styles.sessionMetricText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Calorías:{' '}
                          <Text
                            style={{ color: colors.text, fontWeight: '700' }}
                          >
                            {log.calories_burned} kcal
                          </Text>
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                setShowDetailModal(true);
              }}
              style={[styles.viewDetailsBtn, { backgroundColor: colors.tint }]}
            >
              <CheckCircle2 size={16} color={accentText} />
              <Text style={[styles.viewDetailsBtnText, { color: accentText }]}>
                Ver detalles y ejercicios completos
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.restDayContainer}>
            <View style={styles.restDayIconBox}>
              <Sparkles size={22} color={colors.textSecondary} />
            </View>
            <Text style={[styles.restDayTitle, { color: colors.text }]}>
              Día de descanso
            </Text>
            <Text
              style={[styles.restDayDesc, { color: colors.textSecondary }]}
            >
              No hay entrenamientos registrados este día. El descanso y la
              recuperación son fundamentales para progresar.
            </Text>
          </View>
        )}
      </View>

      {/* Daily Detail Modal */}
      <DailyDetailModal
        visible={showDetailModal}
        logs={selectedDayLogs}
        onClose={() => setShowDetailModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  calendarCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  calTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calMonthTitle: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  todayPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '800',
    width: 38,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 8,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayNumText: {
    fontSize: 13,
  },
  multiBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000000',
  },
  calLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  daySummaryCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    overflow: 'hidden',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  summarySubtitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  sessionsCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sessionsCountPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sessionItem: {
    padding: 12,
    borderRadius: 16,
    gap: 4,
  },
  sessionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionRoutine: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  durationPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sessionMeta: {
    fontSize: 12,
  },
  sessionMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  sessionMetricText: {
    fontSize: 11,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 18,
    marginTop: 6,
  },
  viewDetailsBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  restDayContainer: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  restDayIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  restDayTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  restDayDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 260,
  },
});
