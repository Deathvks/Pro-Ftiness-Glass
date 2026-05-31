/* frontend/src/components/nutrition/logModal/FoodDetailView.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Star } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { getFavoriteMeals } from '../../../services/favoriteMealService';
import { round as formatNumber } from '../../../hooks/useNutritionConstants';

const FoodDetailView = ({ food, onClose, onAdd }) => {
    const { addToast } = useToast();

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

    const defaultWeight = (food.serving_weight_g && food.serving_weight_g > 0) ? food.serving_weight_g : 100;
    const [weight, setWeight] = useState(defaultWeight);
    const [isFavorite, setIsFavorite] = useState(false);
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
            } catch (err) {}
        };
        checkFavorite();
    }, [food.description]);

    const currentMacros = {
        calories: (baseValues.calories * weight) / 100,
        protein: (baseValues.protein * weight) / 100,
        carbs: (baseValues.carbs * weight) / 100,
        fat: (baseValues.fat * weight) / 100,
        sugars: (baseValues.sugars * weight) / 100,
    };

    const handleWeightChange = (e) => {
        const val = parseFloat(e.target.value);
        setWeight(isNaN(val) ? '' : val);
    };

    const handleToggleFavorite = () => {
        const nextState = !isFavorite;
        setIsFavorite(nextState);
        if (nextState) addToast('Se guardará en favoritos al añadir', 'info');
    };

    const handleAddToList = () => {
        if (!weight || weight <= 0) {
            addToast('Introduce un peso válido', 'error');
            return;
        }
        onAdd({
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
            isFavorite,
            wasInitiallyFavorite
        });
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const rootUrl = apiBase.replace(/\/api\/?$/, '');
        return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    return (
        <div className="flex flex-col h-full bg-bg-primary animate-[slide-in-up_0.3s_ease-out] overflow-y-auto">
            <div className="relative w-full h-48 bg-bg-secondary flex-shrink-0 flex items-center justify-center pb-6 overflow-hidden">
                <div className="w-full h-full absolute inset-0 opacity-30 blur-xl"
                    style={{ backgroundImage: `url('${getImageUrl(food.image_url)}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />

                <div className="relative w-32 h-32 rounded-2xl border border-glass-border shadow-md overflow-hidden z-10 bg-bg-primary flex items-center justify-center">
                    {food.image_url ? (
                        <img
                            src={getImageUrl(food.image_url)}
                            alt={food.description}
                            className="w-full h-full object-contain p-2"
                        />
                    ) : (
                        <span className="text-5xl">🥗</span>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-bg-primary to-transparent z-10" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-bg-primary text-text-primary rounded-full shadow-sm transition-colors z-30 border border-glass-border hover:bg-bg-secondary"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-grow p-6 flex flex-col relative z-20 -mt-6 bg-bg-primary rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-start mb-6">
                    <div className="pr-4">
                        <h2 className="text-2xl font-extrabold text-text-primary leading-tight line-clamp-2">
                            {food.description}
                        </h2>
                        {food.brand && (
                            <p className="text-text-secondary text-sm font-bold mt-1 uppercase tracking-wider">
                                {food.brand}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleToggleFavorite}
                        className={`p-3 rounded-full flex-shrink-0 transition-all duration-300 border border-glass-border ${
                            isFavorite ? 'bg-accent/10' : 'bg-bg-secondary hover:bg-glass-bg'
                        }`}
                    >
                        <Star 
                            size={24} 
                            className={`transition-all duration-300 ${isFavorite ? 'fill-accent text-accent scale-110' : 'text-text-muted'}`} 
                        />
                    </button>
                </div>

                <div className="bg-bg-secondary p-5 rounded-2xl border border-glass-border mb-6 shadow-sm">
                    <div className="flex justify-between items-end mb-4">
                        <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest">Cantidad a consumir</label>
                        <div className="flex items-baseline">
                            <input
                                type="number"
                                value={weight}
                                onChange={handleWeightChange}
                                className="w-28 bg-transparent text-right text-4xl font-black text-text-primary focus:outline-none transition-colors 
                                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-b-2 border-accent/50 focus:border-accent"
                                placeholder="0"
                                min="0.1"
                                step="0.1"
                            />
                            <span className="ml-1 text-lg text-accent font-black">g</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setWeight(100)}
                            className={`flex-1 py-3 px-4 text-xs font-extrabold rounded-xl transition-all duration-300 border ${
                                weight === 100 ? 'bg-accent text-white border-accent' : 'bg-bg-primary text-text-secondary border-glass-border hover:border-accent/50'
                            }`}
                        >
                            100 g
                        </button>
                        {food.serving_weight_g && food.serving_weight_g !== 100 && (
                            <button
                                onClick={() => setWeight(food.serving_weight_g)}
                                className={`flex-1 py-3 px-4 text-xs font-extrabold rounded-xl transition-all duration-300 border ${
                                    weight === food.serving_weight_g ? 'bg-accent text-white border-accent' : 'bg-bg-primary text-text-secondary border-glass-border hover:border-accent/50'
                                }`}
                            >
                                Ración ({food.serving_weight_g}g)
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-5 bg-bg-secondary rounded-2xl border border-glass-border flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
                        <span className="text-5xl font-black text-text-primary mb-1 tracking-tight">
                            {Math.round(currentMacros.calories || 0)}
                        </span>
                        <span className="text-[11px] text-text-muted uppercase tracking-widest font-black mb-1">Kcal</span>
                        <span className="text-[10px] font-extrabold text-accent mt-1">
                            ({formatNumber(baseValues.calories, 1)} / 100g)
                        </span>
                    </div>

                    <div className="grid grid-rows-4 gap-2">
                        <MacroRow label="Proteína" value={currentMacros.protein} hexColor="#ef4444" />
                        <MacroRow label="Carbos" value={currentMacros.carbs} hexColor="#3b82f6" />
                        <MacroRow label="Grasas" value={currentMacros.fat} hexColor="#22c55e" />
                        <MacroRow label="Azúcar" value={currentMacros.sugars} hexColor="#ec4899" />
                    </div>
                </div>

                <div className="mt-auto pb-4">
                    <button
                        onClick={handleAddToList}
                        disabled={!weight || weight <= 0}
                        className="w-full py-4 bg-accent text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                    >
                        <Plus size={22} strokeWidth={3} />
                        <span className="text-[15px]">Añadir a la Lista</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const MacroRow = ({ label, value, hexColor }) => (
    <div className="flex items-center justify-between px-3 py-2 bg-bg-secondary rounded-xl border border-glass-border relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 opacity-80" style={{ backgroundColor: hexColor }}></div>
        <span className="text-xs text-text-secondary font-extrabold pl-2">{label}</span>
        <span className="text-sm font-bold" style={{ color: hexColor }}>
            {formatNumber(value || 0, 1)}g
        </span>
    </div>
);

export default FoodDetailView;