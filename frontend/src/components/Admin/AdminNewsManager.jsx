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
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import Spinner from '../Spinner';
import * as newsService from '../../services/newsService';
import { useToast } from '../../hooks/useToast';

const CATEGORIES = ['Entrenamiento', 'Nutrición', 'Suplementación', 'Salud', 'Novedades'];

export default function AdminNewsManager() {
  const { addToast } = useToast();

  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modos de vista: 'list' | 'editor' | 'ai'
  const [viewMode, setViewMode] = useState('list');
  const [editingArticle, setEditingArticle] = useState(null);

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
      const data = await newsService.fetchPublicNews({ page: 1, limit: 100 });
      setArticles(data.news || []);
      setTotal(data.total || 0);
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
      setFormData({
        title: full.article.title || '',
        slug: full.article.slug || '',
        summary: full.article.summary || '',
        content: full.article.content || '',
        category: full.article.category || 'Entrenamiento',
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
    <div className="space-y-6 text-left">
      {/* HEADER DE GESTIÓN */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
        <div>
          <h2 className="text-2xl font-extrabold text-text-primary flex items-center gap-2">
            <Newspaper className="text-accent" /> Gestión de Noticias y Blog
          </h2>
          <p className="text-text-secondary text-sm font-medium mt-1">
            Artículos públicos indexables por Google y preparados para monetizar con AdSense.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {viewMode !== 'list' && (
            <button
              onClick={() => setViewMode('list')}
              className="px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-bold text-text-secondary transition-colors"
            >
              Volver a la lista
            </button>
          )}
          <button
            onClick={() => window.open('/noticias', '_blank')}
            className="px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-bold text-accent transition-colors flex items-center gap-1.5"
          >
            <span>Ver web pública</span>
            <ExternalLink size={13} />
          </button>
          <button
            onClick={() => setViewMode('ai')}
            className="px-4 py-2 rounded-full bg-accent text-accent-contrast hover:scale-105 active:scale-95 text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-accent/20"
          >
            <Sparkles size={14} />
            <span>Generar con IA</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/15 text-xs font-bold text-text-primary transition-all flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Redactar</span>
          </button>
        </div>
      </div>

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
                  className="p-4 sm:p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-accent/30 transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {art.image_url ? (
                      <img
                        src={art.image_url}
                        alt=""
                        className="w-16 h-16 rounded-2xl object-cover shrink-0 bg-black/10"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                        <Newspaper size={24} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/15 text-accent">
                          {art.category}
                        </span>
                        <span className="text-[11px] text-text-tertiary font-semibold flex items-center gap-1">
                          <Clock size={11} /> {art.reading_time} min
                        </span>
                        <span className="text-[11px] text-text-tertiary font-semibold flex items-center gap-1">
                          <Eye size={11} /> {art.views_count || 0} lecturas
                        </span>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-text-primary truncate">
                        {art.title}
                      </h4>
                      <p className="text-xs text-text-tertiary truncate mt-0.5">
                        /noticias/{art.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => window.open(`/noticias/${art.slug}`, '_blank')}
                      className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-text-secondary transition-colors"
                      title="Ver en la web"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(art)}
                      className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-text-primary transition-colors"
                      title="Editar artículo"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(art.id, art.title)}
                      className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                      title="Eliminar artículo"
                    >
                      <Trash2 size={16} />
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
        <form onSubmit={handleGenerateAI} className="space-y-4 max-w-xl mx-auto py-8">
          <div className="text-center space-y-1 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-accent/20 text-accent flex items-center justify-center mx-auto mb-3 shadow-md shadow-accent/20">
              <Sparkles size={28} />
            </div>
            <h3 className="text-xl font-black text-text-primary">
              Generador Inteligente con Google Gemini 2.5 Flash
            </h3>
            <p className="text-xs text-text-secondary">
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
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-3.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={isGeneratingAI}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
              Categoría:
            </label>
            <select
              value={aiCategory}
              onChange={(e) => setAiCategory(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-3.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={isGeneratingAI}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} className="bg-bg-primary text-text-primary">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isGeneratingAI}
            className="w-full py-4 rounded-2xl bg-accent text-accent-contrast font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/25 disabled:opacity-50 cursor-pointer"
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
        <form onSubmit={handleSaveArticle} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-text-secondary mb-1">Título del Artículo:</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título potente para SEO"
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Slug (URL amigable):</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="ej-creatina-dosis-diaria"
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Categoría:</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-bg-primary text-text-primary">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-text-secondary mb-1">Imagen de portada URL:</label>
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-text-secondary mb-1">Resumen (Meta Description):</label>
              <textarea
                rows={2}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Breve resumen de 2 frases para Google y redes sociales..."
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-text-secondary mb-1">Contenido (Markdown):</label>
              <textarea
                rows={14}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="## Subtítulo&#10;&#10;Contenido del artículo...&#10;&#10;* Puntos clave"
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-3 text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-accent custom-scrollbar"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Etiquetas (separadas por comas):</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="fuerza, creatina, dieta"
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-text-primary">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 rounded text-accent"
                />
                <span>Publicado (Visible al público e indexable por Google)</span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-black/5 dark:border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-5 py-2.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-bold text-text-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-full bg-accent text-accent-contrast font-black text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md shadow-accent/25 cursor-pointer"
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
