import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const ExerciseHistoryModal = ({ exerciseName, workoutLog, onClose }) => {
    const history = useMemo(() => {
        return workoutLog
            .map(log => {
                const relevantDetail = log.WorkoutLogDetails.find(detail => detail.exercise_name === exerciseName);
                if (!relevantDetail) return null;

                return {
                    date: log.workout_date,
                    routine_name: log.routine_name,
                    sets: relevantDetail.WorkoutLogSets || []
                };
            })
            .filter(Boolean)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [exerciseName, workoutLog]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
            <GlassCard className="relative w-full max-w-lg p-6 flex flex-col gap-4 m-4">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"><X size={20} /></button>
                <div className="text-center pb-4 border-b border-glass-border">
                    <h3 className="text-xl font-bold">Historial de {exerciseName}</h3>
                </div>
                <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
                    {history.length > 0 ? (
                        history.map((session, index) => {
                            // --- INICIO DE LA CORRECCIÓN ---
                            // 1. Se genera la fecha como un string.
                            const dateStr = new Date(session.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                            // 2. Se pone en mayúscula la primera letra.
                            const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
                            // --- FIN DE LA CORRECCIÓN ---

                            return (
                                <div key={index} className="bg-bg-primary p-3 rounded-md">
                                    <p className="font-semibold text-text-secondary text-sm">
                                        {/* 3. Se muestra la fecha ya formateada. */}
                                        {capitalizedDate}
                                    </p>
                                    <p className="text-xs text-text-muted mb-2">Rutina: {session.routine_name}</p>
                                    <ul className="space-y-2 text-sm">
                                        {session.sets.length > 0 ? (
                                            session.sets.map(set => (
                                                <li key={set.id} className="bg-bg-secondary p-2 rounded">
                                                    Serie {set.set_number}: <strong>{set.reps} reps</strong> con <strong>{set.weight_kg} kg</strong>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-text-muted">No se registraron series para este ejercicio.</li>
                                        )}
                                    </ul>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-text-muted text-center py-8">No hay historial para este ejercicio.</p>
                    )}
                </div>
            </GlassCard>
        </div>
    );
};

export default ExerciseHistoryModal;