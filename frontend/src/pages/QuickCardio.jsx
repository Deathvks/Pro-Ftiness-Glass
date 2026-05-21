/* frontend/src/pages/QuickCardio.jsx */
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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

// --- FUNCIONES PARA AÑADIR SEGURIDAD A LOS TABS ---
const getTabClass = (isActive) => `mx-1.5 my-2 px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap outline-none flex items-center gap-2 flex-shrink-0 ${
    isActive
        ? 'bg-accent text-white shadow-md shadow-accent/30 scale-105'
        : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary'
}`;

// --- COMPONENTE MODAL AISLADO ---
const ConfigModal = ({ activity, currentWeight, onClose, onSave, onStartGPS }) => {
  const [duration, setDuration] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { accent } = useAppTheme();

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

  if (!activity) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-[fade-in_0.2s_ease-out]">
      <div className="absolute inset-0" onClick={onClose} />
      <GlassCard className="glass w-full max-w-md p-0 flex flex-col max-h-[90vh] overflow-hidden shadow-2xl animate-[slide-up_0.3s_ease-out] relative rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 z-10 bg-bg-primary">

        <div className="relative p-6 sm:p-8 pb-4 shrink-0 bg-black/5 dark:bg-white/5 rounded-t-[32px]">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors z-10"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>

          <div className="flex flex-col items-center mb-2">
            <div className={`p-4 rounded-[20px] mb-4 ${activity.bg} ${activity.color} shadow-lg ring-1 ring-black/5 dark:ring-white/10`}>
              <activity.icon size={40} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-text-primary tracking-tight">{activity.name}</h2>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-text-secondary mt-2 px-3 py-1.5 rounded-md bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
              Intensidad: {activity.intensity}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
          
          {/* SECCIÓN GPS */}
          {activity.hasGPS && (
            <div className="space-y-4">
              <button
                onClick={() => onStartGPS(activity)}
                className="w-full py-4 rounded-[20px] font-bold text-base sm:text-lg bg-accent text-white hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
              >
                <MapPin size={22} strokeWidth={2.5} />
                Iniciar Ruta GPS
              </button>
              <div className="flex items-center justify-center">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">O registra manualmente</span>
              </div>
            </div>
          )}

          {/* SECCIÓN DURACIÓN */}
          <div>
            <div className="flex justify-between items-end mb-4 px-1">
              <label className="text-[11px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-accent" /> Duración
              </label>
              <span className="text-2xl font-black text-accent font-mono tracking-tighter leading-none">{duration} <span className="text-sm">min</span></span>
            </div>

            <input
              type="range"
              min={min}
              max={max}
              step="5"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className={`w-full h-3 rounded-full cursor-pointer appearance-none outline-none transition-all
                bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-inner
                focus:border-accent/50
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-6
                [&::-webkit-slider-thumb]:h-6
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:border-[4px]
                [&::-webkit-slider-thumb]:border-accent
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110
                
                [&::-moz-range-thumb]:w-6
                [&::-moz-range-thumb]:h-6
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-white
                [&::-moz-range-thumb]:border-[4px]
                [&::-moz-range-thumb]:border-accent
                [&::-moz-range-thumb]:shadow-md
                [&::-moz-range-thumb]:transition-transform
                [&::-moz-range-thumb]:hover:scale-110
              `}
              style={{
                backgroundImage: `linear-gradient(to right, ${accent || '#3b82f6'} ${percentage}%, transparent ${percentage}%)`
              }}
            />

            <div className="flex justify-between text-[10px] font-bold text-text-tertiary uppercase tracking-widest mt-3 px-1">
              <span>5 min</span>
              <span>3 h</span>
            </div>
          </div>

          {/* SECCIÓN QUEMA DE CALORÍAS */}
          <div className="bg-black/5 dark:bg-white/5 rounded-[24px] p-5 ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-between shadow-inner">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">Estimación</span>
              <div className="text-3xl font-black text-text-primary flex items-baseline gap-1.5 font-mono tracking-tighter">
                {estimatedCalories}
                <span className="text-xs font-bold text-text-tertiary mb-1">kcal</span>
              </div>
            </div>
            <div className={`p-3 rounded-[16px] ${activity.bg} ring-1 ring-black/5 dark:ring-white/10`}>
                <Flame size={32} className={`${activity.color}`} strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* BOTÓN GUARDAR (Footer) */}
        <div className="p-6 shrink-0 border-t border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 rounded-b-[32px]">
            <button
              onClick={handleSaveInternal}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-[20px] font-bold text-base sm:text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed
                ${activity.hasGPS
                  ? 'bg-black/5 dark:bg-white/5 text-text-primary ring-1 ring-black/5 dark:ring-white/10 hover:bg-black/10 dark:hover:bg-white/10 shadow-none'
                  : 'bg-accent text-white shadow-accent/20'
                }`}
            >
              {isSubmitting ? <Spinner size={24} color={activity.hasGPS ? 'text-accent' : 'white'} /> : (
                <>
                  <Save size={20} strokeWidth={2.5} />
                  {activity.hasGPS ? 'Registrar Manualmente' : 'Registrar Sesión'}
                </>
              )}
            </button>
        </div>

      </GlassCard>
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

  const scrollContainerRef = useRef(null);

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

  // Centrar automáticamente la pestaña activa al cargar
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeTab = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, []);

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
      localStorage.removeItem('quickCardioOrigin');
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
    localStorage.removeItem('quickCardioOrigin');
    localStorage.setItem('routinesForceTab', tab);
    if (setView) setView('routines');
  }, [setView]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-28 md:p-8 md:pb-8 animate-[fade-in_0.5s_ease_out]">
      <Helmet>
        <title>Cardio Rápido - Pro Fitness Glass</title>
      </Helmet>

      {/* --- ENCABEZADO Y NAVEGACIÓN UNIFICADOS --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-6 md:mt-0">

        {/* Título en Desktop */}
        <h1 className="hidden md:block text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight shrink-0">
          Cardio Rápido
        </h1>

        {/* Contenedor Flex para el Botón Atrás + Menú de Pestañas (Mobile & Desktop) */}
        <div className="flex items-center gap-2 sm:gap-3 max-w-full py-1">

          {/* Botón Volver Atrás */}
          <button
            onClick={handleGoBack}
            title="Volver"
            className="ml-1 p-2.5 shrink-0 rounded-full bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-text-secondary shadow-sm relative z-10"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          {/* Menú Deslizable de Pestañas (Igual a Rutinas) */}
          <div ref={scrollContainerRef} className="flex items-center overflow-x-auto py-2 pl-1 pr-4 -mr-4 md:mx-0 md:px-0 scrollbar-hide flex-1">
            <button
              onClick={() => handleTabChange('myRoutines')}
              className={getTabClass(false)}
            >
              <BookCopy size={18} /> Mis Rutinas
            </button>
            <button
              onClick={() => handleTabChange('explore')}
              className={getTabClass(false)}
            >
              <Compass size={18} /> Explorar
            </button>
            <button
              data-active="true"
              className={getTabClass(true)}
            >
              <Flame size={18} /> Cardio Rápido
            </button>
          </div>

        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="mb-8 flex flex-col sm:flex-row gap-5 sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            placeholder="Buscar actividad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-[20px] bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-sm font-bold text-text-primary placeholder:text-text-muted"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
        {filteredActivities.map((activity) => (
          <GlassCard
            key={activity.id}
            className="glass p-5 rounded-[28px] border-none ring-1 ring-black/5 dark:ring-white/10 hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1"
            onClick={() => setSelectedActivity(activity)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3.5 rounded-[20px] ${activity.bg} ${activity.color} ring-1 ring-black/5 dark:ring-white/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-sm`}>
                <activity.icon size={26} strokeWidth={1.5} />
              </div>
              <div className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-black/5 dark:bg-white/5 text-text-secondary ring-1 ring-black/5 dark:ring-white/10 mt-1">
                {activity.intensity}
              </div>
            </div>

            <h3 className="font-extrabold text-xl text-text-primary mb-1.5 group-hover:text-accent transition-colors tracking-tight">
              {activity.name}
            </h3>
            <p className="text-xs font-medium text-text-secondary line-clamp-2 leading-relaxed">
              {activity.description}
            </p>

            <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                METs: <span className="text-text-primary font-mono text-xs">{activity.mets}</span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-accent flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 duration-300">
                {activity.hasGPS ? (
                  <>Empezar <MapPin size={12} strokeWidth={2.5} /></>
                ) : (
                  <>Empezar <Play size={12} strokeWidth={2.5} /></>
                )}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center py-24 px-4 bg-black/5 dark:bg-white/5 rounded-[32px] ring-1 ring-black/5 dark:ring-white/10 mt-8">
          <div className="w-20 h-20 bg-bg-primary rounded-[24px] mx-auto flex items-center justify-center mb-6 ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
             <Search size={36} className="text-text-muted opacity-50" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-extrabold text-text-primary mb-2">No se encontraron actividades</h3>
          <p className="text-sm font-medium text-text-secondary">Prueba buscando con otros términos o filtros.</p>
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