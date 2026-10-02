import React from 'react';
import ModalPortal from './ModalPortal';
import { X, GraduationCap, Star, ShieldCheck, Award } from 'lucide-react';

export default function TrainerProfileModal({ visible, onClose, trainer }) {
  if (!visible) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Contenedor Modal */}
        <div className="relative w-full max-h-[90vh] sm:max-h-[85vh] sm:w-[500px] bg-bg-primary sm:rounded-[32px] rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden animate-slide-up-ios">
          
          {/* Header Image Area */}
          <div className="relative h-64 sm:h-72 w-full shrink-0">
            <img 
              src="/trainer-profile.jpg" 
              alt="Perfil del Entrenador" 
              className="w-full h-full object-cover object-center"
            />
            {/* Gradiente inferor para la transicion suave */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg-primary to-transparent" />
            
            {/* Boton Cerrar */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>

          {/* Titulo y Badge */}
          <div className="px-6 relative -mt-8 z-10 shrink-0">
            <h2 className="text-3xl font-black text-text-primary tracking-tight">
              {trainer?.name || 'Entrenador Personal'}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 rounded-full bg-accent/10 text-accent-contrast text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <ShieldCheck size={14} className="text-accent-contrast" />
                Preparador Oficial
              </span>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            
            {/* Seccion Estudios */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-accent">
                <GraduationCap size={22} />
                <h3 className="text-lg font-bold text-text-primary">Mis Estudios</h3>
              </div>
              
              <ul className="space-y-3">
                {[
                  'Grado superior de acondicionamiento f\u00EDsico',
                  'Grado universitario de CAFyD',
                  'M\u00E1ster de entrenamiento personal',
                  'M\u00E1ster de nutrici\u00F3n aplicada al entrenamiento',
                  'Certificaci\u00F3n de nivel 1 de experto en biomec\u00E1nica'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 rounded-[16px] bg-black/5 dark:bg-white/5 border border-glass-border">
                    <Award size={18} className="text-accent shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-text-secondary leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Seccion Especialidades */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-accent">
                <Star size={22} />
                <h3 className="text-lg font-bold text-text-primary">Especialidades</h3>
              </div>
              
              <div className="space-y-3">
                {[
                  'Rehabilitaci\u00F3n y readaptaci\u00F3n de lesiones y patolog\u00EDas',
                  'Trabajo de rotaciones aplicado a rendimiento deportivo y salud',
                  'Entrenamiento personalizado a tu d\u00EDa y vida diaria'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-[16px] bg-accent/5 border border-accent/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0 shadow-[0_0_8px_var(--color-accent)]" />
                    <span className="text-sm font-bold text-text-primary leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Espaciado extra abajo para mviles con Safe Area */}
            <div className="h-6" />
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

