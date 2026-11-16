import React from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Calculator,
  Dumbbell,
  Flame,
  Heart,
  HelpCircle,
  Newspaper,
  Scale,
  ShieldCheck,
  Smartphone,
  Users,
} from 'lucide-react-native';

import { getAppleCardSurfaceStyle } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.profitnessglass.app&hl=es_419';

export function PublicPageFooter() {
  const router = useRouter();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const currentYear = new Date().getFullYear();

  const tools = [
    { label: 'Calculadora 1RM', path: '/calculadora-1rm', icon: Calculator, color: colors.tint },
    { label: 'Calculadora Macros', path: '/calculadora-calorias-macros', icon: Flame, color: '#10b981' },
    { label: 'Guía de Ejercicios', path: '/ejercicios', icon: Dumbbell, color: '#f59e0b' },
    { label: 'Preguntas Frecuentes', path: '/faq', icon: HelpCircle, color: '#a855f7' },
    { label: 'Sobre Nosotros', path: '/sobre-nosotros', icon: Users, color: '#38bdf8' },
    { label: 'Noticias y Artículos', path: '/noticias', icon: Newspaper, color: '#6366f1' },
  ];

  const legals = [
    { label: 'Privacidad', path: '/privacy', icon: ShieldCheck },
    { label: 'Términos', path: '/terms', icon: Scale },
    { label: 'Aviso Legal', path: '/legal-notice', icon: Scale },
    { label: 'Cookies', path: '/cookies', icon: ShieldCheck },
  ];

  return (
    <View
      style={[
        getAppleCardSurfaceStyle(theme, 24),
        styles.footerCard,
        Platform.OS !== 'ios' && { borderWidth: 1, borderColor: colors.border },
      ]}
    >
      <View style={styles.brandBlock}>
        <Text style={[styles.brandTitle, { color: colors.text }]}>Pro Fitness Glass</Text>
        <Text style={[styles.brandDesc, { color: colors.textSecondary }]}>
          Software deportivo libre y 100% gratuito. Sobrecarga progresiva, guía técnica, nutrición con IA y herramientas científicas sin suscripciones.
        </Text>
      </View>

      <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>HERRAMIENTAS Y COMUNIDAD</Text>
      <View style={styles.linksGrid}>
        {tools.map(item => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.path}
              onPress={() => router.push(item.path as any)}
              style={[styles.linkPill, { borderColor: colors.border }]}
            >
              <Icon size={13} color={item.color} />
              <Text style={[styles.linkText, { color: colors.text }]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.groupTitle, { color: colors.textSecondary, marginTop: 4 }]}>LEGAL Y DESCARGA</Text>
      <View style={styles.linksGrid}>
        {legals.map(item => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.path}
              onPress={() => router.push(item.path as any)}
              style={[styles.linkPill, { borderColor: colors.border }]}
            >
              <Icon size={12} color={colors.textSecondary} />
              <Text style={[styles.linkText, { color: colors.textSecondary }]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          onPress={() => Linking.openURL(GOOGLE_PLAY_URL).catch(() => {})}
          style={[styles.linkPill, { borderColor: '#10b98144', backgroundColor: '#10b98114' }]}
        >
          <Smartphone size={12} color="#10b981" />
          <Text style={[styles.linkText, { color: '#10b981', fontWeight: '800' }]}>Google Play</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
        <Text style={[styles.copyText, { color: colors.textSecondary }]}>
          © {currentYear} Pro Fitness Glass · Dylan Jesús Suárez Falcón
        </Text>
        <View style={styles.madeWith}>
          <Text style={[styles.copyText, { color: colors.textSecondary }]}>Atletas reales</Text>
          <Heart size={11} color="#f43f5e" fill="#f43f5e" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerCard: {
    marginTop: 12,
    padding: 18,
    gap: 12,
  },
  brandBlock: {
    gap: 4,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  brandDesc: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  groupTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  linkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    borderWidth: 1,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bottomBar: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  copyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  madeWith: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});

export default PublicPageFooter;
