/* frontend/src/pages/LoginScreen.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell, LogIn, ShieldCheck, ArrowLeft, Smartphone, Mail } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import GoogleTermsModal from '../components/GoogleTermsModal';
import PrivacyPolicy from './PrivacyPolicy';
import { GoogleLogin } from '@react-oauth/google';
import { resend2FACode } from '../services/authService';

const LoginScreen = ({ showRegister, showForgotPassword }) => {
    // Store hooks
    const handleLogin = useAppStore(state => state.handleLogin);
    const handleGoogleLogin = useAppStore(state => state.handleGoogleLogin);

    // 2FA Store hooks
    const twoFactorPending = useAppStore(state => state.twoFactorPending);
    const handleVerify2FA = useAppStore(state => state.handleVerify2FA);
    const cancelTwoFactor = useAppStore(state => state.cancelTwoFactor);

    const { addToast } = useToast();

    // Local state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    // Nuevo estado para los 6 inputs individuales
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const inputRefs = useRef([]);

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    // Estados para modales y consentimiento
    const [showGoogleModal, setShowGoogleModal] = useState(false);
    const [showPolicy, setShowPolicy] = useState(false);
    const [hasConsented, setHasConsented] = useState(false);

    // Refs para el botón de Google
    const googleParentRef = useRef(null);
    const [googleBtnWidth, setGoogleBtnWidth] = useState('300');

    // Verificar consentimiento al montar
    useEffect(() => {
        const checkConsent = () => {
            const consent = localStorage.getItem('cookie_consent');
            setHasConsented(consent === 'accepted');
        };
        checkConsent();
        window.addEventListener('storage', checkConsent);
        return () => window.removeEventListener('storage', checkConsent);
    }, []);

    // Calcular ancho del botón Google
    useEffect(() => {
        const updateWidth = () => {
            if (googleParentRef.current) {
                const width = googleParentRef.current.offsetWidth;
                setGoogleBtnWidth(width > 400 ? '400' : width.toString());
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    // Enfocar el primer input de 2FA cuando aparezca la pantalla
    useEffect(() => {
        if (twoFactorPending && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [twoFactorPending]);

    // Sincronizar limpieza: Si se limpia el código (ej: error), limpiar los inputs visuales
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

    // Manejadores para los inputs de OTP
    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return false;

        const newOtp = [...otp];
        // Tomamos solo el último caracter ingresado para evitar problemas
        newOtp[index] = element.value.substring(element.value.length - 1);

        setOtp(newOtp);
        setVerificationCode(newOtp.join(""));

        // Enfocar siguiente input si se escribió algo
        if (element.value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            // Si la casilla actual está vacía y pulsamos backspace, ir a la anterior
            if (!otp[index] && index > 0) {
                inputRefs.current[index - 1].focus();
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData("text");
        if (!data) return;

        // Limpiar y tomar solo números, máximo 6
        const numbers = data.replace(/\D/g, '').slice(0, 6).split("");
        if (numbers.length === 0) return;

        const newOtp = [...otp];
        numbers.forEach((num, i) => {
            if (i < 6) newOtp[i] = num;
        });

        setOtp(newOtp);
        setVerificationCode(newOtp.join(""));

        // Enfocar el input siguiente al último pegado
        const nextIndex = Math.min(numbers.length, 5);
        if (inputRefs.current[nextIndex]) {
            inputRefs.current[nextIndex].focus();
        }
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
            setVerificationCode(''); // Esto disparará el useEffect para limpiar otp
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

    const onGoogleSuccess = async (credentialResponse) => {
        setShowGoogleModal(false);
        if (!credentialResponse.credential) return;

        setIsLoading(true);
        setErrors({});
        try {
            if (handleGoogleLogin) {
                await handleGoogleLogin(credentialResponse.credential);
            } else {
                throw new Error("Configuración interna incompleta.");
            }
            setIsLoading(false);
        } catch (err) {
            const msg = err.message || 'Error con Google.';
            addToast(msg, 'error');
            setErrors({ api: msg });
            setIsLoading(false);
        }
    };

    const onGoogleError = () => {
        setShowGoogleModal(false);
        addToast('No se pudo conectar con Google.', 'error');
    };

    if (showPolicy) return <PrivacyPolicy onBack={() => setShowPolicy(false)} />;

    // --- RENDERIZADO 2FA ---
    if (twoFactorPending) {
        const isEmailMethod = twoFactorPending.method === 'email';

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary p-4 animate-[fade-in_0.5s_ease-out]">
                <div className="w-full max-w-sm text-center">
                    {/* Header Icon */}
                    <div className="mx-auto text-accent mb-4 flex justify-center">
                        {isEmailMethod ? <Mail size={48} /> : <Smartphone size={48} />}
                    </div>

                    <h1 className="text-3xl font-bold mb-2">Verificación</h1>
                    <p className="text-text-secondary mb-6">
                        {isEmailMethod
                            ? `Introduce el código enviado a ${twoFactorPending.email}`
                            : 'Introduce el código de tu aplicación autenticadora'}
                    </p>

                    <GlassCard className="p-8">
                        <form onSubmit={handle2FASubmit} className="flex flex-col gap-5">
                            {errors.api && <p className="text-center text-red text-sm">{errors.api}</p>}

                            {/* --- SLOT INPUTS INDIVIDUALES --- */}
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
                                        onFocus={(e) => e.target.select()} // Seleccionar todo al enfocar
                                        className={`
                                            w-10 h-12 sm:w-11 sm:h-14 rounded-lg border-2 
                                            text-xl sm:text-2xl font-bold text-center 
                                            outline-none transition-all 
                                            bg-bg-secondary text-text-primary caret-accent
                                            ${digit
                                                ? 'border-accent shadow-lg shadow-accent/20'
                                                : 'border-glass-border focus:border-accent focus:shadow-lg focus:shadow-accent/20'
                                            }
                                        `}
                                    />
                                ))}
                            </div>
                            {/* --- FIN SLOT INPUTS --- */}

                            {errors.code && <p className="form-error-text text-center mt-2">{errors.code}</p>}

                            <button
                                type="submit"
                                disabled={isLoading || verificationCode.length < 6}
                                className="flex items-center justify-center gap-2 w-full rounded-md bg-accent text-bg-secondary font-semibold py-3 transition hover:scale-105 hover:shadow-lg hover:shadow-accent/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                            >
                                {isLoading ? <Spinner /> : <span>Verificar</span>}
                            </button>
                        </form>

                        <div className="mt-6 flex flex-col gap-3">
                            {isEmailMethod && (
                                <button
                                    onClick={handleResendCode}
                                    type="button"
                                    className="text-sm text-accent hover:underline"
                                >
                                    ¿No recibiste el código? Reenviar
                                </button>
                            )}

                            <button
                                onClick={handleCancel2FA}
                                type="button"
                                className="flex items-center justify-center gap-1 text-text-muted hover:text-text-primary transition-colors text-sm"
                            >
                                <ArrowLeft size={14} /> Volver al inicio de sesión
                            </button>
                        </div>
                    </GlassCard>
                </div>
            </div>
        );
    }

    // --- RENDERIZADO LOGIN NORMAL ---
    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary p-4 animate-[fade-in_0.5s_ease-out]">
                <div className="w-full max-w-sm text-center">
                    <Dumbbell size={48} className="mx-auto text-accent mb-4" />
                    <h1 className="text-4xl font-extrabold">Pro Fitness Glass</h1>
                    <p className="text-text-secondary mb-8">Tu compañero de fitness definitivo.</p>

                    <GlassCard className="p-8">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                            {errors.api && <p className="text-center text-red">{errors.api}</p>}
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
                                className="flex items-center justify-center gap-2 w-full rounded-md bg-accent text-bg-secondary font-semibold py-3 transition hover:scale-105 hover:shadow-lg hover:shadow-accent/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Spinner /> : <><LogIn size={18} /> <span>Iniciar Sesión</span></>}
                            </button>
                        </form>

                        <div className="relative flex py-5 items-center">
                            <div className="flex-grow border-t border-glass-border"></div>
                            <span className="flex-shrink-0 mx-4 text-text-muted text-sm">O continúa con</span>
                            <div className="flex-grow border-t border-glass-border"></div>
                        </div>

                        {/* Botón Híbrido de Google */}
                        <div
                            className="relative w-full h-11 flex justify-center items-center group"
                            ref={googleParentRef}
                        >
                            {/* Capa Visual (Siempre visible) */}
                            <div className="absolute inset-0 w-full h-full bg-accent text-bg-secondary rounded-md flex items-center justify-center gap-3 font-semibold shadow transition group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-accent/20 pointer-events-none z-0">
                                <div className="bg-white rounded-full p-1 flex items-center justify-center">
                                    <FcGoogle size={18} />
                                </div>
                                <span>Continuar con Google</span>
                            </div>

                            {/* Capa Funcional (Condicional) */}
                            {hasConsented ? (
                                /* Si hay cookies: Login Directo (Iframe invisible) */
                                <div className="absolute inset-0 w-full h-full opacity-0 z-10 overflow-hidden flex justify-center items-center">
                                    <GoogleLogin
                                        onSuccess={onGoogleSuccess}
                                        onError={onGoogleError}
                                        width={googleBtnWidth}
                                        text="signin_with"
                                        shape="rectangular"
                                        locale="es"
                                    />
                                </div>
                            ) : (
                                /* No hay cookies: Botón transparente para abrir Modal */
                                <button
                                    type="button"
                                    onClick={() => setShowGoogleModal(true)}
                                    disabled={isLoading}
                                    className="absolute inset-0 w-full h-full z-10 cursor-pointer opacity-0"
                                >
                                    Abrir Modal Google
                                </button>
                            )}
                        </div>

                        <div className="text-center mt-6 text-sm">
                            <button onClick={showForgotPassword} className="text-accent hover:opacity-80 transition-opacity font-medium">
                                ¿Olvidaste tu contraseña?
                            </button>
                            <span className="text-text-muted mx-2">|</span>
                            <button onClick={showRegister} className="text-accent hover:opacity-80 transition-opacity font-medium">
                                Regístrate
                            </button>
                        </div>
                    </GlassCard>
                </div>
            </div>

            <GoogleTermsModal
                isOpen={showGoogleModal}
                onClose={() => setShowGoogleModal(false)}
                onSuccess={onGoogleSuccess}
                onError={onGoogleError}
                onShowPolicy={() => setShowPolicy(true)}
            />
        </>
    );
};

export default LoginScreen;