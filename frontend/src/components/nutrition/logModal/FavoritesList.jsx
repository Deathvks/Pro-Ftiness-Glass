import React from 'react';
import SearchResultItem from './SearchResultItem'; // Importa el componente de item
import { ChevronLeft, ChevronRight, Edit } from 'lucide-react'; // Importado Edit

const FavoritesList = ({
    items,
    onAdd,
    onDelete,
    onEdit, // <-- 1. Recibir la nueva prop onEdit
    currentPage,
    totalPages,
    onPageChange
}) => {
    return (
        <div className="flex flex-col h-full"> {/* Asegura que ocupe el espacio disponible */}
            <div className="space-y-2 flex-grow overflow-y-auto pr-1"> {/* Contenedor scrollable */}
                {items.length > 0 ? (
                    items.map(meal => (
                        <SearchResultItem
                            key={`fav-${meal.id}`}
                            item={meal}
                            onAdd={onAdd}
                            onDelete={onDelete}
                            onEdit={onEdit} // <-- 2. Pasar onEdit a SearchResultItem
                        />
                    ))
                ) : (
                    <p className="text-center text-text-muted pt-10">
                        No se encontraron comidas favoritas.
                    </p>
                )}
            </div>
            {/* Paginación (solo si hay más de una página) */}
            {totalPages > 1 && (
                <div className="flex-shrink-0 flex items-center justify-center pt-3 gap-4">
                    <button
                        type="button"
                        className="p-2 rounded-full hover:bg-white/10 disabled:opacity-50"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-semibold text-text-secondary">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        type="button"
                        className="p-2 rounded-full hover:bg-white/10 disabled:opacity-50"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FavoritesList;