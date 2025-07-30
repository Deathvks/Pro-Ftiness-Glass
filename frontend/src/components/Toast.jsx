import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const icons = {
    success: <CheckCircle className="text-green" />,
    error: <XCircle className="text-red" />,
    info: <Info className="text-blue-500" />,
};

const Toast = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // El toast se cierra automáticamente después de 5 segundos

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="animate-toast-in">
            <GlassCard className="flex items-start gap-4 p-4 max-w-sm w-full border-l-4 border-accent">
                <div className="flex-shrink-0 mt-1">{icons[type]}</div>
                <div className="flex-grow text-sm text-text-primary">{message}</div>
                <button onClick={onClose} className="p-1 -m-1 text-text-muted hover:text-text-primary">
                    <X size={18} />
                </button>
            </GlassCard>
        </div>
    );
};

export default Toast;