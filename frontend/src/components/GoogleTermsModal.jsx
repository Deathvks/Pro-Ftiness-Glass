/* frontend/src/components/GoogleTermsModal.jsx */
import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, ExternalLink, AlertTriangle, Info } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

const GoogleTermsModal = ({ isOpen, onClose, onAccept, onShowPolicy }) => {
  const [previouslyDeclined, setPreviouslyDeclined] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const consent = localStorage.getItem('cookie_consent');
      setPreviouslyDeclined(consent === 'declined');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContinue = () => {
    if (!previouslyDeclined) {
        localStorage.setItem('cookie_consent', 'accepted');
        // Usamos un evento personalizado para que la ventana actual sí se entere al instante
        window.dispatchEvent(new Event('cookie_consent_updated'));
    }
    // Llamamos al padre para que ejecute su propio Google Login de forma centralizada
    onAccept(); 
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fade-in_0.2s_ease-out]">
      <div className="w-full max-w-md animate-[scale-in_0.3s_ease-out]">
        <div className="relative p-6 md:p-8 flex flex-col gap-6 bg-bg-primary border border-glass-border rounded-2xl shadow-2xl">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition p-1"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col items-center text-center gap-4">
            <div className={`p-4 rounded-full mb-2 ${previouslyDeclined ? 'bg-orange-500/10 text-orange-500' : 'bg-accent/10 text-accent'}`}>
              {previouslyDeclined ? <AlertTriangle size={40} /> : <ShieldCheck size={40} />}
            </div>

            <h2 className="text-2xl font-bold text-text-primary">
              {previouslyDeclined ? 'Aviso de Privacidad' : 'Privacidad y Google'}
            </h2>

            <div className="text-text-secondary text-base leading-relaxed space-y-3 text-left">
              {previouslyDeclined ? (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-sm text-orange-200 mb-2">
                   <p className="font-bold flex items-center gap-2 mb-1">
                     <Info size={16} /> Has rechazado las cookies
                   </p>
                   <p>
                     Al continuar aquí, permites el <strong>acceso con Google</strong> puntualmente, pero 
                     <strong> NO se activarán</strong> las funciones de personalización que rechazaste en Ajustes.
                   </p>
                   <p className="mt-2 font-semibold underline cursor-pointer" onClick={onShowPolicy}>
                     Para usar todas las funciones, activa las cookies en Ajustes.
                   </p>
                </div>
              ) : (
                <p className="text-center">
                  Para iniciar sesión con Google, es <strong>necesario</strong> activar el almacenamiento local para gestionar tu sesión segura.
                </p>
              )}

              {!previouslyDeclined && (
                  <p className="text-center text-sm">
                    Al continuar, <strong>aceptas</strong> nuestra{' '}
                    <button 
                      onClick={onShowPolicy}
                      className="text-accent font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Política de Privacidad <ExternalLink size={12} />
                    </button>
                    {' '}y habilitas el uso de cookies técnicas.
                  </p>
              )}
            </div>

            {!previouslyDeclined && (
                <p className="text-xs text-text-muted bg-bg-secondary/50 p-3 rounded-lg border border-glass-border w-full">
                Podrás cambiar esta configuración siempre desde <strong>Ajustes</strong>.
                </p>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <button 
                onClick={handleContinue}
                className="w-full h-12 bg-accent text-white rounded-xl flex items-center justify-center gap-3 font-bold shadow-lg transition hover:scale-[1.02] hover:shadow-accent/25"
            >
                <div className="bg-white rounded-full p-1.5 flex items-center justify-center">
                    <FcGoogle size={20} />
                </div>
                <span>{previouslyDeclined ? 'Continuar (Solo Login)' : 'Aceptar y Continuar'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-text-secondary hover:bg-bg-secondary transition"
            >
              Cancelar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GoogleTermsModal;