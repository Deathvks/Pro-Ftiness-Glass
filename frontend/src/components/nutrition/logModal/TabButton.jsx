import React from 'react';

const TabButton = ({ active, onClick, children, disabled = false }) => (
    <button
        onClick={onClick}
        type="button"
        disabled={disabled}
        className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-[13px] font-extrabold tracking-wide rounded-[12px] sm:rounded-[16px] transition-all duration-300 outline-none
            ${active
                ? 'bg-accent text-white shadow-md shadow-accent/30 ring-1 ring-accent'
                : disabled
                    ? 'bg-black/5 dark:bg-white/5 text-text-muted ring-1 ring-black/5 dark:ring-white/10 opacity-40 cursor-not-allowed'
                    : 'bg-black/5 dark:bg-white/5 text-text-secondary ring-1 ring-black/5 dark:ring-white/10 hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary active:scale-95 shadow-sm'
            }
        `}
    >
        {children}
    </button>
);

export default TabButton;