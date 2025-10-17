import React, { useState, useEffect } from 'react';
// --- INICIO DE LA MODIFICACIÓN ---
import { X, BookMarked, Plus, Trash2, ChevronLeft, ChevronRight, CheckCircle, Search, PlusCircle, QrCode } from 'lucide-react';
import * as nutritionService from '../services/nutritionService';
import BarcodeScanner from './BarcodeScanner'; // Importamos el nuevo componente
// --- FIN DE LA MODIFICACIÓN ---
import Spinner from './Spinner';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';

const TabButton = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-3 text-sm font-semibold transition-colors duration-200 flex-1 rounded-full flex items-center justify-center gap-2
            ${active ? 'bg-accent text-bg-primary' : 'text-text-muted hover:bg-white/5'}`}
    >
        {children}
    </button>
);

const FavoriteMealCard = ({ meal, onSelect, isSelected, onDelete }) => (
    <div
        onClick={() => onSelect(meal)}
        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 flex items-center justify-between
            ${isSelected ? 'bg-accent/10 border-accent shadow-md' : 'bg-bg-secondary border-transparent hover:border-accent/50'}`}
    >
        <div className="flex-1 pr-4">
            <p className="font-bold text-text-primary">{meal.name}</p>
            <p className="text-xs text-text-secondary mt-1">
                {meal.calories} kcal • P:{meal.protein_g}g C:{meal.carbs_g}g G:{meal.fats_g}g
                {meal.weight_g && ` (${meal.weight_g}g)`}
            </p>
        </div>
        <div className="flex items-center gap-2">
            <button
                className="text-text-secondary hover:text-red-500 p-2 -m-2 z-10"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(meal.id);
                }}
            >
                <Trash2 size={16} />
            </button>
            {isSelected && <CheckCircle className="text-accent flex-shrink-0 ml-2" size={20} />}
        </div>
    </div>
);


