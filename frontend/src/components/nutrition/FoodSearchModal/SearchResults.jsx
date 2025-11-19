/* frontend/src/components/nutrition/FoodSearchModal/SearchResults.jsx */
import React from 'react';
import { PhotoIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import Spinner from '../../Spinner';

const SearchResults = ({ results, onSelect, isLoading }) => {
  // 1. Estado de carga
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-10 text-gray-400">
        <Spinner size={30} />
        <p className="mt-3 text-sm">Buscando alimentos...</p>
      </div>
    );
  }

  // 2. Estado sin resultados (solo si results es un array vacío y no está cargando)
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p>No se encontraron resultados.</p>
        <p className="text-sm mt-1">Prueba con otro nombre o escanea un código.</p>
      </div>
    );
  }

  // 3. Renderizado de la lista
  return (
    <ul className="space-y-2 pb-4">
      {results.map((food, index) => {
        // Normalización de datos para la vista (Local vs OpenFoodFacts)
        const name = food.name || food.description || food.product_name || 'Sin nombre';
        const brand = food.brands || food.brand || (food.source === 'local' ? 'Mis Comidas' : '');
        
        // Prioridad de imágenes: URL directa > Miniatura > Frontal pequeña
        const imageSrc = food.image_url || food.image_small_url || food.image_front_small_url;
        
        // Intentar obtener calorías para mostrar en la lista (previsualización)
        // OFF suele devolver nutriments['energy-kcal_100g']
        const calories = food.calories || (food.nutriments ? food.nutriments['energy-kcal_100g'] : null);
        const calText = calories !== null && calories !== undefined ? `${Math.round(calories)} kcal` : '';

        return (
          <li
            key={`${index}-${name}`} 
            onClick={() => onSelect(food)}
            className="group flex items-center p-3 bg-gray-800/50 hover:bg-gray-700 border border-gray-700 hover:border-blue-500/50 rounded-xl cursor-pointer transition-all duration-200"
          >
            {/* Imagen del alimento */}
            <div className="relative flex-shrink-0 w-14 h-14 bg-gray-900 rounded-lg overflow-hidden border border-gray-600 mr-3 flex items-center justify-center">
              {imageSrc ? (
                <img 
                  src={imageSrc} 
                  alt={name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'; // Ocultar img rota
                    e.target.nextSibling.style.display = 'block'; // Mostrar fallback
                  }}
                />
              ) : null}
              {/* Fallback Icon (se muestra si no hay img o si falla la carga) */}
              <div 
                className="absolute inset-0 flex items-center justify-center bg-gray-800"
                style={{ display: imageSrc ? 'none' : 'flex' }}
              >
                <PhotoIcon className="w-6 h-6 text-gray-500" />
              </div>
            </div>

            {/* Información de texto */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-100 truncate pr-2">
                {name}
              </h4>
              <div className="flex items-center text-xs text-gray-400 mt-1">
                {brand && <span className="truncate max-w-[100px] mr-2">{brand}</span>}
                {brand && calText && <span className="mr-2">•</span>}
                {calText && <span className="text-blue-400 font-medium">{calText}</span>}
              </div>
            </div>

            {/* Botón de acción (visible al hover o siempre en móvil) */}
            <div className="ml-2 text-gray-500 group-hover:text-blue-400 transition-colors">
              <PlusCircleIcon className="w-6 h-6" />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default SearchResults;