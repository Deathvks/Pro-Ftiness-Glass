/* frontend/src/components/News/MarkdownContent.jsx */
import React from 'react';
import {
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  Sparkles,
  Quote
} from 'lucide-react';

/**
 * Renderizador de Markdown enriquecido, de alta legibilidad editorial y estética Apple Liquid Glass.
 * Soporta alertas (> [!TIP], > [!IMPORTANT], etc.), listas estilizadas con iconos,
 * tablas interactivas, citas elegantes y tamaños de texto adaptables.
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

    // Regex para inline tokens
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

  const lines = content.split('\n');
  const elements = [];
  let currentList = [];
  let listType = null;
  let inBlockquote = false;
  let blockquoteType = 'quote';
  let blockquoteLines = [];

  // Estado para parsing de tablas
  let inTable = false;
  let tableHeader = [];
  let tableRows = [];

  const slugify = (str) =>
    str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="space-y-3.5 my-6">
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
          <ul key={`ul-${elements.length}`} className="space-y-3.5 my-6">
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
            className="my-7 p-6 sm:p-7 rounded-[26px] bg-black/5 dark:bg-white/5 border-l-4 border-accent shadow-lg ring-1 ring-black/5 dark:ring-white/10 relative overflow-hidden"
          >
            <Quote size={44} className="absolute -top-2 -right-2 text-accent/10 select-none pointer-events-none" />
            <div className={`relative z-10 italic text-text-primary/95 font-medium ${activeFont.p}`}>
              {renderInline(bqText)}
            </div>
          </blockquote>
        );
      } else {
        elements.push(
          <div
            key={`bq-${elements.length}`}
            className={`p-5 sm:p-6 rounded-[26px] my-7 border shadow-lg flex flex-col sm:flex-row gap-4 items-start ring-1 ring-black/5 dark:ring-white/10 ${alertClass}`}
          >
            <div className={`p-2.5 rounded-2xl shrink-0 ${iconBgClass}`}>
              {alertIcon}
            </div>
            <div className="flex-1 space-y-1.5">
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
          className="my-7 overflow-x-auto rounded-[24px] ring-1 ring-black/10 dark:ring-white/10 bg-black/5 dark:bg-white/5 shadow-md"
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
                    <td key={cIdx} className="py-3 px-4 text-text-primary/90 font-medium">
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

    // 1. Table Detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      flushBlockquote();

      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Verificar si es separador | :--- | :--- |
      const isDivider = cells.every((c) => /^:?-+:?$/.test(c));

      if (isDivider) {
        // Ignorar la fila de división
        continue;
      }

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

    // 2. Blockquotes / Callouts
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
        <div key={`hr-${i}`} className="my-10 h-px bg-gradient-to-r from-transparent via-black/15 dark:via-white/15 to-transparent" />
      );
      continue;
    }

    // 4. Headers
    if (trimmed.startsWith('### ')) {
      flushList();
      flushBlockquote();
      flushTable();
      const headingText = trimmed.replace('### ', '');
      const sectionId = slugify(headingText);

      elements.push(
        <h3
          id={sectionId}
          key={`h3-${i}`}
          className="scroll-mt-24 text-lg sm:text-xl font-black text-text-primary mt-8 mb-3 tracking-tight flex items-center gap-2.5"
        >
          <span className="w-2 h-2 rounded-full bg-accent shrink-0 shadow-sm shadow-accent/40" />
          <span>{renderInline(headingText)}</span>
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      flushBlockquote();
      flushTable();
      const headingText = trimmed.replace('## ', '');
      const sectionId = slugify(headingText);

      // Comprobar si es sección de "Puntos clave" o "Conclusión"
      const isKeyTakeaways = /puntos clave|conclusi[oó]n|takeaways|resumen/i.test(headingText);

      elements.push(
        <div key={`h2-wrap-${i}`} className="mt-12 mb-4">
          <h2
            id={sectionId}
            className="scroll-mt-24 text-xl sm:text-2xl lg:text-[26px] font-black text-text-primary tracking-tight flex items-center gap-3 group"
          >
            <span className={`w-2.5 h-6 rounded-full shrink-0 ${isKeyTakeaways ? 'bg-amber-400' : 'bg-accent'} shadow-sm`} />
            <span className="flex-1">{renderInline(headingText)}</span>
          </h2>
          <div className="mt-2 h-0.5 w-16 bg-gradient-to-r from-accent to-transparent rounded-full" />
        </div>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      flushBlockquote();
      flushTable();
      const headingText = trimmed.replace('# ', '');
      const sectionId = slugify(headingText);

      elements.push(
        <h2
          id={sectionId}
          key={`h1-${i}`}
          className="scroll-mt-24 text-2xl sm:text-3xl font-black text-text-primary mt-10 mb-4 tracking-tight"
        >
          {renderInline(headingText)}
        </h2>
      );
      continue;
    }

    // 5. List items
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

    // 6. Empty line
    if (trimmed === '') {
      flushList();
      flushBlockquote();
      flushTable();
      continue;
    }

    // 7. Regular paragraph
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

  return <div className="article-body font-sans space-y-1">{elements}</div>;
}
