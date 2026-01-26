/* frontend/src/components/nutrition/logModal/SelectedItem.jsx */
import React, { useState } from 'react';
import { Star, Trash2, Microscope } from 'lucide-react';
import { round as formatNumber } from '../../../hooks/useNutritionConstants';

const SelectedItem = ({ item, onRemove, onToggleFavorite, onEdit }) => {
    const [showMicros, setShowMicros] = useState(false);

    const micronutrients = item.micronutrients;
    
    // Lista simplificada de micronutrientes a mostrar
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

    // --- Macros para mostrar (incluyendo Azúcar) ---
    const protein = item.protein_g || item.protein || 0;
    const carbs = item.carbs_g || item.carbs || 0;
    const fats = item.fats_g || item.fat || item.fats || 0;
    const sugars = item.sugars_g || item.sugars || 0;

    return (
        <div className="flex items-center flex-wrap gap-2 px-3 py-2 rounded-lg bg-bg-primary border border-glass-border animate-[fade-in_0.2s]">

            {/* Botón para marcar/descarcar como favorito (solo si no viene de fav/reciente) */}
            {item.origin !== 'favorite' && item.origin !== 'recent' && (
                <button
                    onClick={() => onToggleFavorite(item.tempId)}
                    type="button" // Evita envío de formulario
                    className="p-1.5 rounded-full hover:bg-bg-secondary transition-colors flex-shrink-0"
                    title="Guardar en favoritos"
                >
                    <Star
                        size={16}
                        className={`transition-all ${item.isFavorite ? 'text-accent fill-accent' : 'text-text-muted'}`}
                    />
                </button>
            )}

            {/* Nombre y macros (clicable para editar) */}
            <div
                className="flex-grow min-w-0 pr-2 cursor-pointer"
                onClick={() => onEdit(item.tempId)}
                title="Editar esta comida"
            >
                <p className="font-semibold text-sm truncate text-text-primary">{item.name}</p>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <p className="text-xs text-text-secondary">{Math.round(item.calories)} kcal</p>
                    {/* Visualización de macros pequeña */}
                    <div className="text-[10px] flex items-center gap-1.5 font-medium opacity-90">
                        <span className="text-green-500">P:{formatNumber(protein, 1)}</span>
                        <span className="text-blue-500">C:{formatNumber(carbs, 1)}</span>
                        <span className="text-yellow-500">G:{formatNumber(fats, 1)}</span>
                        <span className="text-pink-500">Az:{formatNumber(sugars, 1)}</span>
                    </div>
                </div>
            </div>
            
            {/* Gramos */}
            <div className="text-right flex-shrink-0 w-16 sm:w-20">
                <p className="font-semibold text-sm text-text-primary">
                    {formatNumber(item.weight_g, 1) || 0}
                    <span className="text-xs text-text-muted"> g</span>
                </p>
            </div>
            
            {/* Botones de acción */}
            <div className="flex items-center flex-shrink-0 ml-auto gap-1">
                {/* Botón para mostrar micros */}
                {hasMicros && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMicros(s => !s);
                        }}
                        type="button"
                        className={`p-1.5 rounded-full ${showMicros ? 'text-accent bg-accent/10' : 'text-text-muted'} hover:text-accent hover:bg-accent/10 transition`}
                        title="Mostrar micronutrientes"
                    >
                        <Microscope size={16} />
                    </button>
                )}

                {/* Botón para eliminar de la lista */}
                <button
                    onClick={() => onRemove(item.tempId)}
                    type="button"
                    className="text-red hover:bg-red/20 rounded-full p-1.5 flex-shrink-0"
                    title="Eliminar de la lista"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Contenedor para mostrar micronutrientes */}
            {hasMicros && showMicros && (
                <div 
                    className="w-full mt-1 p-2 bg-bg-secondary rounded-md border border-glass-border cursor-default"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h5 className="text-xs font-bold text-text-primary mb-1">Micronutrientes (por 100g):</h5>
                    <div className="text-xs text-text-muted grid grid-cols-2 sm:grid-cols-3 gap-x-2">
                        {availableMicros.map((microString, index) => (
                            <span key={index}>{microString}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SelectedItem;