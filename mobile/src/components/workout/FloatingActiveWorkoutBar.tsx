/* mobile/src/components/workout/FloatingActiveWorkoutBar.tsx */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter, useSegments } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Dumbbell, ChevronRight } from 'lucide-react-native';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getThemeBaseBackground, getThemeSurfaceMode } from '@/constants/theme';
import { getContrastTextColor } from '@/utils/colorUtils';
import {
  FLOATING_TAB_BAR_HEIGHT,
  getFloatingTabBarBottomOffset,
} from '@/components/FloatingLiquidGlassTabBar';

const HIDDEN_PATH_PREFIXES = [
  '/workout',
  '/active-cardio',
  '/quick-cardio',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
];

const TAB_BAR_PATHS = new Set(['/', '/index', '/social', '/nutrition', '/routines', '/hub']);

const CAPSULE_ALPHA = {
  oled: 'eb',
  dark: 'e3',
  light: 'f0',
};

function formatElapsedTime(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function FloatingActiveWorkoutBar() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();

  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const theme = useAppStore(state => state.theme) || 'oled';
  const activeWorkout = useAppStore(state => state.activeWorkout);
  const workoutStartTime = useAppStore(state => state.workoutStartTime);
  const workoutAccumulatedTime = useAppStore(state => state.workoutAccumulatedTime) || 0;
  const isWorkoutPaused = useAppStore(state => state.isWorkoutPaused);

  const [clock, setClock] = useState(Date.now);
  const [pulseAnim] = useState(() => new Animated.Value(1));

  const isRunning = Boolean(workoutStartTime && !isWorkoutPaused);

  useEffect(() => {
    if (!activeWorkout || !isRunning) return;
    const interval = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeWorkout, isRunning, workoutStartTime]);

  useEffect(() => {
    if (!activeWorkout || !isRunning) {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [activeWorkout, isRunning, pulseAnim]);

  if (!isAuthenticated || !activeWorkout) return null;
  if (pathname && HIDDEN_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return null;
  }

  const runningMs = isRunning && workoutStartTime ? Math.max(0, clock - workoutStartTime) : 0;
  const elapsedSeconds = Math.floor((workoutAccumulatedTime + runningMs) / 1000);

  // Solo mostrar si el entrenamiento lleva iniciado >= 1s (mismo criterio que "Minimizar y navegar")
  if (elapsedSeconds < 1) return null;

  const surface = getThemeSurfaceMode(theme);
  const isDark = surface !== 'light';
  const baseBg = getThemeBaseBackground(theme);
  const capsuleBg = `${baseBg}${CAPSULE_ALPHA[surface]}`;
  const tintContrast = getContrastTextColor(colors.tint);

  const isInTabs =
    (segments as string[]).includes('(tabs)') || (pathname ? TAB_BAR_PATHS.has(pathname) : false);

  const bottomOffset = isInTabs
    ? Platform.OS === 'android'
      ? getFloatingTabBarBottomOffset(insets.bottom) + FLOATING_TAB_BAR_HEIGHT + 10
      : insets.bottom + 62
    : Math.max(insets.bottom, 16) + 8;

  const handleResumeWorkout = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    router.push('/workout');
  };

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver al entrenamiento en curso"
        onPress={handleResumeWorkout}
        style={({ pressed }) => [
          styles.pill,
          {
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : capsuleBg,
            borderColor: colors.tint + '66',
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        {Platform.OS === 'ios' && (
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />
        )}

        <Animated.View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.tint, transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Dumbbell size={16} color={tintContrast} strokeWidth={2.4} />
        </Animated.View>

        <View style={styles.textCol}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {activeWorkout.routineName || activeWorkout.name || 'Entrenamiento'}
          </Text>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isWorkoutPaused ? '#f59e0b' : '#22c55e' },
              ]}
            />
            <Text style={[styles.timerText, { color: colors.tint }]}>
              {formatElapsedTime(elapsedSeconds)}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {isWorkoutPaused ? '· En pausa' : '· En curso'}
            </Text>
          </View>
        </View>

        <View style={[styles.ctaPill, { backgroundColor: colors.tint }]}>
          <Text style={[styles.ctaText, { color: tintContrast }]}>Volver</Text>
          <ChevronRight size={14} color={tintContrast} strokeWidth={2.6} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 990,
  },
  pill: {
    width: '100%',
    maxWidth: 380,
    minHeight: 54,
    borderRadius: 27,
    borderCurve: 'continuous',
    borderWidth: 1.25,
    paddingVertical: 7,
    paddingLeft: 9,
    paddingRight: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  title: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  subtitle: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  ctaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    flexShrink: 0,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
