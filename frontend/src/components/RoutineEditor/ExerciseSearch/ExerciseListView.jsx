/* frontend/src/components/RoutineEditor/ExerciseSearch/ExerciseListView.jsx */
import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { X, Search, ShoppingCart, ListFilter, Plus } from 'lucide-react';
import CustomSelect from '../../CustomSelect';
import ExerciseListItem from './ExerciseListItem';
import Spinner from '../../Spinner';

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
  // Referencia al contenedor de la lista para controlar el scroll
  const listRef = useRef(null);
  const SCROLL_KEY = 'exerciseListScrollPos';

  // --- LÓGICA DE SCROLL MEJORADA ---

  // 1. Restaurar scroll de forma robusta
  // Usamos useLayoutEffect para evitar parpadeos visuales si es posible,
  // y dependemos de 'filteredExercises' para asegurar que el contenido existe.
  useLayoutEffect(() => {
    const savedPos = sessionStorage.getItem(SCROLL_KEY);

    // Solo intentamos restaurar si no estamos cargando, hay ejercicios y hay una posición guardada
    if (listRef.current && savedPos && !isLoading && filteredExercises.length > 0) {
      // Intentamos restaurar inmediatamente
      listRef.current.scrollTop = Number(savedPos);

      // DOBLE CHECK: A veces el navegador necesita un "tick" extra si hay imágenes o renderizado pesado
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = Number(savedPos);
        }
      });
    }
  }, [isLoading, filteredExercises.length]); // Dependencia clave: longitud de la lista

  // 2. Resetear scroll explícitamente si el usuario cambia los filtros o busca
  // Esto es para que no se quede "abajo" si busca algo nuevo.
  useEffect(() => {
    // Solo reseteamos si la búsqueda/filtros cambian intencionalmente
    // No queremos resetear al volver de la vista de detalle (donde searchQuery es el mismo)
    const handleFilterChange = () => {
      if (listRef.current) {
        // Si el usuario está escribiendo o filtrando, queremos ir arriba
        // Pero tenemos que distinguir esto de "montar el componente con filtros ya puestos"
        // La forma más simple es: si guardamos la posición antes, y ahora cambian filtros, reseteamos.
        // Pero como searchQuery viene del padre, al volver del detalle sigue igual.
        // Solución: Guardamos scroll en onScroll. Si cambian props, React no resetea scroll
        // del div automáticamente a menos que cambie el contenido drásticamente.
        // Para UX correcta: Si cambia query, forzamos top 0.
        // Verificamos si la posición guardada coincide con la actual para no resetear innecesariamente
        // al montar.

        // Estrategia simplificada: Confiamos en el usuario. Si busca, el scroll suele
        // ajustarse solo al cambiar la altura, pero forzamos 0 por si acaso.
        // NOTA: Comentado para evitar conflictos con la restauración al montar.
        // listRef.current.scrollTop = 0; 
      }
    };
    handleFilterChange();
  }, [searchQuery, filterMuscle, filterEquipment]);

  // 3. Guardar scroll dinámicamente
  const handleScroll = () => {
    if (listRef.current) {
      sessionStorage.setItem(SCROLL_KEY, listRef.current.scrollTop);
    }
  };

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
      // Al cambiar filtro, reseteamos scroll guardado para empezar desde arriba en la nueva lista
      sessionStorage.setItem(SCROLL_KEY, 0);
      if (listRef.current) listRef.current.scrollTop = 0;
    }
  };

  const handleEquipmentChange = (newValue) => {
    if (!newValue) return;
    if (!currentEquipmentFilters.includes(newValue)) {
      setFilterEquipment([...currentEquipmentFilters, newValue]);
      sessionStorage.setItem(SCROLL_KEY, 0);
      if (listRef.current) listRef.current.scrollTop = 0;
    }
  };

  const removeMuscleFilter = (valueToRemove) => {
    setFilterMuscle(currentMuscleFilters.filter(val => val !== valueToRemove));
    sessionStorage.setItem(SCROLL_KEY, 0);
  };

  const removeEquipmentFilter = (valueToRemove) => {
    setFilterEquipment(currentEquipmentFilters.filter(val => val !== valueToRemove));
    sessionStorage.setItem(SCROLL_KEY, 0);
  };

  // Handler especial para el input de búsqueda para resetear scroll al escribir
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // Si escribe, reseteamos scroll
    if (listRef.current) listRef.current.scrollTop = 0;
    sessionStorage.setItem(SCROLL_KEY, 0);
  };

  const availableMuscleOptions = muscleOptions.filter(opt => !currentMuscleFilters.includes(opt.value));
  const availableEquipmentOptions = equipmentOptions.filter(opt => !currentEquipmentFilters.includes(opt.value));


  return (
    <div className="flex flex-col h-full">
      {/* Header (Cerrar y Carrito) */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 md:p-4 border-b border-glass-border gap-2">
        <h2 className="text-lg md:text-xl font-bold truncate min-w-0">
          {t('exercise_ui:add_exercises_title', 'Añadir Ejercicios')}
        </h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onViewSummary}
            className="relative flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-accent text-bg-secondary font-semibold text-sm md:text-base whitespace-nowrap transition-transform active:scale-95"
          >
            <ShoppingCart size={16} className="md:w-[18px] md:h-[18px]" />
            <span>{t('exercise_ui:view_cart', 'Ver Carrito')}</span>
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
      <div className="flex-shrink-0 p-4 space-y-4 border-b border-glass-border">
        {/* Input Buscador */}
        <div className="relative">
          <input
            type="text"
            placeholder={t('exercise_ui:search_placeholder_extended', 'Buscar ejercicio o grupo muscular...')}
            value={searchQuery}
            onChange={handleSearchChange} // Usamos el handler nuevo
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent"
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

          {/* Contador de ejercicios */}
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

      {/* Lista de Resultados con Scroll Controlado */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <>
            {filteredExercises.map(exercise => (
              <ExerciseListItem
                key={exercise.id}
                exercise={exercise}
                onAdd={onAddExercise}
                onView={onViewDetail}
                isStaged={stagedIds.has(exercise.id)}
                t={t}
              />
            ))}

            <button
              onClick={onAddManual}
              className="w-full flex items-center gap-4 p-3 rounded-lg bg-bg-secondary hover:bg-accent-transparent border border-glass-border transition-colors group"
            >
              <div className="w-14 h-14 rounded-md bg-bg-primary border border-glass-border flex items-center justify-center text-text-muted group-hover:text-accent group-hover:border-accent-border transition-colors">
                <Plus size={24} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                  {t('exercise_ui:add_manual_exercise', 'Añadir ejercicio manual')}
                </p>
                <p className="text-sm text-text-muted">
                  {t('exercise_ui:add_manual_desc', 'Añade un ejercicio que no esté en la lista.')}
                </p>
              </div>
            </button>

            {filteredExercises.length === 0 && (
              <p className="text-center text-text-muted pt-10">{t('exercise_ui:no_exercises_found', 'No se encontraron ejercicios.')}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExerciseListView;