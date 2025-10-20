import React from 'react';
import SearchResultItem from './SearchResultItem'; // Importa el componente de item

const RecentList = ({ items, onAdd }) => {
    return (
        <div className="space-y-2 flex-grow overflow-y-auto pr-1"> {/* Contenedor scrollable */}
            {items.length > 0 ? (
                items.map(meal => (
                    <SearchResultItem
                        key={`recent-${meal.id}`} // Usar ID si está disponible, o un índice como fallback
                        item={meal}
                        onAdd={onAdd}
                        onDelete={null} // Los recientes no se pueden borrar desde aquí
                    />
                ))
            ) : (
                <p className="text-center text-text-muted pt-10">
                    No hay comidas recientes.
                </p>
            )}
        </div>
    );
};

export default RecentList;