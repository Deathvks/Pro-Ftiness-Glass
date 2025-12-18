/* frontend/src/pages/TemplateRoutines.jsx */
import React, { useState, useMemo, useEffect } from 'react';
import { Play, Copy, Search, Filter, X, Clock, Target, Dumbbell } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import CustomSelect from '../components/CustomSelect';
import exerciseTranslations from '../locales/es/exercise_names.json';
// Importamos hook de tema para detectar OLED
import { useAppTheme } from '../hooks/useAppTheme';

// --- INICIO DE LA MODIFICACIÓN ---
// Traducciones manuales para ejercicios que falten en el JSON
const EXTRA_TRANSLATIONS = {
  "Incline Dumbbell Press": "Press Inclinado con Mancuernas",
};
// --- FIN DE LA MODIFICACIÓN ---

// --- RUTINAS PREDEFINIDAS ---
const DEFAULT_ROUTINES = {
  "Rutinas Básicas": [
    {
      id: "def_fullbody",
      name: "Full Body (Mancuernas)",
      description: "Rutina de cuerpo completo utilizando principalmente mancuernas, basada en tu biblioteca.",
      TemplateRoutineExercises: [
        { id: "d1", name: "Dumbbell Front Squat", sets: 3, reps: "10-12" },
        { id: "d2", name: "Dumbbell Bench Press", sets: 3, reps: "10-12" },
        { id: "d3", name: "Dumbbell Romanian Deadlift", sets: 3, reps: "10-12" },
        { id: "d4", name: "Shoulder Press (Dumbbell)", sets: 3, reps: "10-12" },
        { id: "d5", name: "Dumbbell Bent Over Row", sets: 3, reps: "10-12" }
      ]
    },
    {
      id: "def_torso",
      name: "Torso (Upper Body)",
      description: "Entrenamiento enfocado en pecho, espalda, hombros y brazos.",
      TemplateRoutineExercises: [
        { id: "d6", name: "Dumbbell Bench Press", sets: 4, reps: "8-12" },
        { id: "d7", name: "Chin-ups", sets: 3, reps: "Al fallo" },
        { id: "d8", name: "Shoulder Press (Dumbbell)", sets: 3, reps: "10-12" },
        { id: "d9", name: "Seitheben KH", sets: 3, reps: "12-15" },
        { id: "d10", name: "Triceps Pushdown", sets: 3, reps: "12-15" },
        { id: "d11", name: "Bizeps KH-Curls", sets: 3, reps: "12-15" }
      ]
    },
    {
      id: "def_pierna",
      name: "Pierna (Lower Body)",
      description: "Entrenamiento completo de tren inferior.",
      TemplateRoutineExercises: [
        { id: "d12", name: "Dumbbell Front Squat", sets: 4, reps: "8-10" },
        { id: "d13", name: "Dumbbell Rear Lunge", sets: 3, reps: "10-12" },
        { id: "d14", name: "Dumbbell Romanian Deadlift", sets: 3, reps: "10-12" },
        { id: "d15", name: "Dumbbell Hip Thrust", sets: 3, reps: "12-15" },
        { id: "d16", name: "Seated Dumbbell Calf Raise", sets: 4, reps: "15-20" }
      ]
    }
  ]
};

// Normalizador de texto
const normalizeText = (text) => {
  return text
    ? text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    : "";
};

// Buscador inteligente de ejercicios
const findMatchingExercise = (templateName, libraryExercises) => {
  if (!libraryExercises || !templateName || libraryExercises.length === 0) return null;
  const normalizedTemplate = normalizeText(templateName);

  // 1. Coincidencia Exacta
  let match = libraryExercises.find(e => normalizeText(e.name) === normalizedTemplate);

  // 2. Coincidencia Parcial
  if (!match) {
    match = libraryExercises.find(e => {
      const libName = normalizeText(e.name);
      return libName.includes(normalizedTemplate) || normalizedTemplate.includes(libName);
    });
  }

  return match;
};

// Helper para obtener URL de medios
const getMediaUrl = (exercise) => {
  if (!exercise) return null;
  return exercise.gifUrl || exercise.gif_url || exercise.imageUrl || exercise.image_url ||
    exercise.image_url_start || exercise.image_url_end ||
    exercise.videoUrl || exercise.video_url || null;
};

