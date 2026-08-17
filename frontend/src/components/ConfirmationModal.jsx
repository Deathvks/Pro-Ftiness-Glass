import ModalPortal from './ModalPortal';
/* frontend/src/components/ConfirmationModal.jsx */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Spinner from './Spinner';
import useAppStore from '../store/useAppStore';
import useModalLock from '../hooks/useModalLock';

const ConfirmationModal = ({
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isLoading = false,
  withPassword = false // Nueva prop para indicar si esta acción requiere contraseña
}) => {
  const userProfile = useAppStore((state) => state.userProfile);

  // --- Bloquear scroll del fondo y swipe entre páginas ---
  useModalLock();

  const [password, setPassword] = useState('');

  // Solo mostramos el input si la acción lo pide (withPassword=true)
  // Y el usuario realmente tiene una contraseña configurada (hasPassword=true)
  const showPasswordInput = withPassword && userProfile?.hasPassword;

  const handleConfirm = () => {
    // Si se requiere contraseña y está vacía, no hacemos nada
    if (showPasswordInput && !password.trim()) return;

    // Pasamos la contraseña (si aplica) a la función de confirmación
    onConfirm(showPasswordInput ? password : null);
  };

  return createPortal(
  // z-[100] para asegurar que se vea sobre otros modales (como el de creatina z-100)
  <ModalPortal><div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
      onClick={onCancel}>
      
      <div
        className="relative w-full max-w-sm p-8 mt-auto sm:mt-0 pb-[calc(2rem+var(--safe-bottom))] sm:pb-8 sm:m-4 bg-bg-primary rounded-t-[32px] rounded-b-none sm:rounded-2xl border border-glass-border shadow-2xl text-center animate-[slide-up_0.3s_ease-out] sm:animate-[scale-in_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}>

        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-4 sm:hidden shrink-0" />
        
        <p className="text-lg mb-6 text-text-primary">{message}</p>

        {showPasswordInput &&
        <div className="mb-6">
            <input
            type="password"
            placeholder="Confirma con tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-bg-secondary border border-glass-border focus:border-accent outline-none transition text-text-primary"
            autoFocus />
          
          </div>
        }

        <div className="flex flex-col sm:flex-row-reverse sm:justify-center gap-4">
          <button
            onClick={handleConfirm}
            disabled={isLoading || showPasswordInput && !password.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2 rounded-xl font-bold bg-red text-white hover:bg-red/80 transition disabled:opacity-70 whitespace-nowrap shadow-md shadow-red/20">
            
            {isLoading ? <Spinner size={18} color="white" /> : confirmText}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 sm:py-2 rounded-xl font-bold bg-bg-secondary text-text-secondary border border-transparent hover:border-glass-border hover:text-text-primary transition disabled:opacity-70">
            
            {cancelText}
          </button>
        </div>
      </div>
    </div></ModalPortal>,
  document.body
  );
};

export default ConfirmationModal;