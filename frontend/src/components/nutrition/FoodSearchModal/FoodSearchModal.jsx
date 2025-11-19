/* frontend/src/components/nutrition/FoodSearchModal/FoodSearchModal.jsx */
import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  StarIcon, 
  ClockIcon, 
  PencilIcon, 
  QrCodeIcon, 
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import Favorites from './Favorites';
import Recent from './Recent';
import FoodEntryForm from './FoodEntryForm';
import BarcodeScanner from '../../BarcodeScanner';
// --- INICIO DE LA CORRECCIÓN ---
// Importamos las funciones específicas directamente
import { searchFoods, searchByBarcode } from '../../../services/nutritionService';
import { createFavoriteMeal, deleteFavoriteMeal, getFavoriteMeals } from '../../../services/favoriteMealService';
import { useToast } from '../../../hooks/useToast';
// --- FIN DE LA CORRECCIÓN ---
import Spinner from '../../Spinner';

function FoodSearchModal({ isOpen, onClose, onAddFood, mealType, logDate }) {
  const { addToast } = useToast();

  // Estado de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado de navegación
  const [activeTab, setActiveTab] = useState('search'); // 'search' por defecto
  const [selectedItem, setSelectedItem] = useState(null); // Item seleccionado para ver detalles
  const [isPer100g, setIsPer100g] = useState(false);

  // Resetear estado al abrir el modal
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
      // --- CORRECCIÓN: Llamada directa a la función importada ---
      const results = await searchFoods(term);
      setSearchResults(results);
    } catch (err) {
      setError('Error buscando. Inténtalo de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFood = (food) => {
    // Preparar datos del alimento seleccionado
    let preparedFood;
    if (food.origin === 'scan') {
      const weight = food.weight_g || 100;
      preparedFood = {
        ...food,
        description: food.name || 'Producto Escaneado',
        serving_weight_g: weight,
        serving_size: food.serving_size || `${weight}g`,
        calories_per_100g: food.calories || 0,
        protein_per_100g: food.protein_g || 0,
        carbs_per_100g: food.carbs_g || 0,
        fat_per_100g: food.fats_g || 0,
        // Asumimos valores por ración iguales si no hay más datos
        calories_per_serving: food.calories || 0,
        protein_per_serving: food.protein_g || 0,
        carbs_per_serving: food.carbs_g || 0,
        fat_per_serving: food.fats_g || 0,
      };
    } else {
      preparedFood = {
        ...food,
        description: food.name || food.description || 'Alimento',
        serving_weight_g: food.serving_weight_g || 100,
        serving_size: food.serving_size || '1 ración',
        calories_per_100g: food.calories_per_100g ?? food.calories ?? 0,
        protein_per_100g: food.protein_per_100g ?? food.protein_g ?? 0,
        carbs_per_100g: food.carbs_per_100g ?? food.carbs_g ?? 0,
        fat_per_100g: food.fat_per_100g ?? food.fats_g ?? 0,
        calories_per_serving: food.calories_per_serving ?? food.calories ?? 0,
        protein_per_serving: food.protein_per_serving ?? food.protein_g ?? 0,
        carbs_per_serving: food.carbs_per_serving ?? food.carbs_g ?? 0,
        fat_per_serving: food.fat_per_serving ?? food.fats_g ?? 0,
      };
    }
    setSelectedItem(preparedFood);
  };

  const handleScanSuccess = async (barcode) => {
    setIsLoading(true);
    try {
      // --- CORRECCIÓN: Llamada directa a la función importada ---
      const foodData = await searchByBarcode(barcode);
      handleSelectFood({ ...foodData, origin: 'scan' });
    } catch (err) {
      setError('Producto no encontrado.');
      setActiveTab('search');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedItem(null); // Volver a la lista
    if (activeTab === 'manual' || activeTab === 'scan') {
      setActiveTab('search'); // Si venía de manual/scan, volver a buscar
    }
  };

  // --- Lógica de Guardado y Sincronización de Favoritos ---
  const handleEntrySubmit = async (entry) => {
    // 1. Añadir al log principal (Prioridad inmediata UI)
    onAddFood(entry);

    // 2. Gestionar favoritos en "segundo plano" si hubo cambios
    if (entry.isFavorite !== undefined) {
        handleFavoriteSync(entry);
    }

    onClose();
  };

  const handleFavoriteSync = async (entry) => {
      try {
          // CASO 1: Marcado como favorito pero no lo era antes -> CREAR
          if (entry.isFavorite && !entry.wasInitiallyFavorite) {
               const favData = {
                    name: entry.description,
                    calories: entry.calories_per_100g,
                    protein_g: entry.protein_per_100g,
                    carbs_g: entry.carbs_per_100g,
                    fats_g: entry.fat_per_100g,
                    weight_g: 100, // Normalizamos a 100g para la base de favoritos
                    image_url: entry.image_url,
                    calories_per_100g: entry.calories_per_100g,
                    protein_per_100g: entry.protein_per_100g,
                    carbs_per_100g: entry.carbs_per_100g,
                    fat_per_100g: entry.fat_per_100g,
                };
                await createFavoriteMeal(favData);
                addToast('Añadido a favoritos', 'success');
          
          // CASO 2: Desmarcado y sí lo era antes -> BORRAR
          } else if (!entry.isFavorite && entry.wasInitiallyFavorite) {
               const favs = await getFavoriteMeals();
               const found = favs.find(f => f.name.toLowerCase() === entry.description.toLowerCase());
               if (found) {
                   await deleteFavoriteMeal(found.id);
                   addToast('Eliminado de favoritos', 'info');
               }
          }
      } catch (err) {
          console.error("Error sincronizando favoritos", err);
          addToast('Error actualizando favoritos', 'error');
      }
  };

  if (!isOpen) return null;

  // --- Renderizado de Contenido ---
  const renderContent = () => {
    // 1. Si hay un ITEM SELECCIONADO -> Mostrar Formulario
    if (selectedItem) {
      return (
        <FoodEntryForm
          selectedItem={selectedItem}
          onAdd={handleEntrySubmit} // Usamos el handler modificado
          onCancel={handleBack}
          mealType={mealType}
          logDate={logDate}
          isPer100g={isPer100g}
          setIsPer100g={setIsPer100g}
        />
      );
    }

    // 2. Si NO hay item, mostrar el contenido de la pestaña activa
    switch (activeTab) {
      case 'search':
        return (
          <div className="flex flex-col h-full">
            <div className="mb-2">
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onSearch={handleSearch}
                isLoading={isLoading}
              />
            </div>
            {error && <p className="text-red-400 text-center text-sm mb-2">{error}</p>}
            <div className="flex-1 overflow-y-auto">
              <SearchResults
                results={searchResults}
                onSelect={handleSelectFood}
                isLoading={isLoading}
              />
            </div>
          </div>
        );
      case 'favorites':
        return <Favorites onSelect={handleSelectFood} logDate={logDate} />;
      case 'recent':
        return <Recent onSelect={handleSelectFood} logDate={logDate} />;
      case 'manual':
        // Formulario manual directo
        return (
          <FoodEntryForm
            selectedItem={{ description: '', calories_per_serving: 0, serving_weight_g: 100 }}
            onAdd={handleEntrySubmit} // Usamos el handler modificado
            onCancel={() => setActiveTab('search')}
            mealType={mealType}
            logDate={logDate}
            isPer100g={isPer100g}
            setIsPer100g={setIsPer100g}
          />
        );
      case 'scan':
        return (
          <div className="h-full flex flex-col relative">
             <BarcodeScanner
                onScanSuccess={handleScanSuccess}
                onClose={() => setActiveTab('search')}
             />
             {isLoading && (
               <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                 <Spinner />
                 <span className="ml-2 text-white">Buscando producto...</span>
               </div>
             )}
          </div>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    if (selectedItem) return 'Detalles';
    if (activeTab === 'manual') return 'Manual';
    if (activeTab === 'scan') return 'Escanear';
    return `Añadir a ${mealType}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700 flex flex-col h-[85vh]">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0 bg-gray-800">
          <div className="flex items-center gap-2">
             {(selectedItem || activeTab === 'manual' || activeTab === 'scan') && (
                <button onClick={handleBack} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700">
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
             )}
             <h2 className="text-lg font-bold text-white capitalize truncate">{getTitle()}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Pestañas (Solo visibles si NO hay item seleccionado) */}
        {!selectedItem && (
          <div className="flex border-b border-gray-700 bg-gray-800 overflow-x-auto shrink-0">
            <TabButton 
              icon={<MagnifyingGlassIcon className="w-5 h-5" />} 
              label="Buscar" 
              isActive={activeTab === 'search'} 
              onClick={() => setActiveTab('search')} 
            />
            <TabButton 
              icon={<StarIcon className="w-5 h-5" />} 
              label="Favoritas" 
              isActive={activeTab === 'favorites'} 
              onClick={() => setActiveTab('favorites')} 
            />
            <TabButton 
              icon={<ClockIcon className="w-5 h-5" />} 
              label="Recientes" 
              isActive={activeTab === 'recent'} 
              onClick={() => setActiveTab('recent')} 
            />
            <TabButton 
              icon={<PencilIcon className="w-5 h-5" />} 
              label="Manual" 
              isActive={activeTab === 'manual'} 
              onClick={() => setActiveTab('manual')} 
            />
            <TabButton 
              icon={<QrCodeIcon className="w-5 h-5" />} 
              label="Escanear" 
              isActive={activeTab === 'scan'} 
              onClick={() => setActiveTab('scan')} 
            />
          </div>
        )}

        {/* Contenido Principal */}
        <div className="flex-1 overflow-hidden relative p-4">
          {renderContent()}
        </div>

      </div>
    </div>
  );
}

// Componente de Botón de Pestaña
const TabButton = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 min-w-[70px] flex flex-col items-center justify-center py-3 px-1 transition-all border-b-2 outline-none
      ${isActive 
        ? 'border-blue-500 text-blue-400 bg-gray-700/30' 
        : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700/20'
      }
    `}
  >
    <div className="mb-1">{icon}</div>
    <span className="text-xs font-medium truncate w-full text-center">{label}</span>
  </button>
);

export default FoodSearchModal;