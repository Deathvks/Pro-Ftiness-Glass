/* frontend/src/components/LandingLoadingSkeleton.jsx */
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { reloadAppWithoutStaleCache } from '../utils/appRecovery';

export default function LandingLoadingSkeleton() {
  const [showRescue, setShowRescue] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRescue(true);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  const handleRepair = () => {
    setIsRepairing(true);
    reloadAppWithoutStaleCache();
  };

  return (
    <div className="min-h-screen w-full bg-bg-primary text-text-primary flex flex-col relative overflow-hidden select-none">
      {/* Fondo atmosférico sutil */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-60"
        aria-hidden="true"
        style={{
          backgroundImage: [
            'radial-gradient(ellipse 42% 18% at 12% 6%, var(--color-accent-transparent), transparent 100%)',
            'radial-gradient(ellipse 38% 16% at 88% 24%, rgba(59, 130, 246, 0.10), transparent 100%)',
            'radial-gradient(ellipse 45% 18% at 16% 53%, rgba(168, 85, 247, 0.10), transparent 100%)'
          ].join(', ')
        }}
      />

      {/* Navbar Skeleton */}
      <nav 
        className="w-full relative z-20 px-3 sm:px-6 py-3 sm:py-4 max-w-7xl mx-auto flex items-center justify-between"
        style={{ paddingTop: 'calc(var(--safe-top, 0px) + 0.75rem)' }}
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-5 w-32 sm:w-40 rounded-lg bg-black/10 dark:bg-white/10 animate-pulse hidden md:block" />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-20 sm:w-24 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse hidden sm:block" />
          <div className="h-8 sm:h-9 w-16 sm:w-24 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-8 sm:h-9 w-20 sm:w-28 rounded-xl bg-accent/20 animate-pulse" />
        </div>
      </nav>

      {/* Hero Skeleton */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-[calc(var(--safe-top,0px)+12px)] pb-20 max-w-5xl mx-auto w-full relative z-10 text-center">
        {/* Espacio para la mascota */}
        <div className="h-24 sm:h-20 w-full pointer-events-none" />

        {/* Píldora de versión */}
        <div className="h-7 w-32 sm:w-36 rounded-full bg-black/10 dark:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 mb-8 animate-pulse" />

        {/* Gran Título */}
        <div className="flex flex-col items-center gap-3 w-full mb-6">
          <div className="h-10 sm:h-16 md:h-20 w-4/5 max-w-2xl rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-10 sm:h-16 md:h-20 w-3/5 max-w-xl rounded-2xl bg-accent/20 animate-pulse" />
        </div>

        {/* Subtítulo */}
        <div className="flex flex-col items-center gap-2 w-full max-w-xl mb-10">
          <div className="h-4 sm:h-5 w-full rounded-lg bg-black/5 dark:bg-white/5 animate-pulse" />
          <div className="h-4 sm:h-5 w-4/5 rounded-lg bg-black/5 dark:bg-white/5 animate-pulse" />
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <div className="h-14 w-full sm:w-48 rounded-[24px] bg-accent/30 animate-pulse" />
          <div className="h-14 w-full sm:w-44 rounded-[24px] bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
      </main>

      {/* Modal de rescate si la red se congela */}
      {showRescue && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
          <div className="w-full max-w-sm p-6 rounded-3xl glass border border-accent/30 bg-bg-secondary/95 shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center text-accent">
              <RefreshCw className={`w-6 h-6 ${isRepairing ? 'animate-spin' : ''}`} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-text-primary">¿La página está tardando en cargar?</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Parece que la conexión de red es lenta o se actualizó una nueva versión. Pulsa para refrescar.
              </p>
            </div>
            <button
              onClick={handleRepair}
              disabled={isRepairing}
              className="w-full py-3 px-4 rounded-xl bg-accent text-accent-contrast font-bold text-sm shadow-lg shadow-accent/20 active:scale-95 transition-all"
            >
              {isRepairing ? 'Recargando...' : 'Recargar página'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
