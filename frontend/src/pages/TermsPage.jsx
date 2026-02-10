/* frontend/src/pages/TermsPage.jsx */
import React from 'react';
import GlassCard from '../components/GlassCard';
import SEOHead from '../components/SEOHead';

const TermsPage = () => {
  return (
    <>
      <SEOHead title="Términos del Servicio" description="Condiciones de uso de Pro Fitness Glass" route="terms" />
      <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <GlassCard className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-accent">Términos del Servicio</h1>
          <p className="text-text-primary mb-4">
            Bienvenido a Pro Fitness Glass. Al usar nuestra aplicación, aceptas operar bajo las leyes vigentes
            y respetar la propiedad intelectual del contenido.
          </p>
          <p className="text-text-secondary">
            Esta aplicación se proporciona "tal cual" para fines de seguimiento de fitness.
            Nos reservamos el derecho de bloquear cuentas que hagan un uso indebido de la plataforma.
          </p>
        </GlassCard>
      </div>
    </>
  );
};

export default TermsPage;