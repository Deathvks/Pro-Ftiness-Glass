import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { NutritionCharts } from './ProgressCharts';

export function NutritionProgressView() {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const nutritionSummary = useAppStore(state => state.nutritionSummary);
  const fetchNutritionSummary = useAppStore(state => state.fetchNutritionSummary);

  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    if (fetchNutritionSummary) {
      fetchNutritionSummary(date.getMonth() + 1, date.getFullYear());
    }
  }, [date, fetchNutritionSummary]);

  const changeMonth = (d: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setDate(prev => new Date(prev.getFullYear(), prev.getMonth() + d, 1));
  };

  const chartData = useMemo(() => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const today = new Date();
    const isCurrent = y === today.getFullYear() && m === today.getMonth();
    const lastDay = isCurrent ? today.getDate() : new Date(y, m + 1, 0).getDate();

    const dataMap = new Map<string, any>(
      Array.from({ length: lastDay }, (_, i) => {
        const day = i + 1;
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return [
          dateStr,
          {
            date: dateStr,
            day,
            Calorías: 0,
            Proteínas: 0,
            Carbs: 0,
            Grasas: 0,
            Agua: 0,
          },
        ];
      })
    );

    if (nutritionSummary?.nutrition) {
      nutritionSummary.nutrition.forEach((n: any) => {
        if (dataMap.has(n.date)) {
          Object.assign(dataMap.get(n.date), {
            Calorías: parseFloat(n.total_calories) || 0,
            Proteínas: parseFloat(n.total_protein) || 0,
            Carbs: parseFloat(n.total_carbs) || 0,
            Grasas: parseFloat(n.total_fats) || 0,
          });
        }
      });
    }

    if (nutritionSummary?.water) {
      nutritionSummary.water.forEach((w: any) => {
        if (dataMap.has(w.log_date)) {
          dataMap.get(w.log_date).Agua = w.quantity_ml || 0;
        }
      });
    }

    return Array.from(dataMap.values());
  }, [nutritionSummary, date]);

  const isNextDisabled =
    date.getFullYear() === new Date().getFullYear() &&
    date.getMonth() === new Date().getMonth();

  return (
    <View style={styles.container}>
      {/* Month Navigator Header */}
      <View
        style={[
          styles.navBar,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.06)'
              : 'rgba(0, 0, 0, 0.04)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => changeMonth(-1)}
          style={[
            styles.navBtn,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.navTitleRow}>
          <CalendarIcon size={16} color={colors.tint} />
          <Text style={[styles.navTitle, { color: colors.text }]}>
            {date.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => changeMonth(1)}
          disabled={isNextDisabled}
          style={[
            styles.navBtn,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.05)',
            },
            isNextDisabled && { opacity: 0.3 },
          ]}
        >
          <ChevronRight size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Nutrition Charts */}
      <NutritionCharts chartData={chartData} />
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
    borderRadius: 24,
    borderWidth: 1,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'capitalize',
    letterSpacing: -0.2,
  },
});
