/* frontend/src/components/CustomSelect.jsx */
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const CustomSelect = ({ value, onChange, options, placeholder, className = "", multiple = false, searchable = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownMaxHeight = 256; // aprox max-h-64
      
      const openUpwards = spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow;

      setPosition({
        top: openUpwards ? undefined : rect.bottom + 8,
        bottom: openUpwards ? window.innerHeight - rect.top + 8 : undefined,
        left: rect.left,
        width: rect.width,
      });
      setSearchQuery(""); // Reset search on open
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // En iOS, el autoFocus del input despliega el teclado y hace que el navegador
    // haga scroll automáticamente para centrarlo. Ignoramos los scrolls en el primer medio segundo.
    let justOpened = true;
    const timer = setTimeout(() => { justOpened = false; }, 500);

    const handleScroll = (event) => {
      if (isOpen && !justOpened) {
        if (
          (dropdownRef.current && dropdownRef.current.contains(event.target)) ||
          (buttonRef.current && buttonRef.current.contains(event.target))
        ) {
          return;
        }
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('scroll', handleScroll, true);
    }
    
    return () => {
      document.removeEventListener('scroll', handleScroll, true);
      clearTimeout(timer);
    };
  }, [isOpen]);

  const selectedValues = multiple ? (typeof value === 'string' && value ? value.split(',').map(v => v.trim()) : []) : [];
  const selectedOption = !multiple ? options.find(opt => opt.value === value) : null;

  const handleOptionClick = (optionValue) => {
    if (multiple) {
      let newValues;
      if (selectedValues.includes(optionValue)) {
        newValues = selectedValues.filter(v => v !== optionValue);
      } else {
        newValues = [...selectedValues, optionValue];
      }
      onChange(newValues.join(', '));
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const isSelected = (optionValue) => {
    if (multiple) return selectedValues.includes(optionValue);
    return value === optionValue;
  };

  const filteredOptions = searchable 
    ? options.filter(opt => {
        const textToSearch = opt.searchText || (typeof opt.label === 'string' ? opt.label : opt.value);
        return String(textToSearch).toLowerCase().includes(searchQuery.toLowerCase());
      })
    : options;

  const DropdownPortal = () => createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: position.top !== undefined ? `${position.top}px` : undefined,
        bottom: position.bottom !== undefined ? `${position.bottom}px` : undefined,
        left: `${position.left}px`,
        width: `${position.width}px`,
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      className={`bg-bg-secondary border border-transparent dark:border dark:border-white/10 rounded-xl shadow-lg max-h-64 overflow-y-auto z-[9999] p-2 flex flex-col gap-1 ${
        position.bottom !== undefined ? 'animate-[fade-in-down_0.2s_ease_out]' : 'animate-[fade-in-up_0.2s_ease_out]'
      }`}
    >
      {searchable && (
        <div className="sticky top-0 bg-bg-secondary z-10 pb-2 mb-1 border-b border-black/5 dark:border-white/10">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/5 dark:bg-white/5 rounded-lg px-3 py-2 text-sm outline-none text-text-primary focus:ring-1 focus:ring-accent"
            autoFocus
          />
        </div>
      )}
      {filteredOptions.length === 0 ? (
        <div className="px-3 py-4 text-center text-sm text-text-secondary">Sin resultados</div>
      ) : (
        filteredOptions.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleOptionClick(option.value)}
            className={`block w-full text-left px-3 py-2 transition-colors duration-200 rounded-md text-sm shrink-0 ${
              isSelected(option.value)
                ? 'bg-accent/10 text-accent font-medium'
                : 'text-text-primary hover:bg-accent/10 hover:text-accent'
            }`}
          >
            {option.label}
          </button>
        ))
      )}
    </div>,
    document.body
  );

  return (
    <div className={`relative ${className}`} ref={buttonRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        // CORRECCIÓN VISUAL:
        // - Usamos bg-bg-secondary siempre para tener fondo en Light y Dark/OLED.
        // - Borde fino blanco en Dark/OLED.
        className={`
          w-full rounded-xl px-4 py-3 text-text-primary text-left outline-none transition flex items-center justify-between gap-2 
          border border-transparent dark:border dark:border-white/10
          bg-bg-secondary hover:bg-bg-secondary/80
        `}
        disabled={isOpen && position.top === 0}
      >
        <span className={`text-sm font-bold truncate ${(!multiple && selectedOption) || (multiple && selectedValues.length > 0) ? 'text-text-primary' : 'text-text-secondary'}`}>
          {multiple 
            ? (selectedValues.length > 0 ? selectedValues.join(', ') : placeholder) 
            : (selectedOption ? selectedOption.label : placeholder)
          }
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