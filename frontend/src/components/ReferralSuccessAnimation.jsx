import ModalPortal from './ModalPortal';
import React, { useEffect, useState } from 'react';
import { UserPlus, Sparkles, X, Gift } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const ReferralSuccessAnimation = () => {
  const queue = useAppStore((state) => state.referralAnimationQueue);
  const shiftAnimation = useAppStore((state) => state.shiftReferralAnimation);
  const [isVisible, setIsVisible] = useState(false);
  const [currentData, setCurrentData] = useState(null);

  useEffect(() => {
    if (queue.length > 0 && !isVisible) {
      setCurrentData(queue[0]);
      setIsVisible(true);
    }
  }, [queue, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      shiftAnimation();
      setCurrentData(null);
    }, 500); // Wait for fade out
  };

  if (!isVisible || !currentData) return null;

  return <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={handleClose} />
      

            {/* Content Container */}
            <div className="relative w-full max-w-md animate-scale-up z-10 flex flex-col items-center">
                {/* Close Button */}
                <button
          onClick={handleClose}
          className="absolute top-0 right-0 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20">
          
                    <X size={24} />
                </button>

                {/* Animated Star/Icon Group */}
                <div className="relative mb-8 mt-6">
                    <div className="absolute inset-0 bg-accent rounded-full blur-3xl opacity-50 animate-pulse" />
                    <div className="relative w-32 h-32 bg-gradient-to-br from-accent to-purple-600 rounded-full flex items-center justify-center border-4 border-white/20 shadow-2xl animate-bounce-slow">
                        <UserPlus size={56} className="text-white drop-shadow-lg" />
                        
                        {/* Floating sparks */}
                        <Sparkles size={24} className="absolute -top-4 -right-4 text-yellow-400 animate-ping" />
                        <Sparkles size={16} className="absolute -bottom-2 -left-4 text-accent animate-ping" style={{ animationDelay: '500ms' }} />
                    </div>
                </div>

                {/* Text Content */}
                <div className="text-center bg-surface/80 backdrop-blur-xl border border-glass-border p-8 rounded-3xl w-full shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-purple-500 to-accent" />
                    
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-2">
                        ¡Misión Cumplida!
                    </h2>
                    
                    <p className="text-lg text-text-secondary mb-6">
                        <span className="font-bold text-white">{currentData.friendName || 'Tu amigo'}</span> se ha unido a Pro Fitness usando tu enlace.
                    </p>

                    <div className="bg-gradient-to-br from-black/40 to-black/20 p-4 rounded-2xl border border-white/10 mb-6 flex flex-col items-center justify-center gap-2 transform transition-transform hover:scale-105">
                        <Gift className="text-accent w-8 h-8 mb-1" />
                        <span className="text-4xl font-black text-white">+1.000 XP</span>
                        <span className="text-xs font-bold text-accent uppercase tracking-widest">Recompensa Otorgada</span>
                    </div>

                    <button
            onClick={handleClose}
            className="w-full py-4 bg-accent text-white font-bold rounded-xl shadow-lg shadow-accent/20 hover:bg-accent-hover transition-all active:scale-95">
            
                        ¡Genial!
                    </button>
                </div>
            </div>
        </div></ModalPortal>;

};

export default ReferralSuccessAnimation;