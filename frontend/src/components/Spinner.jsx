import React from 'react';

const Spinner = ({ size = 20 }) => (
    <div
        style={{
            width: `${size}px`,
            height: `${size}px`,
            borderTopColor: 'currentColor',
            borderRightColor: 'currentColor',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
        }}
        className="border-2 rounded-full animate-spin"
        role="status"
        aria-label="cargando"
    ></div>
);

export default Spinner;