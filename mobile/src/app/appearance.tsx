import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Palette,
  Sun,
  Moon,
  MonitorCog,
  Smartphone,
  Check,
  Lock,
  LockOpen,
  Info,
  Vibrate,
  Droplet,
  ChevronDown,
  Sparkles,
  Gauge,
  Battery,
  X,
} from 'lucide-react-native';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import { getContrastTextColor } from '@/utils/routineHelpers';
import { getThemeBaseBackground } from '@/constants/theme';
import GlobalHeader from '@/components/GlobalHeader';
import LevelBadge from '@/components/LevelBadge';
import ThemeBackground from '@/components/ThemeBackground';
import LiquidGlassSwitch from '@/components/ui/LiquidGlassSwitch';

export interface AccentOption {
  id: string;
  label: string;
  hex: string;
  gradient?: readonly [string, string, ...string[]];
  reqLevel?: number;
  isAnimated?: boolean;
}

const ACCENT_OPTIONS: AccentOption[] = [
  // Base (20 opciones estándar)
  { id: 'green', label: 'Verde', hex: '#22c55e' },
  { id: 'blue', label: 'Azul', hex: '#3b82f6' },
  { id: 'violet', label: 'Violeta', hex: '#8b5cf6' },
  { id: 'amber', label: 'Ámbar', hex: '#f59e0b' },
  { id: 'rose', label: 'Rosa', hex: '#f43f5e' },
  { id: 'teal', label: 'Turquesa', hex: '#14b8a6' },
  { id: 'cyan', label: 'Cian', hex: '#06b6d4' },
  { id: 'orange', label: 'Naranja', hex: '#f97316' },
  { id: 'lime', label: 'Lima', hex: '#84cc16' },
  { id: 'fuchsia', label: 'Fucsia', hex: '#d946ef' },
  { id: 'emerald', label: 'Esmeralda', hex: '#10b981' },
  { id: 'indigo', label: 'Índigo', hex: '#6366f1' },
  { id: 'purple', label: 'Púrpura', hex: '#a855f7' },
  { id: 'pink', label: 'Rosa Claro', hex: '#ec4899' },
  { id: 'red', label: 'Rojo', hex: '#ef4444' },
  { id: 'yellow', label: 'Amarillo', hex: '#eab308' },
  { id: 'sky', label: 'Cielo', hex: '#0ea5e9' },
  { id: 'slate', label: 'Pizarra', hex: '#64748b' },
  { id: 'zinc', label: 'Zinc', hex: '#71717a' },
  { id: 'stone', label: 'Piedra', hex: '#78716c' },

  // Nivel 5 (5 colores suaves)
  { id: 'mint', label: 'Menta Suave', hex: '#a8e6cf', reqLevel: 5 },
  { id: 'peach', label: 'Melocotón', hex: '#ffd3b6', reqLevel: 5 },
  { id: 'rose-water', label: 'Agua de Rosas', hex: '#ffaaa5', reqLevel: 5 },
  { id: 'lavender', label: 'Lavanda', hex: '#c5a3ff', reqLevel: 5 },
  { id: 'baby-blue', label: 'Azul Bebé', hex: '#a2cffe', reqLevel: 5 },

  // Nivel 10 (5 tonos pastel)
  { id: 'sunset-pink', label: 'Rosa Atardecer', hex: '#ff9a9e', reqLevel: 10 },
  { id: 'pistachio', label: 'Pistacho', hex: '#c5e1a5', reqLevel: 10 },
  { id: 'mango', label: 'Mango Pastel', hex: '#ffbe76', reqLevel: 10 },
  { id: 'lemonade', label: 'Limonada', hex: '#fdfd96', reqLevel: 10 },
  { id: 'cherry-blossom', label: 'Cerezo', hex: '#fccbcf', reqLevel: 10 },

  // Nivel 15 · Degradados
  { id: 'aurora', label: 'Aurora Boreal', hex: '#10b981', gradient: ['#10b981', '#06b6d4'], reqLevel: 15 },
  { id: 'sunset', label: 'Sunset Glow', hex: '#f43f5e', gradient: ['#f43f5e', '#fb923c'], reqLevel: 15 },
  { id: 'cyberpunk', label: 'Cyberpunk', hex: '#8b5cf6', gradient: ['#8b5cf6', '#ec4899'], reqLevel: 15 },
  { id: 'deep-ocean', label: 'Océano Profundo', hex: '#2563eb', gradient: ['#2563eb', '#00f5d4'], reqLevel: 15 },
  { id: 'imperial-gold', label: 'Oro Imperial', hex: '#f59e0b', gradient: ['#f59e0b', '#fde047'], reqLevel: 15 },

  // Nivel 20 · Dinámicos Animados
  { id: 'supernova', label: 'Supernova', hex: '#8b5cf6', gradient: ['#7c3aed', '#ec4899', '#3b82f6', '#7c3aed'], reqLevel: 20, isAnimated: true },
  { id: 'plasma', label: 'Plasma Cuántico', hex: '#10b981', gradient: ['#10b981', '#06b6d4', '#3b82f6', '#10b981'], reqLevel: 20, isAnimated: true },
  { id: 'eternal-flame', label: 'Llama Eterna', hex: '#f97316', gradient: ['#ef4444', '#f97316', '#facc15', '#ef4444'], reqLevel: 20, isAnimated: true },
  { id: 'abyssal-vortex', label: 'Vórtice Abisal', hex: '#3b82f6', gradient: ['#1d4ed8', '#6366f1', '#14b8a6', '#1d4ed8'], reqLevel: 20, isAnimated: true },
  { id: 'cosmic-gold', label: 'Oro Cósmico', hex: '#f59e0b', gradient: ['#d97706', '#fef08a', '#b45309', '#d97706'], reqLevel: 20, isAnimated: true },
];

