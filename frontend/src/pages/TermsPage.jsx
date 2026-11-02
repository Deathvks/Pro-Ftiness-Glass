/* frontend/src/pages/TermsPage.jsx */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, UserCheck, Scale, FileText, 
  AlertTriangle, HeartPulse, Dumbbell, ExternalLink, Lock 
} from 'lucide-react';
import MaintenanceNoticeBanner from '../components/MaintenanceNoticeBanner';
import GlassCard from '../components/GlassCard';
import SEOHead from '../components/SEOHead';

const TermsPage = ({ onBack }) => {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  return (
    <div className="fixed inset-0 z-[110] bg-bg-primary overflow-y-auto custom-scrollbar transition-colors duration-300">
      <SEOHead 
        title="Términos del Servicio y Condiciones de Uso - Pro Fitness Glass" 
        description="Condiciones de uso, edad mínima legal de 14 años (Art. 8 RGPD y Art. 7 LOPDGDD), responsabilidad y derechos en Pro Fitness Glass." 
        route="terms" 
      />
      
      <div 
        className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out] sm:mt-0" 
        style={{ paddingTop: 'calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 1rem)' }}
      >
        <MaintenanceNoticeBanner className="rounded-2xl mb-6" />
        
        {/* Botón de regreso adaptativo */}
        <button 
          onClick={handleBack} 
          className="flex items-center gap-2 px-4 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 rounded-full text-text-secondary font-bold hover:text-text-primary transition-colors mb-8 w-fit active:scale-95"
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
                Aviso Legal y Condiciones Contractuales
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
              Términos del Servicio
            </h1>
            
            <p className="text-xs sm:text-sm font-semibold text-text-tertiary mt-2">
              Última actualización: Noviembre de 2026 | Aplicable en España y Unión Europea
            </p>
          </div>

          {/* Cuadro destacado de bienvenida y marco legal */}
          <div className="space-y-8 text-text-primary">
            <div className="p-5 sm:p-6 rounded-[24px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 shadow-inner">
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                Bienvenido a <strong className="text-text-primary">Pro Fitness Glass</strong>. El acceso, navegación y utilización de esta plataforma digital (vía web o aplicación móvil) se rige por los presentes Términos del Servicio y por la legislación española y comunitaria europea aplicable, en particular la <strong className="text-text-primary">Ley Orgánica 3/2018 (LOPDGDD)</strong>, el <strong className="text-text-primary">Reglamento General de Protección de Datos (UE 2016/679 - RGPD)</strong> y la <strong className="text-text-primary">Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI-CE)</strong>.
              </p>
            </div>

            {/* SECCIÓN DESTACADA: EDAD MÍNIMA DE USO */}
            <div className="p-6 sm:p-8 rounded-[28px] bg-accent/10 border border-accent/25 shadow-lg shadow-accent/5 relative overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-accent text-accent-contrast rounded-2xl shadow-md shadow-accent/30 ring-1 ring-white/20 shrink-0 mt-1">
                  <UserCheck size={26} strokeWidth={2.4} />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] sm:text-xs font-black tracking-widest text-accent uppercase block">
                    Requisito Imperativo de Acceso — Art. 8 RGPD y Art. 7 LOPDGDD
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                    Edad Mínima Legal de Uso: 14 Años
                  </h2>
                  <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed pt-1">
                    De conformidad con el artículo 7 de la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD) vigente en España y el artículo 8 del Reglamento (UE) 2016/679 (RGPD), <strong className="text-text-primary">el registro y uso de Pro Fitness Glass está estrictamente reservado a personas que hayan cumplido al menos 14 años de edad</strong>.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-accent/20 text-xs sm:text-sm">
                <div className="p-4 rounded-xl bg-bg-primary/60 backdrop-blur-sm border border-black/5 dark:border-white/10 space-y-1">
                  <span className="font-bold text-text-primary block">Menores de 14 años</span>
                  <p className="text-text-secondary font-medium">
                    Tienen terminantemente prohibido registrarse o facilitar datos personales sin la previa autorización expresa y verificable de sus padres o tutores legales.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-bg-primary/60 backdrop-blur-sm border border-black/5 dark:border-white/10 space-y-1">
                  <span className="font-bold text-text-primary block">Verificación y Supresión Inmediata</span>
                  <p className="text-text-secondary font-medium">
                    Toda cuenta registrada por un menor de 14 años sin autorización acreditada será bloqueada y eliminada de forma permanente junto a todos sus datos (Art. 17 RGPD).
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Información General y Titularidad */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-accent" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  1. Información General y Titularidad
                </h2>
              </div>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                En cumplimiento de las obligaciones de información establecidas en el artículo 10 de la Ley 34/2002 (LSSI-CE), se hace constar que la titularidad de la plataforma Pro Fitness Glass corresponde a:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm sm:text-base font-medium text-text-secondary pl-2">
                <li><strong className="text-text-primary">Titular responsable:</strong> Dylan Jesús Suárez Gómez.</li>
                <li><strong className="text-text-primary">Denominación del servicio:</strong> Pro Fitness Glass.</li>
                <li><strong className="text-text-primary">Correo electrónico de contacto y soporte:</strong> <a href="mailto:profitnessglass@gmail.com" className="text-accent underline font-bold">profitnessglass@gmail.com</a></li>
                <li><strong className="text-text-primary">Actividad principal:</strong> Aplicación informática para la gestión de rutinas, seguimiento deportivo de hipertrofia y fuerza, calculadora de marcas (1RM) y diario nutricional.</li>
              </ul>
            </section>

            {/* 2. Capacidad Legal y Garantías del Usuario */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-accent" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  2. Declaración de Capacidad Legal y Veracidad
                </h2>
              </div>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                Al crear una cuenta, iniciar sesión o interactuar con las herramientas de la plataforma, el usuario manifiesta, declara y garantiza formalmente bajo su exclusiva responsabilidad que:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm sm:text-base font-medium text-text-secondary pl-2">
                <li>Cuenta con al menos <strong className="text-text-primary">14 años de edad cumplidos</strong> a la fecha del registro.</li>
                <li>Dispone de la capacidad jurídica y de obrar suficiente para celebrar contratos vinculantes conforme al ordenamiento jurídico aplicable.</li>
                <li>Toda la información facilitada durante el registro y uso (nombre, edad, métricas corporales y datos de contacto) es veraz, exacta, vigente y auténtica.</li>
                <li>Se compromete a mantener la confidencialidad de su contraseña y claves de acceso, asumiendo la responsabilidad íntegra por las actividades desarrolladas desde su cuenta personal.</li>
              </ol>
            </section>

            {/* 3. Exención de Responsabilidad Médica y Salud Deportiva */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <HeartPulse size={20} className="text-accent" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  3. Exención de Responsabilidad Médica y Salud Deportiva
                </h2>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-text-secondary text-sm sm:text-base font-medium space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-500">
                  <AlertTriangle size={18} />
                  <span>Aviso Importante sobre Salud y Actividad Física</span>
                </div>
                <p className="leading-relaxed">
                  Pro Fitness Glass es una herramienta de software destinada exclusivamente al registro deportivo personal. <strong className="text-text-primary">En ningún caso sustituye el diagnóstico, prescripción médica o supervisión facultativa</strong>.
                </p>
                <p className="leading-relaxed">
                  El entrenamiento con sobrecarga, cálculo de 1RM, levantamiento de peso y ajuste calórico conllevan exigencias físicas. El usuario asume voluntariamente el riesgo de su actividad deportiva. Se recomienda encarecidamente consultar con un médico antes de iniciar programas de esfuerzo intensivo, con especial atención a menores de edad (14 a 17 años) en etapas de desarrollo óseo y muscular.
                </p>
              </div>
            </section>

            {/* 4. Uso Aceptable y Normas de la Comunidad */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <Dumbbell size={20} className="text-accent" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  4. Uso Aceptable de la Plataforma
                </h2>
              </div>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                El usuario se compromete a hacer un uso adecuado, ético y diligente de la aplicación. Queda expresamente prohibido:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm sm:text-base font-medium text-text-secondary pl-2">
                <li>Utilizar la plataforma para fines ilícitos, fraudulentos o contrarios al orden público y a la moral.</li>
                <li>Publicar o compartir contenido en historias o comunidad que resulte ofensivo, difamatorio, de odio, violento o lesivo para los derechos de terceros o de menores.</li>
                <li>Introducir virus, código malicioso o realizar ataques de denegación de servicio que afecten a la disponibilidad de la plataforma.</li>
                <li>Intentar vulnerar los mecanismos de autenticación, ingeniería inversa o recopilar datos de otros usuarios sin autorización.</li>
              </ul>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed pt-1">
                Pro Fitness Glass se reserva el derecho de suspender o cancelar de forma inmediata y sin previo aviso las cuentas que infrinjan estas normas.
              </p>
            </section>

            {/* 5. Privacidad y Protección de Datos */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <Lock size={20} className="text-accent" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  5. Privacidad y Protección de Datos (RGPD)
                </h2>
              </div>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                El tratamiento de los datos personales se efectúa con estricto apego al RGPD y la LOPDGDD, según se detalla en nuestra <a href="/privacy" className="text-accent underline font-bold inline-flex items-center gap-1">Política de Privacidad <ExternalLink size={12} /></a>. El usuario dispone en todo momento del derecho de acceso, rectificación, portabilidad (descarga de historial en Excel/CSV/JSON) y supresión total (eliminación instantánea de cuenta desde el Perfil).
              </p>
            </section>

            {/* 6. Relación con Entrenadores Personales */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-accent" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  6. Relación con Entrenadores Personales
                </h2>
              </div>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                Si decides vincular tu cuenta con un entrenador personal dentro de la plataforma, aceptas compartir con dicho profesional tu historial de progreso (rutinas, pesos, nutrición y evolución física). Pro Fitness Glass garantiza que estos datos se conservan en un entorno seguro y confidencial, no transmitiéndose a terceros fuera del ámbito de dicha relación de asesoramiento deportivo.
              </p>
            </section>

            {/* 7. Propiedad Intelectual */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <Scale size={20} className="text-accent" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  7. Propiedad Intelectual
                </h2>
              </div>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                Todos los elementos constitutivos de Pro Fitness Glass, incluyendo software, código fuente, algoritmos, logotipos, marcas comerciales, bases de datos de ejercicios, textos, diseño gráfico y elementos visuales están protegidos por las leyes de propiedad intelectual e industrial, perteneciendo en exclusiva a su titular. Queda prohibida su reproducción o explotación sin autorización expresa.
              </p>
            </section>

            {/* 8. Modificaciones y Legislación Aplicable */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-accent" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                  8. Modificaciones, Ley Aplicable y Jurisdicción
                </h2>
              </div>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                Nos reservamos el derecho de actualizar o modificar los presentes Términos del Servicio para adaptarlos a novedades normativas, jurisprudenciales o técnicas. La versión vigente estará siempre accesible públicamente en este apartado.
              </p>
              <p className="text-sm sm:text-base font-medium text-text-secondary leading-relaxed">
                Los presentes Términos se rigen en todos y cada uno de sus extremos por la <strong className="text-text-primary">legislación española y el Derecho de la Unión Europea</strong>. Para la resolución de cualquier controversia o litigio, las partes se someten a los juzgados y tribunales competentes conforme a la normativa vigente en materia de consumidores y usuarios.
              </p>
            </section>
          </div>
        </GlassCard>

        <div className="mt-12 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest text-text-tertiary opacity-60">
          © 2026 Pro Fitness Glass · Todos los derechos reservados
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
