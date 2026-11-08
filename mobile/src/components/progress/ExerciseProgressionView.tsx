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
import { GlassView } from 'expo-glass-effect';
import { BookOpen, ChevronDown, Search, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { ExerciseChart } from './ProgressCharts';
import { ExerciseHistoryModal } from './ExerciseHistoryModal';

export function ExerciseProgressionView() {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const workoutLog = useAppStore(state => state.workoutLog) || [];

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
                  placeholder="Buscar ejercicio..."
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.searchInput, { color: colors.text }]}
                  clearButtonMode="while-editing"
                />
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20, gap: 6 }}
              >
                {filteredOptions.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                      No se encontraron ejercicios
                    </Text>
                  </View>
                ) : (
                  filteredOptions.map(ex => {
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
                          styles.exerciseOption,
                          isSelected && {
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.exerciseOptionText,
                            {
                              color: isSelected ? colors.tint : colors.text,
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {ex}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  historyBtn: {
    width: 46,
    height: 46,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  pickerCard: {
    width: '100%',
    maxWidth: 420,
    height: '75%',
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
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pickerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  exerciseOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  exerciseOptionText: {
    fontSize: 14,
  },
});
