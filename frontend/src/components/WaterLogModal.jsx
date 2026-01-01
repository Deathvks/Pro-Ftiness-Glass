/* frontend/src/components/WaterLogModal.jsx */
import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, GlassWater } from 'lucide-react';
import Spinner from './Spinner';

const WaterLogModal = ({ initialQuantity = 0, onSave, onClose, isLoading }) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [mode, setMode] = useState('ml');

  const glasses = useMemo(() => Math.floor(quantity / 250), [quantity]);
  const glassSize = 250;

  const handleAdjustMl = (amount) => setQuantity(prev => Math.max(0, prev + amount));
  const handleAdjustGlasses = (amount) => setQuantity(prev => Math.max(0, prev + (amount * glassSize)));
  const handleSave = () => onSave(quantity);

  const baseButtonClasses = "px-4 py-2 rounded-full font-semibold transition-colors";

  // Clases limpias que usan tus variables CSS nativas
  const activeModeClasses = "bg-accent text-bg-secondary shadow-sm";
  const inactiveModeClasses = "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary border border-transparent";

  // Botones circulares usando bg-bg-secondary (se adapta solo a Light/Dark)
  const circleButtonClass = "bg-bg-secondary border border-[--glass-border] hover:border-accent text-text-primary transition shadow-sm";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-11/12 max-w-sm p-8 m-4 text-center shadow-2xl bg-bg-primary rounded-2xl border border-glass-border"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition">
          <X size={20} />
        </button>

        <div className="flex items-center justify-center gap-1 mx-auto mb-6 p-1.5 rounded-full border border-[--glass-border] w-fit bg-bg-primary">
          <button onClick={() => setMode('ml')} className={`${baseButtonClasses} ${mode === 'ml' ? activeModeClasses : inactiveModeClasses}`}>
            Cantidad (ml)
          </button>
          <button onClick={() => setMode('glasses')} className={`${baseButtonClasses} ${mode === 'glasses' ? activeModeClasses : inactiveModeClasses}`}>
            Vasos
          </button>
        </div>

        <h3 className="text-xl font-bold mb-8 text-text-primary">Registro de Agua</h3>

        {mode === 'ml' ? (
          <>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => handleAdjustMl(-250)} className={`p-4 rounded-full flex-shrink-0 ${circleButtonClass}`}>
                <Minus size={24} />
              </button>

              <div className="flex items-baseline justify-center flex-grow text-center min-w-0 text-text-primary px-2">
                <p className="text-5xl font-extrabold tracking-tight">{quantity}</p>
                <span className="text-xl font-bold text-text-muted ml-2">ml</span>
              </div>

              <button onClick={() => handleAdjustMl(250)} className={`p-4 rounded-full flex-shrink-0 ${circleButtonClass}`}>
                <Plus size={24} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-8">
              {[250, 500, 750].map(amount => (
                <button
                  key={amount}
                  onClick={() => handleAdjustMl(amount)}
                  className={`py-2 px-1 rounded-lg text-sm font-semibold hover:bg-accent/10 hover:text-accent hover:border-accent ${circleButtonClass}`}
                >
                  +{amount} ml
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-6">
              <button onClick={() => handleAdjustGlasses(-1)} className={`p-4 rounded-full flex-shrink-0 ${circleButtonClass}`}>
                <Minus size={24} />
              </button>

              <div className="text-center w-32 text-text-primary">
                <p className="text-6xl font-extrabold tracking-tight">{glasses}</p>
                <p className="text-sm font-bold text-text-muted mt-1 uppercase tracking-wider">{glasses === 1 ? 'Vaso' : 'Vasos'}</p>
              </div>

              <button onClick={() => handleAdjustGlasses(1)} className={`p-4 rounded-full flex-shrink-0 ${circleButtonClass}`}>
                <Plus size={24} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-8">
              {[1, 2, 3].map(amount => (
                <button
                  key={amount}
                  onClick={() => handleAdjustGlasses(amount)}
                  className={`py-2 px-1 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 hover:bg-accent/10 hover:text-accent hover:border-accent ${circleButtonClass}`}
                >
                  <Plus size={14} /> <span className="text-base">{amount}</span> <GlassWater size={16} />
                </button>
              ))}
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center justify-center w-full mt-8 py-3.5 rounded-xl bg-accent text-bg-secondary font-bold shadow-lg shadow-accent/20 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
        >
          {isLoading ? <Spinner size={24} color="currentColor" /> : 'Guardar Registro'}
        </button>

      </div>
    </div>
  );
};

export default WaterLogModal;