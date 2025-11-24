/* frontend/src/components/DeleteNotificationModal.jsx */
import React from 'react';
import { Trash2 } from 'lucide-react';

const DeleteNotificationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
      <div className="relative w-full max-w-sm bg-bg-secondary border border-glass-border rounded-2xl p-6 shadow-2xl animate-[scale-in_0.2s_ease-out]">
        
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
            className="flex-1 py-3 bg-transparent border border-glass-border text-text-primary font-medium rounded-xl hover:bg-bg-primary transition"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3 bg-[#ef4444] text-white font-bold rounded-xl hover:bg-[#dc2626] transition shadow-lg shadow-red-500/20"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteNotificationModal;