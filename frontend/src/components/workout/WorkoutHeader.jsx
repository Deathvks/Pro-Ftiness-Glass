import React from 'react';
import { ChevronLeft } from 'lucide-react';
import GlassCard from '../GlassCard';

/**
 * Muestra la cabecera de la pantalla de entrenamiento, incluyendo el botón de volver
 * y el título de la rutina.
 */
const WorkoutHeader = ({ routineName, onBackClick }) => {
    return (
        <>
            <button
                onClick={onBackClick}
                className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4"
            >
                <ChevronLeft size={20} />
                Volver
            </button>

            <GlassCard className="p-6 mb-6">
                <h1 className="text-3xl font-bold text-center sm:text-left">{routineName}</h1>
            </GlassCard>
        </>
    );
};

export default WorkoutHeader;