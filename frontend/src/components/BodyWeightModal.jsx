import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import GlassCard from './GlassCard';

// --- INICIO DE LA CORRECCIÓN ---
// Se cambia el nombre del prop de 'onLogWeight' a 'onSave' para que coincida
// con lo que se le pasa desde el Dashboard.
const BodyWeightModal = ({ onSave, onClose, existingLog }) => {
// --- FIN DE LA CORRECCIÓN ---
  const [weight, setWeight] = useState('');

  useEffect(() => {
    if (existingLog) {
      setWeight(existingLog.weight_kg);
    }
  }, [existingLog]);

  const handleSaveClick = () => {
    const newWeight = parseFloat(weight);
    if (!isNaN(newWeight) && newWeight > 0) {
      // --- CORRECCIÓN ---
      // Ahora se llama a 'onSave', que es la función correcta.
      onSave({ weight: newWeight });
      onClose();
    } else {
      alert('Por favor, introduce un peso válido.');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSaveClick();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
      onClick={onClose}
    >
      <GlassCard
        className="relative w-full max-w-md p-8 m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition">
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-center mb-4">
          {existingLog ? 'Editar Peso de Hoy' : 'Registrar Peso Corporal'}
        </h3>

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="weight-input" className="block text-sm font-medium text-text-secondary mb-2 text-center">
              Peso (kg)
            </label>
            <input
              id="weight-input"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full text-center bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition"
              placeholder="Ej: 80.5"
              required
              autoFocus
            />
          </div>
          <button 
            type="button" 
            onClick={handleSaveClick} 
            className="w-full mt-2 py-3 rounded-md bg-accent text-bg-secondary font-semibold transition hover:scale-105"
          >
            Guardar Registro
          </button>
        </form>
      </GlassCard>
    </div>
  );
};

export default BodyWeightModal;