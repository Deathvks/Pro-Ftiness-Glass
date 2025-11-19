/* frontend/src/components/nutrition/FoodSearchModal/SearchBar.jsx */
import React, { useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SearchBar = ({ searchTerm, setSearchTerm, onSearch, isLoading }) => {
  
  // Efecto para "Debounce": Ejecuta la búsqueda 500ms después de que el usuario deja de escribir
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Solo buscamos si hay texto
      if (searchTerm) {
        onSearch(searchTerm);
      } else {
        // Si se borra todo, podríamos limpiar resultados opcionalmente
        onSearch(''); 
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, onSearch]);

  const handleClear = () => {
    setSearchTerm('');
    // El useEffect se encargará de disparar la búsqueda vacía
  };

  return (
    <div className="relative w-full">
      {/* Icono Lupa */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>

      {/* Input */}
      <input
        type="text"
        className="block w-full pl-10 pr-10 py-3 border border-gray-600 rounded-xl leading-5 bg-gray-900/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:bg-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all duration-200"
        placeholder="Buscar alimentos (ej: Manzana, Pollo)..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        autoComplete="off"
        autoCorrect="off"
      />

      {/* Icono Derecha: Loading o Borrar */}
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-blue-500"></div>
        ) : searchTerm ? (
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-white focus:outline-none transition-colors"
            aria-label="Borrar búsqueda"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default SearchBar;