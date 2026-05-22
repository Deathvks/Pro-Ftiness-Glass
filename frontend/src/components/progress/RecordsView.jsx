/* frontend/src/components/progress/RecordsView.jsx */
import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Calendar, Weight, Award } from 'lucide-react';
import { getPersonalRecords, getPersonalRecordExerciseNames } from '../../services/personalRecordService';
import CustomSelect from '../CustomSelect';
import Spinner from '../Spinner';
import { useTranslation } from 'react-i18next';

const RecordsView = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [exerciseNames, setExerciseNames] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('all');

  // --- INICIO DE LA MODIFICACIÓN ---
  // 1. CORRECCIÓN: Apuntamos 't' al namespace 'exercise_names'
  const { t } = useTranslation('exercise_names');
  const { t: tCommon } = useTranslation('translation');
  // --- FIN DE LA MODIFICACIÓN ---

  useEffect(() => {
    const fetchExerciseNames = async () => {
      try {
        const names = await getPersonalRecordExerciseNames();
        setExerciseNames(names);
      } catch (err) {
        console.error("Error fetching exercise names:", err);
      }
    };
    fetchExerciseNames();
  }, []);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const response = await getPersonalRecords(currentPage, selectedExercise);
        setRecords(response.records || []);
        setTotalPages(response.totalPages || 1);
        setError(null);
      } catch (err) {
        console.error('Error fetching personal records:', err);
        setError(tCommon('Error al cargar los récords personales', { defaultValue: 'Error al cargar los récords personales' }));
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [currentPage, selectedExercise, tCommon]); 

  const handleFilterChange = (exercise) => {
    setSelectedExercise(exercise);
    setCurrentPage(1);
  };

  const filterOptions = useMemo(() => {
    // 2. Tu lógica aquí ya era correcta, ahora 't' tiene el namespace bueno
    const options = exerciseNames.map(name => ({ value: name, label: t(name, { defaultValue: name }) }));
    return [{ value: 'all', label: tCommon('Todos los ejercicios', { defaultValue: 'Todos los ejercicios' }) }, ...options];
  }, [exerciseNames, t, tCommon]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };
  
  const getExerciseIcon = (exerciseName) => {
    const name = exerciseName.toLowerCase();
    if (name.includes('press') || name.includes('bench') || name.includes('sentadilla') || name.includes('peso muerto')) {
      return <Weight size={24} strokeWidth={1.5} />;
    }
    return <Award size={24} strokeWidth={1.5} />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 animate-[fade-in_0.3s_ease-out]"><Spinner size={32} /></div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4 bg-red-500/10 rounded-[32px] ring-1 ring-red-500/20 animate-[fade-in_0.3s_ease-out]">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button 
          onClick={() => { setCurrentPage(1); setSelectedExercise('all'); }}
          className="px-6 py-3 bg-red-500 text-white font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-md shadow-red-500/20"
        >
          {tCommon('Reintentar', { defaultValue: 'Reintentar' })}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fade-in_0.4s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <h3 className="text-xl sm:text-2xl font-extrabold text-text-primary flex items-center gap-3 tracking-tight">
          <div className="p-2.5 bg-yellow-500/10 rounded-[16px] text-yellow-500 ring-1 ring-yellow-500/20 shadow-sm">
            <Trophy size={24} strokeWidth={2} />
          </div>
          {tCommon('Récords Personales', { defaultValue: 'Récords Personales' })}
        </h3>
        
        {exerciseNames.length > 0 && (
          <div className="w-full sm:w-64">
            <CustomSelect
              value={selectedExercise}
              onChange={handleFilterChange}
              options={filterOptions}
              placeholder={tCommon('Filtrar por ejercicio', { defaultValue: 'Filtrar por ejercicio' })}
            />
          </div>
        )}
      </div>

      {records.length === 0 ? (
        <div className="text-center py-16 px-4 bg-black/5 dark:bg-white/5 rounded-[32px] ring-1 ring-black/5 dark:ring-white/10">
          <div className="w-20 h-20 bg-bg-primary rounded-[24px] mx-auto flex items-center justify-center mb-6 ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
            <Trophy size={36} className="text-yellow-500 opacity-80" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-extrabold text-text-primary mb-2 tracking-tight">
            {selectedExercise === 'all' 
              ? tCommon('No tienes récords registrados aún.', { defaultValue: 'No tienes récords registrados aún.' }) 
              : tCommon('No se encontraron récords para este ejercicio.', { defaultValue: 'No se encontraron récords para este ejercicio.' })
            }
          </h3>
          <p className="text-sm font-medium text-text-secondary">Sigue entrenando para superar tus límites.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {records.map((record) => (
              <div 
                key={record.id}
                className="bg-black/5 dark:bg-white/5 rounded-[24px] p-5 ring-1 ring-black/5 dark:ring-white/10 hover:shadow-lg hover:-translate-y-1 transition-all group duration-300"
              >
                <div className="flex flex-col xs:flex-row items-start xs:items-center xs:justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0 w-full xs:w-auto">
                    <div className="p-3.5 bg-yellow-500/10 rounded-[20px] flex-shrink-0 text-yellow-600 ring-1 ring-yellow-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
                      {getExerciseIcon(record.exercise_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-text-primary leading-tight text-base sm:text-lg tracking-tight transition-colors group-hover:text-accent">
                        {t(record.exercise_name, { defaultValue: record.exercise_name })}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-text-tertiary uppercase tracking-wider mt-1.5">
                        <Calendar size={12} />
                        <span className="truncate">{formatDate(record.date)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Peso (Fondo transparente) */}
                  <div className="flex justify-center xs:justify-end xs:flex-shrink-0 w-full xs:w-auto mt-2 xs:mt-0">
                    <div className="text-2xl sm:text-3xl font-black text-accent text-center xs:text-right font-mono tracking-tighter drop-shadow-sm">
                      {record.weight_kg}<span className="text-sm font-bold text-text-tertiary ml-0.5 tracking-normal">kg</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-3 rounded-full bg-black/5 dark:bg-white/5 text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary transition-colors ring-1 ring-black/5 dark:ring-white/10 active:scale-95"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              
              <span className="text-xs sm:text-sm font-bold text-text-secondary uppercase tracking-wider px-2">
                {tCommon('Página', { defaultValue: 'Página' })} <span className="text-text-primary">{currentPage}</span> / {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-3 rounded-full bg-black/5 dark:bg-white/5 text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary transition-colors ring-1 ring-black/5 dark:ring-white/10 active:scale-95"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecordsView;