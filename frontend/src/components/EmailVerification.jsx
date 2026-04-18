/* frontend/src/components/EmailVerification.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import GlassCard from './GlassCard';
import Spinner from './Spinner';
import { useToast } from '../hooks/useToast';
import { verifyEmail, resendVerificationEmail } from '../services/authService';
import useAppStore from '../store/useAppStore';

const EmailVerification = ({ email, onBack, onSuccess, backButtonText = 'Volver al registro' }) => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { addToast } = useToast();
    const fetchInitialData = useAppStore(state => state.fetchInitialData);
    const [resendCooldown, setResendCooldown] = useState(10); // Iniciar con 10 segundos
    const inputRefs = useRef([]);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // Lógica para manejar el cambio en cada uno de los 6 cuadros
    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // Solo números
        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);

        // Auto-focus al siguiente input
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    // Lógica para borrar e ir hacia atrás
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    // Lógica para soportar "Pegar" (Paste) un código de 6 dígitos de golpe
    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
        const newCode = [...code];
        pastedData.forEach((char, index) => {
            if (index < 6 && /^\d$/.test(char)) {
                newCode[index] = char;
            }
        });
        setCode(newCode);
        
        // Poner foco en el último recuadro rellenado
        const nextFocusIndex = Math.min(pastedData.length, 5);
        if (inputRefs.current[nextFocusIndex]) {
            inputRefs.current[nextFocusIndex].focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const verificationCode = code.join('');
        
        if (verificationCode.length !== 6) {
            setErrors({ code: 'El código debe tener 6 dígitos' });
            return;
        }

        setErrors({});
        setIsLoading(true);

        try {
            // Mantenemos tu estructura { email, code } para que no rompa tu authService
            const response = await verifyEmail({ email, code: verificationCode });
            
            if (response && response.token) {
                localStorage.setItem('fittrack_token', response.token);
                
                useAppStore.setState({ 
                    token: response.token, 
                    isAuthenticated: true 
                });
                
                await fetchInitialData();
                
                addToast('¡Cuenta verificada exitosamente!', 'success');
                onSuccess();
            } else if (!response || !response.token) {
                 // Por si verifyEmail devuelve undefined pero no tira error (dependiendo de cómo esté hecho tu authService)
                 addToast('¡Cuenta verificada exitosamente!', 'success');
                 onSuccess();
            }
        } catch (err) {
            const errorMessage = err.message || 'Error al verificar el código';
            setErrors({ api: errorMessage });
            addToast(errorMessage, 'error');
            // Limpiamos los inputs si falla y ponemos el foco en el primero
            setCode(['', '', '', '', '', '']);
            if (inputRefs.current[0]) inputRefs.current[0].focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0) return;

        try {
            await resendVerificationEmail(email);
            addToast('Se ha reenviado un nuevo código de verificación.', 'success');
            setResendCooldown(10); // Reiniciar cooldown de 10 segundos
        } catch (error) {
            addToast(error.message || 'Error al reenviar el código.', 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary p-4 animate-[fade-in_0.5s_ease-out]">
            <div className="w-full max-w-sm text-center">
                <div className="mb-8">
                    <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
                        <Mail className="w-8 h-8 text-bg-secondary" />
                    </div>
                    <h1 className="text-4xl font-extrabold mb-2">Verificar Email</h1>
                    <p className="text-text-secondary">
                        Hemos enviado un código de 6 dígitos a <strong className="text-text-primary">{email}</strong>
                    </p>
                </div>

                <GlassCard className="p-8">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                        {errors.api && <p className="text-center text-red-500 text-sm">{errors.api}</p>}

                        <div>
                            {/* CONTENEDOR DE LOS 6 CUADROS */}
                            <div className="flex justify-between gap-2" onPaste={handlePaste}>
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-2xl font-bold bg-bg-secondary border border-glass-border rounded-md text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/50 outline-none transition-all"
                                        required
                                    />
                                ))}
                            </div>
                            {errors.code && <p className="form-error-text text-left mt-2 text-sm text-red-500">{errors.code}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || code.some(d => d === '')}
                            className="flex items-center justify-center w-full rounded-md bg-accent text-bg-secondary font-semibold py-3 transition hover:scale-105 hover:shadow-lg hover:shadow-accent/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Spinner size="sm" /> : 'Verificar Código'}
                        </button>
                    </form>

                    <div className="mt-6 flex flex-col gap-3">
                        <button
                            onClick={handleResendCode}
                            disabled={resendCooldown > 0}
                            className="text-sm text-accent hover:text-accent/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : '¿No recibiste el código? Reenviar'}
                        </button>
                        
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="flex items-center justify-center text-sm text-text-muted hover:text-text-primary transition"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                {backButtonText}
                            </button>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default EmailVerification;