const NutritionLogModal = ({ logToEdit, mealType, onSave, onClose, isLoading }) => {
    // --- ESTADOS ---
    const [formData, setFormData] = useState({
        description: '', calories: '', protein_g: '', carbs_g: '', fats_g: '', weight_g: '',
    });
    const [view, setView] = useState(logToEdit ? 'manual' : 'favorites');
    const [saveAsFavorite, setSaveAsFavorite] = useState(false);
    const [per100Mode, setPer100Mode] = useState(false);
    const [per100, setPer100] = useState({ calories100: '', protein100: '', carbs100: '', fats100: '' });
    const [baseMacros, setBaseMacros] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    
    // Estados para la selección múltiple
    const [selectedMeals, setSelectedMeals] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // --- INICIO DE LA MODIFICACIÓN ---
    const [showScanner, setShowScanner] = useState(false);
    // --- FIN DE LA MODIFICACIÓN ---

    // Estados para la paginación de favoritos
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const { favoriteMeals, addFavoriteMeal, deleteFavoriteMeal } = useAppStore(state => ({
        favoriteMeals: state.favoriteMeals,
        addFavoriteMeal: state.addFavoriteMeal,
        deleteFavoriteMeal: state.deleteFavoriteMeal,
    }));
    const { addToast } = useToast();
    
    // --- LÓGICA Y EFECTOS ---
    const filteredFavorites = favoriteMeals.filter(fav =>
        fav.name && fav.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Paginación
    const totalPages = Math.ceil(filteredFavorites.length / itemsPerPage) || 1;
    const paginatedMeals = filteredFavorites.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Resetear página al cambiar el término de búsqueda
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Cargar datos si estamos editando
    useEffect(() => {
        if (logToEdit) {
            const initialData = {
                description: logToEdit.description || '',
                calories: logToEdit.calories || '',
                protein_g: logToEdit.protein_g || '',
                carbs_g: logToEdit.carbs_g || '',
                fats_g: logToEdit.fats_g || '',
                weight_g: logToEdit.weight_g || '',
            };
            setFormData(initialData);
            setOriginalData(initialData);

            const favoriteMatch = favoriteMeals.find(
                (meal) => meal.name && (meal.name.toLowerCase().trim() === (logToEdit.description || '').toLowerCase().trim())
            );

            if (favoriteMatch && parseFloat(favoriteMatch.weight_g) > 0) {
                setBaseMacros({
                    calories: (parseFloat(favoriteMatch.calories) || 0) / favoriteMatch.weight_g,
                    protein_g: (parseFloat(favoriteMatch.protein_g) || 0) / favoriteMatch.weight_g,
                    carbs_g: (parseFloat(favoriteMatch.carbs_g) || 0) / favoriteMatch.weight_g,
                    fats_g: (parseFloat(favoriteMatch.fats_g) || 0) / favoriteMatch.weight_g,
                });
            }
        }
    }, [logToEdit, favoriteMeals]);

    // Recalcular macros cuando cambia el peso (para favoritos y edición)
    useEffect(() => {
        if (baseMacros && view === 'manual') {
            const newWeight = parseFloat(formData.weight_g) || 0;
            setFormData(prev => ({
                ...prev,
                calories: Math.round(baseMacros.calories * newWeight),
                protein_g: round(baseMacros.protein_g * newWeight),
                carbs_g: round(baseMacros.carbs_g * newWeight),
                fats_g: round(baseMacros.fats_g * newWeight),
            }));
        }
    }, [formData.weight_g, baseMacros, view]);

    // Recalcular macros en modo "por 100g"
    useEffect(() => {
        if (per100Mode) {
            const computed = computeFromPer100(per100.calories100, per100.protein100, per100.carbs100, per100.fats100, formData.weight_g);
            setFormData(prev => ({ ...prev, ...computed }));
        }
    }, [formData.weight_g, per100, per100Mode]);
    
    // --- HANDLERS ---
    
    const handleScanSuccess = async (barcode) => {
        setShowScanner(false);
        // Indicamos que estamos cargando
        const tempLoadingToastId = addToast('Buscando producto...', 'info');
        
        try {
            const product = await nutritionService.searchByBarcode(barcode);
            setFormData({
                description: product.name,
                calories: Math.round(product.calories),
                protein_g: product.protein_g,
                carbs_g: product.carbs_g,
                fats_g: product.fats_g,
                weight_g: '100', // Asumimos 100g por defecto
            });
            setPer100Mode(true);
            setPer100({
                calories100: product.calories,
                protein100: product.protein_g,
                carbs100: product.carbs_g,
                fats100: product.fats_g,
            });
            setView('manual');
            addToast('Producto encontrado. Ajusta los gramos si es necesario.', 'success');
        } catch (error) {
            addToast(error.message || 'No se pudo encontrar el producto.', 'error');
        } finally {
            // Cerramos el toast de carga
        }
    };

    const handleToggleFavoriteSelection = (meal) => {
        setSelectedMeals(prev => {
            const isSelected = prev.find(m => m.id === meal.id);
            if (isSelected) {
                return prev.filter(m => m.id !== meal.id);
            } else {
                return [...prev, meal];
            }
        });
    };

    const handleSelectFavoriteForManualEntry = (meal) => {
        const mealWeight = parseFloat(meal.weight_g) || 0;
        if (mealWeight > 0) {
            setBaseMacros({
                calories: (parseFloat(meal.calories) || 0) / mealWeight,
                protein_g: (parseFloat(meal.protein_g) || 0) / mealWeight,
                carbs_g: (parseFloat(meal.carbs_g) || 0) / mealWeight,
                fats_g: (parseFloat(meal.fats_g) || 0) / mealWeight,
            });
        } else {
            setBaseMacros(null);
        }
        setFormData({
            description: meal.name,
            calories: meal.calories,
            protein_g: meal.protein_g,
            carbs_g: meal.carbs_g,
            fats_g: meal.fats_g,
            weight_g: meal.weight_g || '',
        });
        setView('manual');
    };

    const handleDeleteFavorite = async (mealId) => {
        const result = await deleteFavoriteMeal(mealId);
        addToast(result.message, result.success ? 'success' : 'error');
        // Deseleccionar si estaba en la lista de seleccionados
        setSelectedMeals(prev => prev.filter(m => m.id !== mealId));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const isNumeric = ['calories', 'protein_g', 'carbs_g', 'fats_g', 'weight_g'].includes(name);
        if (isNumeric && !/^\d*\.?\d*$/.test(value)) return;
        if (baseMacros && name !== 'weight_g' && name !== 'description') setBaseMacros(null);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleChangePer100 = (e) => {
        const { name, value } = e.target;
        if (!/^\d*\.?\d*$/.test(value)) return;
        setPer100(prev => ({ ...prev, [name]: value }));
    };
    
    // Handler para el botón principal de acción
    const handlePrimaryAction = async (e) => {
        e.preventDefault();
        if (view === 'favorites') {
            // Guardar Múltiples
            if (selectedMeals.length === 0) return;
            // Mapeamos para asegurarnos de que el formato es el correcto (name -> description)
            const mealsToSave = selectedMeals.map(meal => ({
                description: meal.name,
                calories: meal.calories,
                protein_g: meal.protein_g,
                carbs_g: meal.carbs_g,
                fats_g: meal.fats_g,
                weight_g: meal.weight_g,
            }));
            onSave(mealsToSave);
        } else {
            // Guardar Manual (o editar)
            if (!formData.description || !formData.calories) {
                addToast('La descripción y las calorías son obligatorias.', 'error');
                return;
            }

            const dataToSave = {
                ...formData,
                calories: parseInt(formData.calories, 10) || 0,
                protein_g: parseFloat(formData.protein_g) || 0,
                carbs_g: parseFloat(formData.carbs_g) || 0,
                fats_g: parseFloat(formData.fats_g) || 0,
                weight_g: parseFloat(formData.weight_g) || null,
            };
            
            if (saveAsFavorite) {
                await addFavoriteMeal({ name: dataToSave.description, ...dataToSave });
            }

            onSave(dataToSave);
        }
    };

    // --- FUNCIONES UTILITARIAS ---
    const round = (val, d = 1) => { const n = parseFloat(val); return isNaN(n) ? 0 : Math.round(n * Math.pow(10, d)) / Math.pow(10, d); };
    const computeFromPer100 = (cal, p, c, f, g) => {
        const factor = (parseFloat(g) || 0) / 100;
        return {
            calories: Math.round((parseFloat(cal) || 0) * factor),
            protein_g: round((parseFloat(p) || 0) * factor),
            carbs_g: round((parseFloat(c) || 0) * factor),
            fats_g: round((parseFloat(f) || 0) * factor),
        };
    };

    // --- RENDERIZADO ---
    const mealTitles = { breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Snacks' };
    const title = `${logToEdit ? 'Editar' : 'Añadir en'} ${mealTitles[mealType]}`;
    
    const baseInputClasses = `w-full rounded-md px-3 py-2 text-text-primary bg-bg-secondary border-glass-border focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition`;

    return (
        <>
        {showScanner && <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />}
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-[fade-in_0.3s_ease-out]">
            <div className="bg-bg-primary rounded-2xl shadow-2xl w-full max-w-lg border border-glass-border transform transition-all duration-300 animate-[slide-up_0.4s_ease-out]">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-glass-border">
                    <h2 className="text-lg font-bold">{title}</h2>
                    <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-white/10 transition"><X size={20} /></button>
                </div>
                
                {/* Tabs (solo si no se está editando) */}
                {!logToEdit && (
                    <div className="p-2">
                        <div className="flex items-center justify-center gap-2 mx-auto p-1 rounded-full border border-glass-border bg-bg-secondary/30">
                            <TabButton active={view === 'favorites'} onClick={() => setView('favorites')}><BookMarked size={16} /> Favoritas</TabButton>
                            <TabButton active={view === 'manual'} onClick={() => setView('manual')}><Plus size={16} /> Manual</TabButton>
                            <TabButton active={false} onClick={() => setShowScanner(true)}><QrCode size={16} /> Escanear</TabButton>
                        </div>
                    </div>
                )}
                
                {/* Contenido del Modal */}
                <div className="px-4 py-2">
                {view === 'favorites' && !logToEdit && (
                    <div className="animate-[fade-in_0.3s]">
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                            <input type="text" placeholder="Buscar en favoritas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-bg-secondary border border-glass-border rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                        <div className="space-y-2 min-h-[250px] max-h-[45vh] overflow-y-auto pr-1">
                            {paginatedMeals.length > 0 ? paginatedMeals.map(meal => (
                                <FavoriteMealCard 
                                    key={meal.id} 
                                    meal={meal} 
                                    onSelect={handleToggleFavoriteSelection}
                                    isSelected={selectedMeals.some(m => m.id === meal.id)}
                                    onDelete={handleDeleteFavorite}
                                />
                            )) : <p className="text-center text-text-muted pt-10">No se encontraron comidas favoritas.</p>}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center pt-3 gap-4">
                                <button className="p-2 rounded-full hover:bg-white/10 disabled:opacity-50" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft size={16} /></button>
                                <span className="text-sm font-semibold text-text-secondary">{currentPage} / {totalPages}</span>
                                <button className="p-2 rounded-full hover:bg-white/10 disabled:opacity-50" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight size={16} /></button>
                            </div>
                        )}
                    </div>
                )}

                {view === 'manual' && (
                    <form onSubmit={handlePrimaryAction} className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto p-1 animate-[fade-in_0.3s]">
                        {/* Aquí va todo tu formulario de entrada manual sin cambios */}
                        <div><label className="block text-sm font-medium text-text-secondary mb-1">Descripción</label><input name="description" type="text" value={formData.description} onChange={handleChange} required className={baseInputClasses} /></div>
                        
                        <div className="flex items-center justify-between mt-2">
                             <label className="text-sm font-medium text-text-secondary">Calcular por 100g</label>
                             <label className="inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={per100Mode} onChange={(e) => setPer100Mode(e.target.checked)} />
                                <div className="w-10 h-6 rounded-full peer-checked:bg-accent bg-bg-secondary border-glass-border relative transition"><div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-bg-primary transition peer-checked:translate-x-4" /></div>
                             </label>
                        </div>

                        {!per100Mode ? (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-sm font-medium text-text-secondary mb-1">Calorías (kcal)</label><input name="calories" type="text" inputMode="decimal" value={formData.calories} onChange={handleChange} required className={baseInputClasses} /></div>
                                    <div><label className="block text-sm font-medium text-text-secondary mb-1">Gramos (opcional)</label><input name="weight_g" type="text" inputMode="decimal" value={formData.weight_g} onChange={handleChange} className={baseInputClasses} /></div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div><label className="block text-sm font-medium text-text-secondary mb-1">Proteínas (g)</label><input name="protein_g" type="text" inputMode="decimal" value={formData.protein_g} onChange={handleChange} className={baseInputClasses} /></div>
                                    <div><label className="block text-sm font-medium text-text-secondary mb-1">Carbs (g)</label><input name="carbs_g" type="text" inputMode="decimal" value={formData.carbs_g} onChange={handleChange} className={baseInputClasses} /></div>
                                    <div><label className="block text-sm font-medium text-text-secondary mb-1">Grasas (g)</label><input name="fats_g" type="text" inputMode="decimal" value={formData.fats_g} onChange={handleChange} className={baseInputClasses} /></div>
                                </div>
                            </>
                        ) : (
                             <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-sm font-medium text-text-secondary mb-1">Cal/100g</label><input name="calories100" type="text" inputMode="decimal" value={per100.calories100} onChange={handleChangePer100} className={baseInputClasses} /></div>
                                    <div><label className="block text-sm font-medium text-text-secondary mb-1">Gramos totales</label><input name="weight_g" type="text" inputMode="decimal" value={formData.weight_g} onChange={handleChange} className={baseInputClasses} /></div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div><label className="block text-sm font-medium text-text-secondary mb-1">Prot/100g</label><input name="protein100" type="text" inputMode="decimal" value={per100.protein100} onChange={handleChangePer100} className={baseInputClasses} /></div>
                                    <div><label className="block text-sm font-medium text-text-secondary mb-1">Carbs/100g</label><input name="carbs100" type="text" inputMode="decimal" value={per100.carbs100} onChange={handleChangePer100} className={baseInputClasses} /></div>
                                    <div><label className="block text-sm font-medium text-text-secondary mb-1">Grasas/100g</label><input name="fats100" type="text" inputMode="decimal" value={per100.fats100} onChange={handleChangePer100} className={baseInputClasses} /></div>
                                </div>
                                <div className="grid grid-cols-4 gap-2 mt-1">
                                    <div className="p-2 rounded-md border text-center bg-bg-secondary border-glass-border"><p className="text-xs text-text-muted">Cal</p><p className="font-semibold">{formData.calories || 0}</p></div>
                                    <div className="p-2 rounded-md border text-center bg-bg-secondary border-glass-border"><p className="text-xs text-text-muted">Prot</p><p className="font-semibold">{formData.protein_g || 0}</p></div>
                                    <div className="p-2 rounded-md border text-center bg-bg-secondary border-glass-border"><p className="text-xs text-text-muted">Carbs</p><p className="font-semibold">{formData.carbs_g || 0}</p></div>
                                    <div className="p-2 rounded-md border text-center bg-bg-secondary border-glass-border"><p className="text-xs text-text-muted">Grasas</p><p className="font-semibold">{formData.fats_g || 0}</p></div>
                                </div>
                            </>
                        )}
                        
                        {!logToEdit && (
                            <div className="rounded-lg p-3 bg-bg-secondary/50 border-glass-border border mt-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={saveAsFavorite} onChange={(e) => setSaveAsFavorite(e.target.checked)} className="w-4 h-4 accent-accent" />
                                    <span className="text-sm text-text-secondary">Guardar en favoritos</span>
                                </label>
                            </div>
                        )}
                    </form>
                )}
                </div>

                {/* Footer y botón de acción */}
                <div className="p-4 border-t border-glass-border bg-bg-secondary/30 rounded-b-2xl">
                    <button
                        onClick={handlePrimaryAction}
                        disabled={isLoading || (view === 'favorites' && selectedMeals.length === 0)}
                        className="w-full bg-accent text-bg-primary font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover:bg-accent-dark disabled:bg-gray-500 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-accent/50"
                    >
                        {isLoading ? <Spinner size={24} /> : (
                            <>
                                <PlusCircle size={20} />
                                <span>
                                    {view === 'favorites' 
                                        ? `Añadir ${selectedMeals.length > 0 ? `${selectedMeals.length} comida(s)` : ''}`
                                        : (logToEdit ? 'Guardar Cambios' : 'Añadir Comida')}
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
        </>
    );
};

export default NutritionLogModal;