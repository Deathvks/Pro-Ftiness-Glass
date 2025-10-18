import React from 'react';
import { X, Check } from 'lucide-react';
import GlassCard from './GlassCard';

// Define los tipos de series disponibles y sus etiquetas
const setTypes = [
    { value: null, label: 'Normal' },
    { value: 'dropset', label: 'Dropset (DS)' },
    { value: 'myo-rep', label: 'Myo-Rep (MYO)' },
    { value: 'rest-pause', label: 'Rest-Pause (RP)' },
    { value: 'descending', label: 'Descendente (DSC)' },
    // Puedes añadir más tipos aquí si lo deseas
];

const SetTypeSelectorModal = ({ currentType, onSelect, onClose }) => {
    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
            onClick={onClose} // Cierra si se hace clic fuera
        >
            <GlassCard
                className="relative w-full max-w-xs p-6 m-4 flex flex-col gap-3"
                onClick={(e) => e.stopPropagation()} // Evita cerrar al hacer clic dentro
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/10 transition"
                    aria-label="Cerrar"
                >
                    <X size={18} />
                </button>

                <h3 className="text-lg font-bold text-center mb-2">Seleccionar Tipo de Serie</h3>

                {setTypes.map((typeOption) => (
                    <button
                        key={typeOption.value || 'normal'}
                        onClick={() => {
                            onSelect(typeOption.value);
                            onClose();
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors flex items-center justify-between ${
                            currentType === typeOption.value
                                ? 'border-accent bg-accent-transparent text-accent font-semibold'
                                : 'border-glass-border bg-bg-secondary hover:border-accent/50'
                        }`}
                    >
                        <span>{typeOption.label}</span>
                        {currentType === typeOption.value && <Check size={18} />}
                    </button>
                ))}
            </GlassCard>
        </div>
    );
};

export default SetTypeSelectorModal;