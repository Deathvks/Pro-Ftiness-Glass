/* frontend/src/components/RoutineEditor/ExerciseSearch/ExerciseListView.jsx */
import React from 'react';
// --- INICIO DE LA MODIFICACIÓN ---
import { X, Search, ShoppingCart, ListFilter, Plus } from 'lucide-react'; // Importar Plus
// --- FIN DE LA MODIFICACIÓN ---
import CustomSelect from '../../CustomSelect';
import ExerciseListItem from './ExerciseListItem';
import Spinner from '../../Spinner'; // <-- Añadido Spinner para 'isLoading'

// Componente para la vista de lista (búsqueda y filtros)
const ExerciseListView = ({
  // --- Props de navegación y estado ---
  onClose,
  onViewSummary,
  stagedExercisesCount,
  isLoading, // <-- Añadido prop de carga

  // --- Props de búsqueda ---
  searchQuery,
  setSearchQuery,
  
  // --- Props de filtros ---
  showFilters,
  setShowFilters,
  filterMuscle,
  setFilterMuscle,
  muscleOptions, // <-- Recibe las opciones pre-traducidas
  filterEquipment,
  setFilterEquipment,
  equipmentOptions, // <-- Recibe las opciones pre-traducidas

  // --- Props de datos ---
  filteredExercises, // <-- Recibe los ejercicios YA filtrados
  
  // --- Props de acciones ---
  onViewDetail,
  onAddExercise,
  stagedIds,
  // --- INICIO DE LA MODIFICACIÓN ---
  onAddManual, // <-- Recibir la nueva prop
  // --- FIN DE LA MODIFICACIÓN ---
  
  // --- Props de traducción ---
  t,
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header (Cerrar y Carrito) (SIN CAMBIOS) */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-glass-border">
        <h2 className="text-xl font-bold">{t('exercise_ui:add_exercises_title', 'Añadir Ejercicios')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onViewSummary}
            className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-bg-secondary font-semibold"
          >
            <ShoppingCart size={18} />
            <span>{t('exercise_ui:view_cart', 'Ver Carrito')}</span>
            {stagedExercisesCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red text-white text-xs font-bold flex items-center justify-center border-2 border-bg-primary">
                {stagedExercisesCount}
              </span>
            )}
          </button>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Búsqueda y Filtros (SIN CAMBIOS) */}
      <div className="flex-shrink-0 p-4 space-y-4 border-b border-glass-border">
        <div className="relative">
          <input
            type="text"
            placeholder={t('exercise_ui:search_placeholder', 'Buscar ejercicio...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        </div>
        <button
          onClick={() => setShowFilters(prev => !prev)}
          className="flex items-center gap-2 text-sm text-text-secondary font-medium"
        >
          <ListFilter size={16} />
          <span>{showFilters ? t('exercise_ui:hide_filters', 'Ocultar Filtros') : t('exercise_ui:show_filters', 'Mostrar Filtros')}</span>
          {(filterMuscle !== 'all' || filterEquipment !== 'all') && (
            <span className="w-2 h-2 rounded-full bg-accent"></span>
          )}
        </button>
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted block mb-1">{t('exercise_ui:filter_muscle', 'Grupo Muscular')}</label>
              <CustomSelect
                options={muscleOptions}
                value={muscleOptions.find(opt => opt.value === filterMuscle)}
                onChange={(value) => setFilterMuscle(value || 'all')}
                placeholder={t('exercise_ui:all_muscles', 'Todos los Músculos')}
                className="w-full capitalize"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">{t('exercise_ui:filter_equipment', 'Equipamiento')}</label>
              <CustomSelect
                options={equipmentOptions}
                value={equipmentOptions.find(opt => opt.value === filterEquipment)}
                onChange={(value) => setFilterEquipment(value || 'all')}
                placeholder={t('exercise_ui:all_equipment', 'Todo el Equipamiento')}
                className="w-full capitalize"
              />
            </div>
          </div>
        )}
      </div>

      {/* Lista de Ejercicios */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <>
            {/* --- INICIO DE LA MODIFICACIÓN --- */}
          
            {/* 1. Renderizar los resultados de la búsqueda */}
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
            
            {/* 2. Botón para añadir ejercicio manual (siempre visible si no está cargando) */}
            <button
              onClick={onAddManual} // <-- Conectar la prop
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
            
            {/* 3. Mensaje de "No resultados" (solo si la búsqueda no arrojó nada) */}
            {filteredExercises.length === 0 && (
              <p className="text-center text-text-muted pt-10">{t('exercise_ui:no_exercises_found', 'No se encontraron ejercicios.')}</p>
            )}
            
            {/* --- FIN DE LA MODIFICACIÓN --- */}
          </>
        )}
      </div>
    </div>
  );
};

export default ExerciseListView;