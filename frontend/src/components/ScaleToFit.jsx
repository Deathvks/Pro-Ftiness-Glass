/* frontend/src/components/ScaleToFit.jsx */
import React, { useState, useEffect, useRef } from 'react';

const ScaleToFit = ({ children, width = 1080, height = 1920 }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (parent) {
        const availableWidth = parent.clientWidth;
        const availableHeight = parent.clientHeight;

        const scaleX = availableWidth / width;
        const scaleY = availableHeight / height;
        const newScale = Math.min(scaleX, scaleY, 1);

        setScale(newScale);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center pointer-events-auto"
      style={{
        width: `${width * scale}px`,
        height: `${height * scale}px`,
      }}
    >
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ScaleToFit;
