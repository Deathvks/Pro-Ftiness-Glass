import React from 'react';

const TabButton = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        type="button" // Añadido para evitar envío de formulario
        className={`px-4 py-3 text-sm font-semibold transition-colors duration-200 flex-1 rounded-full flex items-center justify-center gap-2
            ${active ? 'bg-accent text-bg-primary' : 'text-text-muted hover:bg-white/5'}`}
    >
        {children}
    </button>
);

export default TabButton;