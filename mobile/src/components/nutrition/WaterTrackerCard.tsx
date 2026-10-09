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
      <View style={styles.glassWrapper}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.card,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.4)',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
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
              <Edit2 size={15} color="#3b82f6" />
            </View>
          </View>

          {/* Center Graphic */}
          <View style={styles.centerSection}>
            <View style={styles.iconContainer}>
              <Droplet size={38} color="#3b82f6" fill="#3b82f6" />
            </View>
            <View style={styles.textRow}>
              <Text style={[styles.mainValue, { color: colors.text }]}>{currentMl}</Text>
              <Text style={[styles.unitText, { color: colors.textMuted }]}>ml</Text>
              <Text style={[styles.pctText, { color: '#3b82f6' }]}>{percentage}%</Text>
            </View>

            {/* Progress Bar */}
            <View
              style={[
                styles.progressBarBg,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
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
    flex: 1,
  },
  glassWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  card: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  centerSection: {
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    marginVertical: 2,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  mainValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pctText: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
