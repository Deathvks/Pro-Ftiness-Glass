/* frontend/src/components/News/MarkdownContent.jsx */
import React from 'react';
import { Info, Lightbulb, AlertTriangle, AlertCircle } from 'lucide-react';

/**
 * Renderizador de Markdown ligero, seguro y optimizado para artículos de fitness
 * Compatible con alertas de GitHub (> [!TIP], > [!NOTE], etc.)
 */
export default function MarkdownContent({ content = '' }) {
  if (!content) return null;

  const renderInline = (text) => {
    // 1. Reemplazar código inline `code`
    let parts = [text];

    // Parser regex simple para inline tokens
    // Links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    // Bold **text**
    const boldRegex = /\*\*([^*]+)\*\*/g;
    // Italic *text*
    const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)/g;
    // Code `text`
    const codeRegex = /`([^`]+)`/g;

    return (
      <span
        dangerouslySetInnerHTML={{
          __html: text
            .replace(boldRegex, '<strong class="font-bold text-text-primary">$1</strong>')
            .replace(italicRegex, '<em class="italic text-text-secondary">$1</em>')
            .replace(codeRegex, '<code class="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-accent font-mono text-xs">$1</code>')
            .replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent underline hover:opacity-80 transition-opacity">$1</a>')
        }}
      />
    );
  };

  const lines = content.split('\n');
  const elements = [];
  let currentList = [];
  let listType = null;
  let inBlockquote = false;
  let blockquoteType = 'quote'; // 'quote', 'note', 'tip', 'important', 'warning'
  let blockquoteLines = [];

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-2 my-4 text-text-secondary text-base leading-relaxed pl-2">
            {currentList.map((item, idx) => (
              <li key={idx} className="marker:text-accent marker:font-bold">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-2 my-4 text-text-secondary text-base leading-relaxed pl-2">
            {currentList.map((item, idx) => (
              <li key={idx} className="marker:text-accent">
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
      let alertClass = 'bg-black/5 dark:bg-white/5 border-l-4 border-accent text-text-secondary';

      if (blockquoteType === 'tip') {
        alertIcon = <Lightbulb size={20} className="text-emerald-500 shrink-0 mt-0.5" />;
        alertClass = 'bg-emerald-500/10 border-l-4 border-emerald-500 text-text-primary';
      } else if (blockquoteType === 'important') {
        alertIcon = <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />;
        alertClass = 'bg-amber-500/10 border-l-4 border-amber-500 text-text-primary';
      } else if (blockquoteType === 'warning') {
        alertIcon = <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />;
        alertClass = 'bg-red-500/10 border-l-4 border-red-500 text-text-primary';
      } else if (blockquoteType === 'note') {
        alertIcon = <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />;
        alertClass = 'bg-blue-500/10 border-l-4 border-blue-500 text-text-primary';
      }

      elements.push(
        <div key={`bq-${elements.length}`} className={`p-4 sm:p-5 rounded-2xl my-6 flex gap-3 ${alertClass}`}>
          {alertIcon}
          <div className="flex-1 text-sm sm:text-base leading-relaxed">
            {renderInline(bqText)}
          </div>
        </div>
      );
      blockquoteLines = [];
      inBlockquote = false;
      blockquoteType = 'quote';
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for blockquotes / callouts
    if (trimmed.startsWith('>')) {
      flushList();
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
      // Continue multi-line blockquote
      blockquoteLines.push(trimmed);
      continue;
    } else if (inBlockquote && trimmed === '') {
      flushBlockquote();
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList();
      flushBlockquote();
      elements.push(
        <hr key={`hr-${i}`} className="my-8 border-t border-black/10 dark:border-white/10" />
      );
      continue;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList();
      flushBlockquote();
      elements.push(
        <h3 key={`h3-${i}`} className="text-lg sm:text-xl font-bold text-text-primary mt-6 mb-3 tracking-tight">
          {renderInline(trimmed.replace('### ', ''))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      flushBlockquote();
      elements.push(
        <h2 key={`h2-${i}`} className="text-xl sm:text-2xl font-extrabold text-text-primary mt-8 mb-4 tracking-tight border-b border-black/5 dark:border-white/5 pb-2">
          {renderInline(trimmed.replace('## ', ''))}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      flushBlockquote();
      elements.push(
        <h2 key={`h1-${i}`} className="text-2xl sm:text-3xl font-black text-text-primary mt-8 mb-4 tracking-tight">
          {renderInline(trimmed.replace('# ', ''))}
        </h2>
      );
      continue;
    }

    // List items
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushBlockquote();
      if (listType !== 'ul') flushList();
      listType = 'ul';
      currentList.push(bulletMatch[1]);
      continue;
    }

    const numberMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numberMatch) {
      flushBlockquote();
      if (listType !== 'ol') flushList();
      listType = 'ol';
      currentList.push(numberMatch[1]);
      continue;
    }

    // Empty line
    if (trimmed === '') {
      flushList();
      flushBlockquote();
      continue;
    }

    // Regular paragraph
    flushList();
    flushBlockquote();
    elements.push(
      <p key={`p-${i}`} className="text-text-secondary text-base leading-relaxed my-3 font-normal">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();
  flushBlockquote();

  return <div className="article-body font-sans space-y-1">{elements}</div>;
}
