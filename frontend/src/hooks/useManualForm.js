/* frontend/src/hooks/useManualForm.js */
import { useState, useEffect, useCallback } from 'react';
// --- INICIO DE LA MODIFICACIÓN ---
// Importar useToast
import { useToast } from './useToast';
import { initialManualFormState, round } from './useNutritionConstants';
// --- FIN DE LA MODIFICACIÓN ---

export const useManualForm = ({
  itemToEdit,
  favoriteMeals,
  isPer100g,
  setIsPer100g,
}) => {
  const [manualFormState, setManualFormState] = useState(
    initialManualFormState
  );
  const [baseMacros, setBaseMacros] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  // --- INICIO DE LA MODIFICACIÓN ---
  // Obtener la función addToast
  const { addToast } = useToast();
  // --- FIN DE LA MODIFICACIÓN ---

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
  }, [round]); // Asegúrate de que `round` esté disponible o importado

  // Efecto para popular el formulario al editar o al recibir datos de escaneo
  useEffect(() => {
    try {
        if (itemToEdit) {
            const description = itemToEdit.description || itemToEdit.name || '';
            const initialWeight = parseFloat(itemToEdit.weight_g);
            const isScanOrigin = itemToEdit.origin === 'scan';

            const hasValid100gData = (
                (itemToEdit.calories_per_100g !== undefined && itemToEdit.calories_per_100g !== null && parseFloat(itemToEdit.calories_per_100g) >= 0) ||
                (isScanOrigin && itemToEdit.calories !== undefined && itemToEdit.calories !== null && parseFloat(itemToEdit.calories) >= 0)
            );

            const shouldBePer100g = isScanOrigin && hasValid100gData;

            let currentFormData;
            let currentPer100Data = { calories: '', protein_g: '', carbs_g: '', fats_g: '' };

            if (shouldBePer100g) {
                const cal100 = itemToEdit.calories_per_100g ?? itemToEdit.calories ?? 0;
                const prot100 = itemToEdit.protein_per_100g ?? itemToEdit.protein_g ?? 0;
                const carb100 = itemToEdit.carbs_per_100g ?? itemToEdit.carbs_g ?? 0;
                const fat100 = itemToEdit.fat_per_100g ?? itemToEdit.fats_g ?? 0;

                currentPer100Data = {
                    calories: String(round(cal100, 0)),
                    protein_g: String(round(prot100, 1)),
                    carbs_g: String(round(carb100, 1)),
                    fats_g: String(round(fat100, 1)),
                };

                currentFormData = {
                    description: description,
                    calories: String(round(cal100, 0)),
                    protein_g: String(round(prot100, 1)),
                    carbs_g: String(round(carb100, 1)),
                    fats_g: String(round(fat100, 1)),
                    weight_g: '100',
                    image_url: itemToEdit.image_url || null,
                };
                setBaseMacros(null);

            } else {
                const calServing = itemToEdit.calories_per_serving ?? itemToEdit.calories ?? 0;
                const protServing = itemToEdit.protein_per_serving ?? itemToEdit.protein_g ?? 0;
                const carbServing = itemToEdit.carbs_per_serving ?? itemToEdit.carbs_g ?? 0;
                const fatServing = itemToEdit.fat_per_serving ?? itemToEdit.fats_g ?? 0;
                const weightServing = itemToEdit.serving_quantity ?? itemToEdit.weight_g ?? '';

                currentFormData = {
                    description: description,
                    calories: String(round(calServing, 0)),
                    protein_g: String(round(protServing, 1)),
                    carbs_g: String(round(carbServing, 1)),
                    fats_g: String(round(fatServing, 1)),
                    weight_g: String(weightServing),
                    image_url: itemToEdit.image_url || null,
                };
                currentPer100Data = initialManualFormState.per100Data;

                const currentWeightNum = parseFloat(weightServing);
                if (currentWeightNum > 0) {
                    setBaseMacros({
                        calories: calServing / currentWeightNum,
                        protein_g: protServing / currentWeightNum,
                        carbs_g: carbServing / currentWeightNum,
                        fats_g: fatServing / currentWeightNum,
                    });
                } else {
                    setBaseMacros(null);
                }
            }

            setManualFormState({
              formData: currentFormData,
              per100Data: currentPer100Data,
              per100Mode: shouldBePer100g,
              isFavorite:
                itemToEdit.isFavorite ||
                favoriteMeals.some(
                  (fav) => fav.name.toLowerCase() === description.toLowerCase()
                ),
            });
            setOriginalData(currentFormData);
            setIsPer100g(shouldBePer100g);

        } else {
           if (manualFormState.formData !== initialManualFormState.formData ||
               manualFormState.per100Data !== initialManualFormState.per100Data ||
               manualFormState.per100Mode !== initialManualFormState.per100Mode ||
               manualFormState.isFavorite !== initialManualFormState.isFavorite) {
              resetManualForm();
           }
        }
    } catch (error) {
        console.error("Error processing itemToEdit in useManualForm:", error);
        // --- INICIO DE LA MODIFICACIÓN ---
        // Mostrar el error como un toast
        addToast(`Error procesando datos: ${error.message}`, 'error');
        // --- FIN DE LA MODIFICACIÓN ---
        resetManualForm();
    }
  }, [
    itemToEdit,
    favoriteMeals,
    setIsPer100g,
    resetManualForm,
    manualFormState,
    round, // Añadir round a las dependencias
    addToast // Añadir addToast a las dependencias
  ]);

  // Efecto para recalcular macros al cambiar peso (modo EDICIÓN NO 100g)
  useEffect(() => {
    if (baseMacros && originalData && !isPer100g) {
      const newWeight = parseFloat(manualFormState.formData.weight_g) || 0;
      if (String(newWeight) !== String(originalData?.weight_g || '') || !isPer100g) {
         if (!isPer100g) {
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
    }
  }, [
    manualFormState.formData.weight_g,
    baseMacros,
    originalData,
    isPer100g,
    round
  ]);

  // Efecto para recalcular macros al cambiar peso o datos "por 100g" (modo 100G activo)
  useEffect(() => {
    if (isPer100g) {
      const computed = computeFromPer100(
        manualFormState.per100Data.calories,
        manualFormState.per100Data.protein_g,
        manualFormState.per100Data.carbs_g,
        manualFormState.per100Data.fats_g,
        manualFormState.formData.weight_g
      );
      if (
          String(Math.round(computed.calories)) !== String(Math.round(manualFormState.formData.calories || 0)) ||
          String(computed.protein_g) !== String(manualFormState.formData.protein_g || '0.0') ||
          String(computed.carbs_g) !== String(manualFormState.formData.carbs_g || '0.0') ||
          String(computed.fats_g) !== String(manualFormState.formData.fats_g || '0.0')
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
    manualFormState.formData,
    round // Añadir round a las dependencias
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