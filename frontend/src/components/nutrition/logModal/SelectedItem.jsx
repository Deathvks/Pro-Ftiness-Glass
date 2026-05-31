/* frontend/src/components/nutrition/logModal/SelectedItem.jsx */
import React, { useState } from 'react';
import { Star, Trash2, Microscope } from 'lucide-react';
import { round as formatNumber } from '../../../hooks/useNutritionConstants';

const SelectedItem = ({ item, onRemove, onToggleFavorite, onEdit }) => {
    const [showMicros, setShowMicros] = useState(false);

    const micronutrients = item.micronutrients;

    const simpleMicrosList = [
        { key: 'vitamin-c_100g', name: 'Vit C' },
        { key: 'vitamin-a_100g', name: 'Vit A' },
        { key: 'vitamin-d_100g', name: 'Vit D' },
        { key: 'iron_100g', name: 'Hierro' },
        { key: 'calcium_100g', name: 'Calcio' },
        { key: 'sodium_100g', name: 'Sodio' },
        { key: 'fiber_100g', name: 'Fibra' },
    ];

    const availableMicros = micronutrients ? simpleMicrosList
        .map(micro => {
            const value = micronutrients[micro.key];
            let unit = micronutrients[micro.key.replace('_100g', '_unit')] || 'g';
            if (micro.key === 'sodium_100g' && unit === 'g') unit = 'mg';

            return (value && parseFloat(value) > 0)
                ? `${micro.name}: ${formatNumber(value, 2)} ${unit}`
                : null;
        })
        .filter(Boolean) : [];

    const hasMicros = availableMicros.length > 0;

    const protein = item.protein_g || item.protein || 0;
    const carbs = item.carbs_g || item.carbs || 0;
    const fats = item.fats_g || item.fat || item.fats || 0;
    const sugars = item.sugars_g || item.sugars || 0;

    return (
        <div className="relative flex items-center flex-wrap gap-3 p-3 mb-2 rounded-2xl bg-bg-primary border border-glass-border hover:bg-bg-secondary transition-all duration-300 group">

            {item.origin !== 'favorite' && item.origin !== 'recent' && (
                <button
                    onClick={() => onToggleFavorite(item.tempId)}
                    type="button" 
                    className="p-2 rounded-full hover:bg-glass-bg transition-colors flex-shrink-0 outline-none"
                    title="Guardar en favoritos"
                >
                    <Star
                        size={18}
                        className={`transition-all duration-300 ${item.isFavorite ? 'text-yellow-500 fill-yellow-500 scale-110' : 'text-text-muted hover:text-yellow-500'}`}
                    />
                </button>
            )}

            <div
                className="flex-grow min-w-0 pr-2 cursor-pointer"
                onClick={() => onEdit(item.tempId)}
                title="Editar esta comida"
            >
                <p className="font-extrabold text-sm sm:text-base line-clamp-2 leading-tight text-text-primary group-hover:text-accent transition-colors duration-300">{item.name}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1">
                    <span className="text-[11px] font-black text-text-primary bg-bg-secondary border border-glass-border px-2 py-0.5 rounded-md">
                        {Math.round(item.calories)} kcal
                    </span>
                    <div className="text-[10px] sm:text-[11px] flex items-center gap-2.5 font-extrabold opacity-90">
                        <span style={{ color: '#ef4444' }}>P: {formatNumber(protein, 1)}</span>
                        <span style={{ color: '#3b82f6' }}>C: {formatNumber(carbs, 1)}</span>
                        <span style={{ color: '#22c55e' }}>G: {formatNumber(fats, 1)}</span>
                        <span style={{ color: '#ec4899' }}>Az: {formatNumber(sugars, 1)}</span>
                    </div>
                </div>
            </div>

            <div className="text-right flex-shrink-0">
                <p className="font-black text-sm sm:text-base text-text-primary bg-bg-secondary px-3 py-1.5 rounded-xl border border-glass-border">
                    {formatNumber(item.weight_g, 1) || 0}
                    <span className="text-[11px] font-medium text-text-muted ml-0.5">g</span>
                </p>
            </div>

            <div className="flex items-center flex-shrink-0 gap-1.5">
                {hasMicros && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMicros(s => !s);
                        }}
                        type="button"
                        className={`p-2.5 rounded-xl transition-all duration-300 outline-none ${showMicros ? 'text-accent bg-accent/20 border border-accent/30' : 'text-text-muted border border-transparent hover:border-glass-border hover:bg-glass-bg'}`}
                        title="Mostrar micronutrientes"
                    >
                        <Microscope size={18} />
                    </button>
                )}

                <button
                    onClick={() => onRemove(item.tempId)}
                    type="button"
                    className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all active:scale-95 flex-shrink-0 outline-none"
                    title="Eliminar de la lista"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {hasMicros && showMicros && (
                <div
                    className="w-full mt-2 p-3 sm:p-4 bg-bg-secondary rounded-xl border border-glass-border cursor-default"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h5 className="text-[11px] font-black text-accent mb-2.5 uppercase tracking-widest flex items-center gap-1.5">
                        <Microscope size={14} /> Micronutrientes <span className="text-text-muted lowercase font-medium tracking-normal">(por 100g)</span>
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableMicros.map((microString, index) => {
                            const [name, value] = microString.split(':');
                            return (
                                <div key={index} className="flex justify-between items-center bg-bg-primary px-2.5 py-1.5 rounded-lg border border-glass-border">
                                    <span className="text-xs font-bold text-text-primary">{name}</span>
                                    <span className="text-[11px] font-extrabold text-accent">{value}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SelectedItem;