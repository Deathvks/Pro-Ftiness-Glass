import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { 
  Flame, Play, Target, Clock, Droplet, Beef, Zap, Footprints, 
  Activity as ActivityIcon, Dumbbell, User, Sparkles, Check, ChevronRight, 
  Plus, ArrowUp, ArrowDown, Minus, CheckCircle, XCircle, IceCream,
  LayoutGrid, ListFilter, Trophy, PieChart, Scale, Lock
} from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { getContrastColor } from '@/utils/colorUtils';

import LevelBadge from '@/components/LevelBadge';
import CircularProgress from '@/components/CircularProgress';
import BentoStatCard from '@/components/BentoStatCard';
import DashboardInsights from '@/components/DashboardInsights';
import AnimatedScreen from '@/components/AnimatedScreen';
import GlobalHeader from '@/components/GlobalHeader';
import { PRShareModal } from '@/components/modals/PRShareModal';
import { PRListModal } from '@/components/modals/PRListModal';
import { WeeklyRecapModal } from '@/components/modals/WeeklyRecapModal';
import { ExerciseSearchModal } from '@/components/modals/ExerciseSearchModal';

const getXpRequiredForLevel = (level) => level <= 1 ? 0 : 50 * Math.pow(level, 2) + 350 * level - 400;
const getLevelProgress = (currentXp, currentLevel) => {
    const nextLevelTotalXp = getXpRequiredForLevel(currentLevel + 1);
    return { currentXp: Math.floor(currentXp), nextLevelXp: Math.floor(nextLevelTotalXp), progressPercent: Math.min(100, Math.max(0, (currentXp / nextLevelTotalXp) * 100)) || 0 };
};

const dayLetters = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const todayIndex = (new Date().getDay() + 6) % 7; 

