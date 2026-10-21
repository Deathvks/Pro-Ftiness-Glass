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
  BookOpen,
  ThumbsUp,
  Type
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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
          const baseLikes = Math.max(15, Math.floor((data.article?.views_count || 60) * 0.18));
          setLikesCount(baseLikes);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Error al cargar la noticia');
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
  }, [slug]);

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

  const handleToggleLike = () => {
    if (!hasLiked) {
      setHasLiked(true);
      setLikesCount(prev => prev + 1);
      addToast('¡Gracias por valorar este artículo!', 'success');
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
        <BookOpen size={48} className="text-red-500 opacity-60" />
        <h2 className="text-2xl font-black text-text-primary">Artículo no encontrado</h2>
        <p className="text-text-secondary text-sm max-w-md">
          {error || 'El artículo que buscas ha sido trasladado o ya no está disponible.'}
        </p>
        <button
          type="button"
          onClick={handleGoBack}
          className="mt-2 px-6 py-2.5 rounded-full bg-accent text-accent-contrast font-bold text-xs shadow-md shadow-accent/20 cursor-pointer hover:scale-105 active:scale-95 transition-all"
        >
          Volver a Noticias
        </button>
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
            <span className="uppercase tracking-wider text-accent">{article.category}</span>
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
          <span className="text-xs font-black uppercase tracking-widest text-accent mb-2 block">
            {article.category}
          </span>

          {/* Gran Titular */}
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-text-primary tracking-tight leading-[1.2] mb-4">
            {article.title}
          </h1>

          {/* Entradilla (Subtítulo explicativo del reportaje) */}
          <p className="text-lg sm:text-xl text-text-secondary leading-relaxed font-normal mb-6">
            {article.summary}
          </p>

          {/* FIRMA DE AUTOR, FECHA Y BOTONES DE COMPARTIR (Línea de metadatos Xataka) */}
          <div className="flex items-center justify-between py-4 border-y border-black/10 dark:border-white/10 flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-black text-xs text-accent uppercase">
                {article.author_name.slice(0, 2)}
              </div>
              <div>
                <p className="font-bold text-text-primary">
                  Por <span className="text-accent">{article.author_name}</span>
                </p>
                <div className="flex items-center gap-2 text-text-tertiary text-[11px] mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {format(new Date(article.published_at), "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {article.reading_time} min de lectura
                  </span>
                  {article.views_count > 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {article.views_count.toLocaleString()} lecturas
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Botones Sociales */}
            <div className="flex items-center gap-1.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-500 text-text-secondary transition-colors"
                title="Compartir en WhatsApp"
              >
                <FaWhatsapp size={15} />
              </a>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
                title="Compartir en X"
              >
                <FaXTwitter size={14} />
              </a>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-text-secondary transition-colors"
                title="Compartir en Telegram"
              >
                <FaTelegram size={15} />
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                title="Copiar enlace"
              >
                {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
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

        {/* VALORACIÓN INTERACTIVA "¿TE HA GUSTADO?" */}
        <div className="my-8 p-5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="text-sm font-bold text-text-primary">¿Te ha gustado este artículo?</h4>
            <p className="text-xs text-text-secondary mt-0.5">Tu valoración nos ayuda a preparar más guías gratuitas.</p>
          </div>
          <button
            type="button"
            onClick={handleToggleLike}
            className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
              hasLiked
                ? 'bg-accent text-accent-contrast shadow-sm'
                : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary border border-black/10 dark:border-white/10'
            }`}
          >
            <ThumbsUp size={14} />
            <span>{hasLiked ? '¡Te ha gustado!' : 'Me ha servido'}</span>
            <span className="opacity-75 font-mono">({likesCount})</span>
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
