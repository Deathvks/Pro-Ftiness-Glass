/* frontend/src/pages/Dashboard.jsx */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import {
  Dumbbell, Target, Clock, Flame, Plus, Play, Edit, Footprints,
  Bike, Activity, Droplet, Beef, Zap, CheckCircle, XCircle,
  ArrowUp, ArrowDown, Minus, ChevronRight, Trophy as TrophyLucide, Check, Crown,
  LayoutGrid, IceCream, TriangleAlert, Info, Share2, X, Loader2, Lock, List
} from 'lucide-react';
import { FaChartPie, FaTrophy } from 'react-icons/fa';

import GlassCard from '../components/GlassCard';
import BodyWeightModal from '../components/BodyWeightModal';
import SugarTargetModal from '../components/SugarTargetModal';
import { isSameDay } from '../utils/helpers';
import useAppStore from '../store/useAppStore';
import { getLevelProgress } from '../store/gamificationSlice';
import CircularProgress from '../components/CircularProgress';
import CreatinaTracker from '../components/CreatinaTracker';
import WaterLogModal from '../components/WaterLogModal';
import XPGuideModal from '../components/XPGuideModal';
import TourGuide from '../components/TourGuide';
import * as nutritionService from '../services/nutritionService';
import { useToast } from '../hooks/useToast';
import { useLocalNotifications } from '../hooks/useLocalNotifications';
import SEOHead from '../components/SEOHead';

import WeeklyRecapCard from '../components/WeeklyRecapCard';
import PRShareCard from '../components/PRShareCard';

// --- COMPONENTE INTERNO: ESCALADO AUTOMÁTICO (ScaleToFit) ---
const ScaleToFit = ({ children, width = 1080, height = 1920 }) => {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            if (!containerRef.current) return;
            const parent = containerRef.current.parentElement;
            if (parent) {
                const availableWidth = parent.clientWidth;
                const availableHeight = parent.clientHeight;
                
                const scaleX = availableWidth / width;
                const scaleY = availableHeight / height;
                const newScale = Math.min(scaleX, scaleY, 1);
                
                setScale(newScale);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        const t = setTimeout(handleResize, 50);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(t);
        };
    }, [width, height]);

    return (
        <div ref={containerRef} className="flex items-center justify-center w-full h-full overflow-hidden">
            <div 
                style={{ 
                    width: width, 
                    height: height, 
                    transform: `scale(${scale})`, 
                    transformOrigin: 'center center' 
                }} 
                className="shrink-0 shadow-2xl"
            >
                {children}
            </div>
        </div>
    );
};

// --- Helper: Lógica de Tendencia de Peso ---
const getWeightTrendData = (current, previous, goal) => {
  if (!previous && previous !== 0) return null;
  const diff = current - previous;
  const absDiff = Math.abs(diff);

  if (absDiff < 0.1) {
    return { icon: Minus, color: 'text-text-muted', bg: 'bg-transparent dark:bg-bg-secondary' };
  }

  const isGaining = diff > 0;
  let isPositiveContext = false;
  if (goal === 'gain') isPositiveContext = isGaining;
  else if (goal === 'lose') isPositiveContext = !isGaining;

  let color = 'text-text-secondary';
  let bg = 'bg-transparent dark:bg-bg-secondary';

  if (goal === 'gain' || goal === 'lose') {
    color = isPositiveContext ? 'text-green-500' : 'text-red-500';
    bg = isPositiveContext ? 'bg-transparent dark:bg-green-500/10' : 'bg-transparent dark:bg-red-500/10';
  }

  return {
    icon: isGaining ? ArrowUp : ArrowDown,
    color,
    bg
  };
};

// --- COMPONENTE: Bento Stat Card ---
const BentoStatCard = ({ title, value, unit, icon: Icon, onClick, subtext, iconColor = "text-accent" }) => (
  <GlassCard
    onClick={onClick}
    className="
      p-5 relative overflow-hidden group cursor-pointer
      hover:bg-bg-secondary transition-all duration-300
      flex flex-col justify-between h-full min-h-[160px]
      border-transparent dark:border dark:border-white/10 hover:shadow-lg
    "
  >
    <div className="flex justify-between items-start relative z-10">
      <div className={`
        p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110
        ${iconColor}
        bg-transparent shadow-none border-none
        dark:bg-white/5 dark:shadow-sm dark:border dark:border-white/20
        [.oled-theme_&]:bg-transparent
      `}>
        <Icon size={24} />
      </div>
    </div>

    <div className="relative z-10 mt-4 space-y-1">
      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-text-primary tracking-tight">{value}</span>
        {unit && <span className="text-xs font-semibold text-text-muted">{unit}</span>}
      </div>
      {subtext && <p className="text-[10px] font-medium text-text-muted opacity-60">{subtext}</p>}
    </div>
  </GlassCard>
);

