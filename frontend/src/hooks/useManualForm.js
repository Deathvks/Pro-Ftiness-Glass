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

  // Efecto para popular el formulario al editar o al recibir datos de escaneo
  useEffect(() => {
    if (itemToEdit) {
      const description = itemToEdit.description || itemToEdit.name || '';
      const initialWeight = parseFloat(itemToEdit.weight_g);
      const isScanOrigin = itemToEdit.origin === 'scan';

      // --- INICIO DE LA MODIFICACIÓN ---
      let currentFormData = {
        description: description,
        calories: String(itemToEdit.calories || ''),
        protein_g: String(itemToEdit.protein_g || ''),
        carbs_g: String(itemToEdit.carbs_g || ''),
        fats_g: String(itemToEdit.fats_g || ''), // Corregido: usar fats_g
        weight_g: String(itemToEdit.weight_g || ''),
        image_url: itemToEdit.image_url || null,
      };

      // Si el origen es 'scan', los datos de `itemToEdit` ya están calculados para 100g
      // y necesitamos popular `per100Data` también.
      let currentPer100Data = { calories: '', protein_g: '', carbs_g: '', fats_g: '' };
      if (isScanOrigin) {
          // Extraer los valores base por 100g (pueden venir con sufijo _per_100g o no si el cálculo se hizo antes)
          const cal100 = itemToEdit.calories_per_100g ?? itemToEdit.calories ?? '';
          const prot100 = itemToEdit.protein_per_100g ?? itemToEdit.protein_g ?? '';
          const carb100 = itemToEdit.carbs_per_100g ?? itemToEdit.carbs_g ?? '';
          const fat100 = itemToEdit.fat_per_100g ?? itemToEdit.fats_g ?? ''; // Corregido: usar fat_per_100g o fats_g

          currentPer100Data = {
              calories: String(cal100),
              protein_g: String(prot100),
              carbs_g: String(carb100),
              fats_g: String(fat100), // Corregido: usar fats_g
          };
          // Asegurarse de que formData tenga los valores para 100g si weight es 100
          if (String(currentFormData.weight_g) === '100') {
             currentFormData.calories = String(round(cal100, 0));
             currentFormData.protein_g = String(round(prot100, 1));
             currentFormData.carbs_g = String(round(carb100, 1));
             currentFormData.fats_g = String(round(fat100, 1)); // Corregido: usar fats_g
          }
      }

      // Establecer baseMacros solo si NO es de origen scan y tiene peso inicial > 0
      if (!isScanOrigin && initialWeight > 0) {
        setBaseMacros({
          calories: (parseFloat(itemToEdit.calories) || 0) / initialWeight,
          protein_g: (parseFloat(itemToEdit.protein_g) || 0) / initialWeight,
          carbs_g: (parseFloat(itemToEdit.carbs_g) || 0) / initialWeight,
          fats_g: (parseFloat(itemToEdit.fats_g) || 0) / initialWeight, // Corregido: usar fats_g
        });
      } else {
        setBaseMacros(null); // Resetear baseMacros si es scan o no hay peso inicial
      }


      setManualFormState({
        formData: currentFormData,
        per100Data: currentPer100Data, // Usar los datos por 100g calculados
        per100Mode: isScanOrigin, // Activar modo por 100g si es scan
        isFavorite:
          itemToEdit.isFavorite ||
          favoriteMeals.some(
            (fav) => fav.name.toLowerCase() === description.toLowerCase()
          ),
      });
      setOriginalData(currentFormData); // Guardar los datos iniciales
      setIsPer100g(isScanOrigin); // Asegurar que el toggle esté sincronizado

      // --- FIN DE LA MODIFICACIÓN ---

    } else {
      // Si no hay itemToEdit, resetear todo (excepto si ya está reseteado)
       if (manualFormState !== initialManualFormState) {
          resetManualForm();
       }
    }
  }, [
    itemToEdit, // Dependencia principal
    favoriteMeals,
    setIsPer100g,
    resetManualForm, // Incluir resetManualForm en las dependencias
    // Añadir manualFormState para evitar el reseteo innecesario en el primer render
    manualFormState
  ]);

  // Efecto para recalcular macros al cambiar peso (modo EDICIÓN)
  useEffect(() => {
    // Usamos originalData para saber si estamos en modo edición Y NO en modo por 100g
    if (baseMacros && originalData && !isPer100g) {
      const newWeight = parseFloat(manualFormState.formData.weight_g) || 0;
      // Recalcular solo si el peso ha cambiado respecto al original
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
    originalData,
    isPer100g, // Añadido isPer100g
    round // Añadido round
  ]);

  // Efecto para recalcular macros al cambiar peso o datos "por 100g" (modo NUEVO o MODO 100G activo)
  useEffect(() => {
    // Se activa si estamos en modo por 100g (sea nuevo item o edición en modo 100g)
    if (isPer100g) {
      const computed = computeFromPer100(
        manualFormState.per100Data.calories,
        manualFormState.per100Data.protein_g,
        manualFormState.per100Data.carbs_g,
        manualFormState.per100Data.fats_g,
        manualFormState.formData.weight_g
      );
      // Solo actualiza si los valores calculados son diferentes a los actuales en formData
      // para evitar bucles infinitos. Comparamos strings redondeados.
      if (
          String(Math.round(computed.calories)) !== String(Math.round(manualFormState.formData.calories || 0)) ||
          String(computed.protein_g) !== String(manualFormState.formData.protein_g || 0) ||
          String(computed.carbs_g) !== String(manualFormState.formData.carbs_g || 0) ||
          String(computed.fats_g) !== String(manualFormState.formData.fats_g || 0)
      ) {
            setManualFormState((prev) => ({
             ...prev,
             formData: { ...prev.formData, ...computed },
            }));
       }
    }
  }, [
    manualFormState.formData.weight_g,
    manualFormState.per100Data,
    isPer100g,
    computeFromPer100,
    manualFormState.formData, // Añadido para la comparación
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