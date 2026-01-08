/* frontend/src/pages/QuickCardio.jsx */
import React, { useState, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, Clock, Flame, Play, X, Save, Search, Filter, MapPin } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { CARDIO_ACTIVITIES } from '../data/cardioLibrary';
// ELIMINADO: import { logWorkout } from '../services/workoutService'; -> Usamos la del store
import { useToast } from '../hooks/useToast';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import CustomSelect from '../components/CustomSelect';

const INTENSITY_OPTIONS = [
    { value: 'all', label: 'Todas' },
    { value: 'Baja', label: 'Baja' },
    { value: 'Media', label: 'Media' },
    { value: 'Alta', label: 'Alta' },
    { value: 'Máxima', label: 'Máxima' },
];

// --- COMPONENTE MODAL AISLADO ---
const ConfigModal = ({ activity, currentWeight, onClose, onSave, onStartGPS }) => {
    const [duration, setDuration] = useState(30);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const estimatedCalories = useMemo(() => {
        if (!activity) return 0;
        const hours = duration / 60;
        return Math.round(activity.mets * currentWeight * hours);
    }, [activity, duration, currentWeight]);

    const handleSaveInternal = async () => {
        setIsSubmitting(true);
        await onSave(activity, duration, estimatedCalories);
        setIsSubmitting(false);
    };

    if (!activity) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            {/* MODIFICADO: 
                - mb-20 en móvil para evitar navbar
                - max-h-[85vh] para no ocupar toda la pantalla
                - flex flex-col para gestionar el scroll interno
            */}
            <div className="bg-bg-primary border border-white/10 w-full max-w-md rounded-2xl shadow-2xl animate-scale-in relative mb-20 md:mb-0 max-h-[85vh] flex flex-col">

                {/* Botón de cierre fijo en la esquina superior */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-text-secondary transition z-10"
                >
                    <X size={20} />
                </button>

                {/* Contenedor con SCROLL para el contenido */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col items-center mb-6">
                        <div className={`p-4 rounded-full mb-4 ${activity.bg} ${activity.color} shadow-[0_0_20px_rgba(0,0,0,0.3)]`}>
                            <activity.icon size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-center text-text-primary">{activity.name}</h2>
                        <span className="text-sm font-medium text-text-secondary mt-1 px-3 py-1 rounded-full bg-bg-secondary border border-white/5">
                            Intensidad: {activity.intensity}
                        </span>
                    </div>

                    <div className="space-y-6">
                        {activity.hasGPS && (
                            <div className="mb-4">
                                <button
                                    onClick={() => onStartGPS(activity)}
                                    className="w-full py-4 rounded-xl font-bold text-lg bg-accent text-bg-primary hover:bg-white hover:text-black transition-all shadow-[0_0_15px_rgba(0,255,136,0.3)] hover:shadow-[0_0_25px_rgba(0,255,136,0.5)] flex items-center justify-center gap-2"
                                >
                                    <MapPin size={24} />
                                    Iniciar Ruta GPS
                                </button>
                                {/* MODIFICADO: Eliminadas las líneas divisorias (hr) */}
                                <div className="flex items-center justify-center my-4">
                                    <span className="text-xs text-text-secondary uppercase">O registro manual</span>
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-bold text-text-secondary flex items-center gap-2">
                                    <Clock size={16} className="text-accent" /> Duración
                                </label>
                                <span className="text-xl font-bold text-accent font-mono">{duration} min</span>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="180"
                                step="5"
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value))}
                                className="w-full h-2 rounded-lg cursor-pointer accent-accent hover:accent-accent/80 transition-all bg-bg-secondary"
                            />
                            <div className="flex justify-between text-xs text-text-tertiary mt-2 font-mono">
                                <span>5m</span>
                                <span>3h</span>
                            </div>
                        </div>

                        <div className="bg-bg-secondary/50 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="text-xs text-text-secondary block mb-1">Estimación de Quema</span>
                                <div className="text-2xl font-bold text-text-primary flex items-end gap-1 font-mono">
                                    {estimatedCalories}
                                    <span className="text-xs font-sans text-text-tertiary mb-1.5">kcal</span>
                                </div>
                            </div>
                            <Flame size={32} className={`${activity.color} opacity-80`} />
                        </div>

                        <button
                            onClick={handleSaveInternal}
                            disabled={isSubmitting}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                            ${activity.hasGPS
                                    ? 'bg-bg-secondary text-text-primary border border-white/10 hover:bg-white/5'
                                    : 'bg-accent text-bg-primary hover:bg-white hover:text-black shadow-[0_0_15px_rgba(0,255,136,0.3)]'
                                }`}
                        >
                            {isSubmitting ? <Spinner size={24} color="border-current" /> : (
                                <>
                                    <Save size={20} />
                                    {activity.hasGPS ? 'Registrar Manualmente' : 'Registrar Sesión'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const QuickCardio = ({ onBack, setView }) => {
    const { addToast } = useToast();
    const { userProfile, bodyWeightLog, fetchInitialData, logWorkout } = useAppStore(state => ({
        userProfile: state.userProfile,
        bodyWeightLog: state.bodyWeightLog,
        fetchInitialData: state.fetchInitialData,
        logWorkout: state.logWorkout
    }));

    const [selectedActivity, setSelectedActivity] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [intensityFilter, setIntensityFilter] = useState('all');

    const currentWeight = useMemo(() => {
        if (bodyWeightLog && bodyWeightLog.length > 0) {
            const sorted = [...bodyWeightLog].sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
            return parseFloat(sorted[0].weight_kg) || 75;
        }
        return userProfile?.weight || 75;
    }, [bodyWeightLog, userProfile]);

    const filteredActivities = useMemo(() => {
        return CARDIO_ACTIVITIES.filter(act => {
            const matchesSearch = act.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesIntensity = intensityFilter === 'all' || act.intensity === intensityFilter;
            return matchesSearch && matchesIntensity;
        });
    }, [searchTerm, intensityFilter]);

    const handleSaveSession = useCallback(async (activity, duration, calories) => {
        const payload = {
            routineName: activity.name,
            workout_date: new Date().toISOString(),
            duration_seconds: duration * 60,
            calories_burned: calories,
            notes: `Cardio Rápido: ${activity.name} (${activity.intensity}). Registrado desde Quick Cardio.`,
            exercises: []
        };

        try {
            const result = await logWorkout(payload);
            await fetchInitialData();

            if (result.success) {
                if (result.message && result.message.includes('Límite de XP')) {
                    addToast(result.message, 'warning');
                } else {
                    addToast(`¡Sesión de ${activity.name} guardada!`, 'success');
                }

                setSelectedActivity(null);
                if (onBack) onBack();
            } else {
                addToast(result.message, 'error');
            }
        } catch (error) {
            console.error(error);
            addToast('Error al guardar la sesión', 'error');
        }
    }, [fetchInitialData, addToast, onBack, logWorkout]);

    const handleStartGPS = useCallback((activity) => {
        if (setView) {
            setView('active-cardio', { activityId: activity.id });
        }
    }, [setView]);

    return (
        <div className="min-h-screen bg-bg-primary pb-6 md:pb-8 animate-fade-in">
            <Helmet>
                <title>Cardio Rápido - Pro Fitness Glass</title>
            </Helmet>

            {/* Header Sticky - MODIFICADO: Eliminado 'border-b border-white/5' */}
            <div className="sticky top-0 z-30 bg-bg-primary/80 backdrop-blur-md px-4 py-4 md:px-8">
                <div className="max-w-7xl mx-auto flex flex-col gap-4">
                    <div className="hidden md:flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="p-2 -ml-2 rounded-full hover:bg-white/10 transition text-text-secondary"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-text-primary">Cardio Rápido</h1>
                                <p className="text-xs text-text-secondary hidden md:block">Registra actividad sin crear una rutina compleja</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar actividad..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-bg-secondary border border-transparent focus:border-accent/50 rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary outline-none transition-all placeholder:text-text-tertiary"
                            />
                        </div>
                        <div className="w-40">
                            <CustomSelect
                                value={intensityFilter}
                                onChange={setIntensityFilter}
                                options={INTENSITY_OPTIONS}
                                icon={Filter}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid de Actividades */}
            <div className="max-w-7xl mx-auto px-4 py-6 md:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredActivities.map((activity) => (
                        <GlassCard
                            key={activity.id}
                            className="p-4 hover:border-accent/30 transition-all cursor-pointer group active:scale-[0.98]"
                            onClick={() => setSelectedActivity(activity)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-3 rounded-xl ${activity.bg} ${activity.color} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                                    <activity.icon size={24} />
                                </div>
                                <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-bg-secondary text-text-secondary border border-white/5">
                                    {activity.intensity}
                                </div>
                            </div>

                            <h3 className="font-bold text-lg text-text-primary mb-1 group-hover:text-accent transition-colors">
                                {activity.name}
                            </h3>
                            <p className="text-xs text-text-secondary line-clamp-2">
                                {activity.description}
                            </p>

                            {/* MODIFICADO: Eliminado 'border-t border-white/5' */}
                            <div className="mt-4 pt-3 flex items-center justify-between">
                                <span className="text-xs text-text-tertiary font-mono">
                                    METs: <span className="text-text-secondary">{activity.mets}</span>
                                </span>
                                <span className="text-xs font-bold text-accent flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                    {activity.hasGPS ? (
                                        <>Empezar <MapPin size={10} fill="currentColor" /></>
                                    ) : (
                                        <>Empezar <Play size={10} fill="currentColor" /></>
                                    )}
                                </span>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {filteredActivities.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <Search size={48} className="mx-auto mb-4" />
                        <p>No se encontraron actividades.</p>
                    </div>
                )}
            </div>

            {selectedActivity && (
                <ConfigModal
                    activity={selectedActivity}
                    currentWeight={currentWeight}
                    onClose={() => setSelectedActivity(null)}
                    onSave={handleSaveSession}
                    onStartGPS={handleStartGPS}
                />
            )}
        </div>
    );
};

export default QuickCardio;