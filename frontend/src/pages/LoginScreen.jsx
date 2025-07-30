import React, { useState } from 'react';
import { Dumbbell, LogIn } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import useAppStore from '../store/useAppStore'; // 1. Importar el hook del store
import { useToast } from '../hooks/useToast';

const LoginScreen = ({ showRegister }) => {
    // 2. Obtener la acción para cargar los datos del usuario
    const fetchInitialData = useAppStore(state => state.fetchInitialData);
    const { addToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

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
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al iniciar sesión.');

            // 3. Llamar a la acción del store para actualizar el estado de la app
            await fetchInitialData();
            // No es necesario desactivar isLoading aquí, porque el componente se desmontará

        } catch (err) {
            addToast(err.message, 'error');
            setErrors({ api: err.message });
            setIsLoading(false); 
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary p-4 animate-[fade-in_0.5s_ease-out]">
            <div className="w-full max-w-sm text-center">
                <Dumbbell size={48} className="mx-auto text-accent mb-4" />
                <h1 className="text-4xl font-extrabold">FitTrack Pro</h1>
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
                </GlassCard>

                <button onClick={showRegister} className="mt-6 text-text-muted hover:text-text-primary transition">
                    ¿No tienes cuenta? Regístrate
                </button>
            </div>
        </div>
    );
};

export default LoginScreen;