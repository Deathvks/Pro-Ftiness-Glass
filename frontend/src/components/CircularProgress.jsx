import React from 'react';

// Se añade 'displayText' como un nuevo prop opcional
const CircularProgress = ({ value, maxValue, label, icon, colorClass = 'text-accent', displayText }) => {
    const Icon = icon;
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    const circumference = 2 * Math.PI * 45; // Radio de 45
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className="relative w-24 h-24">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                        className="stroke-[var(--glass-border)]"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                    />
                    <circle
                        className={`${colorClass} transition-all duration-500`}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-text-primary">
                    {Icon && <Icon size={24} />}
                </div>
            </div>
            <div className="-mt-2">
                {/* --- INICIO DE LA CORRECCIÓN --- */}
                <p className="font-bold text-lg">
                    {/* Si se proporciona displayText (para la creatina), lo muestra. */}
                    {/* Si no, muestra el valor numérico como antes. */}
                    {displayText ? displayText : (
                        <>
                            {value.toLocaleString('es-ES')}
                            <span className="text-sm text-text-muted">/{maxValue.toLocaleString('es-ES')}</span>
                        </>
                    )}
                </p>
                {/* --- FIN DE LA CORRECCIÓN --- */}
                <p className="text-xs text-text-secondary">{label}</p>
            </div>
        </div>
    );
};

export default CircularProgress;