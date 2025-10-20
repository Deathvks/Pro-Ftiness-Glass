import React from 'react';
import { Plus, Trash2, Edit } from 'lucide-react'; // Importado Edit

const SearchResultItem = ({ item, onAdd, onDelete, onEdit }) => ( // Recibimos onEdit
    <div
        onClick={() => onAdd(item)}
        className="flex items-center justify-between p-3 rounded-lg bg-bg-primary hover:bg-bg-secondary transition-colors border border-glass-border cursor-pointer group"
    >
        {/* Detalles de la comida */}
        <div className="min-w-0 pr-2">
            <p className="font-semibold truncate text-text-primary">{item.name}</p>
            <p className="text-xs text-text-muted">
                {Math.round(item.calories)} kcal
                {item.weight_g ? ` (${parseFloat(item.weight_g)}g)` : ''}
            </p>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center flex-shrink-0 ml-2">
            {/* --- INICIO DE LA MODIFICACIÓN --- */}
            {/* Botón de editar (si aplica) */}
            {onEdit && (
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Evita activar onAdd
                        onEdit(item);
                    }}
                    type="button"
                    className="p-2 rounded-full text-text-muted hover:text-accent hover:bg-accent/10 transition z-10"
                    title="Editar favorito"
                >
                    <Edit size={16} />
                </button>
            )}
            {/* --- FIN DE LA MODIFICACIÓN --- */}

            {/* Botón de eliminar (si aplica) */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Evita activar onAdd
                        onDelete(item);
                    }}
                    type="button"
                    className="p-2 rounded-full text-text-muted hover:text-red hover:bg-red/10 transition z-10"
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
    </div>
);

export default SearchResultItem;