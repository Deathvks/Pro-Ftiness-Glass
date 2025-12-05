/* frontend/src/pages/TemplateDiets.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, ChevronUp, Flame, Beef, Wheat, Salad, Copy, ArrowLeft, Plus, X, Coffee, Utensils, Moon, Apple, CheckCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import * as templateDietService from '../services/templateDietService';
import * as nutritionService from '../services/nutritionService';

const GOAL_LABELS = {
    lose: 'Perder Grasa',
    maintain: 'Mantenimiento',
    gain: 'Ganar Músculo',
    all: 'Todos'
};

const TemplateDiets = ({ setView }) => {
    const { addToast } = useToast();
    const { userProfile, selectedDate, fetchDataForDate, bodyWeightLog } = useAppStore(state => ({
        userProfile: state.userProfile,
        selectedDate: state.selectedDate,
        fetchDataForDate: state.fetchDataForDate,
        bodyWeightLog: state.bodyWeightLog,
    }));

    const [selectedGoal, setSelectedGoal] = useState(() => userProfile?.goal || 'all');
    const [diets, setDiets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedDietIds, setExpandedDietIds] = useState(new Set());
    const [selectingMealId, setSelectingMealId] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        if (userProfile?.goal && selectedGoal === 'all' && diets.length === 0) {
            setSelectedGoal(userProfile.goal);
        }
    }, [userProfile]);

    const latestWeight = useMemo(() => {
        if (!bodyWeightLog || bodyWeightLog.length === 0) return userProfile?.weight ? parseFloat(userProfile.weight) : 70;
        const sortedLog = [...bodyWeightLog].sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
        return parseFloat(sortedLog[0].weight_kg);
    }, [bodyWeightLog, userProfile]);

    const userTargets = useMemo(() => {
        if (!userProfile) return { calories: 2000 };

        const weight = parseFloat(latestWeight);
        const height = parseFloat(userProfile.height);
        const age = parseFloat(userProfile.age);
        const activity = parseFloat(userProfile.activity_level);
        const gender = userProfile.gender;

        let bmr = gender === 'male'
            ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
            : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);

        let maintenance = bmr * activity;
        let targetCalories = maintenance;

        const goalToCalc = selectedGoal !== 'all' ? selectedGoal : userProfile.goal;

        if (goalToCalc === 'lose') targetCalories -= 500;
        else if (goalToCalc === 'gain') targetCalories += 500;

        return {
            calories: Math.round(targetCalories),
            goalUsed: goalToCalc
        };
    }, [userProfile, latestWeight, selectedGoal]);

    const bestMatchId = useMemo(() => {
        if (diets.length === 0) return null;
        let bestId = null;
        let minDiff = Infinity;
        diets.forEach(diet => {
            if (selectedGoal !== 'all' && diet.goal !== selectedGoal) return;
            const diff = Math.abs(diet.total_calories - userTargets.calories);
            if (diff < minDiff) {
                minDiff = diff;
                bestId = diet.id;
            }
        });
        return bestId;
    }, [diets, userTargets, selectedGoal]);

    useEffect(() => {
        let isMounted = true;
        const fetchDiets = async () => {
            setLoading(true);
            try {
                const goalParam = selectedGoal === 'all' ? null : selectedGoal;
                const data = await templateDietService.getAllTemplateDiets(goalParam);
                if (isMounted) setDiets(data);
            } catch (error) {
                if (isMounted) {
                    console.error(error);
                    addToast('Error al cargar las dietas.', 'error');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchDiets();
        return () => { isMounted = false; };
    }, [selectedGoal]);

    const handleToggleExpand = (id) => {
        setExpandedDietIds(prev => {
            const newSet = new Set(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    };

    const handleCopyDiet = async (diet) => {
        setProcessingId(`diet-${diet.id}`);
        try {
            const mealsToCopy = diet.TemplateDietMeals || [];
            if (mealsToCopy.length === 0) {
                addToast('Esta dieta no tiene comidas.', 'warning');
                return;
            }
            const promises = mealsToCopy.map(meal => {
                let type = 'snack';
                const nameLower = meal.name.toLowerCase();
                if (nameLower.includes('desayuno')) type = 'breakfast';
                else if (nameLower.includes('almuerzo') || nameLower.includes('comida')) type = 'lunch';
                else if (nameLower.includes('cena')) type = 'dinner';

                return nutritionService.addFoodLog({
                    log_date: selectedDate,
                    meal_type: type,
                    description: `${meal.name}: ${meal.description || ''}`.trim(),
                    calories: meal.calories,
                    protein_g: meal.protein_g,
                    carbs_g: meal.carbs_g,
                    fats_g: meal.fats_g,
                });
            });
            await Promise.all(promises);
            await fetchDataForDate(selectedDate);
            addToast(`Dieta "${diet.name}" añadida hoy.`, 'success');
            setView('nutrition');
        } catch (error) {
            console.error(error);
            addToast('Error al copiar la dieta.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCopySingleMeal = async (meal, targetSlot) => {
        setProcessingId(`meal-${meal.id}`);
        try {
            await nutritionService.addFoodLog({
                log_date: selectedDate,
                meal_type: targetSlot,
                description: `${meal.name}: ${meal.description || ''}`.trim(),
                calories: meal.calories,
                protein_g: meal.protein_g,
                carbs_g: meal.carbs_g,
                fats_g: meal.fats_g,
            });
            await fetchDataForDate(selectedDate);
            addToast('Comida añadida correctamente.', 'success');
            setSelectingMealId(null);
        } catch (error) {
            console.error(error);
            addToast('Error al añadir la comida.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        // Añadido padding top extra para móviles para evitar solapamientos
        <div className="w-full max-w-7xl mx-auto px-4 pb-20 pt-20 md:pt-6 md:pb-6 animate-[fade-in_0.5s_ease-out]">
            <Helmet>
                <title>Dietas Recomendadas - Pro Fitness Glass</title>
            </Helmet>

            {/* Cabecera Responsiva */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={() => setView('nutrition')} className="p-2 shrink-0 rounded-full bg-bg-secondary border border-glass-border hover:bg-white/10 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">Dietas Recomendadas</h1>
                        <p className="text-sm text-text-secondary">Elige la opción para ti.</p>
                    </div>
                </div>

                {/* Tarjeta de Objetivo: Full width en móvil, ajustada en desktop */}
                <div className="w-full md:w-auto bg-accent/10 px-4 py-3 rounded-xl border border-accent/20 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-2">
                    <span className="text-xs text-text-secondary uppercase font-bold tracking-wider">Tu Objetivo Diario</span>
                    <span className="text-xl font-black text-accent">{userTargets.calories} <span className="text-sm font-medium">kcal</span></span>
                </div>
            </div>

            {/* Botones de Filtro: Scroll horizontal en móvil, sin márgenes extraños */}
            <div className="flex flex-nowrap md:flex-wrap gap-2 mb-8 overflow-x-auto pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {Object.entries(GOAL_LABELS).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setSelectedGoal(key)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all shrink-0 ${selectedGoal === key
                            ? 'bg-accent text-white shadow-lg shadow-accent/20'
                            : 'bg-bg-secondary text-text-secondary border border-glass-border hover:border-accent/50'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Spinner size={40} /></div>
            ) : diets.length === 0 ? (
                <GlassCard className="p-10 text-center">
                    <p className="text-text-muted">No se encontraron dietas para este objetivo.</p>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {diets.map(diet => {
                        const isExpanded = expandedDietIds.has(diet.id);
                        const isRecommended = diet.id === bestMatchId;

                        return (
                            <GlassCard
                                key={diet.id}
                                className={`p-0 overflow-hidden flex flex-col transition-all duration-300 h-fit ${isRecommended ? 'ring-2 ring-accent shadow-lg shadow-accent/10' : 'hover:border-accent/30'}`}
                            >
                                <div className="p-5 md:p-6 border-b border-glass-border bg-bg-secondary/30 relative">
                                    {isRecommended && (
                                        <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm z-10">
                                            <CheckCircle size={12} />
                                            MEJOR OPCIÓN
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-2 pr-20">
                                        <h3 className="text-lg md:text-xl font-bold text-accent">{diet.name}</h3>
                                    </div>
                                    <p className="text-sm text-text-secondary mb-4 line-clamp-2">{diet.description}</p>

                                    {/* Grid de Macros: 2 columnas en móvil, 4 en desktop */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center bg-bg-primary/50 p-3 rounded-lg border border-glass-border">
                                        <div className="flex flex-col items-center p-1">
                                            <Flame size={16} className="text-orange-400 mb-1" />
                                            <span className="font-bold text-sm">{diet.total_calories}</span>
                                        </div>
                                        <div className="flex flex-col items-center p-1">
                                            <Beef size={16} className="text-blue-400 mb-1" />
                                            <span className="font-bold text-sm">{diet.total_protein}g</span>
                                        </div>
                                        <div className="flex flex-col items-center p-1">
                                            <Wheat size={16} className="text-yellow-400 mb-1" />
                                            <span className="font-bold text-sm">{diet.total_carbs}g</span>
                                        </div>
                                        <div className="flex flex-col items-center p-1">
                                            <Salad size={16} className="text-green-400 mb-1" />
                                            <span className="font-bold text-sm">{diet.total_fats}g</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`transition-all duration-300 ease-in-out bg-bg-secondary/10 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                                    <div className="p-4 space-y-3">
                                        {diet.TemplateDietMeals && diet.TemplateDietMeals.map((meal, idx) => (
                                            <div key={meal.id || idx} className="flex flex-col gap-3 p-3 rounded bg-bg-primary border border-glass-border">
                                                <div className="flex gap-3">
                                                    <div className="mt-1 min-w-[20px] text-xs font-bold text-accent">{idx + 1}.</div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-sm text-text-primary">{meal.name}</p>
                                                        <p className="text-xs text-text-secondary mb-1">{meal.description}</p>
                                                        <p className="text-[10px] text-text-muted flex flex-wrap gap-2">
                                                            <span>{meal.calories} kcal</span>
                                                            <span className="text-accent font-bold">P: {meal.protein_g}</span>
                                                            <span>C: {meal.carbs_g}</span>
                                                            <span>G: {meal.fats_g}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end pt-2 border-t border-glass-border/50">
                                                    {selectingMealId === meal.id ? (
                                                        <div className="flex items-center gap-1 bg-bg-secondary rounded-lg border border-glass-border p-1 animate-fade-in w-full justify-between sm:w-auto sm:justify-start">
                                                            <button onClick={() => handleCopySingleMeal(meal, 'breakfast')} className="p-2 hover:bg-accent/20 rounded-md text-accent flex-1 sm:flex-none flex justify-center" title="Desayuno"><Coffee size={16} /></button>
                                                            <button onClick={() => handleCopySingleMeal(meal, 'lunch')} className="p-2 hover:bg-accent/20 rounded-md text-accent flex-1 sm:flex-none flex justify-center" title="Almuerzo"><Utensils size={16} /></button>
                                                            <button onClick={() => handleCopySingleMeal(meal, 'dinner')} className="p-2 hover:bg-accent/20 rounded-md text-accent flex-1 sm:flex-none flex justify-center" title="Cena"><Moon size={16} /></button>
                                                            <button onClick={() => handleCopySingleMeal(meal, 'snack')} className="p-2 hover:bg-accent/20 rounded-md text-accent flex-1 sm:flex-none flex justify-center" title="Snack"><Apple size={16} /></button>
                                                            <div className="w-px h-4 bg-glass-border mx-1"></div>
                                                            <button onClick={() => setSelectingMealId(null)} className="p-2 hover:bg-red-500/20 rounded-md text-red-400 flex-1 sm:flex-none flex justify-center"><X size={16} /></button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setSelectingMealId(meal.id)}
                                                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
                                                        >
                                                            {processingId === `meal-${meal.id}` ? <Spinner size={14} /> : <Plus size={14} />}
                                                            Añadir
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 bg-bg-secondary/50 border-t border-glass-border flex gap-3 mt-auto">
                                    <button onClick={() => handleToggleExpand(diet.id)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors text-text-secondary">
                                        {isExpanded ? <><ChevronUp size={16} /> Ocultar</> : <><ChevronDown size={16} /> Ver Comidas</>}
                                    </button>
                                    <button
                                        onClick={() => handleCopyDiet(diet)}
                                        disabled={processingId === `diet-${diet.id}`}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold bg-accent text-white hover:brightness-110 transition-all disabled:opacity-50 shadow-md shadow-accent/20"
                                    >
                                        {processingId === `diet-${diet.id}` ? <Spinner size={16} color="text-white" /> : <Copy size={16} />}
                                        <span>Copiar Todo</span>
                                    </button>
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TemplateDiets;