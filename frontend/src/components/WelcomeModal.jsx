/* frontend/src/components/WelcomeModal.jsx */
import React, { useState, useEffect } from 'react';
import {
  Sparkles, ChevronRight, LayoutDashboard, Zap, Flame,
  Trophy, Check, Users, UserPlus, Heart, ArrowUp, Dumbbell,
  Link, Smartphone, Image, Globe, Clock, Download, Footprints, MapPin,
  Folder
} from 'lucide-react';
import { APP_VERSION } from '../config/version';

const WelcomeModal = ({ onClose }) => {
  const appVersion = `v${APP_VERSION}`;
  // ENLACE DE GITHUB
  const DOWNLOAD_URL = "https://github.com/Deathvks/Pro-Ftiness-Glass/releases/download/v5.0.0/app-release.apk";

  const handleGetStarted = () => {
    if (onClose) {
      onClose();
    }
  };

  // --- Estado para la animación realista del Dashboard (Experiencia) ---
  const [dashboardState, setDashboardState] = useState('morning'); // 'morning' | 'evening'

  // --- Estado para la animación Social ---
  const [socialState, setSocialState] = useState(0); // 0: Idle, 1: Connecting, 2: Connected

  useEffect(() => {
    // Animación Dashboard
    const dashInterval = setInterval(() => {
      setDashboardState(prev => prev === 'morning' ? 'evening' : 'morning');
    }, 4000);

    // Animación Social
    const socialInterval = setInterval(() => {
      setSocialState(prev => (prev + 1) % 3);
    }, 3000);

    return () => {
      clearInterval(dashInterval);
      clearInterval(socialInterval);
    };
  }, []);

  const isEvening = dashboardState === 'evening';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-[fade-in_0.3s_ease-out]">

      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-md bg-bg-primary border border-glass-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Decoración de fondo interna (SIN MORADOS) */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Scroll interno */}
        <div className="overflow-y-auto custom-scrollbar p-6 flex flex-col h-full relative z-10">

          {/* --- Cabecera V5 --- */}
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="mb-4 relative group">
              <div className="absolute inset-0 bg-accent/40 blur-xl rounded-full group-hover:bg-accent/60 transition-all duration-500"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-bg-secondary to-bg-primary rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-transform duration-500 border border-white/10">
                <span className="text-5xl font-black text-accent drop-shadow-lg">
                  v5
                </span>
              </div>
              {/* Badge "New" */}
              <div className="absolute -top-2 -right-8 bg-gradient-to-r from-red-600 to-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg animate-bounce z-20">
                GRAN ACTUALIZACIÓN
              </div>
            </div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary via-accent to-text-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_infinite_linear]">
              La Revolución Nativa
            </h1>
            <p className="text-text-secondary mt-2 text-sm max-w-[90%]">
              Pro Fitness Glass llega a tu móvil con una experiencia nativa, más rápida y completa que nunca.
            </p>
          </div>

          <div className="space-y-6 mb-8">

            {/* --- BLOQUE 0: APP NATIVA --- */}
            <a href={DOWNLOAD_URL} className="block no-underline transform transition-transform hover:scale-[1.02] active:scale-95">
              <div className="bg-white/5 bg-gradient-to-br from-accent/10 to-transparent rounded-2xl p-5 backdrop-blur-sm shadow-lg shadow-accent/5 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-accent/10 rounded-bl-full -mr-10 -mt-10 blur-md"></div>

                <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider relative z-10">
                  <Smartphone size={16} className="text-accent" /> App Android Nativa
                </h2>

                <div className="flex justify-center relative z-10">
                  <div className="relative w-full max-w-[260px] h-24 bg-bg-primary/90 border border-glass-border rounded-xl flex items-center justify-center shadow-xl overflow-hidden">
                    <div className="flex items-center gap-5 relative z-10">
                      <div className="relative">
                        <div className="absolute inset-0 bg-accent rounded-full animate-ping opacity-20"></div>
                        <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-bg-primary shadow-lg shadow-accent/30">
                          <Download size={24} strokeWidth={3} />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-lg text-text-primary">Descárgala Ya</span>
                        <span className="text-xs text-text-secondary">Rendimiento máximo</span>
                      </div>
                    </div>
                    {/* Partículas de fondo internas */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent to-transparent"></div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-text-muted text-center font-medium relative z-10">
                  Disponible ahora como archivo APK. ¡Instálala y siente la diferencia!
                </p>
              </div>
            </a>

            {/* --- BLOQUE 1: EXPERIENCIA Y NIVELES --- */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-accent/30 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Trophy size={16} className="text-accent" /> Experiencia y Niveles
              </h2>

              {/* MOCKUP DASHBOARD */}
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] bg-bg-primary/80 border border-glass-border rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all duration-1000 p-1 transform group-hover:scale-[1.02]">
                  <div className="p-3 space-y-2 bg-bg-secondary/20 rounded-xl relative h-full flex flex-col justify-center">
                    {/* Stats Row */}
                    <div className="flex gap-2">
                      <div className="flex-1 bg-bg-secondary/80 rounded-lg p-2 border border-white/5 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <Dumbbell size={10} className="text-accent" />
                          <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-1000 ${isEvening ? 'bg-accent' : 'bg-gray-600'}`}></div>
                        </div>
                        <div className="h-1 bg-gray-700 rounded-full w-full mt-1 overflow-hidden">
                          <div className={`h-full bg-accent transition-all duration-1000 ${isEvening ? 'w-4/5' : 'w-2/5'}`}></div>
                        </div>
                      </div>
                      <div className="flex-1 bg-bg-secondary/80 rounded-lg p-2 border border-white/5 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <Flame size={10} className="text-orange-400" />
                          <span className="text-[8px] font-mono">{isEvening ? '2100' : '450'}</span>
                        </div>
                        <div className="h-1 bg-gray-700 rounded-full w-full mt-1 overflow-hidden">
                          <div className={`h-full bg-orange-400 transition-all duration-1000 ${isEvening ? 'w-[85%]' : 'w-[20%]'}`}></div>
                        </div>
                      </div>
                    </div>

                    {/* Active Workout Card */}
                    <div className={`
                      rounded-lg p-2 border border-white/5 transition-all duration-1000 relative overflow-hidden
                      ${isEvening ? 'bg-green-500/10 border-green-500/30' : 'bg-bg-secondary/80 border-transparent'}
                    `}>
                      <div className="flex items-center gap-2 relative z-10">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-1000 ${isEvening ? 'bg-green-500 text-white' : 'bg-accent/10 text-accent'}`}>
                          {isEvening ? <Check size={12} /> : <Zap size={12} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="h-2 w-20 bg-text-primary/20 rounded mb-1"></div>
                          <div className="h-1.5 w-12 bg-text-secondary/20 rounded"></div>
                        </div>
                      </div>
                      {isEvening && <div className="absolute inset-0 bg-green-400/5 animate-pulse"></div>}
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted text-center">
                Visualiza tu progreso y sube de nivel con cada entrenamiento.
              </p>
            </div>

            {/* --- BLOQUE NUEVO: CARDIO & GPS --- */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-accent/30 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Footprints size={16} className="text-accent" /> Cardio & GPS
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] h-24 bg-bg-primary/80 border border-glass-border rounded-xl flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">

                  {/* Map Pattern Background */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#22c55e 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

                  {/* Path Simulation */}
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <path
                      d="M20,60 Q50,20 80,40 T140,30 T200,60"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                    />
                  </svg>

                  {/* Moving Marker */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-[bounce_2s_infinite]">
                    <MapPin size={24} className="text-red-500 drop-shadow-md fill-red-500/20" />
                  </div>

                  {/* Stats Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between px-2">
                    <div className="bg-bg-secondary/90 backdrop-blur border border-white/10 px-2 py-1 rounded text-[9px] font-mono text-text-primary flex items-center gap-1">
                      <Clock size={8} /> 24:00
                    </div>
                    <div className="bg-bg-secondary/90 backdrop-blur border border-white/10 px-2 py-1 rounded text-[9px] font-mono text-accent flex items-center gap-1">
                      <Zap size={8} /> 5:30 /km
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted text-center">
                Registra tus sesiones de running y ciclismo con GPS, mapas y estadísticas en tiempo real.
              </p>
            </div>

            {/* --- BLOQUE NUEVO: ORGANIZACIÓN POR CARPETAS --- */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-accent/30 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Folder size={16} className="text-yellow-400" /> Carpetas de Rutinas
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] h-20 bg-bg-primary/80 border border-glass-border rounded-xl flex items-center justify-center gap-3 shadow-lg overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 px-4">

                  {/* Carpeta 1 */}
                  <div className="flex flex-col items-center gap-1 group/folder transition-transform hover:-translate-y-1">
                    <div className="relative">
                      <Folder size={32} className="text-yellow-400 fill-yellow-400/20" />
                      {/* Punto eliminado */}
                    </div>
                    <div className="h-1.5 w-10 bg-white/20 rounded-full"></div>
                  </div>

                  {/* Carpeta 2 */}
                  <div className="flex flex-col items-center gap-1 group/folder transition-transform hover:-translate-y-1">
                    <Folder size={32} className="text-blue-400 fill-blue-400/20" />
                    <div className="h-1.5 w-12 bg-white/20 rounded-full"></div>
                  </div>

                  {/* Carpeta 3 (Active) */}
                  <div className="flex flex-col items-center gap-1 group/folder transition-transform hover:-translate-y-1">
                    <Folder size={32} className="text-accent fill-accent/20" />
                    <div className="h-1.5 w-8 bg-accent/40 rounded-full"></div>
                  </div>

                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted text-center">
                Organiza tus rutinas en carpetas personalizadas (Pecho, Pierna, Hipertrofia...) para un acceso más rápido.
              </p>
            </div>

            {/* --- BLOQUE 2: MAPA DE CALOR --- */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-accent/30 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Flame size={16} className="text-orange-500" /> Mapa de Calor Muscular
              </h2>

              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] h-24 bg-bg-primary/80 border border-glass-border rounded-xl flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 gap-6">

                  {/* Silueta Abstracta */}
                  <div className="relative w-12 h-20 opacity-90">
                    <div className="mx-auto w-3 h-3 bg-white/20 rounded-full mb-0.5"></div>
                    <div className="mx-auto w-6 h-8 bg-red-500/80 rounded-sm mb-0.5 animate-[pulse_3s_infinite] shadow-[0_0_12px_rgba(239,68,68,0.4)]"></div>
                    <div className="flex justify-center gap-0.5">
                      <div className="w-2.5 h-7 bg-yellow-400/80 rounded-sm shadow-[0_0_8px_rgba(250,204,21,0.3)]"></div>
                      <div className="w-2.5 h-7 bg-yellow-400/80 rounded-sm shadow-[0_0_8px_rgba(250,204,21,0.3)]"></div>
                    </div>
                    <div className="absolute top-4 left-0 w-2 h-7 bg-cyan-400/60 rounded-sm -rotate-12"></div>
                    <div className="absolute top-4 right-0 w-2 h-7 bg-cyan-400/60 rounded-sm rotate-12"></div>
                  </div>

                  {/* Leyenda Mini */}
                  <div className="flex flex-col justify-center gap-2 text-[10px] text-text-secondary">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_red]"></div>
                      <span>Intensidad Máx</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      <span>Alta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                      <span>Baja</span>
                    </div>
                  </div>

                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted text-center">
                Detecta automáticamente qué músculos entrenas y dónde necesitas mejorar.
              </p>
            </div>

            {/* --- BLOQUE 3: LO SOCIAL --- */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-accent/30 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Users size={16} className="text-accent" /> Modo Social
              </h2>

              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] h-20 bg-bg-primary/80 border border-glass-border rounded-xl flex items-center justify-between px-6 shadow-lg overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">

                  {/* Avatar YO */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-accent/50 p-[2px]">
                      <div className="w-full h-full rounded-full bg-bg-primary flex items-center justify-center">
                        <span className="text-[10px] font-bold">YO</span>
                      </div>
                    </div>
                  </div>

                  {/* Línea de Conexión Animada */}
                  <div className="flex-1 h-[2px] bg-white/5 mx-2 relative overflow-hidden rounded-full">
                    {socialState >= 1 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent to-transparent w-1/2 animate-[shimmer_1.5s_infinite_linear]"></div>
                    )}
                    {socialState === 2 && (
                      <div className="absolute inset-0 bg-accent transition-all duration-500"></div>
                    )}
                  </div>

                  {/* Avatar AMIGO */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${socialState === 2
                      ? 'border-green-500 bg-green-500/10 text-green-500 scale-110'
                      : socialState === 1
                        ? 'border-accent/50 text-accent animate-pulse'
                        : 'border-white/10 bg-bg-secondary text-text-tertiary'
                      }`}>
                      {socialState === 2 ? <Check size={16} strokeWidth={3} /> : <UserPlus size={16} />}
                    </div>
                  </div>

                  {/* Pop-up "Amigos" */}
                  <div className={`absolute top-2 left-1/2 -translate-x-1/2 transition-all duration-500 ${socialState === 2 ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
                    }`}>
                    <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                      <Heart size={8} className="fill-current" /> Amigos
                    </div>
                  </div>

                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted text-center">
                Encuentra compañeros, comparte rutinas y compite.
              </p>
            </div>

            {/* --- BLOQUE 4: SUPERSERIES --- */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-accent/30 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Link size={16} className="text-accent" /> Superseries Pro
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] h-20 bg-bg-primary/80 border border-glass-border rounded-xl flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                  <div className="flex gap-2 items-center">
                    <div className="bg-bg-secondary/30 p-2 rounded-lg border border-glass-border flex flex-col items-center w-16">
                      <div className="w-8 h-8 rounded bg-accent/20 text-accent flex items-center justify-center font-bold text-xs mb-1">A1</div>
                      <div className="h-1 w-8 bg-white/10 rounded"></div>
                    </div>
                    <div className="h-0.5 w-6 bg-accent/50"></div>
                    <div className="bg-bg-secondary/30 p-2 rounded-lg border border-glass-border flex flex-col items-center w-16">
                      <div className="w-8 h-8 rounded bg-accent/20 text-accent flex items-center justify-center font-bold text-xs mb-1">A2</div>
                      <div className="h-1 w-8 bg-white/10 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted text-center">
                Agrupa ejercicios y gestiona tus circuitos con una nueva interfaz unificada.
              </p>
            </div>

            {/* --- BLOQUE 5: IMÁGENES --- */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-accent/30 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Image size={16} className="text-accent" /> Portadas de Rutina
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] h-24 bg-bg-primary/80 border border-glass-border rounded-xl overflow-hidden shadow-lg group-hover:scale-[1.02] transition-transform duration-500">
                  {/* Background simula imagen */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/40 via-purple-500/40 to-blue-500/40 opacity-80"></div>
                  {/* Contenido simula tarjeta de rutina */}
                  <div className="absolute inset-0 p-3 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent">
                    <div className="w-2/3 h-2 bg-white/90 rounded-full mb-1"></div>
                    <div className="w-1/3 h-1.5 bg-white/60 rounded-full"></div>
                  </div>
                  {/* Icono flotante */}
                  <div className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-sm rounded-full">
                    <Image size={12} className="text-white" />
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted text-center">
                Dale vida a tus entrenamientos personalizando la portada de tus rutinas.
              </p>
            </div>

            {/* --- BLOQUE 6: VIBRACIÓN --- */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-accent/30 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Smartphone size={16} className="text-accent" /> Feedback Háptico
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] h-20 bg-bg-primary/80 border border-glass-border rounded-xl flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                  <div className="relative">
                    <Smartphone size={32} className="text-text-primary relative z-10" />
                    <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping blur-sm"></div>
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-accent rounded-full animate-[pulse_0.5s_ease-in-out_infinite]"></div>
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-accent rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.1s]"></div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted text-center">
                Siente cada repetición, descanso y logro con la nueva respuesta táctil.
              </p>
            </div>

            {/* --- BLOQUE 7: ZONA HORARIA --- */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-accent/30 transition-colors duration-500 group">
              <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Globe size={16} className="text-accent" /> Zona Horaria
              </h2>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[260px] h-20 bg-bg-primary/80 border border-glass-border rounded-xl flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                  <div className="relative flex items-center justify-center">
                    {/* Globo Girando Lento */}
                    <Globe size={40} className="text-text-primary/20 animate-[spin_10s_linear_infinite]" />
                    {/* Reloj Central */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Clock size={20} className="text-accent drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" />
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted text-center">
                Configura tu región para que tus registros y notificaciones estén siempre sincronizados.
              </p>
            </div>

          </div>

          {/* --- Footer --- */}
          <div className="mt-auto pt-2">
            <button
              onClick={handleGetStarted}
              className="group w-full py-4 px-6 bg-gradient-to-r from-accent to-accent-secondary hover:to-accent text-bg-primary font-black rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20 flex items-center justify-center gap-3"
            >
              <span className="tracking-wide">DESCUBRIR LA V5</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="text-center mt-4">
              <span className="text-[10px] text-text-tertiary uppercase tracking-widest opacity-50">
                Build {appVersion}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;