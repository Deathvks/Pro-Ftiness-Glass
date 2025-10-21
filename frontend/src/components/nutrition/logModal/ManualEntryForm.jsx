/* frontend/src/components/nutrition/logModal/ManualEntryForm.jsx */
import React, { useCallback, useRef, useMemo } from 'react'; // <--- CORRECCIÓN AQUÍ
import { Save, Plus, Star, Check, Camera, X } from 'lucide-react';
import Spinner from '../../Spinner';
import { useToast } from '../../../hooks/useToast';
import useAppStore from '../../../store/useAppStore'; // Importar useAppStore

const ImageUpload = ({ imageUrl, onImageUpload, isUploading }) => {
    // ... (código existente del componente ImageUpload sin cambios) ...
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
                        {/* --- INICIO DE LA MODIFICACIÓN --- */}
                        {/* Cambiamos object-cover a object-contain y aseguramos que la imagen se centre y no se recorte */}
                        <img src={imageUrl} alt="Previsualización de la comida" className="max-w-full max-h-full object-contain rounded-lg" />
                        {/* --- FIN DE LA MODIFICACIÓN --- */}
                        <button
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5 text-white hover:bg-black/80 transition-opacity"
                            aria-label="Eliminar imagen"
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
    // ... (código existente del componente InputField sin cambios) ...
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

const CalculatedMacros = ({ formData }) => (
    // ... (código existente del componente CalculatedMacros sin cambios) ...
     <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Cal</p><p className="font-semibold">{Math.round(formData.calories) || 0}</p></div>
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Prot</p><p className="font-semibold">{formData.protein_g || 0}</p></div>
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Carbs</p><p className="font-semibold">{formData.carbs_g || 0} g</p></div>
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Grasas</p><p className="font-semibold">{formData.fats_g || 0} g</p></div>
    </div>
);

const ManualEntryForm = ({
    onAddManual,
    onSaveSingle,
    onSaveEdit,
    onSaveListItem,
    isLoading,
    isEditing, // Indica si se está editando un log existente
    editingListItem, // Indica si se está editando un item de la lista temporal
    showFavoriteToggle, // DEPRECATED: Ya no se usa directamente
    formState,
    onFormStateChange,
    isUploading,
    onImageUpload,
    editingFavorite // Prop que indica si se edita un favorito directamente
}) => {
    const { addToast } = useToast();
    // --- INICIO DE LA MODIFICACIÓN ---
    // 1. Obtener la lista de favoritos del store
    const favoriteMeals = useAppStore(state => state.favoriteMeals);
    // --- FIN DE LA MODIFICACIÓN ---
    const { formData, per100Data, per100Mode, isFavorite } = formState;

    // --- INICIO DE LA MODIFICACIÓN ---
    // 2. Determinar si la comida actual ya es un favorito
    const isAlreadyFavorite = useMemo(() => {
        // Si estamos editando un favorito directamente, ya lo es
        if (editingFavorite) return true;
        // Si estamos editando un log o un item de la lista temporal, buscamos por nombre
        if (isEditing || editingListItem) {
            const currentName = formData.description?.trim().toLowerCase();
            return currentName && favoriteMeals.some(fav => fav.name.toLowerCase() === currentName);
        }
        // Si estamos creando, no es favorito aún (a menos que el usuario marque la casilla)
        return false;
    }, [isEditing, editingListItem, editingFavorite, formData.description, favoriteMeals]);

    // 3. Determinar si mostrar el botón/checkbox "Guardar en favoritos"
    // - No mostrar si estamos editando un favorito directamente.
    // - No mostrar si la comida ya está en favoritos (basado en el nombre).
    // - Mostrar si estamos creando, editando un log, o editando un item temporal Y no está ya en favoritos.
    const shouldShowFavoriteOption = !editingFavorite && !isAlreadyFavorite;
    // --- FIN DE LA MODIFICACIÓN ---

    // ... (resto de funciones handleChange, handlePer100Change, etc., sin cambios) ...
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

    const handleImageUpdate = (fileOrNull) => {
        if (fileOrNull === null) {
            onFormStateChange({ ...formState, formData: { ...formData, image_url: null } });
        } else {
            onImageUpload(fileOrNull);
        }
    };

    const validateAndGetData = useCallback(() => {
        const finalData = { ...formData };

        if (per100Mode && !isEditing && !editingListItem && !editingFavorite) { // Añadido !editingFavorite
            const weight = parseFloat(finalData.weight_g) || 0;
            if (weight === 0) {
                addToast('Los gramos a consumir son obligatorios en el modo por 100g.', 'error');
                return null;
            }
        }

        if (!finalData.description || String(finalData.calories).trim() === '') {
            addToast('La descripción y las calorías son obligatorias.', 'error');
            return null;
        }

        Object.keys(finalData).forEach(key => {
            if (key !== 'description' && key !== 'image_url') {
                 if (key === 'weight_g') {
                    finalData[key] = parseFloat(finalData[key]) || null;
                 } else {
                    finalData[key] = parseFloat(finalData[key]) || 0;
                 }
            }
        });
        return finalData;
    }, [formData, per100Mode, isEditing, editingListItem, editingFavorite, addToast]); // Añadido editingFavorite

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
        // Pasamos el estado actual de isFavorite (controlado por la checkbox)
        onSaveListItem({ ...editingListItem, ...finalData, name: finalData.description, isFavorite });
    };

     const handleSaveAndClose = () => {
        const finalData = validateAndGetData();
        if (!finalData) return;
        // Pasamos el estado actual de isFavorite
        const dataToSave = { ...finalData, name: finalData.description, saveAsFavorite: isFavorite, image_url: formData.image_url };
        onSaveSingle([dataToSave]);
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

            {/* Modo por 100g (solo al crear) */}
            {!isEditing && !editingListItem && !editingFavorite && (
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text-secondary">Valores por 100g</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={per100Mode} onChange={handlePer100ModeChange} />
                        <div className="w-10 h-6 bg-bg-primary rounded-full border border-glass-border peer-checked:bg-accent transition-colors"></div>
                        <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4"></div>
                    </label>
                </div>
            )}

            {/* Campos de Macros (condicionales) */}
            {per100Mode && !isEditing && !editingListItem && !editingFavorite ? (
                <>
                    {/* Campos por 100g */}
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Cal/100g" name="calories" value={per100Data.calories} onChange={handlePer100Change} inputMode="decimal" required={per100Mode} />
                        <InputField label="Prot/100g" name="protein_g" value={per100Data.protein_g} onChange={handlePer100Change} inputMode="decimal" />
                        <InputField label="Carbs/100g" name="carbs_g" value={per100Data.carbs_g} onChange={handlePer100Change} inputMode="decimal" />
                        <InputField label="Grasas/100g" name="fats_g" value={per100Data.fats_g} onChange={handlePer100Change} inputMode="decimal" />
                    </div>
                    {/* Campo de Gramos Totales */}
                    <div className="relative">
                        <InputField
                            label="Gramos totales a consumir"
                            name="weight_g"
                            value={formData.weight_g}
                            onChange={handleChange}
                            inputMode="decimal"
                            required={per100Mode}
                        />
                    </div>
                    {/* Macros Calculados */}
                    <CalculatedMacros formData={formData} />
                </>
            ) : (
                <>
                    {/* Campos Totales */}
                    <InputField label="Calorías (kcal)" name="calories" value={formData.calories} onChange={handleChange} inputMode="decimal" required />
                    <div className="grid grid-cols-3 gap-4">
                        <InputField label="Proteínas (g)" name="protein_g" value={formData.protein_g} onChange={handleChange} inputMode="decimal" />
                        <InputField label="Carbs (g)" name="carbs_g" value={formData.carbs_g} onChange={handleChange} inputMode="decimal" />
                        <InputField label="Grasas (g)" name="fats_g" value={formData.fats_g} onChange={handleChange} inputMode="decimal" />
                    </div>
                    <InputField label="Gramos totales (opcional)" name="weight_g" value={formData.weight_g} onChange={handleChange} inputMode="decimal" />
                </>
            )}

            {/* --- INICIO DE LA MODIFICACIÓN --- */}
            {/* 4. Mostrar el botón/checkbox solo si shouldShowFavoriteOption es true */}
            {shouldShowFavoriteOption && (
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
                    Guardar esta comida en favoritos
                </button>
            )}
             {/* --- FIN DE LA MODIFICACIÓN --- */}


            {/* Botones de acción (condicionales según el modo) */}
            {isEditing || editingFavorite ? ( // Editando log o favorito
                <button type="button" onClick={handleSaveEdited} disabled={isLoading || isUploading} className="w-full flex items-center justify-center py-3 rounded-xl font-bold transition bg-accent text-white disabled:opacity-50 mt-2">
                    {isLoading || isUploading ? <Spinner /> : <><Save size={18} className="mr-2" /> Guardar Cambios</>}
                </button>
            ) : editingListItem ? ( // Editando item de la lista temporal
                <button type="button" onClick={handleUpdateListItem} disabled={isLoading || isUploading} className="w-full flex items-center justify-center py-3 rounded-xl font-bold transition bg-accent text-white disabled:opacity-50 mt-2">
                    {isLoading || isUploading ? <Spinner /> : <><Save size={18} className="mr-2" /> Actualizar Comida</>}
                </button>
            ) : ( // Creando nuevo item
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