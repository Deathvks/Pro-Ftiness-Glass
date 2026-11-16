import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
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
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  Bolt,
  Calculator,
  CheckCircle2,
  Dumbbell,
  Flame,
  HelpCircle,
  Minus,
  Plus,
  Target,
  Trophy,
  Utensils,
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

const EXERCISES = [
  { id: 'bench', name: 'Press de Banca con Barra', shortName: 'Press Banca', category: 'Pecho / Empuje' },
  { id: 'squat', name: 'Sentadilla Libre con Barra', shortName: 'Sentadilla', category: 'Pierna / Cuádriceps' },
  { id: 'deadlift', name: 'Peso Muerto Convencional / Sumo', shortName: 'Peso Muerto', category: 'Cadena Posterior' },
  { id: 'ohp', name: 'Press Militar de Pie (Overhead)', shortName: 'Press Militar', category: 'Hombros / Empuje' },
  { id: 'row', name: 'Remo con Barra (Pendlay / Yates)', shortName: 'Remo Barra', category: 'Espalda / Tirón' },
  { id: 'hipthrust', name: 'Hip Thrust con Barra', shortName: 'Hip Thrust', category: 'Glúteos / Pierna' },
  { id: 'pullup', name: 'Dominadas Lastradas', shortName: 'Dominadas', category: 'Espalda / Tracción' },
  { id: 'legpress', name: 'Prensa de Piernas 45°', shortName: 'Prensa 45°', category: 'Pierna' },
];

const PERCENTAGE_ROWS = [
  { pct: 100, reps: '1 rep', zone: 'Fuerza Máxima / Récord (PR)', accent: '#ef4444' },
  { pct: 95, reps: '2 reps', zone: 'Fuerza Neural Pura', accent: '#f97316' },
  { pct: 90, reps: '3 - 4 reps', zone: 'Fuerza Base / Powerlifting', accent: '#f59e0b' },
  { pct: 85, reps: '5 - 6 reps', zone: 'Fuerza + Hipertrofia Miofibrilar', accent: '#eab308' },
  { pct: 80, reps: '7 - 8 reps', zone: 'Hipertrofia Óptima (Tensión Mecánica)', accent: '#10b981' },
  { pct: 75, reps: '9 - 10 reps', zone: 'Hipertrofia / Volumen Muscular', accent: '#14b8a6' },
  { pct: 70, reps: '11 - 12 reps', zone: 'Hipertrofia Metabólica / Resistencia', accent: '#06b6d4' },
  { pct: 65, reps: '13 - 15 reps', zone: 'Bombeo / Resistencia Muscular', accent: '#3b82f6' },
  { pct: 60, reps: '15 - 18 reps', zone: 'Calentamiento Específico / Técnica', accent: '#a855f7' },
];

const QUICK_WEIGHTS = [40, 60, 80, 100, 120, 140];
const QUICK_REPS = [3, 5, 6, 8, 10, 12];

function GlassCard({
  children,
  radius = 24,
  style,
}: {
  children: React.ReactNode;
  radius?: number;
  style?: any;
}) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const useGlass = shouldUseContentGlass(theme);

  return (
    <View
      style={[
        getAppleCardSurfaceStyle(theme, radius),
        Platform.OS !== 'ios' && { borderWidth: 1, borderColor: colors.border },
        { overflow: 'hidden' },
        style,
      ]}
    >
      {useGlass && (
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: Math.max(0, radius - 1) }]}
        />
      )}
      {children}
    </View>
  );
}

