/* frontend/src/components/nutrition/logModal/SearchResultItem.jsx */
// --- INICIO DE LA MODIFICACIÓN ---
import React, { useState } from 'react';
import { Plus, Trash2, Edit, Microscope } from 'lucide-react';
// Importar 'round' y usarlo con el alias 'formatNumber'
import { round as formatNumber } from '../../../hooks/useNutritionConstants';
// --- FIN DE LA MODIFICACIÓN ---

const SearchResultItem = ({ item, onAdd, onDelete, onEdit }) => {
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
        <div
            className="flex flex-wrap items-center justify-between p-3 rounded-lg bg-bg-primary hover:bg-bg-secondary transition-colors border border-glass-border cursor-pointer group"
            onClick={(e) => {
                 // No añadir si se hizo clic en un botón
                 if (e.target.closest('button')) return;
                 onAdd(item);
            }}
        >

            {/* Detalles de la comida */}
            <div 
                className="min-w-0 pr-2 flex-1"
                onClick={(e) => {
                    // Permitir que el clic aquí también añada el item
                    if (e.target.closest('button')) return;
                    onAdd(item);
                }}
            >
                <p className="font-semibold truncate text-text-primary">{item.name || item.description}</p>
                <p className="text-xs text-text-muted">
                    {Math.round(item.calories)} kcal
                    {/* Usamos formatNumber (que es 'round') */}
                    {item.weight_g ? ` (${formatNumber(item.weight_g, 1)}g)` : ''}
                </p>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center flex-shrink-0 ml-auto z-10">

                {/* --- INICIO DE LA MODIFICACIÓN --- */}
                {/* Botón para mostrar micros */}
                {hasMicros && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMicros(s => !s);
                        }}
                        type="button"
                        className={`p-2 rounded-full ${showMicros ? 'text-accent bg-accent/10' : 'text-text-muted'} hover:text-accent hover:bg-accent/10 transition`}
                        title="Mostrar micronutrientes"
                    >
                        <Microscope size={16} />
                    </button>
                )}
                {/* --- FIN DE LA MODIFICACIÓN --- */}

                {/* Botón de editar (si aplica) */}
                {onEdit && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Evita activar onAdd
                            onEdit(item);
                        }}
                        type="button"
                        className="p-2 rounded-full text-text-muted hover:text-accent hover:bg-accent/10 transition"
                        title="Editar favorito"
                    >
                        <Edit size={16} />
                    </button>
                )}

                {/* Botón de eliminar (si aplica) */}
                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Evita activar onAdd
                            onDelete(item);
                        }}
                        type="button"
                        className="p-2 rounded-full text-text-muted hover:text-red hover:bg-red/10 transition"
                        title="Eliminar de favoritos"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
                {/* Botón de añadir (visual) */}
                <button
                    type="button"
                    className="p-2 rounded-full text-accent group-hover:bg-accent-transparent transition pointer-events-none"
                    title="Añadir a la lista"
                    aria-hidden="true"
                    tabIndex={-1}
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* --- INICIO DE LA MODIFICACIÓN --- */}
            {/* Contenedor para mostrar micronutrientes */}
            {hasMicros && showMicros && (
                <div 
                    className="w-full mt-2 p-2 bg-bg-secondary rounded-md border border-glass-border cursor-default"
                    onClick={(e) => e.stopPropagation()} // Evitar que el clic aquí añada el item
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

export default SearchResultItem;