import React, { useState, useEffect } from 'react';
import { addFoodLog, updateFoodLog, uploadFoodImage } from '../../../services/nutritionService';
import useAppStore from '../../../store/useAppStore';
import { format, parseISO } from 'date-fns';
import { useToast } from '../../../contexts/ToastContext';
import { FaCamera, FaTimes } from 'react-icons/fa';

const FoodEntryForm = ({ selectedFood, mealType, onClose, isEditing = false }) => {
    const { addOrUpdateFoodLog, selectedDate } = useAppStore(state => ({
        addOrUpdateFoodLog: state.addOrUpdateFoodLog,
        selectedDate: state.selectedDate,
    }));
    const showToast = useToast();

    const [foodData, setFoodData] = useState({
        description: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        weight_g: '',
    });

    // --- INICIO DE LA MODIFICACIÓN ---
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    // --- FIN DE LA MODIFICACIÓN ---

    useEffect(() => {
        if (selectedFood) {
            setFoodData({
                description: selectedFood.description || '',
                calories: selectedFood.calories || '',
                protein: selectedFood.protein || '',
                carbs: selectedFood.carbs || '',
                fats: selectedFood.fats || '',
                weight_g: selectedFood.weight_g || '100',
            });
            // Si estamos editando y el registro ya tiene una imagen, la mostramos
            if (isEditing && selectedFood.image_url) {
                setImagePreview(selectedFood.image_url);
            }
        }
    }, [selectedFood, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFoodData(prev => ({ ...prev, [name]: value }));
    };

    // --- INICIO DE LA MODIFICACIÓN ---
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            // Creamos una URL local para la previsualización
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const removeImage = () => {
        setImagePreview(null);
        setImageFile(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let imageUrl = isEditing ? (imagePreview || null) : null;

        // Si se ha seleccionado un nuevo archivo de imagen, lo subimos primero
        if (imageFile) {
            setIsUploading(true);
            try {
                const response = await uploadFoodImage(imageFile);
                imageUrl = response.imageUrl;
            } catch (error) {
                showToast(`Error al subir la imagen: ${error.message}`, 'error');
                setIsUploading(false);
                return; // Detenemos el proceso si la subida falla
            }
        }

        const logData = {
            ...foodData,
            meal_type: mealType,
            log_date: format(parseISO(selectedDate), 'yyyy-MM-dd'),
            calories: parseFloat(foodData.calories) || 0,
            protein: parseFloat(foodData.protein) || 0,
            carbs: parseFloat(foodData.carbs) || 0,
            fats: parseFloat(foodData.fats) || 0,
            weight_g: parseFloat(foodData.weight_g) || 0,
            image_url: imageUrl, // Añadimos la URL de la imagen
        };

        try {
            let savedLog;
            if (isEditing) {
                savedLog = await updateFoodLog(selectedFood.id, logData);
                showToast('Comida actualizada con éxito', 'success');
            } else {
                savedLog = await addFoodLog(logData);
                showToast('Comida añadida con éxito', 'success');
            }
            addOrUpdateFoodLog(savedLog);
            onClose();
        } catch (error) {
            showToast(error.message || 'Error al guardar la comida', 'error');
        } finally {
            setIsUploading(false);
        }
    };
    // --- FIN DE LA MODIFICACIÓN ---

    return (
        <div className="p-4 bg-gray-800 text-white">
            <h3 className="text-lg font-bold mb-4">{isEditing ? 'Editar Comida' : 'Añadir Comida'}</h3>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="text"
                        name="description"
                        value={foodData.description}
                        onChange={handleChange}
                        placeholder="Descripción"
                        className="col-span-2 input-glass"
                    />
                    <input type="number" name="calories" value={foodData.calories} onChange={handleChange} placeholder="Calorías" className="input-glass" />
                    <input type="number" name="weight_g" value={foodData.weight_g} onChange={handleChange} placeholder="Peso (g)" className="input-glass" />
                    <input type="number" name="protein" value={foodData.protein} onChange={handleChange} placeholder="Proteínas (g)" className="input-glass" />
                    <input type="number" name="carbs" value={foodData.carbs} onChange={handleChange} placeholder="Carbohidratos (g)" className="input-glass" />
                    <input type="number" name="fats" value={foodData.fats} onChange={handleChange} placeholder="Grasas (g)" className="input-glass" />
                </div>

                {/* --- INICIO DE LA MODIFICACIÓN --- */}
                <div className="mt-4">
                    <div className="flex items-center gap-4">
                        <label htmlFor="food-image-upload" className="btn-secondary p-2 rounded-full cursor-pointer hover:bg-gray-600 transition-colors">
                            <FaCamera />
                        </label>
                        <input id="food-image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        {imagePreview && (
                            <div className="relative">
                                <img src={imagePreview} alt="Vista previa" className="w-16 h-16 object-cover rounded-lg" />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 leading-none flex items-center justify-center w-5 h-5"
                                >
                                    <FaTimes size="0.75rem" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {/* --- FIN DE LA MODIFICACIÓN --- */}

                <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Cancelar
                    </button>
                    <button type="submit" className="btn-primary" disabled={isUploading}>
                        {isUploading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Añadir')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FoodEntryForm;