/* frontend/src/pages/Workout.jsx */
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import { calculateCalories } from '../utils/helpers';
import Spinner from '../components/Spinner';

// --- Imports de Modales ---
import ConfirmationModal from '../components/ConfirmationModal';
import CalorieInputModal from '../components/CalorieInputModal';
import WorkoutSummaryModal from '../components/WorkoutSummaryModal';
import ExerciseReplaceModal from './ExerciseReplaceModal';
import WorkoutExerciseDetailModal from './WorkoutExerciseDetailModal';
import PlateCalculatorModal from '../components/PlateCalculatorModal';
import ExerciseHistoryModal from './ExerciseHistoryModal';
import WorkoutHeatmapModal from '../components/Workout/WorkoutHeatmapModal';

// --- IMPORTS DE COMPONENTES MODULARIZADOS ---
import NoActiveWorkout from '../components/Workout/NoActiveWorkout';
import WorkoutHeader from '../components/Workout/WorkoutHeader';
import WorkoutExerciseList from '../components/Workout/WorkoutExerciseList';
import WorkoutNotes from '../components/Workout/WorkoutNotes';

// --- Lazy Load de QuickCardio ---
const QuickCardio = React.lazy(() => import('./QuickCardio'));

/**
 * Página principal del Entrenamiento Activo.
 * Gestiona el estado, los modales y coordina los componentes
 * de la interfaz de usuario del entrenamiento.
 */
