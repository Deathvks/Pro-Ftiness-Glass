/* frontend/src/components/nutrition/MealsSection.jsx */
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Microscope } from 'lucide-react';
import GlassCard from '../GlassCard';
import NutritionLogModal from '../NutritionLogModal';
import ConfirmationModal from '../ConfirmationModal';
import useAppStore from '../../store/useAppStore';
import { useToast } from '../../hooks/useToast';
// --- INICIO DE LA MODIFICACIÓN ---
// Importar servicios de nutrición y 'round'
import { deleteNutritionLog, addNutritionLog, updateNutritionLog } from '../../services/nutritionService';
import { round as formatNumber } from '../../hooks/useNutritionConstants';
// --- FIN DE LA MODIFICACIÓN ---
import Spinner from '../Spinner';

// Icono para mostrar si la comida es favorita
const FavoriteIcon = () => (
    <span className="text-yellow-400 text-lg">★</span>
);

const MealLogItem = ({ log, onEdit, onDelete, mealType, favorites }) => {
    const [showMicros, setShowMicros] = useState(false);

    // Buscar si el log tiene un favorito coincidente (por nombre)
    const isFavorite = favorites.some(fav => fav.name === log.description);
    
    // Función para obtener la URL de la imagen
    const imageUrl = log.image_url; 

    const micronutrients = log.micronutrients;
    
    // Lista simplificada de micronutrientes a mostrar
    const simpleMicrosList = [
        { key: 'vitamin-c_100g', name: 'Vit C' },
        { key: 'vitamin-a_100g', name: 'Vit A' },
        { key: 'vitamin-d_100g', name: 'Vit D' },
        { key: 'iron_100g', name: 'Hierro' },
        { key: 'calcium_100g', name: 'Calcio' },
        { key: 'sodium_100g', name: 'Sodio' },
        { key: 'fiber_100g', name: 'Fibra' },
    ];

    const availableMicros = micronutrients ? simpleMicrosList
        .map(micro => {
            const value = micronutrients[micro.key];
            let unit = micronutrients[micro.key.replace('_100g', '_unit')] || 'g';
            if (micro.key === 'sodium_100g' && unit === 'g') unit = 'mg';
            
            return (value && parseFloat(value) > 0) 
                ? `${micro.name}: ${formatNumber(value, 2)} ${unit}` 
                : null;
        })
        .filter(Boolean) : [];

    const hasMicros = availableMicros.length > 0;


    return (
        <div className="flex justify-between items-center py-2 px-3 hover:bg-bg-secondary rounded-lg transition-colors group flex-wrap w-full">
            
            <div className="flex items-center space-x-3 min-w-0 flex-1">
                {imageUrl && (
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-glass-border">
                        <img 
                            src={imageUrl} 
                            alt={log.description} 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                )}
                
                <div className="flex flex-col min-w-0">
                    <span className="text-text-primary text-sm font-medium truncate">
                        {isFavorite && <FavoriteIcon />}
                        <span className={`${isFavorite ? 'ml-1' : ''}`}>{log.description}</span>
                    </span>
                    <span className="text-text-muted text-xs">
                        {log.weight_g ? `${formatNumber(log.weight_g, 1)} g - ` : ''}
                        {formatNumber(log.calories, 0)} kcal
                    </span>
                </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-auto">
                <span className="text-text-secondary text-sm hidden sm:block">
                    {formatNumber(log.protein_g, 1)}P / {formatNumber(log.carbs_g, 1)}C / {formatNumber(log.fats_g, 1)}F
                </span>
                
                {hasMicros && (
                    <button
                        onClick={() => setShowMicros(s => !s)}
                        className={`p-1 ${showMicros ? 'text-accent' : 'text-text-muted'} hover:text-accent`}
                        aria-label="Mostrar micronutrientes"
                    >
                        <Microscope size={16} />
                    </button>
                )}

                <button
                    onClick={() => onEdit(log, mealType)}
                    className="p-1 text-text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Editar ${log.description}`}
                >
                    <Edit size={16} />
                </button>
                <button
                    onClick={() => onDelete(log.id, mealType)}
                    className="p-1 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Eliminar ${log.description}`}
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {hasMicros && showMicros && (
                <div className="w-full mt-2 p-2 bg-bg-primary rounded-md border border-glass-border">
                    <h5 className="text-xs font-bold text-text-primary mb-1">Micronutrientes (por 100g):</h5>
                    <div className="text-xs text-text-muted grid grid-cols-2 sm:grid-cols-3 gap-x-2">
                        {availableMicros.map((microString, index) => (
                            <span key={index}>{microString}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const MealsSection = ({ title, mealType, logs, todayLogs, fetchNutritionLogs, selectedDate, setTotalCaloriesGoal }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [logToEdit, setLogToEdit] = useState(null);
    const [logToDelete, setLogToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { addToast } = useToast();
    const { favorites } = useAppStore(state => ({ favorites: state.favoriteMeals }));

    const handleOpenModal = (log = null) => {
        setLogToEdit(log);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setLogToEdit(null);
    };

    const handleDeleteClick = (logId) => {
        setLogToDelete({ logId, mealType });
    };

    const handleConfirmDelete = async () => {
        if (!logToDelete) return;
        setIsDeleting(true);
        try {
            await deleteNutritionLog(logToDelete.logId);
            addToast("Comida eliminada con éxito.", 'success');
            await fetchNutritionLogs(selectedDate);
            setLogToDelete(null);
        } catch (error) {
            addToast(error.message || 'Error al eliminar la comida.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };
    
    // --- INICIO DE LA MODIFICACIÓN (Añadir lógica de guardado) ---
    const handleSaveLog = async (newLogs, isEdit = false) => {
        handleCloseModal();
        if (newLogs.length === 0) return; // Salir si no hay nada que guardar

        try {
            if (isEdit) {
                // Lógica de EDICIÓN
                const log = newLogs[0];
                // 'log' ya tiene 'id' si es una edición (viene de logToEdit)
                // 'log' tiene los datos actualizados del formulario
                await updateNutritionLog(log.id, log);
            } else {
                // Lógica de ADICIÓN (para uno o varios items)
                // Los hooks de favoritos ya se ejecutaron ANTES de llamar a esto.
                // Ahora guardamos los logs de nutrición.
                await Promise.all(
                    newLogs.map(log => {
                        // Asegurarnos de que los logs tienen fecha y tipo
                        const logData = {
                            ...log,
                            log_date: selectedDate,
                            meal_type: mealType,
                        };
                        return addNutritionLog(logData);
                    })
                );
            }
            
            // Refrescar los datos de la UI
            await fetchNutritionLogs(selectedDate);
            
            // Mostrar toast de éxito
            if (isEdit) {
                 addToast('Comida actualizada con éxito.', 'success');
            } else {
                addToast(`Comida${newLogs.length > 1 ? 's' : ''} registrada(s) con éxito.`, 'success');
            }

        } catch (error) {
            addToast(error.message || 'Error al guardar el registro de nutrición.', 'error');
        }
    };
    // --- FIN DE LA MODIFICACIÓN ---
    
    // Suma de macros para la sección
    const sectionSummary = logs.reduce((acc, log) => {
        acc.calories += log.calories || 0;
        acc.protein_g += log.protein_g || 0;
        acc.carbs_g += log.carbs_g || 0;
        acc.fats_g += log.fats_g || 0;
        return acc;
    }, { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 });


    return (
        <GlassCard className="p-4 flex flex-col">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
                <button
                    onClick={() => handleOpenModal()}
                    className="p-2 rounded-full bg-accent text-white hover:bg-accent/90 transition-colors shadow-lg"
                    aria-label={`Añadir comida a ${title}`}
                >
                    <Plus size={18} />
                </button>
            </div>
            
            {/* Resumen de Macros */}
            <div className="grid grid-cols-4 text-center text-sm font-medium text-text-secondary bg-bg-secondary p-2 rounded-lg mb-4">
                <div className="text-text-primary">{formatNumber(sectionSummary.calories, 0)}</div>
                <div>{formatNumber(sectionSummary.protein_g, 1)}P</div>
                <div>{formatNumber(sectionSummary.carbs_g, 1)}C</div>
                <div>{formatNumber(sectionSummary.fats_g, 1)}G</div>
            </div>

            {/* Lista de Logs */}
            <div className="flex-grow min-h-[50px]">
                {logs.length === 0 ? (
                    <p className="text-center text-text-muted mt-4">Añade una comida</p>
                ) : (
                    <div className="space-y-1">
                        {logs.map(log => (
                            <MealLogItem
                                key={log.id}
                                log={log}
                                favorites={favorites}
                                mealType={mealType}
                                onEdit={handleOpenModal}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </div>
                )}
            </div>

            <NutritionLogModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                mealType={mealType}
                onSave={handleSaveLog}
                logToEdit={logToEdit}
                todayLogs={todayLogs}
                fetchNutritionLogs={fetchNutritionLogs}
                setTotalCaloriesGoal={setTotalCaloriesGoal}
                selectedDate={selectedDate}
            />

            <ConfirmationModal
                isOpen={!!logToDelete}
                onClose={() => setLogToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Comida"
                message={`¿Estás seguro de que deseas eliminar este registro de comida?`}
                confirmText={isDeleting ? <Spinner size={16} /> : "Eliminar"}
                isDanger={true}
                isLoading={isDeleting}
            />
        </GlassCard>
    );
};

export default MealsSection;