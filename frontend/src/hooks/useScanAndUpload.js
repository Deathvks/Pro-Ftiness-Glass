/* frontend/src/hooks/useScanAndUpload.js */
import { useState } from 'react';
import { useToast } from './useToast';
import * as nutritionService from '../services/nutritionService';
import { round } from './useNutritionConstants';

// --- INICIO DE LA MODIFICACIÓN ---
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
    return 0; // Devuelve 0 si ninguna clave es válida
};
// --- FIN DE LA MODIFICACIÓN ---


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
    const tempLoadingToastId = addToast('Buscando producto...', 'info', null); // Usar null para duración infinita inicial
    try {
      const productData = await nutritionService.searchByBarcode(barcode);

      // --- INICIO DE LA MODIFICACIÓN ---
      // Log para depuración
      console.log("Datos recibidos del escaneo:", productData);

      // Extraer datos de forma más robusta
      const product = productData?.product || {};
      const nutriments = product?.nutriments || {};
      const productName = product.product_name || product.generic_name || product.brands || 'Producto escaneado'; // Añadir fallback a 'brands'
      const productImageUrl = product.image_url || product.image_front_url || null;

      // Obtener valores por 100g usando el helper
      const calories100g = getNutrientValue(nutriments, ['energy-kcal_100g', 'energy_100g']) || getNutrientValue(nutriments, ['energy-kj_100g', 'energy_100g'], 1 / 4.184);
      const protein100g = getNutrientValue(nutriments, ['proteins_100g']);
      const carbs100g = getNutrientValue(nutriments, ['carbohydrates_100g']);
      const fat100g = getNutrientValue(nutriments, ['fat_100g']);

      // Verificar si obtuvimos datos válidos
      if (calories100g === 0 && protein100g === 0 && carbs100g === 0 && fat100g === 0 && productName === 'Producto escaneado') {
          addToast('No se encontró información nutricional detallada para este producto.', 'error', 5000, tempLoadingToastId);
          return; // No continuar si no hay datos útiles
      }
      addToast('Producto encontrado.', 'success', 3000, tempLoadingToastId); // Reemplazar toast de carga

      // Valores iniciales basados en 100g
      const initialWeightNum = 100;
      const initialFormData = {
        description: productName,
        calories: String(Math.round(calories100g)), // Usar directamente el valor por 100g
        protein_g: round(protein100g),
        carbs_g: round(carbs100g),
        fats_g: round(fat100g),
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
      // --- FIN DE LA MODIFICACIÓN ---

      // Establecer el estado del formulario manual
      setManualFormState({
        formData: initialFormData,
        per100Data: per100Values,
        per100Mode: true, // Se mantiene activo por defecto al escanear
        isFavorite: false,
      });

      setBaseMacros(null); // No usamos baseMacros al escanear
      setOriginalData(initialFormData); // Guardar datos iniciales para referencia si se edita
      setActiveTab('manual');
      setAddModeType('manual');
      setIsPer100g(true); // Asegurar que el toggle esté activo

    } catch (error) {
      addToast(
        error.message || 'No se pudo encontrar el producto.',
        'error',
        5000,
        tempLoadingToastId // Reemplazar toast de carga si existe
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