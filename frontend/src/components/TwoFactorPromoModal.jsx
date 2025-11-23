/* frontend/src/components/TwoFactorPromoModal.jsx */
import React, { useEffect, useState } from 'react';
import { ShieldCheck, X, ArrowRight } from 'lucide-react';
import GlassCard from './GlassCard';

const TwoFactorPromoModal = ({ onConfigure, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Pequeño retardo para la animación de entrada
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Esperar a que termine la animación de salida antes de desmontar
    setTimeout(onClose, 300);
  };

  const handleConfigure = () => {
    setIsVisible(false);
    setTimeout(onConfigure, 300);
  };

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 backdrop-blur-none pointer-events-none'}`}>
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      
      {/* Contenido Modal */}
      <div className={`relative w-full max-w-sm transform transition-all duration-300 ease-out ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <GlassCard className="p-6 border-accent/20 shadow-[0_0_30px_rgba(var(--accent-rgb),0.15)]">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 text-text-secondary hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-5 text-accent animate-pulse ring-1 ring-accent/30">
              <ShieldCheck size={32} strokeWidth={2.5} />
            </div>

            <h2 className="text-xl font-bold text-text-primary mb-2">
              ¡Nueva Seguridad!
            </h2>
            
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Protege tu cuenta activando la <span className="text-accent font-semibold">Verificación en 2 Pasos</span>. Evita accesos no autorizados incluso si alguien tiene tu contraseña.
            </p>

            <div className="flex flex-col w-full gap-3">
              <button
                onClick={handleConfigure}
                className="w-full py-3 px-4 bg-accent text-white dark:text-bg-secondary font-bold rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-accent/20"
              >
                Configurar ahora <ArrowRight size={18} />
              </button>
              
              <button
                onClick={handleClose}
                className="w-full py-3 px-4 bg-transparent text-text-secondary font-medium hover:text-text-primary transition-colors text-sm hover:underline"
              >
                Quizás más tarde
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default TwoFactorPromoModal;