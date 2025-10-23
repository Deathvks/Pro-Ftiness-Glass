import React from 'react';
import { X, Share2, Clock, Flame, Target } from 'lucide-react';
import GlassCard from './GlassCard';

// Helper para formatear el tiempo
const formatTime = (timeInSeconds) => {
    const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(timeInSeconds % 60).padStart(2, '0');
    if (hours !== '00') {
        return `${hours}:${minutes}:${seconds}`;
    }
    return `${minutes}:${seconds}`;
};

const WorkoutSummaryModal = ({ workoutData, onClose }) => {
    
    const handleShare = async () => {
        // Asegúrate de que workoutData no sea null o undefined antes de desestructurar
        if (!workoutData) {
            console.error("No hay datos del entrenamiento para compartir.");
            return;
        }
        
        const { routineName, duration_seconds, calories_burned, details } = workoutData;
        
        // Comprobaciones adicionales por si acaso
        const safeRoutineName = routineName || "Entrenamiento";
        const safeDuration = duration_seconds || 0;
        const safeCalories = calories_burned || 0;
        const safeDetails = details || [];

        const durationStr = formatTime(safeDuration);
        
        let exerciseSummary = '';
        if (safeDetails.length > 0) {
            exerciseSummary = safeDetails.map(ex => {
                 // Asegurarse de que setsDone existe y es un array
                const setsDone = Array.isArray(ex.setsDone) ? ex.setsDone : [];
                const setsStr = setsDone.map(set => `  • ${set.weight_kg || 0} kg x ${set.reps || 0} reps`).join('\n');
                return `${ex.exerciseName || 'Ejercicio desconocido'}:\n${setsStr}`;
            }).join('\n\n');
        } else {
            exerciseSummary = 'Sesión de cardio/otros.';
        }

        const shareTitle = `¡Entrenamiento completado: ${safeRoutineName}!`;
        const shareText = `¡He completado mi entrenamiento "${safeRoutineName}" en Pro-Fitness-Glass!

Duración: ${durationStr}
Calorías: ${Math.round(safeCalories)} kcal

Resumen:
${exerciseSummary}

¡Registra tus progresos tú también!`;
        const shareUrl = window.location.origin || 'https://pro-ftiness-glass.com';

        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                console.error('Error al compartir entrenamiento:', error);
            }
        } else {
            alert('Tu navegador no soporta la función de compartir.');
        }
    };

    // Comprobación inicial robusta para workoutData
    if (!workoutData) {
       return null; // O mostrar un estado de carga/error si prefieres
    }

    const { routineName, duration_seconds, calories_burned, details, notes } = workoutData;
     // Comprobaciones adicionales por si acaso, usando valores por defecto
     const safeRoutineName = routineName || "Entrenamiento";
     const safeDuration = duration_seconds || 0;
     const safeCalories = calories_burned || 0;
     const safeDetails = details || [];
     const safeNotes = notes || "";


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
            <GlassCard className="w-full max-w-lg m-4 p-6 border-accent-border relative max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-text-primary">¡Entrenamiento Guardado!</h2>
                    <div className="flex gap-2">
                        <button onClick={handleShare} className="p-2 text-text-muted hover:text-accent transition-colors rounded-full">
                            <Share2 size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 text-text-muted hover:text-red transition-colors rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-accent mb-3 flex items-center gap-2">
                        <Target size={20} />
                        {safeRoutineName}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-bg-secondary p-4 rounded-lg border border-glass-border">
                            <Clock size={24} className="mx-auto text-text-secondary mb-1" />
                            <span className="text-sm text-text-secondary">Duración</span>
                            <p className="text-xl font-bold">{formatTime(safeDuration)}</p>
                        </div>
                        <div className="bg-bg-secondary p-4 rounded-lg border border-glass-border">
                            <Flame size={24} className="mx-auto text-text-secondary mb-1" />
                            <span className="text-sm text-text-secondary">Calorías</span>
                            <p className="text-xl font-bold">{Math.round(safeCalories)} kcal</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-text-primary">Resumen de Ejercicios</h4>
                    {safeDetails.length > 0 ? (
                        <div className="space-y-3 bg-bg-secondary p-4 rounded-lg border border-glass-border max-h-60 overflow-y-auto">
                            {safeDetails.map((ex, index) => (
                                <div key={index}>
                                    <p className="font-semibold text-text-primary">{ex.exerciseName || 'Ejercicio desconocido'}</p>
                                    <ul className="list-disc list-inside pl-2 text-sm text-text-secondary">
                                        {/* Asegurarse de que setsDone existe y es un array */}
                                        {(Array.isArray(ex.setsDone) ? ex.setsDone : []).map((set, setIndex) => (
                                            <li key={setIndex}>
                                                {set.weight_kg || 0} kg x {set.reps || 0} reps {set.is_dropset ? '(Dropset)' : ''}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-text-secondary italic">No se registraron ejercicios de fuerza.</p>
                    )}

                    {safeNotes && (
                        <div>
                            <h4 className="text-lg font-semibold text-text-primary mb-2">Notas</h4>
                            <p className="bg-bg-secondary p-4 rounded-lg border border-glass-border text-text-secondary text-sm whitespace-pre-wrap">{safeNotes}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full px-6 py-3 rounded-full bg-accent text-bg-secondary font-semibold transition hover:bg-accent/80"
                >
                    Cerrar
                </button>
            </GlassCard>
        </div>
    );
};

export default WorkoutSummaryModal; // <-- Asegúrate de que esta línea esté correcta