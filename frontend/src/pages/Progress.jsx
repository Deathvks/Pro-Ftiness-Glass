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
import GlassCard from '../components/GlassCard';

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

const TABS = [
    { id: 'heatmap', label: 'Mapa Muscular' },
    { id: 'exercise', label: 'Ejercicios' },
    { id: 'nutrition', label: 'Nutrición' },
    { id: 'records', label: 'Récords' },
    { id: 'bodyWeight', label: 'Peso Corporal' },
    { id: 'measurements', label: 'Medidas' },
    { id: 'calendar', label: 'Calendario' }
];

const Progress = ({ darkMode }) => {
    const { t } = useTranslation(['exercise_names', 'exercise_ui', 'exercise_muscles']);

    const { workoutLog, bodyWeightLog, exercises, getOrFetchAllExercises } = useAppStore(state => ({
        workoutLog: state.workoutLog,
        bodyWeightLog: state.bodyWeightLog,
        exercises: state.allExercises || [],
        getOrFetchAllExercises: state.getOrFetchAllExercises
    }));

    const [viewType, setViewType] = useState(() => {
        try {
            return localStorage.getItem('progressViewType') || 'heatmap';
        } catch {
            return 'heatmap';
        }
    });

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
                    let matches = false;
                    const tName = ex.name ? ex.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';

                    if (ex.muscle_group) {
                        const groups = ex.muscle_group.split(',').map(g => g.trim().toLowerCase());
                        matches = groups.some(g => {
                            const mapped = DB_TO_HEATMAP_MAP[g];
                            return mapped && mapped.includes(muscleKey);
                        });
                    }
                    
                    if (!matches && ex.name) {
                        const guessed = guessMuscleFromText(ex.name);
                        matches = guessed.includes(muscleKey);
                    }

                    if (matches) {
                        if (muscleKey === 'chest' && (tName.includes('jalon') || tName.includes('pulldown') || tName.includes('remo') || tName.includes('row') || tName.includes('face pull') || tName.includes('espalda'))) {
                            matches = false; 
                        }
                        if ((muscleKey === 'front-deltoids' || muscleKey === 'back-deltoids') && (tName.includes('gemelo') || tName.includes('calf') || tName.includes('pierna') || tName.includes('leg'))) {
                            matches = false; 
                        }
                        if ((muscleKey === 'quadriceps' || muscleKey === 'hamstring' || muscleKey === 'gluteal' || muscleKey === 'calves') && (tName.includes('banca') || tName.includes('bench') || tName.includes('pecho') || tName.includes('chest') || tName.includes('push-up') || tName.includes('flexiones'))) {
                            matches = false;
                        }
                        if ((muscleKey === 'biceps' || muscleKey === 'triceps') && (tName.includes('apreton') || tName.includes('hand grip') || tName.includes('handgrip') || tName.includes('muñeca') || tName.includes('wrist') || tName.includes('antebrazo') || tName.includes('forearm'))) {
                            matches = false;
                        }
                        if (muscleKey === 'abs' && (tName.includes('bird dog') || tName.includes('pajaro') || tName.includes('perro') || tName.includes('good morning') || tName.includes('buenos dias') || tName.includes('lumbar') || tName.includes('hiperextension') || tName.includes('remo') || tName.includes('row'))) {
                            matches = false;
                        }
                    }

                    return matches;
                });

                if (possibleExercises.length > 0) {
                    const randomEx = possibleExercises[Math.floor(Math.random() * possibleExercises.length)];
                    return {
                        muscle: MUSCLE_NAMES_ES[muscleKey] || muscleKey,
                        exercise: randomEx.name
                    };
                }

                return null;
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

    return (
        <div className="w-full max-w-7xl mx-auto px-4 pt-6 pb-28 md:p-6 md:pb-8 lg:p-10 lg:pb-8 animate-[fade-in_0.5s_ease-out]">
            <Helmet>
                <html lang="es" />
                <title>Tu Progreso - Pro Fitness Glass</title>
                <meta name="description" content="Visualiza tu progreso muscular, fuerza y estadísticas." />
            </Helmet>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                <h1 className="hidden md:block text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight mt-4 md:mt-0">
                    Tu Progreso
                </h1>

                {/* NUEVO CONTENEDOR DE PESTAÑAS (PILLS) */}
                <div className="flex overflow-x-auto pb-4 pt-1 px-1 -mx-1 gap-2.5 no-scrollbar mask-linear-fade items-center">
                    {TABS.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setViewType(tab.id)} 
                            className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap outline-none ${
                                viewType === tab.id 
                                    ? 'bg-accent text-white shadow-lg shadow-accent/30 scale-105' 
                                    : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
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
                        <div className="mt-8 w-full max-w-md animate-fade-in-up">
                            <div className="space-y-3 min-h-[100px]">
                                {displayedSuggestions.map((suggestion, idx) => (
                                    <GlassCard
                                        key={idx}
                                        className="glass p-5 rounded-[24px] flex items-center gap-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border-none ring-1 ring-black/5 dark:ring-white/10 group"
                                    >
                                        <div className="p-3 rounded-[16px] bg-accent/10 text-accent shrink-0 group-hover:scale-110 transition-transform">
                                            <Lightbulb size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-accent mb-1">
                                                Punto a mejorar: {suggestion.muscle}
                                            </h4>
                                            <p className="text-xs text-text-secondary leading-relaxed">
                                                Baja frecuencia en últimos entrenos.<br />
                                                Prueba añadir <strong className="text-text-primary">
                                                    {t(suggestion.exercise, { ns: 'exercise_names', defaultValue: suggestion.exercise })}
                                                </strong>.
                                            </p>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 px-4">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={suggestionsPage === 0}
                                        className="p-2.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-text-secondary"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>

                                    <span className="text-sm text-text-secondary font-bold">
                                        {suggestionsPage + 1} / {totalPages}
                                    </span>

                                    <button
                                        onClick={handleNextPage}
                                        disabled={suggestionsPage === totalPages - 1}
                                        className="p-2.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-text-secondary"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <GlassCard className="glass mt-10 text-center max-w-md p-6 rounded-[28px] space-y-4 border-none ring-1 ring-black/5 dark:ring-white/10">
                        <p className="text-sm text-text-primary">
                            <strong>¿Cómo funciona?</strong> La intensidad es relativa a tu músculo más entrenado en los últimos 30 días (Referencia 100%).
                        </p>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-text-secondary text-left w-full max-w-[280px] mx-auto font-medium">
                            <li>• Máximo: 75-100%</li>
                            <li>• Alto: 50-75%</li>
                            <li>• Medio: 25-50%</li>
                            <li>• Bajo: Menos del 25%</li>
                        </ul>
                        <div className="pt-4 border-t border-black/5 dark:border-white/10">
                            <span className="text-xs font-semibold text-accent/80 uppercase tracking-widest">
                                Haz click en el modelo para girarlo
                            </span>
                        </div>
                    </GlassCard>
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