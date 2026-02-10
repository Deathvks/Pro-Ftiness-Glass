/* frontend/src/pages/TermsPage.jsx */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import SEOHead from '../components/SEOHead';

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    // CAMBIO: 'fixed inset-0' con 'overflow-y-auto' para garantizar el scroll en móvil
    // z-[110] para asegurar que se muestre por encima de cualquier otra capa
    <div className="fixed inset-0 z-[110] bg-bg-primary overflow-y-auto custom-scrollbar">
      <SEOHead title="Términos del Servicio" description="Condiciones de uso de Pro Fitness Glass" route="terms" />
      
      {/* CAMBIO: Eliminado 'pt-24' excesivo. Usamos un padding general más equilibrado */}
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-[fade-in_0.5s_ease-out]">
        
        {/* Botón de regreso estilizado */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-text-secondary hover:text-accent mb-6 transition-colors group"
        >
          <div className="p-1.5 rounded-full bg-gray-200 dark:bg-white/5 group-hover:bg-accent/20 transition-colors mr-2">
            <ArrowLeft size={20} />
          </div>
          <span className="font-bold">Volver</span>
        </button>

        <GlassCard className="p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-accent">Términos del Servicio</h1>
          
          <div className="space-y-4 text-text-primary text-sm sm:text-base">
            <p>
              Bienvenido a Pro Fitness Glass. Al usar nuestra aplicación, aceptas operar bajo las leyes vigentes
              y respetar la propiedad intelectual del contenido.
            </p>
            
            <h2 className="text-lg sm:text-xl font-semibold text-white mt-6">1. Uso y Responsabilidad</h2>
            <p className="text-text-secondary">
              Esta aplicación se proporciona "tal cual" para fines de seguimiento de fitness.
              Nos reservamos el derecho de bloquear cuentas que hagan un uso indebido de la plataforma.
              El usuario asume la total responsabilidad de su actividad física y nutricional.
            </p>

            <h2 className="text-lg sm:text-xl font-semibold text-white mt-6">2. Privacidad y Datos</h2>
            <p className="text-text-secondary">
              Tus datos son importantes para nosotros. Solo recopilamos la información necesaria para
              el funcionamiento de la app, conforme a nuestra Política de Privacidad.
            </p>

            <h2 className="text-lg sm:text-xl font-semibold text-white mt-6">3. Modificaciones</h2>
            <p className="text-text-secondary">
              Podemos actualizar estos términos en cualquier momento. El uso continuado de la aplicación
              constituye la aceptación de dichos cambios.
            </p>
          </div>
        </GlassCard>

        {/* Footer simple */}
        <div className="mt-8 text-center text-xs text-text-tertiary opacity-50">
            © 2026 Pro Fitness Glass
        </div>
      </div>
    </div>
  );
};

export default TermsPage;