/* frontend/src/components/ProfileImageModal.jsx */
import React from 'react';
import { X } from 'lucide-react';

const ProfileImageModal = ({ imageUrl, username, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-[fade-in_0.3s_ease-out]"
      onClick={onClose} // Cerrar al hacer clic fuera de la imagen
    >
      {/* Botón de cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition z-[110]"
        aria-label="Cerrar"
      >
        <X size={32} />
      </button>

      {/* --- INICIO DE LA MODIFICACIÓN --- */}
      {/* Contenedor de la imagen: tamaño ajustado y circular */}
      <div
        className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden shadow-2xl border-4 border-white/10" // Tamaño fijo y circular
        onClick={(e) => e.stopPropagation()} // Evitar que el clic en la imagen cierre el modal
      >
        <img
          src={imageUrl}
          alt={`Foto de perfil de ${username}`}
          className="block w-full h-full object-cover" // Asegura que la imagen cubra el círculo
        />
      </div>
      {/* --- FIN DE LA MODIFICACIÓN --- */}
    </div>
  );
};

export default ProfileImageModal;