/* frontend/src/pages/Workout.jsx */
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Maximize2, CloudOff, RefreshCw } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import { useAppTheme } from '../hooks/useAppTheme';
import { calculateCalories } from '../utils/helpers';
import Spinner from '../components/Spinner';

// --- Imports de Modales ---
import ConfirmationModal from '../components/ConfirmationModal';
import CalorieInputModal from '../components/CalorieInputModal';
import WorkoutSummaryModal from '../components/WorkoutSummaryModal';
import ExerciseSearch from '../components/RoutineEditor/ExerciseSearch';
import WorkoutExerciseDetailModal from './WorkoutExerciseDetailModal';
import PlateCalculatorModal from '../components/PlateCalculatorModal';
import ExerciseHistoryModal from './ExerciseHistoryModal';
import WorkoutHeatmapModal, { getWorkoutMuscleData } from '../components/Workout/WorkoutHeatmapModal';
import MuscleHeatmap from '../components/MuscleHeatmap/MuscleHeatmap';
import WorkoutReviewModal from '../components/Workout/WorkoutReviewModal';

// --- IMPORTS DE COMPONENTES MODULARIZADOS ---
import NoActiveWorkout from '../components/Workout/NoActiveWorkout';
import WorkoutHeader from '../components/Workout/WorkoutHeader';
import WorkoutExerciseList from '../components/Workout/WorkoutExerciseList';
import WorkoutNotes from '../components/Workout/WorkoutNotes';
import PreviousWorkoutNoteBanner from '../components/Workout/PreviousWorkoutNoteBanner';
import SmartExerciseCoachModal from '../components/Workout/SmartExerciseCoachModal';

// --- Lazy Load de QuickCardio ---
const QuickCardio = React.lazy(() => import('./QuickCardio'));

