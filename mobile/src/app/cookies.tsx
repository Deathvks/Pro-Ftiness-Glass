import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import {
  ShieldCheck,
  Database,
  Info,
  ExternalLink,
  Scale,
  Building2,
  CheckCircle2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';
import LegalDocumentIcon from '@/components/legal/LegalDocumentIcon';
import LegalHeader from '@/components/legal/LegalHeader';

export default function CookiesPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = colors;
  const currentStoreTheme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(currentStoreTheme);
  const contrastColor = getContrastTextColor(theme.tint);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      <LegalHeader
        currentRoute="cookies"
        title="Política de Cookies"
        badge="ART. 22.2 LSSI-CE"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentWrapper,
          {
            paddingBottom: insets.bottom + 48,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LegalDocumentIcon />
          <Text style={[styles.heroTitle, { color: theme.text }]}>Política de Cookies</Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            Inventario completo de cookies técnicas y almacenamiento local en{' '}
            <Text style={{ fontWeight: '700', color: theme.text }}>Pro Fitness Glass</Text> conforme
            al Art. 22.2 de la Ley 34/2002 (LSSI-CE) y directrices de la AEPD.
          </Text>
        </View>

        {/* Compromiso Ético */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              borderColor: theme.tint,
              borderWidth: 1.5,
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />

          <View style={styles.cardHeader}>
            <View style={[styles.iconBadge, { backgroundColor: theme.tint }]}>
              <CheckCircle2 size={20} color={contrastColor} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardPretitle, { color: theme.tint }]}>
                PRINCIPIO DE PRIVACIDAD POR DISEÑO
              </Text>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Cero Cookies Publicitarias
              </Text>
            </View>
          </View>

          <Text style={[styles.paragraphText, { color: theme.textSecondary }]}>
            En Pro Fitness Glass{' '}
            <Text style={{ fontWeight: '700', color: theme.text }}>
              NO utilizamos cookies publicitarias, no realizamos perfilado de comportamiento comercial
              para terceros ni vendemos tus datos a redes de publicidad o data brokers
            </Text>
            . Todas las tecnologías de persistencia en tu dispositivo son estrictamente técnicas y
            funcionales para permitir el funcionamiento fluido y seguro de la app.
          </Text>
        </View>

        {/* Categorías de Almacenamiento */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.07)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />

          <View style={styles.cardHeader}>
            <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <Database size={20} color={theme.text} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Tecnologías Utilizadas
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Almacenamiento seguro en tu terminal
              </Text>
            </View>
          </View>

          <View style={styles.featureGrid}>
            <View
              style={[
                styles.featureItem,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <Text style={[styles.featureTitle, { color: theme.text }]}>1. Cookies Técnicas de Sesión</Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
                Tokens JWT cifrados indispensables para autenticarte y verificar tu identidad entre
                peticiones sin necesidad de reintroducir tus credenciales en cada pantalla.
              </Text>
            </View>

            <View
              style={[
                styles.featureItem,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <Text style={[styles.featureTitle, { color: theme.text }]}>2. AsyncStorage / LocalStorage</Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
                Memoria local que almacena tus opciones estéticas (modo OLED, oscuro o claro, color de
                acento) y estado de consentimiento para una experiencia instantánea.
              </Text>
            </View>

            <View
              style={[
                styles.featureItem,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <Text style={[styles.featureTitle, { color: theme.text }]}>3. Caché Offline de Entrenamientos</Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
                Guarda tus ejercicios y rutinas activas en memoria para que puedas registrar series en el
                sótano del gimnasio sin cobertura ni gasto de datos móviles.
              </Text>
            </View>
          </View>
        </View>

        {/* Tabla Inventario Detallado */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.07)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />

          <View style={styles.cardHeader}>
            <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <Info size={20} color={theme.text} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Inventario de Claves Técnicas
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Requisito exigido por la Guía de Cookies de la AEPD
              </Text>
            </View>
          </View>

          <View style={styles.tableRows}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: theme.tint }]}>pro_fitness_token / auth</Text>
              <Text style={[styles.tableValue, { color: theme.textSecondary }]}>
                <Text style={{ fontWeight: '700', color: theme.text }}>Tipo:</Text> Técnica (Exenta de
                consentimiento previo por ser estrictamente necesaria).{'\n'}
                <Text style={{ fontWeight: '700', color: theme.text }}>Finalidad:</Text> Mantiene la
                sesión cifrada.{'\n'}
                <Text style={{ fontWeight: '700', color: theme.text }}>Duración:</Text> Hasta el cierre
                de sesión o expiración del token.
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: theme.tint }]}>theme / accent</Text>
              <Text style={[styles.tableValue, { color: theme.textSecondary }]}>
                <Text style={{ fontWeight: '700', color: theme.text }}>Tipo:</Text> Personalización.{'\n'}
                <Text style={{ fontWeight: '700', color: theme.text }}>Finalidad:</Text> Guarda el tema
                visual (OLED, light, ocean, etc.) y acento de color seleccionado.{'\n'}
                <Text style={{ fontWeight: '700', color: theme.text }}>Duración:</Text> Persistente en
                AsyncStorage.
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: theme.tint }]}>offline_sync_queue</Text>
              <Text style={[styles.tableValue, { color: theme.textSecondary }]}>
                <Text style={{ fontWeight: '700', color: theme.text }}>Tipo:</Text> Técnica / Offline.{'\n'}
                <Text style={{ fontWeight: '700', color: theme.text }}>Finalidad:</Text> Cola temporal
                de series y entrenamientos para sincronizar con el servidor cuando se recupere la
                conexión a internet.{'\n'}
                <Text style={{ fontWeight: '700', color: theme.text }}>Duración:</Text> Temporal hasta
                sincronización exitosa.
              </Text>
            </View>
          </View>
        </View>

        {/* Enlaces a otros documentos legales */}
        <View style={styles.relatedDocsSection}>
          <Text style={[styles.relatedDocsTitle, { color: theme.text }]}>Documentos Relacionados</Text>
          <View style={styles.relatedDocsGrid}>
            <TouchableOpacity
              onPress={() => router.push('/privacy')}
              style={[
                styles.relatedDocBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <ShieldCheck size={18} color={theme.tint} />
              <Text style={[styles.relatedDocText, { color: theme.text }]}>Política de Privacidad y RGPD</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/terms')}
              style={[
                styles.relatedDocBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <Scale size={18} color={theme.tint} />
              <Text style={[styles.relatedDocText, { color: theme.text }]}>Términos del Servicio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/legal-notice')}
              style={[
                styles.relatedDocBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <Building2 size={18} color={theme.tint} />
              <Text style={[styles.relatedDocText, { color: theme.text }]}>Aviso Legal (LSSI-CE)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 420,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPretitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  featureGrid: {
    gap: 10,
  },
  featureItem: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  tableRows: {
    gap: 14,
  },
  tableRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 12,
  },
  tableLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  tableValue: {
    fontSize: 14,
    lineHeight: 21,
  },
  paragraphText: {
    fontSize: 14,
    lineHeight: 21,
  },
  relatedDocsSection: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  relatedDocsTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  relatedDocsGrid: {
    gap: 10,
  },
  relatedDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 48,
  },
  relatedDocText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
