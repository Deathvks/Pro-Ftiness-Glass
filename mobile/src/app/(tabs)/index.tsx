import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { Flame, Play, Target, ChevronRight, Clock, Droplet, Beef, Trophy, Plus, Check, Zap, Footprints, Activity as ActivityIcon, Info, Dumbbell, LayoutGrid } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

const { width } = Dimensions.get('window');

// Lógica de Niveles Progresiva (IGUAL QUE EN LA WEB)
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

// Helper fechas
const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const d1Date = new Date(d1);
  const d2Date = new Date(d2);
  return d1Date.getFullYear() === d2Date.getFullYear() &&
         d1Date.getMonth() === d2Date.getMonth() &&
         d1Date.getDate() === d2Date.getDate();
};

export default function Dashboard() {
  const userProfile = useAppStore(state => state.userProfile) || useAppStore(state => state.user);
  const gamification = useAppStore(state => state.gamification) || { streak: 0, level: 1, xp: 0 };
  const routines = useAppStore(state => state.routines) || [];
  const activeWorkout = useAppStore(state => state.activeWorkout);
  const workoutLog = useAppStore(state => state.workoutLog) || [];
  const waterLog = useAppStore(state => state.waterLog);
  const todaysCreatineLog = useAppStore(state => state.todaysCreatineLog) || [];
  const bodyWeightLog = useAppStore(state => state.bodyWeightLog) || [];
  const nutritionLog = useAppStore(state => state.nutritionLog) || [];
  
  const router = useRouter();

  const levelData = useMemo(() => {
      const level = gamification?.level || 1;
      const xp = gamification?.xp || 0;
      return getLevelProgress(xp, level);
  }, [gamification]);

  const latestWeight = bodyWeightLog?.length > 0 ? parseFloat(bodyWeightLog[0].weight_kg).toFixed(1) : null;
  const waterGlasses = waterLog?.quantity_ml ? Math.floor(waterLog.quantity_ml / 250) : 0;
  const hasCreatine = todaysCreatineLog?.length > 0;

  const nutritionTotals = useMemo(() => {
    try {
      return (Array.isArray(nutritionLog) ? nutritionLog : []).reduce((acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (parseFloat(log.protein_g) || 0)
      }), { calories: 0, protein: 0 });
    } catch (e) {
      console.error("Nutrition crash:", e);
      return { calories: 0, protein: 0 };
    }
  }, [nutritionLog]);

  const targets = useMemo(() => {
    try {
      const { gender, age, height, activity_level = 1.2, goal } = userProfile || {};
      if (!latestWeight || !height || !age || !gender || !goal) return { calories: 0, protein: 0, water: 0, sugar: 0 };
      let bmr = (10 * latestWeight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
      let cal = Math.round(bmr * activity_level);
      if (goal === 'lose') cal -= 500;
      else if (goal === 'gain') cal += 300;
      return { calories: cal, protein: Math.round(latestWeight * (goal === 'lose' ? 2.2 : goal === 'gain' ? 2.0 : 1.8)) };
    } catch (e) {
      console.error("Targets crash:", e);
      return { calories: 0, protein: 0, water: 0, sugar: 0 };
    }
  }, [userProfile, latestWeight]);

  // Cálculos semanales para las estadísticas (igual que web)
  const weeklyStats = useMemo(() => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay() || 7; 
      startOfWeek.setDate(startOfWeek.getDate() - day + 1);
      startOfWeek.setHours(0,0,0,0);
      
      let wSessions = 0;
      let wCalories = 0;
      let wTime = 0;

      if (Array.isArray(workoutLog)) {
        workoutLog.forEach(log => {
            const logDate = new Date(log.workout_date || log.created_at);
            if (logDate >= startOfWeek) {
                wSessions++;
                wCalories += (log.calories_burned || 0);
                wTime += (log.duration_seconds || 0);
            }
        });
      }

      const hours = Math.floor(wTime / 3600);
      const minutes = Math.floor((wTime % 3600) / 60);
      const timeDisplay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      return { sessions: wSessions, calories: wCalories, timeDisplay };
    } catch (e) {
      console.error("WeeklyStats crash:", e);
      return { sessions: 0, calories: 0, timeDisplay: '0m' };
    }
  }, [workoutLog]);

  const weekDays = useMemo(() => {
    const now = new Date();
    const day = now.getDay() || 7; 
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - day + 1);
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        days.push(d);
    }
    return days;
  }, []);

  const dayLetters = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const handleQuickCardio = (name) => {
    alert(`Iniciando Cardio: ${name}`);
  };

  const renderRoutine = (routine) => {
    const isActive = activeWorkout && activeWorkout.id === routine.id;
    return (
      <TouchableOpacity key={routine.id} style={[styles.routineCard, isActive && styles.routineCardActive]}>
        <View style={[styles.routineIconWrapper, isActive && {backgroundColor: '#1e3a8a33'}]}>
          {isActive ? <Clock size={20} color='#3b82f6' /> : <Play size={20} color='#fff' fill='#fff' />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.routineName, isActive && styles.routineNameActive]} numberOfLines={1}>{routine.name}</Text>
          <Text style={styles.routineSub}>{isActive ? 'En curso' : 'Iniciar entrenamiento'}</Text>
        </View>
        <ChevronRight size={20} color='#555' />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {userProfile?.name || userProfile?.username || 'Atleta'} 👋</Text>
            <Text style={styles.name}>¿Qué entrenamos hoy?</Text>
          </View>
          <View style={styles.streakBadge}>
            <Flame color='#f97316' size={20} fill='#f97316' />
            <Text style={styles.streakText}>{gamification?.streak || 0}</Text>
          </View>
        </View>

        {/* 1. GAMIFICACIÓN (XP y Nivel) */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelIconBadge}>
              <Target color='#22c55e' size={24} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={styles.levelTitle}>Nivel {gamification?.level || 1}</Text>
                  <TouchableOpacity><Info size={18} color="#888" /></TouchableOpacity>
              </View>
              <Text style={styles.levelSub}>{levelData.currentXp} / {levelData.nextLevelXp} XP</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${levelData.progressPercent}%` }]} />
          </View>
        </View>

        {/* 2. STATS (Sesiones Semanales) */}
        <View style={styles.statsCard}>
           <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20}}>
             <View style={styles.statIconWrapper}><Dumbbell size={24} color="#3b82f6" /></View>
             <Text style={styles.statBigValue}>{weeklyStats.sessions}</Text>
           </View>
           <View style={styles.weekRow}>
              {weekDays.map((date, i) => {
                  const isToday = isSameDay(date, new Date());
                  const hasWorkout = Array.isArray(workoutLog) && workoutLog.some(log => isSameDay(new Date(log.workout_date || log.created_at), date));
                  return (
                      <View key={i} style={styles.dayCol}>
                          <Text style={[styles.dayLetter, isToday && {color: '#3b82f6'}]}>{dayLetters[i]}</Text>
                          <View style={[styles.dayCircle, hasWorkout && styles.dayCircleActive]}>
                              {hasWorkout && <Check size={12} color="#fff" strokeWidth={3} />}
                          </View>
                      </View>
                  )
              })}
           </View>
        </View>

        {/* 3. MACROS SECUNDARIOS (Tiempo, Calorías Meta y Quemadas) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20, marginBottom: 30 }}>
            <View style={styles.bentoCard}>
                <Target color="#fbbf24" size={24} />
                <View style={{marginTop: 10}}>
                    <Text style={styles.bentoValue}>{targets.calories}</Text>
                    <Text style={styles.bentoLabel}>Meta Calórica</Text>
                </View>
            </View>
            <View style={styles.bentoCard}>
                <Clock color="#3b82f6" size={24} />
                <View style={{marginTop: 10}}>
                    <Text style={styles.bentoValue}>{weeklyStats.timeDisplay}</Text>
                    <Text style={styles.bentoLabel}>Tiempo Activo</Text>
                </View>
            </View>
            <View style={styles.bentoCard}>
                <Flame color="#f97316" size={24} />
                <View style={{marginTop: 10}}>
                    <Text style={styles.bentoValue}>{weeklyStats.calories}</Text>
                    <Text style={styles.bentoLabel}>Calorías Quemadas</Text>
                </View>
            </View>
            <View style={{width: 40}} />
        </ScrollView>

        {/* 4. NUTRICIÓN COMPLETA */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <ActivityIcon color="#22c55e" size={24} style={{marginRight: 8}} />
                <Text style={styles.sectionTitle}>Nutrición</Text>
            </View>
            <TouchableOpacity><Text style={styles.seeAll}>Ver Diario</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
            <View style={styles.macroCard}>
                <Flame color="#fbbf24" size={24} />
                <View style={{marginLeft: 12}}>
                    <Text style={styles.macroValue}>{Math.round(nutritionTotals.calories)}</Text>
                    <Text style={styles.macroLabel}>/ {targets.calories} kcal</Text>
                </View>
            </View>
            <View style={styles.macroCard}>
                <Beef color="#fb7185" size={24} />
                <View style={{marginLeft: 12}}>
                    <Text style={styles.macroValue}>{Math.round(nutritionTotals.protein)}</Text>
                    <Text style={styles.macroLabel}>/ {targets.protein}g Prot</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.macroCard} onPress={() => alert('Abrir agua')}>
                <Droplet color="#38bdf8" size={24} />
                <View style={{marginLeft: 12}}>
                    <Text style={styles.macroValue}>{waterGlasses}/8</Text>
                    <Text style={styles.macroLabel}>Agua</Text>
                </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.macroCard} onPress={() => alert('Abrir creatina')}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    {hasCreatine ? <Check size={24} color="#a78bfa" /> : <Plus size={24} color="#888" />}
                </View>
                <View style={{marginLeft: 12}}>
                    <Text style={styles.macroValue}>{hasCreatine ? 'Sí' : 'No'}</Text>
                    <Text style={styles.macroLabel}>Creatina</Text>
                </View>
            </TouchableOpacity>
            <View style={{width: 40}} />
          </ScrollView>
        </View>

        {/* 5. CARDIO RÁPIDO */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Zap color="#eab308" size={24} style={{marginRight: 8}} />
                <Text style={styles.sectionTitle}>Cardio Rápido</Text>
            </View>
          </View>
          <View style={styles.cardioGrid}>
            <TouchableOpacity style={styles.cardioBtn} onPress={() => handleQuickCardio('Cinta')}>
              <View style={styles.cardioIconWrapper}>
                <Footprints size={28} color="#eab308" />
              </View>
              <Text style={styles.cardioText}>Cinta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cardioBtn} onPress={() => handleQuickCardio('Bici')}>
              <View style={styles.cardioIconWrapper}>
                <ActivityIcon size={28} color="#eab308" />
              </View>
              <Text style={styles.cardioText}>Bici</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cardioBtn} onPress={() => alert('Explorar')}>
              <View style={styles.cardioIconWrapper}>
                <LayoutGrid size={28} color="#eab308" />
              </View>
              <Text style={styles.cardioText}>Explorar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. MIS RUTINAS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Rutinas</Text>
            <TouchableOpacity onPress={() => router.push('/routines')}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          {routines?.length > 0 ? (
            routines.slice(0, 3).map(renderRoutine)
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No tienes rutinas todavía.</Text>
            </View>
          )}
        </View>

        {/* 7. PESO */}
        <TouchableOpacity style={styles.weightCard} onPress={() => alert('Abrir peso')}>
          <View style={styles.weightInfo}>
            <Trophy color='#eab308' size={24} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.weightLabel}>PESO ACTUAL</Text>
              <Text style={styles.weightValue}>{latestWeight ? `${latestWeight} kg` : '--'}</Text>
            </View>
          </View>
          <View style={styles.addWeightBtn}>
            <Plus color='#fff' size={20} />
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 30 },
  greeting: { color: '#888', fontSize: 16, marginBottom: 4 },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  streakText: { color: '#f97316', fontWeight: 'bold', fontSize: 16, marginLeft: 6 },
  levelCard: { backgroundColor: '#111', padding: 24, borderRadius: 24, marginBottom: 20 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  levelIconBadge: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#22c55e22', alignItems: 'center', justifyContent: 'center' },
  levelTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  levelSub: { color: '#888', fontSize: 14, marginTop: 2 },
  progressBarBg: { height: 8, backgroundColor: '#222', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 4 },
  statsCard: { backgroundColor: '#111', padding: 24, borderRadius: 24, marginBottom: 20 },
  statIconWrapper: { padding: 12, borderRadius: 20, backgroundColor: '#3b82f622' },
  statBigValue: { color: '#fff', fontSize: 32, fontWeight: '900' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center' },
  dayLetter: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  dayCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  dayCircleActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  bentoCard: { backgroundColor: '#111', padding: 20, borderRadius: 24, marginRight: 15, width: 140 },
  bentoValue: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  bentoLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  macroCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 20, marginRight: 15, minWidth: 150 },
  macroValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  macroLabel: { color: '#888', fontSize: 12 },
  weightCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111', padding: 20, borderRadius: 24, marginBottom: 30 },
  weightInfo: { flexDirection: 'row', alignItems: 'center' },
  weightLabel: { color: '#888', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  weightValue: { color: '#fff', fontSize: 28, fontWeight: '900' },
  addWeightBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  seeAll: { color: '#3b82f6', fontSize: 14, fontWeight: 'bold' },
  routineCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 20, marginBottom: 10 },
  routineCardActive: { borderColor: '#3b82f6', borderWidth: 1, backgroundColor: '#1e3a8a11' },
  routineIconWrapper: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  routineName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  routineNameActive: { color: '#3b82f6' },
  routineSub: { color: '#888', fontSize: 13, fontWeight: '500' },
  emptyCard: { backgroundColor: '#111', padding: 30, borderRadius: 20, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 14 },
  cardioGrid: { flexDirection: 'row', gap: 15 },
  cardioBtn: { flex: 1, backgroundColor: '#111', borderRadius: 24, padding: 20, alignItems: 'center' },
  cardioIconWrapper: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardioText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
