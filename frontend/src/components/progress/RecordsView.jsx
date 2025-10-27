/* frontend/src/components/progress/RecordsView.jsx */
import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Calendar, Weight, Award } from 'lucide-react'; // Importamos el nuevo icono
import { getPersonalRecords, getPersonalRecordExerciseNames } from '../../services/personalRecordService';
import CustomSelect from '../CustomSelect';
import Spinner from '../Spinner';
import { useTranslation } from 'react-i18next'; // <-- Añadido

const RecordsView = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const [exerciseNames, setExerciseNames] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState('all');

    // --- Añadido ---
    const { t } = useTranslation('exercises');
    const { t: tCommon } = useTranslation('translation');
    // --- Fin Añadido ---

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
                // selectedExercise se mantiene *sin traducir* para la API
                const response = await getPersonalRecords(currentPage, selectedExercise);
                setRecords(response.records || []);
                setTotalPages(response.totalPages || 1);
                setError(null);
            } catch (err) {
                console.error('Error fetching personal records:', err);
                // --- Modificado ---
                setError(tCommon('Error al cargar los récords personales', { defaultValue: 'Error al cargar los récords personales' }));
                // --- Fin Modificado ---
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    // --- Modificado ---
    }, [currentPage, selectedExercise, tCommon]); // Añadido tCommon
    // --- Fin Modificado ---

    const handleFilterChange = (exercise) => {
        setSelectedExercise(exercise); // El valor sigue siendo 'all' o el nombre sin traducir
        setCurrentPage(1);
    };

    const filterOptions = useMemo(() => {
        // --- Modificado ---
        // Traducimos las etiquetas (label) pero mantenemos el valor (value) original
        const options = exerciseNames.map(name => ({ value: name, label: t(name, { defaultValue: name }) }));
        return [{ value: 'all', label: tCommon('Todos los ejercicios', { defaultValue: 'Todos los ejercicios' }) }, ...options];
        // --- Fin Modificado ---
    }, [exerciseNames, t, tCommon]); // Añadidos t y tCommon

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };
    
    // --- INICIO DE LA CORRECCIÓN ---
    const getExerciseIcon = (exerciseName) => {
        const name = exerciseName.toLowerCase();
        // Usamos Award como icono principal por su parecido a un trofeo.
        if (name.includes('press') || name.includes('bench') || name.includes('sentadilla') || name.includes('peso muerto')) {
            return <Weight className="w-5 h-5 text-yellow-800" />;
        }
        return <Award className="w-5 h-5 text-yellow-800" />; // Icono de trofeo mejorado
    };
    // --- FIN DE LA CORRECCIÓN ---

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
                    {/* --- Modificado --- */}
                    {tCommon('Reintentar', { defaultValue: 'Reintentar' })}
                    {/* --- Fin Modificado --- */}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    {/* --- Modificado --- */}
                    {tCommon('Récords Personales', { defaultValue: 'Récords Personales' })}
                    {/* --- Fin Modificado --- */}
                </h3>
                {exerciseNames.length > 0 && (
                    <div className="w-full sm:w-64">
                        <CustomSelect
                            value={selectedExercise} // El valor es 'all' o el nombre sin traducir
                            onChange={handleFilterChange}
                            options={filterOptions} // Las etiquetas están traducidas
                            // --- Modificado ---
                            placeholder={tCommon('Filtrar por ejercicio', { defaultValue: 'Filtrar por ejercicio' })}
                            // --- Fin Modificado ---
                        />
                    </div>
                )}
            </div>

            {records.length === 0 ? (
                <div className="text-center py-12">
                    <Trophy className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-secondary">
                        {/* --- Modificado --- */}
                        {selectedExercise === 'all' 
                            ? tCommon('No tienes récords personales registrados aún.', { defaultValue: 'No tienes récords personales registrados aún.' }) 
                            : tCommon('No se encontraron récords para este ejercicio.', { defaultValue: 'No se encontraron récords para este ejercicio.' })
                        }
                        {/* --- Fin Modificado --- */}
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
                                                {/* --- Modificado --- */}
                                                {t(record.exercise_name, { defaultValue: record.exercise_name })}
                                                {/* --- Fin Modificado --- */}
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
                                {/* --- Modificado --- */}
                                {tCommon('Página', { defaultValue: 'Página' })} {currentPage} {tCommon('de', { defaultValue: 'de' })} {totalPages}
                                {/* --- Fin Modificado --- */}
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