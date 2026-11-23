/* mobile/src/components/ui/ToastContainer.tsx */
import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Dumbbell,
  ShieldCheck,
  Droplets,
  Scale,
  Sparkles,
} from 'lucide-react-native';

import { useToastStore, ToastItem } from '@/store/toastStore';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';

export const ToastContainer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const currentToast = useToastStore((state) => state.currentToast);
  const hideToast = useToastStore((state) => state.hideToast);

  const colors = useAppColors();
  const theme = useAppStore((state) => state.theme);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const supportsNativeGlass = useMemo(() => {
    if (Platform.OS !== 'ios') return false;
    try {
      return isLiquidGlassAvailable();
    } catch {
      return false;
    }
  }, []);

  const anim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (currentToast) {
      try {
        if (currentToast.type === 'error') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else if (currentToast.type === 'success' || currentToast.type === 'gym') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch {}

      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();

      const duration = currentToast.duration || 3500;
      timerRef.current = setTimeout(() => {
        dismiss();
      }, duration);
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentToast]);

  const dismiss = () => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      hideToast();
    });
  };

  const { IconComponent, iconColor, iconBg, glowColor, borderTint, cleanMessage } = useMemo(() => {
    if (!currentToast) {
      return {
        IconComponent: Info,
        iconColor: colors.tint,
        iconBg: colors.tint + '22',
        glowColor: colors.tint + '16',
        borderTint: colors.tint + '38',
        cleanMessage: '',
      };
    }

    const raw = currentToast.message || '';
    let msg = raw;
    let type = currentToast.type || 'info';
    const lower = msg.toLowerCase();
    const isXpOrGamification =
      /\bxp\b/i.test(msg) ||
      lower.includes('nivel') ||
      lower.includes('insignia') ||
      lower.includes('reto completado');

    // Auto-detect based on emojis or keywords if type is default
    if (msg.includes('🏋') || lower.includes('gimnasio')) {
      type = 'gym';
      msg = msg.replace(/^[🏋️\s]+/, '');
    } else if (msg.includes('🛡') || lower.includes('escudo')) {
      type = 'shield';
      msg = msg.replace(/^[🛡️\s]+/, '');
    } else if (msg.includes('💧') || lower.includes('agua')) {
      msg = msg.replace(/^[💧\s]+/, '');
      return {
        IconComponent: Droplets,
        iconColor: '#38bdf8',
        iconBg: 'rgba(56, 189, 248, 0.20)',
        glowColor: 'rgba(56, 189, 248, 0.14)',
        borderTint: 'rgba(56, 189, 248, 0.35)',
        cleanMessage: msg,
      };
    } else if (msg.includes('⚖') || lower.includes('peso')) {
      msg = msg.replace(/^[⚖️\s]+/, '');
      return {
        IconComponent: Scale,
        iconColor: colors.tint,
        iconBg: colors.tint + '22',
        glowColor: colors.tint + '16',
        borderTint: colors.tint + '38',
        cleanMessage: msg,
      };
    }

    switch (type) {
      case 'gym':
        return {
          IconComponent: Dumbbell,
          iconColor: colors.tint,
          iconBg: colors.tint + '24',
          glowColor: colors.tint + '18',
          borderTint: colors.tint + '40',
          cleanMessage: msg,
        };
      case 'shield':
        return {
          IconComponent: ShieldCheck,
          iconColor: colors.tint,
          iconBg: colors.tint + '22',
          glowColor: colors.tint + '18',
          borderTint: colors.tint + '38',
          cleanMessage: msg,
        };
      case 'success':
        return {
          IconComponent: isXpOrGamification ? Sparkles : CheckCircle2,
          iconColor: colors.tint,
          iconBg: colors.tint + '22',
          glowColor: colors.tint + '16',
          borderTint: colors.tint + '40',
          cleanMessage: msg,
        };
      case 'error':
        return {
          IconComponent: AlertCircle,
          iconColor: '#ef4444',
          iconBg: 'rgba(239, 68, 68, 0.20)',
          glowColor: 'rgba(239, 68, 68, 0.14)',
          borderTint: 'rgba(239, 68, 68, 0.35)',
          cleanMessage: msg,
        };
      case 'warning':
        return {
          IconComponent: AlertTriangle,
          iconColor: '#f59e0b',
          iconBg: 'rgba(245, 158, 11, 0.20)',
          glowColor: 'rgba(245, 158, 11, 0.14)',
          borderTint: 'rgba(245, 158, 11, 0.35)',
          cleanMessage: msg,
        };
      case 'info':
      default:
        return {
          IconComponent: isXpOrGamification ? Sparkles : Info,
          iconColor: colors.tint,
          iconBg: colors.tint + '22',
          glowColor: colors.tint + '16',
          borderTint: colors.tint + '38',
          cleanMessage: msg,
        };
    }
  }, [currentToast, colors.tint]);

  if (!currentToast) return null;

  return (
    <View
      style={[
        styles.overlay,
        {
          top: insets.top + 8,
        },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.animatedWrapper,
          {
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-35, 0],
                }),
              },
              {
                scale: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1],
                }),
              },
            ],
          },
        ]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={dismiss}
          style={[
            styles.toastCard,
            {
              backgroundColor: supportsNativeGlass
                ? 'transparent'
                : isDark
                ? 'rgba(18, 18, 24, 0.88)'
                : 'rgba(255, 255, 255, 0.90)',
              borderColor: borderTint,
            },
          ]}
        >
          {/* Liquid Glass backdrop */}
          {supportsNativeGlass ? (
            <GlassView
              pointerEvents="none"
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: 22, borderCurve: 'continuous' }]}
            />
          ) : (
            <BlurView
              pointerEvents="none"
              intensity={Platform.OS === 'android' ? 45 : 30}
              tint={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
            />
          )}

          {/* Ambient Glow */}
          <View
            style={[styles.glow, { backgroundColor: glowColor }]}
            pointerEvents="none"
          />

          <View style={styles.content}>
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
              <IconComponent size={16} color={iconColor} strokeWidth={2.5} />
            </View>
            <Text
              style={[styles.message, { color: colors.text }]}
              numberOfLines={3}
            >
              {cleanMessage}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999999,
    elevation: 999999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedWrapper: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 20,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    letterSpacing: -0.1,
  },
});
