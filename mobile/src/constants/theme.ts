import { Platform, StyleSheet, ViewStyle } from 'react-native';

export type ThemeColor = keyof typeof Colors;

const LIGHT_BORDER = Platform.OS === 'ios' ? 'rgba(60, 60, 67, 0.14)' : '#E5E7EB';
const DARK_BORDER = 'rgba(255, 255, 255, 0.12)';
const OLED_BORDER = Platform.OS === 'ios' ? 'rgba(84, 84, 88, 0.45)' : DARK_BORDER;

export const Colors = {
  light: {
    background: Platform.OS === 'ios' ? '#F2F2F7' : '#F3F4F6',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: Platform.OS === 'ios' ? 'rgba(60, 60, 67, 0.6)' : '#6B7280',
    textMuted: Platform.OS === 'ios' ? '#8E8E93' : '#9CA3AF',
    border: LIGHT_BORDER,
    tint: '#22c55e',
    tabBar: '#FFFFFF',
    tabBarInactive: '#9CA3AF',
    success: '#10B981',
    warning: '#F59E0B',
  },
  dark: {
    background: '#0f172a',
    card: '#1e293b',
    text: '#e5e7eb',
    textSecondary: '#9ca3af',
    textMuted: '#64748b',
    border: DARK_BORDER,
    tint: '#22c55e',
    tabBar: '#0f172a',
    tabBarInactive: '#64748b',
    success: '#10B981',
    warning: '#fbbf24',
  },
  oled: {
    background: '#000000',
    card: Platform.OS === 'ios' ? '#1C1C1E' : '#111111',
    text: '#FFFFFF',
    textSecondary: Platform.OS === 'ios' ? 'rgba(235, 235, 245, 0.6)' : '#A1A1AA',
    textMuted: Platform.OS === 'ios' ? 'rgba(235, 235, 245, 0.38)' : '#71717A',
    border: OLED_BORDER,
    tint: '#22c55e',
    tabBar: '#000000',
    tabBarInactive: '#52525B',
    success: '#10B981',
    warning: '#fbbf24',
  },
  galaxy: {
    background: 'transparent',
    card: '#19192E',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: OLED_BORDER,
    tint: '#a855f7',
    tabBar: '#0A0A1A',
    tabBarInactive: '#94a3b8',
    success: '#10B981',
    warning: '#fbbf24',
  },
  ocean: {
    background: 'transparent',
    card: '#F5FBFF',
    text: '#082f49',
    textSecondary: '#0c4a6e',
    textMuted: '#0284c7',
    border: LIGHT_BORDER,
    tint: '#0ea5e9',
    tabBar: '#F0F9FF',
    tabBarInactive: '#0c4a6e',
    success: '#10B981',
    warning: '#f59e0b',
  },
  'ocean-dark': {
    background: 'transparent',
    card: '#103C57',
    text: '#f0f9ff',
    textSecondary: '#bae6fd',
    textMuted: '#7dd3fc',
    border: DARK_BORDER,
    tint: '#0ea5e9',
    tabBar: '#082F49',
    tabBarInactive: '#7dd3fc',
    success: '#10B981',
    warning: '#f59e0b',
  },
  desert: {
    background: 'transparent',
    card: '#FFF9F5',
    text: '#5c4033',
    textSecondary: '#8b5a2b',
    textMuted: '#cd853f',
    border: LIGHT_BORDER,
    tint: '#d2b48c',
    tabBar: '#FDF8F5',
    tabBarInactive: '#8b5a2b',
    success: '#10B981',
    warning: '#f59e0b',
  },
  'desert-dark': {
    background: 'transparent',
    card: '#3D2B23',
    text: '#f5deb3',
    textSecondary: '#deb887',
    textMuted: '#d2b48c',
    border: DARK_BORDER,
    tint: '#d2b48c',
    tabBar: '#2C1E16',
    tabBarInactive: '#deb887',
    success: '#10B981',
    warning: '#f59e0b',
  },
};

type SurfaceMode = 'oled' | 'light' | 'dark';

const atmosphericSurfaceModes = new Map<string, SurfaceMode>([
  ['galaxy', 'oled'],
  ['ocean', 'light'],
  ['ocean-dark', 'dark'],
  ['desert', 'light'],
  ['desert-dark', 'dark'],
]);

export const isAtmosphericTheme = (theme?: string): boolean => atmosphericSurfaceModes.has(theme ?? '');

export const getThemeSurfaceMode = (theme?: string): SurfaceMode =>
  atmosphericSurfaceModes.get(theme ?? '') ?? (theme === 'light' || theme === 'dark' ? theme : 'oled');

// On iOS, native glass is reserved for controls and navigation. Other platforms use the fallback view.
export const shouldUseContentGlass = (): boolean => Platform.OS !== 'ios';

export const getAppleCardSurfaceStyle = (theme?: string, defaultRadius = 20): ViewStyle => {
  const mode = getThemeSurfaceMode(theme);
  const themedColor = isAtmosphericTheme(theme) ? Colors[theme as ThemeColor].card : undefined;

  if (Platform.OS !== 'ios') {
    return {
      borderRadius: defaultRadius,
      ...(themedColor && { backgroundColor: themedColor }),
    };
  }

  if (mode === 'light') {
    return {
      backgroundColor: themedColor ?? '#FFFFFF',
      borderRadius: 20,
      borderCurve: 'continuous',
      borderWidth: 0,
      borderColor: 'transparent',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
    };
  }

  if (mode === 'dark') {
    return {
      backgroundColor: themedColor ?? '#1E293B',
      borderRadius: 20,
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    };
  }

  // Default: OLED (iOS Dark Mode secondarySystemGroupedBackground #1C1C1E)
  return {
    backgroundColor: themedColor ?? '#1C1C1E',
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 0,
    borderColor: 'transparent',
  };
};

export const getThemeBaseBackground = (theme: string): string => {
  switch (theme) {
    case 'desert':
      return '#fdf8f5';
    case 'desert-dark':
      return '#2c1e16';
    case 'ocean':
      return '#f0f9ff';
    case 'ocean-dark':
      return '#082f49';
    case 'galaxy':
      return '#080814';
    case 'light':
      return Platform.OS === 'ios' ? '#F2F2F7' : '#F3F4F6';
    case 'oled':
      return '#000000';
    case 'dark':
    default:
      return '#0f172a';
  }
};
export const MaxContentWidth = 960;

export const Spacing = {
  zero: 0,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 28,
  eight: 32,
};

export const Fonts = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  heavy: 'System',
};
