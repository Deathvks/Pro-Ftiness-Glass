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

  // Helper para preparar el payload de favoritos
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
      sugars_g: parseFloat(item.sugars_g || item.sugars || 0), // Azúcar
      weight_g: weight,
      image_url: item.image_url || null,
      micronutrients: item.micronutrients || null,

      calories_per_100g: getPer100(item.calories_per_100g, item.calories),
      protein_per_100g: getPer100(item.protein_per_100g, item.protein_g),
      carbs_per_100g: getPer100(item.carbs_per_100g, item.carbs_g),
      fat_per_100g: getPer100(item.fat_per_100g || item.fats_per_100g, item.fats_g || item.fat_g || item.fats),
      sugars_per_100g: getPer100(item.sugars_per_100g, item.sugars_g || item.sugars), // Azúcar por 100g
    };
  };

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
    let hasFavoriteStatusChanged = manualFormState.isFavorite !== isOriginallyFavorite;

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
        (parseFloat(originalData.sugars_g) || 0) !== formData.sugars_g ||
        (parseFloat(originalData.weight_g) || null) !== formData.weight_g ||
        originalData.image_url !== formData.image_url ||
        originalMicros !== newMicros;
    }

    // 2. Salir si no ha cambiado nada
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
    const basePayload = prepareFavoritePayload(formData);
    const originalName = (originalData?.description || originalData?.name || '').trim().toLowerCase();
    const existingFavorite = favoriteMeals.find(fav => fav.name.toLowerCase() === originalName);

    // 3. GESTIÓN DE FAVORITOS SEGÚN EL MODO (LÓGICA SEPARADA)
    try {
      if (editingFavorite) {
        // MODO A: Editando desde la pestaña de Favoritos
        // -> SÍ actualizamos el producto base en la base de datos
        if (manualFormState.isFavorite) {
          const result = await updateFavoriteMeal(editingFavorite.id, { ...editingFavorite, ...basePayload });
          if (result.success) {
            addToast(`Favorito '${formData.description}' actualizado.`, 'success');
          } else {
            throw new Error(result.message);
          }
        } else {
          // Si quita la estrella mientras edita un favorito, lo elimina
          const result = await deleteFavoriteMeal(editingFavorite.id);
          if (result.success) {
            addToast(`'${originalData?.description}' eliminado de favoritos.`, 'info');
          } else {
            throw new Error(result.message);
          }
        }

      } else if (isEditingLog) {
        // MODO B: Editando desde el Log Diario 
        // -> NUNCA SE ACTUALIZAN LOS MACROS DEL FAVORITO BASE
        if (hasFavoriteStatusChanged) {
          if (manualFormState.isFavorite) {
            // El usuario marcó la estrella para añadirlo. Si ya existe, NO hacemos nada para no sobreescribir.
            if (!existingFavorite) {
              const result = await addFavoriteMeal(basePayload);
              if (result.success) {
                addToast(`'${formData.description}' añadido a favoritos.`, 'success');
              } else {
                throw new Error(result.message);
              }
            }
          } else {
            // El usuario desmarcó la estrella para quitarlo de favoritos
            if (existingFavorite) {
              const result = await deleteFavoriteMeal(existingFavorite.id);
              if (result.success) {
                addToast(`'${originalData?.description}' eliminado de favoritos.`, 'info');
              } else {
                throw new Error(result.message);
              }
            }
          }
        }

      } else {
        // MODO C: Editando un elemento de la lista temporal antes de guardarlo
        if (hasFavoriteStatusChanged && manualFormState.isFavorite && !existingFavorite) {
          const result = await addFavoriteMeal(basePayload);
          if (!result.success) throw new Error(result.message);
        } else if (hasFavoriteStatusChanged && !manualFormState.isFavorite && existingFavorite) {
          const result = await deleteFavoriteMeal(existingFavorite.id);
          if (!result.success) throw new Error(result.message);
        }
      }
    } catch (error) {
      console.error("Error gestionando favorito en edit:", error);
      addToast(error.message || 'Error al gestionar el favorito.', 'error');
      favoriteOperationSuccess = false;
    }

    // 4. Lógica de cierre para Favoritos
    if (editingFavorite) {
      if (favoriteOperationSuccess) {
        setEditingFavorite(null);
        resetManualForm();
        setActiveTab('favorites');
      }
      return;
    }

    // 5. Lógica para actualizar el Log Diario
    if (isEditingLog && (hasDataChanged || (hasFavoriteStatusChanged && favoriteOperationSuccess))) {
      // Pasamos los datos al componente superior, que actualizará SOLO el log de ese día.
      onSave([{ ...logToEdit, ...formData }], true);
    } else if (isEditingLog && hasFavoriteStatusChanged && !favoriteOperationSuccess) {
      addToast("El log no se actualizó debido a un error al gestionar el favorito.", "warning");
    }

    // Limpiar formulario si no es log
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