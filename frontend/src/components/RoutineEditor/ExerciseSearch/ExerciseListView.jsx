/* frontend/src/components/RoutineEditor/ExerciseSearch/ExerciseListView.jsx */
import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { X, Search, ShoppingCart, ListFilter, Plus, SearchX } from 'lucide-react';
import CustomSelect from '../../CustomSelect';
import ExerciseListItem from './ExerciseListItem';
import Spinner from '../../Spinner';

const ITEM_HEIGHT = 104; // Altura reservada por elemento
const OVERSCAN = 5; // Cuántos elementos renderizar fuera de pantalla para que el scroll sea fluido

const ExerciseListView = ({
  onClose,
  onViewSummary,
  stagedExercisesCount,
  isLoading,
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  filterMuscle,
  setFilterMuscle,
  muscleOptions,
  filterEquipment,
  setFilterEquipment,
  equipmentOptions,
  filteredExercises,
  onViewDetail,
  onAddExercise,
  stagedIds,
  onAddManual,
  t,
}) => {
  const listRef = useRef(null);
  const SCROLL_KEY = 'exerciseListScrollPos';

  // --- VIRTUALIZACIÓN NATIVA 100% LIBRE DE LIBRERÍAS ---
  const [scrollTop, setScrollTop] = useState(0);
  const [listHeight, setListHeight] = useState(0);
  
  // AÑADIDO: Detectar si es móvil para el padding inferior
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Observamos el tamaño del contenedor para calcular cuántos elementos caben
  useLayoutEffect(() => {
    if (!listRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setListHeight(entries[0].contentRect.height);
    });
    observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [isLoading]);

  // Recuperamos el scroll guardado al montar el componente
  useLayoutEffect(() => {
    const savedPos = sessionStorage.getItem(SCROLL_KEY);
    if (listRef.current && savedPos && !isLoading && filteredExercises.length > 0) {
      listRef.current.scrollTop = Number(savedPos);
      setScrollTop(Number(savedPos));
    }
  }, [isLoading, filteredExercises.length]);

  const handleScroll = (e) => {
    const top = e.target.scrollTop;
    setScrollTop(top);
    sessionStorage.setItem(SCROLL_KEY, top);
  };

  const resetScroll = () => {
    sessionStorage.setItem(SCROLL_KEY, 0);
    setScrollTop(0);
    if (listRef.current) listRef.current.scrollTop = 0;
  };

  // --- CÁLCULO DE ELEMENTOS VISIBLES (VIRTUALIZACIÓN) ---
  const totalItems = filteredExercises.length + 1; // +1 por el botón de "Añadir manual" al final
  
  // AÑADIDO: Padding dinámico. Mucho espacio en móvil para el navbar, espacio normal en PC.
  const EXTRA_BOTTOM_PADDING = isMobile ? 140 : 24; 
  const MANUAL_BTN_GAP = 16; // Separación extra para el botón manual
  const totalHeight = (totalItems * ITEM_HEIGHT) + EXTRA_BOTTOM_PADDING + MANUAL_BTN_GAP;

  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    totalItems - 1,
    Math.floor((scrollTop + listHeight) / ITEM_HEIGHT) + OVERSCAN
  );

  const visibleIndices = [];
  if (listHeight > 0) {
    for (let i = startIndex; i <= endIndex; i++) {
      visibleIndices.push(i);
    }
  }

  // --- LÓGICA MULTI-SELECT ---
  const currentMuscleFilters = Array.isArray(filterMuscle) ? filterMuscle : [];
  const currentEquipmentFilters = Array.isArray(filterEquipment) ? filterEquipment : [];

  const activeMuscleFilters = currentMuscleFilters
    .map(value => muscleOptions.find(opt => opt.value === value))
    .filter(Boolean);

  const activeEquipmentFilters = currentEquipmentFilters
    .map(value => equipmentOptions.find(opt => opt.value === value))
    .filter(Boolean);

  const handleMuscleChange = (newValue) => {
    if (!newValue) return;
    if (!currentMuscleFilters.includes(newValue)) {
      setFilterMuscle([...currentMuscleFilters, newValue]);
      resetScroll();
    }
  };

  const handleEquipmentChange = (newValue) => {
    if (!newValue) return;
    if (!currentEquipmentFilters.includes(newValue)) {
      setFilterEquipment([...currentEquipmentFilters, newValue]);
      resetScroll();
    }
  };

  const removeMuscleFilter = (valueToRemove) => {
    setFilterMuscle(currentMuscleFilters.filter(val => val !== valueToRemove));
    resetScroll();
  };

  const removeEquipmentFilter = (valueToRemove) => {
    setFilterEquipment(currentEquipmentFilters.filter(val => val !== valueToRemove));
    resetScroll();
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    resetScroll();
  };

  const availableMuscleOptions = muscleOptions.filter(opt => !currentMuscleFilters.includes(opt.value));
  const availableEquipmentOptions = equipmentOptions.filter(opt => !currentEquipmentFilters.includes(opt.value));

  return (
    <div className="flex flex-col h-full w-full bg-bg-primary overflow-hidden">
      {/* Header (Cerrar y Carrito) - Zonas Seguras para el Notch */}
      <div 
        className="flex-shrink-0 flex items-center justify-between px-3 pb-3 md:px-4 md:pb-4 border-b border-glass-border gap-2 bg-bg-primary z-10"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
      >
        <h2 className="text-lg md:text-xl font-bold truncate min-w-0">
          {t('exercise_ui:add_exercises_title', 'Añadir Ejercicios')}
        </h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onViewSummary}
            className="relative flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-accent text-bg-secondary font-semibold text-sm md:text-base whitespace-nowrap transition-transform active:scale-95"
          >
            <ShoppingCart size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="hidden sm:inline">{t('exercise_ui:view_cart', 'Ver Carrito')}</span>
            {stagedExercisesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-red text-white text-[10px] md:text-xs font-bold flex items-center justify-center border-2 border-bg-primary">
                {stagedExercisesCount}
              </span>
            )}
          </button>
          <button onClick={onClose} className="p-1.5 md:p-2 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Zona de Filtros */}
      <div className="flex-shrink-0 p-4 space-y-4 border-b border-glass-border bg-bg-primary z-10 shadow-sm">
        {/* Input Buscador */}
        <div className="relative">
          <input
            type="text"
            placeholder={t('exercise_ui:search_placeholder_extended', 'Buscar ejercicio o grupo muscular...')}
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
          />
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        </div>

        {/* Botón Toggle Filtros Y Contador de Resultados */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className="flex items-center gap-2 text-sm text-text-secondary font-medium hover:text-accent transition-colors"
          >
            <ListFilter size={16} />
            <span>{showFilters ? t('exercise_ui:hide_filters', 'Ocultar Filtros') : t('exercise_ui:show_filters', 'Mostrar Filtros')}</span>
          </button>

          <span className="text-xs font-medium text-text-muted animate-[fade-in_0.3s_ease-out]">
            {filteredExercises.length} {filteredExercises.length === 1
              ? t('exercise_ui:exercise_count_single', 'ejercicio encontrado')
              : t('exercise_ui:exercise_count_plural', 'ejercicios encontrados')}
          </span>
        </div>

        {/* Zona de Etiquetas (Pills) de filtros activos */}
        {(activeMuscleFilters.length > 0 || activeEquipmentFilters.length > 0) && (
          <div className="flex flex-wrap gap-2 animate-[fade-in_0.2s_ease-out]">
            {activeMuscleFilters.map(filter => (
              <button
                key={filter.value}
                onClick={() => removeMuscleFilter(filter.value)}
                className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-accent-transparent text-accent text-sm font-medium border border-accent-border transition hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50"
                title={t('exercise_ui:remove_filter', 'Quitar filtro')}
              >
                <span>{filter.label}</span>
                <X size={14} />
              </button>
            ))}
            {activeEquipmentFilters.map(filter => (
              <button
                key={filter.value}
                onClick={() => removeEquipmentFilter(filter.value)}
                className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-accent-transparent text-accent text-sm font-medium border border-accent-border transition hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50"
                title={t('exercise_ui:remove_filter', 'Quitar filtro')}
              >
                <span>{filter.label}</span>
                <X size={14} />
              </button>
            ))}
          </div>
        )}

        {/* Dropdowns de Selección */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-[slide-down_0.2s_ease-out]">
            <div>
              <label className="text-xs text-text-muted block mb-1">{t('exercise_ui:filter_muscle', 'Grupo Muscular')}</label>
              <CustomSelect
                options={availableMuscleOptions}
                value={null}
                onChange={handleMuscleChange}
                placeholder={t('exercise_ui:select_muscles', 'Seleccionar músculos...')}
                className="w-full capitalize"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">{t('exercise_ui:filter_equipment', 'Equipamiento')}</label>
              <CustomSelect
                options={availableEquipmentOptions}
                value={null}
                onChange={handleEquipmentChange}
                placeholder={t('exercise_ui:select_equipment', 'Seleccionar equipamiento...')}
                className="w-full capitalize"
              />
            </div>
          </div>
        )}
      </div>

      {/* Lista Virtualizada Nativa */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 bg-bg-primary overflow-y-auto overflow-x-hidden relative"
      >
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : filteredExercises.length === 0 ? (
          /* NUEVO: Mostrar el botón de añadir manual incluso si no hay resultados */
          <div className="flex flex-col items-center justify-center p-6 mt-10 max-w-sm mx-auto text-center animate-[fade-in_0.3s_ease-out]">
            <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mb-4 border border-glass-border">
              <SearchX size={32} className="text-text-muted" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">
              {t('exercise_ui:no_exercises_found', 'No se encontraron ejercicios')}
            </h3>
            <p className="text-text-secondary text-sm mb-8">
              {searchQuery 
                ? t('exercise_ui:no_exercises_query', 'No hemos encontrado ningún ejercicio llamado "{{query}}".', { query: searchQuery }) 
                : t('exercise_ui:no_exercises_desc', 'Ajusta los filtros o intenta con otra búsqueda.')}
            </p>
            
            <button
              onClick={onAddManual}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-accent text-white hover:bg-accent-hover transition-transform active:scale-95 shadow-lg shadow-accent/20"
            >
              <Plus size={20} />
              <span className="font-bold">
                {searchQuery 
                  ? t('exercise_ui:add_specific_manual', 'Añadir "{{query}}" manualmente', { query: searchQuery })
                  : t('exercise_ui:add_manual_exercise', 'Añadir ejercicio manual')}
              </span>
            </button>
          </div>
        ) : (
          <div style={{ height: `${totalHeight}px`, position: 'relative', width: '100%' }}>
            {visibleIndices.map(index => {
              const isLast = index === filteredExercises.length;
              
              const topPosition = (index * ITEM_HEIGHT) + (isLast ? MANUAL_BTN_GAP : 0);
              
              const itemStyle = {
                position: 'absolute',
                top: topPosition + 12,
                height: ITEM_HEIGHT - 12,
                left: '1rem',
                right: '1rem',
              };

              // Si es el último elemento, renderizamos el botón de añadir manual
              if (isLast) {
                return (
                  <div key="manual-btn" style={itemStyle}>
                    <button
                      onClick={onAddManual}
                      className="w-full flex items-center gap-4 p-3 rounded-lg bg-bg-secondary hover:bg-accent-transparent border border-glass-border transition-colors group h-full"
                    >
                      <div className="w-14 h-14 rounded-md bg-bg-primary border border-glass-border flex items-center justify-center text-text-muted group-hover:text-accent group-hover:border-accent-border transition-colors shrink-0">
                        <Plus size={24} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                          {t('exercise_ui:add_manual_exercise', 'Añadir ejercicio manual')}
                        </p>
                        <p className="text-sm text-text-muted truncate">
                          {t('exercise_ui:add_manual_desc', 'Añade un ejercicio que no esté en la lista.')}
                        </p>
                      </div>
                    </button>
                  </div>
                );
              }

              // Ejercicio normal
              const exercise = filteredExercises[index];
              return (
                <div key={exercise.id} style={itemStyle}>
                  <ExerciseListItem
                    exercise={exercise}
                    onAdd={onAddExercise}
                    onView={onViewDetail}
                    isStaged={stagedIds.has(exercise.id)}
                    t={t}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseListView;