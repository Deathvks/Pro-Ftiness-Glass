import React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { requireOptionalNativeModule } from 'expo';

import { getThemeBaseBackground } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';
import { getThemedModalCardColor } from './ModalThemeBackground';

type ComposeModule = typeof import('@expo/ui/jetpack-compose');
type ModifiersModule = typeof import('@expo/ui/jetpack-compose/modifiers');

let cachedCompose: ComposeModule | null | undefined;
let cachedModifiers: ModifiersModule | null | undefined;

export function getExpressiveCompose(): ComposeModule | null {
  if (Platform.OS !== 'android') return null;
  if (cachedCompose !== undefined) return cachedCompose;
  try {
    const mod = requireOptionalNativeModule('ExpoUI');
    if (!mod) {
      cachedCompose = null;
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedCompose = require('@expo/ui/jetpack-compose') as ComposeModule;
    return cachedCompose;
  } catch {
    cachedCompose = null;
    return null;
  }
}

export function getExpressiveModifiers(): ModifiersModule | null {
  if (Platform.OS !== 'android') return null;
  if (cachedModifiers !== undefined) return cachedModifiers;
  if (!getExpressiveCompose()) {
    cachedModifiers = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModifiers = require('@expo/ui/jetpack-compose/modifiers') as ModifiersModule;
    return cachedModifiers;
  } catch {
    cachedModifiers = null;
    return null;
  }
}

export function isExpressiveAndroidAvailable(): boolean {
  return Boolean(getExpressiveCompose() && getExpressiveModifiers());
}

class ExpressiveFallbackBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function useExpressiveThemeColors() {
  const colors = useAppColors();
  const theme = useAppStore((state: any) => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const contrastText = getContrastTextColor(colors.tint);
  const surfaceBase = getThemeBaseBackground(theme);
  const surfaceCard = theme === 'light' ? '#FFFFFF' : getThemedModalCardColor(theme);

  return {
    theme,
    isDark,
    colors,
    contrastText,
    surfaceBase,
    surfaceCard,
  };
}

function toRgbaHex(color: string | undefined, fallback: `#${string}`): `#${string}` {
  if (!color || !color.startsWith('#')) return fallback;
  const clean = color.slice(1).toUpperCase();
  if (clean.length === 8) return `#${clean}`;
  if (clean.length === 6) return `#${clean}FF`;
  if (clean.length === 3) {
    const r = clean[0] + clean[0];
    const g = clean[1] + clean[1];
    const b = clean[2] + clean[2];
    return `#${r}${g}${b}FF`;
  }
  return fallback;
}

export interface ExpressiveLoadingIndicatorProps {
  size?: 'small' | 'large' | number;
  color?: string;
  contained?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function ExpressiveLoadingIndicator({
  size = 'large',
  color,
  contained = false,
  accessibilityLabel,
  style,
}: ExpressiveLoadingIndicatorProps) {
  const { isDark, colors, surfaceCard } = useExpressiveThemeColors();
  const resolvedColor = color || colors.tint;
  const dpSize =
    typeof size === 'number' ? size : size === 'small' ? 28 : 48;
  const rnSize: 'small' | 'large' =
    typeof size === 'number' ? (size >= 36 ? 'large' : 'small') : size;

  const fallback = (
    <ActivityIndicator
      size={rnSize}
      color={resolvedColor}
      accessibilityLabel={accessibilityLabel}
      style={style}
    />
  );

  const compose = getExpressiveCompose();
  const modifiers = getExpressiveModifiers();
  if (!compose || !modifiers) {
    return fallback;
  }

  const { Host, LoadingIndicator, ContainedLoadingIndicator } = compose;

  return (
    <ExpressiveFallbackBoundary fallback={fallback}>
      <Host
        matchContents
        colorScheme={isDark ? 'dark' : 'light'}
        seedColor={resolvedColor}
        style={[{ width: dpSize, height: dpSize, alignSelf: 'center' }, style]}
      >
        {contained ? (
          <ContainedLoadingIndicator
            color={resolvedColor}
            containerColor={surfaceCard}
            modifiers={[modifiers.size(dpSize, dpSize)]}
          />
        ) : (
          <LoadingIndicator
            color={resolvedColor}
            modifiers={[modifiers.size(dpSize, dpSize)]}
          />
        )}
      </Host>
    </ExpressiveFallbackBoundary>
  );
}

export interface ExpressiveSegmentOption<T extends string = string> {
  key: T;
  label: string;
}

export interface ExpressiveSegmentedRowProps<T extends string = string> {
  options: ExpressiveSegmentOption<T>[];
  selectedKey: T;
  onSelect: (key: T) => void;
  fallback: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ExpressiveSegmentedRow<T extends string = string>({
  options,
  selectedKey,
  onSelect,
  fallback,
  style,
}: ExpressiveSegmentedRowProps<T>) {
  const { isDark, colors, contrastText, surfaceCard } = useExpressiveThemeColors();
  const compose = getExpressiveCompose();
  const modifiers = getExpressiveModifiers();

  if (!compose || !modifiers || options.length < 2 || options.length > 4) {
    return <>{fallback}</>;
  }

  const { Host, SingleChoiceSegmentedButtonRow, SegmentedButton, Text: ComposeText } = compose;
  const tintHex = toRgbaHex(colors.tint, '#22C55EFF');
  const cardHex = toRgbaHex(surfaceCard, isDark ? '#141418FF' : '#FFFFFFFF');
  const inactiveContainer = isDark ? '#1A1A22D8' : '#F1F5F9EB';
  const inactiveBorder = isDark ? '#FFFFFF26' : '#0000001A';
  const inactiveText = isDark ? '#CBD5E1FF' : '#475569FF';

  return (
    <ExpressiveFallbackBoundary fallback={fallback}>
      <Host
        matchContents={{ vertical: true }}
        colorScheme={isDark ? 'dark' : 'light'}
        seedColor={colors.tint}
        colorOverrides={{
          primary: tintHex,
          surface: cardHex,
          secondaryContainer: tintHex,
        }}
        style={[{ width: '100%', minHeight: 46 }, style]}
      >
        <SingleChoiceSegmentedButtonRow modifiers={[modifiers.fillMaxWidth()]}>
          {options.map((opt) => {
            const isSelected = opt.key === selectedKey;
            return (
              <SegmentedButton
                key={opt.key}
                selected={isSelected}
                onClick={() => onSelect(opt.key)}
                colors={{
                  activeContainerColor: colors.tint,
                  activeContentColor: contrastText,
                  activeBorderColor: colors.tint,
                  inactiveContainerColor: inactiveContainer,
                  inactiveContentColor: inactiveText,
                  inactiveBorderColor: inactiveBorder,
                }}
              >
                <SegmentedButton.Label>
                  <ComposeText
                    maxLines={1}
                    overflow="ellipsis"
                    color={isSelected ? contrastText : inactiveText}
                    style={{
                      fontSize: 13,
                      fontWeight: isSelected ? '700' : '600',
                    }}
                  >
                    {opt.label}
                  </ComposeText>
                </SegmentedButton.Label>
              </SegmentedButton>
            );
          })}
        </SingleChoiceSegmentedButtonRow>
      </Host>
    </ExpressiveFallbackBoundary>
  );
}

export interface ExpressiveToolbarAction {
  key: string;
  icon: React.ReactNode;
  onPress: () => void;
  active?: boolean;
  tintColor?: string;
}

export interface ExpressiveFloatingToolbarProps {
  actions: ExpressiveToolbarAction[];
  fab?: {
    icon: React.ReactNode;
    onPress: () => void;
    containerColor?: string;
  };
  variant?: 'standard' | 'vibrant';
  fallback?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ExpressiveFloatingToolbar({
  actions,
  fab,
  variant = 'standard',
  fallback = null,
  style,
}: ExpressiveFloatingToolbarProps) {
  const { isDark, colors, surfaceCard } = useExpressiveThemeColors();
  const compose = getExpressiveCompose();
  const modifiers = getExpressiveModifiers();

  if (!compose || !modifiers) {
    return <>{fallback}</>;
  }

  const {
    Host,
    HorizontalFloatingToolbar,
    IconButton,
    FilledTonalIconButton,
    RNHostView,
  } = compose;

  const toolbarBg = isDark ? surfaceCard : '#FFFFFF';
  const toolbarFg = colors.text;
  const fabBg = fab?.containerColor || colors.tint;
  const fabFg = getContrastTextColor(fabBg);

  return (
    <ExpressiveFallbackBoundary fallback={fallback}>
      <View style={[styles.toolbarHostWrap, style]} pointerEvents="box-none">
        <Host
          matchContents
          colorScheme={isDark ? 'dark' : 'light'}
          seedColor={colors.tint}
          colorOverrides={{
            primary: toRgbaHex(colors.tint, '#22C55EFF'),
            surfaceContainer: toRgbaHex(toolbarBg, isDark ? '#18181FFF' : '#FFFFFFFF'),
          }}
          style={styles.toolbarHost}
        >
          <HorizontalFloatingToolbar
            variant={variant}
            colors={{
              toolbarContainerColor: toolbarBg,
              toolbarContentColor: toolbarFg,
              fabContainerColor: fabBg,
              fabContentColor: fabFg,
            }}
            modifiers={[modifiers.paddingAll(4)]}
          >
            {actions.map((action) => {
              const ButtonComp = action.active ? FilledTonalIconButton : IconButton;
              return (
                <ButtonComp
                  key={action.key}
                  onClick={action.onPress}
                  colors={{
                    containerColor: action.active ? `${colors.tint}2A` : 'transparent',
                    contentColor: action.tintColor || (action.active ? colors.tint : toolbarFg),
                  }}
                >
                  <RNHostView matchContents>
                    <View style={styles.toolbarIconWrap}>{action.icon}</View>
                  </RNHostView>
                </ButtonComp>
              );
            })}

            {fab && (
              <HorizontalFloatingToolbar.FloatingActionButton onPress={fab.onPress}>
                <RNHostView matchContents>
                  <View style={styles.fabIconWrap}>{fab.icon}</View>
                </RNHostView>
              </HorizontalFloatingToolbar.FloatingActionButton>
            )}
          </HorizontalFloatingToolbar>
        </Host>
      </View>
    </ExpressiveFallbackBoundary>
  );
}

const styles = StyleSheet.create({
  toolbarHostWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarHost: {
    alignSelf: 'center',
    minHeight: 68,
  },
  toolbarIconWrap: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchHost: {
    width: 54,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export interface ExpressiveSwitchProps {
  value: boolean;
  onValueChange: (nextValue: boolean) => void;
  tintColor?: string;
  isDark?: boolean;
  disabled?: boolean;
  fallback: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ExpressiveSwitch({
  value,
  onValueChange,
  tintColor,
  isDark: propIsDark,
  disabled = false,
  fallback,
  style,
}: ExpressiveSwitchProps) {
  const { isDark: themeIsDark, colors } = useExpressiveThemeColors();
  const compose = getExpressiveCompose();
  const isDark = propIsDark ?? themeIsDark;
  const activeTint = tintColor || colors.tint;
  const activeThumb = getContrastTextColor(activeTint);

  if (!compose) {
    return <>{fallback}</>;
  }

  const { Host, Switch: ComposeSwitch } = compose;
  const uncheckedTrack = isDark ? '#272730' : '#E2E8F0';
  const uncheckedThumb = isDark ? '#94A3B8' : '#64748B';
  const uncheckedBorder = isDark ? '#475569' : '#94A3B8';

  return (
    <ExpressiveFallbackBoundary fallback={fallback}>
      <Host
        matchContents
        colorScheme={isDark ? 'dark' : 'light'}
        seedColor={activeTint}
        colorOverrides={{
          primary: toRgbaHex(activeTint, '#22C55EFF'),
        }}
        style={[styles.switchHost, disabled && { opacity: 0.5 }, style]}
      >
        <ComposeSwitch
          value={Boolean(value)}
          enabled={!disabled}
          onCheckedChange={onValueChange}
          colors={{
            checkedTrackColor: activeTint,
            checkedThumbColor: activeThumb,
            checkedBorderColor: activeTint,
            uncheckedTrackColor: uncheckedTrack,
            uncheckedThumbColor: uncheckedThumb,
            uncheckedBorderColor: uncheckedBorder,
            disabledCheckedTrackColor: `${activeTint}55`,
            disabledCheckedThumbColor: `${activeThumb}AA`,
            disabledCheckedBorderColor: `${activeTint}55`,
            disabledUncheckedTrackColor: isDark ? '#1D1D24' : '#F1F5F9',
            disabledUncheckedThumbColor: isDark ? '#52525B' : '#CBD5E1',
            disabledUncheckedBorderColor: isDark ? '#3F3F46' : '#E2E8F0',
          }}
        />
      </Host>
    </ExpressiveFallbackBoundary>
  );
}
