import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, Bell, BookOpen, BarChart3, ChevronLeft, ChevronRight,
  Dumbbell, Flame, HelpCircle, MessageCircle, Palette, Search, Settings,
  Sparkles, Trophy, UserRound, Users, X
} from 'lucide-react';
import ModalPortal from './ModalPortal';
import useModalLock from '../hooks/useModalLock';
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

const CATEGORY_META = {
  Todos: {
    description: 'Ver todas las guías y recorridos de la app',
    icon: Sparkles
  },
  Empezar: {
    description: 'Primeros pasos, resumen y navegación básica',
    icon: Flame
  },
  Entrenamiento: {
    description: 'Rutinas, ejercicios manuales y sesiones',
    icon: Dumbbell
  },
  Nutrición: {
    description: 'Registro de comidas, calorías, macros y agua',
    icon: Flame
  },
  Seguimiento: {
    description: 'Estadísticas, RM, peso, medidas y retos',
    icon: BarChart3
  },
  Comunidad: {
    description: 'Muro global, ranking, amigos y grupos',
    icon: Users
  },
  Personalización: {
    description: 'Temas, colores de acento y apariencia',
    icon: Palette
  },
  'Más herramientas': {
    description: 'Calculadoras, escáner y utilidades',
    icon: Settings
  },
  'Herramientas profesionales': {
    description: 'Asesorías, clientes y gestión avanzada',
    icon: UserRound
  }
};

/* Fila de Categoría para Móvil (Estilo Configuración / Ajustes en Lista) */
const CategoryListItem = ({ category, count, onSelect }) => {
  const meta = CATEGORY_META[category] || {
    description: `${count} ${count === 1 ? 'guía disponible' : 'guías disponibles'}`,
    icon: BookOpen
  };
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(category)}
      className="flex items-center gap-3.5 w-full p-4 rounded-[22px] bg-bg-secondary hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all group text-left border border-black/5 dark:border-white/5 shadow-sm"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-accent/10 text-accent group-hover:scale-105 transition-transform">
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-extrabold text-text-primary group-hover:text-accent transition-colors">
          {category}
        </h4>
        <p className="mt-0.5 text-xs text-text-secondary line-clamp-1">
          {meta.description}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-accent">
          {count} {count === 1 ? 'guía' : 'guías'}
        </span>
        <ChevronRight size={18} className="text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
};

