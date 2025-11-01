/* frontend/src/components/WelcomeModal.jsx */
import React from 'react';
import {
  Award, UtensilsCrossed, Sparkles, BrainCircuit, X, Gauge, TrendingUp, QrCode,
  Cookie, Github, Camera, IdCard, ZoomIn,
  // --- INICIO DE LA MODIFICACIÓN ---
  Languages // <-- 'Translate' no existe. 'Languages' es el icono correcto.
  // --- FIN DE LA MODIFICACIÓN ---
} from 'lucide-react';
import { APP_VERSION } from '../config/version';

const WelcomeModal = ({ onClose }) => {
  const nouveautes = [
    // --- INICIO DE LA MODIFICACIÓN (Nueva Novedad) ---
    {
      // 2. Usamos el icono 'Languages'
      icon: <Languages className="text-accent" />,
      titre: "Biblioteca de Ejercicios Traducida",
      description: "¡Toda la biblioteca de ejercicios está traducida! Ahora verás los nombres y descripciones en español en todas las secciones: entrenamientos, progreso y récords."
    },
    // --- FIN DE LA MODIFICACIÓN ---
    {
      icon: <ZoomIn className="text-accent" />,
      titre: "Ampliación de Imagen de Perfil",
      description: "Ahora puedes hacer clic en tu foto de perfil (tanto en la barra lateral como en la configuración) para verla ampliada en un elegante modal con desenfoque, al estilo de las redes sociales."
    },
    {
      icon: <IdCard className="text-accent" />,
      titre: "Página de Perfil Renovada",
      description: "Presentamos la nueva página de 'Mi Cuenta'. Ahora puedes subir tu propia foto de perfil y elegir un nombre de usuario (@username) único para personalizar tu experiencia."
    },
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
      icon: <Camera className="text-accent" />,
      titre: "Fotos en tus Comidas",
      description: "Añade un toque visual a tu diario. Ahora puedes subir una foto para cada registro de comida, ayudándote a recordar qué comiste."
    },
    {
      icon: <TrendingUp className="text-accent" />,
      titre: "Estimación de 1 RM en Progreso",
      description: "La gráfica de 'Progresión de Fuerza' ahora muestra tu 1RM estimado (Una Repetición Máxima), calculado automáticamente a partir de tus mejores series y visible incluso en registros antiguos."
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
            <h2 className="text-2xl font-bold text-text-primary">¡Novedades en Pro Fitness Glass!</h2>
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