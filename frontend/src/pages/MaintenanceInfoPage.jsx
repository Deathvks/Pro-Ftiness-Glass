/* frontend/src/pages/MaintenanceInfoPage.jsx */
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  FaArrowLeft, 
  FaShieldHalved, 
  FaServer, 
  FaGlobe, 
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
    name: 'Migración Completada con Éxito — Pro Fitness Glass',
    description: 'La migración técnica y el mantenimiento programado han finalizado satisfactoriamente. Tu información está 100% segura y la plataforma es ahora más rápida y eficiente bajo el nuevo dominio oficial profitnessglass.es.',
    url: 'https://profitnessglass.es/mantenimiento',
    inLanguage: 'es'
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary text-text-primary overflow-y-auto overflow-x-hidden custom-scrollbar selection:bg-emerald-500/30">
      <Helmet>
        <title>Migración y Mantenimiento Completados con Éxito — Pro Fitness Glass</title>
        <meta
          name="description"
          content="La migración técnica al dominio oficial profitnessglass.es ha finalizado con éxito. Tus datos están 100% seguros y la plataforma ahora ofrece mayor velocidad y estabilidad."
        />
        <link rel="canonical" href="https://profitnessglass.es/mantenimiento" />
        <meta property="og:title" content="Migración y Mantenimiento Completados con Éxito — Pro Fitness Glass" />
        <meta
          property="og:description"
          content="La plataforma está 100% operativa en su nuevo dominio oficial profitnessglass.es. Tus datos, marcas personales y entrenamientos están completamente a salvo."
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

        {/* Cabecera / Hero de presentación 100% responsive en móvil */}
        <header className="text-center mb-8 sm:mb-14">
          <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[10.5px] xs:text-xs uppercase tracking-wider mb-4 sm:mb-5 max-w-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <FaCircleCheck size={12} className="shrink-0" />
            <span className="hidden sm:inline">Aviso Oficial · </span>
            <span className="truncate">Migración Finalizada con Éxito</span>
          </div>

          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black text-text-primary tracking-tight leading-tight mb-3 sm:mb-5 px-1 break-words">
            ¡Migración Completada con Éxito!<br className="hidden sm:inline" /> Estrenamos Nuevo Dominio Oficial
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-lg text-text-secondary leading-relaxed px-2">
            La actualización técnica planificada ha finalizado satisfactoriamente. Disfruta de una experiencia mucho más rápida, fluida y con la total garantía de que <strong>todos tus datos están 100% seguros</strong> bajo nuestro dominio oficial <strong className="text-accent">profitnessglass.es</strong>.
          </p>
        </header>

        {/* Tarjeta Destacada: Estado del Servicio */}
        <div className="mb-10 p-5 sm:p-7 rounded-3xl bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/30 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FaCircleCheck size={30} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-text-primary mb-1">
              Plataforma 100% Operativa y Restablecida
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              La migración técnica se ha completado de forma transparente y sin pérdidas. Todo el tráfico, cuentas y funciones se encuentran plenamente activos con mejor rendimiento y tiempos de respuesta inmediatos.
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
                Tus datos están 100% seguros y respaldados
              </h2>
              <p className="text-text-secondary text-sm sm:text-base leading-relaxed mb-4">
                Queremos darte total tranquilidad: <strong>no se ha perdido ni un solo dato</strong>. Todas tus rutinas, pesos, series, marcas personales e historial han sido preservados íntegramente:
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
                  <span>Mismas credenciales de inicio de sesión</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border">
                  <FaCircleCheck className="text-emerald-500 shrink-0" size={16} />
                  <span>No necesitas volver a registrarte</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: ¿Qué mejoras trae esta actualización? */}
        <section aria-labelledby="motivo-title" className="mb-10 p-6 sm:p-8 rounded-3xl bg-bg-secondary/40 border border-glass-border backdrop-blur-xl shadow-lg">
          <h2 id="motivo-title" className="text-xl sm:text-2xl font-black text-text-primary mb-4 flex items-center gap-3">
            <FaServer className="text-sky-400" size={22} />
            <span>¿Qué ventajas aporta esta nueva infraestructura?</span>
          </h2>
          <div className="space-y-4 text-text-secondary text-sm sm:text-base leading-relaxed">
            <p>
              Hemos dado un salto decisivo hacia la excelencia técnica: <strong>trasladamos toda nuestra plataforma a una infraestructura dedicada de alto rendimiento</strong>, configurada y optimizada exclusivamente por y para Pro Fitness Glass.
            </p>
            <p>
              Además, consolidamos toda la aplicación bajo nuestro nuevo dominio oficial definitivo: <strong className="text-accent">profitnessglass.es</strong>, una dirección más directa, representativa y profesional para toda nuestra comunidad de atletas.
            </p>
          </div>
        </section>

        {/* Tarjetas de Beneficios */}
        <section aria-labelledby="beneficios-title" className="mb-10">
          <h2 id="beneficios-title" className="text-xl sm:text-2xl font-black text-text-primary mb-6 text-center">
            Lo que ganas desde hoy
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-bg-secondary/40 border border-glass-border backdrop-blur-xl shadow-sm text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-3.5 mx-auto sm:mx-0">
                <FaBolt size={18} />
              </div>
              <h3 className="font-extrabold text-text-primary text-base mb-1.5">Mayor Velocidad</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Tiempos de carga mínimos al registrar series, consultar vídeos de técnica y sincronizar tus entrenamientos en tiempo real.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-bg-secondary/40 border border-glass-border backdrop-blur-xl shadow-sm text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-3.5 mx-auto sm:mx-0">
                <FaGlobe size={18} />
              </div>
              <h3 className="font-extrabold text-text-primary text-base mb-1.5">Dominio Oficial</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Unificación total bajo <code className="text-accent font-bold">profitnessglass.es</code>, garantizando seguridad y presencia oficial.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-bg-secondary/40 border border-glass-border backdrop-blur-xl shadow-sm text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3.5 mx-auto sm:mx-0">
                <FaLock size={18} />
              </div>
              <h3 className="font-extrabold text-text-primary text-base mb-1.5">Estabilidad Total</h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Control absoluto de la infraestructura con máxima disponibilidad, seguridad reforzada y monitorización continua.
              </p>
            </div>
          </div>
        </section>

        {/* Preguntas Rápidas */}
        <section aria-labelledby="faq-rapida-title" className="mb-12 p-6 sm:p-8 rounded-3xl bg-bg-secondary/40 border border-glass-border backdrop-blur-xl shadow-lg">
          <h2 id="faq-rapida-title" className="text-xl sm:text-2xl font-black text-text-primary mb-6 flex items-center gap-3">
            <FaCircleQuestion className="text-accent" size={22} />
            <span>Preguntas Frecuentes tras la Migración</span>
          </h2>

          <div className="space-y-4 divide-y divide-glass-border/60">
            <div className="pt-2">
              <h3 className="text-base font-bold text-text-primary mb-1">
                ¿Tengo que hacer alguna copia o volver a registrarme?
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                No. Todos tus datos y cuentas siguen exactamente igual. Puedes acceder de forma habitual con tu mismo correo y contraseña de siempre.
              </p>
            </div>

            <div className="pt-4">
              <h3 className="text-base font-bold text-text-primary mb-1">
                ¿Qué pasa con la aplicación en mi teléfono Android?
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                La aplicación en tu móvil continúa funcionando con total normalidad y se conecta automáticamente a los nuevos sistemas de forma transparente.
              </p>
            </div>

            <div className="pt-4">
              <h3 className="text-base font-bold text-text-primary mb-1">
                ¿Qué ocurre si entro desde enlaces o marcadores antiguos?
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                El sistema redirige de forma automática y segura a <strong className="text-accent">profitnessglass.es</strong>, por lo que nunca perderás el acceso.
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
