/* frontend/src/components/progress/CalendarView.jsx */
import React, { useState, useMemo } from 'react';
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar as CalendarIcon, 
    Flame, 
    Clock, 
    Dumbbell, 
    TrendingUp, 
    Sparkles, 
    RotateCcw,
    CheckCircle2
} from 'lucide-react';
import GlassCard from '../GlassCard';
import useAppStore from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

const CalendarView = ({ setDetailedLog, workouts, className = '' }) => {
    const { workoutLog: storeWorkoutLog, routines } = useAppStore(
        useShallow(state => ({ 
            workoutLog: state.workoutLog,
            routines: state.routines || []
        }))
    );
    const workoutLog = workouts || storeWorkoutLog || [];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedDateStr, setSelectedDateStr] = useState(todayStr);

    // Mapeo de entrenamientos por fecha local 'YYYY-MM-DD'
    const workoutsByDate = useMemo(() => {
        return workoutLog.reduce((acc, log) => {
            const date = new Date(log.workout_date);
            if (isNaN(date.getTime())) return acc;
            const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            if (!acc[localDateStr]) { acc[localDateStr] = []; }
            acc[localDateStr].push(log);

            // Si el entrenamiento terminó después de medianoche, también incluirlo en el día de finalización
            if (log.duration_seconds && log.duration_seconds > 0) {
                const endDate = new Date(date.getTime() + log.duration_seconds * 1000);
                const endLocalDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
                if (endLocalDateStr !== localDateStr) {
                    if (!acc[endLocalDateStr]) { acc[endLocalDateStr] = []; }
                    if (!acc[endLocalDateStr].some(l => l.id === log.id)) {
                        acc[endLocalDateStr].push(log);
                    }
                }
            }

            return acc;
        }, {});
    }, [workoutLog]);

    // Obtener nombre representativo de la rutina
    const getRoutineName = (log) => {
        if (!log) return 'Entrenamiento';
        const found = routines.find(r => r.id === log.routine_id);
        return found?.name || log.routine_name || 'Entrenamiento';
    };

    // Calcular volumen total en kg de un registro
    const calculateLogVolume = (log) => {
        let vol = 0;
        if (log?.WorkoutLogDetails) {
            log.WorkoutLogDetails.forEach(detail => {
                (detail.WorkoutLogSets || []).forEach(set => {
                    const w = parseFloat(set.weight_kg) || 0;
                    const r = parseFloat(set.reps) || 0;
                    vol += w * r;
                });
            });
        }
        return vol;
    };

    // Formatear duración en segundos a texto legible
    const formatDuration = (seconds) => {
        const s = Math.round(Number(seconds) || 0);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m} min`;
    };

    // Formatear volumen a kg o toneladas
    const formatVolume = (kg) => {
        if (kg >= 10000) {
            return `${(kg / 1000).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`;
        }
        return `${Math.round(kg).toLocaleString('es-ES')} kg`;
    };

    // Estadísticas del mes visualizado
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthName = calendarDate.toLocaleString('es-ES', { month: 'long' });

    const monthStats = useMemo(() => {
        const logsInMonth = workoutLog.filter(log => {
            const d = new Date(log.workout_date);
            return d.getFullYear() === year && d.getMonth() === month;
        });

        let totalSeconds = 0;
        let totalCalories = 0;
        let totalVolumeKg = 0;

        logsInMonth.forEach(log => {
            totalSeconds += (log.duration_seconds || log.duration || 0);
            totalCalories += (log.calories_burned || 0);
            totalVolumeKg += calculateLogVolume(log);
        });

        const uniqueDays = new Set(logsInMonth.map(l => {
            const d = new Date(l.workout_date);
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        })).size;

        // Ordenar entrenamientos del mes cronológicamente descendente
        const sortedLogs = [...logsInMonth].sort((a, b) => new Date(b.workout_date) - new Date(a.workout_date));

        return {
            count: logsInMonth.length,
            uniqueDays,
            totalSeconds,
            totalCalories,
            totalVolumeKg,
            logs: sortedLogs
        };
    }, [workoutLog, year, month]);

    // Navegación segura entre meses (evita desborde de días 31)
    const handlePrevMonth = () => {
        setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleResetToday = () => {
        const currentDate = new Date();
        setCalendarDate(currentDate);
        setSelectedDateStr(todayStr);
    };

    const handleDayClick = (dateStr) => {
        setSelectedDateStr(dateStr);
        const logsForDay = workoutsByDate[dateStr];
        if (logsForDay && logsForDay.length > 0) {
            setDetailedLog(logsForDay);
        }
    };

    // Generar cuadrícula de días del mes
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startDayOffset = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

    const calendarGridCells = [];
    for (let i = 0; i < startDayOffset; i++) {
        calendarGridCells.push(<div key={`empty-prev-${i}`} className="aspect-square"></div>);
    }

    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
    const currentDayNumber = now.getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(year, month, day);
        const dayStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
        const dayLogs = workoutsByDate[dayStr] || [];
        const hasWorkout = dayLogs.length > 0;
        const isToday = isCurrentMonth && currentDayNumber === day;
        const isSelected = selectedDateStr === dayStr;

        calendarGridCells.push(
            <button
                key={day}
                type="button"
                onClick={() => handleDayClick(dayStr)}
                className={`relative flex flex-col items-center justify-center aspect-square rounded-[18px] sm:rounded-2xl text-sm sm:text-base transition-all duration-200 outline-none select-none
                    ${isSelected 
                        ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-primary font-black z-10 scale-105 shadow-md' 
                        : ''}
                    ${hasWorkout
                        ? 'bg-accent text-accent-contrast font-extrabold shadow-sm hover:scale-110 active:scale-95 cursor-pointer'
                        : isToday 
                            ? 'bg-black/5 dark:bg-white/10 text-text-primary font-bold ring-1 ring-black/10 dark:ring-white/20'
                            : 'text-text-secondary font-medium opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer'
                    }`}
            >
                <span>{day}</span>
                {hasWorkout && dayLogs.length > 1 && (
                    <span className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 w-3.5 h-3.5 text-[9px] font-black bg-bg-primary text-text-primary rounded-full flex items-center justify-center shadow-xs">
                        {dayLogs.length}
                    </span>
                )}
                {hasWorkout && dayLogs.length === 1 && (
                    <span className="w-1 h-1 rounded-full bg-accent-contrast/70 mt-0.5"></span>
                )}
            </button>
        );
    }

    // Datos del día seleccionado
    const selectedDayLogs = workoutsByDate[selectedDateStr] || [];
    const formattedSelectedDate = useMemo(() => {
        if (!selectedDateStr) return '';
        const parts = selectedDateStr.split('-');
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }, [selectedDateStr]);

    const isBrowsingOtherMonth = !isCurrentMonth;

    return (
        <div className={`w-full max-w-7xl mx-auto space-y-6 animate-[fade-in_0.3s_ease-out] ${className}`}>
            
            {/* 1. KPI Cards del Mes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <GlassCard className="glass p-4 sm:p-5 rounded-[24px] border border-glass-border flex flex-col justify-between hover:scale-[1.01] transition-transform">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Sesiones</span>
                        <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center">
                            <Dumbbell size={16} />
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl sm:text-3xl font-extrabold text-text-primary">{monthStats.count}</span>
                        <p className="text-[11px] text-text-secondary font-medium mt-0.5">
                            {monthStats.uniqueDays} {monthStats.uniqueDays === 1 ? 'día activo' : 'días activos'}
                        </p>
                    </div>
                </GlassCard>

                <GlassCard className="glass p-4 sm:p-5 rounded-[24px] border border-glass-border flex flex-col justify-between hover:scale-[1.01] transition-transform">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Tiempo</span>
                        <div className="w-8 h-8 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center">
                            <Clock size={16} />
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl sm:text-3xl font-extrabold text-text-primary">
                            {formatDuration(monthStats.totalSeconds)}
                        </span>
                        <p className="text-[11px] text-text-secondary font-medium mt-0.5 capitalize">
                            En {monthName}
                        </p>
                    </div>
                </GlassCard>

                <GlassCard className="glass p-4 sm:p-5 rounded-[24px] border border-glass-border flex flex-col justify-between hover:scale-[1.01] transition-transform">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Volumen</span>
                        <div className="w-8 h-8 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl sm:text-3xl font-extrabold text-text-primary">
                            {formatVolume(monthStats.totalVolumeKg)}
                        </span>
                        <p className="text-[11px] text-text-secondary font-medium mt-0.5">
                            Carga total levantada
                        </p>
                    </div>
                </GlassCard>

                <GlassCard className="glass p-4 sm:p-5 rounded-[24px] border border-glass-border flex flex-col justify-between hover:scale-[1.01] transition-transform">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Calorías</span>
                        <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center">
                            <Flame size={16} />
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl sm:text-3xl font-extrabold text-text-primary">
                            {monthStats.totalCalories > 0 ? monthStats.totalCalories.toLocaleString('es-ES') : '—'}
                        </span>
                        <p className="text-[11px] text-text-secondary font-medium mt-0.5">
                            kcal estimadas
                        </p>
                    </div>
                </GlassCard>
            </div>

            {/* 2. Grid Principal: Calendario a la izquierda, Detalle e Historial a la derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Columna Izquierda: Calendario */}
                <div className="lg:col-span-7 xl:col-span-7 space-y-6">
                    <GlassCard className="glass w-full p-5 sm:p-7 rounded-[32px] border border-glass-border shadow-sm">
                        
                        {/* Header del Calendario */}
                        <div className="flex items-center justify-between mb-6 bg-black/5 dark:bg-white/5 p-2 rounded-full ring-1 ring-black/5 dark:ring-white/10">
                            <button 
                                onClick={handlePrevMonth} 
                                className="p-2.5 rounded-full bg-bg-primary text-text-secondary hover:text-text-primary transition-all active:scale-95 shadow-xs"
                                title="Mes anterior"
                            >
                                <ChevronLeft size={20} strokeWidth={2.5} />
                            </button>
                            
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-xl font-extrabold text-text-primary capitalize tracking-tight flex items-center gap-2">
                                    <CalendarIcon size={18} className="text-accent hidden sm:inline-block" />
                                    {monthName} <span className="text-accent">{year}</span>
                                </h2>
                                {isBrowsingOtherMonth && (
                                    <button
                                        onClick={handleResetToday}
                                        className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-accent/15 text-accent hover:bg-accent/25 transition-all flex items-center gap-1 active:scale-95"
                                        title="Volver a hoy"
                                    >
                                        <RotateCcw size={11} />
                                        Hoy
                                    </button>
                                )}
                            </div>
                            
                            <button 
                                onClick={handleNextMonth} 
                                className="p-2.5 rounded-full bg-bg-primary text-text-secondary hover:text-text-primary transition-all active:scale-95 shadow-xs"
                                title="Mes siguiente"
                            >
                                <ChevronRight size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Días de la semana */}
                        <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center mb-4 border-b border-black/5 dark:border-white/10 pb-4">
                            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                                <div key={d} className="text-[11px] font-black text-text-tertiary uppercase tracking-widest">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Grid del mes */}
                        <div className="grid grid-cols-7 gap-2 sm:gap-3">
                            {calendarGridCells}
                        </div>
                        
                        {/* Leyenda */}
                        <div className="mt-8 pt-4 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-accent shadow-xs"></div>
                                <span className="text-xs font-bold text-text-secondary">Entrenamiento</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-black/5 dark:bg-white/10 ring-1 ring-black/10 dark:ring-white/20"></div>
                                <span className="text-xs font-bold text-text-secondary">Descanso / Libre</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full border-2 border-accent"></div>
                                <span className="text-xs font-bold text-text-secondary">Seleccionado</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Columna Derecha: Resumen del Día Seleccionado y Lista del Mes */}
                <div className="lg:col-span-5 xl:col-span-5 space-y-6">
                    
                    {/* Tarjeta del Día Seleccionado */}
                    <GlassCard className="glass p-5 sm:p-6 rounded-[28px] border border-glass-border shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/5 dark:border-white/10">
                            <div>
                                <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">Día Seleccionado</span>
                                <h3 className="text-base sm:text-lg font-extrabold text-text-primary capitalize mt-0.5">
                                    {formattedSelectedDate}
                                </h3>
                            </div>
                            {selectedDayLogs.length > 0 && (
                                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/20">
                                    {selectedDayLogs.length} {selectedDayLogs.length === 1 ? 'sesión' : 'sesiones'}
                                </span>
                            )}
                        </div>

                        {selectedDayLogs.length > 0 ? (
                            <div className="space-y-3">
                                {selectedDayLogs.map((log) => {
                                    const exercisesCount = log.WorkoutLogDetails?.length || 0;
                                    const setsCount = log.WorkoutLogDetails?.reduce((acc, ex) => acc + (ex.WorkoutLogSets?.length || 0), 0) || 0;
                                    const durationMin = Math.round((log.duration_seconds || log.duration || 0) / 60);
                                    const volumeKg = calculateLogVolume(log);

                                    return (
                                        <div 
                                            key={log.id} 
                                            className="p-4 rounded-2xl bg-bg-secondary border border-glass-border space-y-3"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h4 className="font-extrabold text-text-primary text-base">
                                                        {getRoutineName(log)}
                                                    </h4>
                                                    <p className="text-xs text-text-secondary mt-0.5">
                                                        {exercisesCount} ejercicios · {setsCount} series
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full">
                                                    <Clock size={12} />
                                                    {durationMin} min
                                                </div>
                                            </div>

                                            {volumeKg > 0 && (
                                                <div className="flex items-center gap-4 text-xs text-text-secondary pt-1 border-t border-black/5 dark:border-white/5">
                                                    <span className="flex items-center gap-1 font-medium">
                                                        <TrendingUp size={12} className="text-purple-400" />
                                                        Volumen: <strong className="text-text-primary">{formatVolume(volumeKg)}</strong>
                                                    </span>
                                                    {log.calories_burned > 0 && (
                                                        <span className="flex items-center gap-1 font-medium">
                                                            <Flame size={12} className="text-amber-400" />
                                                            <strong className="text-text-primary">{log.calories_burned}</strong> kcal
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <button
                                    onClick={() => setDetailedLog(selectedDayLogs)}
                                    className="w-full mt-2 py-3 px-4 rounded-2xl bg-accent text-accent-contrast font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md shadow-accent/20 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={16} />
                                    Ver detalles y ejercicios completos
                                </button>
                            </div>
                        ) : (
                            <div className="py-6 px-4 text-center rounded-2xl bg-bg-secondary/40 border border-dashed border-glass-border">
                                <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 text-text-tertiary flex items-center justify-center mx-auto mb-3">
                                    <Sparkles size={20} />
                                </div>
                                <h4 className="text-sm font-bold text-text-primary">Día de descanso</h4>
                                <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto leading-relaxed">
                                    No hay entrenamientos registrados este día. El descanso y la recuperación son fundamentales para progresar.
                                </p>
                            </div>
                        )}
                    </GlassCard>

                </div>
            </div>
            
        </div>
    );
};

export default CalendarView;