/* mobile/src/components/workout/WorkoutSupersetCard.tsx */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link2 } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

interface WorkoutSupersetCardProps {
  children: React.ReactNode;
}

export const WorkoutSupersetCard: React.FC<WorkoutSupersetCardProps> = ({ children }) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  return (
    <View
      style={[
        styles.supersetContainer,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          borderLeftColor: colors.tint,
        },
      ]}
    >
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      {/* Superset header badge */}
      <View style={styles.supersetTag}>
        <View style={[styles.iconPill, { backgroundColor: colors.tint + '20' }]}>
          <Link2 size={13} color={colors.tint} />
        </View>
        <Text style={[styles.supersetLabel, { color: colors.tint }]}>
          SUPERSERIE (SIN DESCANSO ENTRE EJERCICIOS)
        </Text>
      </View>

      <View style={styles.childrenWrapper}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  supersetContainer: {
    borderRadius: 30,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  supersetTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  iconPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  supersetLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  childrenWrapper: {
    gap: 8,
  },
});
