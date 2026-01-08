/* frontend/src/components/progress/DailyDetailView.jsx */
import React, { useState, useMemo } from 'react';
import { X, Trash2, Link2, Flame, BarChartHorizontal, TrendingUp, Layers, Dumbbell, Link } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from '../ConfirmationModal';
import { calculateCalories } from '../../utils/helpers';
import useAppStore from '../../store/useAppStore';
import { useToast } from '../../hooks/useToast';

const DailyDetailView = ({ logs, onClose }) => {
  const { t } = useTranslation(['exercise_names']);

  const { bodyWeightLog, deleteWorkoutLog } = useAppStore(state => ({
    userProfile: state.userProfile,
    bodyWeightLog: state.bodyWeightLog,
    deleteWorkoutLog: state.deleteWorkoutLog,
  }));
  const { addToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const [deletedLogIds, setDeletedLogIds] = useState([]);

  // Estilo de borde MUY sutil para modo oscuro/OLED.
  const subtleBorderClass = 'border-white/10';

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
    <li className={`flex items-center justify-between p-2 rounded-lg text-xs ${isWarmup ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' : 'bg-bg-primary shadow-sm'}`}>
      <span className="flex items-center gap-2">
        <span className={`font-mono font-bold ${isWarmup ? 'text-orange-600' : 'text-accent'}`}>
          {set.reps}
        </span>
        <span className="text-[10px] uppercase text-text-tertiary">reps</span>
        <span className="text-text-tertiary">×</span>
        <span className={`font-mono font-bold ${isWarmup ? 'text-orange-600' : 'text-text-primary'}`}>
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

  // Componente para renderizar un bloque de ejercicio
  const ExerciseBlock = ({ exercise, isSupersetItem = false }) => {
    const sets = exercise.WorkoutLogSets || [];
    const warmupSets = sets.filter(s => s.is_warmup);
    const workSets = sets.filter(s => !s.is_warmup);

    return (
      <div className="w-full">
        {/* Encabezado del Ejercicio */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {isSupersetItem && <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1"></div>}
            <p className="font-bold text-sm text-text-primary">
              {t(exercise.exercise_name, { ns: 'exercise_names', defaultValue: exercise.exercise_name })}
            </p>
          </div>
          <div className="text-[10px] text-text-tertiary flex flex-col items-end">
            <span className="flex items-center gap-1"><BarChartHorizontal size={10} /> Vol: {exercise.total_volume}kg</span>
            <span className="flex items-center gap-1"><TrendingUp size={10} /> Max: {exercise.best_set_weight}kg</span>
          </div>
        </div>

        <div className={`space-y-2 ${isSupersetItem ? `pl-3 border-l ${subtleBorderClass} ml-0.5` : ''}`}>
          {/* Sección de Calentamiento */}
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
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
        {/* Contenedor Modal: Flex Column con max-height */}
        <div className={`relative w-full max-w-lg p-0 flex flex-col m-4 bg-bg-primary rounded-2xl shadow-2xl border ${subtleBorderClass} max-h-[80vh] md:max-h-[90vh] overflow-hidden animate-[scale-in_0.3s_ease-out]`}>

          {/* Header (Fijo) */}
          <div className={`p-5 border-b ${subtleBorderClass} bg-bg-secondary flex justify-between items-center z-10 shrink-0`}>
            <div>
              <h3 className="text-xl font-bold text-text-primary">Resumen del Día</h3>
              {logs.length > 0 && (
                <p className="text-text-muted text-sm">{new Date(logs[0].workout_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              )}
            </div>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-2 hover:bg-bg-primary rounded-full transition"><X size={20} /></button>
          </div>

          {/* Estadísticas (Fijo) */}
          <div className={`grid grid-cols-2 gap-4 text-center shrink-0 p-4 bg-bg-primary border-b ${subtleBorderClass}`}>
            <div className={`bg-bg-secondary p-2 rounded-xl border ${subtleBorderClass} shadow-sm`}>
              <span className="text-xs text-text-secondary block mb-1">Duración</span>
              <strong className="text-lg text-text-primary">{Math.round(totalDuration / 60)} min</strong>
            </div>
            <div className={`bg-bg-secondary p-2 rounded-xl border ${subtleBorderClass} shadow-sm`}>
              <span className="text-xs text-text-secondary block mb-1">Calorías</span>
              <strong className="text-lg text-text-primary">{totalCalories} kcal</strong>
            </div>
          </div>

          {/* Lista Scrollable (Flexible) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4 bg-bg-primary min-h-0">
            {visibleLogs.map((log) => {
              const exerciseGroups = groupExercises(log.WorkoutLogDetails);
              const isCardioOnly = !log.WorkoutLogDetails || log.WorkoutLogDetails.length === 0;

              return (
                <div key={log.id} className={`bg-bg-secondary rounded-2xl overflow-hidden border ${subtleBorderClass} shadow-sm shrink-0`}>
                  {/* Header de la Rutina */}
                  <div className={`flex justify-between items-center p-4 bg-gray-500/5 border-b ${subtleBorderClass}`}>
                    <h5 className="font-bold text-accent truncate pr-4 text-base">{log.routine_name}</h5>
                    <button onClick={() => handleDeleteClick(log)} className="p-2 -m-2 rounded-full text-text-muted hover:text-red-500 transition">
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="p-4 space-y-5">
                    {log.notes && (
                      <div className={`bg-bg-primary p-3 rounded-xl border ${subtleBorderClass}`}>
                        <p className="font-semibold text-xs text-accent mb-1 flex items-center gap-1"><Link2 size={10} /> Notas</p>
                        <p className="text-sm text-text-secondary whitespace-pre-wrap italic">"{log.notes}"</p>
                      </div>
                    )}

                    {isCardioOnly ? (
                      <div className={`flex justify-around text-center py-3 bg-bg-primary rounded-xl border ${subtleBorderClass}`}>
                        <div>
                          <p className="text-xs text-text-tertiary mb-1">Tiempo</p>
                          <p className="font-mono font-bold text-xl text-text-primary">{Math.round(log.duration_seconds / 60)}<span className="text-xs ml-1 font-sans text-text-tertiary">min</span></p>
                        </div>
                        <div>
                          <p className="text-xs text-text-tertiary mb-1">Energía</p>
                          <p className="font-mono font-bold text-xl text-text-primary">{log.calories_burned}<span className="text-xs ml-1 font-sans text-text-tertiary">kcal</span></p>
                        </div>
                      </div>
                    ) : (
                      exerciseGroups.map((group, groupIndex) => {
                        const isSuperset = group.length > 1;

                        if (isSuperset) {
                          return (
                            <div key={groupIndex} className={`rounded-xl border ${subtleBorderClass} bg-accent/5 overflow-hidden`}>
                              {/* Header de Superserie */}
                              <div className={`bg-accent/10 px-3 py-2 flex items-center justify-between border-b ${subtleBorderClass}`}>
                                <div className="flex items-center gap-2">
                                  <Layers size={14} className="text-accent" />
                                  <span className="text-xs font-bold text-accent uppercase tracking-wider">Superserie</span>
                                </div>
                                <Link size={12} className="text-accent/50" />
                              </div>

                              <div className="p-3">
                                {group.map((exercise, exIdx) => (
                                  <div key={exIdx} className="relative">
                                    {exIdx > 0 && (
                                      <div className="flex justify-center my-3 opacity-30">
                                        <div className="w-0.5 h-4 bg-accent"></div>
                                      </div>
                                    )}
                                    <ExerciseBlock exercise={exercise} isSupersetItem={true} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        } else {
                          // Ejercicio Individual
                          return (
                            <div key={groupIndex} className="last:mb-0">
                              <ExerciseBlock exercise={group[0]} isSupersetItem={false} />
                              {groupIndex < exerciseGroups.length - 1 && <div className={`my-4 border-b ${subtleBorderClass}`}></div>}
                            </div>
                          );
                        }
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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