/* frontend/src/pages/LoginScreen.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { LogIn, ArrowLeft, Smartphone, Mail, Dumbbell, Flame, TrendingUp, Sparkles } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaDiscord, FaFacebook, FaGithub, FaSpotify } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import GoogleTermsModal from '../components/GoogleTermsModal';
import PrivacyPolicy from './PrivacyPolicy';
import { useGoogleLogin } from '@react-oauth/google';
import { resend2FACode, initGoogleAuth, signInWithGoogle } from '../services/authService';
import SEOHead from '../components/SEOHead';
import { Capacitor } from '@capacitor/core';
import { useLocation } from 'react-router-dom';

const SplitLayout = ({ children, onShowPolicy }) => (
    <div className="flex flex-col lg:flex-row w-full h-[100dvh] bg-bg-primary overflow-hidden">
        
        {/* Panel Izquierdo (PC) */}
        <div className="hidden lg:flex flex-col justify-center items-center w-[30%] h-full relative border-r border-glass-border p-8 overflow-hidden shrink-0 bg-bg-primary">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

            <div className="absolute top-1/4 -left-10 w-48 h-48 bg-accent/30 rounded-full mix-blend-screen filter blur-[60px] animate-[pulse_4s_ease-in-out_infinite]"></div>
            <div className="absolute bottom-10 -right-10 w-64 h-64 bg-[#3b82f6]/20 rounded-full mix-blend-screen filter blur-[80px] animate-[pulse_5s_ease-in-out_infinite]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-[#a855f7]/20 rounded-full mix-blend-screen filter blur-[80px] animate-[pulse_6s_ease-in-out_infinite]"></div>

            <div className="relative z-10 w-full max-w-[400px] flex flex-col items-center">
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-accent mb-4 text-center tracking-tight drop-shadow-sm">Pro Fitness Glass</h2>

                <div className="mb-8 w-full flex justify-center">
                    <div className="glass px-6 py-2.5 rounded-full shadow-sm flex items-center justify-center gap-2 whitespace-nowrap transition-transform hover:scale-105 cursor-default">
                        <Sparkles className="text-accent flex-shrink-0 animate-pulse" size={20} />
                        <span className="text-sm font-black bg-gradient-to-r from-accent via-[#a855f7] to-[#3b82f6] text-transparent bg-clip-text uppercase tracking-widest">
                            Gratis y Sin Anuncios
                        </span>
                    </div>
                </div>

                <p className="text-text-secondary text-sm text-center mb-10 font-medium">Tu ecosistema definitivo para transformar tu físico, impulsado por datos reales.</p>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="glass rounded-[24px] p-5 shadow-xl border-t-4 border-t-accent transition-all duration-500 hover:-translate-y-2 hover:shadow-accent/20 hover:shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent/20 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150"></div>
                        <div className="bg-accent/20 p-3 rounded-[16px] text-accent inline-flex mb-3 relative z-10 transform transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"><Dumbbell size={20} /></div>
                        <h3 className="text-sm font-bold text-text-primary mb-1 relative z-10">Entrenamientos</h3>
                        <p className="text-xs text-text-secondary font-medium relative z-10">Crea y registra rutinas con precisión.</p>
                    </div>

                    <div className="glass rounded-[24px] p-5 shadow-xl border-t-4 border-t-[#3b82f6] transition-all duration-500 hover:-translate-y-2 hover:shadow-[#3b82f6]/20 hover:shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#3b82f6]/20 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150"></div>
                        <div className="bg-[#3b82f6]/20 p-3 rounded-[16px] text-[#3b82f6] inline-flex mb-3 relative z-10 transform transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110"><Flame size={20} /></div>
                        <h3 className="text-sm font-bold text-text-primary mb-1 relative z-10">Nutrición</h3>
                        <p className="text-xs text-text-secondary font-medium relative z-10">Controla macros y calorías diarias.</p>
                    </div>

                    <div className="glass rounded-[24px] p-5 shadow-xl border-t-4 border-t-[#10b981] transition-all duration-500 hover:-translate-y-2 hover:shadow-[#10b981]/20 hover:shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#10b981]/20 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150"></div>
                        <div className="bg-[#10b981]/20 p-3 rounded-[16px] text-[#10b981] inline-flex mb-3 relative z-10 transform transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"><TrendingUp size={20} /></div>
                        <h3 className="text-sm font-bold text-text-primary mb-1 relative z-10">Progreso</h3>
                        <p className="text-xs text-text-secondary font-medium relative z-10">Visualiza tu evolución al detalle.</p>
                    </div>

                    <div className="glass rounded-[24px] p-5 shadow-xl border-t-4 border-t-[#a855f7] transition-all duration-500 hover:-translate-y-2 hover:shadow-[#a855f7]/20 hover:shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#a855f7]/20 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150"></div>
                        <div className="bg-[#a855f7]/20 p-3 rounded-[16px] text-[#a855f7] inline-flex mb-3 relative z-10 transform transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110"><Sparkles size={20} /></div>
                        <h3 className="text-sm font-bold text-text-primary mb-1 relative z-10">Inteligencia IA</h3>
                        <p className="text-xs text-text-secondary font-medium relative z-10">Asistencia y planes personalizados.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Panel Derecho (Móvil y PC) - Scroll propio con gestión de áreas seguras */}
        <div className="flex-1 w-full lg:w-[70%] h-full overflow-y-auto relative z-10 bg-bg-primary custom-scrollbar">
            <div className="absolute inset-0 lg:hidden bg-gradient-to-b from-accent/5 to-transparent pointer-events-none min-h-[100dvh]"></div>

            {/* Contenedor que centra con my-auto si sobra espacio, y baja el padding superior por debajo del Notch de iOS */}
            <div 
                className="flex flex-col min-h-full w-full px-4 sm:px-6 lg:px-8"
                style={{ 
                    paddingTop: 'calc(1.5rem + env(safe-area-inset-top, 24px))', 
                    paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 24px))' 
                }}
            >
                <div className="my-auto mx-auto w-full max-w-md text-center relative z-10 animate-[fade-in_0.5s_ease-out] py-4">
                    {children}

                    <div className="mt-6 sm:mt-8 text-xs text-text-muted px-2">
                        Al continuar, aceptas nuestros{' '}
                        <a href="/terms" className="text-accent hover:underline transition-all">Términos de Servicio</a>
                        {' '}y nuestra{' '}
                        <button onClick={onShowPolicy} className="text-accent hover:underline transition-all">Política de Privacidad</button>.
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const LoginScreen = ({ showRegister, showForgotPassword }) => {
    const handleLogin = useAppStore(state => state.handleLogin);
    const handleGoogleLogin = useAppStore(state => state.handleGoogleLogin);
    const handleDiscordLogin = useAppStore(state => state.handleDiscordLogin);
    const handleFacebookLogin = useAppStore(state => state.handleFacebookLogin);
    const handleXLogin = useAppStore(state => state.handleXLogin);
    const handleGithubLogin = useAppStore(state => state.handleGithubLogin);
    const handleSpotifyLogin = useAppStore(state => state.handleSpotifyLogin);

    const twoFactorPending = useAppStore(state => state.twoFactorPending);
    const handleVerify2FA = useAppStore(state => state.handleVerify2FA);
    const cancelTwoFactor = useAppStore(state => state.cancelTwoFactor);

    const { addToast } = useToast();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    const [otp, setOtp] = useState(new Array(6).fill(""));
    const inputRefs = useRef([]);

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

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

    // 🔴 CAPTURAR CÓDIGO REFERIDO DESDE URL
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const ref = searchParams.get('ref');
        if (ref) {
            localStorage.setItem('pending_ref', ref);
        }
    }, [location.search]);

    useEffect(() => {
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
                else if (state === 'spotify') {
                    processSpotifyCode(code);
                    window.history.replaceState(null, null, window.location.pathname);
                }
            }
        }
    }, []);

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
            localStorage.removeItem('temp_onboarding_data');
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_step');

            const redirectUri = window.location.origin + window.location.pathname;
            const codeVerifier = sessionStorage.getItem('x_code_verifier');
            const currentRef = localStorage.getItem('pending_ref');

            if (!codeVerifier) {
                throw new Error("No se encontró el verificador de seguridad.");
            }

            await handleXLogin({ code, redirectUri, codeVerifier, referralCode: currentRef });
            sessionStorage.removeItem('x_code_verifier');
            localStorage.removeItem('pending_ref');
            setIsLoading(false);
        } catch (err) {
            const msg = err.message || 'Error con X.';
            addToast(msg, 'error');
            setErrors({ api: msg });
            setIsLoading(false);
        }
    };

    const processFacebookToken = async (token) => {
        setIsLoading(true);
        setErrors({});
        try {
            localStorage.removeItem('temp_onboarding_data');
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_step');

            const currentRef = localStorage.getItem('pending_ref');
            await handleFacebookLogin({ token, referralCode: currentRef });
            localStorage.removeItem('pending_ref');
            setIsLoading(false);
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
            localStorage.removeItem('temp_onboarding_data');
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_step');

            const currentRef = localStorage.getItem('pending_ref');
            await handleGithubLogin({ code, referralCode: currentRef });
            localStorage.removeItem('pending_ref');
            setIsLoading(false);
        } catch (err) {
            const msg = err.message || 'Error con GitHub.';
            addToast(msg, 'error');
            setErrors({ api: msg });
            setIsLoading(false);
        }
    };

    const handleSpotifyClick = () => {
        const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'TU_SPOTIFY_CLIENT_ID';
        const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
        const spotifyAuthUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user-read-email%20user-read-private&state=spotify`;
        window.location.href = spotifyAuthUrl;
    };

    const processSpotifyCode = async (code) => {
        setIsLoading(true);
        setErrors({});
        try {
            localStorage.removeItem('temp_onboarding_data');
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_step');

            const redirectUri = window.location.origin + window.location.pathname;
            const currentRef = localStorage.getItem('pending_ref');

            await handleSpotifyLogin({ code, redirectUri, referralCode: currentRef });
            localStorage.removeItem('pending_ref');
            setIsLoading(false);
        } catch (err) {
            const msg = err.message || 'Error con Spotify.';
            addToast(msg, 'error');
            setErrors({ api: msg });
            setIsLoading(false);
        }
    };

    const processDiscordToken = async (token) => {
        setIsLoading(true);
        setErrors({});
        try {
            localStorage.removeItem('temp_onboarding_data');
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_step');

            const currentRef = localStorage.getItem('pending_ref');
            await handleDiscordLogin({ token, referralCode: currentRef });
            localStorage.removeItem('pending_ref');
            setIsLoading(false);
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
            localStorage.removeItem('temp_onboarding_data');
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_step');

            const currentRef = localStorage.getItem('pending_ref');
            await handleGoogleLogin({ token, referralCode: currentRef });
            localStorage.removeItem('pending_ref');
            setIsLoading(false);
        } catch (err) {
            const msg = err.message || 'Error con Google.';
            addToast(msg, 'error');
            setErrors({ api: msg });
            setIsLoading(false);
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: (tokenResponse) => processGoogleToken(tokenResponse.access_token),
        onError: () => { addToast('No se pudo conectar con Google.', 'error'); },
    });

    const handleGoogleClick = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                const user = await signInWithGoogle();
                const token = user.authentication?.idToken;

                if (token) {
                    await processGoogleToken(token);
                }
            } catch (error) {
                // Silenciado
            }
        } else {
            if (hasConsented) {
                loginWithGoogle();
            } else {
                setShowGoogleModal(true);
            }
        }
    };

    const onModalSuccess = (tokenResponse) => {
        if (tokenResponse.access_token) {
            processGoogleToken(tokenResponse.access_token);
        } else if (tokenResponse.credential) { // Respaldo por si acaso
            processGoogleToken(tokenResponse.credential);
        }
    };

    const onModalError = () => {
        setShowGoogleModal(false);
        addToast('No se pudo conectar con Google.', 'error');
    };

    useEffect(() => {
        if (twoFactorPending && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [twoFactorPending]);

    useEffect(() => {
        if (verificationCode === '') {
            setOtp(new Array(6).fill(""));
            if (inputRefs.current[0]) inputRefs.current[0].focus();
        }
    }, [verificationCode]);

    const validateForm = () => {
        const newErrors = {};
        if (!email.trim()) newErrors.email = 'El email es requerido.';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Formato inválido.';
        if (!password) newErrors.password = 'La contraseña es requerida.';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }
        setErrors({});
        setIsLoading(true);
        try {
            localStorage.removeItem('temp_onboarding_data');
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_step');
            
            // Si hace un login normal con su cuenta correctamente, podemos borrar el ref
            localStorage.removeItem('pending_ref');

            await handleLogin({ email, password });
            setIsLoading(false);
        } catch (err) {
            const errorMessage = err.message || 'Error al iniciar sesión.';
            addToast(errorMessage, 'error');
            setErrors({ api: errorMessage });
            setPassword('');
            setIsLoading(false);
        }
    };

    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return false;
        const newOtp = [...otp];
        newOtp[index] = element.value.substring(element.value.length - 1);
        setOtp(newOtp);
        setVerificationCode(newOtp.join(""));
        if (element.value && index < 5) inputRefs.current[index + 1].focus();
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData("text");
        if (!data) return;
        const numbers = data.replace(/\D/g, '').slice(0, 6).split("");
        if (numbers.length === 0) return;
        const newOtp = [...otp];
        numbers.forEach((num, i) => { if (i < 6) newOtp[i] = num; });
        setOtp(newOtp);
        setVerificationCode(newOtp.join(""));
        const nextIndex = Math.min(numbers.length, 5);
        if (inputRefs.current[nextIndex]) inputRefs.current[nextIndex].focus();
    };

    const handle2FASubmit = async (e) => {
        e.preventDefault();
        if (!verificationCode.trim() || verificationCode.length < 6) {
            setErrors({ code: 'Introduce el código completo.' });
            return;
        }
        setIsLoading(true);
        setErrors({});
        try {
            const payload = {
                userId: twoFactorPending.userId,
                method: twoFactorPending.method,
                token: twoFactorPending.method === 'app' ? verificationCode : undefined,
                code: twoFactorPending.method === 'email' ? verificationCode : undefined,
            };
            await handleVerify2FA(payload);
        } catch (err) {
            const msg = err.message || 'Código incorrecto.';
            addToast(msg, 'error');
            setErrors({ api: msg, code: msg });
            setIsLoading(false);
            setVerificationCode('');
        }
    };

    const handleResendCode = async () => {
        if (!twoFactorPending?.email) return;
        try {
            await resend2FACode({ email: twoFactorPending.email, userId: twoFactorPending.userId });
            addToast('Código reenviado a tu correo.', 'success');
        } catch (err) {
            addToast('Error al reenviar el código.', 'error');
        }
    };

    const handleCancel2FA = () => {
        cancelTwoFactor();
        setVerificationCode('');
        setErrors({});
        setIsLoading(false);
    };

    if (showPolicy) return <PrivacyPolicy onBack={() => setShowPolicy(false)} />;

    if (twoFactorPending) {
        const isEmailMethod = twoFactorPending.method === 'email';
        return (
            <SplitLayout onShowPolicy={() => setShowPolicy(true)}>
                <SEOHead title="Verificación en Dos Pasos - Pro Fitness Glass" route="2fa-verify" noIndex={true} />
                <div className="mx-auto text-accent mb-4 flex justify-center">
                    {isEmailMethod ? <Mail size={40} /> : <Smartphone size={40} />}
                </div>
                <h1 className="text-3xl font-bold mb-2">Verificación</h1>
                <p className="text-text-secondary mb-6 text-sm">
                    {isEmailMethod ? `Introduce el código enviado a ${twoFactorPending.email}` : 'Introduce el código de tu aplicación autenticadora'}
                </p>
                <GlassCard className="glass p-6 sm:p-10 rounded-[32px] shadow-2xl">
                    <form onSubmit={handle2FASubmit} className="flex flex-col gap-6">
                        {errors.api && <p className="text-center text-red text-sm">{errors.api}</p>}
                        <div className="flex justify-between gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(e.target, index)}
                                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                    onPaste={handlePaste}
                                    onFocus={(e) => e.target.select()}
                                    className={`w-11 h-14 sm:w-14 sm:h-16 rounded-[16px] border-2 text-xl sm:text-2xl font-bold text-center outline-none transition-all bg-black/5 dark:bg-white/5 text-text-primary caret-accent ${digit ? 'border-accent shadow-lg shadow-accent/20' : 'border-glass-border focus:border-accent focus:shadow-lg focus:shadow-accent/20'}`}
                                />
                            ))}
                        </div>
                        {errors.code && <p className="form-error-text text-center text-xs -mt-2">{errors.code}</p>}
                        <button type="submit" disabled={isLoading || verificationCode.length < 6} className="flex items-center justify-center gap-2 w-full rounded-[20px] bg-accent text-bg-primary font-bold py-4 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-accent/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm">
                            {isLoading ? <Spinner /> : <span>Verificar</span>}
                        </button>
                    </form>
                    <div className="mt-6 flex flex-col gap-4">
                        {isEmailMethod && (
                            <button onClick={handleResendCode} type="button" className="text-xs font-semibold text-accent hover:underline">
                                ¿No recibiste el código? Reenviar
                            </button>
                        )}
                        <button onClick={handleCancel2FA} type="button" className="flex items-center justify-center gap-1 text-text-muted hover:text-text-primary transition-colors text-xs font-semibold">
                            <ArrowLeft size={14} /> Volver al inicio de sesión
                        </button>
                    </div>
                </GlassCard>
            </SplitLayout>
        );
    }

    return (
        <>
            <SEOHead title="Iniciar Sesión - Pro Fitness Glass" description="Accede a tu cuenta de Pro Fitness Glass." route="login" />
            <SplitLayout onShowPolicy={() => setShowPolicy(true)}>

                <img src="/logo.webp" alt="Pro Fitness Glass Logo" className="w-20 h-20 mx-auto mb-3 object-contain drop-shadow-md transition-transform duration-500 hover:scale-105" />

                <div className="flex justify-center w-full mb-4 mt-1 lg:hidden">
                    <div className="glass px-5 py-2 rounded-full shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
                        <Sparkles className="text-accent animate-pulse flex-shrink-0" size={16} />
                        <span className="text-xs sm:text-sm font-black bg-gradient-to-r from-accent via-[#a855f7] to-[#3b82f6] text-transparent bg-clip-text uppercase tracking-wide">
                            Gratis y Sin Anuncios
                        </span>
                    </div>
                </div>

                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-text-primary mb-1 hidden lg:block">Bienvenido de nuevo</h1>
                    <h1 className="text-3xl font-extrabold text-text-primary mb-1 lg:hidden">Pro Fitness</h1>
                    <p className="text-text-secondary text-sm">Inicia sesión para continuar con tu progreso.</p>
                </div>

                <GlassCard className="glass p-6 sm:p-10 relative rounded-[32px] shadow-2xl transition-all duration-300">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                        {errors.api && <p className="text-center text-red text-sm">{errors.api}</p>}

                        <div>
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full bg-black/5 dark:bg-white/5 border border-glass-border rounded-[20px] px-5 py-4 text-text-primary focus:border-accent focus:outline-none focus:ring-0 transition-all text-sm font-medium placeholder:text-text-muted"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {errors.email && <p className="form-error-text text-left text-xs mt-1.5 font-medium px-2">{errors.email}</p>}
                        </div>

                        <div>
                            <input
                                type="password"
                                placeholder="Contraseña"
                                className="w-full bg-black/5 dark:bg-white/5 border border-glass-border rounded-[20px] px-5 py-4 text-text-primary focus:border-accent focus:outline-none focus:ring-0 transition-all text-sm font-medium placeholder:text-text-muted"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <div className="flex justify-between items-start mt-2 px-2">
                                <div className="flex-1">
                                    {errors.password && <p className="form-error-text text-left text-xs font-medium">{errors.password}</p>}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        showForgotPassword();
                                    }}
                                    type="button"
                                    className="text-xs font-semibold text-text-secondary hover:text-accent transition-colors ml-2 shrink-0"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 w-full rounded-[20px] bg-accent text-bg-primary font-bold py-4 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-accent/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm mt-2"
                        >
                            {isLoading ? <Spinner /> : <><LogIn size={18} /> <span>Iniciar Sesión</span></>}
                        </button>
                    </form>

                    <div className="relative flex py-6 items-center">
                        <div className="flex-grow border-t border-glass-border"></div>
                        <span className="flex-shrink-0 mx-4 text-text-muted text-xs font-bold uppercase tracking-widest">O continúa con</span>
                        <div className="flex-grow border-t border-glass-border"></div>
                    </div>

                    <div className="flex flex-row justify-center items-center gap-3 flex-wrap">
                        <button
                            onClick={handleGoogleClick}
                            disabled={isLoading}
                            type="button"
                            title="Iniciar sesión con Google"
                            className="w-12 h-12 glass border border-glass-border text-text-primary rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-110 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <FcGoogle size={24} />
                        </button>

                        <button
                            onClick={handleDiscordClick}
                            disabled={isLoading}
                            type="button"
                            title="Iniciar sesión con Discord"
                            className="w-12 h-12 bg-[#5865F2] text-white rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-110 hover:shadow-lg hover:shadow-[#5865F2]/40 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <FaDiscord size={24} />
                        </button>

                        <button
                            onClick={handleXClick}
                            disabled={isLoading}
                            type="button"
                            title="Iniciar sesión con X (Twitter)"
                            className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-110 hover:shadow-lg hover:shadow-black/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <FaXTwitter size={20} />
                        </button>

                        <button
                            onClick={handleGithubClick}
                            disabled={isLoading}
                            type="button"
                            title="Iniciar sesión con GitHub"
                            className="w-12 h-12 bg-[#333] dark:bg-white text-white dark:text-[#333] rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-110 hover:shadow-lg hover:shadow-gray-500/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <FaGithub size={24} />
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-glass-border flex flex-wrap justify-center items-center gap-2">
                        <span className="text-sm font-medium text-text-secondary">¿Aún no tienes cuenta?</span>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                showRegister();
                            }}
                            type="button"
                            className="text-sm font-bold text-accent hover:text-accent/80 transition-colors"
                        >
                            Regístrate ahora
                        </button>
                    </div>
                </GlassCard>
            </SplitLayout>

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

export default LoginScreen;