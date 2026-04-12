/* frontend/src/components/StatCard.jsx */
import React from 'react';
import GlassCard from './GlassCard';

const StatCard = ({ icon, title, value, unit, onClick, className = '', type = 'default' }) => {
  const isDanger = type === 'danger';

  // Si es danger, evitamos GlassCard para que sus estilos de tema claro/oscuro no pisen el rojo.
  const CardWrapper = isDanger ? 'div' : GlassCard;

  return (
    <CardWrapper
      className={`
        relative overflow-hidden p-5 transition-all duration-300 hover:scale-[1.02] group h-full
        flex flex-col items-center justify-center text-center gap-3 rounded-2xl
        ${onClick ? 'cursor-pointer hover:brightness-110' : ''}
        ${isDanger ? 'border-none shadow-[0_0_20px_rgba(239,68,68,0.5)]' : ''}
        ${className.replace('!bg-red-500', '').replace('[&_*]:!text-white', '')}
      `}
      // Forzamos el fondo rojo radical por estilo en línea para que nada lo pise
      style={isDanger ? { backgroundColor: '#ef4444' } : {}}
      onClick={onClick}
    >
      {/* Fondo decorativo sutil (glow) */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-all duration-500 ${isDanger ? 'bg-white/20' : 'bg-accent/10 group-hover:bg-accent/20'}`} />

      {/* Icono centrado arriba */}
      <div
        className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-300 ${isDanger ? 'bg-white/20' : 'bg-accent/10 text-accent'}`}
        style={isDanger ? { color: '#ffffff' } : {}}
      >
        {icon}
      </div>

      {/* Contenido de texto centrado */}
      <div className="flex flex-col gap-1 z-10 w-full">
        <p
          className={`text-xs font-bold uppercase tracking-wider ${!isDanger ? 'text-text-muted' : ''}`}
          style={isDanger ? { color: 'rgba(255, 255, 255, 0.9)' } : {}}
        >
          {title}
        </p>
        <div className="flex items-baseline justify-center gap-1">
          <span
            className={`text-2xl md:text-3xl font-bold tracking-tight ${!isDanger ? 'text-text-primary' : ''}`}
            style={isDanger ? { color: '#ffffff' } : {}}
          >
            {value}
          </span>
          {unit && (
            <span
              className={`text-sm font-medium ${!isDanger ? 'text-text-secondary' : ''}`}
              style={isDanger ? { color: 'rgba(255, 255, 255, 0.8)' } : {}}
            >
              {unit}
            </span>
          )}
        </div>
      </div>
    </CardWrapper>
  );
};

export default StatCard;