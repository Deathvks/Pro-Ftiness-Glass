import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

export interface StatBadgeProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  isPositive?: boolean;
  icon?: LucideIcon;
  onPress?: () => void;
}

export function StatBadge({
  label,
  value,
  unit,
  trend,
  isPositive,
  icon: Icon,
  onPress,
}: StatBadgeProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const ContainerComponent = onPress ? TouchableOpacity : View;

  return (
    <ContainerComponent
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.06)',
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text
          numberOfLines={1}
          style={[styles.label, { color: colors.textSecondary }]}
        >
          {label}
        </Text>
        {Icon && <Icon size={14} color={colors.textSecondary} strokeWidth={2} />}
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
        {unit && (
          <Text style={[styles.unit, { color: colors.textSecondary }]}>
            {unit}
          </Text>
        )}
      </View>

      {trend && (
        <View style={styles.trendWrap}>
          <View
            style={[
              styles.trendPill,
              {
                backgroundColor:
                  isPositive === true
                    ? 'rgba(16, 185, 129, 0.12)'
                    : isPositive === false
                    ? 'rgba(244, 63, 94, 0.12)'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            {isPositive === true && (
              <ArrowUpRight size={11} color="#10b981" strokeWidth={2.5} />
            )}
            {isPositive === false && (
              <ArrowDownRight size={11} color="#f43f5e" strokeWidth={2.5} />
            )}
            <Text
              numberOfLines={1}
              style={[
                styles.trendText,
                {
                  color:
                    isPositive === true
                      ? '#10b981'
                      : isPositive === false
                      ? '#f43f5e'
                      : colors.textSecondary,
                },
              ]}
            >
              {trend}
            </Text>
          </View>
        </View>
      )}
    </ContainerComponent>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 105,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginVertical: 2,
  },
  value: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  trendWrap: {
    marginTop: 4,
    flexDirection: 'row',
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
    maxWidth: '100%',
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
