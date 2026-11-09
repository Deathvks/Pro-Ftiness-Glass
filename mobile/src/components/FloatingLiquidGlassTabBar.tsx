import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
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

export function FloatingLiquidGlassTabBar({ state, descriptors, navigation, emitter, navigateToTab, insets: propInsets }: FloatingTabBarProps) {
  const hookInsets = useSafeAreaInsets();
  const insets = propInsets || hookInsets;
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  // Fondo translúcido adaptado a cada tema para el efecto cristal
  const getGlassTintBg = () => {
    switch (theme) {
      case 'oled':
        return 'rgba(0, 0, 0, 0.78)';
      case 'dark':
        return 'rgba(15, 23, 42, 0.74)';
      case 'galaxy':
        return 'rgba(10, 10, 26, 0.78)';
      case 'ocean-dark':
        return 'rgba(8, 47, 73, 0.78)';
      case 'desert-dark':
        return 'rgba(44, 30, 22, 0.78)';
      case 'ocean':
        return 'rgba(240, 249, 255, 0.82)';
      case 'desert':
        return 'rgba(253, 248, 245, 0.82)';
      case 'light':
      default:
        return 'rgba(255, 255, 255, 0.82)';
    }
  };

  const bottomOffset = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.outerWrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
      <View
        style={[
          styles.capsule,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.70)',
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.95)',
            shadowOpacity: isDark ? 0.45 : 0.15,
          },
        ]}
      >
        {/* Capa de desenfoque nativa por hardware (RenderEffect en Android 12+) */}
        <BlurView
          pointerEvents="none"
          intensity={Platform.OS === 'android' ? 95 : 85}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        {/* Tinte de cristal adaptado al tema activo */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: getGlassTintBg() },
          ]}
        />

        {/* Pestañas del Navbar */}
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
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              style={styles.tabButton}
            >
              {/* Gota líquida de fondo para la pestaña activa */}
              {isFocused && (
                <View
                  style={[
                    styles.activeDroplet,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                />
              )}

              <Icon
                size={20}
                color={currentColor}
                strokeWidth={isFocused ? 2.4 : 1.8}
              />

              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  {
                    color: currentColor,
                    fontWeight: isFocused ? '800' : '600',
                  },
                ]}
              >
                {tabInfo.label}
              </Text>
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
    left: 14,
    right: 14,
    alignItems: 'center',
    zIndex: 1000,
  },
  capsule: {
    width: '100%',
    maxWidth: 420,
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    overflow: 'hidden',
    // Bordes satinados de cristal líquido
    borderWidth: 1,
    borderTopWidth: 1.5,
    // Sombra flotante
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 12,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  activeDroplet: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 4,
    right: 4,
    borderRadius: 22,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 3,
    letterSpacing: -0.2,
  },
});
