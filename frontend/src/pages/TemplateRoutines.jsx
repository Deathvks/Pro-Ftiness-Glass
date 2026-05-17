/* frontend/src/pages/TemplateRoutines.jsx */
import React, { useState, useMemo, useEffect } from 'react';
import { Play, Copy, Search, Filter, Clock, Target, Dumbbell, Image as ImageIcon } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import CustomSelect from '../components/CustomSelect';
import exerciseTranslations from '../locales/es/exercise_names.json';
import { useAppTheme } from '../hooks/useAppTheme';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

const processMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  const filename = cleanUrl.split('/').pop();
  const isWgerUuid = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.test(filename);
  if (isWgerUuid || cleanUrl.includes('exercise-images')) {
    return `https://wger.de/media/exercise-images/${filename}`;
  }
  return `${BACKEND_BASE_URL}/${cleanUrl}`;
};

const EXTRA_TRANSLATIONS = {
  "Incline Dumbbell Press": "Press Inclinado con Mancuernas",
};

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
        { id: "d9", name: "Dumbbell Lateral Raise", sets: 3, reps: "12-15" },
        { id: "d10", name: "Triceps Pushdown", sets: 3, reps: "12-15" },
        { id: "d11", name: "Dumbbell Bicep Curl", sets: 3, reps: "12-15" }
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

const normalizeText = (text) => text ? text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

const findMatchingExercise = (templateName, libraryExercises) => {
  if (!libraryExercises || !templateName || libraryExercises.length === 0) return null;
  const normalizedTemplate = normalizeText(templateName);
  let match = libraryExercises.find(e => normalizeText(e.name) === normalizedTemplate);
  if (!match) {
    match = libraryExercises.find(e => {
      const libName = normalizeText(e.name);
      return libName.includes(normalizedTemplate) || normalizedTemplate.includes(libName);
    });
  }
  return match;
};

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

