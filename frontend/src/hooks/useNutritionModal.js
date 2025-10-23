/* frontend/src/hooks/useNutritionModal.js */
import { useState, useEffect, useMemo, useCallback } from 'react';
import useAppStore from '../store/useAppStore';
import { useToast } from './useToast';
import * as nutritionService from '../services/nutritionService';

const initialManualFormState = {
  formData: {
    description: '',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fats_g: '',
    weight_g: '',
    image_url: null,
  },
  per100Data: { calories: '', protein_g: '', carbs_g: '', fats_g: '' },
  per100Mode: false,
  isFavorite: false,
};

// Mover la función `round` fuera del hook para que no se recree en cada render.
const round = (val, d = 1) => {
  const n = parseFloat(val);
  return isNaN(n)
    ? ''
    : (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
};

export const useNutritionModal = ({ mealType, onSave, onClose, logToEdit }) => {
  const isEditingLog = Boolean(logToEdit);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(
    isEditingLog ? 'manual' : 'favorites'
  );
  const [itemsToAdd, setItemsToAdd] = useState([]);
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [mealToDelete, setMealToDelete] = useState(null);
  const [editingListItemId, setEditingListItemId] = useState(null);
  const [editingFavorite, setEditingFavorite] = useState(null);
  const [manualFormState, setManualFormState] = useState(
    initialManualFormState
  );
  const [baseMacros, setBaseMacros] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [addModeType, setAddModeType] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPer100g, setIsPer100g] = useState(false); // Estado para controlar el interruptor globalmente en el modal
  const ITEMS_PER_PAGE = 5;

  const { addToast } = useToast();
  const {
    favoriteMeals,
    addFavoriteMeal,
    deleteFavoriteMeal,
    updateFavoriteMeal,
  } = useAppStore((state) => ({
    favoriteMeals: state.favoriteMeals,
    addFavoriteMeal: state.addFavoriteMeal,
    deleteFavoriteMeal: state.deleteFavoriteMeal,
    updateFavoriteMeal: state.updateFavoriteMeal,
  }));

  const [isDarkTheme] = useState(
    () =>
      typeof document !== 'undefined' &&
      !document.body.classList.contains('light-theme')
  );

  const [recentMeals, setRecentMeals] = useState([]);
  const [isLoadingRecents, setIsLoadingRecents] = useState(false);

  useEffect(() => {
    const fetchRecents = async () => {
      setIsLoadingRecents(true);
      try {
        const recentsData = await nutritionService.getRecentMeals();
        setRecentMeals(recentsData);
      } catch (error) {
        addToast('Error al cargar comidas recientes.', 'error');
        setRecentMeals([]); // Asegurarse de que esté vacío en caso de error
      } finally {
        setIsLoadingRecents(false);
      }
    };
    if (activeTab === 'recent') {
      fetchRecents();
    }
  }, [activeTab, addToast]);

  const filteredFavorites = useMemo(
    () =>
      [...favoriteMeals]
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(
          (meal) =>
            meal.name &&
            meal.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    [favoriteMeals, searchTerm]
  );

  const filteredRecents = useMemo(
    () =>
      recentMeals.filter(
        (meal) =>
          meal.description &&
          meal.description.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [recentMeals, searchTerm]
  );

  const paginatedFavorites = useMemo(() => {
    const startIndex = (favoritesPage - 1) * ITEMS_PER_PAGE;
    return filteredFavorites.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredFavorites, favoritesPage, ITEMS_PER_PAGE]);

  const totalPages = Math.ceil(filteredFavorites.length / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    const itemToEdit = isEditingLog
      ? logToEdit
      : editingFavorite ||
      itemsToAdd.find((item) => item.tempId === editingListItemId);
    if (itemToEdit) {
      const description = itemToEdit.description || itemToEdit.name || '';
      const initialWeight = parseFloat(itemToEdit.weight_g);
      if (initialWeight > 0) {
        setBaseMacros({
          calories: (parseFloat(itemToEdit.calories) || 0) / initialWeight,
          protein_g: (parseFloat(itemToEdit.protein_g) || 0) / initialWeight,
          carbs_g: (parseFloat(itemToEdit.carbs_g) || 0) / initialWeight,
          fats_g: (parseFloat(itemToEdit.fats_g) || 0) / initialWeight,
        });
      } else {
        setBaseMacros(null);
      }
      const currentFormData = {
        description: description,
        calories: String(itemToEdit.calories || ''),
        protein_g: String(itemToEdit.protein_g || ''),
        carbs_g: String(itemToEdit.carbs_g || ''),
        fats_g: String(itemToEdit.fats_g || ''),
        weight_g: String(itemToEdit.weight_g || ''),
        image_url: itemToEdit.image_url || null,
      };
      setManualFormState({
        formData: currentFormData,
        per100Data: { calories: '', protein_g: '', carbs_g: '', fats_g: '' },
        per100Mode: false,
        isFavorite:
          itemToEdit.isFavorite ||
          favoriteMeals.some(
            (fav) => fav.name.toLowerCase() === description.toLowerCase()
          ),
      });
      setOriginalData(currentFormData);
      setIsPer100g(false);
    }
  }, [
    editingListItemId,
    isEditingLog,
    logToEdit,
    itemsToAdd,
    editingFavorite,
    favoriteMeals,
    setIsPer100g, // Añadido setIsPer100g como dependencia
  ]);

  useEffect(() => {
    if (baseMacros && (isEditingLog || editingListItemId || editingFavorite)) {
      const newWeight = parseFloat(manualFormState.formData.weight_g) || 0;
      if (String(newWeight) !== String(originalData?.weight_g || '')) {
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
  }, [
    manualFormState.formData.weight_g,
    baseMacros,
    isEditingLog,
    editingListItemId,
    editingFavorite,
    originalData,
  ]);

  const computeFromPer100 = useCallback((cal, p, c, f, g) => {
    const factor = (parseFloat(g) || 0) / 100;
    return {
      calories: Math.round((parseFloat(cal) || 0) * factor),
      protein_g: round((parseFloat(p) || 0) * factor),
      carbs_g: round((parseFloat(c) || 0) * factor),
      fats_g: round((parseFloat(f) || 0) * factor),
    };
  }, []);

  useEffect(() => {
    if (
      isPer100g &&
      !isEditingLog &&
      !editingListItemId &&
      !editingFavorite
    ) {
      const computed = computeFromPer100(
        manualFormState.per100Data.calories,
        manualFormState.per100Data.protein_g,
        manualFormState.per100Data.carbs_g,
        manualFormState.per100Data.fats_g,
        manualFormState.formData.weight_g
      );
      setManualFormState((prev) => ({
        ...prev,
        formData: { ...prev.formData, ...computed },
      }));
    }
  }, [
    manualFormState.formData.weight_g,
    manualFormState.per100Data,
    isPer100g,
    isEditingLog,
    editingListItemId,
    editingFavorite,
    computeFromPer100,
  ]);

  useEffect(() => {
    if (itemsToAdd.length === 0) setAddModeType(null);
  }, [itemsToAdd]);

  useEffect(() => {
    setFavoritesPage(1);
  }, [searchTerm, activeTab]);
  useEffect(() => {
    if (editingListItemId || isEditingLog || editingFavorite)
      setActiveTab('manual');
  }, [editingListItemId, isEditingLog, editingFavorite]);

  const handleScanSuccess = async (barcode) => {
    setShowScanner(false);
    const tempLoadingToastId = addToast('Buscando producto...', 'info', null);
    try {
      const productData = await nutritionService.searchByBarcode(barcode);
      addToast('Producto encontrado.', 'success', 3000, tempLoadingToastId);

      // --- INICIO DE LA MODIFICACIÓN ---
      // Extraer datos del objeto anidado 'product' y 'nutriments'
      const product = productData.product || {};
      const nutriments = product.nutriments || {};
      const productName = product.product_name || product.generic_name || 'Producto escaneado';
      const productImageUrl = product.image_url || product.image_front_url || null;

      // Obtener valores por 100g (usando diferentes claves posibles de OpenFoodFacts)
      // Usar || 0 al final para asegurar que sea un número si todo falla
      const calories100g = parseFloat(nutriments['energy-kcal_100g'] || nutriments.energy_100g || nutriments['energy-kj_100g'] / 4.184) || 0;
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
        // Calcular directamente los valores para el peso inicial (100g)
        calories: String(Math.round(baseCalPerG * initialWeightNum)),
        protein_g: round(baseProtPerG * initialWeightNum),
        carbs_g: round(baseCarbPerG * initialWeightNum),
        fats_g: round(baseFatPerG * initialWeightNum),
        weight_g: String(initialWeightNum), // Mantener como string para el input
        image_url: productImageUrl,
      };

      // Guardar los valores por 100g directamente del producto
      const per100Values = {
        calories: String(round(calories100g, 0)), // Redondear calorías a entero
        protein_g: String(round(protein100g, 1)),
        carbs_g: String(round(carbs100g, 1)),
        fats_g: String(round(fat100g, 1)),
      };

      // Establecer el estado del formulario manual
      setManualFormState({
        formData: initialFormData,
        per100Data: per100Values, // Usar los valores directos
        per100Mode: true, // Forzar modo por 100g al escanear
        isFavorite: false,
      });

      setBaseMacros(null); // No necesario en modo por 100g
      setOriginalData(initialFormData); // Guardar los datos originales
      setActiveTab('manual'); // Cambiar a la pestaña manual
      setAddModeType('manual'); // Indicar que estamos en modo manual
      setIsPer100g(true); // Activar el interruptor global
      // --- FIN DE LA MODIFICACIÓN ---

    } catch (error) {
      addToast(
        error.message || 'No se pudo encontrar el producto.',
        'error',
        5000,
        tempLoadingToastId
      );
    }
  };


  const handleDeleteFavorite = (meal) => setMealToDelete(meal);
  const confirmDeleteFavorite = async () => {
    if (!mealToDelete) return;
    const result = await deleteFavoriteMeal(mealToDelete.id);
    addToast(result.message, result.success ? 'success' : 'error');
    setMealToDelete(null);
  };

  const handleAddItem = (item, origin = 'manual') => {
    if (origin === 'manual' || origin === 'scan') setAddModeType('manual');
    else setAddModeType('list');
    const description = item.name || item.description;
    const baseWeight =
      parseFloat(item.weight_g) ||
      (origin === 'manual' ? 0 : description ? 100 : 0);
    const newItem = {
      ...item,
      tempId: `item-${Date.now()}-${Math.random()}`,
      description: description,
      name: description,
      isFavorite: item.isFavorite || false,
      calories: parseFloat(item.calories) || 0,
      protein_g: parseFloat(item.protein_g) || 0,
      carbs_g: parseFloat(item.carbs_g) || 0,
      fats_g: parseFloat(item.fats_g) || 0,
      weight_g: parseFloat(item.weight_g) || null,
      image_url: item.image_url || null,
      base:
        baseWeight > 0
          ? {
            calories: (parseFloat(item.calories) || 0) / baseWeight,
            protein_g: (parseFloat(item.protein_g) || 0) / baseWeight,
            carbs_g: (parseFloat(item.carbs_g) || 0) / baseWeight,
            fats_g: (parseFloat(item.fats_g) || 0) / baseWeight,
          }
          : null,
      origin,
    };
    setItemsToAdd((prev) => [...prev, newItem]);
    addToast(`${description} añadido a la lista.`, 'success');
    if (origin === 'manual') {
      setManualFormState(initialManualFormState);
      setBaseMacros(null);
      setOriginalData(null);
    }
    setIsPer100g(false);
  };

  const handleAddManualItem = (item) => handleAddItem(item, 'manual');
  const handleAddFavoriteItem = (item) => handleAddItem(item, 'favorite');
  const handleAddRecentItem = (item) => handleAddItem(item, 'recent');
  const handleRemoveItem = (tempId) => {
    if (editingListItemId === tempId) {
      setEditingListItemId(null);
      setManualFormState(initialManualFormState);
      setBaseMacros(null);
      setOriginalData(null);
    }
    setItemsToAdd((prev) => prev.filter((item) => item.tempId !== tempId));
  };
  const handleToggleFavorite = (tempId) => {
    setItemsToAdd((prevItems) =>
      prevItems.map((item) =>
        item.tempId === tempId ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const handleEditListItem = (tempId) => {
    setEditingFavorite(null);
    setEditingListItemId(tempId);
    setIsPer100g(false);
  };

  const handleEditFavorite = (favoriteMeal) => {
    setEditingListItemId(null);
    setEditingFavorite(favoriteMeal);
    setIsPer100g(false);
  };

  const handleSaveListItem = (updatedItem) => {
    const description = updatedItem.description || updatedItem.name;
    setItemsToAdd((prev) =>
      prev.map((item) => (item.tempId === updatedItem.tempId ? updatedItem : item))
    );
    setEditingListItemId(null);
    addToast(`${description} actualizado.`, 'success');
    setManualFormState(initialManualFormState);
    setBaseMacros(null);
    setOriginalData(null);
    setActiveTab('favorites');
  };

  const handleSaveList = async () => {
    if (itemsToAdd.length === 0)
      return addToast('No has añadido ninguna comida.', 'info');
    const newFavorites = itemsToAdd.filter((item) => item.isFavorite);
    if (newFavorites.length > 0) {
      try {
        await Promise.all(
          newFavorites.map((fav) =>
            addFavoriteMeal({ //
              name: fav.description,
              calories: fav.calories,
              protein_g: fav.protein_g,
              carbs_g: fav.carbs_g,
              fats_g: fav.fats_g,
              weight_g: fav.weight_g,
              image_url: fav.image_url || null,
            })
          )
        );
        addToast(
          `${newFavorites.length} comida(s) guardada(s) en favoritos.`,
          'success'
        );
      } catch (error) {
        addToast(error.message || 'Error al guardar en favoritos.', 'error');
      }
    }
    onSave(itemsToAdd);
  };

  const handleSaveSingle = async (itemData) => {
    const item = itemData[0];
    if (item.saveAsFavorite) {
      try {
        await addFavoriteMeal({ //
          name: item.description,
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fats_g: item.fats_g,
          weight_g: item.weight_g,
          image_url: item.image_url || null,
        });
        addToast(`'${item.description}' guardado en favoritos.`, 'success');
      } catch (error) {
        addToast(error.message || 'Error al guardar en favoritos.', 'error');
      }
    }
    setManualFormState(initialManualFormState);
    setBaseMacros(null);
    setOriginalData(null);
    setAddModeType(null);
    onSave(itemData);
  };

  const handleSaveEdit = async (formData) => {
    if (originalData && (isEditingLog || editingFavorite)) {
      const hasChanged =
        originalData.description !== formData.description ||
        (parseFloat(originalData.calories) || 0) !== formData.calories ||
        (parseFloat(originalData.protein_g) || 0) !== formData.protein_g ||
        (parseFloat(originalData.carbs_g) || 0) !== formData.carbs_g ||
        (parseFloat(originalData.fats_g) || 0) !== formData.fats_g ||
        (parseFloat(originalData.weight_g) || null) !== formData.weight_g ||
        originalData.image_url !== formData.image_url;

      if (!hasChanged && !manualFormState.isFavorite) {
        addToast('No se detectaron cambios.', 'info');
        if (editingFavorite) {
          setEditingFavorite(null);
          setActiveTab('favorites');
        }
        if (isEditingLog) {
          onClose();
        }
        setManualFormState(initialManualFormState);
        setBaseMacros(null);
        setOriginalData(null);
        return;
      }
    }

    if (editingFavorite) {
      const dataToUpdate = {
        ...editingFavorite,
        ...formData,
        name: formData.description,
        image_url: formData.image_url,
      };
      const result = await updateFavoriteMeal(editingFavorite.id, dataToUpdate);
      if (result.success) {
        addToast(result.message, 'success');
        setEditingFavorite(null);
        setManualFormState(initialManualFormState);
        setBaseMacros(null);
        setOriginalData(null);
        setActiveTab('favorites');
      } else {
        addToast(result.message, 'error');
      }
    } else if (isEditingLog) {
      if (manualFormState.isFavorite) {
        const favData = {
          name: formData.description,
          calories: formData.calories,
          protein_g: formData.protein_g,
          carbs_g: formData.carbs_g,
          fats_g: formData.fats_g,
          weight_g: formData.weight_g,
          image_url: formData.image_url || null,
        };
        const existingFavorite = favoriteMeals.find(
          (fav) => fav.name.toLowerCase() === formData.description.toLowerCase()
        );
        try {
          if (existingFavorite) {
            await updateFavoriteMeal(existingFavorite.id, favData);
            addToast(
              `'${formData.description}' (favorito) actualizado.`,
              'success'
            );
          } else {
            await addFavoriteMeal(favData);
            addToast(`'${formData.description}' guardado en favoritos.`, 'success');
          }
        } catch (error) {
          addToast(error.message || 'Error al guardar en favoritos.', 'error');
        }
      }
      onSave([{ ...logToEdit, ...formData }], true);
      setBaseMacros(null);
      setOriginalData(null);
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

  const mealTitles = {
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    dinner: 'Cena',
    snack: 'Snacks',
  };
  const title = isEditingLog
    ? `Editar ${logToEdit.description}`
    : editingFavorite
      ? `Editar Favorito: ${editingFavorite.name}`
      : `Añadir a ${mealTitles[mealType]}`;

  return {
    isEditingLog,
    editingFavorite,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    itemsToAdd,
    favoritesPage,
    setFavoritesPage,
    mealToDelete,
    setMealToDelete,
    editingListItemId,
    manualFormState,
    setManualFormState,
    showScanner,
    setShowScanner,
    paginatedFavorites,
    filteredRecents,
    isLoadingRecents,
    totalPages,
    isDarkTheme,
    handleAddItem,
    handleAddManualItem,
    handleAddFavoriteItem,
    handleAddRecentItem,
    handleRemoveItem,
    handleToggleFavorite,
    handleEditListItem,
    handleEditFavorite,
    handleSaveListItem,
    handleSaveList,
    handleSaveSingle,
    handleSaveEdit,
    handleScanSuccess,
    handleDeleteFavorite,
    confirmDeleteFavorite,
    title,
    addModeType,
    isUploading,
    handleImageUpload,
    isPer100g,
    setIsPer100g,
  };
};