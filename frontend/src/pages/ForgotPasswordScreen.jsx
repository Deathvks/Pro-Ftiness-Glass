/* frontend/src/pages/ForgotPasswordScreen.jsx */
import React, { useState } from 'react';
import { Dumbbell, Mail, ArrowLeft } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';
import { forgotPassword } from '../services/authService';
import SEOHead from '../components/SEOHead';

const ForgotPasswordScreen = ({ showLogin }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            addToast('Por favor, introduce un email válido.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await forgotPassword(email);
            addToast(response.message, 'success');
            setIsSubmitted(true);
        } catch (err) {
            addToast(err.message || 'Error al enviar la solicitud.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <SEOHead 
                title="Recuperar Contraseña - Pro Fitness Glass" 
                description="Recupera el acceso a tu cuenta de Pro Fitness Glass."
                route="forgot-password"
            />

            {/* CAMBIO: Layout flexible para permitir footer */}
            <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4 animate-[fade-in_0.5s_ease-out]">
                <div className="w-full max-w-sm text-center">
                    <Dumbbell size={48} className="mx-auto text-accent mb-4" />

                    <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight sm:whitespace-nowrap mb-2">
                        Recuperar <span className="block sm:inline">Contraseña</span>
                    </h1>

                    {!isSubmitted ? (
                        <>
                            <p className="text-text-secondary mb-8">Introduce tu email para recibir un enlace de recuperación.</p>
                            <GlassCard className="p-8">
                                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        className="w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex items-center justify-center gap-2 w-full rounded-md bg-accent text-bg-secondary font-semibold py-3 transition hover:scale-105 disabled:opacity-70"
                                    >
                                        {isLoading ? <Spinner /> : <><Mail size={18} /> <span>Enviar Enlace</span></>}
                                    </button>
                                </form>
                            </GlassCard>
                        </>
                    ) : (
                        <GlassCard className="p-8 mt-8">
                            <Mail size={40} className="mx-auto text-accent mb-4" />
                            <h2 className="text-xl font-bold">Revisa tu correo</h2>
                            <p className="text-text-secondary mt-2">
                                Si existe una cuenta con ese email, hemos enviado un enlace para restablecer tu contraseña.
                            </p>
                        </GlassCard>
                    )}

                    <button onClick={showLogin} className="mt-6 text-text-muted hover:text-text-primary transition flex items-center justify-center mx-auto gap-2">
                        <ArrowLeft size={16} />
                        Volver a Iniciar Sesión
                    </button>
                </div>
            </div>
        </>
    );
};

export default ForgotPasswordScreen;