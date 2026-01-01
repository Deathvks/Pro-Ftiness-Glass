/* frontend/src/components/progress/DailyDetailView.jsx */
import React, { useState, useMemo } from 'react';
import { X, Trash2, Link2, Timer, Flame, BarChartHorizontal, TrendingUp, Layers, Dumbbell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../GlassCard';
import ConfirmationModal from '../ConfirmationModal';
import { calculateCalories } from '../../utils/helpers';
import useAppStore from '../../store/useAppStore';
import { useToast } from '../../hooks/useToast';

const DailyDetailView = ({ logs, onClose }) => {
  const { t } = useTranslation(['exercise_names']);

  const { userProfile, bodyWeightLog, deleteWorkoutLog } = useAppStore(state => ({
    userProfile: state.userProfile,
    bodyWeightLog: state.bodyWeightLog,
    deleteWorkoutLog: state.deleteWorkoutLog,
  }));
  const { addToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const [deletedLogIds, setDeletedLogIds] = useState([]);

  const handleDeleteClick = (log) => {
    setLogToDelete(log);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (logToDelete) {
      const idToDelete = logToDelete.id;
      const result = await deleteWorkoutLog(idToDelete);

      if (result.success) {
        addToast(result.message, 'success');
        const newDeletedIds = [...deletedLogIds, idToDelete];
        setDeletedLogIds(newDeletedIds);

        const remainingLogs = logs.filter(l => !newDeletedIds.includes(l.id));
        if (remainingLogs.length === 0) {
          onClose();
        }
      } else {
        addToast(result.message, 'error');
      }
      setShowDeleteConfirm(false);
      setLogToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setLogToDelete(null);
  };

  const groupExercises = (exercises) => {
    if (!exercises || exercises.length === 0) return [];
    const groups = [];
    let currentGroup = [];
    for (const ex of exercises) {
      if (currentGroup.length === 0) {
        currentGroup.push(ex);
        continue;
      }
      if (ex.superset_group_id !== null && ex.superset_group_id === currentGroup[0].superset_group_id) {
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

  const latestWeight = useMemo(() => {
    if (!bodyWeightLog || bodyWeightLog.length === 0) return 75;
    const sortedLog = [...bodyWeightLog].sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
    return parseFloat(sortedLog[0].weight_kg);
  }, [bodyWeightLog]);

  const visibleLogs = logs.filter(log => !deletedLogIds.includes(log.id));

  const totalDuration = visibleLogs.reduce((acc, log) => acc + log.duration_seconds, 0);
  const totalCalories = visibleLogs.reduce((acc, log) => {
    const calories = log.calories_burned || calculateCalories(log.duration_seconds, latestWeight);
    return acc + calories;
  }, 0);

  // Componente auxiliar para renderizar una fila de serie
  const SetRow = ({ set, isWarmup }) => (
    <li className={`flex items-center justify-between p-2 rounded text-xs ${isWarmup ? 'bg-orange-500/10 text-orange-900 dark:text-orange-200/90' : 'bg-gray-500/10'}`}>
      <span className="flex items-center gap-2">
        <span className={`font-mono font-bold ${isWarmup ? 'text-orange-600 dark:text-orange-400' : 'text-accent'}`}>
          {set.reps}
        </span>
        <span className="text-[10px] uppercase text-text-tertiary">reps</span>
        <span className="text-text-tertiary">×</span>
        <span className={`font-mono font-bold ${isWarmup ? 'text-orange-600 dark:text-orange-400' : 'text-text-primary'}`}>
          {set.weight_kg}
        </span>
        <span className="text-[10px] uppercase text-text-tertiary">kg</span>
      </span>

      <div className="flex gap-1">
        {set.is_dropset && (
          <span className="bg-red-500/10 text-red-500 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border border-red-500/20">
            Dropset
          </span>
        )}
      </div>
    </li>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
        <GlassCard className="relative w-full max-w-lg p-6 flex flex-col gap-4 m-4 bg-bg-secondary shadow-2xl max-h-[90vh]">
          <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary z-10"><X size={20} /></button>

          <div className="text-center pb-4 border-b border-glass-border">
            <h3 className="text-xl font-bold">Resumen del Día</h3>
            {logs.length > 0 && (
              <p className="text-text-muted text-sm">{new Date(logs[0].workout_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-center shrink-0">
            <div>
              <span className="text-sm text-text-secondary">Duración: <strong>{Math.round(totalDuration / 60)} min</strong></span>
            </div>
            <div>
              <span className="text-sm text-text-secondary">Calorías: <strong>{totalCalories} kcal</strong></span>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-glass-border pt-4 overflow-y-auto pr-1 custom-scrollbar">
            {visibleLogs.map((log) => {
              const exerciseGroups = groupExercises(log.WorkoutLogDetails);
              const isCardioOnly = !log.WorkoutLogDetails || log.WorkoutLogDetails.length === 0;

              return (
                <div key={log.id} className="bg-bg-secondary rounded-xl overflow-hidden border border-glass-border shadow-sm">
                  {/* FIX: Usar bg-gray-500/10 para asegurar visibilidad en ambos temas */}
                  <div className="flex justify-between items-center p-3 bg-gray-500/10 border-b border-glass-border">
                    <h5 className="font-bold text-accent truncate pr-4">{log.routine_name}</h5>
                    <button onClick={() => handleDeleteClick(log)} className="p-2 -m-2 rounded-full text-text-muted hover:text-red-400 transition">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="p-3 space-y-4">
                    {log.notes && (
                      <div className="bg-gray-500/10 p-3 rounded-lg border-l-2 border-accent/50">
                        <p className="font-semibold text-xs text-accent mb-1 flex items-center gap-1"><Link2 size={10} /> Notas</p>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap italic">"{log.notes}"</p>
                      </div>
                    )}

                    {isCardioOnly ? (
                      <div className="flex justify-around text-center py-2 bg-gray-500/10 rounded-lg border border-glass-border">
                        <div>
                          <p className="text-xs text-text-tertiary mb-1">Tiempo</p>
                          <p className="font-mono font-bold text-lg text-text-primary">{Math.round(log.duration_seconds / 60)}<span className="text-xs ml-1 font-sans text-text-tertiary">min</span></p>
                        </div>
                        <div>
                          <p className="text-xs text-text-tertiary mb-1">Energía</p>
                          <p className="font-mono font-bold text-lg text-text-primary">{log.calories_burned}<span className="text-xs ml-1 font-sans text-text-tertiary">kcal</span></p>
                        </div>
                      </div>
                    ) : (
                      exerciseGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="relative">
                          {group.length > 1 && (
                            <div className="absolute -left-3 top-4 bottom-4 w-1 bg-accent/30 rounded-r-full" title="Superserie" />
                          )}

                          <div className={`space-y-4 ${group.length > 1 ? 'pl-2' : ''}`}>
                            {group.map((exercise, exIdx) => {
                              const sets = exercise.WorkoutLogSets || [];
                              const warmupSets = sets.filter(s => s.is_warmup);
                              const workSets = sets.filter(s => !s.is_warmup);

                              return (
                                <div key={exIdx} className={`${exIdx > 0 ? 'pt-4 border-t border-glass-border' : ''}`}>
                                  {/* Encabezado del Ejercicio */}
                                  <div className="flex justify-between items-start mb-2">
                                    <p className="font-bold text-sm text-text-primary">
                                      {t(exercise.exercise_name, { ns: 'exercise_names', defaultValue: exercise.exercise_name })}
                                    </p>
                                    <div className="text-[10px] text-text-tertiary flex flex-col items-end">
                                      <span className="flex items-center gap-1"><BarChartHorizontal size={10} /> Vol: {exercise.total_volume}kg</span>
                                      <span className="flex items-center gap-1"><TrendingUp size={10} /> Max: {exercise.best_set_weight}kg</span>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    {/* Sección de Calentamiento (si existe) */}
                                    {warmupSets.length > 0 && (
                                      <div>
                                        <p className="text-[10px] font-bold text-orange-500/80 uppercase tracking-wider mb-1 flex items-center gap-1">
                                          <Flame size={10} /> Calentamiento
                                        </p>
                                        <ul className="space-y-1">
                                          {warmupSets.map((set, i) => <SetRow key={i} set={set} isWarmup={true} />)}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Sección de Series Efectivas */}
                                    {workSets.length > 0 ? (
                                      <div>
                                        {warmupSets.length > 0 && (
                                          <p className="text-[10px] font-bold text-accent/80 uppercase tracking-wider mb-1 flex items-center gap-1 mt-2">
                                            <Dumbbell size={10} /> Series Efectivas
                                          </p>
                                        )}
                                        <ul className="space-y-1">
                                          {workSets.map((set, i) => <SetRow key={i} set={set} isWarmup={false} />)}
                                        </ul>
                                      </div>
                                    ) : (
                                      sets.length === 0 && <p className="text-xs text-text-tertiary italic">Sin series registradas</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {showDeleteConfirm && (
        <ConfirmationModal
          message="¿Borrar este entrenamiento? No podrás recuperarlo."
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText="Sí, borrar"
          cancelText="Cancelar"
        />
      )}
    </>
  );
};

export default DailyDetailView;