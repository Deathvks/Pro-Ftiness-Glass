/* frontend/src/pages/LandingPage.jsx */
import React, { useEffect, useState, useRef } from 'react';
import { 
  Dumbbell, Activity, Shield, ChevronRight, Utensils, 
  LineChart, Users, Zap, Smartphone, Trophy, ArrowRight
} from 'lucide-react';
// No olvides importar Link si decides usarlo, aunque para Google los <a> absolutos son mejores en el footer
import { Link } from 'react-router-dom'; 

import packageJson from '../../package.json'; 

const LandingPage = ({ onLogin, onRegister }) => {
  const currentYear = new Date().getFullYear();
  const appVersion = packageJson.version; 
  
  const [isVisible, setIsVisible] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    setIsDocked(scrollTop > 100);
  };

  // --- MASCOTA: GymBot (Inteligente) ---
  const GymBot = () => (
    <div 
        className={`fixed z-50 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none sm:pointer-events-auto
            ${isDocked 
                ? 'top-[85%] left-[80%] sm:left-[90%] -translate-x-1/2 -translate-y-1/2 scale-50 sm:scale-60' 
                : 'top-[33%] sm:top-[25%] left-1/2 -translate-x-1/2 -translate-y-1/2 scale-100'
            }
        `}
    >
        <style>{`
            @keyframes gymbot-roam {
                0% { transform: translate(0, 0) rotate(0deg); }
                25% { transform: translate(120px, -5px) rotate(5deg); }
                50% { transform: translate(0, 10px) rotate(0deg); }
                75% { transform: translate(-120px, -5px) rotate(-5deg); }
                100% { transform: translate(0, 0) rotate(0deg); }
            }
            @media (max-width: 640px) {
                @keyframes gymbot-roam {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    25% { transform: translate(40px, -5px) rotate(3deg); }
                    50% { transform: translate(0, 10px) rotate(0deg); }
                    75% { transform: translate(-40px, -5px) rotate(-3deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }
            }
        `}</style>

        <div 
            className="w-40 h-40 relative group cursor-pointer perspective-1000"
            style={{ animation: 'gymbot-roam 12s infinite ease-in-out' }}
        >
            <div className="w-full h-full relative animate-[bounce_3s_infinite_ease-in-out] group-hover:[animation-play-state:paused]">
                <div className={`absolute inset-4 bg-gradient-to-br from-glass-base to-glass-bg border border-glass-border rounded-[2.5rem] shadow-[0_0_40px_-10px_rgba(var(--accent-r),var(--accent-g),var(--accent-b),0.3)] backdrop-blur-xl flex flex-col items-center justify-center z-20 transition-transform duration-300 group-hover:scale-110 ${isDocked ? 'shadow-accent/40' : ''}`}>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-1 h-6 bg-glass-border"></div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-accent animate-pulse shadow-[0_0_15px_currentColor]"></div>
                    <div className="relative w-full px-6 py-2 flex flex-col items-center gap-3">
                        <div className="flex gap-6 w-full justify-center">
                            <div className="w-3 h-4 bg-accent rounded-full animate-[pulse_3s_infinite]"></div>
                            <div className="w-3 h-4 bg-accent rounded-full animate-[pulse_3s_infinite] delay-75"></div>
                        </div>
                        <div className="w-8 h-1.5 bg-text-primary/40 rounded-full group-hover:bg-accent/80 transition-colors"></div>
                    </div>
                </div>

                <div className="absolute top-1/2 -left-6 w-12 h-12 flex items-center justify-center origin-right animate-[spin_3s_ease-in-out_infinite_alternate]">
                    <div className="w-full h-2 bg-glass-border absolute right-0 rounded-full"></div>
                    <div className="absolute left-0 p-1.5 bg-accent rounded-lg shadow-lg text-bg-primary transform -rotate-90">
                        <Dumbbell size={18} fill="currentColor" />
                    </div>
                </div>

                <div className="absolute top-1/2 -right-6 w-12 h-12 flex items-center justify-center origin-left animate-[spin_3s_ease-in-out_infinite_alternate-reverse]">
                    <div className="w-full h-2 bg-glass-border absolute left-0 rounded-full"></div>
                    <div className="absolute right-0 p-1.5 bg-accent rounded-lg shadow-lg text-bg-primary transform rotate-90">
                        <Dumbbell size={18} fill="currentColor" />
                    </div>
                </div>

                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/20 blur-lg rounded-[100%] animate-[pulse_3s_infinite_ease-in-out]"></div>
                
                <div className={`absolute -top-16 -left-20 bg-glass-base border border-glass-border px-4 py-2 rounded-xl text-xs font-bold text-accent transition-all duration-300 pointer-events-none whitespace-nowrap
                    ${isDocked ? 'opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0' : 'opacity-0'}
                `}>
                    ¡Sigue bajando! 🚀
                </div>
            </div>
        </div>
    </div>
  );

  const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
    <div 
      className={`p-6 rounded-3xl bg-glass-base border border-glass-border backdrop-blur-md flex flex-col items-center text-center hover:border-accent/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-accent/10 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="p-3 rounded-2xl bg-accent/10 text-accent mb-4 group-hover:bg-accent group-hover:text-white transition-colors duration-300">
        <Icon size={28} />
      </div>
      <h3 className="font-bold text-text-primary text-lg mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
    </div>
  );

  return (
    <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="fixed inset-0 z-[100] bg-bg-primary text-text-primary overflow-y-auto overflow-x-hidden font-sans custom-scrollbar scroll-smooth"
    >
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
        <div 
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 dark:opacity-20 animate-[pulse_8s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(circle, rgb(var(--accent-r), var(--accent-g), var(--accent-b)), transparent)' }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-10 dark:opacity-10 animate-[pulse_10s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(circle, rgb(var(--accent-r), var(--accent-g), var(--accent-b)), transparent)', animationDelay: '2s' }}
        />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      <GymBot />

      <div className="relative z-10 flex flex-col min-h-full">
        
        {/* --- NAVBAR --- */}
        <nav className={`sticky top-0 z-40 transition-all duration-700 backdrop-blur-lg border-b border-glass-border ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
          <div className="flex justify-between items-center p-4 sm:px-8 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })} >
              <img src="/logo.webp" alt="Logo" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-lg ring-1 ring-glass-border group-hover:scale-105 transition-transform" />
              <span className="font-black text-lg sm:text-xl tracking-tighter hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary group-hover:to-accent transition-all">
                PRO FITNESS GLASS
              </span>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <button onClick={onLogin} className="text-sm font-semibold text-text-secondary hover:text-accent transition-colors px-3 py-2" >
                Iniciar Sesión
              </button>
              <button onClick={onRegister} className="text-sm font-bold bg-accent hover:bg-accent/90 text-white px-5 py-2.5 rounded-full transition-all shadow-lg shadow-accent/20 hover:shadow-accent/40 active:scale-95 flex items-center gap-2" >
                Empezar <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </nav>

        {/* --- HERO SECTION --- */}
        <main className="flex-grow flex flex-col items-center px-4 pt-10 pb-24 text-center w-full max-w-7xl mx-auto">
          <div className="h-40 w-full mb-36 sm:mb-24 pointer-events-none"></div>

          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-glass-base border border-accent/20 mb-6 backdrop-blur-md shadow-sm transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
            </span>
            <span className="text-xs font-bold text-accent tracking-wide uppercase">Versión {appVersion}</span>
          </div>

          <div className={`space-y-4 max-w-5xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[1.1] mb-6">
              Tu Cuerpo, <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-white to-accent animate-gradient-x bg-[length:200%_auto]">
                Bajo Control.
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              La única plataforma que combina <strong>entrenamiento inteligente</strong>, <strong>nutrición precisa</strong> y <strong>análisis de datos</strong> en una experiencia de cristal.
            </p>
          </div>

          <div className={`flex flex-col sm:flex-row gap-4 mt-10 mb-20 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <button onClick={onRegister} className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold text-lg transition-all transform active:scale-95 shadow-xl shadow-accent/25 ring-1 ring-white/20" >
              Crear Cuenta Gratis
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={onLogin} className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-glass-base hover:bg-glass-border text-text-primary rounded-2xl font-bold text-lg transition-all border border-glass-border hover:border-accent/30" >
              Ya tengo cuenta
            </button>
          </div>

          {/* --- DESCRIPCIÓN DEL PROPÓSITO (REQUERIDO POR GOOGLE) --- */}
          {/* Añadido para explicar explícitamente qué hace la app */}
          <section className={`w-full max-w-4xl mx-auto mb-20 text-center px-4 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-2xl font-bold text-text-primary mb-4">¿Qué es Pro Fitness Glass?</h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Pro Fitness Glass es una plataforma integral de bienestar diseñada para atletas y entusiastas del fitness. 
              Nuestra aplicación permite registrar detalladamente rutinas de ejercicio, planificar y monitorear la nutrición 
              y analizar el progreso físico mediante herramientas visuales, todo con el objetivo de optimizar tu rendimiento y salud.
            </p>
          </section>

          {/* --- SECCIÓN 1: BENTO GRID --- */}
          <div className="w-full mt-10">
            <div className="flex items-center justify-center gap-4 mb-8">
                <div className="h-px w-10 bg-gradient-to-r from-transparent to-accent"></div>
                <h2 className={`text-sm font-bold text-accent tracking-widest uppercase transition-all duration-700 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                Todo lo que necesitas
                </h2>
                <div className="h-px w-10 bg-gradient-to-l from-transparent to-accent"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
              
              {/* Card 1 */}
              <div className={`md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-glass-base to-transparent border border-glass-border backdrop-blur-md transition-all duration-700 delay-300 hover:border-accent/20 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                 <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Dumbbell size={28} />
                 </div>
                 <h3 className="text-2xl font-bold text-text-primary mb-3">Rutinas Avanzadas</h3>
                 <p className="text-text-secondary mb-6 max-w-md">
                    Diseña entrenamientos con superseries, dropsets y descansos personalizados. Registra pesos, RPE y notas en tiempo real.
                 </p>
                 <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-mono text-text-tertiary border border-glass-border group-hover:border-blue-500/30 transition-colors">Superseries</span>
                    <span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-mono text-text-tertiary border border-glass-border group-hover:border-blue-500/30 transition-colors">Historial</span>
                    <span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-mono text-text-tertiary border border-glass-border group-hover:border-blue-500/30 transition-colors">1RM Estimado</span>
                 </div>
              </div>

              {/* Card 2 */}
              <div className={`p-8 rounded-3xl bg-gradient-to-br from-glass-base to-transparent border border-glass-border backdrop-blur-md transition-all duration-700 delay-400 hover:border-accent/20 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                 <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Utensils size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-text-primary mb-3">Nutrición & Macros</h3>
                 <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                    Base de datos verificada. Escanea códigos de barras y controla tus calorías diarias sin estrés ni complicaciones.
                 </p>
              </div>

              {/* Card 3 */}
              <div className={`p-8 rounded-3xl bg-gradient-to-br from-glass-base to-transparent border border-glass-border backdrop-blur-md transition-all duration-700 delay-500 hover:border-accent/20 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                 <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <LineChart size={28} />
                 </div>
                 <h3 className="text-xl font-bold text-text-primary mb-3">Análisis Visual</h3>
                 <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                    Gráficos interactivos de tu peso corporal, volumen de carga y medidas corporales para ver tu evolución real.
                 </p>
              </div>

              {/* Card 4 */}
              <div className={`md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-glass-base to-transparent border border-glass-border backdrop-blur-md transition-all duration-700 delay-600 hover:border-accent/20 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                 <div className="w-12 h-12 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Users size={28} />
                 </div>
                 <h3 className="text-2xl font-bold text-text-primary mb-3">Comunidad Fitness</h3>
                 <p className="text-text-secondary mb-6 max-w-md">
                    Comparte tus logros, sube historias efímeras de tus entrenos y encuentra motivación con tus amigos reales.
                 </p>
                 
                 <div className="flex items-center gap-4">
                     <div className="flex -space-x-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="w-10 h-10 rounded-full bg-glass-border border-2 border-bg-primary flex items-center justify-center overflow-hidden transition-transform hover:-translate-y-1 hover:z-10">
                                 <Users size={16} className="text-text-tertiary" />
                            </div>
                        ))}
                     </div>
                     <span className="text-xs text-text-secondary font-medium px-3 py-1 bg-white/5 rounded-full border border-glass-border">
                        Únete a nosotros
                     </span>
                 </div>
              </div>

            </div>
          </div>

          {/* --- SECCIÓN 2: CARACTERÍSTICAS TÉCNICAS --- */}
          <div className="w-full mt-24">
             <h2 className="text-3xl md:text-4xl font-black text-center mb-12">
                Diseñado para <span className="text-accent">Rendir</span>
             </h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FeatureCard 
                    icon={Smartphone} 
                    title="PWA Instalable" 
                    desc="Instálala como una app nativa en iOS y Android. Funciona incluso sin internet."
                    delay={100}
                />
                <FeatureCard 
                    icon={Shield} 
                    title="Privacidad Total" 
                    desc="Tus fotos y datos son privados. Tú tienes el control total de lo que compartes."
                    delay={200}
                />
                <FeatureCard 
                    icon={Trophy} 
                    title="Gamificación" 
                    desc="Gana XP, sube de nivel y desbloquea medallas por tu constancia en el gym."
                    delay={300}
                />
                <FeatureCard 
                    icon={Zap} 
                    title="Rápido y Fluido" 
                    desc="Interfaz Glassmorphism ultra optimizada para ser rápida en cualquier dispositivo."
                    delay={400}
                />
             </div>
          </div>

          {/* --- CTA FINAL --- */}
          <div className="mt-32 w-full max-w-3xl p-1 rounded-3xl bg-gradient-to-r from-accent/50 via-white/20 to-accent/50 animate-gradient-x">
             <div className="bg-bg-primary rounded-[22px] p-10 md:p-16 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-accent/5 z-0"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-5xl font-black mb-6">¿Listo para el cambio?</h2>
                    <p className="text-text-secondary text-lg mb-8 max-w-xl mx-auto">
                        Únete hoy mismo a Pro Fitness Glass. Sin trucos, solo herramientas para tu mejor versión.
                    </p>
                    <button 
                        onClick={onRegister}
                        className="px-10 py-4 bg-accent text-white rounded-xl font-bold text-xl shadow-lg shadow-accent/30 hover:scale-105 hover:shadow-accent/50 transition-all duration-300"
                    >
                        Comenzar Ahora
                    </button>
                </div>
             </div>
          </div>

        </main>

        {/* --- FOOTER LEGAL --- */}
        {/* Enlaces ABSOLUTOS para validación estricta de Google */}
        <footer className="p-8 pb-12 text-center border-t border-glass-border bg-glass-base/30 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row justify-center gap-6 text-sm text-text-secondary font-medium mb-6">
            <a href="https://pro-fitness-glass.zeabur.app/privacy" className="hover:text-accent transition-colors flex items-center justify-center gap-2">
                <Shield size={14} /> Política de Privacidad
            </a>
            <span className="hidden sm:block text-text-secondary/20">|</span>
            <a href="https://pro-fitness-glass.zeabur.app/terms" className="hover:text-accent transition-colors flex items-center justify-center gap-2">
                <Activity size={14} /> Términos del Servicio
            </a>
            </div>
            <p className="text-xs text-text-tertiary opacity-50">
                © {currentYear} Pro Fitness Glass. Desarrollado con pasión y cafeína. v{appVersion}
            </p>
        </footer>

      </div>
    </div>
  );
};

export default LandingPage;