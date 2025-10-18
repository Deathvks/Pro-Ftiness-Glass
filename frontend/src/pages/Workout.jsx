import React, { useState, useMemo } from 'react';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import { calculateCalories } from '../utils/helpers';

// Importar los nuevos componentes modularizados
import WorkoutHeader from '../components/workout/WorkoutHeader';
import WorkoutTimerControls from '../components/workout/WorkoutTimerControls';
import ExerciseList from '../components/workout/ExerciseList';
import WorkoutNotes from '../components/workout/WorkoutNotes';
import WorkoutModals from '../components/workout/WorkoutModals';

const Workout = ({ timer, setView }) => {
    // --- Hooks y Estado (se mantienen aquí) ---
    const { addToast } = useToast();
    const {
        activeWorkout,
        logWorkout,
        stopWorkout,
        updateActiveWorkoutSet, // Necesario para ExerciseList
        addAdvancedSet, // Renombrado de addDropset
        removeSetTypeOrAdvancedSet, // Renombrado de removeSetType // <-- Ya estaba aquí
        isWorkoutPaused,
        togglePauseWorkout,
        workoutStartTime,
        workoutAccumulatedTime, // Necesario para el timer
        isResting,
        openRestModal,
        userProfile,
        // Añadimos replaceExercise aquí si aún no está
        replaceExercise
    } = useAppStore(state => ({
        activeWorkout: state.activeWorkout,
        logWorkout: state.logWorkout,
        stopWorkout: state.stopWorkout,
        updateActiveWorkoutSet: state.updateActiveWorkoutSet,
        addAdvancedSet: state.addAdvancedSet, // Usar el nuevo nombre de la acción
        removeSetTypeOrAdvancedSet: state.removeSetTypeOrAdvancedSet, // Usar el nuevo nombre de la acción
        isWorkoutPaused: state.isWorkoutPaused,
        togglePauseWorkout: state.togglePauseWorkout,
        workoutStartTime: state.workoutStartTime,
        workoutAccumulatedTime: state.workoutAccumulatedTime,
        isResting: state.isResting,
        openRestModal: state.openRestModal,
        userProfile: state.userProfile,
        replaceExercise: state.replaceExercise, // Asegúrate de que esta acción exista en tu store
    }));

    // Estados locales para modales y notas
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [wasTimerRunningOnFinish, setWasTimerRunningOnFinish] = useState(false);
    const [showCalorieModal, setShowCalorieModal] = useState(false);
    const [exerciseToReplaceIndex, setExerciseToReplaceIndex] = useState(null); // Cambiado a índice
    const [showSetTypeModal, setShowSetTypeModal] = useState(false);
    const [setTypeModalData, setSetTypeModalData] = useState({ exIndex: null, setIndex: null, currentType: null });

    // --- Lógica (se mantiene aquí) ---
    const exerciseGroups = useMemo(() => {
        if (!activeWorkout?.exercises || activeWorkout.exercises.length === 0) return [];
        const exercises = activeWorkout.exercises;
        const groups = [];
        let currentGroup = [];
        exercises.forEach(ex => {
            if (ex.exercise_order === 0 && currentGroup.length > 0) {
                groups.push(currentGroup);
                currentGroup = [];
            }
            currentGroup.push(ex);
        });
        if (currentGroup.length > 0) groups.push(currentGroup);
        return groups;
    }, [activeWorkout]);

    // Si no hay workout activo, mostrar mensaje
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

    // --- Handlers (se mantienen aquí, se pasarán como props) ---

    const handleFinishClick = () => {
        if (timer === 0 && workoutStartTime === null) { // Solo mostrar si el timer nunca se inició
            addToast('Debes iniciar el cronómetro para poder guardar el entrenamiento.', 'warning');
            return;
        }

        const isPausedNow = useAppStore.getState().isWorkoutPaused;
        if (!isPausedNow) {
            setWasTimerRunningOnFinish(true);
            togglePauseWorkout(); // Pausar si estaba corriendo
        } else {
            setWasTimerRunningOnFinish(false);
        }
        setShowCalorieModal(true);
    };

    const handleBackClick = () => {
        if (workoutStartTime || workoutAccumulatedTime > 0) { // Mostrar modal si el timer ha corrido alguna vez
            setShowCancelModal(true);
        } else {
            stopWorkout(); // Descartar directamente si no se ha iniciado
            setView(activeWorkout.routineId ? 'routines' : 'dashboard');
        }
    };

    const confirmCancelWorkout = () => {
        const targetView = activeWorkout?.routineId ? 'routines' : 'dashboard'; // Usa optional chaining
        stopWorkout(); // Limpia estado y localStorage primero
        setShowCancelModal(false);

        // Usamos requestAnimationFrame para asegurar que la navegación ocurra después
        // de que las actualizaciones de estado se hayan procesado completamente.
        requestAnimationFrame(() => {
            setView(targetView);
        });
    };

    const handleCalorieInputComplete = async (calories) => {
        const isCardioOnly = !activeWorkout.exercises || activeWorkout.exercises.length === 0;

        const isAnySetFilled = isCardioOnly || activeWorkout.exercises.some(ex =>
            ex.setsDone.some(set => (set.reps && set.reps !== '') || (set.weight_kg && set.weight_kg !== ''))
        );

        if (!isAnySetFilled) {
            addToast('No has registrado ningún dato. Completa al menos una serie para guardar.', 'error');
            setShowCalorieModal(false);
            // Reanudar si estaba corriendo antes de intentar finalizar
            if (wasTimerRunningOnFinish) {
                togglePauseWorkout();
            }
            return;
        }

        setIsSaving(true);
        // Calcula la duración final justo antes de guardar
        const finalDurationSeconds = Math.floor((workoutAccumulatedTime + (workoutStartTime ? (Date.now() - workoutStartTime) : 0)) / 1000);

        const workoutData = {
            routineId: activeWorkout.routineId,
            routineName: activeWorkout.routineName,
            duration_seconds: finalDurationSeconds, // Usa la duración calculada
            notes: notes,
            calories_burned: calories,
            details: activeWorkout.exercises.map(ex => ({
                exerciseName: ex.name,
                superset_group_id: ex.superset_group_id,
                setsDone: ex.setsDone
                    .filter(set => (set.reps !== '' && set.reps !== null && set.reps !== undefined) || (set.weight_kg !== '' && set.weight_kg !== null && set.weight_kg !== undefined)) // Filtrar series completas
                    .map(set => ({
                        set_number: set.set_number,
                        reps: set.reps === '' ? 0 : parseInt(set.reps, 10) || 0,
                        weight_kg: set.weight_kg === '' ? 0 : parseFloat(set.weight_kg) || 0,
                        set_type: set.set_type || null
                    }))
            })).filter(ex => ex.setsDone.length > 0) // Filtrar ejercicios sin series completas
        };

        const result = await logWorkout(workoutData);
        if (result.success) {
            addToast(result.message, 'success');
            setShowCalorieModal(false);
            // stopWorkout() es llamado internamente por logWorkout si tiene éxito (a través de clearWorkoutState)
            setView('dashboard'); // Navegar a dashboard después de guardar
        } else {
            addToast(result.message || 'Error al guardar el entrenamiento', 'error');
            // Reanudar si estaba corriendo antes de intentar finalizar y falló
            if (wasTimerRunningOnFinish) {
                togglePauseWorkout();
            }
        }
        setIsSaving(false);
    };


    const handleCalorieInputCancel = () => {
        setShowCalorieModal(false);
        // Reanudar si estaba corriendo antes de intentar finalizar y se canceló
        if (wasTimerRunningOnFinish) {
            togglePauseWorkout();
        }
    };

    // Handlers para los modales
    const openSetTypeSelector = (exIndex, setIndex, currentType) => {
        setSetTypeModalData({ exIndex, setIndex, currentType });
        setShowSetTypeModal(true);
    };

    const handleSetTypeSelect = (newType) => {
        const { exIndex, setIndex, currentType } = setTypeModalData;
        // Si el tipo seleccionado es el mismo que el actual y no es 'Normal' (null),
        // interpretamos que el usuario quiere quitar el tipo especial.
        if (newType === currentType && newType !== null) {
            removeSetTypeOrAdvancedSet(exIndex, setIndex);
        } else {
            // Si es diferente o si selecciona 'Normal', actualizamos.
            updateActiveWorkoutSet(exIndex, setIndex, 'set_type', newType);
        }
        setShowSetTypeModal(false);
    };

    // Handler simplificado para añadir dropset (u otro tipo por defecto)
    const handleAddAdvancedSet = (exIndex, setIndex, type = 'dropset') => {
        addAdvancedSet(exIndex, setIndex, type);
    }

    const hasWorkoutStarted = workoutStartTime !== null || workoutAccumulatedTime > 0;
    const isSimpleWorkout = !activeWorkout.exercises || activeWorkout.exercises.length === 0;

    // --- Renderizado ---
    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
            {/* Cabecera */}
            <WorkoutHeader
                routineName={activeWorkout.routineName}
                onBackClick={handleBackClick}
            />

            {/* Temporizador y Controles */}
            <WorkoutTimerControls
                timer={timer}
                isWorkoutPaused={isWorkoutPaused}
                hasWorkoutStarted={hasWorkoutStarted}
                onTogglePause={togglePauseWorkout}
                onFinishClick={handleFinishClick}
            />

            {/* Lista de Ejercicios (si no es simple workout) */}
            {!isSimpleWorkout && (
                <ExerciseList
                    exerciseGroups={exerciseGroups}
                    activeWorkout={activeWorkout} // Pasar activeWorkout completo
                    hasWorkoutStarted={hasWorkoutStarted}
                    // onSetInputChange={updateActiveWorkoutSet} // Ya no es necesario, se usa directamente en ExerciseList
                    onSetTypeClick={openSetTypeSelector}
                    onAddAdvancedSetClick={handleAddAdvancedSet} // Pasa el handler simplificado
                    // --- INICIO DE LA MODIFICACIÓN (Pasar la prop para eliminar) ---
                    onRemoveAdvancedSetClick={removeSetTypeOrAdvancedSet} // Pasa la acción del store
                    // --- FIN DE LA MODIFICACIÓN ---
                    onOpenRestModalClick={openRestModal}
                    onReplaceExerciseClick={setExerciseToReplaceIndex} // Pasa el setter del índice
                />
            )}

            {/* Notas */}
            <WorkoutNotes
                notes={notes}
                setNotes={setNotes}
                hasWorkoutStarted={hasWorkoutStarted}
            />

            {/* Modales */}
            <WorkoutModals
                showCancelModal={showCancelModal}
                onConfirmCancel={confirmCancelWorkout}
                onCancelCancel={() => setShowCancelModal(false)}
                isResting={isResting}
                showCalorieModal={showCalorieModal}
                estimatedCalories={calculateCalories(timer, userProfile?.weight || 75)}
                onCalorieInputComplete={handleCalorieInputComplete}
                onCalorieInputCancel={handleCalorieInputCancel}
                isSaving={isSaving}
                exerciseToReplaceIndex={exerciseToReplaceIndex}
                onCloseReplaceModal={() => setExerciseToReplaceIndex(null)}
                showSetTypeModal={showSetTypeModal}
                setTypeModalData={setTypeModalData}
                onSetTypeSelect={handleSetTypeSelect}
                onCloseSetTypeModal={() => setShowSetTypeModal(false)}
            />
        </div>
    );
};

export default Workout;