import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import useAppStore from '@/store/useAppStore';
import GalaxyStarBackground from '@/components/ui/GalaxyStarBackground';

export default function ThemeBackground() {
  const theme = useAppStore(state => state.theme);

  if (theme === 'galaxy') {
    return (
      <View style={[StyleSheet.absoluteFill, { zIndex: -1, backgroundColor: '#080814' }]} pointerEvents="none">
        <Image 
          source={require('../../assets/images/galaxy.jpg')} 
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8, 8, 20, 0.45)' }]} />
        <GalaxyStarBackground />
      </View>
    );
  }

  if (theme.startsWith('ocean')) {
    const isDark = theme === 'ocean-dark';
    return (
      <View style={[StyleSheet.absoluteFill, { zIndex: -1, backgroundColor: isDark ? '#082f49' : '#f0f9ff' }]} pointerEvents="none">
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
      <View style={[StyleSheet.absoluteFill, { zIndex: -1, backgroundColor: isDark ? '#2c1e16' : '#fdf8f5' }]} pointerEvents="none">
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
