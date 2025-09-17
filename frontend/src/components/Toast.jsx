import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import GlassCard from './GlassCard';

const icons = {
  success: <CheckCircle className="text-green" />,
  error: <XCircle className="text-red" />,
  info: <Info className="text-blue-500" />,
};

const borderColors = {
  success: 'border-green',
  error: 'border-red',
  info: 'border-accent',
}

const Toast = ({ message, type = 'info', closing, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const animationClass = closing
    ? 'animate-toast-out'
    : show ? 'animate-toast-in' : 'opacity-0';

  return (
    <div className={animationClass}>
      {/* --- INICIO DE LA CORRECCIÓN --- */}
      <GlassCard className={`flex items-center gap-4 p-4 w-full border-l-4 ${borderColors[type]}`}>
        {/* Se ha cambiado 'items-start' por 'items-center' */}
        <div className="flex-shrink-0">{icons[type]}</div> {/* Se ha eliminado el 'mt-1' */}
        {/* --- FIN DE LA CORRECCIÓN --- */}
        <div className="flex-grow text-sm text-text-primary pr-4">{message}</div>
        <button onClick={onClose} className="p-1 -m-1 text-text-muted hover:text-text-primary flex-shrink-0">
          <X size={18} />
        </button>
      </GlassCard>
    </div>
  );
};

export default Toast;