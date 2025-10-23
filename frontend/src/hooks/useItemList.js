/* frontend/src/hooks/useItemList.js */
import { useState, useEffect } from 'react';
import { useToast } from './useToast';
// Ya no importamos 'initialManualFormState' ni 'resetManualForm'

export const useItemList = ({
  editingListItemId,
  setEditingListItemId,
  setEditingFavorite,
  setIsPer100g,
  // Eliminamos 'resetManualForm' de las props
}) => {
  const [itemsToAdd, setItemsToAdd] = useState([]);
  const [addModeType, setAddModeType] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (itemsToAdd.length === 0) setAddModeType(null);
  }, [itemsToAdd]);

  const handleAddItem = (item, origin = 'manual') => {
    if (origin === 'manual' || origin === 'scan') setAddModeType('manual');
    else setAddModeType('list');
    const description = item.name || item.description;
    const baseWeight =
      parseFloat(item.weight_g) ||
      (origin === 'manual' ? 0 : description ? 100 : 0);
    const newItem = {
      ...item,
      tempId: `item-${Date.now()}-${Math.random()}`,
      description: description,
      name: description,
      isFavorite: item.isFavorite || false,
      calories: parseFloat(item.calories) || 0,
      protein_g: parseFloat(item.protein_g) || 0,
      carbs_g: parseFloat(item.carbs_g) || 0,
      fats_g: parseFloat(item.fats_g) || 0,
      weight_g: parseFloat(item.weight_g) || null,
      image_url: item.image_url || null,
      base:
        baseWeight > 0
          ? {
            calories: (parseFloat(item.calories) || 0) / baseWeight,
            protein_g: (parseFloat(item.protein_g) || 0) / baseWeight,
            carbs_g: (parseFloat(item.carbs_g) || 0) / baseWeight,
            fats_g: (parseFloat(item.fats_g) || 0) / baseWeight,
          }
          : null,
      origin,
    };
    setItemsToAdd((prev) => [...prev, newItem]);
    addToast(`${description} añadido a la lista.`, 'success');

    // Eliminamos la lógica de reseteo de aquí
    // if (origin === 'manual') {
    //   resetManualForm();
    // }
    setIsPer100g(false);
  };

  const handleAddManualItem = (item) => handleAddItem(item, 'manual');
  const handleAddFavoriteItem = (item) => handleAddItem(item, 'favorite');
  const handleAddRecentItem = (item) => handleAddItem(item, 'recent');

  const handleRemoveItem = (tempId) => {
    // Eliminamos la lógica de reseteo de aquí
    // if (editingListItemId === tempId) {
    //   setEditingListItemId(null);
    //   resetManualForm();
    // }
    setItemsToAdd((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const handleToggleFavorite = (tempId) => {
    setItemsToAdd((prevItems) =>
      prevItems.map((item) =>
        item.tempId === tempId ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const handleEditListItem = (tempId) => {
    setEditingFavorite(null);
    setEditingListItemId(tempId);
    setIsPer100g(false);
  };

  const handleSaveListItem = (updatedItem) => {
    const description = updatedItem.description || updatedItem.name;
    setItemsToAdd((prev) =>
      prev.map((item) => (item.tempId === updatedItem.tempId ? updatedItem : item))
    );
    setEditingListItemId(null);
    addToast(`${description} actualizado.`, 'success');
    // Eliminamos la lógica de reseteo de aquí
    // resetManualForm();
    
    // Devolvemos 'true' para indicar que se debe cambiar la pestaña
    return true;
  };

  return {
    itemsToAdd,
    setItemsToAdd,
    addModeType,
    setAddModeType,
    handleAddItem,
    handleAddManualItem,
    handleAddFavoriteItem,
    handleAddRecentItem,
    handleRemoveItem,
    handleToggleFavorite,
    handleEditListItem,
    handleSaveListItem,
  };
};