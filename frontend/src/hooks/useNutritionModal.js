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
  } = useAppStore((state) => ({
    favoriteMeals: state.favoriteMeals,
    addFavoriteMeal: state.addFavoriteMeal,
    deleteFavoriteMeal: state.deleteFavoriteMeal,
    updateFavoriteMeal: state.updateFavoriteMeal,
  }));

  const [isDarkTheme] = useState(
    () =>
      typeof document !== 'undefined' &&
      !document.body.classList.contains('light-theme')
  );

  // --- HOOKS MODULARIZADOS ---

  const {
    isLoadingRecents,
    filteredRecents,
    paginatedFavorites,
    totalPages,
  } = useNutritionData(activeTab, favoriteMeals, searchTerm, favoritesPage);

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
    if (isEditingLog) return logToEdit;
    if (editingFavorite) return editingFavorite;
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