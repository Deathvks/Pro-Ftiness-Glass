import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import GlassCard from '../GlassCard';

const MealCard = ({ mealType, logs, onAdd, onEdit, onDelete, mealTotals }) => {
  const mealTitles = {
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    dinner: 'Cena',
    snack: 'Snacks'
  };

  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold capitalize">
          {mealTitles[mealType]}
          {mealTotals[mealType] > 0 && (
            <span className="text-base font-medium text-text-secondary ml-2">
              ({mealTotals[mealType].toLocaleString('es-ES')} kcal)
            </span>
          )}
        </h3>
        <button onClick={() => onAdd(mealType)} className="p-2 -m-2 rounded-full text-accent hover:bg-accent-transparent transition">
          <Plus size={20} />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {logs.length > 0 ? logs.map(log => (
          <div key={log.id} className="bg-bg-secondary p-3 rounded-md border border-glass-border group relative">
            <div className="pr-20 sm:pr-16">
              <p className="font-semibold">
                {log.description}
                {log.weight_g && ` (${log.weight_g}g)`}
              </p>
              <p className="text-sm text-text-secondary">
                {log.calories} kcal • {log.protein_g || 0}g Prot • {log.carbs_g || 0}g Carbs • {log.fats_g || 0}g Grasas
              </p>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-2 flex flex-col sm:flex-row gap-1 sm:gap-1">
              <button
                onClick={() => onEdit({ ...log, mealType })}
                className="p-2 rounded-full bg-bg-primary hover:bg-accent/20 hover:text-accent transition-all duration-200 shadow-sm border border-glass-border"
                title="Editar comida"
              >
                <Edit size={14} className="sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => onDelete(log)}
                className="p-2 rounded-full bg-bg-primary hover:bg-red-500/20 hover:text-red-500 transition-all duration-200 shadow-sm border border-glass-border"
                title="Eliminar comida"
              >
                <Trash2 size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )) : (
          <p className="text-sm text-text-muted text-center py-4">No hay registros para esta comida.</p>
        )}
      </div>
    </GlassCard>
  );
};

const MealsSection = ({ meals, mealTotals, onAddFood, onEditFood, onDeleteFood }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Object.entries(meals).map(([mealType, logs]) => (
        <MealCard
          key={mealType}
          mealType={mealType}
          logs={logs}
          mealTotals={mealTotals}
          onAdd={onAddFood}
          onEdit={onEditFood}
          onDelete={onDeleteFood}
        />
      ))}
    </div>
  );
};

export default MealsSection;