/* frontend/src/hooks/useManualForm.js */
import { useState, useEffect, useCallback } from 'react';
import { initialManualFormState, round } from './useNutritionConstants';

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

      // Comprobamos si existen datos por 100g
      const hasPer100Data = itemToEdit.calories_per_100g != null;

      // Si tiene datos por 100g, activamos el switch, independientemente del origen
      const shouldBePer100g = hasPer100Data;
      setIsPer100g(shouldBePer100g);

      const originalDescription = itemToEdit.description || itemToEdit.name || '';

      // Helper para leer grasas de forma robusta (fat_g, fats_g, fats)
      const getFats = (obj) => parseFloat(obj.fats_g || obj.fat_g || obj.fats || 0);
      const getFatsPer100 = (obj) => parseFloat(obj.fat_per_100g || obj.fats_per_100g || obj.fat_per_100 || 0);

      let formData = {
        description: originalDescription,
        calories: round(itemToEdit.calories || 0, 0),
        protein_g: round(itemToEdit.protein_g || 0, 1),
        carbs_g: round(itemToEdit.carbs_g || 0, 1),
        fats_g: round(getFats(itemToEdit), 1),
        weight_g: round(itemToEdit.weight_g || (shouldBePer100g ? 100 : ''), 1), // Poner 100g por defecto si es modo /100g
        image_url: itemToEdit.image_url || null,
        micronutrients: itemToEdit.micronutrients || null,
      };

      let per100Data = initialManualFormState.per100Data;
      if (hasPer100Data) {
        per100Data = {
          calories: round(itemToEdit.calories_per_100g || 0, 0),
          protein_g: round(itemToEdit.protein_per_100g || 0, 1),
          carbs_g: round(itemToEdit.carbs_per_100g || 0, 1),
          fats_g: round(getFatsPer100(itemToEdit), 1),
        };

        // Si estamos en modo /100g, recalculamos los totales basándonos en el peso actual y los valores /100g
        // para asegurar consistencia visual inmediata
        if (shouldBePer100g) {
          const currentWeight = parseFloat(formData.weight_g) || 100;
          const factor = currentWeight / 100;
          formData = {
            ...formData,
            calories: round(parseFloat(per100Data.calories) * factor, 0),
            protein_g: round(parseFloat(per100Data.protein_g) * factor, 1),
            carbs_g: round(parseFloat(per100Data.carbs_g) * factor, 1),
            fats_g: round(parseFloat(per100Data.fats_g) * factor, 1),
            // Preservamos micros si existen
            micronutrients: itemToEdit.micronutrients || null,
          };
        }
      }

      // Detectar si es favorito comparando nombre
      const isFavorite = favoriteMeals?.some(fav => fav.name.toLowerCase() === originalDescription.toLowerCase()) || false;

      setManualFormState({
        formData,
        per100Data,
        per100Mode: shouldBePer100g,
        isFavorite,
        originalDescription: originalDescription
      });

      // Calcular macros base (por 1g) si NO usamos el modo /100g
      // Esto sirve para escalar los valores cuando el usuario cambia el input de peso manualmente
      if (weight > 0 && !hasPer100Data) {
        setBaseMacros({
          calories: (parseFloat(itemToEdit.calories) || 0) / weight,
          protein_g: (parseFloat(itemToEdit.protein_g) || 0) / weight,
          carbs_g: (parseFloat(itemToEdit.carbs_g) || 0) / weight,
          fats_g: getFats(itemToEdit) / weight,
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