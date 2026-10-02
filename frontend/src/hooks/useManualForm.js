/* frontend/src/hooks/useManualForm.js */
import { useState, useEffect, useCallback } from 'react';
import { initialManualFormState, round } from './useNutritionConstants';

export const useManualForm = ({ itemToEdit, favoriteMeals, isPer100g, setIsPer100g }) => {
  const [manualFormState, setManualFormState] = useState({
    ...initialManualFormState,
    originalDescription: null
  });
  const [baseMacros, setBaseMacros] = useState(null);
  const [originalData, setOriginalData] = useState(null);

  // --- SOLUCIÓN: Detección de desincronización ---
  const targetDescription = itemToEdit ? (itemToEdit.description || itemToEdit.name || '') : null;
  const isStateSyncing = itemToEdit && manualFormState.originalDescription !== targetDescription;

  const resetManualForm = useCallback(() => {
    setManualFormState({
      ...initialManualFormState,
      originalDescription: null
    });
    setBaseMacros(null);
    setOriginalData(null);
    setIsPer100g(false);
  }, [setIsPer100g]);

  // Efecto para inicializar/actualizar el formulario cuando 'itemToEdit' cambia
  useEffect(() => {
    if (itemToEdit) {
      setOriginalData(itemToEdit);
      const weight = parseFloat(itemToEdit.weight_g);

      // Comprobamos si existen datos explícitos por 100g
      const hasPer100Data = itemToEdit.calories_per_100g != null;
      
      // Si tiene datos por 100g, activamos el switch. Si no, lo desactivamos.
      const shouldBePer100g = hasPer100Data;
      setIsPer100g(shouldBePer100g);

      const originalDescription = itemToEdit.description || itemToEdit.name || '';

      // Helpers seguros
      const getFats = (obj) => parseFloat(obj.fats_g || obj.fat_g || obj.fats || 0);
      const getFatsPer100 = (obj) => parseFloat(obj.fat_per_100g || obj.fats_per_100g || obj.fat_per_100 || 0);
      
      const getSugars = (obj) => parseFloat(obj.sugars_g || obj.sugars || 0);
      const getSugarsPer100 = (obj) => parseFloat(obj.sugars_per_100g || obj.sugars_per_100 || 0);

      // Inicializar formData
      let formData = {
        description: originalDescription,
        calories: round(itemToEdit.calories || 0, 0),
        protein_g: round(itemToEdit.protein_g || 0, 1),
        carbs_g: round(itemToEdit.carbs_g || 0, 1),
        fats_g: round(getFats(itemToEdit), 1),
        sugars_g: round(getSugars(itemToEdit), 1),
        weight_g: round(itemToEdit.weight_g || (shouldBePer100g ? 100 : ''), 1),
        image_url: itemToEdit.image_url || null,
        micronutrients: itemToEdit.micronutrients || null,
      };

      // Inicializar per100Data
      let per100Data = { ...initialManualFormState.per100Data };
      
      if (hasPer100Data) {
        // Opción A: Usar datos explícitos de la DB
        per100Data = {
          calories: round(itemToEdit.calories_per_100g || 0, 0),
          protein_g: round(itemToEdit.protein_per_100g || 0, 1),
          carbs_g: round(itemToEdit.carbs_per_100g || 0, 1),
          fats_g: round(getFatsPer100(itemToEdit), 1),
          sugars_g: round(getSugarsPer100(itemToEdit), 1),
        };
      } else if (weight > 0) {
        // Opción B (NUEVO): Calcular datos por 100g matemáticamente si faltan
        // Esto evita que los campos queden vacíos si el usuario activa el switch manual
        const factor = 100 / weight;
        per100Data = {
          calories: round((parseFloat(itemToEdit.calories) || 0) * factor, 0),
          protein_g: round((parseFloat(itemToEdit.protein_g) || 0) * factor, 1),
          carbs_g: round((parseFloat(itemToEdit.carbs_g) || 0) * factor, 1),
          fats_g: round(getFats(itemToEdit) * factor, 1),
          sugars_g: round(getSugars(itemToEdit) * factor, 1),
        };
      } else {
        // Opción C: No hay datos suficientes, asegurar ceros para evitar NaN
        if (per100Data.sugars_g === undefined) per100Data.sugars_g = 0;
        per100Data.calories = 0;
        per100Data.protein_g = 0;
        per100Data.carbs_g = 0;
        per100Data.fats_g = 0;
      }

      // Recalcular totales si estamos en modo 100g (consistencia inicial)
      if (shouldBePer100g) {
        const currentWeight = parseFloat(formData.weight_g) || 100;
        const factor = currentWeight / 100;
        formData = {
          ...formData,
          calories: round(parseFloat(per100Data.calories || 0) * factor, 0),
          protein_g: round(parseFloat(per100Data.protein_g || 0) * factor, 1),
          carbs_g: round(parseFloat(per100Data.carbs_g || 0) * factor, 1),
          fats_g: round(parseFloat(per100Data.fats_g || 0) * factor, 1),
          sugars_g: round(parseFloat(per100Data.sugars_g || 0) * factor, 1),
        };
      }

      const isFavorite = favoriteMeals?.some(fav => fav.name.toLowerCase() === originalDescription.toLowerCase()) || false;

      setManualFormState({
        formData,
        per100Data,
        per100Mode: shouldBePer100g,
        isFavorite,
        originalDescription: originalDescription
      });

      // Calcular macros base para escalado manual (modo NO 100g)
      if (weight > 0 && !hasPer100Data) {
        setBaseMacros({
          calories: (parseFloat(itemToEdit.calories) || 0) / weight,
          protein_g: (parseFloat(itemToEdit.protein_g) || 0) / weight,
          carbs_g: (parseFloat(itemToEdit.carbs_g) || 0) / weight,
          fats_g: getFats(itemToEdit) / weight,
          sugars_g: getSugars(itemToEdit) / weight,
        });
      } else {
        setBaseMacros(null);
      }

    } else {
      resetManualForm();
    }
  }, [itemToEdit, favoriteMeals, setIsPer100g, resetManualForm]);

  // Efecto para recalcular macros cuando cambia el peso Y NO estamos en modo por 100g
  useEffect(() => {
    if (isStateSyncing) return;

    if (!isPer100g && baseMacros) {
      const newWeight = parseFloat(manualFormState.formData.weight_g) || 0;
      setManualFormState(prev => ({
        ...prev,
        formData: {
          ...prev.formData,
          calories: round((baseMacros.calories || 0) * newWeight, 0),
          protein_g: round((baseMacros.protein_g || 0) * newWeight, 1),
          carbs_g: round((baseMacros.carbs_g || 0) * newWeight, 1),
          fats_g: round((baseMacros.fats_g || 0) * newWeight, 1),
          sugars_g: round((baseMacros.sugars_g || 0) * newWeight, 1),
        }
      }));
    }
  }, [manualFormState.formData.weight_g, baseMacros, isPer100g, isStateSyncing]);

  // Efecto para recalcular macros cuando cambia el peso Y SÍ estamos en modo por 100g
  useEffect(() => {
    if (isStateSyncing) return;

    if (isPer100g) {
      const weight = parseFloat(manualFormState.formData.weight_g) || 0;
      const factor = weight / 100;
      setManualFormState(prev => ({
        ...prev,
        formData: {
          ...prev.formData,
          calories: round((parseFloat(prev.per100Data.calories) || 0) * factor, 0),
          protein_g: round((parseFloat(prev.per100Data.protein_g) || 0) * factor, 1),
          carbs_g: round((parseFloat(prev.per100Data.carbs_g) || 0) * factor, 1),
          fats_g: round((parseFloat(prev.per100Data.fats_g) || 0) * factor, 1),
          sugars_g: round((parseFloat(prev.per100Data.sugars_g) || 0) * factor, 1),
        }
      }));
    }
  }, [manualFormState.formData.weight_g, manualFormState.per100Data, isPer100g, isStateSyncing]);

  return {
    manualFormState,
    setManualFormState,
    setBaseMacros,
    originalData,
    setOriginalData,
    resetManualForm,
  };
};