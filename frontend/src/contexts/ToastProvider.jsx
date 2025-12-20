/* frontend/src/contexts/ToastProvider.jsx */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ToastContext } from './ToastContext';
import Toast from '../components/Toast';
import { v4 as uuidv4 } from 'uuid';

// --- EVENT EMITTER (Estable fuera de componentes) ---
// Esto vive fuera de los componentes, por lo que su referencia es siempre estable.
const toastEventEmitter = {
  listeners: new Set(),
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback); // Función para desuscribirse
  },
  emit(event) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
};

// --- COMPONENTE INTERNO (Gestiona renderizado de toasts) ---
// Este componente tendrá su PROPIO estado local y escuchará los eventos.
const ToastList = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // El manejador que añade el toast al estado LOCAL
    const handleAddToast = (toast) => {
      setToasts(currentToasts => [...currentToasts, toast]);
    };

    // Suscribimos el manejador al emisor de eventos
    const unsubscribe = toastEventEmitter.subscribe(handleAddToast);

    // Al desmontar, limpiamos la suscripción
    return unsubscribe;
  }, []);

  const removeToast = (id) => {
    setToasts(currentToasts =>
      currentToasts.map(t => t.id === id ? { ...t, closing: true } : t)
    );
    setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    }, 500);
  };

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-5 z-[100] flex flex-col gap-3 w-full max-w-sm md:w-auto">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          closing={toast.closing}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// --- PROVIDER ---
// El ToastProvider es muy simple y NUNCA se re-renderizará por culpa de un nuevo toast.
const ToastProvider = ({ children }) => {

  // 'addToast' ya no llama a 'useState'. Simplemente emite un evento.
  const addToast = useCallback((message, type = 'info') => {
    const id = uuidv4();
    toastEventEmitter.emit({ id, message, type });
  }, []);

  // CORRECCIÓN: Exponemos 'showToast' (alias de addToast) para compatibilidad con Social.jsx
  const contextValue = useMemo(() => ({
    showToast: addToast,
    addToast
  }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastList />
    </ToastContext.Provider>
  );
};

export default ToastProvider;