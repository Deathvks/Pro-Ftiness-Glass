import React from 'react';
// --- INICIO DE LA MODIFICACIÓN ---
// Importamos el icono de Github
import { Award, UtensilsCrossed, Sparkles, BrainCircuit, X, Gauge, TrendingUp, QrCode, Cookie, Github } from 'lucide-react';
// --- FIN DE LA MODIFICACIÓN ---
import { APP_VERSION } from '../config/version';

const WelcomeModal = ({ onClose }) => {
  const nouveautes = [
    {
      icon: <QrCode className="text-accent" />,
      titre: "Escaneo de Códigos de Barras",
      description: "Añade alimentos rápidamente escaneando el código de barras del producto. La información nutricional se rellenará automáticamente gracias a la base de datos de Open Food Facts."
    },
    {
      icon: <Cookie className="text-accent" />,
      titre: "Gestión de Privacidad y Cookies",
      description: "Hemos añadido un banner de consentimiento para cumplir con la normativa de privacidad. Tu elección sobre guardar preferencias de personalización se almacena por cuenta y dispositivo."
    },
    {
      icon: <UtensilsCrossed className="text-accent" />,
      titre: "Rediseño del Registro de Comidas",
      description: "Añadir comidas es ahora más rápido e intuitivo. El nuevo modal te permite buscar, añadir múltiples alimentos a la vez, guardarlos como favoritos y hasta calcular macros por cada 100g."
    },
    {
      icon: <Sparkles className="text-accent" />,
      titre: "Editor de Comidas Integrado",
      description: "Hemos fusionado el editor de comidas en el nuevo modal. Ahora puedes corregir cualquier registro de forma rápida y sencilla desde el mismo lugar."
    },
    {
      icon: <Gauge className="text-accent" />,
      titre: "Cálculo de Macros Mejorado",
      description: "El cálculo de calorías y macros ahora utiliza el último peso corporal registrado en lugar del peso del perfil, haciendo que los objetivos diarios sean mucho más precisos."
    },
    {
      icon: <TrendingUp className="text-accent" />,
      titre: "Flechas de Progreso",
      description: "En la sección de Progreso, ahora verás flechas de tendencia junto a tus mediciones de peso, indicando si has subido, bajado o mantenido el peso respecto al registro anterior."
    },
    {
      icon: <BrainCircuit className="text-accent" />,
      titre: "Mejoras de Usabilidad y Diseño",
      description: "Hemos pulido la interfaz, mejorado la responsividad en móviles y adaptado todos los componentes al modo claro para una experiencia más consistente."
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fade-in_0.3s_ease-out] bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg flex flex-col max-h-[90vh] text-center rounded-lg shadow-xl
                   bg-bg-secondary border border-glass-border"
      >

        {/* -- Cabecera (no se desplaza) -- */}
        <div className="flex-shrink-0 p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute p-2 transition rounded-full top-4 right-4 hover:bg-white/10"
          >
            <X size={20} className="text-text-secondary" />
          </button>

          <div className="flex flex-col items-center">
            <Award size={48} className="mb-3 text-accent" />
            <h2 className="text-2xl font-bold text-text-primary">¡Novedades en FitTrack Pro!</h2>
            <p className="mb-2 text-sm text-text-secondary">Versión {APP_VERSION}</p>
          </div>
        </div>

        {/* -- Contenido (scrollable) -- */}
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

        {/* -- Pie de página (no se desplaza) -- */}
        <div className="flex-shrink-0 p-6 pt-4">
          
          {/* --- INICIO DE LA MODIFICACIÓN --- */}
          {/* Enlace a GitHub añadido aquí */}
          <a
            href="https://github.com/deathvks/fittrack-pro"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors mb-4"
          >
            <Github size={16} />
            <span>
              FitTrack Pro es un proyecto de código abierto. ¡Tu apoyo es fundamental!
            </span>
          </a>
          {/* --- FIN DE LA MODIFICACIÓN --- */}

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