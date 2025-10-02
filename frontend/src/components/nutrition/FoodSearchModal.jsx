import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Star, Clock, Plus, Trash2, Save, ChevronsRight } from 'lucide-react';
import GlassCard from '../GlassCard';
import Spinner from '../Spinner';
import useAppStore from '../../store/useAppStore';
import { useToast } from '../../hooks/useToast';

const SearchResultItem = ({ item, onAdd }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-bg-primary hover:bg-bg-secondary transition-colors border border-glass-border">
        <div className="min-w-0 pr-2">
            <p className="font-semibold truncate text-text-primary">{item.name}</p>
            <p className="text-xs text-text-muted">
                {item.calories} kcal
                {item.weight_g ? ` (${parseFloat(item.weight_g)}g)` : ''}
            </p>
        </div>
        <button onClick={() => onAdd(item)} className="p-2 rounded-full text-accent hover:bg-accent-transparent transition flex-shrink-0 ml-2">
            <Plus size={18} />
        </button>
    </div>
);

const SelectedItem = ({ item, onUpdate, onRemove }) => (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-primary border border-glass-border">
        <div className="flex-grow min-w-0 pr-2">
            <p className="font-semibold text-sm truncate text-text-primary">{item.name}</p>
            <p className="text-xs text-text-secondary">{Math.round(item.calories)} kcal</p>
        </div>
        <div className="flex items-center bg-bg-secondary border border-glass-border rounded-md flex-shrink-0">
            <input type="number" value={item.weight_g} onChange={(e) => onUpdate(item.tempId, 'weight_g', e.target.value)} className="w-20 bg-transparent text-center outline-none px-2 py-1 text-text-primary" placeholder="g" />
            <span className="pr-2 text-sm text-text-muted">g</span>
        </div>
        <button onClick={() => onRemove(item.tempId)} className="text-red-500 hover:bg-red-500/20 rounded-full p-1.5">
            <Trash2 size={16} />
        </button>
    </div>
);

