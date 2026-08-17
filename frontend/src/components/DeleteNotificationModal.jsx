import ModalPortal from './ModalPortal';
/* frontend/src/components/DeleteNotificationModal.jsx */
import React from 'react';
import { Trash2 } from 'lucide-react';
import useModalLock from '../hooks/useModalLock';

const DeleteNotificationModal = ({ isOpen, onClose, onConfirm }) => {

  // --- Bloquear scroll del fondo y swipe entre páginas ---
  useModalLock(isOpen);

  if (!isOpen) return null;

  return <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
      <div className="relative w-full max-w-sm bg-bg-secondary border border-glass-border rounded-t-[32px] rounded-b-none sm:rounded-2xl p-6 mt-auto sm:mt-0 pb-[calc(1.5rem+var(--safe-bottom))] sm:pb-6 shadow-2xl animate-[slide-up_0.2s_ease-out] sm:animate-[scale-in_0.2s_ease-out]">
        
        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#ef4444]/10 flex items-center justify-center text-[#ef4444] mb-4">
            <Trash2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-text-primary">
            ¿Eliminar notificación?
          </h3>
          <p className="text-text-secondary text-sm mt-2 leading-relaxed">
            Esta notificación se eliminará permanentemente.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-transparent border border-glass-border text-text-primary font-medium rounded-xl hover:bg-bg-primary transition">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-[#ef4444] text-white font-bold rounded-xl hover:bg-[#dc2626] transition shadow-lg shadow-red-500/20">
            Eliminar
          </button>
        </div>
      </div>
    </div></ModalPortal>;

};

export default DeleteNotificationModal;