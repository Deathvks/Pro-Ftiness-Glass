/* frontend/src/components/nutrition/logModal/SearchResultItem.jsx */
import React, { useState } from 'react';
import { Plus, Trash2, Edit, Microscope, Image as ImageIcon } from 'lucide-react';
import { round as formatNumber } from '../../../hooks/useNutritionConstants';

const SearchResultItem = ({ item, onAdd, onDelete, onEdit }) => {
    const [showMicros, setShowMicros] = useState(false);
    const [imgError, setImgError] = useState(false);

    const micronutrients = item.micronutrients;

    const getImageUrl = (url, updatedAt) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;

        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const rootUrl = apiBase.replace(/\/api\/?$/, '');
        const fullUrl = `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;

        if (updatedAt) {
            const separator = fullUrl.includes('?') ? '&' : '?';
            const ts = new Date(updatedAt).getTime();
            if (!isNaN(ts)) {
                return `${fullUrl}${separator}v=${ts}`;
            }
        }
        return fullUrl;
    };

    const displayImage = getImageUrl(item.image_url, item.updated_at);

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
        <div
            className="flex flex-wrap items-center justify-between p-3 mb-2 rounded-2xl bg-bg-primary border border-glass-border hover:bg-bg-secondary transition-all duration-300 cursor-pointer group"
            onClick={(e) => {
                if (e.target.closest('button')) return;
                onAdd(item);
            }}
        >
            <div className="flex items-center flex-1 min-w-0 mr-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-xl bg-bg-secondary overflow-hidden mr-4 border border-glass-border flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300">
                    {displayImage && !imgError ? (
                        <img
                            src={displayImage}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="text-text-muted opacity-60">
                            <ImageIcon size={24} />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1 py-1">
                    <p className="font-extrabold text-sm sm:text-base line-clamp-2 leading-tight text-text-primary group-hover:text-accent transition-colors duration-300">{item.name || item.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[11px] font-black text-text-primary bg-bg-secondary border border-glass-border px-2 py-0.5 rounded-md">
                            {Math.round(item.calories)} kcal
                        </span>
                        {item.weight_g && (
                            <span className="text-[11px] font-bold text-text-secondary border border-glass-border px-2 py-0.5 rounded-md">
                                {formatNumber(item.weight_g, 1)}g
                            </span>
                        )}
                        {item.brand && (
                            <span className="truncate hidden sm:inline text-[11px] font-bold text-text-tertiary max-w-[80px]">
                                {item.brand}
                            </span>
                        )}
                    </div>

                    <div className="text-[10px] sm:text-[11px] flex items-center gap-2.5 mt-1.5 font-extrabold opacity-90">
                        <span style={{ color: '#ef4444' }}>P: {formatNumber(protein, 1)}</span>
                        <span style={{ color: '#3b82f6' }}>C: {formatNumber(carbs, 1)}</span>
                        <span style={{ color: '#22c55e' }}>G: {formatNumber(fats, 1)}</span>
                        <span style={{ color: '#ec4899' }}>Az: {formatNumber(sugars, 1)}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center flex-shrink-0 gap-1.5 z-10">
                {hasMicros && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMicros(s => !s);
                        }}
                        type="button"
                        className={`p-2.5 rounded-xl transition-all duration-300 outline-none ${showMicros ? 'text-accent bg-accent/20 border border-accent/30' : 'text-text-muted hover:text-accent hover:bg-glass-bg border border-transparent hover:border-glass-border'}`}
                        title="Mostrar micronutrientes"
                    >
                        <Microscope size={18} />
                    </button>
                )}

                {onEdit && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                        }}
                        type="button"
                        className="p-2.5 rounded-xl text-text-muted hover:text-accent hover:bg-glass-bg border border-transparent hover:border-glass-border transition-all active:scale-95 outline-none"
                        title="Editar favorito"
                    >
                        <Edit size={18} />
                    </button>
                )}

                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item);
                        }}
                        type="button"
                        className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all active:scale-95 flex-shrink-0 outline-none"
                        title="Eliminar de favoritos"
                    >
                        <Trash2 size={18} />
                    </button>
                )}

                <button
                    type="button"
                    className="p-2.5 rounded-xl text-white bg-accent group-hover:scale-105 transition-all pointer-events-none"
                    title="Añadir a la lista"
                    aria-hidden="true"
                    tabIndex={-1}
                >
                    <Plus size={18} strokeWidth={3} />
                </button>
            </div>

            {hasMicros && showMicros && (
                <div
                    className="w-full mt-3 p-3 sm:p-4 bg-bg-secondary rounded-xl border border-glass-border cursor-default"
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

export default SearchResultItem;