const BASE_THEMES = [
  { id: 'system', label: 'Sistema', icon: MonitorCog },
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Oscuro', icon: Moon },
  { id: 'oled', label: 'OLED', icon: Smartphone },
];

const MeteorIcon = ({ size, color }: { size: number; color: string }) => (
  <FontAwesome5 name="meteor" size={size} color={color} />
);

type SpecialTheme = {
  key: string;
  label: string;
  tint: string;
  requiredReferrals: number;
  icon: React.ComponentType<{ size: number; color: string }>;
  variants: { id: string; label: string; testLabel: string }[];
  textLight: string;
  textDark: string;
  info: string;
};

const SPECIAL_THEMES: SpecialTheme[] = [
  {
    key: 'galaxy',
    label: 'Tema Galaxia',
    tint: '#a855f7',
    requiredReferrals: 5,
    icon: MeteorIcon,
    variants: [{ id: 'galaxy', label: 'Aplicar', testLabel: 'Probar 10s' }],
    textLight: '#a855f7',
    textDark: '#a855f7',
    info: 'El Tema Galaxia usa su propio acento estelar (desactiva el acento manual).',
  },
  {
    key: 'desert',
    label: 'Tema Desierto',
    tint: '#d2b48c',
    requiredReferrals: 8,
    icon: Sun,
    variants: [
      { id: 'desert', label: 'Claro', testLabel: 'Probar Claro' },
      { id: 'desert-dark', label: 'Oscuro', testLabel: 'Probar Oscuro' },
    ],
    textLight: '#b45309',
    textDark: '#fcd34d',
    info: 'El Tema Desierto usa su propio acento cálido (desactiva el acento manual).',
  },
  {
    key: 'ocean',
    label: 'Tema Océano',
    tint: '#0ea5e9',
    requiredReferrals: 11,
    icon: Droplet,
    variants: [
      { id: 'ocean', label: 'Claro', testLabel: 'Probar Claro' },
      { id: 'ocean-dark', label: 'Oscuro', testLabel: 'Probar Oscuro' },
    ],
    textLight: '#0369a1',
    textDark: '#7dd3fc',
    info: 'El Tema Océano usa su propio acento vibrante (desactiva el acento manual).',
  },
];

const SPECIAL_THEME_IDS = ['galaxy', 'ocean', 'ocean-dark', 'desert', 'desert-dark'];

