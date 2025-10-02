import React from 'react';
import { Flame, Beef, Wheat, Salad, Droplet, Zap } from 'lucide-react';
import GlassCard from '../GlassCard';
import StatCard from '../StatCard';

const SummarySection = ({ totals, targets, waterLog, onWaterClick, onCreatineClick }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
      <GlassCard className="lg:col-span-3 p-6">
        <h3 className="text-xl font-bold mb-4">Resumen del Día</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard icon={<Flame size={24} />} title="Calorías" value={totals.calories.toLocaleString('es-ES')} unit={`/ ${targets.calories.toLocaleString('es-ES')} kcal`} />
          <StatCard icon={<Beef size={24} />} title="Proteínas" value={totals.protein.toFixed(1)} unit={`/ ${targets.protein} g`} />
          <StatCard icon={<Wheat size={24} />} title="Carbs" value={totals.carbs.toFixed(1)} unit="g" />
          <StatCard icon={<Salad size={24} />} title="Grasas" value={totals.fats.toFixed(1)} unit="g" />
        </div>
      </GlassCard>

      <div className="lg:col-span-2 space-y-4">
        {/* Agua */}
        <GlassCard className="p-6 flex flex-col justify-between">
          <h3 className="text-xl font-bold">Agua</h3>
          <div className="flex items-center justify-center gap-4 my-4">
            <Droplet size={32} className="text-blue-400" />
            <p className="text-4xl font-bold">
              {waterLog.quantity_ml}
              <span className="text-base font-medium text-text-muted"> / {targets.water} ml</span>
            </p>
          </div>
          <button onClick={onWaterClick} className="flex items-center justify-center gap-2 w-full rounded-md bg-accent/10 text-accent font-semibold py-3 border border-accent/20 hover:bg-accent/20 transition-colors">
            Añadir / Editar Agua
          </button>
        </GlassCard>

        {/* Creatina */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Zap size={24} className="text-accent" />
              Creatina
            </h3>
          </div>
          <button onClick={onCreatineClick} className="flex items-center justify-center gap-2 w-full rounded-md bg-accent/10 text-accent font-semibold py-3 border border-accent/20 hover:bg-accent/20 transition-colors">
            <Zap size={20} />
            <span>Gestionar Creatina</span>
          </button>
        </GlassCard>
      </div>
    </div>
  );
};

export default SummarySection;