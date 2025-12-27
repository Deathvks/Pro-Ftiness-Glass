/* frontend/src/pages/Progress.jsx */
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import useAppStore from '../store/useAppStore';
import ExerciseHistoryModal from './ExerciseHistoryModal';

import DailyDetailView from '../components/progress/DailyDetailView';
import CalendarView from '../components/progress/CalendarView';
import { BodyWeightChart } from '../components/progress/ProgressCharts';
import ExerciseView from '../components/progress/ExerciseView';
import NutritionView from '../components/progress/NutritionView';
import RecordsView from '../components/progress/RecordsView';
import MuscleHeatmap from '../components/MuscleHeatmap/MuscleHeatmap';

// 1. Mapeo Robusto (Unificado con WorkoutHeatmapModal)
const DB_TO_HEATMAP_MAP = {
    // Torso - Pecho
    'chest': ['chest'],
    'pectorals': ['chest'],
    'pectoralis major': ['chest'],
    'pectoral mayor': ['chest'],
    'pectoral': ['chest'],
    'pecho': ['chest'],

    // Torso - Espalda
    'back': ['upper-back', 'lower-back'],
    'espalda': ['upper-back', 'lower-back'],
    'lats': ['upper-back'],
    'latissimus dorsi': ['upper-back'],
    'dorsales': ['upper-back'],
    'dorsal ancho': ['upper-back'],
    'traps': ['trapezius'],
    'trapecios': ['trapezius'],
    'trapezius': ['trapezius'],
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
    'rectus abdominis': ['abs'],
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
    'biceps brachii': ['biceps'],
    'biceps braquial': ['biceps'],
    'triceps': ['triceps'],
    'tríceps': ['triceps'],
    'triceps brachii': ['triceps'],
    'tríceps braquial': ['triceps'],
    'forearms': ['forearm'],
    'antebrazos': ['forearm'],
    'forearm': ['forearm'],
    'brachialis': ['biceps'],

    // Piernas
    'legs': ['quadriceps', 'hamstring', 'gluteal', 'calves'],
    'piernas': ['quadriceps', 'hamstring', 'gluteal', 'calves'],
    'quads': ['quadriceps'],
    'cuádriceps': ['quadriceps'],
    'quadriceps': ['quadriceps'],
    'quadriceps femoris': ['quadriceps'],
    'hamstrings': ['hamstring'],
    'isquios': ['hamstring'],
    'isquiotibiales': ['hamstring'],
    'femorales': ['hamstring'],
    'biceps femoris': ['hamstring'],
    'glutes': ['gluteal'],
    'glúteos': ['gluteal'],
    'gluteal': ['gluteal'],
    'gluteus maximus': ['gluteal'],
    'calves': ['calves'],
    'gemelos': ['calves'],
    'pantorrillas': ['calves'],
    'gastrocnemius': ['calves'],
    'soleus': ['calves'],
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
    { label: 'Bajo', color: '#00f2ff' },   // Frecuencia 1
    { label: 'Medio', color: '#00ff88' },  // Frecuencia 2
    { label: 'Alto', color: '#ffea00' },   // Frecuencia 3
    { label: 'Máximo', color: '#ff0055' }  // Frecuencia 4
];

