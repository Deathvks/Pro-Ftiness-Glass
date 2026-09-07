import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Flame, Play, Target, ChevronRight, Clock, Droplet, Beef, Trophy, Plus, Check } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

const getXpRequiredForLevel = (level) => {
    if (level <= 1) return 0;
    return 50 * Math.pow(level, 2) + 350 * level - 400;
};

export default function Dashboard() {
  const user = useAppStore(state => state.userProfile) || useAppStore(state => state.user);
  const gamification = useAppStore(state => state.gamification) || { streak: 0, level: 1, xp: 0 };
  const routines = useAppStore(state => state.routines) || [];
  const activeWorkout = useAppStore(state => state.activeWorkout);
  const waterLog = useAppStore(state => state.waterLog);
  const todaysCreatineLog = useAppStore(state => state.todaysCreatineLog);
  const bodyWeightLog = useAppStore(state => state.bodyWeightLog) || [];
  
  const router = useRouter();

  const { currentXp, nextLevelXp, progressPercent } = useMemo(() => {
    try {
      const level = gamification?.level || 1;
      const xp = gamification?.xp || 0;
      const currentLevelBaseXp = getXpRequiredForLevel(level);
      const nextLevelBaseXp = getXpRequiredForLevel(level + 1);
      const xpIntoLevel = xp - currentLevelBaseXp;
      const xpNeededForNextLevel = nextLevelBaseXp - currentLevelBaseXp;
      const progress = Math.min(100, Math.max(0, (xpIntoLevel / (xpNeededForNextLevel || 1)) * 100));
      return { 
        currentXp: Math.floor(xpIntoLevel), 
        nextLevelXp: Math.floor(xpNeededForNextLevel), 
        progressPercent: progress || 0 
      };
    } catch (e) {
      return { currentXp: 0, nextLevelXp: 500, progressPercent: 0 };
    }
  }, [gamification]);

  const latestWeight = bodyWeightLog.length > 0 ? parseFloat(bodyWeightLog[0].weight_kg).toFixed(1) : '--';
  const waterGlasses = waterLog?.quantity_ml ? Math.floor(waterLog.quantity_ml / 250) : 0;
  const hasCreatine = !!todaysCreatineLog;

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
            <Text style={styles.greeting}>Hola, {user?.name || 'Atleta'} 👋</Text>
            <Text style={styles.name}>¿Qué entrenamos hoy?</Text>
          </View>
          <View style={styles.streakBadge}>
            <Flame color='#f97316' size={20} fill='#f97316' />
            <Text style={styles.streakText}>{gamification.streak}</Text>
          </View>
        </View>

        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelIconBadge}>
              <Target color='#22c55e' size={24} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.levelTitle}>Nivel {gamification.level}</Text>
              <Text style={styles.levelSub}>{currentXp} / {nextLevelXp} XP</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        <View style={styles.trackersRow}>
          <TouchableOpacity style={styles.trackerCard}>
            <View style={styles.trackerHeader}>
              <Droplet color='#3b82f6' size={22} fill='#3b82f6' />
              <Text style={styles.trackerTitle}>Agua</Text>
            </View>
            <Text style={styles.trackerValue}>{waterGlasses}/8</Text>
            <Text style={styles.trackerSub}>Vasos hoy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.trackerCard}>
            <View style={styles.trackerHeader}>
              <Beef color={hasCreatine ? '#22c55e' : '#888'} size={24} />
              <Text style={styles.trackerTitle}>Creatina</Text>
            </View>
            <View style={[styles.creatineStatus, hasCreatine && styles.creatineStatusActive]}>
              {hasCreatine ? <Check size={16} color='#fff' /> : <Plus size={16} color='#888' />}
            </View>
            <Text style={styles.trackerSub}>{hasCreatine ? 'Tomada' : 'Sin tomar'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.weightCard}>
          <View style={styles.weightInfo}>
            <Trophy color='#eab308' size={24} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.weightLabel}>PESO ACTUAL</Text>
              <Text style={styles.weightValue}>{latestWeight} kg</Text>
            </View>
          </View>
          <View style={styles.addWeightBtn}>
            <Plus color='#fff' size={20} />
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tus Rutinas</Text>
            <TouchableOpacity onPress={() => router.push('/routines')}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          {routines.length > 0 ? (
            routines.slice(0, 3).map(renderRoutine)
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No tienes rutinas todavía.</Text>
            </View>
          )}
        </View>
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
  trackersRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  trackerCard: { flex: 1, backgroundColor: '#111', padding: 16, borderRadius: 24, marginRight: 10 },
  trackerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  trackerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  trackerValue: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 2 },
  trackerSub: { color: '#888', fontSize: 12 },
  creatineStatus: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  creatineStatusActive: { backgroundColor: '#22c55e' },
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
  emptyText: { color: '#888', fontSize: 14 }
});
