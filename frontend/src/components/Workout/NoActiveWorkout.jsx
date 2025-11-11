/* frontend/src/components/Workout/NoActiveWorkout.jsx */
import React from 'react';

/**
 * Componente que se muestra cuando no hay ningún entrenamiento activo.
 */
const NoActiveWorkout = ({ setView }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-[fade-in_0.5s_ease-out]">
      <h2 className="text-2xl font-bold">No hay ningún entrenamiento activo.</h2>
      <p className="text-text-secondary mt-2">
        Puedes iniciar uno desde el Dashboard o la sección de Rutinas.
      </p>
      <button
        onClick={() => setView('routines')}
        className="mt-6 px-6 py-3 rounded-full bg-accent text-bg-secondary font-semibold transition-transform active:scale-95"
      >
        Ir a Rutinas
      </button>
    </div>
  );
};

export default NoActiveWorkout;