// Mini-componente para manejar imágenes con error o vacías de forma limpia
const ExerciseThumbnail = ({ mediaUrl, displayName, imageBgClass }) => {
  const [error, setError] = useState(false);

  if (mediaUrl && !error) {
    return (
      <div className={`w-14 h-14 rounded-[12px] overflow-hidden ${imageBgClass} shrink-0 ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center p-1.5 shadow-sm`}>
        <img 
          src={mediaUrl} 
          alt={displayName} 
          className="w-full h-full object-contain" 
          loading="lazy"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <div className="w-14 h-14 rounded-[12px] bg-accent/10 flex items-center justify-center text-accent shrink-0 ring-1 ring-accent/30 shadow-sm">
      <ImageIcon size={24} strokeWidth={1.5} className="opacity-60" />
    </div>
  );
};

const TemplateRoutines = ({ setView }) => {
  const { addToast } = useToast();
  const { templateRoutines: fetchedRoutines, startWorkout, createRoutine, exercises } = useAppStore(state => ({
    templateRoutines: state.templateRoutines,
    startWorkout: state.startWorkout,
    createRoutine: state.createRoutine,
    exercises: state.allExercises || [],
  }));
  const { theme } = useAppTheme();

  const templateRoutines = useMemo(() => {
    if (!fetchedRoutines || Object.keys(fetchedRoutines).length === 0) return DEFAULT_ROUTINES;
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

  const getDisplayName = (originalName) => exerciseTranslations[originalName] || EXTRA_TRANSLATIONS[originalName] || originalName;

  const prepareExercisesForCopy = (templateExercises) => {
    return templateExercises.map((ex) => {
      const newEx = { ...ex };
      if (typeof newEx.id === 'string' && (newEx.id.startsWith('def_') || newEx.id.startsWith('d'))) {
        delete newEx.id;
      } else {
        delete newEx.id;
        delete newEx.template_routine_id;
      }

      const realExercise = findMatchingExercise(ex.name, exercises);
      if (realExercise) {
        newEx.exercise_id = realExercise.id;
        newEx.name = realExercise.name;
        const mediaUrl = getMediaUrl(realExercise);
        if (mediaUrl) {
          newEx.image_url = mediaUrl;
          newEx.gifUrl = mediaUrl;
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
    const dayRoutines = routines.filter(r => /^Día \d+:/.test(r.name)).sort((a, b) => parseInt(a.name.match(/^Día (\d+):/)[1]) - parseInt(b.name.match(/^Día (\d+):/)[1]));
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
    const exercisesWithIds = prepareExercisesForCopy(template.TemplateRoutineExercises);
    startWorkout({ ...template, TemplateRoutineExercises: exercisesWithIds });
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
      filtered = filtered.filter(r => normalizeText(r.name).includes(q) || normalizeText(r.description).includes(q) || normalizeText(r.category).includes(q));
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
    if (diff === 'Principiante') return 'text-green-500 bg-green-500/10 ring-1 ring-green-500/30';
    if (diff === 'Intermedio') return 'text-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30';
    if (diff === 'Avanzado') return 'text-red bg-red/10 ring-1 ring-red/30';
    return 'text-text-secondary bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10';
  };

  const categories = Object.keys(templateRoutines);
  const categoryOptions = [{ value: 'all', label: 'Todas' }, ...categories.map(c => ({ value: c, label: c }))];
  const difficultyOptions = [{ value: 'all', label: 'Todas' }, { value: 'Principiante', label: 'Principiante' }, { value: 'Intermedio', label: 'Intermedio' }, { value: 'Avanzado', label: 'Avanzado' }];

  const isDarkTheme = theme === 'oled' || theme === 'dark';
  const imageBgClass = isDarkTheme ? 'bg-black/10 dark:bg-white/5' : 'bg-black/5 dark:bg-white/5';

  return (
    <div className="flex flex-col gap-6 animate-[fade-in_0.5s_ease_out]">
      <div className="space-y-4 mb-2">
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar rutinas..."
            className="w-full pl-12 pr-4 py-3.5 rounded-[20px] bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm font-bold text-text-primary placeholder:text-text-muted transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${showFilters ? 'bg-accent text-white shadow-md shadow-accent/20' : 'bg-black/5 dark:bg-white/5 text-text-secondary ring-1 ring-black/5 dark:ring-white/10 hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary'}`}
          >
            <Filter size={16} /> Filtros
          </button>
          {(selectedCategory !== 'all' || selectedDifficulty !== 'all' || searchQuery) && (
            <button onClick={clearFilters} className="text-[11px] sm:text-xs text-text-secondary hover:text-accent font-bold uppercase tracking-widest transition-colors ml-2">
              Limpiar todo
            </button>
          )}
        </div>

        {showFilters && (
          <GlassCard className="glass p-5 w-full max-w-2xl rounded-[24px] border-none ring-1 ring-black/5 dark:ring-white/10 animate-[slide-down_0.2s_ease-out]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">Categoría</label>
                <CustomSelect value={selectedCategory} onChange={setSelectedCategory} options={categoryOptions} placeholder="Categoría" />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">Dificultad</label>
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
              <div key={category} className="w-full">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">{category}</h2>
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 px-4 py-2 rounded-md">
                    {routinesForCategory.length} rutina{routinesForCategory.length !== 1 ? 's' : ''}
                  </span>
                  {isMultiDay && (
                    <button 
                      onClick={() => handleCopyFullRoutine(category, routinesForCategory)} 
                      className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent/10 text-accent font-bold uppercase tracking-wider text-[10px] sm:text-xs ring-1 ring-accent/30 hover:bg-accent/20 transition-all active:scale-95"
                    >
                      <Copy size={16} strokeWidth={2.5} /> Copiar Todo
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
                  {routinesForCategory.map(routine => (
                    <GlassCard 
                      key={routine.id} 
                      className="glass p-6 md:p-8 flex flex-col min-h-[400px] w-full rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
                    >
                      <div className="flex-grow space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-2xl font-extrabold text-accent tracking-tight">{routine.name}</h3>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider ${getDifficultyColor(routine.difficulty)}`}>
                              <Target size={16} strokeWidth={2.5} /> {routine.difficulty}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider text-text-secondary bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
                              <Clock size={16} strokeWidth={2.5} /> ~{routine.duration} min
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider text-text-secondary bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
                              <Dumbbell size={16} strokeWidth={2.5} /> {routine.TemplateRoutineExercises.length} ejer.
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm font-medium text-text-secondary leading-relaxed">{routine.description}</p>
                        
                        <div className="space-y-4 bg-black/5 dark:bg-white/5 rounded-[24px] p-5 ring-1 ring-black/5 dark:ring-white/10">
                          <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Ejercicios</h4>
                          <ul className="space-y-3 w-full">
                            {routine.TemplateRoutineExercises.map(ex => {
                              const realExercise = findMatchingExercise(ex.name, exercises);
                              const rawMediaUrl = getMediaUrl(realExercise);
                              const mediaUrl = processMediaUrl(rawMediaUrl);
                              const dbName = realExercise ? realExercise.name : ex.name;
                              const displayName = getDisplayName(dbName);

                              return (
                                <li key={ex.id} className="flex items-center gap-4 w-full bg-black/5 dark:bg-white/5 p-2 pr-4 rounded-[16px] ring-1 ring-black/5 dark:ring-white/10">
                                  <ExerciseThumbnail 
                                    mediaUrl={mediaUrl} 
                                    displayName={displayName} 
                                    imageBgClass={imageBgClass} 
                                  />
                                  <div className="flex flex-1 items-center justify-between gap-4 min-w-0">
                                    <span className="font-bold text-sm text-text-primary truncate">{displayName}</span>
                                    <span className="font-bold text-sm text-accent whitespace-nowrap bg-accent/10 px-3 py-1 rounded-md">{ex.sets} × {ex.reps}</span>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 pt-6 border-t border-black/5 dark:border-white/10">
                        <button 
                          onClick={() => handleCopyToMyRoutines(routine)} 
                          className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-[16px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-primary font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95 text-base"
                        >
                          <Copy size={20} strokeWidth={2.5} /> Copiar
                        </button>
                        <button 
                          onClick={() => handleStartWorkout(routine)} 
                          className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-[16px] bg-accent text-white font-bold hover:scale-[1.02] active:scale-95 transition-all text-base shadow-lg shadow-accent/20"
                        >
                          <Play size={20} strokeWidth={2.5} fill="currentColor" /> Empezar
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
        <GlassCard className="glass text-center p-12 sm:p-16 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-black/5 dark:bg-white/5 rounded-[24px] flex items-center justify-center mb-6 ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
             <Search size={40} className="text-text-muted opacity-50" strokeWidth={1.5} />
          </div>
          <p className="text-2xl font-extrabold text-text-primary mb-3">No se encontraron rutinas</p>
          <p className="text-base font-medium text-text-secondary mb-8">Ajusta los filtros o intenta con otra búsqueda.</p>
          <button 
            onClick={clearFilters} 
            className="px-8 py-4 bg-black/5 dark:bg-white/5 rounded-[16px] text-text-primary font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors ring-1 ring-black/5 dark:ring-white/10 active:scale-95"
          >
            Limpiar filtros
          </button>
        </GlassCard>
      )}
    </div>
  );
};

export default TemplateRoutines;