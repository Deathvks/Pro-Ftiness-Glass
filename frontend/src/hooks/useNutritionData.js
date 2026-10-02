/* frontend/src/hooks/useNutritionData.js */
import { useState, useEffect, useMemo } from 'react';
import * as nutritionService from '../services/nutritionService';
import { useToast } from './useToast';
import { ITEMS_PER_PAGE } from './useNutritionConstants';

export const useNutritionData = (
  activeTab,
  favoriteMeals,
  searchTerm,
  favoritesPage
) => {
  const [recentMeals, setRecentMeals] = useState([]);
  const [isLoadingRecents, setIsLoadingRecents] = useState(false);
  const { addToast } = useToast();

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
  }, [filteredFavorites, favoritesPage]);

  const totalPages = Math.ceil(filteredFavorites.length / ITEMS_PER_PAGE) || 1;

  return {
    recentMeals,
    isLoadingRecents,
    filteredFavorites,
    filteredRecents,
    paginatedFavorites,
    totalPages,
  };
};