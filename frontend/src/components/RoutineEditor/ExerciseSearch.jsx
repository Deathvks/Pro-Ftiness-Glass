/* frontend/src/components/RoutineEditor/ExerciseSearch.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Trash2, ChevronLeft, Check, ShoppingCart, ListFilter } from 'lucide-react';
import Spinner from '../Spinner';
import { getExerciseList } from '../../services/exerciseService';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from 'react-i18next'; // <-- Añadido

// Componente de la tarjeta de ejercicio en la lista
const ExerciseListItem = ({ exercise, onAdd, onView, isStaged, t }) => { // <-- Añadido t
  return (
    <div className="flex items-center gap-4 p-3 bg-bg-secondary rounded-xl border border-glass-border">
      <button 
        onClick={() => onView(exercise)} 
        className="shrink-0 rounded-md overflow-hidden w-16 h-16 bg-bg-primary border border-glass-border"
      >
        <img
          src={exercise.image_url_start || '/logo.webp'}
          alt={`Imagen de ${exercise.name}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </button>
      <div className="flex-1 min-w-0" onClick={() => onView(exercise)}>
        {/* --- Modificado --- */}
        <p className="font-semibold truncate">{t(exercise.name, { defaultValue: exercise.name })}</p>
        <p className="text-sm text-text-muted truncate capitalize">{t(exercise.category || exercise.muscle_group, { defaultValue: exercise.category || exercise.muscle_group })}</p>
        <p className="text-sm text-text-secondary truncate">{t(exercise.description, { defaultValue: exercise.description || 'Sin descripción' })}</p>
        {/* --- Fin Modificado --- */}
      </div>
      <button
        onClick={() => onAdd(exercise)}
        disabled={isStaged}
        className={`p-3 rounded-full transition ${
          isStaged
            ? 'bg-green/20 text-green'
            : 'bg-accent/10 text-accent hover:bg-accent/20'
        }`}
        title={isStaged ? "Añadido" : "Añadir al carrito"}
      >
        {isStaged ? <Check size={20} /> : <Plus size={20} />}
      </button>
    </div>
  );
};

