/* frontend/src/pages/ExerciseReplaceModal.jsx */
import React from 'react';
import { X, Repeat } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import ExerciseSearchInput from '../components/ExerciseSearchInput';
import { useTranslation } from 'react-i18next';
import GlassCard from '../components/GlassCard';

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
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 animate-[fade-in_0.2s_ease-out]"
            onClick={onClose}
        >
            <div className="absolute inset-0" onClick={onClose} />
            <GlassCard
                className="glass relative w-full max-w-md p-6 sm:p-8 flex flex-col bg-bg-primary rounded-t-[32px] sm:rounded-[32px] rounded-b-none sm:rounded-b-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-2xl animate-[slide-up_0.3s_ease-out] z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Indicador de arrastre para móviles */}
                <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-6 sm:hidden" />

                <button onClick={onClose} className="absolute top-6 right-6 p-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-text-secondary hover:text-text-primary transition-colors">
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center mb-6 px-4">
                    <div className="p-3 bg-accent/10 rounded-[20px] mb-4 ring-2 ring-accent/30">
                        <Repeat size={32} className="text-accent" strokeWidth={2} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-center text-text-primary tracking-tight">
                        {t('Sustituir Ejercicio', { defaultValue: 'Sustituir Ejercicio' })}
                    </h3>
                    <p className="text-sm font-medium text-text-secondary text-center mt-2 leading-relaxed">
                        Busca un nuevo ejercicio para reemplazar el actual en tu rutina.
                    </p>
                </div>

                <div className="pb-64 sm:pb-48">
                    <ExerciseSearchInput onExerciseSelect={handleSelect} />
                </div>
            </GlassCard>
        </div>
    );
};

export default ExerciseReplaceModal;