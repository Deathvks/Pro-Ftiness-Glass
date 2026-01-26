/* frontend/src/components/CircularProgress.jsx */
import React from 'react';

const CircularProgress = ({ value, maxValue, label, icon, color, displayText, pulse }) => {
    const Icon = icon;
    // Aseguramos que el porcentaje no pase de 100 ni sea NaN
    const validValue = isNaN(value) ? 0 : value;
    const validMax = isNaN(maxValue) || maxValue === 0 ? 1 : maxValue;
    const percentage = Math.min((validValue / validMax) * 100, 100);
    
    const circumference = 2 * Math.PI * 45; // Radio de 45
    const offset = circumference - (percentage / 100) * circumference;

    // Color por defecto (accent) si no se pasa nada
    const finalColor = color || 'var(--accent)';

    return (
        <div 
            className="flex flex-col items-center justify-center gap-2 text-center"
            style={{ color: finalColor }} // Forzamos el color en el contenedor padre
        >
            {/* CAMBIO: Aplicamos animate-pulse al contenedor común para sincronización perfecta */}
            <div className={`relative w-24 h-24 ${pulse ? 'animate-pulse' : ''}`}>
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Fondo del círculo */}
                    {/* CORRECCIÓN OLED: 
                        - Light: gray-200
                        - Dark: gray-800
                        - OLED: text-white/10 (Blanco al 10% para un borde sutil visible sobre fondo negro)
                    */}
                    <circle
                        className="text-gray-200 dark:text-gray-800 [.oled-theme_&]:text-white/10 transition-colors duration-300"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                    />
                    {/* Progreso: Usamos el prop 'stroke' directo para máxima prioridad */}
                    <circle
                        className="transition-all duration-500 ease-out"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke={finalColor} 
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                    />
                </svg>
                
                <div className="absolute inset-0 flex items-center justify-center">
                    {Icon && <Icon size={24} color={finalColor} />}
                </div>
            </div>
            
            <div className="-mt-2">
                <p className="font-bold text-lg" style={{ color: finalColor }}>
                    {displayText ? displayText : (
                        <>
                            {value.toLocaleString('es-ES')}
                            <span className="text-sm opacity-60 ml-0.5" style={{ color: 'var(--text-muted)' }}>
                                /{maxValue.toLocaleString('es-ES')}
                            </span>
                        </>
                    )}
                </p>
                <p className="text-xs text-text-secondary">{label}</p>
            </div>
        </div>
    );
};

export default CircularProgress;