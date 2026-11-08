import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Medal,
  Star,
  Trophy,
  Crown,
  Flame,
  Zap,
  Sparkles,
  Gem as Diamond,
  Shield,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore from '@/store/useAppStore';

export const getTier = (level: number) => {
  if (level < 10) return { name: 'Bronce', colors: ['#CD7F32', '#8B4513'] as const, icon: Shield };
  if (level < 20) return { name: 'Plata', colors: ['#E5E4E2', '#9CA3AF'] as const, icon: Medal };
  if (level < 30) return { name: 'Oro', colors: ['#FFD700', '#B8860B'] as const, icon: Trophy };
  if (level < 40) return { name: 'Platino', colors: ['#E5E4E2', '#5F9EA0'] as const, icon: Star };
  if (level < 50) return { name: 'Diamante', colors: ['#00FFFF', '#00008B'] as const, icon: Diamond };
  if (level < 60) return { name: 'Maestro', colors: ['#9370DB', '#4B0082'] as const, icon: Zap };
  if (level < 70) return { name: 'Gran Maestro', colors: ['#FF69B4', '#C71585'] as const, icon: Flame };
  if (level < 80) return { name: 'Épico', colors: ['#FF4500', '#8B0000'] as const, icon: Crown };
  if (level < 90) return { name: 'Leyenda', colors: ['#FFD700', '#8B0000'] as const, icon: Sparkles };
  if (level < 100) return { name: 'Mítico', colors: ['#00FFFF', '#FF1493'] as const, icon: Crown };
  return { name: 'Inmortal', colors: ['#FDE047', '#9333EA'] as const, icon: Crown };
};

const SIZES = {
  xs: { wrapper: 22, inner: 18, text: 9, iconBox: 10, icon: 5, offset: -2 },
  sm: { wrapper: 28, inner: 23, text: 12, iconBox: 12, icon: 7, offset: -2 },
  md: { wrapper: 70, inner: 64, text: 30, iconBox: 28, icon: 14, offset: 0 },
  lg: { wrapper: 96, inner: 88, text: 38, iconBox: 36, icon: 18, offset: 0 },
  xl: { wrapper: 120, inner: 110, text: 50, iconBox: 44, icon: 22, offset: 0 },
};

interface LevelBadgeProps {
  level?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  bgTheme?: string;
}

export default function LevelBadge({
  level = 1,
  size = 'md',
  showName = false,
  bgTheme,
}: LevelBadgeProps) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const tier = getTier(level);
  const Icon = tier.icon;
  const config = SIZES[size] || SIZES.md;

  const innerBg = bgTheme || (isDark ? '#0f172a' : '#ffffff');

  return (
    <View style={styles.container}>
      <View
        style={{
          width: config.wrapper,
          height: config.wrapper + (size === 'sm' || size === 'xs' ? 4 : 8),
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <LinearGradient
          colors={tier.colors}
          style={{
            width: config.wrapper,
            height: config.wrapper,
            borderRadius: config.wrapper / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: config.inner,
              height: config.inner,
              borderRadius: config.inner / 2,
              backgroundColor: innerBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: config.text,
                fontWeight: '900',
                color: tier.colors[0],
                includeFontPadding: false,
                lineHeight: config.text + 2,
              }}
            >
              {level}
            </Text>
          </View>
        </LinearGradient>

        <View
          style={{
            position: 'absolute',
            bottom: config.offset,
            width: config.iconBox,
            height: config.iconBox,
            borderRadius: config.iconBox / 2,
            backgroundColor: innerBg,
            padding: 1.5,
            zIndex: 10,
          }}
        >
          <LinearGradient
            colors={tier.colors}
            style={{
              flex: 1,
              borderRadius: config.iconBox / 2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={config.icon} color="#ffffff" strokeWidth={2.5} />
          </LinearGradient>
        </View>
      </View>

      {showName && (
        <Text
          style={[
            styles.tierName,
            { color: tier.colors[0] },
          ]}
        >
          {tier.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierName: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
