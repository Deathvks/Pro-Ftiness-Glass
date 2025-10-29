/* frontend/src/contexts/ToastProvider.jsx */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ToastContext } from './ToastContext';
import Toast from '../components/Toast';
import { v4 as uuidv4 } from 'uuid';

// --- INICIO DE LA MODIFICACIÓN (FIX RE-RENDER DEFINITIVO) ---

// 1. Creamos un "emisor de eventos" simple.
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

// 2. Creamos un componente INTERNO para renderizar la lista de toasts.
// Este componente tendrá su PROPIO estado local y escuchará los eventos.
const ToastList = () => {
  const [toasts, setToasts] = useState([]);

  // 3. Al montarse, nos suscribimos a los eventos 'addToast'
  useEffect(() => {
    // El manejador que añade el toast al estado LOCAL
    const handleAddToast = (toast) => {
      setToasts(currentToasts => [...currentToasts, toast]);
    };

    // Suscribimos el manejador al emisor de eventos
    const unsubscribe = toastEventEmitter.subscribe(handleAddToast);

    // Al desmontar, limpiamos la suscripción
    return unsubscribe;
  }, []); // El array vacío [] asegura que esto se ejecute SOLO UNA VEZ

  // 4. La lógica de 'removeToast' ahora vive aquí,
  // ya que gestiona el estado 'toasts' de este componente.
  const removeToast = (id) => {
    setToasts(currentToasts =>
      currentToasts.map(t => t.id === id ? { ...t, closing: true } : t)
    );
    setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    }, 500);
  };

  // 5. El JSX del contenedor de toasts se mueve aquí
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


// 6. Ahora, el ToastProvider es muy simple y NUNCA se re-renderizará
// por culpa de un nuevo toast.
const ToastProvider = ({ children }) => {

  // 7. 'addToast' ya no llama a 'useState'.
  // Simplemente emite un evento al emisor.
  const addToast = useCallback((message, type = 'info') => {
    const id = uuidv4();
    toastEventEmitter.emit({ id, message, type });
  }, []); // useCallback asegura que la referencia de esta función sea estable

  // 8. El valor del contexto también es estable
  const contextValue = useMemo(() => ({
    addToast
  }), [addToast]);

  // 9. El Provider renderiza a los {children} (tu app)
  // y, como HERMANO, renderiza <ToastList />.
  // Cuando 'addToast' emite un evento, SOLO <ToastList /> se re-renderizará.
  // {children} permanecerá intacto.
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastList />
    </ToastContext.Provider>
  );
};

// --- FIN DE LA MODIFICACIÓN (FIX RE-RENDER DEFINITIVO) ---

export default ToastProvider;