/* mobile/src/components/workout/WorkoutSummaryModal.tsx */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import {
  Trophy,
  Clock,
  Flame,
  Dumbbell,
  CheckCircle2,
  ArrowRight,
  Share2,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { formatWorkoutTime } from '@/utils/workoutHelpers';

interface WorkoutSummaryModalProps {
  visible: boolean;
  workoutData: any;
  onClose: () => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  visible,
  workoutData,
  onClose,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  if (!visible || !workoutData) return null;

  // Cálculo de volumen total y series completadas
  let totalVolumeKg = 0;
  let totalSetsCount = 0;

  (workoutData.details || []).forEach((d: any) => {
    (d.setsDone || []).forEach((s: any) => {
      const w = parseFloat(s.weight_kg) || 0;
      const r = parseInt(s.reps, 10) || 0;
      totalVolumeKg += w * r;
      totalSetsCount += 1;
    });
  });

  const handleFinish = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)' }]}>
        <View
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

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Trophy celebration header */}
            <View style={styles.trophyWrapper}>
              <View
                style={[
                  styles.trophyCircle,
                  {
                    backgroundColor: colors.tint + '20',
                    borderColor: colors.tint + '40',
                  },
                ]}
              >
                <Trophy size={42} color={colors.tint} />
              </View>

              <Text style={[styles.title, { color: colors.text }]}>
                ¡Entrenamiento Completado!
              </Text>
              <Text style={[styles.routineName, { color: colors.tint }]}>
                {workoutData.routineName || 'Sesión de Entrenamiento'}
              </Text>
            </View>

            {/* Stats Grid Liquid Glass */}
            <View style={styles.statsGrid}>
              {/* Tiempo */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <Clock size={18} color="#3b82f6" style={{ marginBottom: 6 }} />
                <Text style={[styles.statVal, { color: colors.text }]}>
                  {formatWorkoutTime(workoutData.duration_seconds || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>TIEMPO</Text>
              </View>

              {/* Calorías */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <Flame size={18} color="#f97316" style={{ marginBottom: 6 }} />
                <Text style={[styles.statVal, { color: colors.text }]}>
                  {workoutData.calories_burned || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>KCAL</Text>
              </View>

              {/* Volumen */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <Dumbbell size={18} color={colors.tint} style={{ marginBottom: 6 }} />
                <Text style={[styles.statVal, { color: colors.text }]}>
                  {Math.round(totalVolumeKg)} kg
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>VOLUMEN</Text>
              </View>

              {/* Series */}
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <CheckCircle2 size={18} color="#22c55e" style={{ marginBottom: 6 }} />
                <Text style={[styles.statVal, { color: colors.text }]}>
                  {totalSetsCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>SERIES</Text>
              </View>
            </View>

            {/* Botón Finalizar / Salir */}
            <TouchableOpacity
              onPress={handleFinish}
              style={[
                styles.finishBtn,
                {
                  backgroundColor: colors.tint,
                  shadowColor: colors.tint,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                  elevation: 6,
                },
              ]}
              activeOpacity={0.82}
            >
              <Text style={styles.finishBtnText}>Volver a Rutinas</Text>
              <ArrowRight size={18} color="#fff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
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
    maxWidth: 380,
    maxHeight: '85%',
    borderRadius: 36,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  trophyWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  routineName: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  finishBtn: {
    width: '100%',
    height: 52,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
});
