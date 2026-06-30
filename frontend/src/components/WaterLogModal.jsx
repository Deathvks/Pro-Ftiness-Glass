/* frontend/src/components/WaterLogModal.jsx */
import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, GlassWater, Droplets } from 'lucide-react';
import Spinner from './Spinner';

const WaterLogModal = ({ initialQuantity = 0, onSave, onClose, isLoading }) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [mode, setMode] = useState('ml');

  const glasses = useMemo(() => Math.floor(quantity / 250), [quantity]);
  const glassSize = 250;

  const handleAdjustMl = (amount) => setQuantity(prev => Math.max(0, prev + amount));
  const handleAdjustGlasses = (amount) => setQuantity(prev => Math.max(0, prev + (amount * glassSize)));
  const handleSave = () => onSave(quantity);

  const baseButtonClasses = "px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 active:scale-95";
  const activeModeClasses = "bg-accent text-white shadow-lg shadow-accent/20";
  const inactiveModeClasses = "bg-transparent text-text-secondary hover:text-text-primary";

  // Botones circulares con estilo Glass
  const circleButtonClass = "bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 hover:ring-accent hover:text-accent transition-all shadow-sm active:scale-90";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out] p-4 !pt-[calc(1rem+env(safe-area-inset-top,24px))] !pb-[calc(1rem+env(safe-area-inset-bottom,24px))]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm p-8 text-center bg-bg-primary rounded-[32px] ring-1 ring-black/5 dark:ring-white/10 shadow-2xl animate-[slide-up_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 p-2 rounded-full bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* Icono Principal */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-accent/10 rounded-[20px] ring-1 ring-accent/30 text-accent shadow-sm">
            <Droplets size={32} strokeWidth={1.5} />
          </div>
        </div>

        <h3 className="text-2xl font-extrabold mb-8 text-text-primary tracking-tight">Registro de Agua</h3>

        {/* Selector de Modo */}
        <div className="flex items-center justify-center gap-1 mx-auto mb-10 p-1.5 rounded-full bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 w-fit">
          <button onClick={() => setMode('ml')} className={`${baseButtonClasses} ${mode === 'ml' ? activeModeClasses : inactiveModeClasses}`}>
            Mililitros
          </button>
          <button onClick={() => setMode('glasses')} className={`${baseButtonClasses} ${mode === 'glasses' ? activeModeClasses : inactiveModeClasses}`}>
            Vasos
          </button>
        </div>

        {/* Control Principal */}
        <div className="flex items-center justify-center gap-6">
          <button 
            onClick={() => mode === 'ml' ? handleAdjustMl(-250) : handleAdjustGlasses(-1)} 
            className={`p-4 rounded-full flex-shrink-0 ${circleButtonClass}`}
          >
            <Minus size={24} strokeWidth={3} />
          </button>

          <div className="flex flex-col items-center justify-center min-w-[140px]">
            {mode === 'ml' ? (
              <div className="flex items-baseline gap-1">
                <p className="text-6xl font-black tracking-tighter text-text-primary">{quantity}</p>
                <span className="text-lg font-bold text-text-tertiary uppercase">ml</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-6xl font-black tracking-tighter text-text-primary">{glasses}</p>
                <p className="text-xs font-black text-text-tertiary uppercase tracking-widest mt-1">
                  {glasses === 1 ? 'Vaso' : 'Vasos'}
                </p>
              </div>
            )}
          </div>

          <button 
            onClick={() => mode === 'ml' ? handleAdjustMl(250) : handleAdjustGlasses(1)} 
            className={`p-4 rounded-full flex-shrink-0 ${circleButtonClass}`}
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-3 gap-3 mt-12">
          {mode === 'ml' 
            ? [250, 500, 750].map(amount => (
                <button
                  key={amount}
                  onClick={() => handleAdjustMl(amount)}
                  className={`py-3 rounded-[16px] text-xs font-black uppercase tracking-wider bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 hover:bg-accent/10 hover:text-accent hover:ring-accent transition-all active:scale-95 text-text-secondary`}
                >
                  +{amount}
                </button>
              ))
            : [1, 2, 3].map(amount => (
                <button
                  key={amount}
                  onClick={() => handleAdjustGlasses(amount)}
                  className={`py-3 rounded-[16px] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 hover:bg-accent/10 hover:text-accent hover:ring-accent transition-all active:scale-95 text-text-secondary`}
                >
                  +{amount} <GlassWater size={14} />
                </button>
              ))
          }
        </div>

        {/* Botón de Acción Principal */}
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center justify-center w-full mt-10 py-4 rounded-[20px] bg-accent text-white font-bold text-lg shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isLoading ? <Spinner size={24} color="white" /> : 'Guardar Registro'}
        </button>

      </div>
    </div>
  );
};

export default WaterLogModal;