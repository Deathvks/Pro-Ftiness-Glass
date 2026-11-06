import { ChevronRight } from 'lucide-react';

export default function MobileSectionList({ id, label, sections, onSelect, compact = false }) {
  return (
    <nav id={id} aria-label={label} className="md:hidden w-full">
      <ul className={`overflow-hidden rounded-2xl border border-glass-border divide-y divide-glass-border ${compact ? 'glass' : 'bg-bg-secondary'}`}>
        {sections.map(({ id: section, label: title, icon: Icon, danger, count }) => (
          <li key={section}>
            <button
              type="button"
              data-tutorial={`settings-tab-${section}`}
              onClick={() => onSelect(section)}
              className={`flex w-full items-center gap-3 px-3 text-left text-text-primary transition-colors hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/5 dark:active:bg-white/10 ${compact ? 'min-h-11 py-1.5' : 'min-h-14 py-2.5'}`}
            >
              <span className={`flex shrink-0 items-center justify-center ${compact ? 'size-8 rounded-lg' : 'size-9 rounded-xl'} ${danger ? 'bg-red-500/10 text-red-500' : 'bg-accent/10 text-accent'}`}>
                <Icon size={compact ? 16 : 18} aria-hidden="true" />
              </span>
              <span className="flex-1 text-sm font-bold leading-snug">{title}</span>
              {count > 0 && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-500">{count > 99 ? '99+' : count}</span>}
              <ChevronRight size={18} className="shrink-0 text-text-muted" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
