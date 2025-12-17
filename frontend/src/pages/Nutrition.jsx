/* frontend/src/pages/Nutrition.jsx */
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, ChevronRight, Plus, Droplet, Flame, Beef, Wheat, Salad, Edit, Trash2, Zap, BookOpen, X, Scale, Image as ImageIcon } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore';
import WaterLogModal from '../components/WaterLogModal';
import NutritionLogModal from '../components/NutritionLogModal';
import ConfirmationModal from '../components/ConfirmationModal';
import CreatinaTracker from '../components/CreatinaTracker';
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

    return (
        <div className="flex items-center justify-between mb-8 mt-6 sm:mt-0">
            <button onClick={() => changeDay(-1)} className="p-2 rounded-full hover:bg-white/10 transition">
                <ChevronLeft />
            </button>
            <div className="text-center">
                <p className="text-xl font-bold">
                    {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
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

// --- INICIO DE LA MODIFICACIÓN ---
// Nuevo componente para manejar la carga de imágenes y errores (evita el cuadro negro)
const MealImage = ({ src, alt, className, onClick }) => {
    const [hasError, setHasError] = useState(false);
    const [imgSrc, setImgSrc] = useState(src);

    // Reiniciar estado si cambia el src
    useEffect(() => {
        setImgSrc(src);
        setHasError(false);
    }, [src]);

    // Si no hay imagen o dio error, mostramos el fallback (Icono)
    if (!imgSrc || hasError) {
        return (
            <div
                className={`flex-shrink-0 rounded-md bg-bg-secondary/50 overflow-hidden border border-glass-border flex items-center justify-center ${className}`}
                onClick={onClick}
            >
                <ImageIcon size={20} className="text-text-muted opacity-70" />
            </div>
        );
    }

    return (
        <div className={`flex-shrink-0 rounded-md bg-bg-primary overflow-hidden border border-glass-border ${className}`} onClick={onClick}>
            <img
                src={imgSrc}
                alt={alt}
                className="w-full h-full object-cover"
                onError={() => setHasError(true)}
            />
        </div>
    );
};
// --- FIN DE LA MODIFICACIÓN ---

// Componente principal de la página de Nutrición
const Nutrition = ({ setView }) => {
    const { addToast } = useToast();
    const {
        userProfile,
        nutritionLog,
        waterLog,
        selectedDate,
        fetchDataForDate,
        isLoading,
        bodyWeightLog,
        favoriteMeals,
        recentMeals
    } = useAppStore(state => ({
        userProfile: state.userProfile,
        nutritionLog: state.nutritionLog,
        waterLog: state.waterLog,
        selectedDate: state.selectedDate,
        fetchDataForDate: state.fetchDataForDate,
        isLoading: state.isLoading,
        bodyWeightLog: state.bodyWeightLog,
        favoriteMeals: state.favoriteMeals || [],
        recentMeals: state.recentMeals || []
    }));

    const [modal, setModal] = useState({ type: null, data: null });
    const [viewLog, setViewLog] = useState(null); // Estado para el modal de detalles
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [logToDelete, setLogToDelete] = useState(null);
    const [showCreatinaTracker, setShowCreatinaTracker] = useState(false);

    // Mapa inteligente de imágenes
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
                    // Si ya existe una entrada, solo la reemplazamos si la nueva es más reciente
                    // O si tiene el mismo timestamp (por ejemplo, items actuales)
                    if (!map[key] || ts >= map[key].timestamp) {
                        map[key] = { url: img, timestamp: ts };
                    }
                }
            });
        };
        // El orden importa: Favoritos -> Recientes -> Log Actual (El log actual tiene prioridad si es más reciente)
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
        const { gender, age, height, activity_level, goal } = userProfile;
        let bmr = gender === 'male'
            ? 88.362 + (13.397 * latestWeight) + (4.799 * height) - (5.677 * age)
            : 447.593 + (9.247 * latestWeight) + (3.098 * height) - (4.330 * age);
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

    const waterTarget = useMemo(() => {
        if (!latestWeight) return 2500;
        return Math.round(latestWeight * 35);
    }, [latestWeight]);

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

    const handleSaveFood = async (formDataOrArray) => {
        setIsSubmitting(true);
        try {
            const isArray = Array.isArray(formDataOrArray);

            if (modal.data?.id) {
                const formData = isArray ? formDataOrArray[0] : formDataOrArray;
                if (!formData) {
                    throw new Error("No se proporcionaron datos para la actualización.");
                }
                await nutritionService.updateFoodLog(modal.data.id, formData);
                addToast('Comida actualizada.', 'success');
            } else {
                const foodsToAdd = isArray ? formDataOrArray : [formDataOrArray];
                const payloads = foodsToAdd.map(food => ({
                    ...food,
                    log_date: selectedDate,
                    meal_type: modal.data.mealType,
                }));
                await Promise.all(payloads.map(payload => nutritionService.addFoodLog(payload)));
                addToast(payloads.length > 1 ? `${payloads.length} comidas añadidas.` : 'Comida añadida.', 'success');
            }

            await fetchDataForDate(selectedDate);
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
            setLogToDelete(null);
        } catch (error) {
            addToast(error.message || 'Error al eliminar la comida.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totals = useMemo(() => {
        const result = { calories: 0, protein: 0, carbs: 0, fats: 0 };
        (nutritionLog || []).forEach(log => {
            result.calories += log.calories || 0;
            result.protein += parseFloat(log.protein_g) || 0;
            result.carbs += parseFloat(log.carbs_g) || 0;
            result.fats += parseFloat(log.fats_g) || 0;
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

    // Función auxiliar para obtener la imagen de un log específico para el modal
    const getLogImage = (log) => {
        if (!log) return null;

        // Prioridad 1: Si el log tiene imagen explícita, usarla (útil para actualizaciones inmediatas)
        if (log.image_url) {
            return getImageUrl(log.image_url, log.updated_at);
        }
        // Prioridad 2: Buscar en el mapa (para favoritos, recientes, o si se borró pero hay histórico)
        const normalizedName = log.description?.toLowerCase().trim();
        const bestImage = imageMap[normalizedName];
        if (bestImage) {
            return getImageUrl(bestImage.url, bestImage.timestamp);
        }
        return null;
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 pb-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">

            <Helmet>
                <title>Registro de Nutrición - Pro Fitness Glass</title>
                <meta name="description" content="Registra tus comidas (desayuno, almuerzo, cena, snacks), agua y suplementos. Controla tus calorías y macronutrientes diarios." />
            </Helmet>

            <div className="flex flex-col md:flex-row justify-between items-center mb-4 mt-10 md:mt-0 gap-4">
                <h1 className="hidden md:block text-4xl font-extrabold">Nutrición</h1>
                <button
                    onClick={() => setView('templateDiets')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/20 hover:brightness-110 transition-all w-full md:w-auto justify-center"
                >
                    <BookOpen size={20} />
                    <span>Dietas Recomendadas</span>
                </button>
            </div>

            <DateNavigator selectedDate={selectedDate} onDateChange={fetchDataForDate} />

            {isLoading && !isSubmitting ? (
                <div className="flex justify-center items-center py-10"><Spinner size={40} /></div>
            ) : (
                <>
                    {/* Resumen y Suplementos */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                        <GlassCard className="lg:col-span-3 p-6">
                            <h2 className="text-xl font-bold mb-4">Resumen del Día</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <StatCard icon={<Flame size={24} />} title="Calorías" value={totals.calories.toLocaleString('es-ES')} unit={`/ ${calorieTarget.toLocaleString('es-ES')} kcal`} />
                                <StatCard icon={<Beef size={24} />} title="Proteínas" value={totals.protein.toFixed(1)} unit={`/ ${proteinTarget} g`} />
                                <StatCard icon={<Wheat size={24} />} title="Carbs" value={totals.carbs.toFixed(1)} unit="g" />
                                <StatCard icon={<Salad size={24} />} title="Grasas" value={totals.fats.toFixed(1)} unit="g" />
                            </div>
                        </GlassCard>

                        <div className="lg:col-span-2 space-y-4">
                            {/* Agua */}
                            <GlassCard className="p-6 flex flex-col justify-between">
                                <h2 className="text-xl font-bold">Agua</h2>
                                <div className="flex items-center justify-center gap-4 my-4">
                                    <Droplet size={32} className="text-blue-400" />
                                    <p className="text-4xl font-bold">{(waterLog?.quantity_ml || 0)}<span className="text-base font-medium text-text-muted"> / {waterTarget} ml</span></p>
                                </div>
                                <button onClick={() => setModal({ type: 'water', data: null })} className="flex items-center justify-center gap-2 w-full rounded-md bg-accent/10 text-accent font-semibold py-3 border border-accent/20 hover:bg-accent/20 transition-colors">
                                    <Plus size={20} />
                                    <span>Añadir / Editar Agua</span>
                                </button>
                            </GlassCard>

                            {/* Creatina */}
                            <GlassCard className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Zap size={24} className="text-accent" />
                                        Creatina
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowCreatinaTracker(true)}
                                    className="flex items-center justify-center gap-2 w-full rounded-md bg-accent/10 text-accent font-semibold py-3 border border-accent/20 hover:bg-accent/20 transition-colors"
                                >
                                    <Zap size={20} />
                                    <span>Gestionar Creatina</span>
                                </button>
                            </GlassCard>
                        </div>
                    </div>

                    {/* Sección de Comidas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(meals).map(([mealType, logs]) => (
                            <GlassCard key={mealType} className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold capitalize">
                                        {{ breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Snacks' }[mealType]}
                                        {mealTotals[mealType] > 0 && (
                                            <span className="text-base font-medium text-text-secondary ml-2">
                                                ({mealTotals[mealType].toLocaleString('es-ES')} kcal)
                                            </span>
                                        )}
                                    </h2>
                                    <button onClick={() => setModal({ type: 'food', data: { mealType } })} className="p-2 -m-2 rounded-full text-accent hover:bg-accent-transparent transition">
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {logs.length > 0 ? logs.map(log => {
                                        const displayImage = getLogImage(log);

                                        return (
                                            <div
                                                key={log.id}
                                                onClick={() => setViewLog(log)}
                                                className="bg-bg-secondary p-3 rounded-md border border-glass-border group relative flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-all active:scale-[0.99]"
                                            >
                                                {/* Uso del nuevo componente MealImage */}
                                                <MealImage
                                                    src={displayImage}
                                                    alt={log.description}
                                                    className="w-12 h-12"
                                                />

                                                <div className="flex-grow pr-20 sm:pr-16 min-w-0">
                                                    <p className="font-semibold truncate">
                                                        {log.description}
                                                        {log.weight_g && ` (${log.weight_g}g)`}
                                                    </p>
                                                    <p className="text-sm text-text-secondary truncate">
                                                        {log.calories} kcal • {log.protein_g || 0}g P • {log.carbs_g || 0}g C • {log.fats_g || 0}g G
                                                    </p>
                                                </div>

                                                <div className="absolute top-1/2 -translate-y-1/2 right-2 flex flex-col sm:flex-row gap-1 sm:gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setModal({ type: 'food', data: { ...log, mealType } }); }}
                                                        className="p-2 rounded-full bg-bg-primary hover:bg-accent/20 hover:text-accent transition-all duration-200 shadow-sm border border-glass-border"
                                                        title="Editar comida"
                                                    >
                                                        <Edit size={14} className="sm:w-4 sm:h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setLogToDelete(log); }}
                                                        className="p-2 rounded-full bg-bg-primary hover:bg-red-500/20 hover:text-red-500 transition-all duration-200 shadow-sm border border-glass-border"
                                                        title="Eliminar comida"
                                                    >
                                                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <p className="text-sm text-text-muted text-center py-4">No hay registros.</p>
                                    )}
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </>
            )}

            {/* Modal de Detalle de Comida */}
            {viewLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="absolute inset-0" onClick={() => setViewLog(null)} />
                    <GlassCard className="w-full max-w-md p-0 overflow-hidden relative z-10 animate-scale-in flex flex-col max-h-[90vh]">

                        {/* Cabecera con Imagen */}
                        <div className="relative h-64 bg-black/50 flex items-center justify-center">
                            {/* Uso de MealImage con fallback manual si falla o no hay imagen para mostrar el icono */}
                            {getLogImage(viewLog) ? (
                                <img
                                    src={getLogImage(viewLog)}
                                    alt={viewLog.description}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        // Podríamos mostrar el icono aquí si quisiéramos una lógica más compleja
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

                        {/* Contenido */}
                        <div className="p-6 overflow-y-auto">
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
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-bg-secondary/50 p-4 rounded-xl border border-glass-border flex flex-col items-center">
                                    <div className="p-2 rounded-full bg-blue-500/10 mb-2">
                                        <Beef size={20} className="text-blue-400" />
                                    </div>
                                    <span className="text-2xl font-bold">{viewLog.protein_g || 0}g</span>
                                    <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Proteína</span>
                                </div>
                                <div className="bg-bg-secondary/50 p-4 rounded-xl border border-glass-border flex flex-col items-center">
                                    <div className="p-2 rounded-full bg-yellow-500/10 mb-2">
                                        <Wheat size={20} className="text-yellow-400" />
                                    </div>
                                    <span className="text-2xl font-bold">{viewLog.carbs_g || 0}g</span>
                                    <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Carbos</span>
                                </div>
                                <div className="bg-bg-secondary/50 p-4 rounded-xl border border-glass-border flex flex-col items-center">
                                    <div className="p-2 rounded-full bg-green-500/10 mb-2">
                                        <Salad size={20} className="text-green-400" />
                                    </div>
                                    <span className="text-2xl font-bold">{viewLog.fats_g || 0}g</span>
                                    <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">Grasas</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-glass-border bg-bg-secondary/30">
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

            {/* Otros Modales */}
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