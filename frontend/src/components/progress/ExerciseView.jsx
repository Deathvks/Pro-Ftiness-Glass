import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { ExerciseChart } from './ProgressCharts';
import CustomSelect from '../CustomSelect'; // Importamos el componente reutilizable

const ExerciseView = ({ allExercises, exerciseProgressData, axisColor, onShowHistory }) => {
    const [selectedExercise, setSelectedExercise] = useState('');

    useEffect(() => {
        // Selecciona el primer ejercicio de la lista por defecto
        if (allExercises.length > 0 && !selectedExercise) {
            setSelectedExercise(allExercises[0]);
        }
    }, [allExercises, selectedExercise]);
    
    // Adaptamos la lista de ejercicios al formato que espera el componente CustomSelect
    const exerciseOptions = allExercises.map(ex => ({
        value: ex,
        label: ex
    }));

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-end gap-4">
                {/* --- INICIO DE LA MODIFICACIÓN --- */}
                <div className="relative w-full max-w-xs z-10">
                    <label className="block text-sm font-medium text-text-secondary mb-2">Selecciona un ejercicio</label>
                    <CustomSelect
                        value={selectedExercise}
                        onChange={setSelectedExercise}
                        options={exerciseOptions}
                        placeholder="Elige un ejercicio"
                    />
                </div>
                {/* --- FIN DE LA MODIFICACIÓN --- */}
                <button
                    onClick={() => onShowHistory(selectedExercise)}
                    disabled={!selectedExercise}
                    className="p-3 rounded-md bg-bg-secondary border border-glass-border text-text-secondary transition enabled:hover:text-accent enabled:hover:border-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Ver historial detallado">
                    <BookOpen size={20} />
                </button>
            </div>
            <ExerciseChart
                data={exerciseProgressData[selectedExercise]}
                axisColor={axisColor}
                exerciseName={selectedExercise}
            />
        </div>
    );
};

export default ExerciseView;