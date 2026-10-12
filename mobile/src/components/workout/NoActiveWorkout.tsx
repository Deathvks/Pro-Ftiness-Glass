/* mobile/src/components/workout/NoActiveWorkout.tsx */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Dumbbell, HeartPulse } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

interface NoActiveWorkoutProps {
  onGoToRoutines: () => void;
  onStartQuickCardio?: () => void;
}

export const NoActiveWorkout: React.FC<NoActiveWorkoutProps> = ({
  onGoToRoutines,
  onStartQuickCardio,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        {/* Icon square */}
        <View
          style={[
            styles.iconSquare,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <Dumbbell size={40} color={colors.textSecondary} strokeWidth={1.5} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Sin entrenamiento activo</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Empieza una rutina programada o registra una sesión de cardio rápida.
        </Text>

        <View style={styles.buttonsCol}>
          <TouchableOpacity
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch {}
              onGoToRoutines();
            }}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: colors.tint,
                shadowColor: colors.tint,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 5,
              },
            ]}
            activeOpacity={0.82}
          >
            <Dumbbell size={18} color="#fff" strokeWidth={2.5} style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Ir a Rutinas</Text>
          </TouchableOpacity>

          {onStartQuickCardio ? (
            <TouchableOpacity
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                onStartQuickCardio();
              }}
              style={[
                styles.secondaryBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
              activeOpacity={0.75}
            >
              <HeartPulse size={18} color="#ef4444" strokeWidth={2.5} style={{ marginRight: 8 }} />
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Cardio Rápido</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 32,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  iconSquare: {
    width: 84,
    height: 84,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    zIndex: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
    zIndex: 2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 10,
    zIndex: 2,
  },
  buttonsCol: {
    width: '100%',
    gap: 12,
    zIndex: 2,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 20,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 20,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
