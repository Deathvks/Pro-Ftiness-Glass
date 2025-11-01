/* frontend/src/pages/Workout.jsx */
import React, { useState, useMemo } from 'react';
// --- INICIO DE LA MODIFICACIÓN ---
import {
  ChevronLeft, Play, Pause, Square, FileText, Clock, Link2,
  CornerDownRight, X, Repeat
} from 'lucide-react';
// Importamos los nuevos componentes
import ExerciseMedia from '../components/ExerciseMedia';
import WorkoutExerciseDetailModal from './WorkoutExerciseDetailModal';
// --- FIN DE LA MODIFICACIÓN ---
import GlassCard from '../components/GlassCard';
import ConfirmationModal from '../components/ConfirmationModal';
import RestTimerModal from '../components/RestTimerModal';
import CalorieInputModal from '../components/CalorieInputModal';
import WorkoutSummaryModal from '../components/WorkoutSummaryModal';
import ExerciseReplaceModal from './ExerciseReplaceModal';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import { calculateCalories } from '../utils/helpers';
// --- INICIO DE LA MODIFICACIÓN ---
// Importamos i18n
import { useTranslation } from 'react-i18next'; 
// --- FIN DE LA MODIFICACIÓN ---


// --- INICIO DE LA MODIFICACIÓN ---
// El componente 'ExerciseMedia' (líneas 20-101) se ha ELIMINADO de aquí 
// y movido a 'frontend/src/components/ExerciseMedia.jsx'
// --- FIN DE LA MODIFICACIÓN ---


