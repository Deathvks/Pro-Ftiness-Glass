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
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';

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

  const { exclusions, toggleExercise, setRoutineAll } = useWeeklyVolumeExclusions();

  const routinesList = useMemo(() => {
    if (routine) return [routine];
    if (routines && Array.isArray(routines)) return routines;
    return [];
  }, [routine, routines]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? 'rgba(20, 20, 22, 0.96)' : 'rgba(250, 250, 252, 0.98)',
              borderColor: colors.border,
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
          />

          <View style={styles.grabberContainer}>
            <View
              style={[
                styles.grabber,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
              ]}
            />
          </View>

          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
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
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(0, 0, 0, 0.03)',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.routineFilterTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.routineFilterName, { color: colors.text }]} numberOfLines={1}>
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
                              backgroundColor: included
                                ? isDark
                                  ? 'rgba(255, 255, 255, 0.04)'
                                  : 'rgba(255, 255, 255, 0.7)'
                                : isDark
                                ? 'rgba(0, 0, 0, 0.2)'
                                : 'rgba(0, 0, 0, 0.03)',
                              opacity: included ? 1 : 0.45,
                              borderColor: colors.border,
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
                              { backgroundColor: included ? colors.tint + '15' : 'rgba(0,0,0,0.05)' },
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
        </View>
      </View>
    </Modal>
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

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<any | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const { exclusions } = useWeeklyVolumeExclusions();

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
        {
          borderColor: colors.border,
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.03)'
            : 'rgba(255, 255, 255, 0.65)',
        },
      ]}
    >
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
      />

      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIconCircle, { backgroundColor: colors.tint + '18' }]}>
            <Activity size={20} color={colors.tint} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Series Semanales
              </Text>
              <View style={[styles.goalPill, { backgroundColor: colors.tint + '15' }]}>
                <Text style={[styles.goalPillText, { color: colors.tint }]}>
                  {goalRange.label} ({goalRange.min}–{goalRange.max}/sem)
                </Text>
              </View>
            </View>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              {volumeData.optimalCount} óptimos · {volumeData.reviewCount} a revisar
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => (onOpenSettings ? onOpenSettings() : setShowFilterModal(true))}
          style={[styles.filterBtn, { backgroundColor: colors.tint + '15', borderColor: colors.tint + '30' }]}
          activeOpacity={0.7}
        >
          <FolderKanban size={14} color={colors.tint} />
          <Text style={[styles.filterBtnText, { color: colors.tint }]}>
            Elegir {volumeData.excludedCount > 0 ? `(${volumeData.excludedCount} excl.)` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Muscle Rows Grid */}
      <View style={styles.rowsGrid}>
        {(isExpanded ? volumeData.rows : volumeData.rows.slice(0, 4)).map(row => {
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
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(255, 255, 255, 0.7)',
                  borderColor: statusColor + '30',
                },
              ]}
            >
              <View style={styles.muscleTopRow}>
                <Text style={[styles.muscleName, { color: colors.text }]}>{row.label}</Text>
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
                      +{row.indirectSets} ind.
                    </Text>
                  )}
                </View>
                <Text style={[styles.targetLabel, { color: colors.textMuted }]}>
                  meta {goalRange.min}–{goalRange.max}
                </Text>
              </View>

              {/* Progress bar */}
              <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
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

      {/* Expand / Collapse Button */}
      <TouchableOpacity
        onPress={() => setIsExpanded(v => !v)}
        style={styles.expandToggleBtn}
        activeOpacity={0.7}
      >
        <Text style={[styles.expandToggleText, { color: colors.tint }]}>
          {isExpanded ? 'Mostrar menos grupos' : `Ver los 10 grupos musculares`}
        </Text>
        <ChevronDown
          size={14}
          color={colors.tint}
          style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      {/* Modal Desglose por Músculo */}
      {selectedMuscle && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedMuscle(null)}>
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedMuscle(null)} />
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: isDark ? 'rgba(20, 20, 22, 0.96)' : 'rgba(250, 250, 252, 0.98)',
                  borderColor: colors.border,
                },
              ]}
            >
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
              />

              <View style={styles.grabberContainer}>
                <View
                  style={[
                    styles.grabber,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
                  ]}
                />
              </View>

              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
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
                            color:
                              selectedMuscle.status === 'green'
                                ? '#10b981'
                                : '#f59e0b',
                          },
                        ]}
                      >
                        {selectedMuscle.statusLabel}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    Objetivo semanal: {goalRange.min}–{goalRange.max} series
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
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(0, 0, 0, 0.03)',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.contribExName, { color: colors.text }]} numberOfLines={1}>
                          {c.exerciseName}
                        </Text>
                        <Text style={[styles.contribRoutineName, { color: colors.textSecondary }]} numberOfLines={1}>
                          {c.routineName} · {c.isDirect ? 'Directo' : 'Sinergista (indirecto)'}
                        </Text>
                      </View>
                      <View style={[styles.setsPill, { backgroundColor: colors.tint + '18' }]}>
                        <Text style={[styles.setsPillText, { color: colors.tint }]}>
                          {c.sets} series
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  goalPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  goalPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  rowsGrid: {
    gap: 8,
  },
  muscleCard: {
    borderRadius: 16,
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
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    marginTop: 4,
  },
  expandToggleText: {
    fontSize: 12,
    fontWeight: '800',
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
    borderBottomWidth: 1,
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
    borderRadius: 20,
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
