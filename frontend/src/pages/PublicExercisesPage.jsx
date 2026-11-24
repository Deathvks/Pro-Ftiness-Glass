import MaintenanceNoticeBanner from '../components/MaintenanceNoticeBanner';
import PublicPageFooter from '../components/PublicPageFooter';
/* frontend/src/pages/PublicExercisesPage.jsx */
import React, { useState, useMemo, useEffect } from 'react';
import { trackExercisesPageVisit } from '../utils/newsTracker';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FaDumbbell,
  FaChevronLeft,
  FaMagnifyingGlass,
  FaCircleCheck,
  FaTriangleExclamation,
  FaCalculator,
  FaUtensils,
  FaNewspaper,
  FaArrowRight,
  FaLayerGroup,
  FaBolt,
  FaStopwatch
} from 'react-icons/fa6';
import useAppStore from '../store/useAppStore';
import { MUSCLE_GROUPS, PUBLIC_EXERCISES, PUBLIC_ROUTINES } from '../data/fitnessCatalog';

export default function PublicExercisesPage({ onBack }) {
  const navigate = useNavigate();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  useEffect(() => {
    trackExercisesPageVisit();
  }, []);

  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = useMemo(() => {
    return PUBLIC_EXERCISES.filter((ex) => {
      const matchesGroup = selectedMuscle === 'Todos' || ex.muscleGroup === selectedMuscle;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        ex.secondaryMuscles.toLowerCase().includes(q);
      return matchesGroup && matchesSearch;
    });
  }, [selectedMuscle, searchQuery]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Guía de Ejercicios de Gimnasio y Rutinas de Hipertrofia | Pro Fitness Glass',
        url: 'https://profitnessglass.es/ejercicios',
        description:
          'Enciclopedia gratuita de los mejores ejercicios de gimnasio por grupo muscular (Pecho, Espalda, Pierna, Glúteo, Hombros y Brazos) con técnica biomecánica, series óptimas y rutinas Push Pull Legs y Torso Pierna.',
        inLanguage: 'es-ES'
      },
      {
        '@type': 'ItemList',
        itemListElement: PUBLIC_EXERCISES.map((ex, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: ex.name,
          description: `${ex.muscleGroup}: ${ex.technique[0]}`
        }))
      }
    ]
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-bg-primary text-text-primary overflow-y-auto overflow-x-hidden custom-scrollbar"
      style={{
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <Helmet>
        <title>Ejercicios de Gimnasio y Rutinas de Hipertrofia (Guía Técnica) | Pro Fitness Glass</title>
        <meta
          name="description"
          content="Aprende la técnica correcta de los mejores ejercicios de gimnasio para pecho, espalda, piernas, glúteos, hombros y brazos, junto con las mejores rutinas Push Pull Legs y Torso Pierna."
        />
        <meta
          name="keywords"
          content="ejercicios de gimnasio, mejores ejercicios pecho, ejercicios espalda gym, sentadilla bulgara tecnica, press de banca tecnica, rutina push pull legs, rutina torso pierna 4 dias, hipertrofia muscular"
        />
        <link rel="canonical" href="https://profitnessglass.es/ejercicios" />
        <link rel="alternate" hrefLang="es" href="https://profitnessglass.es/ejercicios" />
        <link rel="alternate" hrefLang="x-default" href="https://profitnessglass.es/ejercicios" />
        <meta property="og:title" content="Guía de Ejercicios de Gimnasio y Rutinas de Hipertrofia — Pro Fitness Glass" />
        <meta
          property="og:description"
          content="Domina la biomecánica de los mejores ejercicios de musculación, evita lesiones y descarga tus rutinas gratis en Pro Fitness Glass."
        />
        <meta property="og:url" content="https://profitnessglass.es/ejercicios" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main
        className="max-w-6xl mx-auto px-3.5 sm:px-6 pb-8 sm:pb-12"
        style={{
          paddingTop: 'calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 1rem)',
          paddingBottom: 'calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 2rem)'
        }}
      >
        {/* Clean Integrated Header (No full-bleed borders or browser gap) */}
        <nav aria-label="Navegación de herramientas" className="flex flex-col gap-3.5 mb-7 sm:mb-10">
          <div className="flex items-center justify-between gap-2.5 w-full">
            {/* Logo + Marca + Badge Gratis */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 group cursor-pointer min-w-0"
              title="Pro Fitness Glass - App de Gimnasio 100% Gratis"
            >
              <img
                src="/icons/icon-96.png"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/logo.webp';
                }}
                alt="Pro Fitness Glass"
                loading="eager"
                decoding="async"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain shadow-xs ring-1 ring-black/10 dark:ring-white/10 group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-black text-sm sm:text-base tracking-tight text-text-primary leading-none group-hover:text-accent transition-colors truncate">
                  Pro Fitness Glass
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden xs:inline">100%</span> Gratis
                </span>
              </div>
            </Link>

            {/* Acciones: Volver a la App / Empezar Gratis */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => (onBack ? onBack() : navigate(isAuthenticated ? '/dashboard' : '/'))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/10 dark:ring-white/10 text-xs font-bold text-text-secondary hover:text-text-primary active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <FaChevronLeft className="text-accent text-[11px] shrink-0" />
                <span className="sm:hidden">{isAuthenticated ? 'App' : 'Inicio'}</span>
                <span className="hidden sm:inline">{isAuthenticated ? 'Volver a la App' : 'Inicio'}</span>
              </button>

              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-accent text-accent-contrast text-xs font-black shadow-md shadow-accent/25 hover:opacity-90 active:scale-95 transition-all shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <span className="sm:hidden">Rutina</span>
                  <span className="hidden sm:inline">Crear Rutina Gratis</span>
                  <FaArrowRight className="text-[11px] shrink-0" />
                </button>
              )}
            </div>
          </div>
          <MaintenanceNoticeBanner className="rounded-2xl" />

          {/* Segmented Glass Switcher Pill */}
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5 p-1 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 backdrop-blur-xl w-full overflow-hidden">
            <Link
              to="/calculadora-1rm"
              className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary text-[11px] sm:text-xs font-bold transition-colors min-w-0"
            >
              <FaCalculator className="text-accent text-[11px] sm:text-xs shrink-0" />
              <span className="truncate sm:hidden">1RM</span>
              <span className="truncate hidden sm:inline">Calculadora 1RM</span>
            </Link>
            <Link
              to="/calculadora-calorias-macros"
              className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary text-[11px] sm:text-xs font-bold transition-colors min-w-0"
            >
              <FaUtensils className="text-emerald-400 text-[11px] sm:text-xs shrink-0" />
              <span className="truncate sm:hidden">Macros</span>
              <span className="truncate hidden sm:inline">Calorías y Macros</span>
            </Link>
            <Link
              to="/ejercicios"
              className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl bg-blue-500/15 text-blue-400 text-[11px] sm:text-xs font-black border border-blue-500/30 shadow-xs min-w-0"
            >
              <FaDumbbell className="text-[11px] sm:text-xs shrink-0" />
              <span className="truncate">Ejercicios</span>
            </Link>
            <Link
              to="/noticias"
              className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary text-[11px] sm:text-xs font-bold transition-colors min-w-0"
            >
              <FaNewspaper className="text-purple-400 text-[11px] sm:text-xs shrink-0" />
              <span className="truncate sm:hidden">Guías</span>
              <span className="truncate hidden sm:inline">Guías y Noticias</span>
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <header className="text-center max-w-3xl mx-auto mb-5 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-accent/10 ring-1 ring-accent/30 text-accent text-[10px] sm:text-xs font-black uppercase tracking-wider mb-2.5 sm:mb-3 max-w-full text-center">
            <FaDumbbell className="text-xs shrink-0" />
            <span className="sm:hidden">Enciclopedia de Gimnasio • 100% Gratis</span>
            <span className="hidden sm:inline">Pro Fitness Glass • Enciclopedia de Gimnasio 100% Gratis</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-text-primary leading-tight mb-2.5 sm:mb-3 break-words">
            Mejores Ejercicios de Gimnasio y{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-400 to-purple-400">
              Rutinas de Hipertrofia
            </span>
          </h1>
          <p className="text-text-secondary text-xs sm:text-base font-medium leading-relaxed px-1 max-w-2xl mx-auto">
            Domina la técnica exacta de los ejercicios con mayor activación electromiográfica, evita errores lesivos y estructura tu rutina semanal en <strong>Pro Fitness Glass</strong> 100% gratis.
          </p>
        </header>

        {/* Buscador y Filtros por Grupo Muscular Reorganizados */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Fila del Buscador + Contador */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary text-xs sm:text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar ejercicio o músculo..."
                className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs sm:text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary text-xs cursor-pointer p-1"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] font-bold text-text-tertiary px-1">
              <span>
                {filteredExercises.length} ejercicio{filteredExercises.length === 1 ? '' : 's'}
                {selectedMuscle !== 'Todos' && <span className="text-accent ml-1">· {selectedMuscle}</span>}
              </span>
            </div>
          </div>

          {/* Filtros por Grupo Muscular: fila horizontal deslizable en móvil, sin descolocarse */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0 sm:flex-wrap">
            {MUSCLE_GROUPS.map((group) => {
              const isSelected = selectedMuscle === group;
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setSelectedMuscle(group)}
                  className={`shrink-0 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-accent text-accent-contrast shadow-md shadow-accent/25'
                      : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary border border-black/5 dark:border-white/10'
                  }`}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid de Ejercicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {filteredExercises.map((ex) => (
            <article
              key={ex.id}
              id={ex.id}
              className="p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 backdrop-blur-xl flex flex-col justify-between gap-4 hover:border-accent/40 transition-all shadow-xs"
            >
              <div>
                {/* Cabecera del ejercicio: Músculo + Material */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] sm:text-[11px] font-black uppercase tracking-wider shrink-0">
                    {ex.muscleGroup}
                  </span>
                  <span className="text-[11px] font-bold text-text-tertiary truncate text-right">
                    {ex.equipment}
                  </span>
                </div>

                <h2 className="text-lg sm:text-2xl font-black text-text-primary mb-1.5 leading-snug break-words">
                  <Link to={`/ejercicios/${ex.slug}`} className="hover:text-accent transition-colors">
                    {ex.name}
                  </Link>
                </h2>
                <p className="text-xs font-semibold text-text-secondary mb-3.5 leading-snug">
                  <span className="text-text-tertiary font-bold">Sinergistas:</span> {ex.secondaryMuscles}
                </p>

                {/* Caja de Rango Óptimo y Descanso: adaptada a móvil sin partir palabras */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 mb-4 text-xs">
                  <div className="flex items-start sm:items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[10px] font-black uppercase tracking-wider shrink-0 mt-0.5 sm:mt-0">
                      Rango
                    </span>
                    <span className="font-extrabold text-text-primary text-[11px] sm:text-xs leading-snug">
                      {ex.idealReps}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-text-secondary border-t sm:border-t-0 border-black/5 dark:border-white/5 pt-2 sm:pt-0">
                    <FaStopwatch className="text-accent text-xs shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">Descanso:</span>
                    <span className="font-extrabold text-accent text-xs">{ex.restTime}</span>
                  </div>
                </div>

                {/* Técnica Biomecánica Paso a Paso */}
                <h3 className="text-xs font-black uppercase tracking-wider text-text-primary mb-2.5 flex items-center gap-1.5">
                  <FaCircleCheck className="text-emerald-400 text-xs shrink-0" />
                  <span>Técnica Biomecánica Paso a Paso</span>
                </h3>
                <ol className="space-y-2 text-xs sm:text-sm text-text-secondary font-medium mb-4">
                  {ex.technique.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="flex-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Error común y botones de acción rápida */}
              <div className="pt-3.5 border-t border-black/5 dark:border-white/10 flex flex-col gap-3">
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-text-secondary leading-relaxed">
                  <strong className="text-red-400 inline-flex items-center gap-1.5 font-black uppercase tracking-wider mr-1.5">
                    <FaTriangleExclamation className="text-xs shrink-0" /> Error a evitar:
                  </strong>
                  <span>{ex.commonMistake}</span>
                </div>

                <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2.5 pt-1">
                  <Link
                    to={`/ejercicios/${ex.slug}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-accent/10 border border-black/5 dark:border-white/10 text-xs font-black text-accent transition-colors"
                  >
                    <span>Ver ficha completa</span>
                    <FaArrowRight className="text-[11px] shrink-0" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => navigate(isAuthenticated ? '/routines' : '/register')}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent text-accent-contrast text-xs font-black shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Añadir a mi rutina</span>
                    <FaArrowRight className="text-[11px] shrink-0" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Sección de las 3 Mejores Distribuciones de Rutinas Semanales */}
        <section className="mb-12 sm:mb-16">
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 ring-1 ring-purple-500/30 text-purple-400 text-[11px] sm:text-xs font-black uppercase tracking-widest mb-3 whitespace-nowrap">
              <FaLayerGroup className="text-xs shrink-0" />
              <span>Estructuras de Entrenamiento Semanal</span>
            </div>
            <h2 className="text-xl sm:text-4xl font-black text-text-primary mb-2.5">
              ¿Qué Rutina de Gimnasio Elegir según tus Días Disponibles?
            </h2>
            <p className="text-xs sm:text-base text-text-secondary font-medium">
              La evidencia científica demuestra que alcanzar una <strong>frecuencia 2</strong> (estimular cada músculo 2 veces por semana) entre <strong>10 y 20 series efectivas semanales</strong> maximiza la síntesis proteica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {PUBLIC_ROUTINES.map((split) => (
              <div
                key={split.slug}
                className="p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-purple-500/15 text-purple-400 text-xs font-black mb-3">
                    {split.days}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-text-primary mb-1.5">{split.name}</h3>
                  <p className="text-xs font-bold text-accent mb-2.5">{split.goal}</p>
                  <p className="text-xs sm:text-sm text-text-secondary font-medium leading-relaxed mb-5">{split.desc}</p>
                </div>
                <Link
                  to={`/rutinas/${split.slug}`}
                  className="w-full py-3 px-3 sm:px-4 rounded-2xl bg-accent/15 hover:bg-accent text-accent hover:text-accent-contrast font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <span className="truncate">Ver Rutina Día a Día</span>
                  <FaArrowRight className="text-[11px] shrink-0" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <div className="p-5 sm:p-10 rounded-[26px] sm:rounded-[32px] bg-gradient-to-br from-accent/20 via-purple-500/15 to-blue-500/15 border border-accent/30 text-center mb-10">
          <h2 className="text-xl sm:text-3xl font-black text-text-primary mb-2.5">
            Apunta tus Pesos, Series y Récords con Sobrecarga Progresiva Automática
          </h2>
          <p className="text-xs sm:text-base text-text-secondary font-medium max-w-2xl mx-auto mb-5">
            Accede al catálogo completo con más de 300 ejercicios, temporizador inteligente de descanso, calculadora de 1RM integrada y mapa térmico muscular gratis en Pro Fitness Glass.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate(isAuthenticated ? '/routines' : '/register')}
              className="w-full sm:w-auto px-4 sm:px-7 py-3.5 rounded-2xl bg-accent text-accent-contrast font-black text-xs sm:text-base shadow-xl shadow-accent/30 hover:scale-[1.02] active:scale-95 transition-all inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap"
            >
              <FaBolt className="shrink-0 text-xs sm:text-sm" />
              <span className="truncate">{isAuthenticated ? 'Ir a Mis Rutinas' : 'Empezar Gratis en Pro Fitness Glass'}</span>
              <FaArrowRight className="shrink-0 text-xs sm:text-sm" />
            </button>
          </div>
        </div>
        {/* Espaciador inferior equilibrado: separación armónica con el resto de la web */}
        <PublicPageFooter />
      </main>
    </div>
  );
}
