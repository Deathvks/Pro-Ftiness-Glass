import React from 'react';

const GlassCard = ({ children, className = '' }) => (
  <div 
    className={`rounded-lg shadow-lg border backdrop-blur-glass 
                bg-[--glass-bg] border-[--glass-border] 
                ${className}`}
  >
    {children}
  </div>
);

export default GlassCard;