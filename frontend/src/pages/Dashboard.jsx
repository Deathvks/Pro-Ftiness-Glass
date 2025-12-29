/* frontend/src/pages/Dashboard.jsx */
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    Dumbbell, Target, Clock, Flame, Plus, Play, Edit, Footprints,
    Bike, Activity, Repeat, Droplet, Beef, Zap, CheckCircle, XCircle,
    ArrowUp, ArrowDown, Minus, ChevronRight, Trophy, Check, Crown,
    Info
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import StatCard from '../components/StatCard';
import BodyWeightModal from '../components/BodyWeightModal';
import { isSameDay } from '../utils/helpers';
import useAppStore from '../store/useAppStore';
import { getXpRequiredForLevel, getLevelProgress } from '../store/gamificationSlice';
import CircularProgress from '../components/CircularProgress';
import CreatinaTracker from '../components/CreatinaTracker';
import WaterLogModal from '../components/WaterLogModal';
import XPGuideModal from '../components/XPGuideModal';
import * as nutritionService from '../services/nutritionService';
import { useToast } from '../hooks/useToast';

// --- Helper: Lógica de Tendencia de Peso ---
const getWeightTrendData = (current, previous, goal) => {
    if (!previous && previous !== 0) return null;

    const diff = current - previous;
    const absDiff = Math.abs(diff);

    if (absDiff < 0.1) {
        return { icon: Minus, color: 'text-text-muted', bg: 'bg-bg-secondary' };
    }

    const isGaining = diff > 0;
    let isPositiveContext = false;
    if (goal === 'gain') isPositiveContext = isGaining;
    else if (goal === 'lose') isPositiveContext = !isGaining;

    let color = 'text-text-secondary';
    let bg = 'bg-bg-secondary';

    if (goal === 'gain' || goal === 'lose') {
        color = isPositiveContext ? 'text-green' : 'text-red';
        bg = isPositiveContext ? 'bg-green/10' : 'bg-red/10';
    }

    return {
        icon: isGaining ? ArrowUp : ArrowDown,
        color,
        bg
    };
};

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

    const [showWeightModal, setShowWeightModal] = useState(false);
    const [showXPModal, setShowXPModal] = useState(false);
    const [modal, setModal] = useState({ type: null });

    useEffect(() => {
        if (checkStreak) {
            checkStreak(new Date().toISOString().split('T')[0]);
        }
    }, [checkStreak]);

    // --- Gamificación ---
    const levelData = useMemo(() => {
        const level = gamification?.level || 1;
        const xp = gamification?.xp || 0;
        const streak = gamification?.streak || 0;

        // Usamos el helper para obtener totales absolutos
        const { currentXp, nextLevelXp, progressPercent } = getLevelProgress(xp, level);

        return {
            level,
            streak,
            percentage: progressPercent,
            progress: currentXp,
            needed: nextLevelXp
        };
    }, [gamification]);

    // --- Peso ---
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

    // --- Resúmenes Semanales ---
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

    // --- Metas Nutricionales ---
    const targets = useMemo(() => {
        if (!latestWeight) return { calories: 2000, protein: 0, water: 2500 };
        const { gender, age, height, activity_level = 1.2, goal } = userProfile || {};

        let bmr = (10 * latestWeight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
        let cal = Math.round(bmr * activity_level);

        if (goal === 'lose') cal -= 500;
        if (goal === 'gain') cal += 500;

        const protMult = goal === 'gain' ? 2.0 : goal === 'lose' ? 1.8 : 1.6;

        return {
            calories: cal,
            protein: Math.round(latestWeight * protMult),
            water: Math.round(latestWeight * 35)
        };
    }, [userProfile, latestWeight]);

    const nutritionTotals = useMemo(() => (nutritionLog || []).reduce((acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (parseFloat(log.protein_g) || 0)
    }), { calories: 0, protein: 0 }), [nutritionLog]);

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
        <div className="w-full max-w-7xl mx-auto px-4 pt-6 pb-6 md:p-8 lg:p-10 animate-[fade-in_0.5s_ease-out]">
            <Helmet>
                <title>Dashboard - Pro Fitness Glass</title>
            </Helmet>

            {/* Header + Gamification */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8 items-start">
                <div>
                    <h1 className="hidden md:inline-block text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary">
                        Dashboard
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Hola, <span className="text-accent font-semibold">{userProfile?.username || 'Atleta'}</span>.
                    </p>
                </div>

                {/* Gamification Card */}
                <GlassCard className="w-auto self-start flex-shrink-0 p-3 sm:p-4 flex items-center gap-3 sm:gap-4 bg-gradient-to-br from-bg-secondary/80 to-accent/5 border-accent/20 overflow-hidden">
                    <div className="relative flex-shrink-0">
                        {/* Tamaño estándar restaurado */}
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-accent/20 flex items-center justify-center border-2 border-accent text-accent font-black text-lg md:text-2xl shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]">
                            {levelData.level}
                        </div>
                        <div className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-bg-primary rounded-full p-0.5 md:p-1 border border-glass-border shadow-sm">
                            <Crown size={12} className="md:w-[14px] md:h-[14px] text-amber-400 fill-amber-400" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex flex-wrap justify-between items-end mb-1 gap-x-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-wider truncate">Nivel {levelData.level}</span>
                                <button onClick={() => setShowXPModal(true)} className="text-text-muted hover:text-accent transition-colors flex-shrink-0">
                                    <Info size={12} className="md:w-[14px] md:h-[14px]" />
                                </button>
                            </div>
                            <span className="text-[10px] md:text-xs font-medium text-text-muted text-right truncate w-auto">
                                {levelData.progress} / {levelData.needed} XP
                            </span>
                        </div>

                        {/* Barra de progreso: Borde unificado con el contenedor */}
                        <div className="h-1.5 md:h-2 w-full bg-bg-primary rounded-full overflow-hidden border border-glass-border">
                            <div className="h-full bg-gradient-to-r from-accent to-accent-light transition-all duration-1000 ease-out" style={{ width: `${levelData.percentage}%` }} />
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center pl-2 md:pl-3 border-l border-glass-border flex-shrink-0">
                        <div className={`transition-all duration-500 ${levelData.streak > 0 ? 'text-accent drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]' : 'text-text-muted opacity-50'}`}>
                            <Flame size={20} className="md:w-[24px] md:h-[24px]" fill={levelData.streak > 0 ? "currentColor" : "none"} />
                        </div>
                        <span className="text-[10px] md:text-xs font-bold mt-0.5">{levelData.streak} días</span>
                    </div>
                </GlassCard>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <GlassCard className="p-4 flex flex-col justify-between h-full relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-accent/10 rounded-lg text-accent"><Dumbbell size={20} /></div>
                            <span className="text-sm font-medium text-text-muted">Sesiones</span>
                        </div>
                        <span className="text-2xl font-bold text-text-primary">{weeklySessions}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        {weekDays.map((date, i) => {
                            const dayLetters = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
                            const isToday = isSameDay(date, new Date());
                            const hasWorkout = workoutLog.some(log => isSameDay(new Date(log.workout_date), date));
                            return (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <span className={`text-xs font-semibold ${isToday ? 'text-accent' : 'text-text-muted'}`}>{dayLetters[i]}</span>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${hasWorkout ? 'bg-accent text-white shadow-lg shadow-accent/25' : 'bg-bg-secondary/50 text-transparent'}`}>
                                        {hasWorkout && <Check size={16} strokeWidth={3} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>
                <StatCard icon={<Target size={24} />} title="Meta Calórica" value={targets.calories.toLocaleString()} unit="kcal" />
                <StatCard icon={<Clock size={24} />} title="Tiempo Activo" value={weeklyTimeDisplay} unit="" />
                <StatCard icon={<Flame size={24} />} title="Quemadas" value={weeklyCalories.toLocaleString()} unit="kcal" />
            </div>

            {/* Nutrition Summary */}
            <section className="mb-8">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <Activity size={20} className="text-accent" />
                    <h2 className="text-xl font-bold">Resumen de Hoy</h2>
                </div>
                <GlassCard className="p-6 relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5">
                    <div className="hidden md:block absolute -right-6 -bottom-8 opacity-5 pointer-events-none transform rotate-12">
                        <Activity size={160} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                        <button onClick={() => setView('nutrition')} className="group flex flex-col items-center gap-2 transition-transform hover:scale-105">
                            <CircularProgress value={nutritionTotals.calories} maxValue={targets.calories} label="Calorías" icon={Flame} colorClass="text-amber-400" />
                        </button>
                        <button onClick={() => setView('nutrition')} className="group flex flex-col items-center gap-2 transition-transform hover:scale-105">
                            <CircularProgress value={parseFloat(nutritionTotals.protein.toFixed(1))} maxValue={targets.protein} label="Proteína" icon={Beef} colorClass="text-rose-400" />
                        </button>
                        <button onClick={() => setModal({ type: 'water' })} className="group flex flex-col items-center gap-2 transition-transform hover:scale-105">
                            <CircularProgress value={waterLog?.quantity_ml || 0} maxValue={targets.water} label="Agua" icon={Droplet} colorClass="text-sky-400" />
                        </button>
                        <button onClick={() => setModal({ type: 'creatine' })} className="group flex flex-col items-center gap-2 transition-transform hover:scale-105">
                            <CircularProgress value={todaysCreatineLog.length} maxValue={2} label="Creatina" icon={todaysCreatineLog.length > 0 ? CheckCircle : XCircle} colorClass={todaysCreatineLog.length > 0 ? 'text-violet-400' : 'text-text-muted'} displayText={todaysCreatineLog.length > 0 ? `${todaysCreatineLog.length}/2` : '0/2'} />
                        </button>
                    </div>
                </GlassCard>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left: Routines & Cardio */}
                <div className="flex flex-col gap-8">
                    <section>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-2"><Dumbbell size={20} className="text-accent" /><h2 className="text-xl font-bold">Rutinas</h2></div>
                            <button onClick={() => setView('routines', { forceTab: 'myRoutines' })} className="text-xs font-semibold text-accent flex items-center gap-1">Ver todas <ChevronRight size={14} /></button>
                        </div>
                        <div className="flex flex-col gap-4">
                            {routines.length > 0 ? routines.slice(0, 3).map(routine => {
                                const isCompleted = completedRoutineIdsToday.map(String).includes(String(routine.id));
                                const isActive = activeWorkout && String(activeWorkout.routineId) === String(routine.id);

                                return (
                                    <GlassCard
                                        key={routine.id}
                                        className={`p-0 overflow-hidden transition-all ${isActive ? 'ring-2 ring-accent' : (isCompleted ? 'opacity-75' : 'hover:-translate-y-1')}`}
                                    >
                                        <button
                                            onClick={async () => {
                                                if (isActive) { setView('workout'); return; }
                                                if (!isCompleted) { await startWorkout(routine); setView('workout'); }
                                            }}
                                            disabled={isCompleted && !isActive}
                                            className={`w-full text-left p-4 flex items-center justify-between group 
                                                ${isActive ? 'bg-accent/10' : (isCompleted ? 'cursor-not-allowed bg-white/5' : 'hover:bg-white/5')}
                                            `}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                                                    ${isActive
                                                        ? 'bg-accent text-white'
                                                        : (isCompleted
                                                            ? 'bg-green-500/20 text-green-500'
                                                            : 'bg-bg-secondary text-text-secondary group-hover:bg-accent/20 group-hover:text-accent')
                                                    }
                                                `}>
                                                    {isActive ? <Clock size={20} /> : (isCompleted ? <CheckCircle size={20} /> : <Play size={20} fill="currentColor" />)}
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold ${isActive ? 'text-accent' : (isCompleted ? 'text-text-muted' : 'text-text-primary')}`}>
                                                        {routine.name}
                                                    </h3>
                                                    <p className="text-xs text-text-secondary">
                                                        {isActive ? 'En curso' : (isCompleted ? 'Completada hoy' : 'Iniciar')}
                                                    </p>
                                                </div>
                                            </div>
                                            {!isCompleted && !isActive && (
                                                <div className="opacity-0 group-hover:opacity-100 text-accent transition-opacity">
                                                    <ChevronRight size={20} />
                                                </div>
                                            )}
                                        </button>
                                    </GlassCard>
                                );
                            }) : (
                                <GlassCard className="p-8 text-center"><p className="text-text-muted mb-4">Sin rutinas.</p><button onClick={() => setView('routines')} className="text-accent font-bold">Crear rutina</button></GlassCard>
                            )}
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-2 mb-4 px-1"><Zap size={20} className="text-accent" /><h2 className="text-xl font-bold">Cardio Rápido</h2></div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[{ name: 'Cinta', icon: Footprints }, { name: 'Bici', icon: Bike }, { name: 'Elíptica', icon: Activity }, { name: 'Comba', icon: Repeat }].map(item => (
                                <GlassCard key={item.name} className="p-0 overflow-hidden group hover:-translate-y-1">
                                    <button onClick={() => { startSimpleWorkout(`Cardio: ${item.name}`); setView('workout'); }} className="w-full h-full p-4 flex flex-col items-center justify-center gap-2 hover:bg-accent/10 transition-colors">
                                        <item.icon size={24} className="text-accent group-hover:text-white" />
                                        <span className="text-sm font-semibold">{item.name}</span>
                                    </button>
                                </GlassCard>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right: Weight */}
                <div className="flex flex-col gap-8">
                    <section>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-2"><Trophy size={20} className="text-accent" /><h2 className="text-xl font-bold">Peso Corporal</h2></div>
                            <button onClick={() => setShowWeightModal(true)} className="text-xs font-semibold text-accent flex items-center gap-1">
                                {todaysWeightLog ? <><Edit size={14} /> Editar</> : <><Plus size={14} /> Registrar</>}
                            </button>
                        </div>

                        <GlassCard className="p-6 relative overflow-hidden hover:-translate-y-1 transition-all">
                            <div className="flex items-end justify-between mb-8">
                                <div>
                                    <p className="text-sm text-text-secondary uppercase font-semibold mb-1">Actual</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-extrabold text-text-primary tracking-tight">{latestWeight ? latestWeight.toFixed(1) : '--'}</span>
                                        <span className="text-xl text-text-muted font-medium">kg</span>
                                    </div>
                                </div>
                                {weightTrend && (
                                    <div className={`flex flex-col items-end ${weightTrend.color}`}>
                                        <weightTrend.icon size={32} />
                                        <span className="text-xs font-bold mt-1 uppercase">Tendencia</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Historial</p>
                                {sortedWeightLog.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {sortedWeightLog.slice(0, 3).map((log, index) => {
                                            const trend = getWeightTrendData(parseFloat(log.weight_kg), parseFloat(sortedWeightLog[index + 1]?.weight_kg), userProfile?.goal);
                                            return (
                                                <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-secondary/40 border border-transparent hover:border-glass-border transition-colors">
                                                    <span className="text-sm font-medium text-text-secondary">{new Date(log.log_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-text-primary">{parseFloat(log.weight_kg).toFixed(1)} <span className="text-xs font-normal text-text-muted">kg</span></span>
                                                        {trend && <trend.icon size={14} className={trend.color} />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : <div className="p-4 text-center text-sm text-text-muted italic">Sin registros.</div>}
                            </div>
                        </GlassCard>
                    </section>
                </div>
            </div>

            {showXPModal && <XPGuideModal onClose={() => setShowXPModal(false)} />}
            {showWeightModal && <BodyWeightModal onClose={() => setShowWeightModal(false)} onSave={todaysWeightLog ? updateTodayBodyWeight : logBodyWeight} existingLog={todaysWeightLog} />}
            {modal.type === 'water' && <WaterLogModal initialQuantity={waterLog?.quantity_ml || 0} onSave={handleSaveWater} onClose={() => setModal({ type: null })} isLoading={modal.type === 'submitting'} />}
            {modal.type === 'creatine' && <CreatinaTracker onClose={() => { setModal({ type: null }); fetchDataForDate(new Date().toISOString().split('T')[0]); }} selectedDate={new Date().toISOString().split('T')[0]} />}
        </div>
    );
};

export default Dashboard;