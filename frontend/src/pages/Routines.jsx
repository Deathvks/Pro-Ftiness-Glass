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
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ConfirmationModal from '../components/ConfirmationModal';
import RoutineEditor from './RoutineEditor';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore';
import { useTranslation } from 'react-i18next';
import TemplateRoutines from './TemplateRoutines';

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
    activeWorkout: state.activeWorkout,
    completedRoutineIdsToday: state.completedRoutineIdsToday,
    fetchTodaysCompletedRoutines: state.fetchTodaysCompletedRoutines,
  }));

  const [editingRoutine, setEditingRoutine] = useState(() => {
    const savedEditingRoutine = localStorage.getItem('routinesEditingState');
    if (savedEditingRoutine) {
      try {
        return JSON.parse(savedEditingRoutine);
      } catch (e) {
        console.error('Error al parsear rutina guardada:', e);
        localStorage.removeItem('routinesEditingState');
        return null;
      }
    }
    return null;
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');

  const [activeTab, setActiveTab] = useState(() => {
    const forcedTab = localStorage.getItem('routinesForceTab');
    if (forcedTab) {
      localStorage.removeItem('routinesForceTab');
      return forcedTab;
    }
    return localStorage.getItem('routinesActiveTab') || 'myRoutines';
  });

  // --- Helpers para Imagen ---
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

  // --- EFECTOS ---
  useEffect(() => {
    fetchTodaysCompletedRoutines();
  }, [fetchTodaysCompletedRoutines]);

  useEffect(() => {
    localStorage.setItem('routinesActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (editingRoutine) {
      localStorage.setItem(
        'routinesEditingState',
        JSON.stringify(editingRoutine)
      );
    } else {
      localStorage.removeItem('routinesEditingState');
    }
  }, [editingRoutine]);

  // --- MEMOS ---
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
      addToast(
        error.message || 'Ocurrió un error al refrescar las rutinas.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (routine) => {
    if (activeWorkout && activeWorkout.routineId === routine.id) {
      addToast(
        'No puedes editar una rutina que está en curso. Finaliza o descarta el entrenamiento primero.',
        'warning'
      );
    } else {
      setEditingRoutine(routine);
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
        exercises: (routine.RoutineExercises || routine.exercises || []).map(
          ({ ...ex }) => ({
            ...ex,
            exercise_order:
              ex.exercise_order !== undefined ? ex.exercise_order : 0,
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

    let list = (routines || []).filter(
      (r) =>
        r &&
        (!q ||
          r.name?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q))
    );

    list.sort((a, b) => {
      const da = a ? lastUsedMap.get(a.id)?.getTime() || 0 : 0;
      const db = b ? lastUsedMap.get(b.id)?.getTime() || 0 : 0;
      return db - da;
    });

    return list;
  }, [routines, query, lastUsedMap]);

  if (editingRoutine) {
    return (
      <RoutineEditor
        key={editingRoutine.id || 'new'}
        routine={editingRoutine}
        onSave={handleSave}
        onCancel={() => setEditingRoutine(null)}
      />
    );
  }

  const baseButtonClasses =
    'px-4 py-2 rounded-full font-semibold transition-colors flex items-center gap-2';
  const activeModeClasses = 'bg-accent text-bg-secondary';
  const inactiveModeClasses =
    'bg-bg-secondary hover:bg-white/10 text-text-secondary';

  const CreateRoutineButton = ({ className = '' }) => (
    <button
      onClick={() => {
        setEditingRoutine({ name: '', description: '', exercises: [] });
      }}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-accent text-bg-secondary font-semibold transition hover:scale-105 ${className}`}
    >
      <Plus size={18} />
      Crear Rutina
    </button>
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-4 md:p-8 animate-[fade-in_0.5s_ease_out]">
      <Helmet>
        <title>
          {activeTab === 'myRoutines'
            ? 'Mis Rutinas'
            : 'Explorar Plantillas'}{' '}
          - Pro Fitness Glass
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
        {activeTab === 'myRoutines' && <CreateRoutineButton />}
      </div>

      <div className="flex items-center gap-2 mb-6 p-1 rounded-full bg-bg-secondary border border-glass-border w-fit mt-6 md:mt-0">
        <button
          onClick={() => setActiveTab('myRoutines')}
          className={`${baseButtonClasses} ${activeTab === 'myRoutines' ? activeModeClasses : inactiveModeClasses
            }`}
        >
          <BookCopy size={16} /> Mis Rutinas
        </button>
        <button
          onClick={() => setActiveTab('explore')}
          className={`${baseButtonClasses} ${activeTab === 'explore' ? activeModeClasses : inactiveModeClasses
            }`}
        >
          <Compass size={16} /> Explorar
        </button>
      </div>

      {activeTab === 'myRoutines' && (
        <CreateRoutineButton className="flex md:hidden w-full mb-6" />
      )}

      {activeTab === 'myRoutines' && (
        <>
          <div className="mb-6 max-w-md">
            <label className="text-sm text-text-secondary mb-2 block">
              Buscar en mis rutinas
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                size={16}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nombre o descripción..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-secondary border border-[--glass-border] focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          </div>

          {/* --- AQUÍ ESTÁ EL CAMBIO: items-start añadido para independencia de altura --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {filteredSorted && filteredSorted.length > 0 ? (
              filteredSorted.map((routine) => {
                if (!routine) return null;

                const isCompleted = completedRoutineIdsToday.includes(routine.id);
                const isActive =
                  activeWorkout && activeWorkout.routineId === routine.id;

                const exercisesToGroup =
                  routine.RoutineExercises || routine.exercises || [];
                const exerciseGroups = groupExercises(exercisesToGroup);
                const lastUsed = lastUsedMap.get(routine.id);
                const totalExercises = exercisesToGroup.length;

                const imageSrc = routine.imageUrl || routine.image_url;

                return (
                  <GlassCard key={routine.id} className="p-0 overflow-hidden flex flex-col group">

                    {/* --- IMAGEN: Encima de todo el contenido --- */}
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
                      </div>
                    )}

                    <div className="p-5 md:p-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary min-w-0">
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">
                              <CheckCircle size={14} /> Completada hoy
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[--glass-border] bg-[--glass-bg]">
                            <Dumbbell size={14} /> {totalExercises} ejercicio
                            {totalExercises !== 1 ? 's' : ''}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[--glass-border] bg-[--glass-bg]">
                            <CalendarClock size={14} />
                            {lastUsed
                              ? new Date(lastUsed).toLocaleDateString('es-ES')
                              : 'Sin uso'}
                          </span>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          <button
                            onClick={() => handleEditClick(routine)}
                            className="p-2 rounded-full text-text-secondary hover:bg-accent-transparent hover:text-accent"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => duplicateRoutine(routine)}
                            className="p-2 rounded-full text-text-secondary hover:bg-accent-transparent hover:text-accent"
                            title="Duplicar"
                          >
                            <Plus size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(routine.id)}
                            className="p-2 rounded-full text-text-muted hover:bg-red/20 hover:text-red"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="pb-4 border-b border-[--glass-border]">
                        <div className="flex items-center gap-3">
                          <h2 className="text-lg md:text-xl font-bold text-text-primary">
                            {routine.name}
                          </h2>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-accent-transparent text-accent text-xs font-semibold shrink-0">
                              Activo
                            </span>
                          )}
                        </div>

                        {routine.description && (
                          <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                            {routine.description}
                          </p>
                        )}
                      </div>

                      {exerciseGroups.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-sm font-semibold text-text-secondary mb-2">
                            Plan de ejercicios
                          </h3>
                          <div className="flex flex-col gap-3">
                            {exerciseGroups.map((group, groupIndex) => (
                              <div key={groupIndex}>
                                {group.length > 1 && (
                                  <div className="mb-1 inline-flex items-center gap-2 text-accent text-xs font-semibold">
                                    <Link2 size={14} />
                                    Superserie
                                  </div>
                                )}
                                <ul
                                  className={`flex flex-col gap-2 ${group.length > 1 ? 'ml-4' : ''
                                    }`}
                                >
                                  {group.map((ex) => (
                                    <li
                                      key={ex.id || ex.tempId}
                                      className="flex items-center gap-2 text-sm"
                                    >
                                      <span className="truncate font-semibold text-text-primary">
                                        {t(ex.name)}
                                      </span>
                                      <span className="text-accent whitespace-nowrap font-medium">
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

                      <div className="mt-5">
                        <button
                          onClick={() => handleStartWorkout(routine)}
                          disabled={isCompleted || isActive || isLoading}
                          className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition
                          ${isCompleted || isActive
                              ? 'bg-[--glass-bg] text-text-muted cursor-not-allowed'
                              : 'bg-accent text-bg-secondary hover:scale-[1.01]'
                            }
                        `}
                        >
                          {isLoading && !isCompleted && !isActive ? (
                            <Spinner size="small" />
                          ) : isCompleted ? (
                            <>
                              <CheckCircle size={18} />
                              Completada Hoy
                            </>
                          ) : isActive ? (
                            <>
                              <Clock size={18} />
                              En Curso
                            </>
                          ) : (
                            <>
                              <Play size={18} />
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
                <GlassCard className="text-center p-10">
                  <p className="text-text-muted">
                    Aún no has creado ninguna rutina.
                  </p>
                  <p className="text-text-muted">
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

      {isLoading && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/30">
          <Spinner />
        </div>
      )}
    </div>
  );
};

export default Routines;