import ModalPortal from './ModalPortal';
/* frontend/src/components/CalorieInputModal.jsx */
import React, { useState } from 'react';
import { X, CheckCircle, Target } from 'lucide-react';
import Spinner from './Spinner';
import useModalLock from '../hooks/useModalLock';

const CalorieInputModal = ({ estimatedCalories, onComplete, onCancel, isSaving }) => {

  // --- Bloquear scroll del fondo y swipe entre páginas ---
  useModalLock();

  const [selection, setSelection] = useState(null);
  const [customCalories, setCustomCalories] = useState('');
  const [error, setError] = useState(''); // Estado para el mensaje de error

  const handleCustomChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomCalories(value);
    if (error) {
      setError(''); // Limpia el error al empezar a escribir de nuevo
    }
  };

  const handleSubmit = () => {
    if (selection === 'custom') {
      const calValue = parseInt(customCalories, 10);
      if (!isNaN(calValue) && calValue > 0) {
        onComplete(calValue);
      } else {
        // En lugar de una alerta, establecemos el mensaje de error
        setError('Por favor, introduce un valor de calorías válido.');
      }
    } else if (selection === 'estimated') {
      onComplete(estimatedCalories);
    }
  };

  const baseButtonClasses = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4";
  const inactiveButtonClasses = "border-glass-border hover:border-accent/50 text-text-secondary bg-bg-secondary";
  const activeButtonClasses = "border-accent bg-accent/10 text-text-primary shadow-sm";

  return <ModalPortal>
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
      onClick={onCancel}>
      
      <div
        className="relative w-full max-w-md p-8 mt-auto sm:mt-0 pb-[calc(2rem+var(--safe-bottom))] sm:pb-8 sm:m-4 flex flex-col gap-6 bg-bg-primary rounded-t-[32px] rounded-b-none sm:rounded-2xl border border-glass-border shadow-2xl animate-[slide-up_0.3s_ease-out] sm:animate-[scale-in_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}>

        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto -mb-4 sm:hidden shrink-0" />

        <button onClick={onCancel} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition">
          <X size={20} />
        </button>

        <div>
          <h3 className="text-xl font-bold text-center text-text-primary">Registrar Calorías</h3>
          <p className="text-text-secondary text-center text-sm mt-1">¿Has medido las calorías quemadas con un dispositivo?</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setSelection('custom')}
            className={`${baseButtonClasses} ${selection === 'custom' ? activeButtonClasses : inactiveButtonClasses}`}>
            
            <CheckCircle className={`mt-1 flex-shrink-0 ${selection === 'custom' ? 'text-accent' : 'text-text-muted'}`} size={20} />
            <div>
              <p className="font-bold">Sí, introducir manualmente</p>
              <p className="text-sm opacity-80">Usa el valor exacto de tu reloj o monitor.</p>
            </div>
          </button>
          {selection === 'custom' &&
          <div className="pl-10 animate-[fade-in-up_0.3s_ease-out]">
              <input
              type="text"
              inputMode="numeric"
              placeholder="Ej: 350"
              value={customCalories}
              onChange={handleCustomChange}
              className={`w-full bg-bg-secondary border rounded-xl px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition placeholder-text-tertiary ${error ? 'border-red' : 'border-glass-border'}`}
              autoFocus />
            
              {/* Se muestra el mensaje de error aquí */}
              {error && <p className="text-red text-sm mt-1">{error}</p>}
            </div>
          }

          <button
            onClick={() => setSelection('estimated')}
            className={`${baseButtonClasses} ${selection === 'estimated' ? activeButtonClasses : inactiveButtonClasses}`}>
            
            <Target className={`mt-1 flex-shrink-0 ${selection === 'estimated' ? 'text-accent' : 'text-text-muted'}`} size={20} />
            <div>
              <p className="font-bold">No, usar estimación de la app</p>
              <p className="text-sm opacity-80">Se guardará un valor aproximado de <strong>{estimatedCalories} kcal</strong>.</p>
            </div>
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selection || isSaving}
          className="flex items-center justify-center gap-2 w-full mt-2 py-3 rounded-xl bg-accent text-bg-secondary font-bold transition hover:scale-[1.02] shadow-lg shadow-accent/20 disabled:opacity-70 disabled:hover:scale-100">
          
          {isSaving ? <Spinner size={20} color="currentColor" /> : 'Guardar Entrenamiento'}
        </button>
      </div>
    </div></ModalPortal>;

};

export default CalorieInputModal;