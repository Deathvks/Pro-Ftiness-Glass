/* frontend/src/components/nutrition/logModal/FavoritesList.jsx */
import React from 'react';
import SearchResultItem from './SearchResultItem';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

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
        <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out]">
            <div className="space-y-3 flex-grow overflow-y-auto custom-scrollbar pr-2 pb-2">
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
                    <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center px-4 animate-[slide-up_0.3s_ease-out]">
                        <div className="w-16 h-16 bg-accent/10 rounded-[20px] flex items-center justify-center mb-4 ring-1 ring-accent/30 shadow-inner group-hover:scale-110 transition-transform">
                            <Star size={32} className="text-accent opacity-90 drop-shadow-md" />
                        </div>
                        <p className="text-base font-extrabold text-text-primary mb-1">Sin favoritos</p>
                        <p className="text-xs font-medium text-text-secondary max-w-[200px]">
                            Aún no has guardado ningún alimento en tu lista de favoritos.
                        </p>
                    </div>
                )}
            </div>
            
            {totalPages > 1 && (
                <div className="flex-shrink-0 flex items-center justify-center pt-4 pb-1">
                    <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 px-4 py-2 rounded-full backdrop-blur-md shadow-sm">
                        <button
                            type="button"
                            className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-accent hover:text-white text-text-secondary disabled:opacity-30 disabled:hover:bg-black/5 disabled:hover:text-text-secondary transition-all active:scale-95"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft size={18} strokeWidth={2.5} />
                        </button>
                        
                        <span className="text-xs font-extrabold text-text-primary tracking-widest min-w-[3rem] text-center">
                            {currentPage} / {totalPages}
                        </span>
                        
                        <button
                            type="button"
                            className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-accent hover:text-white text-text-secondary disabled:opacity-30 disabled:hover:bg-black/5 disabled:hover:text-text-secondary transition-all active:scale-95"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FavoritesList;