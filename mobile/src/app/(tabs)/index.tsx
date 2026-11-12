import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Dumbbell,
  Target,
  Clock,
  Flame,
  Plus,
  Play,
  Edit,
  Droplet,
  Beef,
  Zap,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
  Trophy,
  Check,
  LayoutGrid,
  IceCream,
  AlertTriangle,
  Info,
  Lock,
  ListFilter,
  MapPin,
  Trash2,
  ShieldCheck,
  HeartPulse,
  Footprints,
  Utensils,
  Scale,
  PieChart,
  Bike,
  Sparkles,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getAppleCardSurfaceStyle, isAtmosphericTheme, shouldUseContentGlass } from '@/constants/theme';
import { getContrastColor, getContrastTextColor } from '@/utils/colorUtils';
import { isSameDay } from '@/utils/helpers';
import { getTrainingWeek, trainingDateFormatter } from '@/utils/weeklyTraining';
import { enrichGymWithMedia } from '@/utils/gymMedia';
import { Image as ExpoImage } from 'expo-image';
import * as nutritionService from '@/services/nutritionService';
import * as userService from '@/services/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LevelBadge from '@/components/LevelBadge';
import CircularProgress from '@/components/CircularProgress';
import BentoStatCard from '@/components/BentoStatCard';
import DashboardInsights from '@/components/DashboardInsights';
import AnimatedScreen from '@/components/AnimatedScreen';
import GlobalHeader from '@/components/GlobalHeader';
import { useToast } from '@/hooks/useToast';

import { PRShareModal } from '@/components/modals/PRShareModal';
import { PRListModal } from '@/components/modals/PRListModal';
import { WeeklyRecapModal } from '@/components/modals/WeeklyRecapModal';
import { ExerciseSearchModal } from '@/components/modals/ExerciseSearchModal';
import { BodyWeightModal } from '@/components/modals/BodyWeightModal';
import { XPGuideModal } from '@/components/modals/XPGuideModal';
import { GymLocationModal } from '@/components/modals/GymLocationModal';
import { WaterLogModal } from '@/components/nutrition/WaterLogModal';
import { CreatineTrackerModal } from '@/components/nutrition/CreatineTrackerModal';
import { SugarTargetModal } from '@/components/nutrition/SugarTargetModal';
import { ConfirmationModal } from '@/components/social/ConfirmationModal';

const getXpRequiredForLevel = (level: number) =>
  level <= 1 ? 0 : 50 * Math.pow(level, 2) + 350 * level - 400;

const getLevelProgress = (currentXp: number, currentLevel: number) => {
  const nextLevelTotalXp = getXpRequiredForLevel(currentLevel + 1);
  return {
    currentXp: Math.floor(currentXp),
    nextLevelXp: Math.floor(nextLevelTotalXp),
    progressPercent: Math.min(100, Math.max(0, (currentXp / nextLevelTotalXp) * 100)) || 0,
  };
};

const getWeightTrendData = (current: number, previous: number | null, goal?: string) => {
  if (previous === null || previous === undefined || isNaN(previous)) return null;
  const diff = current - previous;
  const absDiff = Math.abs(diff);

  if (absDiff < 0.1) {
    return { icon: Minus, color: '#94a3b8', bg: 'rgba(255, 255, 255, 0.05)' };
  }

  const isGaining = diff > 0;
  let isPositiveContext = false;
  if (goal === 'gain') isPositiveContext = isGaining;
  else if (goal === 'lose') isPositiveContext = !isGaining;

  let color = '#94a3b8';
  let bg = 'rgba(255, 255, 255, 0.05)';

  if (goal === 'gain' || goal === 'lose') {
    color = isPositiveContext ? '#22c55e' : '#ef4444';
    bg = isPositiveContext ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  }

  return { icon: isGaining ? ArrowUp : ArrowDown, color, bg };
};

const getStreakCountdown = (lastActivityDate?: string, now = new Date()) => {
  if (!lastActivityDate) return null;

  const [year, month, day] = String(lastActivityDate).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;

  const targetDate = new Date(year, month - 1, day);
  let addedWeekdays = 0;
  while (addedWeekdays < 3) {
    targetDate.setDate(targetDate.getDate() + 1);
    const dow = targetDate.getDay();
    if (dow !== 0 && dow !== 6) {
      addedWeekdays++;
    }
  }

  const deadline = new Date(targetDate);
  deadline.setHours(23, 59, 59, 999);

  const remaining = deadline.getTime() - now.getTime();
  if (remaining <= 0) return { expired: true, days: 0, hours: 0, minutes: 0 };

  const totalMinutes = Math.ceil(remaining / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  return { expired: false, days, hours, minutes };
};

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentText = getContrastColor(colors.tint, theme);
  const tintContrastText = getContrastTextColor(colors.tint);
  const iconBadgeBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
  const isIOS = Platform.OS === 'ios';
  const hasThemedSurface = isAtmosphericTheme(theme);
  const useGlass = shouldUseContentGlass(theme);
  const cardSurface = (isIOS || hasThemedSurface) && getAppleCardSurfaceStyle(theme, 32);

  // Store
  const userProfile = useAppStore(state => state.userProfile || (state as any).user);
  const gamification = useAppStore(state => state.gamification) || {};
  const personalRecords = useAppStore(state => state.personalRecords) || [];
  const bodyWeightLog = useAppStore(state => state.bodyWeightLog) || [];
  const routines = useAppStore(state => state.routines) || [];
  const activeWorkout = useAppStore(state => state.activeWorkout);
  const workoutStartTime = useAppStore(state => state.workoutStartTime);
  const workoutAccumulatedTime = useAppStore(state => state.workoutAccumulatedTime);
  const isWorkoutPaused = useAppStore(state => state.isWorkoutPaused);
  const workoutLog = useAppStore(state => state.workoutLog) || [];
  const completedRoutineIdsToday = useAppStore(state => state.completedRoutineIdsToday) || [];
  const startWorkout = useAppStore(state => state.startWorkout);
  const startSimpleWorkout = useAppStore(state => state.startSimpleWorkout);
  const stopWorkout = useAppStore(state => state.stopWorkout);
  const logBodyWeight = useAppStore(state => state.logBodyWeight);
  const updateTodayBodyWeight = useAppStore(state => state.updateTodayBodyWeight);
  const addGamificationEvents = useAppStore(state => state.addGamificationEvents);
  const fetchDataForDate = useAppStore(state => state.fetchDataForDate);

  // El entrenamiento solo cuenta como activo y visible a partir del segundo 1
  const isWorkoutTimerActive = useMemo(() => {
    if (!activeWorkout) return false;
    const accumulated = workoutAccumulatedTime || 0;
    if (!workoutStartTime || isWorkoutPaused) {
      return accumulated >= 1;
    }
    const current = Math.floor((Date.now() - workoutStartTime) / 1000);
    return (accumulated + current) >= 1;
  }, [activeWorkout, workoutStartTime, workoutAccumulatedTime, isWorkoutPaused]);

  const nutritionLog = useAppStore(state => state.nutritionLog) || [];
  const waterLog = useAppStore(state => state.waterLog);
  const todaysCreatineLog = useAppStore(state => state.todaysCreatineLog) || [];

  // Modals state
  const [timeUntilSunday, setTimeUntilSunday] = useState<string | null>(null);
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);
  const [showPRModal, setShowPRModal] = useState(false);
  const [showPRList, setShowPRList] = useState(false);
  const [selectedPR, setSelectedPR] = useState<any>(null);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showXPModal, setShowXPModal] = useState(false);
  const [showSugarModal, setShowSugarModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showCreatineModal, setShowCreatineModal] = useState(false);
  const [showGymModal, setShowGymModal] = useState(false);
  const [showDiscardWorkoutModal, setShowDiscardWorkoutModal] = useState(false);
  const [isSavingWater, setIsSavingWater] = useState(false);

  // Global Toast Hook (Rendered at Root above all headers and modals)
  const { showToast } = useToast();

  // Gym Management
  const [currentGym, setCurrentGym] = useState<any>(() => {
    try {
      if (userProfile?.gym_data) {
        const remote = typeof userProfile.gym_data === 'string' ? JSON.parse(userProfile.gym_data) : userProfile.gym_data;
        return enrichGymWithMedia(remote);
      }
      return null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (userProfile?.gym_data) {
      try {
        const remote = typeof userProfile.gym_data === 'string' ? JSON.parse(userProfile.gym_data) : userProfile.gym_data;
        setCurrentGym(enrichGymWithMedia(remote));
      } catch {}
    } else {
      AsyncStorage.getItem('user_gym').then(saved => {
        if (saved) {
          try {
            setCurrentGym(enrichGymWithMedia(JSON.parse(saved)));
          } catch {}
        }
      }).catch(() => {});
    }
  }, [userProfile?.gym_data]);

  const handleSaveGym = (gymData: any) => {
    const enriched = enrichGymWithMedia(gymData);
    setCurrentGym(enriched);
    try {
      AsyncStorage.setItem('user_gym', JSON.stringify(enriched)).catch(() => {});
      if (typeof (useAppStore.getState() as any).setUserProfile === 'function') {
        const cur = (useAppStore.getState() as any).userProfile;
        if (cur) (useAppStore.getState() as any).setUserProfile({ ...cur, gym_data: enriched });
      }
      userService.updateUserProfile({ gym_data: enriched }).catch(err => {
        console.warn('Error al guardar gimnasio en backend:', err);
      });
      showToast(`📍 Gimnasio guardado: ${enriched.name}`);
    } catch (e) {
      console.warn('Error al persistir gimnasio:', e);
    }
  };

  const handleRemoveGym = () => {
    setCurrentGym(null);
    try {
      AsyncStorage.removeItem('user_gym').catch(() => {});
      if (typeof (useAppStore.getState() as any).setUserProfile === 'function') {
        const cur = (useAppStore.getState() as any).userProfile;
        if (cur) (useAppStore.getState() as any).setUserProfile({ ...cur, gym_data: null });
      }
      userService.updateUserProfile({ gym_data: null }).catch(err => {
        console.warn('Error al eliminar gimnasio:', err);
      });
      showToast('Gimnasio desvinculado');
    } catch (e) {
      console.warn('Error al eliminar gimnasio:', e);
    }
  };

  // Sunday Timer
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

  // Weight Trend & Logs
  const sortedWeightLog = useMemo(() =>
    [...bodyWeightLog].sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()),
    [bodyWeightLog]
  );
  const latestWeight = sortedWeightLog.length > 0 ? parseFloat(sortedWeightLog[0].weight_kg) : (userProfile?.weight || null);
  const todaysWeightLog = useMemo(() =>
    sortedWeightLog.find(log => isSameDay(log.log_date, new Date())),
    [sortedWeightLog]
  );
  const weightTrend = useMemo(() => {
    if (sortedWeightLog.length < 2) return null;
    return getWeightTrendData(
      parseFloat(sortedWeightLog[0].weight_kg),
      parseFloat(sortedWeightLog[1].weight_kg),
      userProfile?.goal
    );
  }, [sortedWeightLog, userProfile?.goal]);

  // Weekly Training Consistency & Shield
  const weekFormatter = useMemo(() => trainingDateFormatter(userProfile?.timezone), [userProfile?.timezone]);
  const todayKey = weekFormatter.format(new Date());
  const { days: weekDays, trainedDays, logs: weeklyLogs } = useMemo(
    () => getTrainingWeek(workoutLog, todayKey, weekFormatter),
    [workoutLog, todayKey, weekFormatter]
  );

  const targetDays = userProfile?.weeklyTrainingTarget ?? 3;
  const weeklyConsistency = useMemo(() => ({
    targetDays,
    daysThisWeek: trainedDays.size,
    shieldActive: trainedDays.size >= targetDays,
  }), [targetDays, trainedDays.size]);

  const streakCountdown = useMemo(() =>
    getStreakCountdown(gamification?.lastActivityDate),
    [gamification?.lastActivityDate]
  );

  const showStreakTimeRemaining = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (weeklyConsistency.shieldActive) {
      showToast(`🛡️ Escudo activo (${weeklyConsistency.daysThisWeek}/${weeklyConsistency.targetDays} días). Tu racha está blindada.`);
      return;
    }

    const remainingForShield = Math.max(0, weeklyConsistency.targetDays - weeklyConsistency.daysThisWeek);
    const time = streakCountdown && !streakCountdown.expired
      ? `${streakCountdown.days ? `${streakCountdown.days} d ` : ''}${streakCountdown.hours} h ${streakCountdown.minutes} min`
      : null;

    const streakHeader = `🔥 Meta Semanal: ${weeklyConsistency.daysThisWeek}/${weeklyConsistency.targetDays} días entrenados (te ${remainingForShield === 1 ? 'falta 1 día' : `faltan ${remainingForShield} días`} para el Escudo).`;
    const bufferMsg = time ? ` Próximo entreno en ${time}.` : '';

    showToast(streakHeader + bufferMsg);
  };

  // Level Data
  const levelData = useMemo(() => {
    const level = gamification?.level || 1;
    const xp = gamification?.xp || 0;
    const streak = gamification?.streak || 0;
    const { currentXp, nextLevelXp, progressPercent } = getLevelProgress(xp, level);
    return { level, streak, currentXp, nextLevelXp, progressPercent };
  }, [gamification]);

  // Weekly Stats
  const weeklyStats = useMemo(() => {
    const seconds = weeklyLogs.reduce((total, log) => total + (Number(log.duration_seconds) || 0), 0);
    const volume = weeklyLogs.reduce((total, log) => total + (Number(log.total_volume) || 0), 0);
    const calories = Math.round(weeklyLogs.reduce((total, log) => total + (Number(log.calories_burned) || 0), 0));

    return {
      time: seconds < 3600 ? `${Math.round(seconds / 60)}m` : `${(seconds / 3600).toFixed(1)}h`,
      calories,
      sessions: weeklyLogs.length,
      recapData: { totalVolume: volume, totalWorkouts: weeklyLogs.length, totalDuration: seconds, totalCalories: calories },
    };
  }, [weeklyLogs]);

  const hasWeeklyData = weeklyStats.sessions > 0;
  const isWeeklyRecapUnlocked = timeUntilSunday === null;
  const canOpenWeeklyRecap = hasWeeklyData && isWeeklyRecapUnlocked;

  // Personal Records
  const latestPRs = useMemo(() => {
    if (!Array.isArray(personalRecords) || personalRecords.length === 0) return [];
    const valid = personalRecords.filter((r: any) => r && r.date);
    if (valid.length === 0) return [];
    const sorted = [...valid].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestDate = String(sorted[0].date).split('T')[0];
    return sorted.filter((r: any) => String(r.date).split('T')[0] === latestDate);
  }, [personalRecords]);

  const prShareData = useMemo(() => {
    const targetPR = selectedPR || (latestPRs.length === 1 ? latestPRs[0] : null);
    if (!targetPR) return null;

    const previousRecord = personalRecords.find((r: any) =>
      (r.exercise_name || r.exerciseName) === (targetPR.exercise_name || targetPR.exerciseName) &&
      r.id !== targetPR.id &&
      new Date(r.date).getTime() < new Date(targetPR.date).getTime()
    );

    return {
      exerciseName: targetPR.exercise_name || targetPR.exerciseName || 'Ejercicio',
      newWeight: parseFloat(String(targetPR.weight_kg || targetPR.weight || 0)),
      oldWeight: previousRecord ? parseFloat(String(previousRecord.weight_kg || previousRecord.weight || 0)) : 0,
      date: targetPR.date,
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

  // Nutrition Targets & Totals
  const targets = useMemo(() => {
    const { gender, age, height, activity_level = 1.2, goal } = userProfile || {};

    if (!latestWeight || !height || !age || !gender || !goal) {
      return { calories: 2000, protein: 120, water: 2500, sugar: 50 };
    }

    let bmr = (10 * latestWeight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
    let cal = Math.round(bmr * activity_level);

    if (goal === 'lose') cal -= 500;
    if (goal === 'gain') cal += 500;

    const protMult = goal === 'gain' ? 2.0 : goal === 'lose' ? 1.8 : 1.6;
    const protein = Math.round(latestWeight * protMult);
    const water = Math.round(latestWeight * 35);
    const sugar = Math.round((cal * 0.10) / 4);

    return { calories: cal, protein, water, sugar };
  }, [userProfile, latestWeight]);

  const nutritionTotals = useMemo(() => {
    const totals = (nutritionLog || []).reduce((acc: any, log: any) => ({
      calories: acc.calories + (log.calories || 0),
      protein: acc.protein + (parseFloat(log.protein_g) || 0),
      sugar: acc.sugar + (parseFloat(log.sugars_g || log.sugar_g) || 0),
    }), { calories: 0, protein: 0, sugar: 0 });

    totals.water = waterLog?.quantity_ml || 0;
    totals.creatine = todaysCreatineLog?.length || 0;
    return totals;
  }, [nutritionLog, waterLog, todaysCreatineLog]);

  const isSugarExceeded = nutritionTotals.sugar >= targets.sugar && targets.sugar > 0;

  // Handlers
  const handleSaveWater = async (quantity_ml: number) => {
    setIsSavingWater(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await nutritionService.upsertWaterLog({ log_date: todayStr, quantity_ml });
      if (res?.gamification?.length && addGamificationEvents) {
        addGamificationEvents(res.gamification);
      }
      if (fetchDataForDate) await fetchDataForDate(todayStr);
      showToast('💧 Consumo de agua actualizado');
      setShowWaterModal(false);
    } catch {
      showToast('Error al guardar agua');
    } finally {
      setIsSavingWater(false);
    }
  };

  const handleSaveBodyWeight = async (data: { weight: number }) => {
    try {
      if (todaysWeightLog && updateTodayBodyWeight) {
        await updateTodayBodyWeight(data);
        showToast('⚖️ Peso de hoy actualizado');
      } else if (logBodyWeight) {
        await logBodyWeight(data);
        showToast('⚖️ Peso corporal registrado');
      }
    } catch (e) {
      showToast('Error al registrar peso');
    }
  };

  const handleStartCardio = (name: string) => {
    if (activeWorkout && isWorkoutTimerActive) {
      Alert.alert(
        'Entrenamiento en curso',
        `Ya tienes una sesión activa (${activeWorkout.routineName || 'Entrenamiento'}). ¿Deseas volver a ella o descartarla para iniciar este cardio?`,
        [
          {
            text: 'Volver a la sesión',
            onPress: () => router.push('/workout'),
          },
          {
            text: 'Descartar e iniciar cardio',
            style: 'destructive',
            onPress: () => {
              if (stopWorkout) stopWorkout();
              if (startSimpleWorkout) {
                startSimpleWorkout(`Cardio: ${name}`);
                router.push('/workout');
              }
            },
          },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
      return;
    }

    if (startSimpleWorkout) {
      startSimpleWorkout(`Cardio: ${name}`);
      router.push('/workout');
    }
  };

  // Date Header String (e.g. domingo, 8 de noviembre)
  const formattedTodayDate = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }, []);

  const dayLetters = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <AnimatedScreen header={<GlobalHeader />}>
      {/* 1. HEADER & GYM LOCATOR */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={[styles.mainTitle, { color: colors.text }]}>Hola, </Text>
            <Text style={[styles.mainTitle, { color: colors.tint }]}>
              {userProfile?.username || 'Atleta'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Text style={[styles.dateSubtitle, { color: colors.textSecondary }]}>
              {formattedTodayDate}
            </Text>
            <Text style={{ color: colors.textSecondary, opacity: 0.5 }}>•</Text>
            {/* Gym Locator Button */}
            <TouchableOpacity
              onPress={() => setShowGymModal(true)}
              style={[
                styles.gymPill,
                {
                  backgroundColor: currentGym ? colors.tint + '15' : iconBadgeBg,
                  borderColor: currentGym ? colors.tint + '40' : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
                },
              ]}
              activeOpacity={0.75}
            >
              <DashboardGymMark
                key={JSON.stringify([currentGym?.logo, currentGym?.image])}
                logo={currentGym?.logo}
                photo={currentGym?.image}
                tint={colors.tint}
                border={colors.border}
              />
              <Text
                style={[
                  styles.gymPillText,
                  { color: currentGym ? colors.text : colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {currentGym?.name || 'Localizar gimnasio'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 2. GAMIFICACION CON ESCUDO DE RACHA */}
      <TouchableOpacity
        onPress={() => setShowXPModal(true)}
        activeOpacity={0.8}
        style={[
          styles.glassCardBase, cardSurface,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            padding: 20,
            marginBottom: 16,
          },
        ]}
      >
        {useGlass && (
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 32 }]}
          />
          )}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LevelBadge level={levelData.level} bgTheme={isDark ? '#111111' : '#FFFFFF'} />

          <View style={{ marginLeft: 16, flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>Nivel {levelData.level}</Text>
                <Info size={12} color={colors.textSecondary} />
              </View>
              <View style={[styles.xpCapsuleSm, { backgroundColor: colors.tint + '15' }]}>
                <Text style={[styles.xpCapsuleSmText, { color: colors.tint }]}>
                  {levelData.currentXp} / {levelData.nextLevelXp} XP
                </Text>
              </View>
            </View>

            <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <View style={[styles.progressFill, { backgroundColor: colors.tint, width: `${levelData.progressPercent}%` }]} />
            </View>
          </View>

          {/* Racha / Escudo */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              showStreakTimeRemaining();
            }}
            style={[
              styles.streakSection,
              { borderLeftColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' },
            ]}
          >
            <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
              <Flame
                size={26}
                color={levelData.streak > 0 || weeklyConsistency.daysThisWeek > 0 ? colors.tint : colors.textSecondary}
                fill={levelData.streak > 0 || weeklyConsistency.daysThisWeek > 0 ? colors.tint : 'transparent'}
                style={{ opacity: levelData.streak > 0 || weeklyConsistency.daysThisWeek > 0 ? 1 : 0.3 }}
              />
              {weeklyConsistency.shieldActive && (
                <View style={styles.shieldFloatingBadge}>
                  <ShieldCheck size={11} color="#fff" strokeWidth={3} />
                </View>
              )}
            </View>
            <Text style={{ fontSize: 10, fontWeight: '900', color: colors.text, marginTop: 4 }}>
              {weeklyConsistency.daysThisWeek}/{weeklyConsistency.targetDays} SEM
            </Text>
            <Text
              style={{
                fontSize: 9,
                fontWeight: '800',
                color: weeklyConsistency.shieldActive ? '#22c55e' : colors.textSecondary,
                marginTop: 2,
              }}
            >
              {weeklyConsistency.shieldActive ? '🛡️ Blindada' : `${levelData.streak} días`}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* 3. BANNER DE ENTRENAMIENTO EN CURSO (solo si el cronómetro ha iniciado >= 1s) */}
      {activeWorkout && isWorkoutTimerActive && (
        <View style={{ marginBottom: 16 }}>
          <View
            style={[
              styles.glassCardBase, cardSurface,
              {
                borderColor: colors.tint + '60',
                borderWidth: 1.5,
                padding: 18,
                backgroundColor: hasThemedSurface ? colors.card : colors.tint + '08',
              },
            ]}
          >
            {useGlass && (
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 28 }]}
              />
              )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={[styles.activeWorkoutIcon, { backgroundColor: colors.tint }]}>
                <Dumbbell size={22} color={tintContrastText} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={[styles.activeTag, { backgroundColor: colors.tint + '20' }]}>
                  <Text style={[styles.activeTagText, { color: colors.tint }]}>ENTRENAMIENTO EN CURSO</Text>
                </View>
                <Text style={[styles.activeWorkoutTitle, { color: colors.text }]} numberOfLines={1}>
                  {activeWorkout.routineName || activeWorkout.name || 'Entrenamiento Libre'}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  Sesión activa en segundo plano.
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                onPress={() => router.push('/workout')}
                style={[styles.resumeBtn, { backgroundColor: colors.tint }]}
                activeOpacity={0.85}
              >
                <Play size={15} color={tintContrastText} fill={tintContrastText} />
                <Text style={[styles.resumeBtnText, { color: tintContrastText }]}>Continuar entreno</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDiscardWorkoutModal(true)}
                style={styles.discardBtn}
                activeOpacity={0.8}
              >
                <Trash2 size={16} color="#ef4444" />
                <Text style={styles.discardBtnText}>Descartar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 4. RESUMEN SEMANAL & RÉCORD (2 CARDS) */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        {/* Resumen Semanal */}
        <TouchableOpacity
          activeOpacity={canOpenWeeklyRecap ? 0.7 : 1}
          onPress={() => {
            if (canOpenWeeklyRecap) setShowWeeklyRecap(true);
          }}
          style={[
            styles.glassCardBase, cardSurface,
            styles.recapCard,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              opacity: canOpenWeeklyRecap ? 1 : 0.75,
            },
          ]}
        >
          {useGlass && (
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 28 }]}
            />
            )}
          <View
            style={[
              styles.recapIconWrap,
              { backgroundColor: isWeeklyRecapUnlocked ? colors.tint + '15' : iconBadgeBg },
            ]}
          >
            {isWeeklyRecapUnlocked ? (
              <PieChart size={22} color={colors.tint} />
            ) : (
              <Lock size={20} color={colors.textSecondary} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitleSm, { color: colors.text }]}>Resumen Semanal</Text>
            {!isWeeklyRecapUnlocked ? (
              <View style={{ marginTop: 2 }}>
                <Text style={{ fontSize: 9, fontWeight: '600', color: colors.textSecondary }}>Disponible en:</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.tint, marginTop: 1 }}>
                  {timeUntilSunday}
                </Text>
              </View>
            ) : (
              <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary, marginTop: 2 }}>
                {!hasWeeklyData ? 'Sin actividad' : 'Mira tus logros'}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Último Récord */}
        <TouchableOpacity
          activeOpacity={latestPRs.length > 0 ? 0.7 : 1}
          onPress={handlePRCardClick}
          style={[
            styles.glassCardBase, cardSurface,
            styles.recapCard,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              opacity: latestPRs.length > 0 ? 1 : 0.75,
            },
          ]}
        >
          {useGlass && (
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 28 }]}
            />
            )}
          <View
            style={[
              styles.recapIconWrap,
              { backgroundColor: latestPRs.length > 0 ? 'rgba(234, 179, 8, 0.15)' : iconBadgeBg },
            ]}
          >
            <Trophy size={22} color={latestPRs.length > 0 ? '#eab308' : colors.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitleSm, { color: colors.text }]}>
              {latestPRs.length > 1 ? `¡${latestPRs.length} Récords!` : 'Último Récord'}
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
              {latestPRs.length > 1
                ? 'Ver todos'
                : (latestPRs.length === 1
                  ? (latestPRs[0].exercise_name || latestPRs[0].exerciseName)
                  : 'Aún sin récords')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 5. DASHBOARD INSIGHTS */}
      <DashboardInsights workoutLog={workoutLog} bodyWeightLog={bodyWeightLog} colors={colors} />

      {/* 6. STATS GRID 2x2 (META SEMANAL / CALORÍAS / TIEMPO / QUEMADAS) */}
      <View style={{ marginBottom: 24, gap: 12 }}>
        {/* Fila 1 */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Card 1: Meta Semanal / Escudo Activo */}
          <TouchableOpacity
            onPress={showStreakTimeRemaining}
            activeOpacity={0.8}
            style={[
              styles.glassCardBase, cardSurface,
              styles.statCardBase,
              { borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' },
            ]}
          >
            {useGlass && (
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 28 }]}
              />
              )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View
                style={[
                  styles.iconWrapSm,
                  {
                    backgroundColor: weeklyConsistency.shieldActive ? 'rgba(34, 197, 94, 0.15)' : iconBadgeBg,
                  },
                ]}
              >
                {weeklyConsistency.shieldActive ? (
                  <ShieldCheck size={22} color="#22c55e" />
                ) : (
                  <Dumbbell size={22} color={colors.tint} />
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: -0.5 }}>
                  {weeklyConsistency.daysThisWeek}/{weeklyConsistency.targetDays}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary }}>días</Text>
              </View>
            </View>

            <View
              style={[
                styles.shieldStatusCapsule,
                {
                  backgroundColor: weeklyConsistency.shieldActive ? 'rgba(34, 197, 94, 0.15)' : colors.tint + '15',
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '800',
                  color: weeklyConsistency.shieldActive ? '#22c55e' : colors.tint,
                  textTransform: 'uppercase',
                }}
              >
                {weeklyConsistency.shieldActive ? 'Escudo activo' : 'Meta semanal'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              {weekDays.map((dayStr, i) => {
                const isToday = dayStr === todayKey;
                const hasWorkout = trainedDays.has(dayStr);
                return (
                  <View key={dayStr} style={{ alignItems: 'center', gap: 3, flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: '800',
                        color: isToday ? colors.tint : colors.textSecondary,
                      }}
                    >
                      {dayLetters[i]}
                    </Text>
                    <View
                      style={[
                        styles.dayCircle,
                        {
                          borderColor: hasWorkout
                            ? (weeklyConsistency.shieldActive ? '#22c55e' : colors.tint)
                            : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'),
                          backgroundColor: hasWorkout
                            ? (weeklyConsistency.shieldActive ? '#22c55e' : colors.tint)
                            : 'transparent',
                        },
                      ]}
                    >
                      {hasWorkout && <Check size={9} color="#fff" strokeWidth={4} />}
                    </View>
                  </View>
                );
              })}
            </View>
          </TouchableOpacity>

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
            onInfoPress={() =>
              showToast('Tu meta ya incluye tus entrenamientos semanales. ¡No comas de más los días que entrenas!')
            }
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
            onInfoPress={() =>
              showToast('Calorías quemadas en entrenamientos. Es un logro visual, no debes sumarlas a tus comidas.')
            }
          />
        </View>
      </View>

      {/* 7. NUTRICIÓN (5 ANILLOS CIRCULARES CON ALERTAS Y MODALES) */}
      <View
        style={[
          styles.glassCardBase, cardSurface,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            padding: 22,
            marginBottom: 24,
          },
        ]}
      >
        {useGlass && (
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 32 }]}
          />
          )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.iconWrapSm, { backgroundColor: iconBadgeBg }]}>
              <Utensils size={22} color={colors.tint} />
            </View>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Nutrición</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 }}>
                Resumen del día
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/nutrition')}
            style={[styles.smallPillBtn, { backgroundColor: iconBadgeBg }]}
          >
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.text }}>Ver Diario</Text>
            <ChevronRight size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={{ gap: 20 }}>
          {/* Fila superior: Calorías, Proteína, Azúcar */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.push('/nutrition')} activeOpacity={0.8}>
              <CircularProgress
                value={nutritionTotals.calories}
                maxValue={targets.calories}
                label="Calorías"
                icon={Flame}
                color="#fbbf24"
                themeColors={colors}
                size={76}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/nutrition')} activeOpacity={0.8}>
              <CircularProgress
                value={parseFloat(nutritionTotals.protein.toFixed(1))}
                maxValue={targets.protein}
                label="Proteína"
                icon={Beef}
                color="#fb7185"
                themeColors={colors}
                size={76}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => (isSugarExceeded ? setShowSugarModal(true) : router.push('/nutrition'))}
              activeOpacity={0.8}
              style={{ position: 'relative' }}
            >
              {isSugarExceeded && (
                <View style={styles.sugarAlertBadge}>
                  <AlertTriangle size={14} color="#fff" />
                </View>
              )}
              <CircularProgress
                value={parseFloat(nutritionTotals.sugar.toFixed(1))}
                maxValue={targets.sugar}
                label="Azúcar"
                icon={isSugarExceeded ? AlertTriangle : IceCream}
                color={isSugarExceeded ? '#ef4444' : '#f472b6'}
                displayText={`${Math.round(nutritionTotals.sugar)}/${targets.sugar}`}
                themeColors={colors}
                size={76}
              />
            </TouchableOpacity>
          </View>

          {/* Fila inferior: Agua y Creatina (Interactivos con modal) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setShowWaterModal(true)} activeOpacity={0.8}>
              <CircularProgress
                value={nutritionTotals.water}
                maxValue={targets.water}
                label="Agua"
                icon={Droplet}
                color="#38bdf8"
                themeColors={colors}
                size={76}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowCreatineModal(true)} activeOpacity={0.8}>
              <CircularProgress
                value={todaysCreatineLog.length}
                maxValue={2}
                label="Creatina"
                icon={todaysCreatineLog.length > 0 ? CheckCircle : XCircle}
                color={todaysCreatineLog.length > 0 ? '#a78bfa' : colors.textSecondary}
                displayText={todaysCreatineLog.length > 0 ? `${todaysCreatineLog.length}/2` : '0/2'}
                themeColors={colors}
                size={76}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 8. CARDIO RÁPIDO */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <HeartPulse size={22} color={colors.tint} />
          <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Cardio Rápido</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Cinta */}
          <TouchableOpacity
            onPress={() => handleStartCardio('Cinta')}
            style={[
              styles.glassCardBase, cardSurface,
              styles.cardioCard,
              { borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' },
            ]}
            activeOpacity={0.75}
          >
            {useGlass && (
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 24 }]}
              />
              )}
            <View style={[styles.cardioIconWrap, { backgroundColor: iconBadgeBg }]}>
              <Footprints size={26} color={colors.tint} />
            </View>
            <Text style={[styles.cardioText, { color: colors.text }]}>Cinta</Text>
          </TouchableOpacity>

          {/* Bici */}
          <TouchableOpacity
            onPress={() => handleStartCardio('Bici')}
            style={[
              styles.glassCardBase, cardSurface,
              styles.cardioCard,
              { borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' },
            ]}
            activeOpacity={0.75}
          >
            {useGlass && (
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 24 }]}
              />
              )}
            <View style={[styles.cardioIconWrap, { backgroundColor: iconBadgeBg }]}>
              <Bike size={26} color={colors.tint} />
            </View>
            <Text style={[styles.cardioText, { color: colors.text }]}>Bici</Text>
          </TouchableOpacity>

          {/* Explorar */}
          <TouchableOpacity
            onPress={() => router.push('/quick-cardio')}
            style={[
              styles.glassCardBase, cardSurface,
              styles.cardioCard,
              { borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' },
            ]}
            activeOpacity={0.75}
          >
            {useGlass && (
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 24 }]}
              />
              )}
            <View style={[styles.cardioIconWrap, { backgroundColor: colors.tint + '15' }]}>
              <LayoutGrid size={26} color={colors.tint} />
            </View>
            <Text style={[styles.cardioText, { color: colors.tint }]}>Explorar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 9. MIS RUTINAS */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Dumbbell size={22} color={colors.tint} />
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Mis Rutinas</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/routines')}
            style={[styles.smallIconBtn, { backgroundColor: iconBadgeBg }]}
          >
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {routines.length > 0 ? (
          routines.slice(0, 3).map((routine: any) => {
            const isCompleted =
              completedRoutineIdsToday.map(String).includes(String(routine.id)) ||
              workoutLog.some((log: any) => String(log?.routine_id) === String(routine.id) && isSameDay(log.workout_date, new Date()));
            const isActive = activeWorkout && String(activeWorkout.routineId) === String(routine.id);

            return (
              <TouchableOpacity
                key={routine.id}
                onPress={() => {
                  if (isActive) {
                    router.push('/workout');
                    return;
                  }
                  if (activeWorkout && isWorkoutTimerActive) {
                    Alert.alert(
                      'Entrenamiento en curso',
                      `Ya tienes una sesión activa (${activeWorkout.routineName || 'Entrenamiento'}). ¿Deseas volver a ella o descartarla para iniciar "${routine.name}"?`,
                      [
                        {
                          text: 'Volver a la sesión',
                          onPress: () => router.push('/workout'),
                        },
                        {
                          text: 'Descartar e iniciar nueva',
                          style: 'destructive',
                          onPress: () => {
                            if (stopWorkout) stopWorkout();
                            if (startWorkout) startWorkout(routine);
                            router.push('/workout');
                          },
                        },
                        { text: 'Cancelar', style: 'cancel' },
                      ]
                    );
                    return;
                  }
                  if (isCompleted) {
                    router.push('/routines');
                    return;
                  }
                  if (startWorkout) {
                    startWorkout(routine);
                    router.push('/workout');
                  }
                }}
                style={[
                  styles.glassCardBase, cardSurface,
                  {
                    borderColor: isActive
                      ? colors.tint
                      : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
                    padding: 16,
                    marginBottom: 10,
                    opacity: isCompleted ? 0.75 : 1,
                  },
                ]}
                activeOpacity={0.8}
              >
                {useGlass && (
                  <GlassView
                    glassEffectStyle="regular"
                    colorScheme={isDark ? 'dark' : 'light'}
                    style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 28 }]}
                  />
                  )}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                    <View
                      style={[
                        styles.routineIconWrap,
                        {
                          backgroundColor: isActive
                            ? colors.tint + '20'
                            : (isCompleted ? colors.tint + '15' : iconBadgeBg),
                        },
                      ]}
                    >
                      {isActive ? (
                        <Clock size={22} color={colors.tint} />
                      ) : isCompleted ? (
                        <CheckCircle size={22} color={colors.tint} />
                      ) : (
                        <Play size={20} color={colors.tint} fill={colors.tint} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '800',
                          color: isActive ? colors.tint : colors.text,
                        }}
                        numberOfLines={1}
                      >
                        {routine.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: isActive ? colors.tint : (isCompleted ? colors.tint : colors.textSecondary),
                          marginTop: 2,
                        }}
                      >
                        {isActive ? 'En curso' : (isCompleted ? 'Completada hoy' : 'Iniciar entrenamiento')}
                      </Text>
                    </View>
                  </View>
                  {!isActive && !isCompleted && <ChevronRight size={18} color={colors.textSecondary} />}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View
            style={[
              styles.glassCardBase, cardSurface,
              {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                padding: 28,
                alignItems: 'center',
                marginBottom: 10,
              },
            ]}
          >
            {useGlass && (
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 28 }]}
              />
              )}
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>Sin rutinas creadas.</Text>
            <TouchableOpacity
              onPress={() => router.push('/routines')}
              style={[styles.smallPillBtn, { backgroundColor: colors.tint + '20', paddingHorizontal: 16, paddingVertical: 8 }]}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.tint }}>Crear primera rutina</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botón Biblioteca de Ejercicios */}
        <TouchableOpacity
          onPress={() => setShowExerciseLibrary(true)}
          style={[
            styles.glassCardBase, cardSurface,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 4,
            },
          ]}
          activeOpacity={0.8}
        >
          {useGlass && (
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 28 }]}
            />
            )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
            <View style={[styles.routineIconWrap, { backgroundColor: iconBadgeBg }]}>
              <ListFilter size={22} color={colors.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>Biblioteca de Ejercicios</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 2 }}>
                Explorar y filtrar todos los ejercicios
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* 10. PESO CORPORAL */}
      <View
        style={[
          styles.glassCardBase, cardSurface,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            padding: 22,
            marginBottom: 32,
          },
        ]}
      >
        {useGlass && (
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: isIOS ? 20 : 32 }]}
          />
          )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Scale size={22} color={colors.tint} />
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>Peso</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowWeightModal(true)}
            style={[styles.smallIconBtn, { backgroundColor: iconBadgeBg }]}
          >
            {todaysWeightLog ? <Edit size={18} color={colors.tint} /> : <Plus size={18} color={colors.textSecondary} />}
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <View>
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
              Peso Actual
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ fontSize: 44, fontWeight: '900', color: colors.text, letterSpacing: -1.5 }}>
                {latestWeight ? latestWeight.toFixed(1) : '--'}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textSecondary, marginLeft: 2 }}>kg</Text>
            </View>
          </View>
          {weightTrend && (
            <View style={[styles.weightTrendBadge, { backgroundColor: weightTrend.bg }]}>
              <weightTrend.icon size={22} color={weightTrend.color} />
            </View>
          )}
        </View>

        <View style={{ gap: 8 }}>
          {sortedWeightLog.length > 0 ? (
            sortedWeightLog.slice(0, 3).map((log: any, index: number) => {
              const rowTrend = getWeightTrendData(
                parseFloat(log.weight_kg),
                sortedWeightLog[index + 1] ? parseFloat(sortedWeightLog[index + 1].weight_kg) : null,
                userProfile?.goal
              );
              return (
                <View
                  key={log.id || index}
                  style={[
                    styles.weightRow,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>
                    {new Date(log.log_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                      {parseFloat(log.weight_kg).toFixed(1)} kg
                    </Text>
                    {rowTrend && <rowTrend.icon size={13} color={rowTrend.color} />}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={{ fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 }}>
              Sin historial registrado.
            </Text>
          )}
        </View>
      </View>



      {/* MODALES DE LA VISTA */}
      <WeeklyRecapModal
        visible={showWeeklyRecap}
        onClose={() => setShowWeeklyRecap(false)}
        weeklyData={weeklyStats.recapData}
      />

      <PRListModal
        visible={showPRList}
        onClose={() => setShowPRList(false)}
        records={latestPRs}
        onSelectRecord={(rec: any) => {
          setSelectedPR(rec);
          setShowPRList(false);
          setShowPRModal(true);
        }}
      />

      <PRShareModal
        visible={showPRModal}
        onClose={() => setShowPRModal(false)}
        prData={prShareData}
        onSwitchPR={() => {
          setShowPRModal(false);
          setShowPRList(true);
        }}
        hasMultiplePRs={latestPRs.length > 1}
      />

      <ExerciseSearchModal
        visible={showExerciseLibrary}
        onClose={() => setShowExerciseLibrary(false)}
        isReadOnly={true}
      />

      <BodyWeightModal
        visible={showWeightModal}
        existingLog={todaysWeightLog}
        onClose={() => setShowWeightModal(false)}
        onSave={handleSaveBodyWeight}
      />

      <XPGuideModal
        visible={showXPModal}
        targetDays={targetDays}
        onClose={() => setShowXPModal(false)}
      />

      <GymLocationModal
        visible={showGymModal}
        currentGym={currentGym}
        onClose={() => setShowGymModal(false)}
        onSave={handleSaveGym}
        onRemove={handleRemoveGym}
      />

      <WaterLogModal
        visible={showWaterModal}
        initialQuantity={nutritionTotals.water}
        isLoading={isSavingWater}
        onClose={() => setShowWaterModal(false)}
        onSave={handleSaveWater}
      />

      <CreatineTrackerModal
        visible={showCreatineModal}
        selectedDate={new Date().toISOString().split('T')[0]}
        creatineTarget={2}
        onClose={() => setShowCreatineModal(false)}
        onRefresh={() => {
          if (fetchDataForDate) fetchDataForDate(new Date().toISOString().split('T')[0]);
        }}
      />

      <SugarTargetModal
        visible={showSugarModal}
        currentSugar={nutritionTotals.sugar}
        maxSugar={targets.sugar}
        onClose={() => setShowSugarModal(false)}
      />

      <ConfirmationModal
        visible={showDiscardWorkoutModal}
        title="¿Descartar entrenamiento?"
        message="Perderás el progreso de la sesión actual en curso."
        confirmText="Descartar"
        cancelText="Volver"
        isDestructive={true}
        onConfirm={() => {
          if (stopWorkout) stopWorkout();
          setShowDiscardWorkoutModal(false);
          showToast('Entrenamiento descartado');
        }}
        onCancel={() => setShowDiscardWorkoutModal(false)}
      />
    </AnimatedScreen>
  );
}

function DashboardGymMark({ logo, photo, tint, border }: {
  logo?: string; photo?: string; tint: string; border: string;
}) {
  const [failed, setFailed] = useState<string[]>([]);
  const source = [logo, photo].find(uri => uri && !failed.includes(uri));
  if (!source) return <MapPin size={14} color={tint} />;
  return (
    <View style={[styles.gymMark, { borderColor: border }]}>
      <ExpoImage source={{ uri: source }} recyclingKey={source} contentFit="cover"
        style={StyleSheet.absoluteFill} onError={() => setFailed(previous => [...previous, source])} />
    </View>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mainTitle: {
    fontSize: Platform.OS === 'ios' ? 34 : 32,
    fontWeight: Platform.OS === 'ios' ? '700' : '900',
    letterSpacing: Platform.OS === 'ios' ? -0.4 : -0.5,
  },
  dateSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  gymPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
  },
  gymPillText: {
    fontSize: 10,
    fontWeight: '700',
    maxWidth: 160,
  },
  gymMark: {
    width: 17, height: 17, borderRadius: 8.5, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden',
  },
  glassCardBase: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 32,
    overflow: 'hidden',
  },
  xpCapsuleSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  xpCapsuleSmText: {
    fontSize: 10,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  streakSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 14,
    borderLeftWidth: 1,
    marginLeft: 14,
  },
  shieldFloatingBadge: {
    position: 'absolute',
    right: -6,
    bottom: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  activeWorkoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeTagText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activeWorkoutTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  resumeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 18,
  },
  resumeBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  discardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  discardBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ef4444',
  },
  recapCard: {
    flex: 1,
    borderRadius: 28,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 84,
  },
  recapIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleSm: {
    fontSize: 12,
    fontWeight: '800',
  },
  statCardBase: {
    flex: 1,
    padding: 18,
    minHeight: 160,
    justifyContent: 'space-between',
    borderRadius: 28,
  },
  iconWrapSm: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldStatusCapsule: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
  },
  dayCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  sugarAlertBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardioCard: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardioIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardioText: {
    fontSize: 12,
    fontWeight: '800',
  },
  smallIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightTrendBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  floatingToastWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  floatingToast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  floatingToastText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
});
