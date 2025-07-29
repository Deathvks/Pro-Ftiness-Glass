import React from 'react';
import GlassCard from './GlassCard';

const ConfirmationModal = ({ 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirmar", 
  cancelText = "Cancelar" 
}) => (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
    onClick={onCancel}
  >
    <GlassCard 
      className="p-8 m-4 w-full max-w-md text-center"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-lg mb-6">{message}</p>
      <div className="flex justify-center gap-4">
        <button 
          onClick={onCancel} 
          className="px-6 py-2 rounded-full font-semibold bg-bg-secondary hover:bg-white/10 transition"
        >
          {cancelText}
        </button>
        <button 
          onClick={onConfirm} 
          className="px-6 py-2 rounded-full font-semibold bg-red text-white hover:bg-red/80 transition"
        >
          {confirmText}
        </button>
      </div>
    </GlassCard>
  </div>
);

export default ConfirmationModal;