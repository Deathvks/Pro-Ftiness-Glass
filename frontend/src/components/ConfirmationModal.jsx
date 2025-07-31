import React from 'react';
import GlassCard from './GlassCard';
import Spinner from './Spinner';

const ConfirmationModal = ({ 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirmar", 
  cancelText = "Cancelar",
  isLoading = false
}) => (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]"
    onClick={onCancel}
  >
    <GlassCard 
      className="p-8 m-4 w-full max-w-sm text-center" // Reducido a max-w-sm para mejor ajuste
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-lg mb-6">{message}</p>
      {/* --- INICIO DE LA CORRECCIÓN RESPONSIVE --- */}
      <div className="flex flex-col sm:flex-row-reverse sm:justify-center gap-4">
        {/* Botón de Confirmar (rojo) */}
        <button 
          onClick={onConfirm}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2 rounded-full font-semibold bg-red text-white hover:bg-red/80 transition disabled:opacity-70 whitespace-nowrap"
        >
          {isLoading ? <Spinner size={18} /> : confirmText}
        </button>
        {/* Botón de Cancelar */}
        <button 
          onClick={onCancel} 
          disabled={isLoading}
          className="px-6 py-3 sm:py-2 rounded-full font-semibold bg-bg-secondary hover:bg-white/10 transition disabled:opacity-70"
        >
          {cancelText}
        </button>
      </div>
      {/* --- FIN DE LA CORRECCIÓN --- */}
    </GlassCard>
  </div>
);

export default ConfirmationModal;