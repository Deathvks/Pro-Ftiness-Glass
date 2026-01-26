/* frontend/src/components/SugarTargetModal.jsx */
import React from 'react';
import { X, IceCream, AlertTriangle, Info } from 'lucide-react';
import GlassCard from './GlassCard';

const SugarTargetModal = ({ isOpen, onClose, currentSugar, maxSugar }) => {
  if (!isOpen) return null;

  const percentage = Math.min(100, Math.max(0, (currentSugar / maxSugar) * 100));
  const isOverLimit = currentSugar >= maxSugar;
  
  // --- Configuración de Tema (Rosa vs Rojo Alerta) ---
  const themeColor = isOverLimit ? 'text-red-500' : 'text-pink-500';
  const themeBg = isOverLimit ? 'bg-red-600' : 'bg-pink-500';
  const themeBorder = isOverLimit ? 'border-red-500/60' : 'border-pink-500/30';
  const themeShadow = isOverLimit ? 'shadow-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.2)]' : 'shadow-pink-500/20';
  
  // Tinte de fondo sutil en toda la tarjeta si hay alerta
  const cardBg = isOverLimit ? 'bg-red-500/10' : '';

  // --- Dimensiones del Gráfico ---
  const radius = 65; 
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
      <div className="absolute inset-0" onClick={onClose} />

      <GlassCard 
        className={`w-full max-w-sm relative z-10 overflow-hidden flex flex-col animate-[scale-in_0.2s_ease-out] border ${themeBorder} shadow-2xl ${themeShadow} ${cardBg}`}
      >
        
        {/* --- Header --- */}
        <div className={`flex justify-between items-center p-5 border-b border-white/5 ${isOverLimit ? 'bg-red-500/20' : 'bg-white/5'}`}>
          <h3 className={`text-lg font-bold flex items-center gap-2 ${themeColor}`}>
            {isOverLimit ? (
              <AlertTriangle size={20} className="animate-pulse" />
            ) : (
              <IceCream size={20} />
            )}
            Objetivo de Azúcar
          </h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-text-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* --- Body --- */}
        <div className="p-6 flex flex-col items-center relative">
          
          {/* Fondo de brillo ambiental */}
          <div className={`absolute top-10 left-1/2 -translate-x-1/2 w-40 h-40 ${themeBg} ${isOverLimit ? 'opacity-20 blur-[60px]' : 'opacity-10 blur-[50px]'} rounded-full pointer-events-none`}></div>

          {/* Gráfico Circular */}
          <div className="relative w-40 h-40 mb-6 flex items-center justify-center z-10">
            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 160 160">
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="transparent"
                className="text-bg-secondary opacity-50"
              />
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={percentage >= 100 ? 'none' : circumference}
                strokeDashoffset={percentage >= 100 ? 0 : offset}
                strokeLinecap={percentage >= 100 ? 'butt' : 'round'}
                className={`transition-all duration-1000 ease-out ${themeColor} ${isOverLimit ? 'drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]'}`}
              />
            </svg>
            
            {/* Texto Central */}
            <div className="absolute flex flex-col items-center">
              <span className={`text-3xl font-black ${themeColor}`}>
                {Math.round(percentage)}%
              </span>
              <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">
                Del Límite
              </span>
            </div>
          </div>

          {/* Datos Numéricos */}
          <div className={`w-full rounded-xl p-4 border border-white/5 mb-6 flex justify-between items-center relative z-10 ${isOverLimit ? 'bg-red-500/10' : 'bg-bg-secondary/50'}`}>
            <div className="flex flex-col">
              <span className="text-xs text-text-secondary">Consumido</span>
              <span className={`text-xl font-bold ${themeColor}`}>
                {currentSugar.toFixed(1)}g
              </span>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-text-secondary">Límite Diario</span>
              <span className="text-xl font-bold text-text-primary">
                {maxSugar}g
              </span>
            </div>
          </div>

          {/* Texto Informativo */}
          <div className="flex gap-3 text-left bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 relative z-10">
            <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-text-secondary leading-relaxed">
              La <strong className="text-text-primary">OMS</strong> recomienda reducir el consumo de azúcares libres a menos del <strong className="text-text-primary">10%</strong> de la ingesta calórica total. Reducirlo por debajo del <strong className="text-text-primary">5%</strong> proporciona beneficios adicionales para la salud.
            </p>
          </div>

        </div>

        {/* --- Footer --- */}
        <div className="p-4 border-t border-white/5 bg-bg-secondary/30">
          <button 
            onClick={onClose}
            className={`w-full py-3 rounded-xl bg-bg-primary hover:bg-white/5 border border-glass-border font-bold text-sm transition-all ${themeColor} ${isOverLimit ? 'ring-2 ring-red-500/20' : ''}`}
          >
            Entendido
          </button>
        </div>

      </GlassCard>
    </div>
  );
};

export default SugarTargetModal;