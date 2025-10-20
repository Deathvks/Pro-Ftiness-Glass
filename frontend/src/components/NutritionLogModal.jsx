/* frontend/src/components/NutritionLogModal.jsx */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, BookMarked, Plus, Trash2, ChevronLeft, ChevronRight, CheckCircle, Search, PlusCircle, QrCode, Clock, Edit } from 'lucide-react'; // Añadidos Clock y Edit
import * as nutritionService from '../services/nutritionService';
import BarcodeScanner from './BarcodeScanner';
import Spinner from '../components/Spinner';
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
    const isEditingLog = Boolean(logToEdit); // Renombrado para claridad
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(isEditingLog ? 'manual' : 'favorites');
    const [itemsToAdd, setItemsToAdd] = useState([]);
    const [favoritesPage, setFavoritesPage] = useState(1);
    const [mealToDelete, setMealToDelete] = useState(null); // Para borrar favoritos
    const [editingListItemId, setEditingListItemId] = useState(null); // Para editar item de la lista temporal
    const [editingFavorite, setEditingFavorite] = useState(null); // --- NUEVO --- Para editar un favorito directamente
    const [manualFormState, setManualFormState] = useState(initialManualFormState);
    const [baseMacros, setBaseMacros] = useState(null); // Macros por gramo para recálculo
    const [originalData, setOriginalData] = useState(null); // Datos originales al empezar a editar

    // --- INICIO DE LA MODIFICACIÓN ---
    // Nuevo estado para controlar qué tipo de modo está activo (lista o manual/scan)
    const [addModeType, setAddModeType] = useState(null); // null | 'list' | 'manual'
    // --- FIN DE LA MODIFICACIÓN ---

    const [showScanner, setShowScanner] = useState(false);
    const ITEMS_PER_PAGE = 5;

    const { addToast } = useToast();
    const { favoriteMeals, addFavoriteMeal, deleteFavoriteMeal, updateFavoriteMeal } = useAppStore(state => ({ // <-- Añadido updateFavoriteMeal
        favoriteMeals: state.favoriteMeals,
        addFavoriteMeal: state.addFavoriteMeal,
        deleteFavoriteMeal: state.deleteFavoriteMeal,
        updateFavoriteMeal: state.updateFavoriteMeal, // <-- Añadido updateFavoriteMeal
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

    // Efecto para cargar datos en el formulario manual al editar (log, item de lista o favorito)
    useEffect(() => {
        // Determina qué se está editando: un log existente, un item de la lista temporal, o un favorito directamente
        const itemToEdit = isEditingLog ? logToEdit : editingFavorite || itemsToAdd.find(item => item.tempId === editingListItemId);

        if (itemToEdit) {
            const initialWeight = parseFloat(itemToEdit.weight_g);
            const initialCalories = parseFloat(itemToEdit.calories);
            const initialProtein = parseFloat(itemToEdit.protein_g);
            const initialCarbs = parseFloat(itemToEdit.carbs_g);
            const initialFats = parseFloat(itemToEdit.fats_g);

            // Calcula macros base por gramo si hay peso inicial válido
            if (!isNaN(initialWeight) && initialWeight > 0) {
                setBaseMacros({
                    calories: (initialCalories || 0) / initialWeight,
                    protein_g: (initialProtein || 0) / initialWeight,
                    carbs_g: (initialCarbs || 0) / initialWeight,
                    fats_g: (initialFats || 0) / initialWeight,
                });
            } else { setBaseMacros(null); }

            // Prepara los datos para el formulario
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
                per100Data: { calories: '', protein_g: '', carbs_g: '', fats_g: '' }, // Resetear 100g mode al editar
                per100Mode: false,
                isFavorite: itemToEdit.isFavorite || false // Hereda si es favorito (para items de lista)
            });
            setOriginalData(currentFormData); // Guarda los datos originales para comparar
        }
    }, [editingListItemId, isEditingLog, logToEdit, itemsToAdd, editingFavorite]); // <-- Añadido editingFavorite

    // Efecto para recalcular macros si cambia el peso y hay macros base
    useEffect(() => {
        // Solo recalcula si estamos editando (un log, un item de lista o un favorito) Y tenemos macros base
        if (baseMacros && (isEditingLog || editingListItemId || editingFavorite)) {
            const newWeight = parseFloat(manualFormState.formData.weight_g) || 0;
            // Solo recalcula si el peso realmente cambió respecto al original
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
    }, [manualFormState.formData.weight_g, baseMacros, isEditingLog, editingListItemId, editingFavorite, originalData, round]); // <-- Añadido editingFavorite y originalData

    // Efecto para recalcular desde el modo 100g (solo al añadir nuevo manual)
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
        // Solo recalcula si está en modo 100g Y NO estamos editando (ni log, ni item, ni favorito)
        if (manualFormState.per100Mode && !isEditingLog && !editingListItemId && !editingFavorite) {
            const computed = computeFromPer100(
                manualFormState.per100Data.calories,
                manualFormState.per100Data.protein_g,
                manualFormState.per100Data.carbs_g,
                manualFormState.per100Data.fats_g,
                manualFormState.formData.weight_g
            );
            setManualFormState(prev => ({ ...prev, formData: { ...prev.formData, ...computed } }));
        }
    }, [manualFormState.formData.weight_g, manualFormState.per100Data, manualFormState.per100Mode, isEditingLog, editingListItemId, editingFavorite, computeFromPer100]); // <-- Añadido editingFavorite

    // --- INICIO DE LA MODIFICACIÓN ---
    // Resetea el modo de adición si la lista temporal se vacía
    useEffect(() => {
        if (itemsToAdd.length === 0) {
            setAddModeType(null);
        }
    }, [itemsToAdd]);
    // --- FIN DE LA MODIFICACIÓN ---

    // Resetear página al cambiar filtros
    useEffect(() => { setFavoritesPage(1); }, [searchTerm, activeTab]);
    // Cambiar a tab manual si se empieza a editar
    useEffect(() => { if (editingListItemId || isEditingLog || editingFavorite) setActiveTab('manual'); }, [editingListItemId, isEditingLog, editingFavorite]); // <-- Añadido editingFavorite

    // Escanear código de barras
    const handleScanSuccess = async (barcode) => {
        setShowScanner(false);
        const tempLoadingToastId = addToast('Buscando producto...', 'info', null); // Sin auto-cierre
        try {
            const product = await nutritionService.searchByBarcode(barcode);
            addToast('Producto encontrado.', 'success', 3000, tempLoadingToastId); // Reemplaza el toast

            // Llenar formulario manual con datos del producto
            const weightG = product.weight_g || 100;
            const perGramMacros = {
                calories: (parseFloat(product.calories) || 0) / weightG,
                protein_g: (parseFloat(product.protein_g) || 0) / weightG,
                carbs_g: (parseFloat(product.carbs_g) || 0) / weightG,
                fats_g: (parseFloat(product.fats_g) || 0) / weightG,
            };
            setBaseMacros(perGramMacros);

            const initialFormData = {
                description: product.name,
                calories: String(Math.round(product.calories)),
                protein_g: round(product.protein_g),
                carbs_g: round(product.carbs_g),
                fats_g: round(product.fats_g),
                weight_g: String(weightG),
            };

            setManualFormState({
                formData: initialFormData,
                per100Data: { // Guardar valores por 100g también
                    calories: String(product.calories),
                    protein_g: String(product.protein_g),
                    carbs_g: String(product.carbs_g),
                    fats_g: String(product.fats_g),
                },
                per100Mode: false,
                isFavorite: false,
            });
            setOriginalData(initialFormData); // Guardar datos originales
            setActiveTab('manual'); // Cambiar a la pestaña manual
            // --- INICIO DE LA MODIFICACIÓN ---
            setAddModeType('manual'); // Marcar que estamos en modo manual/scan
            // --- FIN DE LA MODIFICACIÓN ---

        } catch (error) {
            addToast(error.message || 'No se pudo encontrar el producto.', 'error', 5000, tempLoadingToastId); // Reemplaza el toast
        }
    };

    // Borrar favorito
    const handleDeleteFavorite = (meal) => { setMealToDelete(meal); };
    const confirmDeleteFavorite = async () => { if (!mealToDelete) return; const result = await deleteFavoriteMeal(mealToDelete.id); addToast(result.message, result.success ? 'success' : 'error'); setMealToDelete(null); };

    // Añadir item a la lista temporal
    const handleAddItem = (item, origin = 'manual') => {
        // --- INICIO DE LA MODIFICACIÓN ---
        // Establecer el modo de adición según el origen
        if (origin === 'manual' || origin === 'scan') { // 'scan' no se usa como origin pero podría ser
            setAddModeType('manual');
        } else {
            setAddModeType('list');
        }
        // --- FIN DE LA MODIFICACIÓN ---

        const baseWeight = parseFloat(item.weight_g) || (origin === 'manual' ? 0 : (item.name ? 100 : 0)); // Evitar NaN si el nombre no existe
        const newItem = {
            ...item, tempId: `item-${Date.now()}-${Math.random()}`,
            description: item.name,
            isFavorite: item.isFavorite || false, // Hereda si es favorito
            calories: parseFloat(item.calories) || 0,
            protein_g: parseFloat(item.protein_g) || 0,
            carbs_g: parseFloat(item.carbs_g) || 0,
            fats_g: parseFloat(item.fats_g) || 0,
            weight_g: parseFloat(item.weight_g) || null, // Guardar como número o null
            // Calcula base macros si hay peso
            base: baseWeight > 0 ? {
                calories: (parseFloat(item.calories) || 0) / baseWeight,
                protein_g: (parseFloat(item.protein_g) || 0) / baseWeight,
                carbs_g: (parseFloat(item.carbs_g) || 0) / baseWeight,
                fats_g: (parseFloat(item.fats_g) || 0) / baseWeight
            } : null,
            origin: origin // Guardamos el origen
        };
        setItemsToAdd(prev => [...prev, newItem]);
        addToast(`${item.name} añadido a la lista.`, 'success');
        if (origin === 'manual') { // Si se añadió manualmente, limpiar el form
            setManualFormState(initialManualFormState);
            setBaseMacros(null);
            setOriginalData(null);
        }
    };
    // Wrappers específicos para cada origen
    const handleAddManualItem = (item) => handleAddItem(item, 'manual');
    const handleAddFavoriteItem = (item) => handleAddItem(item, 'favorite');
    const handleAddRecentItem = (item) => handleAddItem(item, 'recent');

    // Quitar item de la lista temporal
    const handleRemoveItem = (tempId) => {
        if (editingListItemId === tempId) { // Si se elimina el item que se estaba editando
            setEditingListItemId(null); // Limpiar ID de edición
            setManualFormState(initialManualFormState); // Resetear formulario
            setBaseMacros(null);
            setOriginalData(null);
        }
        setItemsToAdd(prev => prev.filter(item => item.tempId !== tempId));
    };

    // Marcar/desmarcar item de lista como favorito para guardar
    const handleToggleFavorite = (tempId) => { setItemsToAdd(prevItems => prevItems.map(item => item.tempId === tempId ? { ...item, isFavorite: !item.isFavorite } : item)); };

    // Iniciar edición de un item de la lista temporal
    const handleEditListItem = (tempId) => {
        setEditingFavorite(null); // Asegura que no estemos editando un favorito
        setEditingListItemId(tempId);
        setActiveTab('manual'); // Cambia a la pestaña manual
    };

    // --- NUEVO --- Iniciar edición de una comida favorita directamente
    const handleEditFavorite = (favoriteMeal) => {
        setEditingListItemId(null); // Asegura que no estemos editando un item de la lista
        setEditingFavorite(favoriteMeal); // Guarda el favorito a editar
        setActiveTab('manual'); // Cambia a la pestaña manual
    };

    // Guardar cambios de un item de la lista temporal
    const handleSaveListItem = (updatedItem) => {
        setItemsToAdd(prev => prev.map(item => item.tempId === updatedItem.tempId ? updatedItem : item));
        setEditingListItemId(null); // Finaliza edición de item de lista
        addToast(`${updatedItem.name} actualizado.`, 'success');
        setManualFormState(initialManualFormState); // Resetea formulario
        setBaseMacros(null);
        setOriginalData(null);
        setActiveTab('favorites'); // Vuelve a favoritos por defecto
    };

    // Guardar toda la lista temporal (y nuevos favoritos)
    const handleSaveList = async () => {
        if (itemsToAdd.length === 0) return addToast('No has añadido ninguna comida.', 'info');
        // Identificar los que se marcaron como favoritos para guardarlos
        const newFavorites = itemsToAdd.filter(item => item.isFavorite);
        if (newFavorites.length > 0) {
            try {
                // Guarda cada nuevo favorito individualmente
                await Promise.all(newFavorites.map(fav => addFavoriteMeal({
                    name: fav.description, calories: fav.calories, protein_g: fav.protein_g,
                    carbs_g: fav.carbs_g, fats_g: fav.fats_g, weight_g: fav.weight_g
                })));
                addToast(`${newFavorites.length} comida(s) guardada(s) en favoritos.`, 'success');
            } catch (error) {
                addToast(error.message || 'Error al guardar en favoritos.', 'error');
                // Continuamos aunque falle guardar favoritos
            }
        }
        onSave(itemsToAdd); // Llama a onSave con la lista completa
    };

    // Guardar un único item añadido manualmente (y opcionalmente como favorito)
    const handleSaveSingle = async (itemData) => {
        const item = itemData[0];
        // Si se marcó para guardar como favorito
        if (item.saveAsFavorite) {
            try {
                await addFavoriteMeal({
                    name: item.description, calories: item.calories, protein_g: item.protein_g,
                    carbs_g: item.carbs_g, fats_g: item.fats_g, weight_g: item.weight_g
                });
                addToast(`'${item.description}' guardado en favoritos.`, 'success');
            } catch (error) {
                addToast(error.message || 'Error al guardar en favoritos.', 'error');
                // Continuamos aunque falle guardar favorito
            }
        }
        // Resetea el formulario y llama a onSave con el item
        setManualFormState(initialManualFormState);
        setBaseMacros(null);
        setOriginalData(null);
        // --- INICIO DE LA MODIFICACIÓN ---
        setAddModeType(null); // Resetea el modo
        // --- FIN DE LA MODIFICACIÓN ---
        onSave(itemData);
    };

    // Guardar cambios de un log existente O de un favorito editado
    const handleSaveEdit = async (formData) => {
        let result;
        if (editingFavorite) { // Si estamos editando un favorito
            result = await updateFavoriteMeal(editingFavorite.id, {
                ...editingFavorite, // Mantener datos originales
                ...formData // Sobrescribir con los del formulario
            });
            if (result.success) {
                addToast(result.message, 'success');
                setEditingFavorite(null); // Finaliza edición de favorito
                setManualFormState(initialManualFormState); // Resetea formulario
                setBaseMacros(null);
                setOriginalData(null);
                setActiveTab('favorites'); // Vuelve a la lista de favoritos
            } else {
                addToast(result.message, 'error');
            }
        } else if (isEditingLog) { // Si estamos editando un log existente
            onSave([{ ...logToEdit, ...formData }], true); // Llama a la función onSave original para logs
            setBaseMacros(null);
            setOriginalData(null);
            // No reseteamos form aquí, onSave lo gestiona al cerrar modal
        }
    };


    const mealTitles = { breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Snacks' };
    const title = isEditingLog ? `Editar ${logToEdit.description}` : editingFavorite ? `Editar Favorito: ${editingFavorite.name}` : `Añadir a ${mealTitles[mealType]}`;

    // --- RENDERIZADO ---
    const renderListContent = () => {
        if (activeTab === 'manual') {
            const editingItem = itemsToAdd.find(item => item.tempId === editingListItemId);
            return <ManualEntryForm
                onAddManual={handleAddManualItem}
                isLoading={isLoading}
                onSaveSingle={handleSaveSingle}
                showFavoriteToggle={itemsToAdd.length === 0 && !editingListItemId && !isEditingLog && !editingFavorite}
                isEditing={isEditingLog || !!editingFavorite} // True si editamos log O favorito
                editingListItem={editingItem} // Solo para editar item de la lista temporal
                onSaveEdit={handleSaveEdit} // Para guardar cambios de log o favorito
                onSaveListItem={handleSaveListItem} // Para guardar cambios de item temporal
                formState={manualFormState}
                onFormStateChange={setManualFormState}
            />;
        }
        if (activeTab === 'favorites') {
             return <FavoritesList
                items={paginatedFavorites}
                onAdd={handleAddFavoriteItem} // Usar el wrapper específico
                onDelete={handleDeleteFavorite}
                onEdit={handleEditFavorite} // --- NUEVO --- Pasamos la función para editar favoritos
                currentPage={favoritesPage}
                totalPages={totalPages}
                onPageChange={setFavoritesPage}
             />;
        }
        if (activeTab === 'recent') {
            // Pasamos handleEditFavorite también a recientes, por si un reciente también es favorito
            return <RecentList items={filteredRecents} onAdd={handleAddRecentItem} onEdit={handleEditFavorite} />; // Usar el wrapper específico
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
                        {/* No mostrar tabs si estamos editando un log o un favorito */}
                        {!(isEditingLog || editingFavorite) && (
                            <div className="p-5 flex-shrink-0">
                                {activeTab !== 'manual' && (
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                                        <input type="text" placeholder="Buscar comida..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-bg-primary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:border-accent" />
                                    </div>
                                )}
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    {/* --- INICIO DE LA MODIFICACIÓN --- */}
                                    {/* Pasamos la prop 'disabled' a los TabButton */}
                                    <TabButton
                                        active={activeTab === 'favorites'}
                                        onClick={() => { setActiveTab('favorites'); setEditingListItemId(null); setEditingFavorite(null); }}
                                        disabled={addModeType === 'manual'} // Deshabilitado si estamos en modo manual/scan
                                    >
                                        <BookMarked size={16} /> Favoritas
                                    </TabButton>
                                    <TabButton
                                        active={activeTab === 'recent'}
                                        onClick={() => { setActiveTab('recent'); setEditingListItemId(null); setEditingFavorite(null); }}
                                        disabled={addModeType === 'manual'} // Deshabilitado si estamos en modo manual/scan
                                    >
                                        <Clock size={16} /> Recientes
                                    </TabButton>
                                    <TabButton
                                        active={activeTab === 'manual'}
                                        onClick={() => { setActiveTab('manual'); setEditingListItemId(null); setEditingFavorite(null); }}
                                        disabled={addModeType === 'list'} // Deshabilitado si estamos añadiendo desde listas
                                    >
                                        <Edit size={16} /> Manual
                                    </TabButton>
                                    <TabButton
                                        active={false}
                                        onClick={() => setShowScanner(true)}
                                        disabled={addModeType === 'list'} // Deshabilitado si estamos añadiendo desde listas
                                    >
                                        <QrCode size={16} /> Escanear
                                    </TabButton>
                                    {/* --- FIN DE LA MODIFICACIÓN --- */}
                                </div>
                            </div>
                        )}
                        <div className="overflow-y-auto px-5 pb-3 flex-grow min-h-[200px]">
                            {renderListContent()}
                        </div>
                    </div>

                    {/* Footer con lista seleccionada y botón de guardar (solo si NO estamos editando log o favorito) */}
                    {!isEditingLog && !editingFavorite && itemsToAdd.length > 0 && (
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