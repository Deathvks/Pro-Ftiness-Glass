/* frontend/src/pages/MaintenanceInfoPage.jsx */
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  FaArrowLeft, 
  FaWrench, 
  FaShieldHalved, 
  FaServer, 
  FaGlobe, 
  FaClock, 
  FaCircleCheck, 
  FaBolt, 
  FaCircleQuestion,
  FaLock
} from 'react-icons/fa6';
import PublicPageFooter from '../components/PublicPageFooter';
import useAppStore from '../store/useAppStore';

export default function MaintenanceInfoPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(isAuthenticated ? '/dashboard' : '/');
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Aviso de Mantenimiento y Migración a Servidores Propios — Pro Fitness Glass',
    description: 'Información oficial sobre el mantenimiento programado del sábado 7: traslado seguro a servidores propios dedicados y nuevo dominio oficial profitnessglass.com.',
    url: 'https://profitnessglass.es/mantenimiento',
    inLanguage: 'es'
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary text-text-primary overflow-y-auto overflow-x-hidden custom-scrollbar selection:bg-amber-500/30">
      <Helmet>
        <title>Mantenimiento Programado y Nueva Infraestructura — Pro Fitness Glass</title>
        <meta
          name="description"
          content="Información oficial sobre el mantenimiento programado del sábado 7: migración segura a servidores propios dedicados y nuevo dominio oficial profitnessglass.com. Todos tus datos están seguros."
        />
        <link rel="canonical" href="https://profitnessglass.es/mantenimiento" />
        <meta property="og:title" content="Mantenimiento Programado y Nueva Infraestructura — Pro Fitness Glass" />
        <meta
          property="og:description"
          content="Migración a servidores propios y nuevo dominio profitnessglass.com. Tus datos y rutinas están 100% seguros y protegidos."
        />
        <meta property="og:url" content="https://profitnessglass.es/mantenimiento" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://profitnessglass.es/aver.jpg" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div 
        className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-[calc(var(--safe-bottom,env(safe-area-inset-bottom,0px))+4rem)]" 
        style={{ paddingTop: 'calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 1.5rem)' }}
      >
        {/* Barra superior de navegación */}
        <nav aria-label="Navegación principal de la página" className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 rounded-full text-text-secondary font-bold hover:text-text-primary transition-all active:scale-95 text-sm"
          >
            <FaArrowLeft size={14} />
            <span>Volver</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
            <Link 
              to="/faq" 
              className="px-3.5 py-1.5 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center gap-1.5"
            >
              <FaCircleQuestion size={14} />
              <span>Preguntas Frecuentes</span>
            </Link>
          </div>
        </nav>

        {/* Cabecera / Hero de presentación */}
        <header className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <FaWrench size={13} />
            <span>Aviso Oficial · Mantenimiento Programado</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-text-primary tracking-tight leading-tight mb-5">
            Evolucionamos a Servidores Propios<br className="hidden sm:inline" /> y Nuevo Dominio Oficial
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-text-secondary leading-relaxed">
            Una actualización planificada para ofrecer mayor velocidad, máxima estabilidad e independencia tecnológica definitiva para <strong>Pro Fitness Glass</strong>.
          </p>
        </header>

        {/* Tarjeta Destacada: Horario y Duración */}
        <div className="mb-10 p-5 sm:p-7 rounded-3xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FaClock size={28} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-text-primary mb-1">
              Fecha de Inicio: Sábado 7
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              La plataforma estará fuera de servicio durante una ventana estimada de <strong>24 a 48 horas</strong> mientras se efectúa la migración completa de los sistemas y la propagación de los nuevos servidores.
            </p>
          </div>
        </div>

        {/* Tarjeta de Seguridad Máxima: Tus datos están 100% a salvo */}
        <section 
          aria-labelledby="seguridad-datos-title"
          className="mb-10 p-6 sm:p-8 rounded-3xl bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/30 backdrop-blur-xl shadow-xl relative overflow-hidden"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-1">
              <FaShieldHalved size={24} />
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                Tranquilidad Absoluta
              </span>
              <h2 id="seguridad-datos-title" className="text-xl sm:text-2xl font-black text-text-primary mb-3">
                Tus datos están 100% seguros y protegidos
              </h2>
              <p className="text-text-secondary text-sm sm:text-base leading-relaxed mb-4">
                Queremos darte total tranquilidad: <strong>ningún dato se perderá ni estará en peligro</strong>. Antes de iniciar la desconexión, se realiza una copia de seguridad integral y cifrada de toda la base de datos.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-text-secondary">
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border">
                  <FaCircleCheck className="text-emerald-500 shrink-0" size={16} />
                  <span>Rutinas, cargas y repeticiones intactas</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border">
                  <FaCircleCheck className="text-emerald-500 shrink-0" size={16} />
                  <span>Historial completo y marcas personales (PR)</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border">
                  <FaCircleCheck className="text-emerald-500 shrink-0" size={16} />
                  <span>Tus mismas credenciales de inicio de sesión</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border">
                  <FaCircleCheck className="text-emerald-500 shrink-0" size={16} />
                  <span>No tendrás que volver a registrarte</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: ¿Por qué este cambio? */}
        <section aria-labelledby="motivo-title" className="mb-10 p-6 sm:p-8 rounded-3xl bg-bg-secondary/40 border border-glass-border backdrop-blur-xl shadow-lg">
          <h2 id="motivo-title" className="text-xl sm:text-2xl font-black text-text-primary mb-4 flex items-center gap-3">
            <FaServer className="text-sky-400" size={22} />
            <span>¿Por qué realizamos esta migración?</span>
          </h2>
          <div className="space-y-4 text-text-secondary text-sm sm:text-base leading-relaxed">
            <p>
              El proveedor externo de servidores donde actualmente se aloja parte de nuestra plataforma cesará sus operaciones. Ante este escenario, en lugar de trasladarnos a otra solución compartida temporal, decidimos dar el paso definitivo hacia la excelencia técnica: <strong>migrar toda la arquitectura a servidores propios y dedicados</strong>, configurados exclusivamente por y para Pro Fitness Glass.
            </p>
            <p>
              Aprovechando esta intervención técnica, completamos la transición hacia nuestro dominio oficial definitivo: <strong className="text-accent">profitnessglass.com</strong>, una dirección más directa, profesional y fácil de recordar para toda nuestra comunidad de atletas.
            </p>
          </div>
        </section>

        {/* Tarjetas de Beneficios */}
        <section aria-labelledby="beneficios-title" className="mb-10">
          <h2 id="beneficios-title" className="text-xl sm:text-2xl font-black text-text-primary mb-6 text-center">
            Lo que ganarás tras la actualización
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-bg-secondary/40 border border-glass-border backdrop-blur-xl shadow-sm text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-3.5 mx-auto sm:mx-0">
                <FaBolt size={18} />
              </div>
              <h3 className="font-extrabold text-text-primary text-base mb-1.5">Mayor Velocidad</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Menores tiempos de respuesta al registrar series, consultar vídeos de técnica y sincronizar tus entrenamientos en tiempo real.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-bg-secondary/40 border border-glass-border backdrop-blur-xl shadow-sm text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-3.5 mx-auto sm:mx-0">
                <FaGlobe size={18} />
              </div>
              <h3 className="font-extrabold text-text-primary text-base mb-1.5">Dominio Oficial</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Unificación bajo <code className="text-accent font-bold">profitnessglass.com</code>, consolidando la presencia oficial de la app.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-bg-secondary/40 border border-glass-border backdrop-blur-xl shadow-sm text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3.5 mx-auto sm:mx-0">
                <FaLock size={18} />
              </div>
              <h3 className="font-extrabold text-text-primary text-base mb-1.5">Independencia Total</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Control absoluto de nuestra infraestructura sin depender de intermediarios de hosting compartido.
              </p>
            </div>
          </div>
        </section>

        {/* Preguntas Rápidas */}
        <section aria-labelledby="faq-rapida-title" className="mb-12 p-6 sm:p-8 rounded-3xl bg-bg-secondary/40 border border-glass-border backdrop-blur-xl shadow-lg">
          <h2 id="faq-rapida-title" className="text-xl sm:text-2xl font-black text-text-primary mb-6 flex items-center gap-3">
            <FaCircleQuestion className="text-accent" size={22} />
            <span>Preguntas Frecuentes sobre el Mantenimiento</span>
          </h2>

          <div className="space-y-4 divide-y divide-glass-border/60">
            <div className="pt-2">
              <h3 className="text-base font-bold text-text-primary mb-1">
                ¿Tengo que hacer alguna copia de seguridad manual?
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                No es necesario. Realizamos respaldos automáticos y completos de todas las cuentas y registros antes de iniciar la migración.
              </p>
            </div>

            <div className="pt-4">
              <h3 className="text-base font-bold text-text-primary mb-1">
                ¿Qué pasará con la aplicación en mi teléfono Android?
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                La aplicación instalada seguirá exactamente en tu móvil. Una vez reactivado el servicio, se reconectará de forma transparente a los nuevos servidores.
              </p>
            </div>

            <div className="pt-4">
              <h3 className="text-base font-bold text-text-primary mb-1">
                ¿Cómo podré acceder tras el mantenimiento?
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Podrás ingresar desde <strong className="text-accent">profitnessglass.com</strong> o desde tus accesos directos habituales. Iniciarás sesión con tu mismo correo y contraseña de siempre.
              </p>
            </div>
          </div>
        </section>

        {/* Botón de vuelta */}
        <div className="text-center mb-6">
          <button
            onClick={handleBack}
            className="px-8 py-3.5 bg-accent text-accent-contrast font-bold text-base rounded-2xl shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
          >
            Entendido, volver a la aplicación
          </button>
        </div>

        {/* Footer público */}
        <PublicPageFooter />
      </div>
    </div>
  );
}
