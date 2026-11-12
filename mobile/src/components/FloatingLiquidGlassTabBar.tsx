import React, { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import * as Haptics from 'expo-haptics';
import { Home, Users, Flame, Zap, LayoutGrid } from 'lucide-react-native';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getInactiveTabColor, getThemeBaseBackground, getThemeSurfaceMode } from '@/constants/theme';

const TAB_ITEMS = {
  index: { label: 'Dashboard', icon: Home },
  social: { label: 'Comunidad', icon: Users },
  nutrition: { label: 'Nutrición', icon: Flame },
  routines: { label: 'Rutinas', icon: Zap },
  hub: { label: 'Menú', icon: LayoutGrid },
};

const CAPSULE_HEIGHT = 60;
const DROP_WIDTH = 48;
const DROP_HEIGHT = 44;
const SLIDE = { duration: 360, easing: Easing.bezier(0.22, 1, 0.36, 1) };
const RETURN_TO_SHAPE = { stiffness: 270, damping: 21, mass: 0.65, overshootClamping: true };

const SURFACES = {
  oled: { alpha: 'c9', border: '#ffffff1f', drop: '#ffffff1a', dropBorder: '#ffffff2e' },
  dark: { alpha: 'bd', border: '#ffffff26', drop: '#ffffff1f', dropBorder: '#ffffff33' },
  light: { alpha: 'd9', border: '#00000014', drop: '#ffffffbf', dropBorder: '#00000014' },
};

function dropLeft(index: number, cell: number) {
  'worklet';
  return (index + 0.5) * cell - DROP_WIDTH / 2;
}

const TabItem = memo(function TabItem({ name, index, selected, highlighted, color, onPress }: {
  name: keyof typeof TAB_ITEMS;
  index: number;
  selected: boolean;
  highlighted: boolean;
  color: string;
  onPress: (index: number) => void;
}) {
  const { icon: Icon, label } = TAB_ITEMS[name];
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={() => onPress(index)}
      style={styles.tabButton}
    >
      <Icon size={highlighted ? 25 : 22} color={color} strokeWidth={highlighted ? 2.5 : 1.9} />
    </Pressable>
  );
});

export function FloatingLiquidGlassTabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const colors = useAppColors();
  const activeTheme = useAppStore(state => state.theme);
  const surface = getThemeSurfaceMode(activeTheme);
  const theme = SURFACES[surface];
  const capsuleBackground = getThemeBaseBackground(activeTheme) + theme.alpha;
  const inactiveInk = getInactiveTabColor(activeTheme, colors.text);
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const activeIndex = Math.max(0, state.index);
  const count = state.routes.length;
  const cell = count ? width / count : 0;
  const rtl = I18nManager.isRTL;

  const position = useSharedValue(0);
  const destination = useSharedValue<number | null>(null);
  const stretch = useSharedValue(0);
  const dragging = useSharedValue(false);
  const startPosition = useSharedValue(0);
  const dragIndex = useSharedValue(activeIndex);
  const previousCell = useRef(0);

  const moveDrop = useCallback((target: number, immediate: boolean) => {
    'worklet';
    if (dragging.get() || (!immediate && destination.get() === target)) return;
    const distance = Math.abs(target - position.get());
    destination.set(target);
    if (immediate || reduceMotion) {
      position.set(target);
      stretch.set(0);
      return;
    }
    position.set(withTiming(target, SLIDE));
    stretch.set(distance > 8
      ? withSequence(withTiming(1, { duration: 85 }), withDelay(65, withSpring(0, RETURN_TO_SHAPE)))
      : withSpring(0, RETURN_TO_SHAPE));
  }, [destination, dragging, position, reduceMotion, stretch]);

  useLayoutEffect(() => {
    if (!cell) return;
    const resized = previousCell.current !== cell;
    previousCell.current = cell;
    scheduleOnUI(moveDrop, dropLeft(activeIndex, cell), resized);
  }, [activeIndex, cell, moveDrop]);

  const selectTab = useCallback((index: number, fromDrag = false) => {
    const route = state.routes[index];
    if (!route) return;
    const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (event.defaultPrevented) {
      if (fromDrag) scheduleOnUI(moveDrop, dropLeft(activeIndex, cell), false);
      return;
    }
    if (index === activeIndex) return;

    if (!fromDrag && cell) scheduleOnUI(moveDrop, dropLeft(index, cell), false);
    if (!fromDrag && useAppStore.getState().hapticsEnabled !== false) {
      void Haptics.selectionAsync().catch(() => {});
    }
    navigateToTab(route.key);
  }, [activeIndex, cell, emitter, moveDrop, navigateToTab, state.routes]);

  const updateHover = useCallback((index: number, feedback: boolean) => {
    setHovered(index);
    if (feedback && useAppStore.getState().hapticsEnabled !== false) {
      void Haptics.selectionAsync().catch(() => {});
    }
  }, []);

  const finishDrag = useCallback((index: number, released: boolean) => {
    setHovered(null);
    if (released && index !== activeIndex) selectTab(index, true);
  }, [activeIndex, selectTab]);

  const pan = useMemo(() => Gesture.Pan()
    .enabled(cell > 0 && count > 1)
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    .onStart(event => {
      'worklet';
      cancelAnimation(position);
      dragging.set(true);
      destination.set(null);
      startPosition.set(position.get() - (rtl ? -event.translationX : event.translationX));
      dragIndex.set(activeIndex);
      stretch.set(reduceMotion ? 0 : withTiming(1, { duration: 90 }));
      scheduleOnRN(updateHover, activeIndex, false);
    })
    .onUpdate(event => {
      'worklet';
      const min = dropLeft(0, cell);
      const max = dropLeft(count - 1, cell);
      const delta = rtl ? -event.translationX : event.translationX;
      const x = Math.min(max, Math.max(min, startPosition.get() + delta));
      position.set(x);
      const index = Math.round((x - min) / cell);
      if (index !== dragIndex.get()) {
        dragIndex.set(index);
        scheduleOnRN(updateHover, index, true);
      }
    })
    .onFinalize((_event, released) => {
      'worklet';
      if (!dragging.get()) return;
      dragging.set(false);
      const index = released ? dragIndex.get() : activeIndex;
      moveDrop(dropLeft(index, cell), false);
      scheduleOnRN(finishDrag, index, released);
    }),
  [activeIndex, cell, count, destination, dragIndex, dragging, finishDrag, moveDrop, position, reduceMotion, rtl, startPosition, stretch, updateHover]);

  const dropStyle = useAnimatedStyle(() => ({
    opacity: dragging.get() || destination.get() !== null ? 1 : 0,
    transform: [
      { translateX: rtl ? -position.get() : position.get() },
      { scaleX: 1 + stretch.get() * 0.30 },
      { scaleY: 1 - stretch.get() * 0.25 },
    ],
  }));

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <GestureDetector gesture={pan}>
        <View style={[styles.capsule, { backgroundColor: capsuleBackground, borderColor: theme.border }]}>
          <View style={styles.tabRow} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
            <Animated.View pointerEvents="none" style={[styles.drop, { backgroundColor: theme.drop, borderColor: theme.dropBorder }, dropStyle]} />
            {state.routes.map((route, index) => {
              const name = route.name as keyof typeof TAB_ITEMS;
              if (!TAB_ITEMS[name]) return null;
              const highlighted = (hovered ?? activeIndex) === index;
              return <TabItem key={route.key} name={name} index={index} selected={activeIndex === index}
                highlighted={highlighted} color={highlighted ? colors.tint : inactiveInk} onPress={selectTab} />;
            })}
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 1000 },
  capsule: {
    width: '100%',
    maxWidth: 380,
    height: CAPSULE_HEIGHT,
    borderRadius: CAPSULE_HEIGHT / 2,
    borderWidth: 1,
    paddingHorizontal: 10,
    elevation: 2,
  },
  tabRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  drop: {
    position: 'absolute',
    top: (CAPSULE_HEIGHT - 2 - DROP_HEIGHT) / 2,
    start: 0,
    width: DROP_WIDTH,
    height: DROP_HEIGHT,
    borderRadius: DROP_HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabButton: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' },
});
