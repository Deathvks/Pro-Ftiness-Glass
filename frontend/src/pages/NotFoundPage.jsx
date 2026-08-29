import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = ({ navigate }) => {
  return (
    <>
      <Helmet>
        <title>Página no encontrada - Pro Fitness Glass</title>
      </Helmet>

      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center animate-[fade-in_0.3s_ease-out]">
        <div className="relative mb-8">
          <div className="text-[150px] sm:text-[200px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-br from-accent to-accent/20 select-none opacity-30 dark:opacity-20">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-bg-primary rounded-full shadow-2xl flex items-center justify-center ring-4 ring-black/5 dark:ring-white/5 relative z-10 animate-[bounce_2s_infinite]">
              <Search className="w-12 h-12 sm:w-16 sm:h-16 text-text-primary" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight mb-4">
          ¡Ups! Te has perdido
        </h1>
        
        <p className="text-text-secondary text-lg mb-10 max-w-md font-medium">
          Parece que la página que estás buscando no existe, ha sido movida o simplemente te has equivocado al teclear la dirección.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary rounded-full font-bold transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
            Volver Atrás
          </button>
          <button
            onClick={() => navigate('dashboard')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-bold shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Home size={20} />
            Ir al Inicio
          </button>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
