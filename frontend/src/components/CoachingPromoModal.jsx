import React from 'react';
import { X } from 'lucide-react';
import ModalPortal from './ModalPortal';
import useModalLock from '../hooks/useModalLock';

const CoachingPromoModal = ({ onClose }) => {
    useModalLock();

    return (
      <ModalPortal><div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="absolute inset-0" onClick={onClose} />

        <style>{`
          @keyframes cp-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }
          @keyframes cp-glow-pulse {
            0%, 100% { box-shadow: 0 0 20px var(--color-accent-transparent), inset 0 1px 0 rgba(255,255,255,0.1); }
            50% { box-shadow: 0 0 40px var(--color-accent-transparent), 0 0 80px var(--color-accent-transparent), inset 0 1px 0 rgba(255,255,255,0.1); }
          }
          @keyframes cp-icon-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes cp-icon-bounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-3px) scale(1.1); }
          }
          @keyframes cp-ring-orbit {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes cp-slide-up {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes cp-shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>

        <div
          className="relative w-full max-w-md overflow-hidden rounded-[32px] ring-1 ring-glass-border"
          style={{
            background: 'var(--bg-primary)',
            animation: 'cp-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2 rounded-full transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
          >
            <X size={18} className="text-text-secondary" />
          </button>

          {/* Header */}
          <div className="relative flex flex-col items-center pt-8 pb-6 px-6">
            {/* Simple hero icon */}
            <div
              className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-4"
              style={{
                background: 'var(--color-accent)',
                boxShadow: '0 8px 24px var(--color-accent-transparent)',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/>
                <path d="M5 21h14"/>
              </svg>
            </div>

            <h2
              className="text-2xl font-extrabold tracking-tight text-center"
              style={{
                background: 'linear-gradient(90deg, var(--text-primary), var(--color-accent), var(--text-primary))',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'cp-shimmer 4s linear infinite',
              }}
            >
              Asesoría Personalizada
            </h2>
            <p className="text-text-muted text-sm mt-2 text-center max-w-xs">
              Tu entrenador personal profesional, directamente en la app
            </p>
          </div>

          {/* Features */}
          <div className="px-6 pb-6 space-y-4">

            {/* Feature 1 - Target/Rutinas */}
            <div className="flex items-start gap-4 p-4 rounded-[20px] transition-all" style={{ background: 'var(--color-accent-transparent)' }}>
              <div
                className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--color-accent)', boxShadow: '0 4px 16px var(--color-accent-transparent)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'cp-icon-bounce 2s ease-in-out infinite' }}>
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-text-primary mb-0.5 text-[15px]">Rutinas a tu medida</h4>
                <p className="text-sm text-text-muted leading-relaxed">Tu entrenador personal te asignará planes específicos que aparecerán directamente en tu perfil.</p>
              </div>
            </div>

            {/* Feature 2 - Zap/Seguimiento */}
            <div className="flex items-start gap-4 p-4 rounded-[20px] transition-all" style={{ background: 'var(--color-accent-transparent)' }}>
              <div
                className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--color-accent)', boxShadow: '0 4px 16px var(--color-accent-transparent)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'cp-icon-bounce 2s ease-in-out infinite 0.3s' }}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-text-primary mb-0.5 text-[15px]">Seguimiento en tiempo real</h4>
                <p className="text-sm text-text-muted leading-relaxed">El entrenador revisará tus registros, pesos levantados y tu progreso al instante.</p>
              </div>
            </div>

            {/* Feature 3 - Chat */}
            <div className="flex items-start gap-4 p-4 rounded-[20px] transition-all" style={{ background: 'var(--color-accent-transparent)' }}>
              <div
                className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--color-accent)', boxShadow: '0 4px 16px var(--color-accent-transparent)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'cp-icon-bounce 2s ease-in-out infinite 0.6s' }}>
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-text-primary mb-0.5 text-[15px]">Chat Directo 24/7</h4>
                <p className="text-sm text-text-muted leading-relaxed">Habla con tu entrenador por el chat integrado para resolver dudas o ajustar tus planes al instante.</p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={onClose}
              className="w-full py-4 px-6 font-bold rounded-[20px] active:scale-95 transition-all mt-2 text-white"
              style={{
                background: 'var(--color-accent)',
                boxShadow: '0 8px 24px var(--color-accent-transparent)',
              }}
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      </div></ModalPortal>
    );
};

export default CoachingPromoModal;
