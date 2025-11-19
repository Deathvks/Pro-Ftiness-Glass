/* frontend/src/components/nutrition/FoodSearchModal/FoodEntryForm.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { Switch } from '@headlessui/react';
import { CameraIcon, StarIcon, CheckIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import { getFavoriteMeals } from '../../../services/favoriteMealService';
import { uploadFoodImage } from '../../../services/nutritionService';
// --- INICIO DE LA CORRECCIÓN ---
// El hook useToast se encuentra en la carpeta hooks, no en contexts/ToastProvider
import { useToast } from '../../../hooks/useToast';
// --- FIN DE LA CORRECCIÓN ---

// Componente para un campo de entrada de macros
const MacroInput = ({ label, value, onChange, unit }) => (
  <div className="flex-1">
    <label
      htmlFor={label}
      className="block text-sm font-medium text-gray-400"
    >
      {label}
    </label>
    <div className="mt-1 flex rounded-md shadow-sm">
      <input
        type="number"
        name={label}
        id={label}
        className="block w-full flex-1 rounded-none rounded-l-md border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        placeholder="0"
        value={value}
        onChange={onChange}
        step="0.1"
        min="0"
      />
      <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-600 bg-gray-600 px-3 text-sm text-gray-300">
        {unit}
      </span>
    </div>
  </div>
);

function FoodEntryForm({
  selectedItem,
  onAdd,
  onCancel,
  mealType,
  logDate,
  isPer100g,
  setIsPer100g,
}) {
  const [formData, setFormData] = useState({
    description: selectedItem.description || 'Alimento',
    weight_g: selectedItem.serving_weight_g || 100,
    calories: selectedItem.calories_per_serving || 0,
    protein_g: selectedItem.protein_per_serving || 0,
    carbs_g: selectedItem.carbs_per_serving || 0,
    fats_g: selectedItem.fat_per_serving || 0,
    image_url: selectedItem.image_url || null,
  });

  const [isFavorite, setIsFavorite] = useState(false);
  const [wasInitiallyFavorite, setWasInitiallyFavorite] = useState(false); // Nuevo estado para tracking
  const [favoriteId, setFavoriteId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { addToast } = useToast();

  const recalculateMacros = (newWeight, per100gMode) => {
    if (!selectedItem) return {};

    const baseWeight = per100gMode
      ? 100
      : selectedItem.serving_weight_g || 100;
    
    if (baseWeight === 0) return {};

    const factor = newWeight / baseWeight;

    const baseMacros = per100gMode
      ? {
          calories: selectedItem.calories_per_100g || 0,
          protein_g: selectedItem.protein_per_100g || 0,
          carbs_g: selectedItem.carbs_per_100g || 0,
          fats_g: selectedItem.fat_per_100g || 0,
        }
      : {
          calories: selectedItem.calories_per_serving || 0,
          protein_g: selectedItem.protein_per_serving || 0,
          carbs_g: selectedItem.carbs_per_serving || 0,
          fats_g: selectedItem.fat_per_serving || 0,
        };

    return {
      calories: parseFloat((baseMacros.calories * factor).toFixed(1)),
      protein_g: parseFloat((baseMacros.protein_g * factor).toFixed(1)),
      carbs_g: parseFloat((baseMacros.carbs_g * factor).toFixed(1)),
      fats_g: parseFloat((baseMacros.fats_g * factor).toFixed(1)),
    };
  };

  useEffect(() => {
    if (!selectedItem) return;

    const shouldBePer100g = selectedItem.origin === 'scan' ? true : isPer100g;

    if (shouldBePer100g && !isPer100g) {
      setIsPer100g(true);
    }
    
    let baseData;
    let baseWeight;

    if (shouldBePer100g) {
      baseData = {
        calories: selectedItem.calories_per_100g || 0,
        protein_g: selectedItem.protein_per_100g || 0,
        carbs_g: selectedItem.carbs_per_100g || 0,
        fats_g: selectedItem.fat_per_100g || 0,
      };
      baseWeight = 100;
    } else {
      baseData = {
        calories: selectedItem.calories_per_serving || 0,
        protein_g: selectedItem.protein_per_serving || 0,
        carbs_g: selectedItem.carbs_per_serving || 0,
        fats_g: selectedItem.fat_per_serving || 0,
      };
      baseWeight = selectedItem.serving_weight_g || 100;
    }

    setFormData({
      description: selectedItem.description || 'Alimento',
      image_url: selectedItem.image_url || null,
      weight_g: baseWeight,
      ...baseData,
    });

    checkIfFavorite(selectedItem.description);
    
  }, [selectedItem, isPer100g, setIsPer100g]);

  const checkIfFavorite = async (description) => {
    try {
      const favorites = await getFavoriteMeals();
      const existingFavorite = favorites.find(
        (fav) =>
          fav.name?.toLowerCase() === description?.toLowerCase()
      );
      if (existingFavorite) {
        setIsFavorite(true);
        setWasInitiallyFavorite(true); // Guardamos estado inicial
        setFavoriteId(existingFavorite.id);
      } else {
        setIsFavorite(false);
        setWasInitiallyFavorite(false);
        setFavoriteId(null);
      }
    } catch (error) {
      console.error('Error al comprobar favoritos:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleWeightChange = (e) => {
    const newWeight = parseFloat(e.target.value) || 0;
    const recalculatedMacros = recalculateMacros(newWeight, isPer100g);

    setFormData((prev) => ({
      ...prev,
      weight_g: e.target.value,
      ...recalculatedMacros,
    }));
  };

  const handleWeightBlur = (e) => {
    const finalWeight = parseFloat(e.target.value) || 0;
    setFormData((prev) => ({
      ...prev,
      weight_g: finalWeight,
    }));
  };

  const handleToggleFavorite = () => {
    // Solo modificamos el estado visual/local. 
    // La acción de crear/borrar se delega al evento 'submit'
    setIsFavorite(!isFavorite);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      addToast('Error: Solo se permiten archivos JPG, PNG o WEBP.', 'error');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      addToast('Error: El archivo no debe superar los 5MB.', 'error');
      return;
    }

    setIsUploading(true);
    
    try {
      const res = await uploadFoodImage(file);
      setFormData((prev) => ({
        ...prev,
        image_url: res.imageUrl,
      }));
      addToast('Imagen subida correctamente', 'success');
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      addToast(
        error.message || 'Error al subir la imagen',
        'error'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      log_date: logDate,
      meal_type: mealType,
      description: formData.description,
      calories: parseFloat(formData.calories) || 0,
      protein_g: parseFloat(formData.protein_g) || 0,
      carbs_g: parseFloat(formData.carbs_g) || 0,
      fats_g: parseFloat(formData.fats_g) || 0,
      weight_g: parseFloat(formData.weight_g) || 0,
      image_url: formData.image_url || null,
      calories_per_100g: selectedItem.calories_per_100g,
      protein_per_100g: selectedItem.protein_per_100g,
      carbs_per_100g: selectedItem.carbs_per_100g,
      fat_per_100g: selectedItem.fat_per_100g,
      // Pasamos los flags para que el padre gestione la sincronización de favoritos
      isFavorite,
      wasInitiallyFavorite
    });
  };

  const getServingSizeText = () => {
    if (isPer100g) {
      return 'Valores por 100g';
    }
    return `Ración (${selectedItem.serving_size || '1 ración'})`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Sección de Imagen y Descripción */}
      <div className="flex items-center space-x-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/jpeg, image/png, image/webp"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative flex-shrink-0 w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-600 overflow-hidden border border-gray-600"
          disabled={isUploading}
        >
          {isUploading ? (
            <div className="w-6 h-6 border-2 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
          ) : formData.image_url ? (
            <img
              src={
                formData.image_url.startsWith('http')
                  ? formData.image_url
                  : `${import.meta.env.VITE_API_BASE_URL}${formData.image_url}`
              }
              alt={formData.description}
              className="w-full h-full object-cover"
            />
          ) : (
            <CameraIcon className="w-8 h-8" />
          )}
        </button>

        <div className="flex-1">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-400"
          >
            Descripción
          </label>
          <div className="mt-1 flex">
            <input
              type="text"
              name="description"
              id="description"
              className="block w-full rounded-l-md border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`p-2 border border-l-0 border-gray-600 rounded-r-md ${
                isFavorite
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
              aria-label={
                isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'
              }
            >
              {isFavorite ? (
                <StarIcon className="w-5 h-5" />
              ) : (
                <StarIconOutline className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sección de Ración / Por 100g */}
      <div className="flex items-center justify-between border-t border-gray-700 pt-4">
        <span className="text-sm font-medium text-gray-300">
          {getServingSizeText()}
        </span>
        <div className="flex items-center">
          <span className="text-sm text-gray-400 mr-2">Base 100g</span>
          <Switch
            checked={isPer100g}
            onChange={setIsPer100g}
            className={`${
              isPer100g ? 'bg-blue-600' : 'bg-gray-600'
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
          >
            <span
              className={`${
                isPer100g ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>
      </div>

      {/* Peso */}
      <div>
        <label
          htmlFor="weight_g"
          className="block text-sm font-medium text-gray-400"
        >
          Peso (g)
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="number"
            name="weight_g"
            id="weight_g"
            className="block w-full flex-1 rounded-md border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="100"
            value={formData.weight_g}
            onChange={handleWeightChange}
            onBlur={handleWeightBlur}
            step="0.1"
            min="0"
          />
        </div>
      </div>

      {/* Macros */}
      <div className="flex space-x-2">
        <MacroInput
          label="Calorías"
          value={formData.calories}
          onChange={handleInputChange}
          unit="kcal"
        />
        <MacroInput
          label="Proteínas"
          value={formData.protein_g}
          onChange={handleInputChange}
          unit="g"
        />
      </div>
      <div className="flex space-x-2">
        <MacroInput
          label="Carbohidratos"
          value={formData.carbs_g}
          onChange={handleInputChange}
          unit="g"
        />
        <MacroInput
          label="Grasas"
          value={formData.fats_g}
          onChange={handleInputChange}
          unit="g"
        />
      </div>

      {/* Botones de Acción */}
      <div className="flex pt-4 space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 inline-flex items-center justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          <CheckIcon className="w-5 h-5 mr-2" />
          Añadir
        </button>
      </div>
    </form>
  );
}

export default FoodEntryForm;