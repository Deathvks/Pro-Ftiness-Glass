/* frontend/src/hooks/useManualForm.js */
import { useState, useEffect, useCallback } from 'react';
import { initialManualFormState, round } from './useNutritionConstants';

export const useManualForm = ({
  itemToEdit, // Reemplaza: isEditingLog, editingListItemId, editingFavorite, logToEdit, itemsToAdd
  favoriteMeals,
  isPer100g,
  setIsPer100g,
}) => {
  const [manualFormState, setManualFormState] = useState(
    initialManualFormState
  );
  const [baseMacros, setBaseMacros] = useState(null);
  const [originalData, setOriginalData] = useState(null);

  const resetManualForm = useCallback(() => {
    setManualFormState(initialManualFormState);
    setBaseMacros(null);
    setOriginalData(null);
    setIsPer100g(false);
  }, [setIsPer100g]);

  const computeFromPer100 = useCallback((cal, p, c, f, g) => {
    const factor = (parseFloat(g) || 0) / 100;
    return {
      calories: Math.round((parseFloat(cal) || 0) * factor),
      protein_g: round((parseFloat(p) || 0) * factor),
      carbs_g: round((parseFloat(c) || 0) * factor),
      fats_g: round((parseFloat(f) || 0) * factor),
    };
  }, []);

  // Efecto para popular el formulario al editar
  useEffect(() => {
    // La lógica de búsqueda se ha movido al hook principal.
    // Simplemente reaccionamos al item que nos pasan.
    if (itemToEdit) {
      const description = itemToEdit.description || itemToEdit.name || '';
      const initialWeight = parseFloat(itemToEdit.weight_g);
      if (initialWeight > 0) {
        setBaseMacros({
          calories: (parseFloat(itemToEdit.calories) || 0) / initialWeight,
          protein_g: (parseFloat(itemToEdit.protein_g) || 0) / initialWeight,
          carbs_g: (parseFloat(itemToEdit.carbs_g) || 0) / initialWeight,
          fats_g: (parseFloat(itemToEdit.fats_g) || 0) / initialWeight,
        });
      } else {
        setBaseMacros(null);
      }
      const currentFormData = {
        description: description,
        calories: String(itemToEdit.calories || ''),
        protein_g: String(itemToEdit.protein_g || ''),
        carbs_g: String(itemToEdit.carbs_g || ''),
        fats_g: String(itemToEdit.fats_g || ''),
        weight_g: String(itemToEdit.weight_g || ''),
        image_url: itemToEdit.image_url || null,
      };
      setManualFormState({
        formData: currentFormData,
        per100Data: { calories: '', protein_g: '', carbs_g: '', fats_g: '' },
        per100Mode: false,
        isFavorite:
          itemToEdit.isFavorite ||
          favoriteMeals.some(
            (fav) => fav.name.toLowerCase() === description.toLowerCase()
          ),
      });
      setOriginalData(currentFormData);
      setIsPer100g(false);
    }
  }, [
    itemToEdit, // Dependencia principal
    favoriteMeals,
    setIsPer100g,
  ]);

  // Efecto para recalcular macros al cambiar peso (modo EDICIÓN)
  useEffect(() => {
    // Usamos originalData para saber si estamos en modo edición
    if (baseMacros && originalData) {
      const newWeight = parseFloat(manualFormState.formData.weight_g) || 0;
      if (String(newWeight) !== String(originalData?.weight_g || '')) {
        setManualFormState((prev) => ({
          ...prev,
          formData: {
            ...prev.formData,
            calories: Math.round(baseMacros.calories * newWeight),
            protein_g: round(baseMacros.protein_g * newWeight),
            carbs_g: round(baseMacros.carbs_g * newWeight),
            fats_g: round(baseMacros.fats_g * newWeight),
          },
        }));
      }
    }
  }, [
    manualFormState.formData.weight_g,
    baseMacros,
    originalData, // Dependencia cambiada
  ]);

  // Efecto para recalcular macros al cambiar peso o datos "por 100g" (modo NUEVO)
  useEffect(() => {
    // Usamos !originalData para saber si estamos en modo nuevo
    if (
      isPer100g &&
      !originalData
    ) {
      const computed = computeFromPer100(
        manualFormState.per100Data.calories,
        manualFormState.per100Data.protein_g,
        manualFormState.per100Data.carbs_g,
        manualFormState.per100Data.fats_g,
        manualFormState.formData.weight_g
      );
      setManualFormState((prev) => ({
        ...prev,
        formData: { ...prev.formData, ...computed },
      }));
    }
  }, [
    manualFormState.formData.weight_g,
    manualFormState.per100Data,
    isPer100g,
    originalData, // Dependencia cambiada
    computeFromPer100,
  ]);

  return {
    manualFormState,
    setManualFormState,
    baseMacros,
    setBaseMacros,
    originalData,
    setOriginalData,
    resetManualForm,
    computeFromPer100,
  };
};