import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Brain,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Flame,
  Handshake,
  Laptop,
  Layers,
  MapPin,
  ShieldCheck,
  Timer,
  Trophy,
  Users,
} from 'lucide-react-native';

import AnimatedScreen from '@/components/AnimatedScreen';
import GlobalHeader from '@/components/GlobalHeader';
import { MaintenanceNoticeBanner } from '@/components/MaintenanceNoticeBanner';
import { PublicPageFooter } from '@/components/PublicPageFooter';
import { SEOHead } from '@/components/SEOHead';
import { getAppleCardSurfaceStyle, shouldUseContentGlass } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

const MODULES = [
  {
    icon: Dumbbell,
    color: '#10b981',
    title: 'Entrenamiento y Sobrecarga Progresiva',
    desc: 'Registro serie a serie con carga (kg), repeticiones y RIR/RPE. Comparativa histórica automática contra tu sesión previa para asegurar estímulo óptimo.',
  },
  {
    icon: Layers,
    color: '#38bdf8',
    title: 'Guía Biomecánica en Vídeo y Animación 3D',
    desc: 'Más de 300 ejercicios de musculación clasificados por grupo muscular, con clips y animaciones anatómicas para prevenir lesiones.',
  },
  {
    icon: Brain,
    color: '#a855f7',
    title: 'Entrenador con Inteligencia Artificial (Synapse)',
    desc: 'Asistencia inteligente personalizada para responder dudas de técnica, sustituir ejercicios y ajustar volumen según fatiga.',
  },
  {
    icon: Timer,
    color: '#f59e0b',
    title: 'Temporizador Inteligente en Segundo Plano',
    desc: 'Cronómetro de descanso con notificación interactiva y alertas hápticas aunque bloquees la pantalla o cambies de app.',
  },
  {
    icon: Flame,
    color: '#fb7185',
    title: 'Nutrición y Calculadoras Deportivas',
    desc: 'Cálculo de TMB y TDEE con Mifflin-St Jeor, macros, hidratación, creatina y lector de códigos de barras.',
  },
  {
    icon: MapPin,
    color: '#14b8a6',
    title: 'Radar y Mapa de Gimnasios',
    desc: 'Geolocalización en tiempo real para encontrar salas de musculación y centros de calistenia cercanos con ubicación directa.',
  },
  {
    icon: Trophy,
    color: '#eab308',
    title: 'Gamificación y Temas de Cristal Líquido',
    desc: 'Niveles XP, avatares desbloqueables y temas visuales Glassmorphism personalizables.',
  },
  {
    icon: Users,
    color: '#6366f1',
    title: 'Red Social Deportiva y Modo Entrenador',
    desc: 'Comparte rutinas con enlaces universales y permite a entrenadores supervisar pesos y progreso de forma privada.',
  },
];

const COMPARISON = [
  { label: 'Rutinas guardadas', pfg: 'Ilimitadas y Gratis', other: 'Límite 3 o 4 rutinas' },
  { label: 'Historial de marcas (PR)', pfg: 'Completo de por vida', other: 'Bloqueado a 3 meses' },
  { label: 'Vídeos y 3D', pfg: 'Incluidos en todo', other: 'Solo versión Pro' },
  { label: 'Entrenador IA', pfg: 'Synapse IA integrada', other: 'Pago mensual' },
  { label: 'Calculadoras científicas', pfg: '1RM + Macros TDEE', other: 'Apps adicionales' },
];

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

