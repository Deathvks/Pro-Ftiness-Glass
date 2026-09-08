
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { 
    Flame, Play, Target, ChevronRight, Clock, Droplet, Beef, Trophy, Plus, Check, Zap, Footprints, 
    Activity as ActivityIcon, Info, Dumbbell, LayoutGrid, Sparkles, User, Lightbulb, Scale, AlertTriangle, TrendingUp, ArrowUp, ArrowDown, Minus, CheckCircle
} from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

// Lógica de Niveles Progresiva
const getXpRequiredForLevel = (level) => {
    if (level <= 1) return 0;
    return 50 * Math.pow(level, 2) + 350 * level - 400;
};
const getLevelProgress = (currentXp, currentLevel) => {
    const nextLevelTotalXp = getXpRequiredForLevel(currentLevel + 1);
    const progressPercent = Math.min(100, Math.max(0, (currentXp / nextLevelTotalXp) * 100));
    return {
        currentXp: Math.floor(currentXp),
        nextLevelXp: Math.floor(nextLevelTotalXp),
        progressPercent: progressPercent || 0
    };
};

const dayLetters = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const todayIndex = (new Date().getDay() + 6) % 7; 

export default function Dashboard() {
  const router = useRouter();
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = Colors[theme] || Colors.oled;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  
  const userProfile = useAppStore(state => state.userProfile || state.user);
  const gamification = useAppStore(state => state.gamification) || {};
  const bodyWeightLog = useAppStore(state => state.bodyWeightLog) || [];
  const routines = useAppStore(state => state.routines) || [];
  const activeWorkout = useAppStore(state => state.activeWorkout);
  const workoutLog = useAppStore(state => state.workoutLog) || [];

  const [aiLimit, setAiLimit] = useState(5);
  const [aiRemaining, setAiRemaining] = useState(5);

  const levelData = useMemo(() => {
      const level = gamification?.level || 1;
      const xp = gamification?.xp || 0;
      return getLevelProgress(xp, level);
  }, [gamification]);

  // Mock targets para demo
  const targets = { calories: 2500, protein: 150, water: 2500, creatine: 5 };
  const nutritionTotals = { calories: 0, protein: 0, water: 1000, creatine: 5 };

  const weeklyStats = useMemo(() => {
      try {
        const workoutsThisWeek = 3;
        const totalMinutes = 125;
        const totalCalories = 850;
        
        return {
            workouts: workoutsThisWeek,
            time: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
            calories: totalCalories,
            days: [false, true, false, true, false, false, false]
        };
      } catch (e) {
        return { workouts: 0, time: '0h 0m', calories: 0, days: [false,false,false,false,false,false,false] };
      }
  }, [workoutLog]);

  const latestWeight = bodyWeightLog.length > 0 ? parseFloat(bodyWeightLog[0].weight_kg).toFixed(1) : '--';
  const previousWeight = bodyWeightLog.length > 1 ? parseFloat(bodyWeightLog[1].weight_kg).toFixed(1) : null;
  const weightTrend = useMemo(() => {
    if (!previousWeight || latestWeight === '--') return null;
    const diff = latestWeight - previousWeight;
    if (Math.abs(diff) < 0.1) return { icon: Minus, color: colors.textSecondary };
    // Asumiendo que bajar peso es 'bueno' por defecto visual
    return diff < 0 ? { icon: ArrowDown, color: colors.success } : { icon: ArrowUp, color: colors.warning };
  }, [latestWeight, previousWeight, colors]);

  const insights = useMemo(() => {
      const alerts = [];
      const daysSinceLastWorkout = workoutLog.length > 0 ? Math.floor((new Date() - new Date(workoutLog[0].workout_date))/(1000*60*60*24)) : 999;
      
      if (daysSinceLastWorkout > 3 && workoutLog.length > 0) {
          alerts.push({
              id: 'inactivity',
              type: 'warning',
              icon: Flame,
              title: '¡Hora de moverse!',
              message: `Llevas ${daysSinceLastWorkout} días sin entrenar. No pierdas el ritmo, haz aunque sea una sesión rápida.`,
              colorClass: colors.warning + '22',
              iconColor: colors.warning
          });
      } else if (workoutLog.length === 0) {
          alerts.push({
              id: 'welcome',
              type: 'info',
              icon: Dumbbell,
              title: '¡Empieza tu camino!',
              message: 'Ve a la sección de rutinas y registra tu primer entrenamiento.',
              colorClass: colors.tint + '22',
              iconColor: colors.tint
          });
      }
      return alerts;
  }, [workoutLog, colors]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={{ flex: 1 }}>
        
        {/* GLOBAL HEADER MOCK (Like MainAppLayout) */}
        <View style={styles.globalHeader}>
            <TouchableOpacity style={styles.profileBtn}>
               <User size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
               <Text style={styles.logoText}>PRO FITNESS</Text>
            </View>

            <TouchableOpacity style={styles.aiBtn}>
                <Sparkles size={14} color="#fff" />
                <Text style={styles.aiBtnText}>{aiRemaining}/{aiLimit}</Text>
            </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.name}>{userProfile?.username || 'Atleta'}</Text>
          </View>
        </View>

        {/* 1. ASISTENTE VIRTUAL (INSIGHTS) */}
        {insights.map(insight => {
            const Icon = insight.icon;
            return (
                <View key={insight.id} style={[styles.insightCard, { backgroundColor: insight.colorClass }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Icon size={24} color={insight.iconColor} style={{ marginRight: 12, marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.insightTitle, { color: insight.iconColor }]}>{insight.title}</Text>
                            <Text style={styles.insightMessage}>{insight.message}</Text>
                        </View>
                    </View>
                </View>
            );
        })}

        {/* 2. GAMIFICATION (XP) */}
        <TouchableOpacity style={styles.levelCard} onPress={() => alert('Abrir modal de XP')}>
          <View style={styles.levelHeader}>
            <View style={styles.levelIconBadge}>
              <Trophy size={24} color={colors.success} />
            </View>
            <View style={{ marginLeft: 15, flex: 1 }}>
              <Text style={styles.levelTitle}>Nivel {gamification?.level || 1}</Text>
              <Text style={styles.levelSub}>{levelData.currentXp} / {levelData.nextLevelXp} XP</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${levelData.progressPercent}%` }]} />
          </View>
        </TouchableOpacity>

        {/* 3. RESUMEN SEMANAL */}
        <View style={styles.statsCard}>
          <View style={styles.weekRow}>
            {dayLetters.map((letter, i) => (
              <View key={i} style={styles.dayCol}>
                <Text style={[styles.dayLetter, todayIndex === i && { color: colors.tint }]}>{letter}</Text>
                <View style={[styles.dayCircle, weeklyStats.days[i] && styles.dayCircleActive]}>
                  {weeklyStats.days[i] && <Check size={12} color="#fff" strokeWidth={3} />}
                </View>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', marginTop: 25, gap: 10 }}>
            <View style={[styles.bentoCard, { flex: 1 }]}>
               <View style={styles.bentoIconWrapper}><Clock size={20} color={colors.tint} /></View>
               <Text style={styles.bentoValue}>{weeklyStats.time}</Text>
               <Text style={styles.bentoLabel}>Activo Semanal</Text>
            </View>
            <View style={[styles.bentoCard, { flex: 1 }]}>
               <View style={[styles.bentoIconWrapper, { backgroundColor: colors.warning + '22' }]}><Flame size={20} color={colors.warning} /></View>
               <Text style={styles.bentoValue}>{weeklyStats.calories}</Text>
               <Text style={styles.bentoLabel}>Kcal quemadas</Text>
            </View>
          </View>
        </View>

        {/* 4. RUTINAS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tus Rutinas</Text>
            <TouchableOpacity><Text style={styles.seeAll}>Ver todas</Text></TouchableOpacity>
          </View>

          {routines.slice(0, 3).map(routine => {
            const isActive = activeWorkout?.id === routine.id;
            return (
              <TouchableOpacity key={routine.id} style={[styles.routineCard, isActive && styles.routineCardActive]}>
                <View style={[styles.routineIconWrapper, isActive && { backgroundColor: colors.tint + '33' }]}>
                  {isActive ? <Clock size={20} color={colors.tint} /> : <Play size={20} color={colors.textSecondary} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.routineName, isActive && styles.routineNameActive]}>{routine.name}</Text>
                  <Text style={styles.routineSub}>{isActive ? 'En curso' : 'Iniciar entrenamiento'}</Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )
          })}
          {routines.length === 0 && (
              <View style={styles.emptyCard}>
                 <Text style={styles.emptyText}>No tienes rutinas creadas.</Text>
              </View>
          )}
        </View>

        {/* 5. NUTRICIÓN COMPLETA */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nutrición y Hábitos</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            {/* Water */}
            <TouchableOpacity style={styles.macroCard} onPress={() => alert('Abrir agua')}>
              <Droplet size={24} color="#3b82f6" style={{ marginRight: 15 }} />
              <View>
                <Text style={styles.macroValue}>{nutritionTotals.water} ml</Text>
                <Text style={styles.macroLabel}>/ {targets.water} ml</Text>
              </View>
            </TouchableOpacity>
            {/* Creatina */}
            <TouchableOpacity style={styles.macroCard} onPress={() => alert('Abrir creatina')}>
              <Zap size={24} color="#a78bfa" style={{ marginRight: 15 }} />
              <View>
                <Text style={styles.macroValue}>{nutritionTotals.creatine} g</Text>
                <Text style={styles.macroLabel}>/ {targets.creatine} g</Text>
              </View>
            </TouchableOpacity>
             {/* Calorias */}
             <View style={styles.macroCard}>
              <Target size={24} color={colors.tint} style={{ marginRight: 15 }} />
              <View>
                <Text style={styles.macroValue}>{targets.calories}</Text>
                <Text style={styles.macroLabel}>Kcal diarias</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* 6. CARDIO RÁPIDO */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cardio Rápido</Text>
          </View>
          <View style={styles.cardioGrid}>
            <TouchableOpacity style={styles.cardioBtn} onPress={() => alert('Correr')}>
              <View style={styles.cardioIconWrapper}><Footprints size={24} color={colors.success} /></View>
              <Text style={styles.cardioText}>Correr</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cardioBtn} onPress={() => alert('Bici')}>
              <View style={styles.cardioIconWrapper}><ActivityIcon size={24} color={colors.warning} /></View>
              <Text style={styles.cardioText}>Bicicleta</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. PESO CORPORAL */}
        <TouchableOpacity style={styles.weightCard} onPress={() => alert('Registrar peso')}>
          <View style={styles.weightInfo}>
            <View style={{ marginRight: 20 }}>
              <Text style={styles.weightLabel}>PESO ACTUAL</Text>
              <Text style={styles.weightValue}>{latestWeight} kg</Text>
            </View>
            {weightTrend && <weightTrend.icon size={20} color={weightTrend.color} />}
          </View>
          <View style={styles.addWeightBtn}>
            <Plus size={24} color={colors.text} />
          </View>
        </TouchableOpacity>

      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 20 },
  globalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background },
  profileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  logoContainer: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: -1 },
  logoText: { color: colors.text, fontSize: 16, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.tint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, shadowColor: colors.tint, shadowOffset: {width:0, height:2}, shadowOpacity: 0.4, shadowRadius: 4, elevation: 3 },
  aiBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 20 },
  greeting: { color: colors.textSecondary, fontSize: 16, marginBottom: 4 },
  name: { color: colors.text, fontSize: 28, fontWeight: '900' },
  
  insightCard: { padding: 16, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  insightTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  insightMessage: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  
  levelCard: { backgroundColor: colors.card, padding: 24, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  levelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  levelIconBadge: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.success + '22', alignItems: 'center', justifyContent: 'center' },
  levelTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  levelSub: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  progressBarBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.success, borderRadius: 4 },
  
  statsCard: { backgroundColor: colors.card, padding: 24, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center' },
  dayLetter: { color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  dayCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dayCircleActive: { backgroundColor: colors.tint, borderColor: colors.tint },
  
  bentoCard: { backgroundColor: colors.background, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  bentoIconWrapper: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.tint + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  bentoValue: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  bentoLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  
  macroCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 16, borderRadius: 20, marginRight: 15, minWidth: 150, borderWidth: 1, borderColor: colors.border },
  macroValue: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  macroLabel: { color: colors.textSecondary, fontSize: 12 },
  
  weightCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, padding: 20, borderRadius: 24, marginBottom: 30, borderWidth: 1, borderColor: colors.border },
  weightInfo: { flexDirection: 'row', alignItems: 'center' },
  weightLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  weightValue: { color: colors.text, fontSize: 28, fontWeight: '900' },
  addWeightBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  seeAll: { color: colors.tint, fontSize: 14, fontWeight: 'bold' },
  
  routineCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 16, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  routineCardActive: { borderColor: colors.tint, borderWidth: 1, backgroundColor: colors.tint + '11' },
  routineIconWrapper: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  routineName: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  routineNameActive: { color: colors.tint },
  routineSub: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  
  emptyCard: { backgroundColor: colors.card, padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
  
  cardioGrid: { flexDirection: 'row', gap: 15 },
  cardioBtn: { flex: 1, backgroundColor: colors.card, borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cardioIconWrapper: { width: 56, height: 56, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardioText: { color: colors.text, fontSize: 16, fontWeight: 'bold' }
});
