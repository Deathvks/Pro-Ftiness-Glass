/* frontend/src/components/Workout/WorkoutSupersetCard.jsx */
import React from 'react';
import { Clock, Flame, Repeat } from 'lucide-react';
import ExerciseMedia from '../ExerciseMedia';
import GlassCard from '../GlassCard';

// --- Helper para normalizar inputs ---
const normalizeDecimalInput = (value) => {
    if (value === null || value === undefined) return '';
    let strValue = String(value);
    strValue = strValue.replace(',', '.');
    strValue = strValue.replace(/[^0-9.]/g, '');
    const firstDotIndex = strValue.indexOf('.');
    if (firstDotIndex !== -1) {
        strValue =
            strValue.substring(0, firstDotIndex + 1) +
            strValue.substring(firstDotIndex + 1).replace(/\./g, '');
    }
    return strValue;
};

const WorkoutSupersetCard = ({
    group,
    allExercises,
    t,
    hasWorkoutStarted,
    onSetSelectedExercise,
    onSetExerciseToReplace,
    onUpdateSet,
    onToggleWarmup,
    onOpenRestModal,
    onDisabledInputClick,
    onDisabledButtonClick,
    baseInputClasses,
}) => {
    // Calculamos el número máximo de series
    const maxSets = Math.max(...group.map((ex) => ex.setsDone.length));

    // Helper para obtener el índice real
    const getRealIndex = (exerciseId) => {
        return allExercises.findIndex((ex) => ex.id === exerciseId);
    };

    // Definición de columnas del Grid
    const gridCols = `30px ${group.map(() => 'minmax(0, 1fr)').join(' ')} 40px`;

    // Renderizado de cada Fila
    const renderRow = (rowIndex) => {
        const lastExercise = group[group.length - 1];
        const restSeconds = lastExercise.rest_seconds;

        return (
            <div
                key={rowIndex}
                className="grid gap-2 items-center mb-2"
                style={{ gridTemplateColumns: gridCols }}
            >
                {/* Número de Serie */}
                <div
                    onClick={
                        hasWorkoutStarted
                            ? () => {
                                group.forEach((ex) => {
                                    const realIndex = getRealIndex(ex.id);
                                    if (ex.setsDone[rowIndex]) {
                                        onToggleWarmup(realIndex, rowIndex);
                                    }
                                });
                            }
                            : onDisabledButtonClick
                    }
                    className={`
            h-10 flex items-center justify-center rounded-md text-xs font-bold cursor-pointer select-none transition-colors
            ${group[0].setsDone[rowIndex]?.is_warmup
                            ? 'bg-accent/10 text-accent'
                            : 'bg-bg-secondary text-text-muted'
                        }
          `}
                >
                    {group[0].setsDone[rowIndex]?.is_warmup ? (
                        <Flame size={14} />
                    ) : (
                        rowIndex + 1
                    )}
                </div>

                {/* Inputs */}
                {group.map((exercise) => {
                    const set = exercise.setsDone[rowIndex];
                    const realIndex = getRealIndex(exercise.id);
                    const isMissing = !set;

                    if (isMissing) {
                        return <div key={exercise.id} className="bg-bg-secondary/30 h-10 rounded-md" />;
                    }

                    return (
                        <div key={exercise.id} className="flex gap-1 min-w-0">
                            <input
                                type="text"
                                inputMode="decimal"
                                placeholder="kg"
                                value={set.weight_kg}
                                onChange={
                                    hasWorkoutStarted
                                        ? (e) =>
                                            onUpdateSet(
                                                realIndex,
                                                rowIndex,
                                                'weight_kg',
                                                normalizeDecimalInput(e.target.value)
                                            )
                                        : undefined
                                }
                                onClick={!hasWorkoutStarted ? onDisabledInputClick : undefined}
                                className={`${baseInputClasses} px-1 text-sm h-10 min-w-0`}
                                disabled={!hasWorkoutStarted}
                            />
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="reps"
                                value={set.reps}
                                onChange={
                                    hasWorkoutStarted
                                        ? (e) =>
                                            onUpdateSet(
                                                realIndex,
                                                rowIndex,
                                                'reps',
                                                normalizeDecimalInput(e.target.value)
                                            )
                                        : undefined
                                }
                                onClick={!hasWorkoutStarted ? onDisabledInputClick : undefined}
                                className={`${baseInputClasses} px-1 text-sm h-10 min-w-0`}
                                disabled={!hasWorkoutStarted}
                            />
                        </div>
                    );
                })}

                {/* Botón Descanso */}
                <button
                    onClick={
                        hasWorkoutStarted
                            ? () => onOpenRestModal(restSeconds)
                            : onDisabledButtonClick
                    }
                    className={`h-10 w-10 flex items-center justify-center rounded-md border transition-colors ${hasWorkoutStarted
                        ? 'bg-bg-primary border-glass-border text-text-secondary hover:text-accent hover:border-accent'
                        : 'bg-bg-primary border-glass-border text-text-muted opacity-50 cursor-not-allowed'
                        }`}
                >
                    <Clock size={18} />
                </button>
            </div>
        );
    };

    return (
        <GlassCard className="p-3 md:p-4 relative mb-4">
            {/* Cabecera con Scroll Horizontal */}
            <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between">
                    <span className="bg-accent text-bg-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 self-start">
                        Superserie
                    </span>
                </div>

                {/* Contenedor de Tarjetas:
            - flex gap-3 overflow-x-auto: Comportamiento móvil (scroll horizontal)
            - md:justify-center: En escritorio se centran si caben
        */}
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x hide-scrollbar md:justify-center">
                    {group.map((ex) => (
                        <div
                            key={ex.id}
                            onClick={() => onSetSelectedExercise(ex)}
                            className="flex items-stretch gap-3 p-2 bg-bg-primary rounded-lg border border-glass-border min-w-[240px] max-w-[280px] flex-shrink-0 snap-start cursor-pointer hover:border-accent transition-colors relative group shadow-sm overflow-hidden"
                        >
                            {/* 1. Miniatura */}
                            <div className="w-12 h-12 self-center rounded-md overflow-hidden flex-shrink-0 bg-bg-secondary border border-glass-border relative">
                                <ExerciseMedia
                                    details={ex.exercise_details}
                                    className="w-full h-full object-cover pointer-events-none"
                                />
                            </div>

                            {/* 2. Info */}
                            <div className="flex flex-col justify-center min-w-0 flex-1 py-0.5">
                                <h4 className="text-sm font-bold text-text-primary truncate group-hover:text-accent transition-colors leading-tight">
                                    {t(ex.name, { ns: 'exercise_names' })}
                                </h4>
                                <span className="text-[10px] text-text-muted uppercase tracking-wide mt-0.5 truncate">
                                    {ex.sets} Series × {ex.reps} Reps
                                </span>
                            </div>

                            {/* 3. Botón Reemplazar */}
                            <div className="flex flex-col justify-center pl-2 border-l border-glass-border/50 my-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSetExerciseToReplace(getRealIndex(ex.id));
                                    }}
                                    className="p-2 text-text-muted hover:text-accent hover:bg-bg-secondary rounded-md transition-colors flex items-center justify-center"
                                    title="Reemplazar ejercicio"
                                >
                                    <Repeat size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid Header */}
            <div
                className="grid gap-2 mb-2 text-[10px] md:text-xs font-semibold text-text-secondary text-center uppercase tracking-wider items-center"
                style={{ gridTemplateColumns: gridCols }}
            >
                <div>#</div>
                {group.map((ex) => (
                    <div key={ex.id} className="truncate px-1" title={t(ex.name, { ns: 'exercise_names' })}>
                        {t(ex.name, { ns: 'exercise_names' }).split(' ')[0]}
                    </div>
                ))}
                <div className="flex justify-center items-center h-full">
                    <Clock size={14} />
                </div>
            </div>

            {/* Filas */}
            <div className="space-y-1">
                {Array.from({ length: maxSets }).map((_, i) => renderRow(i))}
            </div>
        </GlassCard>
    );
};

export default WorkoutSupersetCard;