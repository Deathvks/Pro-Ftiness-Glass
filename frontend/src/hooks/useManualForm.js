/* frontend/src/hooks/useManualForm.js */
import { useState, useEffect, useCallback } from 'react';
import { initialManualFormState, round } from './useNutritionConstants';

export const useManualForm = ({
  itemToEdit, // Reemplaza: isEditingLog, editingListItemId, editingFavorite, logToEdit, itemsToAdd
  favoriteMeals,
  isPer100g, // Recibimos el estado del padre
  setIsPer100g, // Recibimos la función para actualizar al padre
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
    // Aseguramos que el estado del padre también se resetee
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
  }, [round]); // Añadido round como dependencia

  // Efecto para popular el formulario al editar o al recibir datos de escaneo
  useEffect(() => {
    if (itemToEdit) {
      const description = itemToEdit.description || itemToEdit.name || '';
      const initialWeight = parseFloat(itemToEdit.weight_g);
      const isScanOrigin = itemToEdit.origin === 'scan';

      // --- INICIO DE LA MODIFICACIÓN ---
      // 1. Determinar si hay datos válidos por 100g
      //    Consideramos válidos si existe `calories_per_100g` (o `calories` si es scan) y es mayor que 0.
      const hasValid100gData = (
            (itemToEdit.calories_per_100g !== undefined && parseFloat(itemToEdit.calories_per_100g) > 0) ||
            (isScanOrigin && itemToEdit.calories !== undefined && parseFloat(itemToEdit.calories) > 0) // Fallback para scan si solo viene 'calories'
        );

      // 2. Decidir el modo inicial: solo 'por 100g' si es scan Y tiene datos válidos por 100g
      const shouldBePer100g = isScanOrigin && hasValid100gData;

      let currentFormData;
      let currentPer100Data = { calories: '', protein_g: '', carbs_g: '', fats_g: '' };

      if (shouldBePer100g) {
          // Poblar per100Data desde los campos _per_100g (o los campos directos si es scan)
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

          // Poblar formData calculando para el peso inicial (que es 100g en scan)
          currentFormData = {
              description: description,
              calories: String(round(cal100, 0)),
              protein_g: String(round(prot100, 1)),
              carbs_g: String(round(carb100, 1)),
              fats_g: String(round(fat100, 1)),
              weight_g: '100', // Peso inicial para scan es 100g
              image_url: itemToEdit.image_url || null,
          };
          setBaseMacros(null); // No necesitamos baseMacros en modo 100g inicial

      } else {
          // Modo normal (no es scan o no hay datos 100g válidos)
          // Usar datos por ración o los datos directos del item
          const calServing = itemToEdit.calories_per_serving ?? itemToEdit.calories ?? 0;
          const protServing = itemToEdit.protein_per_serving ?? itemToEdit.protein_g ?? 0;
          const carbServing = itemToEdit.carbs_per_serving ?? itemToEdit.carbs_g ?? 0;
          const fatServing = itemToEdit.fat_per_serving ?? itemToEdit.fats_g ?? 0;
          const weightServing = itemToEdit.serving_weight_g ?? itemToEdit.weight_g ?? '';

          currentFormData = {
              description: description,
              calories: String(round(calServing, 0)),
              protein_g: String(round(protServing, 1)),
              carbs_g: String(round(carbServing, 1)),
              fats_g: String(round(fatServing, 1)),
              weight_g: String(weightServing),
              image_url: itemToEdit.image_url || null,
          };
          currentPer100Data = initialManualFormState.per100Data; // Dejar per100Data vacío

          // Calcular baseMacros solo si NO estamos en modo per100g y el peso inicial es válido
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

      // 3. Actualizar el estado del formulario y del toggle en el padre
      setManualFormState({
        formData: currentFormData,
        per100Data: currentPer100Data,
        per100Mode: shouldBePer100g, // Estado interno del hook
        isFavorite:
          itemToEdit.isFavorite ||
          favoriteMeals.some(
            (fav) => fav.name.toLowerCase() === description.toLowerCase()
          ),
      });
      setOriginalData(currentFormData); // Guardar los datos iniciales
      setIsPer100g(shouldBePer100g); // Sincronizar estado del padre

      // --- FIN DE LA MODIFICACIÓN ---

    } else {
      // Si no hay itemToEdit, resetear todo (excepto si ya está reseteado)
      // Comprobamos si el estado actual es diferente del inicial para evitar bucle
      if (manualFormState.formData !== initialManualFormState.formData ||
          manualFormState.per100Data !== initialManualFormState.per100Data ||
          manualFormState.per100Mode !== initialManualFormState.per100Mode ||
          manualFormState.isFavorite !== initialManualFormState.isFavorite) {
         resetManualForm();
      }
    }
  }, [
    itemToEdit,
    favoriteMeals,
    setIsPer100g,
    resetManualForm,
    manualFormState // Añadido para la comprobación anti-bucle
    // round no necesita ser dependencia si está definido fuera o con useCallback sin deps
  ]);

  // Efecto para recalcular macros al cambiar peso (modo EDICIÓN NO 100g)
  useEffect(() => {
    // Solo recalcular si hay baseMacros (es decir, NO modo 100g inicial) y hay datos originales
    if (baseMacros && originalData) {
      const newWeight = parseFloat(manualFormState.formData.weight_g) || 0;
      // Recalcular solo si el peso ha cambiado respecto al original O si el modo 100g se desactivó
      if (String(newWeight) !== String(originalData?.weight_g || '') || !isPer100g) {
         // Si isPer100g es false AHORA, pero SÍ teníamos baseMacros, recalculamos
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
    isPer100g, // Ahora depende de isPer100g para reaccionar si se desactiva
    round
  ]);

  // Efecto para recalcular macros al cambiar peso o datos "por 100g" (modo 100G activo)
  useEffect(() => {
    // Se activa si estamos en modo por 100g
    if (isPer100g) {
      const computed = computeFromPer100(
        manualFormState.per100Data.calories,
        manualFormState.per100Data.protein_g,
        manualFormState.per100Data.carbs_g,
        manualFormState.per100Data.fats_g,
        manualFormState.formData.weight_g
      );
      // Solo actualiza si los valores calculados son diferentes a los actuales en formData
      if (
          String(Math.round(computed.calories)) !== String(Math.round(manualFormState.formData.calories || 0)) ||
          String(computed.protein_g) !== String(manualFormState.formData.protein_g || '0.0') || // Comparar con '0.0' si está vacío
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
    manualFormState.formData, // Para comparación
    round // Añadido round como dependencia
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