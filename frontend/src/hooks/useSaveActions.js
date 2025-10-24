/* frontend/src/hooks/useSaveActions.js */
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
  } = useAppStore((state) => ({
    favoriteMeals: state.favoriteMeals,
    addFavoriteMeal: state.addFavoriteMeal,
    updateFavoriteMeal: state.updateFavoriteMeal,
  }));

  const handleSaveList = async () => {
    if (itemsToAdd.length === 0)
      return addToast('No has añadido ninguna comida.', 'info');
    const newFavorites = itemsToAdd.filter((item) => item.isFavorite);
    if (newFavorites.length > 0) {
      try {
        await Promise.all(
          newFavorites.map((fav) =>
            addFavoriteMeal({
              name: fav.description,
              calories: fav.calories,
              protein_g: fav.protein_g,
              carbs_g: fav.carbs_g,
              fats_g: fav.fats_g,
              weight_g: fav.weight_g,
              image_url: fav.image_url || null,
              // --- INICIO DE LA MODIFICACIÓN ---
              micronutrients: fav.micronutrients || null,
              // --- FIN DE LA MODIFICACIÓN ---
            })
          )
        );
        addToast(
          `${newFavorites.length} comida(s) guardada(s) en favoritos.`,
          'success'
        );
      } catch (error) {
        addToast(error.message || 'Error al guardar en favoritos.', 'error');
      }
    }
    onSave(itemsToAdd);
  };

  const handleSaveSingle = async (itemData) => {
    const item = itemData[0];
    if (item.saveAsFavorite) {
      try {
        await addFavoriteMeal({
          name: item.description,
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fats_g: item.fats_g,
          weight_g: item.weight_g,
          image_url: item.image_url || null,
          // --- INICIO DE LA MODIFICACIÓN ---
          micronutrients: item.micronutrients || null,
          // --- FIN DE LA MODIFICACIÓN ---
        });
        addToast(`'${item.description}' guardado en favoritos.`, 'success');
      } catch (error) {
        addToast(error.message || 'Error al guardar en favoritos.', 'error');
      }
    }
    resetManualForm();
    setAddModeType(null);
    onSave(itemData);
  };

  const handleSaveEdit = async (formData) => {
    if (originalData && (isEditingLog || editingFavorite)) {
      // --- INICIO DE LA MODIFICACIÓN ---
      // Comparamos JSON stringify para micronutrientes
      const originalMicros = JSON.stringify(originalData.micronutrients || null);
      const newMicros = JSON.stringify(formData.micronutrients || null);

      const hasChanged =
        originalData.description !== formData.description ||
        (parseFloat(originalData.calories) || 0) !== formData.calories ||
        (parseFloat(originalData.protein_g) || 0) !== formData.protein_g ||
        (parseFloat(originalData.carbs_g) || 0) !== formData.carbs_g ||
        (parseFloat(originalData.fats_g) || 0) !== formData.fats_g ||
        (parseFloat(originalData.weight_g) || null) !== formData.weight_g ||
        originalData.image_url !== formData.image_url ||
        originalMicros !== newMicros; // Comparamos micros
      // --- FIN DE LA MODIFICACIÓN ---

      if (!hasChanged && !manualFormState.isFavorite) {
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
    }

    if (editingFavorite) {
      const dataToUpdate = {
        ...editingFavorite,
        ...formData,
        name: formData.description,
        image_url: formData.image_url,
        // --- INICIO DE LA MODIFICACIÓN ---
        micronutrients: formData.micronutrients,
        // --- FIN DE LA MODIFICACIÓN ---
      };
      const result = await updateFavoriteMeal(editingFavorite.id, dataToUpdate);
      if (result.success) {
        addToast(result.message, 'success');
        setEditingFavorite(null);
        resetManualForm();
        setActiveTab('favorites');
      } else {
        addToast(result.message, 'error');
      }
    } else if (isEditingLog) {
      if (manualFormState.isFavorite) {
        const favData = {
          name: formData.description,
          calories: formData.calories,
          protein_g: formData.protein_g,
          carbs_g: formData.carbs_g,
          fats_g: formData.fats_g,
          weight_g: formData.weight_g,
          image_url: formData.image_url || null,
          // --- INICIO DE LA MODIFICACIÓN ---
          micronutrients: formData.micronutrients || null,
          // --- FIN DE LA MODIFICACIÓN ---
        };
        const existingFavorite = favoriteMeals.find(
          (fav) => fav.name.toLowerCase() === formData.description.toLowerCase()
        );
        try {
          if (existingFavorite) {
            await updateFavoriteMeal(existingFavorite.id, favData);
            addToast(
              `'${formData.description}' (favorito) actualizado.`,
              'success'
            );
          } else {
            await addFavoriteMeal(favData);
            addToast(`'${formData.description}' guardado en favoritos.`, 'success');
          }
        } catch (error) {
          addToast(error.message || 'Error al guardar en favoritos.', 'error');
        }
      }
      onSave([{ ...logToEdit, ...formData }], true);
      resetManualForm();
    }
  };

  return {
    handleSaveList,
    handleSaveSingle,
    handleSaveEdit,
  };
};