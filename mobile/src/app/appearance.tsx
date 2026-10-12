import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GlassView } from 'expo-glass-effect';
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
} from 'lucide-react-native';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import { getContrastTextColor } from '@/utils/routineHelpers';
import GlobalHeader from '@/components/GlobalHeader';
import ThemeBackground from '@/components/ThemeBackground';
import LevelBadge from '@/components/LevelBadge';

// --- Constantes de Apariencia (idénticas a la web) ---
const ACCENT_OPTIONS: { id: string; label: string; hex: string; reqLevel?: number }[] = [
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
  { id: 'mint', label: 'Menta Suave', hex: '#a8e6cf', reqLevel: 5 },
  { id: 'peach', label: 'Melocotón', hex: '#ffd3b6', reqLevel: 5 },
  { id: 'rose-water', label: 'Agua de Rosas', hex: '#ffaaa5', reqLevel: 5 },
  { id: 'lavender', label: 'Lavanda', hex: '#c5a3ff', reqLevel: 5 },
  { id: 'baby-blue', label: 'Azul Bebé', hex: '#a2cffe', reqLevel: 5 },
  { id: 'sunset-pink', label: 'Rosa Atardecer', hex: '#ff9a9e', reqLevel: 10 },
  { id: 'pistachio', label: 'Pistacho', hex: '#c5e1a5', reqLevel: 10 },
  { id: 'mango', label: 'Mango Pastel', hex: '#ffbe76', reqLevel: 10 },
  { id: 'lemonade', label: 'Limonada', hex: '#fdfd96', reqLevel: 10 },
  { id: 'cherry-blossom', label: 'Cerezo', hex: '#fccbcf', reqLevel: 10 },
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
    tint: '#f59e0b',
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
 * Superficie Liquid Glass sin overflow:'hidden' (evita los bordes partidos):
 * el GlassView y la capa de tinte reciben el mismo radio que el contenedor.
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
  const themeTest = useAppStore(state => (state as any).themeTest) as { name: string; timeLeft: number } | null;
  const startThemeTest = useAppStore(state => (state as any).startThemeTest);
  const userProfile = useAppStore(state => state.userProfile) as any;
  const gamification = useAppStore(state => (state as any).gamification);

  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isTestingTheme = !!themeTest;
  const activeTheme = theme; // ya refleja el tema en prueba si lo hay
  const isSpecialActive = SPECIAL_THEME_IDS.includes(activeTheme);

  const isAdmin = userProfile?.role === 'admin';
  const referralCount = userProfile?.referralCount || 0;
  const userLevel = gamification?.level || userProfile?.level || 1;

  const accentText = getContrastColor(colors.tint, theme);
  const subtleBg = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  // --- Toast ligero (equivalente a addToast de la web) ---
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

  // --- Switch animado ---
  const switchAnim = useRef(new Animated.Value(hapticsEnabled ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(switchAnim, {
      toValue: hapticsEnabled ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();
  }, [hapticsEnabled]);

  const tap = () => {
    if (hapticsEnabled) Haptics.selectionAsync();
  };

  const handleThemeClick = (mode: string) => {
    tap();
    setTheme(mode);
  };

  const handleAccent = (hex: string) => {
    tap();
    setAccent(hex);
  };

  const handleToggleHaptics = () => {
    const newValue = !hapticsEnabled;
    setHapticsEnabled?.(newValue);
    if (newValue) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showToast(newValue ? 'Vibración activada' : 'Vibración desactivada');
  };

  const handleTest = (themeId: string) => {
    tap();
    startThemeTest?.(themeId, 10);
  };

  // --- Subcomponentes de presentación ---
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

  const renderSwatch = (opt: (typeof ACCENT_OPTIONS)[number], columns: number) => {
    const isLocked = !!opt.reqLevel && userLevel < opt.reqLevel && !isAdmin;
    const isActive = accent.toLowerCase() === opt.hex.toLowerCase() && !isSpecialActive && !isLocked;

    return (
      <View key={opt.id} style={{ width: `${100 / columns}%`, padding: 5 }}>
        <Pressable
          onPress={() => {
            if (isLocked) {
              showToast(`Requiere nivel ${opt.reqLevel} para aplicarlo`, true);
            } else {
              handleAccent(opt.hex);
            }
          }}
          accessibilityLabel={opt.label + (isLocked ? ` (Nivel ${opt.reqLevel})` : '')}
          style={({ pressed }) => [
            styles.swatchRing,
            {
              borderColor: isActive ? opt.hex : 'transparent',
              opacity: isLocked ? 0.4 : 1,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            },
          ]}
        >
          <View style={[styles.swatchDot, { backgroundColor: opt.hex }]}>
            {isActive && <Check size={18} strokeWidth={3} color={getContrastTextColor(opt.hex)} />}
            {isLocked && <Lock size={16} strokeWidth={2.5} color="rgba(0, 0, 0, 0.5)" />}
          </View>
        </Pressable>
      </View>
    );
  };

  const renderLevelHeader = (level: number) => (
    <View style={styles.levelHeader}>
      <View style={styles.levelBadgeBox}>
        <View style={{ transform: [{ scale: 0.5 }] }}>
          <LevelBadge level={level} size="sm" bgTheme={isDark ? '#111111' : '#ffffff'} />
        </View>
      </View>
      <Text style={[styles.levelTitle, { color: colors.text }]}>Nivel {level}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ThemeBackground />

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
        {/* ================= APARIENCIA DE LA APP ================= */}
        <GlassSurface radius={32} isDark={isDark} borderColor={glassBorder} style={styles.card}>
          <SectionTitle icon={Palette} title="Apariencia de la App" />

          {/* Temas Base */}
          <View style={{ marginBottom: 32 }}>
            <SubHeading>Tema Principal</SubHeading>
            <View style={styles.themeGrid}>
              {BASE_THEMES.map(mode => {
                const isActive = themePreference === mode.id && !isTestingTheme;
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

          {/* Acentos */}
          <View
            style={{ marginBottom: 32, opacity: isSpecialActive ? 0.5 : 1 }}
            pointerEvents={isSpecialActive ? 'none' : 'auto'}
          >
            <SubHeading>Acento de Color</SubHeading>
            <View style={[styles.swatchGrid, { marginBottom: 16 }]}>
              {ACCENT_OPTIONS.filter(o => !o.reqLevel).map(opt => renderSwatch(opt, 6))}
            </View>

            <SubHeading style={{ marginTop: 16, marginBottom: 8 }}>Acento de color por niveles</SubHeading>

            {renderLevelHeader(5)}
            <View style={[styles.swatchGrid, { marginBottom: 16 }]}>
              {ACCENT_OPTIONS.filter(o => o.reqLevel === 5).map(opt => renderSwatch(opt, 5))}
            </View>

            {renderLevelHeader(10)}
            <View style={styles.swatchGrid}>
              {ACCENT_OPTIONS.filter(o => o.reqLevel === 10).map(opt => renderSwatch(opt, 5))}
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

        {/* ================= MIS TEMAS ================= */}
        <GlassSurface radius={32} isDark={isDark} borderColor={glassBorder} style={styles.card}>
          <SectionTitle icon={MeteorIcon} title="Mis Temas" />
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
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
                  index > 0 && { marginTop: 16 },
                  isGroupActive
                    ? {
                        backgroundColor: st.tint + '1A',
                        borderColor: st.tint + '4D',
                        transform: [{ scale: 1.02 }],
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

                  <View style={{ gap: 8 }}>
                    {st.variants.map(v => {
                      if (isUnlocked) {
                        const isBtnActive = themePreference === v.id && !isTestingTheme;
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
                              tintOpacity={isBtnActive ? 0.9 : 0.1}
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
                            style={[isSingle ? styles.pillLarge : styles.pillSmall, isSingle && { minWidth: 110 }]}
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
              </View>
            );
          })}
        </GlassSurface>
      </Animated.ScrollView>

      {/* Toast */}
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
    padding: 24,
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  sectionIconBox: {
    padding: 10,
    borderRadius: 16,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    marginLeft: 4,
  },

  // Tema principal
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeTileWrap: {
    flexBasis: '46%',
    flexGrow: 1,
  },
  themeTile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  themeTileLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Acentos
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  swatchRing: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: 999,
    borderWidth: 2,
    padding: 3,
  },
  swatchDot: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 10,
    marginLeft: 4,
  },
  levelBadgeBox: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },

  // Switch
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    minWidth: 0,
  },
  switchIconBox: {
    padding: 10,
    borderRadius: 14,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  switchSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    marginLeft: 12,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },

  // Mis temas
  themeRow: {
    padding: 16,
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
    padding: 10,
    borderRadius: 14,
  },
  themeRowTitle: {
    fontSize: 14,
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
  },
  themeInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 16,
    marginLeft: 4,
  },
  themeInfoText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
  },
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
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSmallText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Toast
  toastWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 200,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
