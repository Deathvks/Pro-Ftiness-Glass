/* frontend/src/components/Admin/NewsContentEditor.jsx */
import React, { useState, useRef, useEffect } from 'react';
import {
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Lightbulb,
  Sparkles,
  AlertTriangle,
  Quote,
  Table,
  Link as LinkIcon,
  Eye,
  Edit3,
  Columns,
  HelpCircle,
  X,
  Clock,
  FileText
} from 'lucide-react';
import MarkdownContent from '../News/MarkdownContent';

/**
 * Editor editorial en lenguaje humano para noticias y artículos.
 * Elimina la confusión de símbolos crudos (#, *, |) ofreciendo una barra
 * de herramientas visual en español, inserción asistida y vista previa en vivo.
 */
export default function NewsContentEditor({
  content = '',
  onChange,
  onReadingTimeChange,
  placeholder = 'Escribe o pega aquí el contenido de tu artículo. Usa los botones superiores para añadir títulos, negritas o cajas de consejos con un solo clic...'
}) {
  const textareaRef = useRef(null);
  const [viewMode, setViewMode] = useState('write'); // 'write' | 'preview' | 'split'
  const [showHumanGuide, setShowHumanGuide] = useState(false);

  // Estadísticas en tiempo real en lenguaje humano
  const wordCount = (content || '').trim() ? (content || '').trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 180));

  useEffect(() => {
    if (onReadingTimeChange) {
      onReadingTimeChange(readingTime);
    }
  }, [readingTime, onReadingTimeChange]);

  /**
   * Aplica formato en lenguaje humano al texto seleccionado o inserta una plantilla lista.
   */
  const applyFormat = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = content || '';
    const selectedText = currentText.substring(start, end);

    let replacement = '';
    let newCursorPos = start;

    switch (type) {
      case 'h2': {
        // Título de Sección
        if (selectedText) {
          const clean = selectedText.replace(/^#+\s*/, '').trim();
          replacement = `\n\n## ${clean}\n\n`;
        } else {
          replacement = `\n\n## Nuevo Título de Sección\n\n`;
        }
        break;
      }
      case 'h3': {
        // Subtítulo
        if (selectedText) {
          const clean = selectedText.replace(/^#+\s*/, '').trim();
          replacement = `\n\n### ${clean}\n\n`;
        } else {
          replacement = `\n\n### Nuevo Subtítulo Secundario\n\n`;
        }
        break;
      }
      case 'bold': {
        // Negrita
        if (selectedText) {
          if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length >= 4) {
            replacement = selectedText.slice(2, -2);
          } else {
            replacement = `**${selectedText}**`;
          }
        } else {
          replacement = `**palabra clave en negrita**`;
        }
        break;
      }
      case 'italic': {
        // Cursiva
        if (selectedText) {
          if (selectedText.startsWith('*') && selectedText.endsWith('*') && !selectedText.startsWith('**') && selectedText.length >= 2) {
            replacement = selectedText.slice(1, -1);
          } else {
            replacement = `*${selectedText}*`;
          }
        } else {
          replacement = `*texto en cursiva*`;
        }
        break;
      }
      case 'tip': {
        // Caja de Consejo Práctico (Verde Esmeralda)
        const tipText = selectedText.trim() || 'Aplica este consejo en tu rutina diaria para maximizar tus resultados.';
        replacement = `\n\n> [!TIP]\n> **Consejo Práctico:** ${tipText}\n\n`;
        break;
      }
      case 'important': {
        // Evidencia Científica (Dorado / Ámbar)
        const evidenceText = selectedText.trim() || 'Los estudios clínicos más recientes demuestran que este método optimiza la recuperación.';
        replacement = `\n\n> [!IMPORTANT]\n> **Evidencia Científica:** ${evidenceText}\n\n`;
        break;
      }
      case 'warning': {
        // Advertencia / Atención (Rojo / Rosa)
        const warnText = selectedText.trim() || 'Evita sobrecargar la zona si sientes molestias articulares agudas.';
        replacement = `\n\n> [!WARNING]\n> **Atención:** ${warnText}\n\n`;
        break;
      }
      case 'quote': {
        // Cita destacada
        const quoteText = selectedText.trim() || 'El progreso constante y la disciplina superan a la motivación pasajera.';
        replacement = `\n\n> "${quoteText}"\n\n`;
        break;
      }
      case 'ul': {
        // Lista con Viñetas
        if (selectedText) {
          const lines = selectedText.split('\n').filter(l => l.trim().length > 0);
          replacement = '\n' + lines.map(line => `* ${line.replace(/^[\*\-\d\.]+\s*/, '').trim()}`).join('\n') + '\n';
        } else {
          replacement = `\n* Primer punto clave del artículo\n* Segundo punto relevante\n* Tercer punto a recordar\n`;
        }
        break;
      }
      case 'ol': {
        // Lista Numerada paso a paso
        if (selectedText) {
          const lines = selectedText.split('\n').filter(l => l.trim().length > 0);
          replacement = '\n' + lines.map((line, idx) => `${idx + 1}. ${line.replace(/^[\*\-\d\.]+\s*/, '').trim()}`).join('\n') + '\n';
        } else {
          replacement = `\n1. Paso uno: Preparación\n2. Paso dos: Ejecución controlada\n3. Paso tres: Recuperación activa\n`;
        }
        break;
      }
      case 'table': {
        // Tabla comparativa en lenguaje humano
        replacement = `\n\n| Fase / Aspecto | Beneficio Principal | Recomendación |\n| --- | --- | --- |\n| Fase concéntrica | Fuerza explosiva | 1 a 2 segundos |\n| Fase excéntrica | Mayor estímulo e hipertrofia | 3 a 4 segundos |\n| Pausa isométrica | Control articular | 1 segundo |\n\n`;
        break;
      }
      case 'link': {
        // Enlace Web
        const linkText = selectedText.trim() || 'texto visible del enlace';
        replacement = `[${linkText}](https://enlace-a-fuente.com)`;
        break;
      }
      default:
        return;
    }

    const before = currentText.substring(0, start);
    const after = currentText.substring(end);
    const newContent = before + replacement + after;

    onChange(newContent);

    // Volver a dar foco al editor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        newCursorPos = start + replacement.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 15);
  };

  return (
    <div className="w-full space-y-2 text-left">
      {/* CABECERA CON TÍTULO, ESTADÍSTICAS Y SELECTOR DE VISTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <FileText size={14} className="text-accent" />
            <span>Contenido del Artículo</span>
          </label>
          <span className="text-[11px] text-text-secondary bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock size={11} className="text-accent" />
            <span>{wordCount} palabras • ~{readingTime} min de lectura</span>
          </span>
        </div>

        {/* Pestañas de modo de vista */}
        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl self-start sm:self-auto border border-black/5 dark:border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('write')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'write'
                ? 'bg-accent text-accent-contrast shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Escribir con botones de formato visual"
          >
            <Edit3 size={13} />
            <span>Redactar</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'preview'
                ? 'bg-accent text-accent-contrast shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Ver cómo lo leerán los usuarios sin símbolos"
          >
            <Eye size={13} />
            <span>Vista Previa</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`hidden md:flex px-2.5 py-1 rounded-lg text-xs font-bold transition-all items-center gap-1.5 ${
              viewMode === 'split'
                ? 'bg-accent text-accent-contrast shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Escribir a la izquierda y ver el resultado en vivo a la derecha"
          >
            <Columns size={13} />
            <span>Dividido</span>
          </button>
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS EN LENGUAJE HUMANO (Solo visible en modos escribir o dividido) */}
      {viewMode !== 'preview' && (
        <div className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 p-2 sm:p-2.5 flex flex-wrap items-center gap-1.5 shadow-sm">
          {/* TÍTULOS */}
          <div className="flex items-center gap-1 pr-1 border-r border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => applyFormat('h2')}
              className="px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Añadir o convertir en Título de Sección principal"
            >
              <Heading2 size={15} className="text-accent" />
              <span>Título</span>
            </button>
            <button
              type="button"
              onClick={() => applyFormat('h3')}
              className="px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Añadir o convertir en Subtítulo de sección"
            >
              <Heading3 size={14} className="text-accent" />
              <span>Subtítulo</span>
            </button>
          </div>

          {/* ÉNFASIS */}
          <div className="flex items-center gap-1 pr-1 border-r border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => applyFormat('bold')}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Poner texto seleccionado en Negrita"
            >
              <Bold size={14} />
              <span className="hidden sm:inline">Negrita</span>
            </button>
            <button
              type="button"
              onClick={() => applyFormat('italic')}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Poner texto en Cursiva"
            >
              <Italic size={14} />
              <span className="hidden sm:inline">Cursiva</span>
            </button>
          </div>

          {/* CAJAS EDITORIALES DESTACADAS */}
          <div className="flex items-center gap-1 pr-1 border-r border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => applyFormat('tip')}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Inserta una caja verde de Consejo Práctico para los lectores"
            >
              <Lightbulb size={14} className="shrink-0" />
              <span>Consejo Práctico</span>
            </button>
            <button
              type="button"
              onClick={() => applyFormat('important')}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Inserta una caja dorada de Evidencia Científica"
            >
              <Sparkles size={14} className="shrink-0" />
              <span className="hidden sm:inline">Evidencia</span>
            </button>
            <button
              type="button"
              onClick={() => applyFormat('warning')}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Inserta una caja de Atención / Error común"
            >
              <AlertTriangle size={14} className="shrink-0" />
              <span className="hidden sm:inline">Atención</span>
            </button>
          </div>

          {/* LISTAS Y TABLAS */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => applyFormat('ul')}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Lista con viñetas"
            >
              <List size={14} />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              type="button"
              onClick={() => applyFormat('ol')}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Lista numerada de pasos"
            >
              <ListOrdered size={14} />
              <span className="hidden sm:inline">Pasos</span>
            </button>
            <button
              type="button"
              onClick={() => applyFormat('table')}
              className="px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Insertar tabla comparativa"
            >
              <Table size={14} />
              <span>Tabla</span>
            </button>
            <button
              type="button"
              onClick={() => applyFormat('quote')}
              className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary text-xs font-bold transition-all active:scale-95"
              title="Cita célebre o frase destacada"
            >
              <Quote size={14} />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('link')}
              className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary text-xs font-bold transition-all active:scale-95"
              title="Insertar enlace web"
            >
              <LinkIcon size={14} />
            </button>
          </div>

          {/* BOTÓN DE GUÍA EN LENGUAJE HUMANO */}
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => setShowHumanGuide(!showHumanGuide)}
              className="px-2.5 py-1 rounded-full bg-accent/10 hover:bg-accent/20 text-accent text-xs font-bold flex items-center gap-1 transition-colors"
              title="¿Cómo funciona este editor en lenguaje humano?"
            >
              <HelpCircle size={13} />
              <span className="hidden sm:inline">¿Cómo funciona?</span>
            </button>
          </div>
        </div>
      )}

      {/* GUÍA EXPLICATIVA EN LENGUAJE HUMANO (Desplegable amigable) */}
      {showHumanGuide && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-accent/5 border border-accent/20 space-y-2 text-xs animate-[fade-in_0.2s_ease-out]">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-accent flex items-center gap-1.5">
              <Lightbulb size={15} />
              <span>Edición en Lenguaje Humano (Sin aprender códigos)</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowHumanGuide(false)}
              className="p-1 rounded-full hover:bg-black/10 text-text-secondary"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-text-secondary leading-relaxed">
            No necesitas memorizar símbolos extraños como <code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-accent">#</code> o <code className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-accent">*</code>. Simplemente escribe con normalidad, selecciona cualquier frase con el cursor y haz clic en los botones de arriba:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-text-primary font-medium">
            <div className="flex items-center gap-2">
              <span className="font-bold text-accent">Título:</span> Divide el artículo en secciones grandes y legibles.
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-accent">Negrita:</span> Resalta frases clave para el lector y para Google SEO.
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-500">Consejo Práctico:</span> Crea una tarjeta verde con bombilla de recomendación.
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-500">Evidencia:</span> Crea una tarjeta dorada con datos de estudios científicos.
            </div>
          </div>
          <p className="text-[11px] text-text-tertiary pt-1 border-t border-accent/15">
            Tip: Haz clic en la pestaña <strong className="text-text-primary">"Vista Previa"</strong> en cualquier momento para comprobar el resultado final tal y como lo verán tus usuarios.
          </p>
        </div>
      )}

      {/* ÁREA DE CONTENIDO SEGÚN MODO */}
      {viewMode === 'write' && (
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={14}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="box-border w-full bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent custom-scrollbar resize-y leading-relaxed font-sans"
            required
          />
        </div>
      )}

      {viewMode === 'preview' && (
        <div className="p-4 sm:p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 max-h-[500px] overflow-y-auto custom-scrollbar">
          <div className="mb-4 pb-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between text-xs text-text-secondary">
            <span className="font-bold text-accent flex items-center gap-1.5">
              <Eye size={14} />
              <span>Vista previa editorial (Como lo verá el lector)</span>
            </span>
            <span>{wordCount} palabras</span>
          </div>
          {content ? (
            <MarkdownContent content={content} />
          ) : (
            <div className="py-12 text-center text-text-tertiary text-xs italic">
              El artículo aún está vacío. Cambia a "Redactar" para empezar a escribir.
            </div>
          )}
        </div>
      )}

      {viewMode === 'split' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={14}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="box-border w-full h-[450px] bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 rounded-2xl p-3.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent custom-scrollbar resize-none leading-relaxed font-sans"
              required
            />
          </div>
          <div className="h-[450px] overflow-y-auto p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 custom-scrollbar">
            <div className="mb-3 pb-2 border-b border-black/10 dark:border-white/10 text-[11px] font-bold text-accent flex items-center gap-1">
              <Eye size={13} />
              <span>Resultado en tiempo real</span>
            </div>
            {content ? (
              <MarkdownContent content={content} />
            ) : (
              <div className="py-12 text-center text-text-tertiary text-xs italic">
                Escribe a la izquierda para ver el resultado visual aquí.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
