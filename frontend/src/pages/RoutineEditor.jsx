import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Trash2, Save } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ExerciseSearchInput from '../components/ExerciseSearchInput';
import Spinner from '../components/Spinner';

const RoutineEditor = ({ routine, onSave, onCancel, isLoading }) => {
    const [editedRoutine, setEditedRoutine] = useState(() => {
        const initialRoutine = {
            id: routine.id || null,
            name: routine.name || '',
            description: routine.description || '',
            exercises: (routine.RoutineExercises || routine.exercises || []).map(ex => ({
                ...ex,
                tempId: `ex-${Math.random()}`
            }))
        };
        if (initialRoutine.exercises.length === 0) {
            initialRoutine.exercises = [{
                tempId: `ex-${Math.random()}`, name: '', muscle_group: '', sets: '', reps: ''
            }];
        }
        return initialRoutine;
    });

    const descriptionRef = useRef(null);
    const CHAR_LIMIT = 250;

    useEffect(() => {
        if (descriptionRef.current) {
            descriptionRef.current.style.height = 'auto';
            descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
        }
    }, [editedRoutine.description]);

    const handleExerciseSelect = (exIndex, selectedExercise) => {
        setEditedRoutine(prev => {
            const newExercises = [...prev.exercises];
            newExercises[exIndex] = {
                ...newExercises[exIndex],
                exercise_list_id: selectedExercise.id,
                name: selectedExercise.name,
                muscle_group: selectedExercise.muscle_group,
            };
            return { ...prev, exercises: newExercises };
        });
    };

    const handleFieldChange = (exIndex, field, value) => {
        setEditedRoutine(prev => {
            const newExercises = [...prev.exercises];
            newExercises[exIndex][field] = value;
            if (field === 'name') {
                newExercises[exIndex].exercise_list_id = null;
            }
            return { ...prev, exercises: newExercises };
        });
    };

    const addExercise = () => {
        setEditedRoutine(prev => ({
            ...prev,
            exercises: [
                ...prev.exercises,
                { tempId: `ex-${Math.random()}`, name: '', muscle_group: '', sets: '', reps: '' }
            ]
        }));
    };

    const removeExercise = (exIndex) => {
        setEditedRoutine(prev => ({
            ...prev,
            exercises: prev.exercises.filter((_, index) => index !== exIndex)
        }));
    };

    const handleSave = () => {
        if (!editedRoutine.name || editedRoutine.name.trim() === '') {
            alert('Por favor, dale un nombre a la rutina.');
            return;
        }
        const exercisesToSave = editedRoutine.exercises.filter(ex => ex.name && ex.name.trim() !== '');
        for (const ex of exercisesToSave) {
            if (!ex.sets || ex.sets <= 0) {
                alert(`Por favor, introduce un número de series válido para "${ex.name}".`); return;
            }
            if (!ex.reps || ex.reps.trim() === '') {
                alert(`Por favor, introduce las repeticiones para "${ex.name}".`); return;
            }
        }
        const routineToSave = {
            ...editedRoutine,
            exercises: exercisesToSave.map(ex => {
                const copy = { ...ex };
                delete copy.tempId;
                return copy;
            })
        };
        onSave(routineToSave);
    };

    const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";

    return (
        <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
            <button onClick={onCancel} className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4">
                <ChevronLeft size={20} />
                Volver a Rutinas
            </button>
            <h1 className="text-4xl font-extrabold mb-8">{routine.id ? 'Editar Rutina' : 'Crear Rutina'}</h1>

            <GlassCard className="p-6 flex flex-col gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Nombre de la Rutina</label>
                        <input
                            type="text"
                            value={editedRoutine.name}
                            onChange={(e) => setEditedRoutine({ ...editedRoutine, name: e.target.value })}
                            className={baseInputClasses}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Descripción (Opcional)</label>
                        <textarea
                            ref={descriptionRef}
                            value={editedRoutine.description || ''}
                            onChange={(e) => setEditedRoutine({ ...editedRoutine, description: e.target.value })}
                            className={`${baseInputClasses} resize-none overflow-hidden`}
                            rows="1"
                            maxLength={CHAR_LIMIT}
                        ></textarea>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Ejercicios</h2>
                    {editedRoutine.exercises.map((ex, index) => (
                        // --- INICIO DE LA CORRECCIÓN ---
                        <GlassCard
                            key={ex.tempId}
                            className="p-4 bg-bg-secondary/50 relative focus-within:z-20"
                        >
                            {/* --- FIN DE LA CORRECCIÓN --- */}
                            <div className="flex items-center gap-4 mb-4">
                                <ExerciseSearchInput
                                    value={ex.name}
                                    onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                                    onSelect={(selected) => handleExerciseSelect(index, selected)}
                                />
                                <button onClick={() => removeExercise(index)} className="p-2 rounded-full text-text-muted hover:bg-red/20 hover:text-red transition">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <input
                                    type="number"
                                    placeholder="Series"
                                    value={ex.sets || ''}
                                    onChange={(e) => handleFieldChange(index, 'sets', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                    className={baseInputClasses}
                                />
                                <input
                                    type="text"
                                    placeholder="Reps (ej: 8-12)"
                                    value={ex.reps || ''}
                                    onChange={(e) => handleFieldChange(index, 'reps', e.target.value)}
                                    className={baseInputClasses}
                                />
                                <input
                                    type="text"
                                    placeholder="Grupo Muscular"
                                    value={ex.muscle_group || ''}
                                    onChange={(e) => handleFieldChange(index, 'muscle_group', e.target.value)}
                                    className={baseInputClasses}
                                />
                            </div>
                        </GlassCard>
                    ))}
                </div>

                <button onClick={addExercise} className="w-full py-3 rounded-md bg-accent/10 text-accent font-semibold border border-accent/20 hover:bg-accent/20 transition">
                    Añadir Ejercicio
                </button>

                <div className="flex justify-end items-center gap-4 pt-6 border-t border-glass-border">
                    <button onClick={onCancel} disabled={isLoading} className="px-6 py-2 rounded-full font-semibold text-text-secondary hover:text-text-primary transition disabled:opacity-70">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-6 py-2 w-32 rounded-full bg-accent text-bg-secondary font-semibold transition hover:scale-105 disabled:opacity-70"
                    >
                        {isLoading ? <Spinner size={18} /> : <><Save size={18} /><span>Guardar</span></>}
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};

export default RoutineEditor;