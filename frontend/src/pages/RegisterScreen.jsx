/* frontend/src/pages/RegisterScreen.jsx */
import React, { useState, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';
import { registerUser, signInWithGoogle, initGoogleAuth } from '../services/authService'; 
import useAppStore from '../store/useAppStore';
import EmailVerification from '../components/EmailVerification';
import GoogleTermsModal from '../components/GoogleTermsModal';
import PrivacyPolicy from './PrivacyPolicy';
import { useGoogleLogin } from '@react-oauth/google';
import SEOHead from '../components/SEOHead';
import { Capacitor } from '@capacitor/core';

const RegisterScreen = ({ showLogin }) => {
    const handleGoogleLogin = useAppStore(state => state.handleGoogleLogin);
    const fetchInitialData = useAppStore(state => state.fetchInitialData);
    
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const { addToast } = useToast();

    // Estados para modales y consentimiento
    const [showGoogleModal, setShowGoogleModal] = useState(false);
    const [showPolicy, setShowPolicy] = useState(false);
    const [hasConsented, setHasConsented] = useState(false);

    // --- CORRECCIÓN CRASH ANDROID ---
    useEffect(() => {
        initGoogleAuth();
    }, []);

    // Verificar consentimiento al montar (Web)
    useEffect(() => {
        const checkConsent = () => {
            const consent = localStorage.getItem('cookie_consent');
            setHasConsented(consent === 'accepted');
        };
        checkConsent();
        window.addEventListener('storage', checkConsent);
        return () => window.removeEventListener('storage', checkConsent);
    }, []);

    // --- LÓGICA GOOGLE UNIFICADA ---
    const processGoogleToken = async (token) => {
        setShowGoogleModal(false);
        setIsLoading(true);
        setErrors({});
        try {
            if (handleGoogleLogin) {
                await handleGoogleLogin(token);
            } else {
                throw new Error("Error de configuración interna.");
            }
        } catch (err) {
            const msg = err.message || 'Error con Google.';
            addToast(msg, 'error');
            setErrors({ api: msg });
            setIsLoading(false);
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: (tokenResponse) => processGoogleToken(tokenResponse.access_token),
        onError: () => addToast('No se pudo conectar con Google.', 'error'),
    });

    const handleGoogleClick = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                const user = await signInWithGoogle();
                const token = user.authentication?.idToken;
                
                if (token) {
                    await processGoogleToken(token);
                } else {
                    addToast('No se recibió el token de identificación.', 'error');
                }
            } catch (error) {
                console.error('Google Sign-In Native Error:', error);
                if (error?.message && !error.message.includes('Canceled')) {
                    addToast('Error al registrarse con Google', 'error');
                }
            }
        } else {
            if (hasConsented) {
                loginWithGoogle();
            } else {
                setShowGoogleModal(true);
            }
        }
    };

    const onModalSuccess = (credentialResponse) => {
        if (credentialResponse.credential) {
            processGoogleToken(credentialResponse.credential);
        }
    };

    const onModalError = () => {
        setShowGoogleModal(false);
        addToast('No se pudo conectar con Google.', 'error');
    };

    // --- LÓGICA FORMULARIO REGISTRO ---
    const validateForm = () => {
        const newErrors = {};
        if (!username.trim()) {
            newErrors.username = 'El nombre de usuario es requerido.';
        } else if (username.length < 3 || username.length > 30) {
            newErrors.username = 'El nombre de usuario debe tener entre 3 y 30 caracteres.';
        } else if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
             newErrors.username = 'Solo letras, números, _, . y - (sin espacios).';
        }

        if (!email.trim()) {
            newErrors.email = 'El email es requerido.';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'El email no es válido.';
        }
        if (!password) {
            newErrors.password = 'La contraseña es requerida.';
        } else if (password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
        }
        return newErrors;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setErrors({});
        setIsLoading(true);

        try {
            // MODIFICADO: Añadido social_privacy: 'private' por defecto
            const response = await registerUser({ 
                username, 
                email, 
                password,
                social_privacy: 'private' 
            });
            
            addToast(response.message, 'success');
            setRegisteredEmail(email);
            setShowVerification(true);
        } catch (err) {
            const errorMessage = err.message || 'Error en el registro.';
            if (err.errors && Array.isArray(err.errors)) {
                 const apiErrors = {};
                 err.errors.forEach(error => {
                     if (error.param) {
                         apiErrors[error.param] = error.msg;
                     }
                 });
                 setErrors(apiErrors);
            } else if (errorMessage.toLowerCase().includes('nombre de usuario')) {
                 setErrors({ username: errorMessage });
            } else if (errorMessage.toLowerCase().includes('email')) {
                 setErrors({ email: errorMessage });
            } else {
                 setErrors({ api: errorMessage });
            }
            addToast(errorMessage, 'error');
            setPassword('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerificationSuccess = async () => {
        try {
            await fetchInitialData();
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    const handleBackToRegister = () => {
        setShowVerification(false);
        setRegisteredEmail('');
    };

    if (showVerification) {
        return (
            <>
                <SEOHead 
                    title="Verificar Email - Pro Fitness Glass" 
                    route="register/verify"
                    noIndex={true}
                />
                <EmailVerification 
                    email={registeredEmail}
                    onBack={handleBackToRegister}
                    onSuccess={handleVerificationSuccess}
                />
            </>
        );
    }

    if (showPolicy) {
        return <PrivacyPolicy onBack={() => setShowPolicy(false)} />;
    }

    return (
        <>
            <SEOHead 
                title="Registrarse - Pro Fitness Glass" 
                description="Crea tu cuenta gratis en Pro Fitness Glass. Únete a la mejor plataforma de entrenamiento y nutrición."
                route="register"
            />

            {/* CAMBIO: Layout flexible en lugar de fixed para permitir footer */}
            <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4 animate-[fade-in_0.5s_ease-out]">
                <div className="w-full max-w-sm text-center">
                    <Dumbbell size={48} className="mx-auto text-accent mb-4" />
                    <h1 className="text-4xl font-extrabold">Pro Fitness Glass</h1>
                    <p className="text-text-secondary mb-8">Crea tu cuenta y empieza hoy mismo.</p>

                    <GlassCard className="p-8">
                        <form onSubmit={handleRegister} className="flex flex-col gap-5" noValidate>
                            {errors.api && <p className="text-center text-red">{errors.api}</p>}

                            <div>
                                <input
                                    type="text"
                                    placeholder="Nombre de usuario"
                                    className="w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    maxLength={30}
                                />
                                {errors.username && <p className="form-error-text text-left">{errors.username}</p>}
                            </div>

                            <div>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    className="w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                {errors.email && <p className="form-error-text text-left">{errors.email}</p>}
                            </div>

                            <div>
                                <input
                                    type="password"
                                    placeholder="Contraseña"
                                    className="w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                {errors.password && <p className="form-error-text text-left">{errors.password}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center justify-center w-full rounded-md bg-accent text-bg-secondary font-semibold py-3 transition hover:scale-105 hover:shadow-lg hover:shadow-accent/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Spinner /> : 'Registrarse'}
                            </button>
                        </form>

                        {/* Separador */}
                        <div className="relative flex py-5 items-center">
                            <div className="flex-grow border-t border-glass-border"></div>
                            <span className="flex-shrink-0 mx-4 text-text-muted text-sm">O regístrate con</span>
                            <div className="flex-grow border-t border-glass-border"></div>
                        </div>

                        {/* Botón de Google Unificado */}
                        <button
                            onClick={handleGoogleClick}
                            disabled={isLoading}
                            className="w-full h-11 bg-accent text-bg-secondary rounded-md flex items-center justify-center gap-3 font-semibold shadow transition hover:scale-105 hover:shadow-lg hover:shadow-accent/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <div className="bg-white rounded-full p-1 flex items-center justify-center">
                                <FcGoogle size={18} />
                            </div>
                            <span>Registrarse con Google</span>
                        </button>

                    </GlassCard>

                    <button onClick={showLogin} className="mt-6 text-text-muted hover:text-text-primary transition">
                        ¿Ya tienes cuenta? Inicia sesión
                    </button>
                </div>
            </div>

            {/* Modal de Términos de Google (Fallback Web) */}
            <GoogleTermsModal 
                isOpen={showGoogleModal}
                onClose={() => setShowGoogleModal(false)}
                onSuccess={onModalSuccess}
                onError={onModalError}
                onShowPolicy={() => setShowPolicy(true)}
            />
        </>
    );
};

export default RegisterScreen;