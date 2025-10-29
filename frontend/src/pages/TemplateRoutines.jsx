/* frontend/src/pages/TemplateRoutines.jsx */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Play, Copy, Search, Filter, X, Clock, Target, Dumbbell } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
// --- INICIO DE LA MODIFICACIÓN ---
// import { saveRoutine } from '../services/routineService'; // <-- Esta línea se elimina, causa el error
// --- FIN DE LA MODIFICACIÓN ---
import CustomSelect from '../components/CustomSelect'; // Importamos el componente reutilizable

// Helper to identify multi-day routines
const isMultiDayRoutine = (routines) => {
  if (!routines || routines.length < 2) return false;
  const dayRoutines = routines.filter(r => /^Día \d+:/.test(r.name));
  if (dayRoutines.length < 2) return false;

  // Check for consecutive days starting from 1
  const days = dayRoutines.map(r => parseInt(r.name.match(/^Día (\d+):/)[1], 10)).sort((a, b) => a - b);
  
  if (days[0] !== 1) return false; // Must start with Day 1

  for (let i = 0; i < days.length - 1; i++) {
    if (days[i+1] !== days[i] + 1) {
      return false; // Not consecutive
    }
  }
  return true;
};

const TemplateRoutines = ({ setView }) => {
  const { addToast } = useToast();
  // --- INICIO DE LA MODIFICACIÓN ---
  // Añadimos 'createRoutine' a la desestructuración de useAppStore
  // y eliminamos 'fetchInitialData' ya que no se necesitará
  const { templateRoutines, startWorkout, createRoutine } = useAppStore(state => ({
    templateRoutines: state.templateRoutines,
    startWorkout: state.startWorkout,
    createRoutine: state.createRoutine,
  }));
  // --- FIN DE LA MODIFICACIÓN ---

  // Estados para filtros y búsqueda con persistencia en localStorage
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('templateRoutinesSearchQuery') || '';
  });
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return localStorage.getItem('templateRoutinesSelectedCategory') || 'all';
  });
  const [selectedDifficulty, setSelectedDifficulty] = useState(() => {
    return localStorage.getItem('templateRoutinesSelectedDifficulty') || 'all';
  });
  const [showFilters, setShowFilters] = useState(() => {
    return localStorage.getItem('templateRoutinesShowFilters') === 'true';
  });

  // Efectos para guardar en localStorage cuando cambien los filtros
  useEffect(() => {
    localStorage.setItem('templateRoutinesSearchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('templateRoutinesSelectedCategory', selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    localStorage.setItem('templateRoutinesSelectedDifficulty', selectedDifficulty);
  }, [selectedDifficulty]);

  useEffect(() => {
    localStorage.setItem('templateRoutinesShowFilters', showFilters.toString());
  }, [showFilters]);

  // --- INICIO DE LA MODIFICACIÓN ---
  // Actualizamos 'handleCopyToMyRoutines' para usar 'createRoutine' del store
  const handleCopyToMyRoutines = async (template) => {
    const exercises = template.TemplateRoutineExercises.map((ex) => {
      const newEx = { ...ex };
      delete newEx.id;
      delete newEx.template_routine_id;
      return newEx;
    });

    const newRoutine = {
      name: `${template.name} (Copia)`,
      description: template.description,
      exercises: exercises,
    };

    try {
      // Usamos la acción del store en lugar del servicio
      const result = await createRoutine(newRoutine);
      
      if (result.success) {
        addToast('Rutina copiada a "Mis Rutinas" con éxito.', 'success');
        // await fetchInitialData(); // <-- Ya no es necesario
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      addToast(error.message || 'No se pudo copiar la rutina.', 'error');
    }
  };
  // --- FIN DE LA MODIFICACIÓN ---
  
  // --- INICIO DE LA MODIFICACIÓN ---
  // Actualizamos 'handleCopyFullRoutine' para usar 'createRoutine' del store
  const handleCopyFullRoutine = async (category, routines) => {
    const dayRoutines = routines
      .filter(r => /^Día \d+:/.test(r.name))
      .sort((a, b) => {
        const dayA = parseInt(a.name.match(/^Día (\d+):/)[1], 10);
        const dayB = parseInt(b.name.match(/^Día (\d+):/)[1], 10);
        return dayA - dayB;
      });

    if (dayRoutines.length === 0) {
      addToast('No se encontraron días de rutina para copiar.', 'warning');
      return;
    }

    try {
      for (const template of dayRoutines) {
        const exercises = template.TemplateRoutineExercises.map((ex) => {
          const newEx = { ...ex };
          delete newEx.id;
          delete newEx.template_routine_id;
          return newEx;
        });

        const newRoutine = {
          name: `${template.name} (Copia)`,
          description: template.description,
          exercises: exercises,
        };
        
        // Usamos la acción del store
        const result = await createRoutine(newRoutine);
        if (!result.success) {
          // Si una falla, nos detenemos y mostramos el error
          throw new Error(result.message || `No se pudo copiar '${template.name}'`);
        }
      }

      addToast(`Rutina completa '${category}' copiada a "Mis Rutinas".`, 'success');
      // await fetchInitialData(); // <-- Ya no es necesario
    } catch (error) {
      addToast(error.message || 'No se pudo copiar la rutina completa.', 'error');
    }
  };
  // --- FIN DE LA MODIFICACIÓN ---

  const handleStartWorkout = (template) => {
    startWorkout(template);
    setView('workout');
  };

  // Función para estimar duración de rutina
  const estimateRoutineDuration = (exercises) => {
    if (!exercises || exercises.length === 0) return 0;
    // Estimación: 3 minutos por ejercicio + 1 minuto de descanso
    return exercises.length * 4;
  };

  // Función para determinar dificultad basada en ejercicios
  const getRoutineDifficulty = (exercises) => {
    if (!exercises || exercises.length === 0) return 'Principiante';
    if (exercises.length <= 4) return 'Principiante';
    if (exercises.length <= 7) return 'Intermedio';
    return 'Avanzado';
  };

  // Obtener todas las categorías disponibles
  const categories = Object.keys(templateRoutines);

  // Opciones para los dropdowns
  const categoryOptions = [
    { value: 'all', label: 'Todas las categorías' },
    ...categories.map(category => ({ value: category, label: category }))
  ];

  const difficultyOptions = [
    { value: 'all', label: 'Todas las dificultades' },
    { value: 'Principiante', label: 'Principiante' },
    { value: 'Intermedio', label: 'Intermedio' },
    { value: 'Avanzado', label: 'Avanzado' }
  ];

  // Filtrar y buscar rutinas
  const filteredRoutines = useMemo(() => {
    let allRoutines = [];
    
    // Aplanar todas las rutinas con su categoría
    categories.forEach(category => {
      templateRoutines[category].forEach(routine => {
        allRoutines.push({
          ...routine,
          category,
          difficulty: getRoutineDifficulty(routine.TemplateRoutineExercises),
          duration: estimateRoutineDuration(routine.TemplateRoutineExercises)
        });
      });
    });

    // Aplicar filtros
    let filtered = allRoutines;

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(routine => 
        routine.name.toLowerCase().includes(query) ||
        routine.description.toLowerCase().includes(query) ||
        routine.category.toLowerCase().includes(query)
      );
    }

    // Filtro por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(routine => routine.category === selectedCategory);
    }

    // Filtro por dificultad
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(routine => routine.difficulty === selectedDifficulty);
    }

    // Agrupar por categoría para mostrar
    const grouped = {};
    filtered.forEach(routine => {
      if (!grouped[routine.category]) {
        grouped[routine.category] = [];
      }
      grouped[routine.category].push(routine);
    });

    return grouped;
  }, [templateRoutines, searchQuery, selectedCategory, selectedDifficulty, categories]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    // También limpiar del localStorage
    localStorage.removeItem('templateRoutinesSearchQuery');
    localStorage.removeItem('templateRoutinesSelectedCategory');
    localStorage.removeItem('templateRoutinesSelectedDifficulty');
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Principiante': return 'text-white bg-green border-green';
      case 'Intermedio': return 'text-black bg-amber-400 border-amber-400';
      case 'Avanzado': return 'text-white bg-red border-red';
      default: return 'text-text-secondary bg-bg-secondary/50 border-glass-border';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-[fade-in_0.5s_ease_out]">
      {/* Barra de búsqueda y filtros */}
      <div className="space-y-4">
        {/* Búsqueda */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar rutinas..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm focus:border-accent transition"
          />
        </div>

        {/* Botón de filtros y filtros activos */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
              showFilters 
                ? 'bg-accent text-bg-secondary' 
                : 'bg-bg-secondary text-text-secondary hover:bg-white/10 border border-glass-border'
            }`}
          >
            <Filter size={16} />
            Filtros
          </button>

          {/* Mostrar filtros activos */}
          {(selectedCategory !== 'all' || selectedDifficulty !== 'all' || searchQuery) && (
            <div className="flex items-center gap-2">
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 text-accent text-xs">
                  {selectedCategory}
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className="hover:bg-accent/20 rounded transition"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedDifficulty !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 text-accent text-xs">
                  {selectedDifficulty}
                  <button 
                    onClick={() => setSelectedDifficulty('all')}
                    className="hover:bg-accent/20 rounded transition"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-text-secondary hover:text-accent transition font-medium"
              >
                Limpiar todo
              </button>
            </div>
          )}
        </div>

        {/* Panel de filtros con dropdowns personalizados */}
        {showFilters && (
          <GlassCard className="p-4 relative z-50 overflow-visible">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Filtro por categoría */}
              <div className="relative z-50">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Categoría
                </label>
                <CustomSelect
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={categoryOptions}
                  placeholder="Seleccionar categoría"
                />
              </div>

              {/* Filtro por dificultad */}
              <div className="relative z-50">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Dificultad
                </label>
                <CustomSelect
                  value={selectedDifficulty}
                  onChange={setSelectedDifficulty}
                  options={difficultyOptions}
                  placeholder="Seleccionar dificultad"
                />
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Rutinas filtradas */}
      {Object.keys(filteredRoutines).length > 0 ? (
        <div className="space-y-12">
          {Object.keys(filteredRoutines).map(category => {
            const routinesForCategory = filteredRoutines[category];
            const isMultiDay = isMultiDayRoutine(routinesForCategory);

            return (
              <div key={category}>
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-text-primary">{category}</h2>
                  <span className="text-sm text-text-secondary bg-bg-secondary/50 px-3 py-1.5 rounded-lg border border-glass-border font-medium">
                    {routinesForCategory.length} rutina{routinesForCategory.length !== 1 ? 's' : ''}
                  </span>
                  {isMultiDay && (
                    <button
                      onClick={() => handleCopyFullRoutine(category, routinesForCategory)}
                      className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 text-accent font-semibold hover:bg-accent/20 transition text-sm border border-glass-border"
                    >
                      <Copy size={14} />
                      Copiar Rutina Completa
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 md:gap-8">
                  {routinesForCategory.map(routine => (
                    <GlassCard key={routine.id} className="p-6 md:p-7 flex flex-col min-h-[400px] hover:border-accent/30 transition-colors">
                      <div className="flex-grow space-y-4">
                        {/* Header con título y badges */}
                        <div className="space-y-3">
                          <h3 className="text-lg md:text-xl font-bold text-accent">{routine.name}</h3>
                          
                          {/* Badges informativos */}
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border ${
                              getDifficultyColor(routine.difficulty)
                            }`}>
                              <Target size={14} />
                              {routine.difficulty}
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-text-secondary bg-bg-secondary/50 border border-glass-border">
                              <Clock size={14} />
                              ~{routine.duration} min
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-text-secondary bg-bg-secondary/50 border border-glass-border">
                              <Dumbbell size={14} />
                              {routine.TemplateRoutineExercises.length} ejercicios
                            </span>
                          </div>
                        </div>

                        {/* Descripción */}
                        <p className="text-sm md:text-base text-text-secondary leading-relaxed">{routine.description}</p>
                        
                        {/* Lista completa de ejercicios */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-text-secondary">Ejercicios:</h4>
                          <div className="overflow-x-auto md:overflow-x-visible">
                            <ul className="space-y-2 min-w-full">
                              {routine.TemplateRoutineExercises.map(ex => (
                                <li key={ex.id} className="bg-bg-secondary/50 p-3 rounded-lg text-sm min-w-max md:min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-3">
                                    <span className="font-medium whitespace-nowrap md:whitespace-normal">{ex.name}</span>
                                    <span className="font-bold text-accent flex-shrink-0 text-left">{ex.sets}×{ex.reps}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botones de acción centrados */}
                      <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-glass-border">
                        <button 
                          onClick={() => handleCopyToMyRoutines(routine)} 
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent/10 text-accent font-semibold hover:bg-accent/20 transition text-sm"
                        >
                          <Copy size={16} />
                          Copiar
                        </button>
                        <button 
                          onClick={() => handleStartWorkout(routine)} 
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent text-bg-secondary font-semibold hover:scale-105 transition text-sm"
                        >
                          <Play size={16} />
                          Empezar
                        </button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <GlassCard className="text-center p-8 md:p-10">
          <p className="text-text-muted mb-2">No se encontraron rutinas que coincidan con los filtros.</p>
          <button
            onClick={clearFilters}
            className="text-accent hover:underline text-sm font-medium"
          >
            Limpiar filtros
          </button>
        </GlassCard>
      )}
    </div>
  );
};

export default TemplateRoutines;