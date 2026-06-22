/* frontend/src/components/Workout/WorkoutReviewModal.jsx */
import React, { useEffect } from 'react';
import { X, Save, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../../store/useAppStore';

const WorkoutReviewModal = ({ onClose, onConfirm, isSaving }) => {
    const { t } = useTranslation(['exercise_ui', 'exercise_names']);
    
    const { activeWorkout, updateActiveWorkoutSet } = useAppStore(state => ({
        activeWorkout: state.activeWorkout,
        updateActiveWorkoutSet: state.updateActiveWorkoutSet
    }));

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    if (!activeWorkout) return null;

    const exercisesWithData = activeWorkout.exercises.map((ex, exIndex) => ({
        ...ex,
        originalIndex: exIndex,
        validSets: ex.setsDone.map((set, setIndex) => ({ ...set, originalSetIndex: setIndex }))
            .filter(set => (set.reps !== '' && set.reps != null) || (set.weight_kg !== '' && set.weight_kg != null))
    })).filter(ex => ex.validSets.length > 0);

    const handleUpdate = (exerciseIndex, setIndex, field, value) => {
        updateActiveWorkoutSet(exerciseIndex, setIndex, field, value);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fade-in_0.25s_ease-out] p-4">
            
            {/* 2. Modal Isla: max-h-[70vh] garantiza que jamás colisione con los bordes de la pantalla */}
            <div className="relative w-full max-w-lg md:max-w-2xl rounded-2xl bg-bg-secondary border border-glass-border shadow-2xl flex flex-col max-h-[70vh] md:max-h-[85vh] animate-[scale-in_0.2s_ease-out] overflow-hidden shrink-0">
                
                {/* Cabecera pegajosa (shrink-0) */}
                <div className="p-4 sm:p-5 border-b border-glass-border flex justify-between items-center bg-bg-secondary z-10 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            <Edit2 size={20} className="text-accent" />
                            {t('exercise_ui:review_data', 'Revisar Datos')}
                        </h2>
                        <p className="text-xs text-text-tertiary mt-0.5">
                            {t('exercise_ui:review_data_desc', 'Verifica pesos y repeticiones antes de guardar.')}
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0 ml-2"
                    >
                        <X size={22} className="text-text-secondary" />
                    </button>
                </div>

                {/* Zona de scroll interno nativo (flex-1 overflow-y-auto) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-bg-secondary">
                    {exercisesWithData.length === 0 ? (
                        <p className="text-center text-text-tertiary py-12">
                            {t('exercise_ui:no_data_review', 'No hay datos registrados para revisar.')}
                        </p>
                    ) : (
                        exercisesWithData.map((exercise) => (
                            <div key={exercise.id || exercise.name} className="bg-bg-primary/40 rounded-xl p-4 border border-glass-border">
                                <h3 className="font-bold text-accent mb-3 text-sm uppercase tracking-wider">
                                    {t(exercise.name, { ns: 'exercise_names', defaultValue: exercise.name })}
                                </h3>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-10 gap-2 text-[10px] text-text-tertiary uppercase text-center font-bold mb-1">
                                        <div className="col-span-1">#</div>
                                        <div className="col-span-4">Kg</div>
                                        <div className="col-span-4">Reps</div>
                                    </div>
                                    {exercise.validSets.map((set, idx) => (
                                        <div key={idx} className="grid grid-cols-10 gap-2 items-center">
                                            <div className="col-span-1 flex justify-center items-center">
                                                <span className="w-5 h-5 rounded-full bg-glass-highlight text-[10px] flex items-center justify-center text-text-secondary">
                                                    {set.set_number}
                                                </span>
                                            </div>
                                            <div className="col-span-4">
                                                <input
                                                    type="number"
                                                    value={set.weight_kg}
                                                    onChange={(e) => handleUpdate(exercise.originalIndex, set.originalSetIndex, 'weight_kg', e.target.value)}
                                                    className="w-full bg-bg-secondary border border-glass-border rounded px-2 py-1.5 text-center text-sm focus:border-accent outline-none text-text-primary font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="col-span-4">
                                                <input
                                                    type="number"
                                                    value={set.reps}
                                                    onChange={(e) => handleUpdate(exercise.originalIndex, set.originalSetIndex, 'reps', e.target.value)}
                                                    className="w-full bg-bg-secondary border border-glass-border rounded px-2 py-1.5 text-center text-sm focus:border-accent outline-none text-text-primary font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pie pegajoso (shrink-0) */}
                <div className="p-4 sm:p-5 border-t border-glass-border bg-bg-secondary z-10 shrink-0">
                    <button
                        onClick={onConfirm}
                        disabled={isSaving}
                        className="w-full py-3.5 bg-accent text-white rounded-xl font-bold text-lg hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>{t('exercise_ui:saving', 'Guardando...')}</>
                        ) : (
                            <>
                                <Save size={20} />
                                {t('exercise_ui:confirm_save', 'Confirmar y Guardar')}
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default WorkoutReviewModal;