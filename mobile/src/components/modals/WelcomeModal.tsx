import React, { useEffect } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ChevronRight, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react-native';

import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';
import { APP_VERSION, RELEASE_WELCOME } from '@/config/version';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

const FEATURE_STYLES = [
  {
    icon: Sparkles,
    color: '#10b981',
    iconBg: 'rgba(16, 185, 129, 0.16)',
  },
  {
    icon: SlidersHorizontal,
    color: '#3b82f6',
    iconBg: 'rgba(59, 130, 246, 0.16)',
  },
  {
    icon: ShieldCheck,
    color: '#a855f7',
    iconBg: 'rgba(168, 85, 247, 0.16)',
  },
  {
    icon: Bell,
    color: '#f97316',
    iconBg: 'rgba(249, 115, 22, 0.16)',
  },
];

interface WelcomeModalProps {
  visible?: boolean;
  onClose?: () => void;
}

export function WelcomeModal({ visible: propVisible, onClose }: WelcomeModalProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const contrastText = getContrastTextColor(colors.tint);

  const storeVisible = useAppStore((s: any) => s.showWelcomeModal);
  const closeWelcomeModal = useAppStore((s: any) => s.closeWelcomeModal);
  const welcomeRemoteData = useAppStore((s: any) => s.welcomeRemoteData);

  const visible = propVisible !== undefined ? propVisible : Boolean(storeVisible);

  const welcomeData = welcomeRemoteData?.welcome || RELEASE_WELCOME;
  const displayVersion = welcomeRemoteData?.version || APP_VERSION;
  const title = welcomeData?.title || RELEASE_WELCOME.title;
  const subtitle = welcomeData?.subtitle || RELEASE_WELCOME.subtitle;
  const features: Array<{ title: string; description?: string; subtitle?: string }> =
    Array.isArray(welcomeData?.features) && welcomeData.features.length > 0
      ? welcomeData.features
      : RELEASE_WELCOME.features;

  useEffect(() => {
    if (!visible) return;
    AsyncStorage.multiSet([
      ['lastSeenVersion', String(APP_VERSION)],
      ['lastSeenWelcomeTitle', String(title)],
    ]).catch(() => {});
  }, [visible, title]);

  const handleClose = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    AsyncStorage.multiSet([
      ['lastSeenVersion', String(APP_VERSION)],
      ['lastSeenWelcomeTitle', String(title)],
    ]).catch(() => {});
    if (onClose) onClose();
    else closeWelcomeModal?.();
  };

  if (!visible) return null;

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={handleClose}
      isDark={isDark}
      scrollable
      maxHeight="88%"
    >
      <ScrollView
        style={{ flexShrink: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Badge */}
        <View style={styles.hero}>
          <View style={[styles.versionPill, { backgroundColor: colors.tint + '1A', borderColor: colors.tint + '40' }]}>
            <Sparkles size={13} color={colors.tint} />
            <Text style={[styles.versionPillText, { color: colors.tint }]}>
              NOVEDADES · v{displayVersion}
            </Text>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Features List */}
        <View style={styles.featureList}>
          {features.filter(Boolean).map((feat, idx) => {
            const cfg = FEATURE_STYLES[idx % FEATURE_STYLES.length];
            const IconComp = cfg.icon;
            const numStr = String(idx + 1).padStart(2, '0');
            return (
              <View
                key={`${feat.title}-${idx}`}
                style={[
                  styles.featureCard,
                  getAppleSheetCardStyle(isDark, 20, theme),
                ]}
              >
                <View style={[styles.accentBar, { backgroundColor: cfg.color }]} />
                <View style={[styles.iconBox, { backgroundColor: cfg.iconBg }]}>
                  <IconComp size={18} color={cfg.color} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.featTitle, { color: cfg.color }]}>
                    {feat.title}
                  </Text>
                  <Text style={[styles.featDesc, { color: colors.textSecondary }]}>
                    {feat.description || feat.subtitle}
                  </Text>
                </View>
                <Text style={[styles.numLabel, { color: cfg.color + '88' }]}>{numStr}</Text>
              </View>
            );
          })}
        </View>

        {/* Confirm CTA */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleClose}
          style={[styles.ctaBtn, { overflow: 'hidden' }]}
        >
          <LinearGradient
            colors={[colors.tint, colors.tint]}
            style={styles.ctaGradient}
          >
            <Text style={[styles.ctaText, { color: contrastText }]}>ENTENDIDO</Text>
            <ChevronRight size={18} color={contrastText} strokeWidth={2.6} />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.buildFooter, { color: colors.textSecondary }]}>
          BUILD v{APP_VERSION} · {Platform.OS.toUpperCase()}
        </Text>
      </ScrollView>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 20,
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
  },
  versionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  versionPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 320,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  featureList: {
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    paddingLeft: 16,
    gap: 12,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  featDesc: {
    fontSize: 13,
    lineHeight: 18.5,
    fontWeight: '500',
  },
  numLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ctaBtn: {
    borderRadius: 16,
    marginTop: 4,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 15,
  },
  ctaText: {
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  buildFooter: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default WelcomeModal;
