/* frontend/src/components/News/MarkdownContent.jsx */
import React from 'react';
import {
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  Quote
} from 'lucide-react';

/**
 * Renderizador editorial continuo al estilo Xataka / Webpedia.
 * Flujo de lectura limpio, tipografía espaciosa, subtítulos con carácter,
 * tablas integradas y sin cajas fragmentadas que interrumpan la lectura.
 */
export default function MarkdownContent({ content = '', fontSize = 'normal' }) {
  if (!content) return null;

  // Clases dinámicas de tamaño de fuente para lectura cómoda
  const fontSizes = {
    normal: {
      p: 'text-[17px] sm:text-[18.5px] leading-[1.85]',
      li: 'text-[16.5px] sm:text-[18px] leading-relaxed',
      h2: 'text-2xl sm:text-3xl',
      h3: 'text-xl sm:text-2xl'
    },
    large: {
      p: 'text-[18.5px] sm:text-[20px] leading-[1.9]',
      li: 'text-[18px] sm:text-[19.5px] leading-relaxed',
      h2: 'text-[26px] sm:text-[32px]',
      h3: 'text-[22px] sm:text-[25px]'
    },
    xlarge: {
      p: 'text-[20px] sm:text-[22px] leading-[1.95]',
      li: 'text-[19.5px] sm:text-[21px] leading-relaxed',
      h2: 'text-[28px] sm:text-[34px]',
      h3: 'text-[24px] sm:text-[27px]'
    }
  };

  const activeFont = fontSizes[fontSize] || fontSizes.normal;

  const escapeHtml = (str) =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const sanitizeUrl = (rawUrl = '') => {
    const trimmed = String(rawUrl).trim();
    if (/^(https?:\/\/|\/|#|mailto:)/i.test(trimmed)) {
      return trimmed.replace(/"/g, '%22');
    }
    return '#';
  };

  const renderInline = (rawText) => {
    if (!rawText) return '';

    // Sanitizar HTML plano previo para prevenir XSS y ataques de inyección
    const safeText = escapeHtml(rawText);

    const boldRegex = /\*\*([^*]+)\*\*/g;
    const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)/g;
    const codeRegex = /`([^`]+)`/g;
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    const html = safeText
      .replace(boldRegex, '<strong class="font-extrabold text-text-primary">$1</strong>')
      .replace(italicRegex, '<em class="italic text-text-primary/90 font-serif">$1</em>')
      .replace(codeRegex, '<code class="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-accent font-mono text-sm font-semibold">$1</code>')
      .replace(linkRegex, (match, label, href) => {
        const safeHref = sanitizeUrl(href);
        return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-4 decoration-accent/50 hover:decoration-accent transition-colors font-semibold">${label}</a>`;
      });

    return (
      <span dangerouslySetInnerHTML={{ __html: html }} />
    );
  };

  const slugify = (str) =>
    str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  const lines = content.split('\n');
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
          <ol key={`ol-${elements.length}`} className="list-decimal my-6 pl-6 space-y-3 marker:text-accent marker:font-bold marker:text-base">
            {currentList.map((item, idx) => (
              <li key={idx} className={`pl-1.5 text-text-primary/90 ${activeFont.li}`}>
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc my-6 pl-6 space-y-3 marker:text-accent marker:text-lg">
            {currentList.map((item, idx) => (
              <li key={idx} className={`pl-1.5 text-text-primary/90 ${activeFont.li}`}>
                {renderInline(item)}
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
      let alertBorderClass = 'border-accent';
      let titleColorClass = 'text-accent';
      let alertTitle = 'NOTA CLAVE';

      if (blockquoteType === 'tip') {
        alertIcon = <Lightbulb size={18} className="text-emerald-400 shrink-0" />;
        alertBorderClass = 'border-emerald-500 bg-emerald-500/[0.04]';
        titleColorClass = 'text-emerald-400';
        alertTitle = 'CONSEJO PRÁCTICO';
      } else if (blockquoteType === 'important') {
        alertIcon = <Sparkles size={18} className="text-amber-400 shrink-0" />;
        alertBorderClass = 'border-amber-500 bg-amber-500/[0.04]';
        titleColorClass = 'text-amber-400';
        alertTitle = 'EVIDENCIA CIENTÍFICA';
      } else if (blockquoteType === 'warning') {
        alertIcon = <AlertTriangle size={18} className="text-rose-400 shrink-0" />;
        alertBorderClass = 'border-rose-500 bg-rose-500/[0.04]';
        titleColorClass = 'text-rose-400';
        alertTitle = 'ATENCIÓN';
      } else if (blockquoteType === 'note') {
        alertIcon = <Info size={18} className="text-blue-400 shrink-0" />;
        alertBorderClass = 'border-blue-500 bg-blue-500/[0.04]';
        titleColorClass = 'text-blue-400';
        alertTitle = 'APUNTE CLAVE';
      }

      if (blockquoteType === 'quote') {
        elements.push(
          <blockquote
            key={`quote-${elements.length}`}
            className="my-8 pl-6 border-l-4 border-accent italic text-lg sm:text-xl text-text-primary/90 font-serif leading-relaxed py-2"
          >
            {renderInline(bqText)}
          </blockquote>
        );
      } else {
        elements.push(
          <div
            key={`bq-${elements.length}`}
            className={`my-7 p-4 sm:p-5 rounded-r-2xl border-l-4 ${alertBorderClass}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {alertIcon}
              <span className={`text-xs font-black uppercase tracking-wider ${titleColorClass}`}>
                {alertTitle}
              </span>
            </div>
            <div className={`text-text-primary/90 ${activeFont.li}`}>
              {renderInline(bqText)}
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
          className="my-8 overflow-x-auto rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]"
        >
          <table className="w-full text-left text-[15px] sm:text-[16px] border-collapse">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                {tableHeader.map((th, i) => (
                  <th key={i} className="py-3 px-4 font-black uppercase text-xs text-accent tracking-wider">
                    {renderInline(th.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Detección de Tabla
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

    // 2. Callouts
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

    // 3. Separador horizontal editorial
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList();
      flushBlockquote();
      flushTable();
      elements.push(
        <hr key={`hr-${i}`} className="my-10 border-t border-black/10 dark:border-white/10" />
      );
      continue;
    }

    // 4. Encabezados H1, H2, H3 y H4 estilo periodístico
    // Si la IA o el usuario escribió "# Encabezado", tratarlo como sección principal H2 para no romper la jerarquía del H1 editorial
    if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
      flushList();
      flushBlockquote();
      flushTable();
      const headingText = trimmed.replace(/^#+\s*/, '');
      const sectionId = slugify(headingText);

      elements.push(
        <h2
          key={`h2-${i}`}
          id={sectionId}
          className={`scroll-mt-20 font-black text-text-primary mt-12 mb-5 tracking-tight border-b border-black/10 dark:border-white/10 pb-3 ${activeFont.h2}`}
        >
          {renderInline(headingText)}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      flushBlockquote();
      flushTable();
      const headingText = trimmed.replace('### ', '');
      const sectionId = slugify(headingText);

      elements.push(
        <h3
          key={`h3-${i}`}
          id={sectionId}
          className={`scroll-mt-20 font-extrabold text-text-primary mt-8 mb-4 tracking-tight ${activeFont.h3}`}
        >
          {renderInline(headingText)}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      flushList();
      flushBlockquote();
      flushTable();
      const headingText = trimmed.replace('#### ', '');
      const sectionId = slugify(headingText);

      elements.push(
        <h4
          key={`h4-${i}`}
          id={sectionId}
          className="scroll-mt-20 font-bold text-text-secondary mt-6 mb-3 tracking-tight text-base sm:text-lg"
        >
          {renderInline(headingText)}
        </h4>
      );
      continue;
    }

    // 5. Listas
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

    // 6. Línea vacía
    if (trimmed === '') {
      flushList();
      flushBlockquote();
      flushTable();
      continue;
    }

    // 7. Párrafo continuo de lectura
    flushList();
    flushBlockquote();
    flushTable();
    elements.push(
      <p key={`p-${i}`} className={`text-text-primary/90 font-normal my-5 tracking-normal ${activeFont.p}`}>
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();
  flushBlockquote();
  flushTable();

  return (
    <div className="editorial-article-body text-text-primary font-sans">
      {elements}
    </div>
  );
}
