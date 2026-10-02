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
      const fat100g = getNutrientValue(nutriments, ['fat_100g', 'fats_100g']);
      // --- AÑADIDO: Extracción de azúcar ---
      const sugars100g = getNutrientValue(nutriments, ['sugars_100g', 'sugar_100g']);

      const hasUsefulData = productName !== 'Producto escaneado' || calories100g > 0 || protein100g > 0 || carbs100g > 0 || fat100g > 0;

      if (!hasUsefulData) {
          addToast('No se encontró información nutricional detallada para este producto.', 'error', 5000, tempLoadingToastId);
          setActiveTab('manual');
          setAddModeType('manual');
          setManualFormState(initialManualFormState);
          setIsPer100g(false);
          setOriginalData(null);
          setBaseMacros(null);
          return;
      }
      addToast('Producto encontrado.', 'success', 3000, tempLoadingToastId);

      const servingCalories = getNutrientValue(nutriments, ['energy-kcal_serving', 'energy_serving'], 1) || getNutrientValue(nutriments, ['energy-kj_serving'], 1 / 4.184);
      const servingProtein = getNutrientValue(nutriments, ['proteins_serving']);
      const servingCarbs = getNutrientValue(nutriments, ['carbohydrates_serving']);
      const servingFat = getNutrientValue(nutriments, ['fat_serving', 'fats_serving']);
      // --- AÑADIDO: Azúcar por ración ---
      const servingSugars = getNutrientValue(nutriments, ['sugars_serving', 'sugar_serving']);
      const servingWeight = parseFloat(product.serving_quantity) || 100;

      // Calcular los macros para el peso por defecto (servingWeight) usando los datos por 100g
      const defaultWeight = servingWeight;
      const factor = defaultWeight / 100;
      const calculatedMacros = {
          calories: round(calories100g * factor, 0),
          protein_g: round(protein100g * factor, 1),
          carbs_g: round(carbs100g * factor, 1),
          fats_g: round(fat100g * factor, 1),
          sugars_g: round(sugars100g * factor, 1), // --- AÑADIDO ---
      }

      // Preparamos los datos originales y los del formulario directamente
      const originalScannedData = {
          description: productName,
          calories: servingCalories || calories100g, // Datos originales pueden ser por ración o 100g
          protein_g: servingProtein || protein100g,
          carbs_g: servingCarbs || carbs100g,
          fats_g: servingFat || fat100g,
          sugars_g: servingSugars || sugars100g, // --- AÑADIDO ---
          weight_g: servingWeight,
          image_url: productImageUrl,
          calories_per_100g: calories100g,
          protein_per_100g: protein100g,
          carbs_per_100g: carbs100g,
          fat_per_100g: fat100g,
          sugars_per_100g: sugars100g, // --- AÑADIDO ---
          origin: 'scan',
          micronutrients: nutriments,
      };

      // Establecer el estado del formulario directamente
      setManualFormState({
          formData: {
              description: productName,
              calories: calculatedMacros.calories,
              protein_g: calculatedMacros.protein_g,
              carbs_g: calculatedMacros.carbs_g,
              fats_g: calculatedMacros.fats_g,
              sugars_g: calculatedMacros.sugars_g, // --- AÑADIDO ---
              weight_g: round(defaultWeight, 1),
              image_url: productImageUrl,
              micronutrients: nutriments,
          },
          per100Data: { // Cargar datos por 100g para el modo /100g
              calories: round(calories100g, 0),
              protein_g: round(protein100g, 1),
              carbs_g: round(carbs100g, 1),
              fats_g: round(fat100g, 1),
              sugars_g: round(sugars100g, 1), // --- AÑADIDO ---
          },
          per100Mode: true, // Forzar modo por 100g
          isFavorite: false, // Por defecto no es favorito al escanear
      });

      setOriginalData(originalScannedData); // Guardar los datos originales por si se edita

      setIsPer100g(true); // Activar modo por 100g en el hook padre
      setBaseMacros(null); // No usamos baseMacros en modo por 100g
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