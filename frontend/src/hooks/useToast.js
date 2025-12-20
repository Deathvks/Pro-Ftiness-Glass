/* frontend/src/hooks/useToast.js */
import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext';

export const useToast = () => {
    const context = useContext(ToastContext);

    if (!context) {
        console.warn('useToast se está usando fuera de un ToastProvider. Se usará una función mock para evitar errores.');
        return {
            showToast: (message, type) => console.log(`[Toast Mock ${type}]: ${message}`)
        };
    }

    return context;
};