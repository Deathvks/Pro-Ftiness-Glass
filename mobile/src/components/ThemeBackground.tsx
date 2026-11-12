import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image, type ImageRef } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from 'expo-router';
import useAppStore from '@/store/useAppStore';
import GalaxyStarBackground from '@/components/ui/GalaxyStarBackground';
import { getThemeBaseBackground } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('screen');
const OCEAN: number = require('../../assets/images/ocean.jpg');
const DESERT: number = require('../../assets/images/desert.jpg');
const warmImages = new Map<number, ImageRef>();
const loadingImages = new Set<number>();
const photoForTheme = (theme: string) => theme.startsWith('ocean') ? OCEAN : theme.startsWith('desert') ? DESERT : undefined;

export function preloadThemeBackgrounds(currentTheme: string) {
  const current = photoForTheme(currentTheme);
  for (const source of [OCEAN, DESERT]) {
    if (source === current || warmImages.has(source) || loadingImages.has(source)) continue;
    loadingImages.add(source);
    void Image.loadAsync(source).then(image => warmImages.set(source, image)).catch(() => {})
      .finally(() => loadingImages.delete(source));
  }
}

const PHOTO_TINTS: Record<string, string> = {
  ocean: 'rgba(240, 249, 255, 0.35)',
  'ocean-dark': 'rgba(8, 47, 73, 0.50)',
  desert: 'rgba(253, 248, 245, 0.45)',
  'desert-dark': 'rgba(44, 30, 22, 0.50)',
};

function FocusedGalaxyStars() {
  return useIsFocused() ? <GalaxyStarBackground /> : null;
}

export default function ThemeBackground({ root = false }: { root?: boolean }) {
  const theme = useAppStore(state => state.theme);

  if (theme === 'galaxy') {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#080814',
            width: '100%',
            height: '100%',
            minHeight: SCREEN_HEIGHT,
          },
        ]}
        pointerEvents="none"
      >
        {/* Nebulosa cósmica púrpura superior-izquierda (idéntica al radial-gradient de la web) */}
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.22)', 'rgba(168, 85, 247, 0.05)', 'transparent']}
          start={{ x: 0.15, y: 0.25 }}
          end={{ x: 0.8, y: 0.8 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Nebulosa cósmica azul inferior-derecha (idéntica a la web) */}
        <LinearGradient
          colors={['transparent', 'rgba(59, 130, 246, 0.05)', 'rgba(59, 130, 246, 0.20)']}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.85, y: 0.75 }}
          style={StyleSheet.absoluteFill}
        />
        {root ? <GalaxyStarBackground /> : <FocusedGalaxyStars />}
      </View>
    );
  }

  const photo = photoForTheme(theme);
  if (photo !== undefined) {
    return (
      <View
        style={[StyleSheet.absoluteFill, { minHeight: SCREEN_HEIGHT, backgroundColor: getThemeBaseBackground(theme) }]}
        pointerEvents="none"
      >
        <Image
          source={warmImages.get(photo) ?? photo}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="center"
          priority="high"
          cachePolicy="memory-disk"
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: PHOTO_TINTS[theme] }]} />
      </View>
    );
  }

  return null;
}
