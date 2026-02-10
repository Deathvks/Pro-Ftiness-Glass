/* frontend/src/pages/LandingPage.jsx */
import React from 'react';
import { Dumbbell, Activity, Shield, ChevronRight } from 'lucide-react';

// --- IMPORTACIÓN DINÁMICA DE LA VERSIÓN ---
// Esto lee automáticamente el campo "version" de tu package.json
import packageJson from '../../package.json'; 

const LandingPage = ({ onLogin, onRegister }) => {
  const currentYear = new Date().getFullYear();
  const appVersion = packageJson.version; // Obtenemos la versión real (ej: 1.0.12)

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col relative overflow-hidden font-sans transition-colors duration-300">
      
      {/* Background Gradients Dinámicos */}
      <div 
        className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgb(var(--accent-r), var(--accent-g), var(--accent-b)), transparent)' }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgb(var(--accent-r), var(--accent-g), var(--accent-b)), transparent)' }}
      />

      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 z-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
           <img src="/logo.webp" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg" />
           <span className="font-bold text-xl tracking-tight hidden sm:block">PRO FITNESS GLASS</span>
        </div>
        <div className="flex gap-4">
            <button 
            onClick={onLogin}
            className="text-sm font-semibold text-text-secondary hover:text-accent transition-colors"
            >
            Iniciar Sesión
            </button>
            <button 
            onClick={onRegister}
            className="text-sm font-bold bg-glass-border hover:bg-glass-base px-4 py-2 rounded-full border border-white/10 transition-all backdrop-blur-md"
            >
            Registro
            </button>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 text-center z-10 mt-[-40px]">
        
        {/* Badge de Versión AUTOMÁTICO */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-glass-base border border-white/5 mb-8 backdrop-blur-md shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          {/* Aquí se muestra tu versión real del package.json */}
          <span className="text-xs font-medium text-text-secondary tracking-wide">v{appVersion}</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.1]">
          Entrena <br/> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/60">Inteligente.</span>
        </h1>

        <p className="text-lg text-text-secondary max-w-lg mb-10 leading-relaxed">
          La herramienta definitiva para registrar tus rutinas, controlar tu nutrición y visualizar tu progreso real. 
          <span className="block mt-2 opacity-70 text-sm">Sin anuncios. Sin distracciones.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
            <button 
            onClick={onRegister}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold transition-all transform hover:scale-[1.02] shadow-lg shadow-accent/20"
            >
            Empezar Gratis
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>

        {/* Features Grid Mini */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 max-w-4xl w-full px-4">
          {[
            { icon: Dumbbell, title: "Rutinas", desc: "Registro intuitivo" },
            { icon: Activity, title: "Progreso", desc: "Métricas avanzadas" },
            { icon: Shield, title: "Privacidad", desc: "Tus datos son tuyos" }
          ].map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-glass-base border border-white/5 backdrop-blur-sm flex flex-col items-center hover:border-accent/30 transition-colors">
              <item.icon size={24} className="text-accent mb-3" />
              <h3 className="font-bold text-text-primary text-sm">{item.title}</h3>
              <p className="text-xs text-text-secondary mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer Legal */}
      <footer className="p-8 text-center z-10 border-t border-white/5 bg-glass-base/50 backdrop-blur-md">
        <div className="flex justify-center gap-8 text-xs text-text-secondary font-medium mb-4">
          <a href="/privacy" className="hover:text-accent transition-colors">Política de Privacidad</a>
          <a href="/terms" className="hover:text-accent transition-colors">Términos del Servicio</a>
        </div>
        <p className="text-[10px] text-text-tertiary opacity-60">
            © {currentYear} Pro Fitness Glass. Todos los derechos reservados.
        </p>
      </footer>

    </div>
  );
};

export default LandingPage;