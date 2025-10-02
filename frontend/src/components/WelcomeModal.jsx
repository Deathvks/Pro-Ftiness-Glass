import React from 'react';
import { Award, UtensilsCrossed, Sparkles, BrainCircuit, BugOff, X } from 'lucide-react';
import { APP_VERSION } from '../config/version';

const WelcomeModal = ({ onClose }) => {
  const nouveautes = [
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
      icon: <BrainCircuit className="text-accent" />,
      titre: "Mejoras de Usabilidad",
      description: "Hemos pulido la interfaz en varias pantallas para que la experiencia sea más fluida y agradable, corrigiendo pequeños errores de diseño y mejorando la responsividad."
    },
    {
      icon: <BugOff className="text-accent" />,
      titre: "Corrección de Errores",
      description: "Hemos solucionado varios errores menores en el backend y frontend para mejorar la estabilidad y fiabilidad de la aplicación."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
      <div 
        className="relative w-11/12 max-w-lg p-6 m-4 overflow-hidden text-center rounded-lg shadow-xl 
                   bg-bg-secondary border border-glass-border"
      >
        
        <button 
          onClick={onClose} 
          className="absolute p-2 transition rounded-full top-4 right-4 hover:bg-white/10"
        >
          <X size={20} className="text-text-secondary" />
        </button>

        <div className="flex flex-col items-center">
          <Award size={48} className="mb-3 text-accent" />
          <h2 className="text-2xl font-bold text-text-primary">¡Novedades en FitTrack Pro!</h2>
          <p className="mb-6 text-sm text-text-secondary">Versión {APP_VERSION}</p>
        </div>

        <div className="space-y-4 text-left">
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

        <button 
          onClick={onClose} 
          className="w-full px-4 py-3 mt-8 font-bold rounded-lg bg-accent text-white transition hover:scale-[1.02]"
        >
          ¡Entendido!
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;