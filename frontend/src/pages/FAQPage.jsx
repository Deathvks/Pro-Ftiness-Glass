/* frontend/src/pages/FAQPage.jsx */
import React, { useState, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  FaArrowLeft, 
  FaMagnifyingGlass, 
  FaCircleQuestion, 
  FaChevronDown, 
  FaCircleInfo
} from 'react-icons/fa6';
import MaintenanceNoticeBanner from '../components/MaintenanceNoticeBanner';
import PublicPageFooter from '../components/PublicPageFooter';
import useAppStore from '../store/useAppStore';
import { supportEmail } from '../config/mailContacts';

const FAQ_DATA = [
  {
    category: 'general',
    categoryLabel: 'General y Gratuidad',
    question: '¿Pro Fitness Glass es realmente gratis o tiene costos ocultos?',
    answer: 'Pro Fitness Glass es 100% gratuita. Todas las funciones —creación ilimitada de rutinas, historial completo de por vida, vídeos biomecánicos, animaciones 3D, cronómetro en segundo plano, calculadoras de 1RM y macros, e IA Synapse— están desbloqueadas sin cuotas de suscripción mensual ni muros de pago.'
  },
  {
    category: 'general',
    categoryLabel: 'General y Gratuidad',
    question: '¿En qué plataformas y dispositivos puedo utilizar la aplicación?',
    answer: 'Puedes utilizarla en cualquier dispositivo: dispones de una aplicación nativa para Android en Google Play Store y de una Progressive Web App (PWA) de alto rendimiento compatible con navegadores de escritorio (Windows, macOS, Linux) y dispositivos móviles iOS (iPhone/iPad).'
  },
  {
    category: 'general',
    categoryLabel: 'General y Gratuidad',
    question: '¿Cómo descargo e instalo la app en mi teléfono Android?',
    answer: 'Puedes descargarla directamente desde Google Play Store buscando "Pro Fitness Glass" o a través del botón oficial en nuestra página de inicio. También puedes instalarla como acceso directo PWA desde Chrome abriendo el menú y seleccionando "Añadir a la pantalla de inicio".'
  },
  {
    category: 'training',
    categoryLabel: 'Entrenamiento y Rutinas',
    question: '¿Cómo funciona el registro de series y la sobrecarga progresiva?',
    answer: 'En cada ejercicio puedes registrar la carga en kilogramos, repeticiones y Repeticiones en Reserva (RIR o RPE). Pro Fitness Glass compara de forma automática cada serie con tu registro histórico previo y te indica cuándo batir una marca, ayudándote a aplicar sobrecarga progresiva técnica en cada entrenamiento.'
  },
  {
    category: 'training',
    categoryLabel: 'Entrenamiento y Rutinas',
    question: '¿El temporizador de descanso sigue funcionando con la pantalla bloqueada?',
    answer: 'Sí. En la aplicación de Android disponemos de un servicio nativo en primer plano con notificación interactiva. El temporizador continúa con precisión absoluta aunque apagues la pantalla o cambies a reproducir música u otra aplicación, notificándote con sonido o vibración al terminar el descanso.'
  },
  {
    category: 'training',
    categoryLabel: 'Entrenamiento y Rutinas',
    question: '¿Cómo puedo alternar entre vídeo y animación 3D en un ejercicio?',
    answer: 'Al pulsar sobre cualquier ejercicio durante tu sesión o en la enciclopedia de ejercicios, verás un selector que te permite alternar al instante entre el vídeo en alta definición con ejecución de un atleta real y la animación anatómica 3D que resalta los músculos agonistas y sinergistas.'
  },
  {
    category: 'training',
    categoryLabel: 'Entrenamiento y Rutinas',
    question: '¿Puedo compartir mis rutinas con amigos o clientes?',
    answer: 'Sí. Cada rutina dispone de un botón para generar un enlace web público compartido (del tipo /share/routine/:id). Cualquier persona que reciba el enlace puede visualizar la rutina completa con sus series y descansos e importarla a su cuenta con un solo clic.'
  },
  {
    category: 'tech',
    categoryLabel: 'Nutrición e IA',
    question: '¿Qué es el Asistente de IA Synapse y en qué me ayuda?',
    answer: 'Synapse es el asistente inteligente especializado en ciencias del deporte integrado en Pro Fitness Glass. Puedes consultarle dudas sobre cómo realizar un ejercicio, sustituciones seguras por molestias articulares, pautas de recuperación y recomendaciones de volumen según tu fatiga acumulada.'
  },
  {
    category: 'tech',
    categoryLabel: 'Nutrición e IA',
    question: '¿Qué fórmulas científicas utiliza la calculadora de 1RM y macros?',
    answer: 'Para calcular el 1RM (Repetición Máxima) combinamos las ecuaciones científicas de Epley, Brzycki y Lander para ofrecer una media ponderada precisa y sin riesgo lesivo. Para nutrición, empleamos la fórmula de Mifflin-St Jeor para calcular el TMB y el gasto energético total (TDEE), desglosando proteínas (1.8-2.2 g/kg), grasas saludables e hidratos.'
  },
  {
    category: 'security',
    categoryLabel: 'Cuenta y Seguridad',
    question: '¿Mis datos se sincronizan en la nube y están seguros?',
    answer: 'Sí. Todo tu historial de marcas personales (PRs), peso corporal, series y notas se almacena de forma segura en nuestros servidores con cifrado en tránsito SSL/TLS. Puedes cambiar de móvil o acceder desde el ordenador sin perder ni una sola repetición.'
  },
  {
    category: 'security',
    categoryLabel: 'Cuenta y Seguridad',
    question: '¿Cómo funciona la autenticación de doble factor (2FA)?',
    answer: 'Puedes activar la verificación en dos pasos (2FA) desde los ajustes de seguridad de tu cuenta. Te permite añadir una capa extra de protección mediante códigos temporales enviados por correo o generados con aplicaciones TOTP (como Google Authenticator).'
  },
  {
    category: 'general',
    categoryLabel: 'General y Gratuidad',
    question: '¿En qué se diferencia Pro Fitness Glass de apps como Hevy o Strong?',
    answer: 'La diferencia principal radica en la libertad del usuario: no limitamos el número de rutinas (en Hevy gratis solo puedes guardar 3 o 4), no bloqueamos tu historial pasado a 3 meses, incluimos vídeos y 3D en cada ejercicio, temporizador nativo en segundo plano, calculadoras deportivas e IA, todo sin cobrarte 10 € a 15 € mensuales.'
  },
  {
    category: 'training',
    categoryLabel: 'Entrenamiento y Rutinas',
    question: '¿Cómo funciona el modo entrenador y asesoría personal?',
    answer: 'Si trabajas con un entrenador personal registrado en Pro Fitness Glass, puedes vincular tu cuenta con él mediante un código o invitación. Tu entrenador podrá asignarte rutinas personalizadas, monitorizar tus cargas en directo y darte feedback sobre tu evolución de forma totalmente confidencial.'
  },
  {
    category: 'tech',
    categoryLabel: 'Android y Tecnología',
    question: '¿Se puede utilizar la aplicación sin conexión a internet (offline)?',
    answer: 'Sí. Gracias a la tecnología Progressive Web App (PWA) y el almacenamiento local seguro de datos, puedes abrir la aplicación y consultar tus rutinas guardadas incluso si estás en un sótano o sala de pesas con poca cobertura.'
  },
  {
    category: 'general',
    categoryLabel: 'General y Gratuidad',
    question: '¿Quién ha desarrollado Pro Fitness Glass y cuál es el contacto oficial?',
    answer: `Pro Fitness Glass ha sido creada y desarrollada de forma independiente por Dylan Jesús Suárez Falcón, con la misión de democratizar la salud deportiva. Puedes contactar con soporte desde la plataforma o por correo en ${supportEmail}.`
  }
];

