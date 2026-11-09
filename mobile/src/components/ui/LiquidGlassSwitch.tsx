import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  Switch,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';

interface LiquidGlassSwitchProps {
  value: boolean;
  onValueChange: (newValue: boolean) => void;
  tintColor?: string;
  isDark?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 30;
const TRACK_RADIUS = TRACK_HEIGHT / 2;
const THUMB_SIZE = 24;
const PADDING = 3;
const TRAVEL_DISTANCE = TRACK_WIDTH - THUMB_SIZE - PADDING * 2; // 52 - 24 - 6 = 22

export const LiquidGlassSwitch: React.FC<LiquidGlassSwitchProps> = ({
  value,
  onValueChange,
  tintColor = '#3b82f6',
  isDark = true,
  disabled = false,
  style,
  accessibilityLabel = 'Interruptor',
}) => {
  const switchAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const pressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'ios') return;
    Animated.spring(switchAnim, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 150,
    }).start();
  }, [value, switchAnim]);

  // En iOS usamos el UISwitch nativo del sistema (que en iOS 26 incluye el efecto Liquid Glass nativo real)
  if (Platform.OS === 'ios') {
    return (
      <Switch
        value={Boolean(value)}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: isDark ? 'rgba(120, 120, 128, 0.32)' : 'rgba(120, 120, 128, 0.16)',
          true: tintColor,
        }}
        ios_backgroundColor={isDark ? 'rgba(120, 120, 128, 0.32)' : 'rgba(120, 120, 128, 0.16)'}
        accessibilityLabel={accessibilityLabel}
        style={style}
      />
    );
  }

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 200,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 200,
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    const newValue = !value;

    // Disparar feedback táctil físico
    try {
      const hapticsActive = useAppStore.getState().hapticsEnabled !== false;
      if (hapticsActive || newValue) {
        if (newValue) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          // Si se desactiva, un clic háptico sutil de desconexión
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch {}

    onValueChange(newValue);
  };

  // Interpolación de posición del thumb
  const translateX = switchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [PADDING, PADDING + TRAVEL_DISTANCE],
  });

  // Efecto elástico característico al presionar el interruptor
  const scaleX = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const scaleY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95],
  });

  // Transiciones de opacidad para track activo vs inactivo
  const activeTrackOpacity = switchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.88],
  });

  const inactiveTrackOpacity = switchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? 0.12 : 0.08, 0],
  });

  const borderColor = isDark
    ? value
      ? 'rgba(255, 255, 255, 0.38)'
      : 'rgba(255, 255, 255, 0.18)'
    : value
    ? 'rgba(255, 255, 255, 0.65)'
    : 'rgba(0, 0, 0, 0.14)';

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessible={true}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.container, style, disabled && { opacity: 0.5 }]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {/* Track Base Glass con borde specular */}
      <View
        style={[
          styles.track,
          {
            borderColor,
          },
        ]}
      >
        {/* Capa de refracción Glass nativa */}
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: TRACK_RADIUS - 1 }]}
        />

        {/* Capa de fondo inactivo frosted */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: TRACK_RADIUS - 1,
              backgroundColor: isDark ? '#ffffff' : '#000000',
              opacity: inactiveTrackOpacity,
            },
          ]}
        />

        {/* Capa de color líquido activo */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: TRACK_RADIUS - 1,
              backgroundColor: tintColor,
              opacity: activeTrackOpacity,
            },
          ]}
        />

        {/* Brillo especular superior sutil (Apple highlight) */}
        <View
          pointerEvents="none"
          style={[
            styles.specularHighlight,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.45)',
            },
          ]}
        />

        {/* Thumb / Knob flotante Liquid Glass */}
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX }, { scaleX }, { scaleY }],
              borderColor: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.95)',
            },
          ]}
        >
          {/* Pequeño reflejo interior sobre el knob de cristal */}
          <View
            style={[
              styles.thumbGlint,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
              },
            ]}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  specularHighlight: {
    position: 'absolute',
    top: 1,
    left: 8,
    right: 8,
    height: 1,
    borderRadius: 0.5,
  },
  thumb: {
    position: 'absolute',
    top: PADDING,
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#ffffff',
    borderWidth: 0.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2.5 },
        shadowOpacity: 0.28,
        shadowRadius: 3.5,
      },
      android: {
        elevation: 4,
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
    }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbGlint: {
    position: 'absolute',
    top: 2,
    width: 8,
    height: 2,
    borderRadius: 1,
  },
});

export default LiquidGlassSwitch;
