/* frontend/src/pages/Dashboard.jsx */
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    Dumbbell, Target, Clock, Flame, Plus, Play, Edit, Footprints,
    Bike, Activity, Repeat, Droplet, Beef, Zap, CheckCircle, XCircle,
    ArrowUp, ArrowDown, Minus, ChevronRight, Trophy, Check
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import StatCard from '../components/StatCard';
import BodyWeightModal from '../components/BodyWeightModal';
import { isSameDay } from '../utils/helpers';
import useAppStore from '../store/useAppStore';
import CircularProgress from '../components/CircularProgress';
import CreatinaTracker from '../components/CreatinaTracker';
import WaterLogModal from '../components/WaterLogModal';
import * as nutritionService from '../services/nutritionService';
import { useToast } from '../hooks/useToast';

const Dashboard = ({ setView }) => {
    const { addToast } = useToast();
    const {
        routines, workoutLog, bodyWeightLog, userProfile, logBodyWeight,
        updateTodayBodyWeight, startWorkout, startSimpleWorkout, nutritionLog,
        waterLog, todaysCreatineLog, fetchDataForDate,
        completedRoutineIdsToday,
        activeWorkout
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
    }));

    const [showWeightModal, setShowWeightModal] = useState(false);
    const [modal, setModal] = useState({ type: null });

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

        const latest = parseFloat(sortedWeightLog[0].weight_kg);
        const previous = parseFloat(sortedWeightLog[1].weight_kg);
        const goal = userProfile?.goal;
        const diff = latest - previous;

        if (Math.abs(diff) < 0.1) {
            return { icon: Minus, color: 'text-text-muted', bg: 'bg-bg-secondary' };
        }

        const isGaining = diff > 0;

        if (goal === 'gain') {
            return isGaining
                ? { icon: ArrowUp, color: 'text-green', bg: 'bg-green/10' }
                : { icon: ArrowDown, color: 'text-red', bg: 'bg-red/10' };
        }
        if (goal === 'lose') {
            return !isGaining
                ? { icon: ArrowDown, color: 'text-green', bg: 'bg-green/10' }
                : { icon: ArrowUp, color: 'text-red', bg: 'bg-red/10' };
        }

        return isGaining
            ? { icon: ArrowUp, color: 'text-text-secondary', bg: 'bg-bg-secondary' }
            : { icon: ArrowDown, color: 'text-text-secondary', bg: 'bg-bg-secondary' };
    }, [sortedWeightLog, userProfile?.goal]);

    const getTrendForLog = (currentLog, previousLog) => {
        if (!previousLog) return null;

        const current = parseFloat(currentLog.weight_kg);
        const previous = parseFloat(previousLog.weight_kg);
        const goal = userProfile?.goal;
        const diff = current - previous;

        if (Math.abs(diff) < 0.1) {
            return { icon: Minus, color: 'text-text-muted' };
        }

        const isGaining = diff > 0;

        if (goal === 'gain') {
            return isGaining
                ? { icon: ArrowUp, color: 'text-green' }
                : { icon: ArrowDown, color: 'text-red' };
        }
        if (goal === 'lose') {
            return !isGaining
                ? { icon: ArrowDown, color: 'text-green' }
                : { icon: ArrowUp, color: 'text-red' };
        }

        return isGaining
            ? { icon: ArrowUp, color: 'text-text-secondary' }
            : { icon: ArrowDown, color: 'text-text-secondary' };
    };

    // --- Lógica de la semana actual ---
    const weekDays = useMemo(() => {
        const today = new Date();
        const day = today.getDay(); // 0 (Domingo) - 6 (Sábado)
        // Calcular el Lunes de esta semana
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), diff);
        startOfWeek.setHours(0, 0, 0, 0);

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d;
        });
    }, []);

    const weeklyLogs = useMemo(() => {
        if (!weekDays.length) return [];
        const startOfWeek = weekDays[0];
        return workoutLog.filter(log => new Date(log.workout_date) >= startOfWeek);
    }, [workoutLog, weekDays]);

    const weeklySessions = weeklyLogs.length;
    const weeklyTimeInSeconds = weeklyLogs.reduce((acc, log) => acc + log.duration_seconds, 0);
    const weeklyTimeDisplay = weeklyTimeInSeconds < 3600 ? `${Math.round(weeklyTimeInSeconds / 60)} min` : `${(weeklyTimeInSeconds / 3600).toFixed(1)} h`;
    const weeklyCalories = weeklyLogs.reduce((acc, log) => acc + (log.calories_burned || 0), 0);

    const calorieTarget = useMemo(() => {
        if (!userProfile || !userProfile.goal || !latestWeight) return 2000;
        const { gender, age, height, activity_level, goal } = userProfile;
        let bmr = gender === 'male'
            ? 88.362 + (13.397 * latestWeight) + (4.799 * height) - (5.677 * age)
            : 447.593 + (9.247 * latestWeight) + (3.098 * height) - (4.330 * age);
        let target = bmr * activity_level;
        if (goal === 'lose') target -= 500;
        if (goal === 'gain') target += 500;
        return Math.round(target);
    }, [userProfile, latestWeight]);

    const proteinTarget = useMemo(() => {
        if (!latestWeight || !userProfile?.goal) return 0;
        const multiplier = userProfile.goal === 'gain' ? 2.0 : userProfile.goal === 'lose' ? 1.8 : 1.6;
        return Math.round(latestWeight * multiplier);
    }, [latestWeight, userProfile]);

    const waterTarget = useMemo(() => {
        if (!latestWeight) return 2500;
        return Math.round(latestWeight * 35);
    }, [latestWeight]);

    const nutritionTotals = useMemo(() => {
        return (nutritionLog || []).reduce((acc, log) => {
            acc.calories += log.calories || 0;
            acc.protein += parseFloat(log.protein_g) || 0;
            return acc;
        }, { calories: 0, protein: 0 });
    }, [nutritionLog]);

    const handleSaveWater = async (quantity_ml) => {
        setModal({ type: 'submitting' });
        try {
            await nutritionService.upsertWaterLog({ log_date: new Date().toISOString().split('T')[0], quantity_ml });
            addToast('Registro de agua actualizado.', 'success');
            await fetchDataForDate(new Date().toISOString().split('T')[0]);
        } catch (error) {
            addToast(error.message || 'Error al guardar el agua.', 'error');
        } finally {
            setModal({ type: null });
        }
    };

    return (
        /* --- MODIFICADO: Añadido pt-6 para dar espacio en móvil, md:p-8 mantiene el padding en escritorio --- */
        <div className="w-full max-w-7xl mx-auto px-4 pt-6 pb-20 md:p-8 lg:p-10 animate-[fade-in_0.5s_ease-out]">
            <Helmet>
                <title>Dashboard - Pro Fitness Glass</title>
                <meta name="description" content="Tu resumen diario de actividad física, nutrición, peso corporal y acceso rápido a tus rutinas y entrenamientos." />
            </Helmet>

            {/* Header Section - MODIFICADO: hidden en móvil, block en md+ */}
            <div className="mb-8 hidden md:block">
                <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary inline-block">
                    Dashboard
                </h1>
                <p className="text-text-secondary mt-2">
                    Bienvenido de nuevo, <span className="text-accent font-semibold">{userProfile?.username || 'Atleta'}</span>.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Custom Weekly Sessions Card */}
                <GlassCard className="p-4 flex flex-col justify-between h-full relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-accent/10 rounded-lg text-accent">
                                <Dumbbell size={20} />
                            </div>
                            <span className="text-sm font-medium text-text-muted">Sesiones</span>
                        </div>
                        <span className="text-2xl font-bold text-text-primary">{weeklySessions}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        {weekDays.map((date, i) => {
                            const dayLetters = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
                            const isToday = isSameDay(date, new Date());
                            // Buscamos si hay logs en este día
                            const hasWorkout = workoutLog.some(log => isSameDay(new Date(log.workout_date), date));

                            return (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    {/* Día arriba */}
                                    <span className={`text-xs font-semibold ${isToday ? 'text-accent' : 'text-text-muted'}`}>
                                        {dayLetters[i]}
                                    </span>

                                    {/* Círculo abajo con check */}
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                                        ${hasWorkout
                                            ? 'bg-accent text-white shadow-lg shadow-accent/25'
                                            : 'bg-bg-secondary/50 text-transparent'
                                        }
                                    `}>
                                        {hasWorkout && <Check size={16} strokeWidth={3} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>

                <StatCard icon={<Target size={24} />} title="Meta Calórica" value={calorieTarget?.toLocaleString('es-ES') ?? 'N/A'} unit="kcal" />
                <StatCard icon={<Clock size={24} />} title="Tiempo Activo" value={weeklyTimeDisplay} unit="" />
                <StatCard icon={<Flame size={24} />} title="Quemadas" value={weeklyCalories.toLocaleString('es-ES')} unit="kcal" />
            </div>

            {/* Today's Summary Section */}
            <section className="mb-8">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <Activity size={20} className="text-accent" />
                    <h2 className="text-xl font-bold">Resumen de Hoy</h2>
                </div>
                <GlassCard className="p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5">
                    <div className="hidden md:block absolute -right-6 -bottom-8 opacity-5 pointer-events-none transform rotate-12">
                        <Activity size={160} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                        {/* Nutrition Circle */}
                        <button onClick={() => setView('nutrition')} className="group flex flex-col items-center gap-2 transition-transform hover:scale-105">
                            <CircularProgress value={nutritionTotals.calories} maxValue={calorieTarget} label="Calorías" icon={Flame} colorClass="text-amber-400" />
                        </button>
                        {/* Protein Circle */}
                        <button onClick={() => setView('nutrition')} className="group flex flex-col items-center gap-2 transition-transform hover:scale-105">
                            <CircularProgress value={parseFloat(nutritionTotals.protein.toFixed(1))} maxValue={proteinTarget} label="Proteína" icon={Beef} colorClass="text-rose-400" />
                        </button>
                        {/* Water Circle */}
                        <button onClick={() => setModal({ type: 'water' })} className="group flex flex-col items-center gap-2 transition-transform hover:scale-105">
                            <CircularProgress value={waterLog?.quantity_ml || 0} maxValue={waterTarget} label="Agua" icon={Droplet} colorClass="text-sky-400" />
                        </button>
                        {/* Creatine Circle */}
                        <button onClick={() => setModal({ type: 'creatine' })} className="group flex flex-col items-center gap-2 transition-transform hover:scale-105">
                            <CircularProgress
                                value={todaysCreatineLog.length}
                                maxValue={2}
                                label="Creatina"
                                icon={todaysCreatineLog.length > 0 ? CheckCircle : XCircle}
                                colorClass={todaysCreatineLog.length > 0 ? 'text-violet-400' : 'text-text-muted'}
                                displayText={todaysCreatineLog.length > 0 ? `${todaysCreatineLog.length}/2` : '0/2'}
                            />
                        </button>
                    </div>
                </GlassCard>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Left Column */}
                <div className="flex flex-col gap-8">

                    {/* Workouts */}
                    <section>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-2">
                                <Dumbbell size={20} className="text-accent" />
                                <h2 className="text-xl font-bold">Rutinas</h2>
                            </div>
                            <button
                                onClick={() => setView('routines', { forceTab: 'myRoutines' })}
                                className="text-xs font-semibold text-accent hover:text-accent/80 flex items-center gap-1"
                            >
                                Ver todas <ChevronRight size={14} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {routines.length > 0 ? (
                                routines.slice(0, 3).map(routine => {
                                    const isCompleted = completedRoutineIdsToday.includes(routine.id);
                                    const isActive = activeWorkout && activeWorkout.routineId === routine.id;

                                    return (
                                        <GlassCard
                                            key={routine.id}
                                            className={`p-0 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-1 ${isActive ? 'ring-2 ring-accent shadow-accent/20' : ''}`}
                                        >
                                            <button
                                                onClick={async () => {
                                                    if (isActive) { setView('workout'); return; }
                                                    if (!isCompleted) { await startWorkout(routine); setView('workout'); }
                                                }}
                                                disabled={isCompleted && !isActive}
                                                className={`w-full text-left p-4 flex items-center justify-between group 
                                                    ${isActive ? 'bg-accent/10' : 'hover:bg-white/5'}
                                                    ${isCompleted && !isActive ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`
                                                        w-10 h-10 rounded-full flex items-center justify-center 
                                                        ${isActive ? 'bg-accent text-white' : (isCompleted ? 'bg-green-500/20 text-green-500' : 'bg-bg-secondary text-text-secondary group-hover:bg-accent/20 group-hover:text-accent transition-colors')}
                                                    `}>
                                                        {isActive ? <Clock size={20} /> : (isCompleted ? <CheckCircle size={20} /> : <Play size={20} fill="currentColor" />)}
                                                    </div>
                                                    <div>
                                                        <h3 className={`font-bold ${isActive ? 'text-accent' : 'text-text-primary'}`}>{routine.name}</h3>
                                                        <p className="text-xs text-text-secondary">
                                                            {isActive ? 'En curso - Click para continuar' : (isCompleted ? 'Completada hoy' : 'Click para iniciar')}
                                                        </p>
                                                    </div>
                                                </div>

                                                {!isCompleted && !isActive && (
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-accent">
                                                        <ChevronRight size={20} />
                                                    </div>
                                                )}
                                            </button>
                                        </GlassCard>
                                    );
                                })
                            ) : (
                                <GlassCard className="p-8 text-center transition-all duration-300 hover:shadow-lg">
                                    <p className="text-text-muted mb-4">No tienes rutinas asignadas.</p>
                                    <button onClick={() => setView('routines')} className="text-accent font-bold hover:underline">
                                        Crear mi primera rutina
                                    </button>
                                </GlassCard>
                            )}
                        </div>
                    </section>

                    {/* Quick Cardio */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <Zap size={20} className="text-accent" />
                            <h2 className="text-xl font-bold">Cardio Rápido</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { name: 'Cinta', icon: Footprints },
                                { name: 'Bici', icon: Bike },
                                { name: 'Elíptica', icon: Activity },
                                { name: 'Comba', icon: Repeat },
                            ].map((item) => (
                                <GlassCard key={item.name} className="p-0 overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-lg">
                                    <button
                                        onClick={() => { startSimpleWorkout(`Cardio: ${item.name}`); setView('workout'); }}
                                        className="w-full h-full p-4 flex flex-col items-center justify-center gap-2 hover:bg-accent/10 transition-colors"
                                    >
                                        <item.icon size={24} className="text-accent group-hover:text-white transition-colors" />
                                        <span className="text-sm font-semibold">{item.name}</span>
                                    </button>
                                </GlassCard>
                            ))}
                        </div>
                    </section>

                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-8">
                    {/* Weight Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-2">
                                <Trophy size={20} className="text-accent" />
                                <h2 className="text-xl font-bold">Peso Corporal</h2>
                            </div>
                            <button onClick={() => setShowWeightModal(true)} className="text-xs font-semibold text-accent hover:text-accent/80 flex items-center gap-1">
                                {todaysWeightLog ? <><Edit size={14} /> Editar hoy</> : <><Plus size={14} /> Registrar</>}
                            </button>
                        </div>

                        <GlassCard className="p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                            {/* Big Number */}
                            <div className="flex items-end justify-between mb-8">
                                <div>
                                    <p className="text-sm text-text-secondary uppercase tracking-wider font-semibold mb-1">Actual</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-extrabold text-text-primary tracking-tight">
                                            {latestWeight ? latestWeight.toFixed(1) : '--'}
                                        </span>
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

                            {/* Mini Graph/History List */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Historial Reciente</p>
                                {sortedWeightLog.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {sortedWeightLog.slice(0, 3).map((log, index) => {
                                            const trend = getTrendForLog(log, sortedWeightLog[index + 1]);
                                            return (
                                                <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-secondary/40 border border-transparent hover:border-glass-border transition-colors">
                                                    <span className="text-sm font-medium text-text-secondary">
                                                        {new Date(log.log_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-text-primary">{parseFloat(log.weight_kg).toFixed(1)}</span>
                                                        {trend && <trend.icon size={14} className={trend.color} />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-sm text-text-muted italic">
                                        Sin registros recientes.
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </section>
                </div>

            </div>

            {/* Modals */}
            {showWeightModal &&
                <BodyWeightModal
                    onClose={() => setShowWeightModal(false)}
                    onSave={todaysWeightLog ? updateTodayBodyWeight : logBodyWeight}
                    existingLog={todaysWeightLog}
                />
            }
            {modal.type === 'water' &&
                <WaterLogModal
                    initialQuantity={waterLog?.quantity_ml || 0}
                    onSave={handleSaveWater}
                    onClose={() => setModal({ type: null })}
                    isLoading={modal.type === 'submitting'}
                />
            }
            {modal.type === 'creatine' &&
                <CreatinaTracker
                    onClose={() => {
                        setModal({ type: null });
                        fetchDataForDate(new Date().toISOString().split('T')[0]);
                    }}
                    selectedDate={new Date().toISOString().split('T')[0]}
                />
            }
        </div>
    );
};

export default Dashboard;