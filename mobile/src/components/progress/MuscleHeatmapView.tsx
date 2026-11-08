import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { GlassView } from 'expo-glass-effect';
import { Lightbulb, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import {
  ANTERIOR_MUSCLE_DATA,
  POSTERIOR_MUSCLE_DATA,
} from './muscleModelData';
import {
  DB_TO_HEATMAP_MAP,
  guessMuscleFromText,
  MUSCLE_NAMES_ES,
} from '@/utils/muscleUtils';

const SCREEN_WIDTH = Dimensions.get('window').width;

const INTENSITY_LEVELS = [
  { label: 'Bajo', color: '#00f2ff' },
  { label: 'Medio', color: '#00ff88' },
  { label: 'Alto', color: '#ffea00' },
  { label: 'Máximo', color: '#ff0055' },
];

export function MuscleHeatmapView() {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const workoutLog = useAppStore(state => state.workoutLog) || [];
  const exercises = useAppStore(state => state.allExercises) || [];

  const [modelType, setModelType] = useState<'anterior' | 'posterior'>('anterior');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [suggestionsPage, setSuggestionsPage] = useState(0);

  const SUGGESTIONS_PER_PAGE = 3;

  // Compute muscle intensities & weak points from past 30 days
  const { muscleScores, weakPointSuggestions } = useMemo(() => {
    if (!workoutLog.length) return { muscleScores: {}, weakPointSuggestions: [] };

    const scores: Record<string, number> = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentLogs = workoutLog.filter(
      (log: any) => new Date(log.workout_date) >= thirtyDaysAgo
    );

    recentLogs.forEach((log: any) => {
      log.WorkoutLogDetails?.forEach((detail: any) => {
        const name = detail.exercise_name;
        const exerciseData = exercises.find((e: any) => e.name === name);
        let targetMuscles: string[] = [];

        if (exerciseData && exerciseData.muscle_group) {
          const groups = exerciseData.muscle_group
            .split(',')
            .map((g: string) => g.trim().toLowerCase());
          groups.forEach((g: string) => {
            if (DB_TO_HEATMAP_MAP[g]) {
              targetMuscles.push(...DB_TO_HEATMAP_MAP[g]);
            }
          });
        }

        if (targetMuscles.length === 0) {
          targetMuscles = guessMuscleFromText(name);
        }

        targetMuscles.forEach(muscleId => {
          scores[muscleId] = (scores[muscleId] || 0) + 1;
        });
      });
    });

    const candidates = Object.keys(MUSCLE_NAMES_ES);
    let minScore = Infinity;
    candidates.forEach(c => {
      const s = scores[c] || 0;
      if (s < minScore) minScore = s;
    });

    const weakMuscles = candidates.filter(c => (scores[c] || 0) === minScore);

    const suggestions = weakMuscles.map(muscleKey => {
      const possible = exercises.filter((ex: any) => {
        let matches = false;
        if (ex.muscle_group) {
          const groups = ex.muscle_group.split(',').map((g: string) => g.trim().toLowerCase());
          matches = groups.some((g: string) => DB_TO_HEATMAP_MAP[g]?.includes(muscleKey));
        }
        if (!matches && ex.name) {
          matches = guessMuscleFromText(ex.name).includes(muscleKey);
        }
        return matches;
      });

      if (possible.length > 0) {
        const randomEx = possible[Math.floor(Math.random() * possible.length)];
        return {
          muscle: MUSCLE_NAMES_ES[muscleKey] || muscleKey,
          exercise: randomEx.name,
        };
      }
      return null;
    }).filter(Boolean);

    // Normalize scores from 1 to 4 (intensity levels)
    const maxVal = Math.max(...Object.values(scores), 1);
    const normalized: Record<string, number> = {};
    Object.keys(scores).forEach(k => {
      const ratio = scores[k] / maxVal;
      if (ratio > 0.75) normalized[k] = 3; // Máximo
      else if (ratio > 0.5) normalized[k] = 2; // Alto
      else if (ratio > 0.25) normalized[k] = 1; // Medio
      else normalized[k] = 0; // Bajo
    });

    return { muscleScores: normalized, weakPointSuggestions: suggestions };
  }, [workoutLog, exercises]);

  const totalPages = Math.ceil(weakPointSuggestions.length / SUGGESTIONS_PER_PAGE);
  const displayedSuggestions = weakPointSuggestions.slice(
    suggestionsPage * SUGGESTIONS_PER_PAGE,
    (suggestionsPage + 1) * SUGGESTIONS_PER_PAGE
  );

  const toggleModelType = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setModelType(prev => (prev === 'anterior' ? 'posterior' : 'anterior'));
  };

  const handleMusclePress = (muscle: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    const name = MUSCLE_NAMES_ES[muscle] || muscle;
    setSelectedMuscle(name);
    setTimeout(() => setSelectedMuscle(null), 2500);
  };

  const currentDataset =
    modelType === 'anterior' ? ANTERIOR_MUSCLE_DATA : POSTERIOR_MUSCLE_DATA;

  // Base fill color for unworked muscles
  const defaultMuscleFill = isDark ? '#26262b' : '#e2e8f0';

  const getMuscleColor = (muscle: string) => {
    const level = muscleScores[muscle];
    if (level !== undefined && INTENSITY_LEVELS[level]) {
      return INTENSITY_LEVELS[level].color;
    }
    return defaultMuscleFill;
  };

  return (
    <View style={styles.container}>
      {/* Model View Switcher */}
      <View style={styles.viewToggleWrap}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleModelType}
          style={[
            styles.viewToggleBtn,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.05)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <RotateCw size={15} color={colors.tint} />
          <Text style={[styles.viewToggleText, { color: colors.text }]}>
            Ver {modelType === 'anterior' ? 'Posterior (Espalda)' : 'Anterior (Frontal)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selected Muscle Indicator Toast */}
      {selectedMuscle && (
        <View style={styles.selectedToast}>
          <Text style={styles.selectedToastText}>{selectedMuscle}</Text>
        </View>
      )}

      {/* Body Model SVG */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={toggleModelType}
        style={styles.modelContainer}
      >
        <Svg width={230} height={360} viewBox="0 0 100 240">
          {currentDataset.map((group, groupIdx) => {
            const color = getMuscleColor(group.muscle);
            return (
              <React.Fragment key={`${group.muscle}-${groupIdx}`}>
                {group.svgPoints.map((pts, ptIdx) => (
                  <Polygon
                    key={ptIdx}
                    points={pts}
                    fill={color}
                    stroke={isDark ? '#18181b' : '#cbd5e1'}
                    strokeWidth={0.5}
                    onPress={() => handleMusclePress(group.muscle)}
                  />
                ))}
              </React.Fragment>
            );
          })}
        </Svg>
      </TouchableOpacity>

      {/* Intensity Legend */}
      <View style={styles.legendRow}>
        {INTENSITY_LEVELS.map(level => (
          <View key={level.label} style={styles.legendItem}>
            <View
              style={[
                styles.legendColorDot,
                {
                  backgroundColor: level.color,
                  shadowColor: level.color,
                  shadowOpacity: 0.8,
                  shadowRadius: 4,
                },
              ]}
            />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
              {level.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Weak Point Suggestions */}
      {weakPointSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Sugerencias de Puntos Débiles
          </Text>

          <View style={{ gap: 10 }}>
            {displayedSuggestions.map((sug: any, idx) => (
              <View
                key={idx}
                style={[
                  styles.suggestionCard,
                  {
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                <GlassView
                  glassEffectStyle="regular"
                  colorScheme={isDark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.suggestionIcon}>
                  <Lightbulb size={20} color={colors.tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.suggestionTitle, { color: colors.tint }]}>
                    Punto a mejorar: {sug.muscle}
                  </Text>
                  <Text style={[styles.suggestionDesc, { color: colors.textSecondary }]}>
                    Baja frecuencia en últimos 30 días. Prueba añadir{' '}
                    <Text style={{ color: colors.text, fontWeight: '700' }}>
                      {sug.exercise}
                    </Text>
                    .
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {totalPages > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                onPress={() => setSuggestionsPage(p => Math.max(p - 1, 0))}
                disabled={suggestionsPage === 0}
                style={[
                  styles.pageBtn,
                  suggestionsPage === 0 && { opacity: 0.3 },
                ]}
              >
                <ChevronLeft size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.pageInfo, { color: colors.textSecondary }]}>
                {suggestionsPage + 1} / {totalPages}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setSuggestionsPage(p => Math.min(p + 1, totalPages - 1))
                }
                disabled={suggestionsPage === totalPages - 1}
                style={[
                  styles.pageBtn,
                  suggestionsPage === totalPages - 1 && { opacity: 0.3 },
                ]}
              >
                <ChevronRight size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Explanation Glass Card */}
      <View
        style={[
          styles.infoCard,
          {
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.infoTitle, { color: colors.text }]}>
          ¿Cómo funciona?
        </Text>
        <Text style={[styles.infoBody, { color: colors.textSecondary }]}>
          La intensidad es relativa al músculo con mayor volumen de entrenamiento en
          los últimos 30 días (referencia 100%).
        </Text>
        <View style={styles.infoGrid}>
          <Text style={[styles.infoBullet, { color: colors.textSecondary }]}>
            • Máximo: 75 - 100%
          </Text>
          <Text style={[styles.infoBullet, { color: colors.textSecondary }]}>
            • Alto: 50 - 75%
          </Text>
          <Text style={[styles.infoBullet, { color: colors.textSecondary }]}>
            • Medio: 25 - 50%
          </Text>
          <Text style={[styles.infoBullet, { color: colors.textSecondary }]}>
            • Bajo: Menos del 25%
          </Text>
        </View>
        <Text style={[styles.infoHint, { color: colors.tint }]}>
          Toca el modelo para rotarlo
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    alignItems: 'center',
  },
  viewToggleWrap: {
    marginBottom: 16,
  },
  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  viewToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectedToast: {
    position: 'absolute',
    top: 54,
    zIndex: 99,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedToastText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  modelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 18,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionsContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 12,
  },
  suggestionIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  suggestionDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  pageBtn: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  pageInfo: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    overflow: 'hidden',
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  infoBody: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  infoBullet: {
    fontSize: 11,
    fontWeight: '600',
    width: '45%',
  },
  infoHint: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
});
