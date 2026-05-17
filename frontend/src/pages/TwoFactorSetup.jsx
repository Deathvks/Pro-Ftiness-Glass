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
    <div className="flex justify-between gap-2 sm:gap-3 mb-8 w-full max-w-[340px] mx-auto">
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
            w-12 h-14 sm:w-14 sm:h-16 rounded-[16px] border-none 
            text-2xl sm:text-3xl font-extrabold text-center 
            outline-none transition-all duration-300
            bg-black/5 dark:bg-white/5 text-text-primary caret-accent
            ${digit
              ? 'ring-2 ring-accent shadow-md shadow-accent/20 bg-transparent'
              : 'ring-1 ring-black/5 dark:ring-white/10 focus:ring-2 focus:ring-accent/50'
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
        icon: <Smartphone size={28} className="text-accent" />,
        text: `Este método es el más seguro y recomendado.
              
              Funciona mediante una aplicación externa (como Google Authenticator, Authy o Microsoft Authenticator) instalada en tu móvil.
              
              1. Escaneas un código QR único que te mostraremos.
              2. La app generará códigos temporales de 6 dígitos que cambian cada 30 segundos.
              3. Funciona incluso sin conexión a internet.
              
              Deberás introducir uno de estos códigos cada vez que inicies sesión.`
      },
      email: {
        title: "Autenticación por Email",
        icon: <Mail size={28} className="text-accent" />,
        text: `Este método utiliza tu correo electrónico como segundo factor de seguridad.
              
              1. Cada vez que intentes iniciar sesión, enviaremos un código único a tu email registrado.
              2. Deberás revisar tu bandeja de entrada e introducirlo para acceder.
              
              Es una opción cómoda si no quieres instalar apps adicionales, pero depende de la seguridad de tu correo y la velocidad de entrega de los emails.`
      }
    };

    const data = content[infoModal];

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
        <div className="relative w-full max-w-md bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl animate-[scale-in_0.2s_ease-out]">
          <button
            onClick={() => setInfoModal(null)}
            className="absolute top-5 right-5 text-text-secondary hover:text-text-primary transition-colors p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
          >
            <X size={24} />
          </button>
          
          <h3 className="text-2xl font-extrabold mb-5 flex items-center gap-4 text-text-primary">
            <div className="p-3 bg-accent/10 rounded-[16px] ring-1 ring-accent/30 shadow-sm shrink-0">
              {data.icon}
            </div>
            {data.title}
          </h3>
          
          <div className="text-text-secondary font-medium whitespace-pre-line leading-relaxed text-sm sm:text-base mb-8">
            {data.text}
          </div>
          
          <button
            onClick={() => setInfoModal(null)}
            className="w-full py-4 bg-accent text-white font-bold text-lg rounded-[20px] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20"
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
        <div className="relative w-full max-w-sm bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl animate-[scale-in_0.2s_ease-out]">

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 rounded-[24px] bg-red/10 ring-1 ring-red/30 flex items-center justify-center text-red mb-5 shadow-sm">
              <ShieldAlert size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-extrabold text-text-primary tracking-tight">¿Desactivar seguridad?</h3>
            <p className="text-text-secondary font-medium text-sm mt-3 leading-relaxed">
              Si desactivas la verificación en dos pasos, tu cuenta será <strong>menos segura</strong>.
              Solo necesitarás tu contraseña para entrar, lo que facilita el acceso a intrusos.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={confirmDisable}
              disabled={isLoading}
              className="w-full py-4 bg-red text-white font-bold text-lg rounded-[20px] hover:bg-red/90 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-red/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Sí, desactivar'}
            </button>
            <button
              onClick={() => setShowDisableConfirm(false)}
              disabled={isLoading}
              className="w-full py-4 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-primary font-bold text-lg rounded-[20px] hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-95"
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
          <button 
            onClick={() => setView('settings')} 
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors mb-6 w-fit"
          >
            <ArrowLeft size={18} strokeWidth={2.5} /> Volver
          </button>

          <GlassCard className="glass p-8 sm:p-12 text-center flex flex-col items-center gap-5 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-xl">
            <div className="w-24 h-24 rounded-[28px] bg-green/10 ring-1 ring-green/30 flex items-center justify-center text-green mb-2 shadow-sm">
              <ShieldCheck size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-text-primary">Protección Activada</h2>
            <p className="text-text-secondary font-medium max-w-md leading-relaxed">
              Tu cuenta está protegida con verificación en dos pasos mediante
              <strong className="text-text-primary"> {userProfile.two_factor_method === 'email' ? 'Email' : 'Aplicación Autenticadora'}</strong>.
            </p>

            <div className="h-px w-full bg-black/5 dark:bg-white/10 my-6" />

            <button
              onClick={handleDisableClick}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-[20px] bg-red text-white font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-red/20 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Unlock size={20} strokeWidth={2.5} />}
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
          <button 
            onClick={handleBack} 
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors mb-6 w-fit"
          >
            <ArrowLeft size={18} strokeWidth={2.5} /> Volver
          </button>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary mb-3">Verificación en 2 Pasos</h1>
          <p className="text-text-secondary font-medium mb-10 text-base md:text-lg">Añade una capa extra de seguridad a tu cuenta eligiendo un método de verificación.</p>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Opción APP (DESTACADA) */}
            <GlassCard
              className="glass relative p-8 flex flex-col items-center text-center gap-5 border-none ring-2 ring-accent/50 shadow-xl shadow-accent/10 hover:ring-accent transition-all cursor-pointer group overflow-hidden bg-accent/5 rounded-[32px] hover:-translate-y-1"
              onClick={startAppSetup}
            >
              {/* BADGE RECOMENDADO */}
              <div className="absolute top-0 left-0 bg-accent text-white text-[10px] font-black px-4 py-1.5 rounded-br-[24px] rounded-tl-[32px] z-10 shadow-sm tracking-widest uppercase">
                Recomendado
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); setInfoModal('app'); }}
                className="absolute top-5 right-5 text-text-muted hover:text-accent transition-colors z-10 p-2 hover:bg-accent/10 rounded-full"
                title="Más información"
              >
                <HelpCircle size={22} />
              </button>

              <div className="p-5 rounded-[24px] bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 group-hover:scale-110 transition-transform duration-300 mt-4 shadow-sm">
                <Smartphone size={40} className="text-accent" strokeWidth={1.5} />
              </div>
              <div className="mt-2">
                <h3 className="font-extrabold text-xl text-text-primary">Aplicación Autenticadora</h3>
                <p className="text-sm font-medium text-text-secondary mt-2 leading-relaxed">Usa Google Authenticator, Authy, etc.</p>
              </div>
              <div className="mt-auto pt-4 text-accent font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all uppercase tracking-wider">
                Configurar <ArrowLeft size={16} className="rotate-180" strokeWidth={2.5} />
              </div>
            </GlassCard>

            {/* Opción EMAIL */}
            <GlassCard
              className="glass relative p-8 flex flex-col items-center text-center gap-5 border-none ring-1 ring-black/5 dark:ring-white/10 hover:ring-accent/50 hover:shadow-lg transition-all cursor-pointer group overflow-hidden bg-black/5 dark:bg-white/5 rounded-[32px] hover:-translate-y-1"
              onClick={startEmailSetup}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setInfoModal('email'); }}
                className="absolute top-5 right-5 text-text-muted hover:text-accent transition-colors z-10 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                title="Más información"
              >
                <HelpCircle size={22} />
              </button>

              <div className="p-5 rounded-[24px] bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 group-hover:scale-110 transition-transform duration-300 mt-4 shadow-sm">
                <Mail size={40} className="text-accent" strokeWidth={1.5} />
              </div>
              <div className="mt-2">
                <h3 className="font-extrabold text-xl text-text-primary">Correo Electrónico</h3>
                <p className="text-sm font-medium text-text-secondary mt-2 leading-relaxed">Recibe un código en tu email cada vez que entres.</p>
              </div>
              <div className="mt-auto pt-4 text-accent font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all uppercase tracking-wider">
                Configurar <ArrowLeft size={16} className="rotate-180" strokeWidth={2.5} />
              </div>
            </GlassCard>
          </div>
          {isLoading && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"><Spinner size={40} /></div>}
        </div>
      </>
    );
  }

  // --- RENDERIZADO: PROCESO SETUP (App o Email) ---
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto animate-[fade-in_0.3s_ease-out]">
      <button 
        onClick={handleBack} 
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors mb-6 w-fit"
      >
        <ArrowLeft size={18} strokeWidth={2.5} /> Cancelar
      </button>

      <GlassCard className="glass p-6 sm:p-10 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-8 flex items-center gap-3 text-text-primary tracking-tight">
          <div className="p-3 bg-accent/10 rounded-[16px] ring-1 ring-accent/30 shadow-sm shrink-0">
            {mode === 'app' ? <Smartphone size={28} className="text-accent" /> : <Mail size={28} className="text-accent" />}
          </div>
          {mode === 'app' ? 'Configurar App' : 'Verificar Email'}
        </h2>

        {mode === 'app' && qrData && (
          <div className="flex flex-col items-center mb-10 gap-5">
            <div className="bg-white p-3 rounded-[24px] shadow-lg ring-1 ring-black/5">
              <img src={qrData.qrCodeUrl} alt="QR Code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
            </div>
            <p className="text-sm font-medium text-text-secondary text-center max-w-sm leading-relaxed">
              Escanea este código QR con tu aplicación de autenticación.
            </p>
            
            <div className="w-full bg-black/5 dark:bg-white/5 p-4 rounded-[20px] flex items-center justify-between ring-1 ring-black/5 dark:ring-white/10 shadow-inner">
              <span className="font-mono text-sm sm:text-base font-bold tracking-wider overflow-hidden text-ellipsis px-2 text-text-primary">{qrData.secret}</span>
              <button 
                onClick={() => copyToClipboard(qrData.secret)} 
                className="p-3 bg-bg-primary rounded-[12px] text-text-secondary hover:text-accent ring-1 ring-black/5 dark:ring-white/10 shadow-sm transition-all active:scale-95"
                title="Copiar código"
              >
                <Copy size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {mode === 'email' && (
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-accent/10 rounded-[24px] ring-1 ring-accent/30 flex items-center justify-center mx-auto mb-5 text-accent shadow-sm">
              <Mail size={40} strokeWidth={1.5} />
            </div>
            <p className="text-text-secondary font-medium text-base leading-relaxed max-w-sm mx-auto">
              Hemos enviado un código de verificación a <strong className="text-text-primary">{userProfile.email}</strong>. Introdúcelo abajo.
            </p>
          </div>
        )}

        <div className="max-w-sm mx-auto w-full">
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 text-center">
            Código de verificación
          </label>

          {/* Custom Input */}
          {renderCodeInput()}

          <button
            onClick={handleVerifyAndEnable}
            disabled={verifyCode.length < 6 || isLoading}
            className="w-full bg-accent text-white font-bold text-lg py-4 rounded-[20px] hover:shadow-lg hover:shadow-accent/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'Verificar y Activar'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default TwoFactorSetup;