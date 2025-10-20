/* frontend/src/components/NutritionLogModal.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { X, BookMarked, Plus, Trash2, ChevronLeft, ChevronRight, CheckCircle, Search, PlusCircle, QrCode } from 'lucide-react';
import * as nutritionService from '../services/nutritionService';
import BarcodeScanner from './BarcodeScanner'; // Importamos el nuevo componente
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
    const [baseMacros, setBaseMacros] = useState(null); // { calories: perGram, protein_g: perGram, ... }
    // --- INICIO DE LA MODIFICACIÓN (No es un error, solo una aclaración) ---
    // Mantenemos originalData para saber si el 'logToEdit' venía de un favorito con peso base
    const [originalData, setOriginalData] = useState(null);
    // --- FIN DE LA MODIFICACIÓN ---

    // Estados para la selección múltiple
    const [selectedMeals, setSelectedMeals] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [showScanner, setShowScanner] = useState(false);

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
            setOriginalData(initialData); // Guardamos los datos originales

            // Intenta encontrar si esta entrada coincide con un favorito por nombre
            const favoriteMatch = favoriteMeals.find(
                (meal) => meal.name && (meal.name.toLowerCase().trim() === (logToEdit.description || '').toLowerCase().trim())
            );

            // --- INICIO DE LA MODIFICACIÓN ---
            // Calcula baseMacros si la entrada original tenía peso O si coincide con un favorito que tenía peso
            const originalWeight = parseFloat(logToEdit.weight_g);
            const favoriteWeight = parseFloat(favoriteMatch?.weight_g);

            if (!isNaN(originalWeight) && originalWeight > 0) {
                // Si la entrada original tiene peso, calcula baseMacros a partir de ella
                setBaseMacros({
                    calories: (parseFloat(logToEdit.calories) || 0) / originalWeight,
                    protein_g: (parseFloat(logToEdit.protein_g) || 0) / originalWeight,
                    carbs_g: (parseFloat(logToEdit.carbs_g) || 0) / originalWeight,
                    fats_g: (parseFloat(logToEdit.fats_g) || 0) / originalWeight,
                });
            } else if (favoriteMatch && !isNaN(favoriteWeight) && favoriteWeight > 0) {
                 // Si no tenía peso pero coincide con un favorito que sí, usa el favorito como base
                 setBaseMacros({
                    calories: (parseFloat(favoriteMatch.calories) || 0) / favoriteWeight,
                    protein_g: (parseFloat(favoriteMatch.protein_g) || 0) / favoriteWeight,
                    carbs_g: (parseFloat(favoriteMatch.carbs_g) || 0) / favoriteWeight,
                    fats_g: (parseFloat(favoriteMatch.fats_g) || 0) / favoriteWeight,
                });
                // Rellenar formData con los datos del favorito si la entrada original no tenía macros
                if (!initialData.calories && !initialData.protein_g && !initialData.carbs_g && !initialData.fats_g) {
                    setFormData(prev => ({
                        ...prev,
                        calories: favoriteMatch.calories || '',
                        protein_g: favoriteMatch.protein_g || '',
                        carbs_g: favoriteMatch.carbs_g || '',
                        fats_g: favoriteMatch.fats_g || '',
                    }));
                }
            } else {
                 // Si no hay peso original ni favorito con peso, no podemos calcular baseMacros
                 setBaseMacros(null);
            }
            // --- FIN DE LA MODIFICACIÓN ---
        }
    }, [logToEdit, favoriteMeals]); // Dependencias originales

    // Recalcular macros cuando cambia el peso (para favoritos y edición)
    useEffect(() => {
        // --- INICIO DE LA MODIFICACIÓN ---
        // Se ejecuta si tenemos baseMacros y estamos en la vista manual (sea creando o editando)
        if (baseMacros && view === 'manual') {
        // --- FIN DE LA MODIFICACIÓN ---
            const newWeight = parseFloat(formData.weight_g) || 0;
            // Solo actualiza si el peso ha cambiado respecto al original O si no estamos editando
            // O si la descripción coincide con la original (evita recalcular si se cambió descripción y luego peso)
            if (!logToEdit || formData.weight_g !== originalData?.weight_g || formData.description === originalData?.description) {
                setFormData(prev => ({
                    ...prev,
                    calories: Math.round(baseMacros.calories * newWeight),
                    protein_g: round(baseMacros.protein_g * newWeight),
                    carbs_g: round(baseMacros.carbs_g * newWeight),
                    fats_g: round(baseMacros.fats_g * newWeight),
                }));
            }
        }
    // --- INICIO DE LA MODIFICACIÓN ---
    // Añadimos logToEdit y originalData a las dependencias
    }, [formData.weight_g, baseMacros, view, logToEdit, originalData]);
    // --- FIN DE LA MODIFICACIÓN ---

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
        const tempLoadingToastId = addToast('Buscando producto...', 'info');
        try {
            const product = await nutritionService.searchByBarcode(barcode);
            const weightG = product.weight_g || 100; // Usar 100g como fallback si no viene de la API
            setFormData({
                description: product.name,
                calories: Math.round(product.calories),
                protein_g: round(product.protein_g),
                carbs_g: round(product.carbs_g),
                fats_g: round(product.fats_g),
                weight_g: String(weightG), // Establecer el peso por defecto (ej: 100)
            });
            // Rellenar también los datos por 100g para el modo cálculo
            setPer100({
                calories100: String(product.calories),
                protein100: String(product.protein_g),
                carbs100: String(product.carbs_g),
                fats100: String(product.fats_g),
            });
            // Activar modo por 100g y calcular baseMacros
            setPer100Mode(true);
            if (weightG > 0) {
                 setBaseMacros({
                    calories: (parseFloat(product.calories) || 0) / weightG,
                    protein_g: (parseFloat(product.protein_g) || 0) / weightG,
                    carbs_g: (parseFloat(product.carbs_g) || 0) / weightG,
                    fats_g: (parseFloat(product.fats_g) || 0) / weightG,
                 });
            } else {
                 setBaseMacros(null);
            }
            setView('manual'); // Cambiar a la vista manual
            addToast('Producto encontrado. Ajusta los gramos si es necesario.', 'success');
        } catch (error) {
            addToast(error.message || 'No se pudo encontrar el producto.', 'error');
        } finally {
            // Aquí podrías cerrar el toast de carga si guardaste su ID
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
            setBaseMacros(null); // No podemos calcular si el favorito no tiene peso
        }
        // Rellenar el formulario con los datos del favorito
        setFormData({
            description: meal.name,
            calories: meal.calories || '',
            protein_g: meal.protein_g || '',
            carbs_g: meal.carbs_g || '',
            fats_g: meal.fats_g || '',
            weight_g: meal.weight_g || '', // Usar el peso del favorito o vacío
        });
        setPer100Mode(false); // Desactivar modo por 100g al seleccionar favorito
        setView('manual'); // Cambiar a la vista manual
    };


    const handleDeleteFavorite = async (mealId) => {
        const result = await deleteFavoriteMeal(mealId);
        addToast(result.message, result.success ? 'success' : 'error');
        setSelectedMeals(prev => prev.filter(m => m.id !== mealId));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const isNumeric = ['calories', 'protein_g', 'carbs_g', 'fats_g', 'weight_g'].includes(name);

        // Permitir solo números y un punto decimal para campos numéricos
        if (isNumeric && !/^\d*\.?\d*$/.test(value)) return;

        // --- INICIO DE LA MODIFICACIÓN ---
        // No limpiar baseMacros si estamos editando,
        // excepto si se cambia la descripción (porque ya no coincidiría con el favorito original)
        if (baseMacros && name !== 'weight_g' && (name === 'description' || !logToEdit)) {
            setBaseMacros(null);
        }
        // --- FIN DE LA MODIFICACIÓN ---

        setFormData(prev => ({ ...prev, [name]: value }));
    };


    const handleChangePer100 = (e) => {
        const { name, value } = e.target;
        // Permitir solo números y un punto decimal
        if (!/^\d*\.?\d*$/.test(value)) return;
        setPer100(prev => ({ ...prev, [name]: value }));
        // Al cambiar valores por 100g, limpiamos baseMacros porque ya no aplican
        setBaseMacros(null);
    };

    // Handler para el botón principal de acción
    const handlePrimaryAction = async (e) => {
        e.preventDefault();
        if (view === 'favorites') {
            if (selectedMeals.length === 0) return;
            const mealsToSave = selectedMeals.map(meal => ({
                description: meal.name, calories: meal.calories, protein_g: meal.protein_g,
                carbs_g: meal.carbs_g, fats_g: meal.fats_g, weight_g: meal.weight_g,
            }));
            onSave(mealsToSave); // onSave maneja el envío de array o objeto
        } else { // view === 'manual'
            if (!formData.description || !formData.calories) {
                addToast('La descripción y las calorías son obligatorias.', 'error');
                return;
            }
            const dataToSave = {
                ...formData,
                // Asegurar conversión a números o null para weight_g
                calories: parseInt(formData.calories, 10) || 0,
                protein_g: parseFloat(formData.protein_g) || 0,
                carbs_g: parseFloat(formData.carbs_g) || 0,
                fats_g: parseFloat(formData.fats_g) || 0,
                weight_g: parseFloat(formData.weight_g) || null,
            };

            if (saveAsFavorite && !logToEdit) { // Solo guardar como favorito al crear, no al editar
                // Verificar si ya existe un favorito con ese nombre antes de guardar
                const existingFavorite = favoriteMeals.find(f => f.name.toLowerCase() === dataToSave.description.toLowerCase());
                if (!existingFavorite) {
                    await addFavoriteMeal({ name: dataToSave.description, ...dataToSave });
                    addToast(`'${dataToSave.description}' guardado en favoritos.`, 'success');
                } else {
                    addToast(`Ya existe un favorito llamado '${dataToSave.description}'.`, 'info');
                }
            }
            // Pasamos el ID si estamos editando
            onSave(logToEdit ? { ...dataToSave, id: logToEdit.id } : dataToSave);
        }
    };


    // --- FUNCIONES UTILITARIAS ---
    const round = (val, d = 1) => { const n = parseFloat(val); return isNaN(n) ? '' : (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); };
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

    const baseInputClasses = `w-full rounded-md px-3 py-2 text-text-primary bg-bg-secondary border border-glass-border focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition`;

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
                        <div><label className="block text-sm font-medium text-text-secondary mb-1">Descripción</label><input name="description" type="text" value={formData.description} onChange={handleChange} required className={baseInputClasses} /></div>

                         {!logToEdit && ( // No mostrar opción por 100g al editar
                            <div className="flex items-center justify-between mt-2">
                                <label className="text-sm font-medium text-text-secondary">Calcular por 100g</label>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={per100Mode} onChange={(e) => setPer100Mode(e.target.checked)} />
                                    <div className="w-10 h-6 rounded-full peer-checked:bg-accent bg-bg-secondary border border-glass-border relative transition"><div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-bg-primary transition peer-checked:translate-x-4" /></div>
                                </label>
                            </div>
                         )}

                        {per100Mode && !logToEdit ? ( // Modo por 100g solo al crear
                             <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-sm font-medium text-text-secondary mb-1">Cal/100g</label><input name="calories100" type="text" inputMode="decimal" value={per100.calories100} onChange={handleChangePer100} className={baseInputClasses} required={per100Mode}/></div>
                                    <div><label className="block text-sm font-medium text-text-secondary mb-1">Gramos totales</label><input name="weight_g" type="text" inputMode="decimal" value={formData.weight_g} onChange={handleChange} className={baseInputClasses} required={per100Mode}/></div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div><label className="block text-sm font-medium text-text-secondary mb-1">Prot/100g</label><input name="protein100" type="text" inputMode="decimal" value={per100.protein100} onChange={handleChangePer100} className={baseInputClasses} /></div>
                                    <div><label className="block text-sm font-medium text-text-secondary mb-1">Carbs/100g</label><input name="carbs100" type="text" inputMode="decimal" value={per100.carbs100} onChange={handleChangePer100} className={baseInputClasses} /></div>
                                    <div><label className="block text-sm font-medium text-text-secondary mb-1">Grasas/100g</label><input name="fats100" type="text" inputMode="decimal" value={per100.fats100} onChange={handleChangePer100} className={baseInputClasses} /></div>
                                </div>
                                {/* Resumen calculado */}
                                <div className="grid grid-cols-4 gap-2 mt-1">
                                    <div className="p-2 rounded-md border text-center bg-bg-secondary/50 border-glass-border"><p className="text-xs text-text-muted">Cal</p><p className="font-semibold">{formData.calories || 0}</p></div>
                                    <div className="p-2 rounded-md border text-center bg-bg-secondary/50 border-glass-border"><p className="text-xs text-text-muted">Prot</p><p className="font-semibold">{formData.protein_g || 0}</p></div>
                                    <div className="p-2 rounded-md border text-center bg-bg-secondary/50 border-glass-border"><p className="text-xs text-text-muted">Carbs</p><p className="font-semibold">{formData.carbs_g || 0}</p></div>
                                    <div className="p-2 rounded-md border text-center bg-bg-secondary/50 border-glass-border"><p className="text-xs text-text-muted">Grasas</p><p className="font-semibold">{formData.fats_g || 0}</p></div>
                                </div>
                            </>
                        ) : ( // Modo normal (creando o editando)
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
                        )}

                        {!logToEdit && ( // Opción de guardar como favorito solo al crear
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