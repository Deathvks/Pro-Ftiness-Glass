/* frontend/src/components/Admin/AdminNewsManager.jsx */
import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Plus,
  Sparkles,
  Trash2,
  Edit,
  Eye,
  Check,
  Search,
  BookOpen,
  ExternalLink,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import Spinner from '../Spinner';
import CustomSelect from '../CustomSelect';
import * as newsService from '../../services/newsService';
import { useToast } from '../../hooks/useToast';
import AdminNewsAutomation from './AdminNewsAutomation';

const DEFAULT_CATEGORIES = ['Entrenamiento', 'Nutrición', 'Suplementación', 'Salud', 'Novedades'];

export default function AdminNewsManager() {
  const { addToast } = useToast();

  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modos de vista: 'list' | 'editor' | 'ai' | 'automation'
  const [viewMode, setViewMode] = useState('list');
  const [editingArticle, setEditingArticle] = useState(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomAiCategory, setIsCustomAiCategory] = useState(false);

  // Categorías disponibles dinámicas: base + cualquier categoría creada en artículos
  const availableCategories = React.useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES);
    articles.forEach(a => {
      const c = (a.category || '').trim();
      if (c) set.add(c);
    });
    return Array.from(set);
  }, [articles]);

  // Formulario de edición / creación
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    category: 'Entrenamiento',
    tags: '',
    image_url: '',
    reading_time: 5,
    is_published: true
  });

  // Generador IA
  const [aiTopic, setAiTopic] = useState('');
  const [aiCategory, setAiCategory] = useState('Entrenamiento');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const data = await newsService.fetchAdminNews();
      setArticles(data.news || []);
      setTotal(data.total || (data.news ? data.news.length : 0));
    } catch (err) {
      addToast(err.message || 'Error al cargar noticias', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setIsCustomCategory(false);
    setFormData({
      title: '',
      slug: '',
      summary: '',
      content: '',
      category: 'Entrenamiento',
      tags: '',
      image_url: '',
      reading_time: 5,
      is_published: true
    });
    setViewMode('editor');
  };

  const handleOpenEdit = async (art) => {
    try {
      const full = await newsService.fetchNewsBySlug(art.slug);
      setEditingArticle(full.article);
      const artCat = full.article.category || 'Entrenamiento';
      setIsCustomCategory(!DEFAULT_CATEGORIES.includes(artCat) && !availableCategories.includes(artCat));
      setFormData({
        title: full.article.title || '',
        slug: full.article.slug || '',
        summary: full.article.summary || '',
        content: full.article.content || '',
        category: artCat,
        tags: full.article.tags || '',
        image_url: full.article.image_url || '',
        reading_time: full.article.reading_time || 5,
        is_published: full.article.is_published !== false
      });
      setViewMode('editor');
    } catch (err) {
      addToast('Error al obtener datos del artículo', 'error');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`¿Seguro que deseas eliminar "${title}"?`)) return;
    try {
      await newsService.deleteNews(id);
      addToast('Artículo eliminado', 'success');
      setArticles(prev => prev.filter(a => a.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      addToast(err.message || 'Error al eliminar', 'error');
    }
  };

  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.summary || !formData.content) {
      addToast('Completa título, resumen y contenido', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (editingArticle?.id) {
        await newsService.updateNews(editingArticle.id, formData);
        addToast('Artículo actualizado con éxito', 'success');
      } else {
        await newsService.createNews(formData);
        addToast('Artículo publicado con éxito', 'success');
      }
      setViewMode('list');
      loadArticles();
    } catch (err) {
      addToast(err.message || 'Error al guardar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAI = async (e) => {
    e.preventDefault();
    if (!aiTopic.trim()) {
      addToast('Escribe un tema para la IA', 'error');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const data = await newsService.generateAINews({
        topic: aiTopic,
        category: aiCategory
      });

      const generated = data.article;
      setEditingArticle(null);
      setFormData({
        title: generated.title || '',
        slug: generated.slug || '',
        summary: generated.summary || '',
        content: generated.content || '',
        category: generated.category || aiCategory,
        tags: generated.tags || '',
        image_url: generated.image_url || '',
        reading_time: generated.reading_time || 5,
        is_published: true
      });
      addToast('¡Artículo generado con éxito! Revisa y publica.', 'success');
      setViewMode('editor');
    } catch (err) {
      addToast(err.message || 'Error en la generación de IA', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-left w-full min-w-0">
      {/* HEADER DE GESTIÓN RESPONSIVE */}
      <div className="flex flex-col gap-3 pb-4 border-b border-black/5 dark:border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-text-primary flex items-center gap-2">
              <Newspaper className="text-accent shrink-0" size={24} />
              <span className="truncate">Gestión de Noticias y Blog</span>
            </h2>
            <p className="text-text-secondary text-xs sm:text-sm font-medium mt-0.5 leading-relaxed">
              Artículos públicos indexables por Google y optimizados para SEO y AdSense.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.open('/noticias', '_blank')}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-accent/10 hover:bg-accent/20 text-xs font-bold text-accent transition-colors flex items-center gap-1.5 shrink-0"
            title="Abrir sección pública de noticias"
          >
            <span>Ver web pública</span>
            <ExternalLink size={13} />
          </button>
        </div>

        {/* Barra de pestañas táctil y scrollable en móvil */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
          <button
            type="button"
            onClick={() => { setViewMode('list'); loadArticles(); }}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 active:scale-95 ${
              viewMode === 'list'
                ? 'bg-accent text-accent-contrast shadow-sm shadow-accent/20'
                : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 text-text-secondary'
            }`}
          >
            <Newspaper size={14} />
            <span>Artículos ({total})</span>
          </button>

          {viewMode === 'list' && (
            <button
              type="button"
              onClick={() => loadArticles()}
              disabled={isLoading}
              className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 text-text-secondary active:scale-95 transition-all flex items-center justify-center shrink-0"
              title="Refrescar lista de noticias"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin text-accent" : ""} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setViewMode('automation')}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 border active:scale-95 ${
              viewMode === 'automation'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-sm shadow-orange-500/25'
                : 'border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20'
            }`}
          >
            <Clock size={14} />
            <span>Automatización Gemini</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('ai')}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 active:scale-95 ${
              viewMode === 'ai'
                ? 'bg-accent text-accent-contrast shadow-sm'
                : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 text-text-secondary'
            }`}
          >
            <Sparkles size={14} />
            <span>Generar Asistido</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 active:scale-95 ${
              viewMode === 'editor' && !editingArticle
                ? 'bg-accent text-accent-contrast shadow-sm'
                : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 text-text-secondary'
            }`}
          >
            <Plus size={14} />
            <span>Redactar</span>
          </button>
        </div>
      </div>

      {/* VISTA: AUTOMATIZACIÓN DIARIA CON GEMINI */}
      {viewMode === 'automation' && (
        <AdminNewsAutomation
          onNavigateToArticle={(slug) => {
            window.open(`/noticias/${slug}`, '_blank');
          }}
          onAutomationComplete={() => {
            loadArticles();
          }}
        />
      )}

      {/* VISTA: LISTADO */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Spinner size={36} />
              <p className="text-xs text-text-tertiary">Cargando noticias...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="py-16 text-center text-text-secondary text-sm">
              No hay artículos en la base de datos.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="p-3.5 sm:p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 hover:border-accent/30 transition-all overflow-hidden"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    {art.image_url ? (
                      <img
                        src={art.image_url}
                        alt=""
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover shrink-0 bg-black/10"
                        onError={(e) => { e.currentTarget.src = '/entrenamiento.png'; }}
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                        <Newspaper size={22} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-accent/15 text-accent shrink-0">
                          {art.category}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-text-tertiary font-semibold flex items-center gap-1 shrink-0">
                          <Clock size={11} /> {art.reading_time} min
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-text-tertiary font-semibold flex items-center gap-1 shrink-0">
                          <Eye size={11} /> {art.views_count || 0}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-base text-text-primary line-clamp-2 break-words">
                        {art.title}
                      </h4>
                      <p className="text-[11px] text-text-tertiary truncate mt-0.5 font-mono">
                        /noticias/{art.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5 dark:border-white/5">
                    <button
                      onClick={() => window.open(`/noticias/${art.slug}`, '_blank')}
                      className="p-2 sm:p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-text-secondary transition-colors"
                      title="Ver en la web"
                    >
                      <ExternalLink size={15} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(art)}
                      className="p-2 sm:p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-text-primary transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Editar artículo"
                    >
                      <Edit size={15} />
                      <span className="sm:hidden text-xs">Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(art.id, art.title)}
                      className="p-2 sm:p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                      title="Eliminar artículo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VISTA: GENERADOR IA */}
      {viewMode === 'ai' && (
        <form onSubmit={handleGenerateAI} className="space-y-4 max-w-xl mx-auto py-4 sm:py-8 px-1">
          <div className="text-center space-y-1 mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-accent/20 text-accent flex items-center justify-center mx-auto mb-3 shadow-md shadow-accent/20">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-text-primary">
              Generador Inteligente con Google Gemini 2.5 Flash
            </h3>
            <p className="text-xs text-text-secondary max-w-md mx-auto">
              Escribe un tema de fitness o nutrición. La IA generará título SEO, slug, resumen para meta description y artículo completo en Markdown.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
              Tema o Título del artículo:
            </label>
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Ej. Cuánta proteína asimila el cuerpo por comida: La ciencia real"
              className="box-border w-full h-11 bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 rounded-xl sm:rounded-2xl px-3.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={isGeneratingAI}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                Categoría:
              </label>
              <button
                type="button"
                onClick={() => setIsCustomAiCategory(!isCustomAiCategory)}
                className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
              >
                {isCustomAiCategory ? 'Elegir existente' : '+ Crear nueva'}
              </button>
            </div>
            {isCustomAiCategory ? (
              <input
                type="text"
                value={aiCategory}
                onChange={(e) => setAiCategory(e.target.value)}
                placeholder="Nombre de nueva categoría (ej. Cardio, Biomecánica)"
                className="box-border w-full h-11 bg-black/5 dark:bg-white/5 border border-accent/40 rounded-xl sm:rounded-2xl px-3.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={isGeneratingAI}
              />
            ) : (
              <CustomSelect
                value={aiCategory}
                onChange={(val) => {
                  if (val === '__NEW__') {
                    setIsCustomAiCategory(true);
                    setAiCategory('');
                  } else {
                    setAiCategory(val);
                  }
                }}
                options={[
                  ...availableCategories.map(cat => ({ value: cat, label: cat })),
                  { value: '__NEW__', label: '+ Crear nueva categoría...' }
                ]}
                className="w-full"
                triggerClassName="w-full h-11 bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 rounded-xl sm:rounded-2xl px-3.5 text-xs sm:text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent flex items-center justify-between gap-2"
                textClassName="text-xs sm:text-sm font-semibold truncate flex-1 text-left"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={isGeneratingAI}
            className="w-full py-3.5 sm:py-4 rounded-2xl bg-accent text-accent-contrast font-black text-xs sm:text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/25 disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingAI ? (
              <>
                <Spinner size="small" color="white" />
                <span>Generando artículo científico con IA...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Generar Borrador Completo</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* VISTA: EDITOR */}
      {viewMode === 'editor' && (
        <form onSubmit={handleSaveArticle} className="space-y-4 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
            <div className="min-w-0 sm:col-span-2">
              <label className="block text-xs font-bold text-text-secondary mb-1">Título del Artículo:</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título potente para SEO"
                className="box-border w-full h-11 bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 rounded-xl sm:rounded-2xl px-3.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-text-secondary mb-1">Slug (URL amigable):</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="ej-creatina-dosis-diaria"
                className="box-border w-full h-11 bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 rounded-xl sm:rounded-2xl px-3.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent font-mono"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-text-secondary">Categoría:</label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
                >
                  {isCustomCategory ? 'Elegir existente' : '+ Crear nueva'}
                </button>
              </div>
              {isCustomCategory ? (
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Nombre de la nueva categoría (ej. Cardio, Biomecánica)"
                  className="box-border w-full h-11 bg-black/5 dark:bg-white/5 border border-accent/40 rounded-xl sm:rounded-2xl px-3.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              ) : (
                <CustomSelect
                  value={formData.category}
                  onChange={(val) => {
                    if (val === '__NEW__') {
                      setIsCustomCategory(true);
                      setFormData({ ...formData, category: '' });
                    } else {
                      setFormData({ ...formData, category: val });
                    }
                  }}
                  options={[
                    ...availableCategories.map(cat => ({ value: cat, label: cat })),
                    { value: '__NEW__', label: '+ Crear nueva categoría...' }
                  ]}
                  className="w-full"
                  triggerClassName="w-full h-11 bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 rounded-xl sm:rounded-2xl px-3.5 text-xs sm:text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent flex items-center justify-between gap-2"
                textClassName="text-xs sm:text-sm font-semibold truncate flex-1 text-left"
                />
              )}
            </div>

            <div className="min-w-0 sm:col-span-2">
              <label className="block text-xs font-bold text-text-secondary mb-1">Imagen de portada URL:</label>
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="box-border w-full h-11 bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 rounded-xl sm:rounded-2xl px-3.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="min-w-0 sm:col-span-2">
              <label className="block text-xs font-bold text-text-secondary mb-1">Resumen (Meta Description):</label>
              <textarea
                rows={2}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Breve resumen de 2 frases para Google y redes sociales..."
                className="box-border w-full bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div className="min-w-0 sm:col-span-2">
              <label className="block text-xs font-bold text-text-secondary mb-1">Contenido (Markdown):</label>
              <textarea
                rows={12}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="## Subtítulo&#10;&#10;Contenido del artículo...&#10;&#10;* Puntos clave"
                className="box-border w-full bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-accent custom-scrollbar resize-y"
                required
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-text-secondary mb-1">Etiquetas (separadas por comas):</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="fuerza, creatina, dieta"
                className="box-border w-full h-11 bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 rounded-xl sm:rounded-2xl px-3.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="min-w-0 flex items-center gap-3 pt-2 sm:pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-text-primary select-none">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 rounded text-accent"
                />
                <span>Publicado (Visible e indexable)</span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 border-t border-black/5 dark:border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-5 py-2.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-bold text-text-secondary transition-colors text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-full bg-accent text-accent-contrast font-black text-xs flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md shadow-accent/25 cursor-pointer"
            >
              {isSaving ? <Spinner size="small" color="white" /> : <Check size={16} />}
              <span>{editingArticle ? 'Actualizar Artículo' : 'Publicar Artículo'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
