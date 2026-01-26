/* frontend/src/components/nutrition/logModal/FoodDetailView.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Star } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { getFavoriteMeals } from '../../../services/favoriteMealService';
import { round as formatNumber } from '../../../hooks/useNutritionConstants';

const FoodDetailView = ({ food, onClose, onAdd }) => {
    const { addToast } = useToast();
    
    // 1. Obtener valores base por 100g para cálculos precisos
    const baseValues = useMemo(() => {
        const weightRef = parseFloat(food.weight_g) || 100;
        
        const getBase = (valPer100, totalVal) => {
            if (food[valPer100] !== undefined && food[valPer100] !== null) return parseFloat(food[valPer100]);
            return (parseFloat(totalVal || 0) / weightRef) * 100;
        };

        return {
            calories: getBase('calories_per_100g', food.calories),
            protein: getBase('protein_per_100g', food.protein_g || food.protein),
            carbs: getBase('carbs_per_100g', food.carbs_g || food.carbs),
            fat: getBase('fat_per_100g', food.fats_g || food.fat || food.fats),
            sugars: getBase('sugars_per_100g', food.sugars_g || food.sugars),
        };
    }, [food]);

    // 2. Estado del Peso (Editable)
    const defaultWeight = (food.serving_weight_g && food.serving_weight_g > 0) ? food.serving_weight_g : 100;
    const [weight, setWeight] = useState(defaultWeight);
    
    // Estado para Favoritos (Solo visual/local ahora)
    const [isFavorite, setIsFavorite] = useState(false);
    // Guardamos si ya era favorito al inicio para evitar duplicados innecesarios
    const [wasInitiallyFavorite, setWasInitiallyFavorite] = useState(false); 

    useEffect(() => {
        const checkFavorite = async () => {
            try {
                const favs = await getFavoriteMeals();
                const found = favs.find(f => f.name.toLowerCase() === food.description.toLowerCase());
                if (found) {
                    setIsFavorite(true);
                    setWasInitiallyFavorite(true);
                }
            } catch (err) {
                console.error("Error checking favorites", err);
            }
        };
        checkFavorite();
    }, [food.description]);

    // 3. Calcular Macros Visuales basados en el peso actual (input)
    const currentMacros = {
        calories: (baseValues.calories * weight) / 100,
        protein: (baseValues.protein * weight) / 100,
        carbs: (baseValues.carbs * weight) / 100,
        fat: (baseValues.fat * weight) / 100,
        sugars: (baseValues.sugars * weight) / 100,
    };

    // Helpers de manejo
    const handleWeightChange = (e) => {
        const val = parseFloat(e.target.value);
        setWeight(isNaN(val) ? '' : val);
    };

    const handleToggleFavorite = () => {
        const nextState = !isFavorite;
        setIsFavorite(nextState);
        // Notificación al usuario si activa el favorito
        if (nextState) {
            addToast('Se guardará en favoritos al añadir el alimento a la comida', 'info');
        }
    };

    const handleAddToList = () => {
        if (!weight || weight <= 0) {
            addToast('Introduce un peso válido', 'error');
            return;
        }
        const finalItem = {
            ...food,
            weight_g: parseFloat(weight),
            calories: parseFloat(currentMacros.calories),
            protein_g: parseFloat(currentMacros.protein),
            carbs_g: parseFloat(currentMacros.carbs),
            fats_g: parseFloat(currentMacros.fat),
            sugars_g: parseFloat(currentMacros.sugars),
            calories_per_100g: baseValues.calories,
            protein_per_100g: baseValues.protein,
            carbs_per_100g: baseValues.carbs,
            fat_per_100g: baseValues.fat,
            sugars_per_100g: baseValues.sugars,
            // Pasamos el flag de favorito para que el componente padre lo gestione al guardar
            isFavorite: isFavorite,
            wasInitiallyFavorite: wasInitiallyFavorite
        };
        onAdd(finalItem);
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const rootUrl = apiBase.replace(/\/api\/?$/, ''); 
        return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    return (
        <div className="flex flex-col h-full bg-bg-secondary animate-[slide-in-up_0.3s] overflow-y-auto">
            {/* --- Header / Imagen --- */}
            <div className="relative w-full h-48 bg-gray-900 flex-shrink-0 flex items-center justify-center pb-6">
                
                {/* Contenedor de Imagen */}
                <div className="w-full h-full absolute inset-0 opacity-40 blur-lg" 
                     style={{ backgroundImage: `url('${getImageUrl(food.image_url)}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                
                <div className="relative w-32 h-32 rounded-xl border-2 border-white/50 shadow-xl overflow-hidden z-10">
                    {food.image_url ? (
                        <img 
                            src={getImageUrl(food.image_url)} 
                            alt={food.description} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 bg-gray-800">
                            <span className="text-4xl">🥗</span>
                        </div>
                    )}
                </div>

                {/* Gradiente inferior */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-bg-secondary to-transparent z-20" />

                {/* Botón Cerrar */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors z-30 border border-white/10"
                >
                    <X size={20} />
                </button>
            </div>

            {/* --- Contenido --- */}
            <div className="flex-grow p-6 flex flex-col relative z-20 -mt-6 bg-bg-secondary rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
                
                {/* Nombre y Botón Favoritos */}
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-text-primary leading-tight pr-4">
                        {food.description}
                    </h2>
                    {/* Botón Favorito (Toggle Local) */}
                    <button 
                        onClick={handleToggleFavorite}
                        className={`p-2 rounded-full flex-shrink-0 transition-all ${
                            isFavorite ? 'text-accent hover:bg-accent/10' : 'text-text-muted hover:text-text-primary'
                        }`}
                    >
                        <Star size={24} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                </div>

                <p className="text-text-secondary text-sm mb-6 -mt-4">
                    {food.brand ? `${food.brand} • ` : ''} Información nutricional
                </p>

                {/* --- INPUT DE PESO Y BOTONES RÁPIDOS --- */}
                <div className="bg-bg-primary p-4 rounded-2xl border border-glass-border mb-6 shadow-inner">
                    <div className="flex justify-between items-end mb-3">
                        <label className="text-sm font-medium text-text-secondary">Cantidad a consumir</label>
                        <div className="flex items-baseline">
                            <input
                                type="number"
                                value={weight}
                                onChange={handleWeightChange}
                                className="w-24 bg-transparent text-right text-3xl font-bold text-text-primary focus:outline-none border-b-2 border-accent/50 focus:border-accent transition-colors 
                                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0"
                                min="0.1"
                                step="0.1"
                            />
                            <span className="ml-1 text-text-secondary font-medium">g</span>
                        </div>
                    </div>

                    {/* Botones rápidos */}
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setWeight(100)}
                            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all border ${
                                weight === 100 
                                ? 'bg-accent text-white border-accent' 
                                : 'bg-bg-secondary text-text-secondary border-glass-border hover:border-accent/50'
                            }`}
                        >
                            100 g
                        </button>
                        {food.serving_weight_g && food.serving_weight_g !== 100 && (
                            <button 
                                onClick={() => setWeight(food.serving_weight_g)}
                                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all border ${
                                    weight === food.serving_weight_g 
                                    ? 'bg-accent text-white border-accent' 
                                    : 'bg-bg-secondary text-text-secondary border-glass-border hover:border-accent/50'
                                }`}
                            >
                                Ración ({food.serving_weight_g}g)
                            </button>
                        )}
                    </div>
                </div>

                {/* --- MACROS GRID --- */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Calorías */}
                    <div className="p-4 bg-bg-primary rounded-2xl border border-glass-border flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
                        <span className="text-4xl font-extrabold text-text-primary mb-1">
                            {Math.round(currentMacros.calories || 0)}
                        </span>
                        <span className="text-xs text-text-muted uppercase tracking-wider font-bold">Kcal</span>
                        <span className="text-xs text-accent mt-1">
                            ({formatNumber(baseValues.calories, 1)} / 100g)
                        </span>
                    </div>
                    
                    {/* Resto de Macros */}
                    <div className="grid grid-rows-4 gap-2">
                        <MacroRow label="Proteína" value={currentMacros.protein} color="text-green-500" barColor="bg-green-500" />
                        <MacroRow label="Carbos" value={currentMacros.carbs} color="text-blue-500" barColor="bg-blue-500" />
                        <MacroRow label="Grasas" value={currentMacros.fat} color="text-yellow-500" barColor="bg-yellow-500" />
                        <MacroRow label="Azúcar" value={currentMacros.sugars} color="text-pink-500" barColor="bg-pink-500" />
                    </div>
                </div>

                {/* Botón de Acción Principal */}
                <div className="mt-auto">
                    <button 
                        onClick={handleAddToList}
                        disabled={!weight || weight <= 0}
                        className="w-full py-4 bg-accent hover:bg-accent-hover text-white font-bold rounded-2xl shadow-lg shadow-accent/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={24} strokeWidth={3} />
                        <span>Añadir a la Lista</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Subcomponente para fila de macros
const MacroRow = ({ label, value, color, barColor }) => (
    <div className="flex items-center justify-between px-3 py-2 bg-bg-primary rounded-xl border border-glass-border relative overflow-hidden">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor} opacity-80`}></div>
        <span className="text-xs text-text-secondary font-semibold pl-2">{label}</span>
        <span className={`text-sm font-bold ${color}`}>
            {formatNumber(value || 0, 1)}g
        </span>
    </div>
);

export default FoodDetailView;