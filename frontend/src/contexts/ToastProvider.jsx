/* frontend/src/contexts/ToastProvider.jsx */
import React, { useState } from 'react';
import { ToastContext } from './ToastContext';
import Toast from '../components/Toast';
// --- INICIO DE LA MODIFICACIÓN ---
// Importamos uuid para generar IDs únicos
import { v4 as uuidv4 } from 'uuid';
// --- FIN DE LA MODIFICACIÓN ---

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    // --- INICIO DE LA MODIFICACIÓN ---
    // Usamos uuidv4() en lugar de Date.now() para evitar colisiones de keys
    const id = uuidv4();
    // --- FIN DE LA MODIFICACIÓN ---
    setToasts(currentToasts => [...currentToasts, { id, message, type }]);
  };

  const removeToast = (id) => {
    // Añadimos un estado de salida para la animación
    setToasts(currentToasts =>
      currentToasts.map(t => t.id === id ? { ...t, closing: true } : t)
    );
    // Esperamos a que termine la animación para eliminarlo del DOM
    setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    }, 500);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* --- INICIO DE LA CORRECCIÓN (EXISTENTE) --- */}
      {/* Contenedor responsivo: centrado en móvil, arriba a la derecha en escritorio */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-5 z-[100] flex flex-col gap-3 w-full max-w-sm md:w-auto">
      {/* --- FIN DE LA CORRECCIÓN (EXISTENTE) --- */}
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            closing={toast.closing} // Pasamos el estado de cierre
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;