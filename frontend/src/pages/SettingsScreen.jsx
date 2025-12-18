/* frontend/src/pages/SettingsScreen.jsx */
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ChevronLeft, Check, Palette, Sun, Moon, MonitorCog, User, Shield,
  LogOut, Info, ChevronRight, Cookie, Mail, BellRing, Smartphone,
  ShieldAlert, MailWarning, Instagram, Share2
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { APP_VERSION } from '../config/version';
import { usePushNotifications } from '../hooks/usePushNotifications';
import Spinner from '../components/Spinner';
import * as userService from '../services/userService';
import { useToast } from '../hooks/useToast';
import ActiveSessions from '../components/ActiveSessions'; // --- AÑADIDO ---

// --- Constantes ---
const ACCENT_OPTIONS = [
  { id: 'green', label: 'Verde', hex: '#22c55e' },
  { id: 'blue', label: 'Azul', hex: '#3b82f6' },
  { id: 'violet', label: 'Violeta', hex: '#8b5cf6' },
  { id: 'amber', label: 'Ámbar', hex: '#f59e0b' },
  { id: 'rose', label: 'Rosa', hex: '#f43f5e' },
  { id: 'teal', label: 'Turquesa', hex: '#14b8a6' },
  { id: 'cyan', label: 'Cian', hex: '#06b6d4' },
  { id: 'orange', label: 'Naranja', hex: '#f97316' },
  { id: 'lime', label: 'Lima', hex: '#84cc16' },
  { id: 'fuchsia', label: 'Fucsia', hex: '#d946ef' },
  { id: 'emerald', label: 'Esmeralda', hex: '#10b981' },
  { id: 'indigo', label: 'Índigo', hex: '#6366f1' },
  { id: 'purple', label: 'Púrpura', hex: '#a855f7' },
  { id: 'pink', label: 'Rosa Claro', hex: '#ec4899' },
  { id: 'red', label: 'Rojo', hex: '#ef4444' },
  { id: 'yellow', label: 'Amarillo', hex: '#eab308' },
  { id: 'sky', label: 'Cielo', hex: '#0ea5e9' },
  { id: 'slate', label: 'Pizarra', hex: '#64748b' },
  { id: 'zinc', label: 'Zinc', hex: '#71717a' },
  { id: 'stone', label: 'Piedra', hex: '#78716c' },
  { id: 'neutral', label: 'Neutral', hex: '#737373' }
];

// --- Sub-componentes para mantener el código limpio ---
const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4 text-text-primary">
    <Icon size={18} className="text-accent" />
    <h2 className="text-lg font-semibold">{title}</h2>
  </div>
);

const SettingsCard = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-[--glass-border] bg-[--glass-bg] backdrop-blur-glass p-5 ${className}`}>
    {children}
  </div>
);

const SettingsItem = ({ icon: Icon, title, subtitle, onClick, action, danger }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-transparent transition-all hover:bg-bg-secondary/50 
      ${danger ? 'text-red hover:bg-red/10' : 'text-text-primary hover:border-[--glass-border]'}`}
  >
    {Icon && <Icon size={20} className={danger ? 'text-red' : 'text-accent'} />}
    <div className="flex-1 text-left">
      <div className="text-sm font-semibold">{title}</div>
      {subtitle && <div className={`text-xs ${danger ? 'text-red/70' : 'text-text-secondary'}`}>{subtitle}</div>}
    </div>
    {action}
  </button>
);

