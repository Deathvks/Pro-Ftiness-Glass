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
      return <Weight className="w-5 h-5 text-yellow-800" />;
    }
    return <Award className="w-5 h-5 text-yellow-800" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64"><Spinner size={32} /></div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red">{error}</p>
        <button 
          onClick={() => { setCurrentPage(1); setSelectedExercise('all'); }}
          className="mt-4 px-4 py-2 bg-accent text-bg-secondary rounded hover:opacity-90 transition"
        >
          {tCommon('Reintentar', { defaultValue: 'Reintentar' })}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
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
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">
            {selectedExercise === 'all' 
              ? tCommon('No tienes récords personales registrados aún.', { defaultValue: 'No tienes récords personales registrados aún.' }) 
              : tCommon('No se encontraron récords para este ejercicio.', { defaultValue: 'No se encontraron récords para este ejercicio.' })
            }
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {records.map((record) => (
              <div 
                key={record.id}
                className="bg-bg-secondary rounded-lg p-4 shadow-sm border border-glass-border hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col xs:flex-row items-start xs:items-center xs:justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0 w-full xs:w-auto">
                    <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                      {getExerciseIcon(record.exercise_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-text-primary truncate text-sm sm:text-base">
                        {/* 3. Tu lógica aquí también era correcta, ahora 't' funcionará */}
                        {t(record.exercise_name, { defaultValue: record.exercise_name })}
                      </h4>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-text-secondary flex-shrink-0" />
                        <span className="truncate">{formatDate(record.date)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center xs:justify-end xs:flex-shrink-0 w-full xs:w-auto">
                    <div className="text-xl sm:text-2xl font-bold text-accent text-center xs:text-right">
                      {record.weight_kg}kg
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 sm:gap-4 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-bg-secondary text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-transparent hover:text-accent transition border border-glass-border"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <span className="text-xs sm:text-sm text-text-secondary px-2">
                {tCommon('Página', { defaultValue: 'Página' })} {currentPage} {tCommon('de', { defaultValue: 'de' })} {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-bg-secondary text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-transparent hover:text-accent transition border border-glass-border"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecordsView;