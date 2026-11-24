/* frontend/src/pages/PublicExerciseDetailPage.jsx */
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FaChevronLeft,
  FaDumbbell,
  FaStopwatch,
  FaCircleCheck,
  FaTriangleExclamation,
  FaCalculator,
  FaLayerGroup,
  FaArrowRight,
  FaBolt,
} from 'react-icons/fa6';
import MaintenanceNoticeBanner from '../components/MaintenanceNoticeBanner';
import PublicPageFooter from '../components/PublicPageFooter';
import { PUBLIC_EXERCISES, PUBLIC_ROUTINES, findExerciseBySlug } from '../data/fitnessCatalog';
import useAppStore from '../store/useAppStore';

const BASE_URL = 'https://profitnessglass.es';

export default function PublicExerciseDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const exercise = findExerciseBySlug(slug);

  if (!exercise) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-primary text-text-primary overflow-y-auto px-4 py-16 text-center flex flex-col items-center justify-center gap-4 custom-scrollbar">
        <Helmet>
          <title>Ejercicio no encontrado | Pro Fitness Glass</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <FaDumbbell className="text-3xl" />
        </div>
        <h1 className="text-2xl font-black text-text-primary">Ejercicio no encontrado</h1>
        <p className="text-text-secondary text-sm max-w-md">
          El ejercicio que buscas no existe o ha cambiado de ruta. Explora nuestra guía técnica completa.
        </p>
        <Link
          to="/ejercicios"
          className="px-6 py-2.5 rounded-full bg-accent text-accent-contrast font-bold text-xs shadow-md shadow-accent/20"
        >
          Ver todos los ejercicios
        </Link>
      </div>
    );
  }

  const canonicalUrl = `${BASE_URL}/ejercicios/${exercise.slug}`;
  const fullTitle = `${exercise.seoTitle} | Pro Fitness Glass`;
  const relatedExercises = (exercise.relatedSlugs || [])
    .map((s) => findExerciseBySlug(s))
    .filter(Boolean);
  const matchingRoutines = PUBLIC_ROUTINES.filter((r) =>
    r.schedule.some((day) => day.exercises.some((item) => item.slug === exercise.slug))
  );

  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: exercise.name,
        description: exercise.seoDescription,
        inLanguage: 'es-ES',
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
        author: { '@type': 'Organization', name: 'Equipo Editorial Pro Fitness Glass', url: BASE_URL },
        publisher: {
          '@type': 'Organization',
          name: 'Pro Fitness Glass',
          logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.webp` },
        },
      },
      {
        '@type': 'HowTo',
        name: `Cómo hacer ${exercise.name}`,
        description: exercise.seoDescription,
        supply: [{ '@type': 'HowToSupply', name: exercise.equipment }],
        step: exercise.technique.map((text, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          text,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Ejercicios', item: `${BASE_URL}/ejercicios` },
          { '@type': 'ListItem', position: 3, name: exercise.shortName, item: canonicalUrl },
        ],
      },
    ],
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-bg-primary text-text-primary overflow-y-auto overflow-x-hidden custom-scrollbar"
      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
    >
      <Helmet>
        <title>{fullTitle}</title>
        <meta name="description" content={exercise.seoDescription} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" hrefLang="es" href={canonicalUrl} />
        <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={exercise.seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={`${BASE_URL}/og-preview.jpg`} />
        <script type="application/ld+json">{JSON.stringify(schemaGraph)}</script>
      </Helmet>

      <main
        className="max-w-4xl mx-auto px-4 sm:px-6 pb-12"
        style={{
          paddingTop: 'calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 1.25rem)',
          paddingBottom: 'calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 2.5rem)',
        }}
      >
        <MaintenanceNoticeBanner className="rounded-2xl mb-4" />

        <nav aria-label="Ruta de navegación" className="flex items-center justify-between gap-2 pb-5">
          <Link
            to="/ejercicios"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold text-text-secondary hover:text-accent transition-colors"
          >
            <FaChevronLeft className="text-[11px] shrink-0" />
            <span>Todos los Ejercicios</span>
          </Link>
          <Link
            to="/calculadora-1rm"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-xs font-black text-accent"
          >
            <FaCalculator className="text-[11px] shrink-0" />
            <span>Calculadora 1RM</span>
          </Link>
        </nav>

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-black uppercase tracking-wider">
              {exercise.muscleGroup}
            </span>
            <span className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold text-text-secondary">
              {exercise.difficulty}
            </span>
            <span className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold text-text-secondary">
              {exercise.equipment}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-text-primary tracking-tight leading-tight mb-3">
            {exercise.name}: Técnica, Músculos y Errores
          </h1>
          <p className="text-sm sm:text-base text-text-secondary font-medium leading-relaxed">
            {exercise.seoDescription}
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10">
            <p className="text-[11px] font-black uppercase tracking-wider text-text-tertiary mb-1">Sinergistas</p>
            <p className="text-xs sm:text-sm font-bold text-text-primary">{exercise.secondaryMuscles}</p>
          </div>
          <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10">
            <p className="text-[11px] font-black uppercase tracking-wider text-text-tertiary mb-1">Rango Óptimo</p>
            <p className="text-xs sm:text-sm font-bold text-accent">{exercise.idealReps}</p>
          </div>
          <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10">
            <p className="text-[11px] font-black uppercase tracking-wider text-text-tertiary mb-1 flex items-center gap-1.5">
              <FaStopwatch className="text-accent text-xs shrink-0" />
              <span>Descanso Recomendado</span>
            </p>
            <p className="text-xs sm:text-sm font-bold text-text-primary">{exercise.restTime}</p>
          </div>
        </section>

        <section className="p-5 sm:p-7 rounded-[28px] bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 mb-6">
          <h2 className="text-lg sm:text-xl font-black text-text-primary mb-4 flex items-center gap-2">
            <FaCircleCheck className="text-emerald-400 shrink-0" />
            <span>Cómo hacer {exercise.shortName} paso a paso</span>
          </h2>
          <ol className="space-y-3 text-sm sm:text-base text-text-secondary font-medium">
            {exercise.technique.map((step, i) => (
              <li key={i} className="flex items-start gap-3 leading-relaxed">
                <span className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 mb-8">
          <h2 className="text-sm font-black uppercase tracking-wider text-red-400 mb-1.5 flex items-center gap-2">
            <FaTriangleExclamation className="shrink-0" />
            <span>Error más frecuente a evitar</span>
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">{exercise.commonMistake}</p>
        </section>

        {matchingRoutines.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-black text-text-primary mb-3 flex items-center gap-2">
              <FaLayerGroup className="text-purple-400 shrink-0" />
              <span>Rutinas donde se entrena {exercise.shortName}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {matchingRoutines.map((routine) => (
                <Link
                  key={routine.slug}
                  to={`/rutinas/${routine.slug}`}
                  className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 hover:border-accent/40 transition-colors flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-[11px] font-black text-purple-400 uppercase">{routine.days}</span>
                    <p className="text-sm font-black text-text-primary">{routine.shortName}</p>
                  </div>
                  <FaArrowRight className="text-accent text-xs shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {relatedExercises.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-black text-text-primary mb-3">Otros ejercicios relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relatedExercises.map((rel) => (
                <Link
                  key={rel.slug}
                  to={`/ejercicios/${rel.slug}`}
                  className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 hover:border-accent/40 transition-colors"
                >
                  <span className="text-[10px] font-black uppercase text-accent">{rel.muscleGroup}</span>
                  <p className="text-sm font-black text-text-primary mt-0.5">{rel.shortName}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="p-6 rounded-[28px] bg-gradient-to-br from-accent/20 via-purple-500/15 to-blue-500/15 border border-accent/30 text-center mb-10">
          <h2 className="text-xl font-black text-text-primary mb-2">
            Registra tus series de {exercise.shortName} gratis
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mb-4">
            Calcula tu 1RM y aplica sobrecarga progresiva en cada sesión sin límites en Pro Fitness Glass.
          </p>
          <button
            type="button"
            onClick={() => navigate(isAuthenticated ? '/routines' : '/register')}
            className="px-6 py-3 rounded-2xl bg-accent text-accent-contrast font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg shadow-accent/25 cursor-pointer"
          >
            <FaBolt className="text-xs shrink-0" />
            <span>{isAuthenticated ? 'Añadir a mis rutinas' : 'Empezar gratis ahora'}</span>
          </button>
        </div>

        <PublicPageFooter />
      </main>
    </div>
  );
}
