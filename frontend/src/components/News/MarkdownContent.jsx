/* frontend/src/components/News/MarkdownContent.jsx */
import React from 'react';
import {
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  Sparkles,
  Quote,
  Layers,
  Dumbbell,
  Utensils,
  Award,
  Flame,
  HelpCircle
} from 'lucide-react';
import GlassCard from '../GlassCard';

/**
 * Renderizador de Markdown estructurado en Bloques/Tarjetas independientes (Liquid Glass).
 * Transforma cada apartado (##) en un módulo visual elevado con icono temático,
 * bordes esmerilados y aire tipográfico para evitar la monotonía de texto continuo.
 */
export default function MarkdownContent({ content = '', fontSize = 'normal', onSectionNavigate }) {
  if (!content) return null;

  // Clases dinámicas de tamaño de fuente
  const fontSizes = {
    normal: {
      p: 'text-[16px] sm:text-[17.5px] leading-[1.85]',
      li: 'text-[15.5px] sm:text-[17px] leading-relaxed',
      alert: 'text-[15px] sm:text-[16.5px] leading-relaxed'
    },
    large: {
      p: 'text-[17.5px] sm:text-[19px] leading-[1.9]',
      li: 'text-[17px] sm:text-[18.5px] leading-relaxed',
      alert: 'text-[16px] sm:text-[17.5px] leading-relaxed'
    },
    xlarge: {
      p: 'text-[19px] sm:text-[21px] leading-[1.95]',
      li: 'text-[18.5px] sm:text-[20px] leading-relaxed',
      alert: 'text-[17.5px] sm:text-[19px] leading-relaxed'
    }
  };

  const activeFont = fontSizes[fontSize] || fontSizes.normal;

  const renderInline = (text) => {
    if (!text) return '';

    const boldRegex = /\*\*([^*]+)\*\*/g;
    const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)/g;
    const codeRegex = /`([^`]+)`/g;
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    return (
      <span
        dangerouslySetInnerHTML={{
          __html: text
            .replace(boldRegex, '<strong class="font-extrabold text-text-primary tracking-tight">$1</strong>')
            .replace(italicRegex, '<em class="italic text-text-secondary/90 font-medium">$1</em>')
            .replace(codeRegex, '<code class="px-2 py-0.5 rounded-lg bg-black/10 dark:bg-white/10 text-accent font-mono text-xs sm:text-sm font-semibold border border-black/5 dark:border-white/10">$1</code>')
            .replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent font-semibold underline underline-offset-4 decoration-accent/40 hover:decoration-accent transition-colors">$1</a>')
        }}
      />
    );
  };

  const slugify = (str) =>
    str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  // Detectar icono apropiado según el título del bloque
  const getSectionIcon = (title = '') => {
    const t = title.toLowerCase();
    if (/mito|error|falso|bulo/i.test(t)) return <AlertCircle size={20} />;
    if (/c[oó]mo funciona|qu[eé] es|mecanismo|fisiolog/i.test(t)) return <Lightbulb size={20} />;
    if (/protocolo|dosis|formas|estrategia|paso|c[aá]lculo|variables/i.test(t)) return <Layers size={20} />;
    if (/entreno|fuerza|m[uú]sculo|hipertrofia|estimulo|sobrecarga/i.test(t)) return <Dumbbell size={20} />;
    if (/nutrici[oó]n|calor|dieta|comida|prote[ií]na|d[eé]ficit/i.test(t)) return <Utensils size={20} />;
    if (/rir|fallo|intensidad|fatiga/i.test(t)) return <Flame size={20} />;
    if (/puntos clave|conclusi[oó]n|resumen|takeaway/i.test(t)) return <Award size={20} />;
    return <Sparkles size={20} />;
  };

  // Dividir el contenido en secciones lógicas basándonos en encabezados '## '
  const lines = content.split('\n');
  const sections = [];
  let currentSection = {
    title: null,
    id: 'introduccion',
    lines: []
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('## ')) {
      // Si la sección actual tiene contenido o título, la guardamos
      if (currentSection.lines.length > 0 || currentSection.title) {
        sections.push(currentSection);
      }
      const title = trimmed.replace('## ', '').trim();
      currentSection = {
        title,
        id: slugify(title),
        lines: []
      };
    } else {
      currentSection.lines.push(line);
    }
  }

  if (currentSection.lines.length > 0 || currentSection.title) {
    sections.push(currentSection);
  }

  // Parser interno para procesar los elementos de una sección
  const parseSectionElements = (sectionLines) => {
    const elements = [];
    let currentList = [];
    let listType = null;
    let inBlockquote = false;
    let blockquoteType = 'quote';
    let blockquoteLines = [];
    let inTable = false;
    let tableHeader = [];
    let tableRows = [];

    const flushList = () => {
      if (currentList.length > 0) {
        if (listType === 'ol') {
          elements.push(
            <ol key={`ol-${elements.length}`} className="space-y-3.5 my-5 pl-1">
              {currentList.map((item, idx) => (
                <li key={idx} className={`flex items-start gap-3.5 text-text-primary/95 ${activeFont.li}`}>
                  <span className="w-6 h-6 rounded-full bg-accent text-accent-contrast text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-accent/25 ring-2 ring-accent/20">
                    {idx + 1}
                  </span>
                  <span className="flex-1">{renderInline(item)}</span>
                </li>
              ))}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`ul-${elements.length}`} className="space-y-3.5 my-5 pl-1">
              {currentList.map((item, idx) => (
                <li key={idx} className={`flex items-start gap-3 text-text-primary/95 ${activeFont.li}`}>
                  <span className="w-5 h-5 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-1 ring-1 ring-accent/30 shadow-xs">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="flex-1">{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        currentList = [];
        listType = null;
      }
    };

    const flushBlockquote = () => {
      if (blockquoteLines.length > 0) {
        const bqText = blockquoteLines.join(' ');
        let alertIcon = null;
        let alertClass = 'bg-black/5 dark:bg-white/5 border-accent/40 text-text-primary';
        let iconBgClass = 'bg-accent/15 text-accent';
        let titleColorClass = 'text-accent';
        let alertTitle = 'NOTA CLAVE';

        if (blockquoteType === 'tip') {
          alertIcon = <Lightbulb size={20} className="text-emerald-400" />;
          alertClass = 'bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/5';
          iconBgClass = 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30';
          titleColorClass = 'text-emerald-400';
          alertTitle = 'CONSEJO DE ENTRENAMIENTO';
        } else if (blockquoteType === 'important') {
          alertIcon = <Sparkles size={20} className="text-amber-400" />;
          alertClass = 'bg-amber-500/10 border-amber-500/30 shadow-amber-500/5';
          iconBgClass = 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30';
          titleColorClass = 'text-amber-400';
          alertTitle = 'EVIDENCIA CIENTÍFICA';
        } else if (blockquoteType === 'warning') {
          alertIcon = <AlertTriangle size={20} className="text-rose-400" />;
          alertClass = 'bg-rose-500/10 border-rose-500/30 shadow-rose-500/5';
          iconBgClass = 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30';
          titleColorClass = 'text-rose-400';
          alertTitle = 'PRECAUCIÓN';
        } else if (blockquoteType === 'note') {
          alertIcon = <Info size={20} className="text-blue-400" />;
          alertClass = 'bg-blue-500/10 border-blue-500/30 shadow-blue-500/5';
          iconBgClass = 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30';
          titleColorClass = 'text-blue-400';
          alertTitle = 'APUNTE CLAVE';
        }

        if (blockquoteType === 'quote') {
          elements.push(
            <blockquote
              key={`quote-${elements.length}`}
              className="my-5 p-6 rounded-[24px] bg-black/5 dark:bg-white/5 border-l-4 border-accent shadow-md ring-1 ring-black/5 dark:ring-white/10 relative overflow-hidden"
            >
              <Quote size={40} className="absolute -top-2 -right-2 text-accent/10 select-none pointer-events-none" />
              <div className={`relative z-10 italic text-text-primary/95 font-medium ${activeFont.p}`}>
                {renderInline(bqText)}
              </div>
            </blockquote>
          );
        } else {
          elements.push(
            <div
              key={`bq-${elements.length}`}
              className={`p-5 rounded-[24px] my-5 border shadow-md flex flex-col sm:flex-row gap-4 items-start ring-1 ring-black/5 dark:ring-white/10 ${alertClass}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${iconBgClass}`}>
                {alertIcon}
              </div>
              <div className="flex-1 space-y-1">
                <div className={`text-xs font-black uppercase tracking-wider ${titleColorClass}`}>
                  {alertTitle}
                </div>
                <div className={`text-text-primary/95 ${activeFont.alert}`}>
                  {renderInline(bqText)}
                </div>
              </div>
            </div>
          );
        }

        blockquoteLines = [];
        inBlockquote = false;
        blockquoteType = 'quote';
      }
    };

    const flushTable = () => {
      if (tableHeader.length > 0) {
        elements.push(
          <div
            key={`table-${elements.length}`}
            className="my-6 overflow-x-auto rounded-[24px] ring-1 ring-black/10 dark:ring-white/10 bg-black/10 dark:bg-white/5 shadow-inner"
          >
            <table className="w-full text-left text-sm sm:text-base border-collapse">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/10">
                  {tableHeader.map((th, i) => (
                    <th key={i} className="py-3.5 px-4 font-black uppercase tracking-wider text-xs text-accent">
                      {renderInline(th.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-3.5 px-4 text-text-primary/90 font-medium">
                        {renderInline(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableHeader = [];
        tableRows = [];
        inTable = false;
      }
    };

    for (let j = 0; j < sectionLines.length; j++) {
      const line = sectionLines[j];
      const trimmed = line.trim();

      // 1. Table Detection
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList();
        flushBlockquote();

        const cells = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());

        const isDivider = cells.every((c) => /^:?-+:?$/.test(c));

        if (isDivider) continue;

        if (!inTable) {
          inTable = true;
          tableHeader = cells;
        } else {
          tableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        flushTable();
      }

      // 2. Blockquotes
      if (trimmed.startsWith('>')) {
        flushList();
        flushTable();
        const contentAfter = trimmed.replace(/^>\s*/, '');

        if (contentAfter.startsWith('[!TIP]')) {
          flushBlockquote();
          inBlockquote = true;
          blockquoteType = 'tip';
          continue;
        } else if (contentAfter.startsWith('[!IMPORTANT]')) {
          flushBlockquote();
          inBlockquote = true;
          blockquoteType = 'important';
          continue;
        } else if (contentAfter.startsWith('[!WARNING]')) {
          flushBlockquote();
          inBlockquote = true;
          blockquoteType = 'warning';
          continue;
        } else if (contentAfter.startsWith('[!NOTE]')) {
          flushBlockquote();
          inBlockquote = true;
          blockquoteType = 'note';
          continue;
        }

        inBlockquote = true;
        blockquoteLines.push(contentAfter);
        continue;
      } else if (inBlockquote && trimmed !== '') {
        blockquoteLines.push(trimmed);
        continue;
      } else if (inBlockquote && trimmed === '') {
        flushBlockquote();
      }

      // 3. Horizontal Rule
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        flushList();
        flushBlockquote();
        flushTable();
        elements.push(
          <div key={`hr-${j}`} className="my-6 h-px bg-gradient-to-r from-transparent via-black/15 dark:via-white/15 to-transparent" />
        );
        continue;
      }

      // 4. Subheadings (###)
      if (trimmed.startsWith('### ')) {
        flushList();
        flushBlockquote();
        flushTable();
        const subTitle = trimmed.replace('### ', '');
        const subId = slugify(subTitle);

        elements.push(
          <div key={`sub-${j}`} className="pt-3 pb-1">
            <h3
              id={subId}
              className="scroll-mt-24 text-lg sm:text-xl font-black text-text-primary tracking-tight flex items-center gap-2.5"
            >
              <span className="w-2 h-2 rounded-full bg-accent shrink-0 shadow-sm shadow-accent/40" />
              <span>{renderInline(subTitle)}</span>
            </h3>
          </div>
        );
        continue;
      }

      // 5. Lists
      const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
      if (bulletMatch) {
        flushBlockquote();
        flushTable();
        if (listType !== 'ul') flushList();
        listType = 'ul';
        currentList.push(bulletMatch[1]);
        continue;
      }

      const numberMatch = trimmed.match(/^\d+\.\s+(.*)$/);
      if (numberMatch) {
        flushBlockquote();
        flushTable();
        if (listType !== 'ol') flushList();
        listType = 'ol';
        currentList.push(numberMatch[1]);
        continue;
      }

      // 6. Empty Line
      if (trimmed === '') {
        flushList();
        flushBlockquote();
        flushTable();
        continue;
      }

      // 7. Regular Paragraph
      flushList();
      flushBlockquote();
      flushTable();
      elements.push(
        <p key={`p-${j}`} className={`text-text-primary/95 font-normal tracking-normal ${activeFont.p}`}>
          {renderInline(trimmed)}
        </p>
      );
    }

    flushList();
    flushBlockquote();
    flushTable();

    return elements;
  };

  return (
    <div className="article-sections-container space-y-8 sm:space-y-10 my-4">
      {sections.map((section, idx) => {
        const isKeyTakeaways = /puntos clave|conclusi[oó]n|takeaways|resumen/i.test(section.title || '');
        const sectionIcon = getSectionIcon(section.title);
        const sectionElements = parseSectionElements(section.lines);

        if (sectionElements.length === 0 && !section.title) return null;

        const cardBorderClass = isKeyTakeaways
          ? 'ring-2 ring-accent/60 bg-gradient-to-br from-accent/15 via-bg-secondary/50 to-bg-primary shadow-2xl shadow-accent/10'
          : 'ring-1 ring-black/10 dark:ring-white/10 bg-bg-secondary/40 shadow-xl hover:ring-accent/30';

        return (
          <GlassCard
            key={`section-${idx}`}
            className={`glass p-6 sm:p-8 rounded-[32px] border-none backdrop-blur-xl transition-all duration-300 ${cardBorderClass}`}
          >
            {/* CABECERA DEL APARTADO */}
            {section.title && (
              <header className="flex items-start sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      isKeyTakeaways
                        ? 'bg-amber-400/20 text-amber-400 ring-1 ring-amber-400/30'
                        : 'bg-accent/15 text-accent ring-1 ring-accent/30'
                    }`}
                  >
                    {sectionIcon}
                  </div>
                  <div>
                    <span
                      className={`text-[11px] font-black uppercase tracking-wider block ${
                        isKeyTakeaways ? 'text-amber-400' : 'text-accent'
                      }`}
                    >
                      {isKeyTakeaways ? 'RESUMEN Y CONCLUSIÓN' : `APARTADO ${String(idx + 1).padStart(2, '0')}`}
                    </span>
                    <h2
                      id={section.id}
                      className="scroll-mt-24 text-xl sm:text-2xl font-black text-text-primary tracking-tight leading-snug"
                    >
                      {section.title}
                    </h2>
                  </div>
                </div>
              </header>
            )}

            {/* CONTENIDO DEL APARTADO CON ESPACIADO ELEGANTE */}
            <div className="section-body space-y-4 sm:space-y-5">
              {sectionElements}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
