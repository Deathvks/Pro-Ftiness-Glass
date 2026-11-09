import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore from '@/store/useAppStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 70 puntos estelares nítidos y variados (idéntico al fondo estrellado de la web)
const STARS = [
  // Cuadrante 1 (arriba-izquierda)
  { x: 0.05, y: 0.03, size: 2.2, opacity: 0.95, color: '#ffffff' },
  { x: 0.12, y: 0.08, size: 1.5, opacity: 0.85, color: '#e0e7ff' },
  { x: 0.18, y: 0.04, size: 2.8, opacity: 1.00, color: '#ffffff' },
  { x: 0.25, y: 0.11, size: 1.6, opacity: 0.80, color: '#c084fc' },
  { x: 0.08, y: 0.16, size: 2.0, opacity: 0.90, color: '#ffffff' },
  { x: 0.15, y: 0.22, size: 1.4, opacity: 0.75, color: '#e0e7ff' },
  { x: 0.28, y: 0.19, size: 2.5, opacity: 0.95, color: '#ffffff' },
  { x: 0.04, y: 0.27, size: 1.8, opacity: 0.85, color: '#c084fc' },
  { x: 0.22, y: 0.29, size: 1.5, opacity: 0.80, color: '#ffffff' },

  // Cuadrante 2 (arriba-derecha)
  { x: 0.45, y: 0.04, size: 2.0, opacity: 0.90, color: '#ffffff' },
  { x: 0.58, y: 0.09, size: 1.5, opacity: 0.80, color: '#e0e7ff' },
  { x: 0.72, y: 0.03, size: 2.6, opacity: 1.00, color: '#ffffff' },
  { x: 0.85, y: 0.07, size: 1.8, opacity: 0.85, color: '#c084fc' },
  { x: 0.94, y: 0.05, size: 2.2, opacity: 0.95, color: '#ffffff' },
  { x: 0.50, y: 0.17, size: 1.6, opacity: 0.80, color: '#ffffff' },
  { x: 0.65, y: 0.14, size: 2.4, opacity: 0.95, color: '#c084fc' },
  { x: 0.78, y: 0.20, size: 1.5, opacity: 0.75, color: '#e0e7ff' },
  { x: 0.89, y: 0.16, size: 2.8, opacity: 1.00, color: '#ffffff' },
  { x: 0.96, y: 0.24, size: 1.4, opacity: 0.70, color: '#ffffff' },
  { x: 0.42, y: 0.26, size: 2.0, opacity: 0.90, color: '#ffffff' },
  { x: 0.60, y: 0.28, size: 1.6, opacity: 0.80, color: '#e0e7ff' },
  { x: 0.75, y: 0.29, size: 2.2, opacity: 0.95, color: '#c084fc' },

  // Cuadrante 3 (centro)
  { x: 0.09, y: 0.38, size: 2.2, opacity: 0.95, color: '#ffffff' },
  { x: 0.20, y: 0.35, size: 1.5, opacity: 0.80, color: '#c084fc' },
  { x: 0.32, y: 0.42, size: 2.8, opacity: 1.00, color: '#ffffff' },
  { x: 0.48, y: 0.37, size: 1.6, opacity: 0.80, color: '#e0e7ff' },
  { x: 0.62, y: 0.44, size: 2.4, opacity: 0.95, color: '#ffffff' },
  { x: 0.79, y: 0.39, size: 1.4, opacity: 0.75, color: '#c084fc' },
  { x: 0.92, y: 0.43, size: 2.0, opacity: 0.90, color: '#ffffff' },
  { x: 0.14, y: 0.49, size: 1.6, opacity: 0.85, color: '#ffffff' },
  { x: 0.28, y: 0.52, size: 2.5, opacity: 0.95, color: '#e0e7ff' },
  { x: 0.44, y: 0.48, size: 1.5, opacity: 0.75, color: '#c084fc' },
  { x: 0.55, y: 0.54, size: 2.2, opacity: 0.90, color: '#ffffff' },
  { x: 0.70, y: 0.50, size: 1.8, opacity: 0.85, color: '#ffffff' },
  { x: 0.86, y: 0.55, size: 2.6, opacity: 1.00, color: '#ffffff' },

  // Cuadrante 4 (abajo-izquierda)
  { x: 0.06, y: 0.62, size: 2.0, opacity: 0.90, color: '#ffffff' },
  { x: 0.18, y: 0.66, size: 1.5, opacity: 0.80, color: '#e0e7ff' },
  { x: 0.26, y: 0.60, size: 2.8, opacity: 1.00, color: '#ffffff' },
  { x: 0.38, y: 0.68, size: 1.6, opacity: 0.85, color: '#c084fc' },
  { x: 0.10, y: 0.75, size: 2.2, opacity: 0.95, color: '#ffffff' },
  { x: 0.22, y: 0.79, size: 1.4, opacity: 0.75, color: '#e0e7ff' },
  { x: 0.34, y: 0.74, size: 2.4, opacity: 0.95, color: '#ffffff' },
  { x: 0.05, y: 0.86, size: 1.8, opacity: 0.85, color: '#c084fc' },
  { x: 0.16, y: 0.92, size: 2.5, opacity: 1.00, color: '#ffffff' },
  { x: 0.28, y: 0.88, size: 1.5, opacity: 0.80, color: '#e0e7ff' },

  // Cuadrante 5 (abajo-derecha)
  { x: 0.52, y: 0.64, size: 2.2, opacity: 0.90, color: '#ffffff' },
  { x: 0.66, y: 0.61, size: 1.5, opacity: 0.80, color: '#c084fc' },
  { x: 0.76, y: 0.68, size: 2.8, opacity: 1.00, color: '#ffffff' },
  { x: 0.88, y: 0.63, size: 1.6, opacity: 0.85, color: '#e0e7ff' },
  { x: 0.95, y: 0.71, size: 2.0, opacity: 0.95, color: '#ffffff' },
  { x: 0.48, y: 0.77, size: 1.8, opacity: 0.85, color: '#ffffff' },
  { x: 0.62, y: 0.79, size: 2.4, opacity: 0.95, color: '#c084fc' },
  { x: 0.74, y: 0.75, size: 1.5, opacity: 0.80, color: '#e0e7ff' },
  { x: 0.85, y: 0.82, size: 2.6, opacity: 1.00, color: '#ffffff' },
  { x: 0.94, y: 0.86, size: 1.6, opacity: 0.80, color: '#ffffff' },
  { x: 0.42, y: 0.91, size: 2.2, opacity: 0.95, color: '#ffffff' },
  { x: 0.56, y: 0.95, size: 1.5, opacity: 0.80, color: '#e0e7ff' },
  { x: 0.70, y: 0.90, size: 2.8, opacity: 1.00, color: '#ffffff' },
  { x: 0.82, y: 0.94, size: 1.8, opacity: 0.85, color: '#c084fc' },
  { x: 0.91, y: 0.97, size: 2.2, opacity: 0.95, color: '#ffffff' },
];

