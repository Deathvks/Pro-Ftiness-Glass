/* frontend/src/pages/RegisterScreen.jsx */
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Info, X, CheckCircle2, Dumbbell, Flame, TrendingUp, Target } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
// --- INICIO MODIFICACIÓN: Añadido FaSpotify ---
import { FaDiscord, FaFacebook, FaGithub, FaSpotify } from 'react-icons/fa';
// --- FIN MODIFICACIÓN ---
import { FaXTwitter } from 'react-icons/fa6'; // Icono moderno de X
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

const SplitLayout = ({ children, onShowPolicy }) => (
    // Contenedor principal que ocupa exactamente la pantalla, sin scroll general
    <div className="flex flex-col lg:flex-row w-full h-[100dvh] bg-bg-primary overflow-hidden">
        
        {/* Panel Izquierdo - Fijo en PC, ocupa toda su altura */}
        <div className="hidden lg:flex flex-col justify-center items-center w-[30%] h-full relative bg-bg-secondary border-r border-glass-border p-8 overflow-hidden z-20 shrink-0">
            {/* Fondo de cuadrícula arquitectónica */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            {/* Orbes de luz animadas y vibrantes */}
            <div className="absolute top-1/4 -left-10 w-48 h-48 bg-accent/30 rounded-full mix-blend-screen filter blur-[60px] animate-[pulse_4s_ease-in-out_infinite]"></div>
            <div className="absolute bottom-10 -right-10 w-64 h-64 bg-[#3b82f6]/20 rounded-full mix-blend-screen filter blur-[80px] animate-[pulse_5s_ease-in-out_infinite]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-[#a855f7]/20 rounded-full mix-blend-screen filter blur-[80px] animate-[pulse_6s_ease-in-out_infinite]"></div>

            <div className="relative z-10 w-full max-w-[400px] flex flex-col items-center">
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-accent mb-4 text-center tracking-tight drop-shadow-sm">
                    Pro Fitness Glass
                </h2>
                
                {/* Etiqueta Gratis y Sin Anuncios con borde suave */}
                <div className="mb-8 w-full flex justify-center">
                    <div className="bg-bg-secondary/40 border border-glass-border px-6 py-2.5 rounded-2xl shadow-sm backdrop-blur-md flex items-center justify-center gap-2 whitespace-nowrap transition-transform hover:scale-105 cursor-default">
                        <Sparkles className="text-accent flex-shrink-0 animate-pulse" size={20} />
                        <span className="text-sm font-black bg-gradient-to-r from-accent via-[#a855f7] to-[#3b82f6] text-transparent bg-clip-text uppercase tracking-widest">
                            100% Gratis y Sin Anuncios
                        </span>
                    </div>
                </div>

                <p className="text-text-secondary text-sm text-center mb-10 font-medium">
                    Descubre la única aplicación que necesitas para transformar tu cuerpo y alcanzar tu mejor versión.
                </p>
                
                {/* Grid Sólido (Bento Box) */}
                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-bg-primary/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-glass-border border-t-4 border-t-accent transition-all duration-500 hover:-translate-y-2 hover:shadow-accent/20 hover:shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent/20 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150"></div>
                        <div className="bg-accent/20 p-2.5 rounded-xl text-accent inline-flex mb-3 relative z-10 transform transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"><Dumbbell size={20} /></div>
                        <h3 className="text-sm font-bold text-text-primary mb-1 relative z-10">Rompe Récords</h3>
                        <p className="text-xs text-text-secondary font-medium relative z-10">Deja las excusas y supera tus límites en cada sesión.</p>
                    </div>

                    <div className="bg-bg-primary/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-glass-border border-t-4 border-t-[#3b82f6] transition-all duration-500 hover:-translate-y-2 hover:shadow-[#3b82f6]/20 hover:shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#3b82f6]/20 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150"></div>
                        <div className="bg-[#3b82f6]/20 p-2.5 rounded-xl text-[#3b82f6] inline-flex mb-3 relative z-10 transform transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110"><Flame size={20} /></div>
                        <h3 className="text-sm font-bold text-text-primary mb-1 relative z-10">Nutrición Exacta</h3>
                        <p className="text-xs text-text-secondary font-medium relative z-10">Domina tu dieta y calcula tus macros sin complicaciones.</p>
                    </div>

                    <div className="bg-bg-primary/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-glass-border border-t-4 border-t-[#10b981] transition-all duration-500 hover:-translate-y-2 hover:shadow-[#10b981]/20 hover:shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#10b981]/20 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150"></div>
                        <div className="bg-[#10b981]/20 p-2.5 rounded-xl text-[#10b981] inline-flex mb-3 relative z-10 transform transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"><TrendingUp size={20} /></div>
                        <h3 className="text-sm font-bold text-text-primary mb-1 relative z-10">Progreso Real</h3>
                        <p className="text-xs text-text-secondary font-medium relative z-10">Gráficos detallados y mapas musculares de tu evolución.</p>
                    </div>

                    <div className="bg-bg-primary/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-glass-border border-t-4 border-t-[#a855f7] transition-all duration-500 hover:-translate-y-2 hover:shadow-[#a855f7]/20 hover:shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#a855f7]/20 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150"></div>
                        <div className="bg-[#a855f7]/20 p-2.5 rounded-xl text-[#a855f7] inline-flex mb-3 relative z-10 transform transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110"><Target size={20} /></div>
                        <h3 className="text-sm font-bold text-text-primary mb-1 relative z-10">Coach IA Integrado</h3>
                        <p className="text-xs text-text-secondary font-medium relative z-10">Tu asistente personal 24/7 para crear planes y resolver dudas.</p>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Panel Derecho - Scroll propio independiente y garantizado */}
        <div className="w-full lg:w-[70%] h-full overflow-y-auto relative z-10 custom-scrollbar bg-bg-primary">
            <div className="absolute inset-0 lg:hidden bg-gradient-to-b from-accent/5 to-transparent pointer-events-none min-h-full"></div>
            
            {/* Contenedor interno que asegura el centrado perfecto sin recortar */}
            <div className="flex flex-col items-center min-h-full w-full px-4">
                
                {/* Espaciador superior dinámico */}
                <div className="flex-grow shrink-0 h-8 sm:h-12"></div>

                <div className="w-full max-w-sm text-center relative z-10 shrink-0 animate-[fade-in_0.5s_ease-out]">
                    {children}
                    
                    {/* Enlaces de Privacidad y Términos */}
                    <div className="mt-8 text-xs text-text-muted px-2 pb-6">
                        Al registrarte, aceptas nuestros{' '}
                        <a href="/terms" className="text-accent hover:underline transition-all">Términos de Servicio</a>
                        {' '}y nuestra{' '}
                        <button onClick={onShowPolicy} className="text-accent hover:underline transition-all">Política de Privacidad</button>.
                    </div>
                </div>

                {/* Espaciador inferior dinámico */}
                <div className="flex-grow shrink-0 h-8 sm:h-12"></div>

            </div>
        </div>
    </div>
);