// Componente para la vista de detalle
const ExerciseDetailView = ({ exercise, onBack, onAdd, isStaged, t }) => { // <-- Añadido t
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('8-12');
  const [rest, setRest] = useState(60);

  const handleAddClick = () => {
    onAdd(exercise, { sets, reps, rest_time: rest });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-glass-border">
        <button onClick={onBack} className="flex items-center gap-2 p-2 -m-2 rounded-lg hover:bg-white/10">
          <ChevronLeft size={24} />
          <span className="font-semibold">Volver</span>
        </button>
        {/* --- Modificado --- */}
        <h2 className="text-xl font-bold truncate px-4">{t(exercise.name, { defaultValue: exercise.name })}</h2>
        {/* --- Fin Modificado --- */}
        <div className="w-16"></div>
      </div>
      
      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Visor de medios (Imágenes / Video) */}
        <div className="mb-6 aspect-video bg-bg-primary rounded-xl border border-glass-border overflow-hidden flex items-center justify-center">
          {exercise.video_url ? (
            <video
              src={exercise.video_url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex gap-4 w-full h-full p-4">
              <img
                src={exercise.image_url_start || '/logo.webp'}
                alt={`Inicio de ${exercise.name}`}
                className="w-1/2 h-full object-contain"
              />
              <img
                src={exercise.image_url_end || exercise.image_url_start || '/logo.webp'}
                alt={`Fin de ${exercise.name}`}
                className="w-1/2 h-full object-contain"
              />
            </div>
          )}
        </div>
        
        {/* Información */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-bg-secondary p-4 rounded-lg border border-glass-border">
            <p className="text-sm text-text-muted">Grupo Muscular</p>
            {/* --- Modificado --- */}
            <p className="font-semibold capitalize">{t(exercise.category || exercise.muscle_group, { defaultValue: exercise.category || exercise.muscle_group })}</p>
            {/* --- Fin Modificado --- */}
          </div>
          <div className="bg-bg-secondary p-4 rounded-lg border border-glass-border">
            <p className="text-sm text-text-muted">Equipamiento</p>
            {/* --- Modificado --- */}
            <p className="font-semibold capitalize">{t(exercise.equipment || 'N/A', { defaultValue: exercise.equipment || 'N/A' })}</p>
            {/* --- Fin Modificado --- */}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Descripción</h3>
          {/* --- Modificado --- */}
          <p className="text-text-secondary whitespace-pre-line leading-relaxed">
            {t(exercise.description, { defaultValue: exercise.description || 'No hay descripción disponible.' })}
          </p>
          {/* --- Fin Modificado --- */}
        </div>
      </div>

      {/* Footer (Formulario y Añadir) */}
      <div className="flex-shrink-0 p-4 border-t border-glass-border bg-bg-primary/80 backdrop-blur-sm">
        <div className="flex gap-4 mb-4">
          <div>
            <label className="text-xs text-text-muted">Series</label>
            <input 
              type="number"
              value={sets}
              onChange={(e) => setSets(Number(e.target.value))}
              className="w-full text-center px-3 py-2 rounded-md bg-bg-secondary border border-glass-border"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted">Reps</label>
            <input 
              type="text"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full text-center px-3 py-2 rounded-md bg-bg-secondary border border-glass-border"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted">Desc. (s)</label>
            <input 
              type="number"
              value={rest}
              onChange={(e) => setRest(Number(e.target.value))}
              className="w-full text-center px-3 py-2 rounded-md bg-bg-secondary border border-glass-border"
            />
          </div>
        </div>
        <button
          onClick={handleAddClick}
          disabled={isStaged}
          className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition ${
            isStaged
              ? 'bg-green/20 text-green'
              : 'bg-accent text-bg-secondary'
          }`}
        >
          {isStaged ? (
            <>
              <Check size={24} />
              Añadido al carrito
            </>
          ) : (
            <>
              <Plus size={24} />
              Añadir al carrito
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Componente para la vista de Resumen/Carrito
const ExerciseSummaryView = ({ stagedExercises, onBack, onUpdate, onRemove, onFinalize, t }) => { // <-- Añadido t
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-glass-border">
        <button onClick={onBack} className="flex items-center gap-2 p-2 -m-2 rounded-lg hover:bg-white/10">
          <ChevronLeft size={24} />
          <span className="font-semibold">Volver</span>
        </button>
        <h2 className="text-xl font-bold">Revisar Ejercicios</h2>
        <div className="w-16"></div>
      </div>

      {/* Lista de ejercicios en carrito */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {stagedExercises.length === 0 ? (
          <p className="text-center text-text-muted pt-10">Tu carrito está vacío.</p>
        ) : (
          stagedExercises.map((item) => (
            <div key={item.exercise.id} className="bg-bg-secondary rounded-xl border border-glass-border p-4">
              <div className="flex items-start gap-4">
                <img
                  src={item.exercise.image_url_start || '/logo.webp'}
                  alt={`Imagen de ${item.exercise.name}`}
                  className="w-12 h-12 rounded-md object-cover border border-glass-border"
                />
                <div className="flex-1 min-w-0">
                  {/* --- Modificado --- */}
                  <p className="font-semibold truncate">{t(item.exercise.name, { defaultValue: item.exercise.name })}</p>
                  <p className="text-sm text-text-muted capitalize">{t(item.exercise.category || item.exercise.muscle_group, { defaultValue: item.exercise.category || item.exercise.muscle_group })}</p>
                  {/* --- Fin Modificado --- */}
                </div>
                <button 
                  onClick={() => onRemove(item.exercise.id)}
                  className="p-2 -m-2 text-text-muted hover:text-red"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="flex gap-4 mt-4">
                <div>
                  <label className="text-xs text-text-muted">Series</label>
                  <input 
                    type="number"
                    value={item.sets}
                    onChange={(e) => onUpdate(item.exercise.id, 'sets', Number(e.target.value))}
                    className="w-full text-center px-3 py-2 rounded-md bg-bg-primary border border-glass-border"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted">Reps</label>
                  <input 
                    type="text"
                    value={item.reps}
                    onChange={(e) => onUpdate(item.exercise.id, 'reps', e.target.value)}
                    className="w-full text-center px-3 py-2 rounded-md bg-bg-primary border border-glass-border"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted">Desc. (s)</label>
                  <input 
                    type="number"
                    value={item.rest_time}
                    onChange={(e) => onUpdate(item.exercise.id, 'rest_time', Number(e.target.value))}
                    className="w-full text-center px-3 py-2 rounded-md bg-bg-primary border border-glass-border"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer (Finalizar) */}
      <div className="flex-shrink-0 p-4 border-t border-glass-border bg-bg-primary/80 backdrop-blur-sm">
        <button
          onClick={onFinalize}
          disabled={stagedExercises.length === 0}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-accent text-bg-secondary font-bold text-lg transition hover:scale-105 disabled:opacity-50"
        >
          <Check size={24} />
          Añadir {stagedExercises.length} Ejercicio{stagedExercises.length !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
};

// --- Componente Principal ---
const ExerciseSearch = ({ onClose, onAddExercises }) => {
  const { t } = useTranslation('exercises'); // <-- Añadido
  
  const [view, setView] = useState('list'); // 'list', 'detail', 'summary'
  const [selectedExercise, setSelectedExercise] = useState(null);
  
  const [allExercises, setAllExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterMuscle, setFilterMuscle] = useState('all');
  const [filterEquipment, setFilterEquipment] = useState('all');

  const [stagedExercises, setStagedExercises] = useState([]); // El "carrito"

  // Fetch de datos
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setIsLoading(true);
        const data = await getExerciseList();
        setAllExercises(data);
      // --- CORREGIDO ---
      } catch (error) { 
        addToast(error.message || 'Error al cargar los ejercicios.', 'error');
      } finally {
      // --- FIN CORREGIDO ---
        setIsLoading(false);
      }
    };
    fetchExercises();
  }, [addToast]);

  // Lógica de filtros y búsqueda
  const { muscleGroups, equipmentTypes } = useMemo(() => {
    const muscleSet = new Set();
    const equipmentSet = new Set();
    allExercises.forEach(ex => {
      // Usamos 'all' como clave por defecto si no hay categoría/equipamiento
      muscleSet.add(ex.category?.toLowerCase() || 'all');
      if (ex.equipment) {
        ex.equipment.split(',').forEach(eq => equipmentSet.add(eq.trim().toLowerCase()));
      } else {
        equipmentSet.add('all');
      }
    });
    return {
      muscleGroups: ['all', ...Array.from(muscleSet).filter(m => m !== 'all').sort()],
      equipmentTypes: ['all', ...Array.from(equipmentSet).filter(e => e !== 'all').sort()],
    };
  }, [allExercises]);

  const filteredExercises = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allExercises.filter(ex => {
      // --- Modificado ---
      // Comparamos la búsqueda con el nombre original O el traducido
      const originalName = ex.name.toLowerCase();
      const translatedName = t(ex.name, { defaultValue: ex.name }).toLowerCase();
      const nameMatch = originalName.includes(query) || translatedName.includes(query);
      // --- Fin Modificado ---
      
      const muscleMatch = filterMuscle === 'all' || ex.category?.toLowerCase() === filterMuscle;
      const equipmentMatch = filterEquipment === 'all' || ex.equipment?.toLowerCase().includes(filterEquipment);
      return nameMatch && muscleMatch && equipmentMatch;
    });
  }, [allExercises, searchQuery, filterMuscle, filterEquipment, t]); // <-- Añadido t

  const stagedIds = useMemo(() => new Set(stagedExercises.map(item => item.exercise.id)), [stagedExercises]);

  // --- Handlers del Carrito ---

  const handleStageExercise = (exercise, details = {}) => {
    if (stagedIds.has(exercise.id)) return; // Ya está
    setStagedExercises(prev => [
      ...prev,
      {
        exercise: exercise,
        sets: details.sets || 3,
        reps: details.reps || '8-12',
        rest_time: details.rest_time || 60,
      }
    ]);
    // --- Modificado ---
    addToast(`${t(exercise.name, { defaultValue: exercise.name })} añadido al carrito`, 'success');
    // --- Fin Modificado ---
  };

  const handleRemoveStaged = (exerciseId) => {
    setStagedExercises(prev => prev.filter(item => item.exercise.id !== exerciseId));
  };

  const handleUpdateStaged = (exerciseId, field, value) => {
    setStagedExercises(prev => 
      prev.map(item => 
        item.exercise.id === exerciseId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleFinalize = () => {
    onAddExercises(stagedExercises);
    // onClose(); // El padre se encarga de cerrar
  };

  // --- Handlers de Navegación ---
  
  const handleViewDetail = (exercise) => {
    setSelectedExercise(exercise);
    setView('detail');
  };

  const handleBackToList = () => {
    setSelectedExercise(null);
    setView('list');
  };
  
  const handleViewSummary = () => {
    setView('summary');
  };


  // --- Renderizado ---

  const renderContent = () => {
    if (isLoading && view === 'list') {
      return <div className="flex justify-center items-center h-full"><Spinner size={40} /></div>;
    }

    if (view === 'detail' && selectedExercise) {
      return (
        <ExerciseDetailView 
          exercise={selectedExercise}
          onBack={handleBackToList}
          onAdd={handleStageExercise}
          isStaged={stagedIds.has(selectedExercise.id)}
          t={t} // <-- Añadido
        />
      );
    }

    if (view === 'summary') {
      return (
        <ExerciseSummaryView
          stagedExercises={stagedExercises}
          onBack={handleBackToList}
          onUpdate={handleUpdateStaged}
          onRemove={handleRemoveStaged}
          onFinalize={handleFinalize}
          t={t} // <-- Añadido
        />
      );
    }

    // Vista 'list' por defecto
    return (
      <div className="flex flex-col h-full">
        {/* Header (Cerrar y Carrito) */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-glass-border">
          <h2 className="text-xl font-bold">Añadir Ejercicios</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleViewSummary}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-bg-secondary font-semibold"
            >
              <ShoppingCart size={18} />
              <span>Ver Carrito</span>
              {stagedExercises.length > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red text-white text-xs font-bold flex items-center justify-center border-2 border-bg-primary">
                  {stagedExercises.length}
                </span>
              )}
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="flex-shrink-0 p-4 space-y-4 border-b border-glass-border">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar ejercicio..."
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
            <span>{showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}</span>
            { (filterMuscle !== 'all' || filterEquipment !== 'all') && 
              <span className="w-2 h-2 rounded-full bg-accent"></span> 
            }
          </button>
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted block mb-1">Grupo Muscular</label>
                <select 
                  value={filterMuscle}
                  onChange={(e) => setFilterMuscle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-bg-secondary border border-glass-border capitalize"
                >
                  {/* --- Modificado --- */}
                  {muscleGroups.map(group => (
                    <option key={group} value={group} className="capitalize">
                      {t(group, { defaultValue: group })}
                    </option>
                  ))}
                  {/* --- Fin Modificado --- */}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">Equipamiento</label>
                <select 
                  value={filterEquipment}
                  onChange={(e) => setFilterEquipment(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-bg-secondary border border-glass-border capitalize"
                >
                  {/* --- Modificado --- */}
                  {equipmentTypes.map(eq => (
                    <option key={eq} value={eq} className="capitalize">
                      {t(eq, { defaultValue: eq })}
                    </option>
                  ))}
                  {/* --- Fin Modificado --- */}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Ejercicios */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredExercises.length > 0 ? (
            filteredExercises.map(exercise => (
              <ExerciseListItem
                key={exercise.id}
                exercise={exercise}
                onAdd={handleStageExercise}
                onView={handleViewDetail}
                isStaged={stagedIds.has(exercise.id)}
                t={t} // <-- Añadido
              />
            ))
          ) : (
            <p className="text-center text-text-muted pt-10">No se encontraron ejercicios.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary flex justify-center items-center animate-[fade-in_0.2s_ease-out]">
      <div className="relative w-full h-full md:max-w-2xl md:max-h-[90vh] md:rounded-lg overflow-hidden bg-bg-primary md:border md:border-glass-border md:shadow-2xl">
        {renderContent()}
      </div>
    </div>
  );
};

export default ExerciseSearch;