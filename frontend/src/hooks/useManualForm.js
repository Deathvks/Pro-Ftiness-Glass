/* frontend/src/hooks/useScanAndUpload.js */
import { useState } from 'react';
import { useToast } from './useToast';
import * as nutritionService from '../services/nutritionService';
// --- INICIO DE LA MODIFICACIÓN ---
// Importar initialManualFormState y round
import { initialManualFormState, round } from './useNutritionConstants';
// --- FIN DE LA MODIFICACIÓN ---

// Helper para obtener valores numéricos de forma segura desde el objeto de nutrientes
const getNutrientValue = (nutriments, keys, conversionFactor = 1) => {
    if (!nutriments) return 0;
    for (const key of keys) {
        // Añadir comprobación extra por si la clave existe pero el valor es undefined/null
        if (nutriments[key] !== undefined && nutriments[key] !== null) {
            const value = parseFloat(nutriments[key]);
            if (!isNaN(value)) {
                // Devolver el valor directamente si es válido, incluso si es 0
                return value * conversionFactor;
            }
        }
    }
    return 0; // Devuelve 0 si ninguna clave es válida o los valores no son números
};


export const useScanAndUpload = ({
  setShowScanner,
  setManualFormState,
  setBaseMacros, // Aunque no se usa directamente aquí, puede ser necesario para useManualForm
  setOriginalData,
  setActiveTab,
  setAddModeType,
  setIsPer100g,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const { addToast } = useToast();

  const handleScanSuccess = async (barcode) => {
    setShowScanner(false);
    const tempLoadingToastId = addToast('Buscando producto...', 'info', null);
    try {
      const productData = await nutritionService.searchByBarcode(barcode);

      // Log para depuración
      console.log("Datos recibidos del escaneo:", productData);

      const product = productData?.product || {};
      const nutriments = product?.nutriments || {};
      const productName = product.product_name || product.generic_name || product.brands || 'Producto escaneado';
      const productImageUrl = product.image_url || product.image_front_url || null;

      const calories100g = getNutrientValue(nutriments, ['energy-kcal_100g', 'energy_100g']) || getNutrientValue(nutriments, ['energy-kj_100g', 'energy_100g'], 1 / 4.184);
      const protein100g = getNutrientValue(nutriments, ['proteins_100g']);
      const carbs100g = getNutrientValue(nutriments, ['carbohydrates_100g']);
      const fat100g = getNutrientValue(nutriments, ['fat_100g', 'fats_100g']);

      // --- INICIO DE LA MODIFICACIÓN ---
      // Modificamos la condición: Mostramos el error solo si NO se encuentra NINGÚN dato útil (ni nombre ni macros)
      if (calories100g === 0 && protein100g === 0 && carbs100g === 0 && fat100g === 0 && productName === 'Producto escaneado') {
          addToast('No se encontró información nutricional detallada para este producto.', 'error', 5000, tempLoadingToastId);
          // Aún así, vamos al formulario manual para que el usuario pueda introducir datos si lo desea
          setActiveTab('manual');
          setAddModeType('manual');
          setManualFormState(initialManualFormState); // Usar la constante importada
          setIsPer100g(false);
          setOriginalData(null); // No hay datos originales
          setBaseMacros(null);
          return;
      }
      // Si encontramos *algo* (nombre o algún macro), consideramos éxito
      addToast('Producto encontrado.', 'success', 3000, tempLoadingToastId);
      // --- FIN DE LA MODIFICACIÓN ---

      const scannedItemData = {
          description: productName,
          // Usar valores por ración como fallback si existen, si no, los de 100g
          calories: getNutrientValue(nutriments, ['energy-kcal_serving', 'energy_serving']) || getNutrientValue(nutriments, ['energy-kj_serving'], 1 / 4.184) || calories100g,
          protein_g: getNutrientValue(nutriments, ['proteins_serving']) || protein100g,
          carbs_g: getNutrientValue(nutriments, ['carbohydrates_serving']) || carbs100g,
          fats_g: getNutrientValue(nutriments, ['fat_serving', 'fats_serving']) || fat100g,
          weight_g: parseFloat(product.serving_quantity) || 100,
          image_url: productImageUrl,
          // Añadir explícitamente los campos _per_100g para que useManualForm pueda detectarlos
          calories_per_100g: calories100g,
          protein_per_100g: protein100g,
          carbs_per_100g: carbs100g,
          fat_per_100g: fat100g,
          origin: 'scan',
      };

       // Pasar los datos a useManualForm a través del estado del modal
       setManualFormState({
           itemToEdit: scannedItemData,
           // El resto lo determinará useManualForm
           per100Data: initialManualFormState.per100Data,
           per100Mode: false, // Dejamos que useManualForm decida
           isFavorite: false,
       });

      setBaseMacros(null);
      setOriginalData(scannedItemData); // Guardar datos originales recibidos
      setActiveTab('manual');
      setAddModeType('manual');
      // No forzamos setIsPer100g aquí

    } catch (error) {
       console.error("Error detallado en handleScanSuccess:", error);
      addToast(
        error.message || 'No se pudo encontrar el producto o hubo un error de red.',
        'error',
        5000,
        tempLoadingToastId
      );
       // Asegurar que volvemos a un estado consistente si falla
       setActiveTab('manual');
       setAddModeType('manual');
       // --- INICIO DE LA MODIFICACIÓN ---
       setManualFormState(initialManualFormState); // Usar la constante importada
       // --- FIN DE LA MODIFICACIÓN ---
       setIsPer100g(false);
       setOriginalData(null);
       setBaseMacros(null);
    }
  };

  const handleImageUpload = async (file) => {
    // ... (sin cambios en esta función)
    if (!file) {
      setManualFormState((prev) => ({
        ...prev,
        formData: { ...prev.formData, image_url: null },
      }));
      return;
    }
    setIsUploading(true);
    try {
      const response = await nutritionService.uploadFoodImage(file);
      setManualFormState((prev) => ({
        ...prev,
        formData: { ...prev.formData, image_url: response.imageUrl },
      }));
      addToast('Imagen subida con éxito.', 'success');
    } catch (error) {
      addToast(error.message || 'Error al subir la imagen.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    handleScanSuccess,
    handleImageUpload,
  };
};