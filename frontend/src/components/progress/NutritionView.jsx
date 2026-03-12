import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { NutritionCharts } from './ProgressCharts';

const NutritionView = ({ axisColor }) => {
    const { nutritionSummary, fetchNutritionSummary, isLoading } = useAppStore();
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        fetchNutritionSummary(date.getMonth() + 1, date.getFullYear());
    }, [date, fetchNutritionSummary]);
    
    const changeMonth = (d) => setDate(p => new Date(p.getFullYear(), p.getMonth() + d, 1));
    
    const chartData = useMemo(() => {
        if (!nutritionSummary) return [];
        
        const [y, m] = [date.getFullYear(), date.getMonth()];
        const today = new Date();
        const isCurrent = y === today.getFullYear() && m === today.getMonth();
        const lastDay = isCurrent ? today.getDate() : new Date(y, m + 1, 0).getDate();

        const dataMap = new Map(Array.from({ length: lastDay }, (_, i) => {
            const day = i + 1;
            const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return [dateStr, { date: dateStr, day, Calorías: 0, Proteínas: 0, Carbs: 0, Grasas: 0, Agua: 0 }];
        }));

        nutritionSummary.nutrition?.forEach(n => {
            if (dataMap.has(n.date)) {
                Object.assign(dataMap.get(n.date), {
                    Calorías: parseFloat(n.total_calories) || 0,
                    Proteínas: parseFloat(n.total_protein) || 0,
                    Carbs: parseFloat(n.total_carbs) || 0,
                    Grasas: parseFloat(n.total_fats) || 0
                });
            }
        });

        nutritionSummary.water?.forEach(w => {
            if (dataMap.has(w.log_date)) dataMap.get(w.log_date).Agua = w.quantity_ml || 0;
        });
        
        return Array.from(dataMap.values());
    }, [nutritionSummary, date]);

    const isNextDisabled = date.getFullYear() === new Date().getFullYear() && date.getMonth() === new Date().getMonth();

    return (
        <div className="flex flex-col gap-4">
            {/* Controles Superiores (Sin bordes ni fondos) */}
            <div className="flex items-center justify-between gap-3 w-full">
                <button 
                    onClick={() => changeMonth(-1)} 
                    className="p-2 rounded-lg hover:bg-white/10 transition text-text-secondary hover:text-text-primary"
                >
                    <ChevronLeft size={20} />
                </button>
                <h2 className="text-sm font-semibold capitalize text-text-primary tracking-wide">
                    {date.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                </h2>
                <button 
                    onClick={() => changeMonth(1)} 
                    disabled={isNextDisabled}
                    className="p-2 rounded-lg hover:bg-white/10 transition text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
            
            <NutritionCharts chartData={chartData} axisColor={axisColor} isLoading={isLoading} />
        </div>
    );
};

export default NutritionView;