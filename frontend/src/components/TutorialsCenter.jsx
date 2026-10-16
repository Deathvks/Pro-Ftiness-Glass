import React, { useMemo, useRef, useState } from 'react';
import { Activity, Bell, BookOpen, BarChart3, ChevronRight, Dumbbell, Flame, HelpCircle, MessageCircle, Palette, Search, Settings, Trophy, UserRound, Users, X } from 'lucide-react';
import ModalPortal from './ModalPortal';
import { APP_TUTORIALS } from '../data/tutorials';

const ICONS = {
  activity: Activity,
  bell: Bell,
  chart: BarChart3,
  dumbbell: Dumbbell,
  help: HelpCircle,
  home: Flame,
  message: MessageCircle,
  nutrition: Flame,
  palette: Palette,
  settings: Settings,
  trophy: Trophy,
  user: UserRound,
  users: Users
};

const TutorialCard = ({ tutorial, onSelect }) => {
  const Icon = ICONS[tutorial.icon] || BookOpen;
  return (
    <button
      type="button"
      onClick={() => onSelect(tutorial)}
      className="group flex h-full flex-col rounded-[24px] border border-black/5 bg-bg-secondary p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg dark:border-white/5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-accent/10 text-accent">
          <Icon size={24} strokeWidth={2} />
        </div>
        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">
          {tutorial.category}
        </span>
      </div>
      <h3 className="text-base font-extrabold text-text-primary">{tutorial.title}</h3>
      <p className="mt-1.5 flex-1 text-xs leading-relaxed text-text-secondary">{tutorial.description}</p>

      <div className="mt-4 overflow-hidden rounded-[16px] bg-bg-primary p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Vista real de la app</span>
        </div>
        <div className="space-y-1.5">
          {tutorial.steps.slice(0, 3).map((step, index) => (
            <div key={step.title} className="flex items-center gap-2 rounded-lg bg-glass-bg px-2.5 py-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent/10 text-[9px] font-black text-accent">{index + 1}</span>
              <span className="truncate text-[10px] font-semibold text-text-secondary">{step.title}</span>
              <span className="ml-auto h-1 w-8 shrink-0 rounded-full bg-black/5 dark:bg-white/10" />
            </div>
          ))}
          {tutorial.steps.length > 3 && <div className="pl-2 text-[10px] font-medium text-text-muted">+ {tutorial.steps.length - 3} pasos más</div>}
        </div>
      </div>

      <span className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-accent">
        Ver tutorial en pantalla <ChevronRight size={15} className="transition-transform group-hover:translate-x-1" />
      </span>
    </button>
  );
};

export default function TutorialsCenter({ userRole, onClose, onStart }) {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const categoriesRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  const availableTutorials = useMemo(() => APP_TUTORIALS.filter(tutorial => !tutorial.roles || tutorial.roles.includes(userRole)), [userRole]);
  const categories = useMemo(() => ['Todos', ...new Set(availableTutorials.map(tutorial => tutorial.category))], [availableTutorials]);
  const visibleTutorials = useMemo(() => availableTutorials.filter(tutorial => {
    const matchesCategory = activeCategory === 'Todos' || tutorial.category === activeCategory;
    const query = search.trim().toLocaleLowerCase('es');
    const matchesSearch = !query || `${tutorial.title} ${tutorial.description} ${tutorial.category}`.toLocaleLowerCase('es').includes(query);
    return matchesCategory && matchesSearch;
  }), [availableTutorials, activeCategory, search]);

  const handleCategoryPointerDown = event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: categoriesRef.current?.scrollLeft || 0,
      moved: false
    };
  };

  const handleCategoryPointerMove = event => {
    if (!dragRef.current.active || !categoriesRef.current) return;
    const delta = event.clientX - dragRef.current.startX;
    if (Math.abs(delta) > 4) dragRef.current.moved = true;
    categoriesRef.current.scrollLeft = dragRef.current.scrollLeft - delta;
  };

  const handleCategoryPointerUp = () => {
    dragRef.current.active = false;
  };

  const handleCategoryClick = category => {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    setActiveCategory(category);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9998] flex items-end justify-center bg-black/65 backdrop-blur-md p-0 !pt-[calc(1rem+var(--safe-top))] sm:items-center sm:p-4 sm:!pb-[calc(1rem+var(--safe-bottom))]" onClick={onClose}>
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorials-center-title"
          className="mt-auto mb-0 flex max-h-[calc(100dvh-var(--safe-top)-1rem)] w-[90%] sm:w-full max-w-5xl flex-col overflow-hidden rounded-t-[32px] rounded-b-none border-t border-black/5 bg-bg-primary shadow-2xl animate-[slide-up_0.3s_ease-out] dark:border-white/5 sm:mt-0 sm:max-h-[92vh] sm:rounded-[32px] sm:border sm:animate-[scale-in_0.2s_ease-out]"
          onClick={event => event.stopPropagation()}
        >
          <header className="shrink-0 border-b border-black/5 bg-bg-primary/95 p-5 backdrop-blur-xl dark:border-white/5 sm:p-7">
            <div className="mb-4 flex justify-center sm:hidden">
              <div className="h-1.5 w-12 rounded-full bg-black/15 dark:bg-white/20" />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-[16px] bg-accent/10 p-3 text-accent"><BookOpen size={23} /></div>
                <div>
                  <h2 id="tutorials-center-title" className="text-xl font-black text-text-primary sm:text-2xl">Tutoriales</h2>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-text-secondary sm:text-sm">
                    Aprende cada sección con recorridos que resaltan los controles reales de la pantalla.
                  </p>
                </div>
              </div>
              <button type="button" onClick={onClose} aria-label="Cerrar tutoriales" className="rounded-full p-2 text-text-secondary transition hover:bg-glass-bg hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            <label className="mt-5 flex items-center gap-3 rounded-[16px] bg-black/5 px-4 py-3 text-text-secondary ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
              <Search size={17} className="shrink-0" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar tutorial..." className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted" />
            </label>

            <div
              ref={categoriesRef}
              onPointerDown={handleCategoryPointerDown}
              onPointerMove={handleCategoryPointerMove}
              onPointerUp={handleCategoryPointerUp}
              onPointerLeave={handleCategoryPointerUp}
              onWheel={event => {
                if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
                  event.currentTarget.scrollLeft += event.deltaY;
                }
              }}
              className="mt-4 flex min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain touch-pan-x py-2 -my-2 no-scrollbar cursor-grab active:cursor-grabbing select-none"
            >
              {categories.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryClick(category)}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${activeCategory === category ? 'bg-accent/15 text-accent' : 'bg-glass-bg text-text-secondary hover:text-text-primary'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(1.5rem+var(--safe-bottom))] sm:p-6">
            {visibleTutorials.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                {visibleTutorials.map(tutorial => <TutorialCard key={tutorial.id} tutorial={tutorial} onSelect={onStart} />)}
              </div>
            ) : (
              <div className="rounded-[20px] bg-glass-bg p-8 text-center text-sm font-semibold text-text-muted">No hay tutoriales que coincidan con la búsqueda.</div>
            )}
          </div>
        </section>
      </div>
    </ModalPortal>
  );
}
