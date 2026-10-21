/* frontend/src/pages/NewsDetailPage.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  Clock,
  Eye,
  Share2,
  Bookmark,
  Check,
  Copy,
  ArrowRight,
  Sparkles,
  BookOpen,
  Send
} from 'lucide-react';
import { FaWhatsapp, FaXTwitter, FaTelegram } from 'react-icons/fa6';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import GlassCard from '../components/GlassCard';
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

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      addToast('Enlace copiado al portapapeles', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
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
      className="fixed inset-0 z-50 bg-bg-primary overflow-y-auto overflow-x-hidden custom-scrollbar"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        paddingTop: 'var(--safe-top, env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 2rem)'
      }}
    >
      <article className="min-h-full px-4 sm:px-6 py-6 max-w-4xl mx-auto flex flex-col gap-6 animate-[fade-in_0.4s_ease-out]">
      {/* COMPONENTE SEO COMPLETO (Meta, Open Graph, Twitter, JSON-LD NewsArticle) */}
      <ArticleSEO article={article} />

      {/* NAVEGACIÓN SUPERIOR / BREADCRUMBS */}
      <nav aria-label="Ruta de navegación" className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={handleGoBack}
          className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full ring-1 ring-black/10 dark:ring-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-xs font-bold text-text-secondary"
        >
          <ChevronLeft size={16} /> Volver a Noticias
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-text-tertiary">
          <Link to="/" className="hover:text-text-primary transition-colors">Inicio</Link>
          <span>/</span>
          <Link to="/noticias" className="hover:text-text-primary transition-colors">Noticias</Link>
          <span>/</span>
          <span className="text-accent font-semibold">{article.category}</span>
        </div>
      </nav>

      {/* CABECERA DEL ARTÍCULO */}
      <header className="space-y-4 pt-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-accent text-accent-contrast shadow-sm">
            {article.category}
          </span>
          <span className="text-xs font-semibold text-text-tertiary flex items-center gap-1">
            <Calendar size={13} />
            {format(new Date(article.published_at), "d 'de' MMMM, yyyy", { locale: es })}
          </span>
          <span className="text-xs text-text-tertiary">•</span>
          <span className="text-xs font-semibold text-text-tertiary flex items-center gap-1">
            <Clock size={13} />
            {article.reading_time} min de lectura
          </span>
          {article.views_count > 0 && (
            <>
              <span className="text-xs text-text-tertiary">•</span>
              <span className="text-xs font-semibold text-text-tertiary flex items-center gap-1">
                <Eye size={13} />
                {article.views_count.toLocaleString()} lecturas
              </span>
            </>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-text-primary tracking-tight leading-tight">
          {article.title}
        </h1>

        <p className="text-text-secondary text-base sm:text-lg leading-relaxed font-medium pt-1 border-l-2 border-accent pl-4">
          {article.summary}
        </p>

        {/* Autor y botón compartir rápido */}
        <div className="flex items-center justify-between pt-4 pb-2 border-b border-black/5 dark:border-white/10 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-black text-sm text-accent uppercase">
              {article.author_name.slice(0, 2)}
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary">{article.author_name}</p>
              <p className="text-[11px] text-text-tertiary">Autor en Pro Fitness Glass</p>
            </div>
          </div>

          {/* Botones de compartir */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareNative}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold transition-colors cursor-pointer"
              title="Compartir"
            >
              <Share2 size={14} className="text-accent" />
              <span>Compartir</span>
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors"
              title="Compartir en WhatsApp"
            >
              <FaWhatsapp size={16} />
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary transition-colors"
              title="Compartir en X"
            >
              <FaXTwitter size={15} />
            </a>
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Copiar enlace"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* IMAGEN DE PORTADA PRINCIPAL */}
      {article.image_url && (
        <div className="relative rounded-[32px] overflow-hidden bg-black/10 max-h-[460px] shadow-lg ring-1 ring-black/5 dark:ring-white/10 my-2">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
      )}

      {/* CUERPO DEL ARTÍCULO */}
      <section className="article-content py-2">
        <MarkdownContent content={article.content} />
      </section>

      {/* ADSENSE IN-ARTICLE SLOT */}
      <AdSenseSlot slotId="noticias-in-article-banner" format="auto" />

      {/* ETIQUETAS */}
      {article.tags && (
        <div className="flex items-center gap-2 flex-wrap py-2 border-t border-black/5 dark:border-white/10">
          <span className="text-xs font-bold text-text-tertiary">Temas:</span>
          {article.tags.split(',').map((tag, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/5 dark:bg-white/5 text-text-secondary border border-black/5 dark:border-white/10"
            >
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* BANNER CTA: REGISTRO / APP CONVERSION */}
      <GlassCard className="glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-accent/30 bg-gradient-to-br from-accent/15 via-bg-primary to-bg-primary text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl my-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-accent/20 text-accent">
            <Sparkles size={13} />
            Tu gimnasio inteligente
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-text-primary">
            Aplica esta ciencia a tus entrenamientos hoy
          </h3>
          <p className="text-xs sm:text-sm text-text-secondary max-w-lg">
            Crea tus rutinas personalizadas, monitoriza tus récords con gráficos interactivos y calcula tus macros con inteligencia artificial.
          </p>
        </div>
        <Link
          to="/register"
          className="shrink-0 px-6 py-3.5 rounded-full bg-accent text-accent-contrast font-black text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/25"
        >
          <span>Empezar Gratis</span>
          <ArrowRight size={18} />
        </Link>
      </GlassCard>

      {/* ARTÍCULOS RELACIONADOS */}
      {relatedNews.length > 0 && (
        <section className="py-6 space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
            Artículos Relacionados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedNews.map((rel) => (
              <GlassCard
                key={rel.id}
                onClick={() => navigate(`/noticias/${rel.slug}`)}
                className="glass p-0 rounded-2xl overflow-hidden border-none ring-1 ring-black/5 dark:ring-white/10 hover:ring-accent/40 transition-all cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-lg"
              >
                <div className="h-32 bg-black/10 overflow-hidden relative">
                  <img
                    src={rel.image_url}
                    alt={rel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/15">
                    {rel.category}
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <h4 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors line-clamp-2">
                    {rel.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-black/5 dark:border-white/5">
                    <span>{rel.reading_time} min lectura</span>
                    <span className="text-accent font-bold inline-flex items-center gap-0.5">
                      Leer <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}
      </article>
    </div>
  );
}
