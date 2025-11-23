/* frontend/src/components/GoogleTermsModal.jsx */
import React, { useState, useRef, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { ShieldCheck, X, ExternalLink, AlertTriangle, Info } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import GlassCard from './GlassCard';

const GoogleTermsModal = ({ isOpen, onClose, onSuccess, onError, onShowPolicy }) => {
  const googleParentRef = useRef(null);
  const [googleBtnWidth, setGoogleBtnWidth] = useState('300');
  const [previouslyDeclined, setPreviouslyDeclined] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Ajustar ancho del botón
      if (googleParentRef.current) {
        const width = googleParentRef.current.offsetWidth;
        setGoogleBtnWidth(width > 400 ? '400' : width.toString());
      }
      
      // Verificar si el usuario ya había rechazado las cookies anteriormente
      const consent = localStorage.getItem('cookie_consent');
      setPreviouslyDeclined(consent === 'declined');
    }
  }, [isOpen]);

  const handleGoogleSuccess = (response) => {
    // LÓGICA MODIFICADA:
    // Si el usuario NO había rechazado antes (es la primera vez o era null), aceptamos cookies globales.
    // Si el usuario YA había rechazado ('declined'), NO cambiamos el estado global a 'accepted'.
    // Esto permite el login (onSuccess) pero mantiene la preferencia del usuario de "sin cookies de personalización".
    
    if (!previouslyDeclined) {
        localStorage.setItem('cookie_consent', 'accepted');
        // Disparamos evento para que otros componentes (como el banner) se actualicen
        window.dispatchEvent(new Event('storage'));
    }
    
    // Si previouslyDeclined es true, no tocamos localStorage. 
    // El login procede, pero la próxima vez que entre, el sistema verá que no es 'accepted' 
    // y volverá a mostrar este modal (comportamiento deseado).
    
    onSuccess(response);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fade-in_0.2s_ease-out]">
      <div className="w-full max-w-md animate-[scale-in_0.3s_ease-out]">
        <GlassCard className="relative p-6 md:p-8 flex flex-col gap-6">
          {/* Botón cerrar */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition p-1"
          >
            <X size={24} />
          </button>

          {/* Contenido Informativo */}
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
                     <strong> NO se activarán</strong> las funciones de personalización (temas, preferencias) que rechazaste en Ajustes.
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

          {/* Botones de Acción */}
          <div className="flex flex-col gap-3 mt-2">
            {/* Botón de Aceptar (Wrapper del GoogleLogin) */}
            <div 
                className="relative w-full h-12 flex justify-center items-center group" 
                ref={googleParentRef}
            >
                {/* Capa Visual */}
                <div className="absolute inset-0 w-full h-full bg-accent text-bg-secondary rounded-md flex items-center justify-center gap-3 font-bold shadow-lg transition group-hover:scale-[1.02] group-hover:shadow-accent/25 pointer-events-none z-0">
                    <div className="bg-white rounded-full p-1.5 flex items-center justify-center">
                        <FcGoogle size={20} />
                    </div>
                    <span>{previouslyDeclined ? 'Continuar (Solo Login)' : 'Aceptar y Continuar'}</span>
                </div>

                {/* Capa Funcional */}
                <div className="absolute inset-0 w-full h-full opacity-0 z-10 overflow-hidden flex justify-center items-center">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={onError}
                        width={googleBtnWidth}
                        text="continue_with"
                        shape="rectangular"
                        locale="es"
                    />
                </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-md font-semibold text-text-secondary hover:bg-white/5 transition"
            >
              Cancelar
            </button>
          </div>

        </GlassCard>
      </div>
    </div>
  );
};

export default GoogleTermsModal;