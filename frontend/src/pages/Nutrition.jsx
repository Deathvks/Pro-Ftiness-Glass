import React, { useState, useMemo } from 'react';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import * as nutritionService from '../services/nutritionService';

import DateNavigator from '../components/nutrition/DateNavigator';
import SummarySection from '../components/nutrition/SummarySection';
import MealsSection from '../components/nutrition/MealsSection';
import Spinner from '../components/Spinner';
import WaterLogModal from '../components/WaterLogModal';
import FoodSearchModal from '../components/nutrition/FoodSearchModal';
import ConfirmationModal from '../components/ConfirmationModal';
import CreatinaTracker from '../components/CreatinaTracker';

const Nutrition = () => {
    const { addToast } = useToast();
    const {
        userProfile,
        nutritionLog,
        waterLog,
        selectedDate,
        fetchDataForDate,
        isLoading,
        bodyWeightLog,
    } = useAppStore(state => ({
        userProfile: state.userProfile,
        nutritionLog: state.nutritionLog,
        waterLog: state.waterLog,
        selectedDate: state.selectedDate,
        fetchDataForDate: state.fetchDataForDate,
        isLoading: state.isLoading,
        bodyWeightLog: state.bodyWeightLog,
    }));

    const [modal, setModal] = useState({ type: null, data: null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [logToDelete, setLogToDelete] = useState(null);

    const latestWeight = useMemo(() => {
        if (!bodyWeightLog || bodyWeightLog.length === 0) return userProfile?.weight || null;
        const sortedLog = [...bodyWeightLog].sort((a, b) => new Date(b.date) - new Date(b.date));
        return parseFloat(sortedLog[0].weight_kg);
    }, [bodyWeightLog, userProfile]);

    const targets = useMemo(() => {
        if (!userProfile || !userProfile.goal || !latestWeight) {
            return { calories: 2000, protein: 120, water: 2500 };
        }
        const { gender, age, height, activity_level, goal } = userProfile;
        let bmr = gender === 'male'
            ? 88.362 + (13.397 * latestWeight) + (4.799 * height) - (5.677 * age)
            : 447.593 + (9.247 * latestWeight) + (3.098 * height) - (4.330 * age);
        let calorieTarget = bmr * activity_level;
        if (goal === 'lose') calorieTarget -= 500;
        if (goal === 'gain') calorieTarget += 500;

        const proteinMultiplier = goal === 'gain' ? 2.0 : goal === 'lose' ? 1.8 : 1.6;
        const proteinTarget = Math.round(latestWeight * proteinMultiplier);
        
        const waterTarget = Math.round(latestWeight * 35);

        return {
            calories: Math.round(calorieTarget),
            protein: proteinTarget,
            water: waterTarget,
        };
    }, [userProfile, latestWeight]);

    const handleSaveWater = async (quantity_ml) => {
        setIsSubmitting(true);
        try {
            await nutritionService.upsertWaterLog({ log_date: selectedDate, quantity_ml });
            addToast('Registro de agua actualizado.', 'success');
            await fetchDataForDate(selectedDate);
            setModal({ type: null, data: null });
        } catch (error) {
            addToast(error.message || 'Error al guardar el agua.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveFood = async (data, isEditing = false) => {
        setIsSubmitting(true);
        try {
            if (isEditing) {
                // Lógica para editar un único registro
                await nutritionService.updateFoodLog(modal.data.id, data);
                addToast('Comida actualizada.', 'success');
            } else {
                // Lógica para añadir uno o más registros nuevos
                const logs = data.map(item => {
                    const { tempId, name, base, saveAsFavorite, ...logData } = item;
                    return { ...logData, log_date: selectedDate, meal_type: modal.data.mealType };
                });
                await Promise.all(logs.map(log => nutritionService.addFoodLog(log)));
                addToast(`${logs.length} alimento(s) añadido(s).`, 'success');
            }
            
            await fetchDataForDate(selectedDate);
            setModal({ type: null, data: null });
        } catch (error) {
            addToast(error.message || 'Error al guardar la comida.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteFood = async () => {
        if (!logToDelete) return;
        setIsSubmitting(true);
        try {
            await nutritionService.deleteFoodLog(logToDelete.id);
            addToast('Comida eliminada.', 'success');
            await fetchDataForDate(selectedDate);
            setLogToDelete(null);
        } catch (error) {
            addToast(error.message || 'Error al eliminar la comida.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const nutritionTotals = useMemo(() => {
        const result = { calories: 0, protein: 0, carbs: 0, fats: 0 };
        nutritionLog.forEach(log => {
            result.calories += log.calories || 0;
            result.protein += parseFloat(log.protein_g) || 0;
            result.carbs += parseFloat(log.carbs_g) || 0;
            result.fats += parseFloat(log.fats_g) || 0;
        });
        return result;
    }, [nutritionLog]);

    const meals = useMemo(() => {
        const mealData = { breakfast: [], lunch: [], dinner: [], snack: [] };
        nutritionLog.forEach(log => {
            if (mealData[log.meal_type]) {
                mealData[log.meal_type].push(log);
            }
        });
        return mealData;
    }, [nutritionLog]);

    const mealTotals = useMemo(() => {
        const totals = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
        nutritionLog.forEach(log => {
            if (totals[log.meal_type] !== undefined) {
                totals[log.meal_type] += log.calories || 0;
            }
        });
        return totals;
    }, [nutritionLog]);

    return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
            <h1 className="text-4xl font-extrabold mb-4">Seguimiento de Nutrición</h1>
            <DateNavigator selectedDate={selectedDate} onDateChange={fetchDataForDate} />

            {isLoading && !isSubmitting ? (
                 <div className="flex justify-center items-center py-10"><Spinner size={40}/></div>
            ) : (
            <>
                <SummarySection
                    totals={nutritionTotals}
                    targets={targets}
                    waterLog={waterLog}
                    onWaterClick={() => setModal({ type: 'water' })}
                    onCreatineClick={() => setModal({ type: 'creatine' })}
                />
                <MealsSection
                    meals={meals}
                    mealTotals={mealTotals}
                    onAddFood={(mealType) => setModal({ type: 'foodSearch', data: { mealType } })}
                    onEditFood={(log) => setModal({ type: 'foodSearch', data: log })}
                    onDeleteFood={setLogToDelete}
                />
            </>
            )}

            {modal.type === 'foodSearch' && (
                <FoodSearchModal
                    mealType={modal.data.mealType}
                    onClose={() => setModal({ type: null, data: null })}
                    onSave={handleSaveFood}
                    isLoading={isSubmitting}
                    logToEdit={modal.data.id ? modal.data : null}
                />
            )}

            {modal.type === 'water' && (
                <WaterLogModal
                    initialQuantity={waterLog.quantity_ml}
                    onClose={() => setModal({ type: null })}
                    onSave={handleSaveWater}
                    isLoading={isSubmitting}
                />
            )}
            
            {logToDelete && (
                <ConfirmationModal
                    message={`¿Seguro que quieres eliminar "${logToDelete.description}"?`}
                    onConfirm={handleDeleteFood}
                    onCancel={() => setLogToDelete(null)}
                    isLoading={isSubmitting}
                    confirmText="Eliminar"
                />
            )}
            
            {modal.type === 'creatine' && (
                <CreatinaTracker 
                    onClose={() => setModal({ type: null })}
                    selectedDate={selectedDate}
                />
            )}
        </div>
    );
};

export default Nutrition;