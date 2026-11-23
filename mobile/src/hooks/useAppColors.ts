import useAppStore from '@/store/useAppStore';
import { Colors, isAtmosphericTheme, type ThemeColor } from '@/constants/theme';
import { useMemo } from 'react';

/**
 * Hook to provide current theme colors from the global Zustand store.
 * Replaces the system-only useTheme hook so user-selected themes (oled, galaxy, etc) apply correctly.
 */
export function useAppColors() {
  const theme = useAppStore(state => state.theme);
  const accent = useAppStore(state => isAtmosphericTheme(state.theme) ? undefined : state.accent);

  return useMemo(() => {
    const base = Colors[theme as ThemeColor] || Colors.dark;
    return accent && accent !== base.tint ? { ...base, tint: accent } : base;
  }, [theme, accent]);
}