const Workout = ({ timer, setView }) => {
  const { addToast } = useToast();
  // --- INICIO DE LA MODIFICACIÓN ---
  // Hook de traducción:
  // Le pedimos que cargue 'exercise_names' (para los títulos)
  // Y TAMBIÉN 'exercises' (para las descripciones).
  const { t } = useTranslation(['exercise_names', 'exercises']);
  // --- FIN DE LA MODIFICACIÓN ---
  const {
    activeWorkout,
    logWorkout,
    stopWorkout,
    updateActiveWorkoutSet,
    addDropset,
    removeDropset,
    isWorkoutPaused,
    togglePauseWorkout,
    workoutStartTime,
    isResting,
    openRestModal,
    userProfile,
    fetchInitialData
  } = useAppStore(state => ({
    activeWorkout: state.activeWorkout,
    logWorkout: state.logWorkout,
    stopWorkout: state.stopWorkout,
    updateActiveWorkoutSet: state.updateActiveWorkoutSet,
    addDropset: state.addDropset,
    removeDropset: state.removeDropset,
    isWorkoutPaused: state.isWorkoutPaused,
    togglePauseWorkout: state.togglePauseWorkout,
    workoutStartTime: state.workoutStartTime,
    isResting: state.isResting,
    openRestModal: state.openRestModal,
    userProfile: state.userProfile,
    fetchInitialData: state.fetchInitialData,
  }));

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [wasTimerRunningOnFinish, setWasTimerRunningOnFinish] = useState(false);
  const [showCalorieModal, setShowCalorieModal] = useState(false);
  const [exerciseToReplace, setExerciseToReplace] = useState(null);

  const [showWorkoutSummaryModal, setShowWorkoutSummaryModal] = useState(false);
  const [completedWorkoutData, setCompletedWorkoutData] = useState(null);
  
  // --- INICIO DE LA MODIFICACIÓN ---
  // Estado para controlar qué ejercicio mostrar en el modal
  const [selectedExercise, setSelectedExercise] = useState(null);
  // --- FIN DE LA MODIFICACIÓN ---

  const exerciseGroups = useMemo(() => {
    if (!activeWorkout || !activeWorkout.exercises || activeWorkout.exercises.length === 0) return [];
    // Los ejercicios ya vienen ordenados desde el slice
    const exercises = activeWorkout.exercises;
    const groups = [];
    let currentGroup = [];

    exercises.forEach(ex => {
      if (!ex.superset_group_id || (currentGroup.length > 0 && ex.superset_group_id !== currentGroup[0].superset_group_id)) {
          if (currentGroup.length > 0) {
              groups.push(currentGroup);
          }
          currentGroup = [ex];
      } else {
           if (currentGroup.length === 0) {
              currentGroup.push(ex);
           } else if (ex.superset_group_id && ex.superset_group_id === currentGroup[0].superset_group_id) {
               currentGroup.push(ex);
           } else {
               groups.push(currentGroup);
               currentGroup = [ex];
           }
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    return groups;
  }, [activeWorkout]);

  if (!activeWorkout) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <h2 className="text-2xl font-bold">No hay ningún entrenamiento activo.</h2>
            <p className="text-text-secondary mt-2">Puedes iniciar uno desde el Dashboard o la sección de Rutinas.</p>
            <button onClick={() => setView('routines')} className="mt-6 px-6 py-3 rounded-full bg-accent text-bg-secondary font-semibold">
                Ir a Rutinas
            </button>
        </div>
    );
  }

  const formatTime = (timeInSeconds) => {
    const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(timeInSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleFinishClick = () => {
    if (timer === 0) {
      addToast('Debes iniciar el cronómetro para poder guardar el entrenamiento.', 'error');
      return;
    }

    const isPaused = useAppStore.getState().isWorkoutPaused;
    if (!isPaused) {
      setWasTimerRunningOnFinish(true);
      togglePauseWorkout();
    } else {
      setWasTimerRunningOnFinish(false);
    }
    setShowCalorieModal(true);
  };

  const handleBackClick = () => {
    if (workoutStartTime) {
      setShowCancelModal(true);
    } else {
      stopWorkout();
      setView(activeWorkout.routineId ? 'routines' : 'dashboard');
    }
  };

  const confirmCancelWorkout = () => {
    const returnView = activeWorkout.routineId ? 'routines' : 'dashboard';
    stopWorkout();
    setShowCancelModal(false);
    setView(returnView);
  };

  const handleCalorieInputComplete = async (calories) => {
    const isCardioOnly = !activeWorkout.exercises || activeWorkout.exercises.length === 0;

    const isAnySetFilled = isCardioOnly || activeWorkout.exercises.some(ex =>
      ex.setsDone.some(set => (set.reps && set.reps !== '') || (set.weight_kg && set.weight_kg !== ''))
    );

    if (!isAnySetFilled) {
      addToast('No has registrado ningún dato. Completa al menos una serie para guardar.', 'error');
      setShowCalorieModal(false);
      if (wasTimerRunningOnFinish) {
        togglePauseWorkout();
      }
      return;
    }

    setIsSaving(true);
    const workoutData = {
        routineId: activeWorkout.routineId,
        routineName: activeWorkout.routineName,
        duration_seconds: timer,
        notes: notes,
        calories_burned: calories,
        details: activeWorkout.exercises.map(ex => ({
            exerciseName: ex.name,
            superset_group_id: ex.superset_group_id,
            setsDone: ex.setsDone.filter(set => (set.reps !== '' && set.reps !== null && !isNaN(parseInt(set.reps))) || (set.weight_kg !== '' && set.weight_kg !== null && !isNaN(parseFloat(set.weight_kg))))
                             .map(set => ({ 
                                 set_number: set.set_number,
                                 reps: parseInt(set.reps, 10) || 0,
                                 weight_kg: parseFloat(set.weight_kg) || 0,
                                 is_dropset: set.is_dropset || false
                             }))
        }))
    };

    setCompletedWorkoutData(workoutData);

    const result = await logWorkout(workoutData);
    if (result.success) {
      addToast(result.message, 'success');
      setShowCalorieModal(false);
      setShowWorkoutSummaryModal(true);
    } else {
      addToast(result.message, 'error');
      setCompletedWorkoutData(null);
    }
    setIsSaving(false);
  };

  const hasWorkoutStarted = workoutStartTime !== null;

  const handleDisabledInputClick = () => {
    addToast('Debes iniciar el cronómetro antes de registrar datos.', 'warning');
  };

  const handleDisabledButtonClick = () => {
    addToast('Debes iniciar el cronómetro antes de usar esta función.', 'warning');
  };

  const baseInputClasses = `w-full text-center bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition ${
    !hasWorkoutStarted ? 'opacity-50 cursor-not-allowed' : ''
  }`;

  const isSimpleWorkout = !activeWorkout.exercises || activeWorkout.exercises.length === 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
      <button onClick={handleBackClick} className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4">
        <ChevronLeft size={20} />
        Volver
      </button>

      <GlassCard className="p-6 mb-6">
        <h1 className="text-3xl font-bold text-center sm:text-left">{activeWorkout.routineName}</h1>
        <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 mt-4">
            <div className="font-mono text-4xl sm:text-5xl font-bold">{formatTime(timer)}</div>
            <div className="flex gap-4">
                <button
                    onClick={togglePauseWorkout}
                    className="p-4 rounded-full transition text-bg-secondary bg-accent hover:bg-accent/80">
                    {isWorkoutPaused ? <Play size={24} /> : <Pause size={24} />}
                </button>
                <button onClick={handleFinishClick} className="p-4 rounded-full bg-red text-bg-secondary transition hover:bg-red/80">
                  <Square size={24} />
                </button>
            </div>
        </div>
        {!hasWorkoutStarted && (
          <div className="mt-4 p-3 bg-accent-transparent border border-accent-border rounded-md text-center">
            <p className="text-accent font-medium">⏱️ Inicia el cronómetro para comenzar a registrar datos</p>
          </div>
        )}
      </GlassCard>

      {!isSimpleWorkout && (
        <div className="flex flex-col gap-6">
            {exerciseGroups.map((group, groupIndex) => (
            <GlassCard key={groupIndex} className={`p-1 rounded-lg ${group.length > 1 ? 'bg-accent/10 border border-accent/20' : ''}`}>
                {group.length > 1 && (
                <div className="flex items-center gap-2 p-3 text-accent font-semibold">
                    <Link2 size={16} />
                    <span>Superserie</span>
                </div>
                )}
                <div className="flex flex-col gap-4">
                {group.map((exercise, exIndex) => {
                    // BUGFIX: Usar 'exercise.id' (que es el routine_exercise_id)
                    const actualExIndex = activeWorkout.exercises.findIndex(ex => ex.id === exercise.id);
                    
                    // Fallback
                    if (actualExIndex === -1) {
                      console.error("Error: No se encontró el ejercicio en activeWorkout", exercise);
                      return null;
                    }
                    
                    return (
                    <div key={actualExIndex} className="p-4">
                        
                        {/* --- INICIO DE LA MODIFICACIÓN --- */}
                        {/* Envolvemos la media y el título en un botón para abrir el modal */}
                        <button
                          onClick={() => setSelectedExercise(exercise)}
                          className="w-full text-left transition-transform active:scale-[0.99] group"
                          title="Ver detalles del ejercicio"
                        >
                          <ExerciseMedia
                            details={exercise.exercise_details}
                            // Pasamos las clases de tamaño que teníamos antes
                            className="w-full lg:max-w-lg mx-auto mb-4 group-hover:brightness-110 transition"
                          />
                          <div className="flex items-center justify-between mb-4">
                              <div>
                                  {/* --- INICIO DE LA MODIFICACIÓN --- */}
                                  {/* Usamos t() para traducir el nombre del ejercicio (esto ya estaba) */}
                                  <h3 className="text-lg font-semibold">{t(exercise.name, { ns: 'exercise_names' })}</h3>
                                  {/* --- FIN DE LA MODIFICACIÓN --- */}
                                  <span className="text-sm font-semibold text-accent">{exercise.sets} series × {exercise.reps} reps</span>
                              </div>
                          </div>
                        </button>

                        {/* Botón de Reemplazar (superpuesto) */}
                        <div className="flex justify-end -mt-[68px] mb-4 pr-1"> {/* Ajuste con margen negativo */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Evita que se abra el modal
                                    setExerciseToReplace(actualExIndex);
                                }}
                                className={`p-2 rounded-md transition relative z-10 ${
                                  hasWorkoutStarted
                                    ? 'bg-bg-primary border border-glass-border text-text-secondary hover:text-accent hover:border-accent/50'
                                    : 'bg-bg-primary border border-glass-border text-text-muted opacity-50 cursor-not-allowed'
                                }`}
                                title={hasWorkoutStarted ? "Reemplazar ejercicio" : "Inicia el cronómetro para reemplazar ejercicios"}
                                disabled={!hasWorkoutStarted}
                            >
                                <Repeat size={16} />
                            </button>
                        </div>
                        {/* --- FIN DE LA MODIFICACIÓN --- */}


                        <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 items-center">
                            <div className="text-center font-semibold text-text-secondary text-sm">Serie</div>
                            <div className="text-center font-semibold text-text-secondary text-sm">Peso (kg)</div>
                            <div className="text-center font-semibold text-text-secondary text-sm">Reps</div>
                            <div className="text-center font-semibold text-text-secondary text-sm">Dropset</div>
                            <div className="text-center font-semibold text-text-secondary text-sm">Descanso</div>
                            
                            {exercise.setsDone.map((set, setIndex) => (
                                <div key={setIndex} className="contents">
                                    <span className="text-center font-semibold text-text-secondary bg-bg-primary border border-glass-border rounded-md px-3 py-3">
                                        {set.is_dropset ? 'DS' : set.set_number}
                                    </span>
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={set.weight_kg}
                                      onChange={hasWorkoutStarted ? (e) => updateActiveWorkoutSet(actualExIndex, setIndex, 'weight_kg', e.target.value) : undefined}
                                      onClick={!hasWorkoutStarted ? handleDisabledInputClick : undefined}
                                      className={baseInputClasses}
                                      disabled={!hasWorkoutStarted}
                                      readOnly={!hasWorkoutStarted}
                                    />
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={set.reps}
                                      onChange={hasWorkoutStarted ? (e) => updateActiveWorkoutSet(actualExIndex, setIndex, 'reps', e.target.value) : undefined}
                                      onClick={!hasWorkoutStarted ? handleDisabledInputClick : undefined}
                                      className={baseInputClasses}
                                      disabled={!hasWorkoutStarted}
                                      readOnly={!hasWorkoutStarted}
                                    />

                                    {set.is_dropset ? (
                                        <button
                                            onClick={hasWorkoutStarted ? () => removeDropset(actualExIndex, setIndex) : handleDisabledButtonClick}
                                            className={`p-3 rounded-md border transition h-full flex items-center justify-center ${
                                              hasWorkoutStarted
                                                ? 'bg-bg-primary border-glass-border text-text-muted hover:bg-red/20 hover:text-red'
                                                : 'bg-bg-primary border-glass-border text-text-muted opacity-50 cursor-not-allowed'
                                            }`}
                                            title={hasWorkoutStarted ? "Eliminar Dropset" : "Inicia el cronómetro para eliminar dropsets"}
                                            disabled={!hasWorkoutStarted}
                                        >
                                            <X size={20} />
                                        </button>
                                    ) : (
                                        <button
                                          onClick={hasWorkoutStarted ? () => addDropset(actualExIndex, setIndex) : handleDisabledButtonClick}
                                          className={`p-3 rounded-md border transition h-full flex items-center justify-center ${
                                            hasWorkoutStarted
                                              ? 'bg-bg-primary border-glass-border text-text-secondary hover:text-accent hover:border-accent/50'
                                              : 'bg-bg-primary border-glass-border text-text-muted opacity-50 cursor-not-allowed'
                                          }`}
                                          title={hasWorkoutStarted ? "Añadir Dropset" : "Inicia el cronómetro para añadir dropsets"}
                                          disabled={!hasWorkoutStarted}
                                        >
                                            <CornerDownRight size={20} />
                                        </button>
                                    )}

                                    <button
                                      onClick={hasWorkoutStarted ? () => openRestModal(exercise.rest_seconds) : handleDisabledButtonClick}
                                      className={`p-3 rounded-md border transition h-full flex items-center justify-center ${
                                        hasWorkoutStarted
                                          ? 'bg-bg-primary border-glass-border text-text-secondary hover:text-accent hover:border-accent/50'
                                          : 'bg-bg-primary border-glass-border text-text-muted opacity-50 cursor-not-allowed'
                                      }`}
                                      title={hasWorkoutStarted ? "Iniciar descanso" : "Inicia el cronómetro para usar el temporizador de descanso"}
                                      disabled={!hasWorkoutStarted}
                                    >
                                        <Clock size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    );
                })}
                </div>
            </GlassCard>
            ))}
        </div>
      )}


      <GlassCard className="p-6 mt-6">
        <h2 className="flex items-center gap-2 text-xl font-bold mb-4">
          <FileText size={20} />
          Notas de la Sesión
        </h2>
        <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={hasWorkoutStarted ? "¿Cómo te sentiste? ¿Alguna observación?..." : "Inicia el cronómetro para añadir notas..."}
            className={`w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition resize-none ${
              !hasWorkoutStarted ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            rows={4}
            disabled={!hasWorkoutStarted}
            readOnly={!hasWorkoutStarted}
        />
      </GlassCard>

      {isResting && <RestTimerModal />}

      {showCalorieModal &&
        <CalorieInputModal
            estimatedCalories={calculateCalories(timer, userProfile?.weight || 75)}
            onComplete={handleCalorieInputComplete}
            onCancel={() => {
                setShowCalorieModal(false);
                if (wasTimerRunningOnFinish) {
                    togglePauseWorkout();
                }
            }}
            isSaving={isSaving}
        />
      }

      {exerciseToReplace !== null && (
        <ExerciseReplaceModal
            exerciseIndex={exerciseToReplace}
            onClose={() => setExerciseToReplace(null)}
        />
      )}

      {showWorkoutSummaryModal && completedWorkoutData && (
        <WorkoutSummaryModal
            workoutData={completedWorkoutData}
            onClose={async () => {
                setShowWorkoutSummaryModal(false);
                setCompletedWorkoutData(null);
                stopWorkout();
                await fetchInitialData(); 
                setView('dashboard');
            }}
        />
      )}

      {showCancelModal &&
        <ConfirmationModal
            message="¿Seguro que quieres descartar este entrenamiento? Perderás todo el progreso."
            onConfirm={confirmCancelWorkout}
            onCancel={() => setShowCancelModal(false)}
            confirmText="Descartar"
        />
      }

      {/* --- INICIO DE LA MODIFICACIÓN --- */}
      {/* Renderizamos el modal si hay un ejercicio seleccionado */}
      {selectedExercise && (
        <WorkoutExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
      {/* --- FIN DE LA MODIFICACIÓN --- */}

    </div>
  );
};

export default Workout;