import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, getThemeBaseBackground, type ThemeColor } from '@/constants/theme';
import useAppStore from '@/store/useAppStore';

const OCEAN_BG: number = require('../../../assets/images/ocean.jpg');
const DESERT_BG: number = require('../../../assets/images/desert.jpg');

const MODAL_PHOTO_OVERLAYS: Record<string, string> = {
  ocean: 'rgba(240, 249, 255, 0.72)',
  'ocean-dark': 'rgba(8, 47, 73, 0.74)',
  desert: 'rgba(253, 248, 245, 0.74)',
  'desert-dark': 'rgba(44, 30, 22, 0.78)',
};

const MODAL_CARD_SURFACES: Record<string, string> = {
  light: 'rgba(0, 0, 0, 0.04)',
  dark: '#1e293b',
  oled: '#0d0d10',
  galaxy: 'rgba(19, 17, 42, 0.78)',
  ocean: 'rgba(224, 242, 254, 0.78)',
  'ocean-dark': 'rgba(12, 74, 110, 0.72)',
  desert: 'rgba(255, 249, 245, 0.80)',
  'desert-dark': 'rgba(61, 43, 35, 0.78)',
};

export function getThemedModalSurfaceColor(theme?: string): string {
  const key = (theme || 'oled') as ThemeColor;
  return getThemeBaseBackground(key);
}

export function getThemedModalBorderColor(theme?: string): string {
  const key = (theme || 'oled') as ThemeColor;
  return Colors[key]?.border || 'rgba(255, 255, 255, 0.14)';
}

export function getThemedModalCardColor(theme?: string): string {
  const key = theme || 'oled';
  return MODAL_CARD_SURFACES[key] || (Colors[key as ThemeColor]?.card ?? '#1e293b');
}

/**
 * Fondo temático contenido (sin minHeight: SCREEN_HEIGHT) para que los modales y bottom sheets
 * hereden fielmente todos los temas (OLED, Dark, Light, Galaxy, Ocean, Desert) sin aspecto gris
 * ni desbordamientos en la parte inferior.
 */
export function ModalThemeBackground({ theme: explicitTheme }: { theme?: string }) {
  const storeTheme = useAppStore(state => state.theme);
  const theme = explicitTheme || storeTheme || 'oled';
  const baseBg = getThemeBaseBackground(theme);

  if (theme === 'galaxy') {
    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: baseBg }]}>
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.24)', 'rgba(168, 85, 247, 0.04)', 'transparent']}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.85, y: 0.85 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', 'rgba(59, 130, 246, 0.05)', 'rgba(59, 130, 246, 0.22)']}
          start={{ x: 0.15, y: 0.15 }}
          end={{ x: 0.9, y: 0.9 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }

  if (theme.startsWith('ocean') || theme.startsWith('desert')) {
    const source = theme.startsWith('ocean') ? OCEAN_BG : DESERT_BG;
    const overlay = MODAL_PHOTO_OVERLAYS[theme] || 'rgba(0, 0, 0, 0.65)';
    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: baseBg }]}>
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="center"
          cachePolicy="memory-disk"
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: overlay }]} />
      </View>
    );
  }

  if (theme === 'dark') {
    return (
      <LinearGradient
        pointerEvents="none"
        colors={['#0f172a', '#162238']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    );
  }

  if (theme === 'light') {
    return (
      <LinearGradient
        pointerEvents="none"
        colors={['#FFFFFF', '#F3F6FA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    );
  }

  // oled (negro puro, nunca gris)
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['#000000', '#050507']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

export default ModalThemeBackground;
