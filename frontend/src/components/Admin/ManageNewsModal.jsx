/* frontend/src/components/Admin/ManageNewsModal.jsx */
import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Sparkles,
  Trash2,
  Edit,
  Eye,
  Check,
  RefreshCw,
  Search,
  BookOpen,
  Send,
  ExternalLink
} from 'lucide-react';
import GlassCard from '../GlassCard';
import ModalPortal from '../ModalPortal';
import Spinner from '../Spinner';
import * as newsService from '../../services/newsService';
import { useToast } from '../../hooks/useToast';

const CATEGORIES = ['Entrenamiento', 'Nutrición', 'Suplementación', 'Salud', 'Novedades'];

export default function ManageNewsModal({ isOpen, onClose }) {
  const { addToast } = useToast();

  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modo edición / creación
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'editor' | 'ai'
  const [editingArticle, setEditingArticle] = useState(null);

  // Formulario manual
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
      const data = await newsService.fetchPublicNews({ page: 1, limit: 50 });
      setArticles(data.news || []);
    } catch (err) {
      addToast(err.message || 'Error al cargar noticias', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadArticles();
    }
  }, [isOpen]);

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
    setActiveTab('editor');
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
      setActiveTab('editor');
    } catch (err) {
      addToast('Error al obtener datos completos del artículo', 'error');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`¿Seguro que deseas eliminar "${title}"?`)) return;
    try {
      await newsService.deleteNews(id);
      addToast('Artículo eliminado', 'success');
      setArticles(prev => prev.filter(a => a.id !== id));
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
      setActiveTab('list');
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
      setActiveTab('editor');
    } catch (err) {
      addToast(err.message || 'Error en la generación de IA', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-[fade-in_0.2s_ease-out]"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-4xl max-h-[90vh] rounded-[32px] bg-bg-primary shadow-2xl flex flex-col overflow-hidden border border-black/10 dark:border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER MODAL */}
          <div className="p-5 sm:p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-bg-primary">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center text-accent">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="font-black text-lg sm:text-xl text-text-primary">
                  Gestión de Noticias y Artículos
                </h3>
                <p className="text-xs text-text-secondary">
                  Contenido indexable por Google y monetizable con AdSense
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* TABS DE ACCIÓN */}
          <div className="px-6 pt-3 flex gap-2 border-b border-black/5 dark:border-white/10 text-xs font-bold">
            <button
              onClick={() => setActiveTab('list')}
              className={`pb-3 px-3 transition-colors border-b-2 ${
                activeTab === 'list'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Artículos ({articles.length})
            </button>
            <button
              onClick={handleOpenCreate}
              className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'editor' && !editingArticle
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Plus size={14} /> Redactar Manual
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'ai'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Sparkles size={14} className="text-accent" /> Generar con IA
            </button>
          </div>

          {/* CUERPO SEGÚN TAB ACTIVA */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar space-y-4">
            {activeTab === 'list' && (
              <>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-text-secondary">
                    Artículos publicados accesibles para Google y visitantes
                  </p>
                  <button
                    onClick={() => window.open('/noticias', '_blank')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold text-accent transition-colors"
                  >
                    <span>Ver web pública</span>
                    <ExternalLink size={12} />
                  </button>
                </div>

                {isLoading ? (
                  <div className="py-12 flex justify-center">
                    <Spinner size={32} />
                  </div>
                ) : articles.length === 0 ? (
                  <div className="py-12 text-center text-text-secondary text-sm">
                    No hay artículos creados aún. Usa el generador con IA para crear el primero en 5 segundos.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {articles.map((art) => (
                      <div
                        key={art.id}
                        className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {art.image_url && (
                            <img
                              src={art.image_url}
                              alt=""
                              className="w-12 h-12 rounded-xl object-cover shrink-0 bg-black/10"
                            />
                          )}
                          <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-accent">
                              {art.category}
                            </span>
                            <h4 className="font-bold text-sm text-text-primary truncate">
                              {art.title}
                            </h4>
                            <p className="text-xs text-text-tertiary truncate">
                              /noticias/{art.slug} • {art.views_count || 0} lecturas
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => window.open(`/noticias/${art.slug}`, '_blank')}
                            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-text-secondary"
                            title="Ver artículo"
                          >
                            <ExternalLink size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(art)}
                            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-text-primary"
                            title="Editar artículo"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(art.id, art.title)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500"
                            title="Eliminar artículo"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'ai' && (
              <form onSubmit={handleGenerateAI} className="space-y-4 max-w-xl mx-auto py-4">
                <div className="text-center space-y-1 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-accent/20 text-accent flex items-center justify-center mx-auto mb-2">
                    <Sparkles size={24} />
                  </div>
                  <h4 className="text-lg font-black text-text-primary">
                    Generador de Artículos Científicos con IA
                  </h4>
                  <p className="text-xs text-text-secondary">
                    Google Gemini 2.5 Flash redactará un artículo completo de 500-800 palabras con rigor, subtítulos, formato markdown y optimización SEO.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                    Tema o Título deseado:
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Ej. La verdad sobre la ventana anabólica post-entreno"
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
                  className="w-full py-4 rounded-2xl bg-accent text-accent-contrast font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/25 disabled:opacity-50"
                >
                  {isGeneratingAI ? (
                    <>
                      <Spinner size="small" color="white" />
                      <span>Generando con IA (puede tardar 4 segundos)...</span>
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

            {activeTab === 'editor' && (
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
                    <label className="block text-xs font-bold text-text-secondary mb-1">Slug (URL limpia):</label>
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
                      rows={12}
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
                      <span>Publicado (Visible al público)</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-black/5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-5 py-2.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-bold text-text-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-full bg-accent text-accent-contrast font-black text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md shadow-accent/25"
                  >
                    {isSaving ? <Spinner size="small" color="white" /> : <Check size={16} />}
                    <span>{editingArticle ? 'Actualizar Artículo' : 'Publicar Artículo'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
