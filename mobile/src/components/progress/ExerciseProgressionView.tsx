import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { BookOpen, ChevronDown, Search, X, Dumbbell, TrendingUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { ExerciseChart } from './ProgressCharts';
import { ExerciseHistoryModal } from './ExerciseHistoryModal';
import { getContrastColor } from '@/utils/colorUtils';

export function ExerciseProgressionView() {
  const router = useRouter();
  const colors = useAppColors();
  const theme = useAppStore((state: any) => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentText = getContrastColor(colors.tint, theme);

  const workoutLog = useAppStore((state: any) => state.workoutLog) || [];

  // Extract all exercises executed in logs
  const executedExercises = useMemo(() => {
    const set = new Set<string>();
    workoutLog.forEach((log: any) => {
      log.WorkoutLogDetails?.forEach((d: any) => {
        if (d.exercise_name) set.add(d.exercise_name);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [workoutLog]);

  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (executedExercises.length > 0 && !selectedExercise) {
      setSelectedExercise(executedExercises[0]);
    }
  }, [executedExercises, selectedExercise]);

  // Build progression data for the selected exercise
  const exerciseProgressData = useMemo(() => {
    if (!selectedExercise || !workoutLog.length) return [];

    const map = new Map<number, { 'Peso Máximo (kg)': number; '1RM Estimado (kg)': number }>();

    workoutLog.forEach((log: any) => {
      const logTime = new Date(log.workout_date).getTime();
      if (isNaN(logTime)) return;

      log.WorkoutLogDetails?.forEach((d: any) => {
        if (d.exercise_name?.toLowerCase() === selectedExercise.toLowerCase()) {
          const bestWeight = parseFloat(d.best_set_weight) || 0;
          const est1rm = parseFloat(d.estimated_1rm) || 0;

          if (bestWeight > 0 || est1rm > 0) {
            const existing = map.get(logTime);
            if (existing) {
              existing['Peso Máximo (kg)'] = Math.max(existing['Peso Máximo (kg)'], bestWeight);
              existing['1RM Estimado (kg)'] = Math.max(existing['1RM Estimado (kg)'], est1rm);
            } else {
              map.set(logTime, {
                'Peso Máximo (kg)': bestWeight,
                '1RM Estimado (kg)': est1rm,
              });
            }
          }
        }
      });
    });

    return Array.from(map.entries())
      .map(([date, vals]) => ({ date, ...vals }))
      .sort((a, b) => a.date - b.date);
  }, [workoutLog, selectedExercise]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return executedExercises;
    return executedExercises.filter(ex =>
      ex.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [executedExercises, searchQuery]);

  return (
    <View style={styles.container}>
      {executedExercises.length === 0 ? (
        /* Empty State Responsivo con Liquid Glass cuando no hay datos */
        <View
          style={[
            styles.emptyCard,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
          />
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.tint + '18' }]}>
            <Dumbbell size={32} color={colors.tint} strokeWidth={2.2} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Sin progresión de ejercicios aún
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            A medida que completes entrenamientos registrando tus series de pesas, aquí podrás consultar la evolución histórica de cargas, cálculo automático de 1RM y récords personales (PR) de cada ejercicio.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              router.push('/(tabs)/routines' as any);
            }}
            style={[styles.emptyCtaBtn, { backgroundColor: colors.tint }]}
          >
            <TrendingUp size={18} color={accentText} strokeWidth={2.5} />
            <Text style={[styles.emptyCtaText, { color: accentText }]}>
              Ir a Mis Rutinas
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Top Controls: Exercise Selector & History Button */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                setShowPicker(true);
              }}
              style={[
                styles.selectorBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <Text
                style={[
                  styles.selectorText,
                  { color: selectedExercise ? colors.text : colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {selectedExercise || 'Elige un ejercicio'}
              </Text>
              <ChevronDown size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={!selectedExercise}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                setShowHistory(true);
              }}
              style={[
                styles.historyBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(0, 0, 0, 0.08)',
                },
                !selectedExercise && { opacity: 0.4 },
              ]}
            >
              <BookOpen size={20} color={colors.tint} />
            </TouchableOpacity>
          </View>

          {/* Chart */}
          <ExerciseChart data={exerciseProgressData} exerciseName={selectedExercise} />
        </>
      )}

      {/* Exercise Picker Modal */}
      <Modal visible={showPicker} transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
        <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
          <View style={styles.pickerOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPicker(false)} />
            <View
              style={[
                styles.pickerCard,
                {
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
            >
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
              />

              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: colors.text }]}>
                  Selecciona un ejercicio
                </Text>
                <TouchableOpacity
                  onPress={() => setShowPicker(false)}
                  style={styles.pickerCloseBtn}
                >
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              >
                <Search size={18} color={colors.textSecondary} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar en historial..."
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.searchInput, { color: colors.text }]}
                  clearButtonMode="while-editing"
                />
              </View>

              <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                {filteredOptions.map(ex => {
                  const isSelected = selectedExercise === ex;
                  return (
                    <TouchableOpacity
                      key={ex}
                      activeOpacity={0.7}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {}
                        setSelectedExercise(ex);
                        setShowPicker(false);
                      }}
                      style={[
                        styles.optionItem,
                        isSelected && {
                          backgroundColor: colors.tint + '18',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color: isSelected ? colors.tint : colors.text,
                            fontWeight: isSelected ? '800' : '500',
                          },
                        ]}
                      >
                        {ex}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {filteredOptions.length === 0 && (
                  <View style={styles.emptySearch}>
                    <Text style={[styles.emptySearchText, { color: colors.textSecondary }]}>
                      No se encontraron ejercicios ejecutados
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </GlassView>
      </Modal>

      {/* History Modal */}
      <ExerciseHistoryModal
        visible={showHistory}
        exerciseName={selectedExercise}
        onClose={() => setShowHistory(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  historyBtn: {
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  pickerCard: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  pickerCloseBtn: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  optionsList: {
    maxHeight: 320,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 14,
  },
  emptySearch: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 13,
  },
  emptyCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 320,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
  },
  emptyCtaText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
