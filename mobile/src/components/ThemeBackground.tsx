import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from 'expo-router';
import useAppStore from '@/store/useAppStore';
import GalaxyStarBackground from '@/components/ui/GalaxyStarBackground';

const { height: SCREEN_HEIGHT } = Dimensions.get('screen');

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

  if (theme.startsWith('ocean')) {
    const isDark = theme === 'ocean-dark';
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark ? '#082f49' : '#f0f9ff',
            width: '100%',
            height: '100%',
            minHeight: SCREEN_HEIGHT,
          },
        ]}
        pointerEvents="none"
      >
        <Image 
          source={require('../../assets/images/ocean.jpg')} 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            minHeight: SCREEN_HEIGHT,
          }}
          contentFit="cover"
          contentPosition="center"
          priority="high"
          cachePolicy="memory-disk"
        />
        {isDark ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8, 47, 73, 0.50)' }]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(240, 249, 255, 0.35)' }]} />
        )}
      </View>
    );
  }

  if (theme.startsWith('desert')) {
    const isDark = theme === 'desert-dark';
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark ? '#2c1e16' : '#fdf8f5',
            width: '100%',
            height: '100%',
            minHeight: SCREEN_HEIGHT,
          },
        ]}
        pointerEvents="none"
      >
        <Image 
          source={require('../../assets/images/desert.jpg')} 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            minHeight: SCREEN_HEIGHT,
          }}
          contentFit="cover"
          contentPosition="center"
          priority="high"
          cachePolicy="memory-disk"
        />
        {isDark ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(44, 30, 22, 0.50)' }]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(253, 248, 245, 0.45)' }]} />
        )}
      </View>
    );
  }

  return null;
}
