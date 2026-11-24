/* frontend/src/pages/PublicRoutineDetailPage.jsx */
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FaChevronLeft,
  FaLayerGroup,
  FaCalendarDays,
  FaArrowRight,
  FaBolt,
  FaCalculator,
  FaUtensils,
} from 'react-icons/fa6';
import MaintenanceNoticeBanner from '../components/MaintenanceNoticeBanner';
import PublicPageFooter from '../components/PublicPageFooter';
import { PUBLIC_ROUTINES, findExerciseBySlug, findRoutineBySlug } from '../data/fitnessCatalog';
import useAppStore from '../store/useAppStore';

const BASE_URL = 'https://profitnessglass.es';

export default function PublicRoutineDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  // Vista índice /rutinas cuando no hay slug
  if (!slug) {
    const indexUrl = `${BASE_URL}/rutinas`;
    const indexTitle = 'Rutinas de Gimnasio para Hipertrofia (PPL, Torso Pierna, Full Body) | Pro Fitness Glass';
    const indexDesc = 'Explora las mejores rutinas de gimnasio día a día: Push Pull Legs, Torso Pierna 4 días, Full Body y Arnold Split con series, repeticiones y RIR.';
    const collectionSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Rutinas de Gimnasio para Hipertrofia y Fuerza',
      description: indexDesc,
      url: indexUrl,
      inLanguage: 'es-ES',
    };

    return (
      <div className="fixed inset-0 z-50 bg-bg-primary text-text-primary overflow-y-auto overflow-x-hidden custom-scrollbar">
        <Helmet>
          <title>{indexTitle}</title>
          <meta name="description" content={indexDesc} />
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
          <link rel="canonical" href={indexUrl} />
          <link rel="alternate" hrefLang="es" href={indexUrl} />
          <link rel="alternate" hrefLang="x-default" href={indexUrl} />
          <meta property="og:type" content="website" />
          <meta property="og:title" content={indexTitle} />
          <meta property="og:description" content={indexDesc} />
          <meta property="og:url" content={indexUrl} />
          <script type="application/ld+json">{JSON.stringify(collectionSchema)}</script>
        </Helmet>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-12" style={{ paddingTop: 'calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 1.25rem)' }}>
          <MaintenanceNoticeBanner className="rounded-2xl mb-4" />
          <nav className="flex items-center justify-between gap-2 pb-5">
            <Link to="/ejercicios" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold text-text-secondary hover:text-accent">
              <FaChevronLeft className="text-[11px] shrink-0" />
              <span>Guía de Ejercicios</span>
            </Link>
            <Link to="/calculadora-1rm" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-xs font-black text-accent">
              <FaCalculator className="text-[11px] shrink-0" />
              <span>Calculadora 1RM</span>
            </Link>
          </nav>
          <header className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-2xl sm:text-4xl font-black text-text-primary mb-3">
              Rutinas de Gimnasio para Hipertrofia y Fuerza
            </h1>
            <p className="text-sm sm:text-base text-text-secondary font-medium">{indexDesc}</p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
            {PUBLIC_ROUTINES.map((r) => (
              <Link
                key={r.slug}
                to={`/rutinas/${r.slug}`}
                className="p-6 rounded-[28px] bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 hover:border-accent/40 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-purple-500/15 text-purple-400 text-xs font-black mb-3">
                    {r.days}
                  </span>
                  <h2 className="text-xl font-black text-text-primary mb-1.5">{r.name}</h2>
                  <p className="text-xs font-bold text-accent mb-2">{r.goal}</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{r.desc}</p>
                </div>
                <span className="inline-flex items-center gap-2 text-xs font-black text-accent">
                  <span>Ver rutina día a día</span>
                  <FaArrowRight className="text-[11px] shrink-0" />
                </span>
              </Link>
            ))}
          </div>
          <PublicPageFooter />
        </main>
      </div>
    );
  }

  const routine = findRoutineBySlug(slug);
  if (!routine) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-primary text-text-primary overflow-y-auto px-4 py-16 text-center flex flex-col items-center justify-center gap-4 custom-scrollbar">
        <Helmet>
          <title>Rutina no encontrada | Pro Fitness Glass</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <h1 className="text-2xl font-black text-text-primary">Rutina no encontrada</h1>
        <Link to="/rutinas" className="px-6 py-2.5 rounded-full bg-accent text-accent-contrast font-bold text-xs">
          Ver todas las rutinas
        </Link>
      </div>
    );
  }

  const canonicalUrl = `${BASE_URL}/rutinas/${routine.slug}`;
  const fullTitle = `${routine.seoTitle} | Pro Fitness Glass`;
  const schemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: routine.name,
        description: routine.seoDescription,
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
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Rutinas', item: `${BASE_URL}/rutinas` },
          { '@type': 'ListItem', position: 3, name: routine.shortName, item: canonicalUrl },
        ],
      },
    ],
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary text-text-primary overflow-y-auto overflow-x-hidden custom-scrollbar">
      <Helmet>
        <title>{fullTitle}</title>
        <meta name="description" content={routine.seoDescription} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" hrefLang="es" href={canonicalUrl} />
        <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={routine.seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(schemaGraph)}</script>
      </Helmet>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-12" style={{ paddingTop: 'calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 1.25rem)' }}>
        <MaintenanceNoticeBanner className="rounded-2xl mb-4" />

        <nav className="flex items-center justify-between gap-2 pb-5">
          <Link to="/rutinas" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold text-text-secondary hover:text-accent">
            <FaChevronLeft className="text-[11px] shrink-0" />
            <span>Todas las Rutinas</span>
          </Link>
          <Link to="/calculadora-calorias-macros" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-black text-emerald-400">
            <FaUtensils className="text-[11px] shrink-0" />
            <span>Calculadora Macros</span>
          </Link>
        </nav>

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-400 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
              <FaCalendarDays className="text-[11px] shrink-0" />
              <span>{routine.days}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold text-text-secondary">
              {routine.level}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-text-primary tracking-tight leading-tight mb-3">
            {routine.name}
          </h1>
          <p className="text-sm sm:text-base text-text-secondary font-medium leading-relaxed mb-3">
            {routine.desc}
          </p>
          <p className="text-xs sm:text-sm font-bold text-accent">
            Volumen semanal recomendado: {routine.weeklyVolume}
          </p>
        </header>

        <section className="space-y-5 mb-10">
          {routine.schedule.map((day) => (
            <div key={day.dayTitle} className="p-5 sm:p-6 rounded-[26px] bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10">
              <h2 className="text-base sm:text-xl font-black text-text-primary mb-4 flex items-center gap-2">
                <FaLayerGroup className="text-purple-400 text-sm shrink-0" />
                <span>{day.dayTitle}</span>
              </h2>
              <div className="divide-y divide-black/10 dark:divide-white/10">
                {day.exercises.map((item) => {
                  const ex = findExerciseBySlug(item.slug);
                  if (!ex) return null;
                  return (
                    <div key={item.slug} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <Link to={`/ejercicios/${ex.slug}`} className="text-sm sm:text-base font-black text-text-primary hover:text-accent transition-colors">
                          {ex.name}
                        </Link>
                        <p className="text-xs text-text-tertiary">{ex.muscleGroup} · {ex.equipment}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-xs font-bold text-accent">{item.sets}</span>
                        <Link to={`/ejercicios/${ex.slug}`} className="text-[11px] font-black text-text-secondary hover:text-accent inline-flex items-center gap-1 shrink-0">
                          <span>Técnica</span>
                          <FaArrowRight className="text-[10px]" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <div className="p-6 rounded-[28px] bg-gradient-to-br from-accent/20 via-purple-500/15 to-blue-500/15 border border-accent/30 text-center mb-10">
          <h2 className="text-xl font-black text-text-primary mb-2">
            Lleva la {routine.shortName} en tu bolsillo gratis
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mb-4">
            Crea esta rutina en Pro Fitness Glass con cronómetro de descanso, sobrecarga progresiva automática y calculadora de 1RM.
          </p>
          <button
            type="button"
            onClick={() => navigate(isAuthenticated ? '/routines' : '/register')}
            className="px-6 py-3 rounded-2xl bg-accent text-accent-contrast font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg shadow-accent/25 cursor-pointer"
          >
            <FaBolt className="text-xs shrink-0" />
            <span>{isAuthenticated ? 'Configurar en Mis Rutinas' : 'Crear Rutina Gratis'}</span>
          </button>
        </div>

        <PublicPageFooter />
      </main>
    </div>
  );
}
