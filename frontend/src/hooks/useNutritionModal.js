import { useState, useEffect, useMemo, useCallback } from 'react';
import useAppStore from '../store/useAppStore';
import { useToast } from './useToast';
import * as nutritionService from '../services/nutritionService';

const initialManualFormState = {
    formData: { description: '', calories: '', protein_g: '', carbs_g: '', fats_g: '', weight_g: '' },
    per100Data: { calories: '', protein_g: '', carbs_g: '', fats_g: '' },
    per100Mode: false, isFavorite: false,
};

export const useNutritionModal = ({ mealType, onSave, onClose, logToEdit }) => {
    const isEditingLog = Boolean(logToEdit);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(isEditingLog ? 'manual' : 'favorites');
    const [itemsToAdd, setItemsToAdd] = useState([]);
    const [favoritesPage, setFavoritesPage] = useState(1);
    const [mealToDelete, setMealToDelete] = useState(null);
    const [editingListItemId, setEditingListItemId] = useState(null);
    const [editingFavorite, setEditingFavorite] = useState(null);
    const [manualFormState, setManualFormState] = useState(initialManualFormState);
    const [baseMacros, setBaseMacros] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [addModeType, setAddModeType] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const ITEMS_PER_PAGE = 5;

    const { addToast } = useToast();
    const { favoriteMeals, addFavoriteMeal, deleteFavoriteMeal, updateFavoriteMeal } = useAppStore(state => ({
        favoriteMeals: state.favoriteMeals,
        addFavoriteMeal: state.addFavoriteMeal,
        deleteFavoriteMeal: state.deleteFavoriteMeal,
        updateFavoriteMeal: state.updateFavoriteMeal,
    }));

    const [isDarkTheme] = useState(() => typeof document !== 'undefined' && !document.body.classList.contains('light-theme'));

    const recentMeals = useMemo(() => {
        const sorted = [...favoriteMeals].sort((a, b) => {
            const dateA = new Date(a.updated_at || a.created_at || 0);
            const dateB = new Date(b.updated_at || b.created_at || 0);
            return dateB - dateA;
        });
        return sorted.slice(0, 10);
    }, [favoriteMeals]);

    const filteredFavorites = useMemo(() =>
        [...favoriteMeals]
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(meal => meal.name && meal.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [favoriteMeals, searchTerm]
    );

    const filteredRecents = useMemo(() =>
        recentMeals.filter(meal => meal.name && meal.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [recentMeals, searchTerm]
    );

    const paginatedFavorites = useMemo(() => {
        const startIndex = (favoritesPage - 1) * ITEMS_PER_PAGE;
        return filteredFavorites.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredFavorites, favoritesPage, ITEMS_PER_PAGE]);

    const totalPages = Math.ceil(filteredFavorites.length / ITEMS_PER_PAGE) || 1;
    const round = (val, d = 1) => { const n = parseFloat(val); return isNaN(n) ? '' : (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); };

    useEffect(() => {
        const itemToEdit = isEditingLog ? logToEdit : editingFavorite || itemsToAdd.find(item => item.tempId === editingListItemId);
        if (itemToEdit) {
            const initialWeight = parseFloat(itemToEdit.weight_g);
            if (initialWeight > 0) {
                setBaseMacros({
                    calories: (parseFloat(itemToEdit.calories) || 0) / initialWeight,
                    protein_g: (parseFloat(itemToEdit.protein_g) || 0) / initialWeight,
                    carbs_g: (parseFloat(itemToEdit.carbs_g) || 0) / initialWeight,
                    fats_g: (parseFloat(itemToEdit.fats_g) || 0) / initialWeight,
                });
            } else { setBaseMacros(null); }
            const currentFormData = {
                description: itemToEdit.description || itemToEdit.name || '', calories: String(itemToEdit.calories || ''), protein_g: String(itemToEdit.protein_g || ''),
                carbs_g: String(itemToEdit.carbs_g || ''), fats_g: String(itemToEdit.fats_g || ''), weight_g: String(itemToEdit.weight_g || '')
            };
            setManualFormState({
                formData: currentFormData,
                per100Data: { calories: '', protein_g: '', carbs_g: '', fats_g: '' },
                per100Mode: false, isFavorite: itemToEdit.isFavorite || false
            });
            setOriginalData(currentFormData);
        }
    }, [editingListItemId, isEditingLog, logToEdit, itemsToAdd, editingFavorite]);

    useEffect(() => {
        if (baseMacros && (isEditingLog || editingListItemId || editingFavorite)) {
            const newWeight = parseFloat(manualFormState.formData.weight_g) || 0;
            if (String(newWeight) !== String(originalData?.weight_g || '')) {
                setManualFormState(prev => ({
                    ...prev,
                    formData: {
                        ...prev.formData,
                        calories: Math.round(baseMacros.calories * newWeight),
                        protein_g: round(baseMacros.protein_g * newWeight),
                        carbs_g: round(baseMacros.carbs_g * newWeight),
                        fats_g: round(baseMacros.fats_g * newWeight),
                    }
                }));
            }
        }
    }, [manualFormState.formData.weight_g, baseMacros, isEditingLog, editingListItemId, editingFavorite, originalData, round]);

    const computeFromPer100 = useCallback((cal, p, c, f, g) => {
        const factor = (parseFloat(g) || 0) / 100;
        return {
            calories: Math.round((parseFloat(cal) || 0) * factor),
            protein_g: round((parseFloat(p) || 0) * factor),
            carbs_g: round((parseFloat(c) || 0) * factor),
            fats_g: round((parseFloat(f) || 0) * factor),
        };
    }, [round]);

    useEffect(() => {
        if (manualFormState.per100Mode && !isEditingLog && !editingListItemId && !editingFavorite) {
            const computed = computeFromPer100(
                manualFormState.per100Data.calories, manualFormState.per100Data.protein_g,
                manualFormState.per100Data.carbs_g, manualFormState.per100Data.fats_g,
                manualFormState.formData.weight_g
            );
            setManualFormState(prev => ({ ...prev, formData: { ...prev.formData, ...computed } }));
        }
    }, [manualFormState.formData.weight_g, manualFormState.per100Data, manualFormState.per100Mode, isEditingLog, editingListItemId, editingFavorite, computeFromPer100]);

    useEffect(() => {
        if (itemsToAdd.length === 0) setAddModeType(null);
    }, [itemsToAdd]);

    useEffect(() => { setFavoritesPage(1); }, [searchTerm, activeTab]);
    useEffect(() => { if (editingListItemId || isEditingLog || editingFavorite) setActiveTab('manual'); }, [editingListItemId, isEditingLog, editingFavorite]);

    const handleScanSuccess = async (barcode) => {
        setShowScanner(false);
        const tempLoadingToastId = addToast('Buscando producto...', 'info', null);
        try {
            const product = await nutritionService.searchByBarcode(barcode);
            addToast('Producto encontrado.', 'success', 3000, tempLoadingToastId);
            const weightG = product.weight_g || 100;
            setBaseMacros({
                calories: (parseFloat(product.calories) || 0) / weightG,
                protein_g: (parseFloat(product.protein_g) || 0) / weightG,
                carbs_g: (parseFloat(product.carbs_g) || 0) / weightG,
                fats_g: (parseFloat(product.fats_g) || 0) / weightG,
            });
            const initialFormData = {
                description: product.name, calories: String(Math.round(product.calories)), protein_g: round(product.protein_g),
                carbs_g: round(product.carbs_g), fats_g: round(product.fats_g), weight_g: String(weightG)
            };
            setManualFormState({
                formData: initialFormData, per100Data: {
                    calories: String(product.calories), protein_g: String(product.protein_g),
                    carbs_g: String(product.carbs_g), fats_g: String(product.fats_g)
                }, per100Mode: false, isFavorite: false
            });
            setOriginalData(initialFormData);
            setActiveTab('manual');
            setAddModeType('manual');
        } catch (error) {
            addToast(error.message || 'No se pudo encontrar el producto.', 'error', 5000, tempLoadingToastId);
        }
    };

    const handleDeleteFavorite = (meal) => setMealToDelete(meal);
    const confirmDeleteFavorite = async () => { if (!mealToDelete) return; const result = await deleteFavoriteMeal(mealToDelete.id); addToast(result.message, result.success ? 'success' : 'error'); setMealToDelete(null); };

    const handleAddItem = (item, origin = 'manual') => {
        if (origin === 'manual' || origin === 'scan') setAddModeType('manual');
        else setAddModeType('list');
        const baseWeight = parseFloat(item.weight_g) || (origin === 'manual' ? 0 : (item.name ? 100 : 0));
        const newItem = {
            ...item, tempId: `item-${Date.now()}-${Math.random()}`, description: item.name, isFavorite: item.isFavorite || false,
            calories: parseFloat(item.calories) || 0, protein_g: parseFloat(item.protein_g) || 0, carbs_g: parseFloat(item.carbs_g) || 0,
            fats_g: parseFloat(item.fats_g) || 0, weight_g: parseFloat(item.weight_g) || null,
            base: baseWeight > 0 ? {
                calories: (parseFloat(item.calories) || 0) / baseWeight, protein_g: (parseFloat(item.protein_g) || 0) / baseWeight,
                carbs_g: (parseFloat(item.carbs_g) || 0) / baseWeight, fats_g: (parseFloat(item.fats_g) || 0) / baseWeight
            } : null, origin
        };
        setItemsToAdd(prev => [...prev, newItem]);
        addToast(`${item.name} añadido a la lista.`, 'success');
        if (origin === 'manual') { setManualFormState(initialManualFormState); setBaseMacros(null); setOriginalData(null); }
    };

    const handleAddManualItem = (item) => handleAddItem(item, 'manual');
    const handleAddFavoriteItem = (item) => handleAddItem(item, 'favorite');
    const handleAddRecentItem = (item) => handleAddItem(item, 'recent');
    const handleRemoveItem = (tempId) => { if (editingListItemId === tempId) { setEditingListItemId(null); setManualFormState(initialManualFormState); setBaseMacros(null); setOriginalData(null); } setItemsToAdd(prev => prev.filter(item => item.tempId !== tempId)); };
    const handleToggleFavorite = (tempId) => { setItemsToAdd(prevItems => prevItems.map(item => item.tempId === tempId ? { ...item, isFavorite: !item.isFavorite } : item)); };

    // --- CORRECCIÓN ---
    // Se elimina `setActiveTab('manual')` de estas dos funciones.
    // El useEffect ya se encarga de cambiar la pestaña cuando comienza una edición.
    const handleEditListItem = (tempId) => {
        setEditingFavorite(null);
        setEditingListItemId(tempId);
    };

    const handleEditFavorite = (favoriteMeal) => {
        setEditingListItemId(null);
        setEditingFavorite(favoriteMeal);
    };
    
    const handleSaveListItem = (updatedItem) => { setItemsToAdd(prev => prev.map(item => item.tempId === updatedItem.tempId ? updatedItem : item)); setEditingListItemId(null); addToast(`${updatedItem.name} actualizado.`, 'success'); setManualFormState(initialManualFormState); setBaseMacros(null); setOriginalData(null); setActiveTab('favorites'); };

    const handleSaveList = async () => {
        if (itemsToAdd.length === 0) return addToast('No has añadido ninguna comida.', 'info');
        const newFavorites = itemsToAdd.filter(item => item.isFavorite);
        if (newFavorites.length > 0) {
            try {
                await Promise.all(newFavorites.map(fav => addFavoriteMeal({ name: fav.description, calories: fav.calories, protein_g: fav.protein_g, carbs_g: fav.carbs_g, fats_g: fav.fats_g, weight_g: fav.weight_g })));
                addToast(`${newFavorites.length} comida(s) guardada(s) en favoritos.`, 'success');
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
                await addFavoriteMeal({ name: item.description, calories: item.calories, protein_g: item.protein_g, carbs_g: item.carbs_g, fats_g: item.fats_g, weight_g: item.weight_g });
                addToast(`'${item.description}' guardado en favoritos.`, 'success');
            } catch (error) {
                addToast(error.message || 'Error al guardar en favoritos.', 'error');
            }
        }
        setManualFormState(initialManualFormState); setBaseMacros(null); setOriginalData(null); setAddModeType(null);
        onSave(itemData);
    };

    const handleSaveEdit = async (formData) => {
        if (editingFavorite) {
            const result = await updateFavoriteMeal(editingFavorite.id, { ...editingFavorite, ...formData });
            if (result.success) {
                addToast(result.message, 'success');
                setEditingFavorite(null); setManualFormState(initialManualFormState);
                setBaseMacros(null); setOriginalData(null); setActiveTab('favorites');
            } else { addToast(result.message, 'error'); }
        } else if (isEditingLog) {
            onSave([{ ...logToEdit, ...formData }], true);
            setBaseMacros(null); setOriginalData(null);
        }
    };

    const mealTitles = { breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Snacks' };
    const title = isEditingLog ? `Editar ${logToEdit.description}` : editingFavorite ? `Editar Favorito: ${editingFavorite.name}` : `Añadir a ${mealTitles[mealType]}`;

    return {
        isEditingLog, editingFavorite, searchTerm, setSearchTerm, activeTab, setActiveTab, itemsToAdd,
        favoritesPage, setFavoritesPage, mealToDelete, setMealToDelete, editingListItemId,
        manualFormState, setManualFormState, showScanner, setShowScanner, paginatedFavorites,
        filteredRecents, totalPages, isDarkTheme, handleAddItem, handleAddManualItem, handleAddFavoriteItem,
        handleAddRecentItem, handleRemoveItem, handleToggleFavorite, handleEditListItem, handleEditFavorite,
        handleSaveListItem, handleSaveList, handleSaveSingle, handleSaveEdit, handleScanSuccess,
        handleDeleteFavorite, confirmDeleteFavorite, title, addModeType,
    };
};