import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';

interface DateNavigatorProps {
  selectedDate: string;
  onDateChange: (newDate: string) => void;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({ selectedDate, onDateChange }) => {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;

  // Format date in Spanish
  const [year, month, day] = selectedDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthsOfYear = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const weekdayName = daysOfWeek[dateObj.getDay()];
  const monthName = monthsOfYear[dateObj.getMonth()];
  const formattedDate = `${weekdayName}, ${day} de ${monthName}`;

  const changeDay = (amount: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const newDate = new Date(dateObj);
    newDate.setDate(newDate.getDate() + amount);
    const y = newDate.getFullYear();
    const m = String(newDate.getMonth() + 1).padStart(2, '0');
    const d = String(newDate.getDate()).padStart(2, '0');
    onDateChange(`${y}-${m}-${d}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.glassWrapper}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.inner,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.4)',
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => changeDay(-1)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.arrowButton}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.dateCenter}>
            <Text style={[styles.dateText, { color: colors.text }]} numberOfLines={1}>
              {formattedDate}
            </Text>
            {isToday && (
              <View style={[styles.todayBadge, { backgroundColor: colors.tint + '20', borderColor: colors.tint + '40' }]}>
                <Text style={[styles.todayText, { color: colors.tint }]}>HOY</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => changeDay(1)}
            disabled={isToday}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[styles.arrowButton, isToday && styles.arrowDisabled]}
            activeOpacity={0.7}
          >
            <ChevronRight size={20} color={isToday ? colors.textMuted : colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  glassWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
  },
  arrowButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {
    opacity: 0.35,
  },
  dateCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  todayBadge: {
    marginTop: 3,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  todayText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
