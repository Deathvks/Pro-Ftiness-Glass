/* frontend/src/pages/TermsPage.jsx */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import SEOHead from '../components/SEOHead';

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[110] bg-bg-primary overflow-y-auto custom-scrollbar">
      <SEOHead title="Términos del Servicio" description="Condiciones de uso de Pro Fitness Glass" route="terms" />
      
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out] mt-4 sm:mt-0">
        
        {/* Botón de regreso adaptativo */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 px-4 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 rounded-full text-text-secondary font-bold hover:text-text-primary transition-colors mb-8 w-fit active:scale-95"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
          <span>Volver</span>
        </button>

        <GlassCard className="glass p-6 sm:p-12 rounded-[32px] shadow-2xl border-none ring-1 ring-black/5 dark:ring-white/10 bg-bg-primary/50">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-10 text-text-primary tracking-tight">
            Términos del Servicio
          </h1>
          
          <div className="space-y-8 text-text-primary">
            <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed bg-black/5 dark:bg-white/5 p-5 sm:p-6 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 shadow-inner">
              Bienvenido a Pro Fitness Glass. Al usar nuestra aplicación, aceptas operar bajo las leyes vigentes y respetar la propiedad intelectual del contenido.
            </p>
            
            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">1. Uso y Responsabilidad</h2>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                Esta aplicación se proporciona "tal cual" para fines de seguimiento de fitness.
                Nos reservamos el derecho de bloquear cuentas que hagan un uso indebido de la plataforma.
                El usuario asume la total responsabilidad de su actividad física y nutricional.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">2. Privacidad y Datos</h2>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                Tus datos son importantes para nosotros. Solo recopilamos la información necesaria para
                el funcionamiento de la app, conforme a nuestra Política de Privacidad.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">3. Modificaciones</h2>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                Podemos actualizar estos términos en cualquier momento. El uso continuado de la aplicación
                constituye la aceptación de dichos cambios.
              </p>
            </section>
          </div>
        </GlassCard>

        <div className="mt-12 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest text-text-tertiary opacity-60">
            © 2026 Pro Fitness Glass
        </div>
      </div>
    </div>
  );
};

export default TermsPage;