export default function SettingsScreen({
  theme = 'system',
  setTheme,
  accent = 'green',
  setAccent,
  setView,
  onLogoutClick
}) {
  const { userProfile, resetCookieConsent, setUserProfile } = useAppStore(state => ({
    userProfile: state.userProfile,
    resetCookieConsent: state.resetCookieConsent,
    setUserProfile: state.setUserProfile
  }));

  const { addToast } = useToast();
  const [currentColorPage, setCurrentColorPage] = useState(0);
  const [isUpdatingEmailPref, setIsUpdatingEmailPref] = useState(false);

  // Hook de Notificaciones Push
  const {
    isSubscribed,
    subscribe,
    unsubscribe,
    isLoading: isPushLoading,
    isSupported: isPushSupported,
    permission: pushPermission
  } = usePushNotifications();

  // Paginación de colores
  const COLORS_PER_PAGE = 12;
  const totalPages = Math.ceil(ACCENT_OPTIONS.length / COLORS_PER_PAGE);
  const currentColors = ACCENT_OPTIONS.slice(
    currentColorPage * COLORS_PER_PAGE,
    (currentColorPage * COLORS_PER_PAGE) + COLORS_PER_PAGE
  );

  // Handler para el toggle de notificaciones de email
  const handleToggleLoginEmail = async () => {
    if (!userProfile?.two_factor_enabled) return; // Guard de seguridad

    setIsUpdatingEmailPref(true);
    const newValue = !userProfile.login_email_notifications;

    try {
      // Optimistic update
      setUserProfile({ ...userProfile, login_email_notifications: newValue });

      // Llamada al backend
      await userService.updateUserProfile({ login_email_notifications: newValue });

      addToast(
        newValue ? 'Alertas por email activadas' : 'Alertas por email desactivadas',
        'success'
      );
    } catch (error) {
      // Revertir en caso de error
      setUserProfile({ ...userProfile, login_email_notifications: !newValue });
      addToast('Error al actualizar preferencias', 'error');
      console.error(error);
    } finally {
      setIsUpdatingEmailPref(false);
    }
  };

  return (
    <div className="px-4 pb-20 md:p-8 max-w-7xl mx-auto animate-[fade-in_0.3s_ease-out]">
      <Helmet>
        <title>Ajustes - Pro Fitness Glass</title>
      </Helmet>

      {/* Header Mobile/Desktop */}
      <div className="flex items-center justify-between mb-6 pt-4 md:pt-0">
        <button
          onClick={() => setView('dashboard')}
          className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[--glass-border] text-text-secondary hover:text-text-primary hover:bg-accent-transparent transition"
        >
          <ChevronLeft size={18} /> <span className="text-sm font-medium">Volver</span>
        </button>
        <h1 className="text-2xl font-bold flex-1 text-center md:text-left md:ml-4">Ajustes</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">

        {/* --- COLUMNA 1: APARIENCIA --- */}
        <SettingsCard>
          <SectionTitle icon={Palette} title="Apariencia" />

          <div className="mb-6">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Tema</h3>
            <div className="grid grid-cols-4 gap-2">
              {['system', 'light', 'dark', 'oled'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${theme === mode
                    ? 'bg-accent text-bg-secondary border-transparent shadow-lg shadow-accent/20'
                    : 'border-[--glass-border] text-text-secondary hover:bg-bg-secondary'
                    }`}
                >
                  {mode === 'system' && <MonitorCog size={20} />}
                  {mode === 'light' && <Sun size={20} />}
                  {mode === 'dark' && <Moon size={20} />}
                  {mode === 'oled' && <Smartphone size={20} />}
                  <span className="text-xs font-medium capitalize">
                    {mode === 'system' ? 'Sistema' :
                      mode === 'light' ? 'Claro' :
                        mode === 'dark' ? 'Oscuro' : 'OLED'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Acento</h3>
              {totalPages > 1 && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentColorPage(p => Math.max(0, p - 1))}
                    disabled={currentColorPage === 0}
                    className="p-1 rounded hover:bg-bg-secondary disabled:opacity-30"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setCurrentColorPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentColorPage === totalPages - 1}
                    className="p-1 rounded hover:bg-bg-secondary disabled:opacity-30"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-6 gap-3">
              {currentColors.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setAccent(opt.id)}
                  title={opt.label}
                  className="group relative flex justify-center items-center"
                >
                  <span
                    className="w-8 h-8 rounded-full border transition-transform hover:scale-110"
                    style={{
                      backgroundColor: opt.hex,
                      borderColor: accent === opt.id ? opt.hex : 'transparent',
                      boxShadow: accent === opt.id ? `0 0 0 2px var(--bg-primary), 0 0 0 4px ${opt.hex}` : 'none'
                    }}
                  />
                  {accent === opt.id && (
                    <span className="absolute inset-0 flex items-center justify-center text-white pointer-events-none shadow-sm">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </SettingsCard>

        {/* --- COLUMNA 2: CUENTA Y SEGURIDAD --- */}
        <div className="flex flex-col gap-6">
          <SettingsCard>
            <SectionTitle icon={User} title="Perfil" />
            <div className="flex flex-col gap-1">
              <SettingsItem
                icon={User}
                title="Datos Físicos"
                subtitle="Editar peso, altura, objetivos..."
                onClick={() => setView('physicalProfileEditor')}
                action={<ChevronRight size={16} className="text-text-muted" />}
              />
            </div>
          </SettingsCard>

          <SettingsCard>
            <SectionTitle icon={Shield} title="Seguridad y Privacidad" />
            <div className="flex flex-col gap-1">
              {/* Opción de 2FA */}
              <SettingsItem
                icon={Smartphone}
                title="Verificación en 2 pasos"
                subtitle={userProfile?.two_factor_enabled
                  ? `Activado (${userProfile.two_factor_method === 'app' ? 'App' : 'Email'})`
                  : "Protege tu cuenta"
                }
                onClick={() => setView('twoFactorSetup')}
                action={
                  <div className={`px-2 py-1 rounded text-xs font-bold ${userProfile?.two_factor_enabled ? 'bg-green-500/20 text-green-500' : 'bg-text-muted/20 text-text-muted'}`}>
                    {userProfile?.two_factor_enabled ? 'ACTIVADO' : 'DESACTIVADO'}
                  </div>
                }
              />

              <SettingsItem
                icon={Cookie}
                title="Cookies"
                subtitle="Gestionar consentimiento"
                onClick={resetCookieConsent}
              />

              {userProfile?.role === 'admin' && (
                <SettingsItem
                  icon={Shield}
                  title="Panel Admin"
                  subtitle="Gestión avanzada"
                  onClick={() => setView('adminPanel')}
                  danger={false}
                />
              )}
            </div>
          </SettingsCard>

          {/* --- NUEVA SECCIÓN: GESTIÓN DE SESIONES --- */}
          <SettingsCard>
            <ActiveSessions />
          </SettingsCard>
        </div>

        {/* --- COLUMNA 3: NOTIFICACIONES Y GENERAL --- */}
        <div className="flex flex-col gap-6">

          <SettingsCard>
            <SectionTitle icon={BellRing} title="Notificaciones" />

            <div className="flex flex-col gap-4">

              {/* 1. Push Notifications */}
              {isPushSupported && (
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-bg-secondary/30 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg text-accent">
                      <BellRing size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Push Notifications</div>
                      <div className="text-xs text-text-secondary">
                        {pushPermission === 'denied' ? 'Bloqueadas en navegador' : (isSubscribed ? 'Recibiendo alertas' : 'Pausadas')}
                      </div>
                    </div>
                  </div>
                  {isPushLoading ? <Spinner size={20} /> : (
                    <button
                      role="switch"
                      aria-checked={isSubscribed}
                      onClick={() => (isSubscribed ? unsubscribe() : subscribe())}
                      disabled={pushPermission === 'denied'}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[--glass-bg]
                        ${isSubscribed ? 'bg-accent' : 'bg-bg-secondary [.light-theme_&]:bg-zinc-300'} 
                        ${pushPermission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isSubscribed ? 'translate-x-5' : 'translate-x-0'} `}
                      />
                    </button>
                  )}
                </div>
              )}

              {/* 2. Alertas de Seguridad por Email (Login Notifications) */}
              <div className={`flex items-center justify-between p-3 rounded-xl transition
                  ${!userProfile?.two_factor_enabled ? 'opacity-60 bg-bg-secondary/20' : 'hover:bg-bg-secondary/30'}
                `}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${userProfile?.two_factor_enabled ? 'bg-orange-500/10 text-orange-500' : 'bg-text-muted/10 text-text-muted'}`}>
                    {userProfile?.two_factor_enabled ? <ShieldAlert size={20} /> : <MailWarning size={20} />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Alertas de Inicio de Sesión</div>
                    <div className="text-xs text-text-secondary">
                      {userProfile?.two_factor_enabled
                        ? 'Recibir email al iniciar sesión'
                        : 'Requiere verificación en 2 pasos'}
                    </div>
                  </div>
                </div>

                <button
                  role="switch"
                  aria-checked={!!userProfile?.login_email_notifications}
                  onClick={handleToggleLoginEmail}
                  disabled={!userProfile?.two_factor_enabled || isUpdatingEmailPref}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[--glass-bg]
                    ${userProfile?.login_email_notifications ? 'bg-accent' : 'bg-bg-secondary [.light-theme_&]:bg-zinc-300'}
                    ${(!userProfile?.two_factor_enabled || isUpdatingEmailPref) ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out 
                      ${userProfile?.login_email_notifications ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>

            </div>
          </SettingsCard>

          {/* --- REDES SOCIALES --- */}
          <SettingsCard>
            <SectionTitle icon={Share2} title="Síguenos" />
            <div className="flex flex-col gap-1">
              <a href="https://www.instagram.com/pro_fitness_glass/" target="_blank" rel="noopener noreferrer" className="no-underline">
                <SettingsItem
                  icon={Instagram}
                  title="Instagram"
                  subtitle="@pro_fitness_glass"
                  action={<ChevronRight size={16} className="text-text-muted" />}
                />
              </a>
            </div>
          </SettingsCard>

          <SettingsCard>
            <SectionTitle icon={Info} title="General" />
            <div className="flex flex-col gap-1">
              <a href="mailto:profitnessglass@gmail.com" className="no-underline">
                <SettingsItem
                  icon={Mail}
                  title="Soporte"
                  subtitle="profitnessglass@gmail.com"
                />
              </a>
              <a href="https://wger.de" target="_blank" rel="noopener noreferrer" className="no-underline">
                <SettingsItem
                  icon={Info}
                  title="Créditos"
                  subtitle="Datos por wger"
                />
              </a>

              <div className="my-2 h-px bg-[--glass-border]" />

              <SettingsItem
                icon={LogOut}
                title="Cerrar Sesión"
                onClick={onLogoutClick}
                danger
              />

              <div className="mt-4 text-center text-xs text-text-muted font-mono">
                v{APP_VERSION}
              </div>
            </div>
          </SettingsCard>
        </div>

      </div>
    </div>
  );
}