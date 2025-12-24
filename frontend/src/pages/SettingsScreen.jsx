/* frontend/src/pages/SettingsScreen.jsx */
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Check, Palette, Sun, Moon, MonitorCog, User, Shield,
  LogOut, Info, ChevronRight, Cookie, Mail, BellRing, Smartphone,
  ShieldAlert, MailWarning, Instagram, Share2, Binary, Users, Trophy, Medal, Eye, ChevronLeft,
  Bug
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { APP_VERSION } from '../config/version';
import { usePushNotifications } from '../hooks/usePushNotifications';
import Spinner from '../components/Spinner';
import * as userService from '../services/userService';
import { useToast } from '../hooks/useToast';
import ActiveSessions from '../components/ActiveSessions';
import BugReportModal from '../components/BugReportModal';

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

// --- Sub-componentes ---
const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4 text-text-primary">
    <Icon size={18} className="text-accent" />
    <h2 className="text-lg font-semibold">{title}</h2>
  </div>
);

const SettingsCard = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-[--glass-border] bg-[--glass-bg] backdrop-blur-glass p-5 h-full ${className}`}>
    {children}
  </div>
);

const SettingsItem = ({ icon: Icon, title, subtitle, onClick, action, danger }) => {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-transparent transition-all 
      active:bg-bg-secondary/50 md:hover:bg-bg-secondary/50
      ${danger
          ? 'text-red active:bg-red/10 md:hover:bg-red/10'
          : 'text-text-primary md:hover:border-[--glass-border]'}`}
    >
      {Icon && <Icon size={20} className={danger ? 'text-red' : 'text-accent'} />}
      <div className="flex-1 text-left">
        <div className="text-sm font-semibold">{title}</div>
        {subtitle && <div className={`text-xs ${danger ? 'text-red/70' : 'text-text-secondary'}`}>{subtitle}</div>}
      </div>
      {action}
    </Component>
  );
};

