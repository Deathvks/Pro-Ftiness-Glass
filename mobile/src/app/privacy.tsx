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
  Clock,
  Users,
  HeartHandshake,
  MapPin,
  Trash2,
  ExternalLink,
  Mail,
  Scale,
  Building2,
  Cookie,
  UserCheck,
  Info,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastColor } from '@/utils/colorUtils';
import LegalHeader from '@/components/legal/LegalHeader';
import { privacyEmail, mailProvider } from '@/config/mailContacts';

export default function PrivacyPolicyScreen() {
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
        currentRoute="privacy"
        title="Política de Privacidad"
        badge="RGPD & LOPDGDD"
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
            <ShieldCheck size={36} color={contrastColor} strokeWidth={2.4} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>Tu Privacidad Importa</Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            En <Text style={{ fontWeight: '700', color: theme.text }}>Pro Fitness Glass</Text>,
            cuidamos tus datos conforme al Reglamento General de Protección de Datos (RGPD UE
            2016/679) y la Ley Orgánica 3/2018 (LOPDGDD).
          </Text>
        </View>

        {/* PRIMERA CAPA RGPD: Información Básica del Responsable */}
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
              <ShieldCheck size={20} color={contrastColor} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardPretitle, { color: theme.tint }]}>
                PRIMERA CAPA INFORMATIVA — ART. 13 RGPD Y ART. 11 LOPDGDD
              </Text>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Información Básica de Protección de Datos
              </Text>
            </View>
          </View>

          <View style={styles.tableRows}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: theme.tint }]}>RESPONSABLE</Text>
              <Text style={[styles.tableValue, { color: theme.textSecondary }]}>
                <Text style={{ fontWeight: '700', color: theme.text }}>Dylan Jesús Suárez Falcón</Text>{' '}
                (Titular de Pro Fitness Glass).{'\n'}
                Contacto y ejercicio de derechos ARCO/OLP:{' '}
                <Text
                  style={{ color: theme.tint, fontWeight: '700' }}
                  onPress={() => openLink(`mailto:${privacyEmail}`)}
                >
                  {privacyEmail}
                </Text>
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: theme.tint }]}>FINALIDAD PRINCIPAL</Text>
              <Text style={[styles.tableValue, { color: theme.textSecondary }]}>
                Gestión de cuenta de usuario, diario de entrenamiento, cálculo de marcas (1RM), registro
                de sobrecarga progresiva, control nutricional y asesoría deportiva voluntaria con
                entrenadores vinculados. Las historias efímeras se destruyen automáticamente tras 24
                horas.
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: theme.tint }]}>BASES JURÍDICAS</Text>
              <Text style={[styles.tableValue, { color: theme.textSecondary }]}>
                • <Text style={{ fontWeight: '700', color: theme.text }}>Ejecución del contrato (Art. 6.1.b RGPD):</Text>{' '}
                Prestación del servicio deportivo y sincronización.{'\n'}
                • <Text style={{ fontWeight: '700', color: theme.text }}>Consentimiento explícito (Art. 6.1.a y 9.2.a RGPD):</Text>{' '}
                Datos de salud deportiva, métricas físicas, peso y nutrición.{'\n'}
                • <Text style={{ fontWeight: '700', color: theme.text }}>Interés legítimo (Art. 6.1.f RGPD):</Text>{' '}
                Seguridad técnica y auditoría.{'\n'}
                • <Text style={{ fontWeight: '700', color: theme.text }}>Consentimiento opcional:</Text>{' '}
                Comunicaciones sobre resúmenes de entrenamiento y consejos de coaching.
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: theme.tint }]}>EDAD MÍNIMA (ESPAÑA)</Text>
              <Text style={[styles.tableValue, { color: theme.textSecondary }]}>
                <Text style={{ fontWeight: '700', color: theme.text }}>14 años cumplidos</Text> (Art. 7
                LOPDGDD y Art. 8 RGPD). Los menores de 14 años requieren autorización verificable de sus
                padres o tutores legales.
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: theme.tint }]}>DESTINATARIOS</Text>
              <Text style={[styles.tableValue, { color: theme.textSecondary }]}>
                No comercializamos tus datos ni los cedemos a terceros con fines publicitarios.
                Utilizamos proveedores tecnológicos de infraestructura y el servicio SMTP de{' '}
                <Text style={{ fontWeight: '700', color: theme.text }}>{mailProvider}</Text> para
                la entrega de correos de seguridad y notificaciones.
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: theme.tint }]}>PLAZOS DE CONSERVACIÓN</Text>
              <Text style={[styles.tableValue, { color: theme.textSecondary }]}>
                Mientras mantengas tu cuenta activa. Puedes solicitar la supresión inmediata y
                definitiva en cualquier momento desde tu Perfil. Las historias efímeras se eliminan sin
                copia a las 24 horas.
              </Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: theme.tint }]}>TUS DERECHOS</Text>
              <Text style={[styles.tableValue, { color: theme.textSecondary }]}>
                Acceso, rectificación, supresión (derecho al olvido), limitación, oposición y
                portabilidad de datos (JSON/CSV/Excel). Escríbenos a{' '}
                <Text
                  style={{ color: theme.tint, fontWeight: '700' }}
                  onPress={() => openLink(`mailto:${privacyEmail}`)}
                >
                  {privacyEmail}
                </Text>
                . Tienes derecho a presentar una reclamación ante la{' '}
                <Text
                  style={{ color: theme.tint, fontWeight: '700' }}
                  onPress={() => openLink('https://www.aepd.es')}
                >
                  Agencia Española de Protección de Datos (AEPD)
                </Text>
                .
              </Text>
            </View>
          </View>
        </View>

        {/* Sección: Historias y Contenido Efímero */}
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
              <Clock size={20} color={theme.text} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Historias y Contenido Efímero
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Autodestrucción garantizada tras 24 horas
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
              <Clock size={18} color={theme.tint} style={{ marginBottom: 6 }} />
              <Text style={[styles.featureTitle, { color: theme.text }]}>Duración 24h</Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
                Se borran automáticamente y de forma irreversible del servidor tras un día.
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
              <Users size={18} color={theme.tint} style={{ marginBottom: 6 }} />
              <Text style={[styles.featureTitle, { color: theme.text }]}>Tú Decides</Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
                Elige visibilidad "Pública" para motivar o "Solo Amigos" para tu círculo.
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
              <HeartHandshake size={18} color={theme.tint} style={{ marginBottom: 6 }} />
              <Text style={[styles.featureTitle, { color: theme.text }]}>Comunidad Segura</Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
                Tolerancia cero con contenido ofensivo o lesivo. Respeto deportivo garantizado.
              </Text>
            </View>
          </View>
        </View>

        {/* Sección: Ubicación GPS */}
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
              <MapPin size={20} color={theme.text} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Ubicación GPS y Cardio</Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Exclusivamente bajo tu control activo
              </Text>
            </View>
          </View>

          <Text style={[styles.paragraphText, { color: theme.textSecondary }]}>
            Solo solicitamos y utilizamos tu ubicación cuando inicias una sesión en modo{' '}
            <Text style={{ fontWeight: '700', color: theme.text }}>"Cardio"</Text> para calcular
            tu ruta, distancia y velocidad. Al pausar o finalizar el ejercicio, la conexión GPS se
            apaga de forma automática y el mapa queda almacenado privadamente en tu historial.
          </Text>
        </View>

        {/* Sección: Supresión y Ejercicio de Derechos */}
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
              <Trash2 size={20} color={theme.text} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Eliminación de Cuenta y Portabilidad
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Art. 17 RGPD — Derecho al Olvido
              </Text>
            </View>
          </View>

          <Text style={[styles.paragraphText, { color: theme.textSecondary }]}>
            Puedes borrar tu cuenta de forma total, inmediata e irreversible directamente desde los{' '}
            <Text style={{ fontWeight: '700', color: theme.text }}>Ajustes de Perfil</Text> en la
            aplicación móvil o web. Esta acción suprime tus registros personales, rutinas, historial
            de cargas, mensajes y datos antropométricos sin posibilidad de recuperación.
          </Text>
        </View>

        {/* Enlaces a otros documentos legales */}
        <View style={styles.relatedDocsSection}>
          <Text style={[styles.relatedDocsTitle, { color: theme.text }]}>Documentos Relacionados</Text>
          <View style={styles.relatedDocsGrid}>
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
              <Text style={[styles.relatedDocText, { color: theme.text }]}>Aviso Legal</Text>
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
