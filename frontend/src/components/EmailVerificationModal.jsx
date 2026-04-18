/* frontend/src/components/EmailVerificationModal.jsx */
import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import GlassCard from './GlassCard';
import Spinner from './Spinner';
import { useToast } from '../hooks/useToast';
import { resendVerificationEmail, updateEmailForVerification } from '../services/authService';

const EmailVerificationModal = ({ currentEmail, onEmailUpdated, onCodeSent }) => {
  // 1. Detectamos si el correo es el "falso" generado para X
  const isDummyEmail = !currentEmail || currentEmail.endsWith('@x-auth.local');
  
  // 2. Si es falso, forzamos la vista de escribir correo nuevo
  const [isChangingEmail, setIsChangingEmail] = useState(isDummyEmail);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { addToast } = useToast();

  // Vigilante por si el email cambia en caliente
  useEffect(() => {
    if (!currentEmail || currentEmail.endsWith('@x-auth.local')) {
      setIsChangingEmail(true);
    }
  }, [currentEmail]);

  // Contador para el reenvío
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendToCurrentEmail = async () => {
    if (resendCooldown > 0 || isDummyEmail) return;
    
    setIsLoading(true);
    try {
      await resendVerificationEmail(currentEmail);
      addToast('Código de verificación enviado.', 'success');
      setResendCooldown(10);
      onCodeSent(); // Cambia al Paso 2 (los 6 dígitos)
    } catch (error) {
      addToast(error.message || 'Error al enviar el código', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = async (e) => {
    if (e) e.preventDefault();
    if (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail)) {
      addToast('Introduce un email válido.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await updateEmailForVerification(newEmail);
      addToast(`Código enviado a ${newEmail}`, 'success');
      onEmailUpdated(newEmail); // Cambia al Paso 2 (los 6 dígitos)
    } catch (error) {
      addToast(error.message || 'Error al vincular email', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary p-4 animate-[fade-in_0.5s_ease-out]">
      <div className="w-full max-w-sm text-center">
        
        {/* Encabezado fuera del GlassCard (Estilo Registro) */}
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
            {isDummyEmail ? (
              <ShieldCheck className="w-8 h-8 text-bg-secondary" />
            ) : (
              <Mail className="w-8 h-8 text-bg-secondary" />
            )}
          </div>
          <h1 className="text-4xl font-extrabold mb-2">
            {isDummyEmail ? 'Vincular Email' : 'Verificar Email'}
          </h1>
          <p className="text-text-secondary">
            {isDummyEmail 
              ? 'Tu cuenta de X necesita un correo real para recibir el código de seguridad.' 
              : 'Confirma tu identidad para poder continuar.'}
          </p>
        </div>

        <GlassCard className="p-8">
          {!isChangingEmail ? (
            /* VISTA: REENVIAR AL EMAIL ACTUAL */
            <div className="flex flex-col gap-5">
              <div className="bg-bg-secondary p-4 rounded-md border border-glass-border text-center">
                <p className="text-sm text-text-secondary mb-1">Email actual:</p>
                <p className="font-bold text-text-primary text-lg break-all">{currentEmail}</p>
              </div>

              <button
                onClick={handleResendToCurrentEmail}
                disabled={isLoading || resendCooldown > 0}
                className="flex items-center justify-center w-full rounded-md bg-accent text-bg-secondary font-semibold py-3 transition hover:scale-105 hover:shadow-lg shadow-accent/20 disabled:opacity-70"
              >
                {isLoading ? <Spinner size="sm" /> : (resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Enviar código')}
              </button>

              <button
                onClick={() => setIsChangingEmail(true)}
                className="text-sm text-accent hover:text-accent/80 transition mt-2 font-medium"
              >
                Usar un correo distinto
              </button>
            </div>
          ) : (
            /* VISTA: ESCRIBIR NUEVO EMAIL (La que verán los de X) */
            <form onSubmit={handleChangeEmail} className="flex flex-col gap-5" noValidate>
              <div>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary text-center text-lg focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition placeholder:text-text-muted"
                  placeholder="ejemplo@correo.com"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !newEmail}
                className="flex items-center justify-center w-full rounded-md bg-accent text-bg-secondary font-semibold py-3 transition hover:scale-105 hover:shadow-lg shadow-accent/20 disabled:opacity-70"
              >
                {isLoading ? <Spinner size="sm" /> : 'Vincular y Enviar'}
              </button>

              {/* Botón Volver solo si no es obligatorio cambiarlo */}
              {!isDummyEmail && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingEmail(false)}
                    className="flex items-center justify-center w-full text-sm text-text-muted hover:text-text-primary transition"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Volver
                  </button>
                </div>
              )}
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default EmailVerificationModal;