import { View } from 'react-native';
import { GlassView, type GlassViewProps } from 'expo-glass-effect';
import { getAppleCardSurfaceStyle, isAtmosphericTheme } from '@/constants/theme';
import useAppStore from '@/store/useAppStore';

export function ContentCardBackdrop({ colorScheme, style }: Pick<GlassViewProps, 'colorScheme' | 'style'>) {
  const theme = useAppStore(state => state.theme);

  if (isAtmosphericTheme(theme)) {
    return <View pointerEvents="none" style={[style, { backgroundColor: getAppleCardSurfaceStyle(theme).backgroundColor }]} />;
  }

  return <GlassView pointerEvents="none" glassEffectStyle="regular" colorScheme={colorScheme} style={style} />;
}
