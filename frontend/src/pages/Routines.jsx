/* frontend/src/pages/Routines.jsx */
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Plus,
  Edit,
  Trash2,
  Play,
  CheckCircle,
  Link2,
  Search,
  CalendarClock,
  Dumbbell,
  BookCopy,
  Compass,
  Clock,
  Folder,
  FolderOpen,
  Share2,
  Globe,
  Copy,
  Users,
  Lock,
  X,
  Sparkles,
  Flame
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ConfirmationModal from '../components/ConfirmationModal';
import RoutineEditor from './RoutineEditor';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import TemplateRoutines from './TemplateRoutines';
import WorkoutSummaryModal from '../components/WorkoutSummaryModal';
import RoutineAIGeneratorModal from '../components/RoutineAIGeneratorModal';
import RoutineTourGuide from '../components/RoutineTourGuide';

const GlobalPrivacyModal = ({ onClose }) => {
  const { addToast } = useToast();
  const [visibility, setVisibility] = useState(() => localStorage.getItem('globalWorkoutVisibility') || 'friends');
  const [notifyFriends, setNotifyFriends] = useState(() => localStorage.getItem('globalNotifyFriends') !== 'false');

  const handleSave = () => {
    localStorage.setItem('globalWorkoutVisibility', visibility);
    localStorage.setItem('globalNotifyFriends', notifyFriends.toString());
    addToast('Privacidad del muro actualizada', 'success');
    onClose();
  };

  const getOptionClasses = (optionKey) => {
    const isSelected = visibility === optionKey;
    return `flex items-center gap-4 p-4 rounded-[20px] transition-all duration-300 text-left group cursor-pointer relative overflow-hidden border-none ring-1
      ${isSelected
        ? 'bg-accent/10 ring-accent/50 shadow-md shadow-accent/10 scale-[1.02]'
        : 'bg-black/5 dark:bg-white/5 ring-transparent hover:bg-black/10 dark:hover:bg-white/10'
      }`;
  };

  const getIconContainerClasses = (optionKey) => {
    const isSelected = visibility === optionKey;
    return `transition-colors flex items-center justify-center p-2 rounded-[14px]
      ${isSelected
        ? 'text-accent bg-accent/10'
        : 'text-text-secondary bg-black/5 dark:bg-white/5 group-hover:text-text-primary'
      }`;
  };

  const getTextClasses = (optionKey) => {
    const isSelected = visibility === optionKey;
    return `block font-bold text-base transition-colors ${isSelected ? 'text-accent' : 'text-text-primary'}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 pb-20 sm:pb-4 animate-[fade-in_0.2s_ease-out]">
      <div className="absolute inset-0" onClick={onClose} />
      <GlassCard
        className="w-full max-w-md p-0 relative flex flex-col max-h-[calc(100vh-100px)] overflow-hidden animate-[slide-up_0.3s_ease-out] rounded-[32px] shadow-2xl border-none ring-1 ring-black/5 dark:ring-white/10 bg-bg-primary z-10"
      >
        <div className="relative p-6 sm:p-8 pb-4 shrink-0 bg-black/5 dark:bg-white/5 rounded-t-[32px]">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors z-10"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>

          <div className="flex flex-col items-center text-center gap-3 mt-2">
            <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-1 ring-2 ring-accent/30 bg-accent/10 text-accent">
              <Globe size={32} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Privacidad del Muro</h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-2 px-4 leading-relaxed font-medium">
                ¿Quién puede ver tus entrenamientos al finalizarlos?
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 pt-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => setVisibility('private')} className={getOptionClasses('private')}>
              <div className={getIconContainerClasses('private')}><Lock size={20} strokeWidth={2} /></div>
              <div>
                <span className={getTextClasses('private')}>No subir</span>
                <span className="text-xs text-text-secondary block mt-0.5">Tus entrenamientos no aparecerán en el muro.</span>
              </div>
              {visibility === 'private' && <div className="absolute right-4 text-accent"><CheckCircle size={20} /></div>}
            </button>

            <button onClick={() => setVisibility('friends')} className={getOptionClasses('friends')}>
              <div className={getIconContainerClasses('friends')}><Users size={20} strokeWidth={2} /></div>
              <div>
                <span className={getTextClasses('friends')}>Solo Amigos</span>
                <span className="text-xs text-text-secondary block mt-0.5">Tus amigos agregados verán tu actividad.</span>
              </div>
              {visibility === 'friends' && <div className="absolute right-4 text-accent"><CheckCircle size={20} /></div>}
            </button>

            <button onClick={() => setVisibility('public')} className={getOptionClasses('public')}>
              <div className={getIconContainerClasses('public')}><Globe size={20} strokeWidth={2} /></div>
              <div>
                <span className={getTextClasses('public')}>Todo el mundo</span>
                <span className="text-xs text-text-secondary block mt-0.5">Cualquier usuario podrá ver tus entrenamientos.</span>
              </div>
              {visibility === 'public' && <div className="absolute right-4 text-accent"><CheckCircle size={20} /></div>}
            </button>
          </div>

          <div className={`transition-all duration-300 overflow-hidden ${visibility !== 'private' ? 'max-h-40 opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}`}>
            <div className="p-5 rounded-[24px] bg-black/5 dark:bg-white/5 flex items-center justify-between gap-4">
              <div className="text-left">
                <span className="block font-bold text-sm text-text-primary">Notificar a mis amigos</span>
                <span className="text-[10px] sm:text-xs text-text-secondary block mt-1 leading-tight font-medium">Avisarles cuando publiques un entrenamiento.</span>
              </div>
              <button
                onClick={() => setNotifyFriends(!notifyFriends)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none shadow-inner ${notifyFriends ? 'bg-accent shadow-accent/20' : 'bg-gray-400 dark:bg-gray-600'}`}
              >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${notifyFriends ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 shrink-0 border-t border-black/5 dark:border-white/10 rounded-b-[32px] bg-black/5 dark:bg-white/5">
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-[20px] font-bold text-sm sm:text-base bg-accent text-white hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20"
          >
            Guardar Cambios
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

const ShareSettingsModal = ({ routine, onClose, onUpdate }) => {
  const { addToast } = useToast();
  const [visibility, setVisibility] = useState(routine.visibility || 'private');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (routine.visibility) {
      setVisibility(routine.visibility);
    }
  }, [routine.visibility]);

  const shareUrl = `${window.location.origin}/share/routine/${routine.id}`;

  const handleVisibilityChange = async (newVisibility) => {
    if (newVisibility === visibility) return;

    setVisibility(newVisibility);
    setIsUpdating(true);
    try {
      const currentExercises = routine.exercises || routine.RoutineExercises || [];
      const payload = {
        ...routine,
        visibility: newVisibility,
        exercises: currentExercises.map(ex => ({ ...ex }))
      };

      await onUpdate(routine.id, payload);
      addToast('Visibilidad actualizada correctamente', 'success');
    } catch (error) {
      console.error(error);
      addToast('Error al actualizar visibilidad', 'error');
      setVisibility(routine.visibility || 'private');
    } finally {
      setIsUpdating(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    addToast('Enlace copiado al portapapeles', 'success');
  };

  const getOptionClasses = (optionKey) => {
    const isSelected = visibility === optionKey;
    return `flex items-center gap-4 p-4 rounded-[20px] transition-all duration-300 text-left group cursor-pointer relative overflow-hidden border-none ring-1
      ${isSelected
        ? 'bg-accent/10 ring-accent/50 shadow-md shadow-accent/10 scale-[1.02]'
        : 'bg-black/5 dark:bg-white/5 ring-transparent hover:bg-black/10 dark:hover:bg-white/10'
      }`;
  };

  const getIconContainerClasses = (optionKey) => {
    const isSelected = visibility === optionKey;
    return `transition-colors flex items-center justify-center p-2 rounded-[14px]
      ${isSelected
        ? 'text-accent bg-accent/10'
        : 'text-text-secondary bg-black/5 dark:bg-white/5 group-hover:text-text-primary'
      }`;
  };

  const getTextClasses = (optionKey) => {
    const isSelected = visibility === optionKey;
    return `block font-bold text-base transition-colors ${isSelected ? 'text-accent' : 'text-text-primary'}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 pb-20 sm:pb-4 animate-[fade-in_0.2s_ease-out]">
      <div className="absolute inset-0" onClick={onClose} />
      <GlassCard
        className="w-full max-w-md p-0 relative flex flex-col max-h-[calc(100vh-100px)] overflow-hidden animate-[slide-up_0.3s_ease-out] rounded-[32px] shadow-2xl border-none ring-1 ring-black/5 dark:ring-white/10 bg-bg-primary z-10"
      >
        <div className="relative p-6 sm:p-8 pb-4 shrink-0 bg-black/5 dark:bg-white/5 rounded-t-[32px]">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors z-10"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>

          <div className="flex flex-col items-center text-center gap-3 mt-2">
            <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-1 ring-2 ring-accent/30 bg-accent/10 text-accent">
              <Share2 size={32} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Compartir Rutina</h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-2 px-4 leading-relaxed font-medium">
                Configura la privacidad para <strong className="text-text-primary">{routine.name}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 pt-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => handleVisibilityChange('private')} className={getOptionClasses('private')}>
              <div className={getIconContainerClasses('private')}><Lock size={20} strokeWidth={2} /></div>
              <div>
                <span className={getTextClasses('private')}>Privada</span>
                <span className="text-xs text-text-secondary block mt-0.5">Solo tú puedes ver esta rutina.</span>
              </div>
              {visibility === 'private' && <div className="absolute right-4 text-accent"><CheckCircle size={20} /></div>}
            </button>

            <button onClick={() => handleVisibilityChange('friends')} className={getOptionClasses('friends')}>
              <div className={getIconContainerClasses('friends')}><Users size={20} strokeWidth={2} /></div>
              <div>
                <span className={getTextClasses('friends')}>Solo Amigos</span>
                <span className="text-xs text-text-secondary block mt-0.5">Accesible para tus amigos agregados.</span>
              </div>
              {visibility === 'friends' && <div className="absolute right-4 text-accent"><CheckCircle size={20} /></div>}
            </button>

            <button onClick={() => handleVisibilityChange('public')} className={getOptionClasses('public')}>
              <div className={getIconContainerClasses('public')}><Globe size={20} strokeWidth={2} /></div>
              <div>
                <span className={getTextClasses('public')}>Pública</span>
                <span className="text-xs text-text-secondary block mt-0.5">Cualquiera con el enlace puede verla.</span>
              </div>
              {visibility === 'public' && <div className="absolute right-4 text-accent"><CheckCircle size={20} /></div>}
            </button>
          </div>

          <div className={`transition-all duration-300 overflow-hidden ${visibility !== 'private' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-5 rounded-[24px] bg-black/5 dark:bg-white/5 space-y-3 ring-1 ring-black/5 dark:ring-white/10">
              <label className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1.5">
                <Link2 size={14} /> Enlace para compartir
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-bg-secondary rounded-[16px] px-4 py-3 text-xs text-text-primary font-mono font-medium truncate select-all ring-1 ring-black/5 dark:ring-white/10">
                  {shareUrl}
                </div>
                <button
                  onClick={copyLink}
                  className="p-3 bg-accent text-white hover:scale-105 active:scale-95 rounded-[16px] transition-all shadow-lg shadow-accent/20"
                  title="Copiar enlace"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 shrink-0 border-t border-black/5 dark:border-white/10 rounded-b-[32px] bg-black/5 dark:bg-white/5">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-[20px] font-bold text-sm sm:text-base bg-black/5 dark:bg-white/5 text-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

const Routines = ({ setView }) => {
  const { addToast } = useToast();
  const { t } = useTranslation('exercise_names');

  const {
    routines,
    workoutLog,
    fetchInitialData,
    startWorkout,
    deleteRoutine,
    createRoutine,
    updateRoutine,
    activeWorkout,
    completedRoutineIdsToday,
    fetchTodaysCompletedRoutines,
  } = useAppStore((state) => ({
    routines: state.routines,
    workoutLog: state.workoutLog,
    fetchInitialData: state.fetchInitialData,
    startWorkout: state.startWorkout,
    deleteRoutine: state.deleteRoutine,
    createRoutine: state.createRoutine,
    updateRoutine: state.updateRoutine,
    activeWorkout: state.activeWorkout,
    completedRoutineIdsToday: state.completedRoutineIdsToday,
    fetchTodaysCompletedRoutines: state.fetchTodaysCompletedRoutines,
  }));

  const LS_KEY_EDITING = 'routinesEditingState_v2';

  const [editingRoutine, setEditingRoutine] = useState(() => {
    const savedEditingRoutine = localStorage.getItem(LS_KEY_EDITING);
    if (savedEditingRoutine) {
      try {
        return JSON.parse(savedEditingRoutine);
      } catch (e) {
        console.error('Error al parsear rutina guardada:', e);
        localStorage.removeItem(LS_KEY_EDITING);
        return null;
      }
    }
    return null;
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');

  const [sharingRoutineId, setSharingRoutineId] = useState(null);
  const sharingRoutine = useMemo(() => {
    if (!sharingRoutineId) return null;
    return routines.find(r => r.id === sharingRoutineId);
  }, [routines, sharingRoutineId]);

  const [selectedFolder, setSelectedFolder] = useState(() => {
    return localStorage.getItem('routinesSelectedFolder') || 'all';
  });

  const [shareData, setShareData] = useState(null);

  const [activeTab, setActiveTab] = useState(() => {
    const forcedTab = localStorage.getItem('routinesForceTab');
    if (forcedTab) {
      localStorage.removeItem('routinesForceTab');
      return forcedTab;
    }
    return localStorage.getItem('routinesActiveTab') || 'myRoutines';
  });

  const isAnyWorkoutActive = activeWorkout !== null && activeWorkout !== undefined;

  const isCssBackground = (value) => {
    return value && (value.startsWith('linear-gradient') || value.startsWith('var(--'));
  };

  const getDisplayImageUrl = (path) => {
    if (!path || isCssBackground(path)) return null;
    if (path.startsWith('blob:')) return path;

    let cleanPath = path.replace(/http:\/\/localhost:\d+/g, '');
    if (cleanPath.startsWith('http')) return cleanPath;

    const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
    let base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

    if (base.endsWith('/api')) {
      base = base.slice(0, -4);
    }

    if (cleanPath.startsWith('/uploads') || cleanPath.startsWith('/images')) {
      return `${base}${cleanPath}`;
    }
    return cleanPath;
  };

  useEffect(() => {
    fetchTodaysCompletedRoutines();
  }, [fetchTodaysCompletedRoutines]);

  useEffect(() => {
    localStorage.setItem('routinesActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('routinesSelectedFolder', selectedFolder);
  }, [selectedFolder]);

  useEffect(() => {
    if (editingRoutine) {
      localStorage.setItem(LS_KEY_EDITING, JSON.stringify(editingRoutine));
    } else {
      localStorage.removeItem(LS_KEY_EDITING);
    }
  }, [editingRoutine]);

  const lastUsedMap = useMemo(() => {
    const map = new Map();
    (workoutLog || []).forEach((log) => {
      if (log && log.routine_id) {
        const d = new Date(log.workout_date);
        const prev = map.get(log.routine_id);
        if (!prev || d > prev) map.set(log.routine_id, d);
      }
    });
    return map;
  }, [workoutLog]);

  const uniqueFolders = useMemo(() => {
    if (!routines) return [];
    const folders = routines
      .map(r => r.folder)
      .filter(f => f && f.trim() !== '');
    return [...new Set(folders)].sort();
  }, [routines]);

  useEffect(() => {
    if (selectedFolder !== 'all' && selectedFolder !== 'uncategorized') {
      if (routines?.length > 0 && !uniqueFolders.includes(selectedFolder)) {
        setSelectedFolder('all');
      }
    }
  }, [uniqueFolders, selectedFolder, routines]);

  const groupExercises = (exercises) => {
    if (!exercises || exercises.length === 0) return [];
    const groups = [];
    let currentGroup = [];

    const sortedExercises = [...exercises]
      .filter((ex) => ex)
      .sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0));

    for (const ex of sortedExercises) {
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
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    return groups;
  }

  const handleSave = async () => {
    setIsLoading(true);
    try {
      setEditingRoutine(null);
      await fetchInitialData();
    } catch (error) {
      addToast(error.message || 'Ocurrió un error al refrescar las rutinas.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (routine) => {
    if (isAnyWorkoutActive && activeWorkout.routineId === routine.id) {
      addToast('No puedes editar la rutina que está en curso. Finaliza o descarta el entrenamiento primero.', 'warning');
    } else {
      const exercises = routine.exercises || routine.RoutineExercises || [];
      const normalizedRoutine = {
        ...routine,
        exercises: exercises.map(ex => ({ ...ex }))
      };
      setEditingRoutine(normalizedRoutine);
    }
  };

  const handleShareClick = (routine) => {
    if (!workoutLog) return;
    const today = new Date().toDateString();

    const todaysLog = workoutLog
      .filter(log => log.routine_id === routine.id)
      .sort((a, b) => new Date(b.workout_date) - new Date(a.workout_date))
      .find(log => new Date(log.workout_date).toDateString() === today);

    if (todaysLog) {
      const rawDetails = todaysLog.details || todaysLog.WorkoutLogDetails || [];
      const normalizedDetails = rawDetails.map((ex) => {
        let rawSets = ex.setsDone || ex.sets_done || ex.sets || ex.Sets || ex.WorkoutLogSets || [];

        if (typeof rawSets === 'string') {
          try { rawSets = JSON.parse(rawSets); }
          catch (e) { rawSets = []; }
        }

        if (!Array.isArray(rawSets)) rawSets = [];

        const normalizedSets = rawSets.map(s => ({
          weight_kg: parseFloat(s.weight_kg || s.weight || 0),
          reps: parseFloat(s.reps || 0),
          is_dropset: !!(s.is_dropset || s.isDropset),
          is_warmup: !!(s.is_warmup || s.isWarmup),
          set_number: parseInt(s.set_number || s.setNumber || 0)
        }));

        const exName = ex.exercise_name || ex.exerciseName || ex.name || "Ejercicio";
        return { exerciseName: exName, setsDone: normalizedSets };
      });

      setShareData({
        routineName: routine.name || todaysLog.routine_name,
        duration_seconds: todaysLog.duration_seconds || 0,
        calories_burned: todaysLog.calories_burned || 0,
        details: normalizedDetails,
        notes: todaysLog.notes,
        workout_date: todaysLog.workout_date
      });
    } else {
      addToast("No se encontraron datos del entrenamiento de hoy para compartir.", "info");
    }
  };

  const handleDeleteClick = (id) => {
    setRoutineToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteRoutine(routineToDelete);
      if (result.success) {
        addToast(result.message, 'success');
        setShowDeleteModal(false);
        setRoutineToDelete(null);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      addToast(error.message || 'Error al eliminar la rutina.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateRoutine = async (routine) => {
    setIsLoading(true);
    try {
      const copy = {
        name: `${routine.name} (Copia)`,
        description: routine.description,
        folder: routine.folder,
        image_url: routine.image_url || routine.imageUrl,
        imageUrl: routine.imageUrl || routine.image_url,
        exercises: (routine.RoutineExercises || routine.exercises || []).map(
          ({ ...ex }) => ({
            ...ex,
            exercise_order: ex.exercise_order !== undefined ? ex.exercise_order : 0,
          })
        ),
      };

      const result = await createRoutine(copy);
      if (result.success) {
        addToast('Rutina duplicada.', 'success');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      addToast(error.message || 'No se pudo duplicar la rutina.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartWorkout = async (routine) => {
    if (activeWorkout && activeWorkout.routineId === routine.id) {
      setView('workout');
      return;
    }

    if (isAnyWorkoutActive && activeWorkout.routineId !== routine.id) {
      addToast('Ya tienes un entrenamiento en curso. Finalízalo o descártalo para empezar uno nuevo.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const result = await startWorkout(routine);
      if (result && result.success === false) {
        addToast(result.message, 'error');
        setIsLoading(false);
        return;
      }

      let attempts = 0;
      const maxAttempts = 10;
      const checkAndNavigate = () => {
        const currentActive = useAppStore.getState().activeWorkout;
        if (currentActive) {
          setIsLoading(false);
          setView('workout');
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkAndNavigate, 50);
        } else {
          setIsLoading(false);
          console.warn("Timeout esperando activeWorkout, navegando de todas formas...");
          setView('workout');
        }
      };

      checkAndNavigate();
    } catch (error) {
      console.error("Error al iniciar entrenamiento:", error);
      addToast("No se pudo iniciar el entrenamiento. Inténtalo de nuevo.", "error");
      setIsLoading(false);
    }
  };

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = (routines || []).filter((r) => {
      if (!r) return false;
      const matchesQuery = !q ||
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q);
      let matchesFolder = true;
      if (selectedFolder === 'uncategorized') {
        matchesFolder = !r.folder || r.folder.trim() === '';
      } else if (selectedFolder !== 'all') {
        matchesFolder = r.folder === selectedFolder;
      }
      return matchesQuery && matchesFolder;
    });

    list.sort((a, b) => {
      const da = a ? lastUsedMap.get(a.id)?.getTime() || 0 : 0;
      const db = b ? lastUsedMap.get(b.id)?.getTime() || 0 : 0;
      return db - da;
    });

    return list;
  }, [routines, query, lastUsedMap, selectedFolder]);

  if (editingRoutine) {
    return (
      <RoutineEditor
        key={editingRoutine.id || 'new'}
        routine={editingRoutine}
        onSave={handleSave}
        onCancel={() => setEditingRoutine(null)}
        initialFolder={selectedFolder !== 'all' && selectedFolder !== 'uncategorized' ? selectedFolder : null}
      />
    );
  }

  // --- Nueva función para obtener clases de Píldoras con margen seguro (mx-1.5 y my-2) ---
  const getTabClass = (tabId) => `mx-1.5 my-2 px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap outline-none flex items-center gap-2 ${
    activeTab === tabId
        ? 'bg-accent text-white shadow-md shadow-accent/30 scale-105'
        : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary'
  }`;

  const getFolderClass = (folderId) => `mx-1.5 my-2 px-5 py-2.5 text-sm font-bold rounded-[20px] transition-all duration-300 whitespace-nowrap flex items-center gap-2 outline-none flex-shrink-0 ${
    selectedFolder === folderId
        ? 'bg-accent text-white shadow-md shadow-accent/30 scale-105'
        : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary'
  }`;

  const RoutineActionButtons = ({ className = '', id }) => (
    <div className={`flex gap-2.5 ${className}`} id={id}>
      <button
        onClick={() => setShowPrivacyModal(true)}
        className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-full bg-black/5 dark:bg-white/5 text-text-primary font-bold transition hover:scale-105 hover:bg-black/10 dark:hover:bg-white/10"
        title="Privacidad del Muro"
      >
        <Globe size={18} />
        <span className="hidden sm:inline">Muro</span>
      </button>
      <button
        onClick={() => setShowAIGenerator(true)}
        className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-full bg-accent/10 text-accent font-bold transition hover:scale-105"
        title="Generar rutina con IA"
      >
        <Sparkles size={18} />
        <span className="hidden sm:inline">IA</span>
      </button>
      <button
        onClick={() => {
          setEditingRoutine({
            name: '',
            description: '',
            exercises: [],
            folder: selectedFolder !== 'all' && selectedFolder !== 'uncategorized' ? selectedFolder : ''
          });
        }}
        className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-accent text-white font-bold transition hover:scale-105 shadow-lg shadow-accent/30 flex-1 md:flex-none"
      >
        <Plus size={18} />
        Crear Rutina
      </button>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-28 md:p-8 md:pb-8 animate-[fade-in_0.5s_ease_out]">
      <RoutineTourGuide />
      <Helmet>
        <title>
          {activeTab === 'myRoutines' ? 'Mis Rutinas' : 'Explorar Plantillas'} - Pro Fitness Glass
        </title>
        <meta
          name="description"
          content={
            activeTab === 'myRoutines'
              ? 'Crea, edita y gestiona tus rutinas de entrenamiento personalizadas.'
              : 'Descubre y copia rutinas de entrenamiento predefinidas.'
          }
        />
      </Helmet>

      <div className="hidden md:flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mt-10 md:mt-0 text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight">
          Rutinas
        </h1>
        {activeTab === 'myRoutines' && <RoutineActionButtons id="routines-actions-desktop" />}
      </div>

      {/* Tabs principales con márgenes de seguridad para las sombras */}
      <div id="routines-tabs" className="flex items-center mb-8 overflow-x-auto py-2 -mx-4 px-2.5 md:mx-0 md:px-0 scrollbar-hide mt-6 md:mt-0">
        <button
          onClick={() => setActiveTab('myRoutines')}
          className={getTabClass('myRoutines')}
        >
          <BookCopy size={18} /> Mis Rutinas
        </button>
        <button
          onClick={() => setActiveTab('explore')}
          className={getTabClass('explore')}
        >
          <Compass size={18} /> Explorar
        </button>
        <button
          onClick={() => {
            localStorage.setItem('quickCardioOrigin', 'routines');
            setView('quickCardio');
          }}
          className={`mx-1.5 my-2 px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap outline-none flex items-center gap-2 bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary`}
        >
          <Flame size={18} /> Cardio Rápido
        </button>
      </div>

      {activeTab === 'myRoutines' && (
        < RoutineActionButtons id="routines-actions-mobile" className="flex md:hidden w-full mb-8" />
      )}

      {activeTab === 'myRoutines' && (
        <>
          <div className="mb-8 flex flex-col gap-5">
            <div className="max-w-md relative" id="routines-search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar rutinas..."
                className="w-full pl-11 pr-4 py-3.5 rounded-[20px] bg-black/5 dark:bg-white/5 border border-transparent focus:border-accent/30 focus:outline-none transition-all text-sm font-medium placeholder:text-text-muted text-text-primary"
              />
            </div>

            {/* Subpestañas (Carpetas) con márgenes de seguridad */}
            {routines && routines.length > 0 && (
              <div className="flex items-center overflow-x-auto py-2 scrollbar-hide -mx-4 px-2.5 md:mx-0 md:px-0">
                <button
                  onClick={() => setSelectedFolder('all')}
                  className={getFolderClass('all')}
                >
                  Todas
                </button>

                {uniqueFolders.map(folder => (
                  <button
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    className={getFolderClass(folder)}
                  >
                    {selectedFolder === folder ? <FolderOpen size={16} /> : <Folder size={16} />}
                    {folder}
                  </button>
                ))}

                <button
                  onClick={() => setSelectedFolder('uncategorized')}
                  className={getFolderClass('uncategorized')}
                >
                  Otros
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {filteredSorted && filteredSorted.length > 0 ? (
              filteredSorted.map((routine) => {
                if (!routine) return null;

                const isCompleted = completedRoutineIdsToday.includes(routine.id);
                const isActive = activeWorkout && activeWorkout.routineId === routine.id;
                const isBlockedByOtherWorkout = isAnyWorkoutActive && !isActive;

                const exercisesToGroup = routine.RoutineExercises || routine.exercises || [];
                const exerciseGroups = groupExercises(exercisesToGroup);
                const lastUsed = lastUsedMap.get(routine.id);
                const totalExercises = exercisesToGroup.length;
                const imageSrc = routine.imageUrl || routine.image_url;

                let visibilityIcon = <Lock size={12} />;
                let visibilityText = 'Privada';

                if (routine.visibility === 'public') {
                  visibilityIcon = <Globe size={12} />;
                  visibilityText = 'Pública';
                } else if (routine.visibility === 'friends') {
                  visibilityIcon = <Users size={12} />;
                  visibilityText = 'Amigos';
                }

                return (
                  <GlassCard 
                    key={routine.id} 
                    className={`glass p-0 overflow-hidden flex flex-col group relative rounded-[28px] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border-none ring-1 ring-black/5 dark:ring-white/10 ${isActive ? 'ring-2 ring-accent shadow-accent/20' : ''}`}
                  >
                    {imageSrc && (
                      <div className="h-32 sm:h-40 w-full relative shrink-0 overflow-hidden bg-black/5 dark:bg-white/5">
                        {isCssBackground(imageSrc) ? (
                          <div
                            className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                            style={{ background: imageSrc }}
                          />
                        ) : (
                          <img
                            src={getDisplayImageUrl(imageSrc)}
                            alt={routine.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 to-transparent opacity-80" />
                        {routine.folder && (
                          <div className="absolute top-3 right-3 z-20">
                            <span className="px-3 py-1.5 rounded-[12px] bg-black/40 backdrop-blur-md text-xs font-bold text-white flex items-center gap-1.5 shadow-sm">
                              <Folder size={14} /> {routine.folder}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-5 sm:p-6 flex-1 flex flex-col">
                      <div className="flex flex-col gap-1 min-w-0 mb-4">
                        {!imageSrc && routine.folder && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted mb-1">
                            <Folder size={14} /> {routine.folder}
                          </span>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl md:text-2xl font-bold text-text-primary leading-tight break-words max-w-full">
                            {routine.name}
                          </h2>
                          {isActive && (
                            <span className="px-2.5 py-1 rounded-[10px] bg-accent/10 text-accent text-[10px] uppercase font-bold shrink-0">
                              Activo
                            </span>
                          )}
                          <span className="px-2.5 py-1 rounded-[10px] bg-black/5 dark:bg-white/5 text-text-secondary text-[10px] uppercase font-bold shrink-0 flex items-center gap-1">
                            {visibilityIcon} {visibilityText}
                          </span>
                        </div>
                      </div>

                      {routine.description && (
                        <p className="text-sm text-text-secondary line-clamp-2 mb-4 leading-relaxed">
                          {routine.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mb-5 text-xs font-bold text-text-secondary">
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-accent bg-accent/10 px-2 py-1 rounded-[8px]">
                            <CheckCircle size={14} /> Completada
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-[8px]">
                          <Dumbbell size={14} /> {totalExercises} ejercicios
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-[8px]">
                          <CalendarClock size={14} /> {lastUsed ? new Date(lastUsed).toLocaleDateString('es-ES') : 'Sin uso'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-5">
                        <button
                          onClick={() => setSharingRoutineId(routine.id)}
                          className="p-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-accent transition-colors"
                          title="Privacidad"
                        >
                          <Globe size={18} />
                        </button>
                        {isCompleted && (
                          <button
                            onClick={() => handleShareClick(routine)}
                            className="p-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-accent transition-colors"
                            title="Compartir"
                          >
                            <Share2 size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditClick(routine)}
                          className="p-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-accent transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => duplicateRoutine(routine)}
                          className="p-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-accent transition-colors"
                          title="Duplicar"
                        >
                          <Copy size={18} />
                        </button>

                        <div className="flex-1"></div>

                        <button
                          onClick={() => handleDeleteClick(routine.id)}
                          className="p-2.5 rounded-[14px] bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {exerciseGroups.length > 0 && (
                        <div className="mb-5 bg-black/5 dark:bg-white/5 rounded-[20px] p-4">
                          <div className="flex flex-col gap-4">
                            {exerciseGroups.map((group, groupIndex) => (
                              <div key={groupIndex}>
                                {group.length > 1 && (
                                  <div className="mb-2 inline-flex items-center gap-1.5 text-accent text-[10px] uppercase font-bold tracking-wider bg-accent/10 px-2 py-0.5 rounded-[8px]">
                                    <Link2 size={12} /> Superserie
                                  </div>
                                )}
                                <ul className={`flex flex-col gap-2.5 ${group.length > 1 ? 'pl-3 border-l-2 border-accent/30' : ''}`}>
                                  {group.map((ex) => (
                                    <li key={ex.id || ex.tempId} className="flex items-center justify-between text-sm">
                                      <span className="truncate font-semibold text-text-primary pr-3">
                                        {t(ex.name)}
                                      </span>
                                      <span className="text-text-secondary font-bold text-xs whitespace-nowrap bg-black/5 dark:bg-white/10 px-2 py-1 rounded-[8px]">
                                        {ex.sets}×{ex.reps}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-auto pt-2">
                        <button
                          onClick={() => handleStartWorkout(routine)}
                          disabled={isCompleted || isActive || isLoading || isBlockedByOtherWorkout}
                          className={`w-full inline-flex items-center justify-center gap-2 py-4 rounded-[20px] font-bold text-sm sm:text-base transition-all
                          ${isCompleted || isActive || isBlockedByOtherWorkout
                              ? 'bg-black/5 dark:bg-white/5 text-text-muted cursor-not-allowed'
                              : 'bg-accent text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-accent/20'
                            }
                        `}
                        >
                          {isLoading && !isCompleted && !isActive && !isBlockedByOtherWorkout ? (
                            <Spinner size="small" />
                          ) : isCompleted ? (
                            <>
                              <CheckCircle size={20} />
                              Entrenamiento Completado
                            </>
                          ) : isActive ? (
                            <>
                              <Clock size={20} />
                              Continuar Entrenamiento
                            </>
                          ) : isBlockedByOtherWorkout ? (
                            <>
                              <Lock size={20} />
                              Entrenamiento en Curso
                            </>
                          ) : (
                            <>
                              <Play size={20} fill="currentColor" />
                              Empezar Entrenamiento
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                );
              })
            ) : (
              <div className="lg:col-span-3 md:col-span-2">
                <GlassCard className="glass text-center p-10 sm:p-16 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[32px]">
                  <div className="w-20 h-20 mx-auto bg-black/5 dark:bg-white/5 rounded-[24px] flex items-center justify-center mb-6 text-text-muted">
                    <Folder size={32} />
                  </div>
                  <p className="text-text-secondary font-medium">
                    {routines && routines.length > 0
                      ? `No hay rutinas en la carpeta "${selectedFolder === 'uncategorized' ? 'Otros' : selectedFolder}".`
                      : 'Aún no has creado ninguna rutina.'
                    }
                  </p>
                  <p className="text-text-primary font-bold mt-2">
                    ¡Haz clic en <span className="text-accent">“Crear Rutina”</span> para empezar!
                  </p>
                </GlassCard>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'explore' && <TemplateRoutines setView={setView} />}

      {showPrivacyModal && (
        <GlobalPrivacyModal onClose={() => setShowPrivacyModal(false)} />
      )}

      {sharingRoutine && (
        <ShareSettingsModal
          routine={sharingRoutine}
          onClose={() => setSharingRoutineId(null)}
          onUpdate={updateRoutine}
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onCancel={() => setShowDeleteModal(false)}
          message="¿Estás seguro de que quieres borrar esta rutina?"
          onConfirm={confirmDelete}
          isLoading={isLoading}
          confirmText="Eliminar"
          isDestructive={true}
        />
      )}

      {shareData && (
        <WorkoutSummaryModal
          workoutData={shareData}
          onClose={() => setShareData(null)}
          isShareMode={true}
        />
      )}

      <RoutineAIGeneratorModal
        isOpen={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onGenerate={(generatedRoutine) => setEditingRoutine(generatedRoutine)}
      />

      {isLoading && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 backdrop-blur-sm">
          <Spinner />
        </div>
      )}
    </div>
  );
};

export default Routines;