// 2. Función de Adivinanza (Unificada)
const guessMuscleFromText = (text) => {
    if (!text) return [];
    const t = text.toLowerCase();

    // Pecho
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

const Progress = ({ darkMode }) => {
    // Extraemos allExercises del store
    const { workoutLog, bodyWeightLog, exercises, getOrFetchAllExercises } = useAppStore(state => ({
        workoutLog: state.workoutLog,
        bodyWeightLog: state.bodyWeightLog,
        exercises: state.allExercises || [],
        getOrFetchAllExercises: state.getOrFetchAllExercises
    }));

    const [viewType, setViewType] = useState('heatmap');
    const [detailedLog, setDetailedLog] = useState(null);
    const [exerciseForHistory, setExerciseForHistory] = useState('');
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Cargar ejercicios al montar
    useEffect(() => {
        getOrFetchAllExercises();
    }, [getOrFetchAllExercises]);

    // Chart Data
    const bodyWeightChartData = useMemo(() => {
        return bodyWeightLog
            .map(log => {
                const weight = parseFloat(log.weight_kg);
                if (isNaN(weight)) return null;
                return {
                    timestamp: new Date(log.log_date).getTime(),
                    'Peso (kg)': weight,
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.timestamp - b.timestamp);
    }, [bodyWeightLog]);

    // Lista única
    const allExercises = useMemo(() => {
        const exerciseSet = new Set(
            workoutLog.flatMap(log => log.WorkoutLogDetails?.map(d => d.exercise_name) || [])
        );
        return Array.from(exerciseSet);
    }, [workoutLog]);

    // Progreso por ejercicio
    const exerciseProgressData = useMemo(() => {
        const progress = {};
        if (!workoutLog || workoutLog.length === 0) return progress;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentLogs = workoutLog.filter(log => new Date(log.workout_date) >= thirtyDaysAgo);

        recentLogs.forEach(log => {
            if (log.WorkoutLogDetails) {
                log.WorkoutLogDetails.forEach(detail => {
                    if (detail.best_set_weight > 0 || (detail.estimated_1rm && detail.estimated_1rm > 0)) {
                        if (!progress[detail.exercise_name]) progress[detail.exercise_name] = [];
                        progress[detail.exercise_name].push({
                            date: new Date(log.workout_date).getTime(),
                            'Peso Máximo (kg)': detail.best_set_weight || 0,
                            '1RM Estimado (kg)': detail.estimated_1rm || 0,
                        });
                    }
                });
            }
        });

        for (const exerciseName in progress) {
            progress[exerciseName].sort((a, b) => a.date - b.date);
        }
        return progress;
    }, [workoutLog]);

    // --- LÓGICA DE MAPA DE CALOR (CORREGIDA) ---
    const muscleHeatmapData = useMemo(() => {
        if (!workoutLog || workoutLog.length === 0) return {};

        const scores = {};
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Logs recientes
        const recentLogs = workoutLog.filter(log => new Date(log.workout_date) >= thirtyDaysAgo);

        recentLogs.forEach(log => {
            log.WorkoutLogDetails?.forEach(detail => {
                const name = detail.exercise_name;

                // 1. Intentar buscar en DB (allExercises)
                const exerciseData = exercises?.find(e => e.name === name);

                let targetMuscles = [];

                if (exerciseData && exerciseData.muscle_group) {
                    // Normalizamos y separamos por comas
                    const groups = exerciseData.muscle_group.split(',').map(g => g.trim().toLowerCase());

                    groups.forEach(g => {
                        // Buscamos coincidencia exacta en el mapa (que ahora tiene claves en minúsculas)
                        if (DB_TO_HEATMAP_MAP[g]) {
                            targetMuscles.push(...DB_TO_HEATMAP_MAP[g]);
                        }
                    });
                }

                // 2. Si falló la DB o no trajo músculos válidos, usamos la "adivinanza" mejorada
                if (targetMuscles.length === 0) {
                    targetMuscles = guessMuscleFromText(name);
                }

                // Sumamos puntuación
                targetMuscles.forEach(muscleId => {
                    scores[muscleId] = (scores[muscleId] || 0) + 1;
                });
            });
        });

        // Normalizamos
        const maxVal = Math.max(...Object.values(scores), 1);
        const normalized = {};
        Object.keys(scores).forEach(k => {
            // Intensidad mínima visual de 2 para que se note si has entrenado
            normalized[k] = Math.max(2, Math.round((scores[k] / maxVal) * 10));
        });

        return normalized;
    }, [workoutLog, exercises]);

    const handleShowHistory = (exerciseName) => {
        setExerciseForHistory(exerciseName);
        setShowHistoryModal(true);
    };

    const axisColor = darkMode ? "#94a3b8" : "#475569";
    const getTabClass = (type) => `px-4 py-2 text-sm font-semibold rounded-full transition whitespace-nowrap ${viewType === type ? 'bg-accent text-bg-secondary shadow-[0_0_15px_rgba(0,242,255,0.3)]' : 'bg-bg-secondary hover:bg-white/10 text-text-secondary'}`;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 pt-6 pb-6 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
            <Helmet>
                <html lang="es" />
                <title>Tu Progreso - Pro Fitness Glass</title>
                <meta name="description" content="Visualiza tu progreso muscular, fuerza y estadísticas." />
            </Helmet>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                <h1 className="hidden md:block text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary mt-4 md:mt-0">
                    Tu Progreso
                </h1>

                <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar mask-linear-fade">
                    <button onClick={() => setViewType('heatmap')} className={getTabClass('heatmap')}>Mapa Muscular</button>
                    <button onClick={() => setViewType('exercise')} className={getTabClass('exercise')}>Ejercicios</button>
                    <button onClick={() => setViewType('nutrition')} className={getTabClass('nutrition')}>Nutrición</button>
                    <button onClick={() => setViewType('records')} className={getTabClass('records')}>Récords</button>
                    <button onClick={() => setViewType('bodyWeight')} className={getTabClass('bodyWeight')}>Peso Corporal</button>
                    <button onClick={() => setViewType('calendar')} className={getTabClass('calendar')}>Calendario</button>
                </div>
            </div>

            {viewType === 'heatmap' && (
                <div className="flex flex-col items-center animate-fade-in py-6 w-full">
                    <div className="w-full max-w-[300px] flex justify-center">
                        <MuscleHeatmap muscleData={muscleHeatmapData} darkMode={darkMode} />
                    </div>

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

                    {/* --- EXPLICACIÓN DE INTENSIDAD --- */}
                    <div className="text-xs text-text-secondary mt-4 text-center max-w-md bg-bg-secondary/50 p-4 rounded-xl border border-white/5 backdrop-blur-md space-y-2">
                        <p>
                            <strong>¿Cómo funciona?</strong> La intensidad es relativa a tu músculo más entrenado en los últimos 30 días (Referencia 100%).
                        </p>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] opacity-80 text-left w-full max-w-[280px] mx-auto">
                            <li>• Máximo: 75-100% del volumen</li>
                            <li>• Alto: 50-75% del volumen</li>
                            <li>• Medio: 25-50% del volumen</li>
                            <li>• Bajo: Menos del 25%</li>
                        </ul>
                        <p className="pt-2 border-t border-white/5 mt-2">
                            <span className="opacity-70">Haz click en el modelo para girarlo (Anterior/Posterior).</span>
                        </p>
                    </div>
                </div>
            )}

            {viewType === 'exercise' && <ExerciseView allExercises={allExercises} exerciseProgressData={exerciseProgressData} axisColor={axisColor} onShowHistory={handleShowHistory} />}
            {viewType === 'nutrition' && <NutritionView axisColor={axisColor} />}
            {viewType === 'records' && <RecordsView />}
            {viewType === 'bodyWeight' && <BodyWeightChart data={bodyWeightChartData} axisColor={axisColor} />}
            {viewType === 'calendar' && <CalendarView setDetailedLog={setDetailedLog} />}

            {detailedLog && <DailyDetailView logs={detailedLog} onClose={() => setDetailedLog(null)} />}
            {showHistoryModal && <ExerciseHistoryModal exerciseName={exerciseForHistory} workoutLog={workoutLog} onClose={() => setShowHistoryModal(false)} />}
        </div>
    );
};

export default React.memo(Progress);