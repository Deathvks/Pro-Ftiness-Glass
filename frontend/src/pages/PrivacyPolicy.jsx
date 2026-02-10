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
        rounded-3xl p-6 transition-colors
        ${highlight 
          ? 'bg-accent/10 dark:bg-accent/10' // Destacado (Historias)
          : 'bg-gray-100 dark:bg-white/5'    // Normal (Claro: Gris suave / Oscuro: Transparencia)
        }
        
        /* Estilos específicos OLED (clase global .oled-theme) */
        [.oled-theme_&]:bg-black 
        [.oled-theme_&]:border 
        [.oled-theme_&]:border-white/10
        
        ${className}
      `}>
        {children}
      </div>
    );
  };

  return (
    // z-[110] para estar por encima de todo
    <div className="fixed inset-0 z-[110] bg-bg-primary overflow-y-auto custom-scrollbar">
      {/* SEO Head: Página pública e importante para Google */}
      <SEOHead 
        title="Política de Privacidad y Eliminación de Datos - Pro Fitness Glass" 
        description="Conoce cómo protegemos tus datos y los pasos para solicitar la eliminación de tu cuenta."
        route="politica-privacidad" 
      />

      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
        
        {/* Botón Volver */}
        <button 
          onClick={handleBack} 
          className="group flex items-center gap-2 text-text-secondary font-bold hover:text-accent transition-all mb-6 px-2 outline-none focus:outline-none"
        >
          <div className="p-1.5 rounded-full bg-gray-200 dark:bg-white/5 group-hover:bg-accent/20 transition-colors">
            <ChevronLeft size={20} />
          </div>
          <span>Volver</span>
        </button>
        
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-text-primary via-accent to-text-primary mb-4">
            Tu Privacidad Importa
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            En <strong>Pro Fitness Glass</strong>, queremos que te sientas como en casa. Aquí te explicamos de forma sencilla y transparente cómo cuidamos tus datos y cómo puedes ejercer tus derechos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* --- SECCIÓN DESTACADA: Historias --- */}
            <PolicyCard className="md:col-span-2" highlight={true}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-accent text-white rounded-2xl shadow-lg shadow-accent/30">
                  <Clock size={28} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-bold text-text-primary">Historias y Contenido Efímero</h2>
              </div>
              
              <p className="text-text-secondary mb-6 text-lg leading-relaxed">
                Las historias son para compartir el momento. Nos aseguramos de que sean realmente temporales y seguras para ti:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-bg-primary/50 p-4 rounded-2xl border border-transparent dark:border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-accent font-bold">
                        <Clock size={18} /> Duración 24h
                    </div>
                    <p className="text-sm text-text-secondary">
                        Todo lo que subas se <strong>autodestruye</strong> de nuestros servidores tras 24 horas. Sin copias ocultas.
                    </p>
                </div>
                <div className="bg-bg-primary/50 p-4 rounded-2xl border border-transparent dark:border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-accent font-bold">
                        <Users size={18} /> Tú Decides
                    </div>
                    <p className="text-sm text-text-secondary">
                        Elige antes de publicar: <strong>"Público"</strong> para motivar a todos o <strong>"Solo Amigos"</strong> para tu círculo cercano.
                    </p>
                </div>
                <div className="bg-bg-primary/50 p-4 rounded-2xl border border-transparent dark:border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-accent font-bold">
                        <HeartHandshake size={18} /> Respeto
                    </div>
                    <p className="text-sm text-text-secondary">
                        Mantén la comunidad segura. No subas contenido ofensivo o ilegal. Cuidémonos entre todos.
                    </p>
                </div>
              </div>
            </PolicyCard>

            {/* --- TARJETA: GPS y Cardio --- */}
            <PolicyCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-accent/20 text-accent rounded-xl">
                  <MapPin size={24} />
                </div>
                <h2 className="text-xl font-bold text-text-primary">Ubicación GPS</h2>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-3">
                Solo usamos tu ubicación cuando activas el modo <strong>"Cardio"</strong> para registrar tu ruta, velocidad y distancia con precisión.
              </p>
              <ul className="text-sm text-text-secondary space-y-2 list-disc list-inside marker:text-accent">
                <li>El GPS se apaga automáticamente al terminar el ejercicio.</li>
                <li>El mapa de tu recorrido se guarda de forma <strong>privada</strong> en tu historial.</li>
              </ul>
            </PolicyCard>

            {/* --- TARJETA: Almacenamiento Local --- */}
            <PolicyCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-accent/20 text-accent rounded-xl">
                  <Cookie size={24} />
                </div>
                <h2 className="text-xl font-bold text-text-primary">Tus Preferencias</h2>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-3">
                Usamos la memoria de tu dispositivo para recordar cosas simples y mejorar tu experiencia, sin rastreo publicitario.
              </p>
              <ul className="text-sm text-text-secondary space-y-2 list-disc list-inside marker:text-accent">
                <li><strong>Personalización:</strong> Tu tema (Oscuro/Claro) y colores favoritos.</li>
                <li><strong>Sesión Activa:</strong> Para que no tengas que escribir tu contraseña cada vez que entras.</li>
              </ul>
            </PolicyCard>

            {/* --- TARJETA: Google Auth --- */}
            <PolicyCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-accent/20 text-accent rounded-xl">
                  <Globe size={24} />
                </div>
                <h2 className="text-xl font-bold text-text-primary">Acceso con Google</h2>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-3">
                Si usas Google para entrar, utilizamos su sistema seguro. Nosotros <strong>nunca</strong> vemos ni guardamos tu contraseña de Google.
              </p>
              <ul className="text-sm text-text-secondary space-y-2 list-disc list-inside marker:text-accent">
                <li>Solo recibimos tu nombre, email y foto para crear tu perfil.</li>
                <li>La seguridad depende directamente de los estándares de Google.</li>
              </ul>
            </PolicyCard>

            {/* --- TARJETA: Notificaciones --- */}
            <PolicyCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-accent/20 text-accent rounded-xl">
                  <Bell size={24} />
                </div>
                <h2 className="text-xl font-bold text-text-primary">Notificaciones</h2>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-3">
                Solo te avisaremos para ayudarte a cumplir tus metas. Puedes desactivarlas cuando quieras.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-bg-primary px-2 py-1 rounded-md text-text-tertiary border border-transparent dark:border-white/5">Recordatorios</span>
                <span className="text-xs bg-bg-primary px-2 py-1 rounded-md text-text-tertiary border border-transparent dark:border-white/5">Temporizador</span>
                <span className="text-xs bg-bg-primary px-2 py-1 rounded-md text-text-tertiary border border-transparent dark:border-white/5">Logros</span>
              </div>
            </PolicyCard>

            {/* --- TARJETA: Cámara --- */}
            <PolicyCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-accent/20 text-accent rounded-xl">
                  <Camera size={24} />
                </div>
                <h2 className="text-xl font-bold text-text-primary">Cámara y Fotos</h2>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                Necesitamos la cámara para escanear alimentos o subir fotos de progreso. Las fotos que subes a tu diario son privadas y se guardan de forma segura solo para ti.
              </p>
            </PolicyCard>

            {/* --- TARJETA: Eliminación (Full Width) --- */}
            <div className="md:col-span-2">
                <PolicyCard>
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-accent/20 text-accent rounded-xl">
                                <Trash2 size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-text-primary">Eliminación de Cuenta y Datos</h2>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-text-primary mb-2">Opción 1: Desde la App (Instantáneo)</h3>
                                    <p className="text-text-secondary text-sm mb-2">
                                        Si tienes la aplicación instalada, sigue estos pasos para borrar tu cuenta y todos tus datos (historial, fotos, perfil) de forma inmediata e irreversible:
                                    </p>
                                    <ol className="list-decimal list-inside text-sm text-text-secondary space-y-1 ml-2">
                                        <li>Abre <strong>Pro Fitness Glass</strong> y ve a tu <strong>Perfil</strong>.</li>
                                        <li>Toca el botón de <strong>Ajustes (⚙️)</strong> o <strong>Editar Perfil</strong>.</li>
                                        <li>Baja hasta el final y selecciona <strong>"Eliminar Cuenta"</strong>.</li>
                                        <li>Confirma la acción.</li>
                                    </ol>
                                </div>

                                <div className="border-t border-gray-200 dark:border-white/10 pt-4">
                                    <h3 className="font-bold text-text-primary mb-2">Opción 2: Solicitud Web (Sin acceso a la App)</h3>
                                    <p className="text-text-secondary text-sm mb-2">
                                        Si ya no tienes la aplicación o no puedes acceder, puedes solicitar la eliminación manual de tus datos:
                                    </p>
                                    <ul className="text-sm text-text-secondary space-y-2 ml-2">
                                        <li>
                                            Envía un correo a <a href="mailto:profitnessglass@gmail.com" className="text-accent hover:underline font-bold">profitnessglass@gmail.com</a>
                                        </li>
                                        <li>Asunto: <strong>"Solicitud de Eliminación de Datos"</strong></li>
                                        <li>Incluye tu nombre de usuario o el email con el que te registraste.</li>
                                    </ul>
                                    <p className="text-xs text-text-tertiary mt-2 italic">
                                        Procesaremos tu solicitud y eliminaremos todos tus datos en un plazo máximo de 30 días, confirmándote por correo cuando se haya completado.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </PolicyCard>
            </div>

            {/* --- TARJETA: Legal --- */}
            <PolicyCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-accent/20 text-accent rounded-xl">
                  <Shield size={24} />
                </div>
                <h2 className="text-xl font-bold text-text-primary">Responsabilidad</h2>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                <strong>Pro Fitness Glass</strong> es una herramienta para ayudarte, pero no sustituye a un médico. Úsala con responsabilidad y consulta a un profesional antes de cambios drásticos en tu salud.
              </p>
            </PolicyCard>

            {/* --- TARJETA: Contacto --- */}
            <div className="bg-gradient-to-br from-bg-secondary to-bg-primary border border-white/5 rounded-3xl p-6 flex flex-col justify-center items-center text-center hover:border-accent/30 transition-colors [.oled-theme_&]:bg-black [.oled-theme_&]:border-white/10">
              <div className="p-3 bg-accent/20 text-accent rounded-full mb-3">
                <Mail size={24} />
              </div>
              <h2 className="text-lg font-bold text-text-primary mb-1">¿Tienes dudas?</h2>
              <p className="text-xs text-text-secondary mb-3">Estamos aquí para ayudarte en lo que necesites.</p>
              <a href="mailto:profitnessglass@gmail.com" className="text-accent font-bold text-lg hover:underline">
                profitnessglass@gmail.com
              </a>
            </div>

        </div>
        
        <div className="mt-10 text-center">
            <p className="text-xs text-text-tertiary opacity-50">
                Última actualización: {currentDate}
            </p>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;