/* frontend/src/pages/QuickCardio.jsx */
import React, { useState, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, Clock, Flame, Play, X, Save, Search, Filter, MapPin, BookCopy, Compass } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { CARDIO_ACTIVITIES } from '../data/cardioLibrary';
import { useToast } from '../hooks/useToast';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import CustomSelect from '../components/CustomSelect';
import { useAppTheme } from '../hooks/useAppTheme';

const INTENSITY_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'Baja', label: 'Baja' },
  { value: 'Media', label: 'Media' },
  { value: 'Alta', label: 'Alta' },
  { value: 'Máxima', label: 'Máxima' },
];

const baseButtonClasses = 'px-4 py-2 rounded-full font-semibold transition-colors flex items-center gap-2';
const activeModeClasses = 'bg-accent text-bg-secondary';
const inactiveModeClasses = 'bg-bg-secondary hover:bg-white/10 text-text-secondary';

// --- COMPONENTE MODAL AISLADO ---
const ConfigModal = ({ activity, currentWeight, onClose, onSave, onStartGPS }) => {
  const [duration, setDuration] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isGpsHovered, setIsGpsHovered] = useState(false);
  const [isSaveHovered, setIsSaveHovered] = useState(false);

  const { theme, accent } = useAppTheme();

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

  const min = 5;
  const max = 180;
  const percentage = ((duration - min) / (max - min)) * 100;
  const trackColor = theme === 'light' ? '#e5e7eb' : 'rgba(255, 255, 255, 0.1)';

  const gpsShadowStyle = {
    boxShadow: isGpsHovered
      ? `0 0 25px ${accent}80`
      : `0 0 15px ${accent}4D`
  };

  const saveShadowStyle = !activity.hasGPS ? {
    boxShadow: isSaveHovered
      ? `0 0 25px ${accent}80`
      : `0 0 15px ${accent}4D`
  } : {};

  if (!activity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-bg-secondary border border-white/10 w-full max-w-md rounded-2xl shadow-2xl animate-scale-in relative mb-20 md:mb-0 max-h-[85vh] flex flex-col [.oled-theme_&]:border-white/10">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-text-secondary transition z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center mb-6">
            <div className={`p-4 rounded-full mb-4 ${activity.bg} ${activity.color} shadow-[0_0_20px_rgba(0,0,0,0.3)]`}>
              <activity.icon size={40} />
            </div>
            <h2 className="text-2xl font-bold text-center text-text-primary">{activity.name}</h2>
            <span className="text-sm font-medium text-text-secondary mt-1 px-3 py-1 rounded-full bg-bg-primary border border-white/5">
              Intensidad: {activity.intensity}
            </span>
          </div>

          <div className="space-y-6">
            {activity.hasGPS && (
              <div className="mb-4">
                <button
                  onClick={() => onStartGPS(activity)}
                  onMouseEnter={() => setIsGpsHovered(true)}
                  onMouseLeave={() => setIsGpsHovered(false)}
                  style={gpsShadowStyle}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-accent text-bg-primary hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <MapPin size={24} />
                  Iniciar Ruta GPS
                </button>
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
                min={min}
                max={max}
                step="5"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className={`w-full h-2 rounded-lg cursor-pointer appearance-none outline-none transition-all
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-accent
                  [&::-webkit-slider-thumb]:hover:bg-accent/80
                  [&::-webkit-slider-thumb]:transition-all
                  
                  [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-accent
                  [&::-moz-range-thumb]:hover:bg-accent/80
                  [&::-moz-range-thumb]:border-none
                  [&::-moz-range-thumb]:transition-all
                `}
                style={{
                  background: `linear-gradient(to right, ${accent} ${percentage}%, ${trackColor} ${percentage}%)`
                }}
              />

              <div className="flex justify-between text-xs text-text-tertiary mt-2 font-mono">
                <span>5m</span>
                <span>3h</span>
              </div>
            </div>

            <div className="bg-bg-primary/50 rounded-xl p-4 border border-white/5 flex items-center justify-between">
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
              onMouseEnter={() => setIsSaveHovered(true)}
              onMouseLeave={() => setIsSaveHovered(false)}
              style={saveShadowStyle}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                ${activity.hasGPS
                  ? 'bg-bg-primary text-text-primary border border-white/10 hover:bg-white/5'
                  : 'bg-accent text-bg-primary hover:brightness-110'
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
        handleGoBack();
      } else {
        addToast(result.message, 'error');
      }
    } catch (error) {
      console.error(error);
      addToast('Error al guardar la sesión', 'error');
    }
  }, [fetchInitialData, addToast, logWorkout]);

  const handleStartGPS = useCallback((activity) => {
    if (setView) {
      setView('active-cardio', { activityId: activity.id });
    }
  }, [setView]);

  const handleGoBack = useCallback(() => {
    const origin = localStorage.getItem('quickCardioOrigin');

    if (origin === 'routines') {
      localStorage.removeItem('quickCardioOrigin'); // Limpiamos para no arrastrar estados fantasma
      if (setView) setView('routines');
    } else {
      localStorage.removeItem('quickCardioOrigin');
      if (onBack) {
        onBack();
      } else if (setView) {
        setView('dashboard');
      }
    }
  }, [onBack, setView]);

  const handleTabChange = useCallback((tab) => {
    if (tab === 'quickCardio') return;
    localStorage.removeItem('quickCardioOrigin'); // Limpiamos al cambiar de tab manualmente
    localStorage.setItem('routinesForceTab', tab);
    if (setView) setView('routines');
  }, [setView]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-28 md:p-8 md:pb-8 animate-[fade-in_0.5s_ease_out]">
      <Helmet>
        <title>Cardio Rápido - Pro Fitness Glass</title>
      </Helmet>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-2 md:gap-4 mt-10 md:mt-0">
          <button
            onClick={handleGoBack}
            className="p-2 -ml-2 rounded-full hover:bg-bg-secondary transition text-text-secondary"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary">
            Cardio Rápido
          </h1>
        </div>
      </div>

      <div className={`flex items-center gap-2 mb-6 p-1 rounded-full bg-bg-secondary border border-transparent dark:border dark:border-white/10 w-fit max-w-full overflow-x-auto scrollbar-hide mt-6 md:mt-0`}>
        <button
          onClick={() => handleTabChange('myRoutines')}
          className={`${baseButtonClasses} ${inactiveModeClasses} whitespace-nowrap flex-shrink-0`}
        >
          <BookCopy size={16} /> Mis Rutinas
        </button>
        <button
          onClick={() => handleTabChange('explore')}
          className={`${baseButtonClasses} ${inactiveModeClasses} whitespace-nowrap flex-shrink-0`}
        >
          <Compass size={16} /> Explorar
        </button>
        <button
          className={`${baseButtonClasses} ${activeModeClasses} whitespace-nowrap flex-shrink-0`}
        >
          <Flame size={16} /> Cardio Rápido
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
          <input
            type="text"
            placeholder="Buscar actividad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-secondary border border-transparent dark:border dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-accent/40 text-text-primary placeholder:text-text-tertiary"
          />
        </div>
        <div className="w-full sm:w-48">
          <CustomSelect
            value={intensityFilter}
            onChange={setIntensityFilter}
            options={INTENSITY_OPTIONS}
            icon={Filter}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
        {filteredActivities.map((activity) => (
          <GlassCard
            key={activity.id}
            className="p-4 hover:border-accent/30 transition-all cursor-pointer group active:scale-[0.98] [.oled-theme_&]:border-white/10"
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