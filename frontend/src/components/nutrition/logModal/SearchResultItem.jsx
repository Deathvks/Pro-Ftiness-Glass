import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const SearchResultItem = ({ item, onAdd, onDelete }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-bg-primary hover:bg-bg-secondary transition-colors border border-glass-border">
        <div className="min-w-0 pr-2">
            <p className="font-semibold truncate text-text-primary">{item.name}</p>
            <p className="text-xs text-text-muted">
                {item.calories} kcal
                {/* Asegurarse de que weight_g se muestre correctamente */}
                {item.weight_g ? ` (${parseFloat(item.weight_g)}g)` : ''}
            </p>
        </div>
        <div className="flex items-center flex-shrink-0 ml-2">
            {/* Si onDelete existe (es un favorito), muestra el botón de borrar */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Evita que el clic active onAdd
                        onDelete(item);
                    }}
                    type="button" // Evita envío de formulario
                    className="p-2 rounded-full text-text-muted hover:text-red hover:bg-red/10 transition"
                    title="Eliminar de favoritos"
                >
                    <Trash2 size={16} />
                </button>
            )}
            <button
                onClick={() => onAdd(item)}
                type="button" // Evita envío de formulario
                className="p-2 rounded-full text-accent hover:bg-accent-transparent transition"
                title="Añadir a la lista"
            >
                <Plus size={18} />
            </button>
        </div>
    </div>
);

export default SearchResultItem;