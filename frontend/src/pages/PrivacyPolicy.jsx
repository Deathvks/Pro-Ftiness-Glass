import React from 'react';
import { ChevronLeft, Cookie, Palette, Moon, Sun, Camera } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const PrivacyPolicy = ({ onBack }) => {
  return (
    // --- INICIO DE LA MODIFICACIÓN ---
    // Se añade un z-index alto (z-[110]) para que esta vista se muestre
    // siempre por encima del banner de cookies (que tiene z-[100]).
    <div className="fixed inset-0 z-[110] bg-bg-primary overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
        <button onClick={onBack} className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4">
          <ChevronLeft size={20} />
          Volver
        </button>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-8">Política de Cookies y Almacenamiento Local</h1>

        <GlassCard className="p-6 md:p-8">
          <div className="space-y-8 text-text-secondary">
            <p className="text-lg">
              En FitTrack-Pro, tu privacidad es fundamental. A continuación, te explicamos de forma clara y sencilla qué información guardamos en tu dispositivo y por qué.
            </p>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                <Cookie className="text-accent" />
                ¿Qué guardamos?
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
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary">¿Por qué lo guardamos?</h2>
              <p>
                Guardamos estas preferencias con un único objetivo: <strong>mejorar tu experiencia de usuario</strong>. Al hacerlo, la aplicación recordará tu configuración visual cada vez que inicies sesión, para que no tengas que volver a configurarla.
              </p>
              <p className="font-semibold text-text-primary">
                No utilizamos cookies ni almacenamiento local para rastrearte, mostrar publicidad ni compartir tus datos con terceros.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary">¿Qué pasa si no aceptas?</h2>
              <p>
                Si decides no aceptar, no guardaremos ninguna preferencia de personalización en tu dispositivo. La aplicación seguirá siendo <strong>100% funcional</strong>, pero volverá a la apariencia por defecto cada vez que inicies una nueva sesión.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                <Camera className="text-accent" />
                Permiso de la Cámara
              </h2>
              <p>
                Al usar la función de escaneo de códigos de barras, la aplicación te pedirá permiso para acceder a tu cámara. Este permiso se gestiona directamente a través de tu navegador y es necesario únicamente para esa función. <strong>Las imágenes de la cámara se procesan en tu dispositivo y no se almacenan ni se envían a nuestros servidores.</strong>
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
    // --- FIN DE LA MODIFICACIÓN ---
  );
};

export default PrivacyPolicy;