export default function AboutUsScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const contrastColor = getContrastTextColor(colors.tint);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(isAuthenticated ? '/support' : '/login');
  };

  return (
    <AnimatedScreen
      paddingBottom={64}
      header={
        <GlobalHeader
          title="Sobre Nosotros"
          showBackButton
          hideRightButtons
          onBackPress={handleBack}
        />
      }
    >
      <View style={styles.container}>
        <SEOHead title="Sobre Nosotros - Pro Fitness Glass" route="/sobre-nosotros" />
        <MaintenanceNoticeBanner />
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>SOFTWARE 100% GRATUITO Y DE ALTO RENDIMIENTO</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Entrenamiento de Fuerza Real. Sin Muros de Pago.
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Pro Fitness Glass es la plataforma integral de musculación, hipertrofia, nutrición y comunidad deportiva diseñada para devolver a los atletas una herramienta libre, rápida y rigurosa.
          </Text>
        </View>

        {/* Philosophy Card */}
        <GlassCard style={styles.card}>
          <View style={styles.headRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.tint + '1F' }]}>
              <Handshake size={22} color={colors.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.kicker, { color: colors.tint }]}>NUESTRA FILOSOFÍA</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Por Qué Nació Pro Fitness Glass
              </Text>
            </View>
          </View>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            En los últimos años la industria del fitness ha limitado funciones básicas como guardar más de 3 o 4 rutinas o consultar tu historial completo tras pagos de 10 € - 15 € al mes.
          </Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            Pro Fitness Glass nació con un principio innegociable: todas las herramientas principales son y seguirán siendo 100% gratuitas, sin funciones bloqueadas y respetando tu privacidad.
          </Text>
        </GlassCard>

        {/* Modules Grid */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Arquitectura de la Plataforma</Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
            Ocho pilares diseñados para cubrir todo tu progreso dentro y fuera del gimnasio.
          </Text>
        </View>

        <View style={styles.modulesList}>
          {MODULES.map(mod => {
            const Icon = mod.icon;
            return (
              <GlassCard key={mod.title} style={styles.moduleCard}>
                <View style={[styles.modIconBox, { backgroundColor: mod.color + '1D' }]}>
                  <Icon size={20} color={mod.color} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.modTitle, { color: colors.text }]}>{mod.title}</Text>
                  <Text style={[styles.modDesc, { color: colors.textSecondary }]}>{mod.desc}</Text>
                </View>
              </GlassCard>
            );
          })}
        </View>

        {/* Comparison Table */}
        <GlassCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Comparativa Transparente</Text>
          <View style={styles.tableWrap}>
            {COMPARISON.map((row, idx) => (
              <View
                key={row.label}
                style={[
                  styles.compRow,
                  idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                ]}
              >
                <Text style={[styles.compLabel, { color: colors.text }]}>{row.label}</Text>
                <View style={styles.compValues}>
                  <Text style={styles.compPfg}>✓ {row.pfg}</Text>
                  <Text style={[styles.compOther, { color: colors.textSecondary }]}>Otras apps: {row.other}</Text>
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Founder */}
        <GlassCard style={styles.card}>
          <View style={[styles.founderBadge, { backgroundColor: colors.tint + '1A', borderColor: colors.tint + '35' }]}>
            <Laptop size={13} color={colors.tint} />
            <Text style={[styles.badgeText, { color: colors.tint }]}>CREADOR Y DESARROLLADOR PRINCIPAL</Text>
          </View>
          <Text style={[styles.founderName, { color: colors.text }]}>Dylan Jesús Suárez Falcón</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            Apasionado del entrenamiento de fuerza, la biomecánica deportiva y la ingeniería de software moderna. Pro Fitness Glass combina tecnología móvil y web nativa con respeto total hacia la comunidad del gimnasio.
          </Text>
          <View style={styles.pillsRow}>
            <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}>
              <CheckCircle2 size={13} color="#10b981" />
              <Text style={[styles.pillText, { color: colors.text }]}>Desarrollo Independiente</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}>
              <ShieldCheck size={13} color="#38bdf8" />
              <Text style={[styles.pillText, { color: colors.text }]}>Privacidad y 2FA</Text>
            </View>
          </View>
        </GlassCard>

        {/* Final CTA */}
        <GlassCard style={styles.ctaWrap}>
          <LinearGradient
            colors={[colors.tint + '24', 'rgba(16, 185, 129, 0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <Text style={[styles.ctaTitle, { color: colors.text }]}>
              ¿Listo para llevar tu entrenamiento al siguiente nivel?
            </Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary, textAlign: 'center' }]}>
              Únete hoy mismo y registra tus marcas personales de forma gratuita.
            </Text>
            <TouchableOpacity
              onPress={() => router.push((isAuthenticated ? '/(tabs)' : '/register') as any)}
              style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
            >
              <Text style={[styles.primaryBtnText, { color: contrastColor }]}>
                {isAuthenticated ? 'Ir a mi Panel' : 'Crear Cuenta Gratis'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/faq' as any)}
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Ver Preguntas Frecuentes (FAQ)</Text>
              <ChevronRight size={16} color={colors.text} />
            </TouchableOpacity>
          </LinearGradient>
        </GlassCard>
        <PublicPageFooter />
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 16 },
  hero: { gap: 8, paddingTop: 4 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10b981' },
  liveText: { fontSize: 10.5, fontWeight: '800', color: '#10b981', letterSpacing: 0.4 },
  heroTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.6, lineHeight: 33 },
  heroSub: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  card: { padding: 18, gap: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6 },
  cardTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  bodyText: { fontSize: 13.5, lineHeight: 20, fontWeight: '500' },
  sectionHeader: { gap: 4, marginTop: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  sectionSub: { fontSize: 13, fontWeight: '500' },
  modulesList: { gap: 10 },
  moduleCard: { padding: 15, flexDirection: 'row', alignItems: 'flex-start', gap: 13 },
  modIconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  modTitle: { fontSize: 15, fontWeight: '800' },
  modDesc: { fontSize: 12.5, lineHeight: 18, fontWeight: '500' },
  tableWrap: { gap: 2 },
  compRow: { paddingVertical: 11, gap: 4 },
  compLabel: { fontSize: 13.5, fontWeight: '800' },
  compValues: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  compPfg: { fontSize: 12.5, fontWeight: '800', color: '#10b981' },
  compOther: { fontSize: 12, fontWeight: '500' },
  founderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5 },
  founderName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  pillText: { fontSize: 12, fontWeight: '700' },
  ctaWrap: { padding: 0 },
  ctaGradient: { padding: 20, gap: 12, alignItems: 'center' },
  ctaTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', letterSpacing: -0.3 },
  primaryBtn: { width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { fontSize: 14.5, fontWeight: '800' },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryBtnText: { fontSize: 13.5, fontWeight: '700' },
});
