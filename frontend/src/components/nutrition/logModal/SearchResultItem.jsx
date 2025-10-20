import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const SearchResultItem = ({ item, onAdd, onDelete }) => (
    // --- INICIO DE LA MODIFICACIÓN ---
    // Añadimos onClick al div principal y cursor-pointer
    <div
        onClick={() => onAdd(item)}
        className="flex items-center justify-between p-3 rounded-lg bg-bg-primary hover:bg-bg-secondary transition-colors border border-glass-border cursor-pointer group" // Añadido cursor-pointer
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
            {/* Botón de eliminar (si aplica) */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // MUY IMPORTANTE: Evita que el clic en borrar active el onClick del div padre (que añadiría el item)
                        onDelete(item);
                    }}
                    type="button"
                    className="p-2 rounded-full text-text-muted hover:text-red hover:bg-red/10 transition z-10" // Añadido z-10 por si acaso
                    title="Eliminar de favoritos"
                >
                    <Trash2 size={16} />
                </button>
            )}
            {/* Botón de añadir (ahora solo visual, sin onClick) */}
            <button
                // Quitamos el onClick de aquí, ya que el div padre maneja la acción
                type="button"
                className="p-2 rounded-full text-accent group-hover:bg-accent-transparent transition pointer-events-none" // pointer-events-none para asegurar que no interfiera
                title="Añadir a la lista"
                aria-hidden="true" // Es decorativo si el padre es clickeable
                tabIndex={-1} // No enfocable
            >
                <Plus size={18} />
            </button>
        </div>
    </div>
    // --- FIN DE LA MODIFICACIÓN ---
);

export default SearchResultItem;