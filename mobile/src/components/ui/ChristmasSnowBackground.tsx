import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { useIsFocused } from 'expo-router';
import { Snowflake } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';

const { width, height } = Dimensions.get('window');

interface StaticFlake {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  rotation: number;
  isFrostTint: boolean;
}

const STATIC_FLAKES: StaticFlake[] = Array.from({ length: 18 }).map((_, i) => ({
  id: i,
  x: ((i * 67 + 19) % 94) * (width / 100),
  y: ((i * 83 + 11) % 92) * (height / 100),
  size: 10 + (i % 4) * 3,
  opacity: 0.16 + (i % 4) * 0.06,
  rotation: (i * 25) % 60,
  isFrostTint: i % 3 === 0,
}));

function StaticSnowGlints() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {STATIC_FLAKES.map((f) => (
        <View
          key={f.id}
          style={{
            position: 'absolute',
            left: f.x,
            top: f.y,
            opacity: f.opacity,
            transform: [{ rotate: `${f.rotation}deg` }],
          }}
        >
          <Snowflake
            size={f.size}
            color={f.isFrostTint ? '#bae6fd' : '#ffffff'}
            strokeWidth={1.7}
          />
        </View>
      ))}
    </View>
  );
}

interface FallingLayerConfig {
  id: number;
  startX: number;
  size: number;
  duration: number;
  delay: number;
  sway: number;
  opacity: number;
  spinDeg: number;
  isFrost: boolean;
}

function FallingFlakeLayer({ config, focused }: { config: FallingLayerConfig; focused: boolean }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!focused) {
      progress.stopAnimation();
      return;
    }

    progress.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(config.delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: config.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [config.delay, config.duration, focused, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-32, height + 32],
  });

  const translateX = progress.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0, config.sway, -config.sway * 0.7, config.sway * 0.3],
  });

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${config.spinDeg}deg`],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: config.startX,
        top: 0,
        opacity: config.opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    >
      <Snowflake
        size={config.size}
        color={config.isFrost ? '#bae6fd' : '#ffffff'}
        strokeWidth={1.8}
      />
    </Animated.View>
  );
}

export function ChristmasSnowBackground() {
  const isFocused = useIsFocused();
  const theme = useAppStore(state => state.theme);
  const christmasEffectsEnabled = useAppStore(state => (state as any).christmasEffectsEnabled !== false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const isChristmas = theme === 'christmas';

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove?.();
  }, []);

  const animatedFlakes = useMemo<FallingLayerConfig[]>(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        id: i,
        startX: ((i * 59 + 13) % 94) * (width / 100),
        size: 11 + (i % 4) * 3,
        duration: 8500 + (i % 5) * 1800,
        delay: (i % 6) * 1200,
        sway: i % 2 === 0 ? 22 : -20,
        opacity: 0.24 + (i % 4) * 0.08,
        spinDeg: i % 2 === 0 ? 180 : -180,
        isFrost: i % 3 === 0,
      })),
    []
  );

  if (!isChristmas) return null;

  const shouldAnimate = isFocused && christmasEffectsEnabled && !reduceMotion;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <StaticSnowGlints />
      {shouldAnimate &&
        animatedFlakes.map((flake) => (
          <FallingFlakeLayer key={flake.id} config={flake} focused={shouldAnimate} />
        ))}
    </View>
  );
}
