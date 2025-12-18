/* frontend/src/components/StatCard.jsx */
import React from 'react';
import GlassCard from './GlassCard';

const StatCard = ({ icon, title, value, unit, onClick }) => (
  <GlassCard
    className={`
      relative overflow-hidden p-5 transition-all duration-300 hover:scale-[1.02] group h-full
      flex flex-col items-center justify-center text-center gap-3
      ${onClick ? 'cursor-pointer hover:bg-white/5' : ''}
    `}
    onClick={onClick}
  >
    {/* Fondo decorativo sutil (glow) */}
    <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-all duration-500" />

    {/* Icono centrado arriba */}
    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 text-accent shadow-inner group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>

    {/* Contenido de texto centrado */}
    <div className="flex flex-col gap-1 z-10">
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {title}
      </p>
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-text-secondary">
            {unit}
          </span>
        )}
      </div>
    </div>
  </GlassCard>
);

export default StatCard;