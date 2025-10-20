import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const CustomSelect = ({ value, onChange, options, placeholder, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);
  
  // --- INICIO DE LA CORRECCIÓN ---
  // Añadimos una referencia para el propio menú desplegable.
  const dropdownRef = useRef(null);
  // --- FIN DE LA CORRECCIÓN ---

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // --- INICIO DE LA CORRECCIÓN ---
      // Ahora solo cerramos el menú si el clic es fuera TANTO del botón COMO del menú desplegable.
      if (
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
      // --- FIN DE LA CORRECCIÓN ---
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]); // Se añade isOpen para que el listener se actualice correctamente.

  const selectedOption = options.find(opt => opt.value === value);

  const DropdownPortal = () => createPortal(
    <div
      // --- INICIO DE LA CORRECCIÓN ---
      ref={dropdownRef} // Asignamos la referencia al contenedor del menú.
      // --- FIN DE LA CORRECCIÓN ---
      style={{
        position: 'absolute',
        top: `${position.top + 8}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
      }}
      className="bg-bg-secondary border border-glass-border rounded-xl shadow-lg max-h-48 overflow-y-auto z-[9999] p-2 animate-[fade-in-up_0.2s_ease-out]"
    >
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            onChange(option.value);
            setIsOpen(false);
          }}
          className={`block w-full text-left px-3 py-2 transition-colors duration-200 rounded-md text-sm ${
            value === option.value 
              ? 'bg-accent/10 text-accent font-medium' 
              : 'text-text-primary hover:bg-accent/10 hover:text-accent'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>,
    document.body
  );

  return (
    <div className={`relative ${className}`} ref={buttonRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary text-left outline-none transition flex items-center justify-between gap-2 hover:border-accent/60"
      >
        <span className={selectedOption ? 'text-text-primary' : 'text-text-secondary'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 text-text-secondary ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      {isOpen && <DropdownPortal />}
    </div>
  );
};

export default CustomSelect;