import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Play, Flag } from 'lucide-react-native';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getWorkoutTimeWindow } from '@/utils/dateUtils';

interface WorkoutTimeRangeProps {
  startDate: any;
  durationSeconds?: number;
  showYear?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function WorkoutTimeRange({
  startDate,
  durationSeconds = 0,
  showYear = false,
  style,
}: WorkoutTimeRangeProps) {
  const colors = useAppColors();
  const theme = useAppStore((state: any) => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const windowInfo = getWorkoutTimeWindow(startDate, durationSeconds);
  if (!windowInfo) return null;

  const startDateText = showYear ? windowInfo.startDateLabel : windowInfo.startShortDateLabel;
  const endDateText = showYear ? windowInfo.endDateLabel : windowInfo.endShortDateLabel;

  const pillSurfaceStyle = {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.035)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
  };

  return (
    <View style={[styles.grid, style]}>
      <View style={[styles.pillCard, pillSurfaceStyle]}>
        <View style={styles.labelRow}>
          <Play size={11} color={colors.tint} />
          <Text style={[styles.labelText, { color: colors.textSecondary }]}>Inicio</Text>
        </View>
        <Text
          numberOfLines={1}
          style={[styles.valueText, { color: colors.text }]}
        >
          {startDateText} · {windowInfo.startTimeLabel}
        </Text>
      </View>

      <View style={[styles.pillCard, pillSurfaceStyle]}>
        <View style={styles.labelRow}>
          <Flag size={11} color={colors.textSecondary} />
          <Text style={[styles.labelText, { color: colors.textSecondary }]}>Fin</Text>
          {windowInfo.crossesMidnight && (
            <View style={[styles.midnightBadge, { backgroundColor: colors.tint + '22' }]}>
              <Text style={[styles.midnightBadgeText, { color: colors.tint }]}>+1 día</Text>
            </View>
          )}
        </View>
        <Text
          numberOfLines={1}
          style={[styles.valueText, { color: colors.text }]}
        >
          {endDateText} · {windowInfo.endTimeLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillCard: {
    flexGrow: 1,
    flexBasis: 145,
    minWidth: 138,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
  },
  midnightBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  midnightBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  valueText: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
    textAlign: 'right',
  },
});
