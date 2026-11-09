import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from 'expo-glass-effect';
import {
  Info,
  ChevronRight,
  Play,
  Smartphone,
  Download,
  Bug,
  Mail,
  Binary,
  CheckCircle2,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getThemeBaseBackground } from '@/constants/theme';
import GlobalHeader from '@/components/GlobalHeader';
import ThemeBackground from '@/components/ThemeBackground';
import { BugReportModal } from '@/components/modals/BugReportModal';

const APP_VERSION = '7.8.0';
const SUPPORT_EMAIL = 'soporte@profitnessglass.es';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.profitnessglass.app&hl=es_419';
const DEFAULT_APK_URL = 'https://github.com/Deathvks/Pro-Ftiness-Glass/releases/download/v5.1.0/app-release.apk';
const STORAGE_KEY = 'bug_report_draft';

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

interface SupportItemProps {
  icon: any;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightAction?: React.ReactNode;
  isDark: boolean;
  colors: any;
  iconColor?: string;
}

function SupportItem({
  icon: Icon,
  title,
  subtitle,
  onPress,
  rightAction,
  isDark,
  colors,
  iconColor,
}: SupportItemProps) {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.itemRow,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        },
      ]}
    >
      <View
        style={[
          styles.itemIconBox,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          },
        ]}
      >
        <Icon size={20} color={iconColor || colors.tint} strokeWidth={2.2} />
      </View>

      <View style={styles.itemTextCol}>
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {rightAction ? (
        <View style={styles.itemRightWrap}>{rightAction}</View>
      ) : onPress ? (
        <ChevronRight size={18} color={colors.textSecondary} style={{ opacity: 0.6 }} />
      ) : null}
    </Component>
  );
}

export default function SupportScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const isMobile = windowWidth < 600;

  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)';

  const [apkDownloadUrl, setApkDownloadUrl] = useState<string | null>(null);
  const [showBugModal, setShowBugModal] = useState<boolean>(false);

  // Auto-abrir modal si existía un borrador previo guardado (igual que en frontend)
  useEffect(() => {
    const checkDraft = async () => {
      try {
        const draftStr = await AsyncStorage.getItem(STORAGE_KEY);
        if (draftStr) {
          const draft = JSON.parse(draftStr);
          if (draft.category || draft.subject?.trim() || draft.description?.trim()) {
            setShowBugModal(true);
          }
        }
      } catch (e) {
        console.warn('Error reading bug report draft:', e);
      }
    };
    checkDraft();
  }, []);

  const handleOpenUrl = async (url: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.warn('Error opening URL:', err);
    }
  };

  const handleMailSupport = () => {
    handleOpenUrl(`mailto:${SUPPORT_EMAIL}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background === 'transparent' ? getThemeBaseBackground(theme) : colors.background }}>
      <ThemeBackground />

      {/* Header fijo superior */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }} pointerEvents="box-none">
        <GlobalHeader title="Soporte" scrollY={scrollY} showBackButton />
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
        {/* ================= 1. AYUDA Y COMUNIDAD ================= */}
        <GlassSurface
          radius={28}
          isDark={isDark}
          borderColor={glassBorder}
          style={[styles.card, { padding: isMobile ? 16 : 22 }]}
        >
          {/* Section Header */}
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.tint + '1A' }]}>
              <Info size={22} color={colors.tint} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Ayuda y Comunidad</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Encuentra descargas, reporta problemas y contacta con soporte.
              </Text>
            </View>
          </View>

          {/* Items de Soporte */}
          <View style={styles.itemsList}>
            {/* Google Play */}
            <SupportItem
              icon={Play}
              title="Google Play"
              subtitle="Consigue la App oficial"
              onPress={() => handleOpenUrl(GOOGLE_PLAY_URL)}
              isDark={isDark}
              colors={colors}
              iconColor="#38bdf8"
            />

            {/* Descargar APK Android */}
            <SupportItem
              icon={Smartphone}
              title="Descargar App Android"
              subtitle="Instalar APK nativo"
              onPress={() => handleOpenUrl(apkDownloadUrl || DEFAULT_APK_URL)}
              isDark={isDark}
              colors={colors}
              rightAction={<Download size={18} color={colors.tint} />}
            />

            {/* Reportar un problema */}
            <SupportItem
              icon={Bug}
              title="Reportar un problema"
              subtitle="¿Algo no funciona bien?"
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                setShowBugModal(true);
              }}
              isDark={isDark}
              colors={colors}
              iconColor="#ef4444"
            />

            {/* Contactar Soporte */}
            <SupportItem
              icon={Mail}
              title="Contactar Soporte"
              subtitle={SUPPORT_EMAIL}
              onPress={handleMailSupport}
              isDark={isDark}
              colors={colors}
              iconColor="#10b981"
            />
          </View>
        </GlassSurface>

        {/* ================= 2. APP INFO ================= */}
        <GlassSurface
          radius={28}
          isDark={isDark}
          borderColor={glassBorder}
          style={[styles.card, { padding: isMobile ? 16 : 22, marginTop: 16 }]}
        >
          {/* Section Header */}
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.tint + '1A' }]}>
              <Binary size={22} color={colors.tint} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>App Info</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Detalles técnicos y estado de la versión instalada.
              </Text>
            </View>
          </View>

          {/* App Info Tile */}
          <View
            style={[
              styles.infoCardRow,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <View
              style={[
                styles.itemIconBox,
                {
                  backgroundColor: colors.tint + '18',
                },
              ]}
            >
              <Binary size={20} color={colors.tint} strokeWidth={2.2} />
            </View>

            <View style={styles.itemTextCol}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>Versión de App</Text>
              <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                v{APP_VERSION} · Native {Platform.OS.toUpperCase()}
              </Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: '#10b98120', borderColor: '#10b98140' }]}>
              <CheckCircle2 size={12} color="#10b981" />
              <Text style={styles.statusBadgeText}>Actualizada</Text>
            </View>
          </View>
        </GlassSurface>
      </Animated.ScrollView>

      {/* Modal de Reporte de Problemas */}
      <BugReportModal visible={showBugModal} onClose={() => setShowBugModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
  itemsList: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  itemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextCol: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  itemRightWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
});
