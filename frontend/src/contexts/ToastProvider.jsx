/* frontend/src/contexts/ToastProvider.jsx */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ToastContext } from './ToastContext';
import Toast from '../components/Toast';
import { v4 as uuidv4 } from 'uuid';

// --- EVENT EMITTER (Estable fuera de componentes) ---
const toastEventEmitter = {
  listeners: new Set(),
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },
  emit(event) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
};

// --- COMPONENTE INTERNO (Gestiona renderizado de toasts) ---
const ToastList = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleAddToast = (toast) => {
      setToasts(currentToasts => [...currentToasts, toast]);
    };

    const unsubscribe = toastEventEmitter.subscribe(handleAddToast);
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
    // Usamos z-[9999] para que aparezca sobre todos los modales
    <div className="fixed top-5 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm md:w-auto">
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
const ToastProvider = ({ children }) => {

  const addToast = useCallback((message, type = 'info') => {
    const id = uuidv4();
    toastEventEmitter.emit({ id, message, type });
  }, []);

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