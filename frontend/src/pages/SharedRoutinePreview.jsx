/* frontend/src/pages/SharedRoutinePreview.jsx */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Download, 
  Share2, 
  AlertTriangle, 
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
import ExerciseMedia from '../components/ExerciseMedia';
import { useToast } from '../hooks/useToast';
import useAppStore from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_BASE_URL = API_BASE_URL?.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

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
  
  // Estados para manejar errores de carga en imágenes
  const [coverError, setCoverError] = useState(false);
  const [profileError, setProfileError] = useState(false);

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

    if (id) loadRoutine();
  }, [id]);

  const handleImport = async () => {
    if (!userProfile) {
      addToast('Debes iniciar sesión para importar rutinas.', 'info');
      navigate('/login', { state: { from: `/share/routine/${id}` } });
      return;
    }

    setImporting(true);
    try {
      const creatorName = routine.creatorName || 'Usuario Desconocido';
      const folderName = `Compartido de ${creatorName}`;
      
      await forkRoutine(id, folderName);
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

  const getMediaUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_BASE_URL}${url}`;
  };

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-bg-primary">
        <Spinner size="large" />
      </div>
    );
  }

  if (error || !routine) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-bg-primary p-6 text-center">
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

  const groupExercises = (exercises) => {
    if (!exercises) return [];
    const groups = [];
    let currentGroup = [];
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
  const profileImage = getMediaUrl(routine.creatorProfileImage);
  const coverImage = getMediaUrl(routine.image_url);

  return (
    <div className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-bg-primary pb-32 animate-fade-in w-full">
      <Helmet>
        <title>{routine.name} - Rutina Compartida</title>
      </Helmet>

      {/* Header Visual con Portada */}
      <div className="relative h-auto min-h-[16rem] md:min-h-[20rem] w-full flex flex-col justify-end">
        <div className="absolute inset-0 bg-bg-primary z-0">
            {coverImage && !coverError ? (
                <img 
                    src={coverImage} 
                    alt={routine.name} 
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                    onError={() => setCoverError(true)}
                />
            ) : (
                <div className="absolute inset-0 bg-accent/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent" />
        </div>
        
        <div className="absolute top-0 left-0 w-full p-4 sm:p-6 z-10 flex justify-between items-start">
            <button 
              onClick={() => navigate('/')}
              className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition"
            >
                <ArrowLeft size={24} />
            </button>
        </div>

        <div className="relative z-10 w-full p-4 pb-10 sm:p-6 sm:pb-12 pt-16">
            <div className="max-w-4xl mx-auto w-full">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-accent text-bg-secondary text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <Share2 size={12} /> Rutina Compartida
                    </span>
                    {routine.folder && (
                        <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1">
                            <Layers size={12} /> {routine.folder}
                        </span>
                    )}
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 drop-shadow-lg leading-tight break-words">
                    {routine.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/80 text-xs sm:text-sm">
                    <span className="flex items-center gap-1.5">
                        {profileImage && !profileError ? (
                           <img 
                               src={profileImage} 
                               alt={routine.creatorName} 
                               className="w-5 h-5 rounded-full object-cover border border-white/20" 
                               onError={() => setProfileError(true)}
                           />
                        ) : (
                           <User size={14} /> 
                        )}
                        Por <strong>{routine.creatorName || 'Anónimo'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                        <Calendar size={14} /> {new Date(routine.created_at || Date.now()).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4 relative z-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="md:col-span-1 space-y-4">
                <GlassCard className="p-4 sm:p-6 border-transparent dark:border dark:border-white/10">
                    <div className="flex flex-col gap-4">
                        <div className="p-4 rounded-2xl bg-bg-secondary border border-white/5 text-center flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-accent leading-none mb-1">{routine.exercises?.length || 0}</span>
                            <span className="text-xs text-text-muted uppercase font-bold tracking-wider">Ejercicios</span>
                        </div>

                        {routine.description && (
                            <div className="p-4 rounded-2xl bg-bg-secondary/50 border border-white/5">
                                <h3 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
                                    <Info size={14} className="text-accent" /> Descripción
                                </h3>
                                <p className="text-sm text-text-secondary leading-relaxed break-words">
                                    {routine.description}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg bg-accent text-bg-secondary hover:brightness-110 shadow-lg shadow-accent/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {importing ? <Spinner size={24} color="border-current" /> : (
                                <>
                                    <Download size={20} />
                                    Importar Rutina
                                </>
                            )}
                        </button>
                        
                        {!userProfile && (
                            <p className="text-xs text-center text-text-muted mt-2">
                                * Inicia sesión para guardar en tu perfil.
                            </p>
                        )}
                    </div>
                </GlassCard>
            </div>

            <div className="md:col-span-2">
                <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Dumbbell size={20} className="text-accent" /> Ejercicios
                </h2>

                <div className="space-y-4">
                    {exerciseGroups.map((group, idx) => (
                        <div key={idx} className="relative pl-3 sm:pl-4">
                            {group.length > 1 && (
                                <div className="absolute left-0 top-4 bottom-4 w-1 bg-accent/40 rounded-full" />
                            )}
                            
                            <div className="flex flex-col gap-3">
                                {group.map((ex, exIdx) => (
                                    <GlassCard key={ex.id || exIdx} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-transparent dark:border dark:border-white/5 hover:bg-bg-secondary transition-colors">
                                        
                                        <div className="flex items-start gap-3 w-full sm:w-auto min-w-0 flex-1">
                                            {group.length > 1 && (
                                                <div className="text-accent shrink-0 mt-0.5" title="Parte de superserie">
                                                    <Link2 size={16} />
                                                </div>
                                            )}
                                            
                                            <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-bg-primary border border-white/5 flex items-center justify-center relative">
                                                <ExerciseMedia 
                                                    details={{
                                                        video_url: ex.video_url,
                                                        image_url: ex.image_url_start || ex.image_url,
                                                        name: ex.name
                                                    }}
                                                    className="w-full h-full !rounded-none object-cover" 
                                                />
                                            </div>

                                            <div className="min-w-0 w-full pt-1">
                                                <h3 className="font-bold text-text-primary text-sm sm:text-base break-words whitespace-normal line-clamp-2">
                                                    {t(ex.name)}
                                                </h3>
                                                {ex.notes && (
                                                    <p className="text-xs text-text-muted mt-0.5 truncate">{ex.notes}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center self-start sm:self-auto gap-3 shrink-0 bg-bg-primary/50 sm:bg-transparent p-2 sm:p-0 rounded-lg w-full sm:w-auto justify-between sm:justify-end">
                                            <div className="text-left sm:text-right">
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
                        <div className="text-center py-10 text-text-muted italic bg-bg-secondary/50 rounded-xl">
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