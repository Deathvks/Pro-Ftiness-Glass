/* frontend/src/pages/ResetPasswordScreen.jsx */
import React, { useState, useEffect } from 'react';
import { Dumbbell, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';
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
        // Extraer el token de la URL cuando el componente se monta
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            addToast('Token de restablecimiento no encontrado.', 'error');
        }
    }, [addToast]);

    // Redirección automática
    useEffect(() => {
        if (isSuccess) {
            const timer = setTimeout(() => {
                showLogin();
            }, 3000); // 3 segundos para leer el mensaje antes de redirigir
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
                {/* CAMBIO: Layout flexible */}
                <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4 animate-[fade-in_0.5s_ease-out]">
                    <div className="w-full max-w-sm text-center">
                        <GlassCard className="p-8">
                            <CheckCircle size={40} className="mx-auto text-accent mb-4" />
                            <h2 className="text-xl font-bold">Contraseña Actualizada</h2>
                            <p className="text-text-secondary mt-2">
                                Tu contraseña ha sido restablecida. Redirigiendo al inicio de sesión...
                            </p>
                            <button onClick={showLogin} className="mt-6 w-full rounded-md bg-accent text-bg-secondary font-semibold py-3 transition hover:scale-105">
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
            {/* CAMBIO: Layout flexible */}
            <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4 animate-[fade-in_0.5s_ease-out]">
                <div className="w-full max-w-sm text-center">
                    <Dumbbell size={48} className="mx-auto text-accent mb-4" />
                    <h1 className="text-4xl font-extrabold">Nueva Contraseña</h1>
                    <p className="text-text-secondary mb-8">Introduce tu nueva contraseña.</p>
                    <GlassCard className="p-8">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div>
                                <input
                                    type="password"
                                    placeholder="Nueva Contraseña"
                                    className="w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                {errors.password && <p className="form-error-text text-left">{errors.password}</p>}
                            </div>
                            <div>
                                <input
                                    type="password"
                                    placeholder="Confirmar Nueva Contraseña"
                                    className="w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                {errors.confirmPassword && <p className="form-error-text text-left">{errors.confirmPassword}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !token}
                                className="flex items-center justify-center gap-2 w-full rounded-md bg-accent text-bg-secondary font-semibold py-3 transition hover:scale-105 disabled:opacity-70"
                            >
                                {isLoading ? <Spinner /> : <><KeyRound size={18} /> <span>Guardar Contraseña</span></>}
                            </button>
                        </form>
                    </GlassCard>

                    <button onClick={showLogin} className="mt-6 text-text-muted hover:text-text-primary transition flex items-center justify-center mx-auto gap-2">
                        <ArrowLeft size={16} />
                        Volver a Iniciar Sesión
                    </button>
                </div>
            </div>
        </>
    );
};

export default ResetPasswordScreen;