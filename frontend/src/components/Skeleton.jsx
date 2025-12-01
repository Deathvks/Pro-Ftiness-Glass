/* frontend/src/components/Skeleton.jsx */
import React from 'react';

const Skeleton = ({ className = '', ...props }) => {
    return (
        <div
            className={`animate-pulse bg-white/10 rounded ${className}`}
            {...props}
        />
    );
};

export default Skeleton;