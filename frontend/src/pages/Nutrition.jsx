/* frontend/src/pages/Nutrition.jsx */
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, ChevronRight, Plus, Droplet, Flame, Beef, Wheat, Salad, Edit, Trash2, Zap, X, Scale, Image as ImageIcon, IceCream, AlertTriangle, Check } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore';
import WaterLogModal from '../components/WaterLogModal';
import NutritionLogModal from '../components/NutritionLogModal';
import ConfirmationModal from '../components/ConfirmationModal';
import CreatinaTracker from '../components/CreatinaTracker';
import SugarTargetModal from '../components/SugarTargetModal';
import { useToast } from '../hooks/useToast';
import * as nutritionService from '../services/nutritionService';

// Componente para el selector de fecha
const DateNavigator = ({ selectedDate, onDateChange }) => {
    const today = new Date();
    const date = new Date(selectedDate);

    const changeDay = (amount) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + amount);
        onDateChange(newDate.toISOString().split('T')[0]);
    };

    const isToday = today.toISOString().split('T')[0] === selectedDate;

    const dateString = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const formattedDate = dateString.charAt(0).toUpperCase() + dateString.slice(1);

    return (
        <div className="flex items-center justify-between mb-8 mt-6 sm:mt-0">
            <button onClick={() => changeDay(-1)} className="p-2 rounded-full hover:bg-white/10 transition">
                <ChevronLeft />
            </button>
            <div className="text-center">
                <p className="text-xl font-bold">
                    {formattedDate}
                </p>
                {isToday && <span className="text-xs font-semibold text-accent">HOY</span>}
            </div>
            <button onClick={() => changeDay(1)} disabled={isToday} className="p-2 rounded-full hover:bg-white/10 transition disabled:opacity-50">
                <ChevronRight />
            </button>
        </div>
    );
};

