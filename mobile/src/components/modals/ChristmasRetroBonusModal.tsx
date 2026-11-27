import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Gift, Snowflake, Sparkles, Zap } from 'lucide-react-native';

import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';
import useAppStore from '@/store/useAppStore';
import { useToastStore } from '@/store/toastStore';
import { claimChristmasXpBonus } from '@/services/userService';

interface ChristmasRetroBonusModalProps {
  visible?: boolean;
}

/** Bottom-sheet modal otorgando retroactivamente +250 XP a quienes ya reclamaron Navidad 2026. */
export function ChristmasRetroBonusModal({ visible: externalVisible }: ChristmasRetroBonusModalProps) {
  const userProfile = useAppStore((s: any) => s.userProfile);
  const showChristmasUnlockModal = useAppStore((s: any) => Boolean(s.showChristmasUnlockModal));
  const applyChristmasRewardResult = useAppStore((s: any) => s.applyChristmasRewardResult);
  const theme = useAppStore((s: any) => s.theme) || 'oled';
  const themePreference = useAppStore((s: any) => s.themePreference);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [claiming, setClaiming] = useState(false);
  const claimedInFlightRef = useRef(false);

  const isVisible = useMemo(() => {
    if (externalVisible === false) return false;
    if (showChristmasUnlockModal || !userProfile?.id) return false;
    const hasLocalChristmasActive = theme === 'christmas' || themePreference === 'christmas';
    return Boolean(
      userProfile.christmasXpBonusPending ||
        (hasLocalChristmasActive && userProfile.christmasXpBonusClaimed === false)
    );
  }, [
    externalVisible,
    showChristmasUnlockModal,
    theme,
    themePreference,
    userProfile?.id,
    userProfile?.christmasXpBonusPending,
    userProfile?.christmasXpBonusClaimed,
  ]);

  const bonusAmount = Number(userProfile?.christmasXpBonusAmount || 250);

  const handleClaim = async () => {
    if (claiming || claimedInFlightRef.current) return;
    claimedInFlightRef.current = true;
    setClaiming(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const res = await claimChristmasXpBonus();
      applyChristmasRewardResult?.(res);
      const showToast = useToastStore.getState().showToast;
      if (res?.xpAdded > 0) {
        showToast(`🎄 +${res.xpAdded} XP sumados por Edición Navidad 2026`, 'success');
        if (res.leveledUp && res.level) {
          setTimeout(() => {
            useToastStore.getState().showToast(`⚡ ¡Has subido al Nivel ${res.level}!`, 'success');
          }, 500);
        }
      } else {
        showToast(res?.message || 'Regalo de XP ya acreditado en tu cuenta', 'info');
      }
    } catch (err: any) {
      useToastStore.getState().showToast(err?.message || 'No se pudo reclamar el regalo de XP', 'error');
    } finally {
      setClaiming(false);
      claimedInFlightRef.current = false;
    }
  };

  return (
    <SwipeableBottomSheet
      visible={isVisible}
      onClose={handleClaim}
      dismissible={!claiming}
      isDark={isDark}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(225, 29, 72, 0.14)', 'rgba(14, 165, 233, 0.08)', 'transparent']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.topGlow}
        />

        <View style={styles.emblemWrap}>
          <LinearGradient
            colors={['rgba(225,29,72,0.34)', 'rgba(56,189,248,0.22)', 'rgba(245,158,11,0.24)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emblemBox}
          >
            <Gift size={36} color="#ffffff" strokeWidth={1.8} />
          </LinearGradient>
          <View style={styles.xpPillCorner}>
            <Text style={styles.xpPillCornerText}>+{bonusAmount} XP</Text>
          </View>
        </View>

        <View style={styles.seasonPill}>
          <Sparkles size={11} color="#fbbf24" />
          <Text style={styles.seasonPillText}>REGALO RETROACTIVO</Text>
        </View>

        <Text style={styles.title}>¡+{bonusAmount} XP de Navidad para ti!</Text>

        <Text style={styles.subtitle}>
          Como ya habías desbloqueado el tema{' '}
          <Text style={{ fontWeight: '800', color: '#ffffff' }}>Edición Navidad 2026</Text> antes de esta
          actualización, te regalamos{' '}
          <Text style={{ fontWeight: '800', color: '#fcd34d' }}>+{bonusAmount} XP</Text> por haberlo conseguido.
        </Text>

        <View style={styles.infoBox}>
          <Zap size={16} color="#fcd34d" />
          <Text style={styles.infoText}>Se sumarán al instante a tu cuenta y nivel actual</Text>
          <Snowflake size={14} color="#bae6fd" />
        </View>

        <TouchableOpacity
          onPress={() => void handleClaim()}
          disabled={claiming}
          activeOpacity={0.85}
          style={[styles.ctaWrap, claiming && { opacity: 0.7 }]}
        >
          <LinearGradient
            colors={['#e11d48', '#f43f5e', '#f59e0b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            {claiming ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.ctaText}>Recibir +{bonusAmount} XP</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 14,
    alignItems: 'center',
    position: 'relative',
  },
  topGlow: {
    position: 'absolute',
    top: -12,
    left: 0,
    right: 0,
    height: 180,
    borderRadius: 24,
  },
  emblemWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  emblemBox: {
    width: 78,
    height: 78,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpPillCorner: {
    position: 'absolute',
    top: -6,
    right: -14,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#fbbf24',
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
  xpPillCornerText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#0f172a',
  },
  seasonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(225, 29, 72, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(253, 164, 175, 0.35)',
    marginBottom: 10,
  },
  seasonPillText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#ffe4e6',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: 'rgba(226, 232, 240, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    marginBottom: 18,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fde68a',
    flexShrink: 1,
    textAlign: 'center',
  },
  ctaWrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
});

export default ChristmasRetroBonusModal;
