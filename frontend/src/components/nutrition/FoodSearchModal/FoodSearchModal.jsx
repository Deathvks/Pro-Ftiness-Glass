/* frontend/src/components/nutrition/FoodSearchModal/FoodSearchModal.jsx */
import React, { useState, useEffect } from 'react';
import { XMarkIcon, QrCodeIcon } from '@heroicons/react/24/solid';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import Favorites from './Favorites';
import Recent from './Recent';
import FoodEntryForm from './FoodEntryForm';
import BarcodeScanner from '../../BarcodeScanner';
import { nutritionService } from '../../../services/nutritionService';

function FoodSearchModal({ isOpen, onClose, onAddFood, mealType, logDate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'favorites', 'recent'
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPer100g, setIsPer100g] = useState(false); // Estado para controlar el interruptor

  useEffect(() => {
    // Reset state when modal opens
    if (isOpen) {
      resetModalState();
    }
  }, [isOpen]);

  const resetModalState = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedItem(null);
    setIsLoading(false);
    setError(null);
    setActiveTab('search');
    setIsScannerOpen(false);
    setIsPer100g(false); // Asegurarse de resetear al cerrar
  };

  const handleSearch = async (term) => {
    if (!term) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const results = await nutritionService.searchFood(term);
      setSearchResults(results);
    } catch (err) {
      setError('Error al buscar alimentos. Inténtalo de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFood = (food) => {
    // Normalizar nombre de 'name' (Favoritos) o 'description' (Recientes) o 'food_name' (Búsqueda)
    const description =
      food.name || food.description || food.food_name || 'Alimento';

    const preparedFood = {
      ...food,
      description, // Usar el nombre normalizado
      name: description, // Asegurar que 'name' exista para el formulario

      // Preservar la URL de la imagen si viene de Favoritos o Recientes
      image_url: food.image_url || null,

      // Corregir la normalización de macros para 'per 100g'
      // Asegurarse de usar _g para Favoritos/Recientes
      calories_per_100g:
        food.calories_per_100g ||
        food.calories_per_serving ||
        food.calories ||
        0,
      protein_per_100g:
        food.protein_per_100g ||
        food.protein_per_serving ||
        food.protein_g ||
        food.protein ||
        0,
      carbs_per_100g:
        food.carbs_per_100g ||
        food.carbs_per_serving ||
        food.carbs_g ||
        food.carbs ||
        0,
      fat_per_100g:
        food.fat_per_100g ||
        food.fat_per_serving ||
        food.fats_g ||
        food.fat ||
        0,
    };

    setSelectedItem(preparedFood);
    setIsScannerOpen(false); // Close scanner if open
  };

  const handleScanSuccess = (foodData) => {
    // --- INICIO DE LA MODIFICACIÓN ---
    // Aseguramos que el item tenga el flag de origen 'scan'
    // para que el formulario (FoodEntryForm) pueda reaccionar a él.
    const scannedFoodData = {
      ...foodData,
      origin: 'scan',
    };
    handleSelectFood(scannedFoodData);
    // Ya no seteamos 'setIsPer100g(true)' aquí.
    // Dejamos que el useEffect de FoodEntryForm lo gestione.
    // --- FIN DE LA MODIFICACIÓN ---
    setIsScannerOpen(false);
  };

  const handleAddFoodEntry = (entry) => {
    onAddFood(entry);
    setSelectedItem(null); // Go back to search
    setIsPer100g(false); // Desactivar "Por 100g" al añadir
  };

  const handleCancelEntry = () => {
    setSelectedItem(null);
    setIsPer100g(false); // Desactivar "Por 100g" al cancelar
  };

  const handleCloseModal = () => {
    resetModalState();
    onClose();
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (selectedItem) {
      return (
        <FoodEntryForm
          selectedItem={selectedItem}
          onAdd={handleAddFoodEntry}
          onCancel={handleCancelEntry}
          mealType={mealType}
          logDate={logDate}
          isPer100g={isPer100g} // Pasar el estado
          setIsPer100g={setIsPer100g} // Pasar el actualizador
        />
      );
    }

    if (isScannerOpen) {
      return (
        <BarcodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      );
    }

    return (
      <>
        <div className="flex items-center mb-4">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
          <button
            onClick={() => setIsScannerOpen(true)}
            className="p-2 ml-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Escanear código de barras"
          >
            <QrCodeIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-700 mb-4">
          <TabButton
            title="Buscar"
            isActive={activeTab === 'search'}
            onClick={() => setActiveTab('search')}
          />
          <TabButton
            title="Favoritos"
            isActive={activeTab === 'favorites'}
            onClick={() => setActiveTab('favorites')}
          />
          <TabButton
            title="Recientes"
            isActive={activeTab === 'recent'}
            onClick={() => setActiveTab('recent')}
          />
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {error && <p className="text-red-400 text-center">{error}</p>}

          {activeTab === 'search' && (
            <SearchResults
              results={searchResults}
              onSelect={handleSelectFood}
              isLoading={isLoading}
            />
          )}
          {activeTab === 'favorites' && (
            <Favorites
              onSelect={handleSelectFood}
              logDate={logDate} // Pass logDate to fetch recents from that day if needed
            />
          )}
          {activeTab === 'recent' && (
            <Recent
              onSelect={handleSelectFood}
              logDate={logDate} // Pass logDate to fetch recents from that day
            />
          )}
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            {selectedItem ? 'Detalles del Alimento' : `Añadir a ${mealType}`}
          </h2>
          <button
            onClick={handleCloseModal}
            className="text-gray-400 hover:text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">{renderContent()}</div>
      </div>
    </div>
  );
}

const TabButton = ({ title, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2 px-4 text-sm font-medium text-center transition-colors duration-200
      ${
        isActive
          ? 'border-b-2 border-blue-500 text-white'
          : 'text-gray-400 hover:text-gray-200 border-b-2 border-transparent'
      }
    `}
  >
    {title}
  </button>
);

export default FoodSearchModal;