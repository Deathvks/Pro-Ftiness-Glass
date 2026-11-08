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
import { GlassView } from 'expo-glass-effect';
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

  const { IconComponent, iconColor, iconBg, glowColor, cleanMessage } = useMemo(() => {
    if (!currentToast) {
      return {
        IconComponent: Info,
        iconColor: colors.tint,
        iconBg: colors.tint + '20',
        glowColor: colors.tint + '15',
        cleanMessage: '',
      };
    }

    const raw = currentToast.message || '';
    let msg = raw;
    let type = currentToast.type || 'info';

    // Auto-detect based on emojis or keywords if type is default
    if (msg.includes('🏋') || msg.toLowerCase().includes('gimnasio')) {
      type = 'gym';
      msg = msg.replace(/^[🏋️\s]+/, '');
    } else if (msg.includes('🛡') || msg.toLowerCase().includes('escudo')) {
      type = 'shield';
      msg = msg.replace(/^[🛡️\s]+/, '');
    } else if (msg.includes('💧') || msg.toLowerCase().includes('agua')) {
      msg = msg.replace(/^[💧\s]+/, '');
      return {
        IconComponent: Droplets,
        iconColor: '#38bdf8',
        iconBg: 'rgba(56, 189, 248, 0.20)',
        glowColor: 'rgba(56, 189, 248, 0.15)',
        cleanMessage: msg,
      };
    } else if (msg.includes('⚖') || msg.toLowerCase().includes('peso')) {
      msg = msg.replace(/^[⚖️\s]+/, '');
      return {
        IconComponent: Scale,
        iconColor: colors.tint,
        iconBg: colors.tint + '20',
        glowColor: colors.tint + '15',
        cleanMessage: msg,
      };
    }

    switch (type) {
      case 'gym':
        return {
          IconComponent: Dumbbell,
          iconColor: colors.tint,
          iconBg: colors.tint + '25',
          glowColor: colors.tint + '20',
          cleanMessage: msg,
        };
      case 'shield':
        return {
          IconComponent: ShieldCheck,
          iconColor: '#a855f7',
          iconBg: 'rgba(168, 85, 247, 0.22)',
          glowColor: 'rgba(168, 85, 247, 0.18)',
          cleanMessage: msg,
        };
      case 'success':
        return {
          IconComponent: CheckCircle2,
          iconColor: '#22c55e',
          iconBg: 'rgba(34, 197, 94, 0.20)',
          glowColor: 'rgba(34, 197, 94, 0.15)',
          cleanMessage: msg,
        };
      case 'error':
        return {
          IconComponent: AlertCircle,
          iconColor: '#ef4444',
          iconBg: 'rgba(239, 68, 68, 0.20)',
          glowColor: 'rgba(239, 68, 68, 0.15)',
          cleanMessage: msg,
        };
      case 'warning':
        return {
          IconComponent: AlertTriangle,
          iconColor: '#f59e0b',
          iconBg: 'rgba(245, 158, 11, 0.20)',
          glowColor: 'rgba(245, 158, 11, 0.15)',
          cleanMessage: msg,
        };
      case 'info':
      default:
        return {
          IconComponent: Info,
          iconColor: colors.tint,
          iconBg: colors.tint + '20',
          glowColor: colors.tint + '15',
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
              backgroundColor: isDark ? 'rgba(18, 18, 24, 0.94)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.10)',
            },
          ]}
        >
          {/* Liquid Glass blur backdrop */}
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />

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
