/* frontend/src/components/nutrition/logModal/FavoritesList.jsx */
import React from 'react';
import SearchResultItem from './SearchResultItem';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FavoritesList = ({
    favorites,
    onAdd,
    onDelete,
    onEdit,
    currentPage,
    totalPages,
    onPageChange
}) => {
    return (
        <div className="flex flex-col h-full">
            <div className="space-y-2 flex-grow overflow-y-auto pr-1">
                {favorites && favorites.length > 0 ? (
                    favorites.map(meal => (
                        <SearchResultItem
                            key={`fav-${meal.id}`}
                            item={meal}
                            onAdd={onAdd}
                            onDelete={onDelete}
                            onEdit={onEdit}
                        />
                    ))
                ) : (
                    <p className="text-center text-text-muted pt-10">
                        No se encontraron comidas favoritas.
                    </p>
                )}
            </div>
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