/* frontend/src/components/RoutineEditor/RoutineHeader.jsx */
import React from 'react';
import { ChevronLeft, Info } from 'lucide-react';

const RoutineHeader = ({
  id,
  onCancel,
  validationError,
  routineName,
  setRoutineName,
  description,
  setDescription,
}) => {
  return (
    <>
      <button 
        onClick={onCancel} 
        className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4"
      >
        <ChevronLeft size={20} />
        Volver a Rutinas
      </button>
      
      <h1 className="text-3xl font-bold mb-6 text-center">
        {id ? 'Editar Rutina' : 'Crear Nueva Rutina'}
      </h1>

      {validationError && (
        <div className="bg-red/20 border border-red text-red px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <Info size={18} />
          <span>{validationError}</span>
        </div>
      )}

      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Nombre de la rutina"
          value={routineName}
          onChange={(e) => setRoutineName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent text-lg"
        />
        <textarea
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-glass-border focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
    </>
  );
};

export default RoutineHeader;