/* frontend/src/pages/PrivacyPolicy.jsx */
import React from 'react';
import { ChevronLeft, Cookie, Palette, Moon, Sun, Camera, Shield, Bell, Globe, Trash2, Mail } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const PrivacyPolicy = ({ onBack }) => {
  return (
    // z-[110] para estar por encima de todo, incluido el banner de cookies (z-[100])
    <div className="fixed inset-0 z-[110] bg-bg-primary overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
        <button onClick={onBack} className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4">
          <ChevronLeft size={20} />
          Volver
        </button>
        
        <h1 className="text-3xl md:text-4xl font-extrabold mb-8">Política de Privacidad y Avisos Legales</h1>

        <GlassCard className="p-6 md:p-8">
          <div className="space-y-8 text-text-secondary">
            <p className="text-lg">
              En <strong>Pro Fitness Glass</strong>, la transparencia es nuestra prioridad. Aquí detallamos cómo funcionan nuestros servicios, qué datos procesamos y con qué finalidad.
            </p>

            {/* --- SECCIÓN: Almacenamiento Local --- */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                <Cookie className="text-accent" />
                Almacenamiento Local y Preferencias
              </h2>
              <p>
                Usamos el <strong>Almacenamiento Local</strong> de tu dispositivo para mejorar tu experiencia. No usamos cookies de rastreo publicitario.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Personalización:</strong> Guardamos tu elección de tema (Claro/Oscuro) y color de acento.</li>
                <li><strong>Sesión:</strong> Almacenamos un "token" de seguridad cifrado para mantener tu sesión activa sin que tengas que ingresar tu contraseña cada vez.</li>
              </ul>
            </div>

            {/* --- SECCIÓN: Google Auth --- */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                <Globe className="text-accent" />
                Autenticación con Google
              </h2>
              <p>
                Si decides iniciar sesión o registrarte utilizando tu cuenta de Google, utilizamos el servicio seguro de Google Identity.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Datos Recibidos:</strong> Solo recibimos tu nombre, dirección de correo electrónico y foto de perfil para crear tu usuario en nuestra plataforma.
                </li>
                <li>
                  <strong>Seguridad:</strong> Nunca tenemos acceso a tu contraseña de Google. La autenticación se realiza directamente en los servidores de Google.
                </li>
              </ul>
            </div>

            {/* --- SECCIÓN: Notificaciones --- */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                <Bell className="text-accent" />
                Notificaciones Push
              </h2>
              <p>
                Solicitamos permiso para enviarte notificaciones push con fines exclusivamente funcionales y motivacionales:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Recordatorios de entrenamiento programados.</li>
                <li>Avisos de finalización del temporizador de descanso.</li>
                <li>Logros y récords personales alcanzados.</li>
              </ul>
              <p>
                Puedes revocar este permiso en cualquier momento desde los ajustes de tu dispositivo.
              </p>
            </div>

            {/* --- SECCIÓN: Cámara y Fotos --- */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                <Camera className="text-accent" />
                Cámara y Fotos de Comidas
              </h2>
              <p>
                Necesitamos acceso a la cámara si deseas escanear códigos de barras de productos o subir fotos a tu diario de nutrición.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Escáner:</strong> El procesamiento del código de barras se realiza en tu dispositivo.</li>
                <li><strong>Fotos de Comidas:</strong> Las imágenes que subes se almacenan de forma privada y segura en nuestros servidores, asociadas únicamente a tu cuenta.</li>
              </ul>
            </div>

            {/* --- SECCIÓN: Eliminación de Datos (MODIFICADO) --- */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                <Trash2 className="text-accent" />
                Eliminación de Datos
              </h2>
              <p>
                Tienes el control total sobre tu información. Puedes <strong>eliminar tu cuenta y todos tus datos asociados</strong> (historial, perfil, fotos) en cualquier momento directamente desde la sección <strong>Perfil</strong> de la aplicación. Esta acción es irreversible.
              </p>
            </div>

            {/* --- SECCIÓN: Legal --- */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                <Shield className="text-accent" />
                Descargo de Responsabilidad
              </h2>
              <p>
                <strong>Pro Fitness Glass</strong> es una herramienta informativa.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Salud:</strong> No sustituye el consejo médico profesional. Consulta a un especialista antes de iniciar dietas o ejercicios intensos.
                </li>
                <li>
                  <strong>Responsabilidad:</strong> El uso de la aplicación es bajo tu propia responsabilidad.
                </li>
              </ul>
            </div>

            {/* --- SECCIÓN: Contacto (MODIFICADO) --- */}
            <div className="space-y-3 mt-6 p-4 border border-glass-border rounded-lg bg-bg-secondary/50">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Mail className="text-accent" size={20} />
                Contacto y Soporte
              </h2>
              <p>
                Si tienes preguntas adicionales sobre nuestra política de privacidad o necesitas asistencia, no dudes en contactarnos en:
              </p>
              <p className="font-semibold text-accent mt-2">
                profitnessglass@gmail.com
              </p>
            </div>

          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default PrivacyPolicy;