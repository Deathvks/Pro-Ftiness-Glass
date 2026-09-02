import React from 'react';
import { ClipboardList, Activity, MessageCircle, Star } from 'lucide-react';
import ModalPortal from './ModalPortal';
import useModalLock from '../hooks/useModalLock';
import GlassCard from './GlassCard';

const CoachingPromoModal = ({ onClose }) => {
    useModalLock(true);

    return (
      <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
          <div className="absolute inset-0" onClick={onClose} />

          <GlassCard className="glass relative w-full max-w-md bg-bg-secondary border-t sm:border border-glass-border rounded-t-[32px] rounded-b-none sm:rounded-[32px] p-6 sm:p-8 mt-auto sm:mt-0 pb-[calc(1.5rem+var(--safe-bottom))] sm:pb-8 shadow-2xl animate-[slide-up_0.2s_ease-out] sm:animate-[scale-in_0.2s_ease-out] max-h-[90vh] overflow-y-auto no-scrollbar">
            
            {/* Drag handle for mobile */}
            <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-6 sm:hidden shrink-0" />

            {/* Header */}
            <div className="flex flex-col items-center pt-2 pb-6 px-2">
              <div className="w-16 h-16 rounded-[20px] bg-accent/10 flex items-center justify-center text-accent mb-4 ring-2 ring-accent/30 shadow-lg shadow-accent/20">
                <Star size={32} strokeWidth={1.5} className="fill-accent text-accent" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center text-text-primary">
                Asesoría <span className="text-accent">Personalizada</span>
              </h2>
              <p className="text-text-secondary font-medium text-sm mt-3 text-center">
                Tu entrenador personal profesional, directamente en la app.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {/* Feature 1 */}
              <div className="flex items-start gap-4 p-4 rounded-[24px] bg-black/5 dark:bg-white/5 border border-glass-border/50">
                <div className="shrink-0 w-12 h-12 rounded-[16px] bg-blue-500/10 text-blue-500 flex items-center justify-center mt-0.5">
                  <ClipboardList size={24} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-text-primary mb-1 text-[15px]">Rutinas a tu medida</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">Tu entrenador personal te asignará planes específicos que aparecerán directamente en tu perfil.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-4 p-4 rounded-[24px] bg-black/5 dark:bg-white/5 border border-glass-border/50">
                <div className="shrink-0 w-12 h-12 rounded-[16px] bg-green-500/10 text-green-500 flex items-center justify-center mt-0.5">
                  <Activity size={24} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-text-primary mb-1 text-[15px]">Seguimiento en tiempo real</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">El entrenador revisará tus registros, pesos levantados y tu progreso al instante.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-4 p-4 rounded-[24px] bg-black/5 dark:bg-white/5 border border-glass-border/50">
                <div className="shrink-0 w-12 h-12 rounded-[16px] bg-purple-500/10 text-purple-500 flex items-center justify-center mt-0.5">
                  <MessageCircle size={24} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-text-primary mb-1 text-[15px]">Chat Directo 24/7</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">Habla con tu entrenador por el chat integrado para resolver dudas o ajustar tus planes al instante.</p>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={onClose}
                className="w-full mt-6 py-4 font-bold text-bg-primary bg-accent rounded-[20px] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-accent/30 active:scale-[0.98] shadow-lg shadow-accent/20"
              >
                ¡Entendido!
              </button>
            </div>
          </GlassCard>
        </div>
      </ModalPortal>
    );
};

export default CoachingPromoModal;
