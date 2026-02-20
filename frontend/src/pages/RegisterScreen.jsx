/* frontend/src/pages/RegisterScreen.jsx */
import React, { useState, useEffect } from 'react';
import { Dumbbell, Sparkles, ArrowRight, Info, X, CheckCircle2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';
import { registerUser, signInWithGoogle, initGoogleAuth } from '../services/authService'; 
import useAppStore from '../store/useAppStore';
import EmailVerification from '../components/EmailVerification';
import GoogleTermsModal from '../components/GoogleTermsModal';
import PrivacyPolicy from './PrivacyPolicy';
import EmotionalOnboarding from './EmotionalOnboarding'; 
import { useGoogleLogin } from '@react-oauth/google';
import SEOHead from '../components/SEOHead';
import { Capacitor } from '@capacitor/core';
import { useLocation } from 'react-router-dom';

const RegisterScreen = ({ showLogin }) => {
    const handleGoogleLogin = useAppStore(state => state.handleGoogleLogin);
    const fetchInitialData = useAppStore(state => state.fetchInitialData);
    
    // Hooks de navegación
    const location = useLocation();
    
    // Estado del Quiz (si viene de Landing o se hace aquí)
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizData, setQuizData] = useState(location.state?.prefilledData || null);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    
    // Estado para el modal de información del test
    const [showInfoModal, setShowInfoModal] = useState(false);
    
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

    // --- MANEJO DEL QUIZ EMOCIONAL ---
    const handleQuizFinish = (data) => {
        setQuizData(data);
        setShowQuiz(false); 
    };

    // --- LÓGICA GOOGLE UNIFICADA ---
    const processGoogleToken = async (token) => {
        setShowGoogleModal(false);
        setIsLoading(true);
        setErrors({});
        try {
            // LIMPIEZA TOTAL:
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_step');

            if (quizData) {
                localStorage.setItem('temp_onboarding_data', JSON.stringify(quizData));
            } else {
                localStorage.removeItem('temp_onboarding_data');
            }

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
            const response = await registerUser({ 
                username, 
                email, 
                password,
                social_privacy: 'private' 
            });
            
            addToast(response.message, 'success');
            setRegisteredEmail(email);
            
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_step');

            if (quizData) {
                localStorage.setItem('temp_onboarding_data', JSON.stringify(quizData));
            } else {
                localStorage.removeItem('temp_onboarding_data');
            }

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

    // --- RENDERIZADO ---

    if (showQuiz) {
        return (
            <EmotionalOnboarding 
                onFinish={handleQuizFinish}
                onBack={() => setShowQuiz(false)} 
            />
        );
    }

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
                description="Crea tu cuenta gratis en Pro Fitness Glass."
                route="register"
            />

            <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] p-4 animate-[fade-in_0.5s_ease-out]">
                <div className="w-full max-w-sm text-center">
                    <Dumbbell size={48} className="mx-auto text-accent mb-4" />
                    <h1 className="text-4xl font-extrabold">Pro Fitness Glass</h1>
                    <p className="text-text-secondary mb-8">Crea tu cuenta y empieza hoy mismo.</p>

                    <GlassCard className="p-8 relative">
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

                        <div className="relative flex py-5 items-center">
                            <div className="flex-grow border-t border-glass-border"></div>
                            <span className="flex-shrink-0 mx-4 text-text-muted text-sm">O regístrate con</span>
                            <div className="flex-grow border-t border-glass-border"></div>
                        </div>

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

                        {/* ENLACE AL QUIZ INTERACTIVO MEJORADO */}
                        <div 
                            onClick={() => setShowQuiz(true)}
                            className="mt-6 relative group overflow-hidden rounded-xl cursor-pointer shadow-lg transform transition-all duration-300 hover:scale-[1.03] hover:shadow-accent/40 border-2 border-transparent hover:border-accent/30"
                        >
                            {/* Efecto Shimmer (Brillo que pasa) */}
                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-30 pointer-events-none" />

                            {/* Background Image & Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-accent to-purple-700 dark:from-gray-900 dark:to-black opacity-90 dark:opacity-85 z-10 transition-opacity" />
                            
                            <img 
                                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80" 
                                alt="Fitness Background"
                                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 dark:opacity-40 z-0 transition-transform duration-700 group-hover:scale-110"
                            />
                            
                            {/* Content */}
                            <div className="relative z-20 p-4 flex items-center justify-between">
                                <div className="flex flex-col items-start gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-white/20 dark:bg-gray-800/60 p-1.5 rounded-lg backdrop-blur-sm shadow-sm ring-1 ring-white/10 group-hover:ring-accent/50 transition-all">
                                            <Sparkles size={16} className="text-yellow-300 animate-pulse" />
                                        </span>
                                        <span className="font-bold text-white text-sm tracking-wide drop-shadow-md">
                                            TEST INTERACTIVO
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/90 text-left max-w-[180px] leading-tight font-medium drop-shadow-sm">
                                        Tu plan ideal en &lt; 2 min.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                     {/* Botón Info con stopPropagation para no activar el click principal */}
                                     <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowInfoModal(true);
                                        }}
                                        className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
                                        title="Más información"
                                     >
                                        <Info size={20} />
                                     </button>

                                    {/* Flecha de acción */}
                                    <div className="bg-white dark:bg-gray-800 text-accent dark:text-white p-2.5 rounded-full shadow-lg transform group-hover:translate-x-1 group-hover:bg-accent group-hover:text-white dark:group-hover:bg-gray-700 transition-all duration-300">
                                        <ArrowRight size={20} strokeWidth={3} />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </GlassCard>

                    <button onClick={showLogin} className="mt-6 text-text-muted hover:text-text-primary transition">
                        ¿Ya tienes cuenta? Inicia sesión
                    </button>
                </div>
            </div>

            {/* MODAL DE INFORMACIÓN DEL TEST */}
            {showInfoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
                    <div className="absolute inset-0" onClick={() => setShowInfoModal(false)} />
                    <GlassCard className="w-full max-w-sm p-6 relative z-10 animate-[slide-up_0.3s_ease-out] border border-accent/20 shadow-2xl shadow-accent/10">
                        <button 
                            onClick={() => setShowInfoModal(false)}
                            className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors p-1 hover:bg-bg-secondary rounded-full"
                        >
                            <X size={24} />
                        </button>
                        
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4 ring-2 ring-accent/20">
                                <Sparkles className="text-accent" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">¿Qué es el Test Interactivo?</h3>
                        </div>

                        <div className="space-y-4 mb-8">
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Es una herramienta inteligente diseñada para crear tu perfil de fitness perfecto en cuestión de segundos.
                            </p>
                            
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 text-left">
                                    <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                                    <span className="text-sm text-text-primary">Rutina de entrenamiento personalizada.</span>
                                </div>
                                <div className="flex items-start gap-3 text-left">
                                    <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                                    <span className="text-sm text-text-primary">Cálculo de macros y calorías exactas.</span>
                                </div>
                                <div className="flex items-start gap-3 text-left">
                                    <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                                    <span className="text-sm text-text-primary">Adaptado a tu nivel y equipamiento.</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => { setShowInfoModal(false); setShowQuiz(true); }}
                            className="w-full bg-accent text-bg-secondary py-3.5 rounded-xl font-bold shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <Sparkles size={18} />
                            ¡Comenzar Test Gratis!
                        </button>
                    </GlassCard>
                </div>
            )}

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