export default function Dashboard() {
  const router = useRouter();
  const theme = useAppStore(state => state.theme);
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const iconBadgeBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
  
  const userProfile = useAppStore(state => state.userProfile || state.user);
  const gamification = useAppStore(state => state.gamification) || {};
  const personalRecords = useAppStore(state => state.personalRecords) || [];
  const bodyWeightLog = useAppStore(state => state.bodyWeightLog) || [];
  const routines = useAppStore(state => state.routines) || [];
  const activeWorkout = useAppStore(state => state.activeWorkout);
  const workoutLog = useAppStore(state => state.workoutLog) || [];
  const completedRoutineIdsToday = useAppStore(state => state.completedRoutineIdsToday) || [];
  const startWorkout = useAppStore(state => state.startWorkout);
  
  const nutritionLog = useAppStore(state => state.nutritionLog) || [];
  const waterLog = useAppStore(state => state.waterLog);
  const todaysCreatineLog = useAppStore(state => state.todaysCreatineLog);

  const [timeUntilSunday, setTimeUntilSunday] = useState<string | null>(null);
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);
  const [showPRModal, setShowPRModal] = useState(false);
  const [showPRList, setShowPRList] = useState(false);
  const [selectedPR, setSelectedPR] = useState<any>(null);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const day = now.getDay();

      if (day === 0) {
        setTimeUntilSunday(null);
        return;
      }

      const target = new Date(now);
      target.setDate(now.getDate() + (7 - day));
      target.setHours(0, 0, 0, 0);

      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilSunday(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeUntilSunday(`${days}d ${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  const latestPRs = useMemo(() => {
    if (!Array.isArray(personalRecords) || personalRecords.length === 0) return [];
    const valid = personalRecords.filter(r => r.date);
    if (valid.length === 0) return [];
    const sorted = [...valid].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestDate = sorted[0].date.split('T')[0];
    return sorted.filter(r => r.date.split('T')[0] === latestDate);
  }, [personalRecords]);

  const prShareData = useMemo(() => {
    const targetPR = selectedPR || (latestPRs.length === 1 ? latestPRs[0] : null);
    if (!targetPR) return null;

    const previousRecord = personalRecords.find(r =>
      (r.exercise_name || r.exerciseName) === (targetPR.exercise_name || targetPR.exerciseName) &&
      r.id !== targetPR.id &&
      new Date(r.date).getTime() < new Date(targetPR.date).getTime()
    );

    return {
      exerciseName: targetPR.exercise_name || targetPR.exerciseName || 'Ejercicio',
      newWeight: parseFloat(String(targetPR.weight_kg || targetPR.weight || 0)),
      oldWeight: previousRecord ? parseFloat(String(previousRecord.weight_kg || previousRecord.weight || 0)) : 0,
      date: targetPR.date
    };
  }, [selectedPR, latestPRs, personalRecords]);

  const handlePRCardClick = () => {
    if (latestPRs.length === 0) return;
    if (latestPRs.length === 1) {
      setSelectedPR(latestPRs[0]);
      setShowPRModal(true);
    } else {
      setShowPRList(true);
    }
  };

  const handleSelectPRFromList = (record: any) => {
    setSelectedPR(record);
    setShowPRList(false);
    setShowPRModal(true);
  };

  const handleSwitchPR = () => {
    setShowPRModal(false);
    setShowPRList(true);
  };

  const [aiLimit] = useState(5);
  const [aiRemaining] = useState(5);

  // Weight data
  const sortedWeightLog = useMemo(() =>
    [...bodyWeightLog].sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()),
    [bodyWeightLog]
  );
  const latestWeight = sortedWeightLog.length > 0 ? parseFloat(sortedWeightLog[0].weight_kg) : (userProfile?.weight || null);

  const levelData = useMemo(() => {
      const level = gamification?.level || 1;
      const xp = gamification?.xp || 0;
      const { currentXp, nextLevelXp, progressPercent } = getLevelProgress(xp, level);
      return { currentXp, nextLevelXp, progressPercent };
  }, [gamification]);


  const targets = useMemo(() => {
    const { gender, age, height, activity_level = 1.2, goal } = userProfile || {};

    if (!latestWeight || !height || !age || !gender || !goal) {
      return { calories: 2000, protein: 120, water: 2500, sugar: 0, creatine: 5 };
    }

    let bmr = (10 * latestWeight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
    let cal = Math.round(bmr * activity_level);

    if (goal === 'lose') cal -= 500;
    if (goal === 'gain') cal += 500;

    const protMult = goal === 'gain' ? 2.0 : goal === 'lose' ? 1.8 : 1.6;
    const protein = Math.round(latestWeight * protMult);
    const water = Math.round(latestWeight * 35);
    const sugar = Math.round((cal * 0.10) / 4);

    return { calories: cal, protein, water, sugar, creatine: 5 };
  }, [userProfile, latestWeight]);

  const nutritionTotals = useMemo(() => {
    const totals = nutritionLog.reduce((acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      protein: acc.protein + (parseFloat(log.protein_g) || 0),
      sugar: acc.sugar + (parseFloat(log.sugars_g || log.sugar_g) || 0)
    }), { calories: 0, protein: 0, sugar: 0 });

    totals.water = waterLog?.quantity_ml || 0;
    totals.creatine = todaysCreatineLog?.length > 0 ? 5 : 0;
    
    return totals;
  }, [nutritionLog, waterLog, todaysCreatineLog]);

  const weeklyStats = useMemo(() => {
      try {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const daysArray = [false, false, false, false, false, false, false];
        const logs = (workoutLog || []).filter(log => new Date(log.workout_date) >= startOfWeek);
        
        logs.forEach(log => {
          const logDate = new Date(log.workout_date);
          let idx = logDate.getDay() - 1;
          if (idx === -1) idx = 6; // Sunday
          if (idx >= 0 && idx < 7) {
            daysArray[idx] = true;
          }
        });

        const seconds = logs.reduce((acc, log) => acc + (log.duration_seconds || 0), 0);
        const calories = Math.round(logs.reduce((acc, log) => acc + (log.calories_burned || 0), 0));
        const volume = logs.reduce((acc, log) => acc + (log.total_volume || 0), 0);
        const totalMinutes = Math.floor(seconds / 60);

        return {
            time: seconds < 3600 ? `${totalMinutes}m` : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
            calories: calories,
            days: daysArray,
            sessions: logs.length,
            recapData: {
              totalVolume: volume,
              totalWorkouts: logs.length,
              totalDuration: seconds,
              totalCalories: calories,
            }
        };
      } catch (e) {
        return { 
          time: '0m', 
          calories: 0, 
          days: [false,false,false,false,false,false,false], 
          sessions: 0,
          recapData: { totalVolume: 0, totalWorkouts: 0, totalDuration: 0, totalCalories: 0 }
        };
      }
  }, [workoutLog]);

  const hasWeeklyData = weeklyStats.sessions > 0;
  const isWeeklyRecapUnlocked = timeUntilSunday === null;
  const canOpenWeeklyRecap = hasWeeklyData && isWeeklyRecapUnlocked;

  return (
    <AnimatedScreen header={<GlobalHeader />}>
        {/* 2. HEADER */}
        <View style={{ marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
                <Text style={{ fontSize: 32, fontWeight: '900', color: colors.text }}>Dashboard</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontSize: 18, color: colors.textSecondary }}>Hola, </Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: getContrastColor(colors.tint, theme) }}>{userProfile?.username || 'Atleta'}</Text>
                </View>
            </View>
        </View>

        {/* 3. GAMIFICACION */}
        <TouchableOpacity style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 32, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: {width:0, height:6}, shadowOpacity: 0.08, shadowRadius: 14, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <LevelBadge level={gamification?.level || 1} bgTheme={colors.card} />
                
                <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Nivel {gamification?.level || 1}</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: getContrastColor(colors.tint, theme), marginTop: 4 }}>{levelData.currentXp} / {levelData.nextLevelXp} XP</Text>
                    <View style={{ height: 8, backgroundColor: colors.background, borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
                        <View style={{ height: '100%', backgroundColor: colors.tint, borderRadius: 4, width: `${levelData.progressPercent}%` }} />
                    </View>
                </View>

                <View style={{ alignItems: 'center', justifyContent: 'center', paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: colors.border, marginLeft: 16 }}>
                    <Flame size={26} color={(gamification?.streak || 0) > 0 ? colors.tint : colors.textSecondary} fill={(gamification?.streak || 0) > 0 ? colors.tint : 'transparent'} style={{ opacity: (gamification?.streak || 0) > 0 ? 1 : 0.3 }} />
                    <Text style={{ fontSize: 10, fontWeight: '900', color: colors.textSecondary, marginTop: 4 }}>{gamification?.streak || 0} DÍAS</Text>
                </View>
            </View>
        </TouchableOpacity>

        {/* 3.1 RESUMEN SEMANAL & RÉCORD */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            {/* Card Resumen Semanal */}
            <TouchableOpacity 
                activeOpacity={canOpenWeeklyRecap ? 0.7 : 1}
                onPress={() => {
                  if (canOpenWeeklyRecap) {
                    setShowWeeklyRecap(true);
                  }
                }}
                style={{ 
                  flex: 1, 
                  backgroundColor: colors.card, 
                  borderColor: colors.border, 
                  borderWidth: 1, 
                  borderRadius: 28, 
                  padding: 18, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: 14, 
                  minHeight: 88, 
                  opacity: canOpenWeeklyRecap ? 1 : 0.75,
                  shadowColor: '#000', 
                  shadowOffset: { width: 0, height: 4 }, 
                  shadowOpacity: 0.06, 
                  shadowRadius: 10, 
                  elevation: 2 
                }}
            >
                <View style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: 18, 
                  backgroundColor: isWeeklyRecapUnlocked ? (colors.tint + '15') : iconBadgeBg, 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                    {isWeeklyRecapUnlocked ? (
                      <PieChart size={22} color={colors.tint} />
                    ) : (
                      <Lock size={20} color={colors.textSecondary} />
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>Resumen Semanal</Text>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                        {!isWeeklyRecapUnlocked 
                          ? `disponible en: ${timeUntilSunday}`
                          : (!hasWeeklyData 
                            ? 'Sin actividad reciente' 
                            : 'Mira tus logros visuales')}
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Card Último Récord */}
            <TouchableOpacity 
                activeOpacity={latestPRs.length > 0 ? 0.7 : 1}
                onPress={handlePRCardClick}
                style={{ 
                  flex: 1, 
                  backgroundColor: colors.card, 
                  borderColor: colors.border, 
                  borderWidth: 1, 
                  borderRadius: 28, 
                  padding: 18, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: 14, 
                  minHeight: 88, 
                  opacity: latestPRs.length > 0 ? 1 : 0.75,
                  shadowColor: '#000', 
                  shadowOffset: { width: 0, height: 4 }, 
                  shadowOpacity: 0.06, 
                  shadowRadius: 10, 
                  elevation: 2 
                }}
            >
                <View style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: 18, 
                  backgroundColor: latestPRs.length > 0 ? 'rgba(234, 179, 8, 0.15)' : iconBadgeBg, 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                    <Trophy size={22} color={latestPRs.length > 0 ? '#eab308' : colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                        {latestPRs.length > 1 ? `¡${latestPRs.length} Nuevos Récords!` : 'Último Récord'}
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                        {latestPRs.length > 1 
                          ? 'Pulsa para verlos todos'
                          : (latestPRs.length === 1 
                            ? (latestPRs[0].exercise_name || latestPRs[0].exerciseName || `${latestPRs[0].weight_kg || latestPRs[0].weight} kg`)
                            : 'Aún sin récords')}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>

        {/* 4. DASHBOARD INSIGHTS (Asistente) */}
        <DashboardInsights workoutLog={workoutLog} bodyWeightLog={bodyWeightLog} colors={colors} />

        {/* 5. SEGUIMIENTO SEMANAL + STATS - Grid 2x2 */}
        <View style={{ marginBottom: 24, gap: 12 }}>
            {/* Fila 1 */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
                {/* Card 1: Sesiones Semanales */}
                <View style={{ flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 28, padding: 20, minHeight: 160, justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2, borderWidth: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ width: 48, height: 48, borderRadius: 20, backgroundColor: iconBadgeBg, alignItems: 'center', justifyContent: 'center' }}>
                            <Dumbbell size={24} color={colors.tint} />
                        </View>
                        <Text style={{ fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -0.5 }}>{weeklyStats.sessions}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                        {dayLetters.map((letter, i) => (
                            <View key={i} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: todayIndex === i ? colors.tint : colors.textSecondary }}>{letter}</Text>
                                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: weeklyStats.days[i] ? colors.tint : colors.border, backgroundColor: weeklyStats.days[i] ? colors.tint : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                                    {weeklyStats.days[i] && <Check size={10} color="#fff" strokeWidth={4} />}
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Card 2: Meta Calórica */}
                <BentoStatCard
                    title="META CALÓRICA"
                    value={targets.calories.toLocaleString('es-ES')}
                    unit="kcal"
                    icon={Target}
                    subtext="Objetivo diario"
                    iconColor={colors.tint}
                    themeColors={colors}
                    isDark={isDark}
                />
            </View>

            {/* Fila 2 */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
                {/* Card 3: Tiempo Activo */}
                <BentoStatCard
                    title="TIEMPO ACTIVO"
                    value={weeklyStats.time}
                    icon={Clock}
                    subtext="Total semanal"
                    iconColor={colors.tint}
                    themeColors={colors}
                    isDark={isDark}
                />

                {/* Card 4: Quemadas */}
                <BentoStatCard
                    title="QUEMADAS"
                    value={weeklyStats.calories.toLocaleString('es-ES')}
                    unit="kcal"
                    icon={Flame}
                    subtext="Total estimado"
                    iconColor={colors.warning || '#fbbf24'}
                    themeColors={colors}
                    isDark={isDark}
                />
            </View>
        </View>

        {/* 6. NUTRICION */}
        <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 32, padding: 22, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 20, backgroundColor: iconBadgeBg, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIcon size={24} color={colors.tint} />
                    </View>
                    <View>
                        <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Nutrición</Text>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 }}>Resumen del día</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => router.push('/nutrition')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: iconBadgeBg }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.text }}>Ver Diario</Text>
                    <ChevronRight size={14} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>
            
            <View style={{ gap: 20 }}>
                {/* Fila superior: Calorías, Proteína, Azúcar */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                    <CircularProgress value={nutritionTotals.calories} maxValue={targets.calories} label="Calorías" icon={Flame} color="#fbbf24" themeColors={colors} size={76} />
                    <CircularProgress value={nutritionTotals.protein} maxValue={targets.protein} label="Proteína" icon={Beef} color="#fb7185" themeColors={colors} size={76} />
                    <CircularProgress value={nutritionTotals.sugar} maxValue={targets.sugar} label="Azúcar" icon={IceCream} color="#f472b6" themeColors={colors} size={76} />
                </View>
                {/* Fila inferior: Agua, Creatina */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                    <CircularProgress value={nutritionTotals.water} maxValue={targets.water} label="Agua" icon={Droplet} color="#38bdf8" themeColors={colors} size={76} />
                    <CircularProgress 
                        value={nutritionTotals.creatine} 
                        maxValue={targets.creatine} 
                        label="Creatina" 
                        icon={nutritionTotals.creatine > 0 ? CheckCircle : XCircle} 
                        color={nutritionTotals.creatine > 0 ? '#a78bfa' : colors.textSecondary} 
                        themeColors={colors} 
                        size={76} 
                    />
                </View>
            </View>
        </View>

        {/* 7. MIS RUTINAS */}
        <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Dumbbell size={24} color={colors.tint} />
                    <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Mis Rutinas</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/routines')} style={{ width: 38, height: 38, borderRadius: 16, backgroundColor: iconBadgeBg, alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {routines.length > 0 ? routines.slice(0, 3).map(routine => {
                const isCompleted = completedRoutineIdsToday.map(String).includes(String(routine.id));
                const isActive = activeWorkout && String(activeWorkout.routineId) === String(routine.id);

                return (
                    <TouchableOpacity 
                        key={routine.id}
                        onPress={async () => {
                            if (isActive) { router.push('/workout'); return; }
                            if (!isCompleted && startWorkout) { await startWorkout(routine); router.push('/workout'); }
                        }}
                        style={{ 
                            backgroundColor: colors.card, borderColor: isActive ? colors.tint : colors.border, borderWidth: 1, 
                            borderRadius: 28, padding: 18, marginBottom: 12,
                            opacity: isCompleted ? 0.7 : 1,
                            shadowColor: isActive ? colors.tint : '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isActive ? 0.3 : 0.08, shadowRadius: 12, elevation: 2
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                                <View style={{ width: 48, height: 48, borderRadius: 20, backgroundColor: isActive ? colors.tint + '20' : iconBadgeBg, alignItems: 'center', justifyContent: 'center' }}>
                                    {isActive ? <Clock size={24} color={colors.tint} /> : (isCompleted ? <CheckCircle size={24} color={colors.success || '#22c55e'} /> : <Play size={24} color={colors.tint} fill={colors.tint} />)}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '800', color: isActive ? colors.tint : colors.text }} numberOfLines={1}>{routine.name}</Text>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: isActive ? colors.tint : colors.textSecondary, marginTop: 2 }}>
                                        {isActive ? 'En curso' : (isCompleted ? 'Completada' : 'Iniciar entrenamiento')}
                                    </Text>
                                </View>
                            </View>
                            {!isActive && !isCompleted && <ChevronRight size={18} color={colors.textSecondary} />}
                        </View>
                    </TouchableOpacity>
                );
            }) : (
                <View style={{ backgroundColor: colors.card, borderRadius: 28, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>Sin rutinas creadas.</Text>
                    <TouchableOpacity onPress={() => router.push('/routines')} style={{ backgroundColor: colors.tint + '15', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.tint }}>Crear primera rutina</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* BOTON BIBLIOTECA EJERCICIOS */}
            <TouchableOpacity
                onPress={() => setShowExerciseLibrary(true)}
                style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 28,
                    padding: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 2
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 20, backgroundColor: iconBadgeBg, alignItems: 'center', justifyContent: 'center' }}>
                        <ListFilter size={24} color={colors.tint} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>Biblioteca de Ejercicios</Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 2 }}>Explorar y filtrar todos los ejercicios</Text>
                    </View>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>

        {/* 8. PESO */}
        <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 32, padding: 22, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Scale size={24} color={colors.tint} />
                    <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Peso</Text>
                </View>
                <View style={{ width: 38, height: 38, borderRadius: 16, backgroundColor: iconBadgeBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={20} color={colors.textSecondary} />
                </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <View>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Peso Actual</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                        <Text style={{ fontSize: 44, fontWeight: '900', color: colors.text, letterSpacing: -1.5 }}>{latestWeight ? latestWeight.toFixed(1) : '--'}</Text>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textSecondary, marginLeft: 2 }}>kg</Text>
                    </View>
                </View>
                {sortedWeightLog.length >= 2 && (() => {
                    const diff = parseFloat(sortedWeightLog[0].weight_kg) - parseFloat(sortedWeightLog[1].weight_kg);
                    const isUp = diff > 0;
                    const isDown = diff < 0;
                    return (
                        <View style={{ backgroundColor: isUp ? 'rgba(239,68,68,0.12)' : isDown ? 'rgba(34,197,94,0.12)' : iconBadgeBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 }}>
                            {isUp ? <ArrowUp size={20} color="#ef4444" /> : isDown ? <ArrowDown size={20} color="#22c55e" /> : <Minus size={20} color={colors.textSecondary} />}
                        </View>
                    );
                })()}
            </View>

            <View style={{ gap: 8 }}>
                {sortedWeightLog.length > 0 ? sortedWeightLog.slice(0, 3).map((log, index) => {
                    const diff = sortedWeightLog[index + 1] ? parseFloat(log.weight_kg) - parseFloat(sortedWeightLog[index + 1].weight_kg) : 0;
                    return (
                        <View key={log.id || index} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>
                                {new Date(log.log_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{parseFloat(log.weight_kg).toFixed(1)}</Text>
                                {diff !== 0 && (diff > 0 ? <ArrowUp size={12} color="#ef4444" /> : <ArrowDown size={12} color="#22c55e" />)}
                            </View>
                        </View>
                    );
                }) : (
                    <Text style={{ fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 }}>Sin historial.</Text>
                )}
            </View>
        </View>

        {/* 9. CARDIO RAPIDO */}
        <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <Zap size={24} color={colors.tint} />
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Cardio Rápido</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => router.push('/workout')} style={{ flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 24, paddingVertical: 20, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}>
                    <View style={{ width: 52, height: 52, borderRadius: 20, backgroundColor: iconBadgeBg, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                        <Footprints size={26} color={colors.tint} />
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary }}>Cinta</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/workout')} style={{ flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 24, paddingVertical: 20, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}>
                    <View style={{ width: 52, height: 52, borderRadius: 20, backgroundColor: iconBadgeBg, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                        <ActivityIcon size={26} color={colors.tint} />
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textSecondary }}>Bici</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/workout')} style={{ flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 24, paddingVertical: 20, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}>
                    <View style={{ width: 52, height: 52, borderRadius: 20, backgroundColor: colors.tint + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                        <LayoutGrid size={26} color={colors.tint} />
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.tint }}>Explorar</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* MODALES DE COMPARTIR Y SELECCIÓN */}
        <WeeklyRecapModal
          visible={showWeeklyRecap}
          onClose={() => setShowWeeklyRecap(false)}
          weeklyData={weeklyStats.recapData}
        />

        <PRListModal
          visible={showPRList}
          onClose={() => setShowPRList(false)}
          records={latestPRs}
          onSelectRecord={handleSelectPRFromList}
        />

        <PRShareModal
          visible={showPRModal}
          onClose={() => setShowPRModal(false)}
          prData={prShareData}
          onSwitchPR={handleSwitchPR}
          hasMultiplePRs={latestPRs.length > 1}
        />

        {/* MODAL BIBLIOTECA DE EJERCICIOS */}
        <ExerciseSearchModal
          visible={showExerciseLibrary}
          onClose={() => setShowExerciseLibrary(false)}
          isReadOnly={true}
        />

      </AnimatedScreen>
    );
  }