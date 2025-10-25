/* frontend/src/pages/Progress.jsx */
import React, { useState, useMemo } from 'react';
// --- INICIO DE LA MODIFICACIÓN ---
import { Helmet } from 'react-helmet-async'; // Importamos Helmet
// --- FIN DE LA MODIFICACIÓN ---
import useAppStore from '../store/useAppStore';
import ExerciseHistoryModal from './ExerciseHistoryModal';

// --- INICIO DE LA CORRECCIÓN DE RUTAS ---
import DailyDetailView from '../components/progress/DailyDetailView';
import CalendarView from '../components/progress/CalendarView';
import { BodyWeightChart } from '../components/progress/ProgressCharts';
import ExerciseView from '../components/progress/ExerciseView';
import NutritionView from '../components/progress/NutritionView';
import RecordsView from '../components/progress/RecordsView';
// --- FIN DE LA CORRECCIÓN DE RUTAS ---

// --- INICIO DE LA MODIFICACIÓN ---
// Eliminamos userProfile y setView de las props/estado si ya no se usan aquí
const Progress = ({ darkMode }) => {
    const { workoutLog, bodyWeightLog } = useAppStore(state => ({
        workoutLog: state.workoutLog,
        bodyWeightLog: state.bodyWeightLog,
    }));
// --- FIN DE LA MODIFICACIÓN ---

    const [viewType, setViewType] = useState('exercise');
    const [detailedLog, setDetailedLog] = useState(null);
    const [exerciseForHistory, setExerciseForHistory] = useState('');
    const [showHistoryModal, setShowHistoryModal] = useState(false);

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

    const allExercises = useMemo(() => {
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
                    // --- INICIO DE LA MODIFICACIÓN ---
                    // Solo añadir si hay peso máximo o 1RM estimado
                    if (detail.best_set_weight > 0 || (detail.estimated_1rm && detail.estimated_1rm > 0)) {
                        if (!progress[detail.exercise_name]) progress[detail.exercise_name] = [];
                        progress[detail.exercise_name].push({
                            date: new Date(log.workout_date).getTime(),
                            'Peso Máximo (kg)': detail.best_set_weight || 0, // Asegurar que sea 0 si es null/undefined
                            '1RM Estimado (kg)': detail.estimated_1rm || 0, // Añadir el 1RM estimado
                        });
                    }
                    // --- FIN DE LA MODIFICACIÓN ---
                });
            }
        });

        for (const exerciseName in progress) {
            progress[exerciseName].sort((a, b) => a.date - b.date);
        }
        return progress;
    }, [workoutLog]);

    const handleShowHistory = (exerciseName) => {
        setExerciseForHistory(exerciseName);
        setShowHistoryModal(true);
    };

    const axisColor = darkMode ? "#94a3b8" : "#475569";

    const renderView = () => {
        switch (viewType) {
            case 'exercise':
                return <ExerciseView allExercises={allExercises} exerciseProgressData={exerciseProgressData} axisColor={axisColor} onShowHistory={handleShowHistory} />;
            case 'nutrition':
                return <NutritionView axisColor={axisColor} />;
            case 'records':
                return <RecordsView />;
            case 'bodyWeight':
                return <BodyWeightChart data={bodyWeightChartData} axisColor={axisColor} />;
            case 'calendar':
                return <CalendarView setDetailedLog={setDetailedLog} />;
            default:
                return null;
        }
    };

    return (
        // --- INICIO DE LA MODIFICACIÓN ---
        // Ajustamos padding
        <div className="w-full max-w-7xl mx-auto px-4 pb-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">

            {/* Añadimos Helmet para esta vista */}
            <Helmet>
                <title>Tu Progreso - Pro Fitness Glass</title>
                <meta name="description" content="Visualiza tu progreso en gráficos: evolución del peso corporal, progresión de fuerza por ejercicio, resumen nutricional mensual y calendario de entrenamientos." />
            </Helmet>
            {/* --- FIN DE LA MODIFICACIÓN --- */}

            {/* Header para Móvil (ELIMINADO) */}

            {/* Header para PC (modificado) */}
            <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            {/* --- FIN DE LA MODIFICACIÓN --- */}
                {/* --- INICIO DE LA MODIFICACIÓN --- */}
                {/* Añadimos margen superior para PC */}
                <h1 className="text-4xl font-extrabold mt-10 md:mt-0">Tu Progreso</h1>
                {/* --- FIN DE LA MODIFICACIÓN --- */}
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setViewType('exercise')} className={`px-4 py-2 text-sm font-semibold rounded-full transition ${viewType === 'exercise' ? 'bg-accent text-bg-secondary' : 'bg-bg-secondary hover:bg-white/10'}`}>Por Ejercicio</button>
                    <button onClick={() => setViewType('nutrition')} className={`px-4 py-2 text-sm font-semibold rounded-full transition ${viewType === 'nutrition' ? 'bg-accent text-bg-secondary' : 'bg-bg-secondary hover:bg-white/10'}`}>Nutrición</button>
                    <button onClick={() => setViewType('records')} className={`px-4 py-2 text-sm font-semibold rounded-full transition ${viewType === 'records' ? 'bg-accent text-bg-secondary' : 'bg-bg-secondary hover:bg-white/10'}`}>Récords</button>
                    <button onClick={() => setViewType('bodyWeight')} className={`px-4 py-2 text-sm font-semibold rounded-full transition ${viewType === 'bodyWeight' ? 'bg-accent text-bg-secondary' : 'bg-bg-secondary hover:bg-white/10'}`}>Peso Corporal</button>
                    <button onClick={() => setViewType('calendar')} className={`px-4 py-2 text-sm font-semibold rounded-full transition ${viewType === 'calendar' ? 'bg-accent text-bg-secondary' : 'bg-bg-secondary hover:bg-white/10'}`}>Calendario</button>
                </div>
            </div>

            {/* --- INICIO DE LA MODIFICACIÓN --- */}
            {/* Añadimos margen superior al contenedor de pestañas en móvil */}
            <div className="md:hidden flex flex-wrap gap-2 mt-6 sm:mt-0 mb-6">
                <button onClick={() => setViewType('exercise')} className={`px-4 py-2 text-sm font-semibold rounded-full transition ${viewType === 'exercise' ? 'bg-accent text-bg-secondary' : 'bg-bg-secondary hover:bg-white/10'}`}>Por Ejercicio</button>
                <button onClick={() => setViewType('nutrition')} className={`px-4 py-2 text-sm font-semibold rounded-full transition ${viewType === 'nutrition' ? 'bg-accent text-bg-secondary' : 'bg-bg-secondary hover:bg-white/10'}`}>Nutrición</button>
                <button onClick={() => setViewType('records')} className={`px-4 py-2 text-sm font-semibold rounded-full transition ${viewType === 'records' ? 'bg-accent text-bg-secondary' : 'bg-bg-secondary hover:bg-white/10'}`}>Récords</button>
                <button onClick={() => setViewType('bodyWeight')} className={`px-4 py-2 text-sm font-semibold rounded-full transition ${viewType === 'bodyWeight' ? 'bg-accent text-bg-secondary' : 'bg-bg-secondary hover:bg-white/10'}`}>Peso Corporal</button>
                <button onClick={() => setViewType('calendar')} className={`px-4 py-2 text-sm font-semibold rounded-full transition ${viewType === 'calendar' ? 'bg-accent text-bg-secondary' : 'bg-bg-secondary hover:bg-white/10'}`}>Calendario</button>
            </div>
            {/* --- FIN DE LA MODIFICACIÓN --- */}

            {renderView()}

            {detailedLog && <DailyDetailView logs={detailedLog} onClose={() => setDetailedLog(null)} />}
            {showHistoryModal && <ExerciseHistoryModal exerciseName={exerciseForHistory} workoutLog={workoutLog} onClose={() => setShowHistoryModal(false)} />}
        </div>
    );
};

export default React.memo(Progress);