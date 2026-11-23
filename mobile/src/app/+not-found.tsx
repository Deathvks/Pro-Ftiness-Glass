import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Home, Search } from 'lucide-react-native';

import { SEOHead } from '@/components/SEOHead';
import ThemeBackground from '@/components/ThemeBackground';
import { getAppleCardSurfaceStyle, getThemeBaseBackground } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

export default function NotFoundScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const contrastText = getContrastTextColor(colors.tint);

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background === 'transparent' ? getThemeBaseBackground(theme) : colors.background },
      ]}
    >
      <SEOHead title="Página no encontrada - Pro Fitness Glass" noIndex />
      <ThemeBackground />

      <View style={styles.content}>
        <View style={styles.hero404Wrap}>
          <Text style={[styles.big404, { color: colors.tint + '33' }]}>404</Text>
          <View
            style={[
              getAppleCardSurfaceStyle(theme, 44),
              styles.searchBadge,
              Platform.OS !== 'ios' && { borderWidth: 1, borderColor: colors.border },
            ]}
          >
            <Search size={40} color={colors.text} strokeWidth={2.5} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>¡Ups! Te has perdido</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Parece que la página que estás buscando no existe, ha sido movida o la dirección no es correcta.
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace(isAuthenticated ? '/(tabs)' : '/login'))}
            style={[
              getAppleCardSurfaceStyle(theme, 24),
              styles.secondaryBtn,
              Platform.OS !== 'ios' && { borderWidth: 1, borderColor: colors.border },
            ]}
          >
            <ArrowLeft size={18} color={colors.text} />
            <Text style={[styles.secondaryText, { color: colors.text }]}>Volver Atrás</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace((isAuthenticated ? '/(tabs)' : '/login') as any)}
            style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
          >
            <Home size={18} color={contrastText} />
            <Text style={[styles.primaryText, { color: contrastText }]}>Ir al Inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  hero404Wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  big404: {
    fontSize: 120,
    fontWeight: '900',
    letterSpacing: -4,
  },
  searchBadge: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: 8,
  },
  actionsRow: {
    width: '100%',
    maxWidth: 340,
    gap: 10,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '700',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 999,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
