/* mobile/src/components/routines/WeeklyMuscleVolumeCard.tsx */
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  FolderKanban,
  X,
  Sparkles,
  Layers,
  ChevronDown,
  Target,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getAppleCardSurfaceStyle, shouldUseContentGlass, getUnselectedControlColors } from '@/constants/theme';
import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const TRACKED_MUSCLES = [
  { key: 'chest', label: 'Pecho', aliases: ['chest', 'pecho', 'pectoral', 'pectorals', 'pectoralis major'] },
  { key: 'back', label: 'Espalda', aliases: ['back', 'espalda', 'dorsal', 'dorsales', 'dorsal ancho', 'lats', 'latissimus dorsi', 'upper back', 'lower back'] },
  { key: 'shoulders', label: 'Hombros', aliases: ['shoulder', 'shoulders', 'hombro', 'hombros', 'deltoid', 'deltoids', 'deltoides'] },
  { key: 'biceps', label: 'Bíceps', aliases: ['biceps', 'bíceps', 'biceps brachii', 'braquial'] },
  { key: 'triceps', label: 'Tríceps', aliases: ['triceps', 'tríceps', 'triceps brachii'] },
  { key: 'quadriceps', label: 'Cuádriceps', aliases: ['quadriceps', 'quads', 'cuadriceps', 'cuádriceps'] },
  { key: 'hamstring', label: 'Isquios', aliases: ['hamstring', 'hamstrings', 'isquios', 'isquiotibiales', 'femorales', 'femoral'] },
  { key: 'gluteal', label: 'Glúteos', aliases: ['gluteal', 'glutes', 'gluteos', 'glúteos', 'gluteo'] },
  { key: 'calves', label: 'Gemelos', aliases: ['calves', 'calf', 'gemelos', 'gemelo', 'pantorrillas'] },
  { key: 'core', label: 'Core', aliases: ['core', 'abs', 'abdominal', 'abdominales', 'oblicuos'] },
];

const GOAL_RANGES: Record<string, { label: string; min: number; max: number; advice: string }> = {
  gain: {
    label: 'Ganar músculo',
    min: 10,
    max: 20,
    advice: 'Busca progresar y reparte el volumen si muchas series de un músculo quedan en una sola sesión.',
  },
  recomp: {
    label: 'Recomposición',
    min: 8,
    max: 16,
    advice: 'Mantén un volumen sostenible y prioriza la progresión junto con una buena recuperación.',
  },
  lose: {
    label: 'Perder grasa',
    min: 6,
    max: 12,
    advice: 'Prioriza series de calidad y ajusta el volumen si notas que cae tu rendimiento o recuperación.',
  },
  maintain: {
    label: 'Mantener',
    min: 6,
    max: 12,
    advice: 'Un volumen moderado puede ayudarte a mantener el estímulo; conserva cargas y técnica.',
  },
};

const normalizeKey = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .trim();

export const getRoutineVolumeKey = (routine: any, fallbackIdx = 0) =>
  String(routine?.id ?? routine?.routine_id ?? (routine?.name ? `name:${normalizeKey(routine.name)}` : `routine-${fallbackIdx}`));

export const getExerciseVolumeKey = (exercise: any, index = 0) =>
  String(
    exercise?.id ??
    exercise?.routine_exercise_id ??
    (exercise?.name ? `name:${normalizeKey(exercise.name)}#${exercise?.exercise_order ?? index}` : null) ??
    exercise?.tempId ??
    `${exercise?.name || 'ex'}-${exercise?.exercise_order ?? index}`
  );

export const hasAnyTerm = (text: string, terms: string[]) => terms.some(t => text.includes(t));

