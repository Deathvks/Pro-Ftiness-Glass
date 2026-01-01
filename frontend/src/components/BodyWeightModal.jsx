/* frontend/src/components/BodyWeightModal.jsx */
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const BodyWeightModal = ({ onSave, onClose, existingLog }) => {
  const [weight, setWeight] = useState('');

  useEffect(() => {
    if (existingLog) {
      setWeight(existingLog.weight_kg);
    }
  }, [existingLog]);

  const handleSaveClick = () => {
    // Aseguramos que el valor se parsee correctamente, reemplazando comas por puntos.
    const newWeight = parseFloat(String(weight).replace(',', '.'));

    if (!isNaN(newWeight) && newWeight > 0) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md p-8 m-4 bg-bg-primary rounded-2xl border border-glass-border shadow-2xl animate-[scale-in_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition">
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-text-primary text-center mb-4">
          {existingLog ? 'Editar Peso de Hoy' : 'Registrar Peso Corporal'}
        </h3>

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="weight-input" className="block text-sm font-medium text-text-secondary mb-2 text-center">
              Peso (kg)
            </label>
            <input
              id="weight-input"
              type="text"
              inputMode="decimal"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value.replace(',', '.'))}
              className="w-full text-center bg-bg-secondary border border-glass-border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition placeholder-text-tertiary"
              placeholder="Ej: 80.5"
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full mt-2 py-3 rounded-xl bg-accent text-bg-secondary font-bold shadow-lg shadow-accent/20 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Guardar Registro
          </button>
        </form>
      </div>
    </div>
  );
};

export default BodyWeightModal;