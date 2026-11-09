import { Platform, StyleSheet, ViewStyle } from 'react-native';

export type ThemeColor = keyof typeof Colors;

export const Colors = {
  light: {
    background: Platform.OS === 'ios' ? '#F2F2F7' : '#F3F4F6',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: Platform.OS === 'ios' ? 'rgba(60, 60, 67, 0.6)' : '#6B7280',
    textMuted: Platform.OS === 'ios' ? '#8E8E93' : '#9CA3AF',
    border: Platform.OS === 'ios' ? 'rgba(60, 60, 67, 0.14)' : '#E5E7EB',
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
    border: 'rgba(255, 255, 255, 0.12)',
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
    border: Platform.OS === 'ios' ? 'rgba(84, 84, 88, 0.45)' : 'rgba(255, 255, 255, 0.12)',
    tint: '#22c55e',
    tabBar: '#000000',
    tabBarInactive: '#52525B',
    success: '#10B981',
    warning: '#fbbf24',
  },
  galaxy: {
    background: 'transparent',
    card: 'rgba(10, 10, 26, 0.70)',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: 'rgba(168, 85, 247, 0.35)',
    tint: '#a855f7',
    tabBar: 'rgba(10, 10, 26, 0.88)',
    tabBarInactive: '#94a3b8',
    success: '#10B981',
    warning: '#fbbf24',
  },
  ocean: {
    background: 'transparent',
    card: 'rgba(240, 249, 255, 0.75)',
    text: '#082f49',
    textSecondary: '#0c4a6e',
    textMuted: '#0284c7',
    border: 'rgba(14, 165, 233, 0.35)',
    tint: '#0ea5e9',
    tabBar: 'rgba(240, 249, 255, 0.92)',
    tabBarInactive: '#0c4a6e',
    success: '#10B981',
    warning: '#f59e0b',
  },
  'ocean-dark': {
    background: 'transparent',
    card: 'rgba(8, 47, 73, 0.75)',
    text: '#f0f9ff',
    textSecondary: '#bae6fd',
    textMuted: '#7dd3fc',
    border: 'rgba(14, 165, 233, 0.35)',
    tint: '#0ea5e9',
    tabBar: 'rgba(8, 47, 73, 0.90)',
    tabBarInactive: '#7dd3fc',
    success: '#10B981',
    warning: '#f59e0b',
  },
  desert: {
    background: 'transparent',
    card: 'rgba(253, 248, 245, 0.75)',
    text: '#5c4033',
    textSecondary: '#8b5a2b',
    textMuted: '#cd853f',
    border: 'rgba(210, 180, 140, 0.35)',
    tint: '#d2b48c',
    tabBar: 'rgba(253, 248, 245, 0.92)',
    tabBarInactive: '#8b5a2b',
    success: '#10B981',
    warning: '#f59e0b',
  },
  'desert-dark': {
    background: 'transparent',
    card: 'rgba(44, 30, 22, 0.75)',
    text: '#f5deb3',
    textSecondary: '#deb887',
    textMuted: '#d2b48c',
    border: 'rgba(210, 180, 140, 0.35)',
    tint: '#d2b48c',
    tabBar: 'rgba(44, 30, 22, 0.90)',
    tabBarInactive: '#deb887',
    success: '#10B981',
    warning: '#f59e0b',
  },
};

export const isAtmosphericTheme = (theme?: string): boolean =>
  ['galaxy', 'ocean', 'ocean-dark', 'desert', 'desert-dark'].includes(theme || '');

/**
 * Returns true when content-layer cards should render a GlassView background.
 * Per Apple iOS 26-27 HIG: Liquid Glass is reserved for the functional floating layer
 * (navigation bars, tab bars, floating pills, sheets) or atmospheric themes where
 * background canvas artwork refracts through. Standard iOS themes (oled, dark, light)
 * use clean Apple Inset Grouped elevated surfaces (#1C1C1E / #1E293B / #FFFFFF).
 */
export const shouldUseContentGlass = (theme?: string): boolean => {
  if (Platform.OS !== 'ios') return true;
  return isAtmosphericTheme(theme);
};

export const getAppleCardSurfaceStyle = (theme?: string, defaultRadius = 20): ViewStyle => {
  const active = theme || 'oled';
  const isLight = active === 'light';
  const isOled = active === 'oled';
  const isDarkTheme = active === 'dark';
  const isAtmos = isAtmosphericTheme(active);

  if (Platform.OS !== 'ios') {
    return {
      borderRadius: defaultRadius,
    };
  }

  if (isAtmos) {
    return {
      borderRadius: 20,
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ['ocean', 'desert'].includes(active)
        ? 'rgba(0, 0, 0, 0.1)'
        : 'rgba(255, 255, 255, 0.16)',
    };
  }

  if (isLight) {
    return {
      backgroundColor: '#FFFFFF',
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

  if (isDarkTheme) {
    return {
      backgroundColor: '#1E293B',
      borderRadius: 20,
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    };
  }

  // Default: OLED (iOS Dark Mode secondarySystemGroupedBackground #1C1C1E)
  return {
    backgroundColor: isOled ? '#1C1C1E' : '#1C1C1E',
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
