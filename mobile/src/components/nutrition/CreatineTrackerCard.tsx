import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Zap, Check, Plus } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';

interface CreatineTrackerCardProps {
  creatineTarget: string | number;
  dosesCount: number;
  onPress: () => void;
}

export const CreatineTrackerCard: React.FC<CreatineTrackerCardProps> = ({
  creatineTarget,
  dosesCount,
  onPress,
}) => {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const hasLogged = dosesCount > 0;

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
            <Zap size={140} color="#a855f7" />
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
              <Text style={[styles.title, { color: colors.text }]}>Creatina</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                (~{creatineTarget}g/día)
              </Text>
            </View>

            <View
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.1)',
                  borderColor: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.2)',
                },
              ]}
            >
              <Plus size={16} color="#a855f7" />
            </View>
          </View>

          {/* Center Graphic */}
          <View style={styles.centerSection}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: hasLogged ? '#a855f7' : isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: hasLogged ? '#a855f7' : colors.border,
                },
              ]}
            >
              {hasLogged ? (
                <Check size={38} color="#ffffff" strokeWidth={3.5} />
              ) : (
                <Zap size={38} color={colors.textSecondary} strokeWidth={1.5} />
              )}
            </View>

            <View style={styles.textRow}>
              <Text style={[styles.mainValue, { color: colors.text }]}>{dosesCount}</Text>
              <Text style={[styles.unitText, { color: colors.textSecondary }]}>
                {dosesCount === 1 ? 'Toma' : 'Tomas'}
              </Text>
            </View>

            <Text
              style={[
                styles.statusText,
                { color: hasLogged ? '#a855f7' : colors.textMuted },
              ]}
            >
              {hasLogged ? '¡Registrado!' : 'Toca para registrar'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
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
    bottom: -25,
    right: -20,
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
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  centerSection: {
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
    paddingVertical: 4,
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginVertical: 4,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  mainValue: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});
