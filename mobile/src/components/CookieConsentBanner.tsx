import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck } from 'lucide-react-native';

import {
  ModalThemeBackground,
  getThemedModalBorderColor,
  getThemedModalSurfaceColor,
} from '@/components/ui/ModalThemeBackground';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

const CONSENT_KEY = 'cookie_consent';

export function CookieConsentBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const cookieConsent = useAppStore((s: any) => s.cookieConsent);
  const handleAcceptCookies = useAppStore((s: any) => s.handleAcceptCookies);
  const contrastText = getContrastTextColor(colors.tint);

  useEffect(() => {
    AsyncStorage.getItem(CONSENT_KEY)
      .then(val => {
        if (val) {
          useAppStore.setState({ cookieConsent: val } as any);
        }
      })
      .catch(() => {});
  }, []);

  if (Platform.OS !== 'web' || cookieConsent) {
    return null;
  }

  const accept = () => {
    AsyncStorage.setItem(CONSENT_KEY, 'accepted').catch(() => {});
    handleAcceptCookies?.();
    useAppStore.setState({ cookieConsent: 'accepted' } as any);
  };

  const decline = () => {
    AsyncStorage.setItem(CONSENT_KEY, 'declined').catch(() => {});
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(CONSENT_KEY, 'declined');
      } catch {}
    }
    useAppStore.setState({ cookieConsent: 'declined' } as any);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlayWrap, { paddingBottom: Math.max(insets.bottom + 12, 16) }]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: getThemedModalSurfaceColor(theme),
            borderColor: getThemedModalBorderColor(theme),
          },
        ]}
      >
        <ModalThemeBackground theme={theme} />
        <View style={styles.headerRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.tint + '1A' }]}>
            <ShieldCheck size={22} color={colors.tint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>Tu privacidad es nuestra prioridad</Text>
            <Text style={[styles.desc, { color: colors.textSecondary }]}>
              Utilizamos almacenamiento local para tus preferencias, seguridad e inicio de sesión.
            </Text>
          </View>
        </View>

        <View style={styles.linksRow}>
          <TouchableOpacity onPress={() => router.push('/privacy' as any)}>
            <Text style={[styles.policyLink, { color: colors.tint }]}>Política de Privacidad</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.textSecondary }}>·</Text>
          <TouchableOpacity onPress={() => router.push('/cookies' as any)}>
            <Text style={[styles.policyLink, { color: colors.tint }]}>Política de Cookies</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={decline}
            style={[styles.declineBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.declineText, { color: colors.textSecondary }]}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={accept}
            style={[styles.acceptBtn, { backgroundColor: colors.tint }]}
          >
            <Text style={[styles.acceptText, { color: contrastText }]}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    zIndex: 950,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  desc: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  policyLink: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  declineText: {
    fontSize: 13,
    fontWeight: '700',
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptText: {
    fontSize: 13,
    fontWeight: '800',
  },
});

export default CookieConsentBanner;
