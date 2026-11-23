/* mobile/src/utils/routineHelpers.ts */
import { BACKEND_BASE_URL } from '@/services/apiClient';

/**
 * Calcula el tiempo estimado (en minutos) de una rutina en base a sus ejercicios,
 * repeticiones y el objetivo del usuario (idéntico al frontend).
 */
export const calculateRoutineEstimatedTime = (exercises: any[], userGoal: string = 'maintenance'): number => {
  if (!exercises || exercises.length === 0) return 0;

  let totalSeconds = 0;

  // Agrupamos por superserie para no duplicar los descansos
  const groups: { [key: string]: any[] } = {};
  exercises.forEach((ex, idx) => {
    const groupId = ex.superset_group_id || `single_${ex.id || ex.tempId || idx}`;
    if (!groups[groupId]) groups[groupId] = [];
    groups[groupId].push(ex);
  });

  Object.values(groups).forEach(group => {
    const maxSets = Math.max(...group.map(ex => parseInt(String(ex.sets), 10) || 0), 0);
    if (maxSets === 0) return;

    // 1. Tiempo Activo (ejecución de los ejercicios)
    let activeTime = 0;
    group.forEach(ex => {
      const sets = parseInt(String(ex.sets), 10) || 0;
      let reps = 10;
      
      if (typeof ex.reps === 'string') {
        const parts = ex.reps.split('-');
        if (parts.length > 1) {
          reps = (parseInt(parts[0], 10) + parseInt(parts[1], 10)) / 2;
        } else {
          reps = parseInt(ex.reps, 10) || 10;
        }
      } else if (typeof ex.reps === 'number') {
        reps = ex.reps;
      }
      
      // Asumimos 4 segundos por repetición (Tiempo Bajo Tensión)
      activeTime += sets * reps * 4; 
    });

    // 2. Tiempo de Descanso adaptado al objetivo
    let baseRest = 60;
    if (userGoal === 'gain_muscle' || userGoal === 'gain') baseRest = 45;
    else if (userGoal === 'lose_weight' || userGoal === 'lose') baseRest = 75;
    
    const maxRest = Math.max(...group.map(ex => parseInt(String(ex.rest_seconds), 10) || baseRest));
    
    let restMultiplier = 1;
    if (userGoal === 'gain_muscle' || userGoal === 'gain') restMultiplier = 0.85; 
    if (userGoal === 'lose_weight' || userGoal === 'lose') restMultiplier = 1.15; 

    const restTime = maxSets * (maxRest * restMultiplier);
    totalSeconds += activeTime + restTime;
  });

  return Math.max(1, Math.round(totalSeconds / 60));
};

/**
 * Agrupa ejercicios consecutivos por superserie (idéntico al frontend).
 */
export const groupExercises = (exercises: any[]): any[][] => {
  if (!exercises || exercises.length === 0) return [];
  const groups: any[][] = [];
  let currentGroup: any[] = [];

  const sortedExercises = [...exercises]
    .filter(ex => !!ex)
    .sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0));

  for (const ex of sortedExercises) {
    if (currentGroup.length === 0) {
      currentGroup.push(ex);
      continue;
    }

    if (
      ex.superset_group_id !== null &&
      ex.superset_group_id !== undefined &&
      currentGroup[0].superset_group_id !== null &&
      currentGroup[0].superset_group_id !== undefined &&
      ex.superset_group_id === currentGroup[0].superset_group_id
    ) {
      currentGroup.push(ex);
    } else {
      groups.push(currentGroup);
      currentGroup = [ex];
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};

/**
 * Verifica si un valor de portada corresponde a un degradado/color predefinido (CSS o legado móvil).
 */
export const isCssRoutineCover = (value: string | null | undefined): boolean => {
  if (!value || typeof value !== 'string') return false;
  return (
    value.startsWith('grad-') ||
    value.startsWith('linear-gradient') ||
    value.startsWith('var(--')
  );
};

const toRgba = (color: string, alpha: number): string => {
  const safe = color?.trim() || '#22c55e';
  if (safe.startsWith('#')) {
    let hex = safe.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16) || 0;
      const g = parseInt(hex.slice(2, 4), 16) || 0;
      const b = parseInt(hex.slice(4, 6), 16) || 0;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  const rgbMatch = safe.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
  }
  return safe;
};

export interface RoutineCoverPreset {
  id: string;
  legacyId: string;
  value: string;
  colors: readonly [string, string];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export const getRoutineCoverPresets = ({
  tint,
  baseBg,
  secondaryBg,
  isDark,
}: {
  tint: string;
  baseBg: string;
  secondaryBg: string;
  isDark: boolean;
}): RoutineCoverPreset[] => [
  {
    id: 'accent-to-bg',
    legacyId: 'grad-1',
    value: 'linear-gradient(135deg, var(--color-accent) 0%, var(--bg-primary) 100%)',
    colors: [tint, baseBg],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: 'surface-to-accent',
    legacyId: 'grad-2',
    value: 'linear-gradient(to bottom right, var(--bg-secondary), var(--color-accent))',
    colors: [secondaryBg, tint],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  {
    id: 'black-to-accent',
    legacyId: 'grad-3',
    value: 'linear-gradient(45deg, #000000 0%, var(--color-accent) 100%)',
    colors: ['#000000', tint],
    start: { x: 0, y: 1 },
    end: { x: 1, y: 0 },
  },
  {
    id: 'glass-to-accent',
    legacyId: 'grad-4',
    value: 'linear-gradient(to right, var(--glass-highlight), var(--color-accent-transparent))',
    colors: [
      isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.72)',
      toRgba(tint, 0.34),
    ],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  {
    id: 'solid-accent',
    legacyId: 'grad-5',
    value: 'var(--color-accent)',
    colors: [tint, tint],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
];

export const resolveRoutineCoverPreset = (
  coverValue: string | null | undefined,
  opts: { tint: string; baseBg: string; secondaryBg: string; isDark: boolean },
): RoutineCoverPreset | null => {
  if (!isCssRoutineCover(coverValue)) return null;
  const presets = getRoutineCoverPresets(opts);
  const found = presets.find(p => p.value === coverValue || p.legacyId === coverValue);
  if (found) return found;
  return presets[0];
};

/**
 * Normaliza la URL de imagen de rutina para que cargue correctamente.
 */
export const getDisplayImageUrl = (path: string | null | undefined): string | null => {
  if (!path || isCssRoutineCover(path)) return null;
  if (path.startsWith('blob:') || path.startsWith('file:')) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_BASE_URL}${cleanPath}`;
};

/**
 * Retorna texto de alto contraste (#000000 o #ffffff) para botones con fondo de color.
 */
export const getContrastTextColor = (hexColor: string | null | undefined): string => {
  if (!hexColor) return '#ffffff';
  let clean = hexColor.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  if (clean.length >= 6) {
    const r = parseInt(clean.substring(0, 2), 16) || 0;
    const g = parseInt(clean.substring(2, 4), 16) || 0;
    const b = parseInt(clean.substring(4, 6), 16) || 0;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.65 ? '#000000' : '#ffffff';
  }
  return '#ffffff';
};
