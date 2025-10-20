import React from 'react';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MealLogItem = ({ log, onEdit, onDelete }) => (
  // --- INICIO DE LA MODIFICACIÓN ---
  <li className="flex items-center gap-3 py-3">
    {log.image_url && (
      <div className="flex-shrink-0">
        <img
          src={`${VITE_API_BASE_URL}${log.image_url}`}
          alt={log.description}
          className="w-16 h-16 object-cover rounded-lg bg-bg-secondary"
        />
      </div>
    )}
    <div className="flex-grow">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-text-primary capitalize">{log.description}</p>
          <p className="text-sm text-text-muted">
            {Math.round(log.calories)} kcal
            {log.weight_g > 0 && ` (${log.weight_g}g)`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onEdit(log)} className="text-text-muted hover:text-accent transition-colors"><Edit2 size={18} /></button>
          <button onClick={() => onDelete(log)} className="text-text-muted hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
        </div>
      </div>
      <div className="flex justify-start gap-4 text-xs text-text-secondary mt-1">
        <span>P: {parseFloat(log.protein_g) || 0}g</span>
        <span>C: {parseFloat(log.carbs_g) || 0}g</span>
        <span>G: {parseFloat(log.fats_g) || 0}g</span>
      </div>
    </div>
  </li>
  // --- FIN DE LA MODIFICACIÓN ---
);

const MealSection = ({ title, mealType, logs, onAdd, onEdit, onDelete, isOpen, onToggle }) => {
  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);

  return (
    <div className="bg-glass border border-glass-border rounded-xl backdrop-blur-lg">
      <button
        onClick={() => onToggle(mealType)}
        className="flex justify-between items-center w-full p-4"
      >
        <div>
          <h3 className="font-bold text-lg text-text-primary text-left">{title}</h3>
          <p className="text-sm text-text-secondary text-left">{Math.round(totalCalories)} kcal</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-full bg-accent/20">
            {isOpen ? <ChevronUp size={20} className="text-accent" /> : <ChevronDown size={20} className="text-accent" />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 animate-[fade-in-down_0.3s_ease-out]">
          <ul className="divide-y divide-glass-border">
            {logs.map(log => (
              <MealLogItem key={log.id} log={log} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </ul>
          <button
            onClick={() => onAdd(mealType)}
            className="w-full flex items-center justify-center gap-2 mt-3 py-3 text-accent font-semibold bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors"
          >
            <Plus size={18} /> Añadir Comida
          </button>
        </div>
      )}
    </div>
  );
};

const MealsSection = ({ nutritionLogs, onAddFood, onEditFood, onDeleteFood, openSections, toggleSection }) => {
  const meals = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };

  nutritionLogs.forEach(log => {
    if (meals[log.meal_type]) {
      meals[log.meal_type].push(log);
    }
  });

  return (
    <div className="space-y-4">
      <MealSection
        title="Desayuno"
        mealType="breakfast"
        logs={meals.breakfast}
        onAdd={onAddFood}
        onEdit={onEditFood}
        onDelete={onDeleteFood}
        isOpen={openSections.breakfast}
        onToggle={toggleSection}
      />
      <MealSection
        title="Almuerzo"
        mealType="lunch"
        logs={meals.lunch}
        onAdd={onAddFood}
        onEdit={onEditFood}
        onDelete={onDeleteFood}
        isOpen={openSections.lunch}
        onToggle={toggleSection}
      />
      <MealSection
        title="Cena"
        mealType="dinner"
        logs={meals.dinner}
        onAdd={onAddFood}
        onEdit={onEditFood}
        onDelete={onDeleteFood}
        isOpen={openSections.dinner}
        onToggle={toggleSection}
      />
      <MealSection
        title="Snacks"
        mealType="snack"
        logs={meals.snack}
        onAdd={onAddFood}
        onEdit={onEditFood}
        onDelete={onDeleteFood}
        isOpen={openSections.snack}
        onToggle={toggleSection}
      />
    </div>
  );
};

export default MealsSection;