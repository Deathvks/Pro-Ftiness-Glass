/* frontend/src/components/CookieConsentBanner.jsx */
import React from 'react';
import { ShieldCheck } from 'lucide-react';

const CookieConsentBanner = ({ onAccept, onDecline, onShowPolicy }) => {
  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4 animate-[fade-in-up_0.5s_ease-out]">
      <div className="max-w-4xl mx-auto rounded-2xl shadow-lg border backdrop-blur-glass bg-[--glass-bg] border-[--glass-border] p-5 md:p-6">
        <div className="flex flex-col md:flex-row items-center gap-5 md:gap-8">
          
          {/* Icono con fondo sutil para destacar */}
          <div className="flex-shrink-0">
            <div className="p-3 bg-accent/10 rounded-full">
              <ShieldCheck size={32} className="text-accent" />
            </div>
          </div>
          
          {/* Contenido de texto */}
          <div className="flex-grow text-center md:text-left space-y-2">
            <h3 className="font-bold text-text-primary text-lg">Tu privacidad es nuestra prioridad</h3>
            <p className="text-sm text-text-secondary leading-relaxed text-pretty">
              Utilizamos almacenamiento local para tus preferencias y garantizamos la seguridad de tus datos. 
              Si aceptas, también habilitas el inicio de sesión rápido con Google.
            </p>
            <p className="text-xs text-text-muted">
              Podrás cambiar esta configuración siempre desde <strong>Ajustes</strong>. Consulta nuestra{' '}
              {/* FIX: El punto se incluye dentro del botón para evitar saltos de línea huérfanos */}
              <button 
                onClick={onShowPolicy} 
                className="underline hover:text-accent transition font-medium outline-none focus:text-accent"
              >
                Política de Privacidad.
              </button>
            </p>
          </div>

          {/* Botones: Stack vertical en móvil (w-full), fila en tablet/desktop */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
            <button
              onClick={onDecline}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full font-semibold text-text-secondary hover:bg-white/5 border border-transparent hover:border-glass-border transition text-sm"
            >
              Rechazar
            </button>
            <button
              onClick={onAccept}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-accent text-bg-secondary font-semibold transition hover:scale-105 active:scale-95 shadow-lg shadow-accent/20 text-sm"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;