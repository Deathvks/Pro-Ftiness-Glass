/* frontend/src/components/WelcomeModal.jsx */
import React from 'react';
import { Award, X, Github, UtensilsCrossed, Camera, LogIn, ShieldCheck } from 'lucide-react';
import { APP_VERSION } from '../config/version';

const WelcomeModal = ({ onClose }) => {
  const nouveautes = [
    {
      icon: <ShieldCheck className="text-accent" />,
      titre: "Verificación en 2 Pasos",
      description: "Añade una capa extra de seguridad a tu cuenta configurando la verificación en dos pasos (2FA) desde los ajustes."
    },
    {
      icon: <LogIn className="text-accent" />,
      titre: "Acceso con Google",
      description: "Ahora puedes registrarte e iniciar sesión de forma rápida y segura utilizando tu cuenta de Google."
    },
    {
      icon: <UtensilsCrossed className="text-accent" />,
      titre: "Búsqueda de Comidas Mejorada",
      description: "Nuevo sistema para buscar alimentos, gestionar favoritos y recientes, permitiendo añadir múltiples registros de forma rápida e intuitiva."
    },
    {
      icon: <Camera className="text-accent" />,
      titre: "Visualización de Imágenes",
      description: "Ahora las fotos de tus alimentos se muestran directamente en el resumen diario (Desayuno, Almuerzo...) recuperándolas de tus favoritos o recientes."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fade-in_0.3s_ease-out] bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg flex flex-col max-h-[90vh] text-center rounded-lg shadow-xl
                  bg-bg-secondary border border-glass-border"
      >

        {/* -- Cabecera -- */}
        <div className="flex-shrink-0 p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute p-2 transition rounded-full top-4 right-4 hover:bg-white/10"
          >
            <X size={20} className="text-text-secondary" />
          </button>

          <div className="flex flex-col items-center">
            <Award size={48} className="mb-3 text-accent" />
            <h2 className="text-2xl font-bold text-text-primary">¡Novedades en Pro Fitness Glass!</h2>
            <p className="mb-2 text-sm text-text-secondary">Versión {APP_VERSION}</p>
          </div>
        </div>

        {/* -- Contenido -- */}
        <div className="flex-grow overflow-y-auto px-6 space-y-4 text-left">
          {nouveautes.map((item, index) => (
            <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-bg-primary">
              <div className="flex-shrink-0">{item.icon}</div>
              <div>
                <h3 className="font-semibold text-text-primary">{item.titre}</h3>
                <p className="text-sm text-text-secondary">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* -- Pie de página -- */}
        <div className="flex-shrink-0 p-6 pt-4">
          <a
            href="https://github.com/deathvks/fittrack-pro"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors mb-4"
          >
            <Github size={16} className="flex-shrink-0" />
            <span className="text-center sm:text-left">
              Pro Fitness Glass es un proyecto de código abierto. ¡Tu apoyo es fundamental!
            </span>
          </a>

          <button
            onClick={onClose}
            className="w-full px-4 py-3 font-bold rounded-lg bg-accent text-white dark:text-bg-secondary transition hover:scale-[1.02]"
          >
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;