import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DateNavigator = ({ selectedDate, onDateChange }) => {
    const today = new Date();
    const date = new Date(selectedDate);

    const changeDay = (amount) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + amount);
        onDateChange(newDate.toISOString().split('T')[0]);
    };

    const isToday = today.toISOString().split('T')[0] === selectedDate;

    return (
        <div className="flex items-center justify-between mb-8">
            <button onClick={() => changeDay(-1)} className="p-2 rounded-full hover:bg-white/10 transition">
                <ChevronLeft />
            </button>
            <div className="text-center">
                <h2 className="text-xl font-bold">
                    {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h2>
                {isToday && <span className="text-xs font-semibold text-accent">HOY</span>}
            </div>
            <button onClick={() => changeDay(1)} disabled={isToday} className="p-2 rounded-full hover:bg-white/10 transition disabled:opacity-50">
                <ChevronRight />
            </button>
        </div>
    );
};

export default DateNavigator;