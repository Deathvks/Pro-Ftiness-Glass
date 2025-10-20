/* frontend/src/components/NutritionLogModal.jsx */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, BookMarked, Plus, Trash2, ChevronLeft, ChevronRight, CheckCircle, Search, PlusCircle, QrCode, Clock, Edit } from 'lucide-react'; // Añadidos Clock y Edit
import * as nutritionService from '../services/nutritionService';
import BarcodeScanner from './BarcodeScanner';
import Spinner from './Spinner';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from './ConfirmationModal';
import GlassCard from './GlassCard';

// Importar los nuevos componentes
import TabButton from './nutrition/logModal/TabButton';
import FavoritesList from './nutrition/logModal/FavoritesList';
import RecentList from './nutrition/logModal/RecentList';
import ManualEntryForm from './nutrition/logModal/ManualEntryForm';
import SelectedItem from './nutrition/logModal/SelectedItem';

const initialManualFormState = {
    formData: { description: '', calories: '', protein_g: '', carbs_g: '', fats_g: '', weight_g: '' },
    per100Data: { calories: '', protein_g: '', carbs_g: '', fats_g: '' },
    per100Mode: false, isFavorite: false,
};

const NutritionLogModal = ({ mealType, onSave, onClose, isLoading, logToEdit }) => {
    // --- ESTADOS ---
    const isEditing = Boolean(logToEdit);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(isEditing ? 'manual' : 'favorites');
    const [itemsToAdd, setItemsToAdd] = useState([]);
    const [favoritesPage, setFavoritesPage] = useState(1); // Renombrado a favoritesPage para claridad
    const [mealToDelete, setMealToDelete] = useState(null);
    const [editingListItemId, setEditingListItemId] = useState(null);
    const [manualFormState, setManualFormState] = useState(initialManualFormState);
    const [baseMacros, setBaseMacros] = useState(null);
    const [originalData, setOriginalData] = useState(null);

    const [showScanner, setShowScanner] = useState(false);
    const ITEMS_PER_PAGE = 5;

    const { addToast } = useToast();
    const { favoriteMeals, addFavoriteMeal, deleteFavoriteMeal } = useAppStore(state => ({
        favoriteMeals: state.favoriteMeals, addFavoriteMeal: state.addFavoriteMeal, deleteFavoriteMeal: state.deleteFavoriteMeal,
    }));

    const [isDarkTheme, setIsDarkTheme] = useState(() => typeof document !== 'undefined' && !document.body.classList.contains('light-theme'));
    useEffect(() => { const observer = new MutationObserver(() => { setIsDarkTheme(!document.body.classList.contains('light-theme')); }); observer.observe(document.body, { attributes: true, attributeFilter: ['class'] }); return () => observer.disconnect(); }, []);

    // --- LÓGICA Y EFECTOS ---
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
        const itemToEdit = isEditing ? logToEdit : itemsToAdd.find(item => item.tempId === editingListItemId);
        if (itemToEdit) {
            const initialWeight = parseFloat(itemToEdit.weight_g);
            const initialCalories = parseFloat(itemToEdit.calories);
            const initialProtein = parseFloat(itemToEdit.protein_g);
            const initialCarbs = parseFloat(itemToEdit.carbs_g);
            const initialFats = parseFloat(itemToEdit.fats_g);

            if (!isNaN(initialWeight) && initialWeight > 0) {
                setBaseMacros({
                    calories: (initialCalories || 0) / initialWeight,
                    protein_g: (initialProtein || 0) / initialWeight,
                    carbs_g: (initialCarbs || 0) / initialWeight,
                    fats_g: (initialFats || 0) / initialWeight,
                });
            } else { setBaseMacros(null); }

            const currentFormData = {
                description: itemToEdit.description || itemToEdit.name || '',
                calories: String(itemToEdit.calories || ''),
                protein_g: String(itemToEdit.protein_g || ''),
                carbs_g: String(itemToEdit.carbs_g || ''),
                fats_g: String(itemToEdit.fats_g || ''),
                weight_g: String(itemToEdit.weight_g || '')
            };
            setManualFormState({
                formData: currentFormData,
                per100Data: { calories: '', protein_g: '', carbs_g: '', fats_g: '' },
                per100Mode: false,
                isFavorite: itemToEdit.isFavorite || false
            });
            setOriginalData(currentFormData);
        }
    }, [editingListItemId, isEditing, logToEdit, itemsToAdd]);

    useEffect(() => {
        if (baseMacros && (isEditing || editingListItemId)) {
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
    }, [manualFormState.formData.weight_g, baseMacros, isEditing, editingListItemId, originalData, round]); // Añadido round a las dependencias

    const computeFromPer100 = useCallback((cal, p, c, f, g) => {
        const factor = (parseFloat(g) || 0) / 100;
        return {
            calories: Math.round((parseFloat(cal) || 0) * factor),
            protein_g: round((parseFloat(p) || 0) * factor),
            carbs_g: round((parseFloat(c) || 0) * factor),
            fats_g: round((parseFloat(f) || 0) * factor),
        };
    }, [round]); // Añadido round a las dependencias

    useEffect(() => {
        if (manualFormState.per100Mode && !isEditing && !editingListItemId) {
            const computed = computeFromPer100(
                manualFormState.per100Data.calories,
                manualFormState.per100Data.protein_g,
                manualFormState.per100Data.carbs_g,
                manualFormState.per100Data.fats_g,
                manualFormState.formData.weight_g
            );
            setManualFormState(prev => ({ ...prev, formData: { ...prev.formData, ...computed } }));
        }
    }, [manualFormState.formData.weight_g, manualFormState.per100Data, manualFormState.per100Mode, isEditing, editingListItemId, computeFromPer100]);


    useEffect(() => { setFavoritesPage(1); }, [searchTerm, activeTab]);
    useEffect(() => { if (editingListItemId || isEditing) setActiveTab('manual'); }, [editingListItemId, isEditing]);

    const handleScanSuccess = async (barcode) => {
        setShowScanner(false);
        const tempLoadingToastId = addToast('Buscando producto...', 'info');
        try {
            const product = await nutritionService.searchByBarcode(barcode);
            const weightG = product.weight_g || 100;

             const perGramMacros = {
                calories: (parseFloat(product.calories) || 0) / weightG,
                protein_g: (parseFloat(product.protein_g) || 0) / weightG,
                carbs_g: (parseFloat(product.carbs_g) || 0) / weightG,
                fats_g: (parseFloat(product.fats_g) || 0) / weightG,
            };
            setBaseMacros(perGramMacros);

            setManualFormState({
                formData: {
                    description: product.name,
                    calories: String(Math.round(product.calories)),
                    protein_g: round(product.protein_g),
                    carbs_g: round(product.carbs_g),
                    fats_g: round(product.fats_g),
                    weight_g: String(weightG),
                },
                per100Data: {
                    calories: String(product.calories),
                    protein_g: String(product.protein_g),
                    carbs_g: String(product.carbs_g),
                    fats_g: String(product.fats_g),
                },
                per100Mode: false,
                isFavorite: false,
            });

            setOriginalData({
                 description: product.name,
                 calories: String(Math.round(product.calories)),
                 protein_g: round(product.protein_g),
                 carbs_g: round(product.carbs_g),
                 fats_g: round(product.fats_g),
                 weight_g: String(weightG),
            });

            setActiveTab('manual'); // Cambiado de setView a setActiveTab
            addToast('Producto encontrado. Ajusta los gramos si es necesario.', 'success');
        } catch (error) {
            addToast(error.message || 'No se pudo encontrar el producto.', 'error');
        }
    };

    const handleDeleteFavorite = (meal) => { setMealToDelete(meal); };
    const confirmDeleteFavorite = async () => { if (!mealToDelete) return; const result = await deleteFavoriteMeal(mealToDelete.id); addToast(result.message, result.success ? 'success' : 'error'); setMealToDelete(null); };

    const handleAddItem = (item, isManual = false) => {
        const newItem = {
            ...item, tempId: `item-${Date.now()}-${Math.random()}`,
            description: item.name,
            isFavorite: item.isFavorite || false,
            calories: parseFloat(item.calories) || 0,
            protein_g: parseFloat(item.protein_g) || 0,
            carbs_g: parseFloat(item.carbs_g) || 0,
            fats_g: parseFloat(item.fats_g) || 0,
            weight_g: parseFloat(item.weight_g) || null,
        };
        setItemsToAdd(prev => [...prev, newItem]);
        addToast(`${item.name} añadido a la lista.`, 'success');
        if (isManual) {
            setManualFormState(initialManualFormState);
            setBaseMacros(null);
            setOriginalData(null);
        }
    };
    const handleAddManualItem = (item) => handleAddItem(item, true);
    const handleRemoveItem = (tempId) => { if (editingListItemId === tempId) { setEditingListItemId(null); setManualFormState(initialManualFormState); setBaseMacros(null); setOriginalData(null); } setItemsToAdd(prev => prev.filter(item => item.tempId !== tempId)); };
    const handleToggleFavorite = (tempId) => { setItemsToAdd(prevItems => prevItems.map(item => item.tempId === tempId ? { ...item, isFavorite: !item.isFavorite } : item)); };
    const handleEditListItem = (tempId) => { setEditingListItemId(tempId); };

    const handleSaveListItem = (updatedItem) => {
        setItemsToAdd(prev => prev.map(item => item.tempId === updatedItem.tempId ? updatedItem : item));
        setEditingListItemId(null);
        addToast(`${updatedItem.name} actualizado.`, 'success');
        setManualFormState(initialManualFormState);
        setBaseMacros(null);
        setOriginalData(null);
    };

    const handleSaveList = async () => { if (itemsToAdd.length === 0) return addToast('No has añadido ninguna comida.', 'info'); const newFavorites = itemsToAdd.filter(item => item.isFavorite); if (newFavorites.length > 0) { try { await Promise.all(newFavorites.map(fav => addFavoriteMeal({ name: fav.description, calories: fav.calories, protein_g: fav.protein_g, carbs_g: fav.carbs_g, fats_g: fav.fats_g, weight_g: fav.weight_g }))); addToast(`${newFavorites.length} comida(s) guardada(s) en favoritos.`, 'success'); } catch (error) { addToast('Error al guardar en favoritos.', 'error'); } } onSave(itemsToAdd); };

    const handleSaveSingle = async (itemData) => {
        const item = itemData[0];
        if (item.saveAsFavorite) {
            try { await addFavoriteMeal({ name: item.description, calories: item.calories, protein_g: item.protein_g, carbs_g: item.carbs_g, fats_g: item.fats_g, weight_g: item.weight_g }); addToast(`'${item.description}' guardado en favoritos.`, 'success'); } catch (error) { addToast(error.message || 'Error al guardar en favoritos.', 'error'); }
        }
        setManualFormState(initialManualFormState);
        setBaseMacros(null);
        setOriginalData(null);
        onSave(itemData);
    };

    const handleSaveEdit = (formData) => {
        onSave([{ ...logToEdit, ...formData }], true);
        setBaseMacros(null);
        setOriginalData(null);
    };

    const mealTitles = { breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Snacks' };
    const title = isEditing ? `Editar ${logToEdit.description}` : `Añadir a ${mealTitles[mealType]}`;

    const renderListContent = () => {
        if (activeTab === 'manual') {
            const editingItem = itemsToAdd.find(item => item.tempId === editingListItemId);
            return <ManualEntryForm
                onAddManual={handleAddManualItem}
                isLoading={isLoading}
                onSaveSingle={handleSaveSingle}
                showFavoriteToggle={itemsToAdd.length === 0 && !editingListItemId && !isEditing}
                isEditing={isEditing}
                editingListItem={editingItem}
                onSaveEdit={handleSaveEdit}
                onSaveListItem={handleSaveListItem}
                formState={manualFormState}
                onFormStateChange={setManualFormState}
            />;
        }
        if (activeTab === 'favorites') {
             return <FavoritesList
                items={paginatedFavorites}
                onAdd={handleAddItem}
                onDelete={handleDeleteFavorite}
                // --- INICIO DE LA CORRECCIÓN ---
                currentPage={favoritesPage} // Pasar el estado correcto
                // --- FIN DE LA CORRECCIÓN ---
                totalPages={totalPages}
                onPageChange={setFavoritesPage} // Pasar el setter correcto
             />;
        }
        if (activeTab === 'recent') {
            return <RecentList items={filteredRecents} onAdd={handleAddItem} />;
        }
        return null;
    };

    return (
        <>
            {showScanner && <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
                <GlassCard className={`relative w-11/12 max-w-lg p-0 m-4 flex flex-col max-h-[90vh] ${!isDarkTheme ? '!bg-bg-secondary' : ''}`} onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="p-5 flex items-center justify-between border-b border-glass-border flex-shrink-0">
                        <h3 className="text-xl font-bold truncate pr-4 text-text-primary">{title}</h3>
                        <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-bg-primary transition flex-shrink-0"><X size={20} className="text-text-secondary" /></button>
                    </div>

                    {/* Contenido Principal (Tabs + Lista/Form) */}
                    <div className="flex-grow overflow-hidden flex flex-col">
                        {!isEditing && (
                            <div className="p-5 flex-shrink-0">
                                {activeTab !== 'manual' && (
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                                        <input type="text" placeholder="Buscar comida..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-bg-primary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:border-accent" />
                                    </div>
                                )}
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    <TabButton active={activeTab === 'favorites'} onClick={() => { setActiveTab('favorites'); setEditingListItemId(null); }}><BookMarked size={16} /> Favoritas</TabButton>
                                    <TabButton active={activeTab === 'recent'} onClick={() => { setActiveTab('recent'); setEditingListItemId(null); }}><Clock size={16} /> Recientes</TabButton>
                                    <TabButton active={activeTab === 'manual'} onClick={() => { setActiveTab('manual'); setEditingListItemId(null); }}><Edit size={16} /> Manual</TabButton>
                                    <TabButton active={false} onClick={() => setShowScanner(true)}><QrCode size={16} /> Escanear</TabButton>
                                </div>
                            </div>
                        )}
                        <div className="overflow-y-auto px-5 pb-3 flex-grow min-h-[200px]">
                            {renderListContent()}
                        </div>
                    </div>

                    {/* Footer con lista seleccionada y botón de guardar */}
                    {!isEditing && !editingListItemId && itemsToAdd.length > 0 && (
                        <div className="p-5 border-t border-glass-border flex-shrink-0 animate-[fade-in-up_0.3s_ease-out]">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-text-primary">Añadir ({itemsToAdd.length})</h4>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto mb-4 pr-1">
                                {itemsToAdd.map(item =>
                                    <SelectedItem key={item.tempId} item={item} onRemove={handleRemoveItem} onToggleFavorite={handleToggleFavorite} onEdit={handleEditListItem} />
                                )}
                            </div>
                            <button onClick={handleSaveList} disabled={isLoading} className="w-full flex items-center justify-center py-3 rounded-xl bg-accent text-white dark:text-bg-secondary font-bold hover:scale-[1.01] transition disabled:opacity-60">{isLoading ? <Spinner /> : `Añadir ${itemsToAdd.length} Alimento${itemsToAdd.length > 1 ? 's' : ''}`}</button>
                        </div>
                    )}
                </GlassCard>
            </div>
            {mealToDelete && (<ConfirmationModal message={`¿Seguro que quieres eliminar "${mealToDelete.name}" de tus favoritos?`} onConfirm={confirmDeleteFavorite} onCancel={() => setMealToDelete(null)} isLoading={isLoading} confirmText="Eliminar" />)}
        </>
    );
};

export default NutritionLogModal;