export const inferMusclesFromExerciseName = (rawName = ''): { primary: string[]; secondary: string[] } | null => {
  const name = normalizeKey(rawName);
  if (!name) return null;

  if (hasAnyTerm(name, ['agarre cerrado', 'agarre estrecho', 'close grip', 'close-grip', 'jm press', 'fondos', 'dips'])) {
    return { primary: ['triceps'], secondary: ['chest', 'shoulders'] };
  }
  if (hasAnyTerm(name, ['tricep', 'pushdown', 'press frances', 'skullcrusher', 'extension de tricep', 'patada de tricep', 'copa'])) {
    return { primary: ['triceps'], secondary: [] };
  }
  if (hasAnyTerm(name, ['bicep', 'predicador', 'preacher', 'scott', 'spider curl', 'martillo', 'hammer', 'zottman', 'curl'])) {
    return { primary: ['biceps'], secondary: [] };
  }
  if (hasAnyTerm(name, ['apertura', 'fly', 'fliegende', 'butterfly', 'pec deck', 'cruce de polea', 'crossover'])) {
    return { primary: ['chest'], secondary: [] };
  }
  if (hasAnyTerm(name, ['bench press', 'press de banca', 'press banca', 'press inclinado', 'press declinado', 'chest press', 'push up', 'flexion'])) {
    return { primary: ['chest'], secondary: ['triceps', 'shoulders'] };
  }
  if (hasAnyTerm(name, ['military press', 'press militar', 'overhead press', 'shoulder press', 'press de hombro', 'arnold press'])) {
    return { primary: ['shoulders'], secondary: ['triceps'] };
  }
  if (hasAnyTerm(name, ['face pull', 'pajaro', 'rear delt', 'deltoides posterior', 'remo al menton', 'upright row'])) {
    return { primary: ['shoulders'], secondary: ['back'] };
  }
  if (hasAnyTerm(name, ['elevacion lateral', 'lateral raise', 'elevacion frontal', 'front raise', 'shrug', 'encogimiento'])) {
    return { primary: ['shoulders'], secondary: [] };
  }
  if (hasAnyTerm(name, ['pull up', 'chin up', 'dominada', 'lat pulldown', 'pulldown', 'jalon', 'row', 'remo', 'seal row', 't bar', 'barra t'])) {
    return { primary: ['back'], secondary: ['biceps'] };
  }
  if (hasAnyTerm(name, ['romanian deadlift', 'rdl', 'peso muerto rumano', 'good morning', 'buenos dias'])) {
    return { primary: ['hamstring'], secondary: ['gluteal', 'back'] };
  }
  if (hasAnyTerm(name, ['leg curl', 'curl femoral', 'curl de pierna', 'isquio', 'nordic'])) {
    return { primary: ['hamstring'], secondary: [] };
  }
  if (hasAnyTerm(name, ['deadlift', 'peso muerto'])) {
    return { primary: ['back', 'hamstring'], secondary: ['gluteal'] };
  }
  if (hasAnyTerm(name, ['hip thrust', 'glute bridge', 'puente de gluteo', 'patada de gluteo', 'abduccion', 'abductor'])) {
    return { primary: ['gluteal'], secondary: ['hamstring'] };
  }
  if (hasAnyTerm(name, ['leg extension', 'extension de cuadriceps', 'extension de pierna', 'sissy'])) {
    return { primary: ['quadriceps'], secondary: [] };
  }
  if (hasAnyTerm(name, ['squat', 'sentadilla', 'leg press', 'prensa', 'hack', 'lunge', 'zancada', 'bulgara'])) {
    return { primary: ['quadriceps'], secondary: ['gluteal', 'hamstring'] };
  }
  if (hasAnyTerm(name, ['calf', 'gemelo', 'pantorrilla', 'soleo', 'elevacion de talon'])) {
    return { primary: ['calves'], secondary: [] };
  }
  if (hasAnyTerm(name, ['crunch', 'plank', 'plancha', 'sit up', 'abdominal', 'rueda abdominal', 'russian twist', 'leg raise'])) {
    return { primary: ['core'], secondary: [] };
  }

  return null;
};

export const classifyExerciseMuscles = (exercise: any) => {
  const inferred = inferMusclesFromExerciseName(exercise?.name || '');
  if (inferred) return inferred;

  const raw = normalizeKey(exercise?.muscle_group || exercise?.target || '');
  for (const m of TRACKED_MUSCLES) {
    if (m.aliases.some(a => raw.includes(normalizeKey(a)))) {
      return { primary: [m.key], secondary: [] };
    }
  }

  return { primary: [], secondary: [] };
};

const EXCLUSIONS_STORAGE_KEY = 'weekly_volume_exclusions_v1';

