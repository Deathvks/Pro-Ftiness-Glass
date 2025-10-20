import React from 'react';
import { Cookie } from 'lucide-react';

const CookieConsentBanner = ({ onAccept, onDecline, onShowPolicy }) => {
  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4 animate-[fade-in-up_0.5s_ease-out]">
      <div className="max-w-4xl mx-auto rounded-2xl shadow-lg border backdrop-blur-glass bg-[--glass-bg] border-[--glass-border] p-5">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-shrink-0">
            <Cookie size={32} className="text-accent" />
          </div>
          <div className="flex-grow text-center md:text-left">
            <h3 className="font-bold text-text-primary">Tu privacidad es importante</h3>
            <p className="text-sm text-text-secondary mt-1">
              Usamos almacenamiento local para guardar tus preferencias de personalización. Puedes leer más en nuestra{' '}
              <button onClick={onShowPolicy} className="underline hover:text-accent transition">Política de Cookies</button>.
              {' '}¿Aceptas su uso?
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={onDecline}
              className="px-5 py-2 rounded-full font-semibold text-text-secondary hover:bg-white/10 transition"
            >
              Rechazar
            </button>
            <button
              onClick={onAccept}
              className="px-5 py-2 rounded-full bg-accent text-bg-secondary font-semibold transition hover:scale-105"
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