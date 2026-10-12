/* mobile/src/components/workout/WorkoutHeatmapModal.tsx */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Activity, X, Dumbbell } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

interface WorkoutHeatmapModalProps {
  visible: boolean;
  exercises: any[];
  onClose: () => void;
}

export const WorkoutHeatmapModal: React.FC<WorkoutHeatmapModalProps> = ({
  visible,
  exercises = [],
  onClose,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const muscleVolumes = useMemo(() => {
    const scores: { [key: string]: number } = {};

    exercises.forEach((ex: any) => {
      const rawMuscle = ex.muscle_group || ex.exercise_details?.muscle_group || 'General';
      const muscles = rawMuscle.split(',').map((m: string) => m.trim());
      const setsCount = Array.isArray(ex.setsDone)
        ? ex.setsDone.length
        : parseInt(ex.sets, 10) || 3;

      muscles.forEach((m: string) => {
        if (m) {
          scores[m] = (scores[m] || 0) + setsCount;
        }
      });
    });

    return Object.entries(scores).sort((a, b) => b[1] - a[1]);
  }, [exercises]);

  const getIntensityInfo = (sets: number) => {
    if (sets >= 12) return { label: 'Máximo', color: '#ef4444' };
    if (sets >= 8) return { label: 'Alto', color: '#f59e0b' };
    if (sets >= 4) return { label: 'Medio', color: '#22c55e' };
    return { label: 'Bajo', color: '#06b6d4' };
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.35)' }]} onPress={onClose}>
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[
              styles.closeBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colors.tint + '18' }]}>
              <Activity size={22} color={colors.tint} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Volumen por Grupo Muscular</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Impacto y series acumuladas en esta sesión
            </Text>
          </View>

          <ScrollView style={styles.list} contentContainerStyle={{ gap: 10 }}>
            {muscleVolumes.length === 0 ? (
              <Text style={{ textAlign: 'center', color: colors.textSecondary, paddingVertical: 20 }}>
                No hay ejercicios en esta rutina
              </Text>
            ) : (
              muscleVolumes.map(([muscle, count]) => {
                const intensity = getIntensityInfo(count);
                return (
                  <View
                    key={muscle}
                    style={[
                      styles.muscleRow,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.muscleName, { color: colors.text }]}>
                        {muscle}
                      </Text>
                      <Text style={[styles.setsCount, { color: colors.textSecondary }]}>
                        {count} series estimadas
                      </Text>
                    </View>

                    <View style={[styles.intensityPill, { backgroundColor: intensity.color + '22', borderColor: intensity.color + '55' }]}>
                      <Text style={[styles.intensityText, { color: intensity.color }]}>
                        {intensity.label}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '75%',
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  list: {
    maxHeight: 280,
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  muscleName: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  setsCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  intensityPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  intensityText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
