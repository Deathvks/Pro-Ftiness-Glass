/* frontend/src/hooks/useNutritionModal.js */
import { useState, useEffect, useMemo } from 'react';
import useAppStore from '../store/useAppStore';
import { useToast } from './useToast';
import { mealTitles } from './useNutritionConstants';
import { useNutritionData } from './useNutritionData';
import { useManualForm } from './useManualForm';
import { useItemList } from './useItemList';
import { useScanAndUpload } from './useScanAndUpload';
import { useSaveActions } from './useSaveActions';

export const useNutritionModal = ({ mealType, onSave, onClose, logToEdit }) => {
  const isEditingLog = Boolean(logToEdit);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(
    isEditingLog ? 'manual' : 'favorites'
  );
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [mealToDelete, setMealToDelete] = useState(null);
  const [editingListItemId, setEditingListItemId] = useState(null);
  const [editingFavorite, setEditingFavorite] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isPer100g, setIsPer100g] = useState(false);

  const { addToast } = useToast();

  // --- INICIO DE LA MODIFICACIÓN ---
  // Obtenemos nutritionLog y recentMeals para la sincronización de imágenes
  const {
    favoriteMeals,
    addFavoriteMeal,
    deleteFavoriteMeal,
    updateFavoriteMeal,
    nutritionLog,
    recentMeals
  } = useAppStore((state) => ({
    favoriteMeals: state.favoriteMeals,
    addFavoriteMeal: state.addFavoriteMeal,
    deleteFavoriteMeal: state.deleteFavoriteMeal,
    updateFavoriteMeal: state.updateFavoriteMeal,
    nutritionLog: state.nutritionLog,
    recentMeals: state.recentMeals || [],
  }));
  // --- FIN DE LA MODIFICACIÓN ---

  const [isDarkTheme] = useState(
    () =>
      typeof document !== 'undefined' &&
      !document.body.classList.contains('light-theme')
  );

  // --- HOOKS MODULARIZADOS ---

  const {
    isLoadingRecents,
    filteredRecents: rawFilteredRecents, // Renombramos para procesar
    paginatedFavorites: rawPaginatedFavorites, // Renombramos para procesar
    totalPages,
  } = useNutritionData(activeTab, favoriteMeals, searchTerm, favoritesPage);

  // --- INICIO DE LA MODIFICACIÓN ---
  // Lógica de "mapa de imágenes" para sincronizar la vista del modal 
  // con las imágenes más recientes (mismo mecanismo que en Nutrition.jsx)
  const imageMap = useMemo(() => {
    const map = {};
    const mergeItems = (items) => {
      if (!items) return;
      items.forEach(item => {
        const name = item.description || item.name;
        if (!name) return;
        const key = name.toLowerCase().trim();
        const img = item.image_url || item.image || item.img;
        if (img) {
          const ts = item.updated_at ? new Date(item.updated_at).getTime() : 0;
          if (!map[key] || ts >= map[key].timestamp) {
            map[key] = { url: img, timestamp: ts };
          }
        }
      });
    };

    mergeItems(favoriteMeals);
    mergeItems(recentMeals);
    mergeItems(nutritionLog);
    return map;
  }, [nutritionLog, favoriteMeals, recentMeals]);

  // Función auxiliar para aplicar la mejor imagen a una lista de items
  const patchItemsWithImage = (items) => {
    if (!items) return [];
    return items.map(item => {
      const key = (item.name || item.description || '').toLowerCase().trim();
      const bestImage = imageMap[key];

      if (bestImage && bestImage.url) {
        return {
          ...item,
          image_url: bestImage.url,
          updated_at: bestImage.timestamp // Pasamos el timestamp para el cache busting
        };
      }
      return item;
    });
  };

  // Listas con imágenes sincronizadas
  const filteredRecents = useMemo(() => patchItemsWithImage(rawFilteredRecents), [rawFilteredRecents, imageMap]);
  const paginatedFavorites = useMemo(() => patchItemsWithImage(rawPaginatedFavorites), [rawPaginatedFavorites, imageMap]);
  // --- FIN DE LA MODIFICACIÓN ---

  const {
    itemsToAdd,
    addModeType,
    setAddModeType,
    handleAddManualItem, // Original
    handleAddFavoriteItem, // Original
    handleAddRecentItem, // Original
    handleRemoveItem, // Original
    handleToggleFavorite,
    handleEditListItem,
    handleSaveListItem, // Original
  } = useItemList({
    editingListItemId,
    setEditingListItemId,
    setEditingFavorite,
    setIsPer100g,
    // Ya no pasamos resetManualForm aquí
  });

  // Determinamos el item a editar aquí, en el hook principal
  const itemToEdit = useMemo(() => {
    if (isEditingLog && logToEdit) {
       // Normalizamos las propiedades para asegurar que el formulario reciba lo que espera (sugars_g)
      return {
        ...logToEdit,
        sugars_g: logToEdit.sugars_g ?? logToEdit.sugars ?? 0,
        protein_g: logToEdit.protein_g ?? logToEdit.protein ?? 0,
        carbs_g: logToEdit.carbs_g ?? logToEdit.carbs ?? 0,
        fats_g: logToEdit.fats_g ?? logToEdit.fats ?? logToEdit.fat ?? 0,
      };
    }
    
    // --- CORRECCIÓN: Cálculo consistente al editar favoritos ---
    if (editingFavorite) {
        // Si tenemos datos por 100g y un peso válido, recalculamos los totales 
        // para asegurar que el formulario muestra lo correcto, aunque el total guardado sea 0 o erróneo.
        const { weight_g, calories_per_100g } = editingFavorite;
        
        // Verificamos si vale la pena recalcular (si hay datos base)
        if (weight_g > 0 && calories_per_100g !== null && calories_per_100g !== undefined) {
            const factor = weight_g / 100;
            return {
                ...editingFavorite,
                // Recalculamos los totales basándonos en los 100g para garantizar consistencia matemática
                calories: (editingFavorite.calories_per_100g || 0) * factor,
                protein_g: (editingFavorite.protein_per_100g || 0) * factor,
                carbs_g: (editingFavorite.carbs_per_100g || 0) * factor,
                fats_g: (editingFavorite.fat_per_100g || 0) * factor,
                sugars_g: (editingFavorite.sugars_per_100g || 0) * factor,
            };
        }
        return editingFavorite;
    }

    if (editingListItemId) {
      return itemsToAdd.find((item) => item.tempId === editingListItemId);
    }
    return null; // No hay nada que editar
  }, [
    isEditingLog,
    logToEdit,
    editingFavorite,
    editingListItemId,
    itemsToAdd,
  ]);

  const {
    manualFormState,
    setManualFormState,
    setBaseMacros,
    originalData,
    setOriginalData,
    resetManualForm,
  } = useManualForm({
    itemToEdit, // Pasamos el item a editar directamente
    favoriteMeals,
    isPer100g,
    setIsPer100g,
  });

  const { isUploading, handleScanSuccess, handleImageUpload } =
    useScanAndUpload({
      setShowScanner,
      setManualFormState,
      setBaseMacros,
      setOriginalData,
      setActiveTab,
      setAddModeType,
      setIsPer100g,
    });

  const { handleSaveList, handleSaveSingle, handleSaveEdit } = useSaveActions({
    itemsToAdd,
    onSave,
    onClose,
    resetManualForm, // Pasamos la función de reseteo
    setAddModeType,
    originalData,
    isEditingLog,
    editingFavorite,
    setEditingFavorite,
    setActiveTab,
    logToEdit,
    manualFormState,
    // --- AÑADIDO: Pasamos isPer100g al action handler para guardar correctamente ---
    isPer100g 
  });

  // --- LÓGICA DE CONEXIÓN (El Arreglo) ---
  // Creamos funciones "mejoradas" que llaman a las originales
  // y luego ejecutan la lógica de reseteo del formulario.

  const enhancedHandleAddManualItem = (item) => {
    handleAddManualItem(item); // Llama al hook de lista
    resetManualForm(); // Resetea el formulario (lógica movida aquí)
  };

  const enhancedHandleAddFavoriteItem = (item) => {
    handleAddFavoriteItem(item);
    // No necesita resetear el formulario manual
  };

  const enhancedHandleAddRecentItem = (item) => {
    handleAddRecentItem(item);
    // No necesita resetear el formulario manual
  };

  const enhancedHandleRemoveItem = (tempId) => {
    const isEditingThisItem = editingListItemId === tempId;
    handleRemoveItem(tempId); // Llama al hook de lista
    if (isEditingThisItem) {
      resetManualForm(); // Resetea el formulario si estábamos editando este item
    }
  };

  const enhancedHandleSaveListItem = (updatedItem) => {
    const shouldSwitchTab = handleSaveListItem(updatedItem); // Llama al hook de lista
    resetManualForm(); // Resetea el formulario
    if (shouldSwitchTab) {
      setActiveTab('favorites');
    }
  };

  // --- LÓGICA RESTANTE (Gestión de estado principal) ---

  useEffect(() => {
    setFavoritesPage(1);
  }, [searchTerm, activeTab]);

  useEffect(() => {
    if (editingListItemId || isEditingLog || editingFavorite)
      setActiveTab('manual');
  }, [editingListItemId, isEditingLog, editingFavorite]);

  const handleDeleteFavorite = (meal) => setMealToDelete(meal);
  const confirmDeleteFavorite = async () => {
    if (!mealToDelete) return;
    const result = await deleteFavoriteMeal(mealToDelete.id);
    addToast(result.message, result.success ? 'success' : 'error');
    setMealToDelete(null);
  };

  const handleEditFavorite = (favoriteMeal) => {
    setEditingListItemId(null);
    setEditingFavorite(favoriteMeal);
    setIsPer100g(false);
  };

  const title = isEditingLog
    ? `Editar ${logToEdit.description}`
    : editingFavorite
      ? `Editar Favorito: ${editingFavorite.name}`
      : `Añadir a ${mealTitles[mealType]}`;

  return {
    isEditingLog,
    editingFavorite,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    itemsToAdd,
    favoritesPage,
    setFavoritesPage,
    mealToDelete,
    setMealToDelete,
    editingListItemId,
    manualFormState,
    setManualFormState,
    showScanner,
    setShowScanner,
    paginatedFavorites,
    filteredRecents,
    isLoadingRecents,
    totalPages,
    isDarkTheme,
    // Handlers de useItemList (versiones mejoradas)
    handleAddManualItem: enhancedHandleAddManualItem,
    handleAddFavoriteItem: enhancedHandleAddFavoriteItem,
    handleAddRecentItem: enhancedHandleAddRecentItem,
    handleRemoveItem: enhancedHandleRemoveItem,
    handleToggleFavorite,
    handleEditListItem,
    handleSaveListItem: enhancedHandleSaveListItem,
    // Handlers de useSaveActions
    handleSaveList,
    handleSaveSingle,
    handleSaveEdit,
    // Handlers de useScanAndUpload
    handleScanSuccess,
    handleImageUpload,
    isUploading,
    // Handlers locales
    handleDeleteFavorite,
    confirmDeleteFavorite,
    handleEditFavorite,
    // Otros
    title,
    addModeType,
    isPer100g,
    setIsPer100g,
  };
};