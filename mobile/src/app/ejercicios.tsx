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
import {
  AlertTriangle,
  ArrowRight,
  Bolt,
  Calculator,
  CheckCircle2,
  Dumbbell,
  Layers,
  Search,
  Timer,
  Utensils,
  X,
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

const MUSCLE_GROUPS = ['Todos', 'Pecho', 'Espalda', 'Pierna y Glúteo', 'Hombros', 'Brazos', 'Abdomen y Core'];

const PUBLIC_EXERCISES = [
  {
    id: 'press-banca-barra',
    name: 'Press de Banca Plano con Barra',
    muscleGroup: 'Pecho',
    secondaryMuscles: 'Tríceps braquial, Deltoides anterior',
    equipment: 'Barra olímpica y banco plano',
    difficulty: 'Intermedio',
    idealReps: '5 - 8 reps (Fuerza) | 8 - 12 reps (Hipertrofia)',
    restTime: '2.5 a 3.5 min',
    technique: [
      'Túmbate con los ojos justo debajo de la barra y realiza una retracción escapular.',
      'Apoya los pies firmemente para generar estabilidad (Leg Drive) y mantén los glúteos en el banco.',
      'Baja la barra de forma controlada (2 s) hacia la parte inferior del esternón con los codos a 45°-60°.',
      'Empuja de forma explosiva hacia arriba y ligeramente hacia atrás sin perder la retracción escapular.',
    ],
    commonMistake: 'Abrir los codos a 90° en forma de "T", sobrecargando el manguito rotador del hombro.',
  },
  {
    id: 'press-inclinado-mancuernas',
    name: 'Press Inclinado con Mancuernas (30°)',
    muscleGroup: 'Pecho',
    secondaryMuscles: 'Deltoides anterior, Tríceps',
    equipment: 'Mancuernas y banco inclinado a 30°',
    difficulty: 'Principiante / Intermedio',
    idealReps: '8 - 12 repeticiones',
    restTime: '2 a 3 min',
    technique: [
      'Ajusta el respaldo a 30° para enfatizar la porción clavicular sin que el hombro domine.',
      'Baja las mancuernas con control permitiendo un estiramiento profundo del pectoral.',
      'Empuja convergiendo ligeramente arriba sin chocar las mancuernas para mantener tensión constante.',
    ],
    commonMistake: 'Colocar el banco demasiado vertical (45° o 60°), convirtiéndolo en un press de hombros.',
  },
  {
    id: 'sentadilla-libre-barra',
    name: 'Sentadilla Libre con Barra (Back Squat)',
    muscleGroup: 'Pierna y Glúteo',
    secondaryMuscles: 'Glúteo mayor, Aductores, Erectores espinales, Core',
    equipment: 'Barra olímpica y Rack / Jaula',
    difficulty: 'Intermedio / Avanzado',
    idealReps: '5 - 8 reps (Fuerza) | 8 - 10 reps (Hipertrofia)',
    restTime: '3 a 4 min',
    technique: [
      'Apoya la barra sobre trapecios o deltoides posterior sujetándola con firmeza.',
      'Toma aire hacia el abdomen (Valsalva) para compactar el core a 360° antes de bajar.',
      'Flexiona rodillas y cadera manteniendo toda la planta del pie anclada hasta romper el paralelo.',
      'Empuja el suelo manteniendo rodillas alineadas con la punta de los pies.',
    ],
    commonMistake: 'Dejar que las rodillas colapsen hacia adentro (valgo) o despegar talones al bajar.',
  },
  {
    id: 'sentadilla-bulgara',
    name: 'Sentadilla Búlgara con Mancuernas',
    muscleGroup: 'Pierna y Glúteo',
    secondaryMuscles: 'Cuádriceps, Glúteo mayor y medio, Isquiosurales',
    equipment: 'Mancuernas y banco trasero',
    difficulty: 'Intermedio',
    idealReps: '8 - 12 reps por pierna',
    restTime: '90 s entre piernas',
    technique: [
      'Apoya el empeine trasero en un banco y da un paso adelante.',
      'Para cuádriceps: torso erguido. Para glúteo: inclina el tronco 20° hacia adelante.',
      'Desciende hasta casi tocar con la rodilla trasera el suelo y empuja con la pierna delantera.',
    ],
    commonMistake: 'Empujar con la pierna trasera apoyada en lugar de concentrar la carga delante.',
  },
  {
    id: 'peso-muerto-rumano',
    name: 'Peso Muerto Rumano (RDL)',
    muscleGroup: 'Pierna y Glúteo',
    secondaryMuscles: 'Isquiosurales, Glúteo mayor, Erectores, Dorsal',
    equipment: 'Barra olímpica o mancuernas pesadas',
    difficulty: 'Intermedio',
    idealReps: '6 - 10 repeticiones',
    restTime: '2.5 a 3 min',
    technique: [
      'Inicia de pie con rodillas ligeramente desbloqueadas (15° fijos).',
      'Lleva la cadera atrás con la barra pegada a muslos y espinillas manteniendo espalda neutra.',
      'Detén la bajada cuando tu cadera deje de ir atrás y extiende contrayendo glúteos e isquios.',
    ],
    commonMistake: 'Bajar hasta el suelo doblando la columna lumbar en lugar de detenerse al fin del rango de cadera.',
  },
  {
    id: 'hip-thrust-barra',
    name: 'Hip Thrust con Barra',
    muscleGroup: 'Pierna y Glúteo',
    secondaryMuscles: 'Glúteo mayor, Isquiosurales, Cuádriceps',
    equipment: 'Barra olímpica, almohadilla y banco estable',
    difficulty: 'Principiante / Intermedio',
    idealReps: '8 - 12 repeticiones',
    restTime: '2 a 3 min',
    technique: [
      'Apoya la parte inferior de escápulas en el banco y la barra acolchada en el pliegue de la cadera.',
      'Alinea los pies para que arriba las tibias queden verticales a 90° en la rodilla.',
      'Sube con mentón recogido y haz una pausa de 1 segundo arriba apretando glúteo.',
    ],
    commonMistake: 'Arquear la espalda baja mirando al techo en vez de mantener costillas bajas.',
  },
  {
    id: 'dominadas-pronas-lastradas',
    name: 'Dominadas Pronas y Jalón al Pecho',
    muscleGroup: 'Espalda',
    secondaryMuscles: 'Dorsal ancho, Redondo mayor, Bíceps, Trapecio inferior',
    equipment: 'Barra de dominadas o Polea alta',
    difficulty: 'Intermedio',
    idealReps: '6 - 10 reps (Dominadas) | 8 - 12 reps (Jalón)',
    restTime: '2 a 3 min',
    technique: [
      'Agarre ligeramente superior al ancho de hombros.',
      'Inicia deprimiendo escápulas antes de flexionar los codos.',
      'Tira llevando los codos hacia tus bolsillos traseros hasta pasar la barbilla o tocar el pecho alto.',
    ],
    commonMistake: 'Tirar solo con los bíceps encogiendo hombros hacia las orejas.',
  },
  {
    id: 'remo-con-barra',
    name: 'Remo con Barra y Remo en Polea',
    muscleGroup: 'Espalda',
    secondaryMuscles: 'Dorsal ancho, Romboides, Trapecio medio, Deltoides posterior',
    equipment: 'Barra olímpica o Polea baja',
    difficulty: 'Intermedio',
    idealReps: '6 - 10 reps (Barra) | 10 - 12 reps (Polea)',
    restTime: '2 a 3 min',
    technique: [
      'Inclina el torso entre 45° y 75° manteniendo columna neutra y abdomen firme.',
      'Tracciona hacia la boca del estómago u ombligo dirigiendo los codos hacia atrás.',
      'Controla la bajada dejando que las escápulas se abran ligeramente en el estiramiento.',
    ],
    commonMistake: 'Usar impulso lumbar levantando el torso en cada repetición.',
  },
  {
    id: 'press-militar-hombros',
    name: 'Press Militar con Barra o Mancuernas',
    muscleGroup: 'Hombros',
    secondaryMuscles: 'Deltoides anterior y lateral, Tríceps, Trapecio superior',
    equipment: 'Barra olímpica o Mancuernas',
    difficulty: 'Intermedio',
    idealReps: '6 - 10 repeticiones',
    restTime: '2 a 3 min',
    technique: [
      'Coloca los codos ligeramente adelantados (plano escapular, ~30°).',
      'Aprieta glúteos y abdomen para evitar hiperextensión lumbar.',
      'Empuja verticalmente pasando cerca del rostro y mete ligeramente la cabeza arriba.',
    ],
    commonMistake: 'Abrir demasiado los codos hacia los lados o impulsar con las piernas.',
  },
  {
    id: 'elevaciones-laterales-polea-mancuerna',
    name: 'Elevaciones Laterales con Mancuernas o Polea',
    muscleGroup: 'Hombros',
    secondaryMuscles: 'Deltoides lateral (haz medio)',
    equipment: 'Mancuernas o Polea baja',
    difficulty: 'Principiante',
    idealReps: '12 - 16 reps controladas',
    restTime: '90 s a 2 min',
    technique: [
      'Eleva los brazos en el plano escapular (15°-20° hacia adelante).',
      'Piensa en alejar las manos hacia las paredes laterales para que el trapecio no robe tensión.',
      'Sube hasta la altura de hombros y baja en 2 segundos.',
    ],
    commonMistake: 'Cargar demasiado peso y balancear la cadera para subir.',
  },
  {
    id: 'curl-biceps-inclinado-barra-z',
    name: 'Curl de Bíceps Inclinado y Barra Z',
    muscleGroup: 'Brazos',
    secondaryMuscles: 'Bíceps braquial, Braquial',
    equipment: 'Mancuernas en banco a 45°-60° o Barra Z',
    difficulty: 'Principiante',
    idealReps: '8 - 12 repeticiones',
    restTime: '90 s a 2 min',
    technique: [
      'Mantén el hombro fijo y el codo estable al costado o ligeramente retrasado en banco inclinado.',
      'Flexiona el codo supinando la muñeca y extiende el brazo por completo en cada repetición.',
    ],
    commonMistake: 'Adelantar los codos al subir o acortar la parte baja del recorrido.',
  },
  {
    id: 'extension-triceps-polea-katana',
    name: 'Extensión de Tríceps en Polea y Trasnuca',
    muscleGroup: 'Brazos',
    secondaryMuscles: 'Tríceps braquial (cabeza lateral, medial y larga)',
    equipment: 'Polea con cuerda o barra recta',
    difficulty: 'Principiante',
    idealReps: '10 - 15 repeticiones',
    restTime: '90 s a 2 min',
    technique: [
      'Combina extensiones con codos pegados y trasnuca para estirar la cabeza larga del tríceps.',
      'Mantén los codos fijos como bisagras moviendo únicamente el antebrazo.',
    ],
    commonMistake: 'Mover los hombros y echar el peso corporal encima de la cuerda.',
  },
  {
    id: 'crunch-polea-rueda-abdominal',
    name: 'Crunch Abdominal en Polea Alta y Ab Wheel',
    muscleGroup: 'Abdomen y Core',
    secondaryMuscles: 'Recto abdominal, Oblicuos, Transverso',
    equipment: 'Polea alta con cuerda o Rueda Abdominal',
    difficulty: 'Intermedio',
    idealReps: '10 - 15 reps con sobrecarga',
    restTime: '90 segundos',
    technique: [
      'De rodillas frente a la polea, mantén cadera fija y enrolla tu columna llevando el esternón hacia la pelvis.',
      'Expulsa el aire al contraer para maximizar el reclutamiento del recto abdominal.',
    ],
    commonMistake: 'Flexionar la cadera sentándose sobre los talones con la espalda recta.',
  },
];

const POPULAR_SPLITS = [
  {
    name: 'Push Pull Legs (Empuje - Tirón - Pierna)',
    days: '3 o 6 días / semana',
    goal: 'Hipertrofia y Fuerza Óptima',
    desc: 'Día 1 Empuje (Pecho, Hombro, Tríceps), Día 2 Tirón (Espalda, Bíceps, Deltoides posterior) y Día 3 Pierna completa y Glúteo.',
  },
  {
    name: 'Torso - Pierna (Upper / Lower)',
    days: '4 días / semana',
    goal: 'Máxima Recuperación y Frecuencia 2',
    desc: 'Entrena cada grupo muscular 2 veces por semana con 3 días de descanso completos.',
  },
  {
    name: 'Full Body Científica',
    days: '3 días / semana (L - X - V)',
    goal: 'Eficiencia, Principiantes e Intermedios',
    desc: 'Estimula todo el cuerpo en cada sesión priorizando multiarticulares clave.',
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

export default function PublicExercisesScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const contrastColor = getContrastTextColor(colors.tint);

  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PUBLIC_EXERCISES.filter(ex => {
      const matchesGroup = selectedMuscle === 'Todos' || ex.muscleGroup === selectedMuscle;
      const matchesSearch =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        ex.secondaryMuscles.toLowerCase().includes(q);
      return matchesGroup && matchesSearch;
    });
  }, [selectedMuscle, searchQuery]);

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
          title="Guía de Ejercicios"
          showBackButton
          hideRightButtons
          onBackPress={handleBack}
        />
      }
    >
      <View style={styles.container}>
        <SEOHead title="Guía de Ejercicios y Rutinas - Pro Fitness Glass" route="/ejercicios" />
        <MaintenanceNoticeBanner />
        <View style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: colors.tint + '1A', borderColor: colors.tint + '40' }]}>
            <Dumbbell size={13} color={colors.tint} />
            <Text style={[styles.badgeText, { color: colors.tint }]}>ENCICLOPEDIA TÉCNICA DE HIPERTROFIA</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Mejores Ejercicios por Grupo Muscular
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Ejecución biomecánica paso a paso, series óptimas, descansos y errores comunes que evitar.
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
            onPress={() => router.push('/calculadora-calorias-macros' as any)}
            style={[styles.quickNavPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
          >
            <Utensils size={14} color="#10b981" />
            <Text style={[styles.quickNavText, { color: colors.text }]}>Calculadora Macros</Text>
          </Pressable>
        </ScrollView>

        {/* Search + Filter */}
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
            placeholder="Buscar ejercicio o músculo (ej. Press, Glúteo)..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsRow}>
          {MUSCLE_GROUPS.map(group => {
            const active = selectedMuscle === group;
            return (
              <TouchableOpacity
                key={group}
                onPress={() => setSelectedMuscle(group)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: active ? colors.tint : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    borderColor: active ? colors.tint : colors.border,
                  },
                ]}
              >
                <Text style={[styles.catText, { color: active ? contrastColor : colors.text }]}>{group}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Exercises List */}
        {filteredExercises.map(ex => (
          <GlassCard key={ex.id} style={styles.exCard}>
            <View style={styles.exTopRow}>
              <View style={[styles.musclePill, { backgroundColor: colors.tint + '1D' }]}>
                <Text style={[styles.musclePillText, { color: colors.tint }]}>{ex.muscleGroup}</Text>
              </View>
              <Text style={[styles.diffText, { color: colors.textSecondary }]}>{ex.difficulty}</Text>
            </View>

            <Text style={[styles.exTitle, { color: colors.text }]}>{ex.name}</Text>
            <Text style={[styles.exMeta, { color: colors.textSecondary }]}>
              Sinergistas: {ex.secondaryMuscles} · {ex.equipment}
            </Text>

            <View style={styles.statsBar}>
              <View style={[styles.statPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}>
                <Text style={[styles.statText, { color: colors.text }]}>{ex.idealReps}</Text>
              </View>
              <View style={[styles.statPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}>
                <Timer size={12} color={colors.tint} />
                <Text style={[styles.statText, { color: colors.text }]}>{ex.restTime}</Text>
              </View>
            </View>

            <View style={styles.stepsCol}>
              {ex.technique.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <CheckCircle2 size={14} color="#10b981" style={{ marginTop: 2 }} />
                  <Text style={[styles.stepText, { color: colors.textSecondary }]}>{step}</Text>
                </View>
              ))}
            </View>

            <View style={styles.mistakeBox}>
              <AlertTriangle size={14} color="#f59e0b" style={{ marginTop: 1 }} />
              <Text style={styles.mistakeText}>
                <Text style={{ fontWeight: '800' }}>Error común: </Text>
                {ex.commonMistake}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push((isAuthenticated ? '/(tabs)/routines' : '/register') as any)}
              style={[styles.addBtn, { backgroundColor: colors.tint }]}
            >
              <Text style={[styles.addBtnText, { color: contrastColor }]}>Añadir a mi rutina</Text>
              <ArrowRight size={15} color={contrastColor} />
            </TouchableOpacity>
          </GlassCard>
        ))}

        {/* Splits */}
        <View style={styles.splitsHead}>
          <View style={[styles.splitBadge, { backgroundColor: 'rgba(168, 85, 247, 0.14)', borderColor: 'rgba(168, 85, 247, 0.35)' }]}>
            <Layers size={13} color="#a855f7" />
            <Text style={[styles.badgeText, { color: '#a855f7' }]}>ESTRUCTURAS SEMANALES</Text>
          </View>
          <Text style={[styles.heroTitle, { fontSize: 22, color: colors.text }]}>
            Distribuciones de Rutina Recomendadas
          </Text>
        </View>

        {POPULAR_SPLITS.map(split => (
          <GlassCard key={split.name} style={styles.splitCard}>
            <View style={styles.splitDaysPill}>
              <Text style={styles.splitDaysText}>{split.days}</Text>
            </View>
            <Text style={[styles.exTitle, { color: colors.text }]}>{split.name}</Text>
            <Text style={[styles.splitGoal, { color: colors.tint }]}>{split.goal}</Text>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>{split.desc}</Text>
          </GlassCard>
        ))}

        <GlassCard style={styles.exCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Bolt size={18} color={colors.tint} />
            <Text style={[styles.exTitle, { color: colors.text }]}>Catálogo completo en la App</Text>
          </View>
          <Text style={[styles.stepText, { color: colors.textSecondary }]}>
            Accede a más de 300 ejercicios con vídeos, animaciones anatómicas y seguimiento automático de marcas personales.
          </Text>
          <TouchableOpacity
            onPress={() => router.push((isAuthenticated ? '/(tabs)/routines' : '/register') as any)}
            style={[styles.addBtn, { backgroundColor: colors.tint }]}
          >
            <Text style={[styles.addBtnText, { color: contrastColor }]}>
              {isAuthenticated ? 'Ir a Mis Rutinas' : 'Empezar Gratis'}
            </Text>
            <ArrowRight size={15} color={contrastColor} />
          </TouchableOpacity>
        </GlassCard>
        <PublicPageFooter />
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
  exCard: { padding: 17, gap: 10 },
  exTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  musclePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  musclePillText: { fontSize: 11, fontWeight: '800' },
  diffText: { fontSize: 11.5, fontWeight: '700' },
  exTitle: { fontSize: 17.5, fontWeight: '900', letterSpacing: -0.3 },
  exMeta: { fontSize: 12, fontWeight: '500' },
  statsBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  statText: { fontSize: 11.5, fontWeight: '700' },
  stepsCol: { gap: 7, marginTop: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  stepText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  mistakeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  mistakeText: { flex: 1, fontSize: 12, lineHeight: 17, color: '#f59e0b', fontWeight: '500' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: 13,
    marginTop: 2,
  },
  addBtnText: { fontSize: 13, fontWeight: '800' },
  splitsHead: { gap: 6, marginTop: 6 },
  splitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  splitCard: { padding: 17, gap: 6 },
  splitDaysPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  splitDaysText: { fontSize: 11, fontWeight: '800', color: '#a855f7' },
  splitGoal: { fontSize: 12.5, fontWeight: '800' },
});
