/* frontend/src/pages/LegalNoticePage.jsx */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Scale, Building2, Mail, ShieldCheck, 
  FileText, ExternalLink, Lock, AlertTriangle, Globe, 
  Server, Cpu, ShieldAlert, BookOpen
} from 'lucide-react';
import MaintenanceNoticeBanner from '../components/MaintenanceNoticeBanner';
import GlassCard from '../components/GlassCard';
import SEOHead from '../components/SEOHead';
import { supportEmail } from '../config/mailContacts';

const LegalNoticePage = ({ onBack }) => {
  const navigate = useNavigate();
  const handleBack = onBack || (() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  });

  return (
    <div className="fixed inset-0 z-[110] bg-bg-primary overflow-y-auto custom-scrollbar transition-colors duration-300">
      <SEOHead 
        title="Aviso Legal y Datos de Identificación (LSSI-CE) - Pro Fitness Glass" 
        description="Información general del prestador del servicio, titularidad, propiedad intelectual y régimen de responsabilidad de Pro Fitness Glass conforme al Art. 10 de la Ley 34/2002 (LSSI-CE)." 
        route="aviso-legal" 
      />
      
      <div 
        className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out] sm:mt-0" 
        style={{ paddingTop: 'calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 1rem)' }}
      >
        <MaintenanceNoticeBanner className="rounded-2xl mb-6" />
        
        {/* Botón de regreso adaptativo */}
        <button 
          onClick={handleBack} 
          className="flex items-center gap-2 px-4 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 rounded-full text-text-secondary font-bold hover:text-text-primary transition-colors mb-8 w-fit active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
          <span>Volver</span>
        </button>

        <GlassCard className="glass p-6 sm:p-12 rounded-[32px] shadow-2xl border-none ring-1 ring-black/5 dark:ring-white/10 bg-bg-primary/50">
          
          {/* Cabecera principal */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-accent/15 text-accent rounded-2xl ring-1 ring-accent/30 shrink-0">
                <Scale size={24} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] sm:text-xs font-black tracking-widest text-accent uppercase">
                Cumplimiento Art. 10 LSSI-CE 34/2002
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
              Aviso Legal e Información General
            </h1>
            
            <p className="text-xs sm:text-sm font-semibold text-text-tertiary mt-2">
              Última actualización: Noviembre de 2026 | Aplicable en España y Unión Europea
            </p>
          </div>

          {/* Cuadro destacado de bienvenida y marco legal */}
          <div className="space-y-8 text-text-primary">
            <div className="p-5 sm:p-6 rounded-[24px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 shadow-inner">
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                El presente <strong className="text-text-primary">Aviso Legal</strong> regula el acceso, navegación y utilización del sitio web y la aplicación móvil y progresiva (PWA) <strong className="text-text-primary">Pro Fitness Glass</strong>, accesible a través de la dirección <strong className="text-accent">https://profitnessglass.es</strong> y sus aplicaciones asociadas.
              </p>
            </div>

            {/* SECCIÓN 1: DATOS IDENTIFICATIVOS DEL PRESTADOR */}
            <section className="p-6 sm:p-8 rounded-[28px] bg-accent/10 border border-accent/25 shadow-lg shadow-accent/5 relative overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-accent text-accent-contrast rounded-2xl shadow-md shadow-accent/30 ring-1 ring-white/20 shrink-0 mt-1">
                  <Building2 size={26} strokeWidth={2.4} />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] sm:text-xs font-black tracking-widest text-accent uppercase block">
                    Artículo 10 Ley 34/2002 (LSSI-CE)
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                    1. Datos Identificativos del Titular y Prestador del Servicio
                  </h2>
                  <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed pt-1">
                    En cumplimiento de las obligaciones de información general recogidas en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se ponen a disposición permanente, directa y gratuita los siguientes datos identificativos:
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-accent/20 text-xs sm:text-sm">
                <div className="p-4 rounded-xl bg-bg-primary/60 backdrop-blur-sm border border-black/5 dark:border-white/10 space-y-1">
                  <span className="font-bold text-text-primary block">Titular del servicio y desarrollador responsable:</span>
                  <p className="text-text-secondary font-medium">Dylan Jesús Suárez Falcón</p>
                </div>
                <div className="p-4 rounded-xl bg-bg-primary/60 backdrop-blur-sm border border-black/5 dark:border-white/10 space-y-1">
                  <span className="font-bold text-text-primary block">Denominación del servicio y marca:</span>
                  <p className="text-text-secondary font-medium">Pro Fitness Glass</p>
                </div>
                <div className="p-4 rounded-xl bg-bg-primary/60 backdrop-blur-sm border border-black/5 dark:border-white/10 space-y-1">
                  <span className="font-bold text-text-primary block">Domicilio y radicación territorial:</span>
                  <p className="text-text-secondary font-medium">España (Gran Canaria, Islas Canarias, España — Territorio de la Unión Europea)</p>
                </div>
                <div className="p-4 rounded-xl bg-bg-primary/60 backdrop-blur-sm border border-black/5 dark:border-white/10 space-y-1">
                  <span className="font-bold text-text-primary block">Correo electrónico de contacto y soporte:</span>
                  <a href={`mailto:${supportEmail}`} className="text-accent underline font-bold block">
                    {supportEmail}
                  </a>
                </div>
              </div>

              <div className="mt-3 p-4 rounded-xl bg-bg-primary/60 backdrop-blur-sm border border-black/5 dark:border-white/10 text-xs sm:text-sm space-y-1">
                <span className="font-bold text-text-primary block">Infraestructura y Alojamiento (Hosting):</span>
                <p className="text-text-secondary font-medium leading-relaxed">
                  La plataforma se aloja en un servidor VPS propio, administrado por el titular y contratado a Clouding.io. Cloudflare proporciona la red de distribución de contenidos (CDN) y la seguridad perimetral. El tratamiento de datos personales se realiza conforme al Reglamento General de Protección de Datos (UE 2016/679).
                </p>
              </div>
            </section>

            {/* 2. Objeto de la Plataforma */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <Cpu size={20} className="text-accent" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  2. Objeto y Naturaleza de los Servicios
                </h2>
              </div>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                <strong className="text-text-primary">Pro Fitness Glass</strong> es una solución tecnológica integral de software diseñada para la gestión, planificación y análisis del entrenamiento físico de fuerza e hipertrofia muscular, cálculo de marcas personales (1RM), registro dietético y nutricional con asistencia de inteligencia artificial, y divulgación científica mediante artículos formativos y de noticias.
              </p>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                El acceso a las funcionalidades principales y calculadoras públicas es de carácter gratuito. El prestador se reserva la facultad de evolucionar, optimizar o modificar las características de la aplicación en cualquier momento para mejorar la experiencia de usuario o adaptarse a novedades tecnológicas.
              </p>
            </section>

            {/* 3. Condiciones Generales de Acceso y Uso */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-accent" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  3. Obligaciones y Uso Diligente del Usuario
                </h2>
              </div>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                Toda persona que acceda a esta plataforma adquiere la condición de <strong className="text-text-primary">Usuario</strong> y se compromete a la observancia y cumplimiento riguroso de las disposiciones aquí contenidas, así como de cualquier otra disposición legal que fuera de aplicación. En particular, el usuario se compromete a:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-sm sm:text-base font-medium text-text-secondary pl-2">
                <li>Hacer un uso adecuado y lícito de la plataforma, sus contenidos y utilidades, conforme a la legislación española, la moral, el orden público y las buenas costumbres.</li>
                <li>Facilitar información veraz y actualizada al registrar su perfil, rutinas o marcas físicas.</li>
                <li>No realizar actividades de ingeniería inversa, descompilación, extracción sistemática de datos (data scraping automatizado) ni alterar el código fuente de la aplicación sin consentimiento previo.</li>
                <li>No introducir ni difundir virus informáticos, troyanos ni utilizar sistemas automatizados para sobrecargar o provocar ataques de denegación de servicio (DoS/DDoS) contra los servidores o la infraestructura.</li>
                <li>Custodiar debidamente sus credenciales personales de acceso, respondiendo de las acciones realizadas a través de su cuenta individual.</li>
              </ul>
            </section>

            {/* 4. Propiedad Intelectual e Industrial */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <BookOpen size={20} className="text-accent" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  4. Propiedad Intelectual e Industrial
                </h2>
              </div>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                De conformidad con el <strong className="text-text-primary">Real Decreto Legislativo 1/1996</strong>, de 12 de abril, por el que se aprueba el texto refundido de la Ley de Propiedad Intelectual (LPI), todos los elementos que componen la plataforma Pro Fitness Glass —incluyendo, a título enunciativo pero no limitativo: arquitectura de software, código fuente y compilado, diseño de interfaz de usuario ("Liquid Glass"), hojas de estilo, animaciones, bases de datos de ejercicios, textos descriptivos, algoritmos de cálculo de 1RM, artículos de divulgación, logotipos, marcas comerciales y combinaciones cromáticas— son titularidad exclusiva de <strong className="text-text-primary">Dylan Jesús Suárez Falcón</strong> o bien se dispone de la correspondiente licencia o autorización de sus legítimos titulares.
              </p>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                Quedan expresamente prohibidas la reproducción, distribución, comunicación pública, transformación o puesta a disposición con fines comerciales de la totalidad o parte de los contenidos de esta web, en cualquier soporte y por cualquier medio técnico, sin la autorización previa, expresa y por escrito del titular.
              </p>
            </section>

            {/* 5. Exención Médica y Limitación de Responsabilidad */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-amber-500" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  5. Exención de Responsabilidad Médica y Sanitaria
                </h2>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-text-secondary text-sm sm:text-base font-medium space-y-2">
                <p className="leading-relaxed">
                  <strong className="text-text-primary">Pro Fitness Glass no es un centro sanitario ni proporciona prescripción médica, diagnóstico facultativo ni tratamiento de patologías</strong>.
                </p>
                <p className="leading-relaxed">
                  Las calculadoras de 1RM, recomendaciones de ingesta calórica y reparto de macronutrientes, o algoritmos de asistencia por IA son herramientas de cálculo informático puramente orientativas basadas en fórmulas matemáticas y literatura de ciencias de la actividad física y el deporte. El usuario practica ejercicio físico bajo su exclusiva responsabilidad y debe consultar a un médico especialista o profesional sanitario cualificado antes de someterse a regímenes de sobrecarga física o planes de déficit/superávit energético.
                </p>
              </div>
            </section>

            {/* 6. Régimen de Responsabilidad Técnica (Art. 13-17 LSSI-CE y DSA) */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <ShieldAlert size={20} className="text-accent" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  6. Régimen de Responsabilidad y Servicios de Intermediación
                </h2>
              </div>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                En aplicación de los artículos 13 a 17 de la Ley 34/2002 (LSSI-CE) y del <strong className="text-text-primary">Reglamento (UE) 2022/2065 de Servicios Digitales (DSA)</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-sm sm:text-base font-medium text-text-secondary pl-2">
                <li><strong className="text-text-primary">Disponibilidad del Servicio:</strong> El prestador adopta todas las medidas de seguridad y alta disponibilidad a su alcance, pero no garantiza la ausencia absoluta de cortes temporales por mantenimiento de servidores, incidencias en redes de telecomunicaciones o causas de fuerza mayor ajenas a su control.</li>
                <li><strong className="text-text-primary">Alojamiento de Contenidos Comunitarios:</strong> Pro Fitness Glass actúa como mero prestador de servicios de intermediación y alojamiento (hosting) respecto de las fotografías, comentarios y publicaciones compartidas libremente por los usuarios en historias o foros sociales. Pro Fitness Glass no realiza moderación previa de cada publicación particular, pero se compromete a retirar de inmediato cualquier contenido tan pronto tenga conocimiento efectivo de su carácter ilícito o lesivo para terceros.</li>
                <li><strong className="text-text-primary">Enlaces a Terceros (Links Externos):</strong> La plataforma puede contener enlaces hacia sitios web ajenos (por ejemplo, Google Play Store o referencias bibliográficas científicas). El prestador no asume responsabilidad alguna por los contenidos, políticas de privacidad o prácticas de dichos portales externos.</li>
              </ul>
            </section>

            {/* 7. Protección de Datos y Cookies */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <Lock size={20} className="text-accent" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  7. Protección de Datos y Privacidad
                </h2>
              </div>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                El tratamiento de datos de carácter personal que se recaban a través de Pro Fitness Glass se realiza con estricta sujeción al <strong className="text-text-primary">Reglamento (UE) 2016/679 (RGPD)</strong> y a la <strong className="text-text-primary">Ley Orgánica 3/2018 (LOPDGDD)</strong>.
              </p>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                Para consultar información completa sobre los fines del tratamiento, las bases jurídicas, los plazos de conservación y los mecanismos para ejercer sus derechos de acceso, rectificación, supresión, limitación y portabilidad, acceda a nuestra <a href="/privacy" className="text-accent underline font-bold inline-flex items-center gap-1">Política de Privacidad <ExternalLink size={12} /></a> y a los <a href="/terms" className="text-accent underline font-bold inline-flex items-center gap-1">Términos del Servicio <ExternalLink size={12} /></a>.
              </p>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                Asimismo, la utilización de cookies e identificadores locales (LocalStorage/IndexedDB) para la sesión y preferencias del usuario cumple rigurosamente con el artículo 22.2 de la LSSI-CE y la Directiva ePrivacy 2002/58/CE, disponiendo el usuario de una <a href="/cookies" className="text-accent underline font-bold inline-flex items-center gap-1">Política de Cookies y Almacenamiento Local detallada <ExternalLink size={12} /></a> y panel de configuración de consentimiento en todo momento.
              </p>
            </section>

            {/* 8. Resolución de Litigios en Línea y Jurisdicción */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <Globe size={20} className="text-accent" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  8. Resolución de Conflictos, Legislación y Fuero
                </h2>
              </div>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                En cumplimiento del <strong className="text-text-primary">artículo 14.1 del Reglamento (UE) 524/2013</strong> del Parlamento Europeo y del Consejo, se informa a los usuarios residentes en la Unión Europea de la existencia de la plataforma de resolución de litigios en línea de la Comisión Europea, disponible en el siguiente enlace:
              </p>
              <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-glass-border">
                <a 
                  href="https://ec.europa.eu/consumers/odr/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-accent font-bold hover:underline inline-flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <span>Plataforma Europea de Resolución de Litigios en Línea (ODR)</span>
                  <ExternalLink size={14} />
                </a>
              </div>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                Para cualquier controversia, conflicto o reclamación derivada de la interpretación o ejecución del presente Aviso Legal, las partes acuerdan someterse a la <strong className="text-text-primary">legislación española</strong> y a la competencia de los juzgados y tribunales que resulten legalmente competentes de acuerdo con la normativa vigente en materia de consumidores y usuarios.
              </p>
            </section>

          </div>
        </GlassCard>

        <div className="mt-12 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest text-text-tertiary opacity-60">
          © 2026 Pro Fitness Glass · Todos los derechos reservados · Desarrollado por Dylan Jesús Suárez Falcón
        </div>
      </div>
    </div>
  );
};

export default LegalNoticePage;
