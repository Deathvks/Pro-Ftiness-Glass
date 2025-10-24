/* frontend/src/hooks/useManualForm.js */
import { useState, useEffect, useCallback } from 'react';
import { initialManualFormState, round } from './useNutritionConstants'; // Importar constantes

export const useManualForm = ({ itemToEdit, favoriteMeals, isPer100g, setIsPer100g }) => {
  const [manualFormState, setManualFormState] = useState({
    ...initialManualFormState,
    originalDescription: null // Añadido para guardar la descripción original
  });
  const [baseMacros, setBaseMacros] = useState(null); // Estado para macros base por gramo
  const [originalData, setOriginalData] = useState(null); // Datos originales al editar/escanear

  const resetManualForm = useCallback(() => {
    setManualFormState({
        ...initialManualFormState,
        originalDescription: null // Resetear también al limpiar
    });
    setBaseMacros(null);
    setOriginalData(null);
    setIsPer100g(false); // Resetear modo por 100g también
  }, [setIsPer100g]);

  // Efecto para inicializar/actualizar el formulario cuando 'itemToEdit' cambia
  useEffect(() => {
    if (itemToEdit) {
      setOriginalData(itemToEdit); // Guardar los datos originales
      const weight = parseFloat(itemToEdit.weight_g);
      const hasPer100Data = itemToEdit.calories_per_100g != null; // Verificar si viene con datos /100g

      const shouldBePer100g = hasPer100Data && itemToEdit.origin !== 'manual';
      setIsPer100g(shouldBePer100g);

      const originalDescription = itemToEdit.description || itemToEdit.name || '';

      let formData = {
        description: originalDescription, // Usar la descripción original aquí
        calories: round(itemToEdit.calories || 0, 0),
        protein_g: round(itemToEdit.protein_g || 0, 1),
        carbs_g: round(itemToEdit.carbs_g || 0, 1),
        fats_g: round(itemToEdit.fats_g || 0, 1),
        weight_g: round(itemToEdit.weight_g || (shouldBePer100g ? 100 : ''), 1), // Poner 100g por defecto si es /100g
        image_url: itemToEdit.image_url || null,
        micronutrients: itemToEdit.micronutrients || null,
      };

      let per100Data = initialManualFormState.per100Data;
      if (hasPer100Data) {
        per100Data = {
            calories: round(itemToEdit.calories_per_100g || 0, 0),
            protein_g: round(itemToEdit.protein_per_100g || 0, 1),
            carbs_g: round(itemToEdit.carbs_per_100g || 0, 1),
            fats_g: round(itemToEdit.fat_per_100g || 0, 1),
        };
        if (shouldBePer100g) {
            const currentWeight = parseFloat(formData.weight_g) || 100;
            const factor = currentWeight / 100;
            formData = {
                ...formData,
                calories: round(parseFloat(per100Data.calories) * factor, 0),
                protein_g: round(parseFloat(per100Data.protein_g) * factor, 1),
                carbs_g: round(parseFloat(per100Data.carbs_g) * factor, 1),
                fats_g: round(parseFloat(per100Data.fats_g) * factor, 1),
                micronutrients: itemToEdit.micronutrients || null,
            }
        }
      }

      const isFavorite = favoriteMeals?.some(fav => fav.name.toLowerCase() === originalDescription.toLowerCase()) || false;

      setManualFormState({
        formData,
        per100Data,
        per100Mode: shouldBePer100g,
        isFavorite,
        originalDescription: originalDescription
      });

      if (weight > 0 && !hasPer100Data) { // Solo si no usamos /100g
        setBaseMacros({
          calories: (parseFloat(itemToEdit.calories) || 0) / weight,
          protein_g: (parseFloat(itemToEdit.protein_g) || 0) / weight,
          carbs_g: (parseFloat(itemToEdit.carbs_g) || 0) / weight,
          fats_g: (parseFloat(itemToEdit.fats_g) || 0) / weight,
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
      if (!isPer100g && baseMacros) {
          const newWeight = parseFloat(manualFormState.formData.weight_g) || 0;
          setManualFormState(prev => ({
              ...prev,
              formData: {
                  ...prev.formData,
                  calories: round(baseMacros.calories * newWeight, 0),
                  protein_g: round(baseMacros.protein_g * newWeight, 1),
                  carbs_g: round(baseMacros.carbs_g * newWeight, 1),
                  fats_g: round(baseMacros.fats_g * newWeight, 1),
              }
          }));
      }
  }, [manualFormState.formData.weight_g, baseMacros, isPer100g]);

  // Efecto para recalcular macros cuando cambia el peso Y SÍ estamos en modo por 100g
  useEffect(() => {
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
        }
      }));
    }
  }, [manualFormState.formData.weight_g, manualFormState.per100Data, isPer100g]);

  return {
    manualFormState,
    setManualFormState,
    setBaseMacros,
    originalData,
    setOriginalData,
    resetManualForm,
  };
};