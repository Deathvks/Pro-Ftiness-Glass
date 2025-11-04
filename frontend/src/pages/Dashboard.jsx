import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Dumbbell, Target, Clock, Flame, Plus, Play, Edit, Footprints, Bike, Activity, Repeat, Droplet, Beef, Zap, CheckCircle, XCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
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
        updateTodayBodyWeight, startWorkout, startSimpleWorkout, nutritionLog, // <-- Mantenemos startWorkout y startSimpleWorkout aquí para usarlos directamente
        waterLog, todaysCreatineLog, fetchDataForDate
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
        fetchDataForDate: state.fetchDataForDate
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

    const weeklyLogs = useMemo(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), diff);
        startOfWeek.setHours(0, 0, 0, 0);

        return workoutLog.filter(log => new Date(log.workout_date) >= startOfWeek);
    }, [workoutLog]);

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

    // --- INICIO DE LA MODIFICACIÓN ---
    // Eliminamos las funciones handleStartWorkout y handleStartSimpleWorkout
    // --- FIN DE LA MODIFICACIÓN ---

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
        <div className="w-full max-w-7xl mx-auto px-4 pb-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">

            <Helmet>
                <title>Dashboard - Pro Fitness Glass</title>
                <meta name="description" content="Tu resumen diario de actividad física, nutrición, peso corporal y acceso rápido a tus rutinas y entrenamientos." />
            </Helmet>

            {/* Header para PC (MANTENIDO) */}
            <h1 className="hidden md:block text-4xl font-extrabold mb-8 mt-10 md:mt-0">Dashboard</h1>

            <div className="mt-6 sm:mt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard icon={<Dumbbell size={24} />} title="Sesiones Semanales" value={weeklySessions} unit="" />
                <StatCard icon={<Target size={24} />} title="Objetivo Calorías" value={calorieTarget?.toLocaleString('es-ES') ?? 'N/A'} unit="kcal" />
                <StatCard icon={<Clock size={24} />} title="Tiempo Semanal" value={weeklyTimeDisplay} unit="" />
                <StatCard icon={<Flame size={24} />} title="Calorías Semanales" value={weeklyCalories.toLocaleString('es-ES')} unit="kcal" />
            </div>

            <GlassCard className="p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Resumen de Hoy</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button onClick={() => setView('nutrition')} className="hover:scale-105 transition-transform"><CircularProgress value={nutritionTotals.calories} maxValue={calorieTarget} label="Calorías" icon={Flame} colorClass="text-amber-400"/></button>
                    <button onClick={() => setView('nutrition')} className="hover:scale-105 transition-transform"><CircularProgress value={parseFloat(nutritionTotals.protein.toFixed(1))} maxValue={proteinTarget} label="Proteína" icon={Beef} colorClass="text-rose-400"/></button>
                    <button onClick={() => setModal({ type: 'water' })} className="hover:scale-105 transition-transform"><CircularProgress value={waterLog?.quantity_ml || 0} maxValue={waterTarget} label="Agua" icon={Droplet} colorClass="text-sky-400"/></button>
                    <button onClick={() => setModal({ type: 'creatine' })} className="hover:scale-105 transition-transform">
                        <CircularProgress
                            value={todaysCreatineLog.length}
                            maxValue={2}
                            label="Creatina"
                            icon={todaysCreatineLog.length > 0 ? CheckCircle : XCircle}
                            colorClass={todaysCreatineLog.length > 0 ? 'text-violet-400' : 'text-text-muted'}
                            displayText={todaysCreatineLog.length > 0 ? `${todaysCreatineLog.length} toma${todaysCreatineLog.length > 1 ? 's' : ''}` : 'Sin tomas'}
                        />
                    </button>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="flex flex-col gap-6">
                    <GlassCard className="p-6 flex flex-col gap-4">
                        <h2 className="text-xl font-bold">Iniciar un Entrenamiento</h2>
                        <div className="flex flex-col gap-3">
                            {routines.length > 0 ? (
                                routines.slice(0, 2).map(routine => (
                                    // --- INICIO DE LA MODIFICACIÓN ---
                                    // 1. Convertimos el onClick en 'async'
                                    // 2. Añadimos 'await' a 'startWorkout(routine)'
                                    <button key={routine.id} onClick={async () => { await startWorkout(routine); setView('workout'); }} className="flex justify-between items-center w-full p-4 rounded-md border border-glass-border hover:bg-white/10 transition-colors">
                                    {/* --- FIN DE LA MODIFICACIÓN --- */}
                                        <span className="font-semibold">{routine.name}</span>
                                        <Play size={20} />
                                    </button>
                                ))
                            ) : (
                                <p className="text-text-muted text-center py-4">No tienes rutinas. ¡Crea una para empezar!</p>
                            )}
                        </div>
                        <button onClick={() => setView('routines', { forceTab: 'myRoutines' })} className="flex items-center justify-center gap-2 w-full rounded-md bg-accent/10 text-accent font-semibold py-3 border border-accent/20 hover:bg-accent/20 transition-colors">
                            <Plus size={20} />
                            <span>Ver todas mis rutinas</span>
                        </button>
                    </GlassCard>

                    <GlassCard className="p-6 flex flex-col gap-4">
                        <h2 className="text-xl font-bold">Cardio Rápido</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {/* Estas llamadas a 'startSimpleWorkout' no necesitan 'await' porque esa función sigue siendo síncrona */}
                            <button onClick={() => { startSimpleWorkout('Cardio: Cinta'); setView('workout'); }} className="flex items-center justify-center gap-3 p-4 rounded-md border border-glass-border hover:bg-white/10 transition-colors"><Footprints size={20} /><span className="font-semibold">Cinta</span></button>
                             <button onClick={() => { startSimpleWorkout('Cardio: Bici'); setView('workout'); }} className="flex items-center justify-center gap-3 p-4 rounded-md border border-glass-border hover:bg-white/10 transition-colors"><Bike size={20} /><span className="font-semibold">Bici</span></button>
                            <button onClick={() => { startSimpleWorkout('Cardio: Elíptica'); setView('workout'); }} className="flex items-center justify-center gap-3 p-4 rounded-md border border-glass-border hover:bg-white/10 transition-colors"><Activity size={20} /><span className="font-semibold">Elíptica</span></button>
                             <button onClick={() => { startSimpleWorkout('Cardio: Comba'); setView('workout'); }} className="flex items-center justify-center gap-3 p-4 rounded-md border border-glass-border hover:bg-white/10 transition-colors"><Repeat size={20} /><span className="font-semibold">Comba</span></button>
                        </div>
                    </GlassCard>
                </div>

                <GlassCard className="p-6 flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Registro de Peso</h2>
                    <div className="text-center">
                        <p className="text-sm text-text-secondary">Peso Actual</p>
                        <div className="flex items-center justify-center gap-3">
                            <p className="text-5xl font-extrabold">
                                {latestWeight ? latestWeight.toFixed(2) : '--'}
                                <span className="text-2xl font-bold text-text-muted ml-1">kg</span>
                            </p>
                            {weightTrend && (
                                <div className={`p-2 rounded-full ${weightTrend.bg}`} title={`Tendencia: ${weightTrend.text}`}>
                                    <weightTrend.icon size={24} className={weightTrend.color} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h3 className="font-semibold text-text-secondary">Historial Reciente</h3>
                        {sortedWeightLog.length > 0 ? sortedWeightLog.slice(0, 4).map((log, index) => {
                            const trend = getTrendForLog(log, sortedWeightLog[index + 1]);
                            return (
                                <div key={log.id} className="flex justify-between items-center bg-bg-secondary/50 p-3 rounded-md">
                                    <div className="flex items-center">
                                        <span className="font-semibold">{parseFloat(log.weight_kg).toFixed(2)} kg</span>
                                        {trend && <trend.icon size={16} className={`${trend.color} ml-1.5`} />}
                                    </div>
                                    <span className="text-sm text-text-muted">{new Date(log.log_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                                </div>
                            );
                        }) : (
                            <p className="text-text-muted text-center py-4">No hay registros de peso todavía.</p>
                        )}
                    </div>
                    <button onClick={() => setShowWeightModal(true)} className="flex items-center justify-center gap-2 w-full rounded-md bg-accent/10 text-accent font-semibold py-3 border border-accent/20 hover:bg-accent/20 transition-colors">
                        {todaysWeightLog ? <><Edit size={20} /><span>Editar Peso de Hoy</span></> : <><Plus size={20} /><span>Registrar Peso</span></>}
                    </button>
                </GlassCard>
            </div>

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