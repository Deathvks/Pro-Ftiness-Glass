import React from 'react';
import { Star, Trash2 } from 'lucide-react';

const SelectedItem = ({ item, onRemove, onToggleFavorite, onEdit }) => (
    // --- INICIO DE LA MODIFICACIÓN ---
    // Se elimina el div espaciador que se añadía cuando origin era 'favorite' o 'recent'.
    // Ahora, el div del texto (con flex-grow) ocupará ese espacio automáticamente.
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-primary border border-glass-border">
        {/* Botón para marcar/desmarcar como favorito (solo si no viene de fav/reciente) */}
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
        {/* --- FIN DE LA MODIFICACIÓN --- */}

        {/* Nombre y calorías (clicable para editar) */}
        <div
            className="flex-grow min-w-0 pr-2 cursor-pointer"
            // --- INICIO DE LA MODIFICACIÓN ---
            // Añadimos un margen izquierdo solo si la estrella NO está presente,
            // para mantener una alineación visual similar. Ajusta ml-7 si es necesario.
            style={{ marginLeft: (item.origin === 'favorite' || item.origin === 'recent') ? '28px' : '0' }}
            // --- FIN DE LA MODIFICACIÓN ---
            onClick={() => onEdit(item.tempId)}
            title="Editar esta comida"
        >
            <p className="font-semibold text-sm truncate text-text-primary">{item.name}</p>
            <p className="text-xs text-text-secondary">{Math.round(item.calories)} kcal</p>
        </div>
        {/* Gramos */}
        <div className="text-right flex-shrink-0 w-20">
            <p className="font-semibold text-sm text-text-primary">
                {parseFloat(item.weight_g) || 0}
                <span className="text-xs text-text-muted"> g</span>
            </p>
        </div>
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
);

export default SelectedItem;