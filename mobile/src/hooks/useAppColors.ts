import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useMemo } from 'react';

/**
 * Hook to provide current theme colors from the global Zustand store.
 * Replaces the system-only useTheme hook so user-selected themes (oled, galaxy, etc) apply correctly.
 */
export function useAppColors() {
  const storeTheme = useAppStore(state => state.theme);
  const storeAccent = useAppStore(state => state.accent);
  const systemScheme = useColorScheme() ?? 'dark';
  
  return useMemo(() => {
    // Si el tema del store es "system" o no existe en los Colors, usa el del sistema, o un fallback
    const activeTheme = (storeTheme === 'system' ? systemScheme : storeTheme) || 'dark';
    
    // Obtenemos la paleta de colores del tema
    const baseColors = Colors[activeTheme as keyof typeof Colors] || Colors.dark;

    // Retornamos los colores, sobreescribiendo el color de acento (tint) si existe en el store
    return {
      ...baseColors,
      ...(storeAccent ? { tint: storeAccent } : {})
    };
  }, [storeTheme, storeAccent, systemScheme]);
}
