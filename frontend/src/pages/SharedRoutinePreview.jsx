/* frontend/src/pages/SharedRoutinePreview.jsx */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Download, 
  Share2, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  Calendar, 
  Dumbbell, 
  ArrowLeft,
  Info,
  Layers,
  Link2
} from 'lucide-react';
import { getPublicRoutine, forkRoutine } from '../services/routineService';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';
import useAppStore from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

const SharedRoutinePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useTranslation('exercise_names');
  const { userProfile, fetchInitialData } = useAppStore(state => ({
    userProfile: state.userProfile,
    fetchInitialData: state.fetchInitialData
  }));

  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const loadRoutine = async () => {
      try {
        setLoading(true);
        const data = await getPublicRoutine(id);
        setRoutine(data);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la rutina. Es posible que sea privada o no exista.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadRoutine();
    }
  }, [id]);

  const handleImport = async () => {
    if (!userProfile) {
      addToast('Debes iniciar sesión para importar rutinas.', 'info');
      navigate('/login', { state: { from: `/share/routine/${id}` } });
      return;
    }

    setImporting(true);
    try {
      // El backend manejará la creación de la carpeta "Compartido de [Creador]" si enviamos el nombre
      const creatorName = routine.creatorName || 'Usuario Desconocido';
      const folderName = `Compartido de ${creatorName}`;
      
      await forkRoutine(id, folderName);
      
      // Actualizamos los datos del usuario (rutinas)
      await fetchInitialData();
      
      addToast('¡Rutina importada con éxito!', 'success');
      navigate('/routines');
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error al importar la rutina.', 'error');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Spinner size="large" />
      </div>
    );
  }

  if (error || !routine) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
          <AlertTriangle size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Rutina no disponible</h1>
        <p className="text-text-secondary max-w-md mb-8">
          {error || 'El enlace podría estar roto, la rutina fue eliminada o no tienes permisos para verla.'}
        </p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-bg-secondary hover:bg-white/10 rounded-full font-bold text-text-primary transition-all"
        >
          Ir al Inicio
        </button>
      </div>
    );
  }

  // Agrupar ejercicios para mostrar superseries
  const groupExercises = (exercises) => {
    if (!exercises) return [];
    const groups = [];
    let currentGroup = [];
    
    // Ordenar por si acaso el backend no lo hizo
    const sorted = [...exercises].sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0));

    for (const ex of sorted) {
      if (currentGroup.length === 0) {
        currentGroup.push(ex);
        continue;
      }
      if (
        ex.superset_group_id !== null &&
        currentGroup[0].superset_group_id !== null &&
        ex.superset_group_id === currentGroup[0].superset_group_id
      ) {
        currentGroup.push(ex);
      } else {
        groups.push(currentGroup);
        currentGroup = [ex];
      }
    }
    if (currentGroup.length > 0) groups.push(currentGroup);
    return groups;
  };

  const exerciseGroups = groupExercises(routine.exercises || []);

  return (
    <div className="min-h-screen bg-bg-primary pb-10 animate-fade-in">
      <Helmet>
        <title>{routine.name} - Rutina Compartida</title>
      </Helmet>

      {/* Header Visual */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <div className="absolute inset-0 bg-accent/20 z-0">
            {/* Si hubiera imagen de fondo en la rutina, iría aquí */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg-primary" />
        </div>
        
        <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start">
            <button 
              onClick={() => navigate('/')}
              className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition"
            >
                <ArrowLeft size={24} />
            </button>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 z-10">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-accent text-bg-secondary text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <Share2 size={12} /> Rutina Compartida
                    </span>
                    {routine.folder && (
                        <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1">
                            <Layers size={12} /> {routine.folder}
                        </span>
                    )}
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white mb-2 drop-shadow-lg leading-tight">
                    {routine.name}
                </h1>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                    <span className="flex items-center gap-1">
                        <User size={14} /> Por <strong>{routine.creatorName || 'Anónimo'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                        <Calendar size={14} /> {new Date(routine.created_at || Date.now()).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Columna Izquierda: Detalles e Importar */}
            <div className="md:col-span-1 space-y-4">
                <GlassCard className="p-6 border-transparent dark:border dark:border-white/10">
                    <div className="flex flex-col gap-4">
                        <div className="p-4 rounded-2xl bg-bg-secondary border border-white/5 text-center">
                            <span className="block text-3xl font-black text-accent">{routine.exercises?.length || 0}</span>
                            <span className="text-xs text-text-muted uppercase font-bold tracking-wider">Ejercicios</span>
                        </div>

                        {routine.description && (
                            <div className="p-4 rounded-2xl bg-bg-secondary/50 border border-white/5">
                                <h3 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
                                    <Info size={14} className="text-accent" /> Descripción
                                </h3>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    {routine.description}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="w-full py-4 rounded-xl font-bold text-lg bg-accent text-bg-secondary hover:brightness-110 shadow-lg shadow-accent/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {importing ? <Spinner size={24} color="border-current" /> : (
                                <>
                                    <Download size={20} />
                                    Importar Rutina
                                </>
                            )}
                        </button>
                        
                        {!userProfile && (
                            <p className="text-xs text-center text-text-muted">
                                * Debes iniciar sesión para guardarla en tu perfil.
                            </p>
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* Columna Derecha: Lista de Ejercicios */}
            <div className="md:col-span-2">
                <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Dumbbell size={20} className="text-accent" /> Ejercicios
                </h2>

                <div className="space-y-3">
                    {exerciseGroups.map((group, idx) => (
                        <div key={idx} className="relative">
                            {group.length > 1 && (
                                <div className="absolute left-[-10px] top-4 bottom-4 w-1 bg-accent/30 rounded-full" />
                            )}
                            
                            <div className="flex flex-col gap-3">
                                {group.map((ex, exIdx) => (
                                    <GlassCard key={ex.id || exIdx} className="p-4 flex items-center justify-between border-transparent dark:border dark:border-white/5 hover:bg-bg-secondary transition-colors">
                                        <div className="flex items-center gap-4">
                                            {group.length > 1 && (
                                                <div className="text-accent" title="Parte de superserie">
                                                    <Link2 size={16} />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-text-primary text-base">
                                                    {t(ex.name)}
                                                </h3>
                                                {ex.notes && (
                                                    <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{ex.notes}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-text-primary">
                                                    {ex.sets} <span className="text-xs text-text-secondary font-normal">series</span>
                                                </div>
                                                <div className="text-xs text-text-secondary">
                                                    x {ex.reps} reps
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    {exerciseGroups.length === 0 && (
                        <div className="text-center py-10 text-text-muted italic">
                            Esta rutina no tiene ejercicios visibles.
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SharedRoutinePreview;