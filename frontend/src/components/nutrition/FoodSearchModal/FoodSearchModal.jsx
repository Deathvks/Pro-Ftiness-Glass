import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { getRecentFoods, searchFood } from '../../../services/nutritionService';
import { getFavoriteMeals } from '../../../services/favoriteMealService';
import { useToast } from '../../../hooks/useToast';

import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import Favorites from './Favorites';
import Recent from './Recent';
import FoodEntryForm from './FoodEntryForm';

const FoodSearchModal = ({ isOpen, onClose, onSave, mealType, date, logToEdit, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentFoods, setRecentFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('search');
  const [selectedFood, setSelectedFood] = useState(null);
  const { addToast } = useToast();

  const fetchFavorites = useCallback(async () => {
    try {
      const favs = await getFavoriteMeals();
      setFavorites(favs);
    } catch (error) {
      addToast('Error fetching favorite foods', 'error');
    }
  }, [addToast]);

  const fetchRecentFoods = useCallback(async () => {
    try {
      const recent = await getRecentFoods();
      setRecentFoods(recent);
    } catch (error) {
      addToast('Error fetching recent foods', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    if (isOpen) {
      if (logToEdit) {
        setSelectedFood(logToEdit);
      } else {
        setSelectedFood(null);
        setSearchTerm('');
        setSearchResults([]);
        setView('search');
        fetchFavorites();
        fetchRecentFoods();
      }
    }
  }, [isOpen, logToEdit, fetchFavorites, fetchRecentFoods]);

  const performSearch = async (term) => {
    if (term.length > 2) {
      setLoading(true);
      try {
        const results = await searchFood(term);
        setSearchResults(results);
      } catch (error) {
        addToast('Error searching for food', 'error');
      } finally {
        setLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const debouncedSearch = useCallback(debounce(performSearch, 500), [addToast]);

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  const handleSelectFood = (food) => {
    setSelectedFood(food);
  };

  const handleBackToSearch = () => {
    setSelectedFood(null);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-white">
            {logToEdit ? 'Edit Food' : `Add Food to ${mealType}`}
          </h2>
          <button onClick={onClose} className="text-white">&times;</button>
        </div>

        {selectedFood ? (
          <FoodEntryForm
            food={selectedFood}
            onSave={onSave}
            onClose={onClose}
            onBack={logToEdit ? null : handleBackToSearch}
            mealType={mealType}
            date={date}
            isEditing={!!logToEdit}
            isLoading={isLoading}
          />
        ) : (
          <>
            <div className="mb-4">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
              <div className="flex justify-around mt-2">
                <button onClick={() => setView('search')} className={`px-4 py-2 ${view === 'search' ? 'border-b-2 border-blue-500' : ''}`}>Search</button>
                <button onClick={() => setView('favorites')} className={`px-4 py-2 ${view === 'favorites' ? 'border-b-2 border-blue-500' : ''}`}>Favorites</button>
                <button onClick={() => setView('recent')} className={`px-4 py-2 ${view === 'recent' ? 'border-b-2 border-blue-500' : ''}`}>Recent</button>
              </div>
            </div>
            <div className="overflow-y-auto">
              {view === 'search' && <SearchResults results={searchResults} onSelect={handleSelectFood} loading={loading} />}
              {view === 'favorites' && <Favorites favorites={favorites} onSelect={handleSelectFood} />}
              {view === 'recent' && <Recent recentFoods={recentFoods} onSelect={handleSelectFood} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FoodSearchModal;