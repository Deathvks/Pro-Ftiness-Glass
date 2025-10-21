/*
frontend/src/components/nutrition/FoodSearchModal/FoodEntryForm.jsx
*/
import React, { useState, useEffect, useMemo } from 'react';
import { CameraIcon } from '@heroicons/react/24/solid';
import { nutritionService } from '../../../services/nutritionService';

function FoodEntryForm({ 
  selectedItem, 
  onAdd, 
  onCancel, 
  onUpdate, 
  mealType, 
  logDate,
  isPer100g, 
  setIsPer100g 
}) {
  const [grams, setGrams] = useState(100);
  const [nutritionalInfo, setNutritionalInfo] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (selectedItem) {
      const info = {
        calories: selectedItem.calories_per_100g || 0,
        protein: selectedItem.protein_per_100g || 0,
        carbs: selectedItem.carbs_per_100g || 0,
        fat: selectedItem.fat_per_100g || 0,
      };
      setNutritionalInfo(info);
      setGrams(selectedItem.weight_g || 100);
      setPreview(selectedItem.image_url ? `${import.meta.env.VITE_API_URL}/${selectedItem.image_url}` : null);
      setFile(null);
    }
  }, [selectedItem]);

  const calculatedMacros = useMemo(() => {
    const factor = isPer100g ? (parseFloat(grams) || 0) / 100 : 1;
    const baseCalories = isPer100g ? nutritionalInfo.calories : (selectedItem?.calories || 0);
    const baseProtein = isPer100g ? nutritionalInfo.protein : (selectedItem?.protein || 0);
    const baseCarbs = isPer100g ? nutritionalInfo.carbs : (selectedItem?.carbs || 0);
    const baseFat = isPer100g ? nutritionalInfo.fat : (selectedItem?.fat || 0);

    // Si no es por 100g, los gramos no deberían afectar las macros (se asume que es una unidad)
    if (!isPer100g) {
      // Si el item tiene weight_g, es una entrada de log (que ya fue calculada)
      // Si no, es un item de búsqueda (OFF/favorito) y tomamos sus valores base
       const weight = parseFloat(grams) || 0;
       if (selectedItem?.serving_size_g && selectedItem.serving_size_g > 0) {
         // Es un item de búsqueda de OpenFoodFacts, recalcular basado en serving size
         const servingFactor = weight / selectedItem.serving_size_g;
         return {
           calories: (selectedItem.calories_per_serving || 0) * servingFactor,
           protein: (selectedItem.protein_per_serving || 0) * servingFactor,
           carbs: (selectedItem.carbs_per_serving || 0) * servingFactor,
           fat: (selectedItem.fat_per_serving || 0) * servingFactor,
         };
       }
       // Si es entrada manual o favorito sin serving_size_g, los valores son absolutos
       return {
         calories: baseCalories,
         protein: baseProtein,
         carbs: baseCarbs,
         fat: baseFat,
       };
    }

    // Cálculo por 100g
    return {
      calories: baseCalories * factor,
      protein: baseProtein * factor,
      carbs: baseCarbs * factor,
      fat: baseFat * factor,
    };
  }, [grams, nutritionalInfo, isPer100g, selectedItem]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleAddClick = async () => {
    let imageUrl = selectedItem.image_url;

    if (file) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        const response = await nutritionService.uploadImage(formData);
        imageUrl = response.imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        // Opcional: mostrar un error al usuario
      }
    }
    
    const entry = {
      name: selectedItem.name,
      calories: parseFloat(calculatedMacros.calories.toFixed(1)),
      protein: parseFloat(calculatedMacros.protein.toFixed(1)),
      carbs: parseFloat(calculatedMacros.carbs.toFixed(1)),
      fat: parseFloat(calculatedMacros.fat.toFixed(1)),
      weight_g: parseFloat(grams) || 0,
      meal_type: mealType,
      log_date: logDate,
      image_url: imageUrl || selectedItem.image_url, // Usar la nueva o la existente
      // Campos por 100g para referencia futura (si se guarda como favorito)
      calories_per_100g: nutritionalInfo.calories,
      protein_per_100g: nutritionalInfo.protein,
      carbs_per_100g: nutritionalInfo.carbs,
      fat_per_100g: nutritionalInfo.fat,
    };

    if (onUpdate) {
      onUpdate({ ...selectedItem, ...entry });
    } else {
      onAdd(entry);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-bold text-white mb-3 text-center truncate">{selectedItem.name}</h3>
      
      <div className="flex items-center space-x-4 mb-4">
        <div 
          className="w-24 h-24 rounded-lg bg-gray-700 flex items-center justify-center cursor-pointer relative overflow-hidden"
          onClick={() => document.getElementById('foodImageUpload').click()}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <CameraIcon className="w-10 h-10 text-gray-500" />
          )}
          <input
            type="file"
            id="foodImageUpload"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex-1">
          <label htmlFor="grams" className="block text-sm font-medium text-gray-300 mb-1">
            Gramos
          </label>
          <input
            type="number"
            id="grams"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Gramos"
          />
          <div className="flex items-center justify-end space-x-2 mt-2">
            <span className="text-sm font-medium text-gray-300">
              Valores por 100g
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPer100g}
                onChange={() => setIsPer100g(!isPer100g)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {isPer100g && (
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <h4 className="text-md font-semibold text-white mb-2">Valores Nutricionales (por 100g)</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <label className="block text-xs font-medium text-gray-400">Calorías</label>
              <input
                type="number"
                value={nutritionalInfo.calories}
                onChange={(e) => setNutritionalInfo(prev => ({ ...prev, calories: parseFloat(e.target.value) || 0 }))}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded-md text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400">Proteínas</label>
              <input
                type="number"
                value={nutritionalInfo.protein}
                onChange={(e) => setNutritionalInfo(prev => ({ ...prev, protein: parseFloat(e.target.value) || 0 }))}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded-md text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400">Carbohidratos</label>
              <input
                type="number"
                value={nutritionalInfo.carbs}
                onChange={(e) => setNutritionalInfo(prev => ({ ...prev, carbs: parseFloat(e.target.value) || 0 }))}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded-md text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400">Grasas</label>
              <input
                type="number"
                value={nutritionalInfo.fat}
                onChange={(e) => setNutritionalInfo(prev => ({ ...prev, fat: parseFloat(e.target.value) || 0 }))}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded-md text-white"
              />
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h4 className="text-md font-semibold text-white mb-2">Macros Calculados ({grams || 0}g)</h4>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-gray-700 p-2 rounded-lg">
            <span className="text-xs text-gray-400">Kcal</span>
            <span className="block text-lg font-bold text-white">{calculatedMacros.calories.toFixed(0)}</span>
          </div>
          <div className="bg-gray-700 p-2 rounded-lg">
            <span className="text-xs text-blue-400">Prot</span>
            <span className="block text-lg font-bold text-white">{calculatedMacros.protein.toFixed(1)}</span>
          </div>
          <div className="bg-gray-700 p-2 rounded-lg">
            <span className="text-xs text-green-400">Carbs</span>
            <span className="block text-lg font-bold text-white">{calculatedMacros.carbs.toFixed(1)}</span>
          </div>
          <div className="bg-gray-700 p-2 rounded-lg">
            <span className="text-xs text-yellow-400">Grasas</span>
            <span className="block text-lg font-bold text-white">{calculatedMacros.fat.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition"
        >
          Cancelar
        </button>
        <button
          onClick={handleAddClick}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 transition"
        >
          {onUpdate ? 'Actualizar' : 'Añadir'}
        </button>
      </div>
    </div>
  );
}

export default FoodEntryForm;