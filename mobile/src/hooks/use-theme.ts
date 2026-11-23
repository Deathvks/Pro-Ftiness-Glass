/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useAppColors } from '@/hooks/useAppColors';

export function useTheme() {
  return useAppColors();
}
