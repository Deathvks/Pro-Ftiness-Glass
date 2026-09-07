import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { Flame, Play, Target, ChevronRight, Clock, Droplet, Beef, Trophy, Plus, Check, Zap, Footprints, Activity as ActivityIcon, Info } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

const { width } = Dimensions.get('window');

const getXpRequiredForLevel = (level) => {
    if (level <= 1) return 0;
    return 50 * Math.pow(level, 2) + 350 * level - 400;
};

export default function Dashboard() {
  const userProfile = useAppStore(state => state.userProfile) || useAppStore(state => state.user);
  const gamification = useAppStore(state => state.gamification) || { streak: 0, level: 1, xp: 0 };
  const routines = useAppStore(state => state.routines) || [];
  const activeWorkout = useAppStore(state => state.activeWorkout);
  const waterLog = useAppStore(state => state.waterLog);
  const todaysCreatineLog = useAppStore(state => state.todaysCreatineLog) || [];
  const bodyWeightLog = useAppStore(state => state.bodyWeightLog) || [];
  const nutritionLog = useAppStore(state => state.nutritionLog) || [];
  
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
      return { currentXp: Math.floor(xpIntoLevel), nextLevelXp: Math.floor(xpNeededForNextLevel), progressPercent: progress || 0 };
    } catch (e) {
      return { currentXp: 0, nextLevelXp: 500, progressPercent: 0 };
    }
  }, [gamification]);

  const latestWeight = bodyWeightLog.length > 0 ? parseFloat(bodyWeightLog[0].weight_kg).toFixed(1) : null;
  const waterGlasses = waterLog?.quantity_ml ? Math.floor(waterLog.quantity_ml / 250) : 0;
  const hasCreatine = todaysCreatineLog.length > 0;

  const nutritionTotals = useMemo(() => nutritionLog.reduce((acc, log) => ({
    calories: acc.calories + (log.calories || 0),
    protein: acc.protein + (parseFloat(log.protein_g) || 0)
  }), { calories: 0, protein: 0 }), [nutritionLog]);

  const targets = useMemo(() => {
    const { gender, age, height, activity_level = 1.2, goal } = userProfile || {};
    if (!latestWeight || !height || !age || !gender || !goal) return { calories: 0, protein: 0, water: 0, sugar: 0 };
    let bmr = (10 * latestWeight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
    let cal = Math.round(bmr * activity_level);
    if (goal === 'lose') cal -= 500;
    else if (goal === 'gain') cal += 300;
    return { calories: cal, protein: Math.round(latestWeight * (goal === 'lose' ? 2.2 : goal === 'gain' ? 2.0 : 1.8)) };
  }, [userProfile, latestWeight]);

  const handleQuickCardio = (name) => {
    alert(\Iniciando Cardio: \\);
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

        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelIconBadge}>
              <Target color='#22c55e' size={24} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={styles.levelTitle}>Nivel {gamification?.level || 1}</Text>
                  <TouchableOpacity><Info size={18} color=\