const Workout = ({ timer, setView }) => {
  const { addToast } = useToast();
  const { t } = useTranslation(['exercise_names', 'exercise_descriptions']);

  // --- 1. Estado de Zustand (Global) ---
  const {
    activeWorkout,
    logWorkout,
    stopWorkout,
    updateActiveWorkoutSet,
    addDropset,
    removeDropset,
    toggleWarmupSet,
    isWorkoutPaused,
    togglePauseWorkout,
    workoutStartTime,
    openRestModal,
    userProfile,
    fetchInitialData,
  } = useAppStore((state) => ({
    activeWorkout: state.activeWorkout,
    logWorkout: state.logWorkout,
    stopWorkout: state.stopWorkout,
    updateActiveWorkoutSet: state.updateActiveWorkoutSet,
    addDropset: state.addDropset,
    removeDropset: state.removeDropset,
    toggleWarmupSet: state.toggleWarmupSet,
    isWorkoutPaused: state.isWorkoutPaused,
    togglePauseWorkout: state.togglePauseWorkout,
    workoutStartTime: state.workoutStartTime,
    openRestModal: state.openRestModal,
    userProfile: state.userProfile,
    fetchInitialData: state.fetchInitialData,
  }));

  // --- 2. Estado Local (Modales y Notas) ---
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [wasTimerRunningOnFinish, setWasTimerRunningOnFinish] = useState(false);
  const [showCalorieModal, setShowCalorieModal] = useState(false);
  const [exerciseToReplace, setExerciseToReplace] = useState(null);
  const [showWorkoutSummaryModal, setShowWorkoutSummaryModal] = useState(false);
  const [completedWorkoutData, setCompletedWorkoutData] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [historyExercise, setHistoryExercise] = useState(null);
  const [showHeatmapModal, setShowHeatmapModal] = useState(false);

  // Estado para la vista de Cardio Rápido
  const [showQuickCardio, setShowQuickCardio] = useState(false);

  // Efecto de limpieza
  useEffect(() => {
    const mountTime = Date.now();
    return () => {
      const timeAlive = Date.now() - mountTime;
      if (timeAlive < 500) return;

      const state = useAppStore.getState();
      const { activeWorkout, workoutStartTime, stopWorkout } = state;

      if (activeWorkout && !workoutStartTime) {
        stopWorkout();
      }
    };
  }, []);

  // --- 3. Memos y Variables Derivadas ---

  const hasWorkoutStarted = workoutStartTime !== null;
  const isSimpleWorkout =
    !activeWorkout?.exercises || activeWorkout.exercises.length === 0;

  // Memo para agrupar ejercicios en superseries
  const exerciseGroups = useMemo(() => {
    if (isSimpleWorkout) return [];

    const exercises = activeWorkout.exercises;
    const groups = [];
    let currentGroup = [];

    exercises.forEach((ex) => {
      if (
        !ex.superset_group_id ||
        (currentGroup.length > 0 &&
          ex.superset_group_id !== currentGroup[0].superset_group_id)
      ) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [ex];
      } else {
        if (currentGroup.length === 0) {
          currentGroup.push(ex);
        } else if (
          ex.superset_group_id &&
          ex.superset_group_id === currentGroup[0].superset_group_id
        ) {
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
  }, [activeWorkout, isSimpleWorkout]);

  const baseInputClasses = `w-full text-center bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition ${!hasWorkoutStarted ? 'opacity-50 cursor-not-allowed' : ''
    }`;

  // --- 4. Funciones Helper ---

  const safeParseFloat = (value) => {
    return parseFloat(String(value).replace(',', '.')) || 0;
  };

  const safeParseReps = (value) => {
    return parseFloat(String(value).replace(',', '.')) || 0;
  };

  // --- 5. Manejadores de Eventos ---

  const handleFinishClick = () => {
    if (timer === 0) {
      addToast(
        'Debes iniciar el cronómetro para poder guardar el entrenamiento.',
        'error'
      );
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
    const isAnySetFilled =
      isSimpleWorkout ||
      activeWorkout.exercises.some((ex) =>
        ex.setsDone.some(
          (set) =>
            (set.reps && set.reps !== '') ||
            (set.weight_kg && set.weight_kg !== '')
        )
      );

    if (!isAnySetFilled) {
      addToast(
        'No has registrado ningún dato. Completa al menos una serie para guardar.',
        'error'
      );
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
      details: isSimpleWorkout
        ? []
        : activeWorkout.exercises.map((ex) => ({
          exerciseName: ex.name,
          superset_group_id: ex.superset_group_id,
          setsDone: ex.setsDone
            .filter(
              (set) =>
                (set.reps !== '' && set.reps !== null) ||
                (set.weight_kg !== '' && set.weight_kg !== null)
            )
            .map((set) => ({
              set_number: set.set_number,
              reps: safeParseReps(set.reps),
              weight_kg: safeParseFloat(set.weight_kg),
              is_dropset: set.is_dropset || false,
              is_warmup: set.is_warmup || false,
            })),
        })),
    };

    setCompletedWorkoutData(workoutData);

    const result = await logWorkout(workoutData);
    if (result.success) {
      if (result.gamification) {
        result.gamification.forEach(event => {
          if (event.type === 'xp') {
            addToast(`+${event.amount} XP: ${event.reason}`, 'success');
          } else if (event.type === 'badge') {
            addToast(`¡Insignia Desbloqueada! ${event.badge.name}`, 'success');
          } else if (event.type === 'warning') {
            addToast(event.message, 'warning');
          } else if (event.type === 'info') {
            addToast(event.message, 'info');
          }
        });
      }

      if (result.message && result.message.includes('Límite de XP')) {
        addToast(result.message, 'warning');
      } else {
        addToast(result.message, 'success');
      }

      setShowCalorieModal(false);
      setShowWorkoutSummaryModal(true);
    } else {
      addToast(result.message, 'error');
      setCompletedWorkoutData(null);
    }
    setIsSaving(false);
  };

  const handleDisabledInputClick = () => {
    addToast(
      'Debes iniciar el cronómetro antes de registrar datos.',
      'warning'
    );
  };

  const handleDisabledButtonClick = () => {
    addToast(
      'Debes iniciar el cronómetro antes de usar esta función.',
      'warning'
    );
  };

  // --- 6. Renderizado ---

  // 6.1. Guard Clause: No hay entrenamiento activo
  if (!activeWorkout) {
    if (showQuickCardio) {
      return (
        <Suspense fallback={<div className="flex justify-center p-10"><Spinner size={40} /></div>}>
          <QuickCardio />
        </Suspense>
      );
    }
    // Pasamos el handler para activar Cardio Rápido desde NoActiveWorkout
    return <NoActiveWorkout setView={setView} onStartQuickCardio={() => setShowQuickCardio(true)} />;
  }

  // 6.2. Renderizado Principal (Entrenamiento Activo)
  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
      <WorkoutHeader
        routineName={activeWorkout.routineName}
        routineImage={activeWorkout.image_url}
        timer={timer}
        isWorkoutPaused={isWorkoutPaused}
        hasWorkoutStarted={hasWorkoutStarted}
        onBackClick={handleBackClick}
        onTogglePause={togglePauseWorkout}
        onFinishClick={handleFinishClick}
        onShowCalculator={() => setShowCalculatorModal(true)}
        onShowHeatmap={() => setShowHeatmapModal(true)}
      />

      {!isSimpleWorkout && (
        <WorkoutExerciseList
          exerciseGroups={exerciseGroups}
          activeWorkoutExercises={activeWorkout.exercises}
          hasWorkoutStarted={hasWorkoutStarted}
          onSetSelectedExercise={setSelectedExercise}
          onSetExerciseToReplace={setExerciseToReplace}
          onShowHistory={setHistoryExercise}
          baseInputClasses={baseInputClasses}
          onUpdateSet={updateActiveWorkoutSet}
          onAddDropset={addDropset}
          onRemoveDropset={removeDropset}
          onToggleWarmup={toggleWarmupSet}
          onOpenRestModal={openRestModal}
          onDisabledInputClick={handleDisabledInputClick}
          onDisabledButtonClick={handleDisabledButtonClick}
        />
      )}

      <WorkoutNotes
        notes={notes}
        setNotes={setNotes}
        hasWorkoutStarted={hasWorkoutStarted}
      />

      {showCalorieModal && (
        <CalorieInputModal
          estimatedCalories={calculateCalories(
            timer,
            userProfile?.weight || 75
          )}
          onComplete={handleCalorieInputComplete}
          onCancel={() => {
            setShowCalorieModal(false);
            if (wasTimerRunningOnFinish) {
              togglePauseWorkout();
            }
          }}
          isSaving={isSaving}
        />
      )}

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

      {showCancelModal && (
        <ConfirmationModal
          message="¿Seguro que quieres descartar este entrenamiento? Perderás todo el progreso."
          onConfirm={confirmCancelWorkout}
          onCancel={() => setShowCancelModal(false)}
          confirmText="Descartar"
        />
      )}

      {selectedExercise && (
        <WorkoutExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}

      {showCalculatorModal && (
        <PlateCalculatorModal
          onClose={() => setShowCalculatorModal(false)}
        />
      )}

      {historyExercise && (
        <ExerciseHistoryModal
          /* --- CORRECCIÓN: Usamos 'exerciseName' en lugar de 'exercise' --- */
          exerciseName={historyExercise.name}
          onClose={() => setHistoryExercise(null)}
        />
      )}

      {showHeatmapModal && (
        <WorkoutHeatmapModal
          exercises={activeWorkout?.exercises || []}
          onClose={() => setShowHeatmapModal(false)}
        />
      )}
    </div>
  );
};

export default Workout;