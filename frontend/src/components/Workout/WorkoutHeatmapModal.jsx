/* frontend/src/components/Workout/WorkoutHeatmapModal.jsx */
import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import MuscleHeatmap from '../MuscleHeatmap/MuscleHeatmap';
import { useAppTheme } from '../../hooks/useAppTheme'; // Importamos el hook de tema

// Importamos la utilidad centralizada para evitar duplicidad de código
import { guessMuscleFromText } from '../../utils/muscleUtils';

// Leyenda de intensidad (Visual)
const INTENSITY_LEVELS = [
    { label: 'Bajo', color: '#00f2ff' },
    { label: 'Medio', color: '#00ff88' },
    { label: 'Alto', color: '#ffea00' },
    { label: 'Máximo', color: '#ff0055' }
];

const WorkoutHeatmapModal = ({ exercises = [], onClose }) => {
    // 1. Obtenemos el tema actual
    const { theme } = useAppTheme();
    const isDark = theme !== 'light';

    // Calcular la intensidad por músculo basada en el número de series
    const muscleData = useMemo(() => {
        const scores = {};

        if (!exercises || exercises.length === 0) return scores;

        exercises.forEach(ex => {
            // 1. Obtener nombre del músculo (prioridad: muscle_group directo > exercise_details)
            const rawMuscle = ex.muscle_group || ex.exercise_details?.muscle_group;

            let keysToCount = [];

            if (rawMuscle) {
                // --- CORRECCIÓN ---
                // NO resolvemos el mapeo aquí. Pasamos las claves crudas (ej: 'brazos')
                // para que MuscleHeatmap pueda aplicar el "Filtro Inteligente".
                keysToCount = rawMuscle.split(',').map(g => g.trim().toLowerCase());
            }

            // 2. Fallback: Adivinar por nombre si no hay grupo muscular
            if (keysToCount.length === 0) {
                keysToCount = guessMuscleFromText(ex.name);
            }

            // 3. Determinar volumen (series)
            const sets = Array.isArray(ex.sets) ? ex.sets.length : (parseInt(ex.sets) || 3);

            // 4. Acumular (usando la clave cruda)
            keysToCount.forEach(key => {
                if (key) {
                    scores[key] = (scores[key] || 0) + sets;
                }
            });
        });

        // 5. Normalizar para el Heatmap (0 a 10)
        const maxVal = Math.max(...Object.values(scores), 1);
        const referenceMax = Math.max(maxVal, 6); // Referencia mínima para no exagerar sesiones cortas

        const normalized = {};
        Object.keys(scores).forEach(k => {
            normalized[k] = Math.max(2, Math.round((scores[k] / referenceMax) * 10));
        });

        return normalized;
    }, [exercises]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
            {/* Reemplazamos GlassCard por un div con bg-bg-primary para consistencia en modo claro */}
            <div className="w-full max-w-md relative animate-[scale-in_0.3s_ease-out] bg-bg-primary rounded-2xl border border-glass-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Cabecera */}
                <div className="p-4 border-b border-glass-border flex justify-between items-center bg-bg-secondary">
                    <h2 className="text-xl font-bold text-text-primary">Músculos Trabajados</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-bg-primary text-text-secondary hover:text-text-primary transition border border-transparent hover:border-glass-border"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Contenido (Heatmap) */}
                <div className="p-6 flex flex-col justify-center items-center bg-bg-primary overflow-y-auto min-h-[350px]">
                    {Object.keys(muscleData).length > 0 ? (
                        <>
                            {/* Pasamos la variable isDark correctamente */}
                            <MuscleHeatmap muscleData={muscleData} darkMode={isDark} />

                            {/* Leyenda de Colores */}
                            <div className="flex flex-wrap justify-center gap-4 mt-6 mb-2">
                                {INTENSITY_LEVELS.map((level) => (
                                    <div key={level.label} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                                backgroundColor: level.color,
                                                boxShadow: `0 0 8px ${level.color}`
                                            }}
                                        />
                                        <span className="text-xs text-text-secondary font-medium">{level.label}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-10 px-4">
                            <p className="text-text-primary font-medium mb-2">No se han detectado grupos musculares.</p>
                            <p className="text-text-secondary text-sm">
                                Asegúrate de que tus ejercicios tengan asignado un grupo muscular específico.
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-glass-border text-center text-xs text-text-secondary bg-bg-secondary">
                    La intensidad del color indica el volumen de series en esta sesión.
                </div>
            </div>
        </div>
    );
};

export default WorkoutHeatmapModal;