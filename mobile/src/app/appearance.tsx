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
import GlobalHeader from '@/components/GlobalHeader';
import LevelBadge from '@/components/LevelBadge';

// --- Constantes de Apariencia (Completamente idénticas a la web) ---
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

  // Nivel 10 (5 tonos pastel vibrantes)
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

/**
 * Superficie Liquid Glass sin overflow:'hidden' para evitar bordes partidos.
 */
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
  const insets = useSafeAreaInsets();
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

  // Desplegable de "Mis Temas"
  const [isMyThemesOpen, setIsMyThemesOpen] = useState(true);

  // Modal de advertencia para efectos de Galaxia
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

  // Toast ligero
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

  // Switch Hápticos
  const switchAnim = useRef(new Animated.Value(hapticsEnabled ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(switchAnim, {
      toValue: hapticsEnabled ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();
  }, [hapticsEnabled]);

  // Switch Galaxia Efectos
  const galaxySwitchAnim = useRef(new Animated.Value(galaxyEffectsEnabled ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(galaxySwitchAnim, {
      toValue: galaxyEffectsEnabled ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();
  }, [galaxyEffectsEnabled]);

  const tap = () => {
    if (hapticsEnabled) Haptics.selectionAsync();
  };

  const handleThemeClick = (mode: string) => {
    tap();
    setTheme(mode);
  };

  const handleAccent = (opt: AccentOption) => {
    tap();
    setAccent(opt.hex);
  };

  const handleToggleHaptics = () => {
    const newValue = !hapticsEnabled;
    setHapticsEnabled?.(newValue);
    if (newValue) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  // --- Subcomponentes de interfaz ---
  const SectionTitle = ({ icon: Icon, title }: { icon: React.ComponentType<any>; title: string }) => (
    <View style={styles.sectionTitleRow}>
      <View style={[styles.sectionIconBox, { backgroundColor: subtleBg }]}>
        <Icon size={24} color={accentText} strokeWidth={2.5} />
      </View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );

  const SubHeading = ({ children, style }: { children: React.ReactNode; style?: any }) => (
    <Text style={[styles.subHeading, { color: colors.textSecondary }, style]}>{children}</Text>
  );

  const renderSwatch = (opt: AccentOption, columns: number) => {
    const isLocked = !!opt.reqLevel && userLevel < opt.reqLevel && !isAdmin;
    const isSelected = accent.toLowerCase() === opt.hex.toLowerCase() && !isSpecialActive && !isLocked;

    return (
      <View key={opt.id} style={{ width: `${100 / columns}%`, padding: 4, alignItems: 'center' }}>
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
            {isSelected && <Check size={18} strokeWidth={3} color={getContrastTextColor(opt.hex)} />}
            {isLocked && <Lock size={15} strokeWidth={2.5} color="rgba(0, 0, 0, 0.55)" />}
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }} pointerEvents="box-none">
        <GlobalHeader title="Apariencia" scrollY={scrollY} showBackButton />
      </View>

      <Animated.ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 76,
          paddingBottom: insets.bottom + 48,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        {/* ================= 1. MIS TEMAS (ARRIBA Y DESPLEGABLE) ================= */}
        <GlassSurface radius={32} isDark={isDark} borderColor={glassBorder} style={styles.card}>
          <Pressable
            onPress={() => setIsMyThemesOpen(!isMyThemesOpen)}
            style={styles.myThemesHeaderRow}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={[styles.sectionIconBox, { backgroundColor: subtleBg }]}>
                <MeteorIcon size={24} color={accentText} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
            <View style={{ marginTop: 20 }}>
              <Text style={[styles.cardDescription, { color: colors.textSecondary, marginBottom: 16 }]}>
                Temas exclusivos desbloqueados mediante retos y progreso en la aplicación.
              </Text>

              {SPECIAL_THEMES.map((st, index) => {
                const isUnlocked = referralCount >= st.requiredReferrals || isAdmin;
                const isGroupActive = st.variants.some(v => v.id === activeTheme);
                const STIcon = st.icon;
                const pillText = isDark ? st.textDark : st.textLight;
                const isSingle = st.variants.length === 1;

                return (
                  <View
                    key={st.key}
                    style={[
                      styles.themeRow,
                      index > 0 && { marginTop: 14 },
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
                          <STIcon size={22} color={isUnlocked ? st.tint : colors.textSecondary} />
                        </View>
                        <View style={{ flexShrink: 1 }}>
                          <Text
                            style={[styles.themeRowTitle, { color: isUnlocked ? st.tint : colors.text }]}
                            numberOfLines={1}
                          >
                            {st.label}
                          </Text>
                          <View style={styles.themeRowStatus}>
                            {isUnlocked ? (
                              <>
                                <LockOpen size={12} color="#22c55e" />
                                <Text style={[styles.themeRowStatusText, { color: colors.textSecondary }]}>
                                  Desbloqueado
                                </Text>
                              </>
                            ) : (
                              <>
                                <Lock size={12} color={colors.textSecondary} />
                                <Text style={[styles.themeRowStatusText, { color: colors.textSecondary }]}>
                                  Invita a {st.requiredReferrals} amigos
                                </Text>
                              </>
                            )}
                          </View>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        {st.variants.map(v => {
                          if (isUnlocked) {
                            const isBtnActive = (themePreference === v.id || activeTheme === v.id) && !isTestingTheme;
                            const label = isSingle ? (isBtnActive ? 'Activo' : 'Aplicar') : v.label;
                            return (
                              <Pressable
                                key={v.id}
                                onPress={() => handleThemeClick(v.id)}
                                style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }] })}
                              >
                                <GlassSurface
                                  radius={16}
                                  isDark={isDark}
                                  borderColor={isBtnActive ? st.tint : glassBorder}
                                  tintColor={isBtnActive ? st.tint : isDark ? '#ffffff' : '#000000'}
                                  tintOpacity={isBtnActive ? 0.9 : 0.08}
                                  style={isSingle ? styles.pillLarge : styles.pillSmall}
                                >
                                  <Text
                                    style={[
                                      isSingle ? styles.pillLargeText : styles.pillSmallText,
                                      { color: isBtnActive ? '#ffffff' : pillText },
                                    ]}
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
                              style={({ pressed }) => ({
                                opacity: isTestingTheme && !isThisTesting ? 0.8 : 1,
                                transform: [{ scale: pressed ? 0.94 : 1 }],
                              })}
                            >
                              <GlassSurface
                                radius={16}
                                isDark={isDark}
                                borderColor={st.tint + '4D'}
                                tintColor={st.tint}
                                tintOpacity={0.2}
                                style={[isSingle ? styles.pillLarge : styles.pillSmall, isSingle && { minWidth: 105 }]}
                              >
                                <Text
                                  style={[isSingle ? styles.pillLargeText : styles.pillSmallText, { color: st.tint }]}
                                >
                                  {isThisTesting ? `Probando ${themeTest?.timeLeft}s` : v.testLabel}
                                </Text>
                              </GlassSurface>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    {isGroupActive && (
                      <View style={styles.themeInfoRow}>
                        <Info size={14} color={st.tint} />
                        <Text style={[styles.themeInfoText, { color: st.tint }]}>{st.info}</Text>
                      </View>
                    )}

                    {/* Switch para Estrellas y Meteoros animados (solo si Galaxia está activo) */}
                    {st.key === 'galaxy' && isGalaxyActive && (
                      <View style={[styles.galaxySwitchContainer, { borderTopColor: st.tint + '26' }]}>
                        <Pressable
                          onPress={handleToggleGalaxyEffects}
                          style={({ pressed }) => [
                            styles.switchRow,
                            { transform: [{ scale: pressed ? 0.98 : 1 }] },
                          ]}
                        >
                          <View style={styles.switchInfo}>
                            <View style={[styles.switchIconBox, { backgroundColor: st.tint + '20' }]}>
                              <MeteorIcon size={18} color={st.tint} />
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

                          <View
                            style={[
                              styles.switchTrack,
                              galaxyEffectsEnabled
                                ? { backgroundColor: st.tint, borderColor: 'rgba(255, 255, 255, 0.3)' }
                                : { backgroundColor: isDark ? '#4b5563' : '#9ca3af', borderColor: 'transparent' },
                            ]}
                          >
                            <Animated.View
                              style={[
                                styles.switchThumb,
                                {
                                  transform: [
                                    {
                                      translateX: galaxySwitchAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 20],
                                      }),
                                    },
                                  ],
                                },
                              ]}
                            />
                          </View>
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
        <GlassSurface radius={32} isDark={isDark} borderColor={glassBorder} style={styles.card}>
          <SectionTitle icon={Palette} title="Apariencia de la App" />

          {/* Temas Base */}
          <View style={{ marginBottom: 32 }}>
            <SubHeading>Tema Principal</SubHeading>
            <View style={styles.themeGrid}>
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
                      { transform: [{ scale: pressed ? 0.96 : isActive ? 1.04 : 1 }] },
                    ]}
                  >
                    <GlassSurface
                      radius={20}
                      isDark={isDark}
                      borderColor={isActive ? colors.tint : glassBorder}
                      tintColor={isActive ? colors.tint : isDark ? '#ffffff' : '#000000'}
                      tintOpacity={isActive ? 0.9 : 0.05}
                      style={styles.themeTile}
                    >
                      <ModeIcon size={22} color={fg} />
                      <Text style={[styles.themeTileLabel, { color: fg }]}>{mode.label}</Text>
                    </GlassSurface>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Acentos de Color */}
          <View
            style={{ marginBottom: 32, opacity: isSpecialActive ? 0.5 : 1 }}
            pointerEvents={isSpecialActive ? 'none' : 'auto'}
          >
            <SubHeading>Acento de Color</SubHeading>
            <View style={[styles.swatchGrid, { marginBottom: 16 }]}>
              {ACCENT_OPTIONS.filter(o => !o.reqLevel).map(opt => renderSwatch(opt, 5))}
            </View>

            <SubHeading style={{ marginTop: 20, marginBottom: 8 }}>Acento de color por niveles</SubHeading>

            {/* Nivel 5 */}
            {renderLevelHeader(5)}
            <View style={[styles.swatchGrid, { marginBottom: 16 }]}>
              {ACCENT_OPTIONS.filter(o => o.reqLevel === 5).map(opt => renderSwatch(opt, 5))}
            </View>

            {/* Nivel 10 */}
            {renderLevelHeader(10)}
            <View style={[styles.swatchGrid, { marginBottom: 16 }]}>
              {ACCENT_OPTIONS.filter(o => o.reqLevel === 10).map(opt => renderSwatch(opt, 5))}
            </View>

            {/* Nivel 15 · Degradados */}
            {renderLevelHeader(15, 'Degradados')}
            <View style={[styles.swatchGrid, { marginBottom: 16 }]}>
              {ACCENT_OPTIONS.filter(o => o.reqLevel === 15).map(opt => renderSwatch(opt, 5))}
            </View>

            {/* Nivel 20 · Dinámicos Animados */}
            {renderLevelHeader(20, 'Animados')}
            <View style={styles.swatchGrid}>
              {ACCENT_OPTIONS.filter(o => o.reqLevel === 20).map(opt => renderSwatch(opt, 5))}
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
                  <Vibrate size={20} color={hapticsEnabled ? accentText : colors.textSecondary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.switchTitle, { color: colors.text }]}>Vibración Háptica</Text>
                  <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>
                    Feedback táctil al pulsar botones y completar series
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.switchTrack,
                  hapticsEnabled
                    ? { backgroundColor: colors.tint, borderColor: 'rgba(255, 255, 255, 0.3)' }
                    : { backgroundColor: isDark ? '#4b5563' : '#9ca3af', borderColor: 'transparent' },
                ]}
              >
                <Animated.View
                  style={[
                    styles.switchThumb,
                    {
                      transform: [
                        {
                          translateX: switchAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 20],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
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
              radius={28}
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
                <Sparkles size={32} color="#a855f7" />
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
    padding: 22,
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sectionIconBox: {
    padding: 10,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginLeft: 4,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Encabezado de "Mis Temas"
  myThemesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myThemesSubtitle: {
    fontSize: 12,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Temas Base
  themeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  themeTileWrap: {
    flex: 1,
  },
  themeTile: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  themeTileLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Acentos
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  swatchRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2.5,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchDot: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
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
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    height: 24,
    lineHeight: 12,
    paddingHorizontal: 2,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 2,
  },
  levelBadgeBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTitle: {
    fontSize: 14,
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

  // Fila de Temas Especiales
  themeRow: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  themeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  themeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeRowTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  themeRowStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  themeRowStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  themeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  themeInfoText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  galaxySwitchContainer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  // Píldoras de aplicar / probar
  pillLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLargeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pillSmall: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSmallText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Switches
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 18,
    gap: 12,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  switchSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
  },
  modalCard: {
    padding: 24,
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    zIndex: 10,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
  },
  modalBadgesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  modalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  modalBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Toast
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
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
