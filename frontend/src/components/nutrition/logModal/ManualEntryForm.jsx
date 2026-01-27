/* frontend/src/components/nutrition/logModal/ManualEntryForm.jsx */
import React, { useCallback, useRef, useMemo } from 'react';
import { Save, Plus, Star, Check, Camera, X } from 'lucide-react';
import Spinner from '../../Spinner';
import { useToast } from '../../../hooks/useToast';
import useAppStore from '../../../store/useAppStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

const ImageUpload = ({ imageUrl, onImageUpload, isUploading }) => {
    const fileInputRef = useRef(null);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onImageUpload(file);
        }
    };

    const handleRemoveImage = (e) => {
        e.stopPropagation();
        onImageUpload(null);
    };

    return (
        <div className="mt-2">
            <label className="block text-sm font-medium text-text-secondary mb-2">Foto de la Comida (Opcional)</label>
            <div
                className="relative w-full h-40 bg-bg-primary border-2 border-dashed border-glass-border rounded-lg flex items-center justify-center cursor-pointer hover:border-accent transition-colors"
                onClick={handleImageClick}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                />
                {isUploading ? (
                    <Spinner />
                ) : imageUrl ? (
                    <>
                        <img
                            src={imageUrl.startsWith('http') || imageUrl.startsWith('blob:') ? imageUrl : `${BACKEND_BASE_URL}${imageUrl}`}
                            alt="Previsualización"
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                        <button
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5 text-white hover:bg-black/80 transition-opacity"
                        >
                            <X size={16} />
                        </button>
                    </>
                ) : (
                    <div className="text-center text-text-muted">
                        <Camera size={32} className="mx-auto" />
                        <p className="mt-1 text-sm">Añadir foto</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const InputField = ({ label, name, value, onChange, placeholder = '', inputMode = 'text', required = false, type = 'text', className = '' }) => (
    <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
        <input
            name={name}
            type={type}
            inputMode={inputMode}
            value={value}
            onChange={onChange}
            required={required}
            className={`w-full bg-bg-primary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition ${className}`}
            placeholder={placeholder}
        />
    </div>
);

const CalculatedMacros = ({ calories, protein, carbs, fats, sugars }) => (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-1">
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Cal</p><p className="font-semibold">{Math.round(calories) || 0}</p></div>
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Prot</p><p className="font-semibold">{protein || 0} g</p></div>
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Carbs</p><p className="font-semibold">{carbs || 0} g</p></div>
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Grasas</p><p className="font-semibold">{fats || 0} g</p></div>
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Azúcar</p><p className="font-semibold text-pink-500">{sugars || 0} g</p></div>
    </div>
);

const ManualEntryForm = ({
    onAddManual,
    onSaveSingle,
    onSaveEdit,
    onSaveListItem,
    isLoading,
    isEditing,
    editingListItem,
    formState,
    onFormStateChange,
    isUploading,
    onImageUpload,
    editingFavorite,
    isPer100g,
    setIsPer100g
}) => {
    const { addToast } = useToast();
    const { favoriteMeals, addXp } = useAppStore(state => ({
        favoriteMeals: state.favoriteMeals,
        addXp: state.addXp
    }));

    const { formData, per100Data, isFavorite } = formState;

    const isOriginallyFavorite = useMemo(() => {
        if (editingFavorite) return true;
        if (isEditing || editingListItem) {
            const originalName = (isEditing ? formState.originalDescription : editingListItem?.description)?.trim().toLowerCase();
            return originalName && favoriteMeals.some(fav => fav.name.toLowerCase() === originalName);
        }
        return false;
    }, [isEditing, editingListItem, editingFavorite, formState.originalDescription, favoriteMeals]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const normalizedValue = value.replace(',', '.');
        if (name === 'description' || /^\d*\.?\d*$/.test(normalizedValue)) {
            onFormStateChange({ ...formState, formData: { ...formData, [name]: normalizedValue } });
        }
    };

    const handlePer100Change = (e) => {
        const { name, value } = e.target;
        const normalizedValue = value.replace(',', '.');
        if (/^\d*\.?\d*$/.test(normalizedValue)) {
            onFormStateChange({ ...formState, per100Data: { ...per100Data, [name]: normalizedValue } });
        }
    };

    const handleFavoriteChange = () => {
        onFormStateChange({ ...formState, isFavorite: !isFavorite });
    };

    const handleImageUpdate = (fileOrNull) => {
        if (fileOrNull === null) {
            onFormStateChange({ ...formState, formData: { ...formData, image_url: null } });
        } else {
            onImageUpload(fileOrNull);
        }
    };

    const round = useCallback((val, d = 1) => {
        const n = parseFloat(val);
        return isNaN(n) ? '' : (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
    }, []);

    const calculatedMacros = useMemo(() => {
        if (isPer100g) {
            const weight = parseFloat(formData.weight_g) || 0;
            const factor = weight / 100;
            return {
                calories: (parseFloat(per100Data.calories) || 0) * factor,
                protein_g: round((parseFloat(per100Data.protein_g) || 0) * factor),
                carbs_g: round((parseFloat(per100Data.carbs_g) || 0) * factor),
                fats_g: round((parseFloat(per100Data.fats_g) || 0) * factor),
                sugars_g: round((parseFloat(per100Data.sugars_g) || 0) * factor),
            };
        } else {
            return {
                calories: parseFloat(formData.calories) || 0,
                protein_g: round(formData.protein_g),
                carbs_g: round(formData.carbs_g),
                fats_g: round(formData.fats_g),
                sugars_g: round(formData.sugars_g),
            };
        }
    }, [formData, per100Data, isPer100g, round]);

    const validateAndGetData = useCallback(() => {
        const finalData = {
            description: formData.description?.trim() || '',
            calories: calculatedMacros.calories,
            protein_g: calculatedMacros.protein_g,
            carbs_g: calculatedMacros.carbs_g,
            fats_g: calculatedMacros.fats_g,
            sugars_g: calculatedMacros.sugars_g,
            weight_g: formData.weight_g,
            image_url: formData.image_url,
        };

        const weight = parseFloat(finalData.weight_g) || 0;
        const calories = parseFloat(finalData.calories) || 0;

        if (!finalData.description) {
            addToast('La descripción es obligatoria.', 'error');
            return null;
        }

        if (isPer100g) {
            const cal100 = parseFloat(per100Data.calories);
            if (isNaN(weight) || weight <= 0) {
                addToast('Los gramos a consumir deben ser mayores a 0.', 'error');
                return null;
            }
            // AJUSTE: Permitimos 0 calorías, solo bloqueamos negativos
            if (isNaN(cal100) || cal100 < 0) {
                addToast('Las calorías por 100g no pueden ser negativas.', 'error');
                return null;
            }
        } else {
            // AJUSTE: Permitimos 0 calorías (para cantidades pequeñas o bebidas dietéticas)
            if (isNaN(calories) || calories < 0) {
                addToast('Las calorías no pueden ser negativas.', 'error');
                return null;
            }
            if (finalData.weight_g !== null && finalData.weight_g !== undefined && finalData.weight_g !== '' && (isNaN(weight) || weight <= 0)) {
                addToast('Los gramos totales, si se indican, deben ser mayores a 0.', 'error');
                return null;
            }
        }

        Object.keys(finalData).forEach(key => {
            if (key !== 'description' && key !== 'image_url') {
                if (key === 'weight_g') {
                    finalData[key] = (!isNaN(weight) && weight > 0) ? weight : null;
                } else {
                    const numericValue = parseFloat(finalData[key]);
                    finalData[key] = isNaN(numericValue) ? 0 : numericValue;
                }
            }
        });
        if (!finalData.image_url) {
            finalData.image_url = null;
        }

        return finalData;
    }, [formData, isPer100g, addToast, calculatedMacros, per100Data]);

    const getPer100Fields = () => ({
        calories_per_100g: isPer100g ? (parseFloat(per100Data.calories) || 0) : null,
        protein_per_100g: isPer100g ? (parseFloat(per100Data.protein_g) || 0) : null,
        carbs_per_100g: isPer100g ? (parseFloat(per100Data.carbs_g) || 0) : null,
        fat_per_100g: isPer100g ? (parseFloat(per100Data.fats_g) || 0) : null,
        sugars_per_100g: isPer100g ? (parseFloat(per100Data.sugars_g) || 0) : null,
    });

    const handleAddToList = () => {
        const finalData = validateAndGetData();
        if (!finalData) return;
        onAddManual({
            ...finalData,
            name: finalData.description,
            isFavorite,
            image_url: finalData.image_url,
            ...getPer100Fields(),
        });
    };

    const handleSaveEdited = () => {
        const finalData = validateAndGetData();
        if (!finalData) return;
        onSaveEdit({
            ...finalData,
            isFavorite,
            ...getPer100Fields()
        });
        addToast('Comida actualizada correctamente', 'success');
    };

    const handleUpdateListItem = () => {
        const finalData = validateAndGetData();
        if (!finalData) return;
        onSaveListItem({
            ...editingListItem,
            ...finalData,
            name: finalData.description,
            isFavorite,
            image_url: finalData.image_url,
            ...getPer100Fields()
        });
        addToast('Comida actualizada', 'success');
    };

    const handleSaveAndClose = () => {
        const finalData = validateAndGetData();
        if (!finalData) return;
        const dataToSave = {
            ...finalData,
            name: finalData.description,
            saveAsFavorite: isFavorite,
            image_url: formData.image_url,
            ...getPer100Fields(),
        };
        onSaveSingle([dataToSave]);

        if (addXp) addXp(15, 'Comida registrada');
        addToast('Comida guardada correctamente', 'success');
    };

    return (
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4 animate-[fade-in_0.3s] pt-2">
            <InputField
                label="Descripción"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Ej: Pechuga de pollo con arroz"
            />

            <ImageUpload
                imageUrl={formData.image_url}
                onImageUpload={handleImageUpdate}
                isUploading={isUploading}
            />

            {!editingFavorite && (
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text-secondary">Valores por 100g</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={isPer100g} onChange={(e) => setIsPer100g(e.target.checked)} />
                        <div className="w-10 h-6 bg-bg-primary rounded-full border border-glass-border peer-checked:bg-accent transition-colors"></div>
                        <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
                    </label>
                </div>
            )}

            {isPer100g ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <InputField label="Cal/100g" name="calories" value={per100Data.calories} onChange={handlePer100Change} inputMode="decimal" required={isPer100g} />
                        <InputField label="Prot/100g" name="protein_g" value={per100Data.protein_g} onChange={handlePer100Change} inputMode="decimal" />
                        <InputField label="Carbs/100g" name="carbs_g" value={per100Data.carbs_g} onChange={handlePer100Change} inputMode="decimal" />
                        <InputField label="Grasas/100g" name="fats_g" value={per100Data.fats_g} onChange={handlePer100Change} inputMode="decimal" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <InputField label="Azúcar/100g" name="sugars_g" value={per100Data.sugars_g} onChange={handlePer100Change} inputMode="decimal" />
                    </div>

                    <div className="relative mt-2">
                        <InputField
                            label="Gramos totales a consumir"
                            name="weight_g"
                            value={formData.weight_g}
                            onChange={handleChange}
                            inputMode="decimal"
                            required={isPer100g}
                        />
                    </div>
                    <CalculatedMacros
                        calories={calculatedMacros.calories}
                        protein={calculatedMacros.protein_g}
                        carbs={calculatedMacros.carbs_g}
                        fats={calculatedMacros.fats_g}
                        sugars={calculatedMacros.sugars_g}
                    />
                </>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4">
                         <InputField label="Calorías (kcal)" name="calories" value={formData.calories} onChange={handleChange} inputMode="decimal" required />
                         <InputField label="Gramos totales (opc)" name="weight_g" value={formData.weight_g} onChange={handleChange} inputMode="decimal" />
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <InputField label="Proteínas (g)" name="protein_g" value={formData.protein_g} onChange={handleChange} inputMode="decimal" />
                        <InputField label="Carbs (g)" name="carbs_g" value={formData.carbs_g} onChange={handleChange} inputMode="decimal" />
                        <InputField label="Grasas (g)" name="fats_g" value={formData.fats_g} onChange={handleChange} inputMode="decimal" />
                        <InputField label="Azúcar (g)" name="sugars_g" value={formData.sugars_g} onChange={handleChange} inputMode="decimal" />
                    </div>
                </>
            )}

            <button
                type="button"
                onClick={handleFavoriteChange}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all border
                    ${isFavorite
                        ? 'bg-accent-transparent text-accent border-accent-border'
                        : 'bg-bg-primary text-text-secondary border-glass-border'
                    } mt-1`}
            >
                <Star
                    size={18}
                    className={`transition-all ${isFavorite ? 'fill-accent' : ''}`}
                />
                {isFavorite
                    ? (isOriginallyFavorite ? 'Actualizar favorito' : 'Guardar en favoritos')
                    : (isOriginallyFavorite ? 'Eliminar de favoritos' : 'Guardar en favoritos')
                }
            </button>

            {isEditing || editingFavorite ? (
                <button type="button" onClick={handleSaveEdited} disabled={isLoading || isUploading} className="w-full flex items-center justify-center py-3 rounded-xl font-bold transition bg-accent text-white dark:text-bg-secondary disabled:opacity-50 mt-2">
                    {isLoading || isUploading ? <Spinner /> : <><Save size={18} className="mr-2" /> Guardar Cambios</>}
                </button>
            ) : editingListItem ? (
                <button type="button" onClick={handleUpdateListItem} disabled={isLoading || isUploading} className="w-full flex items-center justify-center py-3 rounded-xl font-bold transition bg-accent text-white dark:text-bg-secondary disabled:opacity-50 mt-2">
                    {isLoading || isUploading ? <Spinner /> : <><Save size={18} className="mr-2" /> Actualizar Comida</>}
                </button>
            ) : (
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <button type="button" onClick={handleAddToList} disabled={isLoading || isUploading} className={`w-full flex items-center justify-center py-3 rounded-xl font-bold transition bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-50`}>
                        {isLoading || isUploading ? <Spinner /> : <><Plus size={18} className="mr-2" /> Añadir a la lista</>}
                    </button>
                    <button type="button" onClick={handleSaveAndClose} disabled={isLoading || isUploading} className={`w-full flex items-center justify-center py-3 rounded-xl font-bold transition bg-accent text-white dark:text-bg-secondary disabled:opacity-50`}>
                        {isLoading || isUploading ? <Spinner /> : <><Check size={18} className="mr-2" /> Añadir y Guardar</>}
                    </button>
                </div>
            )}
        </form>
    );
};

export default ManualEntryForm;