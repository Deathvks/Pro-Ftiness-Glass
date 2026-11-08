/* frontend/src/components/Admin/ServerMetricInfoModal.jsx */
import React, { useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import ModalPortal from '../ModalPortal';
import useModalLock from '../../hooks/useModalLock';

export default function ServerMetricInfoModal({ metric, onClose }) {
  useModalLock(Boolean(metric));

  useEffect(() => {
    if (!metric) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [metric, onClose]);

  if (!metric) return null;

  const IconComponent = metric.icon;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-[fade-in_0.2s_ease-out]"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="server-metric-modal-title"
      >
        <div
          className="relative w-full max-w-lg bg-bg-primary rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-black/10 dark:border-white/10 p-5 sm:p-7 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-7 animate-[slide-up_0.28s_cubic-bezier(0.32,0.72,0,1)] sm:animate-[scale-in_0.2s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Barra superior de arrastre en móvil */}
          <div className="w-12 h-1.5 bg-black/15 dark:bg-white/20 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center shadow-inner shrink-0">
                {IconComponent ? (
                  <IconComponent size={24} strokeWidth={2.2} />
                ) : (
                  <Sparkles size={24} />
                )}
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full ring-1 ring-accent/20 mb-1">
                  Métricas de Infraestructura
                </span>
                <h3 
                  id="server-metric-modal-title"
                  className="text-base sm:text-lg font-black text-text-primary tracking-tight leading-snug"
                >
                  {metric.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all active:scale-95 shrink-0"
              aria-label="Cerrar modal"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Cuerpo */}
          <div className="space-y-4 py-4 text-xs sm:text-sm leading-relaxed">
            {metric.summary && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 font-bold text-text-primary shadow-xs">
                {metric.summary}
              </div>
            )}

            {metric.detail && (
              <p className="text-text-secondary leading-relaxed px-0.5">
                {metric.detail}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-black/5 dark:border-white/10 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-accent text-accent-contrast text-xs sm:text-sm font-black hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent/25 cursor-pointer text-center"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
