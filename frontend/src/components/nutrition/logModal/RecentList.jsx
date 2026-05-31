/* frontend/src/components/nutrition/logModal/RecentList.jsx */
import React from 'react';
import SearchResultItem from './SearchResultItem';
import Spinner from '../../Spinner';
import { Clock } from 'lucide-react';

const RecentList = ({ items = [], onAdd, isLoading }) => {
    return (
        <div className="space-y-3 flex-grow overflow-y-auto custom-scrollbar pr-2 pb-2 animate-[fade-in_0.3s_ease-out]">
            {isLoading ? (
                <div className="flex flex-col justify-center items-center h-full min-h-[250px] space-y-4">
                    <Spinner size={32} />
                    <p className="text-sm font-medium text-text-secondary animate-pulse">Cargando recientes...</p>
                </div>
            ) : items.length > 0 ? (
                items.map(meal => (
                    <SearchResultItem
                        key={`recent-${meal.id}`}
                        item={meal}
                        onAdd={onAdd}
                        onDelete={null}
                    />
                ))
            ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center px-4 animate-[slide-up_0.3s_ease-out]">
                    <div className="w-16 h-16 bg-accent/10 rounded-[20px] flex items-center justify-center mb-4 ring-1 ring-accent/30 shadow-inner group-hover:scale-110 transition-transform">
                        <Clock size={32} className="text-accent opacity-90 drop-shadow-md" />
                    </div>
                    <p className="text-base font-extrabold text-text-primary mb-1">Sin historial</p>
                    <p className="text-xs font-medium text-text-secondary max-w-[200px]">
                        Las comidas que registres aparecerán aquí para un acceso rápido.
                    </p>
                </div>
            )}
        </div>
    );
};

export default RecentList;