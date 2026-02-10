/* frontend/src/pages/TermsPage.jsx */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import SEOHead from '../components/SEOHead';

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead title="Términos del Servicio" description="Condiciones de uso de Pro Fitness Glass" route="terms" />
      
      <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto min-h-screen">
        {/* Botón de regreso */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-text-secondary hover:text-accent mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Volver
        </button>

        <GlassCard className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-accent">Términos del Servicio</h1>
          
          <div className="space-y-4 text-text-primary">
            <p>
              Bienvenido a Pro Fitness Glass. Al usar nuestra aplicación, aceptas operar bajo las leyes vigentes
              y respetar la propiedad intelectual del contenido.
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-6">1. Uso y Responsabilidad</h2>
            <p className="text-text-secondary">
              Esta aplicación se proporciona "tal cual" para fines de seguimiento de fitness.
              Nos reservamos el derecho de bloquear cuentas que hagan un uso indebido de la plataforma.
              El usuario asume la total responsabilidad de su actividad física y nutricional.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6">2. Privacidad y Datos</h2>
            <p className="text-text-secondary">
              Tus datos son importantes para nosotros. Solo recopilamos la información necesaria para
              el funcionamiento de la app, conforme a nuestra Política de Privacidad.
            </p>

            <h2 className="text-xl font-semibold text-white mt-6">3. Modificaciones</h2>
            <p className="text-text-secondary">
              Podemos actualizar estos términos en cualquier momento. El uso continuado de la aplicación
              constituye la aceptación de dichos cambios.
            </p>
          </div>
        </GlassCard>
      </div>
    </>
  );
};

export default TermsPage;