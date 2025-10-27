/* frontend/src/pages/Routines.jsx */
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Plus, Edit, Trash2, Play, CheckCircle, Link2,
  Search, CalendarClock, Dumbbell, BookCopy, Compass, ChevronLeft
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ConfirmationModal from '../components/ConfirmationModal';
import RoutineEditor from './RoutineEditor'; // Importamos RoutineEditor
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore';
// Importamos saveRoutine y deleteRoutine
import { saveRoutine, deleteRoutine } from '../services/routineService';
import { isSameDay } from '../utils/helpers';
import TemplateRoutines from './TemplateRoutines'; // Importamos el nuevo componente

// Quitamos setView de las props, ya no se usa para navegar al editor
const Routines = () => {
  const { addToast } = useToast();
  const { routines, workoutLog, fetchInitialData, startWorkout, navigate } = useAppStore(state => ({ // Añadir navigate
    routines: state.routines,
    workoutLog: state.workoutLog,
    fetchInitialData: state.fetchInitialData,
    startWorkout: state.startWorkout,
    navigate: state.navigate, // Obtener navigate del store
  }));

  // Estado para manejar qué rutina se está editando (o null si ninguna)
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');

  // Inicializar activeTab desde localStorage o usar 'myRoutines' por defecto
  const [activeTab, setActiveTab] = useState(() => {
    const forcedTab = localStorage.getItem('routinesForceTab');
    if (forcedTab) {
      localStorage.removeItem('routinesForceTab'); // Limpiar después de usar
      return forcedTab;
    }
    return localStorage.getItem('routinesActiveTab') || 'myRoutines';
  });

  // Guardar en localStorage cuando cambie activeTab
  useEffect(() => {
    localStorage.setItem('routinesActiveTab', activeTab);
  }, [activeTab]);

  const completedToday = useMemo(() => {
    if (!Array.isArray(workoutLog)) return new Set();
    const today = new Date();
    return new Set(
      workoutLog
        .filter(log => isSameDay(log.workout_date, today) && log.routine_id != null)
        .map(log => log.routine_id)
    );
  }, [workoutLog]);

  const lastUsedMap = useMemo(() => {
    const map = new Map();
    (workoutLog || []).forEach(log => {
      if (log.routine_id) {
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
    // Ordenar primero por exercise_order por si acaso
    const sortedExercises = [...exercises].sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0));

    for (const ex of sortedExercises) {
        if (currentGroup.length === 0) {
            currentGroup.push(ex);
            continue;
        }

        // Si el actual tiene ID de superserie y coincide con el primero del grupo actual
        if (ex.superset_group_id !== null && currentGroup[0].superset_group_id !== null && ex.superset_group_id === currentGroup[0].superset_group_id) {
            currentGroup.push(ex);
        } else {
            // Si el actual no tiene ID, o tiene un ID diferente, o el grupo actual no era superserie
            groups.push(currentGroup);
            currentGroup = [ex];
        }
    }
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    return groups;
  };

  // --- INICIO MODIFICACIÓN ---
  // handleSave ya no necesita el argumento 'savedRoutine'
  const handleSave = async () => {
  // --- FIN MODIFICACIÓN ---
    setIsLoading(true);
    try {
      // La rutina ya fue guardada y notificada por RoutineEditor
      // Solo necesitamos cerrar el editor y refrescar
      // addToast('Rutina guardada con éxito.', 'success'); // Toast duplicado, eliminado
      setEditingRoutine(null); // Cerrar el editor
      await fetchInitialData(); // Refrescar la lista de rutinas
    } catch (error) {
      // Este catch es por si fetchInitialData falla
      addToast(error.message || 'Ocurrió un error al refrescar las rutinas.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setRoutineToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsLoading(true); // Usamos isLoading general para la eliminación también
    try {
      await deleteRoutine(routineToDelete);
      addToast('Rutina eliminada.', 'success');
      setShowDeleteModal(false);
      setRoutineToDelete(null);
      await fetchInitialData();
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
        // Usar RoutineExercises si existe (viene del fetch), si no, exercises (estado local)
        exercises: (routine.RoutineExercises || routine.exercises || []).map(({ ...ex }) => ({
            ...ex,
            // Asegurarse de que exercise_order está presente
            exercise_order: ex.exercise_order !== undefined ? ex.exercise_order : 0
        }))
      };
      await saveRoutine(copy);
      addToast('Rutina duplicada.', 'success');
      await fetchInitialData();
    } catch (error) {
      addToast(error.message || 'No se pudo duplicar la rutina.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = (routines || []).filter(r =>
      !q ||
      r.name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );

    list.sort((a, b) => {
      const da = lastUsedMap.get(a.id)?.getTime() || 0;
      const db = lastUsedMap.get(b.id)?.getTime() || 0;
      return db - da;
    });

    return list;
  }, [routines, query, lastUsedMap]);

  // Si estamos editando, renderiza RoutineEditor
  if (editingRoutine) {
    return (
      <RoutineEditor
        key={editingRoutine.id || 'new'} // Añadir key para forzar re-montaje al cambiar
        routine={editingRoutine}
        onSave={handleSave} // Pasamos la función handleSave
        onCancel={() => setEditingRoutine(null)}
      />
    );
  }

  const baseButtonClasses = "px-4 py-2 rounded-full font-semibold transition-colors flex items-center gap-2";
  const activeModeClasses = "bg-accent text-bg-secondary";
  const inactiveModeClasses = "bg-bg-secondary hover:bg-white/10 text-text-secondary";

  // Botón Crear Rutina reutilizable
  const CreateRoutineButton = ({ className = "" }) => (
    <button
      // Al hacer clic, establece editingRoutine con una rutina vacía
      onClick={() => setEditingRoutine({ name: '', description: '', exercises: [] })}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-accent text-bg-secondary font-semibold transition hover:scale-105 ${className}`}
    >
      <Plus size={18} />
      Crear Rutina
    </button>
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-4 md:p-8 animate-[fade-in_0.5s_ease_out]">

      <Helmet>
          <title>{activeTab === 'myRoutines' ? 'Mis Rutinas' : 'Explorar Plantillas'} - Pro Fitness Glass</title>
          <meta name="description" content={activeTab === 'myRoutines' ? 'Crea, edita y gestiona tus rutinas de entrenamiento personalizadas. Empieza tus sesiones con un clic.' : 'Descubre y copia rutinas de entrenamiento predefinidas para diferentes objetivos y niveles.'} />
      </Helmet>

      {/* Header para PC */}
      <div className="hidden md:flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold mt-10 md:mt-0">Rutinas</h1>
        {/* Usamos el componente reutilizable para el botón en Desktop */}
        {activeTab === 'myRoutines' && <CreateRoutineButton />}
      </div>

      <div className="flex items-center gap-2 mb-6 p-1 rounded-full bg-bg-secondary border border-glass-border w-fit mt-6 md:mt-0">
          <button onClick={() => setActiveTab('myRoutines')} className={`${baseButtonClasses} ${activeTab === 'myRoutines' ? activeModeClasses : inactiveModeClasses}`}>
            <BookCopy size={16} /> Mis Rutinas
          </button>
          <button onClick={() => setActiveTab('explore')} className={`${baseButtonClasses} ${activeTab === 'explore' ? activeModeClasses : inactiveModeClasses}`}>
            <Compass size={16} /> Explorar
          </button>
      </div>

      {/* Botón Crear Rutina para Móvil (visible solo si la pestaña es 'myRoutines') */}
      {activeTab === 'myRoutines' && (
        <CreateRoutineButton className="flex md:hidden w-full mb-6" />
      )}

      {activeTab === 'myRoutines' && (
        <>
          <div className="mb-6 max-w-md">
            <label className="text-sm text-text-secondary mb-2 block">Buscar en mis rutinas</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Nombre o descripción..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-secondary border border-[--glass-border] focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {filteredSorted && filteredSorted.length > 0 ? (
              filteredSorted.map(routine => {
                const isCompleted = completedToday.has(routine.id);
                // Asegurarse de usar RoutineExercises si existe (datos de API)
                const exercisesToGroup = routine.RoutineExercises || routine.exercises || [];
                const exerciseGroups = groupExercises(exercisesToGroup);
                const lastUsed = lastUsedMap.get(routine.id);
                const totalExercises = exercisesToGroup.length;

                return (
                  <GlassCard key={routine.id} className="p-5 md:p-6">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      {/* Fila superior para badges e info secundaria */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary min-w-0">
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">
                            <CheckCircle size={14} /> Completada hoy
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[--glass-border] bg-[--glass-bg]">
                          <Dumbbell size={14} /> {totalExercises} ejercicio{totalExercises !== 1 ? 's' : ''}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[--glass-border] bg-[--glass-bg]">
                          <CalendarClock size={14} />
                          {lastUsed ? new Date(lastUsed).toLocaleDateString('es-ES') : 'Sin uso'}
                        </span>
                      </div>
                      {/* Fila superior para los iconos de acción */}
                      <div className="shrink-0 flex items-center gap-1">
                        {/* --- onClick ahora llama a setEditingRoutine --- */}
                        <button onClick={() => setEditingRoutine(routine)} className="p-2 rounded-full text-text-secondary hover:bg-accent-transparent hover:text-accent" title="Editar"><Edit size={18} /></button>
                        <button onClick={() => duplicateRoutine(routine)} className="p-2 rounded-full text-text-secondary hover:bg-accent-transparent hover:text-accent" title="Duplicar"><Plus size={18} /></button>
                        <button onClick={() => handleDeleteClick(routine.id)} className="p-2 rounded-full text-text-muted hover:bg-red/20 hover:text-red" title="Eliminar"><Trash2 size={18} /></button>
                      </div>
                    </div>

                    {/* Contenedor para el título y la descripción */}
                    <div className="pb-4 border-b border-[--glass-border]">
                      <h2 className="text-lg md:text-xl font-bold text-text-primary">{routine.name}</h2>
                      {routine.description && (
                        <p className="text-sm text-text-secondary mt-1 line-clamp-2">{routine.description}</p>
                      )}
                    </div>

                    {exerciseGroups.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-text-secondary mb-2">Plan de ejercicios</h3>
                        <div className="flex flex-col gap-3">
                          {exerciseGroups.map((group, groupIndex) => (
                            <div
                              key={groupIndex}
                              className="rounded-xl border border-[--glass-border] bg-[--glass-bg] p-3"
                            >
                              {group.length > 1 && (
                                <div className="mb-2 inline-flex items-center gap-2 text-accent text-xs font-semibold">
                                  <Link2 size={14} />
                                  Superserie
                                </div>
                              )}

                              <ul className="flex flex-col gap-2">
                                {group.map(ex => (
                                  <li
                                    // Usar ID real si existe, si no tempId
                                    key={ex.id || ex.tempId}
                                    className="flex items-center justify-between rounded-lg bg-bg-secondary/60 border border-[--glass-border] px-3 py-2 text-sm"
                                  >
                                    <span className="truncate">{ex.name}</span>
                                    <span className="text-text-secondary ml-3 whitespace-nowrap">
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
                        onClick={() => {
                          startWorkout(routine);
                          // --- Usar la prop navigate de App.jsx ---
                          navigate('workout'); // Usar navigate del store
                        }}
                        disabled={isCompleted}
                        className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition
                          ${isCompleted
                            ? 'bg-[--glass-bg] text-text-muted cursor-not-allowed'
                            : 'bg-accent text-bg-secondary hover:scale-[1.01]'}
                        `}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle size={18} />
                            Completada Hoy
                          </>
                        ) : (
                          <>
                            <Play size={18} />
                            Empezar Entrenamiento
                          </>
                        )}
                      </button>
                    </div>
                  </GlassCard>
                );
              })
            ) : (
              <GlassCard className="text-center p-10">
                <p className="text-text-muted">Aún no has creado ninguna rutina.</p>
                <p className="text-text-muted">¡Haz clic en <span className="font-semibold">“Crear Rutina”</span> para empezar!</p>
              </GlassCard>
            )}
          </div>
        </>
      )}

      {/* --- Pasar navigate a TemplateRoutines --- */}
      {activeTab === 'explore' && <TemplateRoutines setView={navigate} />}


      {showDeleteModal && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          message="¿Estás seguro de que quieres borrar esta rutina?"
          onConfirm={confirmDelete}
          isLoading={isLoading} // Usamos isLoading general
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