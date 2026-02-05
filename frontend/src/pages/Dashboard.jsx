/* frontend/src/pages/Dashboard.jsx */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Dumbbell, Target, Clock, Flame, Plus, Play, Edit, Footprints,
  Bike, Activity, Droplet, Beef, Zap, CheckCircle, XCircle,
  ArrowUp, ArrowDown, Minus, ChevronRight, Trophy, Check, Crown,
  LayoutGrid, IceCream, TriangleAlert, Info, Utensils
} from 'lucide-react';
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
  // eslint-disable-next-line no-unused-vars
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

// --- COMPONENTE: Bento Stat Card (Corregido: Fondos y Bordes) ---
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
      {/* CORRECCIÓN VISUAL:
          - Light: bg-transparent, sin sombra, sin borde.
          - Dark: bg-white/5, sombra suave, borde blanco/20 visible.
          - OLED: bg-transparent FORZADO.
      */}
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
  const {
    routines, workoutLog, bodyWeightLog, userProfile, logBodyWeight,
    updateTodayBodyWeight, startWorkout, startSimpleWorkout, nutritionLog,
    waterLog, todaysCreatineLog, fetchDataForDate,
    completedRoutineIdsToday,
    activeWorkout,
    gamification,
    checkStreak,
    addXp
  } = useAppStore(state => ({
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
    addXp: state.addXp
  }));

  const { cancelLoginReminder } = useLocalNotifications();

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showXPModal, setShowXPModal] = useState(false);
  const [showSugarModal, setShowSugarModal] = useState(false);
  const [modal, setModal] = useState({ type: null });

  const streakCheckedRef = useRef(false);

  useEffect(() => {
    if (checkStreak && !streakCheckedRef.current) {
      checkStreak(new Date().toISOString().split('T')[0]);
      streakCheckedRef.current = true;
      // Si el usuario entra al dashboard, cancelamos el recordatorio de login de hoy
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

  const { weeklySessions, weeklyTimeDisplay, weeklyCalories, weekDays } = useMemo(() => {
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

    return {
      weekDays: days,
      weeklySessions: logs.length,
      weeklyCalories: logs.reduce((acc, log) => acc + (log.calories_burned || 0), 0),
      weeklyTimeDisplay: seconds < 3600 ? `${Math.round(seconds / 60)} min` : `${(seconds / 3600).toFixed(1)} h`
    };
  }, [workoutLog]);

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
      addToast('Registro actualizado.', 'success');
      await fetchDataForDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      addToast('Error al guardar.', 'error');
    } finally {
      setModal({ type: null });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pt-4 pb-24 md:p-10 animate-[fade-in_0.5s_ease-out]">
      <Helmet>
        <title>Dashboard - Pro Fitness Glass</title>
      </Helmet>

      <TourGuide />

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 items-start">
        <div className="space-y-2">
          <h1 className="hidden md:block text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight">
            Dashboard
          </h1>
          <div className="flex items-center gap-2 text-lg text-text-secondary">
            <span>Hola,</span>
            <span className="text-accent font-bold px-1">
              {userProfile?.username || 'Atleta'}
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
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider whitespace-nowrap">Nivel Actual</span>
                <button onClick={(e) => { e.stopPropagation(); setShowXPModal(true); }} className="text-text-muted hover:text-accent transition-colors">
                  <Info size={12} />
                </button>
              </div>
              <span className="text-[10px] font-bold text-accent bg-transparent dark:bg-accent/10 [.oled-theme_&]:bg-transparent px-2 py-0.5 rounded-full whitespace-nowrap">
                {levelData.progress} / {levelData.needed} XP
              </span>
            </div>
            {/* --- INICIO MODIFICACIÓN: Borde en la barra de progreso --- */}
            <div className="h-2.5 w-full sm:w-48 bg-bg-primary rounded-full overflow-hidden border border-black/5 dark:border-white/10">
              <div className="h-full bg-accent rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" style={{ width: `${levelData.percentage}%` }} />
            </div>
            {/* --- FIN MODIFICACIÓN --- */}
          </div>

          <div className="flex flex-col items-center justify-center pl-6 border-l border-white/5 flex-shrink-0">
            <div className={`transition-all duration-500 mb-1 ${levelData.streak > 0 ? 'text-accent drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.6)]' : 'text-text-muted opacity-30'}`}>
              <Flame size={26} fill={levelData.streak > 0 ? "currentColor" : "none"} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary">{levelData.streak} DÍAS</span>
          </div>
        </GlassCard>
      </div>

      {/* GRID DE ESTADÍSTICAS */}
      <div id="tour-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

        {/* 1. SESIONES */}
        <GlassCard className="p-5 flex flex-col justify-between h-full min-h-[160px] border-transparent dark:border dark:border-white/10 hover:shadow-lg relative overflow-hidden group hover:bg-bg-secondary transition-all">
          <div className="flex justify-between items-start mb-4">
            {/* ICONO SESIONES:
               Light: Transparente absoluto.
               Dark: Borde visible blanco/20, fondo sutil.
               OLED: Transparente absoluto (sin fondo).
            */}
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
          title="Meta Calórica"
          value={targets.calories.toLocaleString()}
          unit="kcal"
          icon={Target}
          iconColor="text-accent"
          subtext="Objetivo diario"
        />

        {/* 3. TIEMPO ACTIVO */}
        <BentoStatCard
          title="Tiempo Activo"
          value={weeklyTimeDisplay}
          icon={Clock}
          iconColor="text-accent"
          subtext="Total semanal"
        />

        {/* 4. QUEMADAS */}
        <BentoStatCard
          title="Quemadas"
          value={weeklyCalories.toLocaleString()}
          unit="kcal"
          icon={Flame}
          iconColor="text-accent"
          subtext="Total estimado"
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
                  {/* ICONO NUTRICIÓN PRINCIPAL */}
                  <div className="p-3.5 rounded-2xl text-accent transition-transform bg-transparent shadow-none border-none dark:bg-white/5 dark:shadow-sm dark:border dark:border-white/20 [.oled-theme_&]:bg-transparent">
                    <Activity size={26} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Nutrición</h2>
                    <p className="text-xs text-text-muted font-medium mt-0.5">Resumen del día</p>
                  </div>
                </div>
                <button onClick={() => setView('nutrition')} className="text-xs font-bold bg-bg-secondary hover:bg-bg-secondary/80 px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-text-primary">
                  Ver Diario <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-10 relative z-10 justify-items-center">
                <button onClick={() => setView('nutrition')} className="group/item flex flex-col items-center gap-4 transition-transform hover:scale-105">
                  <CircularProgress value={nutritionTotals.calories} maxValue={targets.calories} label="Calorías" icon={Flame} color="#fbbf24" size={90} strokeWidth={8} />
                </button>
                <button onClick={() => setView('nutrition')} className="group/item flex flex-col items-center gap-4 transition-transform hover:scale-105">
                  <CircularProgress value={parseFloat(nutritionTotals.protein.toFixed(1))} maxValue={targets.protein} label="Proteína" icon={Beef} color="#fb7185" size={90} strokeWidth={8} />
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
                    label="Azúcar"
                    icon={isSugarExceeded ? TriangleAlert : IceCream}
                    color={isSugarExceeded ? "#ef4444" : "#f472b6"}
                    displayText={`${Math.round(nutritionTotals.sugar)}/${targets.sugar}`}
                    pulse={isSugarExceeded}
                    size={90}
                    strokeWidth={8}
                  />
                </button>

                <button onClick={() => setModal({ type: 'water' })} className="group/item flex flex-col items-center gap-4 transition-transform hover:scale-105">
                  <CircularProgress value={waterLog?.quantity_ml || 0} maxValue={targets.water} label="Agua" icon={Droplet} color="#38bdf8" size={90} strokeWidth={8} />
                </button>
                <button onClick={() => setModal({ type: 'creatine' })} className="group/item flex flex-col items-center gap-4 transition-transform hover:scale-105">
                  <CircularProgress value={todaysCreatineLog.length} maxValue={2} label="Creatina" icon={todaysCreatineLog.length > 0 ? CheckCircle : XCircle} color={todaysCreatineLog.length > 0 ? '#a78bfa' : 'var(--text-muted)'} displayText={todaysCreatineLog.length > 0 ? `${todaysCreatineLog.length}/2` : '0/2'} size={90} strokeWidth={8} />
                </button>
              </div>
            </GlassCard>
          </section>

          {/* ACCESO RÁPIDO - CARDIO */}
          <section id="tour-quick-cardio">
            <div className="flex items-center gap-3 mb-6 px-1">
              <Zap size={24} className="text-accent" />
              <h2 className="text-xl font-bold">Cardio Rápido</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[{ name: 'Cinta', icon: Footprints }, { name: 'Bici', icon: Bike }, { name: 'Elíptica', icon: Activity }].map(item => (
                <GlassCard
                  key={item.name}
                  className="relative p-0 overflow-hidden rounded-[1.5rem] group hover:-translate-y-1 transition-all h-36 cursor-pointer border-transparent dark:border dark:border-white/10 bg-bg-secondary/40 hover:bg-bg-secondary"
                >
                  <button
                    onClick={() => { startSimpleWorkout(`Cardio: ${item.name}`); setView('workout'); }}
                    className="w-full h-full flex flex-col items-center justify-center gap-4 transition-all"
                  >
                    {/* ICONOS CARDIO */}
                    <div className="p-3.5 rounded-full text-accent group-hover:scale-110 transition-all bg-transparent shadow-none border-none dark:bg-white/5 dark:shadow-sm dark:border dark:border-white/10 [.oled-theme_&]:bg-transparent">
                      <item.icon size={30} />
                    </div>
                    <span className="text-sm font-bold text-text-secondary group-hover:text-white transition-colors">{item.name}</span>
                  </button>
                </GlassCard>
              ))}
              <GlassCard className="relative p-0 overflow-hidden rounded-[1.5rem] group hover:-translate-y-1 transition-all h-36 cursor-pointer border-transparent dark:border dark:border-white/10 bg-transparent dark:bg-accent/5 hover:bg-accent/10">
                <button
                  onClick={() => setView('quickCardio')}
                  className="w-full h-full flex flex-col items-center justify-center gap-4 transition-all"
                >
                  {/* ICONO EXPLORAR */}
                  <div className="p-3.5 rounded-full text-accent group-hover:scale-110 transition-transform bg-transparent shadow-none border-none dark:bg-white/5 dark:shadow-sm dark:border dark:border-white/10 [.oled-theme_&]:bg-transparent">
                    <LayoutGrid size={30} />
                  </div>
                  <span className="text-sm font-bold text-accent">Explorar</span>
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
                <h2 className="text-xl font-bold">Mis Rutinas</h2>
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
                        {/* ICONO RUTINA */}
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
                            {isActive ? 'En curso' : (isCompleted ? 'Completada' : 'Iniciar entrenamiento')}
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
                  <p className="text-sm text-text-muted">Sin rutinas creadas.</p>
                  <button onClick={() => setView('routines')} className="text-xs font-bold text-accent bg-transparent dark:bg-accent/10 px-4 py-2 rounded-xl hover:bg-accent/20 transition-colors border border-accent/20">
                    Crear primera rutina
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* PESO CORPORAL */}
          <section id="tour-weight">
            <div className="flex items-center justify-between mb-6 px-1">
              <div className="flex items-center gap-3">
                <Trophy size={24} className="text-accent" />
                <h2 className="text-xl font-bold">Peso</h2>
              </div>
              <button onClick={() => setShowWeightModal(true)} className="p-2 rounded-full hover:bg-bg-secondary text-text-secondary hover:text-accent transition-colors">
                {todaysWeightLog ? <Edit size={20} /> : <Plus size={20} />}
              </button>
            </div>

            <GlassCard className="p-6 rounded-[2rem] border-transparent dark:border dark:border-white/10 relative overflow-hidden group hover:bg-bg-secondary/80 transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Peso Actual</p>
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
                ) : <div className="text-sm text-text-muted italic text-center py-4">Sin historial.</div>}
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
    </div>
  );
};

export default Dashboard;