const Dashboard = ({ setView }) => {
  const { addToast } = useToast();
  const { t } = useTranslation(['translation', 'exercise_names']);
  
  const {
    routines, workoutLog, bodyWeightLog, userProfile, logBodyWeight,
    updateTodayBodyWeight, startWorkout, startSimpleWorkout, nutritionLog,
    waterLog, todaysCreatineLog, fetchDataForDate,
    completedRoutineIdsToday,
    activeWorkout,
    gamification,
    checkStreak,
    addXp,
    personalRecords
  } = useAppStore(useShallow(state => ({
    routines: state.routines,
    workoutLog: state.workoutLog,
    bodyWeightLog: state.bodyWeightLog,
    userProfile: state.userProfile,
    logBodyWeight: state.logBodyWeight,
    updateTodayBodyWeight: state.updateTodayBodyWeight,
    startWorkout: state.startWorkout,
    startSimpleWorkout: state.startSimpleWorkout,
    nutritionLog: state.nutritionLog,
    waterLog: state.waterLog,
    todaysCreatineLog: state.todaysCreatineLog,
    fetchDataForDate: state.fetchDataForDate,
    completedRoutineIdsToday: state.completedRoutineIdsToday,
    activeWorkout: state.activeWorkout,
    gamification: state.gamification,
    checkStreak: state.checkStreak,
    addXp: state.addXp,
    personalRecords: state.personalRecords || [] 
  })));

  const { cancelLoginReminder } = useLocalNotifications();

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showXPModal, setShowXPModal] = useState(false);
  const [showSugarModal, setShowSugarModal] = useState(false);
  const [modal, setModal] = useState({ type: null });

  // Estados visuales (Stories)
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);
  const [showPRModal, setShowPRModal] = useState(false);
  
  // Estado para lista múltiple de PRs
  const [showPRList, setShowPRList] = useState(false);
  const [selectedPR, setSelectedPR] = useState(null);

  const [isSharing, setIsSharing] = useState(false);

  // Referencias para la captura de imagen
  const prCardRef = useRef(null);
  const weeklyRecapRef = useRef(null);

  const streakCheckedRef = useRef(false);

  // --- CONTADOR DOMINGO ---
  const [timeUntilSunday, setTimeUntilSunday] = useState(null);

  useEffect(() => {
    const updateTimer = () => {
        const now = new Date();
        const day = now.getDay(); // 0 es Domingo
        
        if (day === 0) {
            setTimeUntilSunday(null);
            return;
        }

        const target = new Date(now);
        target.setDate(now.getDate() + (7 - day));
        target.setHours(0, 0, 0, 0);

        const diff = target - now;
        
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

  useEffect(() => {
    if (checkStreak && !streakCheckedRef.current) {
      checkStreak(new Date().toISOString().split('T')[0]);
      streakCheckedRef.current = true;
      cancelLoginReminder();
    }
  }, [checkStreak, cancelLoginReminder]);

  const levelData = useMemo(() => {
    const level = gamification?.level || 1;
    const xp = gamification?.xp || 0;
    const streak = gamification?.streak || 0;
    const { currentXp, nextLevelXp, progressPercent } = getLevelProgress(xp, level);
    return { level, streak, percentage: progressPercent, progress: currentXp, needed: nextLevelXp };
  }, [gamification]);

  const sortedWeightLog = useMemo(() =>
    [...bodyWeightLog].sort((a, b) => new Date(b.log_date) - new Date(a.log_date)),
    [bodyWeightLog]
  );

  const todaysWeightLog = useMemo(() =>
    sortedWeightLog.find(log => isSameDay(log.log_date, new Date())),
    [sortedWeightLog]
  );

  const latestWeight = sortedWeightLog.length > 0 ? parseFloat(sortedWeightLog[0].weight_kg) : (userProfile?.weight || null);

  const weightTrend = useMemo(() => {
    if (sortedWeightLog.length < 2) return null;
    return getWeightTrendData(
      parseFloat(sortedWeightLog[0].weight_kg),
      parseFloat(sortedWeightLog[1].weight_kg),
      userProfile?.goal
    );
  }, [sortedWeightLog, userProfile?.goal]);

  const { weeklySessions, weeklyTimeDisplay, weeklyCalories, weekDays, weeklyRecapData } = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    const logs = workoutLog.filter(log => new Date(log.workout_date) >= startOfWeek);
    const seconds = logs.reduce((acc, log) => acc + log.duration_seconds, 0);
    const volume = logs.reduce((acc, log) => acc + (log.total_volume || 0), 0);
    const calories = logs.reduce((acc, log) => acc + (log.calories_burned || 0), 0);

    return {
      weekDays: days,
      weeklySessions: logs.length,
      weeklyCalories: calories,
      weeklyTimeDisplay: seconds < 3600 ? `${Math.round(seconds / 60)} min` : `${(seconds / 3600).toFixed(1)} h`,
      weeklyRecapData: {
        totalVolume: volume,
        totalWorkouts: logs.length,
        totalDuration: seconds,
        totalCalories: calories
      }
    };
  }, [workoutLog]);

  const hasWeeklyData = weeklySessions > 0;
  const isWeeklyRecapUnlocked = timeUntilSunday === null;
  const canOpenWeeklyRecap = hasWeeklyData && isWeeklyRecapUnlocked;

  // --- LÓGICA DE RÉCORDS MÚLTIPLES ---
  const latestPRs = useMemo(() => {
    if (!Array.isArray(personalRecords) || personalRecords.length === 0) return [];
    
    // 1. Filtrar solo los que tienen fecha
    const validRecords = personalRecords.filter(r => r.date);
    if (validRecords.length === 0) return [];

    // 2. Ordenar por fecha descendente
    const sorted = [...validRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 3. Obtener la fecha del más reciente
    const latestDate = sorted[0].date.split('T')[0];

    // 4. Devolver TODOS los records que coincidan con esa fecha
    return sorted.filter(r => r.date.split('T')[0] === latestDate);
  }, [personalRecords]);

  // Datos para la tarjeta de compartir
  const prShareData = useMemo(() => {
    const targetPR = selectedPR || (latestPRs.length === 1 ? latestPRs[0] : null);

    if (!targetPR) return null;

    const previousRecord = personalRecords.find(r => 
        r.exercise_name === targetPR.exercise_name && 
        r.id !== targetPR.id && 
        new Date(r.date) < new Date(targetPR.date)
    );

    return {
        exerciseName: targetPR.exercise_name || targetPR.exerciseName,
        newWeight: targetPR.weight_kg || targetPR.weight,
        oldWeight: previousRecord ? (previousRecord.weight_kg || previousRecord.weight) : 0,
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

  const targets = useMemo(() => {
    if (!latestWeight) return { calories: 2000, protein: 0, water: 2500, sugar: 50 };
    const { gender, age, height, activity_level = 1.2, goal } = userProfile || {};

    let bmr = (10 * latestWeight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
    let cal = Math.round(bmr * activity_level);

    if (goal === 'lose') cal -= 500;
    if (goal === 'gain') cal += 500;

    const protMult = goal === 'gain' ? 2.0 : goal === 'lose' ? 1.8 : 1.6;

    return {
      calories: cal,
      protein: Math.round(latestWeight * protMult),
      water: Math.round(latestWeight * 35),
      sugar: Math.round((cal * 0.10) / 4)
    };
  }, [userProfile, latestWeight]);

  const nutritionTotals = useMemo(() => (nutritionLog || []).reduce((acc, log) => ({
    calories: acc.calories + (log.calories || 0),
    protein: acc.protein + (parseFloat(log.protein_g) || 0),
    sugar: acc.sugar + (parseFloat(log.sugars_g || log.sugar_g) || 0)
  }), { calories: 0, protein: 0, sugar: 0 }), [nutritionLog]);

  const isSugarExceeded = nutritionTotals.sugar >= targets.sugar && targets.sugar > 0;

  const handleSaveWater = async (quantity_ml) => {
    setModal({ type: 'submitting' });
    try {
      await nutritionService.upsertWaterLog({ log_date: new Date().toISOString().split('T')[0], quantity_ml });
      if (addXp) addXp(5);
      if (checkStreak) checkStreak(new Date().toISOString().split('T')[0]);
      addToast(t('Registro actualizado.', { defaultValue: 'Registro actualizado.' }), 'success');
      await fetchDataForDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      addToast(t('Error al guardar.', { defaultValue: 'Error al guardar.' }), 'error');
    } finally {
      setModal({ type: null });
    }
  };

  const shareImage = async (ref, title) => {
    if (!ref.current || isSharing) return;
    setIsSharing(true);

    try {
        const canvas = await html2canvas(ref.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#000000',
            logging: false
        });

        canvas.toBlob(async (blob) => {
            if (!blob) {
                setIsSharing(false);
                return;
            }

            const file = new File([blob], `share-${Date.now()}.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: title || t('Mi Progreso', { defaultValue: 'Mi Progreso' }),
                        text: t('¡Mira mi progreso en Pro Fitness Glass!', { defaultValue: '¡Mira mi progreso en Pro Fitness Glass!' })
                    });
                    addToast(t('¡Compartido con éxito!', { defaultValue: '¡Compartido con éxito!' }), 'success');
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error('Error sharing:', error);
                        downloadFallback(canvas);
                    }
                }
            } else {
                downloadFallback(canvas);
            }
            setIsSharing(false);
        }, 'image/png');
    } catch (error) {
        console.error('Error generating image:', error);
        addToast(t('Error al generar la imagen', { defaultValue: 'Error al generar la imagen' }), 'error');
        setIsSharing(false);
    }
  };

  const downloadFallback = (canvas) => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `share-${Date.now()}.png`;
      link.click();
      addToast(t('Imagen descargada', { defaultValue: 'Imagen descargada' }), 'success');
  };

  const handleSharePR = () => shareImage(prCardRef, t('Nuevo Récord', { defaultValue: 'Nuevo Récord' }));
  const handleShareRecap = () => shareImage(weeklyRecapRef, t('Resumen Semanal', { defaultValue: 'Resumen Semanal' }));


  return (
    <div className="w-full max-w-7xl mx-auto px-4 pt-4 pb-24 md:p-10 animate-[fade-in_0.5s_ease-out]">
      <SEOHead 
        title={t("Dashboard - Pro Fitness Glass", { defaultValue: "Dashboard - Pro Fitness Glass" })} 
        description={t("Panel de control de usuario.", { defaultValue: "Panel de control de usuario." })}
        route="dashboard"
        noIndex={true}
      />

      <TourGuide />

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-8 items-start">
        <div className="space-y-2">
          <h1 className="hidden md:block text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight">
            {t('Dashboard', { defaultValue: 'Dashboard' })}
          </h1>
          <div className="flex items-center gap-2 text-lg text-text-secondary">
            <span>{t('Hola,', { defaultValue: 'Hola,' })}</span>
            <span className="text-accent font-bold px-1">
              {userProfile?.username || t('Atleta', { defaultValue: 'Atleta' })}
            </span>
          </div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* TARJETA DE GAMIFICACIÓN */}
        <GlassCard
          id="tour-gamification"
          className="w-full lg:w-auto p-5 flex items-center gap-6 bg-bg-secondary/40 rounded-3xl relative overflow-hidden group border-transparent dark:border dark:border-white/10 hover:bg-bg-secondary transition-all cursor-pointer"
          onClick={() => setShowXPModal(true)}
        >
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-bg-primary flex items-center justify-center border-2 border-accent text-accent font-black text-2xl shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]">
              {levelData.level}
            </div>
            <div className="absolute -top-2 -right-2 bg-bg-primary rounded-full p-1.5 shadow-lg">
              <Crown size={14} className="text-amber-400 fill-amber-400" />
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider whitespace-nowrap">
                  {t('Nivel Actual', { defaultValue: 'Nivel Actual' })}
                </span>
                <button onClick={(e) => { e.stopPropagation(); setShowXPModal(true); }} className="text-text-muted hover:text-accent transition-colors">
                  <Info size={12} />
                </button>
              </div>
              <span className="text-[10px] font-bold text-accent bg-transparent dark:bg-accent/10 [.oled-theme_&]:bg-transparent px-2 py-0.5 rounded-full whitespace-nowrap">
                {levelData.progress} / {levelData.needed} XP
              </span>
            </div>
            
            <div className="h-2.5 w-full sm:w-48 bg-bg-primary rounded-full overflow-hidden border border-black/5 dark:border-white/10">
              <div className="h-full bg-accent rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" style={{ width: `${levelData.percentage}%` }} />
            </div>
            
          </div>

          <div className="flex flex-col items-center justify-center pl-6 border-l border-white/5 flex-shrink-0">
            <div className={`transition-all duration-500 mb-1 ${levelData.streak > 0 ? 'text-accent drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.6)]' : 'text-text-muted opacity-30'}`}>
              <Flame size={26} fill={levelData.streak > 0 ? "currentColor" : "none"} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary">
              {levelData.streak} {t('DÍAS', { defaultValue: 'DÍAS' })}
            </span>
          </div>
        </GlassCard>
      </div>

      {/* --- SECCIÓN HIGHLIGHTS (STORIES/PR) --- */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        
        {/* Weekly Recap Button */}
        <GlassCard
            onClick={() => canOpenWeeklyRecap && setShowWeeklyRecap(true)}
            className={`
                group relative p-4 rounded-2xl overflow-hidden border-transparent dark:border dark:border-white/10 min-h-28 h-full flex items-center bg-gradient-to-br from-accent/20 to-blue-600/10
                ${canOpenWeeklyRecap ? 'cursor-pointer' : 'cursor-default opacity-80'}
            `}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10 flex items-center gap-4 w-full">
                <div className={`
                    w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-300
                    ${canOpenWeeklyRecap ? 'bg-gradient-to-tr from-accent to-blue-600 group-hover:scale-110' : 'bg-gray-500/50'}
                `}>
                    {/* Icono cambia si está bloqueado */}
                    {isWeeklyRecapUnlocked ? <FaChartPie size={20} /> : <Lock size={20} />}
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1">
                      {t('Resumen Semanal', { defaultValue: 'Resumen Semanal' })}
                    </h3>
                    <p className="text-[10px] text-gray-800 dark:text-gray-200 opacity-90 leading-tight">
                      {!isWeeklyRecapUnlocked 
                        ? `${t('Disponible en', { defaultValue: 'Disponible en' })}: ${timeUntilSunday}`
                        : (!hasWeeklyData 
                            ? t('Sin actividad reciente', { defaultValue: 'Sin actividad reciente' })
                            : t('Mira tus logros visuales', { defaultValue: 'Mira tus logros visuales' })
                          )
                      }
                    </p>
                </div>
            </div>
        </GlassCard>

        {/* Share PR Button */}
        <GlassCard
            onClick={handlePRCardClick}
            className={`
                group relative p-4 rounded-2xl overflow-hidden border-transparent dark:border dark:border-white/10 min-h-28 h-full flex items-center bg-gradient-to-br from-accent/20 to-yellow-600/10
                ${latestPRs.length > 0 ? 'cursor-pointer' : 'opacity-80 cursor-default'}
            `}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-yellow-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10 flex items-center gap-4 w-full">
                <div className={`
                    w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-300
                    ${latestPRs.length > 0 ? 'bg-gradient-to-tr from-accent to-yellow-600 group-hover:scale-110' : 'bg-gray-500/50'}
                `}>
                    <FaTrophy size={20} />
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1">
                      {latestPRs.length > 1 
                        ? t('¡{{count}} Nuevos Récords!', { count: latestPRs.length, defaultValue: `¡${latestPRs.length} Nuevos Récords!` })
                        : t('Último Récord', { defaultValue: 'Último Récord' })}
                    </h3>
                    <p className="text-[10px] text-gray-800 dark:text-gray-200 opacity-90 leading-tight">
                        {latestPRs.length > 1
                          ? t('Pulsa para verlos todos', { defaultValue: 'Pulsa para verlos todos' })
                          : (latestPRs.length === 1
                              ? t(latestPRs[0].exercise_name || latestPRs[0].exerciseName, { ns: 'exercise_names', defaultValue: latestPRs[0].exercise_name || latestPRs[0].exerciseName }) 
                              : t('Aún sin récords', { defaultValue: 'Aún sin récords' }))}
                    </p>
                </div>
            </div>
        </GlassCard>
      </div>

      {/* GRID DE ESTADÍSTICAS */}
      <div id="tour-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

        {/* 1. SESIONES */}
        <GlassCard className="p-5 flex flex-col justify-between h-full min-h-[160px] border-transparent dark:border dark:border-white/10 hover:shadow-lg relative overflow-hidden group hover:bg-bg-secondary transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110 text-accent bg-transparent shadow-none border-none dark:bg-white/5 dark:shadow-sm dark:border dark:border-white/20 [.oled-theme_&]:bg-transparent">
              <Dumbbell size={24} />
            </div>
            <span className="text-3xl font-black text-text-primary tracking-tight">{weeklySessions}</span>
          </div>

          <div className="flex justify-between items-center w-full overflow-x-auto no-scrollbar gap-1">
            {weekDays.map((date, i) => {
              const dayLetters = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
              const isToday = isSameDay(date, new Date());
              const hasWorkout = workoutLog.some(log => isSameDay(new Date(log.workout_date), date));
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1 min-w-[20px]">
                  <span className={`text-[9px] font-bold ${isToday ? 'text-accent' : 'text-text-muted'}`}>{dayLetters[i]}</span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all 
                  ${hasWorkout ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-transparent dark:bg-bg-primary/50 text-transparent'}
                  `}>
                    {hasWorkout && <Check size={10} strokeWidth={4} />}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* 2. META CALÓRICA */}
        <BentoStatCard
          title={t('Meta Calórica', { defaultValue: 'Meta Calórica' })}
          value={targets.calories.toLocaleString()}
          unit="kcal"
          icon={Target}
          iconColor="text-accent"
          subtext={t('Objetivo diario', { defaultValue: 'Objetivo diario' })}
        />

        {/* 3. TIEMPO ACTIVO */}
        <BentoStatCard
          title={t('Tiempo Activo', { defaultValue: 'Tiempo Activo' })}
          value={weeklyTimeDisplay}
          icon={Clock}
          iconColor="text-accent"
          subtext={t('Total semanal', { defaultValue: 'Total semanal' })}
        />

        {/* 4. QUEMADAS */}
        <BentoStatCard
          title={t('Quemadas', { defaultValue: 'Quemadas' })}
          value={weeklyCalories.toLocaleString()}
          unit="kcal"
          icon={Flame}
          iconColor="text-accent"
          subtext={t('Total estimado', { defaultValue: 'Total estimado' })}
        />
      </div>

      {/* LAYOUT PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

        {/* COLUMNA IZQUIERDA (NUTRICIÓN) */}
        <div className="lg:col-span-2 space-y-8">
          <section id="tour-nutrition">
            <GlassCard className="p-8 relative overflow-hidden rounded-[2rem] border-transparent dark:border dark:border-white/10 transition-all">

              <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl text-accent transition-transform bg-transparent shadow-none border-none dark:bg-white/5 dark:shadow-sm dark:border dark:border-white/20 [.oled-theme_&]:bg-transparent">
                    <Activity size={26} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {t('Nutrición', { defaultValue: 'Nutrición' })}
                    </h2>
                    <p className="text-xs text-text-muted font-medium mt-0.5">
                      {t('Resumen del día', { defaultValue: 'Resumen del día' })}
                    </p>
                  </div>
                </div>
                <button onClick={() => setView('nutrition')} className="text-xs font-bold bg-bg-secondary hover:bg-bg-secondary/80 px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-text-primary">
                  {t('Ver Diario', { defaultValue: 'Ver Diario' })} <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-10 relative z-10 justify-items-center">
                <button onClick={() => setView('nutrition')} className="group/item flex flex-col items-center gap-4 transition-transform hover:scale-105">
                  <CircularProgress value={nutritionTotals.calories} maxValue={targets.calories} label={t('Calorías', { defaultValue: 'Calorías' })} icon={Flame} color="#fbbf24" size={90} strokeWidth={8} />
                </button>
                <button onClick={() => setView('nutrition')} className="group/item flex flex-col items-center gap-4 transition-transform hover:scale-105">
                  <CircularProgress value={parseFloat(nutritionTotals.protein.toFixed(1))} maxValue={targets.protein} label={t('Proteína', { defaultValue: 'Proteína' })} icon={Beef} color="#fb7185" size={90} strokeWidth={8} />
                </button>

                <button
                  onClick={() => isSugarExceeded ? setShowSugarModal(true) : setView('nutrition')}
                  className="group/item flex flex-col items-center gap-4 transition-transform hover:scale-105 relative"
                >
                  {isSugarExceeded && (
                    <div className="absolute -top-3 -right-2 z-20 animate-pulse drop-shadow-md">
                      <TriangleAlert size={24} strokeWidth={3} color="#ef4444" />
                    </div>
                  )}
                  <CircularProgress
                    value={parseFloat(nutritionTotals.sugar.toFixed(1))}
                    maxValue={targets.sugar}
                    label={t('Azúcar', { defaultValue: 'Azúcar' })}
                    icon={isSugarExceeded ? TriangleAlert : IceCream}
                    color={isSugarExceeded ? "#ef4444" : "#f472b6"}
                    displayText={`${Math.round(nutritionTotals.sugar)}/${targets.sugar}`}
                    pulse={isSugarExceeded}
                    size={90}
                    strokeWidth={8}
                  />
                </button>

                <button onClick={() => setModal({ type: 'water' })} className="group/item flex flex-col items-center gap-4 transition-transform hover:scale-105">
                  <CircularProgress value={waterLog?.quantity_ml || 0} maxValue={targets.water} label={t('Agua', { defaultValue: 'Agua' })} icon={Droplet} color="#38bdf8" size={90} strokeWidth={8} />
                </button>
                <button onClick={() => setModal({ type: 'creatine' })} className="group/item flex flex-col items-center gap-4 transition-transform hover:scale-105">
                  <CircularProgress value={todaysCreatineLog.length} maxValue={2} label={t('Creatina', { defaultValue: 'Creatina' })} icon={todaysCreatineLog.length > 0 ? CheckCircle : XCircle} color={todaysCreatineLog.length > 0 ? '#a78bfa' : 'var(--text-muted)'} displayText={todaysCreatineLog.length > 0 ? `${todaysCreatineLog.length}/2` : '0/2'} size={90} strokeWidth={8} />
                </button>
              </div>
            </GlassCard>
          </section>

          {/* ACCESO RÁPIDO - CARDIO */}
          <section id="tour-quick-cardio">
            <div className="flex items-center gap-3 mb-6 px-1">
              <Zap size={24} className="text-accent" />
              <h2 className="text-xl font-bold">
                {t('Cardio Rápido', { defaultValue: 'Cardio Rápido' })}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[{ name: 'Cinta', key: 'Cinta', icon: Footprints }, { name: 'Bici', key: 'Bici', icon: Bike }, { name: 'Elíptica', key: 'Elíptica', icon: Activity }].map(item => (
                <GlassCard
                  key={item.key}
                  className="relative p-0 overflow-hidden rounded-[1.5rem] group hover:-translate-y-1 transition-all h-36 cursor-pointer border-transparent dark:border dark:border-white/10 bg-bg-secondary/40 hover:bg-bg-secondary"
                >
                  <button
                    onClick={() => { startSimpleWorkout(`Cardio: ${item.name}`); setView('workout'); }}
                    className="w-full h-full flex flex-col items-center justify-center gap-4 transition-all"
                  >
                    <div className="p-3.5 rounded-full text-accent group-hover:scale-110 transition-all bg-transparent shadow-none border-none dark:bg-white/5 dark:shadow-sm dark:border dark:border-white/10 [.oled-theme_&]:bg-transparent">
                      <item.icon size={30} />
                    </div>
                    <span className="text-sm font-bold text-text-secondary group-hover:text-white transition-colors">
                      {t(item.name, { defaultValue: item.name })}
                    </span>
                  </button>
                </GlassCard>
              ))}
              <GlassCard className="relative p-0 overflow-hidden rounded-[1.5rem] group hover:-translate-y-1 transition-all h-36 cursor-pointer border-transparent dark:border dark:border-white/10 bg-transparent dark:bg-accent/5 hover:bg-accent/10">
                <button
                  onClick={() => setView('quickCardio')}
                  className="w-full h-full flex flex-col items-center justify-center gap-4 transition-all"
                >
                  <div className="p-3.5 rounded-full text-accent group-hover:scale-110 transition-transform bg-transparent shadow-none border-none dark:bg-white/5 dark:shadow-sm dark:border dark:border-white/10 [.oled-theme_&]:bg-transparent">
                    <LayoutGrid size={30} />
                  </div>
                  <span className="text-sm font-bold text-accent">
                    {t('Explorar', { defaultValue: 'Explorar' })}
                  </span>
                </button>
              </GlassCard>
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA (RUTINAS Y PESO) */}
        <div className="flex flex-col gap-8">

          {/* RUTINAS */}
          <section id="tour-routines">
            <div className="flex items-center justify-between mb-6 px-1">
              <div className="flex items-center gap-3">
                <Dumbbell size={24} className="text-accent" />
                <h2 className="text-xl font-bold">
                  {t('Mis Rutinas', { defaultValue: 'Mis Rutinas' })}
                </h2>
              </div>
              <button onClick={() => setView('routines', { forceTab: 'myRoutines' })} className="p-2 rounded-full hover:bg-bg-secondary text-text-secondary hover:text-white transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {routines.length > 0 ? routines.slice(0, 3).map(routine => {
                const isCompleted = completedRoutineIdsToday.map(String).includes(String(routine.id));
                const isActive = activeWorkout && String(activeWorkout.routineId) === String(routine.id);

                return (
                  <GlassCard
                    key={routine.id}
                    onClick={async () => {
                      if (isActive) { setView('workout'); return; }
                      if (!isCompleted) { await startWorkout(routine); setView('workout'); }
                    }}
                    className={`
                      group relative p-5 rounded-[1.5rem] transition-all cursor-pointer border-transparent dark:border dark:border-white/5
                      ${isActive
                        ? '!bg-accent !border-accent text-white shadow-lg shadow-accent/20 scale-[1.02]'
                        : isCompleted
                          ? '!bg-transparent dark:!bg-green-500/10 opacity-70 hover:opacity-100 !border-transparent'
                          : 'bg-bg-secondary/40 hover:bg-bg-secondary hover:shadow-md'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className={`
                          w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors border-none
                          ${isActive
                            ? 'bg-white/20'
                            : 'bg-transparent dark:bg-white/5 dark:border dark:border-white/10 [.oled-theme_&]:bg-transparent'
                          }
                        `}>
                          {isActive ? <Clock size={24} /> : (isCompleted ? <CheckCircle size={24} className="text-green-500" /> : <Play size={24} className={isActive ? 'text-white' : 'text-accent'} fill="currentColor" />)}
                        </div>
                        <div className="min-w-0">
                          <h3 className={`font-bold text-base truncate ${isActive ? 'text-white' : 'text-text-primary'}`}>{routine.name}</h3>
                          <p className={`text-xs truncate font-medium mt-0.5 ${isActive ? 'text-white/80' : 'text-text-secondary'}`}>
                            {isActive 
                              ? t('En curso', { defaultValue: 'En curso' }) 
                              : (isCompleted 
                                  ? t('Completada', { defaultValue: 'Completada' }) 
                                  : t('Iniciar entrenamiento', { defaultValue: 'Iniciar entrenamiento' }))}
                          </p>
                        </div>
                      </div>
                      {!isActive && !isCompleted && (
                        <ChevronRight size={18} className="text-text-muted group-hover:text-accent transition-colors -mr-1" />
                      )}
                    </div>
                  </GlassCard>
                );
              }) : (
                <div className="p-8 rounded-[2rem] bg-bg-secondary/20 border border-dashed border-white/10 text-center flex flex-col items-center gap-3">
                  <p className="text-sm text-text-muted">
                    {t('Sin rutinas creadas.', { defaultValue: 'Sin rutinas creadas.' })}
                  </p>
                  <button onClick={() => setView('routines')} className="text-xs font-bold text-accent bg-transparent dark:bg-accent/10 px-4 py-2 rounded-xl hover:bg-accent/20 transition-colors border border-accent/20">
                    {t('Crear primera rutina', { defaultValue: 'Crear primera rutina' })}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* PESO CORPORAL */}
          <section id="tour-weight">
            <div className="flex items-center justify-between mb-6 px-1">
              <div className="flex items-center gap-3">
                <TrophyLucide size={24} className="text-accent" />
                <h2 className="text-xl font-bold">
                  {t('Peso', { defaultValue: 'Peso' })}
                </h2>
              </div>
              <button onClick={() => setShowWeightModal(true)} className="p-2 rounded-full hover:bg-bg-secondary text-text-secondary hover:text-accent transition-colors">
                {todaysWeightLog ? <Edit size={20} /> : <Plus size={20} />}
              </button>
            </div>

            <GlassCard className="p-6 rounded-[2rem] border-transparent dark:border dark:border-white/10 relative overflow-hidden group hover:bg-bg-secondary/80 transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">
                    {t('Peso Actual', { defaultValue: 'Peso Actual' })}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-text-primary tracking-tighter">
                      {latestWeight ? latestWeight.toFixed(1) : '--'}
                    </span>
                    <span className="text-xl font-bold text-text-muted">kg</span>
                  </div>
                </div>
                {weightTrend && (
                  <div className={`flex flex-col items-end px-3 py-2 rounded-2xl ${weightTrend.bg}`}>
                    <weightTrend.icon size={24} className={weightTrend.color} />
                  </div>
                )}
              </div>

              {/* Mini lista historial */}
              <div className="space-y-3 relative z-10">
                {sortedWeightLog.length > 0 ? (
                  sortedWeightLog.slice(0, 3).map((log, index) => {
                    const trend = getWeightTrendData(parseFloat(log.weight_kg), parseFloat(sortedWeightLog[index + 1]?.weight_kg), userProfile?.goal);
                    return (
                      <div key={log.id} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-bg-primary/50 hover:bg-bg-primary transition-colors border border-transparent dark:border-white/5">
                        <span className="text-text-secondary font-medium">{new Date(log.log_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-primary text-sm">{parseFloat(log.weight_kg).toFixed(1)}</span>
                          {trend && <trend.icon size={12} className={trend.color} />}
                        </div>
                      </div>
                    );
                  })
                ) : <div className="text-sm text-text-muted italic text-center py-4">{t('Sin historial.', { defaultValue: 'Sin historial.' })}</div>}
              </div>
            </GlassCard>
          </section>

        </div>
      </div>

      {showXPModal && <XPGuideModal onClose={() => setShowXPModal(false)} />}

      {/* Modal de Objetivo de Azúcar */}
      {showSugarModal && (
        <SugarTargetModal
          isOpen={showSugarModal}
          onClose={() => setShowSugarModal(false)}
          currentSugar={nutritionTotals.sugar}
          maxSugar={targets.sugar}
        />
      )}

      {showWeightModal && <BodyWeightModal onClose={() => setShowWeightModal(false)} onSave={todaysWeightLog ? updateTodayBodyWeight : logBodyWeight} existingLog={todaysWeightLog} />}
      {modal.type === 'water' && <WaterLogModal initialQuantity={waterLog?.quantity_ml || 0} onSave={handleSaveWater} onClose={() => setModal({ type: null })} isLoading={modal.type === 'submitting'} />}
      {modal.type === 'creatine' && <CreatinaTracker onClose={() => { setModal({ type: null }); fetchDataForDate(new Date().toISOString().split('T')[0]); }} selectedDate={new Date().toISOString().split('T')[0]} />}

      {/* --- OVERLAYS DE STORIES/PR (USANDO SCALETOFIT) --- */}
      
      {/* 1. WEEKLY RECAP STORY */}
      {showWeeklyRecap && (
          <div 
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]"
              onClick={() => setShowWeeklyRecap(false)}
          >
             {/* Container: altura máx 85vh para dejar espacio y que se vea bien */}
             <div 
               className="relative w-full max-w-xl h-[85vh] flex flex-col items-center justify-between"
               onClick={(e) => e.stopPropagation()}
             >
                 {/* Botón Cerrar (Flotante) */}
                 <button
                     onClick={() => setShowWeeklyRecap(false)}
                     className="absolute top-0 right-0 z-50 p-2 bg-black/50 rounded-full text-white/80 hover:text-white hover:bg-black/70 transition-all border border-white/10 translate-x-2 -translate-y-2"
                 >
                     <X size={24} />
                 </button>

                 {/* Card Content (ScaleToFit) - flex-1 para que ocupe el espacio central y escale */}
                 <div className="flex-1 w-full min-h-0 my-4 flex items-center justify-center">
                      <ScaleToFit width={1080} height={1920}>
                          <div className="w-[1080px] h-[1920px] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10">
                              <WeeklyRecapCard
                                  ref={weeklyRecapRef}
                                  weeklyData={weeklyRecapData}
                                  userProfile={userProfile}
                              />
                          </div>
                      </ScaleToFit>
                 </div>

                 {/* Share Button (shrink-0 para que no se aplaste) */}
                 <div className="shrink-0 mb-2">
                      <button
                          onClick={handleShareRecap}
                          disabled={isSharing}
                          className="bg-white text-black px-8 py-4 rounded-full flex items-center gap-3 shadow-lg shadow-white/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                      >
                          {isSharing ? <Loader2 size={24} className="animate-spin" /> : <Share2 size={24} />}
                          <span className="font-black text-lg tracking-tight">{t('Compartir Resumen', { defaultValue: 'Compartir Resumen' })}</span>
                      </button>
                 </div>
             </div>
          </div>
      )}

      {/* --- NUEVO: MODAL LISTA DE PRs --- */}
      {showPRList && (
          <div 
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
              onClick={() => setShowPRList(false)}
          >
              <div 
                  className="w-full max-w-sm bg-bg-secondary rounded-2xl border border-glass-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10"
                  onClick={(e) => e.stopPropagation()}
              >
                  <div className="p-4 border-b border-glass-border flex justify-between items-center bg-bg-primary">
                      <h3 className="font-bold text-text-primary">
                          {t('Nuevos Récords', { defaultValue: 'Nuevos Récords' })} ({latestPRs.length})
                      </h3>
                      <button onClick={() => setShowPRList(false)} className="p-1 rounded-full hover:bg-bg-secondary text-text-secondary hover:text-text-primary">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-2 max-h-[60vh] overflow-y-auto">
                      {latestPRs.map(record => (
                          <button
                              key={record.id}
                              onClick={() => {
                                  setSelectedPR(record);
                                  setShowPRList(false);
                                  setShowPRModal(true);
                              }}
                              className="w-full flex items-center justify-between p-3 hover:bg-bg-primary rounded-xl transition-colors group"
                          >
                              {/* AQUÍ: Corregido truncate y min-w-0 para evitar doble línea */}
                              <div className="flex flex-col items-start min-w-0 flex-1 pr-4">
                                  <span className="font-semibold text-text-primary text-sm text-left w-full break-words">
                                      {t(record.exercise_name || record.exerciseName, { ns: 'exercise_names', defaultValue: record.exercise_name || record.exerciseName })}
                                  </span>
                                  <span className="text-xs text-text-secondary">
                                      {new Date(record.date).toLocaleDateString()}
                                  </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-bold text-accent text-lg">
                                      {record.weight_kg || record.weight} kg
                                  </span>
                                  <ChevronRight size={16} className="text-text-muted group-hover:text-accent" />
                              </div>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* 2. PR SHARE MODAL (Tarjeta Individual) */}
      {showPRModal && prShareData && (
          <div 
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]"
              onClick={() => setShowPRModal(false)}
          >
             <div 
               className="relative w-full max-w-xl h-[85vh] flex flex-col items-center justify-between"
               onClick={(e) => e.stopPropagation()}
             >
                 <button
                     onClick={() => setShowPRModal(false)}
                     className="absolute top-0 right-0 z-50 p-2 bg-black/50 rounded-full text-white/80 hover:text-white hover:bg-black/70 transition-all border border-white/10 translate-x-2 -translate-y-2"
                 >
                     <X size={24} />
                 </button>

                 <div className="flex-1 w-full min-h-0 my-4 flex items-center justify-center">
                      <ScaleToFit width={1080} height={1920}>
                          <div className="w-[1080px] h-[1920px] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10">
                              <PRShareCard
                                  ref={prCardRef}
                                  prData={prShareData}
                                  userName={userProfile?.username}
                              />
                          </div>
                      </ScaleToFit>
                 </div>
                 
                 <div className="shrink-0 mb-2 flex gap-3">
                      {latestPRs.length > 1 && (
                          <button
                              onClick={() => { setShowPRModal(false); setShowPRList(true); }}
                              className="bg-gray-800 text-white px-6 py-4 rounded-full flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
                          >
                              <List size={20} />
                              <span className="font-bold text-sm">{t('Ver Lista', { defaultValue: 'Ver Lista' })}</span>
                          </button>
                      )}
                      <button
                          onClick={handleSharePR}
                          disabled={isSharing}
                          className="bg-white text-black px-8 py-4 rounded-full flex items-center gap-3 shadow-lg shadow-white/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                      >
                          {isSharing ? <Loader2 size={24} className="animate-spin" /> : <Share2 size={24} />}
                          <span className="font-black text-lg tracking-tight">{t('Compartir Logro', { defaultValue: 'Compartir Logro' })}</span>
                      </button>
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;