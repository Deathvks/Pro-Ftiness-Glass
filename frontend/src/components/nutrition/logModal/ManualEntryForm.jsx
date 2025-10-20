import React, { useState, useEffect, useCallback } from 'react';
import { Save, Plus, Star, Check, ChevronsRight } from 'lucide-react';
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
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border">
            <p className="text-xs text-text-muted">Calorías</p>
            <p className="font-semibold text-text-primary">{Math.round(formData.calories) || 0} kcal</p>
        </div>
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border">
            <p className="text-xs text-text-muted">Proteínas</p>
            <p className="font-semibold text-text-primary">{formData.protein_g || 0} g</p>
        </div>
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border">
            <p className="text-xs text-text-muted">Carbs</p>
            <p className="font-semibold text-text-primary">{formData.carbs_g || 0} g</p>
        </div>
        <div className="p-2 rounded-md border text-center bg-bg-primary border-glass-border">
            <p className="text-xs text-text-muted">Grasas</p>
            <p className="font-semibold text-text-primary">{formData.fats_g || 0} g</p>
        </div>
    </div>
);

const ManualEntryForm = ({
    onAddManual, // Función para añadir a la lista temporal
    onSaveSingle, // Función para añadir y cerrar modal
    onSaveEdit, // Función para guardar cambios al editar log existente
    onSaveListItem, // Función para guardar cambios al editar item de la lista temporal
    isLoading,
    isEditing, // True si se está editando un log existente de la BD
    editingListItem, // El item de la lista temporal que se está editando
    showFavoriteToggle, // True si se debe mostrar el botón de guardar favorito
    formState, // Estado actual del formulario { formData, per100Data, per100Mode, isFavorite }
    onFormStateChange // Función para actualizar el estado del formulario
}) => {
    const { addToast } = useToast();
    const { formData, per100Data, per100Mode, isFavorite } = formState;

    // Redondear valores
    const round = (val, decimals = 1) => {
        const n = parseFloat(val);
        return isNaN(n) ? '' : (Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals);
    };

    // Manejar cambios en los inputs principales
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Permite solo descripción o números/decimales
        if (name === 'description' || /^\d*\.?\d*$/.test(value)) {
            onFormStateChange({ ...formState, formData: { ...formData, [name]: value } });
        }
    };

    // Manejar cambios en los inputs de "por 100g"
    const handlePer100Change = (e) => {
        const { name, value } = e.target;
        if (/^\d*\.?\d*$/.test(value)) {
            onFormStateChange({ ...formState, per100Data: { ...per100Data, [name]: value } });
        }
    };

    // Cambiar entre modo manual y por 100g
    const handlePer100ModeChange = (e) => {
        onFormStateChange({ ...formState, per100Mode: e.target.checked });
    };

    // Marcar/desmarcar como favorito
    const handleFavoriteChange = () => {
        onFormStateChange({ ...formState, isFavorite: !isFavorite });
    };

    // Validar y obtener datos finales
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

        // Convertir campos numéricos a números o 0/null
        Object.keys(finalData).forEach(key => {
            if (key !== 'description') {
                 if (key === 'weight_g') {
                    finalData[key] = parseFloat(finalData[key]) || null; // weight_g puede ser null
                 } else {
                    finalData[key] = parseFloat(finalData[key]) || 0; // Otros macros/calorías son 0 si no se especifican
                 }
            }
        });
        return finalData;
    }, [formData, per100Mode, isEditing, editingListItem, addToast]);

    // Acción: Añadir a la lista temporal
    const handleAddToList = () => {
        const finalData = validateAndGetData();
        if (!finalData) return;
        // Pasa los datos validados y el estado de 'isFavorite'
        onAddManual({ name: finalData.description, isFavorite, ...finalData });
    };

    // Acción: Guardar edición de log existente
    const handleSaveEdited = () => {
        const finalData = validateAndGetData();
        if (!finalData) return;
        onSaveEdit(finalData); // onSaveEdit ya tiene el ID del log
    };

    // Acción: Actualizar item en la lista temporal
    const handleUpdateListItem = () => {
        const finalData = validateAndGetData();
        if (!finalData) return;
        // Combina el item original con los datos actualizados y el estado de 'isFavorite'
        onSaveListItem({ ...editingListItem, ...finalData, name: finalData.description, isFavorite });
    };

    // Acción: Guardar comida única y cerrar modal
     const handleSaveAndClose = () => {
        const finalData = validateAndGetData();
        if (!finalData) return;
        // Pasa los datos validados y el estado de 'saveAsFavorite'
        const dataToSave = { ...finalData, name: finalData.description, saveAsFavorite: isFavorite };
        onSaveSingle([dataToSave]); // onSaveSingle espera un array
    };


    // Clases CSS reutilizables
    const baseInputClasses = "w-full bg-bg-primary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";

    return (
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4 animate-[fade-in_0.3s] pt-2">
            {/* Input de Descripción */}
            <InputField
                label="Descripción"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Ej: Pechuga de pollo con arroz"
            />

            {/* Toggle "Valores por 100g" (solo si no se edita) */}
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

            {/* Renderizado condicional: Modo por 100g o Modo Manual */}
            {per100Mode && !isEditing && !editingListItem ? (
                <>
                    {/* Inputs para valores por 100g */}
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Cal/100g" name="calories" value={per100Data.calories} onChange={handlePer100Change} inputMode="decimal" required={per100Mode} />
                        <InputField label="Prot/100g" name="protein_g" value={per100Data.protein_g} onChange={handlePer100Change} inputMode="decimal" />
                        <InputField label="Carbs/100g" name="carbs_g" value={per100Data.carbs_g} onChange={handlePer100Change} inputMode="decimal" />
                        <InputField label="Grasas/100g" name="fats_g" value={per100Data.fats_g} onChange={handlePer100Change} inputMode="decimal" />
                    </div>
                    {/* Input para gramos totales */}
                    <div className="relative">
                        <InputField
                            label="Gramos totales a consumir"
                            name="weight_g"
                            value={formData.weight_g}
                            onChange={handleChange}
                            inputMode="decimal"
                            required={per100Mode}
                        />
                        <ChevronsRight size={20} className="absolute right-3 bottom-3 text-accent pointer-events-none" />
                    </div>
                    {/* Macros calculados */}
                    <CalculatedMacros formData={formData} />
                </>
            ) : (
                <>
                    {/* Inputs para valores totales */}
                    <InputField label="Calorías (kcal)" name="calories" value={formData.calories} onChange={handleChange} inputMode="decimal" required />
                    <div className="grid grid-cols-3 gap-4">
                        <InputField label="Proteínas (g)" name="protein_g" value={formData.protein_g} onChange={handleChange} inputMode="decimal" />
                        <InputField label="Carbs (g)" name="carbs_g" value={formData.carbs_g} onChange={handleChange} inputMode="decimal" />
                        <InputField label="Grasas (g)" name="fats_g" value={formData.fats_g} onChange={handleChange} inputMode="decimal" />
                    </div>
                    <InputField label="Gramos totales (opcional)" name="weight_g" value={formData.weight_g} onChange={handleChange} inputMode="decimal" />
                </>
            )}

            {/* Botones de acción */}
            {isEditing ? (
                // Botón único para guardar cambios (editando log existente)
                <button type="button" onClick={handleSaveEdited} disabled={isLoading} className="w-full flex items-center justify-center py-3 rounded-xl font-bold transition bg-accent text-white disabled:opacity-50 mt-2">
                    {isLoading ? <Spinner /> : <><Save size={18} className="mr-2" /> Guardar Cambios</>}
                </button>
            ) : editingListItem ? (
                 // Botón único para actualizar item en la lista temporal
                <button type="button" onClick={handleUpdateListItem} disabled={isLoading} className="w-full flex items-center justify-center py-3 rounded-xl font-bold transition bg-accent text-white disabled:opacity-50 mt-2">
                    {isLoading ? <Spinner /> : <><Save size={18} className="mr-2" /> Actualizar Comida</>}
                </button>
            ) : (
                // Botones para añadir a la lista o guardar directamente (creando nuevo log)
                <>
                    {showFavoriteToggle && (
                        <button type="button" onClick={handleFavoriteChange} className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${isFavorite ? 'bg-amber-400/20 text-amber-400 border-amber-400/30' : 'bg-bg-primary text-text-secondary border-glass-border'} border mt-1`}>
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
        </form>
    );
};

export default ManualEntryForm;