/* frontend/src/pages/LoginScreen.jsx */
import React, { useState, useRef, useEffect } from 'react';
import { Dumbbell, LogIn } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import { GoogleLogin } from '@react-oauth/google';

const LoginScreen = ({ showRegister, showForgotPassword }) => {
    const handleLogin = useAppStore(state => state.handleLogin);
    const handleGoogleLogin = useAppStore(state => state.handleGoogleLogin);
    const { addToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    // --- INICIO DE LA MODIFICACIÓN: Referencia y estado para el ancho ---
    const googleParentRef = useRef(null);
    const [googleBtnWidth, setGoogleBtnWidth] = useState('300'); // Valor inicial seguro

    // Calculamos el ancho disponible cuando se monta el componente o cambia el tamaño
    useEffect(() => {
        const updateWidth = () => {
            if (googleParentRef.current) {
                // Google limita el ancho máximo a 400px, así que lo respetamos
                const width = googleParentRef.current.offsetWidth;
                setGoogleBtnWidth(width > 400 ? '400' : width.toString());
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);
    // --- FIN DE LA MODIFICACIÓN ---

    const validateForm = () => {
        const newErrors = {};
        if (!email.trim()) newErrors.email = 'El email es requerido.';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'El formato del email no es válido.';
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
        } catch (err) {
            const errorMessage = err.message || 'Error al iniciar sesión.';
            addToast(errorMessage, 'error');
            setErrors({ api: errorMessage });
            setPassword('');
            setIsLoading(false);
        }
    };

    const onGoogleSuccess = async (credentialResponse) => {
        if (!credentialResponse.credential) return;
        
        setIsLoading(true);
        setErrors({});

        try {
            if (handleGoogleLogin) {
                await handleGoogleLogin(credentialResponse.credential);
            } else {
                console.error("La acción handleGoogleLogin no está definida en el store todavía.");
                throw new Error("Error de configuración interna.");
            }
        } catch (err) {
            const errorMessage = err.message || 'Error al iniciar sesión con Google.';
            addToast(errorMessage, 'error');
            setErrors({ api: errorMessage });
            setIsLoading(false);
        }
    };

    const onGoogleError = () => {
        addToast('Error al conectar con Google.', 'error');
        setErrors({ api: 'No se pudo iniciar sesión con Google.' });
    };

    return (
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

                    {/* Separador y Botón de Google */}
                    <div className="relative flex py-5 items-center">
                        <div className="flex-grow border-t border-glass-border"></div>
                        <span className="flex-shrink-0 mx-4 text-text-muted text-sm">O continúa con</span>
                        <div className="flex-grow border-t border-glass-border"></div>
                    </div>

                    {/* --- INICIO DE LA MODIFICACIÓN: Contenedor Responsive --- */}
                    <div className="flex justify-center w-full" ref={googleParentRef}>
                        <div className="w-full flex justify-center">
                            <GoogleLogin
                                onSuccess={onGoogleSuccess}
                                onError={onGoogleError}
                                theme="filled_blue"
                                size="large"
                                width={googleBtnWidth} // Ancho dinámico calculado
                                text="signin_with"
                                shape="rectangular"
                                locale="es"
                            />
                        </div>
                    </div>
                    {/* --- FIN DE LA MODIFICACIÓN --- */}
                    
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
    );
};

export default LoginScreen;