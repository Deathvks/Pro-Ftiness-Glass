/* frontend/src/pages/ResetPasswordScreen.jsx */
import React, { useState, useEffect } from 'react';
import { Dumbbell, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';
import { resetPassword } from '../services/authService';
import SEOHead from '../components/SEOHead';

const ResetPasswordScreen = ({ showLogin }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [token, setToken] = useState(null);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            addToast('Token de restablecimiento no encontrado.', 'error');
        }
    }, [addToast]);

    useEffect(() => {
        if (isSuccess) {
            const timer = setTimeout(() => {
                showLogin();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, showLogin]);

    const validateForm = () => {
        const newErrors = {};
        if (!password) {
            newErrors.password = 'La contraseña es requerida.';
        } else if (password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
        }
        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden.';
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        if (!token) {
            addToast('Falta el token de restablecimiento.', 'error');
            return;
        }

        setErrors({});
        setIsLoading(true);

        try {
            const response = await resetPassword({ token, password });
            addToast(response.message, 'success');
            setIsSuccess(true);
        } catch (err) {
            addToast(err.message || 'Error al restablecer la contraseña.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <>
                <SEOHead 
                    title="Contraseña Restablecida - Pro Fitness Glass" 
                    route="reset-password/success"
                    noIndex={true}
                />
                <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4 animate-[fade-in_0.5s_ease-out]">
                    <div className="w-full max-w-md text-center">
                        <GlassCard className="glass p-8 sm:p-12 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-2xl bg-bg-primary/50">
                            <div className="w-24 h-24 bg-green-500/10 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-green ring-1 ring-green-500/30 shadow-sm">
                                <CheckCircle2 size={48} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-extrabold text-text-primary tracking-tight mb-3">Contraseña Actualizada</h2>
                            <p className="text-text-secondary font-medium leading-relaxed mb-8">
                                Tu contraseña ha sido restablecida con éxito. Redirigiendo al inicio de sesión...
                            </p>
                            <button 
                                onClick={showLogin} 
                                className="w-full rounded-[20px] bg-accent text-white font-bold text-lg py-4 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-accent/20"
                            >
                                Ir a Iniciar Sesión ahora
                            </button>
                        </GlassCard>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SEOHead 
                title="Restablecer Contraseña - Pro Fitness Glass" 
                route="reset-password"
                noIndex={true}
            />
            <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4 animate-[fade-in_0.5s_ease-out]">
                <div className="w-full max-w-md text-center">
                    <div className="w-20 h-20 bg-accent/10 rounded-[24px] flex items-center justify-center mx-auto mb-6 text-accent ring-1 ring-accent/30 shadow-sm">
                        <Dumbbell size={40} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-3">Nueva Contraseña</h1>
                    <p className="text-text-secondary font-medium mb-8 leading-relaxed max-w-sm mx-auto">Introduce y confirma tu nueva contraseña de acceso.</p>
                    
                    <GlassCard className="glass p-6 sm:p-10 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-2xl bg-bg-primary/50">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div>
                                <input
                                    type="password"
                                    placeholder="Nueva Contraseña"
                                    className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-primary font-bold placeholder:text-text-muted transition-all shadow-inner"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                {errors.password && <p className="text-red font-bold text-xs text-left mt-2 px-2">{errors.password}</p>}
                            </div>
                            <div>
                                <input
                                    type="password"
                                    placeholder="Confirmar Nueva Contraseña"
                                    className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-primary font-bold placeholder:text-text-muted transition-all shadow-inner"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                {errors.confirmPassword && <p className="text-red font-bold text-xs text-left mt-2 px-2">{errors.confirmPassword}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !token}
                                className="flex items-center justify-center gap-2 w-full rounded-[20px] bg-accent text-white font-bold text-lg py-4 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-accent/20"
                            >
                                {isLoading ? <Spinner size={24} color="white" /> : (
                                    <>
                                        <KeyRound size={20} strokeWidth={2.5} /> 
                                        <span>Guardar Contraseña</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </GlassCard>

                    <button 
                        onClick={showLogin} 
                        className="mt-8 flex items-center justify-center mx-auto gap-2 px-6 py-3.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-full text-text-secondary font-bold hover:text-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95"
                    >
                        <ArrowLeft size={18} strokeWidth={2.5} />
                        Volver a Iniciar Sesión
                    </button>
                </div>
            </div>
        </>
    );
};

export default ResetPasswordScreen;