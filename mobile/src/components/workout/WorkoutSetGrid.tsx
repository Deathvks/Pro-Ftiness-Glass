/* mobile/src/components/workout/WorkoutSetGrid.tsx */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {
  CornerDownRight,
  X,
  Clock,
  Flame,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { normalizeDecimalInput, normalizeIntegerInput } from '@/utils/workoutHelpers';

interface WorkoutSetGridProps {
  setsDone: any[];
  restSeconds?: number;
  actualExIndex: number;
  hasWorkoutStarted: boolean;
  onUpdateSet: (exIdx: number, setIdx: number, field: string, val: string) => void;
  onAddDropset: (exIdx: number, setIdx: number) => void;
  onRemoveDropset: (exIdx: number, setIdx: number) => void;
  onToggleWarmup?: (exIdx: number, setIdx: number) => void;
  onOpenRestModal: (restSeconds: number) => void;
  onDisabledInputClick?: () => void;
  onDisabledButtonClick?: () => void;
}

export const WorkoutSetGrid: React.FC<WorkoutSetGridProps> = ({
  setsDone,
  restSeconds = 90,
  actualExIndex,
  hasWorkoutStarted,
  onUpdateSet,
  onAddDropset,
  onRemoveDropset,
  onToggleWarmup,
  onOpenRestModal,
  onDisabledInputClick,
  onDisabledButtonClick,
}) => {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const inputBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <View style={styles.container}>
      {/* Cabecera */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerCol, { flex: 1.1, color: colors.textSecondary }]}>SERIE</Text>
        <Text style={[styles.headerCol, { flex: 1.3, color: colors.textSecondary }]}>KG</Text>
        <Text style={[styles.headerCol, { flex: 1.3, color: colors.textSecondary }]}>REPS</Text>
        <Text style={[styles.headerCol, { flex: 1.1, color: colors.textSecondary }]}>RIR</Text>
        <Text style={[styles.headerCol, { flex: 1, color: colors.textSecondary }]}>DS</Text>
        <Text style={[styles.headerCol, { flex: 1, color: colors.textSecondary }]}>RELOJ</Text>
      </View>

      {/* Filas de series */}
      {setsDone.map((set, setIndex) => {
        const hasWeight =
          set.weight_kg !== null &&
          set.weight_kg !== undefined &&
          String(set.weight_kg).trim() !== '';
        const hasReps =
          set.reps !== null &&
          set.reps !== undefined &&
          String(set.reps).trim() !== '';
        const isSetCompleted = hasWeight && hasReps;

        return (
          <View key={setIndex} style={styles.setRow}>
            {/* 1. Toggle Calentamiento / DS / Serie # */}
            <View style={{ flex: 1.1 }}>
              <TouchableOpacity
                disabled={!hasWorkoutStarted}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  if (onToggleWarmup) onToggleWarmup(actualExIndex, setIndex);
                }}
                style={[
                  styles.setNumBtn,
                  set.is_dropset
                    ? {
                        backgroundColor: 'rgba(239, 68, 68, 0.14)',
                        borderColor: 'rgba(239, 68, 68, 0.35)',
                      }
                    : set.is_warmup
                    ? {
                        backgroundColor: 'rgba(249, 115, 22, 0.14)',
                        borderColor: 'rgba(249, 115, 22, 0.35)',
                      }
                    : {
                        backgroundColor: inputBg,
                        borderColor: inputBorder,
                      },
                ]}
                activeOpacity={0.7}
              >
                {set.is_dropset ? (
                  <Text style={[styles.setNumText, { color: '#ef4444' }]}>DS</Text>
                ) : set.is_warmup ? (
                  <Flame size={15} color="#f97316" strokeWidth={2.5} />
                ) : (
                  <Text style={[styles.setNumText, { color: colors.text }]}>
                    {set.set_number}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 2. Input: Peso (kg) */}
            <View style={{ flex: 1.3 }}>
              <TextInput
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary + '70'}
                value={set.weight_kg !== undefined && set.weight_kg !== null ? String(set.weight_kg) : ''}
                editable={hasWorkoutStarted}
                onTouchStart={!hasWorkoutStarted && onDisabledInputClick ? onDisabledInputClick : undefined}
                onChangeText={(text) => {
                  onUpdateSet(actualExIndex, setIndex, 'weight_kg', normalizeDecimalInput(text));
                }}
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    color: colors.text,
                    opacity: hasWorkoutStarted ? 1 : 0.5,
                  },
                ]}
              />
            </View>

            {/* 3. Input: Reps */}
            <View style={{ flex: 1.3 }}>
              <TextInput
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary + '70'}
                value={set.reps !== undefined && set.reps !== null ? String(set.reps) : ''}
                editable={hasWorkoutStarted}
                onTouchStart={!hasWorkoutStarted && onDisabledInputClick ? onDisabledInputClick : undefined}
                onChangeText={(text) => {
                  onUpdateSet(actualExIndex, setIndex, 'reps', normalizeIntegerInput(text));
                }}
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    color: colors.text,
                    opacity: hasWorkoutStarted ? 1 : 0.5,
                  },
                ]}
              />
            </View>

            {/* 4. Input: RIR (Reps in Reserve) */}
            <View style={{ flex: 1.1 }}>
              <TextInput
                keyboardType="decimal-pad"
                placeholder="-"
                placeholderTextColor={colors.textSecondary + '70'}
                value={set.rir !== undefined && set.rir !== null ? String(set.rir) : ''}
                editable={hasWorkoutStarted}
                onTouchStart={!hasWorkoutStarted && onDisabledInputClick ? onDisabledInputClick : undefined}
                onChangeText={(text) => {
                  onUpdateSet(actualExIndex, setIndex, 'rir', normalizeDecimalInput(text));
                }}
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    color: colors.text,
                    opacity: hasWorkoutStarted ? 1 : 0.5,
                  },
                ]}
              />
            </View>

            {/* 5. Botón Dropset (+ o X) */}
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                disabled={!hasWorkoutStarted}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  if (set.is_dropset) {
                    onRemoveDropset(actualExIndex, setIndex);
                  } else {
                    onAddDropset(actualExIndex, setIndex);
                  }
                }}
                style={[
                  styles.iconActionBtn,
                  set.is_dropset
                    ? {
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                      }
                    : {
                        backgroundColor: inputBg,
                        borderColor: inputBorder,
                      },
                  !hasWorkoutStarted && { opacity: 0.4 },
                ]}
                activeOpacity={0.7}
              >
                {set.is_dropset ? (
                  <X size={16} color="#ef4444" strokeWidth={2.5} />
                ) : (
                  <CornerDownRight size={15} color={colors.textSecondary} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </View>

            {/* 6. Botón Reloj / Rest Timer */}
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                disabled={!hasWorkoutStarted}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  } catch {}
                  onOpenRestModal(restSeconds);
                }}
                style={[
                  styles.iconActionBtn,
                  isSetCompleted
                    ? {
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        borderColor: 'rgba(34, 197, 94, 0.35)',
                      }
                    : {
                        backgroundColor: inputBg,
                        borderColor: inputBorder,
                      },
                  !hasWorkoutStarted && { opacity: 0.4 },
                ]}
                activeOpacity={0.7}
              >
                {isSetCompleted ? (
                  <Check size={16} color="#22c55e" strokeWidth={3} />
                ) : (
                  <Clock size={16} color={colors.textSecondary} strokeWidth={2.2} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  headerCol: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  setNumBtn: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumText: {
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    paddingHorizontal: 4,
  },
  iconActionBtn: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
