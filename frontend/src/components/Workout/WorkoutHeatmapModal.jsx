/* frontend/src/components/Workout/WorkoutHeatmapModal.jsx */
import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import MuscleHeatmap from '../MuscleHeatmap/MuscleHeatmap';
import GlassCard from '../GlassCard';

// 1. Mapeo Robusto (Incluyendo nombres anatómicos técnicos)
const DB_TO_HEATMAP_MAP = {
    // Torso - Pecho
    'chest': ['chest'],
    'pectorals': ['chest'],
    'pectoralis major': ['chest'], // Nombre anatómico común
    'pectoral mayor': ['chest'],
    'pectoral': ['chest'],
    'pecho': ['chest'],

    // Torso - Espalda
    'back': ['upper-back', 'lower-back'],
    'espalda': ['upper-back', 'lower-back'],
    'lats': ['upper-back'],
    'latissimus dorsi': ['upper-back'], // Nombre anatómico
    'dorsales': ['upper-back'],
    'dorsal ancho': ['upper-back'],
    'traps': ['trapezius'],
    'trapecios': ['trapezius'],
    'trapezius': ['trapezius'], // Nombre anatómico
    'lower back': ['lower-back'],
    'lumbares': ['lower-back'],
    'upper back': ['upper-back'],

    // Torso - Hombros
    'shoulders': ['front-deltoids', 'back-deltoids'],
    'hombros': ['front-deltoids', 'back-deltoids'],
    'deltoids': ['front-deltoids', 'back-deltoids'],
    'deltoides': ['front-deltoids', 'back-deltoids'],
    'anterior deltoid': ['front-deltoids'],
    'deltoides anterior': ['front-deltoids'],

    // Torso - Abs
    'abs': ['abs'],
    'abdominales': ['abs'],
    'abdominals': ['abs'],
    'rectus abdominis': ['abs'], // Nombre anatómico
    'recto abdominal': ['abs'],
    'obliques': ['obliques'],
    'oblicuos': ['obliques'],
    'obliquus externus abdominis': ['obliques'],
    'core': ['abs', 'obliques'],

    // Brazos
    'arms': ['biceps', 'triceps'],
    'brazos': ['biceps', 'triceps'],
    'biceps': ['biceps'],
    'bíceps': ['biceps'],
    'biceps brachii': ['biceps'], // Nombre anatómico
    'biceps braquial': ['biceps'],
    'triceps': ['triceps'],
    'tríceps': ['triceps'],
    'triceps brachii': ['triceps'], // Nombre anatómico
    'tríceps braquial': ['triceps'],
    'forearms': ['forearm'],
    'antebrazos': ['forearm'],
    'forearm': ['forearm'],
    'brachialis': ['biceps'], // Braquial suele agruparse visualmente cerca

    // Piernas
    'legs': ['quadriceps', 'hamstring', 'gluteal', 'calves'],
    'piernas': ['quadriceps', 'hamstring', 'gluteal', 'calves'],
    'quads': ['quadriceps'],
    'cuádriceps': ['quadriceps'],
    'quadriceps': ['quadriceps'],
    'quadriceps femoris': ['quadriceps'], // Nombre anatómico
    'hamstrings': ['hamstring'],
    'isquios': ['hamstring'],
    'isquiotibiales': ['hamstring'],
    'femorales': ['hamstring'],
    'biceps femoris': ['hamstring'], // Nombre anatómico
    'glutes': ['gluteal'],
    'glúteos': ['gluteal'],
    'gluteal': ['gluteal'],
    'gluteus maximus': ['gluteal'], // Nombre anatómico
    'calves': ['calves'],
    'gemelos': ['calves'],
    'pantorrillas': ['calves'],
    'gastrocnemius': ['calves'], // Nombre anatómico
    'soleus': ['calves'], // Nombre anatómico
    'adductors': ['adductor'],
    'aductores': ['adductor'],
    'abductors': ['abductors'],
    'abductores': ['abductors'],

    // Otros
    'cardio': [],
    'full body': ['chest', 'upper-back', 'quadriceps', 'hamstring', 'abs', 'biceps', 'triceps', 'front-deltoids'],
    'cuerpo completo': ['chest', 'upper-back', 'quadriceps', 'hamstring', 'abs', 'biceps', 'triceps', 'front-deltoids'],
    'other': [],
    'otro': []
};

// Leyenda de intensidad
const INTENSITY_LEVELS = [
    { label: 'Bajo', color: '#00f2ff' },
    { label: 'Medio', color: '#00ff88' },
    { label: 'Alto', color: '#ffea00' },
    { label: 'Máximo', color: '#ff0055' }
];

