import React from 'react';
import { Link2, Repeat, CornerDownRight, Clock, Trash2 } from 'lucide-react';
import GlassCard from '../GlassCard';
import { useToast } from '../../hooks/useToast';
import useAppStore from '../../store/useAppStore';

/**
 * Muestra la lista de ejercicios y series del entrenamiento activo.
 */
const ExerciseList = ({
    exerciseGroups,
    activeWorkout,
    hasWorkoutStarted,
    onSetTypeClick,
    onAddAdvancedSetClick,
    onOpenRestModalClick,
    onReplaceExerciseClick,
    onRemoveAdvancedSetClick,
}) => {
    const { addToast } = useToast();
    const updateActiveWorkoutSet = useAppStore(state => state.updateActiveWorkoutSet);

    const handleDisabledInputClick = () => { addToast('Debes iniciar el cronómetro antes de registrar datos.', 'warning'); };
    const handleDisabledButtonClick = () => { addToast('Debes iniciar el cronómetro antes de usar esta función.', 'warning'); };

    const baseInputClasses = `w-full text-center bg-bg-secondary border border-glass-border rounded-md px-3 py-2 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition text-sm ${!hasWorkoutStarted ? 'opacity-50 cursor-not-allowed' : ''}`;
    // --- INICIO DE LA MODIFICACIÓN (Quitar borde base) ---
    // Quitamos 'border' de aquí para aplicarlo selectivamente
    const baseButtonClasses = `p-2 rounded-md transition h-full flex items-center justify-center text-xs font-bold ${!hasWorkoutStarted ? 'bg-bg-primary border border-glass-border text-text-muted opacity-50 cursor-not-allowed' : ''}`;
    // --- FIN DE LA MODIFICACIÓN ---

    const setTypeLabels = {
        dropset: 'DS',
        'myo-rep': 'MYO',
        'rest-pause': 'RP',
        descending: 'DSC'
    };

    if (!activeWorkout?.exercises || activeWorkout.exercises.length === 0) {
        return null;
    }

    return (
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
                        {group.map((exercise) => {
                            const actualExIndex = activeWorkout.exercises.findIndex(ex => ex.tempId === exercise.tempId);

                            if (actualExIndex === -1) {
                                console.error("Could not find actual index for exercise using tempId:", exercise);
                                return null;
                            }

                            return (
                                <div key={actualExIndex} className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold">{exercise.name}</h3>
                                        <button
                                            onClick={() => hasWorkoutStarted ? onReplaceExerciseClick(actualExIndex) : handleDisabledButtonClick()}
                                            className={`p-2 rounded-md transition ${hasWorkoutStarted
                                                ? 'bg-bg-primary border border-glass-border text-text-secondary hover:text-accent hover:border-accent/50'
                                                : 'bg-bg-primary border border-glass-border text-text-muted opacity-50 cursor-not-allowed'
                                                }`}
                                            title={hasWorkoutStarted ? "Reemplazar ejercicio" : "Inicia el cronómetro para reemplazar ejercicios"}
                                            disabled={!hasWorkoutStarted}
                                        >
                                            <Repeat size={16} />
                                        </button>
                                    </div>

                                    <div className="hidden md:grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-2 items-center mb-2">
                                        <div className="text-center font-semibold text-text-secondary text-xs">Serie</div>
                                        <div className="text-center font-semibold text-text-secondary text-xs">Peso (kg)</div>
                                        <div className="text-center font-semibold text-text-secondary text-xs">Reps</div>
                                        <div className="text-center font-semibold text-text-secondary text-xs">Tipo</div>
                                        <div className="text-center font-semibold text-text-secondary text-xs">Acción</div>
                                        <div className="text-center font-semibold text-text-secondary text-xs">Descanso</div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {exercise.setsDone.map((set, setIndex) => {
                                            const isDynamicallyAddedAdvancedSet = setIndex > 0
                                                && exercise.setsDone[setIndex - 1]?.set_number === set.set_number
                                                && set.set_type;

                                            return (
                                                <div key={setIndex} className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-2 items-stretch bg-bg-primary p-2 rounded-md border border-glass-border">
                                                    <span className={`col-span-1 row-span-2 md:row-span-1 flex items-center justify-center text-center font-semibold border border-glass-border rounded-md px-3 py-2 ${set.set_type ? 'text-accent bg-accent/10 border-accent/30' : 'text-text-secondary bg-bg-secondary'}`}>
                                                        {setTypeLabels[set.set_type] || set.set_number}
                                                    </span>

                                                    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-2">
                                                        <input
                                                            type="number" inputMode="decimal" step="any" placeholder="Peso"
                                                            aria-label={`Peso serie ${set.set_number}`}
                                                            value={set.weight_kg}
                                                            onChange={hasWorkoutStarted ? (e) => updateActiveWorkoutSet(actualExIndex, setIndex, 'weight_kg', e.target.value) : undefined}
                                                            onClick={!hasWorkoutStarted ? handleDisabledInputClick : undefined}
                                                            className={baseInputClasses} disabled={!hasWorkoutStarted} readOnly={!hasWorkoutStarted}
                                                        />
                                                        <input
                                                            type="number" inputMode="numeric" placeholder="Reps"
                                                            aria-label={`Repeticiones serie ${set.set_number}`}
                                                            value={set.reps}
                                                            onChange={hasWorkoutStarted ? (e) => updateActiveWorkoutSet(actualExIndex, setIndex, 'reps', e.target.value) : undefined}
                                                            onClick={!hasWorkoutStarted ? handleDisabledInputClick : undefined}
                                                            className={baseInputClasses} disabled={!hasWorkoutStarted} readOnly={!hasWorkoutStarted}
                                                        />
                                                    </div>

                                                    <div className="col-span-1 md:col-span-3 grid grid-cols-3 gap-2">
                                                        {/* --- INICIO DE LA MODIFICACIÓN (Ajuste de clases de borde) --- */}
                                                        <button
                                                            onClick={hasWorkoutStarted ? () => onSetTypeClick(actualExIndex, setIndex, set.set_type) : handleDisabledButtonClick}
                                                            // Quita 'border-accent/30' si hay tipo, añade 'border border-glass-border' si no hay tipo
                                                            className={`${baseButtonClasses} ${hasWorkoutStarted ? (set.set_type ? 'bg-accent/10 text-accent hover:bg-accent/20' : 'bg-bg-primary border border-glass-border text-text-secondary hover:text-accent hover:border-accent/50') : ''}`}
                                                            title={hasWorkoutStarted ? "Tipo de serie" : "Inicia el cronómetro"} disabled={!hasWorkoutStarted}
                                                        >
                                                            {set.set_type ? setTypeLabels[set.set_type] : 'Tipo'}
                                                        </button>

                                                        {isDynamicallyAddedAdvancedSet ? (
                                                            <button
                                                                onClick={hasWorkoutStarted ? () => onRemoveAdvancedSetClick(actualExIndex, setIndex) : handleDisabledButtonClick}
                                                                // Quita 'border-red/30'
                                                                className={`${baseButtonClasses} bg-red/10 text-red hover:bg-red/20`}
                                                                title={hasWorkoutStarted ? "Eliminar esta serie extra" : "Inicia el cronómetro"} disabled={!hasWorkoutStarted}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={hasWorkoutStarted ? () => onAddAdvancedSetClick(actualExIndex, setIndex) : handleDisabledButtonClick}
                                                                // Añade 'border border-glass-border'
                                                                className={`${baseButtonClasses} ${hasWorkoutStarted ? 'bg-bg-primary border border-glass-border text-text-secondary hover:text-accent hover:border-accent/50' : ''}`}
                                                                title={hasWorkoutStarted ? "Añadir Dropset" : "Inicia el cronómetro"} disabled={!hasWorkoutStarted}
                                                            >
                                                                <CornerDownRight size={16} />
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={hasWorkoutStarted ? onOpenRestModalClick : handleDisabledButtonClick}
                                                            // Añade 'border border-glass-border'
                                                            className={`${baseButtonClasses} ${hasWorkoutStarted ? 'bg-bg-primary border border-glass-border text-text-secondary hover:text-accent hover:border-accent/50' : ''}`}
                                                            title={hasWorkoutStarted ? "Iniciar descanso" : "Inicia el cronómetro"} disabled={!hasWorkoutStarted}
                                                        >
                                                            <Clock size={16} />
                                                        </button>
                                                        {/* --- FIN DE LA MODIFICACIÓN --- */}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>
            ))}
        </div>
    );
};

export default ExerciseList;