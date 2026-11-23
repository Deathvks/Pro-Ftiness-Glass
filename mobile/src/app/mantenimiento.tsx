import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { Bolt, CheckCircle2, Globe, HelpCircle, Lock, Server } from 'lucide-react-native';

import AnimatedScreen from '@/components/AnimatedScreen';
import GlobalHeader from '@/components/GlobalHeader';
import { PublicPageFooter } from '@/components/PublicPageFooter';
import { SEOHead } from '@/components/SEOHead';
import { getAppleCardSurfaceStyle, shouldUseContentGlass } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const useGlass = shouldUseContentGlass(theme);

  return (
    <View
      style={[
        getAppleCardSurfaceStyle(theme, 24),
        Platform.OS !== 'ios' && { borderWidth: 1, borderColor: colors.border },
        { overflow: 'hidden' },
        style,
      ]}
    >
      {useGlass && (
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
        />
      )}
      {children}
    </View>
  );
}

export default function MaintenanceInfoScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const contrastColor = getContrastTextColor(colors.tint);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(isAuthenticated ? '/(tabs)' : '/login');
  };

  return (
    <AnimatedScreen
      paddingBottom={64}
      header={
        <GlobalHeader
          title="Estado del Sistema"
          showBackButton
          hideRightButtons
          onBackPress={handleBack}
        />
      }
    >
      <View style={styles.container}>
        <SEOHead title="Estado del Sistema - Pro Fitness Glass" route="/mantenimiento" />
        <View style={styles.hero}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <CheckCircle2 size={13} color="#10b981" />
            <Text style={styles.statusBadgeText}>MIGRACIÓN FINALIZADA CON ÉXITO</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Dominio Oficial e Infraestructura Activa
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Tus entrenamientos, marcas personales y rutinas están 100% seguros y unificados bajo profitnessglass.es.
          </Text>
        </View>

        <GlassCard style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#38bdf81F' }]}>
            <Bolt size={20} color="#38bdf8" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Mayor Velocidad</Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            Tiempos de carga mínimos al registrar series, consultar ejercicios y sincronizar tus entrenamientos en tiempo real.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: colors.tint + '1F' }]}>
            <Globe size={20} color={colors.tint} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Dominio Oficial</Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            Unificación total bajo profitnessglass.es para enlaces compartidos, autenticación segura y App Links.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#10b9811F' }]}>
            <Lock size={20} color="#10b981" />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Estabilidad Total</Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            Control completo de la infraestructura con alta disponibilidad, seguridad reforzada y monitorización continua.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <View style={styles.faqHead}>
            <HelpCircle size={20} color={colors.tint} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Preguntas Rápidas</Text>
          </View>
          <View style={styles.qaItem}>
            <Text style={[styles.qText, { color: colors.text }]}>¿Tengo que hacer copia o volver a registrarme?</Text>
            <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
              No. Todos tus datos siguen intactos. Accede con tu correo y contraseña habituales.
            </Text>
          </View>
          <View style={[styles.qaItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 12 }]}>
            <Text style={[styles.qText, { color: colors.text }]}>¿Qué pasa con la app en mi móvil?</Text>
            <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
              Continúa funcionando con normalidad conectada automáticamente al servidor oficial.
            </Text>
          </View>
        </GlassCard>

        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backBtn, { backgroundColor: colors.tint }]}
        >
          <Server size={16} color={contrastColor} />
          <Text style={[styles.backBtnText, { color: contrastColor }]}>Entendido, volver a la aplicación</Text>
        </TouchableOpacity>
        <PublicPageFooter />
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 14 },
  hero: { gap: 8, paddingTop: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10b981' },
  statusBadgeText: { fontSize: 10.5, fontWeight: '800', color: '#10b981', letterSpacing: 0.4 },
  heroTitle: { fontSize: 27, fontWeight: '900', letterSpacing: -0.6 },
  heroSub: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  card: { padding: 18, gap: 8 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16.5, fontWeight: '900' },
  cardBody: { fontSize: 13.5, lineHeight: 19, fontWeight: '500' },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qaItem: { gap: 4 },
  qText: { fontSize: 14, fontWeight: '800' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 15,
    marginTop: 4,
  },
  backBtnText: { fontSize: 14, fontWeight: '800' },
});
