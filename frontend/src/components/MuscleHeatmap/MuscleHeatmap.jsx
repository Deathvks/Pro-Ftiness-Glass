/* frontend/src/components/MuscleHeatmap/MuscleHeatmap.jsx */
import React, { useState, useMemo, useRef } from 'react';
import Model from 'react-body-highlighter';
import './MuscleHeatmap.css';

// Diccionario de traducción de IDs técnicos a Nombres Visuales
// AJUSTADO: Coincide con tu exercise_muscles.json
const MUSCLE_NAMES = {
    'chest': 'Pecho',
    'upper-back': 'Espalda Alta',
    'lower-back': 'Lumbares',
    'front-deltoids': 'Hombros (Frontal)',
    'back-deltoids': 'Hombros (Posterior)',
    'abs': 'Abdominales',
    'obliques': 'Oblicuos',
    'biceps': 'Bíceps',
    'triceps': 'Tríceps',
    'forearm': 'Antebrazos',
    'quadriceps': 'Cuádriceps',
    'hamstring': 'Isquiotibiales', // Ajustado a tu JSON
    'gluteal': 'Glúteos',
    'calves': 'Gemelos',
    'trapezius': 'Trapecios',
    'adductor': 'Aductores',
    'abductors': 'Abductores',
    'neck': 'Cuello',
    'head': 'Cabeza'
};

const MuscleHeatmap = ({ muscleData = {}, darkMode = true }) => {
    const [modelType, setModelType] = useState('anterior'); // 'anterior' | 'posterior'
    const [selectedMuscleLabel, setSelectedMuscleLabel] = useState(null); // Para mostrar nombre al click

    // Ref para distinguir entre click en músculo y click en fondo
    const isMuscleClick = useRef(false);

    // Definimos los colores para 4 niveles de intensidad
    const colors = ['#00f2ff', '#00ff88', '#ffea00', '#ff0055'];

    // Convertimos los datos de entrada al formato de la librería
    const formattedData = useMemo(() => {
        if (!muscleData || Object.keys(muscleData).length === 0) return [];

        return Object.entries(muscleData).map(([name, value]) => {
            let frequency = Math.ceil((value / 10) * colors.length);
            if (frequency < 1) frequency = 1;
            if (frequency > colors.length) frequency = colors.length;

            return {
                name: MUSCLE_NAMES[name] || name,
                muscles: [name],
                frequency: frequency
            };
        });
    }, [muscleData]);

    // Manejador de clicks en músculos
    const handleMuscleClick = ({ muscle, data }) => {
        isMuscleClick.current = true;

        // Reseteamos el flag para permitir futuros clicks de fondo
        setTimeout(() => { isMuscleClick.current = false; }, 100);

        // Usamos el nombre del mapa o el fallback
        const label = data?.name || MUSCLE_NAMES[muscle] || muscle;
        setSelectedMuscleLabel(label);

        // Ocultar etiqueta a los 2 segundos
        setTimeout(() => setSelectedMuscleLabel(null), 2000);
    };

    // Manejador del contenedor (Girar)
    const handleContainerClick = () => {
        // Solo giramos si NO se hizo click en un músculo
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
            {/* Etiqueta flotante (Frente / Espalda) */}
            <div className="absolute top-4 right-4 z-10 pointer-events-none">
                <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full backdrop-blur-sm transition-colors border ${darkMode
                    ? 'text-cyan-400/50 border-cyan-400/20 bg-black/20 group-hover:text-cyan-400 group-hover:border-cyan-400/50'
                    : 'text-cyan-700 border-cyan-700/20 bg-white/40 group-hover:text-cyan-600 group-hover:border-cyan-600/50'
                    }`}>
                    {modelType === 'anterior' ? 'Frente' : 'Espalda'}
                </span>
            </div>

            {/* --- ETIQUETA POPUP DE MÚSCULO --- */}
            {selectedMuscleLabel && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-[scale-in_0.1s_ease-out]">
                    <div className="bg-black/80 backdrop-blur-md text-white text-sm font-bold px-4 py-2 rounded-full border border-white/10 shadow-xl whitespace-nowrap">
                        {selectedMuscleLabel}
                    </div>
                </div>
            )}

            {/* Contenedor del SVG */}
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

            {/* Texto de ayuda al pie */}
            <div className={`absolute bottom-2 w-full text-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-white/30' : 'text-black/30'}`}>
                Click en fondo para girar
            </div>
        </div>
    );
};

export default MuscleHeatmap;