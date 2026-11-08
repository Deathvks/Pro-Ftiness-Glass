import MaintenanceNoticeBanner from '../components/MaintenanceNoticeBanner';
/* frontend/src/pages/PrivacyPolicy.jsx */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Cookie, Camera, Shield, Bell, Globe, Trash2, 
  Mail, Clock, Users, HeartHandshake, MapPin, ShieldCheck, ExternalLink,
  Database, RotateCcw, Info
} from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { mailProvider, privacyEmail } from '../config/mailContacts';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';

const PrivacyPolicy = ({ onBack }) => {
  // Permitimos usar la prop onBack si se pasa (para el bypass en App.jsx) o useNavigate por defecto
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));
  const resetCookieConsent = useAppStore(state => state.resetCookieConsent);
  const { addToast } = useToast();

  const isCookiesView = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/cookies') ||
    window.location.pathname.startsWith('/politica-cookies') ||
    window.location.pathname.startsWith('/politica-de-cookies') ||
    window.location.hash === '#cookies'
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isCookiesPath = window.location.pathname === '/cookies' || 
                            window.location.pathname === '/politica-cookies' || 
                            window.location.pathname === '/politica-de-cookies';
      const hashId = window.location.hash ? window.location.hash.replace('#', '') : null;
      const targetId = hashId || (isCookiesPath ? 'cookies' : null);

      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
        }
      }
    }
  }, []);

  const handleResetCookies = () => {
    resetCookieConsent();
    addToast('Preferencia de cookies restablecida. El aviso volverá a mostrarse al navegar.', 'info');
  };

  // Fecha actual formateada en español
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Componente interno para las tarjetas con los estilos específicos
  const PolicyCard = ({ children, className = "", highlight = false, id }) => {
    return (
      <div id={id} className={`
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
        title={isCookiesView ? "Política de Cookies y Almacenamiento Local - Pro Fitness Glass" : "Política de Privacidad y Eliminación de Datos - Pro Fitness Glass"} 
        description={isCookiesView ? "Conoce el inventario completo de cookies técnicas y almacenamiento local de Pro Fitness Glass conforme al Art. 22.2 LSSI-CE y la AEPD." : "Conoce cómo protegemos tus datos y los pasos para solicitar la eliminación de tu cuenta."}
        route={isCookiesView ? "cookies" : "privacy-policy"} 
      />

      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out] sm:mt-0" style={{ paddingTop: 'calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 1rem)' }}>
        
        <MaintenanceNoticeBanner className="rounded-2xl mb-6" />
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

            {/* --- SECCIÓN FORMAL RGPD: Cuadro del Responsable del Tratamiento --- */}
            <PolicyCard className="md:col-span-2" highlight={true}>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-accent text-accent-contrast rounded-[20px] shadow-lg shadow-accent/30 ring-1 ring-white/20 shrink-0">
                  <ShieldCheck size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs font-black tracking-widest text-accent uppercase">
                    Primera Capa Informativa — Art. 13 RGPD y Art. 11 LOPDGDD
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                    Información Básica sobre Protección de Datos
                  </h2>
                </div>
              </div>

              <p className="text-text-secondary font-medium mb-6 text-sm sm:text-base leading-relaxed max-w-3xl">
                En cumplimiento del <strong>Reglamento General de Protección de Datos (UE 2016/679)</strong> y la <strong>Ley Orgánica 3/2018 (LOPDGDD)</strong>, te informamos de manera formal y transparente sobre la gestión y el tratamiento de tus datos personales:
              </p>

              <div className="overflow-hidden rounded-[24px] ring-1 ring-black/10 dark:ring-white/10 bg-bg-primary/70 backdrop-blur-md shadow-sm">
                <div className="divide-y divide-black/5 dark:divide-white/10 text-xs sm:text-sm">
                  {/* Responsable */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                    <span className="font-extrabold text-text-primary md:w-56 shrink-0 uppercase tracking-wider text-[11px] text-accent">
                      Responsable del Tratamiento
                    </span>
                    <div className="text-text-secondary font-medium leading-relaxed">
                      <strong className="text-text-primary">Dylan Jesús Suárez Falcón</strong> (Titular de Pro Fitness Glass).
                      <br />
                      Correo de contacto y ejercicio de derechos: <a href={`mailto:${privacyEmail}`} className="text-accent underline font-bold">{privacyEmail}</a>
                    </div>
                  </div>

                  {/* Finalidad */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start gap-2 md:gap-6">
                    <span className="font-extrabold text-text-primary md:w-56 shrink-0 uppercase tracking-wider text-[11px] text-accent">
                      Finalidad Principal
                    </span>
                    <div className="text-text-secondary font-medium leading-relaxed">
                      Gestión integral de cuenta de usuario, diario de entrenamiento en gimnasio, cálculo de marcas (1RM), registro de sobrecarga progresiva, control nutricional asistido y asesoría deportiva voluntaria con entrenadores vinculados. Las historias efímeras compartidas se destruyen automáticamente tras 24 horas.
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start gap-2 md:gap-6">
                    <span className="font-extrabold text-text-primary md:w-56 shrink-0 uppercase tracking-wider text-[11px] text-accent">
                      Avisos de actividad por correo
                    </span>
                    <div className="text-text-secondary font-medium leading-relaxed">
                      Si has verificado tu dirección, te avisamos cuando hay nuevos mensajes en el chat de asesoría o se te asigna una asesoría. Estos avisos están activados por defecto. El contenido del chat y los nombres se consultan dentro de la aplicación. Puedes desactivar estos avisos en Ajustes, en la sección Notificaciones, o mediante su enlace de baja.
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start gap-2 md:gap-6">
                    <span className="font-extrabold text-text-primary md:w-56 shrink-0 uppercase tracking-wider text-[11px] text-accent">
                      Correos promocionales opcionales
                    </span>
                    <div className="text-text-secondary font-medium leading-relaxed">
                      Puedes autorizar por separado los recordatorios personalizados de entrenamiento y los recordatorios promocionales sobre asesorías que hayas consultado en el chat. Guardamos cuándo y desde dónde das o retiras el permiso, junto con el aviso que aceptaste. Puedes retirarlo en Ajustes o mediante el enlace de baja incluido en cada correo, sin afectar a tu cuenta ni a los avisos necesarios para su seguridad.
                    </div>
                  </div>

                  {/* Legitimación / Bases Jurídicas */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start gap-2 md:gap-6">
                    <span className="font-extrabold text-text-primary md:w-56 shrink-0 uppercase tracking-wider text-[11px] text-accent">
                      Bases Jurídicas (Legitimación)
                    </span>
                    <div className="text-text-secondary font-medium leading-relaxed space-y-1.5">
                      <p>
                        <strong className="text-text-primary">1. Ejecución del contrato (Art. 6.1.b RGPD):</strong> Necesario para la prestación del servicio, sincronización de rutinas y acceso a la plataforma.
                      </p>
                      <p>
                        <strong className="text-text-primary">2. Consentimiento explícito e informado (Art. 6.1.a y 9.2.a RGPD):</strong> Aplicable a métricas de rendimiento físico, peso corporal, calorías y datos antropométricos relativos a la salud deportiva.
                      </p>
                      <p>
                        <strong className="text-text-primary">3. Interés legítimo (Art. 6.1.f RGPD):</strong> Mantenimiento de la seguridad de la plataforma, prevención de fraude y registro de auditoría de sesiones.
                      </p>
                      <p>
                        <strong className="text-text-primary">4. Consentimiento opcional (Art. 6.1.a y, cuando corresponda, Art. 9.2.a RGPD):</strong> Envío de recordatorios de entrenamiento y de asesoría por correo, cada uno con su propio permiso. Puedes retirarlos en cualquier momento desde Ajustes o desde el enlace de baja. Tu decisión no afecta al uso del servicio.
                      </p>
                      <p>
                        <strong className="text-text-primary">5. Interés legítimo para los avisos de actividad (art. 6.1.f RGPD).</strong> El interés de Pro Fitness Glass es facilitar el seguimiento de las conversaciones y asignaciones de asesoría que ya forman parte de tu actividad en el servicio. Puedes oponerte y desactivar estos avisos en cualquier momento.
                      </p>
                    </div>
                  </div>

                  {/* Destinatarios */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start gap-2 md:gap-6">
                    <span className="font-extrabold text-text-primary md:w-56 shrink-0 uppercase tracking-wider text-[11px] text-accent">
                      Destinatarios
                    </span>
                    <div className="text-text-secondary font-medium leading-relaxed space-y-1.5">
                      <p>No vendemos tus datos ni los compartimos para que terceros hagan su propia publicidad. Para prestar el servicio utilizamos proveedores tecnológicos, entre ellos los de alojamiento e inicio de sesión.</p>
                      <p>Usamos el servicio SMTP de {mailProvider} para enviar los correos de Pro Fitness Glass. El proveedor recibe la dirección de destino, el asunto, el contenido del mensaje y los datos técnicos necesarios para tramitar la entrega.</p>
                    </div>
                  </div>

                  {/* Conservación */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start gap-2 md:gap-6">
                    <span className="font-extrabold text-text-primary md:w-56 shrink-0 uppercase tracking-wider text-[11px] text-accent">
                      Plazos de Conservación
                    </span>
                    <div className="text-text-secondary font-medium leading-relaxed">
                      Tus datos se conservan mientras tu cuenta permanezca activa. Puedes solicitar o ejecutar la eliminación total e irreversible de tu cuenta en cualquier momento desde tu Perfil. Las historias efímeras se eliminan de forma irrecuperable a las 24 horas.
                    </div>
                  </div>

                  {/* Derechos */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start gap-2 md:gap-6">
                    <span className="font-extrabold text-text-primary md:w-56 shrink-0 uppercase tracking-wider text-[11px] text-accent">
                      Tus Derechos
                    </span>
                    <div className="text-text-secondary font-medium leading-relaxed">
                      Derecho de acceso, rectificación, supresión (derecho al olvido), limitación del tratamiento, oposición y portabilidad de datos (exportación completa en formatos abiertos JSON, CSV y Excel). Puedes ejercerlos al instante desde los Ajustes de tu cuenta o escribiendo a <a href={`mailto:${privacyEmail}`} className="text-accent underline font-bold">{privacyEmail}</a>.
                    </div>
                  </div>

                  {/* Edad Mínima de Consentimiento */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start gap-2 md:gap-6">
                    <span className="font-extrabold text-text-primary md:w-56 shrink-0 uppercase tracking-wider text-[11px] text-accent">
                      Edad Mínima de Consentimiento
                    </span>
                    <div className="text-text-secondary font-medium leading-relaxed">
                      El tratamiento de datos personales en la plataforma está fijado en <strong className="text-text-primary">14 años cumplidos</strong> (Art. 7 de la Ley Orgánica 3/2018 - LOPDGDD y Art. 8 del RGPD UE 2016/679). Los menores de 14 años requieren el consentimiento y supervisión previa de sus progenitores o tutores legales.
                    </div>
                  </div>

                  {/* Reclamación AEPD */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start gap-2 md:gap-6">
                    <span className="font-extrabold text-text-primary md:w-56 shrink-0 uppercase tracking-wider text-[11px] text-accent">
                      Autoridad de Control
                    </span>
                    <div className="text-text-secondary font-medium leading-relaxed">
                      Tienes derecho a presentar una reclamación ante la <strong className="text-text-primary">Agencia Española de Protección de Datos (AEPD)</strong> a través de su sede electrónica oficial en <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-accent underline font-bold inline-flex items-center gap-1">www.aepd.es <ExternalLink size={12} /></a> si consideras vulnerados tus derechos.
                    </div>
                  </div>
                </div>
              </div>
            </PolicyCard>

            {/* --- SECCIÓN DESTACADA: Historias --- */}
            <PolicyCard className="md:col-span-2" highlight={true}>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-accent text-accent-contrast rounded-[20px] shadow-lg shadow-accent/30 ring-1 ring-white/20">
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

            {/* --- SECCIÓN COMPLETA: POLÍTICA DE COOKIES Y ALMACENAMIENTO LOCAL (LSSI-CE ART. 22.2 & AEPD) --- */}
            <div id="cookies" className="md:col-span-2 scroll-mt-24">
              <PolicyCard highlight={true} className="border border-accent/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-accent text-accent-contrast rounded-[20px] shadow-lg shadow-accent/30 ring-1 ring-white/20 shrink-0">
                      <Cookie size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs font-black tracking-widest text-accent uppercase block">
                        Segunda Capa Informativa — Art. 22.2 LSSI-CE y Guía de Cookies AEPD
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                        Política de Cookies y Almacenamiento Local
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetCookies}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-accent/10 border border-black/10 dark:border-white/10 hover:border-accent/30 text-text-secondary hover:text-accent font-bold text-xs transition-all w-fit shrink-0 cursor-pointer active:scale-95"
                    title="Borra la preferencia guardada en este navegador y vuelve a mostrar el banner de elección"
                  >
                    <RotateCcw size={14} />
                    <span>Restablecer consentimiento</span>
                  </button>
                </div>

                {/* Explicación didáctica y principios de privacidad */}
                <div className="space-y-4 text-sm sm:text-base font-medium text-text-secondary leading-relaxed mb-6">
                  <p>
                    En <strong className="text-text-primary">Pro Fitness Glass</strong> estamos comprometidos con tu privacidad digital. Por principio ético de diseño, <strong className="text-text-primary">NO utilizamos cookies publicitarias, no realizamos perfilado comercial para terceros ni vendemos tus datos a redes de anuncios</strong>.
                  </p>
                  <p>
                    De acuerdo con el artículo 22.2 de la <strong>Ley 34/2002 (LSSI-CE)</strong> y las directrices de la <strong>Agencia Española de Protección de Datos (AEPD)</strong>, a continuación te informamos con total claridad sobre las tecnologías de almacenamiento que utiliza nuestra aplicación web y progresiva (PWA):
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs sm:text-sm">
                    <div className="p-4 rounded-2xl bg-bg-primary/80 border border-black/5 dark:border-white/10 space-y-1">
                      <strong className="text-text-primary block font-bold">1. Cookies Técnicas</strong>
                      <p className="text-text-tertiary">Datos indispensables para verificar tu identidad y mantener abierta tu sesión segura.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-bg-primary/80 border border-black/5 dark:border-white/10 space-y-1">
                      <strong className="text-text-primary block font-bold">2. LocalStorage</strong>
                      <p className="text-text-tertiary">Memoria local en tu dispositivo para recordar tu tema visual y opciones sin consultar al servidor.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-bg-primary/80 border border-black/5 dark:border-white/10 space-y-1">
                      <strong className="text-text-primary block font-bold">3. IndexedDB (Offline)</strong>
                      <p className="text-text-tertiary">Caché de ejercicios y rutinas para que la app responda a 0 ms sin gastar datos en el gimnasio.</p>
                    </div>
                  </div>
                </div>

                {/* TABLA DE COOKIES Y ALMACENAMIENTO (REQUISITO EXIGIDO POR LA AEPD) */}
                <div className="mt-6 mb-8">
                  <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                    <Database size={18} className="text-accent" />
                    <span>Inventario Detallado de Cookies y Almacenamiento Local</span>
                  </h3>
                  
                  <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-glass-border bg-bg-primary/60 shadow-sm">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-glass-border bg-black/5 dark:bg-white/5 text-[11px] font-black uppercase tracking-wider text-text-primary">
                          <th className="p-3.5 sm:p-4">Identificador / Clave</th>
                          <th className="p-3.5 sm:p-4">Titular</th>
                          <th className="p-3.5 sm:p-4">Finalidad y Uso</th>
                          <th className="p-3.5 sm:p-4">Tipo Legal</th>
                          <th className="p-3.5 sm:p-4">Duración</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/10 text-text-secondary font-medium">
                        <tr className="hover:bg-accent/5 transition-colors">
                          <td className="p-3.5 sm:p-4 font-mono font-bold text-accent text-xs">pro_fitness_token / auth</td>
                          <td className="p-3.5 sm:p-4 text-text-primary font-bold">Pro Fitness Glass (Propia)</td>
                          <td className="p-3.5 sm:p-4">Mantiene la sesión de usuario iniciada de forma cifrada y segura al navegar entre páginas.</td>
                          <td className="p-3.5 sm:p-4"><span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">Técnica (Exenta)</span></td>
                          <td className="p-3.5 sm:p-4">Hasta cerrar sesión o caducidad del token</td>
                        </tr>
                        <tr className="hover:bg-accent/5 transition-colors">
                          <td className="p-3.5 sm:p-4 font-mono font-bold text-accent text-xs">theme / accent</td>
                          <td className="p-3.5 sm:p-4 text-text-primary font-bold">Pro Fitness Glass (Propia)</td>
                          <td className="p-3.5 sm:p-4">Recuerda la apariencia elegida (modo oscuro/claro y color de acento) en este navegador.</td>
                          <td className="p-3.5 sm:p-4"><span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-[11px]">Personalización</span></td>
                          <td className="p-3.5 sm:p-4">Persistente (LocalStorage)</td>
                        </tr>
                        <tr className="hover:bg-accent/5 transition-colors">
                          <td className="p-3.5 sm:p-4 font-mono font-bold text-accent text-xs">cookie_consent</td>
                          <td className="p-3.5 sm:p-4 text-text-primary font-bold">Pro Fitness Glass (Propia)</td>
                          <td className="p-3.5 sm:p-4">Registra la elección del usuario (Aceptado o Rechazado) para no mostrar el banner en cada visita.</td>
                          <td className="p-3.5 sm:p-4"><span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">Técnica / Legal</span></td>
                          <td className="p-3.5 sm:p-4">1 año o hasta borrado</td>
                        </tr>
                        <tr className="hover:bg-accent/5 transition-colors">
                          <td className="p-3.5 sm:p-4 font-mono font-bold text-accent text-xs">pfg_notification_offer:*</td>
                          <td className="p-3.5 sm:p-4 text-text-primary font-bold">Pro Fitness Glass (Propia)</td>
                          <td className="p-3.5 sm:p-4">Guarda la fecha del recordatorio de avisos para aplicar un enfriamiento (cooldown de 21 días) y no molestar al usuario en cada entrenamiento.</td>
                          <td className="p-3.5 sm:p-4"><span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold text-[11px]">Funcional</span></td>
                          <td className="p-3.5 sm:p-4">21 días</td>
                        </tr>
                        <tr className="hover:bg-accent/5 transition-colors">
                          <td className="p-3.5 sm:p-4 font-mono font-bold text-accent text-xs">IndexedDB (pfg_cache / offline)</td>
                          <td className="p-3.5 sm:p-4 text-text-primary font-bold">Pro Fitness Glass (Propia)</td>
                          <td className="p-3.5 sm:p-4">Guarda localmente la biblioteca de ejercicios, GIFs y rutinas en la memoria del dispositivo para permitir entrenar sin internet y ahorrar datos móviles.</td>
                          <td className="p-3.5 sm:p-4"><span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">Técnica (Offline)</span></td>
                          <td className="p-3.5 sm:p-4">Persistente en memoria local (Borrable en Ajustes)</td>
                        </tr>
                        <tr className="hover:bg-accent/5 transition-colors">
                          <td className="p-3.5 sm:p-4 font-mono font-bold text-accent text-xs">pfg_crash_loop_count</td>
                          <td className="p-3.5 sm:p-4 text-text-primary font-bold">Pro Fitness Glass (Propia)</td>
                          <td className="p-3.5 sm:p-4">Mecanismo de seguridad técnica que previene bucles de recarga infinitos si ocurre un corte de red durante una actualización.</td>
                          <td className="p-3.5 sm:p-4"><span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">Seguridad</span></td>
                          <td className="p-3.5 sm:p-4">Sesión temporal (Se borra tras carga limpia)</td>
                        </tr>
                        <tr className="hover:bg-accent/5 transition-colors">
                          <td className="p-3.5 sm:p-4 font-mono font-bold text-accent text-xs">Google Identity Services (GSI)</td>
                          <td className="p-3.5 sm:p-4 text-text-primary font-bold">Google LLC (Terceros)</td>
                          <td className="p-3.5 sm:p-4">Facilita el inicio de sesión rápido con Google únicamente si el usuario pulsa deliberadamente en el botón "Continuar con Google".</td>
                          <td className="p-3.5 sm:p-4"><span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[11px]">Autenticación Externa</span></td>
                          <td className="p-3.5 sm:p-4">Gestionada por Google según su política</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cómo gestionar o bloquear cookies en los navegadores */}
                <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border space-y-3">
                  <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Info size={16} className="text-accent" />
                    <span>¿Cómo desactivar o borrar estas tecnologías en tu navegador?</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                    Puedes permitir, bloquear o eliminar los datos instalados en tu equipo mediante la configuración de las opciones de tu navegador web. En caso de bloquear el almacenamiento técnico indispensable (como el token de sesión), es posible que no puedas iniciar sesión ni utilizar las funciones personalizadas:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-bg-primary/80 hover:bg-accent/10 border border-black/5 dark:border-white/10 hover:border-accent/30 text-text-secondary hover:text-accent font-semibold flex items-center justify-between gap-1 transition-all">
                      <span>Google Chrome</span>
                      <ExternalLink size={12} />
                    </a>
                    <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-bg-primary/80 hover:bg-accent/10 border border-black/5 dark:border-white/10 hover:border-accent/30 text-text-secondary hover:text-accent font-semibold flex items-center justify-between gap-1 transition-all">
                      <span>Mozilla Firefox</span>
                      <ExternalLink size={12} />
                    </a>
                    <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-bg-primary/80 hover:bg-accent/10 border border-black/5 dark:border-white/10 hover:border-accent/30 text-text-secondary hover:text-accent font-semibold flex items-center justify-between gap-1 transition-all">
                      <span>Apple Safari</span>
                      <ExternalLink size={12} />
                    </a>
                    <a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-bg-primary/80 hover:bg-accent/10 border border-black/5 dark:border-white/10 hover:border-accent/30 text-text-secondary hover:text-accent font-semibold flex items-center justify-between gap-1 transition-all">
                      <span>Microsoft Edge</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </PolicyCard>
            </div>

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
              <div className="space-y-3 text-text-secondary font-medium text-sm leading-relaxed mb-5">
                <p>En Ajustes → Notificaciones puedes activar los avisos push en cada dispositivo para recibir avisos de cuenta, seguridad y actividad de la app. Tratamos la suscripción para ofrecer el canal que eliges. Puedes desactivar el dispositivo desde Ajustes o retirar el permiso en el navegador o sistema operativo.</p>
                <p>Los recordatorios de entrenamiento, el seguimiento promocional de asesoría y las novedades por push se basan en tu consentimiento. Puedes elegir cada categoría por separado. Inicialmente están desactivadas. Guardamos la categoría, la versión del aviso y la fecha de tu elección para acreditarla. Puedes retirar cada permiso desde Ajustes → Notificaciones. El correo tiene sus propias preferencias.</p>
                <p>Para entregar el aviso usamos un identificador de suscripción o token y, en la web, claves de cifrado. En Android el envío remoto se realiza con Firebase Cloud Messaging (Google). En la web interviene el servicio de notificaciones del navegador, como los de Google, Mozilla, Apple o Microsoft. El aviso del dispositivo resume qué ha ocurrido. El contenido de los mensajes privados y los datos técnicos de seguridad se consultan dentro de la app.</p>
                <p>Una tarea diaria borra los registros técnicos de entrega con más de 30 días. Al desactivar el push desde la app eliminamos la suscripción de ese dispositivo. También retiramos las suscripciones que el proveedor confirma que han caducado. Los recordatorios locales de Android se programan en el propio dispositivo cuando los activas.</p>
              </div>
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

            {/* --- TARJETA: Entrenador Personal --- */}
            <PolicyCard>
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-accent/10 text-accent rounded-[16px] ring-1 ring-accent/30 shadow-sm">
                  <Users size={24} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">Tu Entrenador</h2>
              </div>
              <p className="text-text-secondary font-medium text-sm leading-relaxed mb-4">
                Si te vinculas a un entrenador personal en la app, este tendrá acceso a tu información de progreso para poder asesorarte, lo que incluye:
              </p>
              <ul className="text-sm font-medium text-text-secondary space-y-3 list-none">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span><strong>Fotos de progreso:</strong> Las fotos que compartas con tu entrenador son estrictamente confidenciales y privadas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span><strong>Historial y Datos:</strong> Rutinas, pesos, y registros nutricionales que faciliten tu seguimiento.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span>Esta información <strong>jamás será compartida</strong> fuera de vuestra relación cliente-entrenador ni usada para otros fines.</span>
                </li>
              </ul>
            </PolicyCard>

            {/* --- TARJETA: Eliminación (Full Width) --- */}
            <div id="eliminacion-datos" className="md:col-span-2 scroll-mt-24">
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
                                    <span>Envía un correo a <a href={`mailto:${privacyEmail}`} className="text-accent hover:underline">{privacyEmail}</a></span>
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
              <a href={`mailto:${privacyEmail}`} className="px-6 py-3 bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 rounded-full text-accent font-extrabold text-lg sm:text-xl shadow-sm hover:scale-105 active:scale-95 transition-all">
                {privacyEmail}
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
