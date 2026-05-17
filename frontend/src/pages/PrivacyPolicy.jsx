/* frontend/src/pages/PrivacyPolicy.jsx */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Cookie, Camera, Shield, Bell, Globe, Trash2, 
  Mail, Clock, Users, HeartHandshake, MapPin 
} from 'lucide-react';
import SEOHead from '../components/SEOHead';

const PrivacyPolicy = ({ onBack }) => {
  // Permitimos usar la prop onBack si se pasa (para el bypass en App.jsx) o useNavigate por defecto
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  // Fecha actual formateada en español
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Componente interno para las tarjetas con los estilos específicos
  const PolicyCard = ({ children, className = "", highlight = false }) => {
    return (
      <div className={`
        rounded-[32px] p-6 sm:p-8 transition-all duration-300 backdrop-blur-xl ring-1 shadow-lg hover:-translate-y-1
        ${highlight 
          ? 'bg-accent/5 ring-accent/30 hover:ring-accent/50 hover:shadow-accent/10' 
          : 'bg-black/5 dark:bg-white/5 ring-black/5 dark:ring-white/10 hover:ring-black/10 dark:hover:ring-white/20' 
        }
        ${className}
      `}>
        {children}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[110] bg-bg-primary overflow-y-auto custom-scrollbar transition-colors duration-300">
      <SEOHead 
        title="Política de Privacidad y Eliminación de Datos - Pro Fitness Glass" 
        description="Conoce cómo protegemos tus datos y los pasos para solicitar la eliminación de tu cuenta."
        route="privacy-policy" 
      />

      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out] mt-4 sm:mt-0">
        
        {/* Botón Volver */}
        <button 
          onClick={handleBack} 
          className="flex items-center gap-2 px-4 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 rounded-full text-text-secondary font-bold hover:text-text-primary transition-colors mb-8 w-fit active:scale-95"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
          <span>Volver</span>
        </button>
        
        <div className="text-center mb-12 sm:mb-16 px-2">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-text-primary via-accent to-text-primary mb-6 tracking-tight leading-tight">
            Tu Privacidad Importa
          </h1>
          <p className="text-lg sm:text-xl font-medium text-text-secondary max-w-2xl mx-auto leading-relaxed">
            En <strong>Pro Fitness Glass</strong>, queremos que te sientas como en casa. Aquí te explicamos de forma sencilla y transparente cómo cuidamos tus datos y cómo puedes ejercer tus derechos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">

            {/* --- SECCIÓN DESTACADA: Historias --- */}
            <PolicyCard className="md:col-span-2" highlight={true}>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-accent text-white rounded-[20px] shadow-lg shadow-accent/30 ring-1 ring-white/20">
                  <Clock size={28} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">Historias y Contenido Efímero</h2>
              </div>
              
              <p className="text-text-secondary font-medium mb-8 text-lg leading-relaxed max-w-3xl">
                Las historias son para compartir el momento. Nos aseguramos de que sean realmente temporales y seguras para ti:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-bg-primary/80 backdrop-blur-md p-6 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 shadow-sm transition-all hover:-translate-y-1">
                    <div className="flex items-center gap-2 mb-3 text-accent font-extrabold tracking-tight text-lg">
                        <Clock size={20} strokeWidth={2.5} /> Duración 24h
                    </div>
                    <p className="text-sm font-medium text-text-secondary leading-relaxed">
                        Todo lo que subas se <strong>autodestruye</strong> de nuestros servidores tras 24 horas. Sin copias ocultas.
                    </p>
                </div>
                
                <div className="bg-bg-primary/80 backdrop-blur-md p-6 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 shadow-sm transition-all hover:-translate-y-1">
                    <div className="flex items-center gap-2 mb-3 text-accent font-extrabold tracking-tight text-lg">
                        <Users size={20} strokeWidth={2.5} /> Tú Decides
                    </div>
                    <p className="text-sm font-medium text-text-secondary leading-relaxed">
                        Elige antes de publicar: <strong>"Público"</strong> para motivar a todos o <strong>"Solo Amigos"</strong> para tu círculo cercano.
                    </p>
                </div>
                
                <div className="bg-bg-primary/80 backdrop-blur-md p-6 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 shadow-sm transition-all hover:-translate-y-1">
                    <div className="flex items-center gap-2 mb-3 text-accent font-extrabold tracking-tight text-lg">
                        <HeartHandshake size={20} strokeWidth={2.5} /> Respeto
                    </div>
                    <p className="text-sm font-medium text-text-secondary leading-relaxed">
                        Mantén la comunidad segura. No subas contenido ofensivo o ilegal. Cuidémonos entre todos.
                    </p>
                </div>
              </div>
            </PolicyCard>

            {/* --- TARJETA: GPS y Cardio --- */}
            <PolicyCard>
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-accent/10 text-accent rounded-[16px] ring-1 ring-accent/30 shadow-sm">
                  <MapPin size={24} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">Ubicación GPS</h2>
              </div>
              <p className="text-text-secondary font-medium text-sm leading-relaxed mb-4">
                Solo usamos tu ubicación cuando activas el modo <strong>"Cardio"</strong> para registrar tu ruta, velocidad y distancia con precisión.
              </p>
              <ul className="text-sm font-medium text-text-secondary space-y-3 list-none">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span>El GPS se apaga automáticamente al terminar el ejercicio.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span>El mapa de tu recorrido se guarda de forma <strong>privada</strong> en tu historial.</span>
                </li>
              </ul>
            </PolicyCard>

            {/* --- TARJETA: Almacenamiento Local --- */}
            <PolicyCard>
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-accent/10 text-accent rounded-[16px] ring-1 ring-accent/30 shadow-sm">
                  <Cookie size={24} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">Tus Preferencias</h2>
              </div>
              <p className="text-text-secondary font-medium text-sm leading-relaxed mb-4">
                Usamos la memoria de tu dispositivo para recordar cosas simples y mejorar tu experiencia, sin rastreo publicitario.
              </p>
              <ul className="text-sm font-medium text-text-secondary space-y-3 list-none">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span><strong>Personalización:</strong> Tu tema (Oscuro/Claro) y colores favoritos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span><strong>Sesión Activa:</strong> Para que no tengas que escribir tu contraseña cada vez que entras.</span>
                </li>
              </ul>
            </PolicyCard>

            {/* --- TARJETA: Google Auth --- */}
            <PolicyCard>
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-accent/10 text-accent rounded-[16px] ring-1 ring-accent/30 shadow-sm">
                  <Globe size={24} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">Acceso con Google</h2>
              </div>
              <p className="text-text-secondary font-medium text-sm leading-relaxed mb-4">
                Si usas Google para entrar, utilizamos su sistema seguro. Nosotros <strong>nunca</strong> vemos ni guardamos tu contraseña de Google.
              </p>
              <ul className="text-sm font-medium text-text-secondary space-y-3 list-none">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span>Solo recibimos tu nombre, email y foto para crear tu perfil.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span>La seguridad depende directamente de los estándares de Google.</span>
                </li>
              </ul>
            </PolicyCard>

            {/* --- TARJETA: Notificaciones --- */}
            <PolicyCard>
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-accent/10 text-accent rounded-[16px] ring-1 ring-accent/30 shadow-sm">
                  <Bell size={24} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">Notificaciones</h2>
              </div>
              <p className="text-text-secondary font-medium text-sm leading-relaxed mb-5">
                Solo te avisaremos para ayudarte a cumplir tus metas. Puedes desactivarlas cuando quieras desde los ajustes.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-[10px] text-text-secondary ring-1 ring-black/5 dark:ring-white/10 shadow-sm">Recordatorios</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-[10px] text-text-secondary ring-1 ring-black/5 dark:ring-white/10 shadow-sm">Temporizador</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-[10px] text-text-secondary ring-1 ring-black/5 dark:ring-white/10 shadow-sm">Logros</span>
              </div>
            </PolicyCard>

            {/* --- TARJETA: Cámara --- */}
            <PolicyCard>
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-accent/10 text-accent rounded-[16px] ring-1 ring-accent/30 shadow-sm">
                  <Camera size={24} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">Cámara y Fotos</h2>
              </div>
              <p className="text-text-secondary font-medium text-sm leading-relaxed">
                Necesitamos la cámara para escanear alimentos o subir fotos de progreso. Las fotos que subes a tu diario son privadas y se guardan de forma segura solo para ti.
              </p>
            </PolicyCard>

            {/* --- TARJETA: Eliminación (Full Width) --- */}
            <div className="md:col-span-2">
                <PolicyCard>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-red/10 text-red rounded-[16px] ring-1 ring-red/30 shadow-sm shrink-0">
                        <Trash2 size={24} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">Eliminación de Cuenta y Datos</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                        <div className="bg-bg-primary/50 p-6 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 shadow-sm flex flex-col h-full">
                            <h3 className="font-extrabold text-text-primary mb-3 text-lg">Opción 1: Desde la App (Instantáneo)</h3>
                            <p className="text-text-secondary font-medium text-sm mb-4 leading-relaxed">
                                Si tienes la aplicación instalada, sigue estos pasos para borrar tu cuenta y todos tus datos (historial, fotos, perfil) de forma inmediata e irreversible:
                            </p>
                            <ol className="list-decimal list-inside text-sm font-bold text-text-secondary space-y-2.5 ml-2 marker:text-accent mt-auto">
                                <li>Abre <strong className="text-text-primary">Pro Fitness Glass</strong> y ve a tu Perfil.</li>
                                <li>Toca el botón de <strong className="text-text-primary">Ajustes</strong> o Editar Perfil.</li>
                                <li>Baja hasta el final y selecciona <strong className="text-red">"Eliminar Cuenta"</strong>.</li>
                                <li>Confirma la acción introduciendo tu contraseña.</li>
                            </ol>
                        </div>

                        <div className="bg-bg-primary/50 p-6 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 shadow-sm flex flex-col h-full">
                            <h3 className="font-extrabold text-text-primary mb-3 text-lg">Opción 2: Solicitud Web (Sin acceso)</h3>
                            <p className="text-text-secondary font-medium text-sm mb-4 leading-relaxed">
                                Si ya no tienes la aplicación o no puedes acceder, puedes solicitar la eliminación manual de tus datos:
                            </p>
                            <ul className="text-sm font-bold text-text-secondary space-y-2.5 ml-2 list-none mb-4">
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                                    <span>Envía un correo a <a href="mailto:profitnessglass@gmail.com" className="text-accent hover:underline">profitnessglass@gmail.com</a></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                                    <span>Asunto: <strong className="text-text-primary">"Solicitud de Eliminación de Datos"</strong></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                                    <span>Incluye tu nombre de usuario o el email con el que te registraste.</span>
                                </li>
                            </ul>
                            <p className="text-[11px] font-medium text-text-tertiary mt-auto p-3 bg-black/5 dark:bg-white/5 rounded-[12px] leading-relaxed">
                                Procesaremos tu solicitud y eliminaremos todos tus datos en un plazo máximo de 30 días, confirmándote por correo cuando se haya completado.
                            </p>
                        </div>
                    </div>
                </PolicyCard>
            </div>

            {/* --- TARJETA: Legal --- */}
            <PolicyCard>
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-accent/10 text-accent rounded-[16px] ring-1 ring-accent/30 shadow-sm">
                  <Shield size={24} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">Responsabilidad</h2>
              </div>
              <p className="text-text-secondary font-medium text-sm leading-relaxed">
                <strong>Pro Fitness Glass</strong> es una herramienta para ayudarte, pero no sustituye a un médico. Úsala con responsabilidad y consulta a un profesional antes de realizar cambios drásticos en tu salud o alimentación.
              </p>
            </PolicyCard>

            {/* --- TARJETA: Contacto --- */}
            <div className="bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[32px] p-8 flex flex-col justify-center items-center text-center hover:ring-accent/30 hover:shadow-lg transition-all duration-300 backdrop-blur-xl">
              <div className="p-4 bg-accent/10 text-accent rounded-[20px] mb-5 ring-1 ring-accent/30 shadow-sm">
                <Mail size={32} strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-extrabold text-text-primary mb-2 tracking-tight">¿Tienes dudas?</h2>
              <p className="text-sm font-medium text-text-secondary mb-6 max-w-sm">Estamos aquí para ayudarte en lo que necesites. Escríbenos en cualquier momento.</p>
              <a href="mailto:profitnessglass@gmail.com" className="px-6 py-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 rounded-full text-accent font-extrabold text-lg sm:text-xl shadow-sm hover:scale-105 active:scale-95 transition-all">
                profitnessglass@gmail.com
              </a>
            </div>

        </div>
        
        <div className="mt-16 mb-8 text-center">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-text-tertiary opacity-60">
                Última actualización: {currentDate}
            </p>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;