/* frontend/src/components/IosPwaInstallModal.jsx */
import React, { useState, useEffect, useCallback } from 'react';
import { Share, PlusSquare, Smartphone, X, BellRing } from 'lucide-react';
import ModalPortal from './ModalPortal';
import GlassCard from './GlassCard';
import useModalLock from '../hooks/useModalLock';
import { isIosBrowserNonStandalone } from '../utils/platformUtils';

const STORAGE_KEY = 'ios_pwa_prompt_last_seen';
const COOLDOWN_DAYS = 14;

const isInCooldown = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const diffMs = Date.now() - new Date(raw).getTime();
    return Number.isFinite(diffMs) && diffMs < COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

const IosPwaInstallModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useModalLock(isOpen);

  const openIfEligible = useCallback((force = false) => {
    if (!isIosBrowserNonStandalone()) return;
    if (!force && isInCooldown()) return;
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const handleOffer = () => openIfEligible(false);
    const handleForceOpen = () => openIfEligible(true);

    window.addEventListener('pfg-offer-pwa-install', handleOffer);
    window.addEventListener('pfg-open-ios-pwa-modal', handleForceOpen);
    return () => {
      window.removeEventListener('pfg-offer-pwa-install', handleOffer);
      window.removeEventListener('pfg-open-ios-pwa-modal', handleForceOpen);
    };
  }, [openIfEligible]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch { /* localStorage bloqueado */ }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 pt-[calc(var(--safe-top,env(safe-area-inset-top,0px))+16px)] animate-[fade-in_0.2s_ease-out]"
        onClick={handleClose}
      >
        <GlassCard
          className="w-full max-w-md p-0 mt-auto sm:mt-0 relative z-10 flex flex-col max-h-[calc(100vh-var(--safe-top,env(safe-area-inset-top,0px))-16px)] sm:max-h-[90vh] overflow-hidden animate-[slide-up_0.3s_ease-out] rounded-t-[32px] sm:rounded-[32px] rounded-b-none sm:rounded-b-[32px] shadow-2xl border-none ring-1 ring-black/5 dark:ring-white/10 bg-bg-primary"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle móvil */}
          <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mt-4 sm:hidden shrink-0" />

          {/* Header */}
          <div className="relative p-6 sm:p-8 pb-4 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar"
              className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center gap-3 mt-1">
              <div className="w-16 h-16 rounded-[20px] flex items-center justify-center ring-2 ring-accent/30 bg-accent/10 text-accent shadow-sm">
                <Smartphone size={30} strokeWidth={1.75} />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/15 text-accent mb-2">
                  App Web en iPhone (PWA)
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary leading-tight">
                  Instálala en tu iPhone
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary mt-2 px-2 leading-relaxed font-medium">
                  Accede desde tu pantalla de inicio a pantalla completa y activa los avisos push en iOS.
                </p>
              </div>
            </div>
          </div>

          {/* Pasos */}
          <div className="px-6 pb-4 space-y-3 overflow-y-auto custom-scrollbar">
            <div className="flex items-start gap-3.5 p-4 rounded-[20px] bg-black/5 dark:bg-white/5">
              <div className="w-10 h-10 rounded-[14px] bg-accent/15 text-accent flex items-center justify-center shrink-0">
                <Share size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-text-primary">
                  1. Pulsa el botón Compartir
                </p>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  Es el icono del cuadrado con una flecha hacia arriba en la barra de Safari.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-[20px] bg-black/5 dark:bg-white/5">
              <div className="w-10 h-10 rounded-[14px] bg-accent/15 text-accent flex items-center justify-center shrink-0">
                <PlusSquare size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-text-primary">
                  2. Toca “Añadir a pantalla de inicio”
                </p>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  Se creará el icono de Pro Fitness Glass como una app nativa sin barra de navegador.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[16px] bg-accent/10 text-accent text-xs font-semibold">
              <BellRing size={15} className="shrink-0" />
              <span>En iPhone, las notificaciones push solo funcionan tras añadirla a la pantalla de inicio.</span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-2 pb-[calc(1.75rem+var(--safe-bottom))] sm:pb-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3.5 rounded-[20px] font-extrabold text-sm bg-accent text-accent-contrast shadow-lg shadow-accent/25 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </GlassCard>
      </div>
    </ModalPortal>
  );
};

export default IosPwaInstallModal;
