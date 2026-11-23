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
  Calculator,
  Droplets,
  Dumbbell,
  Flame,
  FlaskConical,
  HeartPulse,
  Minus,
  Plus,
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

const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Sedentario', desc: 'Oficina, sin ejercicio' },
  { value: 1.375, label: 'Ligero', desc: 'Gym 1 - 2 días/sem' },
  { value: 1.55, label: 'Moderado', desc: 'Gym 3 - 5 días/sem' },
  { value: 1.725, label: 'Intenso', desc: 'Gym 5 - 6 días/sem' },
  { value: 1.9, label: 'Atleta Élite', desc: 'Entreno diario + físico' },
];

const GOALS = [
  {
    id: 'cut',
    title: 'Perder Grasa (Definición)',
    shortTitle: 'Definición',
    desc: 'Déficit inteligente (-450 kcal) protegiendo masa muscular',
    calDelta: -450,
    proteinPerKg: 2.1,
    fatPerKg: 0.85,
    badge: '-450 kcal',
  },
  {
    id: 'recomp',
    title: 'Recomposición / Mantenimiento',
    shortTitle: 'Mantenimiento',
    desc: 'Normocalórica para perder grasa y ganar músculo gradualmente',
    calDelta: 0,
    proteinPerKg: 2.0,
    fatPerKg: 0.9,
    badge: 'Normocalórica',
  },
  {
    id: 'bulk',
    title: 'Ganar Músculo (Volumen Limpio)',
    shortTitle: 'Volumen Limpio',
    desc: 'Superávit controlado (+300 kcal) para hipertrofia limpia',
    calDelta: 300,
    proteinPerKg: 1.9,
    fatPerKg: 0.95,
    badge: '+300 kcal',
  },
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

function StepperField({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
}) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const nudge = (delta: number) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    onChange(Math.max(min, Math.min(max, value + delta)));
  };

  return (
    <View style={styles.fieldBox}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          onPress={() => nudge(-step)}
          style={[styles.miniStepBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}
        >
          <Minus size={16} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.miniValBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
          <TextInput
            keyboardType="number-pad"
            value={String(value)}
            onChangeText={t => {
              const n = parseInt(t, 10);
              if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
              else onChange(min);
            }}
            style={[styles.miniInput, { color: colors.text }]}
          />
          <Text style={[styles.miniUnit, { color: colors.textSecondary }]}>{unit}</Text>
        </View>
        <TouchableOpacity
          onPress={() => nudge(step)}
          style={[styles.miniStepBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}
        >
          <Plus size={16} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MacroCalculatorScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const contrastColor = getContrastTextColor(colors.tint);

  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState(26);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(176);
  const [activity, setActivity] = useState(1.55);
  const [goalId, setGoalId] = useState('cut');

  const calc = useMemo(() => {
    const w = Math.max(35, Math.min(250, Number(weight) || 70));
    const h = Math.max(120, Math.min(230, Number(height) || 170));
    const a = Math.max(14, Math.min(95, Number(age) || 25));
    const act = Number(activity) || 1.55;
    const goal = GOALS.find(g => g.id === goalId) || GOALS[0];

    const bmr = Math.round(10 * w + 6.25 * h - 5 * a + (sex === 'male' ? 5 : -161));
    const tdee = Math.round(bmr * act);
    const targetCalories = Math.max(1200, tdee + goal.calDelta);

    const proteinGrams = Math.round(w * goal.proteinPerKg);
    const fatGrams = Math.round(w * goal.fatPerKg);
    const proteinCals = proteinGrams * 4;
    const fatCals = fatGrams * 9;
    const remainingCals = Math.max(200, targetCalories - proteinCals - fatCals);
    const carbGrams = Math.round(remainingCals / 4);

    const totalMacroCals = proteinCals + fatCals + carbGrams * 4;
    const proteinPct = Math.round((proteinCals / totalMacroCals) * 100);
    const carbPct = Math.round(((carbGrams * 4) / totalMacroCals) * 100);
    const fatPct = Math.max(10, 100 - proteinPct - carbPct);

    const waterLiters = Math.round((w * 0.04 + (act >= 1.55 ? 0.5 : 0.2)) * 10) / 10;
    const creatineGrams = Math.max(3, Math.round(w * 0.07));

    return {
      bmr,
      tdee,
      targetCalories,
      proteinGrams,
      carbGrams,
      fatGrams,
      proteinPct,
      carbPct,
      fatPct,
      waterLiters,
      creatineGrams,
      goal,
    };
  }, [sex, age, weight, height, activity, goalId]);

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
          title="Calorías y Macros"
          showBackButton
          hideRightButtons
          onBackPress={handleBack}
        />
      }
    >
      <View style={styles.container}>
        <SEOHead title="Calculadora de Calorías y Macros - Pro Fitness Glass" route="/calculadora-calorias-macros" />
        <MaintenanceNoticeBanner />
        <View style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: '#10b9811A', borderColor: '#10b98140' }]}>
            <Utensils size={13} color="#10b981" />
            <Text style={[styles.badgeText, { color: '#10b981' }]}>ECUACIÓN MIFFLIN-ST JEOR</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Calculadora de Calorías y Macros
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Calcula tu metabolismo basal (TMB), gasto diario (TDEE), proteínas, grasas, hidratos, agua y dosis de creatina.
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickNavRow}>
          <Pressable
            onPress={() => router.push('/calculadora-1rm' as any)}
            style={[styles.quickNavPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
          >
            <Calculator size={14} color={colors.tint} />
            <Text style={[styles.quickNavText, { color: colors.text }]}>Calculadora 1RM</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/ejercicios' as any)}
            style={[styles.quickNavPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
          >
            <Dumbbell size={14} color="#a855f7" />
            <Text style={[styles.quickNavText, { color: colors.text }]}>Guía de Ejercicios</Text>
          </Pressable>
        </ScrollView>

        {/* Form Card */}
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SEXO BIOLÓGICO</Text>
          <View style={styles.sexRow}>
            {[
              { id: 'male' as const, label: 'Hombre' },
              { id: 'female' as const, label: 'Mujer' },
            ].map(item => {
              const active = sex === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSex(item.id)}
                  style={[
                    styles.sexBtn,
                    {
                      backgroundColor: active ? colors.tint : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      borderColor: active ? colors.tint : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.sexText, { color: active ? contrastColor : colors.text }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <StepperField label="EDAD" value={age} unit="años" min={14} max={95} onChange={setAge} />
          <StepperField label="PESO CORPORAL" value={weight} unit="kg" min={35} max={250} onChange={setWeight} />
          <StepperField label="ESTATURA" value={height} unit="cm" min={120} max={230} onChange={setHeight} />

          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 4 }]}>NIVEL DE ACTIVIDAD</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {ACTIVITY_LEVELS.map(level => {
              const active = activity === level.value;
              return (
                <TouchableOpacity
                  key={level.value}
                  onPress={() => setActivity(level.value)}
                  style={[
                    styles.actChip,
                    {
                      backgroundColor: active ? colors.tint : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      borderColor: active ? colors.tint : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.actTitle, { color: active ? contrastColor : colors.text }]}>
                    {level.label}
                  </Text>
                  <Text style={[styles.actDesc, { color: active ? contrastColor + 'CC' : colors.textSecondary }]}>
                    {level.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 4 }]}>OBJETIVO NUTRICIONAL</Text>
          <View style={styles.goalsCol}>
            {GOALS.map(g => {
              const active = goalId === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  activeOpacity={0.85}
                  onPress={() => setGoalId(g.id)}
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor: active ? colors.tint + '1A' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      borderColor: active ? colors.tint : colors.border,
                    },
                  ]}
                >
                  <View style={styles.goalHeadRow}>
                    <Text style={[styles.goalTitle, { color: colors.text }]}>{g.title}</Text>
                    <View style={[styles.goalBadge, { backgroundColor: active ? colors.tint : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                      <Text style={[styles.goalBadgeText, { color: active ? contrastColor : colors.textSecondary }]}>{g.badge}</Text>
                    </View>
                  </View>
                  <Text style={[styles.goalDesc, { color: colors.textSecondary }]}>{g.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Calories Result */}
        <GlassCard style={styles.resultCard}>
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.22)', colors.tint + '18']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.resultGradient}
          >
            <View style={styles.resTopRow}>
              <View style={[styles.flameBox, { backgroundColor: '#10b98124' }]}>
                <Flame size={22} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resKicker}>OBJETIVO CALÓRICO DIARIO</Text>
                <Text style={[styles.resGoalSub, { color: colors.textSecondary }]}>{calc.goal.shortTitle}</Text>
              </View>
            </View>

            <View style={styles.bigKcalRow}>
              <Text style={[styles.bigKcal, { color: colors.text }]}>{calc.targetCalories}</Text>
              <Text style={[styles.bigKcalUnit, { color: colors.textSecondary }]}>kcal / día</Text>
            </View>

            <View style={styles.bmrRow}>
              <View style={[styles.bmrPill, { backgroundColor: isDark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.65)', borderColor: colors.border }]}>
                <Text style={[styles.bmrLabel, { color: colors.textSecondary }]}>Metabolismo Basal (TMB)</Text>
                <Text style={[styles.bmrVal, { color: colors.text }]}>{calc.bmr} kcal</Text>
              </View>
              <View style={[styles.bmrPill, { backgroundColor: isDark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.65)', borderColor: colors.border }]}>
                <Text style={[styles.bmrLabel, { color: colors.textSecondary }]}>Mantenimiento (TDEE)</Text>
                <Text style={[styles.bmrVal, { color: colors.text }]}>{calc.tdee} kcal</Text>
              </View>
            </View>
          </LinearGradient>
        </GlassCard>

        {/* Macros Grid */}
        <View style={styles.macrosRow}>
          <GlassCard style={styles.macroCard}>
            <Text style={[styles.macroLabel, { color: '#fb7185' }]}>PROTEÍNA</Text>
            <Text style={[styles.macroGrams, { color: colors.text }]}>{calc.proteinGrams} g</Text>
            <Text style={[styles.macroPct, { color: colors.textSecondary }]}>{calc.proteinPct}% · {calc.goal.proteinPerKg} g/kg</Text>
          </GlassCard>

          <GlassCard style={styles.macroCard}>
            <Text style={[styles.macroLabel, { color: '#f59e0b' }]}>CARBOS</Text>
            <Text style={[styles.macroGrams, { color: colors.text }]}>{calc.carbGrams} g</Text>
            <Text style={[styles.macroPct, { color: colors.textSecondary }]}>{calc.carbPct}% energía</Text>
          </GlassCard>

          <GlassCard style={styles.macroCard}>
            <Text style={[styles.macroLabel, { color: '#38bdf8' }]}>GRASAS</Text>
            <Text style={[styles.macroGrams, { color: colors.text }]}>{calc.fatGrams} g</Text>
            <Text style={[styles.macroPct, { color: colors.textSecondary }]}>{calc.fatPct}% · {calc.goal.fatPerKg} g/kg</Text>
          </GlassCard>
        </View>

        {/* Hydration & Creatine */}
        <View style={styles.suppsRow}>
          <GlassCard style={styles.suppCard}>
            <View style={[styles.suppIconBox, { backgroundColor: '#38bdf81F' }]}>
              <Droplets size={19} color="#38bdf8" />
            </View>
            <Text style={styles.suppKickerWater}>AGUA DIARIA</Text>
            <Text style={[styles.suppVal, { color: colors.text }]}>{calc.waterLiters} L / día</Text>
            <Text style={[styles.suppHint, { color: colors.textSecondary }]}>Hidratación óptima celular</Text>
          </GlassCard>

          <GlassCard style={styles.suppCard}>
            <View style={[styles.suppIconBox, { backgroundColor: '#a855f71F' }]}>
              <FlaskConical size={19} color="#a855f7" />
            </View>
            <Text style={styles.suppKickerCreatine}>CREATINA</Text>
            <Text style={[styles.suppVal, { color: colors.text }]}>{calc.creatineGrams} g / día</Text>
            <Text style={[styles.suppHint, { color: colors.textSecondary }]}>Fórmula ~0.07 g por kg</Text>
          </GlassCard>
        </View>

        {/* CTA to Nutrition */}
        <GlassCard style={styles.card}>
          <View style={styles.ctaHeaderRow}>
            <HeartPulse size={18} color="#10b981" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Controla tus macros al segundo</Text>
          </View>
          <Text style={[styles.goalDesc, { color: colors.textSecondary }]}>
            Usa la cámara IA o el diario nutricional de Pro Fitness Glass para registrar tus platos y alcanzar tu meta diaria.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push((isAuthenticated ? '/(tabs)/nutrition' : '/register') as any)}
            style={[styles.ctaBtn, { backgroundColor: '#10b981' }]}
          >
            <Text style={styles.ctaBtnText}>
              {isAuthenticated ? 'Abrir Mi Nutrición' : 'Controlar Mis Macros Gratis'}
            </Text>
            <ArrowRight size={16} color="#06281e" />
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
  heroTitle: { fontSize: 27, fontWeight: '900', letterSpacing: -0.6 },
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
  card: { padding: 18, gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  sexRow: { flexDirection: 'row', gap: 10 },
  sexBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  sexText: { fontSize: 14, fontWeight: '800' },
  fieldBox: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniStepBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniValBox: {
    flex: 1,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  miniInput: { fontSize: 18, fontWeight: '900', textAlign: 'center', minWidth: 50, paddingVertical: 0 },
  miniUnit: { fontSize: 12.5, fontWeight: '700' },
  chipsScroll: { gap: 8, paddingVertical: 2 },
  actChip: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 14, borderWidth: 1, gap: 2 },
  actTitle: { fontSize: 13, fontWeight: '800' },
  actDesc: { fontSize: 10.5, fontWeight: '600' },
  goalsCol: { gap: 9 },
  goalCard: { padding: 13, borderRadius: 15, borderWidth: 1, gap: 4 },
  goalHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  goalTitle: { fontSize: 13.5, fontWeight: '800', flex: 1 },
  goalBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  goalBadgeText: { fontSize: 10.5, fontWeight: '800' },
  goalDesc: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  resultCard: { padding: 0 },
  resultGradient: { padding: 18, gap: 14 },
  resTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flameBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  resKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7, color: '#10b981' },
  resGoalSub: { fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  bigKcalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  bigKcal: { fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  bigKcalUnit: { fontSize: 16, fontWeight: '800' },
  bmrRow: { flexDirection: 'row', gap: 10 },
  bmrPill: { flex: 1, padding: 11, borderRadius: 14, borderWidth: 1, gap: 2 },
  bmrLabel: { fontSize: 10.5, fontWeight: '700' },
  bmrVal: { fontSize: 15, fontWeight: '900' },
  macrosRow: { flexDirection: 'row', gap: 10 },
  macroCard: { flex: 1, padding: 14, gap: 3, alignItems: 'center' },
  macroLabel: { fontSize: 10.5, fontWeight: '900', letterSpacing: 0.6 },
  macroGrams: { fontSize: 22, fontWeight: '900' },
  macroPct: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  suppsRow: { flexDirection: 'row', gap: 10 },
  suppCard: { flex: 1, padding: 15, gap: 4 },
  suppIconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  suppKickerWater: { fontSize: 10.5, fontWeight: '900', color: '#38bdf8', letterSpacing: 0.6 },
  suppKickerCreatine: { fontSize: 10.5, fontWeight: '900', color: '#a855f7', letterSpacing: 0.6 },
  suppVal: { fontSize: 18, fontWeight: '900' },
  suppHint: { fontSize: 11, fontWeight: '500' },
  ctaHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 2,
  },
  ctaBtnText: { fontSize: 14, fontWeight: '900', color: '#06281e' },
});
