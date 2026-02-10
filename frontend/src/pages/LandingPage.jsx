/* frontend/src/pages/LandingPage.jsx */
import React from 'react';
import { Dumbbell, Activity, Shield, ChevronRight } from 'lucide-react';

// Importación dinámica de la versión
import packageJson from '../../package.json'; 

const LandingPage = ({ onLogin, onRegister }) => {
  const currentYear = new Date().getFullYear();
  const appVersion = packageJson.version; 

  return (
    // CAMBIO IMPORTANTE: "fixed inset-0 overflow-y-auto"
    // Esto crea una capa que cubre toda la pantalla y tiene su propio scroll vertical,
    // ignorando el bloqueo de scroll de la app principal.
    <div className="fixed inset-0 z-[100] bg-bg-primary text-text-primary overflow-y-auto overflow-x-hidden font-sans transition-colors duration-300">
      
      {/* Background Gradients (Fixed para que no se muevan al hacer scroll) */}
      <div 
        className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgb(var(--accent-r), var(--accent-g), var(--accent-b)), transparent)' }}
      />
      <div 
        className="fixed bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgb(var(--accent-r), var(--accent-g), var(--accent-b)), transparent)' }}
      />

      <div className="relative z-10 flex flex-col min-h-full">
        
        {/* Navbar Responsive */}
        <nav className="flex justify-between items-center p-4 sm:p-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-lg" />
            <span className="font-bold text-lg sm:text-xl tracking-tight hidden sm:block">PRO FITNESS GLASS</span>
            </div>
            <div className="flex gap-3 sm:gap-4">
                <button 
                onClick={onLogin}
                className="text-sm font-semibold text-text-secondary hover:text-accent transition-colors px-2"
                >
                Entrar
                </button>
                <button 
                onClick={onRegister}
                className="text-sm font-bold bg-glass-border hover:bg-glass-base px-4 py-2 rounded-full border border-white/10 transition-all backdrop-blur-md shadow-lg"
                >
                Registro
                </button>
            </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 text-center w-full max-w-7xl mx-auto">
            
            {/* Badge de Versión */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-glass-base border border-white/5 mb-8 backdrop-blur-md shadow-sm">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-xs font-medium text-text-secondary tracking-wide">v{appVersion}</span>
            </div>

            {/* Título */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.1]">
            Entrena <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/60">Inteligente.</span>
            </h1>

            <p className="text-base sm:text-lg text-text-secondary max-w-lg mb-10 leading-relaxed px-2">
            La herramienta definitiva para registrar tus rutinas, controlar tu nutrición y visualizar tu progreso real.
            </p>

            <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-4 justify-center mb-16">
                <button 
                onClick={onRegister}
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold transition-all transform active:scale-95 shadow-lg shadow-accent/20 w-full sm:w-auto"
                >
                Empezar Gratis
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Grid de Características */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl px-2 mb-8">
            {[
                { icon: Dumbbell, title: "Rutinas", desc: "Registro intuitivo" },
                { icon: Activity, title: "Progreso", desc: "Métricas avanzadas" },
                { icon: Shield, title: "Privacidad", desc: "Datos seguros" }
            ].map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-glass-base border border-white/5 backdrop-blur-sm flex flex-col items-center hover:border-accent/30 transition-colors">
                <item.icon size={24} className="text-accent mb-3" />
                <h3 className="font-bold text-text-primary text-sm">{item.title}</h3>
                <p className="text-xs text-text-secondary mt-1">{item.desc}</p>
                </div>
            ))}
            </div>
        </main>

        {/* Footer Legal - SIN SUBRAYADOS */}
        <footer className="p-8 pb-12 text-center border-t border-white/5 bg-glass-base/50 backdrop-blur-md mt-auto">
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-xs text-text-secondary font-medium mb-4">
            <a 
                href="https://pro-fitness-glass.zeabur.app/privacy" 
                className="hover:text-accent transition-colors"
            >
                Política de Privacidad
            </a>
            <a 
                href="https://pro-fitness-glass.zeabur.app/terms" 
                className="hover:text-accent transition-colors"
            >
                Términos del Servicio
            </a>
            </div>
            <p className="text-[10px] text-text-tertiary opacity-60">
                © {currentYear} Pro Fitness Glass. Todos los derechos reservados.
            </p>
        </footer>

      </div>
    </div>
  );
};

export default LandingPage;