const isMultiDayRoutine = (routines) => {
  if (!routines || routines.length < 2) return false;
  const dayRoutines = routines.filter(r => /^Día \d+:/.test(r.name));
  if (dayRoutines.length < 2) return false;
  const days = dayRoutines.map(r => parseInt(r.name.match(/^Día (\d+):/)[1], 10)).sort((a, b) => a - b);
  if (days[0] !== 1) return false;
  for (let i = 0; i < days.length - 1; i++) {
    if (days[i + 1] !== days[i] + 1) return false;
  }
  return true;
};

const TemplateRoutines = ({ setView }) => {
  const { addToast } = useToast();
  const { templateRoutines: fetchedRoutines, startWorkout, createRoutine, exercises } = useAppStore(state => ({
    templateRoutines: state.templateRoutines,
    startWorkout: state.startWorkout,
    createRoutine: state.createRoutine,
    exercises: state.allExercises || [],
  }));
  const { theme } = useAppTheme(); // Hook de tema

  const templateRoutines = useMemo(() => {
    if (!fetchedRoutines || Object.keys(fetchedRoutines).length === 0) {
      return DEFAULT_ROUTINES;
    }
    return { ...DEFAULT_ROUTINES, ...fetchedRoutines };
  }, [fetchedRoutines]);

  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('templateRoutinesSearchQuery') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => localStorage.getItem('templateRoutinesSelectedCategory') || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState(() => localStorage.getItem('templateRoutinesSelectedDifficulty') || 'all');
  const [showFilters, setShowFilters] = useState(() => localStorage.getItem('templateRoutinesShowFilters') === 'true');

  useEffect(() => { localStorage.setItem('templateRoutinesSearchQuery', searchQuery); }, [searchQuery]);
  useEffect(() => { localStorage.setItem('templateRoutinesSelectedCategory', selectedCategory); }, [selectedCategory]);
  useEffect(() => { localStorage.setItem('templateRoutinesSelectedDifficulty', selectedDifficulty); }, [selectedDifficulty]);
  useEffect(() => { localStorage.setItem('templateRoutinesShowFilters', showFilters.toString()); }, [showFilters]);

  // Obtener nombre traducido
  const getDisplayName = (originalName) => {
    if (!originalName) return "";
    // --- INICIO DE LA MODIFICACIÓN ---
    // Busca primero en el JSON, luego en el objeto manual, y si no, devuelve el original
    return exerciseTranslations[originalName] || EXTRA_TRANSLATIONS[originalName] || originalName;
    // --- FIN DE LA MODIFICACIÓN ---
  };

  const prepareExercisesForCopy = (templateExercises) => {
    return templateExercises.map((ex) => {
      const newEx = { ...ex };

      // Limpiar IDs ficticios
      if (typeof newEx.id === 'string' && (newEx.id.startsWith('def_') || newEx.id.startsWith('d'))) {
        delete newEx.id;
      } else {
        delete newEx.id;
        delete newEx.template_routine_id;
      }

      // Buscar coincidencia en la biblioteca
      const realExercise = findMatchingExercise(ex.name, exercises);

      if (realExercise) {
        newEx.exercise_id = realExercise.id;
        newEx.name = realExercise.name; // Nombre oficial (inglés) para la DB

        // --- FIX: COPIAR PROPIEDADES DE IMAGEN EXPLICITAMENTE ---
        // Esto asegura que la vista de Workout tenga la URL sin tener que buscarla de nuevo
        const mediaUrl = getMediaUrl(realExercise);
        if (mediaUrl) {
          newEx.image_url = mediaUrl;
          newEx.gifUrl = mediaUrl; // Por si acaso usa esta prop
        }

        // Copiar descripción si la tiene el ejercicio real y el template no
        if (!newEx.notes && realExercise.description) {
          // Opcional: Podrías poner la descripción en notas si quisieras
          // newEx.notes = realExercise.description; 
        }
      }

      return newEx;
    });
  };

  const handleCopyToMyRoutines = async (template) => {
    try {
      const result = await createRoutine({
        name: `${template.name} (Copia)`,
        description: template.description,
        exercises: prepareExercisesForCopy(template.TemplateRoutineExercises),
      });
      if (result.success) addToast('Rutina copiada con éxito.', 'success');
      else throw new Error(result.message);
    } catch (error) {
      addToast(error.message || 'Error al copiar rutina.', 'error');
    }
  };

  const handleCopyFullRoutine = async (category, routines) => {
    const dayRoutines = routines.filter(r => /^Día \d+:/.test(r.name)).sort((a, b) => {
      return parseInt(a.name.match(/^Día (\d+):/)[1]) - parseInt(b.name.match(/^Día (\d+):/)[1]);
    });

    if (!dayRoutines.length) return addToast('No hay días para copiar.', 'warning');

    try {
      for (const template of dayRoutines) {
        const result = await createRoutine({
          name: `${template.name} (Copia)`,
          description: template.description,
          exercises: prepareExercisesForCopy(template.TemplateRoutineExercises),
        });
        if (!result.success) throw new Error(result.message);
      }
      addToast(`Rutina completa '${category}' copiada.`, 'success');
    } catch (error) {
      addToast('Error al copiar la rutina completa.', 'error');
    }
  };

  const handleStartWorkout = (template) => {
    // Preparamos los ejercicios con sus imágenes y IDs reales
    const exercisesWithIds = prepareExercisesForCopy(template.TemplateRoutineExercises);

    // Creamos el objeto de rutina enriquecido
    const enrichedTemplate = {
      ...template,
      TemplateRoutineExercises: exercisesWithIds
    };

    startWorkout(enrichedTemplate);
    setView('workout');
  };

  const estimateRoutineDuration = (exs) => (exs?.length || 0) * 4;
  const getRoutineDifficulty = (exs) => {
    const len = exs?.length || 0;
    if (len <= 4) return 'Principiante';
    if (len <= 7) return 'Intermedio';
    return 'Avanzado';
  };

  const filteredRoutines = useMemo(() => {
    const categories = Object.keys(templateRoutines);
    let all = [];
    categories.forEach(cat => {
      templateRoutines[cat].forEach(r => {
        all.push({
          ...r,
          category: cat,
          difficulty: getRoutineDifficulty(r.TemplateRoutineExercises),
          duration: estimateRoutineDuration(r.TemplateRoutineExercises)
        });
      });
    });

    let filtered = all;
    if (searchQuery.trim()) {
      const q = normalizeText(searchQuery);
      filtered = filtered.filter(r =>
        normalizeText(r.name).includes(q) ||
        normalizeText(r.description).includes(q) ||
        normalizeText(r.category).includes(q)
      );
    }
    if (selectedCategory !== 'all') filtered = filtered.filter(r => r.category === selectedCategory);
    if (selectedDifficulty !== 'all') filtered = filtered.filter(r => r.difficulty === selectedDifficulty);

    const grouped = {};
    filtered.forEach(r => {
      if (!grouped[r.category]) grouped[r.category] = [];
      grouped[r.category].push(r);
    });
    return grouped;
  }, [templateRoutines, searchQuery, selectedCategory, selectedDifficulty]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    localStorage.removeItem('templateRoutinesSearchQuery');
    localStorage.removeItem('templateRoutinesSelectedCategory');
    localStorage.removeItem('templateRoutinesSelectedDifficulty');
  };

  const getDifficultyColor = (diff) => {
    if (diff === 'Principiante') return 'text-white bg-green border-green';
    if (diff === 'Intermedio') return 'text-black bg-amber-400 border-amber-400';
    if (diff === 'Avanzado') return 'text-white bg-red border-red';
    return 'text-text-secondary bg-bg-secondary/50 border-glass-border';
  };

  const categories = Object.keys(templateRoutines);
  const categoryOptions = [{ value: 'all', label: 'Todas' }, ...categories.map(c => ({ value: c, label: c }))];
  const difficultyOptions = [{ value: 'all', label: 'Todas' }, { value: 'Principiante', label: 'Principiante' }, { value: 'Intermedio', label: 'Intermedio' }, { value: 'Avanzado', label: 'Avanzado' }];

  // Lógica de contraste para OLED:
  const isOled = theme === 'oled';
  const imageBgClass = isOled ? 'bg-gray-200' : 'bg-bg-primary';

  return (
    <div className="flex flex-col gap-6 animate-[fade-in_0.5s_ease_out]">
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar rutinas..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent/40 text-sm focus:border-accent transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${showFilters ? 'bg-accent text-bg-secondary' : 'bg-bg-secondary text-text-secondary border border-glass-border'}`}>
            <Filter size={16} /> Filtros
          </button>
          {(selectedCategory !== 'all' || selectedDifficulty !== 'all' || searchQuery) && (
            <div className="flex items-center gap-2">
              <button onClick={clearFilters} className="text-xs text-text-secondary hover:text-accent transition font-medium">Limpiar todo</button>
            </div>
          )}
        </div>

        {showFilters && (
          <GlassCard className="p-4 relative z-50 overflow-visible">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative z-50">
                <label className="block text-sm font-medium text-text-secondary mb-2">Categoría</label>
                <CustomSelect value={selectedCategory} onChange={setSelectedCategory} options={categoryOptions} placeholder="Categoría" />
              </div>
              <div className="relative z-50">
                <label className="block text-sm font-medium text-text-secondary mb-2">Dificultad</label>
                <CustomSelect value={selectedDifficulty} onChange={setSelectedDifficulty} options={difficultyOptions} placeholder="Dificultad" />
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {Object.keys(filteredRoutines).length > 0 ? (
        <div className="space-y-12">
          {Object.keys(filteredRoutines).map(category => {
            const routinesForCategory = filteredRoutines[category];
            const isMultiDay = isMultiDayRoutine(routinesForCategory);
            return (
              <div key={category}>
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-text-primary">{category}</h2>
                  <span className="text-sm text-text-secondary bg-bg-secondary/50 px-3 py-1.5 rounded-lg border border-glass-border font-medium">{routinesForCategory.length} rutina{routinesForCategory.length !== 1 ? 's' : ''}</span>
                  {isMultiDay && (
                    <button onClick={() => handleCopyFullRoutine(category, routinesForCategory)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 text-accent font-semibold hover:bg-accent/20 transition text-sm border border-glass-border">
                      <Copy size={14} /> Copiar Todo
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 md:gap-8">
                  {routinesForCategory.map(routine => (
                    <GlassCard key={routine.id} className="p-6 md:p-7 flex flex-col min-h-[400px] hover:border-accent/30 transition-colors">
                      <div className="flex-grow space-y-4">
                        <div className="space-y-3">
                          <h3 className="text-lg md:text-xl font-bold text-accent">{routine.name}</h3>
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border ${getDifficultyColor(routine.difficulty)}`}><Target size={14} /> {routine.difficulty}</span>
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-text-secondary bg-bg-secondary/50 border border-glass-border"><Clock size={14} /> ~{routine.duration} min</span>
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-text-secondary bg-bg-secondary/50 border border-glass-border"><Dumbbell size={14} /> {routine.TemplateRoutineExercises.length} ejer.</span>
                          </div>
                        </div>
                        <p className="text-sm md:text-base text-text-secondary leading-relaxed">{routine.description}</p>
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-text-secondary">Ejercicios:</h4>
                          <div className="overflow-x-auto md:overflow-x-visible">
                            <ul className="space-y-2 min-w-full">
                              {routine.TemplateRoutineExercises.map(ex => {
                                const realExercise = findMatchingExercise(ex.name, exercises);
                                const mediaUrl = getMediaUrl(realExercise);
                                const dbName = realExercise ? realExercise.name : ex.name;
                                const displayName = getDisplayName(dbName);

                                return (
                                  <li key={ex.id} className="bg-bg-secondary/50 p-3 rounded-lg text-sm min-w-max md:min-w-0">
                                    <div className="flex items-center gap-3">
                                      {mediaUrl ? (
                                        // Aplicamos 'imageBgClass' dinámicamente
                                        <div className={`w-10 h-10 rounded overflow-hidden ${imageBgClass} shrink-0 border border-glass-border`}>
                                          <img
                                            src={mediaUrl}
                                            alt={displayName}
                                            // Cambiado a object-contain para asegurar que se vea la silueta completa
                                            className="w-full h-full object-contain"
                                            loading="lazy"
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-10 h-10 rounded bg-bg-primary flex items-center justify-center text-text-muted shrink-0 border border-glass-border">
                                          <Dumbbell size={16} />
                                        </div>
                                      )}
                                      <div className="flex-grow flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-3">
                                        <span className="font-medium whitespace-nowrap md:whitespace-normal">{displayName}</span>
                                        <span className="font-bold text-accent flex-shrink-0 text-left">{ex.sets}×{ex.reps}</span>
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-glass-border">
                        <button onClick={() => handleCopyToMyRoutines(routine)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent/10 text-accent font-semibold hover:bg-accent/20 transition text-sm"><Copy size={16} /> Copiar</button>
                        <button onClick={() => handleStartWorkout(routine)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent text-bg-secondary font-semibold hover:scale-105 transition text-sm"><Play size={16} /> Empezar</button>
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
          <p className="text-text-muted mb-2">No se encontraron rutinas.</p>
          <button onClick={clearFilters} className="text-accent hover:underline text-sm font-medium">Limpiar filtros</button>
        </GlassCard>
      )}
    </div>
  );
};

export default TemplateRoutines;