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
  Scale,
  UserCheck,
  HeartPulse,
  Lock,
  FileText,
  ShieldCheck,
  Building2,
  Cookie,
  AlertTriangle,
  Users,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastColor } from '@/utils/colorUtils';
import LegalHeader from '@/components/legal/LegalHeader';
import { supportEmail } from '@/config/mailContacts';

export default function TermsScreen() {
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
        currentRoute="terms"
        title="Términos del Servicio"
        badge="CONDICIONES DE USO"
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
            <Scale size={36} color={contrastColor} strokeWidth={2.4} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>Términos del Servicio</Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            Condiciones contractuales, marco regulatorio español y europeo (RGPD, LOPDGDD y LSSI-CE)
            y normas de uso de <Text style={{ fontWeight: '700', color: theme.text }}>Pro Fitness Glass</Text>.
          </Text>
        </View>

        {/* SECCIÓN CRÍTICA: Edad Mínima Legal 14 Años */}
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
              <UserCheck size={20} color={contrastColor} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardPretitle, { color: theme.tint }]}>
                REQUISITO IMPERATIVO — ART. 8 RGPD Y ART. 7 LOPDGDD
              </Text>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Edad Mínima Legal: 14 Años Cumplidos
              </Text>
            </View>
          </View>

          <Text style={[styles.paragraphText, { color: theme.textSecondary, marginBottom: 12 }]}>
            En cumplimiento del artículo 7 de la Ley Orgánica 3/2018 (LOPDGDD) y el artículo 8 del
            Reglamento (UE) 2016/679 (RGPD), <Text style={{ fontWeight: '700', color: theme.text }}>el
            registro y uso de la plataforma está estrictamente limitado a personas de 14 años o más</Text>.
          </Text>

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
              <Text style={[styles.featureTitle, { color: theme.text }]}>Menores de 14 Años</Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
                Queda expresamente prohibido su registro salvo autorización previa y verificable de sus
                progenitores o tutores legales.
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
              <Text style={[styles.featureTitle, { color: theme.text }]}>Supresión Inmediata</Text>
              <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
                Cualquier cuenta creada en contravención de esta edad será bloqueada y eliminada de
                oficio junto con todos sus datos asociados (Art. 17 RGPD).
              </Text>
            </View>
          </View>
        </View>

        {/* Sección: Descargo Médico y Deportivo */}
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
              <HeartPulse size={20} color={theme.text} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Descargo de Responsabilidad Médica
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Salud, entrenamiento y nutrición
              </Text>
            </View>
          </View>

          <Text style={[styles.paragraphText, { color: theme.textSecondary }]}>
            Pro Fitness Glass es una <Text style={{ fontWeight: '700', color: theme.text }}>herramienta
            de registro y diario deportivo</Text>. Ningún cálculo automatizado de 1RM, recomendación de
            sobrecarga o sugerencia de macronutrientes constituye asesoramiento médico, diagnóstico o
            prescripción sanitaria. Antes de iniciar un programa de esfuerzo físico de alta intensidad
            o cambio dietético, se aconseja consultar con un profesional de la salud o facultativo
            colegiado.
          </Text>
        </View>

        {/* Sección: Propiedad Intelectual */}
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
                Propiedad Intelectual y Código
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Titularidad y derechos de explotación
              </Text>
            </View>
          </View>

          <Text style={[styles.paragraphText, { color: theme.textSecondary }]}>
            Todo el código fuente, la arquitectura, el diseño visual Glass, los logotipos, las bases de
            datos de ejercicios, los algoritmos y los contenidos de Pro Fitness Glass son propiedad
            exclusiva de <Text style={{ fontWeight: '700', color: theme.text }}>Dylan Jesús Suárez Falcón</Text>{' '}
            o de sus legítimos licenciantes. Queda prohibida la reproducción total o parcial,
            descompilación, ingeniería inversa o uso no autorizado.
          </Text>
        </View>

        {/* Sección: Conducta de la Comunidad */}
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
              <Users size={20} color={theme.text} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Conducta y Uso Aceptable
              </Text>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Red social y asesorías
              </Text>
            </View>
          </View>

          <Text style={[styles.paragraphText, { color: theme.textSecondary }]}>
            Los usuarios se comprometen a utilizar la red social, el chat de asesorías y las historias
            con respeto mutuo. Está prohibido el acoso, la difusión de material explícito sin
            consentimiento, la apología del dopaje perjudicial sin prescripción o cualquier conducta
            que vulnere la legalidad española o europea.
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
