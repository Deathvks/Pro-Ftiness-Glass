/* frontend/src/components/MilestoneLevelUpModal.jsx */
import React, { useEffect, useState } from 'react';
import { Star, Trophy, Sparkles } from 'lucide-react';
import { getTier } from './LevelBadge';

export default function MilestoneLevelUpModal({ level, onClose }) {
  const [showContent, setShowContent] = useState(false);
  const tier = getTier(level);
  const Icon = tier.icon || Trophy;

  useEffect(() => {
    // Retraso muy leve para dar tiempo al CSS de renderizarse antes de transicionar
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-[fade-in_0.5s_ease-out] overflow-hidden !pt-[calc(1rem+env(safe-area-inset-top,24px))] !pb-[calc(1rem+env(safe-area-inset-bottom,24px))]">
      {/* Rayos de luz giratorios de fondo */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-50">
        <div className="w-[150vw] h-[150vw] sm:w-[100vw] sm:h-[100vw] bg-[conic-gradient(from_0deg_at_50%_50%,_rgba(255,215,0,0)_0%,_rgba(255,215,0,0.1)_10%,_rgba(255,215,0,0)_20%,_rgba(255,215,0,0.1)_30%,_rgba(255,215,0,0)_40%,_rgba(255,215,0,0.1)_50%,_rgba(255,215,0,0)_60%,_rgba(255,215,0,0.1)_70%,_rgba(255,215,0,0)_80%,_rgba(255,215,0,0.1)_90%,_rgba(255,215,0,0)_100%)] animate-[spin_20s_linear_infinite]" />
      </div>

      <div className={`relative w-full max-w-sm mx-4 flex flex-col items-center text-center transition-all duration-1000 transform ${showContent ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'}`}>
        
        {/* Estrellas flotantes */}
        <div className="absolute top-[-40px] left-[10%] animate-[bounce_3s_ease-in-out_infinite]">
          <Sparkles className="text-white opacity-70" size={32} />
        </div>
        <div className="absolute top-[-20px] right-[10%] animate-[bounce_4s_ease-in-out_infinite_0.5s]">
          <Star className="text-white opacity-80 fill-white" size={24} />
        </div>

        {/* Insignia Principal */}
        <div className={`relative flex items-center justify-center w-40 h-40 mb-6 ${tier.glow} rounded-full animate-[scale-in_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_0.3s_both]`}>
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${tier.colors} opacity-20 blur-xl animate-pulse`} />
          <div className={`relative z-10 w-32 h-32 bg-gradient-to-br ${tier.colors} rounded-full p-1 shadow-2xl flex items-center justify-center border-4 border-white/20`}>
             <div className="w-full h-full bg-bg-primary rounded-full flex flex-col items-center justify-center relative overflow-hidden">
                <Icon size={40} className="text-white mb-1 drop-shadow-md z-10" strokeWidth={1.5} />
                <span className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br ${tier.colors} z-10 leading-none`}>
                  {level}
                </span>
                
                {/* Brillo dinámico pasando */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent translate-x-[-150%] animate-[shimmer_3s_infinite]" />
             </div>
          </div>
        </div>

        <h2 className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br ${tier.colors} mb-2 uppercase tracking-tighter drop-shadow-lg`}>
          ¡Rango {tier.name}!
        </h2>
        <p className="text-gray-300 text-lg mb-8 font-medium px-4">
          Has alcanzado el asombroso nivel {level}. Tu dedicación está rindiendo frutos. ¡Sigue así!
        </p>

        <button
          onClick={onClose}
          className={`w-full py-4 bg-gradient-to-r ${tier.colors} text-white font-extrabold text-lg uppercase tracking-widest rounded-2xl ${tier.glow} hover:scale-105 active:scale-95 transition-all`}
        >
          ¡Aceptar Recompensa!
        </button>

      </div>
    </div>
  );
}
