/* frontend/src/components/nutrition/logModal/SelectedItem.jsx */
// --- INICIO DE LA MODIFICACIÓN ---
import React, { useState } from 'react';
import { Star, Trash2, Microscope } from 'lucide-react';
// Importar 'round' y usarlo con el alias 'formatNumber'
import { round as formatNumber } from '../../../hooks/useNutritionConstants';
// --- FIN DE LA MODIFICACIÓN ---

const SelectedItem = ({ item, onRemove, onToggleFavorite, onEdit }) => {
    // --- INICIO DE LA MODIFICACIÓN ---
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
                // Usamos formatNumber (que es 'round')
                ? `${micro.name}: ${formatNumber(value, 2)} ${unit}` 
                : null;
        })
        .filter(Boolean) : [];

    const hasMicros = availableMicros.length > 0;
    // --- FIN DE LA MODIFICACIÓN ---

    return (
        <div className="flex items-center flex-wrap gap-2 px-3 py-2 rounded-lg bg-bg-primary border border-glass-border">

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

            {/* Nombre y calorías (clicable para editar) */}
            <div
                className="flex-grow min-w-0 pr-2 cursor-pointer"
                onClick={() => onEdit(item.tempId)}
                title="Editar esta comida"
            >
                <p className="font-semibold text-sm truncate text-text-primary">{item.name}</p>
                <p className="text-xs text-text-secondary">{Math.round(item.calories)} kcal</p>
            </div>
            
            {/* Gramos */}
            <div className="text-right flex-shrink-0 w-20">
                <p className="font-semibold text-sm text-text-primary">
                    {/* Usamos formatNumber (que es 'round') */}
                    {formatNumber(item.weight_g, 1) || 0}
                    <span className="text-xs text-text-muted"> g</span>
                </p>
            </div>
            
            {/* --- INICIO DE LA MODIFICACIÓN (Botones de acción) --- */}
            <div className="flex items-center flex-shrink-0 ml-auto">
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
            {/* --- FIN DE LA MODIFICACIÓN --- */}

            {/* --- INICIO DE LA MODIFICACIÓN --- */}
            {/* Contenedor para mostrar micronutrientes */}
            {hasMicros && showMicros && (
                <div 
                    className="w-full mt-2 p-2 bg-bg-secondary rounded-md border border-glass-border cursor-default"
                    onClick={(e) => e.stopPropagation()} // Evitar que el clic aquí haga algo
                >
                    <h5 className="text-xs font-bold text-text-primary mb-1">Micronutrientes (por 100g):</h5>
                    <div className="text-xs text-text-muted grid grid-cols-2 sm:grid-cols-3 gap-x-2">
                        {availableMicros.map((microString, index) => (
                            <span key={index}>{microString}</span>
                        ))}
                    </div>
                </div>
            )}
            {/* --- FIN DE LA MODIFICACIÓN --- */}
        </div>
    );
}

export default SelectedItem;