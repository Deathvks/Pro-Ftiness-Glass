import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// Componente de dropdown personalizado y reutilizable
const CustomSelect = ({ value, onChange, options, placeholder, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
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
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-bg-secondary border border-glass-border rounded-xl shadow-lg max-h-48 overflow-y-auto z-[9999] p-2">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 hover:bg-accent/10 transition-colors rounded-md text-sm ${
                value === option.value 
                  ? 'bg-accent/10 text-accent font-medium' 
                  : 'text-text-primary'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;