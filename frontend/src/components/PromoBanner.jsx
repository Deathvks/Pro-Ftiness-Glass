import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const PromoBanner = ({ type, onClick }) => {
    const userProfile = useAppStore(state => state.userProfile);

    // If user is already in asesoria, don't show the banner
    if (userProfile?.trainer_id) return null;

    const content = type === 'nutrition' 
      ? {
          title: "¿Dudas sobre qué comer?",
          desc: "Da el paso definitivo con un plan nutricional a medida y resuelve todas tus dudas por chat 24/7.",
          icon: "🥗"
        }
      : {
          title: "¿Estancado con los pesos?",
          desc: "Desbloquea tu potencial con rutinas hiper-personalizadas y análisis técnico con tu preparador.",
          icon: "⚡"
        };

    return (
      <div 
        onClick={onClick} 
        className="mb-6 rounded-[24px] overflow-hidden relative cursor-pointer group active:scale-[0.98] transition-transform shadow-lg shadow-black/5 dark:shadow-white/5"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent/5 dark:from-accent/30 dark:to-accent/5 opacity-80" />
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/30 rounded-full blur-3xl group-hover:bg-accent/40 transition-all duration-500" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl group-hover:bg-accent/30 transition-all duration-500" />
        
        <div className="p-4 sm:p-5 border border-black/5 dark:border-white/10 flex items-center justify-between gap-4 relative z-10 bg-white/40 dark:bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shrink-0 shadow-sm border border-black/5 dark:border-white/5 text-xl sm:text-2xl">
              {content.icon}
            </div>
            <div>
              <h3 className="text-[15px] sm:text-base font-bold text-text-primary mb-0.5 flex items-center gap-1.5">
                {content.title}
                <Sparkles className="w-4 h-4 text-accent animate-pulse" />
              </h3>
              <p className="text-[13px] sm:text-sm text-text-secondary leading-tight max-w-sm">
                {content.desc}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <span className="text-xs font-bold text-accent uppercase tracking-wider bg-accent/10 px-3 py-1 rounded-full">Probar Asesoría</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0 text-white shadow-lg shadow-accent/40 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
            <ChevronRight size={22} strokeWidth={3} />
          </div>
        </div>
      </div>
    );
};

export default PromoBanner;