const CATEGORIES = [
  { id: 'all', label: 'Todas las Preguntas' },
  { id: 'general', label: 'General y Gratuidad' },
  { id: 'training', label: 'Entrenamientos y Rutinas' },
  { id: 'tech', label: 'Nutrición e IA' },
  { id: 'security', label: 'Cuenta y Seguridad' }
];

export default function FAQPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openIndices, setOpenIndices] = useState(new Set([0, 1])); // Primeras dos abiertas por defecto

  const categoriesRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragInfoRef = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false });

  const handleMouseDown = (e) => {
    if (!categoriesRef.current) return;
    dragInfoRef.current = {
      isDown: true,
      startX: e.pageX - categoriesRef.current.offsetLeft,
      scrollLeft: categoriesRef.current.scrollLeft,
      moved: false
    };
    setIsDragging(true);
  };

  const handleMouseLeave = () => {
    dragInfoRef.current.isDown = false;
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    dragInfoRef.current.isDown = false;
    setTimeout(() => {
      setIsDragging(false);
      dragInfoRef.current.moved = false;
    }, 50);
  };

  const handleMouseMove = (e) => {
    if (!dragInfoRef.current.isDown || !categoriesRef.current) return;
    const x = e.pageX - categoriesRef.current.offsetLeft;
    const walk = x - dragInfoRef.current.startX;
    if (Math.abs(walk) > 4) {
      dragInfoRef.current.moved = true;
    }
    categoriesRef.current.scrollLeft = dragInfoRef.current.scrollLeft - walk;
  };

  const handleWheel = (e) => {
    if (categoriesRef.current && (e.deltaY !== 0 || e.deltaX !== 0)) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        categoriesRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  const handleCategoryClick = (catId) => {
    if (dragInfoRef.current.moved) return;
    setSelectedCategory(catId);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(isAuthenticated ? '/dashboard' : '/');
    }
  };

  const toggleAccordion = (index) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const filteredFAQs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return FAQ_DATA.filter((faq) => {
      const matchCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      const matchQuery =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.categoryLabel.toLowerCase().includes(query);
      return matchCategory && matchQuery;
    });
  }, [searchQuery, selectedCategory]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATA.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary text-text-primary overflow-y-auto overflow-x-hidden custom-scrollbar">
      <Helmet>
        <title>Preguntas Frecuentes (FAQ) sobre Pro Fitness Glass | Dudas y Respuestas Oficiales</title>
        <meta
          name="description"
          content="Respuestas oficiales a todas las dudas sobre Pro Fitness Glass: gratuidad, rutinas ilimitadas, app Android en Play Store, IA Synapse, cálculo de 1RM y sincronización en la nube."
        />
        <meta
          name="keywords"
          content="faq pro fitness glass, preguntas frecuentes gimnasio app, pro fitness glass gratis o pago, como funciona pro fitness glass, descargar pro fitness glass android, tracker fitness gratis"
        />
        <link rel="canonical" href="https://pro-fitness-glass.zeabur.app/faq" />
        <meta property="og:title" content="Preguntas Frecuentes (FAQ) — Pro Fitness Glass" />
        <meta
          property="og:description"
          content="Todo lo que necesitas saber sobre la plataforma libre de gimnasio, nutrición y sobrecarga progresiva Pro Fitness Glass."
        />
        <meta property="og:url" content="https://pro-fitness-glass.zeabur.app/faq" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10" style={{ paddingTop: 'calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 1.5rem)' }}>
        <MaintenanceNoticeBanner className="rounded-2xl mb-6" />

        {/* Navegación superior */}
        <nav aria-label="Navegación principal de FAQ" className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 rounded-full text-text-secondary font-bold hover:text-text-primary transition-all active:scale-95 text-sm"
          >
            <FaArrowLeft size={14} />
            <span>Volver</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
            <Link to="/sobre-nosotros" className="px-3.5 py-1.5 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center gap-1.5">
              <FaCircleInfo size={14} />
              <span>¿Quiénes Somos?</span>
            </Link>
            <Link to="/noticias" className="hidden sm:inline-block px-3.5 py-1.5 rounded-full bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary transition-colors">
              Guías Técnicas
            </Link>
          </div>
        </nav>

        {/* Encabezado */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold text-xs uppercase tracking-wider mb-4">
            <FaCircleQuestion size={14} />
            <span>Centro de Ayuda y Respuestas Oficiales</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-text-primary tracking-tight leading-tight mb-4">
            Preguntas Frecuentes (FAQ)
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-text-secondary leading-relaxed">
            Encuentra respuestas claras e inmediatas sobre el funcionamiento de Pro Fitness Glass, nuestra política de gratuidad, herramientas científicas y características técnicas.
          </p>
        </header>

        {/* Buscador de Preguntas */}
        <div className="relative mb-6">
          <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar duda (ej: ¿es gratis?, temporizador, 1RM, Android, rutinas...)"
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-bg-secondary/50 border border-glass-border focus:border-accent text-text-primary placeholder:text-text-tertiary text-sm sm:text-base outline-none transition-all shadow-inner backdrop-blur-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-tertiary hover:text-text-primary px-2 py-1 bg-black/10 dark:bg-white/10 rounded-lg"
            >
              Borrar
            </button>
          )}
        </div>

        {/* Pestañas de categorías */}
        <div
          ref={categoriesRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onWheel={handleWheel}
          className={`flex items-center gap-2 overflow-x-auto py-1.5 mb-8 hide-scrollbar scrollbar-none sm:flex-wrap select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab sm:cursor-default'
          }`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`faq-tab-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors border outline-none select-none !transform-none !translate-y-0 hover:!translate-y-0 active:!translate-y-0 hover:!transform-none active:!transform-none ${
                selectedCategory === cat.id
                  ? 'bg-accent text-white border-accent shadow-sm'
                  : 'bg-bg-secondary/40 text-text-secondary border-glass-border hover:text-text-primary hover:bg-black/10 dark:hover:bg-white/10 hover:border-glass-border/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lista de Acordeones */}
        {filteredFAQs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-bg-secondary/30 border border-glass-border text-text-secondary my-8">
            <FaCircleQuestion size={36} className="mx-auto text-text-tertiary mb-3" />
            <h3 className="text-base font-bold text-text-primary mb-1">No encontramos preguntas para esa búsqueda</h3>
            <p className="text-xs text-text-secondary">Prueba con palabras como "gratis", "rutinas", "1RM", "Android" o borra el filtro.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 mb-12">
            {filteredFAQs.map((faq, index) => {
              const isOpen = openIndices.has(index);
              return (
                <article
                  key={index}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden backdrop-blur-md ${
                    isOpen
                      ? 'bg-bg-secondary/60 border-accent/40 shadow-lg'
                      : 'bg-bg-secondary/30 border-glass-border hover:border-glass-border/80'
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    aria-expanded={isOpen}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 outline-none select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      <h2 className="text-sm sm:text-base font-bold text-text-primary tracking-tight">
                        {faq.question}
                      </h2>
                    </div>
                    <div className={`p-1.5 rounded-lg text-text-secondary transition-transform shrink-0 ${isOpen ? 'rotate-180 text-accent' : ''}`}>
                      <FaChevronDown size={14} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-glass-border/40 animate-[fade-in_0.2s_ease-out]">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Caja de ayuda adicional */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-bg-secondary/60 via-bg-secondary/40 to-accent/10 border border-glass-border text-center backdrop-blur-xl">
          <FaCircleQuestion size={32} className="mx-auto text-accent mb-3" />
          <h2 className="text-xl sm:text-2xl font-black text-text-primary mb-2">
            ¿Tienes alguna otra duda o propuesta?
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary max-w-lg mx-auto mb-6">
            Pro Fitness Glass está en evolución constante y escuchamos directamente a nuestra comunidad de atletas para seguir añadiendo mejoras.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/sobre-nosotros"
              className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs sm:text-sm hover:brightness-110 shadow-md shadow-accent/25 transition-all"
            >
              Conocer al Creador y Misión
            </Link>
            <button
              onClick={() => navigate(isAuthenticated ? '/support' : '/login')}
              className="px-5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-glass-border font-bold text-xs sm:text-sm text-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-all"
            >
              Contactar Soporte
            </button>
          </div>
        </section>

        <PublicPageFooter />
      </div>
    </div>
  );
}
