import React, { useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { ANTERIOR_MUSCLE_DATA, POSTERIOR_MUSCLE_DATA } from '@/components/progress/muscleModelData';
import { getUnselectedControlColors } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import {
  DB_TO_HEATMAP_MAP,
  guessMuscleFromText,
  MUSCLE_NAMES_ES,
} from '@/utils/muscleUtils';

export const HEATMAP_INTENSITY_LEVELS = [
  { label: 'Bajo', color: '#00f2ff' },
  { label: 'Medio', color: '#00ff88' },
  { label: 'Alto', color: '#ffea00' },
  { label: 'Máximo', color: '#ff0055' },
] as const;

const normalizeKey = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/**
 * Calcula volumen/intensidad prevista por grupo muscular igual que frontend WorkoutHeatmapModal.
 */
export function getWorkoutMuscleData(exercises: any[] = []): Record<string, number> {
  const scores: Record<string, number> = {};
  if (!Array.isArray(exercises) || exercises.length === 0) return scores;

  exercises.forEach(exercise => {
    const rawMuscle = exercise?.muscle_group || exercise?.exercise_details?.muscle_group;
    let keysToCount: string[] = [];

    if (Array.isArray(rawMuscle)) {
      keysToCount = rawMuscle.map(g => String(g).trim().toLowerCase()).filter(Boolean);
    } else if (typeof rawMuscle === 'string' && rawMuscle.trim()) {
      keysToCount = rawMuscle
        .split(',')
        .map(g => g.trim().toLowerCase())
        .filter(Boolean);
    }

    if (keysToCount.length === 0 && exercise?.name) {
      keysToCount = guessMuscleFromText(exercise.name);
    }

    const sets = Array.isArray(exercise?.setsDone)
      ? Math.max(1, exercise.setsDone.length)
      : Array.isArray(exercise?.sets)
        ? Math.max(1, exercise.sets.length)
        : parseInt(String(exercise?.sets), 10) || 3;

    keysToCount.forEach((key, index) => {
      if (key) {
        const weight = index === 0 ? 1 : 0.4;
        scores[key] = (scores[key] || 0) + sets * weight;
      }
    });
  });

  const maxValue = Math.max(...Object.values(scores), 1);
  const referenceMax = Math.max(maxValue, 6);

  return Object.fromEntries(
    Object.entries(scores).map(([muscle, sets]) => [
      muscle,
      Math.max(2, Math.round((sets / referenceMax) * 10)),
    ])
  );
}

/**
 * Convierte el mapa bruto (español/inglés) a intensidad por grupo SVG (`0..3`) para colorear el cuerpo.
 */
export function buildSvgMuscleIntensity(muscleData: Record<string, number>): {
  levelsBySvgId: Record<string, number>;
  labelsBySvgId: Record<string, string>;
} {
  const cleanCounts: Record<string, number> = {};
  Object.entries(muscleData || {}).forEach(([rawName, value]) => {
    if (!rawName) return;
    rawName.split(',').forEach(part => {
      const key = normalizeKey(part);
      if (key) {
        cleanCounts[key] = (cleanCounts[key] || 0) + Number(value || 0);
      }
    });
  });

  const cleanKeys = Object.keys(cleanCounts);
  const armSpecifics = ['biceps', 'triceps', 'forearm', 'antebrazo', 'brachial', 'braquial'];
  const hasSpecificArm = cleanKeys.some(key => armSpecifics.some(spec => key.includes(spec)));
  const hasExplicitTriceps = cleanKeys.some(k => k.includes('triceps') || k.includes('tríceps'));
  const hasExplicitBicepsOrForearm = cleanKeys.some(
    k => k.includes('biceps') || k.includes('antebrazo') || k.includes('forearm')
  );

  const levelsBySvgId: Record<string, number> = {};
  const labelsBySvgId: Record<string, string> = {};

  cleanKeys.forEach(key => {
    if (hasSpecificArm && (key === 'arms' || key === 'brazos' || key === 'brazo')) {
      return;
    }

    const value = cleanCounts[key];
    let idx = Math.ceil((value / 10) * HEATMAP_INTENSITY_LEVELS.length) - 1;
    idx = Math.max(0, Math.min(HEATMAP_INTENSITY_LEVELS.length - 1, idx));

    let targets =
      DB_TO_HEATMAP_MAP[key] ||
      DB_TO_HEATMAP_MAP[key.replace('biceps', 'bíceps')] ||
      [key];

    if (!hasExplicitTriceps && hasExplicitBicepsOrForearm) {
      targets = targets.filter(m => m !== 'triceps');
    }

    const displayName =
      MUSCLE_NAMES_ES[key] || key.charAt(0).toUpperCase() + key.slice(1);

    targets.forEach(svgId => {
      if (levelsBySvgId[svgId] === undefined || idx > levelsBySvgId[svgId]) {
        levelsBySvgId[svgId] = idx;
      }
      if (!labelsBySvgId[svgId]) {
        labelsBySvgId[svgId] = MUSCLE_NAMES_ES[svgId] || displayName;
      }
    });
  });

  return { levelsBySvgId, labelsBySvgId };
}

interface SessionMuscleHeatmapProps {
  exercises?: any[];
  muscleData?: Record<string, number>;
  compact?: boolean;
}

export function SessionMuscleHeatmap({
  exercises = [],
  muscleData: explicitMuscleData,
  compact = false,
}: SessionMuscleHeatmapProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const controlBg = getUnselectedControlColors(theme).backgroundColor;
  const borderTone = colors.border || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)');

  const [modelType, setModelType] = useState<'anterior' | 'posterior'>('anterior');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const computedMuscleData = useMemo(
    () => explicitMuscleData || getWorkoutMuscleData(exercises),
    [explicitMuscleData, exercises]
  );

  const { levelsBySvgId, labelsBySvgId } = useMemo(
    () => buildSvgMuscleIntensity(computedMuscleData),
    [computedMuscleData]
  );

  const dataset = modelType === 'anterior' ? ANTERIOR_MUSCLE_DATA : POSTERIOR_MUSCLE_DATA;
  const baseFill = isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(15, 23, 42, 0.16)';
  const strokeColor = isDark ? '#111115' : '#cbd5e1';

  const flipView = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setModelType(prev => (prev === 'anterior' ? 'posterior' : 'anterior'));
  };

  const handleMusclePress = (muscleId: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    const label = labelsBySvgId[muscleId] || MUSCLE_NAMES_ES[muscleId] || muscleId;
    setSelectedLabel(label);
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(() => setSelectedLabel(null), 2000);
  };

  const svgWidth = compact ? 132 : 196;
  const svgHeight = compact ? 220 : 326;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={flipView}
      style={[
        styles.container,
        {
          backgroundColor: controlBg,
          borderColor: borderTone,
          borderRadius: compact ? 22 : 28,
          paddingTop: compact ? 26 : 34,
          paddingBottom: compact ? 26 : 32,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.viewBadge,
          {
            top: compact ? 10 : 14,
            right: compact ? 10 : 14,
            backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
            borderColor: borderTone,
          },
        ]}
      >
        <Text style={[styles.viewBadgeText, { color: colors.text }]}>
          {modelType === 'anterior' ? 'Frente' : 'Espalda'}
        </Text>
      </View>

      {selectedLabel ? (
        <View
          pointerEvents="none"
          style={[
            styles.tooltipPill,
            {
              backgroundColor: colors.card === 'transparent' ? (isDark ? '#0f172a' : '#ffffff') : colors.card,
              borderColor: borderTone,
            },
          ]}
        >
          <Text style={[styles.tooltipText, { color: colors.text }]}>{selectedLabel}</Text>
        </View>
      ) : null}

      <Svg width={svgWidth} height={svgHeight} viewBox="0 0 100 240">
        {dataset.map((group, groupIdx) => {
          const levelIdx = levelsBySvgId[group.muscle];
          const fill =
            levelIdx !== undefined && HEATMAP_INTENSITY_LEVELS[levelIdx]
              ? HEATMAP_INTENSITY_LEVELS[levelIdx].color
              : baseFill;

          return (
            <React.Fragment key={`${group.muscle}-${groupIdx}`}>
              {group.svgPoints.map((pts, ptIdx) => (
                <Polygon
                  key={ptIdx}
                  points={pts}
                  fill={fill}
                  stroke={strokeColor}
                  strokeWidth={0.55}
                  onPress={() => handleMusclePress(group.muscle)}
                />
              ))}
            </React.Fragment>
          );
        })}
      </Svg>

      <Text
        pointerEvents="none"
        style={[
          styles.flipHint,
          {
            bottom: compact ? 8 : 11,
            color: colors.textSecondary,
          },
        ]}
      >
        Toca el mapa para girar
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  viewBadge: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  viewBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  tooltipPill: {
    position: 'absolute',
    top: '48%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  tooltipText: {
    fontSize: 13,
    fontWeight: '900',
  },
  flipHint: {
    position: 'absolute',
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    opacity: 0.72,
  },
});
