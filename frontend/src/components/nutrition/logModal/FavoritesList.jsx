import React from 'react';
import SearchResultItem from './SearchResultItem'; // Importa el componente de item
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FavoritesList = ({
    items,
    onAdd,
    onDelete,
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
                            onDelete={onDelete} // Pasamos la función onDelete
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