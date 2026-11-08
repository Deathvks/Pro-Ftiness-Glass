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
  Building2,
  Scale,
  ShieldCheck,
  Lock,
  Globe,
  Mail,
  Cookie,
  Server,
  AlertTriangle,
  FileText,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastColor } from '@/utils/colorUtils';
import LegalHeader from '@/components/legal/LegalHeader';
import { supportEmail, privacyEmail } from '@/config/mailContacts';

export default function LegalNoticeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = colors;
  const currentStoreTheme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(currentStoreTheme);
  const contrastColor = getContrastColor(theme.tint, currentStoreTheme);

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
        currentRoute="legal-notice"
        title="Aviso Legal"
        badge="ART. 10 LSSI-CE"
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
          <View
            style={[
              styles.heroIconBox,
              {
                backgroundColor: theme.tint,
                borderColor: 'rgba(255, 255, 255, 0.25)',
              },
            ]}
          >
            <Building2 size={36} color={contrastColor} strokeWidth={2.4} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>Aviso Legal</Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            Información general del prestador de servicios y titularidad de{' '}
            <Text style={{ fontWeight: '700', color: theme.text }}>Pro Fitness Glass</Text> conforme
            al artículo 10 de la Ley 34/2002 (LSSI-CE).
          </Text>
        </View>

        {/* SECCIÓN 1: Datos Identificativos */}
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
              <Building2 size={20} color={contrastColor} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardPretitle, { color: theme.tint }]}>
                CUMPLIMIENTO ARTÍCULO 10 LSSI-CE
              </Text>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Datos Identificativos del Prestador
              </Text>
            </View>
          </View>

          <View style={styles.tableRows}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: theme.tint }]}>TITULAR Y RESPONSABLE</Text>
              <Text style={[styles.tableValue, { color: theme.textSecondary }]}>
                <Text style={{ fontWeight: '700', color: theme.text }}>Dylan Jesús Suárez Falcón</Text>{' '}
                (Desarrollador y titular de la marca Pro Fitness Glass).
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: theme.tint }]}>DOMINIO Y PORTAL WEB</Text>
              <Text
                style={[styles.tableValue, { color: theme.tint, fontWeight: '700' }]}
                onPress={() => openLink('https://profitnessglass.es')}
              >
                https://profitnessglass.es
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: theme.tint }]}>CORREOS DE CONTACTO</Text>
              <Text style={[styles.tableValue, { color: theme.textSecondary }]}>
                Soporte y dudas:{' '}
                <Text
                  style={{ color: theme.tint, fontWeight: '700' }}
                  onPress={() => openLink(`mailto:${supportEmail}`)}
                >
                  {supportEmail}
                </Text>
                {'\n'}
                Privacidad y ejercicio de derechos:{' '}
                <Text
                  style={{ color: theme.tint, fontWeight: '700' }}
                  onPress={() => openLink(`mailto:${privacyEmail}`)}
                >
                  {privacyEmail}
                </Text>
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: theme.tint }]}>OBJETO DE LA PLATAFORMA</Text>
              <Text style={[styles.tableValue, { color: theme.textSecondary }]}>
                Software multiplataforma de registro y analítica deportiva, sobrecarga progresiva,
                gestión nutricional y asesoría entre deportistas y entrenadores.
              </Text>
            </View>
          </View>
        </View>

        {/* Sección: Propiedad Industrial e Intelectual */}
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
              <Lock size={20} color={theme.text} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Propiedad Intelectual y Derechos de Autor
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Protección legal del software y marcas
              </Text>
            </View>
          </View>

          <Text style={[styles.paragraphText, { color: theme.textSecondary }]}>
            Los derechos de propiedad intelectual sobre el código informático, diseño de interfaz
            (Liquid Glass), estructuras de bases de datos, algoritmos de cálculo, imágenes, marcas y
            logotipos corresponden a Dylan Jesús Suárez Falcón. Queda expresamente prohibida su
            distribución, modificación o reproducción comercial sin autorización escrita previa.
          </Text>
        </View>

        {/* Sección: Exclusión de Responsabilidad Técnica */}
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
              <Server size={20} color={theme.text} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Disponibilidad y Exención de Responsabilidad
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Mantenimiento y factores externos
              </Text>
            </View>
          </View>

          <Text style={[styles.paragraphText, { color: theme.textSecondary }]}>
            El titular implementa todas las medidas técnicas de seguridad a su alcance para
            garantizar la disponibilidad ininterrumpida del servicio. No obstante, no se responsabiliza
            de interrupciones originadas por mantenimiento programado, cortes en proveedores de red o
            telecomunicaciones, o ciberataques de fuerza mayor.
          </Text>
        </View>

        {/* Sección: Legislación Aplicable y Fuero */}
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
              <Scale size={20} color={theme.text} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Legislación Aplicable y Jurisdicción
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Derecho español y comunitario
              </Text>
            </View>
          </View>

          <Text style={[styles.paragraphText, { color: theme.textSecondary }]}>
            Para la resolución de cualquier controversia o cuestión litigiosa derivada de la
            plataforma o de los presentes términos, será de aplicación la legislación española vigente,
            siendo competentes los Juzgados y Tribunales de España correspondientes conforme a la
            normativa de consumidores y usuarios.
          </Text>
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
              onPress={() => router.push('/cookies')}
              style={[
                styles.relatedDocBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <Cookie size={18} color={theme.tint} />
              <Text style={[styles.relatedDocText, { color: theme.text }]}>Política de Cookies</Text>
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
  heroIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
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
  tableRows: {
    gap: 14,
  },
  tableRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 12,
  },
  tableLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
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
