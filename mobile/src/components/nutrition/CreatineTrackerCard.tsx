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
              <Text style={[styles.title, { color: colors.text }]}>Creatina</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                (~{creatineTarget}g/día)
              </Text>
            </View>
            <View
              style={[
                styles.actionBtn,
                {
                  backgroundColor: hasLogged
                    ? 'rgba(168, 85, 247, 0.2)'
                    : isDark
                    ? 'rgba(168, 85, 247, 0.15)'
                    : 'rgba(168, 85, 247, 0.1)',
                  borderColor: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.2)',
                },
              ]}
            >
              <Plus size={15} color="#a855f7" />
            </View>
          </View>

          {/* Center Graphic */}
          <View style={styles.centerSection}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: hasLogged ? '#a855f7' : isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: hasLogged ? '#a855f7' : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              {hasLogged ? (
                <Check size={24} color="#ffffff" strokeWidth={3} />
              ) : (
                <Zap size={24} color={colors.textMuted} />
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
              {hasLogged ? '¡Registrado hoy!' : 'Toca para registrar'}
            </Text>
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
  actionBtn: {
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
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginVertical: 2,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
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
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
