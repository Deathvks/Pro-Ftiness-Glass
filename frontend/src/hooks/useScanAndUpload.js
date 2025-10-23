/* frontend/src/hooks/useScanAndUpload.js */
import { useState } from 'react';
import { useToast } from './useToast';
import * as nutritionService from '../services/nutritionService';
import { round } from './useNutritionConstants';

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


export const useScanAndUpload = ({
  setShowScanner,
  setManualFormState,
  setBaseMacros,
  setOriginalData,
  setActiveTab,
  setAddModeType,
  setIsPer100g, // Todavía recibimos esto para pasarlo al hook useManualForm a través del modal
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const { addToast } = useToast();

  const handleScanSuccess = async (barcode) => {
    setShowScanner(false);
    const tempLoadingToastId = addToast('Buscando producto...', 'info', null); // Usar null para duración infinita inicial
    try {
      const productData = await nutritionService.searchByBarcode(barcode);

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
      const fat100g = getNutrientValue(nutriments, ['fat_100g', 'fats_100g']); // Añadida clave 'fats_100g' como fallback

      // Verificar si obtuvimos datos válidos
      if (calories100g === 0 && protein100g === 0 && carbs100g === 0 && fat100g === 0 && productName === 'Producto escaneado') {
          addToast('No se encontró información nutricional detallada para este producto.', 'error', 5000, tempLoadingToastId);
          setActiveTab('manual'); // Ir a manual para que el usuario pueda introducir datos
          setAddModeType('manual');
          setManualFormState(initialManualFormState); // Resetear formulario manual por si acaso
          setIsPer100g(false); // Asegurar que no esté activo el modo 100g
          return; // No continuar si no hay datos útiles
      }
      addToast('Producto encontrado.', 'success', 3000, tempLoadingToastId); // Reemplazar toast de carga

      // Preparar el objeto para pasarlo a useManualForm.
      // Incluimos tanto los datos directos (que podrían ser por ración)
      // como los datos _per_100g si los encontramos.
      const scannedItemData = {
          description: productName,
          calories: getNutrientValue(nutriments, ['energy-kcal_serving', 'energy_serving']) || getNutrientValue(nutriments, ['energy-kj_serving'], 1 / 4.184) || calories100g, // Prioridad: por ración, luego 100g
          protein_g: getNutrientValue(nutriments, ['proteins_serving']) || protein100g,
          carbs_g: getNutrientValue(nutriments, ['carbohydrates_serving']) || carbs100g,
          fats_g: getNutrientValue(nutriments, ['fat_serving', 'fats_serving']) || fat100g,
          weight_g: parseFloat(product.serving_quantity) || 100, // Usar peso de ración si existe, sino 100g
          image_url: productImageUrl,
          // Añadir explícitamente los campos _per_100g para que useManualForm pueda detectarlos
          calories_per_100g: calories100g,
          protein_per_100g: protein100g,
          carbs_per_100g: carbs100g,
          fat_per_100g: fat100g, // Estandarizar a fat_per_100g
          origin: 'scan', // Marcar origen
      };


      // --- INICIO DE LA MODIFICACIÓN ---
      // Establecer el estado del formulario manual a través de setManualFormState
      // Esto ahora desencadenará el useEffect dentro de useManualForm que decide si activar o no el modo 100g
       setManualFormState({
           // Pasamos los datos relevantes para que useManualForm los procese
           itemToEdit: scannedItemData,
           // El resto del estado lo manejará el useEffect de useManualForm
           per100Data: initialManualFormState.per100Data,
           per100Mode: false, // Dejamos que useManualForm decida
           isFavorite: false,
       });

      setBaseMacros(null); // useManualForm gestionará esto
      setOriginalData(scannedItemData); // Guardar datos originales recibidos
      setActiveTab('manual');
      setAddModeType('manual');
      // ¡Ya NO forzamos setIsPer100g(true) aquí!
      // --- FIN DE LA MODIFICACIÓN ---


    } catch (error) {
       console.error("Error detallado en handleScanSuccess:", error); // Log más detallado
      addToast(
        error.message || 'No se pudo encontrar el producto o hubo un error de red.', // Mensaje más genérico
        'error',
        5000,
        tempLoadingToastId // Reemplazar toast de carga si existe
      );
       // Asegurar que volvemos a un estado consistente si falla
       setActiveTab('manual');
       setAddModeType('manual');
       setManualFormState(initialManualFormState);
       setIsPer100g(false);
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