const Workout = ({ timer, setView, navParams }) => {
    const { addToast } = useToast();
    const { t } = useTranslation(['exercise_names', 'exercise_descriptions']);
    const { resolvedTheme } = useAppTheme();

    // --- 1. Estado de Zustand (Global) ---
    const {
        activeWorkout,
        logWorkout,
        stopWorkout, // <--- AHORA SÍ APUNTA A LA FUNCIÓN CORRECTA
        updateActiveWorkoutSet,
        addDropset,
        removeDropset,
        toggleWarmupSet,
        isWorkoutPaused,
        togglePauseWorkout,
        workoutStartTime,
        openRestModal,
        userProfile,
        workoutLog,
        fetchInitialData,
        setExerciseReminder,
        replaceExercise,
        applyCoachStrategyToExercise
    } = useAppStore((state) => ({
        activeWorkout: state.activeWorkout,
        logWorkout: state.logWorkout,
        stopWorkout: state.stopWorkout, // <--- CORRECCIÓN DEL BUG
        updateActiveWorkoutSet: state.updateActiveWorkoutSet,
        addDropset: state.addDropset,
        removeDropset: state.removeDropset,
        toggleWarmupSet: state.toggleWarmupSet,
        isWorkoutPaused: state.isWorkoutPaused,
        togglePauseWorkout: state.togglePauseWorkout,
        workoutStartTime: state.workoutStartTime,
        openRestModal: state.openRestModal,
        userProfile: state.userProfile,
        workoutLog: state.workoutLog,
        fetchInitialData: state.fetchInitialData,
        setExerciseReminder: state.setExerciseReminder,
        replaceExercise: state.replaceExercise,
        applyCoachStrategyToExercise: state.applyCoachStrategyToExercise
    }));
    
    // --- 2. Estado Local (Modales y Notas) ---
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [wasTimerRunningOnFinish, setWasTimerRunningOnFinish] = useState(false);
    const [showCalorieModal, setShowCalorieModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [finalCalories, setFinalCalories] = useState(0); 
    const [exerciseToReplace, setExerciseToReplace] = useState(null);
    const [showWorkoutSummaryModal, setShowWorkoutSummaryModal] = useState(false);
    const [completedWorkoutData, setCompletedWorkoutData] = useState(null);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [showCalculatorModal, setShowCalculatorModal] = useState(false);
    const [historyExercise, setHistoryExercise] = useState(null);
    const [showHeatmapModal, setShowHeatmapModal] = useState(false);
    const [smartCoachExercise, setSmartCoachExercise] = useState(null);
    const [dismissedPreviousNote, setDismissedPreviousNote] = useState(false);

    const syncQueue = useAppStore((state) => state.syncQueue || []);
    const isSyncing = useAppStore((state) => state.isSyncing || false);
    const pendingWorkoutsCount = useMemo(() => {
        return syncQueue.filter(item => item.endpoint === '/workouts' || item.endpoint?.startsWith('/workouts')).length;
    }, [syncQueue]);

    const [showQuickCardio, setShowQuickCardio] = useState(false);

    // --- Restaurar modal de Smart Coach si volvemos desde Asesoría ---
    useEffect(() => {
        let exerciseToReopen = navParams?.reopenCoachExercise;
        if (!exerciseToReopen) {
            try {
                const saved = sessionStorage.getItem('asesoria_return_context');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.view === 'workout' && parsed.reopenCoachExercise) {
                        exerciseToReopen = parsed.reopenCoachExercise;
                    }
                }
            } catch (e) {}
        }

        if (exerciseToReopen && activeWorkout?.exercises && activeWorkout.exercises.length > 0) {
            const found = activeWorkout.exercises.find(
                (e) => (exerciseToReopen.id && e.id === exerciseToReopen.id) ||
                       (exerciseToReopen.name && e.name === exerciseToReopen.name) ||
                       (typeof exerciseToReopen === 'string' && (e.name === exerciseToReopen || e.id === exerciseToReopen))
            );
            if (found) {
                setSmartCoachExercise(found);
                try {
                    sessionStorage.removeItem('asesoria_return_context');
                } catch (e) {}
            }
        }
    }, [navParams, activeWorkout?.exercises]);

    // --- Recordatorio inteligente: Nota de la sesión anterior ---
    const previousWorkoutNote = useMemo(() => {
        if (!activeWorkout || !Array.isArray(workoutLog) || workoutLog.length === 0) return null;

        const sorted = [...workoutLog].sort((a, b) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime());

        const match = sorted.find(log => {
            const matchesRoutine = (
                (activeWorkout.routineId && (log.routine_id === activeWorkout.routineId || log.routineId === activeWorkout.routineId)) ||
                (activeWorkout.routineName && log.routine_name && log.routine_name.toLowerCase().trim() === activeWorkout.routineName.toLowerCase().trim())
            );
            if (!matchesRoutine) return false;

            const cleanNote = log.notes ? log.notes.split('GPS_DATA::')[0].trim() : '';
            return cleanNote.length > 0;
        });

        if (!match) return null;

        const cleanNote = match.notes.split('GPS_DATA::')[0].trim();
        return {
            note: cleanNote,
            date: match.workout_date,
            routineName: match.routine_name || activeWorkout.routineName
        };
    }, [activeWorkout, workoutLog]);

    useEffect(() => {
        // Al entrar a la pantalla de Workout, asegurar que empezamos desde arriba
        const mainEl = document.querySelector('main.flex-1.overflow-y-auto');
        if (mainEl) {
            mainEl.scrollTo(0, 0);
        }
    }, []);

    useEffect(() => {
        const mountTime = Date.now();
        return () => {
            const timeAlive = Date.now() - mountTime;
            if (timeAlive < 500) return;

            const state = useAppStore.getState();
            const { activeWorkout, workoutStartTime, stopWorkout: currentStopWorkout } = state;

            if (activeWorkout && !workoutStartTime) {
                currentStopWorkout();
            }
        };
    }, []);

    // --- 3. Memos y Variables Derivadas ---

    const hasWorkoutStarted = workoutStartTime !== null;
    const isSimpleWorkout =
        !activeWorkout?.exercises || activeWorkout.exercises.length === 0;

    const workoutMuscleData = useMemo(
        () => getWorkoutMuscleData(activeWorkout?.exercises || []),
        [activeWorkout?.exercises]
    );

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
            stopWorkout(); // <--- LLAMADA LIMPIA
            setView(activeWorkout.routineId ? 'routines' : 'dashboard');
        }
    };

    const confirmCancelWorkout = () => {
        const returnView = activeWorkout.routineId ? 'routines' : 'dashboard';
        stopWorkout(); // <--- LLAMADA LIMPIA
        setShowCancelModal(false);
        setView(returnView);
    };

    const handleCalorieInputComplete = (calories) => {
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
            addToast('Completa al menos una serie para guardar.', 'error');
            setShowCalorieModal(false);
            if (wasTimerRunningOnFinish) togglePauseWorkout();
            return;
        }

        setFinalCalories(calories);
        setShowCalorieModal(false);
        setShowReviewModal(true); 
    };

    const handleReviewConfirm = async () => {
        setIsSaving(true);
        
        const workoutData = {
            routineId: activeWorkout.routineId,
            routineName: activeWorkout.routineName,
            duration_seconds: timer,
            notes: notes,
            calories_burned: finalCalories,
            details: isSimpleWorkout
                ? []
                : activeWorkout.exercises.map((ex) => ({
                    id: ex.id, 
                    exerciseName: ex.name,
                    superset_group_id: ex.superset_group_id,
                    reminder: ex.reminder, 
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
                            rir: set.rir !== undefined && set.rir !== null && set.rir !== '' ? Number(set.rir) : null,
                        })),
                })),
        };

        setCompletedWorkoutData(workoutData);

        const result = await logWorkout(workoutData);
        if (result.success) {
            if (result.isOffline) {
                addToast('📶 Entrenamiento guardado en tu móvil. Se sincronizará automáticamente al recuperar cobertura.', 'info');
            } else {
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
            }

            setShowReviewModal(false);
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

    if (!activeWorkout) {
        if (showQuickCardio) {
            return (
                <Suspense fallback={<div className="flex justify-center p-10"><Spinner size={40} /></div>}>
                    <QuickCardio />
                </Suspense>
            );
        }
        return <NoActiveWorkout setView={setView} onStartQuickCardio={() => setShowQuickCardio(true)} />;
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 pb-28 md:pb-10 animate-[fade-in_0.5s_ease-out]">
            {pendingWorkoutsCount > 0 && (
                <div className="mb-5 p-3.5 sm:p-4 rounded-2xl glass border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3 text-xs animate-[fade-in_0.3s_ease-out]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                            <CloudOff size={18} />
                        </div>
                        <div className="min-w-0">
                            <span className="font-bold text-amber-600 dark:text-amber-400 block truncate text-xs sm:text-sm">
                                {pendingWorkoutsCount === 1 ? '1 entrenamiento guardado en tu móvil' : `${pendingWorkoutsCount} entrenamientos guardados en tu móvil`}
                            </span>
                            <span className="text-[11px] text-text-secondary block">
                                Se sincronizará automáticamente con la nube al recuperar conexión
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new Event('pfg-trigger-sync'))}
                        disabled={isSyncing}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                        <span>{isSyncing ? 'Subiendo...' : 'Sincronizar'}</span>
                    </button>
                </div>
            )}

            <WorkoutHeader
                routineName={activeWorkout.routineName}
                routineImage={activeWorkout.imageUrl || activeWorkout.image_url} 
                timer={timer}
                isWorkoutPaused={isWorkoutPaused}
                hasWorkoutStarted={hasWorkoutStarted}
                onBackClick={handleBackClick}
                onTogglePause={togglePauseWorkout}
                onFinishClick={handleFinishClick}
                onShowCalculator={() => setShowCalculatorModal(true)}
                onShowHeatmap={() => setShowHeatmapModal(true)}
                onOpenSettings={() => setView('settings', { highlight: 'workout', returnView: 'workout' })}
            />

            {!isSimpleWorkout && Object.keys(workoutMuscleData).length > 0 && (
                <section className="mb-7 overflow-hidden rounded-[28px] border border-accent/20 bg-gradient-to-br from-accent/10 via-bg-secondary to-bg-primary shadow-lg shadow-black/5">
                    <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                                <Activity size={21} />
                            </span>
                            <div className="min-w-0">
                                <h2 className="font-bold text-text-primary">Mapa muscular</h2>
                                <p className="text-xs text-text-secondary">Volumen previsto para esta sesión</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowHeatmapModal(true)}
                            className="flex shrink-0 items-center gap-1.5 rounded-full border border-accent/20 bg-bg-primary/70 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/10"
                        >
                            <Maximize2 size={14} />
                            Ver ampliado
                        </button>
                    </div>
                    <div className="grid items-center gap-3 px-3 pb-4 pt-2 sm:grid-cols-[minmax(0,1fr)_220px] sm:px-5 sm:pb-5">
                        <p className="order-2 px-2 text-sm leading-relaxed text-text-secondary sm:order-1 sm:px-0">
                            La intensidad del color muestra qué músculos acumulan más series. Toca el mapa para alternar entre frente y espalda.
                        </p>
                        <div className="order-1 mx-auto w-full max-w-[220px] sm:order-2">
                            <MuscleHeatmap
                                muscleData={workoutMuscleData}
                                darkMode={resolvedTheme !== 'light'}
                                compact
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* Banner recordatorio de la nota de la sesión anterior */}
            {previousWorkoutNote && !dismissedPreviousNote && (
                <PreviousWorkoutNoteBanner
                    previousNote={previousWorkoutNote}
                    onDismiss={() => setDismissedPreviousNote(true)}
                    onCopyNote={(text) => {
                        setNotes((prev) => (prev ? `${prev}\n${text}` : text));
                        addToast('Nota anterior añadida a tus notas de hoy', 'success');
                    }}
                />
            )}

            {!isSimpleWorkout && (
                <WorkoutExerciseList
                    exerciseGroups={exerciseGroups}
                    activeWorkoutExercises={activeWorkout.exercises}
                    hasWorkoutStarted={hasWorkoutStarted}
                    onSetSelectedExercise={setSelectedExercise}
                    onSetExerciseToReplace={setExerciseToReplace}
                    onShowHistory={setHistoryExercise}
                    onShowSmartCoach={setSmartCoachExercise}
                    baseInputClasses={baseInputClasses}
                    onUpdateSet={updateActiveWorkoutSet}
                    onAddDropset={addDropset}
                    onRemoveDropset={removeDropset}
                    onToggleWarmup={toggleWarmupSet}
                    onOpenRestModal={openRestModal}
                    onDisabledInputClick={handleDisabledInputClick}
                    onDisabledButtonClick={handleDisabledButtonClick}
                    onSaveReminder={setExerciseReminder}
                />
            )}

            <WorkoutNotes
                notes={notes}
                setNotes={setNotes}
                hasWorkoutStarted={hasWorkoutStarted}
                previousNote={previousWorkoutNote}
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
                    isSaving={false}
                />
            )}

            {showReviewModal && (
                <WorkoutReviewModal
                    onClose={() => {
                        setShowReviewModal(false);
                    }}
                    onConfirm={handleReviewConfirm}
                    isSaving={isSaving}
                />
            )}

            {showWorkoutSummaryModal && completedWorkoutData && (
                <WorkoutSummaryModal
                    workoutData={completedWorkoutData}
                    onClose={async () => {
                        setShowWorkoutSummaryModal(false);
                        setCompletedWorkoutData(null);
                        stopWorkout(); // <--- LLAMADA LIMPIA
                        await fetchInitialData();
                        setView('dashboard');
                    }}
                />
            )}

            {exerciseToReplace !== null && (
                <ExerciseSearch
                    isReplacing={true}
                    onClose={() => setExerciseToReplace(null)}
                    onExerciseSelectForReplace={(ex) => {
                        replaceExercise(exerciseToReplace, ex);
                        setExerciseToReplace(null);
                    }}
                    onAddCustomExercise={(manualEx) => {
                        replaceExercise(exerciseToReplace, manualEx);
                        setExerciseToReplace(null);
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

            {smartCoachExercise && (
                <SmartExerciseCoachModal
                    exercise={smartCoachExercise}
                    userProfile={userProfile}
                    workoutLog={workoutLog}
                    currentRoutineId={activeWorkout?.routine_id || activeWorkout?.routineId || activeWorkout?.id || null}
                    currentRoutineName={activeWorkout?.routine_name || activeWorkout?.routineName || activeWorkout?.name || null}
                    onClose={() => setSmartCoachExercise(null)}
                    onApplyStrategy={(strategy) => {
                        const exIndex = activeWorkout?.exercises?.findIndex(
                            (e) => e.id === smartCoachExercise.id || e.name === smartCoachExercise.name
                        );
                        if (exIndex !== -1 && exIndex !== undefined) {
                            applyCoachStrategyToExercise(exIndex, strategy);

                            if (strategy.perSetPlan && strategy.perSetPlan.length > 0) {
                                const setsDesc = strategy.perSetPlan.map(s => `${s.weight}kg`).join(' / ');
                                addToast(`Estrategia aplicada: ${strategy.title} (${setsDesc})`, 'success');
                            } else {
                                const parts = [];
                                if (strategy.suggestedSets) parts.push(`${strategy.suggestedSets} series`);
                                if (strategy.suggestedWeight !== null && strategy.suggestedWeight !== undefined) {
                                    const w = parseFloat(strategy.suggestedWeight);
                                    if (w > 0) {
                                        parts.push(`${w} kg (todas las series)`);
                                    } else {
                                        parts.push('Peso corporal');
                                    }
                                }
                                if (strategy.suggestedReps !== null && strategy.suggestedReps !== undefined) {
                                    parts.push(`${strategy.suggestedReps} reps`);
                                }

                                addToast(`Estrategia aplicada: ${parts.join(', ')}`, 'success');
                            }
                        }
                        setSmartCoachExercise(null);
                    }}
                    onApplyWeight={(suggestedWeight) => {
                        const exIndex = activeWorkout?.exercises?.findIndex(
                            (e) => e.id === smartCoachExercise.id || e.name === smartCoachExercise.name
                        );
                        if (exIndex !== -1 && exIndex !== undefined) {
                            applyCoachStrategyToExercise(exIndex, { suggestedWeight });
                            addToast(`Peso objetivo aplicado: ${suggestedWeight} kg`, 'success');
                        }
                        setSmartCoachExercise(null);
                    }}
                    onNavigateAsesoria={() => {
                        const exercisePayload = {
                            id: smartCoachExercise.id,
                            name: smartCoachExercise.name
                        };
                        try {
                            sessionStorage.setItem('asesoria_return_context', JSON.stringify({
                                view: 'workout',
                                reopenCoachExercise: exercisePayload
                            }));
                        } catch (e) {}

                        if (setView) {
                            setView('asesoria', {
                                returnView: 'workout',
                                returnParams: { reopenCoachExercise: exercisePayload }
                            });
                        }
                    }}
                />
            )}
        </div>
    );
};

export default Workout;
