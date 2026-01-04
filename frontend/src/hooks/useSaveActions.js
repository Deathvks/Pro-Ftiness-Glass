/* frontend/src/hooks/useSaveActions.js */
import { useMemo } from 'react';
import { useToast } from './useToast';
import useAppStore from '../store/useAppStore';

export const useSaveActions = ({
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
}) => {
  const { addToast } = useToast();
  const {
    favoriteMeals,
    addFavoriteMeal,
    updateFavoriteMeal,
    deleteFavoriteMeal,
  } = useAppStore((state) => ({
    favoriteMeals: state.favoriteMeals,
    addFavoriteMeal: state.addFavoriteMeal,
    updateFavoriteMeal: state.updateFavoriteMeal,
    deleteFavoriteMeal: state.deleteFavoriteMeal,
  }));

  // Memoizamos si el item *original* era favorito
  const isOriginallyFavorite = useMemo(() => {
    if (editingFavorite) return true;
    if (originalData) {
      const originalName = (originalData.description || originalData.name)?.trim().toLowerCase();
      return originalName && favoriteMeals.some(fav => fav.name.toLowerCase() === originalName);
    }
    return false;
  }, [originalData, editingFavorite, favoriteMeals]);

  // --- INICIO DE LA MODIFICACIÓN: Helper para preparar el payload de favoritos ---
  const prepareFavoritePayload = (item) => {
    const weight = parseFloat(item.weight_g) || 100;

    // Cálculo robusto de valores por 100g si faltan
    // Priorizamos el valor explícito, si no, calculamos desde el total
    const getPer100 = (valPer100, totalVal) => {
      if (valPer100 !== undefined && valPer100 !== null) return parseFloat(valPer100);
      return (parseFloat(totalVal || 0) / weight) * 100;
    };

    return {
      name: item.name || item.description || 'Sin nombre',
      calories: parseFloat(item.calories) || 0,
      protein_g: parseFloat(item.protein_g) || 0,
      carbs_g: parseFloat(item.carbs_g) || 0,
      fats_g: parseFloat(item.fats_g || item.fat_g || item.fats || 0), // Soporte para variaciones de nombre
      weight_g: weight,
      image_url: item.image_url || null,
      micronutrients: item.micronutrients || null,

      calories_per_100g: getPer100(item.calories_per_100g, item.calories),
      protein_per_100g: getPer100(item.protein_per_100g, item.protein_g),
      carbs_per_100g: getPer100(item.carbs_per_100g, item.carbs_g),
      fat_per_100g: getPer100(item.fat_per_100g || item.fats_per_100g, item.fats_g || item.fat_g || item.fats),
    };
  };
  // --- FIN DE LA MODIFICACIÓN ---

  const handleSaveList = async () => {
    if (itemsToAdd.length === 0)
      return addToast('No has añadido ninguna comida.', 'info');

    const newFavorites = itemsToAdd.filter((item) => item.isFavorite);

    if (newFavorites.length > 0) {
      try {
        await Promise.all(
          newFavorites.map((fav) => {
            const payload = prepareFavoritePayload(fav);
            return addFavoriteMeal(payload);
          })
        );
        addToast(
          `${newFavorites.length} comida(s) guardada(s) en favoritos.`,
          'success'
        );
      } catch (error) {
        console.error("Error guardando favoritos:", error);
        addToast(error.message || 'Error al guardar en favoritos.', 'error');
      }
    }
    onSave(itemsToAdd);
  };

  const handleSaveSingle = async (itemData) => {
    const item = itemData[0];
    if (item.saveAsFavorite) {
      try {
        const payload = prepareFavoritePayload(item);
        await addFavoriteMeal(payload);
        addToast(`'${item.description}' guardado en favoritos.`, 'success');
      } catch (error) {
        console.error("Error guardando favorito single:", error);
        addToast(error.message || 'Error al guardar en favoritos.', 'error');
      }
    }
    resetManualForm();
    setAddModeType(null);
    onSave(itemData);
  };

  const handleSaveEdit = async (formData) => {
    let hasDataChanged = false;
    let hasFavoriteStatusChanged = false;

    // 1. Comprobar si los datos del formulario han cambiado respecto a los originales
    if (originalData && (isEditingLog || editingFavorite)) {
      const originalMicros = JSON.stringify(originalData.micronutrients || null);
      const newMicros = JSON.stringify(formData.micronutrients || null);
      hasDataChanged =
        originalData.description !== formData.description ||
        (parseFloat(originalData.calories) || 0) !== formData.calories ||
        (parseFloat(originalData.protein_g) || 0) !== formData.protein_g ||
        (parseFloat(originalData.carbs_g) || 0) !== formData.carbs_g ||
        (parseFloat(originalData.fats_g) || 0) !== formData.fats_g ||
        (parseFloat(originalData.weight_g) || null) !== formData.weight_g ||
        originalData.image_url !== formData.image_url ||
        originalMicros !== newMicros;
    }

    // 2. Comprobar si el estado de favorito ha cambiado
    hasFavoriteStatusChanged = manualFormState.isFavorite !== isOriginallyFavorite;

    // 3. Salir si no ha cambiado nada
    if (!hasDataChanged && !hasFavoriteStatusChanged) {
      addToast('No se detectaron cambios.', 'info');
      if (editingFavorite) {
        setEditingFavorite(null);
        setActiveTab('favorites');
      }
      if (isEditingLog) {
        onClose();
      }
      resetManualForm();
      return;
    }

    let favoriteOperationSuccess = true;

    // 4. Gestionar el estado de favorito
    if (hasFavoriteStatusChanged || (editingFavorite && hasDataChanged)) {
      // Usamos el helper también aquí
      const basePayload = prepareFavoritePayload(formData);

      // Combinamos con el payload preparado para asegurar consistencia
      const favData = { ...basePayload };

      const existingFavoriteByName = favoriteMeals.find(
        (fav) => fav.name.toLowerCase() === formData.description.toLowerCase()
      );

      try {
        if (manualFormState.isFavorite) {
          if (existingFavoriteByName) {
            const result = await updateFavoriteMeal(existingFavoriteByName.id, { ...existingFavoriteByName, ...favData });
            if (result.success) {
              addToast(`Favorito '${formData.description}' actualizado.`, 'success');
            } else {
              throw new Error(result.message);
            }
          } else {
            const result = await addFavoriteMeal(favData);
            if (result.success) {
              addToast(`'${formData.description}' guardado en favoritos.`, 'success');
            } else {
              throw new Error(result.message);
            }
          }
        } else if (!manualFormState.isFavorite && isOriginallyFavorite) {
          const favoriteToDeleteId = editingFavorite?.id || favoriteMeals.find(fav => fav.name.toLowerCase() === (originalData?.description || originalData?.name)?.trim().toLowerCase())?.id;

          if (favoriteToDeleteId) {
            const result = await deleteFavoriteMeal(favoriteToDeleteId);
            if (result.success) {
              addToast(`'${originalData?.description || originalData?.name}' eliminado de favoritos.`, 'info');
            } else {
              throw new Error(result.message);
            }
          }
        }
      } catch (error) {
        console.error("Error gestionando favorito en edit:", error);
        addToast(error.message || 'Error al gestionar el favorito.', 'error');
        favoriteOperationSuccess = false;
      }
    }


    // 5. Lógica para editar favorito directamente
    if (editingFavorite) {
      if (favoriteOperationSuccess) {
        setEditingFavorite(null);
        resetManualForm();
        setActiveTab('favorites');
      }
      return;
    }


    // 6. Lógica para actualizar el log de nutrición
    if (isEditingLog && (hasDataChanged || (hasFavoriteStatusChanged && favoriteOperationSuccess))) {
      onSave([{ ...logToEdit, ...formData }], true);
    } else if (isEditingLog && hasFavoriteStatusChanged && !favoriteOperationSuccess) {
      addToast("El log no se actualizó debido a un error al gestionar el favorito.", "warning");
    }

    if (!isEditingLog && favoriteOperationSuccess) {
      resetManualForm();
    }
  };


  return {
    handleSaveList,
    handleSaveSingle,
    handleSaveEdit,
  };
};