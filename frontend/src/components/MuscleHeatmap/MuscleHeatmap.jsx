/* frontend/src/components/MuscleHeatmap/MuscleHeatmap.jsx */
import React, { useState, useMemo, useRef } from 'react';
import Model from 'react-body-highlighter';
import { MUSCLE_NAMES_ES } from '../../utils/muscleUtils'; // Importamos el diccionario centralizado
import './MuscleHeatmap.css';

const MuscleHeatmap = ({ muscleData = {}, darkMode = true }) => {
    const [modelType, setModelType] = useState('anterior');
    const [selectedMuscleLabel, setSelectedMuscleLabel] = useState(null);

    const isMuscleClick = useRef(false);
    const colors = ['#00f2ff', '#00ff88', '#ffea00', '#ff0055'];

    // Convertimos los datos de entrada al formato de la librería
    const formattedData = useMemo(() => {
        if (!muscleData || Object.keys(muscleData).length === 0) return [];

        return Object.entries(muscleData).map(([name, value]) => {
            let frequency = Math.ceil((value / 10) * colors.length);
            if (frequency < 1) frequency = 1;
            if (frequency > colors.length) frequency = colors.length;

            return {
                // Usamos el diccionario importado
                name: MUSCLE_NAMES_ES[name] || name,
                muscles: [name],
                frequency: frequency
            };
        });
    }, [muscleData]);

    const handleMuscleClick = ({ muscle, data }) => {
        isMuscleClick.current = true;
        setTimeout(() => { isMuscleClick.current = false; }, 100);

        // Usamos el nombre del mapa o el fallback
        const label = data?.name || MUSCLE_NAMES_ES[muscle] || muscle;
        setSelectedMuscleLabel(label);

        setTimeout(() => setSelectedMuscleLabel(null), 2000);
    };

    const handleContainerClick = () => {
        if (!isMuscleClick.current) {
            setModelType(t => t === 'anterior' ? 'posterior' : 'anterior');
        }
    };

    return (
        <div
            className={`heatmap-container relative group cursor-pointer transition-all duration-300 hover:border-cyan-500/30 select-none ${!darkMode ? 'light-mode' : ''}`}
            onClick={handleContainerClick}
            title="Haz click en un músculo para ver su nombre, o en el fondo para girar"
        >
            {/* Etiqueta flotante */}
            <div className="absolute top-4 right-4 z-10 pointer-events-none">
                <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full backdrop-blur-sm transition-colors border ${darkMode
                    ? 'text-cyan-400/50 border-cyan-400/20 bg-black/20 group-hover:text-cyan-400 group-hover:border-cyan-400/50'
                    : 'text-cyan-700 border-cyan-700/20 bg-white/40 group-hover:text-cyan-600 group-hover:border-cyan-600/50'
                    }`}>
                    {modelType === 'anterior' ? 'Frente' : 'Espalda'}
                </span>
            </div>

            {/* Popup Nombre Músculo */}
            {selectedMuscleLabel && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-[scale-in_0.1s_ease-out]">
                    <div className="bg-black/80 backdrop-blur-md text-white text-sm font-bold px-4 py-2 rounded-full border border-white/10 shadow-xl whitespace-nowrap">
                        {selectedMuscleLabel}
                    </div>
                </div>
            )}

            {/* SVG Modelo */}
            <div className="w-full h-full flex justify-center items-center py-2">
                <div style={{ width: '100%', maxWidth: '200px', height: '350px' }}>
                    <Model
                        data={formattedData}
                        type={modelType}
                        style={{ width: '100%', height: '100%' }}
                        contentStyle={{ paddingTop: '0.5rem' }}
                        bodyColor={darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(50, 50, 50, 0.1)"}
                        highlightedColors={colors}
                        onClick={handleMuscleClick}
                    />
                </div>
            </div>

            <div className={`absolute bottom-2 w-full text-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-white/30' : 'text-black/30'}`}>
                Click en fondo para girar
            </div>
        </div>
    );
};

export default MuscleHeatmap;