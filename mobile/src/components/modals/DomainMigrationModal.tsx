import React, { useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowRight, ExternalLink, Globe, ShieldCheck } from 'lucide-react-native';

import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

export function DomainMigrationModal({ forceVisible = false }: { forceVisible?: boolean }) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [isZeabur, setIsZeabur] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [countdown, setCountdown] = useState(6);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hostname = window.location.hostname || '';
      if (hostname.includes('zeabur.app')) {
        setIsZeabur(true);
      }
    }
  }, []);

  const active = (isZeabur || forceVisible) && showModal;

  const getTargetUrl = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const { pathname, search, hash } = window.location;
      return `https://profitnessglass.es${pathname}${search}${hash}`;
    }
    return 'https://profitnessglass.es';
  };

  useEffect(() => {
    if (!active || isPaused) return;
    if (countdown <= 0) {
      const target = getTargetUrl();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = target;
      } else {
        Linking.openURL(target).catch(() => {});
      }
      return;
    }

    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [active, isPaused, countdown]);

  const handleRedirectNow = () => {
    const target = getTargetUrl();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = target;
    } else {
      Linking.openURL(target).catch(() => {});
    }
  };

  return (
    <SwipeableBottomSheet
      visible={active}
      onClose={() => setShowModal(false)}
      isDark={isDark}
      maxHeight="80%"
    >
      <View style={styles.content}>
        <View style={styles.globeBadge}>
          <Globe size={30} color="#ffffff" />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>¡Nos hemos mudado!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Para brindarte mayor velocidad, seguridad e independencia, Pro Fitness Glass estrena su dominio oficial definitivo:
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleRedirectNow}
          style={[
            styles.urlPill,
            getAppleSheetCardStyle(isDark, 16, theme),
            { borderColor: 'rgba(16, 185, 129, 0.4)', borderWidth: 1 },
          ]}
        >
          <ShieldCheck size={18} color="#10b981" />
          <Text style={styles.urlText}>https://profitnessglass.es</Text>
          <ExternalLink size={15} color="#10b981" />
        </TouchableOpacity>

        <View style={styles.countdownRow}>
          <Text style={[styles.countdownText, { color: colors.textSecondary }]}>
            Redirigiendo automáticamente en <Text style={{ color: '#10b981', fontWeight: '800' }}>{countdown}s</Text>...
          </Text>
          <TouchableOpacity onPress={() => setIsPaused(p => !p)}>
            <Text style={[styles.pauseText, { color: colors.tint }]}>
              {isPaused ? 'Reanudar' : 'Pausar'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleRedirectNow}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Ir al nuevo dominio ahora</Text>
          <ArrowRight size={16} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowModal(false)}
          style={[styles.secondaryBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>
            Continuar aquí
          </Text>
        </TouchableOpacity>
      </View>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 12,
  },
  globeBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  urlPill: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  urlText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10b981',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pauseText: {
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#10b981',
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default DomainMigrationModal;
