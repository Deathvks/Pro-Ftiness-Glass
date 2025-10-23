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
import Spinner from '../../Spinner'; // Importar Spinner

function FoodSearchModal({ isOpen, onClose, onAddFood, mealType, logDate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'favorites', 'recent'
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPer100g, setIsPer100g] = useState(false);

  useEffect(() => {
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
    setIsPer100g(false);
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
    let preparedFood;

    // A. Si el item viene del ESCÁNER (backend API v2)
    if (food.origin === 'scan') {
      const description = food.name || 'Alimento Escaneado';
      const weight_g = food.weight_g || 100;

      preparedFood = {
        ...food,
        description,
        name: description,
        image_url: food.image_url || null,
        calories_per_100g: food.calories || 0,
        protein_per_100g: food.protein_g || 0,
        carbs_per_100g: food.carbs_g || 0,
        fat_per_100g: food.fats_g || 0,
        serving_size: food.serving_size || `${weight_g} g`,
        serving_weight_g: weight_g,
        calories_per_serving: food.calories || 0,
        protein_per_serving: food.protein_g || 0,
        carbs_per_serving: food.carbs_g || 0,
        fat_per_serving: food.fats_g || 0,
      };
    }
    // B. Si el item viene de BÚSQUEDA (FatSecret), FAVORITOS o RECIENTES
    else {
      const description =
        food.name ||
        food.description ||
        food.food_name ||
        'Alimento';
      const image_url = food.image_url || null;

      preparedFood = {
        ...food,
        description,
        name: description,
        image_url,
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
        serving_size: food.serving_size || '1 ración',
        serving_weight_g: food.serving_weight_g || 100,
        calories_per_serving:
          food.calories_per_serving ||
          food.calories_per_100g ||
          food.calories ||
          0,
        protein_per_serving:
          food.protein_per_serving ||
          food.protein_per_100g ||
          food.protein_g ||
          food.protein ||
          0,
        carbs_per_serving:
          food.carbs_per_serving ||
          food.carbs_per_100g ||
          food.carbs_g ||
          food.carbs ||
          0,
        fat_per_serving:
          food.fat_per_serving ||
          food.fat_per_100g ||
          food.fats_g ||
          food.fat ||
          0,
      };
    }

    setSelectedItem(preparedFood);
    setIsScannerOpen(false); // Close scanner if open
  };

  // --- INICIO DE LA MODIFICACIÓN ---
  // Esta función ahora es 'async' y llama al servicio de nutrición
  const handleScanSuccess = async (barcode) => {
    setIsScannerOpen(false); // 1. Cerrar el escáner
    setIsLoading(true); // 2. Mostrar estado de carga
    setError(null);
    setSelectedItem(null); // 3. Limpiar selección anterior

    try {
      // 4. LLAMAR A LA API con el código de barras
      const foodData = await nutritionService.searchByBarcode(barcode);

      // 5. Preparar los datos recibidos
      const scannedFoodData = {
        ...foodData,
        origin: 'scan', // Añadir el flag 'scan'
      };
      
      // 6. Cargar el formulario con los datos
      handleSelectFood(scannedFoodData);

    } catch (err) {
      console.error('Error al buscar por código de barras:', err);
      setError(
        err.response?.data?.error ||
          'Producto no encontrado o error de red.'
      );
      // Volver a la pestaña de búsqueda si falla
      setSelectedItem(null);
      setActiveTab('search');
    } finally {
      setIsLoading(false); // 7. Ocultar estado de carga
    }
  };
  // --- FIN DE LA MODIFICACIÓN ---

  const handleAddFoodEntry = (entry) => {
    onAddFood(entry);
    setSelectedItem(null);
    setIsPer100g(false);
  };

  const handleCancelEntry = () => {
    setSelectedItem(null);
    setIsPer100g(false);
  };

  const handleCloseModal = () => {
    resetModalState();
    onClose();
  };

  if (!isOpen) return null;

  const renderContent = () => {
    // 1. Mostrar formulario si hay un item seleccionado
    if (selectedItem) {
      return (
        <FoodEntryForm
          selectedItem={selectedItem}
          onAdd={handleAddFoodEntry}
          onCancel={handleCancelEntry}
          mealType={mealType}
          logDate={logDate}
          isPer100g={isPer100g}
          setIsPer100g={setIsPer100g}
        />
      );
    }

    // 2. Mostrar escáner si está abierto
    if (isScannerOpen) {
      return (
        <BarcodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      );
    }

    // --- INICIO DE LA MODIFICACIÓN ---
    // 3. Mostrar Spinner si está cargando (después de escanear)
    if (isLoading && !isScannerOpen && !selectedItem) {
      return (
        <div className="flex flex-col justify-center items-center h-[50vh]">
          <Spinner />
          <span className="mt-4 text-gray-300">Buscando producto...</span>
        </div>
      );
    }
    // --- FIN DE LA MODIFICACIÓN ---

    // 4. Mostrar contenido principal (Búsqueda, Tabs)
    return (
      <>
        <div className="flex items-center mb-4">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearch}
            isLoading={isLoading && activeTab === 'search'} // Solo mostrar spinner si la carga es de la búsqueda
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
          {error && <p className="text-red-400 text-center mb-4">{error}</p>}

          {activeTab === 'search' && (
            <SearchResults
              results={searchResults}
              onSelect={handleSelectFood}
              isLoading={isLoading}
            />
          )}
          {activeToob === 'favorites' && (
            <Favorites
              onSelect={handleSelectFood}
              logDate={logDate}
            />
          )}
          {activeTab === 'recent' && (
            <Recent
              onSelect={handleSelectFood}
              logDate={logDate}
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