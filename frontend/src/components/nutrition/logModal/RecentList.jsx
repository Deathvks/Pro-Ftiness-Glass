/* frontend/src/components/nutrition/logModal/RecentList.jsx */
import React from 'react';
import SearchResultItem from './SearchResultItem'; // Importa el componente de item
// --- INICIO DE LA MODIFICACIÓN ---
import Spinner from '../../Spinner'; // Importar el spinner

// Asignamos un valor por defecto a 'items' y añadimos 'isLoading'
const RecentList = ({ items = [], onAdd, isLoading }) => {
    // Quitamos los logs, ya no son necesarios
    // --- FIN DE LA MODIFICACIÓN ---
    return (
        <div className="space-y-2 flex-grow overflow-y-auto pr-1"> {/* Contenedor scrollable */}
            {/* --- INICIO DE LA MODIFICACIÓN --- */}
            {isLoading ? (
                // 1. Mostrar spinner si está cargando
                <div className="flex justify-center items-center pt-10">
                    <Spinner />
                </div>
            ) : items.length > 0 ? (
                // 2. Mostrar items si hay
                items.map(meal => (
                    <SearchResultItem
                        key={`recent-${meal.id}`} // Usar ID si está disponible
                        item={meal}
                        onAdd={onAdd}
                        onDelete={null} // Los recientes no se pueden borrar desde aquí
                    />
                ))
            ) : (
                // 3. Mostrar mensaje si no hay items y no está cargando
                <p className="text-center text-text-muted pt-10">
                    No hay comidas recientes.
                </p>
            )}
            {/* --- FIN DE LA MODIFICACIÓN --- */}
        </div>
    );
};

export default RecentList;