// Función auxiliar para obtener la URL de la imagen con cache busting
const getImageUrl = (url, updatedAt) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('blob:')) return url;

    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const rootUrl = apiBase.replace(/\/api\/?$/, '');
    const fullUrl = `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;

    if (updatedAt) {
        const separator = fullUrl.includes('?') ? '&' : '?';
        return `${fullUrl}${separator}v=${updatedAt}`;
    }

    return fullUrl;
};

// Nuevo componente para manejar la carga de imágenes y errores
const MealImage = ({ src, alt, className, onClick }) => {
    const [hasError, setHasError] = useState(false);
    const [imgSrc, setImgSrc] = useState(src);

    useEffect(() => {
        setImgSrc(src);
        setHasError(false);
    }, [src]);

    if (!imgSrc || hasError) {
        return (
            <div
                className={`flex-shrink-0 bg-bg-secondary/50 overflow-hidden border border-glass-border flex items-center justify-center ${className}`}
                onClick={onClick}
            >
                <ImageIcon size={20} className="text-text-muted opacity-70" />
            </div>
        );
    }

    return (
        <div className={`flex-shrink-0 bg-bg-primary overflow-hidden border border-glass-border ${className}`} onClick={onClick}>
            <img
                src={imgSrc}
                alt={alt}
                className="w-full h-full object-cover"
                onError={() => setHasError(true)}
            />
        </div>
    );
};

const Nutrition = ({ setView }) => {
    const { addToast } = useToast();
    const {
        userProfile,
        nutritionLog,
        waterLog,
        todaysCreatineLog,
        selectedDate,
        fetchDataForDate,
        isLoading,
        bodyWeightLog,
        favoriteMeals,
        recentMeals,
        addFavoriteMeal,
        deleteFavoriteMeal,
        fetchNotifications,
        fetchInitialData,
    } = useAppStore(state => ({
        userProfile: state.userProfile,
        nutritionLog: state.nutritionLog,
        waterLog: state.waterLog,
        todaysCreatineLog: state.todaysCreatineLog,
        selectedDate: state.selectedDate,
        fetchDataForDate: state.fetchDataForDate,
        isLoading: state.isLoading,
        bodyWeightLog: state.bodyWeightLog,
        favoriteMeals: state.favoriteMeals || [],
        recentMeals: state.recentMeals || [],
        addFavoriteMeal: state.addFavoriteMeal,
        deleteFavoriteMeal: state.deleteFavoriteMeal,
        fetchNotifications: state.fetchNotifications,
        fetchInitialData: state.fetchInitialData,
    }));

    const [modal, setModal] = useState({ type: null, data: null });
    const [viewLog, setViewLog] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [logToDelete, setLogToDelete] = useState(null);
    const [mealGroupToDelete, setMealGroupToDelete] = useState(null);
    const [showCreatinaTracker, setShowCreatinaTracker] = useState(false);

    // --- Helper para procesar eventos del servidor ---
    const processGamificationEvents = (events) => {
        if (!events || !Array.isArray(events)) return;
        events.forEach(event => {
            if (event.type === 'xp' && event.amount > 0) {
                addToast(`+${event.amount} XP: ${event.reason}`, 'success');
            } else if (event.type === 'badge') {
                addToast(`¡Insignia Desbloqueada! ${event.badge.name}`, 'success');
            } else if (event.type === 'info') {
                addToast(event.message, 'info');
            }
        });
    };

    const imageMap = useMemo(() => {
        const map = {};
        const mergeItems = (items) => {
            if (!items) return;
            items.forEach(item => {
                const name = item.description || item.name;
                if (!name) return;
                const key = name.toLowerCase().trim();
                const img = item.image_url || item.image || item.img;
                if (img) {
                    const ts = item.updated_at ? new Date(item.updated_at).getTime() : 0;
                    if (!map[key] || ts >= map[key].timestamp) {
                        map[key] = { url: img, timestamp: ts };
                    }
                }
            });
        };
        mergeItems(favoriteMeals);
        mergeItems(recentMeals);
        mergeItems(nutritionLog);
        return map;
    }, [nutritionLog, favoriteMeals, recentMeals]);

    const latestWeight = useMemo(() => {
        if (!bodyWeightLog || bodyWeightLog.length === 0) return userProfile?.weight || null;
        const sortedLog = [...bodyWeightLog].sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
        return parseFloat(sortedLog[0].weight_kg);
    }, [bodyWeightLog, userProfile]);

    const calorieTarget = useMemo(() => {
        if (!userProfile || !userProfile.goal || !latestWeight) return 2000;
        const { gender, age, height, activity_level = 1.2, goal } = userProfile;

        let bmr = (10 * latestWeight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
        
        let target = bmr * activity_level;
        if (goal === 'lose') target -= 500;
        if (goal === 'gain') target += 500;
        return Math.round(target);
    }, [userProfile, latestWeight]);

    const proteinTarget = useMemo(() => {
        if (!latestWeight || !userProfile?.goal) return 0;
        const multiplier = userProfile.goal === 'gain' ? 2.0 : userProfile.goal === 'lose' ? 1.8 : 1.6;
        return Math.round(latestWeight * multiplier);
    }, [latestWeight, userProfile]);

    const sugarTarget = useMemo(() => {
        return Math.round((calorieTarget * 0.10) / 4);
    }, [calorieTarget]);

    const waterTarget = useMemo(() => {
        if (!latestWeight) return 2500;
        return Math.round(latestWeight * 35);
    }, [latestWeight]);

    const handleSaveWater = async (quantity_ml) => {
        setIsSubmitting(true);
        try {
            const res = await nutritionService.upsertWaterLog({ log_date: selectedDate, quantity_ml });
            addToast('Registro de agua actualizado.', 'success');

            if (res && res.gamification) {
                processGamificationEvents(res.gamification);
            }

            await fetchDataForDate(selectedDate);

            if (fetchNotifications) fetchNotifications();
            if (fetchInitialData) fetchInitialData();

            setModal({ type: null, data: null });
        } catch (error) {
            addToast(error.message || 'Error al guardar el agua.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveFood = async (formDataOrArray) => {
        setIsSubmitting(true);
        try {
            const isArray = Array.isArray(formDataOrArray);

            const processFavorites = async (food) => {
                const shouldBeFavorite = food.isFavorite || food.saveAsFavorite;

                if (shouldBeFavorite) {
                    try {
                        const alreadyExists = favoriteMeals.some(
                            f => f.name.toLowerCase().trim() === food.description.toLowerCase().trim()
                        );

                        if (!alreadyExists) {
                            await addFavoriteMeal({
                                name: food.description,
                                calories: food.calories,
                                protein_g: food.protein_g,
                                carbs_g: food.carbs_g,
                                fats_g: food.fats_g,
                                weight_g: food.weight_g,
                                image_url: food.image_url,
                                micronutrients: food.micronutrients
                            });
                        }
                    } catch (err) {
                        console.error("Error guardando favorito en background:", err);
                    }
                }
                else if (food.wasInitiallyFavorite && !shouldBeFavorite) {
                    const favToDelete = favoriteMeals.find(
                        f => f.name.toLowerCase().trim() === food.description.toLowerCase().trim()
                    );
                    if (favToDelete) {
                        try {
                            await deleteFavoriteMeal(favToDelete.id);
                        } catch (err) {
                            console.error("Error eliminando favorito en background:", err);
                        }
                    }
                }
            };

            const foodsToProcess = isArray ? formDataOrArray : [formDataOrArray];
            foodsToProcess.forEach(food => processFavorites(food));

            if (modal.data?.id) {
                const formData = isArray ? formDataOrArray[0] : formDataOrArray;
                if (!formData) {
                    throw new Error("No se proporcionaron datos para la actualización.");
                }
                const res = await nutritionService.updateFoodLog(modal.data.id, formData);

                if (res && res.gamification) {
                    processGamificationEvents(res.gamification);
                }

                addToast('Comida actualizada.', 'success');
            } else {
                const foodsToAdd = isArray ? formDataOrArray : [formDataOrArray];
                const payloads = foodsToAdd.map(food => ({
                    ...food,
                    log_date: selectedDate,
                    meal_type: modal.data.mealType,
                }));

                const responses = await Promise.all(payloads.map(payload => nutritionService.addFoodLog(payload)));

                responses.forEach(res => {
                    if (res && res.gamification) {
                        processGamificationEvents(res.gamification);
                    }
                });

                addToast(payloads.length > 1 ? `${payloads.length} comidas añadidas.` : 'Comida añadida.', 'success');
            }

            await fetchDataForDate(selectedDate);

            if (fetchNotifications) fetchNotifications();
            if (fetchInitialData) fetchInitialData();

            setModal({ type: null, data: null });
        } catch (error) {
            addToast(error.message || 'Error al guardar la(s) comida(s).', 'error');
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

            if (fetchNotifications) fetchNotifications();
            if (fetchInitialData) fetchInitialData();

            setLogToDelete(null);
        } catch (error) {
            addToast(error.message || 'Error al eliminar la comida.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteMealGroup = async () => {
        if (!mealGroupToDelete) return;
        setIsSubmitting(true);
        try {
            const logsToDelete = nutritionLog.filter(log => log.meal_type === mealGroupToDelete);
            const promises = logsToDelete.map(log => nutritionService.deleteFoodLog(log.id));
            await Promise.all(promises);

            const mealName = { breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Snacks' }[mealGroupToDelete];
            addToast(`Se vació el registro de ${mealName}.`, 'success');

            await fetchDataForDate(selectedDate);

            if (fetchNotifications) fetchNotifications();
            if (fetchInitialData) fetchInitialData();

            setMealGroupToDelete(null);
        } catch (error) {
            console.error(error);
            addToast('Error al eliminar las comidas.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totals = useMemo(() => {
        const result = { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0 };
        (nutritionLog || []).forEach(log => {
            result.calories += log.calories || 0;
            result.protein += parseFloat(log.protein_g) || 0;
            result.carbs += parseFloat(log.carbs_g) || 0;
            result.fats += parseFloat(log.fats_g) || 0;
            result.sugar += parseFloat(log.sugars_g || log.sugar_g) || 0;
        });
        return result;
    }, [nutritionLog]);

    const meals = useMemo(() => {
        const mealData = { breakfast: [], lunch: [], dinner: [], snack: [] };
        (nutritionLog || []).forEach(log => {
            if (mealData[log.meal_type]) {
                mealData[log.meal_type].push(log);
            }
        });
        return mealData;
    }, [nutritionLog]);

    const mealTotals = useMemo(() => {
        const totals = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
        (nutritionLog || []).forEach(log => {
            if (totals[log.meal_type] !== undefined) {
                totals[log.meal_type] += log.calories || 0;
            }
        });
        return totals;
    }, [nutritionLog]);

    const getLogImage = (log) => {
        if (!log) return null;
        if (log.image_url) {
            return getImageUrl(log.image_url, log.updated_at);
        }
        const normalizedName = log.description?.toLowerCase().trim();
        const bestImage = imageMap[normalizedName];
        if (bestImage) {
            return getImageUrl(bestImage.url, bestImage.timestamp);
        }
        return null;
    };

    const isSugarHigh = totals.sugar >= sugarTarget;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 pb-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">

            <Helmet>
                <title>Registro de Nutrición - Pro Fitness Glass</title>
                <meta name="description" content="Registra tus comidas (desayuno, almuerzo, cena, snacks), agua y suplementos. Controla tus calorías y macronutrientes diarios." />
            </Helmet>

            <div className="flex flex-col md:flex-row justify-between items-center mb-4 mt-10 md:mt-0 gap-4">
                <h1 className="hidden md:block text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary">Nutrición</h1>
            </div>

            <DateNavigator selectedDate={selectedDate} onDateChange={fetchDataForDate} />

            {isLoading && !isSubmitting ? (
                <div className="flex justify-center items-center py-10"><Spinner size={40} /></div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                        <GlassCard className="lg:col-span-3 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Resumen del Día</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <StatCard icon={<Flame size={24} className="text-orange-500" />} title="Calorías" value={totals.calories.toLocaleString('es-ES')} unit={`/ ${calorieTarget.toLocaleString('es-ES')} kcal`} />
                                <StatCard icon={<Beef size={24} className="text-red" />} title="Proteínas" value={totals.protein.toFixed(1)} unit={`/ ${proteinTarget} g`} />
                                <StatCard icon={<Wheat size={24} className="text-blue-500" />} title="Carbs" value={totals.carbs.toFixed(1)} unit="g" />
                                <StatCard icon={<Salad size={24} className="text-yellow-500" />} title="Grasas" value={totals.fats.toFixed(1)} unit="g" />
                                
                                <div 
                                    className="cursor-pointer transition-transform hover:scale-[1.02]"
                                    onClick={() => setModal({ type: 'sugar' })}
                                >
                                    <StatCard 
                                        icon={isSugarHigh ? <AlertTriangle size={24} className="text-red animate-pulse" /> : <IceCream size={24} className="text-pink-500" />} 
                                        title="Azúcar" 
                                        value={totals.sugar.toFixed(1)} 
                                        unit={`/ ${sugarTarget} g`} 
                                        className={isSugarHigh ? "border-red/30 bg-red/5" : ""}
                                    />
                                </div>
                            </div>
                        </GlassCard>

                        <div className="lg:col-span-2 space-y-4">
                            {/* Tarjeta de Agua Rediseñada */}
                            <GlassCard 
                                className="p-5 flex flex-col relative overflow-hidden group cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => setModal({ type: 'water', data: null })}
                            >
                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5 relative z-10">
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-lg font-bold text-text-primary">Agua</h2>
                                        <span className="text-sm font-semibold text-text-muted">
                                            ({waterLog?.quantity_ml || 0} / {waterTarget} ml)
                                        </span>
                                    </div>
                                    <div className="p-1.5 rounded-full bg-white/5 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <Edit size={18} />
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center py-2 relative z-10 gap-3">
                                    <div className="relative">
                                        <Droplet size={48} className="text-blue-500 drop-shadow-lg" />
                                    </div>
                                    
                                    <div className="flex flex-col items-center">
                                        <span className="text-3xl font-black text-white tracking-tight">
                                            {waterLog?.quantity_ml || 0}
                                            <span className="text-sm font-medium text-text-muted ml-1">ml</span>
                                        </span>
                                    </div>

                                    <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden border border-white/5">
                                        <div 
                                            className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500"
                                            style={{ width: `${Math.min(100, ((waterLog?.quantity_ml || 0) / waterTarget) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                                
                                <div className="absolute -bottom-8 -right-8 text-blue-500/5 rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-700">
                                    <Droplet size={140} />
                                </div>
                            </GlassCard>

                            {/* Tarjeta de Creatina Rediseñada */}
                            <GlassCard 
                                className="p-5 flex flex-col relative overflow-hidden group cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => setShowCreatinaTracker(true)}
                            >
                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5 relative z-10">
                                    <h2 className="text-lg font-bold text-text-primary">Creatina</h2>
                                    <div className="p-1.5 rounded-full bg-white/5 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                        <Plus size={18} />
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center py-2 relative z-10 gap-3">
                                    <div className={`relative transition-all duration-500 ${todaysCreatineLog?.length > 0 ? 'scale-110' : 'scale-100'}`}>
                                        <div className={`p-4 rounded-full border-4 transition-all duration-500 ${todaysCreatineLog?.length > 0 ? 'bg-purple-500 border-purple-400 text-white shadow-[0_0_30px_rgba(168,85,247,0.5)]' : 'bg-transparent border-white/10 text-text-muted'}`}>
                                            {todaysCreatineLog?.length > 0 ? (
                                                <Check size={40} strokeWidth={4} />
                                            ) : (
                                                <Zap size={40} strokeWidth={1.5} />
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-4xl font-black tracking-tighter ${todaysCreatineLog?.length > 0 ? 'text-white' : 'text-text-muted'}`}>
                                                {todaysCreatineLog?.length || 0}
                                            </span>
                                            <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">Tomas</span>
                                        </div>
                                        <span className={`text-xs font-medium mt-1 ${todaysCreatineLog?.length > 0 ? 'text-purple-400' : 'text-text-muted/50'}`}>
                                            {todaysCreatineLog?.length > 0 ? '¡Registrado!' : 'Toca para registrar'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className={`absolute -bottom-6 -right-6 rotate-12 pointer-events-none transition-all duration-700 ${todaysCreatineLog?.length > 0 ? 'text-purple-500/20 scale-125' : 'text-white/5'}`}>
                                    <Zap size={140} />
                                </div>
                            </GlassCard>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {Object.entries(meals).map(([mealType, logs]) => (
                            <GlassCard key={mealType} className="p-5 flex flex-col">
                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-lg font-bold capitalize text-text-primary">
                                            {{ breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Snacks' }[mealType]}
                                        </h2>
                                        {mealTotals[mealType] > 0 && (
                                            <span className="text-sm font-semibold text-text-muted">
                                                ({mealTotals[mealType].toLocaleString('es-ES')} kcal)
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {logs.length > 1 && (
                                            <button
                                                onClick={() => setMealGroupToDelete(mealType)}
                                                className="p-1.5 rounded-full text-red-500 hover:bg-red-500/10 transition"
                                                title="Eliminar todos los alimentos de esta comida"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setModal({ type: 'food', data: { mealType } })}
                                            className="p-1.5 rounded-full text-accent hover:bg-accent-transparent transition"
                                            title="Añadir comida"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-3">
                                    {logs.length > 0 ? logs.map(log => {
                                        const displayImage = getLogImage(log);
                                        const protein = Math.round(log.protein_g || 0);
                                        const carbs = Math.round(log.carbs_g || 0);
                                        const fats = Math.round(log.fats_g || 0);
                                        const sugars = Math.round(log.sugars_g || log.sugar_g || 0);

                                        return (
                                            <div
                                                key={log.id}
                                                onClick={() => setViewLog(log)}
                                                className="bg-bg-primary/40 hover:bg-bg-secondary/60 border border-transparent hover:border-glass-border hover:shadow-sm transition-all duration-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer group"
                                            >
                                                <MealImage
                                                    src={displayImage}
                                                    alt={log.description}
                                                    className="w-14 h-14 rounded-lg shadow-sm shrink-0"
                                                />

                                                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                                                    <div className="flex justify-between items-start">
                                                        <p className="font-semibold text-sm text-text-primary truncate pr-2 leading-tight">
                                                            {log.description}
                                                        </p>
                                                        <p className="font-bold text-xs text-accent shrink-0">
                                                            {Math.round(log.calories)} <span className="font-normal text-text-muted">kcal</span>
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-wrap items-end justify-between gap-y-1 text-[10px] sm:text-xs">
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                            
                                                            <div className="flex items-center gap-1 text-red font-bold">
                                                                <div className="w-2 h-2 rounded-full bg-red shrink-0" style={{ backgroundColor: '#ef4444' }}></div>
                                                                <span style={{ color: '#ef4444' }}>{protein}p</span>
                                                            </div>

                                                            <div className="flex items-center gap-1 text-blue-500 font-bold">
                                                                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" style={{ backgroundColor: '#3b82f6' }}></div>
                                                                <span style={{ color: '#3b82f6' }}>{carbs}c</span>
                                                            </div>

                                                            <div className="flex items-center gap-1 text-yellow-500 font-bold">
                                                                <div className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" style={{ backgroundColor: '#eab308' }}></div>
                                                                <span style={{ color: '#eab308' }}>{fats}g</span>
                                                            </div>

                                                            <div className="flex items-center gap-1 text-pink-500 font-bold">
                                                                <div className="w-2 h-2 rounded-full bg-pink-500 shrink-0" style={{ backgroundColor: '#ec4899' }}></div>
                                                                <span style={{ color: '#ec4899' }}>{sugars}a</span>
                                                            </div>

                                                        </div>
                                                        
                                                        {log.weight_g && (
                                                            <span className="text-text-muted font-medium ml-2">{Math.round(log.weight_g)}g</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center gap-1 pl-2 border-l border-white/5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setModal({ type: 'food', data: { ...log, mealType } }); }}
                                                        className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary hover:text-accent transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setLogToDelete(log); }}
                                                        className="p-1.5 rounded-md hover:bg-white/10 text-text-secondary hover:text-red-400 transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-text-muted/50 rounded-xl">
                                            <p className="text-xs font-medium">Sin registros</p>
                                            <button 
                                                onClick={() => setModal({ type: 'food', data: { mealType } })} 
                                                className="mt-2 text-xs text-accent hover:underline flex items-center gap-1"
                                            >
                                                <Plus size={12} /> Añadir
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </>
            )}

            {viewLog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="absolute inset-0" onClick={() => setViewLog(null)} />
                    <GlassCard className="w-full max-w-md p-0 overflow-hidden relative z-10 animate-scale-in flex flex-col max-h-[85vh] sm:max-h-[90vh]">

                        <div className="relative h-64 bg-black/50 flex items-center justify-center shrink-0">
                            {getLogImage(viewLog) ? (
                                <img
                                    src={getLogImage(viewLog)}
                                    alt={viewLog.description}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <Salad size={64} className="text-text-muted opacity-20" />
                            )}

                            <button
                                onClick={() => setViewLog(null)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-md"
                            >
                                <X size={20} />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                <h3 className="text-2xl font-bold text-white leading-tight break-words shadow-sm">
                                    {viewLog.description}
                                </h3>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 min-h-0">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-glass-border">
                                <div className="flex flex-col">
                                    <span className="text-sm text-text-secondary">Calorías Totales</span>
                                    <span className="text-4xl font-black text-accent">{viewLog.calories} <span className="text-lg font-medium text-text-muted">kcal</span></span>
                                </div>
                                {viewLog.weight_g && (
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm text-text-secondary flex items-center gap-1"><Scale size={14} /> Peso</span>
                                        <span className="text-xl font-bold">{viewLog.weight_g} g</span>
                                    </div>
                                )}
                            </div>

                            <h4 className="font-semibold text-text-primary mb-4">Macronutrientes</h4>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-bg-secondary/50 p-4 rounded-xl border border-glass-border flex flex-col items-center">
                                    <div className="p-2 rounded-full bg-red-500/10 mb-2">
                                        <Beef size={20} className="text-red" />
                                    </div>
                                    <span className="text-2xl font-bold text-red">{viewLog.protein_g || 0}g</span>
                                    <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Proteína</span>
                                </div>
                                <div className="bg-bg-secondary/50 p-4 rounded-xl border border-glass-border flex flex-col items-center">
                                    <div className="p-2 rounded-full bg-blue-500/10 mb-2">
                                        <Wheat size={20} className="text-blue-500" />
                                    </div>
                                    <span className="text-2xl font-bold text-blue-500">{viewLog.carbs_g || 0}g</span>
                                    <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Carbos</span>
                                </div>
                                <div className="bg-bg-secondary/50 p-4 rounded-xl border border-glass-border flex flex-col items-center">
                                    <div className="p-2 rounded-full bg-yellow-500/10 mb-2">
                                        <Salad size={20} className="text-yellow-500" />
                                    </div>
                                    <span className="text-2xl font-bold text-yellow-500">{viewLog.fats_g || 0}g</span>
                                    <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Grasas</span>
                                </div>
                                <div className="bg-bg-secondary/50 p-4 rounded-xl border border-glass-border flex flex-col items-center">
                                    <div className="p-2 rounded-full bg-pink-500/10 mb-2">
                                        <IceCream size={20} className="text-pink-500" />
                                    </div>
                                    <span className="text-2xl font-bold text-pink-500">{viewLog.sugars_g || viewLog.sugar_g || 0}g</span>
                                    <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Azúcar</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-glass-border bg-bg-secondary/30 shrink-0">
                            <button
                                onClick={() => setViewLog(null)}
                                className="w-full py-3 rounded-xl bg-bg-secondary hover:bg-white/5 border border-glass-border font-semibold transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {modal.type === 'water' && (
                <WaterLogModal
                    initialQuantity={waterLog?.quantity_ml || 0}
                    onClose={() => setModal({ type: null, data: null })}
                    onSave={handleSaveWater}
                    isLoading={isSubmitting}
                />
            )}

            {modal.type === 'food' && (
                <NutritionLogModal
                    onClose={() => setModal({ type: null, data: null })}
                    onSave={handleSaveFood}
                    mealType={modal.data?.mealType}
                    logToEdit={modal.data?.id ? modal.data : null}
                    isLoading={isSubmitting}
                />
            )}

            {modal.type === 'sugar' && (
                <SugarTargetModal
                    isOpen={true}
                    onClose={() => setModal({ type: null, data: null })}
                    currentSugar={totals.sugar}
                    maxSugar={sugarTarget}
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

            {mealGroupToDelete && (
                <ConfirmationModal
                    message={`¿Estás seguro de que quieres eliminar TODOS los alimentos de ${{ breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Snacks' }[mealGroupToDelete]
                        }?`}
                    onConfirm={handleDeleteMealGroup}
                    onCancel={() => setMealGroupToDelete(null)}
                    isLoading={isSubmitting}
                    confirmText="Eliminar Todo"
                />
            )}

            {showCreatinaTracker && (
                <CreatinaTracker
                    onClose={() => setShowCreatinaTracker(false)}
                    selectedDate={selectedDate}
                />
            )}
        </div>
    );
};

export default Nutrition;