export const isExerciseIncludedInVolume = (
  exclusions: any,
  routine: any,
  exercise: any,
  exIdx = 0
): boolean => {
  if (!exclusions) return true;
  const routineKey = getRoutineVolumeKey(routine);
  const exKey = getExerciseVolumeKey(exercise, exIdx);
  const pairKey = `${routineKey}__${exKey}`;

  if (exclusions.excludedRoutines?.[routineKey]) {
    return false;
  }
  if (exclusions.excludedExercises?.[pairKey]) {
    return false;
  }
  return true;
};

export const getRoutineInclusionStats = (exclusions: any, routine: any) => {
  const exercises = routine?.RoutineExercises || routine?.exercises || [];
  const total = exercises.length;
  if (total === 0) return { included: 0, total: 0, status: 'all' as const };

  let included = 0;
  exercises.forEach((ex: any, idx: number) => {
    if (isExerciseIncludedInVolume(exclusions, routine, ex, idx)) {
      included += 1;
    }
  });

  const status: 'all' | 'partial' | 'none' =
    included === total ? 'all' : included === 0 ? 'none' : 'partial';

  return { included, total, status };
};

export const useWeeklyVolumeExclusions = () => {
  const [exclusions, setExclusions] = useState<{
    excludedRoutines: Record<string, boolean>;
    excludedExercises: Record<string, boolean>;
  }>({ excludedRoutines: {}, excludedExercises: {} });

  useEffect(() => {
    AsyncStorage.getItem(EXCLUSIONS_STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            setExclusions(JSON.parse(raw));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const saveExclusions = async (updated: typeof exclusions) => {
    setExclusions(updated);
    try {
      await AsyncStorage.setItem(EXCLUSIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const toggleExercise = (routine: any, exercise: any, exIdx: number) => {
    const routineKey = getRoutineVolumeKey(routine);
    const exKey = getExerciseVolumeKey(exercise, exIdx);
    const pairKey = `${routineKey}__${exKey}`;

    const isCurrentExcluded = !isExerciseIncludedInVolume(exclusions, routine, exercise, exIdx);
    const updated = {
      ...exclusions,
      excludedExercises: {
        ...exclusions.excludedExercises,
        [pairKey]: !isCurrentExcluded,
      },
    };
    saveExclusions(updated);
  };

  const setRoutineAll = (routine: any, includeAll: boolean) => {
    const routineKey = getRoutineVolumeKey(routine);
    const exercises = routine?.RoutineExercises || routine?.exercises || [];
    const newExcludedExercises = { ...exclusions.excludedExercises };

    exercises.forEach((ex: any, idx: number) => {
      const exKey = getExerciseVolumeKey(ex, idx);
      const pairKey = `${routineKey}__${exKey}`;
      newExcludedExercises[pairKey] = !includeAll;
    });

    const updated = {
      ...exclusions,
      excludedRoutines: {
        ...exclusions.excludedRoutines,
        [routineKey]: !includeAll,
      },
      excludedExercises: newExcludedExercises,
    };
    saveExclusions(updated);
  };

  return { exclusions, toggleExercise, setRoutineAll };
};

/* --- MODAL DE FILTRO DE SERIES POR RUTINA --- */
export function RoutineVolumeFilterModal({
  visible = true,
  routines,
  routine,
  onClose,
}: {
  visible?: boolean;
  routines?: any[];
  routine?: any;
  onClose: () => void;
}) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';

  const { exclusions, toggleExercise, setRoutineAll } = useWeeklyVolumeExclusions();

  const routinesList = useMemo(() => {
    if (routine) return [routine];
    if (routines && Array.isArray(routines)) return routines;
    return [];
  }, [routine, routines]);

  if (!visible) return null;

  return (
    <SwipeableBottomSheet
      scrollable
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={isDark ? '#141418' : '#FAFAFC'}
    >
      <View style={[styles.modalHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.text }, isIOS && { fontWeight: '700' }]}>
                Recuento Semanal de Series
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Marca qué ejercicios deseas incluir en el volumen semanal
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.filterScroll} showsVerticalScrollIndicator={false}>
            {routinesList.map((r, rIdx) => {
              const exercises = r?.RoutineExercises || r?.exercises || [];
              const stats = getRoutineInclusionStats(exclusions, r);

              return (
                <View
                  key={r.id || `r_${rIdx}`}
                  style={[
                    styles.routineFilterCard,
                    {
                      backgroundColor: getUnselectedControlColors(theme).backgroundColor,
                      borderColor: isIOS ? 'transparent' : colors.border,
                      borderWidth: isIOS ? 0 : 1,
                    },
                  ]}
                >
                  <View style={styles.routineFilterTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.routineFilterName, { color: colors.text }, isIOS && { fontWeight: '700' }]} numberOfLines={1}>
                        {r.name}
                      </Text>
                      <Text style={[styles.routineFilterStats, { color: colors.textSecondary }]}>
                        {stats.included} de {stats.total} ejercicios incluidos
                      </Text>
                    </View>

                    <View style={styles.quickToggleRow}>
                      <TouchableOpacity
                        onPress={() => setRoutineAll(r, true)}
                        style={[
                          styles.quickPill,
                          {
                            backgroundColor:
                              stats.status === 'all'
                                ? colors.tint
                                : colors.tint + '15',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.quickPillText,
                            { color: stats.status === 'all' ? '#000' : colors.tint },
                          ]}
                        >
                          Todos
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setRoutineAll(r, false)}
                        style={[
                          styles.quickPill,
                          {
                            backgroundColor:
                              stats.status === 'none'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.06)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.quickPillText,
                            { color: stats.status === 'none' ? '#ef4444' : colors.textSecondary },
                          ]}
                        >
                          Ninguno
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ gap: 6, marginTop: 10 }}>
                    {exercises.map((ex: any, exIdx: number) => {
                      const included = isExerciseIncludedInVolume(exclusions, r, ex, exIdx);
                      const sets = ex.sets || 3;
                      const { primary } = classifyExerciseMuscles(ex);
                      const primaryLabel = primary[0] || 'General';

                      return (
                        <TouchableOpacity
                          key={ex.id || `ex_${exIdx}`}
                          onPress={() => toggleExercise(r, ex, exIdx)}
                          activeOpacity={0.7}
                          style={[
                            styles.exerciseFilterRow,
                            {
                              backgroundColor: getUnselectedControlColors(theme).backgroundColor,
                              opacity: included ? 1 : 0.45,
                              borderColor: isIOS ? 'transparent' : colors.border,
                              borderWidth: isIOS ? 0 : 1,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.filterCheck,
                              included && {
                                backgroundColor: colors.tint,
                                borderColor: colors.tint,
                              },
                            ]}
                          >
                            {included && <CheckCircle2 size={12} color="#000" />}
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.exerciseFilterName,
                                {
                                  color: colors.text,
                                  textDecorationLine: included ? 'none' : 'line-through',
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {ex.name}
                            </Text>
                            <Text style={[styles.exerciseFilterGroup, { color: colors.textMuted }]}>
                              {primaryLabel.toUpperCase()}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.setsPill,
                              { backgroundColor: included ? colors.tint + '15' : getUnselectedControlColors(theme).backgroundColor },
                            ]}
                          >
                            <Text
                              style={[
                                styles.setsPillText,
                                { color: included ? colors.tint : colors.textSecondary },
                              ]}
                            >
                              {sets} series
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>
    </SwipeableBottomSheet>
  );
}

/* --- TARJETA PRINCIPAL DE VOLUMEN MUSCULAR SEMANAL --- */
export function WeeklyMuscleVolumeCard({
  routines = [],
  goal,
  onOpenSettings,
}: {
  routines: any[];
  goal?: string;
  onOpenSettings?: () => void;
}) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';
  const controlBackground = getUnselectedControlColors(theme).backgroundColor;

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<any | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const { exclusions } = useWeeklyVolumeExclusions();

  const handleToggleExpand = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(prev => !prev);
  };

  const goalRange = useMemo(() => {
    const g = (goal || '').toLowerCase();
    if (g.includes('gain') || g.includes('musculo') || g.includes('hipertrofia')) return GOAL_RANGES.gain;
    if (g.includes('recomp')) return GOAL_RANGES.recomp;
    if (g.includes('perder') || g.includes('lose') || g.includes('grasa')) return GOAL_RANGES.lose;
    return GOAL_RANGES.maintain;
  }, [goal]);

  const volumeData = useMemo(() => {
    const directCounts: Record<string, number> = {};
    const indirectCounts: Record<string, number> = {};
    const muscleContributors: Record<string, any[]> = {};

    TRACKED_MUSCLES.forEach(m => {
      directCounts[m.key] = 0;
      indirectCounts[m.key] = 0;
      muscleContributors[m.key] = [];
    });

    let totalRoutines = 0;
    let excludedCount = 0;

    (routines || []).forEach((r: any, rIdx: number) => {
      const exercises = r?.RoutineExercises || r?.exercises || [];
      if (exercises.length === 0) return;
      totalRoutines += 1;

      exercises.forEach((ex: any, exIdx: number) => {
        if (!isExerciseIncludedInVolume(exclusions, r, ex, exIdx)) {
          excludedCount += 1;
          return;
        }

        const sets = parseInt(String(ex.sets), 10) || 3;
        const { primary, secondary } = classifyExerciseMuscles(ex);

        primary.forEach(mKey => {
          if (directCounts[mKey] !== undefined) {
            directCounts[mKey] += sets;
            muscleContributors[mKey].push({
              routineName: r.name,
              exerciseName: ex.name,
              sets,
              isDirect: true,
            });
          }
        });

        secondary.forEach(mKey => {
          if (indirectCounts[mKey] !== undefined) {
            indirectCounts[mKey] += Math.round(sets * 0.4);
            muscleContributors[mKey].push({
              routineName: r.name,
              exerciseName: ex.name,
              sets: Math.round(sets * 0.4),
              isDirect: false,
            });
          }
        });
      });
    });

    const rows = TRACKED_MUSCLES.map(m => {
      const direct = directCounts[m.key] || 0;
      const indirect = indirectCounts[m.key] || 0;
      const total = direct + indirect;

      let status: 'green' | 'orange' | 'red' = 'green';
      let statusLabel = 'Óptimo';

      if (direct < goalRange.min) {
        status = 'orange';
        statusLabel = 'Bajo';
      } else if (direct > goalRange.max) {
        status = 'red';
        statusLabel = 'Elevado';
      }

      const progress = Math.min(100, Math.round((direct / goalRange.max) * 100));

      return {
        ...m,
        directSets: direct,
        indirectSets: indirect,
        totalSets: total,
        progress,
        status,
        statusLabel,
        contributors: muscleContributors[m.key] || [],
      };
    });

    // Ordenar para mostrar primero los grupos a revisar (naranja/rojo) como en el frontend
    const statusOrder: Record<string, number> = { red: 0, orange: 1, green: 2 };
    rows.sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || b.directSets - a.directSets);

    const optimalCount = rows.filter(r => r.status === 'green').length;
    const reviewCount = rows.filter(r => r.status !== 'green').length;

    return {
      rows,
      totalRoutines,
      excludedCount,
      optimalCount,
      reviewCount,
    };
  }, [routines, exclusions, goalRange]);

  if (volumeData.totalRoutines === 0) return null;

  return (
    <View
      style={[
        styles.container,
        getAppleCardSurfaceStyle(theme, 20),
        !isIOS && {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          backgroundColor: colors.card,
        },
      ]}
    >
      {shouldUseContentGlass(theme) && (
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 26 }]}
        />
      )}

      {/* Header Interactivo (Solapado / Resumen por defecto - Idéntico al frontend) */}
      <TouchableOpacity
        onPress={handleToggleExpand}
        activeOpacity={0.8}
        style={[
          styles.cardHeaderButton,
          isExpanded && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.headerIconCircle, { backgroundColor: colors.tint + '18' }]}>
            <Activity size={22} color={colors.tint} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.cardTitle, { color: colors.text }, isIOS && { fontWeight: '700' }]}>
              Volumen muscular semanal
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
              {isExpanded
                ? 'Toca cualquier músculo para ver qué subgrupos cuentan en la suma y en qué rutina están.'
                : `${volumeData.optimalCount} músculos en rango • ${volumeData.reviewCount} a revisar`}
            </Text>

            <View style={styles.pillsRow}>
              <View style={[styles.goalPill, { backgroundColor: colors.tint + '15' }]}>
                <Target size={11} color={colors.tint} style={{ marginRight: 4 }} />
                <Text style={[styles.goalPillText, { color: colors.tint }]}>
                  {goalRange.label}
                </Text>
              </View>

              <View
                style={[
                  styles.rangePill,
                  { backgroundColor: controlBackground },
                ]}
              >
                <Text style={[styles.rangePillText, { color: colors.textSecondary }]}>
                  {`Rango: ${goalRange.min}-${goalRange.max} series`}
                </Text>
              </View>
            </View>
          </View>

          <ChevronDown
            size={20}
            color={colors.textSecondary}
            style={{
              transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
              marginTop: 2,
            }}
          />
        </View>
      </TouchableOpacity>

      {/* Contenido Expandible (Sólo cuando se toca para extender) */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Bento Grid con 3 Métricas de Resumen */}
          <View style={styles.summaryBentoGrid}>
            <View
              style={[
                styles.bentoTile,
                { backgroundColor: controlBackground },
              ]}
            >
              <Text style={[styles.bentoNumber, { color: colors.text }]}>
                {volumeData.totalRoutines}
              </Text>
              <Text style={[styles.bentoLabel, { color: colors.textSecondary }]}>
                Rutinas activas
              </Text>
            </View>

            <View style={[styles.bentoTile, { backgroundColor: 'rgba(34, 197, 94, 0.12)' }]}>
              <Text style={[styles.bentoNumber, { color: '#22c55e' }]}>
                {volumeData.optimalCount}
              </Text>
              <Text style={[styles.bentoLabel, { color: colors.textSecondary }]}>
                En rango
              </Text>
            </View>

            <View
              style={[
                styles.bentoTile,
                {
                  backgroundColor:
                    volumeData.reviewCount > 0
                      ? 'rgba(245, 158, 11, 0.12)'
                      : controlBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.bentoNumber,
                  { color: volumeData.reviewCount > 0 ? '#f59e0b' : colors.text },
                ]}
              >
                {volumeData.reviewCount}
              </Text>
              <Text style={[styles.bentoLabel, { color: colors.textSecondary }]}>
                A revisar
              </Text>
            </View>
          </View>

          {/* Botón de Selección de Rutinas y Ejercicios */}
          {volumeData.totalRoutines > 0 && (
            <TouchableOpacity
              onPress={() => (onOpenSettings ? onOpenSettings() : setShowFilterModal(true))}
              style={[
                styles.fullFilterBtn,
                {
                  backgroundColor: colors.tint + '15',
                  borderColor: colors.tint + '30',
                  borderWidth: isIOS ? 0 : 1,
                },
              ]}
              activeOpacity={0.75}
            >
              <FolderKanban size={15} color={colors.tint} style={{ marginRight: 6 }} />
              <Text style={[styles.fullFilterBtnText, { color: colors.tint }]}>
                Elegir rutinas y ejercicios
              </Text>
              {volumeData.excludedCount > 0 && (
                <View style={[styles.excludedBadge, { backgroundColor: colors.tint + '25' }]}>
                  <Text style={[styles.excludedBadgeText, { color: colors.tint }]}>
                    {`${volumeData.excludedCount} excl.`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Grid Completo de los 10 Grupos Musculares */}
          <View style={styles.rowsGrid}>
            {volumeData.rows.map(row => {
              const statusColor =
                row.status === 'green'
                  ? '#10b981'
                  : row.status === 'orange'
                  ? '#f59e0b'
                  : '#ef4444';

              return (
                <TouchableOpacity
                  key={row.key}
                  onPress={() => setSelectedMuscle(row)}
                  activeOpacity={0.75}
                  style={[
                    styles.muscleCard,
                    {
                      backgroundColor: controlBackground,
                      borderColor: isIOS ? 'transparent' : statusColor + '30',
                      borderWidth: isIOS ? 0 : 1,
                    },
                  ]}
                >
                  <View style={styles.muscleTopRow}>
                    <Text style={[styles.muscleName, { color: colors.text }, isIOS && { fontWeight: '700' }]}>{row.label}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                      {row.status === 'green' ? (
                        <CheckCircle2 size={10} color={statusColor} />
                      ) : (
                        <AlertTriangle size={10} color={statusColor} />
                      )}
                      <Text style={[styles.statusText, { color: statusColor }]}>{row.statusLabel}</Text>
                    </View>
                  </View>

                  <View style={styles.muscleNumbersRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={[styles.setsNum, { color: statusColor }]}>{row.directSets}</Text>
                      <Text style={[styles.setsUnit, { color: colors.textSecondary }]}>directas</Text>
                      {row.indirectSets > 0 && (
                        <Text style={[styles.indirectTag, { color: colors.textMuted }]}>
                          {`+${row.indirectSets} ind.`}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.targetLabel, { color: colors.textMuted }]}>
                      {`meta ${goalRange.min}-${goalRange.max}`}
                    </Text>
                  </View>

                  {/* Progress bar */}
                  <View
                    style={[
                      styles.progressBarBg,
                      { backgroundColor: getUnselectedControlColors(theme).backgroundColor },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${row.progress}%`,
                          backgroundColor: statusColor,
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Nota al pie informativa */}
          <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
            Las series de ejercicios secundarios cuentan al 50%. Toca un músculo para ver el desglose.
          </Text>
        </View>
      )}

      {/* Modal Desglose por Músculo */}
      {selectedMuscle && (
        <SwipeableBottomSheet
          scrollable
          visible={!!selectedMuscle}
          onClose={() => setSelectedMuscle(null)}
          isDark={isDark}
          backgroundColor={isDark ? '#141418' : '#FAFAFC'}
        >
          <View style={[styles.modalHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.modalTitle, { color: colors.text }, isIOS && { fontWeight: '700' }]}>
                      {selectedMuscle.label}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            selectedMuscle.status === 'green'
                              ? 'rgba(16, 185, 129, 0.18)'
                              : 'rgba(245, 158, 11, 0.18)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: selectedMuscle.status === 'green' ? '#10b981' : '#f59e0b',
                          },
                        ]}
                      >
                        {selectedMuscle.statusLabel}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    {`Objetivo semanal: ${goalRange.min}-${goalRange.max} series`}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedMuscle(null)} style={styles.closeBtn}>
                  <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.filterScroll} showsVerticalScrollIndicator={false}>
                {selectedMuscle.contributors.length === 0 ? (
                  <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>
                    No hay ejercicios aportando series a este grupo en las rutinas activas.
                  </Text>
                ) : (
                  selectedMuscle.contributors.map((c: any, cIdx: number) => (
                    <View
                      key={cIdx}
                      style={[
                        styles.contributorRow,
                        {
                          backgroundColor: getUnselectedControlColors(theme).backgroundColor,
                          borderColor: isIOS ? 'transparent' : colors.border,
                          borderWidth: isIOS ? 0 : 1,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.contribExName, { color: colors.text }, isIOS && { fontWeight: '700' }]} numberOfLines={1}>
                          {c.exerciseName}
                        </Text>
                        <Text style={[styles.contribRoutineName, { color: colors.textSecondary }]} numberOfLines={1}>
                          {`${c.routineName} • ${c.isDirect ? 'Directo' : 'Sinergista (indirecto)'}`}
                        </Text>
                      </View>
                      <View style={[styles.setsPill, { backgroundColor: colors.tint + '18' }]}>
                        <Text style={[styles.setsPillText, { color: colors.tint }]}>
                          {`${c.sets} series`}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
        </SwipeableBottomSheet>
      )}

      {/* Modal Selector de Inclusiones / Exclusiones */}
      {showFilterModal && (
        <RoutineVolumeFilterModal
          routines={routines}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 1,
    marginBottom: 26,
    overflow: 'hidden',
  },
  cardHeaderButton: {
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 3,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  goalPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  rangePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  rangePillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  expandedContent: {
    padding: 16,
    paddingTop: 14,
    gap: 14,
  },
  summaryBentoGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  bentoTile: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
  },
  bentoNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  bentoLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  fullFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  fullFilterBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  excludedBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  excludedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  rowsGrid: {
    gap: 8,
  },
  muscleCard: {
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 12,
  },
  muscleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  muscleName: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  muscleNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  setsNum: {
    fontSize: 18,
    fontWeight: '900',
  },
  setsUnit: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  indirectTag: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  targetLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  footerNote: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  grabberContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  modalSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: {
    padding: 18,
    gap: 14,
    paddingBottom: 36,
  },
  routineFilterCard: {
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 14,
  },
  routineFilterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  routineFilterName: {
    fontSize: 14,
    fontWeight: '800',
  },
  routineFilterStats: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  quickToggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  quickPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  exerciseFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  filterCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseFilterName: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  exerciseFilterGroup: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 1,
  },
  setsPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  setsPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  contributorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    gap: 10,
  },
  contribExName: {
    fontSize: 13,
    fontWeight: '800',
  },
  contribRoutineName: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyNote: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
