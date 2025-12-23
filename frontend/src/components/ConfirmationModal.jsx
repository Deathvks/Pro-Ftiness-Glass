/* frontend/src/components/ConfirmationModal.jsx */
import React, { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
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

  const [isDarkTheme, setIsDarkTheme] = useState(() =>
    typeof document !== 'undefined' && !document.body.classList.contains('light-theme')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkTheme(!document.body.classList.contains('light-theme'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleConfirm = () => {
    // Si se requiere contraseña y está vacía, no hacemos nada
    if (showPasswordInput && !password.trim()) return;

    // Pasamos la contraseña (si aplica) a la función de confirmación
    onConfirm(showPasswordInput ? password : null);
  };

  return (
    // MODIFICACIÓN: z-50 -> z-[1000] para asegurar que se vea sobre otros modales (como el de creatina z-100)
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
      onClick={onCancel}
    >
      <GlassCard
        className={`p-8 m-4 w-full max-w-sm text-center ${!isDarkTheme ? '!bg-white/95 !border-black/10' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-lg mb-6">{message}</p>

        {showPasswordInput && (
          <div className="mb-6">
            <input
              type="password"
              placeholder="Confirma con tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 rounded-md border outline-none transition ${!isDarkTheme
                  ? 'bg-gray-100 border-gray-300 focus:border-black text-black'
                  : 'bg-bg-secondary border-glass-border focus:border-accent text-text-primary'
                }`}
              autoFocus
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row-reverse sm:justify-center gap-4">
          <button
            onClick={handleConfirm}
            disabled={isLoading || (showPasswordInput && !password.trim())}
            className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2 rounded-full font-semibold bg-red text-white hover:bg-red/80 transition disabled:opacity-70 whitespace-nowrap"
          >
            {isLoading ? <Spinner size={18} /> : confirmText}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`px-6 py-3 sm:py-2 rounded-full font-semibold transition disabled:opacity-70 ${!isDarkTheme ? 'bg-gray-200 hover:bg-gray-300' : 'bg-bg-secondary hover:bg-white/10'}`}
          >
            {cancelText}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default ConfirmationModal;