// 2. Función de Adivinanza
const guessMuscleFromText = (text) => {
    if (!text) return [];
    const t = text.toLowerCase();

    // Pecho (Añadido 'pectoral')
    if (t.includes('bench') || t.includes('banca') || t.includes('chest') || t.includes('pecho') || t.includes('pectoral') || t.includes('push-up') || t.includes('flexiones') || t.includes('pec deck') || t.includes('fly') || t.includes('aperturas') || t.includes('dips') || t.includes('fondos')) return ['chest'];

    // Espalda
    if (t.includes('row') || t.includes('remo') || t.includes('pull') || t.includes('jalon') || t.includes('jalón') || t.includes('dominada') || t.includes('chin') || t.includes('lat') || t.includes('dorsal') || t.includes('back') || t.includes('espalda')) return ['upper-back', 'lower-back'];
    if (t.includes('deadlift') || t.includes('peso muerto') || t.includes('lumbar')) return ['lower-back', 'hamstring'];

    // Hombros
    if (t.includes('press') && (t.includes('shoulder') || t.includes('hombro') || t.includes('militar') || t.includes('military') || t.includes('overhead'))) return ['front-deltoids'];
    if (t.includes('raise') || t.includes('elevacion') || t.includes('lateral') || t.includes('pajaros') || t.includes('face pull')) return ['back-deltoids', 'front-deltoids'];

    // Brazos
    if (t.includes('curl') || t.includes('bicep')) return ['biceps'];
    if (t.includes('extension') || t.includes('tricep') || t.includes('skull') || t.includes('copa') || t.includes('patada') || t.includes('pushdown')) return ['triceps'];

    // Piernas
    if (t.includes('squat') || t.includes('sentadilla') || t.includes('leg press') || t.includes('prensa') || t.includes('lunge') || t.includes('zancada') || t.includes('step') || t.includes('extension')) return ['quadriceps', 'gluteal'];
    if (t.includes('curl') && t.includes('leg')) return ['hamstring'];
    if (t.includes('femoral') || t.includes('isko') || t.includes('isquio')) return ['hamstring'];
    if (t.includes('glute') || t.includes('glúteo') || t.includes('hip') || t.includes('cadera') || t.includes('bridge') || t.includes('puente')) return ['gluteal'];
    if (t.includes('calf') || t.includes('gemelo') || t.includes('pantorrilla')) return ['calves'];

    // Abs
    if (t.includes('abs') || t.includes('crunch') || t.includes('plank') || t.includes('plancha') || t.includes('abdominal') || t.includes('sit-up') || t.includes('leg raise')) return ['abs'];

    return [];
};

const WorkoutHeatmapModal = ({ exercises = [], onClose }) => {

    // Calcular la intensidad por músculo basada en el número de series
    const muscleData = useMemo(() => {
        const scores = {};

        if (!exercises || exercises.length === 0) return scores;

        exercises.forEach(ex => {
            // 1. Obtener nombre del músculo (prioridad: muscle_group directo > exercise_details)
            const rawMuscle = ex.muscle_group || ex.exercise_details?.muscle_group;

            let targetMuscles = [];

            if (rawMuscle) {
                // Soportamos listas separadas por comas
                const groups = rawMuscle.split(',').map(g => g.trim().toLowerCase());

                groups.forEach(g => {
                    if (DB_TO_HEATMAP_MAP[g]) {
                        targetMuscles.push(...DB_TO_HEATMAP_MAP[g]);
                    }
                });
            }

            // 2. Fallback: Adivinar por nombre si no hay mapping válido
            if (targetMuscles.length === 0) {
                targetMuscles = guessMuscleFromText(ex.name);
            }

            // 3. Determinar volumen (series)
            const sets = Array.isArray(ex.sets) ? ex.sets.length : (parseInt(ex.sets) || 3);

            // 4. Acumular
            targetMuscles.forEach(m => {
                scores[m] = (scores[m] || 0) + sets;
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
            <div className="w-full max-w-md relative animate-[scale-in_0.3s_ease-out]">
                <GlassCard className="p-0 overflow-hidden relative flex flex-col max-h-[90vh]">

                    {/* Cabecera */}
                    <div className="p-4 border-b border-glass-border flex justify-between items-center bg-bg-secondary/30">
                        <h2 className="text-xl font-bold text-text-primary">Músculos Trabajados</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 text-text-secondary hover:text-white transition"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Contenido (Heatmap) */}
                    <div className="p-6 flex flex-col justify-center items-center bg-gradient-to-b from-transparent to-bg-primary/50 overflow-y-auto min-h-[350px]">
                        {Object.keys(muscleData).length > 0 ? (
                            <>
                                <MuscleHeatmap muscleData={muscleData} darkMode={true} />

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

                    <div className="p-4 border-t border-glass-border text-center text-xs text-text-secondary">
                        La intensidad del color indica el volumen de series en esta sesión.
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default WorkoutHeatmapModal;