export default function GalaxyStarBackground() {
  const theme = useAppStore(state => state.theme);
  const galaxyEffectsEnabled = useAppStore(state => (state as any).galaxyEffectsEnabled !== false);

  const starDrift = useRef(new Animated.Value(0)).current;
  const meteorProgress = useRef(new Animated.Value(0)).current;

  const isGalaxy = theme === 'galaxy';

  useEffect(() => {
    if (!isGalaxy || !galaxyEffectsEnabled) {
      starDrift.stopAnimation();
      meteorProgress.stopAnimation();
      return;
    }

    // 1. Deriva estelar continua suave (80s, idéntico a starry-background de la web)
    const driftLoop = Animated.loop(
      Animated.timing(starDrift, {
        toValue: 1,
        duration: 80000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    driftLoop.start();

    // 2. Lluvia de meteoros periódica cada 6s (1.2s de cruce + 4.8s de pausa, igual a la web)
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
  }, [isGalaxy, galaxyEffectsEnabled]);

  // Solo renderizar si el tema activo es galaxia (llamado DESPUÉS de todos los hooks)
  if (!isGalaxy) {
    return null;
  }

  const starTranslateX = starDrift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  });

  const starTranslateY = starDrift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80],
  });

  const meteorTranslateX = meteorProgress.interpolate({
    inputRange: [0, 0.08, 0.85, 1],
    outputRange: [-220, -50, SCREEN_WIDTH * 0.9, SCREEN_WIDTH + 180],
  });

  const meteorTranslateY = meteorProgress.interpolate({
    inputRange: [0, 0.08, 0.85, 1],
    outputRange: [-80, 20, SCREEN_HEIGHT * 0.65, SCREEN_HEIGHT * 0.88],
  });

  const meteorOpacity = meteorProgress.interpolate({
    inputRange: [0, 0.06, 0.75, 1],
    outputRange: [0, 1, 0.85, 0],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Capa de estrellas nítidas flotantes */}
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
            key={`gstar-${idx}`}
            style={[
              styles.star,
              {
                left: star.x * SCREEN_WIDTH * 1.25,
                top: star.y * SCREEN_HEIGHT * 1.25,
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
                backgroundColor: star.color,
                opacity: star.opacity,
                shadowColor: star.color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: star.size * 2,
                elevation: 4,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Meteoro fugaz brillante cruzando en 35 grados */}
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
            colors={['rgba(255, 255, 255, 0)', 'rgba(168, 85, 247, 0.8)', '#ffffff']}
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
    zIndex: 9999,
  },
  starLayer: {
    width: '135%',
    height: '135%',
    position: 'absolute',
    top: -40,
    left: -40,
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
    width: 260,
    height: 8,
  },
  meteorTrail: {
    flex: 1,
    height: 2.5,
    borderRadius: 1.5,
  },
  meteorHead: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ffffff',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
});