const SwitchItem = ({ icon: Icon, title, subtitle, checked, onChange, disabled, loading }) => (
  <div className={`flex items-center justify-between p-3 rounded-xl transition ${disabled ? 'opacity-50' : 'hover:bg-bg-secondary/30'}`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${checked ? 'bg-accent/10 text-accent' : 'bg-text-muted/10 text-text-muted'}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-text-secondary">{subtitle}</div>
      </div>
    </div>
    {loading ? <Spinner size={20} /> : (
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[--glass-bg]
        ${checked ? 'bg-accent' : 'bg-bg-secondary [.light-theme_&]:bg-zinc-300'} 
        ${disabled ? 'cursor-not-allowed' : ''}
        `}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    )}
  </div>
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
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  // MODIFICACIÓN: Detecta si existe la bandera 'hasContent' en el borrador de localStorage
  // Si existe, abrimos el modal automáticamente. El contenido real se cargará desde IndexedDB dentro del modal.
  const [showBugModal, setShowBugModal] = useState(() => {
    try {
      const draftStr = localStorage.getItem('bug_report_draft');
      if (!draftStr) return false;
      const draft = JSON.parse(draftStr);
      // La nueva estructura guarda { hasContent: true, ... }
      // Mantenemos compatibilidad con la estructura vieja por si acaso
      return !!(draft.hasContent || draft.category || draft.subject?.trim() || draft.description?.trim());
    } catch {
      return false;
    }
  });

  const {
    isSubscribed,
    subscribe,
    unsubscribe,
    isLoading: isPushLoading,
    isSupported: isPushSupported,
    permission: pushPermission
  } = usePushNotifications();

  const COLORS_PER_PAGE = 12;
  const totalPages = Math.ceil(ACCENT_OPTIONS.length / COLORS_PER_PAGE);
  const currentColors = ACCENT_OPTIONS.slice(
    currentColorPage * COLORS_PER_PAGE,
    (currentColorPage * COLORS_PER_PAGE) + COLORS_PER_PAGE
  );

  const handleToggleLoginEmail = async () => {
    if (!userProfile?.two_factor_enabled) return;
    setIsUpdatingEmailPref(true);
    const newValue = !userProfile.login_email_notifications;

    try {
      setUserProfile({ ...userProfile, login_email_notifications: newValue });
      await userService.updateUserProfile({ login_email_notifications: newValue });
      addToast(newValue ? 'Alertas por email activadas' : 'Alertas por email desactivadas', 'success');
    } catch (error) {
      setUserProfile({ ...userProfile, login_email_notifications: !newValue });
      addToast('Error al actualizar preferencias', 'error');
      console.error(error);
    } finally {
      setIsUpdatingEmailPref(false);
    }
  };

  const handleTogglePrivacy = async (key, label) => {
    if (isUpdatingPrivacy) return;
    setIsUpdatingPrivacy(true);
    const newValue = !userProfile?.[key];

    // Optimistic Update
    const prevValue = userProfile?.[key];
    setUserProfile({ ...userProfile, [key]: newValue });

    try {
      await userService.updateUserProfile({ [key]: newValue });
      addToast(`${label} ${newValue ? 'activado' : 'desactivado'}`, 'success');
    } catch (error) {
      setUserProfile({ ...userProfile, [key]: prevValue });
      addToast(`Error al actualizar ${label.toLowerCase()}`, 'error');
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  return (
    <div className="px-4 pb-6 md:p-8 max-w-7xl mx-auto animate-[fade-in_0.3s_ease-out]">
      <Helmet>
        <title>Ajustes - Pro Fitness Glass</title>
      </Helmet>

      <div className="flex items-center justify-between mb-6 pt-4 md:pt-0">
        <h1 className="hidden md:flex text-3xl md:text-4xl font-extrabold flex-1 text-left text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary mt-10 md:mt-0">
          Ajustes
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">

        {/* --- COLUMNA 1: APARIENCIA Y NOTIFICACIONES --- */}
        <div className="flex flex-col gap-6">
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

          <SettingsCard>
            <SectionTitle icon={BellRing} title="Notificaciones" />
            <div className="flex flex-col gap-2">
              {isPushSupported && (
                <SwitchItem
                  icon={BellRing}
                  title="Push Notifications"
                  subtitle={pushPermission === 'denied' ? 'Bloqueadas en navegador' : (isSubscribed ? 'Recibiendo alertas' : 'Pausadas')}
                  checked={isSubscribed}
                  onChange={() => (isSubscribed ? unsubscribe() : subscribe())}
                  disabled={pushPermission === 'denied'}
                  loading={isPushLoading}
                />
              )}

              <SwitchItem
                icon={userProfile?.two_factor_enabled ? ShieldAlert : MailWarning}
                title="Alertas de Inicio"
                subtitle={userProfile?.two_factor_enabled ? 'Email al iniciar sesión' : 'Requiere 2FA'}
                checked={!!userProfile?.login_email_notifications}
                onChange={handleToggleLoginEmail}
                disabled={!userProfile?.two_factor_enabled || isUpdatingEmailPref}
              />
            </div>
          </SettingsCard>
        </div>

        {/* --- COLUMNA 2: PERFIL Y PRIVACIDAD --- */}
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
            <SectionTitle icon={Users} title="Privacidad Social" />
            <div className="flex flex-col gap-2">
              <SwitchItem
                icon={Eye}
                title="Perfil Público"
                subtitle="Aparecer en búsquedas y ranking"
                checked={!!userProfile?.is_public_profile}
                onChange={() => handleTogglePrivacy('is_public_profile', 'Perfil público')}
                disabled={isUpdatingPrivacy}
              />
              <SwitchItem
                icon={Trophy}
                title="Mostrar Nivel y XP"
                subtitle="Visible para otros usuarios"
                checked={!!userProfile?.show_level_xp}
                onChange={() => handleTogglePrivacy('show_level_xp', 'Nivel y XP')}
                disabled={isUpdatingPrivacy || !userProfile?.is_public_profile}
              />
              <SwitchItem
                icon={Medal}
                title="Mostrar Insignias"
                subtitle="Compartir tus logros"
                checked={!!userProfile?.show_badges}
                onChange={() => handleTogglePrivacy('show_badges', 'Insignias')}
                disabled={isUpdatingPrivacy || !userProfile?.is_public_profile}
              />
            </div>
          </SettingsCard>

          <SettingsCard>
            <ActiveSessions />
          </SettingsCard>
        </div>

        {/* --- COLUMNA 3: SEGURIDAD, SOPORTE Y GENERAL --- */}
        <div className="flex flex-col gap-6">
          <SettingsCard>
            <SectionTitle icon={Shield} title="Seguridad" />
            <div className="flex flex-col gap-1">
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

          <SettingsCard>
            <SectionTitle icon={Info} title="Soporte y General" />
            <div className="flex flex-col gap-1">
              <SettingsItem
                icon={Bug}
                title="Reportar un problema"
                subtitle="¿Algo no funciona bien?"
                onClick={() => setShowBugModal(true)}
              />

              <a href="mailto:profitnessglass@gmail.com" className="no-underline">
                <SettingsItem icon={Mail} title="Contactar Soporte" subtitle="profitnessglass@gmail.com" />
              </a>

              <div className="my-2 h-px bg-[--glass-border]" />

              <SectionTitle icon={Share2} title="Síguenos" />
              <a href="https://www.instagram.com/pro_fitness_glass/" target="_blank" rel="noopener noreferrer" className="no-underline">
                <SettingsItem
                  icon={Instagram}
                  title="Instagram"
                  subtitle="@pro_fitness_glass"
                  action={<ChevronRight size={16} className="text-text-muted" />}
                />
              </a>

              <div className="my-2 h-px bg-[--glass-border]" />

              <a href="https://wger.de" target="_blank" rel="noopener noreferrer" className="no-underline">
                <SettingsItem icon={Info} title="Créditos" subtitle="Datos por wger" />
              </a>

              <div className="flex md:hidden items-center gap-3 w-full px-4 py-3 rounded-xl border border-transparent text-text-primary">
                <Binary size={20} className="text-accent" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold">Versión de App</div>
                  <div className="text-xs text-text-secondary">v{APP_VERSION}</div>
                </div>
              </div>

              <div className="my-2 h-px bg-[--glass-border]" />

              <SettingsItem
                icon={LogOut}
                title="Cerrar Sesión"
                onClick={onLogoutClick}
                danger
              />
            </div>
          </SettingsCard>
        </div>
      </div>

      {showBugModal && (
        <BugReportModal onClose={() => setShowBugModal(false)} />
      )}
    </div>
  );
}