import React, { useState, useEffect, useRef, useCallback } from 'react';

const ExerciseSearchInput = ({ value, onChange, onSelect }) => {
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef(null);

    // Hook para cerrar el dropdown si se hace clic fuera
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
            setResults(data);
            setIsOpen(true);
        } catch (error) {
            console.error(error);
            setResults([]);
            setIsOpen(false);
        }
    }, []);

    // Effect con debounce para no llamar a la API en cada pulsación de tecla
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchExercises(value);
        }, 300);

        return () => clearTimeout(handler);
    }, [value, fetchExercises]);

    const handleSelect = (exercise) => {
        onSelect(exercise);
        setIsOpen(false);
    };

    const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";

    return (
        <div className="relative w-full" ref={searchRef}>
            <input
                type="text"
                value={value}
                onChange={onChange}
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