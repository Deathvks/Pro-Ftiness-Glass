import ModalPortal from './ModalPortal';
import React, { useState } from 'react';
import { LockClosedIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import apiClient from '../services/apiClient';
import useAppStore from '../store/useAppStore';
import useModalLock from '../hooks/useModalLock';

export default function ForcePasswordResetModal() {

  // --- Bloquear scroll del fondo y swipe entre páginas ---
  useModalLock();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const reqs = [
  { id: 'length', label: 'Al menos 12 caracteres', valid: password.length >= 12 },
  { id: 'upper', label: 'Una mayúscula', valid: /[A-Z]/.test(password) },
  { id: 'lower', label: 'Una minúscula', valid: /[a-z]/.test(password) },
  { id: 'special', label: 'Un carácter especial (!@#$...)', valid: /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/'`]/.test(password) },
  { id: 'digits', label: 'No más de 3 números seguidos', valid: !/\d{4,}/.test(password) && password.length > 0 }];

  const isValidPassword = reqs.every((r) => r.valid);

  const validatePasswordStrength = (pwd) => {
    if (pwd.length < 12) return 'La contraseña debe tener al menos 12 caracteres.';
    if (!/[A-Z]/.test(pwd)) return 'Debe contener al menos una letra mayúscula.';
    if (!/[a-z]/.test(pwd)) return 'Debe contener al menos una letra minúscula.';
    if (!/[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/'`]/.test(pwd)) return 'Debe contener al menos un carácter especial.';
    if (/\d{4,}/.test(pwd)) return 'No puede tener más de 3 números seguidos.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const strengthError = validatePasswordStrength(password);
    if (strengthError) {
      setError(strengthError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiClient('/auth/force-reset', { method: 'POST', body: { newPassword: password } });
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-primary/95 backdrop-blur-xl">
      <div className="w-full max-w-sm bg-bg-secondary border border-glass-border rounded-3xl p-6 shadow-2xl flex flex-col items-center animate-fade-in-up">
        
        {!success ?
        <>
            <div className="w-16 h-16 bg-accent/20 text-accent rounded-full flex items-center justify-center mb-4">
              <LockClosedIcon className="w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-black text-text-primary text-center mb-2">Seguridad</h2>
            <p className="text-sm text-text-secondary text-center mb-6">
              Tu cuenta ha sido creada por un entrenador personal. Por seguridad, debes establecer una nueva contraseña antes de continuar.
            </p>

            {error &&
          <div
            className="w-full p-3 mb-4 rounded-xl text-sm text-center font-bold shadow-lg"
            style={{ backgroundColor: '#dc2626', color: '#ffffff', border: '1px solid #b91c1c' }}>
            
                {error}
              </div>
          }

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nueva contraseña</label>
                <div className="relative">
                  <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-12 bg-bg-primary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="Escribe tu nueva contraseña" />
                
                  <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text-primary transition-colors">
                  
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-2">
                  {reqs.map((r) =>
                <div key={r.id} className="flex items-center gap-1.5">
                      {r.valid ?
                  <CheckCircleIcon className="w-4 h-4 text-green-500 shrink-0" /> :

                  <div className="w-4 h-4 rounded-full border border-glass-border shrink-0" />
                  }
                      <span className={`text-[11px] sm:text-xs transition-colors ${r.valid ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {r.label}
                      </span>
                    </div>
                )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Confirmar contraseña</label>
                <div className="relative">
                  <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 pr-12 bg-bg-primary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="Repite la contraseña" />
                
                  <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text-primary transition-colors">
                  
                    {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                
                <div className="mt-2 flex items-center gap-1.5">
                  {confirmPassword.length > 0 && password === confirmPassword ?
                <CheckCircleIcon className="w-4 h-4 text-green-500 shrink-0" /> :

                <div className="w-4 h-4 rounded-full border border-glass-border shrink-0" />
                }
                  <span className={`text-[11px] sm:text-xs transition-colors ${confirmPassword.length > 0 && password === confirmPassword ? 'text-text-primary' : 'text-text-secondary'}`}>
                    Las contraseñas coinciden
                  </span>
                </div>
              </div>

              <button
              type="submit"
              disabled={loading || !isValidPassword || !confirmPassword || password !== confirmPassword}
              className="w-full mt-2 py-4 bg-accent text-bg-primary font-bold rounded-2xl active:scale-95 transition-all disabled:opacity-50 disabled:grayscale">
              
                {loading ? 'Guardando...' : 'Cambiar y Continuar'}
              </button>
            </form>
          </> :

        <div className="flex flex-col items-center py-6 animate-scale-in">
            <CheckCircleIcon className="w-20 h-20 text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-text-primary">¡Contraseña guardada!</h2>
            <p className="text-sm text-text-secondary mt-2">Accediendo a tu cuenta...</p>
          </div>
        }

      </div>
    </div></ModalPortal>;

}