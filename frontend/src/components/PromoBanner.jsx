import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import GlassCard from './GlassCard';

const PromoBanner = ({ type, onClick }) => {
    const userProfile = useAppStore(state => state.userProfile);

    // If user is already in asesoria, don't show the banner
    if (userProfile?.trainer_id) return null;

    const content = type === 'nutrition' 
      ? {
          title: "¿Dudas sobre qué comer?",
          desc: "Da el paso definitivo con un plan nutricional a medida y resuelve todas tus dudas por chat 24/7."
        }
      : {
          title: "¿Estancado con los pesos?",
          desc: "Desbloquea tu potencial con rutinas hiper-personalizadas y análisis técnico con tu preparador."
        };

    return (
      <GlassCard 
        onClick={onClick} 
        className="mb-6 relative cursor-pointer group active:scale-[0.98] transition-transform p-0 !border-[--glass-border]"
      >
        <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-accent/5 dark:from-accent/20 dark:to-transparent opacity-80" />
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl group-hover:bg-accent/30 transition-all duration-500" />
        </div>
        
        <div className="p-4 sm:p-5 flex items-center justify-between gap-4 relative z-10">
          <div className="flex flex-col gap-1">
            <h3 className="text-[15px] sm:text-base font-bold text-text-primary flex items-center gap-1.5">
              {content.title}
              <Sparkles className="w-4 h-4 text-accent animate-pulse shrink-0" />
            </h3>
            <p className="text-[13px] sm:text-sm text-text-secondary leading-tight max-w-sm">
              {content.desc}
            </p>
          </div>
          
          <div className="hidden sm:flex items-center ml-auto mr-4">
            <span className="text-xs font-bold text-accent uppercase tracking-wider bg-accent/10 px-3 py-1 rounded-full border border-accent/20">Chat Asesoría</span>
          </div>

          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0 text-white shadow-lg shadow-accent/40 group-hover:scale-110 transition-transform duration-300 ml-auto sm:ml-0">
            <ChevronRight size={20} strokeWidth={3} />
          </div>
        </div>
      </GlassCard>
    );
};

export default PromoBanner;
