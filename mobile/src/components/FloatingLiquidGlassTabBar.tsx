import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Home, Users, Flame, Zap, LayoutGrid } from 'lucide-react-native';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';

export interface FloatingTabBarProps {
  state: any;
  descriptors?: any;
  emitter?: any;
  navigateToTab?: (routeKey: string) => void;
  navigation?: any;
  insets?: { top: number; bottom: number; left: number; right: number };
}

const TAB_CONFIG: Record<string, { label: string; icon: any }> = {
  index: { label: 'Dashboard', icon: Home },
  social: { label: 'Comunidad', icon: Users },
  nutrition: { label: 'Nutrición', icon: Flame },
  routines: { label: 'Rutinas', icon: Zap },
  hub: { label: 'Menú', icon: LayoutGrid },
};

const TAB_KEYS = ['index', 'social', 'nutrition', 'routines', 'hub'];

export function FloatingLiquidGlassTabBar({
  state,
  emitter,
  navigateToTab,
  navigation,
  insets: propInsets,
}: FloatingTabBarProps) {
  const hookInsets = useSafeAreaInsets();
  const insets = propInsets || hookInsets;
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  // Ancho inicial estimado para calcular la posición de la gota de inmediato
  const screenWidth = Dimensions.get('window').width;
  const initialCapsuleWidth = Math.min(screenWidth - 32, 380);
  const [capsuleWidth, setCapsuleWidth] = useState(initialCapsuleWidth);

  // Dimensiones de la gota líquida
  const availableWidth = Math.max(0, capsuleWidth - 12);
  const tabWidth = availableWidth / TAB_KEYS.length;
  const dropWidth = Math.min(tabWidth - 4, 58);
  const dropHeight = 46;

  // Animaciones de traslación horizontal y deformación elástica (squish/stretch)
  const getDropLeft = (index: number) => {
    return 6 + index * tabWidth + (tabWidth - dropWidth) / 2;
  };

  const activeIndex = state.index >= 0 ? state.index : 0;
  const translateX = useRef(new Animated.Value(getDropLeft(activeIndex))).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;

  // Seguimiento suave y elástico de la gota al cambiar de pestaña
  useEffect(() => {
    const targetLeft = getDropLeft(activeIndex);

    // Animación de traslación fluida con física de resorte (spring)
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: targetLeft,
        useNativeDriver: true,
        friction: 7,
        tension: 80,
      }),
      // Efecto elástico de líquido que se estira al saltar y vuelve a su forma
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleX, {
            toValue: 1.25,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(scaleY, {
            toValue: 0.82,
            duration: 120,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(scaleX, {
            toValue: 1,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.spring(scaleY, {
            toValue: 1,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [activeIndex, capsuleWidth]);

  // Fondo translúcido suave idéntico al frontend (.liquid-glass-navbar con 40-45% de opacidad)
  const getGlassTintBg = () => {
    switch (theme) {
      case 'oled':
        return 'rgba(0, 0, 0, 0.45)';
      case 'dark':
        return 'rgba(15, 23, 42, 0.42)';
      case 'galaxy':
        return 'rgba(10, 10, 26, 0.45)';
      case 'ocean-dark':
        return 'rgba(8, 47, 73, 0.45)';
      case 'desert-dark':
        return 'rgba(44, 30, 22, 0.45)';
      case 'ocean':
        return 'rgba(240, 249, 255, 0.48)';
      case 'desert':
        return 'rgba(253, 248, 245, 0.48)';
      case 'light':
      default:
        return 'rgba(255, 255, 255, 0.50)';
    }
  };

  const bottomOffset = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.outerWrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
      <View
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - capsuleWidth) > 1) {
            setCapsuleWidth(w);
          }
        }}
        style={[
          styles.capsule,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.65)',
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.32)' : 'rgba(255, 255, 255, 0.95)',
            shadowOpacity: isDark ? 0.45 : 0.18,
          },
        ]}
      >
        {/* Desenfoque de fondo nativo (RenderEffect en Android) con intensidad equilibrada para transparencia real */}
        <BlurView
          pointerEvents="none"
          intensity={Platform.OS === 'android' ? 45 : 55}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        {/* Tinte de cristal adaptado al tema activo con transparencia real */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: getGlassTintBg() },
          ]}
        />

        {/* Brillo especular superior sutil estilo Apple Liquid Glass */}
        <LinearGradient
          pointerEvents="none"
          colors={
            isDark
              ? ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.02)', 'transparent']
              : ['rgba(255, 255, 255, 0.45)', 'rgba(255, 255, 255, 0.08)', 'transparent']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.specularShine}
        />

        {/* GOTA LÍQUIDA DINÁMICA FLUIDA (.liquid-glass-drop) QUE SE DESLIZA ENTRE PESTAÑAS */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.liquidDrop,
            {
              width: dropWidth,
              height: dropHeight,
              transform: [
                { translateX },
                { scaleX },
                { scaleY },
              ],
              borderColor: isDark ? 'rgba(255, 255, 255, 0.24)' : 'rgba(255, 255, 255, 0.85)',
              borderTopColor: isDark ? 'rgba(255, 255, 255, 0.42)' : '#ffffff',
              shadowColor: colors.tint,
            },
          ]}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255, 255, 255, 0.20)', 'rgba(255, 255, 255, 0.04)']
                : ['rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.30)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.liquidDropGradient}
          />
        </Animated.View>

        {/* Iconos interactivos del Navbar */}
        {state.routes.map((route: any, index: number) => {
          const tabInfo = TAB_CONFIG[route.name];
          if (!tabInfo) return null;

          const isFocused = state.index === index;
          const Icon = tabInfo.icon;

          const onPress = () => {
            let defaultPrevented = false;
            if (emitter) {
              const res = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              defaultPrevented = !!res?.defaultPrevented;
            } else if (navigation) {
              const res = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              defaultPrevented = !!res?.defaultPrevented;
            }

            if (!isFocused && !defaultPrevented) {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              if (navigateToTab) {
                navigateToTab(route.key);
              } else if (navigation) {
                navigation.navigate(route.name);
              }
            }
          };

          const activeColor = colors.tint;
          const inactiveColor = colors.tabBarInactive || colors.textSecondary;
          const currentColor = isFocused ? activeColor : inactiveColor;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              style={styles.tabButton}
            >
              <View style={[styles.iconContainer, isFocused && styles.activeIconContainer]}>
                <Icon
                  size={22}
                  color={currentColor}
                  strokeWidth={isFocused ? 2.5 : 1.9}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 1000,
  },
  capsule: {
    width: '100%',
    maxWidth: 380,
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    overflow: 'hidden',
    // Bordes satinados de cristal líquido
    borderWidth: 1,
    borderTopWidth: 1.5,
    // Sombra flotante profunda
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 12,
  },
  specularShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24,
  },
  liquidDrop: {
    position: 'absolute',
    top: 7,
    left: 0,
    borderRadius: 23,
    borderWidth: 1,
    borderTopWidth: 1.5,
    overflow: 'hidden',
    // Resplandor del color de acento
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 1,
  },
  liquidDropGradient: {
    ...StyleSheet.absoluteFill,
    borderRadius: 23,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 1 }],
  },
  activeIconContainer: {
    transform: [{ scale: 1.15 }],
  },
});