function GlassSurface({
  radius,
  isDark,
  borderColor,
  tintColor,
  tintOpacity = 0,
  style,
  children,
}: {
  radius: number;
  isDark: boolean;
  borderColor: string;
  tintColor?: string;
  tintOpacity?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const innerRadius = Math.max(0, radius - 1);
  return (
    <View style={[{ borderRadius: radius, borderWidth: 1, borderColor }, style]}>
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: innerRadius }]}
      />
      {tintColor ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: innerRadius, backgroundColor: tintColor, opacity: tintOpacity },
          ]}
        />
      ) : null}
      {children}
    </View>
  );
}

export default function AppearanceScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isMobile = windowWidth < 600;
  const isNarrow = windowWidth < 380;
  const isTablet = windowWidth >= 680;

  const theme = useAppStore(state => state.theme) || 'oled';
  const themePreference = useAppStore(state => (state as any).themePreference) || theme;
  const setTheme = useAppStore(state => state.setTheme);
  const accent: string = useAppStore(state => state.accent) || '#22c55e';
  const setAccent = useAppStore(state => state.setAccent);
  const hapticsEnabled = useAppStore(state => (state as any).hapticsEnabled !== false);
  const setHapticsEnabled = useAppStore(state => (state as any).setHapticsEnabled);
  const galaxyEffectsEnabled = useAppStore(state => (state as any).galaxyEffectsEnabled !== false);
  const setGalaxyEffectsEnabled = useAppStore(state => (state as any).setGalaxyEffectsEnabled);

  const themeTest = useAppStore(state => (state as any).themeTest) as { name: string; timeLeft: number } | null;
  const startThemeTest = useAppStore(state => (state as any).startThemeTest);
  const userProfile = useAppStore(state => state.userProfile) as any;
  const gamification = useAppStore(state => (state as any).gamification);

  const colors = useAppColors();
  const scrollY = useRef(new Animated.Value(0)).current;

  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isTestingTheme = !!themeTest;
  const activeTheme = theme;
  const isSpecialActive = SPECIAL_THEME_IDS.includes(activeTheme);
  const isGalaxyActive = activeTheme === 'galaxy';

  const isAdmin = userProfile?.role === 'admin';
  const referralCount = userProfile?.referralCount || 0;
  const userLevel = gamification?.level || userProfile?.level || 1;

  const accentText = getContrastColor(colors.tint, theme);
  const subtleBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  const [isMyThemesOpen, setIsMyThemesOpen] = useState(true);
  const [showGalaxyWarning, setShowGalaxyWarning] = useState(false);

  // Animación de pulso continuo para los acentos nivel 20
  const livingPulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(livingPulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
        Animated.timing(livingPulseAnim, { toValue: 1.0, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, []);

  // Toast
  const [toast, setToast] = useState<{ message: string; locked?: boolean } | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, locked = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, locked });
    Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
        setToast(null)
      );
    }, 2200);
  };

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const tap = () => {
    if (hapticsEnabled) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  };

  const handleThemeClick = (mode: string) => {
    tap();
    setTheme(mode);
  };

  const handleAccent = (opt: AccentOption) => {
    tap();
    setAccent(opt.hex);
  };

  const handleToggleHaptics = (forcedValue?: boolean) => {
    const newValue = typeof forcedValue === 'boolean' ? forcedValue : !hapticsEnabled;
    setHapticsEnabled?.(newValue);
    if (newValue) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    } else {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    showToast(newValue ? 'Vibración activada' : 'Vibración desactivada');
  };

  const handleToggleGalaxyEffects = () => {
    tap();
    if (galaxyEffectsEnabled) {
      setGalaxyEffectsEnabled?.(false);
      showToast('Efectos de Galaxia desactivados');
    } else {
      setShowGalaxyWarning(true);
    }
  };

  const handleConfirmGalaxyEffects = () => {
    setGalaxyEffectsEnabled?.(true);
    setShowGalaxyWarning(false);
    showToast('Efectos de Galaxia activados');
  };

  const handleTest = (themeId: string) => {
    tap();
    startThemeTest?.(themeId, 10);
  };

  const SectionTitle = ({ icon: Icon, title }: { icon: React.ComponentType<any>; title: string }) => (
    <View style={styles.sectionTitleRow}>
      <View style={[styles.sectionIconBox, { backgroundColor: subtleBg }]}>
        <Icon size={22} color={accentText} strokeWidth={2.5} />
      </View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );

  const SubHeading = ({ children, style }: { children: React.ReactNode; style?: any }) => (
    <Text style={[styles.subHeading, { color: colors.textSecondary }, style]}>{children}</Text>
  );

  const swatchCols = isTablet ? 6 : (isNarrow ? 4 : 5);
  const swatchSize = isNarrow ? 44 : 48;

  const renderSwatch = (opt: AccentOption) => {
    const isLocked = !!opt.reqLevel && userLevel < opt.reqLevel && !isAdmin;
    const isSelected = accent.toLowerCase() === opt.hex.toLowerCase() && !isSpecialActive && !isLocked;

    return (
      <View key={opt.id} style={{ width: `${100 / swatchCols}%`, padding: 3, alignItems: 'center' }}>
        <Pressable
          onPress={() => {
            if (isLocked) {
              showToast(`Requiere nivel ${opt.reqLevel} para aplicarlo`, true);
            } else {
              handleAccent(opt);
            }
          }}
          accessibilityLabel={opt.label + (isLocked ? ` (Nivel ${opt.reqLevel})` : '')}
          style={({ pressed }) => [
            styles.swatchRing,
            {
              width: swatchSize,
              height: swatchSize,
              borderRadius: swatchSize / 2,
              borderColor: isSelected ? opt.hex : 'transparent',
              opacity: isLocked ? 0.4 : 1,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.swatchDot,
              { backgroundColor: opt.hex },
              opt.isAnimated && {
                transform: [{ scale: isSelected ? livingPulseAnim : 1 }],
              },
            ]}
          >
            {opt.gradient && (
              <LinearGradient
                colors={opt.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            {isSelected && <Check size={16} strokeWidth={3} color={getContrastTextColor(opt.hex)} />}
            {isLocked && <Lock size={14} strokeWidth={2.5} color="rgba(0, 0, 0, 0.55)" />}
          </Animated.View>
        </Pressable>
        <Text
          numberOfLines={2}
          style={[
            styles.swatchLabel,
            {
              color: isSelected ? colors.tint : colors.textSecondary,
              fontWeight: isSelected ? '700' : '500',
            },
          ]}
        >
          {opt.label}
        </Text>
      </View>
    );
  };

  const renderLevelHeader = (level: number, badgeText?: string) => (
    <View style={styles.levelHeader}>
      <View style={styles.levelBadgeBox}>
        <View style={{ transform: [{ scale: 0.55 }] }}>
          <LevelBadge level={level} size="sm" bgTheme={isDark ? '#111111' : '#ffffff'} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={[styles.levelTitle, { color: colors.text }]}>Nivel {level}</Text>
        {badgeText && (
          <View style={[styles.levelTag, { backgroundColor: colors.tint + '20' }]}>
            <Text style={[styles.levelTagText, { color: colors.tint }]}>{badgeText}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background === 'transparent' ? getThemeBaseBackground(theme) : colors.background }}>
      {/* Fondo de tema activo (desierto, océano, galaxia) */}
      <ThemeBackground />

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }} pointerEvents="box-none">
        <GlobalHeader title="Apariencia" scrollY={scrollY} showBackButton />
      </View>

      <Animated.ScrollView
        contentContainerStyle={{
          paddingHorizontal: isMobile ? 14 : Math.max(16, (windowWidth - 640) / 2),
          paddingTop: insets.top + 52,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        {/* ================= 1. MIS TEMAS (ARRIBA Y DESPLEGABLE) ================= */}
        <GlassSurface radius={28} isDark={isDark} borderColor={glassBorder} style={[styles.card, { padding: isMobile ? 16 : 22 }]}>
          <Pressable
            onPress={() => setIsMyThemesOpen(!isMyThemesOpen)}
            style={styles.myThemesHeaderRow}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={[styles.sectionIconBox, { backgroundColor: subtleBg }]}>
                <MeteorIcon size={22} color={accentText} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Mis Temas</Text>
                  {isSpecialActive && (
                    <View style={[styles.activeThemePill, { backgroundColor: colors.tint + '20' }]}>
                      <Text style={[styles.activeThemePillText, { color: colors.tint }]}>
                        {activeTheme.startsWith('galaxy')
                          ? 'Galaxia'
                          : activeTheme.startsWith('desert')
                          ? 'Desierto'
                          : 'Océano'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.myThemesSubtitle, { color: colors.textSecondary }]}>
                  {isMyThemesOpen ? 'Toca para solapar' : '3 temas exclusivos · Toca para desplegar'}
                </Text>
              </View>
            </View>

            <View style={[styles.chevronBox, { backgroundColor: subtleBg }]}>
              <ChevronDown
                size={18}
                color={colors.textSecondary}
                style={{ transform: [{ rotate: isMyThemesOpen ? '180deg' : '0deg' }] }}
              />
            </View>
          </Pressable>

          {isMyThemesOpen && (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.cardDescription, { color: colors.textSecondary, marginBottom: 14 }]}>
                Temas exclusivos desbloqueados mediante retos y progreso en la aplicación.
              </Text>

              {SPECIAL_THEMES.map((st, index) => {
                const isUnlocked = referralCount >= st.requiredReferrals || isAdmin;
                const isGroupActive = st.variants.some(v => v.id === activeTheme);
                const STIcon = st.icon;
                const pillText = isDark ? st.textDark : st.textLight;
                const isSingle = st.variants.length === 1;
                const showButtonsBelow = isMobile && !isSingle;

                const renderVariantButton = (v: typeof st.variants[0], isFullWidth: boolean) => {
                  if (isUnlocked) {
                    const isBtnActive = (themePreference === v.id || activeTheme === v.id) && !isTestingTheme;
                    const label = isSingle ? (isBtnActive ? 'Activo' : 'Aplicar') : v.label;
                    return (
                      <Pressable
                        key={v.id}
                        onPress={() => handleThemeClick(v.id)}
                        style={({ pressed }) => [
                          isFullWidth && { flex: 1 },
                          { transform: [{ scale: pressed ? 0.94 : 1 }] },
                        ]}
                      >
                        <GlassSurface
                          radius={14}
                          isDark={isDark}
                          borderColor={isBtnActive ? st.tint : glassBorder}
                          tintColor={isBtnActive ? st.tint : isDark ? '#ffffff' : '#000000'}
                          tintOpacity={isBtnActive ? 0.9 : 0.08}
                          style={isFullWidth ? styles.pillFullWidth : isSingle ? styles.pillLarge : styles.pillSmall}
                        >
                          <Text
                            style={[
                              isFullWidth ? styles.pillFullWidthText : isSingle ? styles.pillLargeText : styles.pillSmallText,
                              { color: isBtnActive ? '#ffffff' : pillText },
                            ]}
                            numberOfLines={1}
                          >
                            {label}
                          </Text>
                        </GlassSurface>
                      </Pressable>
                    );
                  }

                  const isThisTesting = themeTest?.name === v.id;
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => handleTest(v.id)}
                      disabled={isTestingTheme}
                      style={({ pressed }) => [
                        isFullWidth && { flex: 1 },
                        {
                          opacity: isTestingTheme && !isThisTesting ? 0.8 : 1,
                          transform: [{ scale: pressed ? 0.94 : 1 }],
                        },
                      ]}
                    >
                      <GlassSurface
                        radius={14}
                        isDark={isDark}
                        borderColor={st.tint + '4D'}
                        tintColor={st.tint}
                        tintOpacity={0.2}
                        style={[
                          isFullWidth ? styles.pillFullWidth : isSingle ? styles.pillLarge : styles.pillSmall,
                          isSingle && !isFullWidth && { minWidth: 100 },
                        ]}
                      >
                        <Text
                          style={[
                            isFullWidth ? styles.pillFullWidthText : isSingle ? styles.pillLargeText : styles.pillSmallText,
                            { color: st.tint },
                          ]}
                          numberOfLines={1}
                        >
                          {isThisTesting ? `Probando ${themeTest?.timeLeft}s` : v.testLabel}
                        </Text>
                      </GlassSurface>
                    </Pressable>
                  );
                };

                return (
                  <View
                    key={st.key}
                    style={[
                      styles.themeRow,
                      index > 0 && { marginTop: 12 },
                      isGroupActive
                        ? {
                            backgroundColor: st.tint + '1A',
                            borderColor: st.tint + '4D',
                          }
                        : { backgroundColor: subtleBg, borderColor: 'transparent' },
                    ]}
                  >
                    <View style={styles.themeRowInner}>
                      <View style={styles.themeRowLeft}>
                        <View
                          style={[
                            styles.themeIconBox,
                            {
                              backgroundColor: isUnlocked
                                ? st.tint + '33'
                                : isDark
                                ? 'rgba(255, 255, 255, 0.1)'
                                : 'rgba(0, 0, 0, 0.1)',
                            },
                          ]}
                        >
                          <STIcon size={20} color={isUnlocked ? st.tint : colors.textSecondary} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            style={[styles.themeRowTitle, { color: isUnlocked ? st.tint : colors.text }]}
                            numberOfLines={1}
                          >
                            {st.label}
                          </Text>
                          <View style={styles.themeRowStatus}>
                            {isUnlocked ? (
                              <>
                                <LockOpen size={11} color="#22c55e" />
                                <Text style={[styles.themeRowStatusText, { color: colors.textSecondary }]}>
                                  Desbloqueado
                                </Text>
                              </>
                            ) : (
                              <>
                                <Lock size={11} color={colors.textSecondary} />
                                <Text style={[styles.themeRowStatusText, { color: colors.textSecondary }]}>
                                  Invita a {st.requiredReferrals} amigos
                                </Text>
                              </>
                            )}
                          </View>
                        </View>
                      </View>

                      {!showButtonsBelow && (
                        <View style={styles.variantButtonsRow}>
                          {st.variants.map(v => renderVariantButton(v, false))}
                        </View>
                      )}
                    </View>

                    {showButtonsBelow && (
                      <View style={styles.variantButtonsRowMobile}>
                        {st.variants.map(v => renderVariantButton(v, true))}
                      </View>
                    )}

                    {isGroupActive && (
                      <View style={styles.themeInfoRow}>
                        <Info size={13} color={st.tint} />
                        <Text style={[styles.themeInfoText, { color: st.tint }]}>{st.info}</Text>
                      </View>
                    )}

                    {/* Switch para Estrellas y Meteoros animados (solo si Galaxia está activo) */}
                    {st.key === 'galaxy' && isGalaxyActive && (
                      <View style={[styles.galaxySwitchContainer, { borderTopColor: st.tint + '26' }]}>
                        <Pressable
                          onPress={handleToggleGalaxyEffects}
                          style={({ pressed }) => [
                            styles.galaxySwitchRow,
                            { transform: [{ scale: pressed ? 0.98 : 1 }] },
                          ]}
                        >
                          <View style={styles.galaxySwitchInfo}>
                            <View style={[styles.switchIconBox, { backgroundColor: st.tint + '20' }]}>
                              <MeteorIcon size={16} color={st.tint} />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={[styles.switchTitle, { color: colors.text }]}>
                                Estrellas animadas y meteoros
                              </Text>
                              <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>
                                Añade movimiento y lluvia de estrellas al fondo
                              </Text>
                            </View>
                          </View>

                          <LiquidGlassSwitch
                            value={galaxyEffectsEnabled}
                            onValueChange={handleToggleGalaxyEffects}
                            tintColor={st.tint}
                            isDark={isDark}
                            accessibilityLabel="Estrellas animadas y meteoros"
                          />
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </GlassSurface>

        {/* ================= 2. APARIENCIA DE LA APP ================= */}
        <GlassSurface radius={28} isDark={isDark} borderColor={glassBorder} style={[styles.card, { padding: isMobile ? 16 : 22 }]}>
          <SectionTitle icon={Palette} title="Apariencia de la App" />

          {/* Temas Base */}
          <View style={{ marginBottom: 26 }}>
            <SubHeading>Tema Principal</SubHeading>
            <View style={[styles.themeGrid, isMobile && { flexWrap: 'wrap' }]}>
              {BASE_THEMES.map(mode => {
                const isActive = themePreference === mode.id && !isTestingTheme && !isSpecialActive;
                const ModeIcon = mode.icon;
                const fg = isActive ? getContrastTextColor(colors.tint) : colors.textSecondary;
                return (
                  <Pressable
                    key={mode.id}
                    onPress={() => handleThemeClick(mode.id)}
                    style={({ pressed }) => [
                      styles.themeTileWrap,
                      isMobile && { width: '48%', flex: undefined, marginBottom: 8 },
                      { transform: [{ scale: pressed ? 0.96 : isActive ? 1.04 : 1 }] },
                    ]}
                  >
                    <GlassSurface
                      radius={18}
                      isDark={isDark}
                      borderColor={isActive ? colors.tint : glassBorder}
                      tintColor={isActive ? colors.tint : isDark ? '#ffffff' : '#000000'}
                      tintOpacity={isActive ? 0.9 : 0.05}
                      style={styles.themeTile}
                    >
                      <ModeIcon size={20} color={fg} />
                      <Text style={[styles.themeTileLabel, { color: fg }]}>{mode.label}</Text>
                    </GlassSurface>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Acentos de Color */}
          <View
            style={{ marginBottom: 26, opacity: isSpecialActive ? 0.5 : 1 }}
            pointerEvents={isSpecialActive ? 'none' : 'auto'}
          >
            <SubHeading>Acento de Color</SubHeading>
            <View style={[styles.swatchGrid, { marginBottom: 14 }]}>
              {ACCENT_OPTIONS.filter(o => !o.reqLevel).map(opt => renderSwatch(opt))}
            </View>

            <SubHeading style={{ marginTop: 18, marginBottom: 8 }}>Acento de color por niveles</SubHeading>

            {/* Nivel 5 */}
            {renderLevelHeader(5)}
            <View style={[styles.swatchGrid, { marginBottom: 14 }]}>
              {ACCENT_OPTIONS.filter(o => o.reqLevel === 5).map(opt => renderSwatch(opt))}
            </View>

            {/* Nivel 10 */}
            {renderLevelHeader(10)}
            <View style={[styles.swatchGrid, { marginBottom: 14 }]}>
              {ACCENT_OPTIONS.filter(o => o.reqLevel === 10).map(opt => renderSwatch(opt))}
            </View>

            {/* Nivel 15 · Degradados */}
            {renderLevelHeader(15, 'Degradados')}
            <View style={[styles.swatchGrid, { marginBottom: 14 }]}>
              {ACCENT_OPTIONS.filter(o => o.reqLevel === 15).map(opt => renderSwatch(opt))}
            </View>

            {/* Nivel 20 · Dinámicos Animados */}
            {renderLevelHeader(20, 'Animados')}
            <View style={styles.swatchGrid}>
              {ACCENT_OPTIONS.filter(o => o.reqLevel === 20).map(opt => renderSwatch(opt))}
            </View>
          </View>

          {/* Experiencia UX */}
          <View>
            <SubHeading>Experiencia UX</SubHeading>
            <Pressable
              onPress={handleToggleHaptics}
              style={({ pressed }) => [
                styles.switchRow,
                { backgroundColor: subtleBg, transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <View style={styles.switchInfo}>
                <View
                  style={[
                    styles.switchIconBox,
                    { backgroundColor: hapticsEnabled ? colors.tint + '1A' : subtleBg },
                  ]}
                >
                  <Vibrate size={18} color={hapticsEnabled ? accentText : colors.textSecondary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.switchTitle, { color: colors.text }]}>Vibración Háptica</Text>
                  <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>
                    Feedback táctil al pulsar botones y completar series
                  </Text>
                </View>
              </View>

              <LiquidGlassSwitch
                value={hapticsEnabled}
                onValueChange={(val) => handleToggleHaptics(val)}
                tintColor={colors.tint}
                isDark={isDark}
                accessibilityLabel="Vibración Háptica"
              />
            </Pressable>
          </View>
        </GlassSurface>
      </Animated.ScrollView>

      {/* Modal de Advertencia para Efectos de Galaxia */}
      <Modal
        visible={showGalaxyWarning}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGalaxyWarning(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <GlassSurface
              radius={26}
              isDark={isDark}
              borderColor={glassBorder}
              tintColor={isDark ? '#080814' : '#ffffff'}
              tintOpacity={0.92}
              style={styles.modalCard}
            >
              <Pressable
                onPress={() => setShowGalaxyWarning(false)}
                style={styles.modalCloseBtn}
                hitSlop={12}
              >
                <X size={20} color={colors.textSecondary} />
              </Pressable>

              <View style={[styles.modalIconWrap, { backgroundColor: '#a855f720' }]}>
                <Sparkles size={30} color="#a855f7" />
              </View>

              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Efectos animados de Galaxia
              </Text>

              <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                Las estrellas en movimiento y los meteoros pueden exigir más al dispositivo y aumentar el consumo de batería. Puedes desactivarlos cuando quieras desde Apariencia.
              </Text>

              <View style={styles.modalBadgesRow}>
                <View style={styles.modalBadge}>
                  <Gauge size={14} color="#a855f7" />
                  <Text style={[styles.modalBadgeText, { color: colors.textSecondary }]}>
                    Más carga gráfica
                  </Text>
                </View>
                <View style={styles.modalBadge}>
                  <Battery size={14} color="#a855f7" />
                  <Text style={[styles.modalBadgeText, { color: colors.textSecondary }]}>
                    Consumo de batería
                  </Text>
                </View>
              </View>

              <View style={styles.modalActionsRow}>
                <Pressable
                  onPress={() => setShowGalaxyWarning(false)}
                  style={[styles.modalBtnSecondary, { backgroundColor: subtleBg }]}
                >
                  <Text style={[styles.modalBtnSecondaryText, { color: colors.textSecondary }]}>
                    Ahora no
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleConfirmGalaxyEffects}
                  style={[styles.modalBtnPrimary, { backgroundColor: '#a855f7' }]}
                >
                  <Text style={styles.modalBtnPrimaryText}>Activar efectos</Text>
                </Pressable>
              </View>
            </GlassSurface>
          </View>
        </View>
      </Modal>

      {/* Toast Ligero */}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastWrap,
            {
              bottom: insets.bottom + 24,
              opacity: toastAnim,
              transform: [
                { translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
              ],
            },
          ]}
        >
          <GlassSurface
            radius={20}
            isDark={isDark}
            borderColor={glassBorder}
            tintColor={isDark ? '#000000' : '#ffffff'}
            tintOpacity={0.35}
            style={styles.toast}
          >
            {toast.locked ? (
              <Lock size={16} color={accentText} />
            ) : (
              <Check size={16} color={accentText} strokeWidth={3} />
            )}
            <Text style={[styles.toastText, { color: colors.text }]}>{toast.message}</Text>
          </GlassSurface>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionIconBox: {
    padding: 8,
    borderRadius: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 2,
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 17,
  },

  myThemesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myThemesSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  activeThemePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeThemePillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chevronBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  themeGrid: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  themeTileWrap: {
    flex: 1,
  },
  themeTile: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  themeTileLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
  },
  swatchRing: {
    borderWidth: 2.5,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchDot: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  swatchLabel: {
    fontSize: 9.5,
    textAlign: 'center',
    marginTop: 3,
    height: 22,
    lineHeight: 11,
    paddingHorizontal: 1,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    marginBottom: 6,
    marginLeft: 2,
  },
  levelBadgeBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  levelTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  levelTagText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  themeRow: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  themeRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  themeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  themeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeRowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  themeRowStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  themeRowStatusText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  variantButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  themeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  themeInfoText: {
    fontSize: 10.5,
    fontWeight: '600',
    flex: 1,
  },
  variantButtonsRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    width: '100%',
  },
  pillFullWidth: {
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pillFullWidthText: {
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  galaxySwitchContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  galaxySwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 0,
    gap: 8,
  },
  galaxySwitchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },

  pillLarge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLargeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pillSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSmallText: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 16,
    gap: 10,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  switchIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  switchSubtitle: {
    fontSize: 10.5,
    marginTop: 2,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
  },
  modalCard: {
    padding: 22,
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    zIndex: 10,
  },
  modalIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalBadgesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  modalBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 13,
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 13,
    alignItems: 'center',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  modalBtnPrimaryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },

  toastWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 200,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toastText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});
