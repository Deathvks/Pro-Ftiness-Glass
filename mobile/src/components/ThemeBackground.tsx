import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import useAppStore from '@/store/useAppStore';

export default function ThemeBackground() {
  const theme = useAppStore(state => state.theme);

  if (theme === 'galaxy') {
    return (
      <View style={[StyleSheet.absoluteFill, { zIndex: -1 }]} pointerEvents="none">
        <Image 
          source={require('../../assets/images/galaxy.jpg')} 
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10, 10, 26, 0.5)' }]} />
      </View>
    );
  }

  if (theme.startsWith('ocean')) {
    const isDark = theme === 'ocean-dark';
    return (
      <View style={[StyleSheet.absoluteFill, { zIndex: -1 }]} pointerEvents="none">
        <Image 
          source={require('../../assets/images/ocean.jpg')} 
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        {isDark ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8, 47, 73, 0.5)' }]} />
        ) : null}
      </View>
    );
  }

  if (theme.startsWith('desert')) {
    const isDark = theme === 'desert-dark';
    return (
      <View style={[StyleSheet.absoluteFill, { zIndex: -1 }]} pointerEvents="none">
        <Image 
          source={require('../../assets/images/desert.jpg')} 
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        {isDark ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(44, 30, 22, 0.5)' }]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(253, 248, 245, 0.45)' }]} />
        )}
      </View>
    );
  }

  return null;
}
