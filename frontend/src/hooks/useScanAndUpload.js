/* frontend/src/hooks/useScanAndUpload.js */
import { useState } from 'react';
import { useToast } from './useToast';
import * as nutritionService from '../services/nutritionService';
import { initialManualFormState, round } from './useNutritionConstants';

// Helper para obtener valores numéricos de forma segura desde el objeto de nutrientes
const getNutrientValue = (nutriments, keys, conversionFactor = 1) => {
    if (!nutriments) return 0;
    for (const key of keys) {
        if (nutriments[key] !== undefined && nutriments[key] !== null) {
            const value = parseFloat(nutriments[key]);
            if (!isNaN(value)) {
                return value * conversionFactor;
            }
        }
    }
    return 0;
};


export const useScanAndUpload = ({
  setShowScanner,
  setManualFormState,
  setBaseMacros,
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
      console.log("Datos recibidos del escaneo:", productData);

      const product = productData?.product || {};
      const nutriments = product?.nutriments || {};
      const productName = product.product_name || 'Producto escaneado'; // Simplificado
      const productImageUrl = product.image_url || null; // Simplificado

      // Obtener macros principales
      const calories100g = getNutrientValue(nutriments, ['energy-kcal_100g', 'energy_100g'], 1) || getNutrientValue(nutriments, ['energy-kj_100g'], 1 / 4.184);
      const protein100g = getNutrientValue(nutriments, ['proteins_100g']);
      const carbs100g = getNutrientValue(nutriments, ['carbohydrates_100g']);
      const fat100g = getNutrientValue(nutriments, ['fat_100g', 'fats_100g']); // <- CORREGIDO: Se buscaba 'fats_100g' también

      // --- INICIO DE LA CORRECCIÓN ---
      // Condición corregida: Error solo si NO hay nombre específico Y NO hay NINGÚN macro principal.
      const hasUsefulData = productName !== 'Producto escaneado' || calories100g > 0 || protein100g > 0 || carbs100g > 0 || fat100g > 0;

      if (!hasUsefulData) {
          addToast('No se encontró información nutricional detallada para este producto.', 'error', 5000, tempLoadingToastId);
          // Ir al formulario manual vacío
          setActiveTab('manual');
          setAddModeType('manual');
          setManualFormState(initialManualFormState);
          setIsPer100g(false);
          setOriginalData(null);
          setBaseMacros(null);
          return; // Detener ejecución aquí
      }
      // Si hay datos útiles, mostrar éxito
      addToast('Producto encontrado.', 'success', 3000, tempLoadingToastId);
      // --- FIN DE LA CORRECCIÓN ---

      // Usar valores por ración si existen, si no, los de 100g
      const servingCalories = getNutrientValue(nutriments, ['energy-kcal_serving', 'energy_serving'], 1) || getNutrientValue(nutriments, ['energy-kj_serving'], 1 / 4.184);
      const servingProtein = getNutrientValue(nutriments, ['proteins_serving']);
      const servingCarbs = getNutrientValue(nutriments, ['carbohydrates_serving']);
      const servingFat = getNutrientValue(nutriments, ['fat_serving', 'fats_serving']); // <- CORREGIDO: Se buscaba 'fats_serving' también
      const servingWeight = parseFloat(product.serving_quantity) || 100; // <- Usar product.serving_quantity

      const scannedItemData = {
          description: productName,
          calories: servingCalories || calories100g,
          protein_g: servingProtein || protein100g,
          carbs_g: servingCarbs || carbs100g,
          fats_g: servingFat || fat100g, // <- CORREGIDO: usar fats_g
          weight_g: servingWeight,
          image_url: productImageUrl,
          // Añadir explícitamente los campos _per_100g
          calories_per_100g: calories100g,
          protein_per_100g: protein100g,
          carbs_per_100g: carbs100g,
          fat_per_100g: fat100g, // <- CORREGIDO: Usar fat_per_100g
          origin: 'scan',
      };

      // Pasar datos al formulario manual
      setManualFormState(prevState => ({
          ...prevState, // Mantener estado anterior por si acaso
          itemToEdit: scannedItemData, // Cargar datos en el editor
          per100Mode: true, // Forzar modo por 100g para escaneos
          per100Data: { // Cargar datos por 100g
            calories: round(calories100g, 0),
            protein_g: round(protein100g, 1),
            carbs_g: round(carbs100g, 1),
            fats_g: round(fat100g, 1),
          }
      }));

      // Forzar el modo por 100g en el hook padre también
      setIsPer100g(true);
      setBaseMacros(null); // No usamos baseMacros en modo por 100g
      setOriginalData(scannedItemData);
      setActiveTab('manual');
      setAddModeType('manual');

    } catch (error) {
       console.error("Error detallado en handleScanSuccess:", error);
      addToast(
        error.message || 'No se pudo encontrar el producto o hubo un error de red.',
        'error',
        5000,
        tempLoadingToastId
      );
       // Resetear estado en caso de error
       setActiveTab('manual');
       setAddModeType('manual');
       setManualFormState(initialManualFormState);
       setIsPer100g(false);
       setOriginalData(null);
       setBaseMacros(null);
    }
  };

  const handleImageUpload = async (file) => {
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