/* frontend/src/pages/AboutUsPage.jsx */
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, 
  Dumbbell, 
  HeartHandshake, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Flame, 
  Timer, 
  MapPin, 
  Layers, 
  CheckCircle2, 
  Award,
  ChevronRight,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import MaintenanceNoticeBanner from '../components/MaintenanceNoticeBanner';
import useAppStore from '../store/useAppStore';

export default function AboutUsPage() {
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
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': 'https://pro-fitness-glass.zeabur.app/sobre-nosotros#webpage',
        url: 'https://pro-fitness-glass.zeabur.app/sobre-nosotros',
        name: '¿Qué es Pro Fitness Glass? — Quiénes Somos, Misión y Plataforma Fitness',
        description: 'Conoce la historia, tecnología y filosofía 100% gratuita detrás de Pro Fitness Glass, la app de entrenamiento de gimnasio, hipertrofia y nutrición con diseño Glassmorphism e IA.',
        inLanguage: 'es'
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Pro Fitness Glass',
        applicationCategory: 'HealthApplication',
        operatingSystem: 'Android, Web Browser, Windows, macOS, iOS',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR'
        },
        description: 'Aplicación de entrenamiento y nutrición para gimnasio 100% gratuita con sobrecarga progresiva, vídeos de técnica, animaciones anatómicas, temporizador nativo en segundo plano y asistente de IA Synapse.',
        author: {
          '@type': 'Person',
          name: 'Dylan Jesús Suárez Gómez',
          jobTitle: 'Fundador y Desarrollador Principal'
        }
      },
      {
        '@type': 'Organization',
        name: 'Pro Fitness Glass',
        url: 'https://pro-fitness-glass.zeabur.app',
        logo: 'https://pro-fitness-glass.zeabur.app/icons/icon-512.png',
        founder: {
          '@type': 'Person',
          name: 'Dylan Jesús Suárez Gómez'
        },
        sameAs: [
          'https://play.google.com/store/apps/details?id=com.profitnessglass.app'
        ]
      }
    ]
  };

  const modules = [
    {
      icon: <Dumbbell className="text-emerald-400" size={24} />,
      title: 'Entrenamiento y Sobrecarga Progresiva',
      description: 'Registro serie a serie con carga (kg), repeticiones y Repeticiones en Reserva (RIR/RPE). Comparativa histórica automática contra tu sesión previa para asegurar el estímulo óptimo de hipertrofia y fuerza.'
    },
    {
      icon: <Layers className="text-sky-400" size={24} />,
      title: 'Guía Biomecánica en Vídeo y Animación 3D',
      description: 'Más de 300 ejercicios de musculación clasificados por grupo muscular, con clips en alta definición y animaciones anatómicas que enseñan la trayectoria óptima y previenen lesiones articulares.'
    },
    {
      icon: <Sparkles className="text-purple-400" size={24} />,
      title: 'Entrenador con Inteligencia Artificial (Synapse)',
      description: 'Asistencia inteligente personalizada para responder dudas sobre técnica biomecánica, recomendar variantes de ejercicios y estructurar el volumen de entrenamiento según tu fatiga acumulada.'
    },
    {
      icon: <Timer className="text-amber-400" size={24} />,
      title: 'Temporizador Nativo en Segundo Plano',
      description: 'Cronómetro inteligente con servicio en primer plano y notificaciones flotantes en Android. Mantiene la cuenta atrás exacta con la pantalla bloqueada o mientras usas otras apps.'
    },
    {
      icon: <Flame className="text-rose-400" size={24} />,
      title: 'Nutrición y Calculadoras Deportivas',
      description: 'Cálculo de Tasa Metabólica Basal (TMB) y Gasto Energético Total Diario (TDEE) con la ecuación científica de Mifflin-St Jeor. Planificación de déficit, superávit, macronutrientes, hidratación y creatina.'
    },
    {
      icon: <MapPin className="text-teal-400" size={24} />,
      title: 'Radar y Mapa de Gimnasios',
      description: 'Herramienta de geolocalización en tiempo real para encontrar salas de musculación, centros de calistenia y gimnasios cercanos con información de servicios y ubicación directa.'
    },
    {
      icon: <Award className="text-yellow-400" size={24} />,
      title: 'Gamificación y Temas de Cristal Líquido',
      description: 'Niveles de experiencia (XP), avatares desbloqueables y temas visuales personalizables con estética Glassmorphism, incluyendo el diseño dinámico Aurora Boreal Nivel 20.'
    },
    {
      icon: <HeartHandshake className="text-indigo-400" size={24} />,
      title: 'Red Social Deportiva y Modo Entrenador',
      description: 'Comparte tus rutinas con enlaces web universales de un solo clic. Permite a entrenadores personales supervisar de forma privada los pesos, repeticiones y fotos de evolución de sus atletas.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary text-text-primary overflow-y-auto overflow-x-hidden custom-scrollbar">
      <Helmet>
        <title>¿Qué es Pro Fitness Glass? — Quiénes Somos, Misión y App de Gimnasio 100% Gratis</title>
        <meta
          name="description"
          content="Descubre qué es Pro Fitness Glass, la plataforma de gimnasio 100% gratuita creada por Dylan Jesús Suárez Gómez con sobrecarga progresiva, vídeos biomecánicos, IA Synapse y estética Glassmorphism sin suscripciones de pago."
        />
        <meta
          name="keywords"
          content="que es pro fitness glass, quienes somos pro fitness glass, app gimnasio gratis, mejor app fitness gratuita, tracker gimnasio sobrecarga progresiva, app pesas sin suscripcion, dylan jesus suarez gomez, synapse ia fitness"
        />
        <link rel="canonical" href="https://pro-fitness-glass.zeabur.app/sobre-nosotros" />
        <meta property="og:title" content="¿Qué es Pro Fitness Glass? — Quiénes Somos y Misión" />
        <meta
          property="og:description"
          content="La plataforma libre definitiva para registrar tus entrenamientos de fuerza, hipertrofia y nutrición deportiva. 100% gratis, sin muros de pago."
        />
        <meta property="og:url" content="https://pro-fitness-glass.zeabur.app/sobre-nosotros" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://pro-fitness-glass.zeabur.app/aver.jpg" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10" style={{ paddingTop: 'calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 1.5rem)' }}>
        <MaintenanceNoticeBanner className="rounded-2xl mb-6" />

        {/* Barra superior de navegación */}
        <nav aria-label="Navegación principal de la página" className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 rounded-full text-text-secondary font-bold hover:text-text-primary transition-all active:scale-95 text-sm"
          >
            <ArrowLeft size={16} />
            <span>Volver</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
            <Link to="/faq" className="px-3.5 py-1.5 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center gap-1.5">
              <HelpCircle size={14} />
              <span>Preguntas Frecuentes (FAQ)</span>
            </Link>
            <Link to="/noticias" className="hidden sm:inline-block px-3.5 py-1.5 rounded-full bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary transition-colors">
              Guías y Artículos
            </Link>
          </div>
        </nav>

        {/* Cabecera / Hero de presentación */}
        <header className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Software 100% Gratuito y de Alto Rendimiento
          </div>
          
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-text-primary tracking-tight leading-tight mb-6">
            Entrenamiento de Fuerza Real.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-400 to-accent">
              Sin Muros de Pago ni Trampas.
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-text-secondary leading-relaxed">
            <strong>Pro Fitness Glass</strong> es la plataforma integral de entrenamiento de musculación, hipertrofia, nutrición y comunidad deportiva diseñada con estética <em>Glassmorphism</em>. Creada para democratizar la ciencia del fitness y devolver a los atletas una herramienta libre, rápida y rigurosa.
          </p>
        </header>

        {/* Tarjeta de Filosofía: ¿Por qué nació? */}
        <section aria-labelledby="mision-title" className="mb-14 p-6 sm:p-10 rounded-3xl bg-bg-secondary/40 border border-glass-border backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-accent/15 text-accent">
              <HeartHandshake size={28} />
            </div>
            <div>
              <span className="text-xs font-bold text-accent uppercase tracking-wider">Nuestra Filosofía</span>
              <h2 id="mision-title" className="text-2xl sm:text-3xl font-extrabold text-text-primary">
                Por Qué Nació Pro Fitness Glass
              </h2>
            </div>
          </div>

          <div className="space-y-4 text-text-secondary text-sm sm:text-base leading-relaxed">
            <p>
              En los últimos años, la industria de las aplicaciones de fitness ha tomado un rumbo perjudicial para los deportistas: aplicaciones populares como <em>Hevy</em> o <em>Strong</em> cobran entre <strong>10 € y 15 € al mes</strong> por funciones tan básicas como guardar más de 3 o 4 rutinas, ver tus marcas históricas completas o usar un temporizador de descanso sin publicidad agresiva.
            </p>
            <p>
              Creemos firmemente que el acceso a herramientas de salud, registro de fuerza y educación biomecánica debe ser universal. <strong>Pro Fitness Glass nació con un principio innegociable: todas las herramientas principales son y seguirán siendo 100% gratuitas</strong>. Sin suscripciones obligatorias, sin funciones esenciales bloqueadas y sin comprometer jamás la privacidad de tus datos.
            </p>
          </div>
        </section>

        {/* Sección de Módulos y Características */}
        <section aria-labelledby="caracteristicas-title" className="mb-14">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Arsenal Deportivo</span>
            <h2 id="caracteristicas-title" className="text-2xl sm:text-4xl font-extrabold text-text-primary mt-1">
              ¿Qué Incluye Nuestra Plataforma?
            </h2>
            <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto mt-2">
              Todo lo necesario para progresar en el gimnasio desde el primer día, centralizado en una única aplicación.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {modules.map((mod, idx) => (
              <article key={idx} className="p-6 rounded-2xl bg-bg-secondary/30 border border-glass-border hover:border-accent/40 transition-all backdrop-blur-lg flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-black/10 dark:bg-white/5 flex items-center justify-center mb-4 border border-glass-border">
                    {mod.icon}
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">
                    {mod.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Tabla Comparativa: Pro Fitness Glass vs Apps Tradicionales */}
        <section aria-labelledby="comparativa-title" className="mb-14 p-6 sm:p-10 rounded-3xl bg-bg-secondary/40 border border-glass-border backdrop-blur-xl">
          <h2 id="comparativa-title" className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-3 text-center">
            ¿En Qué Nos Diferenciamos?
          </h2>
          <p className="text-center text-sm text-text-secondary max-w-2xl mx-auto mb-8">
            Compara objetivamente lo que ofrece Pro Fitness Glass frente a las alternativas tradicionales del mercado.
          </p>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-glass-border text-text-secondary font-bold">
                  <th className="py-3 px-4">Característica</th>
                  <th className="py-3 px-4 text-emerald-400 font-extrabold">Pro Fitness Glass</th>
                  <th className="py-3 px-4 text-text-tertiary">Otras Apps (Hevy, Strong...)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border text-text-secondary">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">Rutinas Guardadas</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">Ilimitadas y Gratuitas</td>
                  <td className="py-3.5 px-4">Límite de 3 o 4 en versión gratis</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">Historial y Gráficos</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">Historial Completo de por Vida</td>
                  <td className="py-3.5 px-4">Capado a 3 meses si no pagas</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">Vídeos de Técnica y 3D</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">Vídeo HD + Animación Anatómica</td>
                  <td className="py-3.5 px-4">Gifs simples o estáticos</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">Temporizador Flotante</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">Nativo en Segundo Plano (Android)</td>
                  <td className="py-3.5 px-4">Se corta si bloqueas o sales</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">Inteligencia Artificial</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">Synapse IA Integrada</td>
                  <td className="py-3.5 px-4">No disponible o con pago mensual</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">Calculadoras Científicas</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">1RM (Epley/Brzycki) + Macros TDEE</td>
                  <td className="py-3.5 px-4">Requiere apps adicionales</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Quién está detrás / Autor */}
        <section aria-labelledby="creador-title" className="mb-14 p-6 sm:p-10 rounded-3xl bg-bg-secondary/40 border border-glass-border backdrop-blur-xl flex flex-col md:flex-row items-center gap-8">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden shrink-0 border-2 border-accent/40 shadow-xl bg-bg-primary">
            <img 
              src="/icons/icon-256.png" 
              alt="Pro Fitness Glass Logo" 
              className="w-full h-full object-cover p-2"
              loading="lazy"
            />
          </div>

          <div>
            <span className="text-xs font-bold text-accent uppercase tracking-wider">Creador y Desarrollador</span>
            <h2 id="creador-title" className="text-2xl sm:text-3xl font-extrabold text-text-primary mt-1 mb-3">
              Dylan Jesús Suárez Gómez
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-4">
              Apasionado del entrenamiento de fuerza, la biomecánica deportiva y la ingeniería de software moderna. Pro Fitness Glass fue concebida y desarrollada desde cero con la visión de combinar tecnología punta (React, Vite, Capacitor nativo, arquitectura PWA) con el respeto total hacia la comunidad del gimnasio.
            </p>
            <div className="flex items-center gap-3 flex-wrap text-xs text-text-secondary font-semibold">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-glass-border">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Desarrollo Independiente
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-glass-border">
                <ShieldCheck size={14} className="text-sky-400" />
                Privacidad y 2FA
              </span>
            </div>
          </div>
        </section>

        {/* Llamada a la acción final */}
        <section className="text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-accent/20 via-bg-secondary/60 to-emerald-500/10 border border-accent/30 shadow-2xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary mb-4">
            ¿Listo para llevar tu entrenamiento al siguiente nivel?
          </h2>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto mb-8">
            Únete a Pro Fitness Glass hoy mismo. Regístrate en segundos y empieza a registrar tus marcas de forma gratuita.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              className="w-full sm:w-auto px-8 py-3.5 bg-accent text-white font-extrabold rounded-2xl hover:brightness-110 shadow-lg shadow-accent/25 active:scale-95 transition-all text-sm sm:text-base"
            >
              {isAuthenticated ? 'Ir a mi Panel de Entrenamiento' : 'Crear Cuenta Gratis'}
            </button>
            <Link
              to="/faq"
              className="w-full sm:w-auto px-6 py-3.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-glass-border text-text-primary font-bold rounded-2xl transition-all text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <span>Ver Preguntas Frecuentes (FAQ)</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </section>

        {/* Pie de página con enlaces SEO */}
        <footer className="mt-12 text-center text-xs text-text-tertiary space-y-3">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/calculadora-1rm" className="hover:text-accent transition-colors">Calculadora 1RM</Link>
            <span>•</span>
            <Link to="/calculadora-calorias-macros" className="hover:text-accent transition-colors">Calculadora de Macros</Link>
            <span>•</span>
            <Link to="/ejercicios" className="hover:text-accent transition-colors">Ejercicios de Gimnasio</Link>
            <span>•</span>
            <Link to="/noticias" className="hover:text-accent transition-colors">Artículos Deportivos</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-accent transition-colors">Privacidad</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-accent transition-colors">Términos</Link>
          </div>
          <p>© 2026 Pro Fitness Glass — Desarrollado por Dylan Jesús Suárez Gómez. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
}
