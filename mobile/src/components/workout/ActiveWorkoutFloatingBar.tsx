/* mobile/src/components/workout/ActiveWorkoutFloatingBar.tsx */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dumbbell, ArrowRight } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastTextColor } from '@/utils/colorUtils';

export const ActiveWorkoutFloatingBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const activeWorkout = useAppStore(state => state.activeWorkout);
  const workoutStartTime = useAppStore(state => state.workoutStartTime);
  const isWorkoutPaused = useAppStore(state => state.isWorkoutPaused);
  const workoutAccumulatedTime = useAppStore(state => state.workoutAccumulatedTime);

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeWorkout) return;

    const compute = () => {
      const state = useAppStore.getState();
      const { workoutStartTime: sTime, isWorkoutPaused: isPaused, workoutAccumulatedTime: accTime } = state;
      if (!sTime) return Math.floor((accTime || 0) / 1000);
      if (isPaused) return Math.floor((accTime || 0) / 1000);
      const runningMs = Date.now() - sTime;
      return Math.floor(((accTime || 0) + runningMs) / 1000);
    };

    setElapsed(compute());
    const interval = setInterval(() => setElapsed(compute()), 1000);
    return () => clearInterval(interval);
  }, [activeWorkout, workoutStartTime, isWorkoutPaused, workoutAccumulatedTime]);

  // Si estamos dentro de la pantalla de entrenamiento o no hay entrenamiento, no mostrar
  const isWorkoutScreen = pathname === '/workout' || pathname?.includes('workout');

  if (!activeWorkout || isWorkoutScreen) {
    return null;
  }

  const formatTimer = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleReturn = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    router.push('/workout');
  };

  const btnTextColor = getContrastTextColor(colors.tint);
  const bottomPosition = insets.bottom > 0 ? insets.bottom + 56 : 68;

  return (
    <View
      style={[
        styles.wrapper,
        {
          bottom: bottomPosition,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleReturn}
        style={[
          styles.card,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.1)',
            backgroundColor: isDark ? 'rgba(16, 16, 22, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          },
        ]}
      >
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
        />

        {/* Indicador de estado y nombre de rutina */}
        <View style={styles.leftCol}>
          <View style={[styles.iconBox, { backgroundColor: colors.tint + '20' }]}>
            <Dumbbell size={16} color={colors.tint} strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={[
                  styles.pulseDot,
                  { backgroundColor: isWorkoutPaused ? '#f59e0b' : '#10b981' },
                ]}
              />
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                {isWorkoutPaused ? 'EN PAUSA' : 'EN CURSO'}
              </Text>
            </View>
            <Text style={[styles.routineName, { color: colors.text }]} numberOfLines={1}>
              {activeWorkout.routineName || activeWorkout.name || 'Entrenamiento Libre'}
            </Text>
          </View>
        </View>

        {/* Cronómetro y botón Volver */}
        <View style={styles.rightCol}>
          <Text style={[styles.timerText, { color: colors.tint }]}>
            {formatTimer(elapsed)}
          </Text>

          <View style={[styles.returnBtn, { backgroundColor: colors.tint }]}>
            <Text style={[styles.returnBtnText, { color: btnTextColor }]}>
              Volver
            </Text>
            <ArrowRight size={13} color={btnTextColor} strokeWidth={2.8} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 99990,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 12,
    overflow: 'hidden',
  },
  leftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    marginRight: 8,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  routineName: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  returnBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
