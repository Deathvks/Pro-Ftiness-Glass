/* mobile/src/components/workout/WorkoutReviewModal.tsx */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import {
  CheckCircle,
  X,
  Save,
  Dumbbell,
  Clock,
  Flame,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { normalizeDecimalInput, normalizeIntegerInput } from '@/utils/workoutHelpers';

interface WorkoutReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSaving: boolean;
}

export const WorkoutReviewModal: React.FC<WorkoutReviewModalProps> = ({
  visible,
  onClose,
  onConfirm,
  isSaving,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const activeWorkout = useAppStore(state => state.activeWorkout);
  const updateActiveWorkoutSet = useAppStore(state => state.updateActiveWorkoutSet);

  if (!visible || !activeWorkout) return null;

  const exercisesWithData = (activeWorkout.exercises || [])
    .map((ex: any, exIndex: number) => ({
      ...ex,
      originalIndex: exIndex,
      validSets: (ex.setsDone || [])
        .map((set: any, setIndex: number) => ({
          ...set,
          originalSetIndex: setIndex,
        }))
        .filter(
          (set: any) =>
            (set.reps !== '' && set.reps != null) ||
            (set.weight_kg !== '' && set.weight_kg != null)
        ),
    }))
    .filter((ex: any) => ex.validSets.length > 0);

  const handleUpdate = (exIndex: number, setIndex: number, field: string, value: string) => {
    if (updateActiveWorkoutSet) {
      updateActiveWorkoutSet(exIndex, setIndex, field, value);
    }
  };

  const handleSave = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    onConfirm();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }]}>
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
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Revisar Entrenamiento</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Verifica tus pesos y repeticiones antes de guardar
              </Text>
            </View>

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
          </View>

          {/* List of completed exercises */}
          <ScrollView contentContainerStyle={styles.scrollList}>
            {exercisesWithData.length === 0 ? (
              <View style={styles.emptyBox}>
                <Dumbbell size={36} color={colors.textSecondary} style={{ marginBottom: 10 }} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No hay series registradas para revisar.
                </Text>
              </View>
            ) : (
              exercisesWithData.map((exercise: any) => (
                <View
                  key={exercise.id || exercise.name}
                  style={[
                    styles.exerciseCard,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <Text style={[styles.cardExerciseName, { color: colors.tint }]}>
                    {exercise.name}
                  </Text>

                  {/* Header de columnas */}
                  <View style={styles.colsHeaderRow}>
                    <Text style={[styles.colHeader, { flex: 0.8, color: colors.textSecondary }]}>#</Text>
                    <Text style={[styles.colHeader, { flex: 2, color: colors.textSecondary }]}>KG</Text>
                    <Text style={[styles.colHeader, { flex: 2, color: colors.textSecondary }]}>REPS</Text>
                    <Text style={[styles.colHeader, { flex: 1.5, color: colors.textSecondary }]}>RIR</Text>
                  </View>

                  {/* Sets */}
                  {exercise.validSets.map((set: any, idx: number) => (
                    <View key={idx} style={styles.reviewSetRow}>
                      <View style={{ flex: 0.8, alignItems: 'center' }}>
                        <View style={[styles.badgeNum, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                          <Text style={[styles.badgeNumText, { color: colors.text }]}>
                            {set.set_number}
                          </Text>
                        </View>
                      </View>

                      <View style={{ flex: 2 }}>
                        <TextInput
                          keyboardType="decimal-pad"
                          value={set.weight_kg !== undefined && set.weight_kg !== null ? String(set.weight_kg) : ''}
                          onChangeText={(v) =>
                            handleUpdate(
                              exercise.originalIndex,
                              set.originalSetIndex,
                              'weight_kg',
                              normalizeDecimalInput(v)
                            )
                          }
                          style={[
                            styles.reviewInput,
                            {
                              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                              color: colors.text,
                            },
                          ]}
                        />
                      </View>

                      <View style={{ flex: 2 }}>
                        <TextInput
                          keyboardType="number-pad"
                          value={set.reps !== undefined && set.reps !== null ? String(set.reps) : ''}
                          onChangeText={(v) =>
                            handleUpdate(
                              exercise.originalIndex,
                              set.originalSetIndex,
                              'reps',
                              normalizeIntegerInput(v)
                            )
                          }
                          style={[
                            styles.reviewInput,
                            {
                              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                              color: colors.text,
                            },
                          ]}
                        />
                      </View>

                      <View style={{ flex: 1.5 }}>
                        <TextInput
                          keyboardType="decimal-pad"
                          placeholder="-"
                          placeholderTextColor={colors.textSecondary}
                          value={set.rir !== undefined && set.rir !== null ? String(set.rir) : ''}
                          onChangeText={(v) =>
                            handleUpdate(
                              exercise.originalIndex,
                              set.originalSetIndex,
                              'rir',
                              normalizeDecimalInput(v)
                            )
                          }
                          style={[
                            styles.reviewInput,
                            {
                              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                              color: colors.text,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer Action */}
          <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: colors.tint,
                  shadowColor: colors.tint,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                  elevation: 6,
                },
                isSaving && { opacity: 0.7 },
              ]}
              activeOpacity={0.82}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              ) : (
                <Save size={18} color="#fff" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Guardando Entrenamiento...' : 'Confirmar y Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
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
    shadowRadius: 12,
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
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    padding: 18,
    gap: 14,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  cardExerciseName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  colsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  reviewSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  badgeNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNumText: {
    fontSize: 11,
    fontWeight: '800',
  },
  reviewInput: {
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    padding: 18,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 52,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
});
