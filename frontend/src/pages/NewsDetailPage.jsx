/* frontend/src/pages/NewsDetailPage.jsx */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  Clock,
  Eye,
  Share2,
  Check,
  Copy,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ThumbsUp,
  Type,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { FaWhatsapp, FaXTwitter, FaTelegram } from 'react-icons/fa6';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import Spinner from '../components/Spinner';
import ArticleSEO from '../components/News/ArticleSEO';
import AdSenseSlot from '../components/News/AdSenseSlot';
import MarkdownContent from '../components/News/MarkdownContent';
import * as newsService from '../services/newsService';
import { useToast } from '../hooks/useToast';

export default function NewsDetailPage({ onBack, navigate: customNavigate }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { addToast } = useToast();

  const [article, setArticle] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [nextArticle, setNextArticle] = useState(null);
  const [prevArticle, setPrevArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const handleRetry = () => {
    setReloadKey((prev) => prev + 1);
  };
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [fontSize, setFontSize] = useState('normal'); // 'normal' | 'large' | 'xlarge'
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Monitor de scroll para la barra de lectura fija superior
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const totalScrollable = scrollHeight - clientHeight;
    if (totalScrollable <= 0) {
      setScrollProgress(100);
      return;
    }
    const currentProgress = (scrollTop / totalScrollable) * 100;
    setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadArticle = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await newsService.fetchNewsBySlug(slug);
        if (isMounted) {
          setArticle(data.article);
          setRelatedNews(data.relatedNews || []);
          setNextArticle(data.nextArticle || null);
          setPrevArticle(data.prevArticle || null);
          setLikesCount(data.article?.likes_count || 0);
          const alreadyLiked = localStorage.getItem(`liked_article_${data.article?.id}`) === 'true';
          setHasLiked(alreadyLiked);

          // Registrar lectura real y única por sesión de navegación (evita inflar con F5 o React StrictMode)
          const sessionKey = `viewed_news_session_${data.article?.id}`;
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, 'true');
            newsService.recordArticleView(slug).then(res => {
              if (res?.views_count !== undefined && isMounted) {
                setArticle(prev => prev ? { ...prev, views_count: res.views_count } : prev);
              }
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (slug) {
      loadArticle();
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    return () => { isMounted = false; };
  }, [slug, reloadKey]);

  const handleGoBack = () => {
    if (onBack) onBack();
    else if (customNavigate) customNavigate('noticias');
    else navigate('/noticias');
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://pro-fitness-glass.zeabur.app/noticias/${slug}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      addToast('Enlace copiado al portapapeles', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareNative = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: currentUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleToggleLike = async () => {
    if (!article) return;
    const nextLiked = !hasLiked;
    const action = nextLiked ? 'like' : 'unlike';

    // Actualización optimista inmediata
    setHasLiked(nextLiked);
    setLikesCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));

    if (nextLiked) {
      localStorage.setItem(`liked_article_${article.id}`, 'true');
      addToast('¡Gracias por valorar este artículo!', 'success');
    } else {
      localStorage.removeItem(`liked_article_${article.id}`);
      addToast('Valoración retirada', 'info');
    }

    try {
      const res = await newsService.toggleLikeArticle(article.slug, action);
      if (res && res.likes_count !== undefined) {
        setLikesCount(res.likes_count);
      }
    } catch (err) {
      console.error('Error al actualizar valoración en BD:', err);
      // Revertir optimismo si falló la conexión
      setHasLiked(!nextLiked);
      setLikesCount(prev => nextLiked ? Math.max(0, prev - 1) : prev + 1);
    }
  };

  const toggleFontSize = () => {
    if (fontSize === 'normal') setFontSize('large');
    else if (fontSize === 'large') setFontSize('xlarge');
    else setFontSize('normal');
  };

  const fontSizeLabels = {
    normal: 'A',
    large: 'A+',
    xlarge: 'A++'
  };

  const shareText = encodeURIComponent(article ? `${article.title} - Pro Fitness Glass` : '');
  const shareUrl = encodeURIComponent(currentUrl);

  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
  const telegramUrl = `https://t.me/share/url?url=${shareUrl}&text=${shareText}`;

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 z-50 bg-bg-primary flex flex-col items-center justify-center gap-3 px-4"
        style={{
          paddingTop: 'var(--safe-top, env(safe-area-inset-top, 0px))',
          paddingBottom: 'var(--safe-bottom, env(safe-area-inset-bottom, 0px))'
        }}
      >
        <Spinner size={40} />
        <p className="text-sm font-medium text-text-tertiary animate-pulse">Cargando artículo...</p>
      </div>
    );
  }

  if (error || !article) {
    const isNotFound = error?.status === 404 || (!error && !article);
    const errorMessage = typeof error === 'string'
      ? error
      : error?.message || (isNotFound ? 'El artículo que buscas ha sido trasladado o ya no está disponible.' : 'No pudimos conectar con el servidor.');

    return (
      <div
        className="fixed inset-0 z-50 bg-bg-primary overflow-y-auto px-4 py-16 text-center flex flex-col items-center justify-center gap-4 custom-scrollbar"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          paddingTop: 'var(--safe-top, env(safe-area-inset-top, 0px))',
          paddingBottom: 'var(--safe-bottom, env(safe-area-inset-bottom, 0px))'
        }}
      >
        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${isNotFound ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
          {isNotFound ? <BookOpen size={32} /> : <WifiOff size={32} />}
        </div>
        <h2 className="text-2xl font-black text-text-primary">
          {isNotFound ? 'Artículo no encontrado' : 'Problema de conexión'}
        </h2>
        <p className="text-text-secondary text-sm max-w-md leading-relaxed px-4">
          {errorMessage}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          {!isNotFound && (
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent text-accent-contrast font-bold text-xs shadow-md shadow-accent/20 cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <RefreshCw size={14} />
              Reintentar
            </button>
          )}
          <button
            type="button"
            onClick={handleGoBack}
            className={`px-6 py-2.5 rounded-full font-bold text-xs transition-all cursor-pointer ${
              isNotFound
                ? 'bg-accent text-accent-contrast shadow-md shadow-accent/20 hover:scale-105 active:scale-95'
                : 'bg-glass-surface hover:bg-glass-surface-hover text-text-primary border border-glass-border hover:scale-105 active:scale-95'
            }`}
          >
            Volver a Noticias
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="fixed inset-0 z-50 bg-bg-primary overflow-y-auto overflow-x-hidden custom-scrollbar"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        paddingTop: 'var(--safe-top, env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 3rem)'
      }}
    >
      {/* BARRA DE PROGRESO DE LECTURA SUPERIOR */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[100] bg-black/10 dark:bg-white/10 pointer-events-none">
        <div
          className="h-full bg-accent transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* CONTENEDOR EDITORIAL CENTRADO (ESTILO XATAKA / MEDIO DIGITAL) */}
      <article className="min-h-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col animate-[fade-in_0.3s_ease-out]">
        {/* COMPONENTE SEO COMPLETO (Meta, Open Graph, Twitter, JSON-LD NewsArticle) */}
        <ArticleSEO article={article} />

        {/* NAVEGACIÓN SUPERIOR / BREADCRUMB */}
        <nav aria-label="Ruta de navegación" className="flex items-center justify-between gap-3 pb-4 pt-1">
          <div className="flex items-center gap-2 text-xs font-bold text-text-tertiary">
            <button
              type="button"
              onClick={handleGoBack}
              className="cursor-pointer inline-flex items-center gap-1 text-text-secondary hover:text-accent transition-colors"
            >
              <ChevronLeft size={16} /> Noticias
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => navigate(`/noticias?category=${encodeURIComponent(article.category)}`)}
              className="cursor-pointer uppercase tracking-wider text-accent hover:underline transition-colors font-bold"
              title={`Ver artículos de ${article.category}`}
            >
              {article.category}
            </button>
          </div>

          {/* Control de tamaño de fuente A/A+/A++ */}
          <button
            type="button"
            onClick={toggleFontSize}
            title={`Tamaño de letra (actual: ${fontSize})`}
            className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/10 dark:ring-white/10 text-xs font-black text-text-secondary hover:text-text-primary transition-all active:scale-95"
          >
            <Type size={13} className="text-accent" />
            <span>{fontSizeLabels[fontSize]}</span>
          </button>
        </nav>

        {/* CABECERA EDITORIAL (TITULAR + ENTRADILLA) */}
        <header className="pt-2">
          {/* Categoría / Antetítulo */}
          <button
            type="button"
            onClick={() => navigate(`/noticias?category=${encodeURIComponent(article.category)}`)}
            className="cursor-pointer text-xs font-black uppercase tracking-widest text-accent mb-2 block hover:underline transition-colors"
            title={`Ver artículos de ${article.category}`}
          >
            {article.category}
          </button>

          {/* Gran Titular */}
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-text-primary tracking-tight leading-[1.2] mb-4">
            {article.title}
          </h1>

          {/* Entradilla (Subtítulo explicativo del reportaje) */}
          <p className="text-lg sm:text-xl text-text-secondary leading-relaxed font-normal mb-6">
            {article.summary}
          </p>

          {/* FIRMA DE AUTOR, FECHA Y BOTONES DE COMPARTIR (Línea de metadatos Xataka) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 border-y border-black/10 dark:border-white/10 gap-3 sm:gap-4 text-xs">
            <div className="flex items-start sm:items-center gap-3 min-w-0 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-black text-xs text-accent uppercase shrink-0 mt-0.5 sm:mt-0">
                {article.author_name.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-text-primary truncate">
                  Por <span className="text-accent">{article.author_name}</span>
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-text-tertiary text-xs sm:text-[11px] mt-1">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <Calendar size={12} className="shrink-0 text-text-secondary" />
                    <span>{format(new Date(article.published_at), "d 'de' MMMM, yyyy", { locale: es })}</span>
                  </span>
                  <span className="hidden sm:inline text-text-tertiary/40 select-none">•</span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <Clock size={12} className="shrink-0 text-text-secondary" />
                    <span>{article.reading_time} min de lectura</span>
                  </span>
                  <span className="hidden sm:inline text-text-tertiary/40 select-none">•</span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <Eye size={12} className="shrink-0 text-text-secondary" />
                    <span>{article.views_count === 1 ? '1 lectura' : `${(article.views_count || 0).toLocaleString()} lecturas`}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Botones Sociales con colores de marca siempre activos */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center pt-1 sm:pt-0">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/25 hover:scale-105 active:scale-95 transition-all shadow-xs"
                title="Compartir en WhatsApp"
              >
                <FaWhatsapp size={15} />
              </a>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/15 dark:bg-white/10 text-text-primary border border-black/20 dark:border-white/20 hover:bg-black/25 dark:hover:bg-white/20 hover:scale-105 active:scale-95 transition-all shadow-xs"
                title="Compartir en X"
              >
                <FaXTwitter size={13} />
              </a>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#229ED9]/15 text-[#229ED9] border border-[#229ED9]/30 hover:bg-[#229ED9]/25 hover:scale-105 active:scale-95 transition-all shadow-xs"
                title="Compartir en Telegram"
              >
                <FaTelegram size={14} />
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
                title="Copiar enlace"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </header>

        {/* FOTO PRINCIPAL / CABECERA CON PIE DE FOTO */}
        {article.image_url && (
          <figure className="my-6">
            <div className="rounded-2xl overflow-hidden bg-black/10 max-h-[460px] shadow-md ring-1 ring-black/10 dark:ring-white/10">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            <figcaption className="text-center text-xs text-text-tertiary mt-2 italic">
              Fotografía: Unsplash / Archivo Pro Fitness Glass
            </figcaption>
          </figure>
        )}

        {/* CUERPO DEL ARTÍCULO (FLUJO CONTINUO EDITORIAL) */}
        <section className="article-body py-2">
          <MarkdownContent content={article.content} fontSize={fontSize} />
        </section>

        {/* VALORACIÓN INTERACTIVA REAL "¿TE HA SERVIDO?" */}
        <div className="my-8 p-5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="text-sm font-bold text-text-primary">¿Te ha resultado útil esta información?</h4>
            <p className="text-xs text-text-secondary mt-0.5">Tu voto real se guarda en la base de datos para priorizar nuevos temas científicos.</p>
          </div>
          <button
            type="button"
            onClick={handleToggleLike}
            className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm ${
              hasLiked
                ? 'bg-accent text-accent-contrast shadow-accent/20 scale-105'
                : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary border border-black/10 dark:border-white/10'
            }`}
          >
            <ThumbsUp size={15} />
            <span>{hasLiked ? '¡Marcado como útil!' : 'Me ha servido'}</span>
            <span className="font-mono font-black text-xs px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
              {likesCount}
            </span>
          </button>
        </div>

        {/* ADSENSE IN-ARTICLE SLOT */}
        <div className="my-6">
          <AdSenseSlot slotId="noticias-in-article-banner" format="auto" />
        </div>

        {/* TEMAS / ETIQUETAS AL PIE (ESTILO XATAKA) */}
        {article.tags && (
          <div className="pt-6 pb-6 border-t border-black/10 dark:border-white/10">
            <span className="text-xs font-black uppercase tracking-wider text-text-tertiary block mb-3">
              Temas relacionados:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {article.tags.split(',').map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* FICHA EDITORIAL DEL AUTOR */}
        <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 flex items-center gap-4 my-6">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center font-black text-sm text-accent uppercase shrink-0">
            {article.author_name.slice(0, 2)}
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-text-primary">{article.author_name}</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Equipo de redacción y divulgación científica de Pro Fitness Glass. Artículos contrastados con la literatura de la ISSN, PubMed y NSCA.
            </p>
          </div>
        </div>

        {/* NAVEGACIÓN CONTINUA: ARTÍCULO ANTERIOR Y SIGUIENTE */}
        {(prevArticle || nextArticle) && (
          <nav aria-label="Navegación entre artículos" className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8 pt-6 border-t border-black/10 dark:border-white/10">
            {prevArticle ? (
              <div
                onClick={() => navigate(`/noticias/${prevArticle.slug}`)}
                className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <span className="text-[11px] font-black uppercase tracking-wider text-text-tertiary flex items-center gap-1 mb-1">
                  <ArrowLeft size={12} /> Noticia anterior
                </span>
                <span className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors line-clamp-2">
                  {prevArticle.title}
                </span>
              </div>
            ) : <div />}

            {nextArticle ? (
              <div
                onClick={() => navigate(`/noticias/${nextArticle.slug}`)}
                className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all cursor-pointer group flex flex-col justify-between text-right"
              >
                <span className="text-[11px] font-black uppercase tracking-wider text-accent flex items-center justify-end gap-1 mb-1">
                  Siguiente noticia <ArrowRight size={12} />
                </span>
                <span className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors line-clamp-2">
                  {nextArticle.title}
                </span>
              </div>
            ) : <div />}
          </nav>
        )}

        {/* ARTÍCULOS RELACIONADOS / TAMBIÉN TE PUEDE INTERESAR */}
        {relatedNews.length > 0 && (
          <section className="pt-8 pb-4 border-t border-black/10 dark:border-white/10 space-y-4">
            <h2 className="text-lg font-black uppercase tracking-wider text-text-primary">
              También te puede interesar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedNews.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => navigate(`/noticias/${rel.slug}`)}
                  className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 hover:border-accent/40 transition-all cursor-pointer group flex flex-col justify-between bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                >
                  <div className="h-32 bg-black/10 overflow-hidden relative">
                    <img
                      src={rel.image_url}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-sm text-white">
                      {rel.category}
                    </span>
                  </div>
                  <div className="p-3.5 flex flex-col gap-2">
                    <h4 className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                      {rel.title}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-text-tertiary pt-2 border-t border-black/5 dark:border-white/5">
                      <span>{rel.reading_time} min</span>
                      <span className="text-accent font-bold inline-flex items-center gap-0.5">
                        Leer <ArrowRight size={10} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
