/* frontend/src/pages/NewsDetailPage.jsx */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Sparkles,
  BookOpen,
  ThumbsUp,
  Bookmark,
  Layers,
  ChevronDown,
  ChevronUp,
  Flame,
  Award,
  Type
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [fontSize, setFontSize] = useState('normal'); // 'normal' | 'large' | 'xlarge'
  const [isTocOpen, setIsTocOpen] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Monitor de scroll para barra de progreso de lectura
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
          // Inicializar likes simulados basados en views para gamificación
          const baseLikes = Math.max(12, Math.floor((data.article?.views_count || 50) * 0.18));
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

  // Extraer el índice rápido de contenidos a partir de los encabezados ## del artículo
  const tableOfContents = useMemo(() => {
    if (!article?.content) return [];
    const matches = article.content.match(/^##\s+(.+)$/gm) || [];
    return matches.map((heading) => {
      const rawText = heading.replace(/^##\s+/, '').trim();
      const id = rawText
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      return { title: rawText, id };
    });
  }, [article?.content]);

  const handleJumpToSection = (id) => {
    const targetElement = document.getElementById(id);
    if (targetElement && containerRef.current) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

  const handleToggleLike = () => {
    if (!hasLiked) {
      setHasLiked(true);
      setLikesCount(prev => prev + 1);
      addToast('¡Gracias! Te ha gustado este artículo', 'success');
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
        <p className="text-sm font-medium text-text-tertiary animate-pulse">Cargando artículo científico...</p>
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
        paddingBottom: 'calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 2.5rem)'
      }}
    >
      {/* BARRA DE PROGRESO DE LECTURA FIJA SUPERIOR */}
      <div className="fixed top-0 left-0 right-0 h-1.5 z-[100] bg-black/10 dark:bg-white/10 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-accent to-emerald-400 transition-all duration-150 shadow-sm shadow-accent/50"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <article className="min-h-full px-4 sm:px-6 py-6 max-w-4xl mx-auto flex flex-col gap-8 animate-[fade-in_0.4s_ease-out]">
        {/* COMPONENTE SEO COMPLETO (Meta, Open Graph, Twitter, JSON-LD NewsArticle) */}
        <ArticleSEO article={article} />

        {/* NAVEGACIÓN SUPERIOR / BREADCRUMBS Y CONTROLES DE LECTURA */}
        <nav aria-label="Ruta de navegación" className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleGoBack}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full ring-1 ring-black/10 dark:ring-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-xs font-bold text-text-secondary"
          >
            <ChevronLeft size={16} /> Volver a Noticias
          </button>

          <div className="flex items-center gap-2">
            {/* Control de tamaño de letra de lectura */}
            <button
              type="button"
              onClick={toggleFontSize}
              title={`Ajustar tamaño de letra (actual: ${fontSize})`}
              className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/10 dark:ring-white/10 text-xs font-black text-text-secondary hover:text-text-primary transition-all active:scale-95"
            >
              <Type size={14} className="text-accent" />
              <span>{fontSizeLabels[fontSize]}</span>
            </button>

            {/* Compartir Rápido */}
            <button
              type="button"
              onClick={handleShareNative}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/10 dark:ring-white/10 text-xs font-bold text-text-secondary hover:text-text-primary transition-all active:scale-95"
              title="Compartir"
            >
              <Share2 size={14} className="text-accent" />
              <span className="hidden sm:inline">Compartir</span>
            </button>
          </div>
        </nav>

        {/* CABECERA DEL ARTÍCULO */}
        <header className="space-y-5 pt-2">
          {/* Etiquetas y Metadatos */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-accent text-accent-contrast shadow-sm shadow-accent/20">
              {article.category}
            </span>
            <span className="text-xs font-semibold text-text-tertiary flex items-center gap-1.5">
              <Calendar size={13} />
              {format(new Date(article.published_at), "d 'de' MMMM, yyyy", { locale: es })}
            </span>
            <span className="text-xs text-text-tertiary">•</span>
            <span className="text-xs font-semibold text-text-tertiary flex items-center gap-1.5">
              <Clock size={13} />
              {article.reading_time} min de lectura
            </span>
            {article.views_count > 0 && (
              <>
                <span className="text-xs text-text-tertiary">•</span>
                <span className="text-xs font-semibold text-text-tertiary flex items-center gap-1.5">
                  <Eye size={13} />
                  {article.views_count.toLocaleString()} lecturas
                </span>
              </>
            )}
          </div>

          {/* TÍTULO PRINCIPAL EDITORIAL */}
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-text-primary tracking-tight leading-[1.15]">
            {article.title}
          </h1>

          {/* AUTOR Y REDES DE COMPARTIR */}
          <div className="flex items-center justify-between pt-4 pb-4 border-y border-black/5 dark:border-white/10 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-accent/20 ring-2 ring-accent/30 flex items-center justify-center font-black text-sm text-accent uppercase shadow-inner">
                {article.author_name.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-black text-text-primary">{article.author_name}</p>
                  <Award size={14} className="text-accent" title="Autor verificado en ciencias del deporte" />
                </div>
                <p className="text-xs text-text-tertiary">Especialista en Entrenamiento y Nutrición</p>
              </div>
            </div>

            {/* Accesos a Redes Sociales */}
            <div className="flex items-center gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors"
                title="Compartir en WhatsApp"
              >
                <FaWhatsapp size={16} />
              </a>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary transition-colors"
                title="Compartir en X"
              >
                <FaXTwitter size={15} />
              </a>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                title="Compartir en Telegram"
              >
                <FaTelegram size={16} />
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                title="Copiar enlace"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </header>

        {/* IMAGEN DE PORTADA PRINCIPAL */}
        {article.image_url && (
          <div className="relative rounded-[32px] overflow-hidden bg-black/10 max-h-[460px] shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        )}

        {/* RESUMEN EJECUTIVO / TL;DR (Apple Keynote Style) */}
        <GlassCard className="glass p-6 sm:p-7 rounded-[28px] border-none ring-1 ring-accent/30 bg-gradient-to-br from-accent/10 via-black/5 dark:via-white/5 to-transparent shadow-xl">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-accent mb-3">
            <Sparkles size={15} />
            <span>Resumen Ejecutivo (30 Segundos)</span>
          </div>
          <p className="text-text-primary/95 text-base sm:text-lg leading-relaxed font-semibold">
            {article.summary}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-black/5 dark:border-white/10 text-xs">
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Evidencia revisada</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span>{article.category}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Aplicación práctica</span>
            </div>
          </div>
        </GlassCard>

        {/* ÍNDICE RÁPIDO DE SECCIONES (TABLE OF CONTENTS) */}
        {tableOfContents.length > 1 && (
          <div className="rounded-[24px] p-5 sm:p-6 bg-black/5 dark:bg-white/5 ring-1 ring-black/10 dark:ring-white/10 shadow-sm">
            <button
              type="button"
              onClick={() => setIsTocOpen(!isTocOpen)}
              className="w-full flex items-center justify-between text-left font-black text-sm uppercase tracking-wider text-text-primary cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} className="text-accent" />
                <span>Índice del Artículo ({tableOfContents.length} Secciones)</span>
              </div>
              {isTocOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {isTocOpen && (
              <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 flex flex-wrap gap-2">
                {tableOfContents.map((section, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleJumpToSection(section.id)}
                    className="cursor-pointer text-left text-xs font-semibold px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-accent hover:text-accent-contrast ring-1 ring-black/5 dark:ring-white/10 transition-all flex items-center gap-2 text-text-secondary hover:scale-105 active:scale-95"
                  >
                    <span className="text-[10px] font-mono opacity-60">#{idx + 1}</span>
                    <span className="line-clamp-1">{section.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CUERPO DEL ARTÍCULO RENDERIZADO */}
        <section className="article-content py-2">
          <MarkdownContent
            content={article.content}
            fontSize={fontSize}
            onSectionNavigate={handleJumpToSection}
          />
        </section>

        {/* REACCIÓN / FEEDBACK INTERACTIVO "¿TE FUE ÚTIL?" */}
        <div className="my-6 p-6 rounded-[28px] bg-black/5 dark:bg-white/5 ring-1 ring-black/10 dark:ring-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-sm">
          <div>
            <h4 className="text-base font-black text-text-primary">¿Te ha resultado útil esta lectura?</h4>
            <p className="text-xs text-text-secondary mt-0.5">Ayúdanos a seguir redactando guías científicas gratuitas.</p>
          </div>
          <button
            type="button"
            onClick={handleToggleLike}
            className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all active:scale-95 shadow-md ${
              hasLiked
                ? 'bg-accent text-accent-contrast shadow-accent/25 scale-105'
                : 'bg-black/10 dark:bg-white/10 hover:bg-accent hover:text-accent-contrast text-text-primary'
            }`}
          >
            <ThumbsUp size={15} />
            <span>{hasLiked ? '¡Marcado como útil!' : 'Me ha servido'}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px] font-mono">
              {likesCount}
            </span>
          </button>
        </div>

        {/* ADSENSE IN-ARTICLE SLOT */}
        <AdSenseSlot slotId="noticias-in-article-banner" format="auto" />

        {/* ETIQUETAS */}
        {article.tags && (
          <div className="flex items-center gap-2 flex-wrap py-3 border-t border-black/5 dark:border-white/10">
            <span className="text-xs font-bold text-text-tertiary">Temas clave:</span>
            {article.tags.split(',').map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-black/5 dark:bg-white/5 text-text-secondary border border-black/5 dark:border-white/10 hover:border-accent/30 transition-colors"
              >
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* AUTOR BIO CARD */}
        <div className="p-6 rounded-[28px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent/20 ring-2 ring-accent/30 flex items-center justify-center font-black text-lg text-accent uppercase shrink-0 shadow-inner">
            {article.author_name.slice(0, 2)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-text-primary">{article.author_name}</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/15 text-accent">
                Verificado
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Equipo editorial y científico de Pro Fitness Glass. Contrastamos cada afirmación con la literatura científica más reciente de la ISSN, PubMed y NSCA.
            </p>
          </div>
        </div>

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
            <p className="text-xs sm:text-sm text-text-secondary max-w-lg leading-relaxed">
              Crea tus rutinas personalizadas, monitoriza tus récords con gráficos interactivos y calcula tus macros con inteligencia artificial.
            </p>
          </div>
          <Link
            to="/register"
            className="shrink-0 px-6 py-3.5 rounded-full bg-accent text-accent-contrast font-black text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/25 cursor-pointer"
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