const RegisterScreen = ({ showLogin }) => {
    const handleGoogleLogin = useAppStore(state => state.handleGoogleLogin);
    const handleDiscordLogin = useAppStore(state => state.handleDiscordLogin);
    const handleFacebookLogin = useAppStore(state => state.handleFacebookLogin);
    const handleXLogin = useAppStore(state => state.handleXLogin);
    const handleGithubLogin = useAppStore(state => state.handleGithubLogin);
    // --- INICIO MODIFICACIÓN: Añadido handleSpotifyLogin ---
    const handleSpotifyLogin = useAppStore(state => state.handleSpotifyLogin);
    // --- FIN MODIFICACIÓN ---
    const fetchInitialData = useAppStore(state => state.fetchInitialData);
    
    const location = useLocation();
    
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizData, setQuizData] = useState(location.state?.prefilledData || null);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    
    const [showInfoModal, setShowInfoModal] = useState(false);
    
    const { addToast } = useToast();

    const [showGoogleModal, setShowGoogleModal] = useState(false);
    const [showPolicy, setShowPolicy] = useState(false);
    const [hasConsented, setHasConsented] = useState(false);

    useEffect(() => {
        initGoogleAuth();
    }, []);

    useEffect(() => {
        const checkConsent = () => {
            const consent = localStorage.getItem('cookie_consent');
            setHasConsented(consent === 'accepted');
        };
        checkConsent();
        window.addEventListener('storage', checkConsent);
        return () => window.removeEventListener('storage', checkConsent);
    }, []);

    useEffect(() => {
        // 1. Manejo de Implicit Flow (Hash) para Discord y Facebook
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
            const params = new URLSearchParams(hash.substring(1));
            const token = params.get('access_token');
            const state = params.get('state');

            if (token) {
                if (state === 'facebook') {
                    processFacebookToken(token);
                } else {
                    processDiscordToken(token);
                }
                window.history.replaceState(null, null, window.location.pathname + window.location.search);
            }
        }

        // 2. Manejo de Authorization Code Flow (Search params) para X, GitHub y Spotify
        const search = window.location.search;
        if (search && search.includes('code=')) {
            const params = new URLSearchParams(search);
            const code = params.get('code');
            const state = params.get('state');
            
            if (code) {
                if (state === 'x') {
                    processXToken(code);
                    window.history.replaceState(null, null, window.location.pathname);
                }
                else if (state === 'github') {
                    processGithubCode(code);
                    window.history.replaceState(null, null, window.location.pathname);
                }
                // --- INICIO MODIFICACIÓN: Proceso del code para Spotify ---
                else if (state === 'spotify') {
                    processSpotifyCode(code);
                    window.history.replaceState(null, null, window.location.pathname);
                }
                // --- FIN MODIFICACIÓN ---
            }
        }
    }, []);

    const handleQuizFinish = (data) => {
        setQuizData(data);
        setShowQuiz(false); 
    };

    // --- Lógica PKCE para X (Twitter) ---
    const generateCodeVerifier = () => {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        let verifier = '';
        const randomValues = new Uint8Array(64);
        window.crypto.getRandomValues(randomValues);
        for (let i = 0; i < randomValues.length; i++) {
            verifier += charset[randomValues[i] % charset.length];
        }
        return verifier;
    };

    const generateCodeChallenge = async (verifier) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        let binary = '';
        const bytes = new Uint8Array(digest);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    const handleXClick = async () => {
        const X_CLIENT_ID = import.meta.env.VITE_X_CLIENT_ID || 'TU_X_CLIENT_ID';
        const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
        
        const verifier = generateCodeVerifier();
        sessionStorage.setItem('x_code_verifier', verifier);
        
        const challenge = await generateCodeChallenge(verifier);
        
        const xAuthUrl = `https://x.com/i/oauth2/authorize?response_type=code&client_id=${X_CLIENT_ID}&redirect_uri=${redirectUri}&scope=tweet.read%20users.read&state=x&code_challenge=${challenge}&code_challenge_method=S256`;
        window.location.href = xAuthUrl;
    };

    const processXToken = async (code) => {
        setIsLoading(true);
        setErrors({});
        try {
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_step');

            if (quizData) {
                localStorage.setItem('temp_onboarding_data', JSON.stringify(quizData));
            } else {
                localStorage.removeItem('temp_onboarding_data');
            }

            const redirectUri = window.location.origin + window.location.pathname;
            const codeVerifier = sessionStorage.getItem('x_code_verifier');
            
            if (!codeVerifier) {
                throw new Error("No se encontró el verificador de seguridad.");
            }

            if (handleXLogin) {
                await handleXLogin({ code, redirectUri, codeVerifier });
                sessionStorage.removeItem('x_code_verifier');
            } else {
                throw new Error("Error de configuración interna.");
            }
        } catch (err) {
            const msg = err.message || 'Error con X.';
            addToast(msg, 'error');
            setErrors({ api: msg });
            setIsLoading(false);
        }
    };
    // -------------------------------------

    const handleGithubClick = () => {
        const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'TU_GITHUB_CLIENT_ID';
        const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email&state=github`;
        window.location.href = githubAuthUrl;
    };

    const processGithubCode = async (code) => {
        setIsLoading(true);
        setErrors({});
        try {
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_step');

            if (quizData) {
                localStorage.setItem('temp_onboarding_data', JSON.stringify(quizData));
            } else {
                localStorage.removeItem('temp_onboarding_data');
            }

            if (handleGithubLogin) {
                await handleGithubLogin(code);
            } else {
                throw new Error("Error de configuración interna.");
            }
        } catch (err) {
            const msg = err.message || 'Error con GitHub.';
            addToast(msg, 'error');
            setErrors({ api: msg });
            setIsLoading(false);
        }
    };

    // --- INICIO DE LA MODIFICACIÓN: Integración Spotify ---
    const handleSpotifyClick = () => {
        const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'TU_SPOTIFY_CLIENT_ID';
        const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
        // Generamos la URL oficial de autenticación de Spotify OAuth 2.0
        const spotifyAuthUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user-read-email%20user-read-private&state=spotify`;
        window.location.href = spotifyAuthUrl;
    };

    const processSpotifyCode = async (code) => {
        setIsLoading(true);
        setErrors({});
        try {
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_step');

            if (quizData) {
                localStorage.setItem('temp_onboarding_data', JSON.stringify(quizData));
            } else {
                localStorage.removeItem('temp_onboarding_data');
            }

            const redirectUri = window.location.origin + window.location.pathname;
            
            if (handleSpotifyLogin) {
                await handleSpotifyLogin({ code, redirectUri });
            } else {
                throw new Error("Error de configuración interna.");
            }
        } catch (err) {
            const msg = err.message || 'Error con Spotify.';
            addToast(msg, 'error');
            setErrors({ api: msg });
            setIsLoading(false);
        }
    };
    // --- FIN DE LA MODIFICACIÓN ---

    const processFacebookToken = async (token) => {
        setIsLoading(true);
        setErrors({});
        try {
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_step');

            if (quizData) {
                localStorage.setItem('temp_onboarding_data', JSON.stringify(quizData));
            } else {
                localStorage.removeItem('temp_onboarding_data');
            }

            if (handleFacebookLogin) {
                await handleFacebookLogin(token);
            } else {
                throw new Error("Error de configuración interna.");
            }
        } catch (err) {
            const msg = err.message || 'Error con Facebook.';
            addToast(msg, 'error');
            setErrors({ api: msg });
            setIsLoading(false);
        }
    };

    const handleFacebookClick = () => {
        const FACEBOOK_CLIENT_ID = import.meta.env.VITE_FACEBOOK_CLIENT_ID || 'TU_FACEBOOK_CLIENT_ID';
        const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
        const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=email,public_profile&state=facebook`;
        window.location.href = facebookAuthUrl;
    };

    const processDiscordToken = async (token) => {
        setIsLoading(true);
        setErrors({});
        try {
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_step');

            if (quizData) {
                localStorage.setItem('temp_onboarding_data', JSON.stringify(quizData));
            } else {
                localStorage.removeItem('temp_onboarding_data');
            }

            if (handleDiscordLogin) {
                await handleDiscordLogin(token);
            } else {
                throw new Error("Error de configuración interna.");
            }
        } catch (err) {
            const msg = err.message || 'Error con Discord.';
            addToast(msg, 'error');
            setErrors({ api: msg });
            setIsLoading(false);
        }
    };

    const handleDiscordClick = () => {
        const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID || 'TU_DISCORD_CLIENT_ID';
        const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
        const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=identify%20email&state=discord`;
        window.location.href = discordAuthUrl;
    };

    const processGoogleToken = async (token) => {
        setShowGoogleModal(false);
        setIsLoading(true);
        setErrors({});
        try {
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

    if (showQuiz) {
        return <EmotionalOnboarding onFinish={handleQuizFinish} onBack={() => setShowQuiz(false)} />;
    }

    if (showVerification) {
        return (
            <>
                <SEOHead title="Verificar Email - Pro Fitness Glass" route="register/verify" noIndex={true} />
                <EmailVerification email={registeredEmail} onBack={handleBackToRegister} onSuccess={handleVerificationSuccess} />
            </>
        );
    }

    if (showPolicy) {
        return <PrivacyPolicy onBack={() => setShowPolicy(false)} />;
    }

    return (
        <>
            <SEOHead title="Registrarse - Pro Fitness Glass" description="Crea tu cuenta gratis en Pro Fitness Glass." route="register" />

            <SplitLayout onShowPolicy={() => setShowPolicy(true)}>
                <img src="/logo.webp" alt="Pro Fitness Glass Logo" className="w-20 h-20 mx-auto mb-3 object-contain drop-shadow-md transition-transform duration-500 hover:scale-105" />

                {/* Etiqueta Gratis en Móvil */}
                <div className="flex justify-center w-full mb-4 mt-1 lg:hidden">
                    <div className="bg-bg-secondary/40 border border-glass-border px-4 py-1.5 rounded-xl shadow-sm backdrop-blur-md flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <Sparkles className="text-accent animate-pulse flex-shrink-0" size={14} />
                        <span className="text-xs sm:text-sm font-black bg-gradient-to-r from-accent via-[#a855f7] to-[#3b82f6] text-transparent bg-clip-text uppercase tracking-wide">
                            100% Gratis y Sin Anuncios
                        </span>
                    </div>
                </div>

                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-text-primary mb-1 hidden lg:block">Crea tu cuenta</h1>
                    <h1 className="text-3xl font-extrabold text-text-primary mb-1 lg:hidden">Pro Fitness Glass</h1>
                    <p className="text-text-secondary text-sm">Empieza tu transformación hoy mismo.</p>
                </div>

                <GlassCard className="p-6 sm:p-8 relative shadow-2xl mb-4">
                    <form onSubmit={handleRegister} className="flex flex-col gap-4" noValidate>
                        {errors.api && <p className="text-center text-red text-sm">{errors.api}</p>}

                        <div>
                            <input
                                type="text"
                                placeholder="Nombre de usuario"
                                className="w-full bg-bg-secondary border border-glass-border rounded-lg px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition text-sm font-medium"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                maxLength={30}
                            />
                            {errors.username && <p className="form-error-text text-left text-xs mt-1.5 font-medium">{errors.username}</p>}
                        </div>

                        <div>
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full bg-bg-secondary border border-glass-border rounded-lg px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition text-sm font-medium"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {errors.email && <p className="form-error-text text-left text-xs mt-1.5 font-medium">{errors.email}</p>}
                        </div>

                        <div>
                            <input
                                type="password"
                                placeholder="Contraseña"
                                className="w-full bg-bg-secondary border border-glass-border rounded-lg px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition text-sm font-medium"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {errors.password && <p className="form-error-text text-left text-xs mt-1.5 font-medium">{errors.password}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center justify-center w-full rounded-lg bg-accent text-bg-secondary font-bold py-3 transition-transform hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm mt-2"
                        >
                            {isLoading ? <Spinner /> : 'Registrarse'}
                        </button>
                    </form>

                    <div className="relative flex py-5 items-center">
                        <div className="flex-grow border-t border-glass-border"></div>
                        <span className="flex-shrink-0 mx-4 text-text-muted text-xs font-semibold uppercase tracking-wider">O regístrate con</span>
                        <div className="flex-grow border-t border-glass-border"></div>
                    </div>

                    {/* Fila Horizontal de Iconos Sociales - Tamaño reducido */}
                    <div className="flex flex-row justify-center items-center gap-3 flex-wrap">
                        <button
                            onClick={handleGoogleClick}
                            disabled={isLoading}
                            type="button"
                            title="Registrarse con Google"
                            className="w-10 h-10 bg-bg-secondary border border-glass-border text-text-primary rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-110 hover:bg-bg-primary active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <FcGoogle size={20} />
                        </button>

                        <button
                            onClick={handleDiscordClick}
                            disabled={isLoading}
                            type="button"
                            title="Registrarse con Discord"
                            className="w-10 h-10 bg-[#5865F2] text-white rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-110 hover:shadow-lg hover:shadow-[#5865F2]/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <FaDiscord size={20} />
                        </button>
                        
                        {/* <button
                            onClick={handleFacebookClick}
                            disabled={isLoading}
                            type="button"
                            title="Registrarse con Facebook"
                            className="w-10 h-10 bg-[#1877F2] text-white rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-110 hover:shadow-lg hover:shadow-[#1877F2]/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <FaFacebook size={20} />
                        </button>
                        */}

                        <button
                            onClick={handleXClick}
                            disabled={isLoading}
                            type="button"
                            title="Registrarse con X (Twitter)"
                            className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-110 hover:shadow-lg hover:shadow-black/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <FaXTwitter size={18} />
                        </button>

                        <button
                            onClick={handleGithubClick}
                            disabled={isLoading}
                            type="button"
                            title="Registrarse con GitHub"
                            className="w-10 h-10 bg-[#333] dark:bg-white text-white dark:text-[#333] rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-110 hover:shadow-lg hover:shadow-gray-500/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <FaGithub size={20} />
                        </button>

                        {/* --- INICIO DE LA MODIFICACIÓN: Botón Spotify --- */}
                        {/* <button
                            onClick={handleSpotifyClick}
                            disabled={isLoading}
                            type="button"
                            title="Registrarse con Spotify"
                            className="w-10 h-10 bg-[#1DB954] text-white rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-110 hover:shadow-lg hover:shadow-[#1DB954]/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <FaSpotify size={20} />
                        </button>
                        */}
                        {/* --- FIN DE LA MODIFICACIÓN --- */}
                    </div>

                    <div 
                        onClick={() => setShowQuiz(true)}
                        className="mt-6 relative group overflow-hidden rounded-xl cursor-pointer shadow-lg transform transition-all duration-300 hover:scale-[1.03] hover:shadow-accent/40 border-2 border-transparent hover:border-accent/30"
                    >
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-30 pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-br from-accent to-purple-700 dark:from-gray-900 dark:to-black opacity-90 dark:opacity-85 z-10 transition-opacity" />
                        <img 
                            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80" 
                            alt="Fitness Background"
                            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 dark:opacity-40 z-0 transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="relative z-20 p-3 flex items-center justify-between">
                            <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="bg-white/20 dark:bg-gray-800/60 p-1.5 rounded-lg backdrop-blur-sm shadow-sm ring-1 ring-white/10 group-hover:ring-accent/50 transition-all">
                                        <Sparkles size={14} className="text-yellow-300 animate-pulse" />
                                    </span>
                                    <span className="font-bold text-white text-xs tracking-wide drop-shadow-md">
                                        TEST INTERACTIVO
                                    </span>
                                </div>
                                <p className="text-[10px] text-white/90 text-left max-w-[180px] leading-tight font-medium drop-shadow-sm pl-1">
                                    Tu plan ideal en &lt; 2 min.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                 <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowInfoModal(true);
                                    }}
                                    className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
                                    title="Más información"
                                 >
                                    <Info size={16} />
                                 </button>
                                <div className="bg-white dark:bg-gray-800 text-accent dark:text-white p-2 rounded-full shadow-lg transform group-hover:translate-x-1 group-hover:bg-accent group-hover:text-white dark:group-hover:bg-gray-700 transition-all duration-300">
                                    <ArrowRight size={16} strokeWidth={3} />
                                </div>
                            </div>
                        </div>
                    </div>

                </GlassCard>

                <button onClick={showLogin} className="text-sm font-medium text-text-secondary hover:text-accent transition-colors">
                    ¿Ya tienes cuenta? Inicia sesión
                </button>
            </SplitLayout>

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
                            {/* Círculo garantizado de color accent usando ring y color de fondo en lugar de solo opacidad */}
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 ring-2 ring-accent/30 bg-accent/10">
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
                                    <span className="text-sm text-text-primary font-medium">Rutina de entrenamiento personalizada.</span>
                                </div>
                                <div className="flex items-start gap-3 text-left">
                                    <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                                    <span className="text-sm text-text-primary font-medium">Cálculo de macros y calorías exactas.</span>
                                </div>
                                <div className="flex items-start gap-3 text-left">
                                    <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                                    <span className="text-sm text-text-primary font-medium">Adaptado a tu nivel y equipamiento.</span>
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