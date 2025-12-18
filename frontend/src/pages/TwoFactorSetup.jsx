/* frontend/src/pages/TwoFactorSetup.jsx */
import React, { useState, useRef, useEffect } from 'react';
import {
    ShieldCheck, Smartphone, Mail, ArrowLeft, Check, Copy,
    Unlock, Loader2, HelpCircle, X, AlertTriangle, ShieldAlert
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import * as authService from '../services/authService';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';

const TwoFactorSetup = ({ setView }) => {
    const { userProfile, fetchInitialData } = useAppStore(state => ({
        userProfile: state.userProfile,
        fetchInitialData: state.fetchInitialData
    }));

    const { addToast } = useToast();

    const [mode, setMode] = useState('menu'); // 'menu', 'app', 'email'
    const [isLoading, setIsLoading] = useState(false);

    // Estados para modales
    const [infoModal, setInfoModal] = useState(null); // 'app' | 'email' | null
    const [showDisableConfirm, setShowDisableConfirm] = useState(false); // Modal de confirmación de desactivación

    // Data for App Setup
    const [qrData, setQrData] = useState(null); // { secret, qrCodeUrl }
    const [verifyCode, setVerifyCode] = useState('');

    // --- CAMBIO: Refs y Estado para Inputs Individuales ---
    const inputRefs = useRef([]);
    const [otp, setOtp] = useState(new Array(6).fill(""));

    // Sincronizar limpieza: Si verifyCode se vacía externamente, limpiar OTP
    useEffect(() => {
        if (verifyCode === '') {
            setOtp(new Array(6).fill(""));
            // Enfocar el primer input si estamos en modo de introducción de código
            if (inputRefs.current[0] && mode !== 'menu') {
                inputRefs.current[0].focus();
            }
        }
    }, [verifyCode, mode]);

    // Handlers
    const handleBack = () => {
        if (mode === 'menu') setView('settings');
        else {
            setMode('menu');
            setQrData(null);
            setVerifyCode('');
        }
    };

    const startAppSetup = async () => {
        setIsLoading(true);
        try {
            const data = await authService.setup2FAApp();
            setQrData(data);
            setMode('app');
        } catch (err) {
            addToast(err.message || 'Error al iniciar configuración.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const startEmailSetup = async () => {
        setIsLoading(true);
        try {
            await authService.setup2FAEmail();
            setMode('email');
        } catch (err) {
            addToast(err.message || 'Error enviando código.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndEnable = async () => {
        if (verifyCode.length < 6) return;
        setIsLoading(true);
        try {
            if (mode === 'app') {
                await authService.enable2FAApp({ token: verifyCode, secret: qrData.secret });
            } else {
                await authService.enable2FAEmail({ code: verifyCode });
            }

            await fetchInitialData(); // Actualizar perfil para reflejar el cambio
            addToast('Verificación en dos pasos activada.', 'success');
            setView('settings');
        } catch (err) {
            addToast(err.message || 'Código incorrecto.', 'error');
            setVerifyCode(''); // Limpiar código al fallar (dispara useEffect para limpiar inputs)
        } finally {
            setIsLoading(false);
        }
    };

    // Función que inicia el proceso de desactivación (abre el modal)
    const handleDisableClick = () => {
        setShowDisableConfirm(true);
    };

    // Función que confirma y ejecuta la desactivación
    const confirmDisable = async () => {
        setIsLoading(true);
        try {
            await authService.disable2FA();
            await fetchInitialData();
            addToast('Verificación en dos pasos desactivada.', 'info');
            setShowDisableConfirm(false);
        } catch (err) {
            addToast(err.message || 'Error al desactivar.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        addToast('Copiado al portapapeles', 'success');
    };

    // --- NUEVOS HANDLERS PARA OTP ---
    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return false;

        const newOtp = [...otp];
        // Tomamos el último caracter ingresado
        newOtp[index] = element.value.substring(element.value.length - 1);

        setOtp(newOtp);
        const code = newOtp.join("");
        setVerifyCode(code);

        // Enfocar siguiente input si se escribió algo
        if (element.value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            // Si la casilla está vacía y pulsamos borrar, ir a la anterior
            if (!otp[index] && index > 0) {
                inputRefs.current[index - 1].focus();
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData("text");
        if (!data) return;

        const numbers = data.replace(/\D/g, '').slice(0, 6).split("");
        if (numbers.length === 0) return;

        const newOtp = [...otp];
        numbers.forEach((num, i) => {
            if (i < 6) newOtp[i] = num;
        });

        setOtp(newOtp);
        setVerifyCode(newOtp.join(""));

        const nextIndex = Math.min(numbers.length, 5);
        if (inputRefs.current[nextIndex]) {
            inputRefs.current[nextIndex].focus();
        }
    };

    // --- Renderizado del Input de Código (Individuales) ---
    const renderCodeInput = () => (
        <div className="flex justify-between gap-2 mb-6 max-w-[280px] mx-auto">
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
    );

    // --- COMPONENTE INTERNO: MODAL DE INFORMACIÓN ---
    const InfoModal = () => {
        if (!infoModal) return null;

        const content = {
            app: {
                title: "Autenticación por App",
                icon: <Smartphone size={24} className="text-accent" />,
                text: `Este método es el más seguro y recomendado.
              
              Funciona mediante una aplicación externa (como Google Authenticator, Authy o Microsoft Authenticator) instalada en tu móvil.
              
              1. Escaneas un código QR único que te mostraremos.
              2. La app generará códigos temporales de 6 dígitos que cambian cada 30 segundos.
              3. Funciona incluso sin conexión a internet.
              
              Deberás introducir uno de estos códigos cada vez que inicies sesión.`
            },
            email: {
                title: "Autenticación por Email",
                icon: <Mail size={24} className="text-accent" />,
                text: `Este método utiliza tu correo electrónico como segundo factor de seguridad.
              
              1. Cada vez que intentes iniciar sesión, enviaremos un código único a tu email registrado.
              2. Deberás revisar tu bandeja de entrada e introducirlo para acceder.
              
              Es una opción cómoda si no quieres instalar apps adicionales, pero depende de la seguridad de tu correo y la velocidad de entrega de los emails.`
            }
        };

        const data = content[infoModal];

        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
                <div className="relative w-full max-w-md bg-bg-secondary border border-glass-border rounded-2xl p-6 shadow-2xl animate-[scale-in_0.2s_ease-out]">
                    <button
                        onClick={() => setInfoModal(null)}
                        className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition p-1 hover:bg-white/5 rounded-full"
                    >
                        <X size={20} />
                    </button>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-lg">
                            {data.icon}
                        </div>
                        {data.title}
                    </h3>
                    <div className="text-text-secondary whitespace-pre-line leading-relaxed text-sm">
                        {data.text}
                    </div>
                    <button
                        onClick={() => setInfoModal(null)}
                        className="mt-6 w-full py-3 bg-accent text-bg-secondary font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-accent/20"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        );
    };

    // --- COMPONENTE INTERNO: MODAL DE CONFIRMACIÓN DE DESACTIVACIÓN ---
    const DisableConfirmModal = () => {
        if (!showDisableConfirm) return null;

        return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
                <div className="relative w-full max-w-sm bg-bg-secondary border border-glass-border rounded-2xl p-6 shadow-2xl animate-[scale-in_0.2s_ease-out]">

                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-red/10 flex items-center justify-center text-red mb-4">
                            <ShieldAlert size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary">¿Desactivar seguridad?</h3>
                        <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                            Si desactivas la verificación en dos pasos, tu cuenta será <strong>menos segura</strong>.
                            Solo necesitarás tu contraseña para entrar, lo que facilita el acceso a intrusos.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={confirmDisable}
                            disabled={isLoading}
                            className="w-full py-3 bg-red text-white font-bold rounded-xl hover:bg-red/90 transition shadow-lg shadow-red/20 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Sí, desactivar'}
                        </button>
                        <button
                            onClick={() => setShowDisableConfirm(false)}
                            disabled={isLoading}
                            className="w-full py-3 bg-transparent border border-glass-border text-text-primary font-medium rounded-xl hover:bg-bg-primary transition"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- RENDERIZADO: PANTALLA DE ACTIVADO (Estado Inicial si ya tiene 2FA) ---
    if (userProfile?.two_factor_enabled) {
        return (
            <>
                <DisableConfirmModal />
                <div className="p-4 md:p-8 max-w-2xl mx-auto animate-[fade-in_0.3s_ease-out]">
                    <button onClick={() => setView('settings')} className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition">
                        <ArrowLeft size={20} /> Volver
                    </button>

                    <GlassCard className="p-8 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-2">
                            <ShieldCheck size={32} />
                        </div>
                        <h2 className="text-2xl font-bold">Protección Activada</h2>
                        <p className="text-text-secondary max-w-md">
                            Tu cuenta está protegida con verificación en dos pasos mediante
                            <strong className="text-text-primary"> {userProfile.two_factor_method === 'email' ? 'Email' : 'Aplicación Autenticadora'}</strong>.
                        </p>

                        <div className="h-px w-full bg-glass-border my-4" />

                        {/* --- CAMBIO AQUÍ: Botón con fondo ROJO y texto BLANCO siempre --- */}
                        <button
                            onClick={handleDisableClick}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red text-white hover:bg-red/90 transition shadow-lg shadow-red/20"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Unlock size={18} />}
                            Desactivar 2FA
                        </button>
                    </GlassCard>
                </div>
            </>
        );
    }

    // --- RENDERIZADO: MENU DE SELECCIÓN (Estado Inicial si NO tiene 2FA) ---
    if (mode === 'menu') {
        return (
            <>
                <InfoModal />
                <div className="p-4 md:p-8 max-w-3xl mx-auto animate-[fade-in_0.3s_ease-out]">
                    <button onClick={handleBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition">
                        <ArrowLeft size={20} /> Volver
                    </button>

                    {/* --- HEADER CAMBIADO --- */}
                    <h1 className="text-2xl font-bold mb-2">Verificación en 2 Pasos</h1>
                    <p className="text-text-secondary mb-8">Añade una capa extra de seguridad a tu cuenta eligiendo un método de verificación.</p>

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Opción APP (DESTACADA) */}
                        <GlassCard
                            className="relative p-6 flex flex-col items-center text-center gap-4 border border-accent/40 shadow-[0_0_20px_rgba(0,0,0,0.1)] hover:border-accent hover:shadow-accent/10 transition cursor-pointer group overflow-hidden bg-accent/5"
                            onClick={startAppSetup}
                        >
                            {/* BADGE RECOMENDADO */}
                            <div className="absolute top-0 left-0 bg-accent text-bg-secondary text-[10px] font-bold px-3 py-1 rounded-br-lg z-10 shadow-sm">
                                RECOMENDADO
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); setInfoModal('app'); }}
                                className="absolute top-4 right-4 text-text-muted hover:text-accent transition z-10"
                                title="Más información"
                            >
                                <HelpCircle size={20} />
                            </button>

                            <div className="p-4 rounded-full bg-bg-secondary group-hover:bg-accent/10 transition mt-2">
                                <Smartphone size={32} className="text-accent" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Aplicación Autenticadora</h3>
                                <p className="text-sm text-text-secondary mt-2">Usa Google Authenticator, Authy, etc.</p>
                            </div>
                            <button className="mt-auto text-accent font-medium text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                Configurar <ArrowLeft size={14} className="rotate-180" />
                            </button>
                        </GlassCard>

                        {/* Opción EMAIL */}
                        <GlassCard
                            className="relative p-6 flex flex-col items-center text-center gap-4 hover:border-accent/50 transition cursor-pointer group overflow-hidden"
                            onClick={startEmailSetup}
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); setInfoModal('email'); }}
                                className="absolute top-4 right-4 text-text-muted hover:text-accent transition z-10"
                                title="Más información"
                            >
                                <HelpCircle size={20} />
                            </button>

                            <div className="p-4 rounded-full bg-bg-secondary group-hover:bg-accent/10 transition mt-2">
                                <Mail size={32} className="text-accent" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Correo Electrónico</h3>
                                <p className="text-sm text-text-secondary mt-2">Recibe un código en tu email cada vez que entres.</p>
                            </div>
                            <button className="mt-auto text-accent font-medium text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                Configurar <ArrowLeft size={14} className="rotate-180" />
                            </button>
                        </GlassCard>
                    </div>
                    {isLoading && <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"><Spinner /></div>}
                </div>
            </>
        );
    }

    // --- RENDERIZADO: PROCESO SETUP (App o Email) ---
    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto animate-[fade-in_0.3s_ease-out]">
            <button onClick={handleBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition">
                <ArrowLeft size={20} /> Cancelar
            </button>

            <GlassCard className="p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    {mode === 'app' ? <Smartphone size={24} className="text-accent" /> : <Mail size={24} className="text-accent" />}
                    {mode === 'app' ? 'Configurar App' : 'Verificar Email'}
                </h2>

                {mode === 'app' && qrData && (
                    <div className="flex flex-col items-center mb-8 gap-4">
                        <div className="bg-white p-2 rounded-lg">
                            <img src={qrData.qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                        </div>
                        <p className="text-sm text-text-secondary text-center">
                            Escanea este código QR con tu aplicación de autenticación.
                        </p>
                        <div className="w-full bg-bg-secondary p-3 rounded-lg flex items-center justify-between border border-glass-border">
                            <span className="font-mono text-sm tracking-wider overflow-hidden text-ellipsis">{qrData.secret}</span>
                            <button onClick={() => copyToClipboard(qrData.secret)} className="p-2 hover:bg-bg-primary rounded text-text-secondary hover:text-accent">
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'email' && (
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                            <Mail size={24} />
                        </div>
                        <p className="text-text-secondary">
                            Hemos enviado un código de verificación a <strong>{userProfile.email}</strong>. Introdúcelo abajo.
                        </p>
                    </div>
                )}

                <div className="max-w-xs mx-auto">
                    <label className="block text-sm font-medium text-text-secondary mb-2 text-center">
                        Código de verificación
                    </label>

                    {/* Custom Input */}
                    {renderCodeInput()}

                    <button
                        onClick={handleVerifyAndEnable}
                        disabled={verifyCode.length < 6 || isLoading}
                        className="w-full bg-accent text-bg-secondary font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-accent/20 hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Verificar y Activar'}
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};

export default TwoFactorSetup;