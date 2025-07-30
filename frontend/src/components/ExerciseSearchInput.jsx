import React, { useState, useEffect, useRef, useCallback } from 'react';

const ExerciseSearchInput = ({ value, onChange, onSelect }) => {
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef(null);

    // --- INICIO DE LA CORRECCIÓN ---
    // Referencia para saber si el usuario ha interactuado con el input
    const hasInteracted = useRef(false);
    // --- FIN DE LA CORRECCIÓN ---

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchExercises = useCallback(async (searchQuery) => {
        if (searchQuery.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }
        try {
            const response = await fetch(`http://localhost:3001/api/exercises?search=${searchQuery}`, { credentials: 'include' });
            if (!response.ok) throw new Error('Error fetching exercises');
            const data = await response.json();
            
            if (data.length > 0) {
                setResults(data);
                setIsOpen(true);
            } else {
                setResults([]);
                setIsOpen(false);
            }
        } catch (error) {
            console.error(error);
            setResults([]);
            setIsOpen(false);
        }
    }, []);

    useEffect(() => {
        // Solo ejecuta la búsqueda si el usuario ha interactuado
        if (!hasInteracted.current) {
            return;
        }

        const handler = setTimeout(() => {
            fetchExercises(value);
        }, 300);

        return () => clearTimeout(handler);
    }, [value, fetchExercises]);

    const handleSelect = (exercise) => {
        hasInteracted.current = false; // Resetea la interacción al seleccionar
        onSelect(exercise);
        setIsOpen(false);
    };

    const handleInputChange = (e) => {
        // Marca que el usuario ha interactuado
        hasInteracted.current = true;
        onChange(e);
    };
    
    const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";

    return (
        <div className="relative w-full" ref={searchRef}>
            <input
                type="text"
                value={value}
                onChange={handleInputChange} // Usamos el nuevo manejador
                onFocus={() => { if(value) hasInteracted.current = true; }} // Activa la búsqueda si se enfoca un campo con texto
                placeholder="Buscar o escribir ejercicio..."
                className={baseInputClasses}
            />
            {isOpen && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-bg-secondary border border-glass-border rounded-md shadow-lg max-h-60 overflow-y-auto z-10">
                    {results.map(ex => (
                        <button
                            key={ex.id}
                            type="button"
                            onClick={() => handleSelect(ex)}
                            className="block w-full text-left px-4 py-2 hover:bg-accent-transparent transition-colors"
                        >
                            {ex.name} <span className="text-xs text-text-muted">({ex.muscle_group})</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExerciseSearchInput;