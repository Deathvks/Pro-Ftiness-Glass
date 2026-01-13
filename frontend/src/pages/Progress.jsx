/* frontend/src/pages/Progress.jsx */
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../store/useAppStore';
import ExerciseHistoryModal from './ExerciseHistoryModal';

import DailyDetailView from '../components/progress/DailyDetailView';
import CalendarView from '../components/progress/CalendarView';
import { BodyWeightChart } from '../components/progress/ProgressCharts';
import ExerciseView from '../components/progress/ExerciseView';
import NutritionView from '../components/progress/NutritionView';
import RecordsView from '../components/progress/RecordsView';
import MeasurementsView from '../components/progress/MeasurementsView';
import MuscleHeatmap from '../components/MuscleHeatmap/MuscleHeatmap';

import {
    DB_TO_HEATMAP_MAP,
    guessMuscleFromText,
    SUGGESTED_EXERCISES,
    MUSCLE_NAMES_ES
} from '../utils/muscleUtils';

const INTENSITY_LEVELS = [
    { label: 'Bajo', color: '#00f2ff' },
    { label: 'Medio', color: '#00ff88' },
    { label: 'Alto', color: '#ffea00' },
    { label: 'Máximo', color: '#ff0055' }
];

const Progress = ({ darkMode }) => {
    const { t } = useTranslation(['exercise_names', 'exercise_ui', 'exercise_muscles']);

    const { workoutLog, bodyWeightLog, exercises, getOrFetchAllExercises } = useAppStore(state => ({
        workoutLog: state.workoutLog,
        bodyWeightLog: state.bodyWeightLog,
        exercises: state.allExercises || [],
        getOrFetchAllExercises: state.getOrFetchAllExercises
    }));

    // --- CAMBIO: Inicializar estado desde localStorage ---
    const [viewType, setViewType] = useState(() => {
        try {
            return localStorage.getItem('progressViewType') || 'heatmap';
        } catch {
            return 'heatmap';
        }
    });

    // --- CAMBIO: Guardar estado en localStorage al cambiar ---
    useEffect(() => {
        try {
            localStorage.setItem('progressViewType', viewType);
        } catch (e) {
            console.error('Error guardando preferencia de vista', e);
        }
    }, [viewType]);

    const [detailedLog, setDetailedLog] = useState(null);
    const [exerciseForHistory, setExerciseForHistory] = useState('');
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [suggestionsPage, setSuggestionsPage] = useState(0);
    const SUGGESTIONS_PER_PAGE = 3;

    useEffect(() => {
        getOrFetchAllExercises();
    }, [getOrFetchAllExercises]);

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

    const executedExercisesList = useMemo(() => {
        const exerciseSet = new Set(
            workoutLog.flatMap(log => log.WorkoutLogDetails?.map(d => d.exercise_name) || [])
        );
        return Array.from(exerciseSet);
    }, [workoutLog]);

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

    const { muscleHeatmapData, weakPointSuggestions } = useMemo(() => {
        if (!workoutLog || workoutLog.length === 0) return { muscleHeatmapData: {}, weakPointSuggestions: [] };

        const scores = {};
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentLogs = workoutLog.filter(log => new Date(log.workout_date) >= thirtyDaysAgo);

        recentLogs.forEach(log => {
            log.WorkoutLogDetails?.forEach(detail => {
                const name = detail.exercise_name;
                const exerciseData = exercises?.find(e => e.name === name);
                let targetMuscles = [];

                if (exerciseData && exerciseData.muscle_group) {
                    const groups = exerciseData.muscle_group.split(',').map(g => g.trim().toLowerCase());
                    groups.forEach(g => {
                        if (DB_TO_HEATMAP_MAP[g]) {
                            targetMuscles.push(...DB_TO_HEATMAP_MAP[g]);
                        }
                    });
                }

                if (targetMuscles.length === 0) {
                    targetMuscles = guessMuscleFromText(name);
                }

                targetMuscles.forEach(muscleId => {
                    scores[muscleId] = (scores[muscleId] || 0) + 1;
                });
            });
        });

        const candidates = Object.keys(MUSCLE_NAMES_ES);
        let minScore = Infinity;
        candidates.forEach(c => {
            const s = scores[c] || 0;
            if (s < minScore) minScore = s;
        });

        const weakMuscles = candidates.filter(c => (scores[c] || 0) === minScore);

        const suggestions = weakMuscles
            .sort(() => 0.5 - Math.random())
            .map(muscleKey => {
                const possibleExercises = exercises.filter(ex => {
                    if (!ex.muscle_group) return false;
                    const groups = ex.muscle_group.split(',').map(g => g.trim().toLowerCase());
                    return groups.some(g => {
                        const mapped = DB_TO_HEATMAP_MAP[g];
                        return mapped && mapped.includes(muscleKey);
                    });
                });

                let selectedExerciseName = null;
                if (possibleExercises.length > 0) {
                    const randomEx = possibleExercises[Math.floor(Math.random() * possibleExercises.length)];
                    selectedExerciseName = randomEx.name;
                } else {
                    selectedExerciseName = SUGGESTED_EXERCISES[muscleKey];
                }

                if (!selectedExerciseName) return null;

                return {
                    muscle: MUSCLE_NAMES_ES[muscleKey] || muscleKey,
                    exercise: selectedExerciseName
                };
            })
            .filter(Boolean);

        const maxVal = Math.max(...Object.values(scores), 1);
        const normalized = {};
        Object.keys(scores).forEach(k => {
            normalized[k] = Math.max(2, Math.round((scores[k] / maxVal) * 10));
        });

        return { muscleHeatmapData: normalized, weakPointSuggestions: suggestions };
    }, [workoutLog, exercises]);

    useEffect(() => {
        setSuggestionsPage(0);
    }, [weakPointSuggestions.length]);

    const totalPages = Math.ceil(weakPointSuggestions.length / SUGGESTIONS_PER_PAGE);
    const displayedSuggestions = weakPointSuggestions.slice(
        suggestionsPage * SUGGESTIONS_PER_PAGE,
        (suggestionsPage + 1) * SUGGESTIONS_PER_PAGE
    );

    const handleNextPage = () => {
        setSuggestionsPage(prev => Math.min(prev + 1, totalPages - 1));
    };

    const handlePrevPage = () => {
        setSuggestionsPage(prev => Math.max(prev - 1, 0));
    };

    const handleShowHistory = (exerciseName) => {
        setExerciseForHistory(exerciseName);
        setShowHistoryModal(true);
    };

    const axisColor = darkMode ? "#94a3b8" : "#475569";
    const getTabClass = (type) => `px-4 py-2 text-sm font-semibold rounded-full transition whitespace-nowrap ${viewType === type ? 'bg-accent text-bg-secondary' : 'bg-bg-secondary text-text-secondary'}`;

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
                    <button onClick={() => setViewType('measurements')} className={getTabClass('measurements')}>Medidas</button>
                    <button onClick={() => setViewType('calendar')} className={getTabClass('calendar')}>Calendario</button>
                </div>
            </div>

            {viewType === 'heatmap' && (
                <div className="flex flex-col items-center animate-fade-in py-6 w-full">
                    <div className="w-full max-w-[300px] flex justify-center">
                        <MuscleHeatmap muscleData={muscleHeatmapData} darkMode={darkMode} />
                    </div>

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

                    {weakPointSuggestions.length > 0 && (
                        <div className="mt-6 w-full max-w-md animate-fade-in-up">
                            <div className="space-y-3 min-h-[100px]">
                                {displayedSuggestions.map((suggestion, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-xl p-4 flex items-start gap-4 shadow-sm backdrop-blur-sm transition-all hover:brightness-110"
                                        style={{
                                            background: 'linear-gradient(to bottom right, var(--color-accent-border), var(--color-accent-transparent))'
                                        }}
                                    >
                                        <div
                                            className="p-2 rounded-full text-white shrink-0"
                                            style={{ backgroundColor: 'var(--color-accent-border)' }}
                                        >
                                            <Lightbulb size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-accent mb-1">
                                                Punto a mejorar: {suggestion.muscle}
                                            </h4>
                                            <p className="text-xs text-text-secondary">
                                                Tiene baja frecuencia en tus últimos entrenos.
                                                <br />
                                                Prueba añadir <strong className="text-text-primary">
                                                    {t(suggestion.exercise, { ns: 'exercise_names', defaultValue: suggestion.exercise })}
                                                </strong>.
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 px-2">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={suggestionsPage === 0}
                                        className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-text-secondary"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>

                                    <span className="text-xs text-text-secondary font-medium">
                                        {suggestionsPage + 1} / {totalPages}
                                    </span>

                                    <button
                                        onClick={handleNextPage}
                                        disabled={suggestionsPage === totalPages - 1}
                                        className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-text-secondary"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="text-xs text-text-secondary mt-8 text-center max-w-md bg-bg-secondary/50 p-4 rounded-xl border border-white/5 backdrop-blur-md space-y-2">
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

            {viewType === 'exercise' && <ExerciseView allExercises={executedExercisesList} exerciseProgressData={exerciseProgressData} axisColor={axisColor} onShowHistory={handleShowHistory} />}
            {viewType === 'nutrition' && <NutritionView axisColor={axisColor} />}
            {viewType === 'records' && <RecordsView />}
            {viewType === 'bodyWeight' && <BodyWeightChart data={bodyWeightChartData} axisColor={axisColor} />}
            {viewType === 'measurements' && <MeasurementsView axisColor={axisColor} />}
            {viewType === 'calendar' && <CalendarView setDetailedLog={setDetailedLog} />}

            {detailedLog && <DailyDetailView logs={detailedLog} onClose={() => setDetailedLog(null)} />}
            {showHistoryModal && <ExerciseHistoryModal exerciseName={exerciseForHistory} workoutLog={workoutLog} onClose={() => setShowHistoryModal(false)} />}
        </div>
    );
};

export default React.memo(Progress);