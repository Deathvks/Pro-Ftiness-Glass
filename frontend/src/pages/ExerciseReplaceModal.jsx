/* frontend/src/pages/ExerciseReplaceModal.jsx */
import React, { useState, useEffect } from 'react';
import { Repeat } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import ExerciseSearchInput from '../components/ExerciseSearchInput';
import { useTranslation } from 'react-i18next';
import api from '../services/apiClient';
import ModalPortal from '../components/ModalPortal';
import CustomSelect from '../components/CustomSelect';
import useModalLock from '../hooks/useModalLock';

const ExerciseReplaceModal = ({ exerciseIndex, onClose }) => {
    const { replaceExercise } = useAppStore(state => ({
        replaceExercise: state.replaceExercise,
    }));

    const { t } = useTranslation('translation');
    const [manualExercises, setManualExercises] = useState([]);
    
    useModalLock(); // Bloquea scroll y gestos detrás del modal

    useEffect(() => {
        const fetchManuals = async () => {
            try {
                const data = await api('/exercise-list/manual-exercises');
                setManualExercises(data.map(ex => ex.name));
            } catch (err) {
                console.error(err);
            }
        };
        fetchManuals();
    }, []);

    const handleSelect = (newExercise) => {
        replaceExercise(exerciseIndex, newExercise);
        onClose();
    };

    const handleManualSelect = (name) => {
        if (!name) return;
        replaceExercise(exerciseIndex, { name, is_manual: true });
        onClose();
    };

    return (
        <ModalPortal>
            <div
                className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 animate-[fade-in_0.2s_ease-out]"
                onClick={onClose}
            >
                <div
                    className="relative w-full max-w-md p-6 sm:p-8 flex flex-col mt-auto sm:mt-0 pb-[calc(1.5rem+var(--safe-bottom))] sm:pb-8 sm:m-4 bg-bg-primary rounded-t-[32px] sm:rounded-[32px] rounded-b-none sm:rounded-b-[32px] border-none shadow-2xl animate-[slide-up_0.3s_ease-out] z-10"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-6 sm:hidden shrink-0" />

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

                    <div className="pb-4">
                        <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">
                            Biblioteca Oficial o Nuevo Manual
                        </label>
                        <div className="relative z-[60]">
                            <ExerciseSearchInput onExerciseSelect={handleSelect} />
                        </div>
                    </div>

                    {manualExercises.length > 0 && (
                        <div className="mt-4 pb-48 sm:pb-32">
                            <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">
                                O elige un Manual Existente
                            </label>
                            <CustomSelect
                                value=""
                                onChange={handleManualSelect}
                                options={[
                                    { value: "", label: "-- Seleccionar Manual --" },
                                    ...manualExercises.map(name => ({ value: name, label: name }))
                                ]}
                                className="w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[16px]"
                                triggerClassName="w-full py-3 bg-transparent px-4 flex items-center justify-between gap-1 focus:ring-2 focus:ring-accent/50 outline-none transition-all appearance-none rounded-[16px]"
                                textClassName="text-sm font-bold text-text-primary text-left truncate flex-1"
                                searchable={true}
                            />
                        </div>
                    )}
                </div>
            </div>
        </ModalPortal>
    );
};

export default ExerciseReplaceModal;