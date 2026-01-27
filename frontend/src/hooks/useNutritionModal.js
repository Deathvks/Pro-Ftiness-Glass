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

  const [isDarkTheme] = useState(
    () =>
      typeof document !== 'undefined' &&
      !document.body.classList.contains('light-theme')
  );

  const {
    isLoadingRecents,
    filteredRecents: rawFilteredRecents,
    paginatedFavorites: rawPaginatedFavorites,
    totalPages,
  } = useNutritionData(activeTab, favoriteMeals, searchTerm, favoritesPage);

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

  const patchItemsWithImage = (items) => {
    if (!items) return [];
    return items.map(item => {
      const key = (item.name || item.description || '').toLowerCase().trim();
      const bestImage = imageMap[key];

      if (bestImage && bestImage.url) {
        return {
          ...item,
          image_url: bestImage.url,
          updated_at: bestImage.timestamp
        };
      }
      return item;
    });
  };

  const filteredRecents = useMemo(() => patchItemsWithImage(rawFilteredRecents), [rawFilteredRecents, imageMap]);
  const paginatedFavorites = useMemo(() => patchItemsWithImage(rawPaginatedFavorites), [rawPaginatedFavorites, imageMap]);

  const {
    itemsToAdd,
    addModeType,
    setAddModeType,
    handleAddManualItem,
    handleAddFavoriteItem,
    handleAddRecentItem,
    handleRemoveItem,
    handleToggleFavorite,
    handleEditListItem,
    handleSaveListItem,
  } = useItemList({
    editingListItemId,
    setEditingListItemId,
    setEditingFavorite,
    setIsPer100g,
  });

  // Determinamos el item a editar aquí, en el hook principal
  const itemToEdit = useMemo(() => {
    if (isEditingLog && logToEdit) {
      return {
        ...logToEdit,
        sugars_g: logToEdit.sugars_g ?? logToEdit.sugars ?? 0,
        protein_g: logToEdit.protein_g ?? logToEdit.protein ?? 0,
        carbs_g: logToEdit.carbs_g ?? logToEdit.carbs ?? 0,
        fats_g: logToEdit.fats_g ?? logToEdit.fats ?? logToEdit.fat ?? 0,
      };
    }
    
    // --- CORRECCIÓN DEFINITIVA: Cálculo robusto al editar favoritos ---
    if (editingFavorite) {
        const { weight_g, calories_per_100g } = editingFavorite;
        
        // Convertimos a números para evitar problemas con strings "100" vs números 100
        const weight = parseFloat(weight_g);
        const cal100 = parseFloat(calories_per_100g);
        
        // Verificamos si vale la pena recalcular (si hay peso > 0 y datos por 100g válidos)
        if (!isNaN(weight) && weight > 0 && !isNaN(cal100)) {
            const factor = weight / 100;
            
            // Helper para obtener valor seguro de propiedades variantes (fat vs fats)
            const getVal = (key1, key2) => {
                const v1 = parseFloat(editingFavorite[key1]);
                const v2 = parseFloat(editingFavorite[key2]);
                return !isNaN(v1) ? v1 : (!isNaN(v2) ? v2 : 0);
            };

            return {
                ...editingFavorite,
                // Recalculamos los totales basándonos en los 100g para garantizar consistencia matemática
                calories: cal100 * factor,
                protein_g: getVal('protein_per_100g', 'proteins_per_100g') * factor,
                carbs_g: getVal('carbs_per_100g', 'carb_per_100g') * factor,
                // Aquí es donde solía fallar: chequeamos fat Y fats
                fats_g: getVal('fat_per_100g', 'fats_per_100g') * factor,
                sugars_g: getVal('sugars_per_100g', 'sugar_per_100g') * factor,
            };
        }
        return editingFavorite;
    }

    if (editingListItemId) {
      return itemsToAdd.find((item) => item.tempId === editingListItemId);
    }
    return null;
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
    itemToEdit,
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
    resetManualForm,
    setAddModeType,
    originalData,
    isEditingLog,
    editingFavorite,
    setEditingFavorite,
    setActiveTab,
    logToEdit,
    manualFormState,
    isPer100g 
  });

  const enhancedHandleAddManualItem = (item) => {
    handleAddManualItem(item);
    resetManualForm();
  };

  const enhancedHandleAddFavoriteItem = (item) => {
    handleAddFavoriteItem(item);
  };

  const enhancedHandleAddRecentItem = (item) => {
    handleAddRecentItem(item);
  };

  const enhancedHandleRemoveItem = (tempId) => {
    const isEditingThisItem = editingListItemId === tempId;
    handleRemoveItem(tempId);
    if (isEditingThisItem) {
      resetManualForm();
    }
  };

  const enhancedHandleSaveListItem = (updatedItem) => {
    const shouldSwitchTab = handleSaveListItem(updatedItem);
    resetManualForm();
    if (shouldSwitchTab) {
      setActiveTab('favorites');
    }
  };

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
    // Handlers
    handleAddManualItem: enhancedHandleAddManualItem,
    handleAddFavoriteItem: enhancedHandleAddFavoriteItem,
    handleAddRecentItem: enhancedHandleAddRecentItem,
    handleRemoveItem: enhancedHandleRemoveItem,
    handleToggleFavorite,
    handleEditListItem,
    handleSaveListItem: enhancedHandleSaveListItem,
    handleSaveList,
    handleSaveSingle,
    handleSaveEdit,
    handleScanSuccess,
    handleImageUpload,
    isUploading,
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