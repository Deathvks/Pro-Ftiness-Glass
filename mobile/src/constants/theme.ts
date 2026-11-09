export type ThemeColor = keyof typeof Colors;

export const Colors = {
  light: {
    background: '#F3F4F6',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
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
    card: '#111111',
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    border: 'rgba(255, 255, 255, 0.12)',
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
  }
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
      return '#F3F4F6';
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
