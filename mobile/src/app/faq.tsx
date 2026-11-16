import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { ChevronDown, HelpCircle, Search, X } from 'lucide-react-native';

import AnimatedScreen from '@/components/AnimatedScreen';
import GlobalHeader from '@/components/GlobalHeader';
import { supportEmail } from '@/config/mailContacts';
import { getAppleCardSurfaceStyle, shouldUseContentGlass } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

const FAQ_DATA = [
  {
    category: 'general',
    categoryLabel: 'General y Gratuidad',
    question: '¿Pro Fitness Glass es realmente gratis o tiene costos ocultos?',
    answer:
      'Pro Fitness Glass es 100% gratuita. Todas las funciones —creación ilimitada de rutinas, historial completo de por vida, vídeos biomecánicos, animaciones 3D, cronómetro en segundo plano, calculadoras de 1RM y macros, e IA Synapse— están desbloqueadas sin cuotas de suscripción mensual ni muros de pago.',
  },
  {
    category: 'general',
    categoryLabel: 'General y Gratuidad',
    question: '¿En qué plataformas y dispositivos puedo utilizar la aplicación?',
    answer:
      'Puedes utilizarla en cualquier dispositivo: dispones de aplicación móvil para Android e iOS y de la Progressive Web App (PWA) compatible con navegadores de escritorio (Windows, macOS, Linux).',
  },
  {
    category: 'general',
    categoryLabel: 'General y Gratuidad',
    question: '¿En qué se diferencia Pro Fitness Glass de apps como Hevy o Strong?',
    answer:
      'La diferencia principal radica en la libertad del usuario: no limitamos el número de rutinas, no bloqueamos tu historial pasado, incluimos vídeos y 3D en cada ejercicio, temporizador en segundo plano, calculadoras deportivas e IA, todo sin suscripciones mensuales.',
  },
  {
    category: 'training',
    categoryLabel: 'Entrenamiento y Rutinas',
    question: '¿Cómo funciona el registro de series y la sobrecarga progresiva?',
    answer:
      'En cada ejercicio puedes registrar la carga en kilogramos, repeticiones y Repeticiones en Reserva (RIR o RPE). Pro Fitness Glass compara automáticamente cada serie con tu registro histórico previo y te indica cuándo bates una marca personal.',
  },
  {
    category: 'training',
    categoryLabel: 'Entrenamiento y Rutinas',
    question: '¿El temporizador de descanso sigue funcionando con la pantalla bloqueada?',
    answer:
      'Sí. En la app móvil el temporizador de descanso continúa funcionando en segundo plano con notificaciones programadas y aviso sonoro o háptico al finalizar.',
  },
  {
    category: 'training',
    categoryLabel: 'Entrenamiento y Rutinas',
    question: '¿Cómo puedo alternar entre vídeo y animación 3D en un ejercicio?',
    answer:
      'Al pulsar sobre cualquier ejercicio durante tu sesión o en la enciclopedia verás un selector para alternar al instante entre el vídeo de ejecución real y la animación anatómica que resalta los músculos implicados.',
  },
  {
    category: 'training',
    categoryLabel: 'Entrenamiento y Rutinas',
    question: '¿Puedo compartir mis rutinas con amigos o clientes?',
    answer:
      'Sí. Cada rutina dispone de un enlace universal compartido (/share/routine/:id). Quien reciba el enlace puede previsualizar la rutina completa e importarla a su cuenta con un toque.',
  },
  {
    category: 'training',
    categoryLabel: 'Entrenamiento y Rutinas',
    question: '¿Cómo funciona el modo entrenador y asesoría personal?',
    answer:
      'Si trabajas con un entrenador personal registrado en Pro Fitness Glass, puedes vincular tu cuenta con él mediante código o invitación. Tu entrenador podrá asignarte rutinas, monitorizar cargas y enviarte feedback confidencial.',
  },
  {
    category: 'tech',
    categoryLabel: 'Nutrición e IA',
    question: '¿Qué es el Asistente de IA Synapse y en qué me ayuda?',
    answer:
      'Synapse es el asistente especializado en ciencias del deporte integrado en Pro Fitness Glass. Puedes consultarle técnica biomecánica, sustituciones por molestias articulares y recomendaciones de volumen.',
  },
  {
    category: 'tech',
    categoryLabel: 'Nutrición e IA',
    question: '¿Qué fórmulas científicas utiliza la calculadora de 1RM y macros?',
    answer:
      'Para 1RM combinamos Epley, Brzycki y Lander para obtener una media precisa. Para nutrición empleamos Mifflin-St Jeor (TMB y TDEE) desglosando proteínas (1.8-2.2 g/kg), grasas e hidratos.',
  },
  {
    category: 'tech',
    categoryLabel: 'Nutrición e IA',
    question: '¿Se puede utilizar la aplicación sin conexión a internet (offline)?',
    answer:
      'Sí. Gracias al almacenamiento local y la cola de sincronización offline puedes consultar tus rutinas y registrar entrenamientos incluso sin cobertura y sincronizarlos al recuperar red.',
  },
  {
    category: 'security',
    categoryLabel: 'Cuenta y Seguridad',
    question: '¿Mis datos se sincronizan en la nube y están seguros?',
    answer:
      'Sí. Todo tu historial de marcas personales (PRs), peso corporal, series y notas se almacena de forma segura en nuestros servidores con cifrado en tránsito SSL/TLS.',
  },
  {
    category: 'security',
    categoryLabel: 'Cuenta y Seguridad',
    question: '¿Cómo funciona la autenticación de doble factor (2FA)?',
    answer:
      'Puedes activar la verificación en dos pasos (2FA) desde Ajustes de seguridad para proteger tu cuenta con aplicaciones TOTP como Google Authenticator.',
  },
  {
    category: 'general',
    categoryLabel: 'General y Gratuidad',
    question: '¿Quién ha desarrollado Pro Fitness Glass y cuál es el contacto oficial?',
    answer: `Pro Fitness Glass ha sido creada y desarrollada de forma independiente por Dylan Jesús Suárez Falcón. Puedes contactar con soporte desde la app o en ${supportEmail}.`,
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Todas' },
  { id: 'general', label: 'General y Gratuidad' },
  { id: 'training', label: 'Entrenamientos' },
  { id: 'tech', label: 'Nutrición e IA' },
  { id: 'security', label: 'Cuenta y Seguridad' },
];

export default function FAQScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const useGlass = shouldUseContentGlass(theme);
  const contrastColor = getContrastTextColor(colors.tint);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openIndices, setOpenIndices] = useState<Set<number>>(() => new Set([0, 1]));

  const filteredFAQs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FAQ_DATA.filter(item => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesQ =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [searchQuery, selectedCategory]);

  const toggleItem = (idx: number) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setOpenIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(isAuthenticated ? '/support' : '/login');
  };

  return (
    <AnimatedScreen
      paddingBottom={64}
      keyboardShouldPersistTaps="handled"
      header={
        <GlobalHeader
          title="Preguntas Frecuentes"
          showBackButton
          hideRightButtons
          onBackPress={handleBack}
        />
      }
    >
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: colors.tint + '1A', borderColor: colors.tint + '40' }]}>
            <HelpCircle size={13} color={colors.tint} />
            <Text style={[styles.badgeText, { color: colors.tint }]}>CENTRO DE AYUDA OFICIAL (FAQ)</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Preguntas Frecuentes</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Todo lo que necesitas saber sobre Pro Fitness Glass: gratuidad, rutinas, IA Synapse, sincronización y seguridad.
          </Text>
        </View>

        {/* Search Input */}
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              borderColor: colors.border,
            },
          ]}
        >
          <Search size={17} color={colors.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar: gratis, 1RM, 2FA, offline..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsRow}>
          {CATEGORIES.map(cat => {
            const active = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: active ? colors.tint : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    borderColor: active ? colors.tint : colors.border,
                  },
                ]}
              >
                <Text style={[styles.catText, { color: active ? contrastColor : colors.text }]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* FAQ Accordion List */}
        {filteredFAQs.length === 0 ? (
          <View
            style={[
              getAppleCardSurfaceStyle(theme, 22),
              styles.emptyCard,
              Platform.OS !== 'ios' && { borderWidth: 1, borderColor: colors.border },
            ]}
          >
            <HelpCircle size={32} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No encontramos preguntas para esa búsqueda
            </Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Prueba con "gratis", "rutinas", "1RM" o borra el filtro.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredFAQs.map((item, idx) => {
              const isOpen = openIndices.has(idx);
              return (
                <View
                  key={`${item.question}-${idx}`}
                  style={[
                    getAppleCardSurfaceStyle(theme, 20),
                    Platform.OS !== 'ios' && {
                      borderWidth: 1,
                      borderColor: isOpen ? colors.tint + '66' : colors.border,
                    },
                    { overflow: 'hidden' },
                  ]}
                >
                  {useGlass && (
                    <GlassView
                      glassEffectStyle="regular"
                      colorScheme={isDark ? 'dark' : 'light'}
                      style={[StyleSheet.absoluteFill, { borderRadius: 19 }]}
                    />
                  )}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleItem(idx)}
                    style={styles.faqTrigger}
                  >
                    <View style={styles.faqTriggerLeft}>
                      <View style={[styles.dot, { backgroundColor: colors.tint }]} />
                      <Text style={[styles.faqQ, { color: colors.text }]}>{item.question}</Text>
                    </View>
                    <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
                      <ChevronDown size={18} color={isOpen ? colors.tint : colors.textSecondary} />
                    </View>
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={[styles.faqBody, { borderTopColor: colors.border }]}>
                      <Text style={[styles.faqCategoryTag, { color: colors.tint }]}>{item.categoryLabel}</Text>
                      <Text style={[styles.faqA, { color: colors.textSecondary }]}>{item.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Footer CTA */}
        <View
          style={[
            getAppleCardSurfaceStyle(theme, 24),
            styles.ctaBox,
            Platform.OS !== 'ios' && { borderWidth: 1, borderColor: colors.border },
          ]}
        >
          <HelpCircle size={26} color={colors.tint} />
          <Text style={[styles.ctaTitle, { color: colors.text }]}>
            ¿Tienes alguna otra duda o propuesta?
          </Text>
          <Text style={[styles.ctaSub, { color: colors.textSecondary }]}>
            Escuchamos directamente a nuestra comunidad de atletas para seguir mejorando la app.
          </Text>
          <View style={styles.ctaBtns}>
            <TouchableOpacity
              onPress={() => router.push('/sobre-nosotros' as any)}
              style={[styles.ctaPrimary, { backgroundColor: colors.tint }]}
            >
              <Text style={[styles.ctaPrimaryText, { color: contrastColor }]}>Sobre Nosotros</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push((isAuthenticated ? '/support' : '/login') as any)}
              style={[
                styles.ctaSecondary,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.ctaSecondaryText, { color: colors.text }]}>Contactar Soporte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 14 },
  hero: { gap: 8, paddingTop: 4 },
  badge: {
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
  heroTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.6 },
  heroSub: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', paddingVertical: 0 },
  catsRow: { gap: 8, paddingVertical: 2 },
  catChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 13, borderWidth: 1 },
  catText: { fontSize: 12.5, fontWeight: '700' },
  list: { gap: 10 },
  faqTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  faqTriggerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  faqQ: { fontSize: 14.5, fontWeight: '800', flex: 1, lineHeight: 20 },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 5,
  },
  faqCategoryTag: { fontSize: 10.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  faqA: { fontSize: 13.5, lineHeight: 20, fontWeight: '500' },
  emptyCard: { padding: 28, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 15.5, fontWeight: '800', textAlign: 'center' },
  emptySub: { fontSize: 12.5, textAlign: 'center' },
  ctaBox: { padding: 20, alignItems: 'center', gap: 8, marginTop: 6 },
  ctaTitle: { fontSize: 17, fontWeight: '900', textAlign: 'center' },
  ctaSub: { fontSize: 12.5, textAlign: 'center', lineHeight: 18 },
  ctaBtns: { flexDirection: 'row', gap: 10, marginTop: 6, width: '100%' },
  ctaPrimary: { flex: 1, paddingVertical: 12, borderRadius: 13, alignItems: 'center' },
  ctaPrimaryText: { fontSize: 13, fontWeight: '800' },
  ctaSecondary: { flex: 1, paddingVertical: 12, borderRadius: 13, borderWidth: 1, alignItems: 'center' },
  ctaSecondaryText: { fontSize: 13, fontWeight: '800' },
});
