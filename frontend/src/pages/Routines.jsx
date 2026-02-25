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
  Sparkles
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
    return `flex items-center gap-4 p-4 rounded-xl border transition-all text-left group cursor-pointer relative overflow-hidden
      ${isSelected 
        ? 'bg-accent/10 border-accent shadow-[0_0_15px_-3px_rgba(var(--accent-rgb),0.3)]' 
        : 'bg-glass-base border-glass-border hover:border-accent/30 hover:bg-glass-base/80'
      }`;
  };

  const getIconContainerClasses = (optionKey) => {
    const isSelected = visibility === optionKey;
    return `transition-colors flex items-center justify-center
      ${isSelected 
        ? 'text-accent' 
        : 'text-text-secondary group-hover:text-text-primary'
      }`;
  };

  const getTextClasses = (optionKey) => {
    const isSelected = visibility === optionKey;
    return `block font-bold text-lg transition-colors ${isSelected ? 'text-accent' : 'text-text-primary'}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pb-20 sm:pb-4 animate-fade-in">
      <GlassCard 
        className="w-full max-w-md p-0 relative flex flex-col max-h-[calc(100vh-100px)] overflow-hidden animate-scale-in border border-glass-border shadow-2xl" 
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="relative p-6 pb-4 bg-gradient-to-b from-accent/5 to-transparent shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-glass-base text-text-secondary transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center gap-3 mt-2">
            <div className="text-accent mb-1">
              <Share2 size={36} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Compartir Rutina</h2>
              <p className="text-sm text-text-secondary mt-1 px-4">
                Configura la privacidad para <strong>{routine.name}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 space-y-6 flex-1 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => handleVisibilityChange('private')} className={getOptionClasses('private')}>
              <div className={getIconContainerClasses('private')}><Lock size={26} strokeWidth={1.5} /></div>
              <div>
                <span className={getTextClasses('private')}>Privada</span>
                <span className="text-xs text-text-secondary block mt-0.5">Solo tú puedes ver esta rutina.</span>
              </div>
              {visibility === 'private' && <div className="absolute right-4 text-accent"><CheckCircle size={20} /></div>}
            </button>

            <button onClick={() => handleVisibilityChange('friends')} className={getOptionClasses('friends')}>
              <div className={getIconContainerClasses('friends')}><Users size={26} strokeWidth={1.5} /></div>
              <div>
                <span className={getTextClasses('friends')}>Solo Amigos</span>
                <span className="text-xs text-text-secondary block mt-0.5">Accesible para tus amigos agregados.</span>
              </div>
              {visibility === 'friends' && <div className="absolute right-4 text-accent"><CheckCircle size={20} /></div>}
            </button>

            <button onClick={() => handleVisibilityChange('public')} className={getOptionClasses('public')}>
              <div className={getIconContainerClasses('public')}><Globe size={26} strokeWidth={1.5} /></div>
              <div>
                <span className={getTextClasses('public')}>Pública</span>
                <span className="text-xs text-text-secondary block mt-0.5">Cualquiera con el enlace puede verla.</span>
              </div>
              {visibility === 'public' && <div className="absolute right-4 text-accent"><CheckCircle size={20} /></div>}
            </button>
          </div>

          <div className={`transition-all duration-300 overflow-hidden ${visibility !== 'private' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-4 rounded-xl bg-glass-base border border-glass-border space-y-2">
              <label className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                 <Link2 size={10} /> Enlace para compartir
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-bg-primary rounded-lg px-3 py-2 border border-glass-border text-xs text-text-secondary font-mono truncate select-all">
                  {shareUrl}
                </div>
                <button 
                  onClick={copyLink}
                  className="p-2 bg-accent text-bg-primary hover:brightness-110 rounded-lg transition-colors shadow-lg shadow-accent/20"
                  title="Copiar enlace"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 pt-0 shrink-0">
             <button 
                onClick={onClose}
                className="w-full py-3 rounded-xl font-bold text-sm bg-accent text-bg-secondary hover:brightness-110 transition-all shadow-lg shadow-accent/20"
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
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

  const isCssBackground = (value) => {
    return value && (value.startsWith('linear-gradient') || value.startsWith('var(--'));
  };

  const getDisplayImageUrl = (path) => {
    if (!path) return null;
    if (isCssBackground(path)) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    if (path.startsWith('/uploads')) return `${API_URL}${path}`;
    return path;
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

  // Rescate automático si la carpeta seleccionada fue eliminada o ya no existe
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
  };

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
    if (activeWorkout && activeWorkout.routineId === routine.id) {
      addToast('No puedes editar una rutina que está en curso. Finaliza o descarta el entrenamiento primero.', 'warning');
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

  const baseButtonClasses = 'px-4 py-2 rounded-full font-semibold transition-colors flex items-center gap-2';
  const activeModeClasses = 'bg-accent text-bg-secondary';
  const inactiveModeClasses = 'bg-bg-secondary hover:bg-white/10 text-text-secondary';

  const RoutineActionButtons = ({ className = '' }) => (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={() => setShowAIGenerator(true)}
        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-accent/10 text-accent font-semibold transition hover:scale-105 border border-accent/30 dark:border-white/10"
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
        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-accent text-bg-secondary font-semibold transition hover:scale-105 flex-1 md:flex-none"
      >
        <Plus size={18} />
        Crear Rutina
      </button>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-4 md:p-8 animate-[fade-in_0.5s_ease_out]">
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

      <div className="hidden md:flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold mt-10 md:mt-0 text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary">
          Rutinas
        </h1>
        {activeTab === 'myRoutines' && <RoutineActionButtons />}
      </div>

      <div className={`flex items-center gap-2 mb-6 p-1 rounded-full bg-bg-secondary border border-transparent dark:border dark:border-white/10 w-fit mt-6 md:mt-0`}>
        <button
          onClick={() => setActiveTab('myRoutines')}
          className={`${baseButtonClasses} ${activeTab === 'myRoutines' ? activeModeClasses : inactiveModeClasses}`}
        >
          <BookCopy size={16} /> Mis Rutinas
        </button>
        <button
          onClick={() => setActiveTab('explore')}
          className={`${baseButtonClasses} ${activeTab === 'explore' ? activeModeClasses : inactiveModeClasses}`}
        >
          <Compass size={16} /> Explorar
        </button>
      </div>

      {activeTab === 'myRoutines' && (
        <RoutineActionButtons className="flex md:hidden w-full mb-6" />
      )}

      {activeTab === 'myRoutines' && (
        <>
          <div className="mb-6 flex flex-col gap-4">
            <div className="max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar rutinas..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-secondary border border-transparent dark:border dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            {/* Renderizamos las carpetas siempre que haya rutinas */}
            {routines && routines.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <button
                  onClick={() => setSelectedFolder('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border whitespace-nowrap flex-shrink-0 ${selectedFolder === 'all'
                    ? 'bg-accent/20 border-accent text-accent'
                    : 'bg-bg-secondary border-transparent dark:border-white/10 text-text-secondary hover:bg-white/5'
                    }`}
                >
                  Todas
                </button>

                {uniqueFolders.map(folder => (
                  <button
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${selectedFolder === folder
                      ? 'bg-accent/20 border-accent text-accent'
                      : 'bg-bg-secondary border-transparent dark:border-white/10 text-text-secondary hover:bg-white/5'
                      }`}
                  >
                    {selectedFolder === folder ? <FolderOpen size={14} /> : <Folder size={14} />}
                    {folder}
                  </button>
                ))}

                <button
                  onClick={() => setSelectedFolder('uncategorized')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border whitespace-nowrap flex-shrink-0 ${selectedFolder === 'uncategorized'
                    ? 'bg-accent/20 border-accent text-accent'
                    : 'bg-bg-secondary border-transparent dark:border-white/10 text-text-secondary hover:bg-white/5'
                    }`}
                >
                  Otros
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {filteredSorted && filteredSorted.length > 0 ? (
              filteredSorted.map((routine) => {
                if (!routine) return null;

                const isCompleted = completedRoutineIdsToday.includes(routine.id);
                const isActive = activeWorkout && activeWorkout.routineId === routine.id;
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
                  <GlassCard key={routine.id} className="p-0 overflow-hidden flex flex-col group relative border-transparent dark:border dark:border-white/10">
                    {imageSrc && (
                      <div className="h-32 sm:h-40 w-full relative shrink-0 overflow-hidden bg-bg-secondary">
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
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary/90 to-transparent opacity-60" />
                        {routine.folder && (
                          <div className="absolute top-2 right-2 z-20">
                            <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-xs font-medium text-white border border-transparent dark:border dark:border-white/10 flex items-center gap-1">
                              <Folder size={12} /> {routine.folder}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex flex-col gap-1 min-w-0 mb-3">
                        {!imageSrc && routine.folder && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-text-muted mb-0.5">
                            <Folder size={12} /> {routine.folder}
                          </span>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg md:text-xl font-bold text-text-primary leading-tight break-words max-w-full">
                            {routine.name}
                          </h2>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-accent-transparent text-accent text-[10px] uppercase font-bold shrink-0 border border-transparent">
                              Activo
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] uppercase font-bold shrink-0 border border-transparent flex items-center gap-1">
                              {visibilityIcon} {visibilityText}
                          </span>
                        </div>
                      </div>

                      {routine.description && (
                        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                          {routine.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs font-medium text-text-secondary">
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-accent font-semibold">
                            <CheckCircle size={14} /> Completada
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Dumbbell size={14} /> {totalExercises} ejercicios
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock size={14} /> {lastUsed ? new Date(lastUsed).toLocaleDateString('es-ES') : 'Sin uso'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mb-4 mt-2">
                        <button 
                          onClick={() => setSharingRoutineId(routine.id)} 
                          className="text-text-secondary hover:text-accent transition-colors p-1" 
                          title="Privacidad"
                        >
                          <Globe size={20} />
                        </button>
                        {isCompleted && (
                          <button 
                            onClick={() => handleShareClick(routine)} 
                            className="text-text-secondary hover:text-accent transition-colors p-1" 
                            title="Compartir"
                          >
                            <Share2 size={20} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditClick(routine)} 
                          className="text-text-secondary hover:text-accent transition-colors p-1" 
                          title="Editar"
                        >
                          <Edit size={20} />
                        </button>
                        <button 
                          onClick={() => duplicateRoutine(routine)} 
                          className="text-text-secondary hover:text-accent transition-colors p-1" 
                          title="Duplicar"
                        >
                          <Copy size={20} />
                        </button>
                        
                        <div className="flex-1"></div>
                        
                        <button 
                          onClick={() => handleDeleteClick(routine.id)} 
                          className="text-text-muted hover:text-red transition-colors p-1" 
                          title="Eliminar"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      {exerciseGroups.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-col gap-3">
                            {exerciseGroups.map((group, groupIndex) => (
                              <div key={groupIndex}>
                                {group.length > 1 && (
                                  <div className="mb-1 inline-flex items-center gap-1.5 text-accent text-[10px] uppercase font-bold tracking-wider">
                                    <Link2 size={12} /> Superserie
                                  </div>
                                )}
                                <ul className={`flex flex-col gap-2 ${group.length > 1 ? 'pl-3 border-l-2 border-accent/20' : ''}`}>
                                  {group.map((ex) => (
                                    <li key={ex.id || ex.tempId} className="flex items-center justify-between text-sm">
                                      <span className="truncate font-medium text-text-primary pr-2">
                                        {t(ex.name)}
                                      </span>
                                      <span className="text-text-muted text-xs whitespace-nowrap">
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
                          disabled={isCompleted || isActive || isLoading}
                          className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all
                          ${isCompleted || isActive
                              ? 'bg-bg-secondary text-text-muted cursor-not-allowed border border-transparent dark:border dark:border-white/10'
                              : 'bg-accent text-bg-secondary hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-0.5'
                            }
                        `}
                        >
                          {isLoading && !isCompleted && !isActive ? (
                            <Spinner size="small" />
                          ) : isCompleted ? (
                            <>
                              <CheckCircle size={16} />
                              Entrenamiento Completado
                            </>
                          ) : isActive ? (
                            <>
                              <Clock size={16} />
                              Continuar Entrenamiento
                            </>
                          ) : (
                            <>
                              <Play size={16} fill="currentColor" />
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
                <GlassCard className="text-center p-10 border-transparent dark:border dark:border-white/10">
                  <p className="text-text-muted">
                    {routines && routines.length > 0
                      ? `No hay rutinas en la carpeta "${selectedFolder === 'uncategorized' ? 'Otros' : selectedFolder}".`
                      : 'Aún no has creado ninguna rutina.'
                    }
                  </p>
                  <p className="text-text-muted mt-2">
                    ¡Haz clic en{' '}
                    <span className="font-semibold">“Crear Rutina”</span> para
                    empezar!
                  </p>
                </GlassCard>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'explore' && <TemplateRoutines setView={setView} />}

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
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/30">
          <Spinner />
        </div>
      )}
    </div>
  );
};

export default Routines;