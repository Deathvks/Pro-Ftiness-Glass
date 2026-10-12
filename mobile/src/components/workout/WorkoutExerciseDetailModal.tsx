/* mobile/src/components/workout/WorkoutExerciseDetailModal.tsx */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { X, Dumbbell, Repeat, Target, Sparkles } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { ExerciseMediaPreview } from '@/components/routines/ExerciseMediaPreview';
import { BACKEND_BASE_URL } from '@/services/apiClient';

interface WorkoutExerciseDetailModalProps {
  exercise: any;
  onClose: () => void;
}

export const WorkoutExerciseDetailModal: React.FC<WorkoutExerciseDetailModalProps> = ({
  exercise,
  onClose,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  if (!exercise) return null;

  const details = exercise.exercise_details || exercise;

  const getImageUrl = (it: any) => {
    const raw =
      it?.image_url ||
      it?.image ||
      it?.exercise_details?.image_url ||
      it?.exercise_details?.image_url_start ||
      '';
    if (!raw) return '';
    if (raw.startsWith('http')) return raw;
    return `${BACKEND_BASE_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
  };

  const description =
    details.description_es ||
    details.description ||
    'Realiza el movimiento controlando la fase excéntrica y manteniendo la tensión adecuada durante toda la serie.';

  return (
    <Modal visible={Boolean(exercise)} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)' }]}>
        <View
          style={[
            styles.sheet,
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

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                {exercise.name}
              </Text>
              <Text style={[styles.subtitle, { color: colors.tint }]}>
                {exercise.sets} series × {exercise.reps} reps
                {exercise.muscle_group ? ` • ${exercise.muscle_group}` : ''}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                onClose();
              }}
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
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Media Player */}
            <View
              style={[
                styles.mediaHero,
                {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.04)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <ExerciseMediaPreview
                item={{
                  ...exercise,
                  ...details,
                }}
                getImageUrl={getImageUrl}
              />
            </View>

            {/* Muscles & Equipment Pills */}
            <View style={styles.pillsRow}>
              {exercise.muscle_group ? (
                <View style={[styles.infoPill, { backgroundColor: colors.tint + '15', borderColor: colors.tint + '35' }]}>
                  <Target size={13} color={colors.tint} style={{ marginRight: 5 }} />
                  <Text style={[styles.infoPillText, { color: colors.tint }]}>
                    {exercise.muscle_group}
                  </Text>
                </View>
              ) : null}

              {details.equipment ? (
                <View style={[styles.infoPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' }]}>
                  <Dumbbell size={13} color={colors.textSecondary} style={{ marginRight: 5 }} />
                  <Text style={[styles.infoPillText, { color: colors.textSecondary }]}>
                    {details.equipment}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Description */}
            <View
              style={[
                styles.descCard,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              <Text style={[styles.descTitle, { color: colors.text }]}>Instrucciones de Ejecución</Text>
              <Text style={[styles.descText, { color: colors.textSecondary }]}>{description}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxHeight: '85%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  mediaHero: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  infoPillText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  descCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  descTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
});