export default function OneRMCalculatorScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const contrastColor = getContrastTextColor(colors.tint);

  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0].id);
  const [weight, setWeight] = useState(80);
  const [reps, setReps] = useState(8);

  const results = useMemo(() => {
    const w = Math.max(1, Number(weight) || 0);
    const r = Math.max(1, Math.min(30, Number(reps) || 1));

    if (r === 1) {
      return { epley: w, brzycki: w, lander: w, average: w };
    }

    const epley = w * (1 + r / 30);
    const brzycki = w * (36 / (37 - Math.min(r, 36)));
    const lander = (100 * w) / (101.3 - 2.67123 * r);
    const average = (epley + brzycki + lander) / 3;

    return {
      epley: Math.round(epley * 10) / 10,
      brzycki: Math.round(brzycki * 10) / 10,
      lander: Math.round(lander * 10) / 10,
      average: Math.round(average * 10) / 10,
    };
  }, [weight, reps]);

  const currentExercise = EXERCISES.find(e => e.id === selectedExercise) || EXERCISES[0];

  const adjustWeight = (delta: number) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setWeight(prev => Math.max(1, Math.min(500, Math.round((Number(prev || 0) + delta) * 2) / 2)));
  };

  const adjustReps = (delta: number) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setReps(prev => Math.max(1, Math.min(30, Number(prev || 1) + delta)));
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(isAuthenticated ? '/support' : '/login');
    }
  };

  return (
    <AnimatedScreen
      paddingBottom={64}
      keyboardShouldPersistTaps="handled"
      header={
        <GlobalHeader
          title="Calculadora 1RM"
          showBackButton
          hideRightButtons
          onBackPress={handleBack}
        />
      }
    >
      <View style={styles.container}>
        <SEOHead title="Calculadora 1RM Máximo - Pro Fitness Glass" route="/calculadora-1rm" />
        <MaintenanceNoticeBanner />
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: colors.tint + '1A', borderColor: colors.tint + '40' }]}>
            <Calculator size={13} color={colors.tint} />
            <Text style={[styles.badgeText, { color: colors.tint }]}>HERRAMIENTA BIOMECÁNICA DE FUERZA</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Calculadora de 1RM Máximo
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Estima tu Repetición Máxima con las ecuaciones de Epley, Brzycki y Lander y obtén tus porcentajes de entrenamiento.
          </Text>
        </View>

        {/* Quick Nav Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickNavRow}>
          <Pressable
            onPress={() => router.push('/calculadora-calorias-macros' as any)}
            style={[styles.quickNavPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
          >
            <Utensils size={14} color="#10b981" />
            <Text style={[styles.quickNavText, { color: colors.text }]}>Calculadora Macros</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/ejercicios' as any)}
            style={[styles.quickNavPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
          >
            <Dumbbell size={14} color={colors.tint} />
            <Text style={[styles.quickNavText, { color: colors.text }]}>Guía de Ejercicios</Text>
          </Pressable>
        </ScrollView>

        {/* Selector de Ejercicio + Inputs */}
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>1. ELIGE EJERCICIO</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exerciseRow}>
            {EXERCISES.map(ex => {
              const selected = ex.id === selectedExercise;
              return (
                <TouchableOpacity
                  key={ex.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setSelectedExercise(ex.id);
                  }}
                  style={[
                    styles.exerciseChip,
                    {
                      backgroundColor: selected ? colors.tint : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      borderColor: selected ? colors.tint : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.exerciseChipTitle,
                      { color: selected ? contrastColor : colors.text },
                    ]}
                  >
                    {ex.shortName}
                  </Text>
                  <Text
                    style={[
                      styles.exerciseChipCat,
                      { color: selected ? contrastColor + 'CC' : colors.textSecondary },
                    ]}
                  >
                    {ex.category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Weight */}
          <View style={styles.inputBlock}>
            <View style={styles.inputLabelRow}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>2. PESO LEVANTADO (KG)</Text>
              <Text style={[styles.activeExerciseHint, { color: colors.tint }]}>{currentExercise.name}</Text>
            </View>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                onPress={() => adjustWeight(-2.5)}
                style={[styles.stepperBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}
              >
                <Minus size={18} color={colors.text} />
              </TouchableOpacity>
              <View style={[styles.valueBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
                <TextInput
                  keyboardType="decimal-pad"
                  value={String(weight)}
                  onChangeText={t => {
                    const parsed = parseFloat(t.replace(',', '.'));
                    setWeight(Number.isNaN(parsed) ? 0 : Math.min(500, Math.max(0, parsed)));
                  }}
                  style={[styles.valueInput, { color: colors.text }]}
                />
                <Text style={[styles.unitText, { color: colors.textSecondary }]}>kg</Text>
              </View>
              <TouchableOpacity
                onPress={() => adjustWeight(2.5)}
                style={[styles.stepperBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}
              >
                <Plus size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.presetsRow}>
              {QUICK_WEIGHTS.map(w => {
                const active = weight === w;
                return (
                  <TouchableOpacity
                    key={w}
                    onPress={() => setWeight(w)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: active ? colors.tint + '22' : 'transparent',
                        borderColor: active ? colors.tint : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.presetText, { color: active ? colors.tint : colors.textSecondary }]}>{w} kg</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Reps */}
          <View style={styles.inputBlock}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>3. REPETICIONES COMPLETADAS (1 - 30)</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                onPress={() => adjustReps(-1)}
                style={[styles.stepperBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}
              >
                <Minus size={18} color={colors.text} />
              </TouchableOpacity>
              <View style={[styles.valueBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
                <TextInput
                  keyboardType="number-pad"
                  value={String(reps)}
                  onChangeText={t => {
                    const parsed = parseInt(t, 10);
                    setReps(Number.isNaN(parsed) ? 1 : Math.min(30, Math.max(1, parsed)));
                  }}
                  style={[styles.valueInput, { color: colors.text }]}
                />
                <Text style={[styles.unitText, { color: colors.textSecondary }]}>reps</Text>
              </View>
              <TouchableOpacity
                onPress={() => adjustReps(1)}
                style={[styles.stepperBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}
              >
                <Plus size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.presetsRow}>
              {QUICK_REPS.map(r => {
                const active = reps === r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setReps(r)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: active ? colors.tint + '22' : 'transparent',
                        borderColor: active ? colors.tint : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.presetText, { color: active ? colors.tint : colors.textSecondary }]}>{r} reps</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </GlassCard>

        {/* Main Result Card */}
        <GlassCard style={styles.resultCard}>
          <LinearGradient
            colors={[colors.tint + '26', isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.resultGradient}
          >
            <View style={styles.resultTopRow}>
              <View style={[styles.trophyBox, { backgroundColor: colors.tint + '22' }]}>
                <Trophy size={22} color={colors.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.resultKicker, { color: colors.tint }]}>TU 1RM ESTIMADO PROMEDIO</Text>
                <Text style={[styles.resultExercise, { color: colors.textSecondary }]} numberOfLines={1}>
                  {currentExercise.name}
                </Text>
              </View>
            </View>

            <View style={styles.bigNumberRow}>
              <Text style={[styles.bigNumber, { color: colors.text }]}>{results.average}</Text>
              <Text style={[styles.bigUnit, { color: colors.textSecondary }]}>kg</Text>
            </View>

            <View style={styles.formulasGrid}>
              <View style={[styles.formulaPill, { backgroundColor: isDark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.65)', borderColor: colors.border }]}>
                <Text style={[styles.formulaName, { color: colors.textSecondary }]}>Epley</Text>
                <Text style={[styles.formulaVal, { color: colors.text }]}>{results.epley} kg</Text>
              </View>
              <View style={[styles.formulaPill, { backgroundColor: isDark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.65)', borderColor: colors.border }]}>
                <Text style={[styles.formulaName, { color: colors.textSecondary }]}>Brzycki</Text>
                <Text style={[styles.formulaVal, { color: colors.text }]}>{results.brzycki} kg</Text>
              </View>
              <View style={[styles.formulaPill, { backgroundColor: isDark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.65)', borderColor: colors.border }]}>
                <Text style={[styles.formulaName, { color: colors.textSecondary }]}>Lander</Text>
                <Text style={[styles.formulaVal, { color: colors.text }]}>{results.lander} kg</Text>
              </View>
            </View>
          </LinearGradient>
        </GlassCard>

        {/* Percentages Table */}
        <GlassCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Tabla de Porcentajes y Zonas de Carga</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Pesos recomendados según tu 1RM actual ({results.average} kg):
          </Text>

          <View style={styles.tableWrap}>
            {PERCENTAGE_ROWS.map((row, idx) => {
              const targetKg = Math.round(((results.average * row.pct) / 100) * 2) / 2;
              return (
                <View
                  key={row.pct}
                  style={[
                    styles.tableRow,
                    idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                  ]}
                >
                  <View style={[styles.pctBadge, { backgroundColor: row.accent + '1E', borderColor: row.accent + '45' }]}>
                    <Text style={[styles.pctText, { color: row.accent }]}>{row.pct}%</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.zoneTitle, { color: colors.text }]}>{row.zone}</Text>
                    <Text style={[styles.zoneReps, { color: colors.textSecondary }]}>{row.reps}</Text>
                  </View>
                  <Text style={[styles.zoneKg, { color: colors.text }]}>{targetKg} kg</Text>
                </View>
              );
            })}
          </View>
        </GlassCard>

        {/* Educational Guide */}
        <GlassCard style={styles.card}>
          <View style={styles.guideHeader}>
            <Target size={18} color={colors.tint} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Zonas de Sobrecarga Progresiva</Text>
          </View>

          <View style={styles.zoneGuideList}>
            <View style={[styles.zoneGuideItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
              <View style={styles.zoneGuideHead}>
                <Bolt size={15} color="#f59e0b" />
                <Text style={[styles.zoneGuideTitle, { color: '#f59e0b' }]}>Fuerza Máxima (85% - 95%)</Text>
              </View>
              <Text style={[styles.zoneGuideDesc, { color: colors.textSecondary }]}>
                Series de 2 a 5 repeticiones con descansos de 3 a 5 minutos. Maximiza el reclutamiento de unidades motoras y eficiencia neural.
              </Text>
            </View>

            <View style={[styles.zoneGuideItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
              <View style={styles.zoneGuideHead}>
                <Flame size={15} color="#10b981" />
                <Text style={[styles.zoneGuideTitle, { color: '#10b981' }]}>Hipertrofia Óptima (70% - 85%)</Text>
              </View>
              <Text style={[styles.zoneGuideDesc, { color: colors.textSecondary }]}>
                Series de 6 a 12 repeticiones dejando 1 o 2 repeticiones en recámara (RIR 1-2). Mejor relación estímulo-fatiga.
              </Text>
            </View>

            <View style={[styles.zoneGuideItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
              <View style={styles.zoneGuideHead}>
                <CheckCircle2 size={15} color="#06b6d4" />
                <Text style={[styles.zoneGuideTitle, { color: '#06b6d4' }]}>Resistencia y Bombeo (60% - 70%)</Text>
              </View>
              <Text style={[styles.zoneGuideDesc, { color: colors.textSecondary }]}>
                Series de 12 a 18 repeticiones ideales para analíticos, poleas o descargas cuidando las articulaciones.
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* CTA */}
        <GlassCard style={styles.ctaCard}>
          <View style={styles.guideHeader}>
            <HelpCircle size={18} color={colors.tint} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Lleva tus marcas en directo</Text>
          </View>
          <Text style={[styles.zoneGuideDesc, { color: colors.textSecondary }]}>
            En tus rutinas de Pro Fitness Glass el 1RM estimado se actualiza automáticamente serie a serie sin cálculos manuales.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push((isAuthenticated ? '/(tabs)/routines' : '/register') as any)}
            style={[styles.ctaBtn, { backgroundColor: colors.tint }]}
          >
            <Text style={[styles.ctaBtnText, { color: contrastColor }]}>
              {isAuthenticated ? 'Ir a Mis Rutinas' : 'Crear Cuenta Gratis'}
            </Text>
            <ArrowRight size={16} color={contrastColor} />
          </TouchableOpacity>
        </GlassCard>
        <PublicPageFooter />
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 16 },
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
  quickNavRow: { gap: 10, paddingVertical: 2 },
  quickNavPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickNavText: { fontSize: 12.5, fontWeight: '700' },
  card: { padding: 18, gap: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  exerciseRow: { gap: 8, paddingVertical: 2 },
  exerciseChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
  },
  exerciseChipTitle: { fontSize: 13, fontWeight: '800' },
  exerciseChipCat: { fontSize: 10.5, fontWeight: '600' },
  inputBlock: { gap: 10, marginTop: 4 },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  activeExerciseHint: { fontSize: 11, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueBox: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    gap: 6,
  },
  valueInput: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    minWidth: 64,
    paddingVertical: 0,
  },
  unitText: { fontSize: 13, fontWeight: '700' },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  presetText: { fontSize: 12, fontWeight: '700' },
  resultCard: { padding: 0 },
  resultGradient: { padding: 18, gap: 14 },
  resultTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trophyBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  resultKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  resultExercise: { fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  bigNumberRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  bigNumber: { fontSize: 44, fontWeight: '900', letterSpacing: -1 },
  bigUnit: { fontSize: 18, fontWeight: '800' },
  formulasGrid: { flexDirection: 'row', gap: 8 },
  formulaPill: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
  },
  formulaName: { fontSize: 11, fontWeight: '700' },
  formulaVal: { fontSize: 14, fontWeight: '900' },
  cardTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  cardSub: { fontSize: 12.5, fontWeight: '500', marginTop: -6 },
  tableWrap: { gap: 2 },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  pctBadge: {
    width: 52,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  pctText: { fontSize: 12, fontWeight: '900' },
  zoneTitle: { fontSize: 13.5, fontWeight: '700' },
  zoneReps: { fontSize: 11.5, fontWeight: '500', marginTop: 1 },
  zoneKg: { fontSize: 15, fontWeight: '900' },
  guideHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  zoneGuideList: { gap: 10 },
  zoneGuideItem: { padding: 13, borderRadius: 14, borderWidth: 1, gap: 5 },
  zoneGuideHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  zoneGuideTitle: { fontSize: 13.5, fontWeight: '800' },
  zoneGuideDesc: { fontSize: 12.5, lineHeight: 18, fontWeight: '500' },
  ctaCard: { padding: 18, gap: 10 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  ctaBtnText: { fontSize: 14, fontWeight: '800' },
});
