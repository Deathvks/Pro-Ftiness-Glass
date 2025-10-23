/* frontend/src/components/nutrition/FoodSearchModal/FoodEntryForm.jsx */
import React, { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { CameraIcon, StarIcon, CheckIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import { favoriteMealService } from '../../../services/favoriteMealService';
import { nutritionService } from '../../../services/nutritionService';
import { useToast } from '../../../contexts/ToastProvider';

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
  // Inicializamos el estado directamente desde 'selectedItem'
  // Usamos los datos "por ración" por defecto, el useEffect lo corregirá
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
  const [favoriteId, setFavoriteId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  const { addToast } = useToast();

  const recalculateMacros = (newWeight, per100gMode) => {
    if (!selectedItem) return {};

    const baseWeight = per100gMode
      ? 100
      : selectedItem.serving_weight_g || 100;
    
    // Evitar división por cero si el peso base no está definido
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

  // --- INICIO DE LA MODIFICACIÓN ---
  // Lógica de 'useEffect' simplificada para evitar el 'return' prematuro.
  useEffect(() => {
    if (!selectedItem) return;

    // 1. Determinar si el toggle DEBE estar activado
    // (si es un scan, forzamos a 'true', si no, respetamos su estado actual)
    const shouldBePer100g = selectedItem.origin === 'scan' ? true : isPer100g;

    // 2. Si el estado 'isPer100g' del padre no coincide, lo actualizamos.
    // Esto causará un re-render, pero la lógica de abajo
    // usará 'shouldBePer100g' para cargar los datos correctos *ahora*.
    if (shouldBePer100g && !isPer100g) {
      setIsPer100g(true);
    }
    
    // 3. Seleccionar los datos correctos basados en 'shouldBePer100g'
    let baseData;
    let baseWeight;

    if (shouldBePer100g) {
      // Usar datos "por 100g"
      baseData = {
        calories: selectedItem.calories_per_100g || 0,
        protein_g: selectedItem.protein_per_100g || 0,
        carbs_g: selectedItem.carbs_per_100g || 0,
        fats_g: selectedItem.fat_per_100g || 0, // Mapea selectedItem.fat_... a formData.fats_g
      };
      baseWeight = 100;
    } else {
      // Usar datos "por ración"
      baseData = {
        calories: selectedItem.calories_per_serving || 0,
        protein_g: selectedItem.protein_per_serving || 0,
        carbs_g: selectedItem.carbs_per_serving || 0,
        fats_g: selectedItem.fat_per_serving || 0, // Mapea selectedItem.fat_... a formData.fats_g
      };
      baseWeight = selectedItem.serving_weight_g || 100;
    }

    // 4. Actualizar el formulario
    // Esta llamada ahora SÍ se ejecuta en el primer render
    setFormData({
      description: selectedItem.description || 'Alimento',
      image_url: selectedItem.image_url || null,
      weight_g: baseWeight,
      ...baseData, // Contiene { calories, protein_g, carbs_g, fats_g }
    });

    // 5. Comprobar si es favorito
    checkIfFavorite(selectedItem.description);
    
  }, [selectedItem, isPer100g, setIsPer100g]); // Dependencias correctas
  // --- FIN DE LA MODIFICACIÓN ---

  // Comprobar si el item es favorito
  const checkIfFavorite = async (description) => {
    try {
      const favorites = await favoriteMealService.getFavorites();
      const existingFavorite = favorites.find(
        (fav) =>
          fav.description.toLowerCase() === description.toLowerCase()
      );
      if (existingFavorite) {
        setIsFavorite(true);
        setFavoriteId(existingFavorite.id);
      } else {
        setIsFavorite(false);
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

  const handleToggleFavorite = async () => {
    const mealData = {
      description: formData.description,
      // Usar los datos base de 100g del selectedItem si existen
      calories: selectedItem.calories_per_100g || formData.calories || 0,
      protein_g: selectedItem.protein_per_100g || formData.protein_g || 0,
      carbs_g: selectedItem.carbs_per_100g || formData.carbs_g || 0,
      fats_g: selectedItem.fat_per_100g || formData.fats_g || 0,
      weight_g: 100, // Favoritos se guarda siempre por 100g
      image_url: formData.image_url || null,
    };

    try {
      if (isFavorite && favoriteId) {
        await favoriteMealService.deleteFavorite(favoriteId);
        setIsFavorite(false);
        setFavoriteId(null);
        addToast('Eliminado de favoritos', 'info');
      } else {
        const newFavorite = await favoriteMealService.addFavorite(mealData);
        setIsFavorite(true);
        setFavoriteId(newFavorite.id);
        addToast('Guardado en favoritos', 'success');
      }
    } catch (error) {
      console.error('Error al gestionar favoritos:', error);
      addToast('Error al gestionar favoritos', 'error');
    }
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
    const uploadFormData = new FormData();
    uploadFormData.append('foodImage', file);

    try {
      const res = await nutritionService.uploadFoodImage(uploadFormData);
      setFormData((prev) => ({
        ...prev,
        image_url: res.imageUrl,
      }));
      addToast('Imagen subida correctamente', 'success');
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      addToast(
        error.response?.data?.error || 'Error al subir la imagen',
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
          className="relative flex-shrink-0 w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-600 overflow-hidden"
          disabled={isUploading}
        >
          {isUploading ? (
            <div className="w-6 h-6 border-2 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
          ) : formData.image_url ? (
            <img
              src={
                formData.image_url.startsWith('http')
                  ? formData.image_url
                  : `${
                      import.meta.env.VITE_API_URL
                    }${formData.image_url.replace(/\\/g, '/')}`
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
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">
          {getServingSizeText()}
        </span>
        <div className="flex items-center">
          <span className="text-sm text-gray-400 mr-2">Por 100g</span>
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
          Peso
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="number"
            name="weight_g"
            id="weight_g"
            className="block w-full flex-1 rounded-none rounded-l-md border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="100"
            value={formData.weight_g}
            onChange={handleWeightChange}
            onBlur={handleWeightBlur}
            step="0.1"
            min="0"
          />
          <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-600 bg-gray-600 px-3 text-sm text-gray-300">
            g
          </span>
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