import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Droplet, Edit2 } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';

interface WaterTrackerCardProps {
  currentMl: number;
  targetMl: number;
  onPress: () => void;
}

export const WaterTrackerCard: React.FC<WaterTrackerCardProps> = ({
  currentMl,
  targetMl,
  onPress,
}) => {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const percentage = targetMl > 0 ? Math.min(100, Math.round((currentMl / targetMl) * 100)) : 0;

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={styles.container}
    >
      <View style={[styles.glassWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.card}>
          {/* Watermark in bottom right */}
          <View style={styles.watermark}>
            <Droplet size={140} color="#3b82f6" />
          </View>

          {/* Header */}
          <View
            style={[
              styles.header,
              {
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: colors.text }]}>Agua</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                ({currentMl} / {targetMl} ml)
              </Text>
            </View>

            <View
              style={[
                styles.editBtn,
                {
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                },
              ]}
            >
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
              />
              <Edit2 size={16} color="#3b82f6" />
            </View>
          </View>

          {/* Center Graphic */}
          <View style={styles.centerSection}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.28)' : 'rgba(59, 130, 246, 0.2)',
                },
              ]}
            >
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
              />
              <Droplet size={38} color="#3b82f6" fill="#3b82f6" />
            </View>

            <View style={styles.textRow}>
              <Text style={[styles.mainValue, { color: colors.text }]}>{currentMl}</Text>
              <Text style={[styles.unitText, { color: colors.textMuted }]}>ml</Text>
            </View>

            {/* Progress Bar */}
            <View
              style={[
                styles.progressBarBg,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
            >
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: 5 }]}
              />
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${percentage}%`,
                    backgroundColor: '#3b82f6',
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 14,
  },
  glassWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
  },
  card: {
    padding: 18,
    borderRadius: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    bottom: -30,
    right: -25,
    opacity: 0.07,
    transform: [{ rotate: '15deg' }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 14,
    zIndex: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  centerSection: {
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
    paddingVertical: 4,
  },
  iconContainer: {
    width: 62,
    height: 62,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 4,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  mainValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  unitText: {
    fontSize: 15,
    fontWeight: '600',
  },
  progressBarBg: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 6,
    borderWidth: 1,
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
});
