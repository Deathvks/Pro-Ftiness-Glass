/* frontend/src/components/nutrition/logModal/SearchResultItem.jsx */
import React, { useState } from 'react';
import { Plus, Trash2, Edit, Microscope, Image as ImageIcon } from 'lucide-react';
import { round as formatNumber } from '../../../hooks/useNutritionConstants';

const SearchResultItem = ({ item, onAdd, onDelete, onEdit }) => {
    const [showMicros, setShowMicros] = useState(false);
    const [imgError, setImgError] = useState(false);

    const micronutrients = item.micronutrients;
    
    // 1. Lógica para construir la URL correcta de la imagen
    const getImageUrl = (url) => {
        if (!url) return null;
        // Si ya es una URL completa (ej: OpenFoodFacts), la usamos tal cual
        if (url.startsWith('http')) return url;
        
        // Si es una ruta relativa local, le añadimos el dominio del backend
        // Usamos VITE_API_BASE_URL pero quitamos '/api' si está presente para ir a la raíz
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const rootUrl = apiBase.replace(/\/api\/?$/, ''); 
        
        // Aseguramos que haya un slash entre el dominio y la ruta
        return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const displayImage = getImageUrl(item.image_url);

    // 2. Lista simplificada de micronutrientes
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

    return (
        <div
            className="flex flex-wrap items-center justify-between p-3 rounded-lg bg-bg-primary hover:bg-bg-secondary transition-colors border border-glass-border cursor-pointer group"
            onClick={(e) => {
                 if (e.target.closest('button')) return;
                 onAdd(item);
            }}
        >
            <div className="flex items-center flex-1 min-w-0 mr-3">
                {/* --- SECCIÓN DE IMAGEN --- */}
                <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-gray-700 overflow-hidden mr-3 border border-glass-border flex items-center justify-center relative">
                    {displayImage && !imgError ? (
                        <img 
                            src={displayImage} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="text-gray-500">
                            <ImageIcon size={20} />
                        </div>
                    )}
                </div>

                {/* --- DETALLES TEXTO --- */}
                <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate text-text-primary">{item.name || item.description}</p>
                    <p className="text-xs text-text-muted flex items-center gap-1">
                        <span>{Math.round(item.calories)} kcal</span>
                        {item.weight_g && <span>• {formatNumber(item.weight_g, 1)}g</span>}
                        {item.brand && <span className="truncate hidden sm:inline">• {item.brand}</span>}
                    </p>
                </div>
            </div>

            {/* --- BOTONES DE ACCIÓN --- */}
            <div className="flex items-center flex-shrink-0 z-10">
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

                {onEdit && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                        }}
                        type="button"
                        className="p-2 rounded-full text-text-muted hover:text-accent hover:bg-accent/10 transition"
                        title="Editar favorito"
                    >
                        <Edit size={16} />
                    </button>
                )}

                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item);
                        }}
                        type="button"
                        className="p-2 rounded-full text-text-muted hover:text-red hover:bg-red/10 transition"
                        title="Eliminar de favoritos"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
                
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

            {/* --- MICRONUTRIENTES (Desplegable) --- */}
            {hasMicros && showMicros && (
                <div 
                    className="w-full mt-2 p-2 bg-bg-secondary rounded-md border border-glass-border cursor-default"
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

export default SearchResultItem;