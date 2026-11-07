/* frontend/src/components/DomainMigrationModal.jsx */
import React, { useState, useEffect } from 'react';
import { Globe, ArrowRight, ExternalLink, X, ShieldCheck } from 'lucide-react';

export default function DomainMigrationModal() {
  const [isZeabur, setIsZeabur] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [countdown, setCountdown] = useState(6);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname || '';
      if (hostname.includes('zeabur.app')) {
        setIsZeabur(true);
      }
    }
  }, []);

  const getNewTargetUrl = () => {
    if (typeof window === 'undefined') return 'https://profitnessglass.es';
    const { pathname, search, hash } = window.location;
    return `https://profitnessglass.es${pathname}${search}${hash}`;
  };

  const handleRedirectNow = () => {
    window.location.href = getNewTargetUrl();
  };

  useEffect(() => {
    if (!isZeabur || !showModal || isPaused) return;

    if (countdown <= 0) {
      handleRedirectNow();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isZeabur, showModal, isPaused, countdown]);

  if (!isZeabur) return null;

  return (
    <>
      {/* Top Banner persistente si cierran el modal */}
      {!showModal && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-4 py-2.5 shadow-xl flex items-center justify-between text-xs sm:text-sm font-medium backdrop-blur-md">
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-4 h-4 shrink-0 animate-pulse text-emerald-200" />
            <span className="truncate">
              ¡Nos hemos mudado a nuestro dominio oficial! Accede ahora desde <strong className="underline decoration-white/60">profitnessglass.es</strong>
            </span>
          </div>
          <button
            onClick={handleRedirectNow}
            className="ml-3 shrink-0 bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1 rounded-full transition flex items-center gap-1.5"
          >
            <span>Ir ahora</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modal Central prominente de mudanza oficial */}
      {showModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-fade-in">
          <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center overflow-hidden">
            {/* Glow decorativo de fondo */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Globe className="w-9 h-9 text-white animate-spin-slow" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mb-2">
                ¡Nos hemos mudado!
              </h2>

              <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-6">
                Para brindarte mayor velocidad, máxima seguridad e independencia, <strong className="text-text-primary">Pro Fitness Glass</strong> estrena su dominio oficial definitivo:
              </p>

              {/* URL Pill destacada */}
              <div
                onClick={handleRedirectNow}
                className="cursor-pointer group flex items-center justify-center gap-2 p-3.5 mb-6 rounded-2xl bg-white/5 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 transition-all duration-300"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-base sm:text-lg font-bold text-emerald-300 tracking-wide group-hover:text-emerald-200">
                  https://profitnessglass.es
                </span>
                <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Temporizador de redirección automática */}
              <div className="text-xs text-text-secondary mb-6 flex items-center justify-center gap-2">
                <span>
                  Redirigiendo automáticamente en <strong className="text-emerald-400 font-bold">{countdown}s</strong>...
                </span>
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="underline text-text-muted hover:text-text-secondary text-[11px]"
                >
                  {isPaused ? 'Reanudar' : 'Pausar'}
                </button>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleRedirectNow}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  <span>Ir al nuevo dominio ahora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-3.5 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary font-medium text-xs sm:text-sm border border-white/5 transition"
                >
                  Continuar aquí (hasta dic.)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
