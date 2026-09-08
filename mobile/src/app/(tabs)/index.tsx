import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Play, Target, Clock, Droplet, Beef, Zap, Footprints, Activity as ActivityIcon, Dumbbell, User, Sparkles, Check, ChevronRight, Plus, ArrowUp, ArrowDown, Minus, CheckCircle } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

import LevelBadge from '@/components/LevelBadge';
import CircularProgress from '@/components/CircularProgress';
import BentoStatCard from '@/components/BentoStatCard';
import DashboardInsights from '@/components/DashboardInsights';

const getXpRequiredForLevel = (level) => level <= 1 ? 0 : 50 * Math.pow(level, 2) + 350 * level - 400;
const getLevelProgress = (currentXp, currentLevel) => {
    const nextLevelTotalXp = getXpRequiredForLevel(currentLevel + 1);
    return { currentXp: Math.floor(currentXp), nextLevelXp: Math.floor(nextLevelTotalXp), progressPercent: Math.min(100, Math.max(0, (currentXp / nextLevelTotalXp) * 100)) || 0 };
};

const dayLetters = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const todayIndex = (new Date().getDay() + 6) % 7; 

export default function Dashboard() {
  const router = useRouter();
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = Colors[theme] || Colors.oled;
  
  const userProfile = useAppStore(state => state.userProfile || state.user);
  const gamification = useAppStore(state => state.gamification) || {};
  const bodyWeightLog = useAppStore(state => state.bodyWeightLog) || [];
  const routines = useAppStore(state => state.routines) || [];
  const activeWorkout = useAppStore(state => state.activeWorkout);
  const workoutLog = useAppStore(state => state.workoutLog) || [];

  const [aiLimit] = useState(5);
  const [aiRemaining] = useState(5);

  const levelData = useMemo(() => {
      const level = gamification?.level || 1;
      const xp = gamification?.xp || 0;
      return getLevelProgress(xp, level);
  }, [gamification]);

  const targets = { calories: 2500, protein: 150, water: 2500, creatine: 5 };
  const nutritionTotals = { calories: 0, protein: 0, water: 1000, creatine: 5, sugar: 0 };
  const latestWeight = bodyWeightLog.length > 0 ? parseFloat(bodyWeightLog[0].weight_kg).toFixed(1) : (userProfile?.weight || '--');

  const weeklyStats = useMemo(() => {
      try {
        const workoutsThisWeek = 3;
        const totalMinutes = 125;
        return {
            time: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
            calories: 850,
            days: [false, true, false, true, false, false, false]
        };
      } catch (e) {
        return { time: '0h 0m', calories: 0, days: [false,false,false,false,false,false,false] };
      }
  }, [workoutLog]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* 1. TOP NAVBAR GLOBAL (Como en Web MainAppLayout) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.background + 'EE' }}>
          <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }} onPress={() => router.push('/profile')}>
             <User size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: -1 }}>
             <Image source={require('@/assets/images/react-logo.png')} style={{ width: 100, height: 24, resizeMode: 'contain' }} />
          </View>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.tint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, shadowColor: colors.tint, shadowOffset: {width:0,height:2}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4 }}>
              <Sparkles size={14} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>{aiRemaining}/{aiLimit}</Text>
          </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}>
        
        {/* 2. HEADER */}
        <View style={{ marginTop: 20, marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
                <Text style={{ fontSize: 32, fontWeight: '900', color: colors.text }}>Dashboard</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontSize: 18, color: colors.textSecondary }}>Hola, </Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.tint }}>{userProfile?.username || 'Atleta'}</Text>
                </View>
            </View>
        </View>

        {/* 3. DASHBOARD INSIGHTS (Asistente) */}
        <DashboardInsights workoutLog={workoutLog} bodyWeightLog={bodyWeightLog} colors={colors} />

        {/* 4. GAMIFICACION */}
        <TouchableOpacity style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 32, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: {width:0, height:8}, shadowOpacity: 0.1, shadowRadius: 16, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <LevelBadge level={gamification?.level || 1} bgTheme={colors.card} />
                <View style={{ marginLeft: 24, flex: 1 }}>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text }}>Nivel {gamification?.level || 1}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginTop: 4 }}>{levelData.currentXp} / {levelData.nextLevelXp} XP</Text>
                    <View style={{ height: 10, backgroundColor: colors.background, borderRadius: 5, overflow: 'hidden', marginTop: 12 }}>
                        <View style={{ height: '100%', backgroundColor: colors.success, borderRadius: 5, width: `${levelData.progressPercent}%` }} />
                    </View>
                </View>
            </View>
        </TouchableOpacity>

        {/* 5. RESUMEN SEMANAL */}
        <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 32, padding: 24, marginBottom: 32, shadowColor: '#000', shadowOffset: {width:0, height:8}, shadowOpacity: 0.1, shadowRadius: 16, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                {dayLetters.map((letter, i) => (
                    <View key={i} style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: todayIndex === i ? colors.tint : colors.textSecondary, marginBottom: 8 }}>{letter}</Text>
                        <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: weeklyStats.days[i] ? colors.tint : colors.border, backgroundColor: weeklyStats.days[i] ? colors.tint : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                            {weeklyStats.days[i] && <Check size={14} color="#fff" strokeWidth={4} />}
                        </View>
                    </View>
                ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
                <BentoStatCard title="Tiempo Activo" value={weeklyStats.time} icon={Clock} iconColor={colors.tint} subtext="Total semanal" themeColors={colors} />
                <BentoStatCard title="Quemadas" value={weeklyStats.calories} unit="kcal" icon={Flame} iconColor={colors.warning} subtext="Total estimado" themeColors={colors} />
            </View>
        </View>

        {/* 6. NUTRICION Y HABITOS (GlassCard + Circular Progress) */}
        <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 32, padding: 24, marginBottom: 32, shadowColor: '#000', shadowOffset: {width:0, height:8}, shadowOpacity: 0.1, shadowRadius: 16, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Nutrición y Hábitos</Text>
            </View>
            
            {/* Círculos en fila con scroll horizontal para replicar el layout nativo mejorado */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 24 }}>
                <CircularProgress value={nutritionTotals.water} maxValue={targets.water} label="Agua" icon={Droplet} color="#3b82f6" themeColors={colors} />
                <CircularProgress value={nutritionTotals.protein} maxValue={targets.protein} label="Proteínas" icon={Beef} color="#ec4899" themeColors={colors} />
                <CircularProgress value={nutritionTotals.creatine} maxValue={targets.creatine} label="Creatina" icon={Zap} color="#a78bfa" themeColors={colors} />
            </ScrollView>
        </View>

        {/* 7. CARDIO RAPIDO */}
        <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Cardio Rápido</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 28, padding: 24, alignItems: 'center' }}>
                    <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.success + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <Footprints size={32} color={colors.success} />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>Correr</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 28, padding: 24, alignItems: 'center' }}>
                    <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.warning + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <ActivityIcon size={32} color={colors.warning} />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>Bicicleta</Text>
                </TouchableOpacity>
            </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}