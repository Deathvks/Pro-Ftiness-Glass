import ModalPortal from './ModalPortal';
/* frontend/src/components/BodyMeasurementModal.jsx */
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import CustomSelect from './CustomSelect';
import useModalLock from '../hooks/useModalLock';

const MEASUREMENT_TYPES = [
{ value: 'cintura', label: 'Cintura' },
{ value: 'pecho', label: 'Pecho' },
{ value: 'biceps', label: 'Bíceps' },
{ value: 'muslos', label: 'Muslos' },
{ value: 'caderas', label: 'Caderas' },
{ value: 'hombros', label: 'Hombros' },
{ value: 'gemelos', label: 'Gemelos' },
{ value: 'cuello', label: 'Cuello' },
{ value: 'antebrazos', label: 'Antebrazos' }];


const BodyMeasurementModal = ({ onSave, onClose, existingLog }) => {

  // --- Bloquear scroll del fondo y swipe entre páginas ---
  useModalLock();

  const [measureType, setMeasureType] = useState('cintura');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingLog) {
      setMeasureType(existingLog.measure_type);
      setValue(existingLog.value);
    }
  }, [existingLog]);

  const handleSaveClick = () => {
    const newValue = parseFloat(String(value).replace(',', '.'));

    if (!isNaN(newValue) && newValue > 0) {
      onSave({ measure_type: measureType, value: newValue });
      onClose();
    } else {
      setError('Por favor, introduce un valor válido.');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSaveClick();
  };

  return <ModalPortal>
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
      onClick={onClose}>
      
      <div
        className="relative w-full max-w-md p-8 mt-auto sm:mt-0 pb-[calc(2rem+var(--safe-bottom))] sm:pb-8 sm:m-4 bg-bg-primary rounded-t-[32px] rounded-b-none sm:rounded-2xl border border-glass-border shadow-2xl animate-[slide-up_0.3s_ease-out] sm:animate-[scale-in_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}>

        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition">
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-text-primary text-center mb-4">
          {existingLog ? 'Editar Medida' : 'Registrar Medida'}
                </h3>

                <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2 text-center">
                            Zona del Cuerpo
                        </label>
                        <CustomSelect
              value={measureType}
              onChange={setMeasureType}
              options={MEASUREMENT_TYPES}
              placeholder="Selecciona zona"
              className={existingLog ? 'pointer-events-none opacity-60' : ''} />
            
                    </div>

                    <div>
                        <label htmlFor="value-input" className="block text-sm font-medium text-text-secondary mb-2 text-center">
                            Medida (cm)
                        </label>
                        <input
              id="value-input"
              type="text"
              inputMode="decimal"
              step="0.1"
              value={value}
              onChange={(e) => {
                setValue(e.target.value.replace(',', '.'));
                if (error) setError('');
              }}
              // MODIFICADO: Eliminadas las clases focus:ring-accent/50 y focus:ring-2
              className={`w-full text-center bg-bg-secondary border ${error ? 'border-red-500' : 'border-glass-border'} rounded-xl px-4 py-3 text-text-primary focus:border-accent outline-none transition placeholder-text-tertiary`}
              placeholder="Ej: 80.5"
              required
              autoFocus />
            
                        {error &&
            <p className="text-red-500 text-sm text-center mt-2 animate-pulse font-medium">
                                {error}
                            </p>
            }
                    </div>

                    <button
            type="submit"
            className="w-full mt-2 py-3 rounded-xl bg-accent text-bg-secondary font-bold shadow-lg shadow-accent/20 transition hover:scale-[1.02] active:scale-[0.98]">
            
                        Guardar
                    </button>
                </form>
            </div>
        </div></ModalPortal>;

};

export default BodyMeasurementModal;