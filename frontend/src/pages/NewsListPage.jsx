/* frontend/src/pages/NewsListPage.jsx */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Newspaper,
  Search,
  Clock,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  Flame,
  Layers,
  BookOpen,
  LogIn,
  Eye,
  ThumbsUp,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import AdSenseSlot from '../components/News/AdSenseSlot';
import * as newsService from '../services/newsService';
import useAppStore from '../store/useAppStore';

const DEFAULT_CATEGORIES = ['Todas', 'Entrenamiento', 'Nutrición', 'Suplementación', 'Salud', 'Novedades'];
const BASE_URL = 'https://pro-fitness-glass.zeabur.app';

export default function NewsListPage({ onBack, navigate: customNavigate }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentCategory = searchParams.get('category') || 'Todas';
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const currentSearch = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(currentSearch);

  // Exactamente 6 art�culos por p�gina (2 filas completas de 3 columnas para una cuadr�cula perfecta)
  const ITEMS_PER_PAGE = 6;

  // Carga instant�nea SWR (0ms) desde cach� en memoria, sessionStorage o bundle empaquetado
  const cachedInitial = useMemo(() => {
    return newsService.getCachedPublicNews({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      category: currentCategory,
      search: currentSearch
    });
  }, [currentPage, currentCategory, currentSearch]);

  const [news, setNews] = useState(() => cachedInitial?.news || []);
  const [total, setTotal] = useState(() => cachedInitial?.total || 0);
  const [totalAll, setTotalAll] = useState(() => cachedInitial?.totalAll || 0);
  const [totalPages, setTotalPages] = useState(() => cachedInitial?.totalPages || 1);
  const [categoryCounts, setCategoryCounts] = useState(() => cachedInitial?.categoryCounts || {});
  const [apiCategories, setApiCategories] = useState(() => cachedInitial?.categories || DEFAULT_CATEGORIES);
  const [popularNews, setPopularNews] = useState(() => cachedInitial?.popularNews || []);
  const [isLoading, setIsLoading] = useState(() => !cachedInitial);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const handleRetry = () => {
    setReloadKey((prev) => prev + 1);
  };

  // Categorías calculadas dinámicamente: base + cualquier nueva categoría devuelta por la API o categoryCounts
  const categories = useMemo(() => {
    const list = [...DEFAULT_CATEGORIES];
    if (apiCategories && Array.isArray(apiCategories)) {
      apiCategories.forEach((cat) => {
        const trimmed = (cat || '').trim();
        if (trimmed && !list.includes(trimmed)) {
          list.push(trimmed);
        }
      });
    }
    if (categoryCounts && typeof categoryCounts === 'object') {
      Object.keys(categoryCounts).forEach((cat) => {
        const trimmed = (cat || '').trim();
        if (trimmed && !list.includes(trimmed)) {
          list.push(trimmed);
        }
      });
    }
    if (currentCategory && currentCategory !== 'Todas' && !list.includes(currentCategory)) {
      list.push(currentCategory);
    }
    return list;
  }, [apiCategories, categoryCounts, currentCategory]);

  useEffect(() => {
    let isMounted = true;
    const loadNews = async () => {
      if (!cachedInitial && (!news || news.length === 0)) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const data = await newsService.fetchPublicNews({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          category: currentCategory,
          search: currentSearch
        });
        if (isMounted && data) {
          setNews(data.news || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setCategoryCounts(data.categoryCounts || {});
          if (data.totalAll) {
            setTotalAll(data.totalAll);
          } else if (data.categoryCounts) {
            const sum = Object.values(data.categoryCounts).reduce((acc, n) => acc + (Number(n) || 0), 0);
            if (sum > 0) setTotalAll(sum);
          }
          if (data.categories && Array.isArray(data.categories)) {
            setApiCategories(data.categories);
          }
          if (data.popularNews && Array.isArray(data.popularNews)) {
            setPopularNews(data.popularNews);
          }
        }
      } catch (err) {
        if (isMounted) {
          if (!cachedInitial && (!news || news.length === 0)) {
            setError(err.message || 'Error al cargar las noticias');
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadNews();
    return () => { isMounted = false; };
  }, [currentCategory, currentPage, currentSearch, reloadKey]);

  // Precarga agresiva de contenido de los primeros 3 artículos en segundo plano para abrir a 0ms
  useEffect(() => {
    if (news && news.length > 0) {
      news.slice(0, 3).forEach((art) => {
        if (art?.slug) newsService.prefetchNewsBySlug(art.slug);
      });
    }
  }, [news]);

  const handleSelectCategory = (cat) => {
    const next = new URLSearchParams(searchParams);
    if (cat === 'Todas') next.delete('category');
    else next.set('category', cat);
    next.delete('page'); // Volver a página 1 al cambiar de tema

    // Sincronización instantánea para que la paginación desaparezca al instante si no hay suficientes artículos
    if (cat !== 'Todas' && categoryCounts && categoryCounts[cat] !== undefined) {
      const count = Number(categoryCounts[cat]) || 0;
      setTotal(count);
      setTotalPages(Math.max(1, Math.ceil(count / ITEMS_PER_PAGE)));
    } else if (cat === 'Todas' && totalAll > 0) {
      setTotal(totalAll);
      setTotalPages(Math.max(1, Math.ceil(totalAll / ITEMS_PER_PAGE)));
    }

    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) next.set('search', searchInput.trim());
    else next.delete('search');
    next.delete('page');
    setSearchParams(next);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > effectiveTotalPages || newPage === currentPage) return;
    const next = new URLSearchParams(searchParams);
    if (newPage === 1) next.delete('page');
    else next.set('page', newPage.toString());
    setSearchParams(next);

    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleArticleClick = (art) => {
    newsService.prefetchNewsBySlug(art.slug);
    navigate(`/noticias/${art.slug}`, { state: { previewArticle: art } });
  };

  const handleGoHome = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (customNavigate) {
      customNavigate(isAuthenticated ? 'hub' : 'dashboard');
      return;
    }
    navigate(isAuthenticated ? '/dashboard' : '/');
  };

  // Structured Data Schema para página de colección de artículos
  const collectionSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'Noticias y Artículos de Fitness, Nutrición y Entrenamiento',
    'description': 'Guías científicas, artículos y novedades sobre hipertrofia, dietética deportiva y fitness en Pro Fitness Glass.',
    'url': `${BASE_URL}/noticias`,
    'publisher': {
      '@type': 'Organization',
      'name': 'Pro Fitness Glass',
      'logo': {
        '@type': 'ImageObject',
        'url': `${BASE_URL}/logo.webp`
      }
    }
  }), []);

  const gridArticles = useMemo(() => news, [news]);

  // Cálculo estricto del total real según la categoría seleccionada
  const categoryTotal = useMemo(() => {
    if (currentCategory === 'Todas') {
      return totalAll || total;
    }
    if (categoryCounts && categoryCounts[currentCategory] !== undefined) {
      return Number(categoryCounts[currentCategory]) || 0;
    }
    return total;
  }, [currentCategory, categoryCounts, totalAll, total]);

  // Si una categoría tiene pocos artículos (ej. <= 6), no hay páginas múltiples
  const effectiveTotalPages = useMemo(() => {
    if (currentCategory !== 'Todas') {
      return Math.max(1, Math.ceil(categoryTotal / ITEMS_PER_PAGE));
    }
    return totalPages;
  }, [currentCategory, categoryTotal, totalPages, ITEMS_PER_PAGE]);

  const visiblePages = useMemo(() => {
    if (effectiveTotalPages <= 5) {
      return Array.from({ length: effectiveTotalPages }, (_, i) => i + 1);
    }
    const pages = new Set([1, effectiveTotalPages, currentPage, currentPage - 1, currentPage + 1]);
    return Array.from(pages)
      .filter((p) => p >= 1 && p <= effectiveTotalPages)
      .sort((a, b) => a - b);
  }, [currentPage, effectiveTotalPages]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-bg-primary overflow-y-auto overflow-x-hidden custom-scrollbar"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        paddingTop: 'var(--safe-top, env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 2rem)'
      }}
    >
      <div className="min-h-full px-4 sm:px-6 py-6 max-w-6xl mx-auto flex flex-col gap-8 animate-[fade-in_0.4s_ease-out]">
        {/* SEO HEAD */}
        <Helmet>
          <title>Noticias y Artículos de Fitness y Nutrición | Pro Fitness Glass</title>
          <meta
            name="description"
            content="Descubre artículos científicos sobre hipertrofia, suplementación, nutrición deportiva y novedades de Pro Fitness Glass."
          />
          <link rel="canonical" href={`${BASE_URL}/noticias`} />
          <meta name="robots" content="index, follow" />
          <meta property="og:title" content="Noticias y Artículos de Fitness y Nutrición | Pro Fitness Glass" />
          <meta property="og:description" content="Guías científicas, suplementación y estrategias de nutrición deportiva contrastadas por la ciencia." />
          <meta property="og:url" content={`${BASE_URL}/noticias`} />
          <meta property="og:type" content="website" />
          <meta property="og:image" content={`${BASE_URL}/logo.webp`} />
          <script type="application/ld+json">{JSON.stringify(collectionSchema)}</script>
        </Helmet>

        {/* HEADER / NAV BAR */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGoHome}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full ring-1 ring-black/10 dark:ring-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-xs font-bold text-text-secondary"
            >
              <ChevronLeft size={16} /> {isAuthenticated ? 'Volver a la App' : 'Inicio'}
            </button>
            <span className="text-xs text-text-tertiary">/</span>
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Blog & Noticias</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Buscador */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar artículos..."
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full pl-9 pr-4 py-2 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            </form>

            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="cursor-pointer shrink-0 hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent text-accent-contrast font-bold text-xs shadow-md shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
              >
                <LogIn size={14} /> Iniciar Sesión
              </button>
            )}
          </div>
        </header>

      {/* TITULAR PRINCIPAL */}
      <section className="text-center sm:text-left py-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-accent/10 text-accent mb-3 border border-accent/20">
          <Sparkles size={13} />
          Ciencia, Entrenamiento y Nutrición
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-text-primary tracking-tight leading-tight">
          Noticias y Guías de Élite
        </h1>
        <p className="text-text-secondary text-sm sm:text-base max-w-2xl mt-2 font-medium">
          Aprende con artículos basados en evidencia científica, optimiza tus comidas y domina tu rendimiento en el gimnasio.
        </p>
      </section>

      {/* SECCIÓN NOTICIAS MÁS VISTAS */}
      {popularNews.length > 0 && currentCategory === 'Todas' && !currentSearch && currentPage === 1 && (
        <section className="space-y-4 pt-1 pb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                <Flame size={18} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                  Más Vistas
                </h2>
                <p className="text-[11px] sm:text-xs text-text-tertiary font-medium">
                  Artículos destacados y más consultados por la comunidad
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Tendencias
              </span>
              <span className="inline-flex sm:hidden items-center gap-1 text-[11px] font-bold text-text-tertiary">
                Desliza <ArrowRight size={12} className="text-amber-500" />
              </span>
            </div>
          </div>

          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto sm:overflow-x-visible pb-3 pt-1 scrollbar-none touch-pan-x overscroll-x-contain snap-x snap-mandatory">
            {popularNews.map((popArt, idx) => (
              <GlassCard
                key={popArt.id || popArt.slug}
                onClick={() => handleArticleClick(popArt)}
                onMouseEnter={() => newsService.prefetchNewsBySlug(popArt.slug)}
                onTouchStart={() => newsService.prefetchNewsBySlug(popArt.slug)}
                className="glass p-0 rounded-2xl overflow-hidden border-none ring-1 ring-black/5 dark:ring-white/10 hover:ring-accent/40 transition-all cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 duration-300 w-[78vw] sm:w-auto min-w-[250px] sm:min-w-0 max-w-[300px] sm:max-w-none shrink-0 snap-start"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/10">
                  <img
                    src={popArt.image_url?.includes('photo-1510519138197-06b8628cbf4f')
                      ? 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?auto=format&fit=crop&w=1200&q=80'
                      : (popArt.image_url || '/entrenamiento.png')}
                    alt={popArt.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/entrenamiento.png';
                    }}
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-accent text-accent-contrast font-black text-[10px] flex items-center justify-center shadow-md">
                      #{idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/15">
                      {popArt.category}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 flex flex-col gap-2 grow justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                    {popArt.title}
                  </h3>

                  <div className="flex items-center justify-between text-[10px] text-text-tertiary pt-2 border-t border-black/5 dark:border-white/5 font-semibold">
                    <span className="flex items-center gap-1">
                      <Eye size={11} className="text-text-secondary" />
                      {popArt.views_count || 0} lecturas
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {popArt.reading_time || 3} min
                    </span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      {/* CATEGORÍAS */}
      <nav
        aria-label="Categorías de artículos"
        className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 px-1 -mx-1 scrollbar-none touch-pan-x overscroll-x-contain"
      >
        {categories.map((cat) => {
          const isActive = currentCategory === cat;
          const allCount = totalAll || Object.values(categoryCounts).reduce((acc, n) => acc + (Number(n) || 0), 0) || total;
          const count = cat === 'Todas' ? allCount : (categoryCounts[cat] || 0);

          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleSelectCategory(cat)}
              className={`shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer select-none outline-none ${
                isActive
                  ? 'news-category-active bg-accent text-accent-contrast scale-105'
                  : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary'
              }`}
            >
              <span>{cat}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                    isActive ? 'bg-black/20 text-white' : 'bg-black/5 dark:bg-white/10 text-text-tertiary'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

            {/* CONTENIDO PRINCIPAL */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="glass p-0 rounded-[28px] overflow-hidden border border-black/5 dark:border-white/10 flex flex-col justify-between"
            >
              <div className="h-48 bg-black/10 dark:bg-white/10 animate-pulse" />
              <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
                <div className="flex flex-col gap-2">
                  <div className="h-3.5 w-20 rounded bg-accent/20 animate-pulse" />
                  <div className="h-5 w-full rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                  <div className="h-4 w-5/6 rounded bg-black/5 dark:bg-white/5 animate-pulse" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
                  <div className="h-3 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                  <div className="h-3 w-16 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-12 px-4 flex flex-col items-center justify-center">
          <GlassCard className="p-8 max-w-md w-full text-center flex flex-col items-center justify-center gap-4 border-red-500/20 bg-red-500/5">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <WifiOff size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary mb-1">
                No pudimos conectar con el servidor
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {error}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-contrast font-bold text-xs shadow-md shadow-accent/20 cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <RefreshCw size={14} />
              Reintentar conexión
            </button>
          </GlassCard>
        </div>
      ) : news.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <BookOpen size={48} className="text-text-muted opacity-40" />
          <h3 className="text-lg font-bold text-text-primary">No se encontraron artículos</h3>
          <p className="text-xs text-text-secondary max-w-sm">
            Prueba a seleccionar otra categoría o cambiar el término de búsqueda.
          </p>
          <button
            onClick={() => {
              setSearchInput('');
              setSearchParams(new URLSearchParams());
            }}
            className="mt-2 px-4 py-2 rounded-full bg-accent text-accent-contrast font-bold text-xs"
          >
            Ver todos los artículos
          </button>
        </div>
      ) : (
        <>
          {/* ADSENSE BANNER INTERMEDIO */}
          <AdSenseSlot slotId="noticias-list-banner" format="auto" />

          {/* GRID DE ARTÍCULOS (Simétrico de 3 columnas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridArticles.map((art) => (
              <GlassCard
                key={art.id}
                onClick={() => handleArticleClick(art)}
                onMouseEnter={() => newsService.prefetchNewsBySlug(art.slug)}
                onTouchStart={() => newsService.prefetchNewsBySlug(art.slug)}
                className="glass p-0 rounded-[28px] overflow-hidden border-none ring-1 ring-black/5 dark:ring-white/10 hover:ring-accent/40 transition-all cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 duration-300"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/10">
                  <img
                    src={art.image_url?.includes('photo-1510519138197-06b8628cbf4f')
                      ? 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?auto=format&fit=crop&w=1200&q=80'
                      : (art.image_url || '/entrenamiento.png')}
                    alt={art.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/entrenamiento.png';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/15">
                      {art.category}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-3 grow justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-text-tertiary mb-2 font-medium">
                      <span>{format(new Date(art.published_at), 'd MMM yyyy', { locale: es })}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {art.reading_time} min
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                      {art.title}
                    </h3>

                    <p className="text-xs text-text-secondary mt-2 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-text-tertiary truncate max-w-[130px]">
                      {art.author_name}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-text-tertiary font-semibold">
                      {(art.views_count || 0) > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Eye size={11} /> {art.views_count}
                        </span>
                      )}
                      {(art.likes_count || 0) > 0 && (
                        <span className="flex items-center gap-0.5 text-accent">
                          <ThumbsUp size={10} /> {art.likes_count}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-accent inline-flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      Leer <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* PAGINACIÓN ELEGANTE Y RESPONSIVE (Totalmente adaptada a móviles) */}
          {effectiveTotalPages > 1 && (
            <div className="w-full flex flex-col items-center justify-center gap-3 pt-8 pb-10 border-t border-black/5 dark:border-white/5 mt-8 px-1">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 max-w-full">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="inline-flex items-center justify-center gap-1 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed border border-black/10 dark:border-white/10 transition-all cursor-pointer text-text-primary shrink-0"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={15} />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                <div className="flex items-center gap-1 sm:gap-1.5 mx-0.5 sm:mx-1 max-w-full overflow-x-auto py-0.5 scrollbar-none">
                  {visiblePages.map((p, idx) => {
                    const prev = visiblePages[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    const isActive = currentPage === p;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="text-text-tertiary text-xs px-0.5 select-none font-bold">…</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePageChange(p)}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-accent text-accent-contrast shadow-md shadow-accent/25 scale-105'
                              : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= effectiveTotalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="inline-flex items-center justify-center gap-1 px-3 sm:px-4 py-2 rounded-xl text-xs font-black bg-accent text-accent-contrast hover:brightness-110 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-accent/25 shrink-0"
                  aria-label="Página siguiente"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight size={15} />
                </button>
              </div>

              <span className="text-[11px] font-semibold text-text-tertiary text-center">
                Página {currentPage} de {effectiveTotalPages} · Mostrando {news.length} de {categoryTotal} artículos
              </span>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
