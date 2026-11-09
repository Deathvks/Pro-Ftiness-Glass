import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore from '@/store/useAppStore';

export default function ThemeBackground() {
  const theme = useAppStore(state => state.theme);

  if (theme === 'galaxy') {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#080814' }]} pointerEvents="none">
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
      </View>
    );
  }

  if (theme.startsWith('ocean')) {
    const isDark = theme === 'ocean-dark';
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#082f49' : '#f0f9ff' }]} pointerEvents="none">
        <Image 
          source={require('../../assets/images/ocean.jpg')} 
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
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
      <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#2c1e16' : '#fdf8f5' }]} pointerEvents="none">
        <Image 
          source={require('../../assets/images/desert.jpg')} 
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
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
