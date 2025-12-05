/* frontend/src/pages/TemplateDiets.jsx */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, ChevronUp, Flame, Beef, Wheat, Salad, Copy, ArrowLeft, Plus, X, Coffee, Utensils, Moon, Apple, Target, CheckCircle, Scale, AlertTriangle } from 'lucide-react'; // Añadidos iconos faltantes
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

    // CORRECCIÓN 1: Inicializar directamente con el objetivo del usuario si existe
    const [selectedGoal, setSelectedGoal] = useState(() => userProfile?.goal || 'all');

    const [diets, setDiets] = useState([]);
    const [loading, setLoading] = useState(true);

    const [expandedDietIds, setExpandedDietIds] = useState(new Set());
    const [selectingMealId, setSelectingMealId] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    // Actualizar el filtro si el perfil carga tarde (por si acaso entra null al principio)
    useEffect(() => {
        if (userProfile?.goal && selectedGoal === 'all' && diets.length === 0) {
            setSelectedGoal(userProfile.goal);
        }
    }, [userProfile]); // Eliminada dependencia diets.length para evitar bucles, controlamos lógica interna

    // 1. Obtener peso actual
    const latestWeight = useMemo(() => {
        if (!bodyWeightLog || bodyWeightLog.length === 0) return userProfile?.weight ? parseFloat(userProfile.weight) : 70;
        const sortedLog = [...bodyWeightLog].sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
        return parseFloat(sortedLog[0].weight_kg);
    }, [bodyWeightLog, userProfile]);

    // 2. Calcular las necesidades del usuario
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

        // Usamos el objetivo seleccionado para el cálculo de referencia
        const goalToCalc = selectedGoal !== 'all' ? selectedGoal : userProfile.goal;

        if (goalToCalc === 'lose') targetCalories -= 500;
        else if (goalToCalc === 'gain') targetCalories += 500;

        return {
            calories: Math.round(targetCalories),
            goalUsed: goalToCalc
        };
    }, [userProfile, latestWeight, selectedGoal]);

    // 3. Mejor coincidencia
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

    // Cargar dietas (CORRECCIÓN 2: Evitar race conditions)
    useEffect(() => {
        let isMounted = true; // Flag para saber si el componente sigue vivo

        const fetchDiets = async () => {
            setLoading(true);
            try {
                const goalParam = selectedGoal === 'all' ? null : selectedGoal;
                const data = await templateDietService.getAllTemplateDiets(goalParam);

                if (isMounted) {
                    setDiets(data);
                }
            } catch (error) {
                if (isMounted) {
                    console.error(error);
                    addToast('Error al cargar las dietas.', 'error');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchDiets();

        // Función de limpieza: si selectedGoal cambia antes de que termine el fetch anterior,
        // isMounted será false y no actualizaremos el estado con datos viejos.
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
        <div className="w-full max-w-7xl mx-auto px-4 pb-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
            <Helmet>
                <title>Dietas Recomendadas - Pro Fitness Glass</title>
            </Helmet>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 mt-10 md:mt-0 gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('nutrition')} className="p-2 rounded-full bg-bg-secondary border border-glass-border hover:bg-white/10 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold">Dietas Recomendadas</h1>
                        <p className="text-text-secondary mt-1">Elige la opción que mejor encaje contigo.</p>
                    </div>
                </div>

                <div className="bg-accent/10 px-4 py-2 rounded-xl border border-accent/20 flex flex-col items-end">
                    <span className="text-xs text-text-secondary uppercase font-bold tracking-wider">Tu Objetivo</span>
                    <span className="text-xl font-black text-accent">{userTargets.calories} <span className="text-sm font-medium">kcal</span></span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8 ml-14 md:ml-0">
                {Object.entries(GOAL_LABELS).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setSelectedGoal(key)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${selectedGoal === key
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
                                <div className="p-6 border-b border-glass-border bg-bg-secondary/30 relative">
                                    {isRecommended && (
                                        <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                                            <CheckCircle size={12} />
                                            MEJOR OPCIÓN
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-2 pr-20">
                                        <h3 className="text-xl font-bold text-accent">{diet.name}</h3>
                                    </div>
                                    <p className="text-sm text-text-secondary mb-4 line-clamp-2">{diet.description}</p>

                                    <div className="grid grid-cols-4 gap-2 text-center bg-bg-primary/50 p-3 rounded-lg border border-glass-border">
                                        <div className="flex flex-col items-center">
                                            <Flame size={16} className="text-orange-400 mb-1" />
                                            <span className="font-bold text-sm">{diet.total_calories}</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <Beef size={16} className="text-blue-400 mb-1" />
                                            <span className="font-bold text-sm">{diet.total_protein}g</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <Wheat size={16} className="text-yellow-400 mb-1" />
                                            <span className="font-bold text-sm">{diet.total_carbs}g</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <Salad size={16} className="text-green-400 mb-1" />
                                            <span className="font-bold text-sm">{diet.total_fats}g</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`transition-all duration-300 ease-in-out bg-bg-secondary/10 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                                    <div className="p-4 space-y-3">
                                        {diet.TemplateDietMeals && diet.TemplateDietMeals.map((meal, idx) => (
                                            <div key={meal.id || idx} className="flex flex-col sm:flex-row gap-3 p-3 rounded bg-bg-primary border border-glass-border items-start sm:items-center">
                                                <div className="flex gap-3 flex-1">
                                                    <div className="mt-1 min-w-[20px] text-xs font-bold text-accent">{idx + 1}.</div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-text-primary">{meal.name}</p>
                                                        <p className="text-xs text-text-secondary mb-1">{meal.description}</p>
                                                        <p className="text-[10px] text-text-muted flex gap-2">
                                                            <span>{meal.calories} kcal</span>
                                                            <span className="text-accent font-bold">P: {meal.protein_g}</span>
                                                            <span>C: {meal.carbs_g}</span>
                                                            <span>G: {meal.fats_g}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-end sm:self-center mt-2 sm:mt-0">
                                                    {selectingMealId === meal.id ? (
                                                        <div className="flex items-center bg-bg-secondary rounded-lg border border-glass-border p-1 animate-fade-in">
                                                            <button onClick={() => handleCopySingleMeal(meal, 'breakfast')} className="p-2 hover:bg-accent/20 rounded-md text-accent" title="Desayuno"><Coffee size={16} /></button>
                                                            <button onClick={() => handleCopySingleMeal(meal, 'lunch')} className="p-2 hover:bg-accent/20 rounded-md text-accent" title="Almuerzo"><Utensils size={16} /></button>
                                                            <button onClick={() => handleCopySingleMeal(meal, 'dinner')} className="p-2 hover:bg-accent/20 rounded-md text-accent" title="Cena"><Moon size={16} /></button>
                                                            <button onClick={() => handleCopySingleMeal(meal, 'snack')} className="p-2 hover:bg-accent/20 rounded-md text-accent" title="Snack"><Apple size={16} /></button>
                                                            <div className="w-px h-4 bg-glass-border mx-1"></div>
                                                            <button onClick={() => setSelectingMealId(null)} className="p-2 hover:bg-red-500/20 rounded-md text-red-400"><X size={16} /></button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setSelectingMealId(meal.id)}
                                                            className="p-2 rounded-full hover:bg-accent/10 text-accent transition-colors border border-transparent hover:border-accent/20"
                                                            title="Añadir esta comida"
                                                        >
                                                            {processingId === `meal-${meal.id}` ? <Spinner size={16} /> : <Plus size={18} />}
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
                                        <span>Copiar a Hoy</span>
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