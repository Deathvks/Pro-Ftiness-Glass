/* frontend/src/components/StatCard.jsx */
import React from 'react';
import GlassCard from './GlassCard';

const StatCard = ({ icon, title, value, unit, onClick, className = '', type = 'default' }) => {
  const isDanger = type === 'danger';
  
  // CORRECCIÓN: Usamos 'red' en lugar de 'red-500' para coincidir con tu tema
  const glowClass = isDanger 
    ? 'bg-red/20 group-hover:bg-red/30' 
    : 'bg-accent/10 group-hover:bg-accent/20';
    
  const iconWrapperClass = isDanger 
    ? 'bg-red/10 text-red' 
    : 'bg-accent/10 text-accent';

  return (
    <GlassCard
      className={`
        relative overflow-hidden p-5 transition-all duration-300 hover:scale-[1.02] group h-full
        flex flex-col items-center justify-center text-center gap-3
        ${onClick ? 'cursor-pointer hover:bg-white/5' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Fondo decorativo sutil (glow) */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-all duration-500 ${glowClass}`} />

      {/* Icono centrado arriba */}
      <div className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-300 ${iconWrapperClass}`}>
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
};

export default StatCard;