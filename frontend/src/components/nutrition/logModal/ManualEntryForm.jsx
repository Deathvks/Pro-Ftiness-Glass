import React, { useCallback } from 'react'; // Importado useCallback
import { Save, Plus, Star, Check } from 'lucide-react'; // Eliminado ChevronsRight que no se usa aquí
import Spinner from '../../Spinner';
import { useToast } from '../../../hooks/useToast';

// Componente reutilizado para los inputs
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

// Componente para mostrar los macros calculados en modo por 100g
const CalculatedMacros = ({ formData }) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Cal</p><p className="font-semibold">{Math.round(formData.calories) || 0}</p></div>
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Prot</p><p className="font-semibold">{formData.protein_g || 0}</p></div>
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Carbs</p><p className="font-semibold">{formData.carbs_g || 0}</p></div>
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border"><p className="text-xs text-text-muted">Grasas</p><p className="font-semibold">{formData.fats_g || 0}</p></div>
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
    showFavoriteToggle,
    formState,
    onFormStateChange
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

    const validateAndGetData = useCallback(() => {
        const finalData = { ...formData };

        if (per100Mode && !isEditing && !editingListItem) {
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
            if (key !== 'description') {
                 if (key === 'weight_g') {
                    finalData[key] = parseFloat(finalData[key]) || null;
                 } else {
                    finalData[key] = parseFloat(finalData[key]) || 0;
                 }
            }
        });
        return finalData;
    }, [formData, per100Mode, isEditing, editingListItem, addToast]);

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

     const handleSaveAndClose = () => {
        const finalData = validateAndGetData();
        if (!finalData) return;
        const dataToSave = { ...finalData, name: finalData.description, saveAsFavorite: isFavorite };
        onSaveSingle([dataToSave]);
    };

    const baseInputClasses = "w-full bg-bg-primary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";

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
                        <InputField label="Cal/100g" name="calories" value={per100Data.calories} onChange={handlePer100Change} inputMode="decimal" required={per100Mode} />
                        <InputField label="Prot/100g" name="protein_g" value={per100Data.protein_g} onChange={handlePer100Change} inputMode="decimal" />
                        <InputField label="Carbs/100g" name="carbs_g" value={per100Data.carbs_g} onChange={handlePer100Change} inputMode="decimal" />
                        <InputField label="Grasas/100g" name="fats_g" value={per100Data.fats_g} onChange={handlePer100Change} inputMode="decimal" />
                    </div>
                    <div className="relative">
                        <InputField
                            label="Gramos totales a consumir"
                            name="weight_g"
                            value={formData.weight_g}
                            onChange={handleChange}
                            inputMode="decimal"
                            required={per100Mode}
                        />
                        {/* El icono ChevronsRight ya no es necesario aquí con los nuevos estilos */}
                    </div>
                    <CalculatedMacros formData={formData} />
                </>
            ) : (
                <>
                    <InputField label="Calorías (kcal)" name="calories" value={formData.calories} onChange={handleChange} inputMode="decimal" required />
                    <div className="grid grid-cols-3 gap-4">
                        <InputField label="Proteínas (g)" name="protein_g" value={formData.protein_g} onChange={handleChange} inputMode="decimal" />
                        <InputField label="Carbs (g)" name="carbs_g" value={formData.carbs_g} onChange={handleChange} inputMode="decimal" />
                        <InputField label="Grasas (g)" name="fats_g" value={formData.fats_g} onChange={handleChange} inputMode="decimal" />
                    </div>
                    <InputField label="Gramos totales (opcional)" name="weight_g" value={formData.weight_g} onChange={handleChange} inputMode="decimal" />
                </>
            )}

            {/* Botón Guardar en Favoritos */}
            {showFavoriteToggle && (
                // --- INICIO DE LA MODIFICACIÓN ---
                <button
                    type="button"
                    onClick={handleFavoriteChange}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all border
                        ${isFavorite
                            ? 'bg-accent-transparent text-accent border-accent-border' // Usa variables de acento
                            : 'bg-bg-primary text-text-secondary border-glass-border'
                        } mt-1`}
                >
                    <Star
                        size={18}
                        className={`transition-all ${isFavorite ? 'fill-accent' : ''}`} // Usa fill-accent
                    />
                    Guardar esta comida en favoritos
                </button>
                // --- FIN DE LA MODIFICACIÓN ---
            )}

            {/* Botones de Acción Final */}
            {isEditing ? (
                <button type="button" onClick={handleSaveEdited} disabled={isLoading} className="w-full flex items-center justify-center py-3 rounded-xl font-bold transition bg-accent text-white disabled:opacity-50 mt-2">
                    {isLoading ? <Spinner /> : <><Save size={18} className="mr-2" /> Guardar Cambios</>}
                </button>
            ) : editingListItem ? (
                <button type="button" onClick={handleUpdateListItem} disabled={isLoading} className="w-full flex items-center justify-center py-3 rounded-xl font-bold transition bg-accent text-white disabled:opacity-50 mt-2">
                    {isLoading ? <Spinner /> : <><Save size={18} className="mr-2" /> Actualizar Comida</>}
                </button>
            ) : (
                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <button type="button" onClick={handleAddToList} disabled={isLoading} className={`w-full flex items-center justify-center py-3 rounded-xl font-bold transition bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-50`}>
                        {isLoading ? <Spinner /> : <><Plus size={18} className="mr-2" /> Añadir a la lista</>}
                    </button>
                    <button type="button" onClick={handleSaveAndClose} disabled={isLoading} className={`w-full flex items-center justify-center py-3 rounded-xl font-bold transition bg-accent text-white dark:text-bg-secondary disabled:opacity-50`}>
                        {isLoading ? <Spinner /> : <><Check size={18} className="mr-2" /> Añadir y Guardar</>}
                    </button>
                </div>
            )}
        </form>
    );
};

export default ManualEntryForm;