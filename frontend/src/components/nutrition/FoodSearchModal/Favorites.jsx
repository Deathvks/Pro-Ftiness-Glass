/* frontend/src/components/nutrition/FoodSearchModal/Favorites.jsx */
import React from 'react';
// --- INICIO DE LA MODIFICACIÓN ---
import { FaImage } from 'react-icons/fa'; // Importar un ícono

const Favorites = ({ favorites, onSelect }) => {
  // Ordenar por nombre alfabéticamente
  const sortedFavorites = [...(favorites || [])].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  // --- FIN DE LA MODIFICACIÓN ---

  return (
    <ul>
      {/* --- INICIO DE LA MODIFICACIÓN --- */}
      {sortedFavorites.map((food) => (
        <li
          key={food.id} // Usar food.id en lugar de index
          onClick={() => onSelect(food)}
          className="p-3 flex items-center hover:bg-gray-700 cursor-pointer text-white border-b border-gray-700 last:border-b-0"
        >
          {/* Mostrar imagen o ícono */}
          {food.image_url ? (
            <img
              src={food.image_url}
              alt={food.name}
              className="w-12 h-12 object-cover rounded-md mr-3 flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 flex-shrink-0 rounded-md mr-3 bg-gray-600 flex items-center justify-center">
              <FaImage className="text-gray-400" />
            </div>
          )}

          {/* Detalles de la comida */}
          <div className="flex-grow min-w-0">
            <span className="font-semibold block truncate">{food.name}</span>
            <div className="text-sm text-gray-400">
              {food.calories} kcal
              {/* Mostrar peso si existe */}
              {food.weight_g && ` (${food.weight_g}g)`}
            </div>
          </div>
        </li>
      ))}
      {/* --- FIN DE LA MODIFICACIÓN --- */}
    </ul>
  );
};

export default Favorites;