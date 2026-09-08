import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, PanResponder, LayoutChangeEvent, Easing } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { GlassView } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = Colors[theme] || Colors.oled;

  const widthRef = useRef(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const dropTranslateX = useRef(new Animated.Value(0)).current;
  const dropScaleX = useRef(new Animated.Value(1)).current;
  const dropScaleY = useRef(new Animated.Value(1)).current;
  const currentDragX = useRef(0);
  
  const getTargetX = (index: number, width: number) => {
    if (width === 0) return -100; // Put them out of range initially
    const tabsCount = state.routes.length;
    const tabWidth = width / tabsCount;
    return 8 + (index * tabWidth) + (tabWidth / 2) - 30; // 30 is half of 60
  };

  useEffect(() => {
    if (containerWidth > 0) {
      // Travel animation
      Animated.timing(dropTranslateX, {
        toValue: getTargetX(state.index, containerWidth),
        duration: 400,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }).start();

      // Liquid stretch animation during travel (stretches wide, squashes flat)
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dropScaleX, { toValue: 1.4, duration: 200, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }),
          Animated.timing(dropScaleY, { toValue: 0.8, duration: 200, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(dropScaleX, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
          Animated.spring(dropScaleY, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
        ])
      ]).start();

      currentDragX.current = getTargetX(state.index, containerWidth);
    }
  }, [state.index, containerWidth]);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const newWidth = e.nativeEvent.layout.width - 16;
    if (containerWidth !== newWidth) {
      widthRef.current = newWidth;
      setContainerWidth(newWidth);
      const targetX = getTargetX(state.index, newWidth);
      dropTranslateX.setValue(targetX);
      currentDragX.current = targetX;
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 5,
      onPanResponderGrant: () => {
        // Finger presses down: bulge the drop out massively (taller than navbar)
        Animated.parallel([
          Animated.spring(dropScaleX, { toValue: 1.8, friction: 5, useNativeDriver: true }),
          Animated.spring(dropScaleY, { toValue: 1.8, friction: 5, useNativeDriver: true })
        ]).start();

        dropTranslateX.stopAnimation((value) => {
          currentDragX.current = value;
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        const tabsCount = state.routes.length;
        const minX = getTargetX(0, widthRef.current) - 15; // slightly allow overdrag
        const maxX = getTargetX(tabsCount - 1, widthRef.current) + 15;
        let newX = currentDragX.current + gestureState.dx;
        
        if (newX < minX) newX = minX;
        if (newX > maxX) newX = maxX;
        
        dropTranslateX.setValue(newX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Finger lifts: restore shape elastically
        Animated.parallel([
          Animated.spring(dropScaleX, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
          Animated.spring(dropScaleY, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true })
        ]).start();

        const tabsCount = state.routes.length;
        
        const finalX = currentDragX.current + gestureState.dx;
        // determine nearest index
        let closestIndex = 0;
        let minDiff = Infinity;
        
        for (let i = 0; i < tabsCount; i++) {
          const target = getTargetX(i, widthRef.current);
          const diff = Math.abs(finalX - target);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
          }
        }

        const route = state.routes[closestIndex];
        const isFocused = state.index === closestIndex;

        // Unconditionally snap to the closest index to prevent it getting stuck in the middle
        Animated.timing(dropTranslateX, {
          toValue: getTargetX(closestIndex, widthRef.current),
          duration: 300,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }).start();

        if (!isFocused) {
          navigation.navigate(route.name, route.params);
        }
      }
    })
  ).current;

  return (
    <View style={[styles.container, { bottom: insets.bottom + 12 }]}>
      {/* Background Navbar */}
      <GlassView
        colorScheme={theme === 'light' ? 'light' : 'dark'}
        glassEffectStyle="regular"
        style={[StyleSheet.absoluteFill, styles.blurContainer]}
      />
      
      {/* Foreground Layer (Drop + Icons) */}
      <View style={styles.content} onLayout={onContainerLayout} {...panResponder.panHandlers}>
        
        {/* LAYER 0: Inactive Gray Icons & Touchables */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          let iconName: any = 'grid';
          let activeIconName: any = 'grid';
          if (route.name === 'index') { iconName = 'home-outline'; activeIconName = 'home'; }
          if (route.name === 'social') { iconName = 'people-outline'; activeIconName = 'people'; }
          if (route.name === 'nutrition') { iconName = 'flame-outline'; activeIconName = 'flame'; }
          if (route.name === 'routines') { iconName = 'flash-outline'; activeIconName = 'flash'; }
          if (route.name === 'hub') { iconName = 'grid-outline'; activeIconName = 'grid'; }

          const targetX = getTargetX(index, containerWidth);
          const opacityAnim = dropTranslateX.interpolate({
            inputRange: [targetX - 45, targetX, targetX + 45],
            outputRange: [0, 1, 0],
            extrapolate: 'clamp'
          });
          const inverseOpacityAnim = dropTranslateX.interpolate({
            inputRange: [targetX - 45, targetX, targetX + 45],
            outputRange: [1, 0, 1],
            extrapolate: 'clamp'
          });
          const scaleAnim = dropTranslateX.interpolate({
            inputRange: [targetX - 45, targetX, targetX + 45],
            outputRange: [1, 1.25, 1],
            extrapolate: 'clamp'
          });

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              style={styles.tabItem}
            >
              <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
                {/* Gray icon fades out and scales up as the glass drop rolls over it */}
                <Animated.View style={{ position: 'absolute', opacity: inverseOpacityAnim, transform: [{ scale: scaleAnim }] }}>
                  <Ionicons name={iconName} size={24} color={colors.textSecondary} />
                </Animated.View>
                {/* Blue active icon fades in and scales up */}
                <Animated.View style={{ position: 'absolute', opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
                  <Ionicons name={activeIconName} size={24} color={colors.tint} />
                </Animated.View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* LAYER 1: The Liquid Glass Drop */}
        <Animated.View
          style={[
            styles.drop,
            {
              transform: [
                { translateX: dropTranslateX },
                { scaleX: dropScaleX },
                { scaleY: dropScaleY }
              ],
              borderRadius: 20,
              overflow: 'hidden',
            }
          ]}
          pointerEvents="none"
        >
          <GlassView
            colorScheme={theme === 'light' ? 'light' : 'dark'}
            glassEffectStyle="prominent"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)',
              borderRadius: 20,
              backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.5)',
            }}
          />
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 2,
  },
  drop: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 60,
    borderRadius: 20,
    zIndex: 1,
  }
});