const ManualEntryForm = ({ onAddManual, initialData, isEditing, onSaveEdit, isLoading }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({ description: '', calories: '', protein_g: '', carbs_g: '', fats_g: '', weight_g: '' });
    const [saveAsFavorite, setSaveAsFavorite] = useState(false);
    const [per100Mode, setPer100Mode] = useState(false);
    const [per100Data, setPer100Data] = useState({ calories: '', protein_g: '', carbs_g: '', fats_g: '' });
    const [baseMacros, setBaseMacros] = useState(null);

    const round = (val, decimals = 1) => {
        const n = parseFloat(val);
        return isNaN(n) ? '' : (Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals);
    };

    useEffect(() => {
        if (initialData) {
            const initialWeight = parseFloat(initialData.weight_g);
            if (initialWeight > 0) {
                setBaseMacros({
                    calories: (parseFloat(initialData.calories) || 0) / initialWeight,
                    protein_g: (parseFloat(initialData.protein_g) || 0) / initialWeight,
                    carbs_g: (parseFloat(initialData.carbs_g) || 0) / initialWeight,
                    fats_g: (parseFloat(initialData.fats_g) || 0) / initialWeight,
                });
            }
            setFormData({
                description: initialData.description || '', calories: initialData.calories || '',
                protein_g: initialData.protein_g || '', carbs_g: initialData.carbs_g || '',
                fats_g: initialData.fats_g || '', weight_g: initialData.weight_g || ''
            });
        }
    }, [initialData]);
    
    useEffect(() => {
        if (isEditing && baseMacros) {
            const newWeight = parseFloat(formData.weight_g) || 0;
            setFormData(prev => ({
                ...prev,
                calories: Math.round(baseMacros.calories * newWeight),
                protein_g: round(baseMacros.protein_g * newWeight),
                carbs_g: round(baseMacros.carbs_g * newWeight),
                fats_g: round(baseMacros.fats_g * newWeight),
            }));
        }
    }, [formData.weight_g, baseMacros, isEditing]);

    useEffect(() => {
        if (per100Mode) {
            const weight = parseFloat(formData.weight_g) || 0;
            const factor = weight / 100;
            setFormData(prev => ({
                ...prev,
                calories: Math.round((parseFloat(per100Data.calories) || 0) * factor),
                protein_g: round((parseFloat(per100Data.protein_g) || 0) * factor),
                carbs_g: round((parseFloat(per100Data.carbs_g) || 0) * factor),
                fats_g: round((parseFloat(per100Data.fats_g) || 0) * factor),
            }));
        }
    }, [formData.weight_g, per100Data, per100Mode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'description' || /^\d*\.?\d*$/.test(value)) {
            setFormData(prev => ({ ...prev, [name]: value }));
            if (isEditing && name !== 'weight_g' && name !== 'description') {
                setBaseMacros(null);
            }
        }
    };

    const handlePer100Change = (e) => {
        const { name, value } = e.target;
        if (/^\d*\.?\d*$/.test(value)) {
            setPer100Data(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = () => {
        if (!formData.description || !formData.calories) {
            addToast('La descripción y las calorías son obligatorias.', 'error');
            return;
        }
        
        const finalData = { ...formData };
        Object.keys(finalData).forEach(key => {
            if (key !== 'description') {
                finalData[key] = parseFloat(finalData[key]) || 0;
            }
        });

        if (isEditing) onSaveEdit(finalData);
        else {
            onAddManual({ name: finalData.description, saveAsFavorite, ...finalData });
            setFormData({ description: '', calories: '', protein_g: '', carbs_g: '', fats_g: '', weight_g: '' });
            setSaveAsFavorite(false);
        }
    };
    
    const baseInputClasses = "w-full bg-bg-primary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";

    return (
        <div className="flex flex-col gap-4 animate-[fade-in_0.3s] pt-2">
            <input name="description" type="text" value={formData.description} onChange={handleChange} required className={baseInputClasses} placeholder="Descripción. Ej: Pechuga y arroz" />
            
            {!isEditing && (
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text-secondary">Valores por 100g</label>
                    <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={per100Mode} onChange={(e) => setPer100Mode(e.target.checked)} />
                        <div className="w-10 h-6 rounded-full peer-checked:bg-accent relative transition bg-bg-primary border-glass-border"><div className="absolute top-1 left-1 w-4 h-4 rounded-full transition peer-checked:translate-x-4 bg-white dark:bg-bg-primary" /></div>
                    </label>
                </div>
            )}

            {per100Mode ? (
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
                        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Calorías</p><p className="font-semibold text-text-primary">{formData.calories || 0} kcal</p></div>
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
            
            {!isEditing && (
                <div className="bg-bg-primary rounded-xl p-4 border border-glass-border">
                    <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={saveAsFavorite} onChange={(e) => setSaveAsFavorite(e.target.checked)} className="w-4 h-4" /><span className="text-sm text-text-secondary">Guardar esta comida en favoritos</span></label>
                </div>
            )}

            <button type="button" onClick={handleSubmit} disabled={isLoading} className={`w-full flex items-center justify-center py-3 rounded-xl font-bold transition ${isEditing ? 'bg-accent text-white' : 'bg-accent/20 text-accent hover:bg-accent/30'} disabled:opacity-50`}>
                {isLoading ? <Spinner /> : isEditing ? <><Save size={18} className="mr-2" /> Guardar Cambios</> : <><Plus size={18} className="mr-2" /> Añadir a la lista</>}
            </button>
        </div>
    );
};

const FoodSearchModal = ({ mealType, onSave, onClose, isLoading, logToEdit }) => {
    const isEditing = Boolean(logToEdit);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('favorites');
    const [itemsToAdd, setItemsToAdd] = useState([]);
    const { addToast } = useToast();
    const { favoriteMeals, addFavoriteMeal } = useAppStore(state => ({
        favoriteMeals: state.favoriteMeals, addFavoriteMeal: state.addFavoriteMeal,
    }));
    
    const [isDarkTheme, setIsDarkTheme] = useState(() =>
        typeof document !== 'undefined' && !document.body.classList.contains('light-theme')
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkTheme(!document.body.classList.contains('light-theme'));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const recentMeals = useMemo(() => [...favoriteMeals].sort((a, b) => b.id - a.id).slice(0, 10), [favoriteMeals]);
    const filteredFavorites = useMemo(() => favoriteMeals.filter(meal => meal.name.toLowerCase().includes(searchTerm.toLowerCase())), [favoriteMeals, searchTerm]);
    const filteredRecents = useMemo(() => recentMeals.filter(meal => meal.name.toLowerCase().includes(searchTerm.toLowerCase())), [recentMeals, searchTerm]);

    const handleAddItem = (item, isManual = false) => {
        const baseWeight = parseFloat(item.weight_g) || (isManual ? 0 : 100);
        const newItem = { ...item, tempId: `item-${Date.now()}-${Math.random()}`, description: item.name, base: baseWeight > 0 ? { calories: (parseFloat(item.calories) || 0) / baseWeight, protein_g: (parseFloat(item.protein_g) || 0) / baseWeight, carbs_g: (parseFloat(item.carbs_g) || 0) / baseWeight, fats_g: (parseFloat(item.fats_g) || 0) / baseWeight } : null };
        setItemsToAdd(prev => [...prev, newItem]);
        addToast(`${item.name} añadido a la lista.`, 'success');
    };
    
    const handleAddManualItem = (item) => handleAddItem(item, true);
    const handleUpdateItem = (tempId, field, value) => { setItemsToAdd(prev => prev.map(item => { if (item.tempId !== tempId) return item; const updatedItem = { ...item, [field]: value }; const newWeight = parseFloat(value) || 0; if (item.base && field === 'weight_g') { updatedItem.calories = item.base.calories * newWeight; updatedItem.protein_g = (item.base.protein_g * newWeight).toFixed(1); updatedItem.carbs_g = (item.base.carbs_g * newWeight).toFixed(1); updatedItem.fats_g = (item.base.fats_g * newWeight).toFixed(1); } return updatedItem; })); };
    const handleRemoveItem = (tempId) => setItemsToAdd(prev => prev.filter(item => item.tempId !== tempId));

    const handleSaveAll = async () => {
        if (itemsToAdd.length === 0) return addToast('No has añadido ninguna comida.', 'info');
        const newFavorites = itemsToAdd.filter(item => item.saveAsFavorite);
        if (newFavorites.length > 0) {
            await Promise.all(newFavorites.map(fav => addFavoriteMeal({ name: fav.description, calories: fav.calories, protein_g: fav.protein_g, carbs_g: fav.carbs_g, fats_g: fav.fats_g, weight_g: fav.weight_g })));
            addToast(`${newFavorites.length} comida(s) guardada(s) en favoritos.`, 'success');
        }
        onSave(itemsToAdd);
    };

    const handleSaveEdit = (formData) => onSave(formData, true);
    const mealTitles = { breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Snack' };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
            <GlassCard 
              className={`relative w-11/12 max-w-lg p-0 m-4 flex flex-col max-h-[90vh] ${!isDarkTheme ? '!bg-bg-secondary' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 flex items-center justify-between border-b border-glass-border flex-shrink-0">
                    <h3 className="text-xl font-bold truncate pr-4 text-text-primary">{isEditing ? `Editar ${logToEdit.description}` : `Añadir a ${mealTitles[mealType]}`}</h3>
                    <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-bg-primary transition flex-shrink-0"><X size={20} className="text-text-secondary" /></button>
                </div>

                {isEditing ? (
                    <div className="overflow-y-auto px-5 pb-5 flex-grow"><ManualEntryForm isEditing initialData={logToEdit} onSaveEdit={handleSaveEdit} isLoading={isLoading} /></div>
                ) : (
                    <>
                        <div className="p-5 flex-shrink-0">
                            <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} /><input type="text" placeholder="Buscar comida..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-bg-primary border border-glass-border rounded-xl text-text-primary" /></div>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <button onClick={() => setActiveTab('favorites')} className={`px-4 py-2 text-sm rounded-full font-semibold flex items-center justify-center gap-2 ${activeTab === 'favorites' ? 'bg-accent text-white dark:text-bg-secondary' : 'bg-bg-primary text-text-secondary'}`}><Star size={16} /> Favoritos</button>
                                <button onClick={() => setActiveTab('recent')} className={`px-4 py-2 text-sm rounded-full font-semibold flex items-center justify-center gap-2 ${activeTab === 'recent' ? 'bg-accent text-white dark:text-bg-secondary' : 'bg-bg-primary text-text-secondary'}`}><Clock size={16} /> Recientes</button>
                                <button onClick={() => setActiveTab('manual')} disabled={itemsToAdd.length > 0} className={`px-4 py-2 text-sm rounded-full font-semibold flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'bg-accent text-white dark:text-bg-secondary' : 'bg-bg-primary text-text-secondary'} disabled:opacity-50 disabled:cursor-not-allowed`}><Plus size={16} /> Manual</button>
                            </div>
                        </div>
                        <div className="overflow-y-auto px-5 pb-3 flex-grow">{activeTab === 'manual' ? <ManualEntryForm onAddManual={handleAddManualItem} isLoading={isLoading} /> : <div className="space-y-2">{activeTab === 'favorites' ? filteredFavorites.map(item => <SearchResultItem key={`fav-${item.id}`} item={item} onAdd={handleAddItem} />) : filteredRecents.map(item => <SearchResultItem key={`rec-${item.id}`} item={item} onAdd={handleAddItem} />)}</div>}</div>
                        {itemsToAdd.length > 0 && (<div className="p-5 border-t border-glass-border flex-shrink-0 animate-[fade-in-up_0.3s_ease-out]"><h4 className="font-semibold mb-2 text-text-primary">Añadir ({itemsToAdd.length})</h4><div className="space-y-2 max-h-32 overflow-y-auto mb-4">{itemsToAdd.map(item => <SelectedItem key={item.tempId} item={item} onUpdate={handleUpdateItem} onRemove={handleRemoveItem} />)}</div><button onClick={handleSaveAll} disabled={isLoading} className="w-full flex items-center justify-center py-3 rounded-xl bg-accent text-white dark:text-bg-secondary font-bold hover:scale-[1.01] transition disabled:opacity-60">{isLoading ? <Spinner /> : `Añadir ${itemsToAdd.length} Alimento${itemsToAdd.length > 1 ? 's' : ''}`}</button></div>)}
                    </>
                )}
            </GlassCard>
        </div>
    );
};

export default FoodSearchModal;