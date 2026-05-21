/* frontend/src/components/progress/CalendarView.jsx */
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import GlassCard from '../GlassCard';
import useAppStore from '../../store/useAppStore';

const CalendarView = ({ setDetailedLog }) => {
    const { workoutLog } = useAppStore(state => ({ workoutLog: state.workoutLog }));
    const [calendarDate, setCalendarDate] = useState(new Date());

    const workoutsByDate = useMemo(() => {
        return workoutLog.reduce((acc, log) => {
            // Usar fecha local en lugar de UTC para evitar cambios de día
            const date = new Date(log.workout_date);
            const localDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            if (!acc[localDateStr]) { acc[localDateStr] = []; }
            acc[localDateStr].push(log);
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

    // Comprobar si el día es hoy para darle un estilo sutil
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const currentDay = today.getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        // Usar fecha local consistente en lugar de toISOString()
        const date = new Date(year, month, day);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const hasWorkout = !!workoutsByDate[dateStr];
        const isToday = isCurrentMonth && currentDay === day;

        days.push(
            <button
                key={day}
                disabled={!hasWorkout}
                onClick={() => handleDayClick(dateStr)}
                className={`flex items-center justify-center aspect-square rounded-[16px] sm:rounded-full text-sm sm:text-base transition-all duration-300 outline-none
                    ${hasWorkout
                        ? 'bg-accent text-white font-extrabold shadow-md shadow-accent/30 hover:scale-110 active:scale-95 cursor-pointer ring-2 ring-accent/30'
                        : isToday 
                            ? 'bg-black/5 dark:bg-white/5 text-text-primary font-bold ring-1 ring-black/10 dark:ring-white/20 opacity-70 cursor-default'
                            : 'text-text-secondary font-medium opacity-50 cursor-default hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
            >
                {day}
            </button>
        );
    }

    return (
        <GlassCard className="glass w-full max-w-xl mx-auto p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 animate-[fade-in_0.3s_ease-out]">
            
            {/* Header del Calendario */}
            <div className="flex justify-between items-center mb-6 bg-black/5 dark:bg-white/5 p-2 rounded-full ring-1 ring-black/5 dark:ring-white/10">
                <button 
                    onClick={() => setCalendarDate(d => new Date(d.setMonth(d.getMonth() - 1)))} 
                    className="p-2.5 rounded-full bg-bg-primary text-text-secondary hover:text-text-primary transition-all active:scale-95 shadow-sm"
                >
                    <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                
                <h2 className="text-lg sm:text-xl font-extrabold text-text-primary capitalize tracking-tight flex items-center gap-2">
                    <CalendarIcon size={18} className="text-accent hidden sm:block" />
                    {monthName} <span className="text-accent">{year}</span>
                </h2>
                
                <button 
                    onClick={() => setCalendarDate(d => new Date(d.setMonth(d.getMonth() + 1)))} 
                    className="p-2.5 rounded-full bg-bg-primary text-text-secondary hover:text-text-primary transition-all active:scale-95 shadow-sm"
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
                {days}
            </div>
            
            {/* Leyenda */}
            <div className="mt-8 pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent shadow-sm shadow-accent/30 ring-2 ring-accent/30"></div>
                    <span className="text-xs font-bold text-text-secondary">Con entreno</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-black/5 dark:bg-white/5 ring-1 ring-black/10 dark:ring-white/20"></div>
                    <span className="text-xs font-bold text-text-secondary">Sin entreno</span>
                </div>
            </div>
            
        </GlassCard>
    );
};

export default CalendarView;