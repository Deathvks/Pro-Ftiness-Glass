import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Play, CheckCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ConfirmationModal from '../components/ConfirmationModal';
import RoutineEditor from './RoutineEditor';

const isSameDay = (dateA, dateB) => {
    const date1 = new Date(dateA);
    const date2 = new Date(dateB);
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

const Routines = ({ routines, setRoutines, setView, workoutLog = [] }) => {
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState(null);

  const completedToday = useMemo(() => {
    if (!Array.isArray(workoutLog)) return [];
    const today = new Date();
    return workoutLog
      .filter(log => isSameDay(log.workout_date, today))
      .map(log => log.routine_name);
  }, [workoutLog]);

  const handleSave = async (routineToSave) => {
    try {
      const url = routineToSave.id
        ? `http://localhost:3001/api/routines/${routineToSave.id}`
        : 'http://localhost:3001/api/routines';
      const method = routineToSave.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routineToSave),
        credentials: 'include'
      });

      if (!response.ok) {
        try {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ocurrió un error al guardar la rutina.');
        } catch {
            throw new Error(`Error del servidor: ${response.statusText}`);
        }
      }

      const savedOrUpdatedRoutine = await response.json();

      if (routineToSave.id) {
        setRoutines(routines.map(r => r.id === savedOrUpdatedRoutine.id ? savedOrUpdatedRoutine : r));
      } else {
        setRoutines([...routines, savedOrUpdatedRoutine]);
      }

      setEditingRoutine(null);
    } catch (error) {
      console.error("Error al guardar la rutina:", error.message);
      alert(`Error al guardar la rutina: ${error.message}`);
    }
  };

  const handleDeleteClick = (id) => {
    setRoutineToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/routines/${routineToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar la rutina.');
      }
      setRoutines(routines.filter(r => r.id !== routineToDelete));
      setShowDeleteModal(false);
      setRoutineToDelete(null);
    } catch (error) {
      console.error("Error al eliminar la rutina:", error.message);
      alert(`Error al eliminar: ${error.message}`);
    }
  };

  if (editingRoutine) {
    return <RoutineEditor routine={editingRoutine} onSave={handleSave} onCancel={() => setEditingRoutine(null)} />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-4xl font-extrabold">Mis Rutinas</h1>
        <button
          onClick={() => setEditingRoutine({ name: '', description: '', exercises: [] })}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent text-bg-secondary font-semibold transition hover:scale-105"
        >
          <Plus size={18} />
          Crear Rutina
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {routines && routines.length > 0 ? routines.map(routine => {
          const isCompleted = completedToday.includes(routine.name);
          return (
            <GlassCard key={routine.id} className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start pb-4 border-b border-glass-border">
                <div>
                  <h2 className="text-xl font-bold">{routine.name}</h2>
                  {routine.description && <p className="text-sm text-text-secondary mt-1">{routine.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingRoutine(routine)} className="p-2 rounded-full text-text-muted hover:bg-white/10 hover:text-text-primary transition">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDeleteClick(routine.id)} className="p-2 rounded-full text-text-muted hover:bg-red/20 hover:text-red transition">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {routine.RoutineExercises && routine.RoutineExercises.length > 0 && (
                <div>
                  <h3 className="font-semibold text-text-secondary mb-2">Ejercicios:</h3>
                  {/* --- INICIO DE LA CORRECCIÓN --- */}
                  {/* Se reemplaza el 'grid' por 'flex flex-col' para una lista vertical */}
                  <ul className="flex flex-col gap-2 pl-4 list-disc text-sm text-text-secondary">
                  {/* --- FIN DE LA CORRECCIÓN --- */}
                    {routine.RoutineExercises.map(ex => (
                      <li key={ex.id}>{ex.name} ({ex.sets}x{ex.reps})</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setView('workout', { routine })}
                disabled={isCompleted}
                className={`flex items-center justify-center gap-2 w-full mt-2 py-3 rounded-md font-semibold transition ${
                  isCompleted 
                  ? 'bg-neutral/20 text-text-muted cursor-not-allowed' 
                  : 'bg-accent text-bg-secondary hover:scale-[1.02]'
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle size={20} />
                    <span>Completada Hoy</span>
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    <span>Empezar Entrenamiento</span>
                  </>
                )}
              </button>
            </GlassCard>
          )
        }) : (
          <GlassCard className="text-center p-10">
            <p className="text-text-muted">Aún no has creado ninguna rutina.</p>
            <p className="text-text-muted">¡Haz clic en "Crear Rutina" para empezar!</p>
          </GlassCard>
        )}
      </div>

      {showDeleteModal && (
        <ConfirmationModal
          message="¿Estás seguro de que quieres borrar esta rutina?"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default Routines;