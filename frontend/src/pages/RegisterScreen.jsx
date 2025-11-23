/* frontend/src/pages/RegisterScreen.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';
import { registerUser } from '../services/authService'; 
import useAppStore from '../store/useAppStore';
import EmailVerification from '../components/EmailVerification';
import GoogleTermsModal from '../components/GoogleTermsModal';
import PrivacyPolicy from './PrivacyPolicy';
import { GoogleLogin } from '@react-oauth/google';

const RegisterScreen = ({ showLogin }) => {
    const handleGoogleLogin = useAppStore(state => state.handleGoogleLogin);
    
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const { addToast } = useToast();
    const fetchInitialData = useAppStore(state => state.fetchInitialData);

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
            // Solo marcamos como "consentido" si explícitamente es 'accepted'.
            // Si es 'declined' o null, mostramos el modal propio.
            setHasConsented(localStorage.getItem('cookie_consent') === 'accepted');
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
            const response = await registerUser({ username, email, password });
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

    const onGoogleSuccess = async (credentialResponse) => {
        setShowGoogleModal(false); // Cerramos el modal
        if (!credentialResponse.credential) return;
        
        setIsLoading(true);
        setErrors({});

        try {
            if (handleGoogleLogin) {
                await handleGoogleLogin(credentialResponse.credential);
            } else {
                throw new Error("Error de configuración interna.");
            }
        } catch (err) {
            const errorMessage = err.message || 'Error al registrarse con Google.';
            addToast(errorMessage, 'error');
            setErrors({ api: errorMessage });
            setIsLoading(false);
        }
    };

    const onGoogleError = () => {
        setShowGoogleModal(false);
        addToast('Error al conectar con Google.', 'error');
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
            <EmailVerification 
                email={registeredEmail}
                onBack={handleBackToRegister}
                onSuccess={handleVerificationSuccess}
            />
        );
    }

    // Si el usuario quiere ver la política desde el modal
    if (showPolicy) {
        return <PrivacyPolicy onBack={() => setShowPolicy(false)} />;
    }

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary p-4 animate-[fade-in_0.5s_ease_out]">
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

                        {/* Botón Híbrido de Google */}
                        <div 
                            className="relative w-full h-11 flex justify-center items-center group" 
                            ref={googleParentRef}
                        >
                            {/* Capa Visual */}
                            <div className="absolute inset-0 w-full h-full bg-accent text-bg-secondary rounded-md flex items-center justify-center gap-3 font-semibold shadow transition group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-accent/20 pointer-events-none z-0">
                                <div className="bg-white rounded-full p-1 flex items-center justify-center">
                                    <FcGoogle size={18} />
                                </div>
                                <span>Registrarse con Google</span>
                            </div>

                            {/* Capa Funcional */}
                            {hasConsented ? (
                                <div className="absolute inset-0 w-full h-full opacity-0 z-10 overflow-hidden flex justify-center items-center">
                                    <GoogleLogin
                                        onSuccess={onGoogleSuccess}
                                        onError={onGoogleError}
                                        width={googleBtnWidth}
                                        text="signup_with"
                                        shape="rectangular"
                                        locale="es"
                                    />
                                </div>
                            ) : (
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

                    </GlassCard>

                    <button onClick={showLogin} className="mt-6 text-text-muted hover:text-text-primary transition">
                        ¿Ya tienes cuenta? Inicia sesión
                    </button>
                </div>
            </div>

            {/* Modal de Términos de Google */}
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

export default RegisterScreen;