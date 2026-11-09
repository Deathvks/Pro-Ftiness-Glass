import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore from '@/store/useAppStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Puntos estelares pseudo-aleatorios fijos para evitar re-cálculos en cada render
const STARS = [
  { x: 0.08, y: 0.05, size: 2.0, opacity: 0.95, color: '#ffffff' },
  { x: 0.22, y: 0.12, size: 1.2, opacity: 0.65, color: '#e0e7ff' },
  { x: 0.45, y: 0.08, size: 1.8, opacity: 0.85, color: '#c084fc' },
  { x: 0.68, y: 0.04, size: 1.0, opacity: 0.55, color: '#ffffff' },
  { x: 0.88, y: 0.10, size: 2.2, opacity: 0.90, color: '#ffffff' },

  { x: 0.14, y: 0.22, size: 1.5, opacity: 0.75, color: '#c084fc' },
  { x: 0.35, y: 0.19, size: 2.4, opacity: 0.95, color: '#ffffff' },
  { x: 0.58, y: 0.25, size: 1.2, opacity: 0.60, color: '#e0e7ff' },
  { x: 0.79, y: 0.18, size: 1.6, opacity: 0.80, color: '#ffffff' },
  { x: 0.94, y: 0.28, size: 1.0, opacity: 0.50, color: '#ffffff' },

  { x: 0.05, y: 0.38, size: 1.8, opacity: 0.85, color: '#ffffff' },
  { x: 0.28, y: 0.34, size: 1.2, opacity: 0.65, color: '#c084fc' },
  { x: 0.48, y: 0.40, size: 2.2, opacity: 0.90, color: '#ffffff' },
  { x: 0.72, y: 0.36, size: 1.4, opacity: 0.70, color: '#e0e7ff' },
  { x: 0.85, y: 0.44, size: 1.0, opacity: 0.60, color: '#ffffff' },

  { x: 0.18, y: 0.52, size: 2.0, opacity: 0.90, color: '#ffffff' },
  { x: 0.38, y: 0.48, size: 1.2, opacity: 0.55, color: '#e0e7ff' },
  { x: 0.62, y: 0.55, size: 1.8, opacity: 0.80, color: '#c084fc' },
  { x: 0.82, y: 0.50, size: 1.5, opacity: 0.75, color: '#ffffff' },
  { x: 0.96, y: 0.58, size: 2.4, opacity: 0.95, color: '#ffffff' },

  { x: 0.10, y: 0.68, size: 1.2, opacity: 0.60, color: '#ffffff' },
  { x: 0.30, y: 0.64, size: 2.2, opacity: 0.90, color: '#c084fc' },
  { x: 0.52, y: 0.72, size: 1.4, opacity: 0.70, color: '#e0e7ff' },
  { x: 0.74, y: 0.66, size: 2.0, opacity: 0.85, color: '#ffffff' },
  { x: 0.90, y: 0.75, size: 1.2, opacity: 0.65, color: '#ffffff' },

  { x: 0.06, y: 0.84, size: 1.8, opacity: 0.85, color: '#c084fc' },
  { x: 0.24, y: 0.80, size: 1.0, opacity: 0.55, color: '#ffffff' },
  { x: 0.44, y: 0.88, size: 2.4, opacity: 0.95, color: '#ffffff' },
  { x: 0.66, y: 0.82, size: 1.2, opacity: 0.65, color: '#e0e7ff' },
  { x: 0.86, y: 0.92, size: 1.6, opacity: 0.75, color: '#ffffff' },

  { x: 0.16, y: 0.95, size: 2.0, opacity: 0.90, color: '#ffffff' },
  { x: 0.55, y: 0.96, size: 1.4, opacity: 0.70, color: '#c084fc' },
  { x: 0.78, y: 0.98, size: 1.2, opacity: 0.60, color: '#ffffff' },
];

export default function GalaxyStarBackground() {
  const galaxyEffectsEnabled = useAppStore(state => (state as any).galaxyEffectsEnabled !== false);

  // Animación del desplazamiento de estrellas (deriva diagonal muy suave)
  const starDrift = useRef(new Animated.Value(0)).current;

  // Animación del meteoro (disparo periódico cada 6 segundos)
  const meteorProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!galaxyEffectsEnabled) {
      starDrift.stopAnimation();
      meteorProgress.stopAnimation();
      return;
    }

    // 1. Deriva de estrellas continua (80 segundos, lineal e infinita como en la web)
    const driftLoop = Animated.loop(
      Animated.timing(starDrift, {
        toValue: 1,
        duration: 80000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    driftLoop.start();

    // 2. Meteoro recurrente cada 6 segundos (1s movimiento + 5s pausa)
    const meteorLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(meteorProgress, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(4800),
        Animated.timing(meteorProgress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    meteorLoop.start();

    return () => {
      driftLoop.stop();
      meteorLoop.stop();
    };
  }, [galaxyEffectsEnabled]);

  const starTranslateX = starDrift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
  });

  const starTranslateY = starDrift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  // Meteoro cruzando a 35 grados desde arriba-izquierda
  const meteorTranslateX = meteorProgress.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [-180, -40, SCREEN_WIDTH * 0.9, SCREEN_WIDTH + 160],
  });

  const meteorTranslateY = meteorProgress.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [-60, 40, SCREEN_HEIGHT * 0.65, SCREEN_HEIGHT * 0.85],
  });

  const meteorOpacity = meteorProgress.interpolate({
    inputRange: [0, 0.08, 0.7, 1],
    outputRange: [0, 1, 0.8, 0],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Capa de estrellas */}
      <Animated.View
        style={[
          styles.starLayer,
          galaxyEffectsEnabled && {
            transform: [
              { translateX: starTranslateX },
              { translateY: starTranslateY },
            ],
          },
        ]}
      >
        {STARS.map((star, idx) => (
          <View
            key={`star-${idx}`}
            style={[
              styles.star,
              {
                left: star.x * SCREEN_WIDTH * 1.15,
                top: star.y * SCREEN_HEIGHT * 1.15,
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
                backgroundColor: star.color,
                opacity: star.opacity,
                shadowColor: star.color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: star.size * 1.5,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Meteoro fugaz cruzando la pantalla */}
      {galaxyEffectsEnabled && (
        <Animated.View
          style={[
            styles.meteorWrap,
            {
              opacity: meteorOpacity,
              transform: [
                { translateX: meteorTranslateX },
                { translateY: meteorTranslateY },
                { rotate: '35deg' },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0)', 'rgba(168, 85, 247, 0.6)', '#ffffff']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.meteorTrail}
          />
          <View style={styles.meteorHead} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  starLayer: {
    width: '120%',
    height: '120%',
    position: 'absolute',
    top: -20,
    left: -20,
  },
  star: {
    position: 'absolute',
  },
  meteorWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    width: 220,
    height: 6,
  },
  meteorTrail: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  meteorHead: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
});
