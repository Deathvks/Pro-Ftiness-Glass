import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastColor } from '@/utils/colorUtils';

export type PeriodType = '7D' | '14D' | '1M' | '3M' | '6M' | '1A' | 'Todo';

interface PeriodFilterProps {
  periods?: PeriodType[];
  activePeriod: PeriodType;
  onChange: (period: PeriodType) => void;
}

export function PeriodFilter({
  periods = ['7D', '1M', '3M', '6M', '1A', 'Todo'],
  activePeriod,
  onChange,
}: PeriodFilterProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const activeTextColor = getContrastColor(colors.tint, theme);

  const handleSelect = (p: PeriodType) => {
    if (p === activePeriod) return;
    try {
      Haptics.selectionAsync();
    } catch {}
    onChange(p);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {periods.map(p => {
          const isActive = activePeriod === p;
          return (
            <TouchableOpacity
              key={p}
              onPress={() => handleSelect(p)}
              activeOpacity={0.8}
              style={[
                styles.pill,
                isActive && {
                  backgroundColor: colors.tint,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color: isActive ? activeTextColor : colors.textSecondary,
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Helper to filter items by period based on timestamp/date
export function filterDataByPeriod<T>(
  data: T[],
  period: PeriodType,
  dateExtractor: (item: T) => number
): T[] {
  if (!data || !data.length || period === 'Todo') return data || [];

  const cutoffDate = new Date();
  cutoffDate.setHours(0, 0, 0, 0);

  if (period === '7D') {
    cutoffDate.setDate(cutoffDate.getDate() - 7);
  } else if (period === '14D') {
    cutoffDate.setDate(cutoffDate.getDate() - 14);
  } else if (period === '1M') {
    cutoffDate.setMonth(cutoffDate.getMonth() - 1);
  } else if (period === '3M') {
    cutoffDate.setMonth(cutoffDate.getMonth() - 3);
  } else if (period === '6M') {
    cutoffDate.setMonth(cutoffDate.getMonth() - 6);
  } else if (period === '1A') {
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
  }

  const cutoffTime = cutoffDate.getTime();
  return data.filter(item => {
    const time = dateExtractor(item);
    return !isNaN(time) && time >= cutoffTime;
  });
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 3,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  pillText: {
    fontSize: 12,
    letterSpacing: -0.2,
  },
});
