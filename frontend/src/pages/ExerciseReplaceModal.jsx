/* frontend/src/pages/ExerciseReplaceModal.jsx */
import React from 'react';
import { X } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import ExerciseSearchInput from '../components/ExerciseSearchInput';
import { useTranslation } from 'react-i18next';

const ExerciseReplaceModal = ({ exerciseIndex, onClose }) => {
    const { replaceExercise } = useAppStore(state => ({
        replaceExercise: state.replaceExercise,
    }));

    const { t } = useTranslation('translation');

    const handleSelect = (newExercise) => {
        replaceExercise(exerciseIndex, newExercise);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md p-8 m-4 flex flex-col bg-bg-primary rounded-2xl border border-glass-border shadow-2xl animate-[scale-in_0.3s_ease-out]"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition">
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-center mb-6 text-text-primary">
                    {t('Sustituir Ejercicio', { defaultValue: 'Sustituir Ejercicio' })}
                </h3>

                {/* Contenedor con padding inferior grande para dar espacio 
                   al dropdown de búsqueda sin que se corte 
                */}
                <div className="pb-64">
                    <ExerciseSearchInput onExerciseSelect={handleSelect} />
                </div>
            </div>
        </div>
    );
};

export default ExerciseReplaceModal;