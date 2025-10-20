import React, { useState, useEffect } from 'react';
import { Dumbbell, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';
import { resetPassword } from '../services/authService';

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
            // --- INICIO DE LA MODIFICACIÓN ---
            addToast(response.message, 'success'); // Notificación de éxito
            // --- FIN DE LA MODIFICACIÓN ---
            setIsSuccess(true);
        } catch (err) {
            addToast(err.message || 'Error al restablecer la contraseña.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary p-4 animate-[fade-in_0.5s_ease-out]">
                <div className="w-full max-w-sm text-center">
                    <GlassCard className="p-8">
                        <CheckCircle size={40} className="mx-auto text-accent mb-4" />
                        <h2 className="text-xl font-bold">Contraseña Actualizada</h2>
                        <p className="text-text-secondary mt-2">
                            Tu contraseña ha sido restablecida. Ahora puedes iniciar sesión con la nueva.
                        </p>
                        <button onClick={showLogin} className="mt-6 w-full rounded-md bg-accent text-bg-secondary font-semibold py-3 transition hover:scale-105">
                            Ir a Iniciar Sesión
                        </button>
                    </GlassCard>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary p-4 animate-[fade-in_0.5s_ease-out]">
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
    );
};

export default ResetPasswordScreen;