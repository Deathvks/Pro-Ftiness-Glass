import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ResponsiveContainer, LineChart, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { ChevronLeft, ChevronRight, X, ChevronDown, Trash2, BookOpen, TrendingUp, BarChartHorizontal } from 'lucide-react'; // <-- Iconos añadidos
import GlassCard from '../components/GlassCard';
import ConfirmationModal from '../components/ConfirmationModal';
import ExerciseHistoryModal from './ExerciseHistoryModal';
import { getBestSet, calculateCalories } from '../utils/helpers';

// --- INICIO DE LA MODIFICACIÓN ---
const DailyDetailView = ({ logs, onClose, userProfile, deleteWorkoutLog }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [logToDelete, setLogToDelete] = useState(null);

    const handleDeleteClick = (log) => {
        setLogToDelete(log);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (logToDelete) {
            deleteWorkoutLog(logToDelete.id);
            setShowDeleteConfirm(false);
            setLogToDelete(null);
            if (logs.length === 1) {
                onClose();
            }
        }
    };

    const latestWeight = userProfile?.weight || 75;
    const visibleLogs = logs.filter(log => !logToDelete || log.id !== logToDelete.id);
    const totalDuration = visibleLogs.reduce((acc, log) => acc + log.duration_seconds, 0);
    const totalCalories = visibleLogs.reduce((acc, log) => acc + calculateCalories(log.duration_seconds, latestWeight), 0);

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
                <GlassCard className="relative w-full max-w-lg p-6 flex flex-col gap-4 m-4">
                    <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"><X size={20} /></button>
                    <div className="text-center pb-4 border-b border-glass-border">
                        <h3 className="text-xl font-bold">Resumen del Día</h3>
                        <p className="text-text-muted text-sm">{new Date(logs[0].workout_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <span className="text-sm text-text-secondary">Duración Total: <strong>{Math.round(totalDuration / 60)} min</strong></span>
                        </div>
                        <div>
                            <span className="text-sm text-text-secondary">Calorías (est.): <strong>{totalCalories} kcal</strong></span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 border-t border-glass-border pt-4 max-h-[45vh] overflow-y-auto">
                        <h4 className="font-semibold">Entrenamientos Registrados</h4>
                        {logs.map((log) => (
                            <div key={log.id} className="bg-bg-secondary rounded-md">
                                <div className="flex justify-between items-center p-3">
                                    <h5 className="font-bold text-accent">{log.routine_name}</h5>
                                    <button onClick={() => handleDeleteClick(log)} className="p-2 -m-2 rounded-full text-text-muted hover:bg-red/20 hover:text-red transition">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="px-3 pb-3 space-y-3">
                                    {log.WorkoutLogDetails.map((exercise, exIdx) => (
                                        <div key={exIdx} className="bg-bg-primary p-3 rounded-md">
                                            <p className="font-semibold mb-2">{exercise.exercise_name}</p>
                                            {/* Nuevos datos de volumen y mejor serie */}
                                            <div className="flex gap-4 text-xs text-text-muted mb-2">
                                                <div className="flex items-center gap-1"><BarChartHorizontal size={12} /><span>Volumen: <strong>{exercise.total_volume} kg</strong></span></div>
                                                <div className="flex items-center gap-1"><TrendingUp size={12} /><span>Mejor Set: <strong>{exercise.best_set_weight} kg</strong></span></div>
                                            </div>
                                            <ul className="space-y-2 text-sm">
                                                {exercise.WorkoutLogSets && exercise.WorkoutLogSets.length > 0 ? (
                                                    exercise.WorkoutLogSets.map((set, setIdx) => (
                                                        <li key={setIdx} className="bg-bg-secondary/50 p-2 rounded">
                                                            Serie {set.set_number}: <strong>{set.reps} reps</strong> con <strong>{set.weight_kg} kg</strong>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="text-text-muted">No se registraron series.</li>
                                                )}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
            {showDeleteConfirm && (
                <ConfirmationModal
                    message="¿Estás seguro de que quieres borrar este entrenamiento? Esta acción no se puede deshacer."
                    onConfirm={confirmDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
        </>
    );
};
// --- FIN DE LA MODIFICACIÓN ---

// ... (El resto de los componentes y la lógica de Progress.jsx se mantienen igual por ahora)
const CalendarView = ({ workoutLog, setDetailedLog }) => {
    const [calendarDate, setCalendarDate] = useState(new Date());

    const workoutsByDate = useMemo(() => {
        return workoutLog.reduce((acc, log) => {
            const dateStr = new Date(log.workout_date).toISOString().split('T')[0];
            if (!acc[dateStr]) { acc[dateStr] = []; }
            acc[dateStr].push(log);
            return acc;
        }, {});
    }, [workoutLog]);

    const handleDayClick = (dateStr) => {
        const logsForDay = workoutsByDate[dateStr];
        if (logsForDay && logsForDay.length > 0) {
            setDetailedLog(logsForDay);
        }
    };

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthName = calendarDate.toLocaleString('es-ES', { month: 'long' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];
    const startDayOffset = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

    for (let i = 0; i < startDayOffset; i++) {
        days.push(<div key={`prev-${i}`} className="aspect-square"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = new Date(year, month, day).toISOString().split('T')[0];
        const hasWorkout = !!workoutsByDate[dateStr];
        days.push(
            <button
                key={day}
                disabled={!hasWorkout}
                onClick={() => handleDayClick(dateStr)}
                className={`flex items-center justify-center aspect-square rounded-full font-semibold transition-colors duration-200 ${hasWorkout
                    ? 'bg-accent text-bg-secondary hover:bg-accent/80 cursor-pointer'
                    : 'text-text-secondary'
                    }`}
            >
                {day}
            </button>
        );
    }

    return (
        <GlassCard className="p-6 max-w-xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCalendarDate(d => new Date(d.setMonth(d.getMonth() - 1)))} className="p-2 rounded-full hover:bg-white/10"><ChevronLeft /></button>
                <h2 className="text-xl font-bold capitalize">{monthName} {year}</h2>
                <button onClick={() => setCalendarDate(d => new Date(d.setMonth(d.getMonth() + 1)))} className="p-2 rounded-full hover:bg-white/10"><ChevronRight /></button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs text-text-secondary font-bold mb-2">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {days}
            </div>
        </GlassCard>
    );
};
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const formattedLabel = new Date(label).toLocaleDateString('es-ES', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        return (
            <div className="p-2 bg-bg-secondary border border-glass-border rounded-md shadow-lg text-sm">
                <p className="font-semibold text-text-secondary">{formattedLabel}</p>
                <p className="text-text-primary">{`Peso (kg) : ${payload[0].value.toFixed(1)}`}</p>
            </div>
        );
    }
    return null;
};
const Progress = ({ workoutLog, bodyWeightLog, darkMode, userProfile, deleteWorkoutLog }) => {
    const [viewType, setViewType] = useState('exercise');
    const [detailedLog, setDetailedLog] = useState(null);
    const [selectedExercise, setSelectedExercise] = useState('');
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const selectorRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectorRef.current && !selectorRef.current.contains(event.target)) {
                setIsSelectorOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const bodyWeightChartData = useMemo(() => {
        return bodyWeightLog
            .map(log => {
                const weight = parseFloat(log.weight_kg);
                if (isNaN(weight)) {
                    return null;
                }
                const logDate = new Date(log.log_date);
                return {
                    timestamp: logDate.getTime(),
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
        const getWeekKey = (date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const startOfWeek = new Date(d.setDate(diff));
            return startOfWeek.toISOString().split('T')[0];
        };

        const weeklyMaxes = {};

        workoutLog.forEach(log => {
            const weekKey = getWeekKey(log.workout_date);
            if (log.WorkoutLogDetails) {
                log.WorkoutLogDetails.forEach(detail => {
                    const bestSet = getBestSet(detail.WorkoutLogSets);
                    const weight = parseFloat(bestSet.weight_kg) || 0;

                    if (weight > 0) {
                        if (!weeklyMaxes[detail.exercise_name]) {
                            weeklyMaxes[detail.exercise_name] = {};
                        }
                        const currentMax = weeklyMaxes[detail.exercise_name][weekKey] || 0;
                        if (weight > currentMax) {
                            weeklyMaxes[detail.exercise_name][weekKey] = weight;
                        }
                    }
                });
            }
        });

        const progress = {};
        for (const exerciseName in weeklyMaxes) {
            progress[exerciseName] = Object.entries(weeklyMaxes[exerciseName])
                .map(([weekKey, maxWeight]) => ({
                    date: weekKey,
                    name: new Date(weekKey).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
                    'Peso Máximo (kg)': maxWeight,
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        return progress;
    }, [workoutLog]);

    useEffect(() => {
        if (allExercises.length > 0 && !selectedExercise) {
            setSelectedExercise(allExercises[0]);
        }
    }, [allExercises, selectedExercise]);

    const weeklyCaloriesData = useMemo(() => {
        const last7Days = {};
        const today = new Date();
        const latestWeight = bodyWeightLog.length > 0 ? parseFloat(bodyWeightLog[0].weight_kg) : userProfile?.weight || 75;
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            last7Days[key] = { name: d.toLocaleDateString('es-ES', { weekday: 'short' }), 'Calorías': 0 };
        }
        workoutLog.forEach(log => {
            const logDate = new Date(log.workout_date).toISOString().split('T')[0];
            if (last7Days[logDate]) {
                last7Days[logDate]['Calorías'] += calculateCalories(log.duration_seconds, latestWeight);
            }
        });
        return Object.values(last7Days);
    }, [workoutLog, bodyWeightLog, userProfile]);

    const handleSelectExercise = (exercise) => {
        setSelectedExercise(exercise);
        setIsSelectorOpen(false);
    };

    const axisColor = darkMode ? "#94a3b8" : "#475569";

    return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <h1 className="text-4xl font-extrabold">Tu Progreso</h1>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setViewType('exercise')} className={`px-4 py-2 text-sm font-semibold rounded-full transition ${viewType === 'exercise' ? 'bg-accent text-bg-secondary' : 'bg-bg-secondary hover:bg-white/10'}`}>Por Ejercicio</button>
                    <button onClick={() => setViewType('bodyWeight')} className={`px-4 py-2 text-sm font-semibold rounded-full transition ${viewType === 'bodyWeight' ? 'bg-accent text-bg-secondary' : 'bg-bg-secondary hover:bg-white/10'}`}>Peso Corporal</button>
                    <button onClick={() => setViewType('calories')} className={`px-4 py-2 text-sm font-semibold rounded-full transition ${viewType === 'calories' ? 'bg-accent text-bg-secondary' : 'bg-bg-secondary hover:bg-white/10'}`}>Calorías</button>
                    <button onClick={() => setViewType('calendar')} className={`px-4 py-2 text-sm font-semibold rounded-full transition ${viewType === 'calendar' ? 'bg-accent text-bg-secondary' : 'bg-bg-secondary hover:bg-white/10'}`}>Calendario</button>
                </div>
            </div>

            {viewType === 'bodyWeight' && (
                <GlassCard className="p-6">
                    <h2 className="text-xl font-bold mb-4">Evolución del Peso</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={bodyWeightChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                            <XAxis
                                type="number"
                                dataKey="timestamp"
                                domain={['dataMin', 'dataMax']}
                                tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                                stroke={axisColor}
                                fontSize={12}
                            />
                            <YAxis
                                stroke={axisColor}
                                fontSize={12}
                                domain={[
                                    dataMin => (Math.floor(dataMin / 5) * 5) - 5,
                                    dataMax => (Math.ceil(dataMax / 5) * 5) + 5
                                ]}
                                allowDataOverflow={true}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ color: axisColor }} />
                            <Line type="monotone" dataKey="Peso (kg)" stroke="#facc15" strokeWidth={2} dot={{ r: 4, fill: '#facc15' }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </GlassCard>
            )}

            {viewType === 'calories' && (
                <GlassCard className="p-6">
                    <h2 className="text-xl font-bold mb-4">Calorías Quemadas (Últimos 7 días)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={weeklyCaloriesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                            <XAxis dataKey="name" stroke={axisColor} fontSize={12} />
                            <YAxis stroke={axisColor} fontSize={12} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-accent-transparent)' }} />
                            <Bar dataKey="Calorías" fill="#facc15" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
            )}

            {viewType === 'calendar' && <CalendarView workoutLog={workoutLog} setDetailedLog={setDetailedLog} />}

            {viewType === 'exercise' && (
                <div className="flex flex-col gap-6">
                    <div className="flex items-end gap-4">
                        <div className="relative w-full max-w-xs z-10" ref={selectorRef}>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Selecciona un ejercicio</label>
                            <button onClick={() => setIsSelectorOpen(!isSelectorOpen)} className="flex items-center justify-between w-full p-3 bg-bg-secondary border border-glass-border rounded-md">
                                <span>{selectedExercise || 'Elige un ejercicio'}</span>
                                <ChevronDown size={20} className={`transition-transform duration-200 ${isSelectorOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isSelectorOpen && (
                                <div className="absolute top-full mt-2 w-full bg-bg-secondary border border-glass-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {allExercises.length > 0 ? (
                                        allExercises.map(ex => <button key={ex} onClick={() => handleSelectExercise(ex)} className="block w-full text-left px-4 py-2 hover:bg-accent-transparent">{ex}</button>)
                                    ) : (<div className="px-4 py-2 text-text-muted">No hay ejercicios</div>)}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowHistoryModal(true)}
                            disabled={!selectedExercise}
                            className="p-3 rounded-md bg-bg-secondary border border-glass-border text-text-secondary transition enabled:hover:text-accent enabled:hover:border-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Ver historial detallado"
                        >
                            <BookOpen size={20} />
                        </button>
                    </div>

                    <GlassCard className="p-6">
                        <h2 className="text-xl font-bold mb-4">Progresión de Peso Máximo Semanal</h2>
                        {selectedExercise && exerciseProgressData[selectedExercise] && exerciseProgressData[selectedExercise].length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={exerciseProgressData[selectedExercise]} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                                    <XAxis dataKey="name" stroke={axisColor} fontSize={12} />
                                    <YAxis stroke={axisColor} fontSize={12} domain={['dataMin - 5', 'dataMax + 5']} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: axisColor }} />
                                    <Line type="monotone" dataKey="Peso Máximo (kg)" stroke="#818cf8" strokeWidth={2} dot={{ r: 4, fill: '#818cf8' }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-text-muted">
                                <p>No hay datos de progreso para mostrar.</p>
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}

            {detailedLog && <DailyDetailView logs={detailedLog} onClose={() => setDetailedLog(null)} userProfile={userProfile} deleteWorkoutLog={deleteWorkoutLog} />}

            {showHistoryModal && (
                <ExerciseHistoryModal
                    exerciseName={selectedExercise}
                    workoutLog={workoutLog}
                    onClose={() => setShowHistoryModal(false)}
                />
            )}
        </div>
    );
};

export default Progress;
