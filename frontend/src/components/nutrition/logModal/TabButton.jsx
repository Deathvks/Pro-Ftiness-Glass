import React from 'react';

// --- INICIO DE LA MODIFICACIÓN ---
// Añadimos la prop 'disabled' y ajustamos las clases CSS condicionalmente
const TabButton = ({ active, onClick, children, disabled = false }) => (
    <button
        onClick={onClick}
        type="button"
        disabled={disabled} // Aplicamos el estado disabled
        className={`px-4 py-3 text-sm font-semibold transition-colors duration-200 flex-1 rounded-full flex items-center justify-center gap-2
            ${active
                ? 'bg-accent text-bg-primary'
                : disabled
                    ? 'text-text-muted bg-bg-secondary opacity-50 cursor-not-allowed' // Estilos para deshabilitado
                    : 'text-text-muted hover:bg-white/5'
            }
        `}
    >
        {children}
    </button>
);
// --- FIN DE LA MODIFICACIÓN ---

export default TabButton;