/* Tarjeta completa de Tutorial (con vista previa y pasos interactivos como antes) */
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
  useModalLock(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedMobileCategory, setSelectedMobileCategory] = useState(null);
  const [search, setSearch] = useState('');
  const categoriesRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  useEffect(() => {
    scrollToTop();
  }, [selectedMobileCategory, activeCategory, search]);

  const availableTutorials = useMemo(() => APP_TUTORIALS.filter(tutorial => !tutorial.roles || tutorial.roles.includes(userRole)), [userRole]);
  const categories = useMemo(() => ['Todos', ...new Set(availableTutorials.map(tutorial => tutorial.category))], [availableTutorials]);

  // En móvil: si hay búsqueda activa se busca en todos; si no, se usa la categoría seleccionada o activeCategory
  const hasSearch = search.trim().length > 0;
  const effectiveCategory = hasSearch
    ? 'Todos'
    : (selectedMobileCategory !== null ? selectedMobileCategory : activeCategory);

  const visibleTutorials = useMemo(() => availableTutorials.filter(tutorial => {
    const matchesCategory = effectiveCategory === 'Todos' || tutorial.category === effectiveCategory;
    const query = search.trim().toLocaleLowerCase('es');
    const matchesSearch = !query || `${tutorial.title} ${tutorial.description} ${tutorial.category}`.toLocaleLowerCase('es').includes(query);
    return matchesCategory && matchesSearch;
  }), [availableTutorials, effectiveCategory, search]);

  const handleMobileCategorySelect = (category) => {
    setSelectedMobileCategory(category);
    setActiveCategory(category);
    scrollToTop();
  };

  const handleBackToCategories = () => {
    setSelectedMobileCategory(null);
    scrollToTop();
  };

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
    setSelectedMobileCategory(category);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9998] flex items-end justify-center bg-black/65 backdrop-blur-md p-0 !pt-[calc(1rem+var(--safe-top))] sm:items-center sm:p-4 sm:!pb-[calc(1rem+var(--safe-bottom))]" onClick={onClose}>
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorials-center-title"
          className="mt-auto mb-0 flex max-h-[calc(100dvh-var(--safe-top)-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-t-[32px] rounded-b-none border-t border-black/5 bg-bg-primary shadow-2xl animate-[slide-up_0.3s_ease-out] dark:border-white/5 sm:mt-0 sm:max-h-[92vh] sm:rounded-[32px] sm:border sm:animate-[scale-in_0.2s_ease-out]"
          onClick={event => event.stopPropagation()}
        >
          <header className="shrink-0 border-b border-black/5 bg-bg-primary/95 p-4 sm:p-7 backdrop-blur-xl dark:border-white/5">
            <div className="mb-3 flex justify-center sm:hidden">
              <div className="h-1.5 w-12 rounded-full bg-black/15 dark:bg-white/20" />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-[16px] bg-accent/10 p-2.5 sm:p-3 text-accent shrink-0">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h2 id="tutorials-center-title" className="text-lg sm:text-2xl font-black text-text-primary">
                    Tutoriales
                  </h2>
                  <p className="mt-0.5 sm:mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed text-text-secondary">
                    Selecciona una sección para ver el recorrido interactivo con los controles reales.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={onClose} 
                aria-label="Cerrar tutoriales" 
                className="rounded-full p-2 text-text-secondary transition hover:bg-glass-bg hover:text-text-primary shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <label className="mt-4 sm:mt-5 flex items-center gap-3 rounded-[16px] bg-black/5 px-4 py-2.5 sm:py-3 text-text-secondary ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/5">
              <Search size={16} className="shrink-0" />
              <input 
                value={search} 
                onChange={event => setSearch(event.target.value)} 
                placeholder="Buscar tutorial..." 
                className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted" 
              />
            </label>

            {/* Píldoras horizontales de categorías para Desktop */}
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
              className="hidden sm:flex mt-3.5 sm:mt-4 min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain touch-pan-x py-1.5 -my-1.5 no-scrollbar cursor-grab active:cursor-grabbing select-none"
            >
              {categories.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryClick(category)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 sm:py-2 text-xs font-bold transition-colors ${activeCategory === category ? 'bg-accent/15 text-accent font-extrabold' : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </header>

          <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(1.5rem+var(--safe-bottom))] sm:p-6 custom-scrollbar">
            {/* VISTA MÓVIL */}
            <div className="sm:hidden">
              {/* CASO 1: Móvil en la lista principal de categorías (Todos, Empezar, etc.) */}
              {selectedMobileCategory === null && !hasSearch ? (
                <div className="flex flex-col gap-2.5">
                  <div className="mb-1 flex items-center justify-between px-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
                      Elige una sección
                    </span>
                    <span className="text-[11px] font-bold text-text-muted">
                      {availableTutorials.length} guías en total
                    </span>
                  </div>
                  {categories.map(category => {
                    const count = category === 'Todos'
                      ? availableTutorials.length
                      : availableTutorials.filter(t => t.category === category).length;
                    return (
                      <CategoryListItem
                        key={category}
                        category={category}
                        count={count}
                        onSelect={handleMobileCategorySelect}
                      />
                    );
                  })}
                </div>
              ) : (
                /* CASO 2: Móvil dentro de una categoría o en búsqueda: tarjetas como antes */
                <div className="flex flex-col gap-3">
                  {!hasSearch && (
                    <div className="flex items-center justify-between pb-1">
                      <button
                        type="button"
                        onClick={handleBackToCategories}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-text-primary transition-all active:scale-95"
                      >
                        <ChevronLeft size={16} /> Volver a categorías
                      </button>
                      <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-accent">
                        {selectedMobileCategory}
                      </span>
                    </div>
                  )}

                  {visibleTutorials.length ? (
                    visibleTutorials.map(tutorial => (
                      <TutorialCard key={tutorial.id} tutorial={tutorial} onSelect={onStart} />
                    ))
                  ) : (
                    <div className="rounded-[20px] bg-glass-bg p-8 text-center text-sm font-semibold text-text-muted">
                      No hay tutoriales que coincidan con la búsqueda.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* VISTA DESKTOP / TABLET (Grid con preview como siempre) */}
            <div className="hidden sm:block">
              {visibleTutorials.length ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleTutorials.map(tutorial => (
                    <TutorialCard key={tutorial.id} tutorial={tutorial} onSelect={onStart} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[20px] bg-glass-bg p-8 text-center text-sm font-semibold text-text-muted">
                  No hay tutoriales que coincidan con la búsqueda.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </ModalPortal>
  );
}
