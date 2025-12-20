/* frontend/src/components/nutrition/FoodSearchModal.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Star, Clock, Plus, Trash2, Save, ChevronsRight, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import GlassCard from '../GlassCard';
import Spinner from '../Spinner';
import useAppStore from '../../store/useAppStore';
import { useToast } from '../../hooks/useToast';
import ConfirmationModal from '../ConfirmationModal';

const SearchResultItem = ({ item, onAdd, onDelete }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-bg-primary hover:bg-bg-secondary transition-colors border border-glass-border">
        <div className="min-w-0 pr-2">
            <p className="font-semibold truncate text-text-primary">{item.name}</p>
            <p className="text-xs text-text-muted">
                {item.calories} kcal
                {item.weight_g ? ` (${parseFloat(item.weight_g)}g)` : ''}
            </p>
        </div>
        <div className="flex items-center flex-shrink-0 ml-2">
            {onDelete && (
                <button
                    onClick={() => onDelete(item)}
                    className="p-2 rounded-full text-text-muted hover:text-red hover:bg-red/10 transition"
                    title="Eliminar de favoritos"
                >
                    <Trash2 size={16} />
                </button>
            )}
            <button
                onClick={() => onAdd(item)}
                className="p-2 rounded-full text-accent hover:bg-accent-transparent transition"
                title="Añadir a la lista"
            >
                <Plus size={18} />
            </button>
        </div>
    </div>
);

const SelectedItem = ({ item, onRemove, onToggleFavorite, onEdit }) => (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-primary border border-glass-border">
        <button onClick={() => onToggleFavorite(item.tempId)} className="p-1.5 rounded-full hover:bg-bg-secondary transition-colors flex-shrink-0" title="Guardar en favoritos">
            <Star size={16} className={`transition-all ${item.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-text-muted'}`} />
        </button>
        <div
            className="flex-grow min-w-0 pr-2 cursor-pointer"
            onClick={() => onEdit(item.tempId)}
            title="Editar esta comida"
        >
            <p className="font-semibold text-sm truncate text-text-primary">{item.name}</p>
            <p className="text-xs text-text-secondary">{Math.round(item.calories)} kcal</p>
        </div>
        <div className="text-right flex-shrink-0 w-20">
            <p className="font-semibold text-sm text-text-primary">
                {parseFloat(item.weight_g) || 0}
                <span className="text-xs text-text-muted"> g</span>
            </p>
        </div>
        <button onClick={() => onRemove(item.tempId)} className="text-red hover:bg-red/20 rounded-full p-1.5 flex-shrink-0" title="Eliminar de la lista">
            <Trash2 size={16} />
        </button>
    </div>
);


const ManualEntryForm = ({
    onAddManual, onSaveSingle, onSaveEdit, onSaveListItem,
    isLoading, isEditing, editingListItem, showFavoriteToggle,
    formState, onFormStateChange
}) => {
    const { addToast } = useToast();
    const { formData, per100Data, per100Mode, isFavorite } = formState;

    const round = (val, decimals = 1) => {
        const n = parseFloat(val);
        return isNaN(n) ? '' : (Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'description' || /^\d*\.?\d*$/.test(value)) {
            onFormStateChange({ ...formState, formData: { ...formData, [name]: value } });
        }
    };

    const handlePer100Change = (e) => {
        const { name, value } = e.target;
        if (/^\d*\.?\d*$/.test(value)) {
            onFormStateChange({ ...formState, per100Data: { ...per100Data, [name]: value } });
        }
    };

    const handlePer100ModeChange = (e) => {
        onFormStateChange({ ...formState, per100Mode: e.target.checked });
    };

    const handleFavoriteChange = () => {
        onFormStateChange({ ...formState, isFavorite: !isFavorite });
    };

    const validateAndGetData = () => {
        const finalData = { ...formData };
        if (per100Mode && !isEditing && !editingListItem) {
            const weight = parseFloat(finalData.weight_g) || 0;
            if (weight === 0) {
                addToast('Los gramos a consumir son obligatorios en el modo por 100g.', 'error');
                return null;
            }
        }

        if (!finalData.description || !finalData.calories) {
            addToast('La descripción y las calorías son obligatorias.', 'error');
            return null;
        }

        Object.keys(finalData).forEach(key => {
            if (key !== 'description') {
                finalData[key] = parseFloat(finalData[key]) || 0;
            }
        });
        return finalData;
    };

    const handleSaveAndClose = () => {
        const finalData = validateAndGetData();
        if (!finalData) return;
        const dataToSave = { ...finalData, name: finalData.description, saveAsFavorite: isFavorite };
        onSaveSingle([dataToSave]);
    };

    const handleAddToList = () => {
        const finalData = validateAndGetData();
        if (!finalData) return;
        onAddManual({ name: finalData.description, isFavorite, ...finalData });
    };

    const handleSaveEdited = () => {
        const finalData = validateAndGetData();
        if (!finalData) return;
        onSaveEdit(finalData);
    };

    const handleUpdateListItem = () => {
        const finalData = validateAndGetData();
        if (!finalData) return;
        onSaveListItem({ ...editingListItem, ...finalData, name: finalData.description, isFavorite });
    };

    const baseInputClasses = "w-full bg-bg-primary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";

    return (
        <div className="flex flex-col gap-4 animate-[fade-in_0.3s] pt-2">
            <input name="description" type="text" value={formData.description} onChange={handleChange} required className={baseInputClasses} placeholder="Descripción. Ej: Pechuga y arroz" />
            {!isEditing && !editingListItem && (
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text-secondary">Valores por 100g</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={per100Mode} onChange={handlePer100ModeChange} />
                        <div className="w-10 h-6 bg-bg-primary rounded-full border border-glass-border peer-checked:bg-accent transition-colors"></div>
                        <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
                    </label>
                </div>
            )}
            {per100Mode && !isEditing && !editingListItem ? (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <input name="calories" type="text" inputMode="decimal" value={per100Data.calories} onChange={handlePer100Change} className={baseInputClasses} placeholder="Cal/100g" />
                        <input name="protein_g" type="text" inputMode="decimal" value={per100Data.protein_g} onChange={handlePer100Change} className={baseInputClasses} placeholder="Prot/100g" />
                        <input name="carbs_g" type="text" inputMode="decimal" value={per100Data.carbs_g} onChange={handlePer100Change} className={baseInputClasses} placeholder="Carbs/100g" />
                        <input name="fats_g" type="text" inputMode="decimal" value={per100Data.fats_g} onChange={handlePer100Change} className={baseInputClasses} placeholder="Grasas/100g" />
                    </div>
                    <div className="relative">
                        <input name="weight_g" type="text" inputMode="decimal" value={formData.weight_g} onChange={handleChange} className={baseInputClasses} placeholder="Gramos a consumir" />
                        <ChevronsRight size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Calorías</p><p className="font-semibold text-text-primary">{Math.round(formData.calories) || 0} kcal</p></div>
                        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Proteínas</p><p className="font-semibold text-text-primary">{formData.protein_g || 0} g</p></div>
                        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Carbs</p><p className="font-semibold text-text-primary">{formData.carbs_g || 0} g</p></div>
                        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Grasas</p><p className="font-semibold text-text-primary">{formData.fats_g || 0} g</p></div>
                    </div>
                </>
            ) : (
                <>
                    <input name="calories" type="text" inputMode="decimal" value={formData.calories} onChange={handleChange} required className={baseInputClasses} placeholder="Calorías (kcal)" />
                    <div className="grid grid-cols-3 gap-4">
                        <input name="protein_g" type="text" inputMode="decimal" value={formData.protein_g} onChange={handleChange} className={baseInputClasses} placeholder="Proteínas (g)" />
                        <input name="carbs_g" type="text" inputMode="decimal" value={formData.carbs_g} onChange={handleChange} className={baseInputClasses} placeholder="Carbs (g)" />
                        <input name="fats_g" type="text" inputMode="decimal" value={formData.fats_g} onChange={handleChange} className={baseInputClasses} placeholder="Grasas (g)" />
                    </div>
                    <input name="weight_g" type="text" inputMode="decimal" value={formData.weight_g} onChange={handleChange} className={baseInputClasses} placeholder="Gramos totales (opcional)" />
                </>
            )}

            {isEditing ? (
                <button type="button" onClick={handleSaveEdited} disabled={isLoading} className="w-full flex items-center justify-center py-3 rounded-xl font-bold transition bg-accent text-white disabled:opacity-50">
                    {isLoading ? <Spinner /> : <><Save size={18} className="mr-2" /> Guardar Cambios</>}
                </button>
            ) : editingListItem ? (
                <button type="button" onClick={handleUpdateListItem} disabled={isLoading} className="w-full flex items-center justify-center py-3 rounded-xl font-bold transition bg-accent text-white disabled:opacity-50">
                    {isLoading ? <Spinner /> : <><Save size={18} className="mr-2" /> Actualizar Comida</>}
                </button>
            ) : (
                <>
                    {showFavoriteToggle && (
                        <button type="button" onClick={handleFavoriteChange} className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${isFavorite ? 'bg-amber-400/20 text-amber-400 border-amber-400/30' : 'bg-bg-primary text-text-secondary border-glass-border'} border`}>
                            <Star size={18} className={`transition-all ${isFavorite ? 'fill-amber-400' : ''}`} />
                            Guardar esta comida en favoritos
                        </button>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <button type="button" onClick={handleAddToList} disabled={isLoading} className={`w-full flex items-center justify-center py-3 rounded-xl font-bold transition bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-50`}>
                            {isLoading ? <Spinner /> : <><Plus size={18} className="mr-2" /> Añadir a la lista</>}
                        </button>
                        <button type="button" onClick={handleSaveAndClose} disabled={isLoading} className={`w-full flex items-center justify-center py-3 rounded-xl font-bold transition bg-accent text-white dark:text-bg-secondary disabled:opacity-50`}>
                            {isLoading ? <Spinner /> : <><Check size={18} className="mr-2" /> Añadir y Guardar</>}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};


const initialManualFormState = {
    formData: { description: '', calories: '', protein_g: '', carbs_g: '', fats_g: '', weight_g: '' },
    per100Data: { calories: '', protein_g: '', carbs_g: '', fats_g: '' },
    per100Mode: false, isFavorite: false,
};

const FoodSearchModal = ({ mealType, onSave, onClose, isLoading, logToEdit }) => {
    const isEditing = Boolean(logToEdit);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(isEditing ? 'manual' : 'favorites');
    const [itemsToAdd, setItemsToAdd] = useState([]);
    const [favoritesPage, setFavoritesPage] = useState(1);
    const [mealToDelete, setMealToDelete] = useState(null);
    const [editingListItemId, setEditingListItemId] = useState(null);
    const [manualFormState, setManualFormState] = useState(initialManualFormState);
    const [baseMacros, setBaseMacros] = useState(null);
    const ITEMS_PER_PAGE = 5;

    const { addToast } = useToast();
    const { favoriteMeals, deleteFavoriteMeal } = useAppStore(state => ({
        favoriteMeals: state.favoriteMeals, deleteFavoriteMeal: state.deleteFavoriteMeal,
    }));

    const [isDarkTheme, setIsDarkTheme] = useState(() => typeof document !== 'undefined' && !document.body.classList.contains('light-theme'));
    useEffect(() => { const observer = new MutationObserver(() => { setIsDarkTheme(!document.body.classList.contains('light-theme')); }); observer.observe(document.body, { attributes: true, attributeFilter: ['class'] }); return () => observer.disconnect(); }, []);

    // Función para normalizar texto (ignorar tildes y diacríticos)
    const normalizeText = (text) => {
        return (text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const recentMeals = useMemo(() => [...favoriteMeals].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10), [favoriteMeals]);

    // Filtrado inteligente usando normalizeText
    const filteredFavorites = useMemo(() => {
        const term = normalizeText(searchTerm);
        return [...favoriteMeals]
            .sort((a, b) => a.name.localeCompare(b.name))
            .filter(meal => normalizeText(meal.name).includes(term));
    }, [favoriteMeals, searchTerm]);

    const filteredRecents = useMemo(() => {
        const term = normalizeText(searchTerm);
        return recentMeals.filter(meal => normalizeText(meal.name).includes(term));
    }, [recentMeals, searchTerm]);

    const paginatedFavorites = useMemo(() => { const startIndex = (favoritesPage - 1) * ITEMS_PER_PAGE; return filteredFavorites.slice(startIndex, startIndex + ITEMS_PER_PAGE); }, [filteredFavorites, favoritesPage]);
    const totalPages = Math.ceil(filteredFavorites.length / ITEMS_PER_PAGE);

    const round = (val, decimals = 1) => { const n = parseFloat(val); return isNaN(n) ? '' : (Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals); };

    useEffect(() => {
        const itemToEdit = isEditing ? logToEdit : itemsToAdd.find(item => item.tempId === editingListItemId);
        if (itemToEdit) {
            const initialWeight = parseFloat(itemToEdit.weight_g);
            if (initialWeight > 0) {
                setBaseMacros({
                    calories: (parseFloat(itemToEdit.calories) || 0) / initialWeight, protein_g: (parseFloat(itemToEdit.protein_g) || 0) / initialWeight,
                    carbs_g: (parseFloat(itemToEdit.carbs_g) || 0) / initialWeight, fats_g: (parseFloat(itemToEdit.fats_g) || 0) / initialWeight,
                });
            } else { setBaseMacros(null); }
            setManualFormState({
                formData: {
                    description: itemToEdit.description || itemToEdit.name || '', calories: itemToEdit.calories || '', protein_g: itemToEdit.protein_g || '',
                    carbs_g: itemToEdit.carbs_g || '', fats_g: itemToEdit.fats_g || '', weight_g: itemToEdit.weight_g || ''
                },
                per100Data: { calories: '', protein_g: '', carbs_g: '', fats_g: '' }, // Reset when editing existing item
                per100Mode: false, isFavorite: itemToEdit.isFavorite || false
            });
        }
    }, [editingListItemId, isEditing, logToEdit, itemsToAdd]);

    useEffect(() => {
        if (baseMacros) {
            const newWeight = parseFloat(manualFormState.formData.weight_g) || 0;
            setManualFormState(prev => ({ ...prev, formData: { ...prev.formData, calories: Math.round(baseMacros.calories * newWeight), protein_g: round(baseMacros.protein_g * newWeight), carbs_g: round(baseMacros.carbs_g * newWeight), fats_g: round(baseMacros.fats_g * newWeight) } }));
        }
    }, [manualFormState.formData.weight_g, baseMacros]);

    useEffect(() => {
        if (manualFormState.per100Mode && !isEditing && !editingListItemId) {
            const weight = parseFloat(manualFormState.formData.weight_g) || 0;
            const factor = weight / 100;
            setManualFormState(prev => ({ ...prev, formData: { ...prev.formData, calories: Math.round((parseFloat(prev.per100Data.calories) || 0) * factor), protein_g: round((parseFloat(prev.per100Data.protein_g) || 0) * factor), carbs_g: round((parseFloat(prev.per100Data.carbs_g) || 0) * factor), fats_g: round((parseFloat(prev.per100Data.fats_g) || 0) * factor) } }));
        }
    }, [manualFormState.formData.weight_g, manualFormState.per100Data, manualFormState.per100Mode, isEditing, editingListItemId]);


    useEffect(() => { setFavoritesPage(1); }, [searchTerm, activeTab]);
    useEffect(() => { if (editingListItemId) setActiveTab('manual'); }, [editingListItemId]);

    const handleDeleteFavorite = (meal) => { setMealToDelete(meal); };
    const confirmDeleteFavorite = async () => { if (!mealToDelete) return; const result = await deleteFavoriteMeal(mealToDelete.id); if (result.success) addToast(result.message, 'success'); else addToast(result.message, 'error'); setMealToDelete(null); };

    const handleAddItem = (item, isManual = false) => {
        const baseWeight = parseFloat(item.weight_g) || (isManual ? 0 : 100);
        const newItem = {
            ...item,
            tempId: `item-${Date.now()}-${Math.random()}`,
            description: item.name,
            isFavorite: item.isFavorite || false,
            base: baseWeight > 0 ? { calories: (parseFloat(item.calories) || 0) / baseWeight, protein_g: (parseFloat(item.protein_g) || 0) / baseWeight, carbs_g: (parseFloat(item.carbs_g) || 0) / baseWeight, fats_g: (parseFloat(item.fats_g) || 0) / baseWeight } : null
        };
        setItemsToAdd(prev => [...prev, newItem]);
        addToast(`${item.name} añadido a la lista.`, 'success');
        if (isManual) { setManualFormState(initialManualFormState); }
    };

    const handleAddManualItem = (item) => handleAddItem(item, true);
    const handleRemoveItem = (tempId) => { if (editingListItemId === tempId) { setEditingListItemId(null); } setItemsToAdd(prev => prev.filter(item => item.tempId !== tempId)); };
    const handleToggleFavorite = (tempId) => { setItemsToAdd(prevItems => prevItems.map(item => item.tempId === tempId ? { ...item, isFavorite: !item.isFavorite } : item)); };
    const handleEditListItem = (tempId) => { setEditingListItemId(tempId); };

    const handleSaveListItem = (updatedItem) => {
        setItemsToAdd(prev => prev.map(item => item.tempId === updatedItem.tempId ? updatedItem : item));
        setEditingListItemId(null);
        addToast(`${updatedItem.name} actualizado.`, 'success');
        setManualFormState(initialManualFormState);
        setBaseMacros(null);
    };

    const handleSaveList = () => {
        if (itemsToAdd.length === 0) return addToast('No has añadido ninguna comida.', 'info');
        onSave(itemsToAdd);
    };

    const handleSaveSingle = (itemData) => {
        setManualFormState(initialManualFormState);
        onSave(itemData);
    };

    const handleSaveEdit = (formData) => {
        onSave([formData], true);
        setBaseMacros(null);
    };

    const mealTitles = { breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Snack' };

    const renderList = () => {
        if (activeTab === 'manual') {
            const editingItem = itemsToAdd.find(item => item.tempId === editingListItemId);
            return <ManualEntryForm
                onAddManual={handleAddManualItem}
                isLoading={isLoading}
                onSaveSingle={handleSaveSingle}
                showFavoriteToggle={itemsToAdd.length === 0 && !editingListItemId}
                isEditing={isEditing}
                editingListItem={editingItem}
                onSaveEdit={handleSaveEdit}
                onSaveListItem={handleSaveListItem}
                formState={manualFormState}
                onFormStateChange={(newState) => {
                    if (!isEditing && !editingItem) { setBaseMacros(null); }
                    setManualFormState(newState);
                }}
            />;
        }
        const list = activeTab === 'favorites' ? paginatedFavorites : filteredRecents;
        if (list.length === 0) { return <p className="text-center text-text-muted py-8">No se han encontrado resultados.</p>; }
        return (<div className="space-y-2"> {list.map(item => <SearchResultItem key={`${activeTab}-${item.id}`} item={item} onAdd={handleAddItem} onDelete={activeTab === 'favorites' ? handleDeleteFavorite : null} />)} </div>);
    };

    const renderPagination = () => { if (activeTab !== 'favorites' || totalPages <= 1) return null; return (<div className="flex justify-center items-center gap-4 mt-4"><button onClick={() => setFavoritesPage(p => Math.max(1, p - 1))} disabled={favoritesPage === 1} className="p-2 rounded-full bg-bg-primary hover:bg-bg-secondary disabled:opacity-50 transition"><ChevronLeft size={18} /></button><span className="text-sm font-medium text-text-secondary">Página {favoritesPage} de {totalPages}</span><button onClick={() => setFavoritesPage(p => Math.min(totalPages, p + 1))} disabled={favoritesPage === totalPages} className="p-2 rounded-full bg-bg-primary hover:bg-bg-secondary disabled:opacity-50 transition"><ChevronRight size={18} /></button></div>); };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
                <GlassCard className={`relative w-11/12 max-w-lg p-0 m-4 flex flex-col max-h-[90vh] ${!isDarkTheme ? '!bg-bg-secondary' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className="p-5 flex items-center justify-between border-b border-glass-border flex-shrink-0">
                        <h3 className="text-xl font-bold truncate pr-4 text-text-primary">{isEditing ? `Editar ${logToEdit.description}` : `Añadir a ${mealTitles[mealType]}`}</h3>
                        <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-bg-primary transition flex-shrink-0"><X size={20} className="text-text-secondary" /></button>
                    </div>
                    {isEditing ? (<div className="overflow-y-auto px-5 pb-5 flex-grow">{renderList()}</div>)
                        : (
                            <>
                                <div className="p-5 flex-shrink-0">
                                    {activeTab !== 'manual' && (<div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} /><input type="text" placeholder="Buscar comida..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-bg-primary border border-glass-border rounded-xl text-text-primary" /></div>)}
                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                        <button onClick={() => { setActiveTab('favorites'); setEditingListItemId(null); }} className={`px-4 py-2 text-sm rounded-full font-semibold flex items-center justify-center gap-2 ${activeTab === 'favorites' ? 'bg-accent text-white dark:text-bg-secondary' : 'bg-bg-primary text-text-secondary'}`}><Star size={16} /> Favoritos</button>
                                        <button onClick={() => { setActiveTab('recent'); setEditingListItemId(null); }} className={`px-4 py-2 text-sm rounded-full font-semibold flex items-center justify-center gap-2 ${activeTab === 'recent' ? 'bg-accent text-white dark:text-bg-secondary' : 'bg-bg-primary text-text-secondary'}`}><Clock size={16} /> Recientes</button>
                                        <button onClick={() => { setActiveTab('manual'); setEditingListItemId(null); }} className={`px-4 py-2 text-sm rounded-full font-semibold flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'bg-accent text-white dark:text-bg-secondary' : 'bg-bg-primary text-text-secondary'}`}><Plus size={16} /> Manual</button>
                                    </div>
                                </div>
                                <div className="overflow-y-auto px-5 pb-3 flex-grow">{renderList()}{renderPagination()}</div>
                                {itemsToAdd.length > 0 && !editingListItemId && (
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
                            </>
                        )}
                </GlassCard>
            </div>
            {mealToDelete && (<ConfirmationModal message={`¿Seguro que quieres eliminar "${mealToDelete.name}" de tus favoritos?`} onConfirm={confirmDeleteFavorite} onCancel={() => setMealToDelete(null)} isLoading={isLoading} confirmText="Eliminar" />)}
        </>
    );
};

export default FoodSearchModal;