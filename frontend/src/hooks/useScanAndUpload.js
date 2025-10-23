/* frontend/src/hooks/useScanAndUpload.js */
import { useState } from 'react';
import { useToast } from './useToast';
import * as nutritionService from '../services/nutritionService';
import { round } from './useNutritionConstants';

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
      addToast('Producto encontrado.', 'success', 3000, tempLoadingToastId);

      // Extraer datos del objeto anidado 'product' y 'nutriments'
      const product = productData.product || {};
      const nutriments = product.nutriments || {};
      const productName =
        product.product_name || product.generic_name || 'Producto escaneado';
      const productImageUrl =
        product.image_url || product.image_front_url || null;

      // Obtener valores por 100g
      const calories100g =
        parseFloat(
          nutriments['energy-kcal_100g'] ||
          nutriments.energy_100g ||
          nutriments['energy-kj_100g'] / 4.184
        ) || 0;
      const protein100g = parseFloat(nutriments.proteins_100g) || 0;
      const carbs100g = parseFloat(nutriments.carbohydrates_100g) || 0;
      const fat100g = parseFloat(nutriments.fat_100g) || 0;

      // Calcular macros base por 1g
      const baseCalPerG = calories100g > 0 ? calories100g / 100 : 0;
      const baseProtPerG = protein100g > 0 ? protein100g / 100 : 0;
      const baseCarbPerG = carbs100g > 0 ? carbs100g / 100 : 0;
      const baseFatPerG = fat100g > 0 ? fat100g / 100 : 0;

      // Valores iniciales basados en 100g
      const initialWeightNum = 100;
      const initialFormData = {
        description: productName,
        calories: String(Math.round(baseCalPerG * initialWeightNum)),
        protein_g: round(baseProtPerG * initialWeightNum),
        carbs_g: round(baseCarbPerG * initialWeightNum),
        fats_g: round(baseFatPerG * initialWeightNum),
        weight_g: String(initialWeightNum),
        image_url: productImageUrl,
      };

      // Guardar los valores por 100g directamente del producto
      const per100Values = {
        calories: String(round(calories100g, 0)),
        protein_g: String(round(protein100g, 1)),
        carbs_g: String(round(carbs100g, 1)),
        fats_g: String(round(fat100g, 1)),
      };

      // Establecer el estado del formulario manual
      setManualFormState({
        formData: initialFormData,
        per100Data: per100Values,
        per100Mode: true,
        isFavorite: false,
      });

      setBaseMacros(null);
      setOriginalData(initialFormData);
      setActiveTab('manual');
      setAddModeType('manual');
      setIsPer100g(true);
    } catch (error) {
      addToast(
        error.message || 'No se pudo encontrar el producto.',
        'error',
        5000,
        tempLoadingToastId
      );
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