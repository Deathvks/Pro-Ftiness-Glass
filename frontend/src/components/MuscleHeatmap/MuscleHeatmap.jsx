/* frontend/src/components/MuscleHeatmap/MuscleHeatmap.jsx */
import React, { useState, useMemo, useRef } from 'react';
import Model from 'react-body-highlighter';
import { MUSCLE_NAMES_ES, DB_TO_HEATMAP_MAP } from '../../utils/muscleUtils';
import './MuscleHeatmap.css';

// Función auxiliar para normalizar texto (quitar tildes y minúsculas)
const normalizeKey = (text) => {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
};

const MuscleHeatmap = ({ muscleData = {}, darkMode = true }) => {
    const [modelType, setModelType] = useState('anterior');
    const [selectedMuscleLabel, setSelectedMuscleLabel] = useState(null);

    const isMuscleClick = useRef(false);
    const colors = ['#00f2ff', '#00ff88', '#ffea00', '#ff0055'];

    // Convertimos los datos de entrada al formato de la librería
    const formattedData = useMemo(() => {
        if (!muscleData || Object.keys(muscleData).length === 0) return [];

        // --- PASO 1: PRE-PROCESAMIENTO ---
        const cleanCounts = {};

        Object.entries(muscleData).forEach(([rawName, value]) => {
            if (!rawName) return;
            // Separamos por comas y normalizamos
            const parts = rawName.split(',');
            parts.forEach(part => {
                const key = normalizeKey(part);
                if (key) {
                    cleanCounts[key] = (cleanCounts[key] || 0) + value;
                }
            });
        });

        const cleanKeys = Object.keys(cleanCounts);

        // --- PASO 2: DETECCIÓN DE MÚSCULOS ESPECÍFICOS ---
        const armSpecifics = ['biceps', 'triceps', 'forearm', 'antebrazo', 'brachial', 'braquial'];
        const hasSpecificArm = cleanKeys.some(key =>
            armSpecifics.some(spec => key.includes(spec))
        );

        // --- PASO 3: CONSTRUCCIÓN INICIAL ---
        let result = cleanKeys.reduce((acc, key) => {
            const value = cleanCounts[key];

            // Filtro de "Brazos" genérico si hay específicos
            if (hasSpecificArm && (key === 'arms' || key === 'brazos' || key === 'brazo')) {
                return acc;
            }

            let frequency = Math.ceil((value / 10) * colors.length);
            if (frequency < 1) frequency = 1;
            if (frequency > colors.length) frequency = colors.length;

            // Mapeo de DB a Heatmap (o fallback a la clave misma)
            let targetMuscles = DB_TO_HEATMAP_MAP[key] ||
                DB_TO_HEATMAP_MAP[key.replace('biceps', 'bíceps')] ||
                [key];

            // Nombre visual
            const displayName = MUSCLE_NAMES_ES[key] ||
                (key.charAt(0).toUpperCase() + key.slice(1));

            acc.push({
                name: displayName,
                muscles: targetMuscles,
                frequency: frequency
            });

            return acc;
        }, []);

        // --- PASO 4: LIMPIEZA QUIRÚRGICA DE TRÍCEPS ---
        // Si hay bíceps o antebrazos explícitos, pero NO tríceps explícito,
        // eliminamos cualquier iluminación "accidental" de tríceps (ej: heredada de 'brazos' si se coló).
        const hasExplicitTriceps = cleanKeys.some(k => k.includes('triceps') || k.includes('tríceps'));
        const hasExplicitBicepsOrForearm = cleanKeys.some(k =>
            k.includes('biceps') || k.includes('antebrazo') || k.includes('forearm')
        );

        if (!hasExplicitTriceps && hasExplicitBicepsOrForearm) {
            result = result.map(item => {
                if (item.muscles.includes('triceps')) {
                    const newMuscles = item.muscles.filter(m => m !== 'triceps');
                    return { ...item, muscles: newMuscles };
                }
                return item;
            });
        }

        return result;
    }, [muscleData]);

    const handleMuscleClick = ({ muscle, data }) => {
        isMuscleClick.current = true;
        setTimeout(() => { isMuscleClick.current = false; }, 100);

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
            className={`relative group cursor-pointer transition-all duration-300 select-none bg-black/5 dark:bg-white/5 rounded-[32px] ring-1 ring-black/5 dark:ring-white/10 overflow-hidden shadow-inner ${!darkMode ? 'light-mode' : ''}`}
            onClick={handleContainerClick}
            title="Haz click en un músculo para ver su nombre, o en el fondo para girar"
        >
            {/* Badge Frente / Espalda */}
            <div className="absolute top-4 right-4 z-10 pointer-events-none">
                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors bg-black/5 dark:bg-white/5 text-text-secondary ring-1 ring-black/5 dark:ring-white/10 group-hover:bg-black/10 dark:group-hover:bg-white/10 group-hover:text-text-primary shadow-sm backdrop-blur-md">
                    {modelType === 'anterior' ? 'Frente' : 'Espalda'}
                </span>
            </div>

            {/* Tooltip con nombre de músculo */}
            {selectedMuscleLabel && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-[scale-in_0.1s_ease-out]">
                    <div className="bg-bg-primary text-text-primary text-sm font-black px-5 py-2.5 rounded-full ring-1 ring-black/5 dark:ring-white/10 shadow-xl whitespace-nowrap drop-shadow-md">
                        {selectedMuscleLabel}
                    </div>
                </div>
            )}

            <div className="w-full flex justify-center items-center py-12 px-6">
                <div style={{ width: '100%', maxWidth: '240px', height: '400px' }} className="transition-transform duration-500 group-hover:scale-105">
                    <Model
                        data={formattedData}
                        type={modelType}
                        style={{ width: '100%', height: '100%' }}
                        contentStyle={{ padding: '1rem' }}
                        bodyColor={darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"}
                        highlightedColors={colors}
                        onClick={handleMuscleClick}
                    />
                </div>
            </div>

            <div className="absolute bottom-4 w-full text-center text-[10px] font-bold uppercase tracking-widest text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                Click en fondo para girar
            </div>
        </div>
    );
};

export default MuscleHeatmap;