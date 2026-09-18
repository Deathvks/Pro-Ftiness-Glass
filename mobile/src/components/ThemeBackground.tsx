import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import useAppStore from '@/store/useAppStore';

const { width, height } = Dimensions.get('window');

const STAR_COUNT = 30;

function GalaxyStars() {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 40000, // Very slow continuous movement
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -height],
  });
  
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width * 0.5],
  });

  // Generate random static stars
  const stars = useRef(
    Array.from({ length: STAR_COUNT }).map((_, i) => ({
      id: i,
      left: Math.random() * (width * 2),
      top: Math.random() * (height * 2),
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
    }))
  ).current;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY }, { translateX }] }]}>
        {stars.map(star => (
          <View
            key={star.id}
            style={{
              position: 'absolute',
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              backgroundColor: '#fff',
              opacity: star.opacity,
            }}
          />
        ))}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: Animated.add(translateY, height) }, { translateX: Animated.add(translateX, width * 0.5) }] }]}>
         {stars.map(star => (
          <View
            key={`dup-${star.id}`}
            style={{
              position: 'absolute',
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              backgroundColor: '#fff',
              opacity: star.opacity,
            }}
          />
        ))}
      </Animated.View>
    </View>
  );
}

function GalaxyMeteor() {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const runAnimation = () => {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500, // Quick flash across
        useNativeDriver: true,
      }).start(() => {
        // Wait random time before next meteor
        setTimeout(runAnimation, Math.random() * 5000 + 3000);
      });
    };
    runAnimation();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width * 1.5],
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-height * 0.2, height * 0.8],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.1, 0.5, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 150,
        height: 2,
        backgroundColor: '#fff',
        opacity,
        transform: [
          { translateX },
          { translateY },
          { rotate: '35deg' }
        ],
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 5,
      }}
    />
  );
}

export default function ThemeBackground() {
  const theme = useAppStore(state => state.theme);

  if (theme === 'galaxy') {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0a0a1a' }]} pointerEvents="none">
        <View style={[StyleSheet.absoluteFill, { opacity: 0.8 }]}>
           <View style={{ position: 'absolute', top: -height*0.2, left: -width*0.2, width: width*1.5, height: height*1.5, opacity: 0.15, backgroundColor: '#a855f7', borderRadius: width, filter: [{ blur: 100 }] as any }} />
        </View>
        <GalaxyStars />
        <GalaxyMeteor />
      </View>
    );
  }

  if (theme.startsWith('ocean')) {
    const isDark = theme === 'ocean-dark';
    return (
      <View style={[StyleSheet.absoluteFill]} pointerEvents="none">
        <Image 
          source={require('../../assets/images/ocean.jpg')} 
          style={StyleSheet.absoluteFill as any}
          resizeMode="cover"
        />
        {isDark ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8, 47, 73, 0.75)' }]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(240, 249, 255, 0.6)' }]} />
        )}
      </View>
    );
  }

  if (theme.startsWith('desert')) {
    const isDark = theme === 'desert-dark';
    return (
      <View style={[StyleSheet.absoluteFill]} pointerEvents="none">
        <Image 
          source={require('../../assets/images/desert.jpg')} 
          style={StyleSheet.absoluteFill as any}
          resizeMode="cover"
        />
        {isDark ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(69, 26, 3, 0.75)' }]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 251, 235, 0.5)' }]} />
        )}
      </View>
    );
  }

  return null;
}
