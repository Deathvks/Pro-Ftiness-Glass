/* frontend/src/components/ConfirmationModal.jsx */
import React, { useState } from 'react';
import Spinner from './Spinner';
import useAppStore from '../store/useAppStore';

const ConfirmationModal = ({
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isLoading = false,
  withPassword = false // Nueva prop para indicar si esta acción requiere contraseña
}) => {
  const userProfile = useAppStore(state => state.userProfile);
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

  return (
    // z-[1000] para asegurar que se vea sobre otros modales (como el de creatina z-100)
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm p-8 m-4 bg-bg-primary rounded-2xl border border-glass-border shadow-2xl text-center animate-[scale-in_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-lg mb-6 text-text-primary">{message}</p>

        {showPasswordInput && (
          <div className="mb-6">
            <input
              type="password"
              placeholder="Confirma con tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-bg-secondary border border-glass-border focus:border-accent outline-none transition text-text-primary"
              autoFocus
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row-reverse sm:justify-center gap-4">
          <button
            onClick={handleConfirm}
            disabled={isLoading || (showPasswordInput && !password.trim())}
            className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2 rounded-xl font-bold bg-red text-white hover:bg-red/80 transition disabled:opacity-70 whitespace-nowrap shadow-md shadow-red/20"
          >
            {isLoading ? <Spinner size={18} color="white" /> : confirmText}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 sm:py-2 rounded-xl font-bold bg-bg-secondary text-text-secondary border border-transparent hover:border-glass-border hover:text-text-primary transition disabled:opacity-70"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;