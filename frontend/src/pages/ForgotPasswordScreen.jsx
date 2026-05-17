/* frontend/src/pages/ForgotPasswordScreen.jsx */
import React, { useState } from 'react';
import { Dumbbell, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
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

            <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4 animate-[fade-in_0.5s_ease-out]">
                <div className="w-full max-w-md text-center">
                    
                    {!isSubmitted ? (
                        <>
                            <div className="w-20 h-20 bg-accent/10 rounded-[24px] flex items-center justify-center mx-auto mb-6 text-accent ring-1 ring-accent/30 shadow-sm">
                                <Dumbbell size={40} strokeWidth={1.5} />
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-3">
                                Recuperar Contraseña
                            </h1>
                            <p className="text-text-secondary font-medium mb-8 leading-relaxed max-w-sm mx-auto">
                                Introduce el email asociado a tu cuenta para recibir un enlace de recuperación.
                            </p>

                            <GlassCard className="glass p-6 sm:p-10 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-2xl bg-bg-primary/50">
                                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                                    <div>
                                        <input
                                            type="email"
                                            placeholder="Tu correo electrónico"
                                            className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-accent/50 text-text-primary font-bold placeholder:text-text-muted transition-all shadow-inner"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex items-center justify-center gap-2 w-full rounded-[20px] bg-accent text-white font-bold text-lg py-4 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-accent/20"
                                    >
                                        {isLoading ? <Spinner size={24} color="white" /> : (
                                            <>
                                                <Mail size={20} strokeWidth={2.5} /> 
                                                <span>Enviar Enlace</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </GlassCard>
                        </>
                    ) : (
                        <GlassCard className="glass p-8 sm:p-12 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-2xl bg-bg-primary/50 mt-8">
                            <div className="w-24 h-24 bg-accent/10 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-accent ring-1 ring-accent/30 shadow-sm">
                                <CheckCircle2 size={48} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-extrabold text-text-primary tracking-tight mb-3">Revisa tu correo</h2>
                            <p className="text-text-secondary font-medium leading-relaxed">
                                Si existe una cuenta con <strong>{email}</strong>, hemos enviado un enlace para restablecer tu contraseña.
                            </p>
                        </GlassCard>
                    )}

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

export default ForgotPasswordScreen;