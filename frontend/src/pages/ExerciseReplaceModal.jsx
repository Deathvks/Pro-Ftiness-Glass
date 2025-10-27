/* frontend/src/pages/ExerciseReplaceModal.jsx */
import React from 'react';
import { X } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import useAppStore from '../store/useAppStore';
// --- INICIO DE LA MODIFICACIÓN ---
// Importamos el nuevo componente de búsqueda visual
import ExerciseSearchInput from '../components/ExerciseSearchInput';
import { useTranslation } from 'react-i18next'; // <-- Añadido
// Ya no necesitamos Spinner, PlusCircle, o searchExercises
// --- FIN DE LA MODIFICACIÓN ---

const ExerciseReplaceModal = ({ exerciseIndex, onClose }) => {
    const { replaceExercise } = useAppStore(state => ({
        replaceExercise: state.replaceExercise,
    }));
    
    // --- Añadido ---
    const { t } = useTranslation('translation'); 
    // --- Fin Añadido ---

    const handleSelect = (newExercise) => {
        replaceExercise(exerciseIndex, newExercise);
        onClose();
    };

    // Ya no necesitamos:
    // - useState para searchTerm, results, isLoading
    // - la función handleSaveCustom
    // - el useEffect para buscar

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
            onClick={onClose}
        >
            <GlassCard 
                className="relative w-full max-w-md p-8 m-4 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition">
                    <X size={20} />
                </button>
                {/* --- Modificado --- */}
                <h3 className="text-xl font-bold text-center mb-6">
                    {t('Sustituir Ejercicio', { defaultValue: 'Sustituir Ejercicio' })}
                </h3>
                {/* --- Fin Modificado --- */}
                
                {/* --- INICIO DE LA MODIFICACIÓN --- */}
                
                {/* Contenedor que da espacio al dropdown.
                  El dropdown de ExerciseSearchInput es 'absolute' y 'max-h-64'.
                  Añadimos 'pb-64' (256px) al contenedor para asegurar
                  que el dropdown tiene espacio para mostrarse sin ser cortado.
                */}
                <div className="pb-64">
                    <ExerciseSearchInput onExerciseSelect={handleSelect} />
                </div>

                {/* Eliminamos el input antiguo, la lista de resultados y el botón de "guardar custom" */}
                
                {/* --- FIN DE LA MODIFICACIÓN --- */}
            </GlassCard>
        </div>
    );
};

export default ExerciseReplaceModal;