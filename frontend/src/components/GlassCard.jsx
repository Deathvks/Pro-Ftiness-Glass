import React from 'react';

const GlassCard = ({ children, className = '', ...props }) => (
  <div
    {...props}
    className={`rounded-lg shadow-lg border backdrop-blur-glass 
                bg-[--glass-bg] border-[--glass-border] 
                ${className}`}
  >
    {children}
  </div>
);

export default GlassCard;