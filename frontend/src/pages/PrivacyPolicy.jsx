/* frontend/src/pages/PrivacyPolicy.jsx */
import React from 'react';
// --- INICIO DE LA MODIFICACIÓN ---
// Se añade el icono 'Shield'
import { ChevronLeft, Cookie, Palette, Moon, Sun, Camera, Shield } from 'lucide-react';
// --- FIN DE LA MODIFICACIÓN ---
import GlassCard from '../components/GlassCard';

const PrivacyPolicy = ({ onBack }) => {
  return (
    // Se añade un z-index alto (z-[110]) para que esta vista se muestre
    // siempre por encima del banner de cookies (que tiene z-[100]).
    <div className="fixed inset-0 z-[110] bg-bg-primary overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
        <button onClick={onBack} className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4">
          <ChevronLeft size={20} />
          Volver
        </button>
        {/* --- INICIO DE LA MODIFICACIÓN --- */}
        <h1 className="text-3xl md:text-4xl font-extrabold mb-8">Política de Privacidad y Avisos Legales</h1>
        {/* --- FIN DE LA MODIFICACIÓN --- */}

        <GlassCard className="p-6 md:p-8">
          <div className="space-y-8 text-text-secondary">
            <p className="text-lg">
              En FitTrack-Pro, tu privacidad es fundamental. A continuación, te explicamos de forma clara y sencilla qué información guardamos y por qué.
            </p>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                <Cookie className="text-accent" />
                Almacenamiento Local (Preferencias)
              </h2>
              <p>
                Esta aplicación utiliza el <strong>Almacenamiento Local</strong> (<code>localStorage</code>) de tu navegador, una tecnología similar a las cookies, para guardar exclusivamente tus <strong>preferencias de personalización visual</strong>.
              </p>
              <p>Los datos específicos que almacenamos son:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Tema de la aplicación:</strong> Si prefieres el modo claro <Sun size={16} className="inline-block mx-1" />, oscuro <Moon size={16} className="inline-block mx-1" />, o el tema del sistema.
                </li>
                <li>
                  <strong>Color de acento:</strong> El color que eliges para los botones y elementos destacados <Palette size={16} className="inline-block mx-1" />.
                </li>
              </ul>
              <p className="font-semibold text-text-primary pt-2">
                No utilizamos cookies ni almacenamiento local para rastrearte, mostrar publicidad ni compartir tus datos con terceros.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary">¿Qué pasa si no aceptas (Cookies)?</h2>
              <p>
                Si decides no aceptar el uso del almacenamiento local, no guardaremos ninguna preferencia de personalización en tu dispositivo. La aplicación seguirá siendo <strong>100% funcional</strong>, pero volverá a la apariencia por defecto cada vez que inicies una nueva sesión.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                <Camera className="text-accent" />
                Permiso de la Cámara (Escáner)
              </h2>
              <p>
                Al usar la función de escaneo de códigos de barras, la aplicación te pedirá permiso para acceder a tu cámara. Este permiso se gestiona directamente a través de tu navegador y es necesario únicamente para esa función. <strong>Las imágenes de la cámara se procesan en tu dispositivo y no se almacenan ni se envían a nuestros servidores.</strong>
              </p>
            </div>

            {/* --- INICIO DE LA MODIFICACIÓN --- */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                <Camera className="text-accent" />
                Fotos de Comidas
              </h2>
              <p>
                La aplicación te permite subir fotos de tus comidas para llevar un registro visual en tu diario de nutrición.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Almacenamiento:</strong> Estas imágenes se suben y almacenan de forma segura en nuestros servidores.
                </li>
                <li>
                  <strong>Privacidad:</strong> Las fotos son privadas y están asociadas únicamente a tu cuenta. Se utilizan solo para que puedas consultarlas en tu historial personal. No se comparten con terceros ni se usan para ningún otro propósito.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                <Shield className="text-accent" />
                Avisos Legales
              </h2>
              <p>
                FitTrack-Pro es una herramienta de seguimiento y consulta diseñada para fines informativos y educativos.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Sin Asesoramiento Médico:</strong> La información y los datos proporcionados por la aplicación no constituyen asesoramiento médico, diagnóstico ni tratamiento. Consulta siempre a un profesional de la salud cualificado antes de tomar decisiones sobre tu dieta o rutina de ejercicios.
                </li>
                <li>
                  <strong>Uso Bajo Tu Responsabilidad:</strong> El uso de esta aplicación es bajo tu entera responsabilidad. El desarrollador no se hace responsable de ninguna lesión, problema de salud o resultado adverso derivado del uso de la información contenida en la aplicación.
                </li>
              </ul>
            </div>
            {/* --- FIN DE LA MODIFICACIÓN --- */}

          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default PrivacyPolicy;