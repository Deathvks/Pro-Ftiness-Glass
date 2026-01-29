/* frontend/src/pages/SettingsScreen.jsx */
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Check, Palette, Sun, Moon, MonitorCog, User, Shield,
  LogOut, Info, ChevronRight, Cookie, Mail, BellRing, Smartphone,
  ShieldAlert, MailWarning, Instagram, Share2, Binary, Users, Trophy, Medal, Eye, ChevronLeft,
  Bug, Download, Vibrate, Globe, Clock, MapPin, Youtube
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { APP_VERSION } from '../config/version';
import { usePushNotifications } from '../hooks/usePushNotifications';
import Spinner from '../components/Spinner';
import * as userService from '../services/userService';
import { useToast } from '../hooks/useToast';
import ActiveSessions from '../components/ActiveSessions';
import BugReportModal from '../components/BugReportModal';
import ConfirmationModal from '../components/ConfirmationModal';
import CustomSelect from '../components/CustomSelect';
import GlassCard from '../components/GlassCard';
import { useAppTheme } from '../hooks/useAppTheme';

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

// --- TIMEZONES COMUNES ---
const TIMEZONES = [
  { value: 'Europe/Madrid', label: 'Europa/Madrid (Península)' },
  { value: 'Atlantic/Canary', label: 'Atlantic/Canary (Islas Canarias)' },
  { value: 'Europe/London', label: 'Europa/Londres (UTC)' },
  { value: 'America/New_York', label: 'America/New York (EST)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina' },
  { value: 'America/Mexico_City', label: 'México CDMX' },
  { value: 'America/Bogota', label: 'Colombia (Bogotá)' },
  { value: 'America/Santiago', label: 'Chile (Santiago)' },
  { value: 'UTC', label: 'UTC (Universal)' },
];

// Detección simple de iOS
const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  return [
    'iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'
  ].includes(navigator.platform)
    // iPad en iOS 13+ detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
};

// --- Sub-componentes ---
const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 mb-5 text-text-primary px-1">
    <Icon size={22} className="text-accent" />
    <h2 className="text-xl font-bold">{title}</h2>
  </div>
);

const SettingsItem = ({ icon: Icon, title, subtitle, onClick, action, danger }) => {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border border-transparent transition-all 
      active:bg-bg-secondary/50 md:hover:bg-bg-secondary/50
      ${danger
          ? 'text-red active:bg-red/10 md:hover:bg-red/10'
          : 'text-text-primary md:hover:border-[--glass-border]'}`}
    >
      {/* CORRECCIÓN: flex-shrink-0 para que el icono no se aplaste */}
      {Icon && <Icon size={22} className={`flex-shrink-0 ${danger ? 'text-red' : 'text-accent'}`} />}
      <div className="flex-1 text-left min-w-0">
        {/* CORRECCIÓN: Quitamos truncate y añadimos leading-tight para permitir multilínea */}
        <div className="text-sm font-bold leading-tight">{title}</div>
        {subtitle && <div className={`text-xs font-medium truncate ${danger ? 'text-red/70' : 'text-text-secondary'}`}>{subtitle}</div>}
      </div>
      {action && <div className="flex-shrink-0 ml-2">{action}</div>}
    </Component>
  );
};

const SwitchItem = ({ icon: Icon, title, subtitle, checked, onChange, disabled, loading }) => (
  <div className={`flex items-center justify-between p-3 rounded-2xl transition ${disabled ? 'opacity-50' : 'hover:bg-bg-secondary/30'}`}>
    <div className="flex items-center gap-4">
      {/* Contenedor de icono */}
      <div className={`
        p-2.5 rounded-xl border border-transparent
        ${checked ? 'bg-accent/10 text-accent dark:border-accent/20' : 'bg-text-muted/10 text-text-muted dark:border-white/10 [.oled-theme_&]:bg-transparent'}
      `}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-sm font-bold">{title}</div>
        <div className="text-xs font-medium text-text-secondary">{subtitle}</div>
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

// --- Componente Icono Personalizado para TikTok ---
const TikTokIcon = ({ size = 20, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export default function SettingsScreen({
  theme = 'system',
  setTheme,
  accent = 'green',
  setAccent,
  setView,
  onLogoutClick
}) {
  const { resolvedTheme } = useAppTheme();

  const {
    userProfile,
    resetCookieConsent,
    setUserProfile,
    hapticsEnabled,
    setHapticsEnabled
  } = useAppStore(state => ({
    userProfile: state.userProfile,
    resetCookieConsent: state.resetCookieConsent,
    setUserProfile: state.setUserProfile,
    hapticsEnabled: state.hapticsEnabled,
    setHapticsEnabled: state.setHapticsEnabled
  }));

  const { addToast } = useToast();
  const [currentColorPage, setCurrentColorPage] = useState(0);
  const [isUpdatingEmailPref, setIsUpdatingEmailPref] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isUpdatingTimezone, setIsUpdatingTimezone] = useState(false);
  
  const [apkDownloadUrl, setApkDownloadUrl] = useState(null);

  const [showThemeReloadModal, setShowThemeReloadModal] = useState(false);
  const [pendingTheme, setPendingTheme] = useState(null);

  const [autoTimezone, setAutoTimezone] = useState(() => {
    return localStorage.getItem('settings_auto_timezone') === 'true';
  });

  const [showBugModal, setShowBugModal] = useState(() => {
    try {
      const draftStr = localStorage.getItem('bug_report_draft');
      if (!draftStr) return false;
      const draft = JSON.parse(draftStr);
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

  useEffect(() => {
    const fetchVersionInfo = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data && data.downloadUrl) {
            setApkDownloadUrl(data.downloadUrl);
          }
        }
      } catch (error) {
        console.warn("No se pudo obtener la información de versión dinámica", error);
      }
    };
    fetchVersionInfo();
  }, []);

  const COLORS_PER_PAGE = 12;
  const totalPages = Math.ceil(ACCENT_OPTIONS.length / COLORS_PER_PAGE);
  const currentColors = ACCENT_OPTIONS.slice(
    currentColorPage * COLORS_PER_PAGE,
    (currentColorPage * COLORS_PER_PAGE) + COLORS_PER_PAGE
  );

  const timezoneOptions = useMemo(() => {
    const options = [...TIMEZONES];
    const currentUserTz = userProfile?.timezone;

    if (currentUserTz && !options.some(opt => opt.value === currentUserTz)) {
      options.push({ value: currentUserTz, label: currentUserTz });
    }
    return options;
  }, [userProfile?.timezone]);

  const detectAndUpdateTimezone = async (silent = false) => {
    if (isUpdatingTimezone) return;

    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (detected === userProfile?.timezone) {
        if (!silent) addToast('Ya tienes la zona horaria correcta.', 'info');
        return;
      }

      setIsUpdatingTimezone(true);
      const prevTimezone = userProfile?.timezone;

      setUserProfile({ ...userProfile, timezone: detected });

      try {
        await userService.updateUserProfile({ timezone: detected });
        if (!silent) addToast(`Zona horaria actualizada: ${detected}`, 'success');
      } catch (error) {
        setUserProfile({ ...userProfile, timezone: prevTimezone });
        if (!silent) addToast('Error al cambiar zona horaria', 'error');
      } finally {
        setIsUpdatingTimezone(false);
      }
    } catch (e) {
      if (!silent) addToast('No se pudo detectar la zona horaria.', 'error');
    }
  };

  useEffect(() => {
    if (autoTimezone) {
      detectAndUpdateTimezone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTimezone]);

  const handleTimezoneChange = async (newTimezone) => {
    if (isUpdatingTimezone) return;
    setIsUpdatingTimezone(true);
    const prevTimezone = userProfile?.timezone;

    setUserProfile({ ...userProfile, timezone: newTimezone });

    try {
      await userService.updateUserProfile({ timezone: newTimezone });
      addToast(`Zona horaria actualizada`, 'success');
    } catch (error) {
      setUserProfile({ ...userProfile, timezone: prevTimezone });
      addToast('Error al cambiar zona horaria', 'error');
    } finally {
      setIsUpdatingTimezone(false);
    }
  };

  const handleToggleAutoTimezone = () => {
    const newValue = !autoTimezone;
    setAutoTimezone(newValue);
    localStorage.setItem('settings_auto_timezone', newValue);

    if (newValue) {
      detectAndUpdateTimezone(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const blob = await userService.exportMyData(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pro-fitness-data-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast(`Datos exportados en ${format.toUpperCase()}`, 'success');
    } catch (error) {
      console.error(error);
      addToast('Error al exportar datos', 'error');
    }
  };

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

  const getPushSubtitle = () => {
    if (!isPushSupported) return 'No soportado en este dispositivo/navegador';
    if (pushPermission === 'denied') return 'Bloqueadas en navegador';
    if (isSubscribed) return 'Recibiendo alertas';
    return 'Pausadas';
  };

  const handleThemeClick = (mode) => {
    if (isIOS()) {
      setPendingTheme(mode);
      setShowThemeReloadModal(true);
    } else {
      setTheme(mode);
    }
  };

  const confirmThemeReload = () => {
    if (pendingTheme) {
      setTheme(pendingTheme);
      window.location.reload();
    }
    setShowThemeReloadModal(false);
  };

  const glassCardClass = "p-6 border-transparent dark:border dark:border-white/10";

  return (
    // CAMBIO: Añadido pt-6 para separar del borde superior en móvil
    <div className="px-4 pt-6 pb-24 md:p-8 max-w-7xl mx-auto animate-[fade-in_0.3s_ease-out]">
      <Helmet>
        <title>Ajustes - Pro Fitness Glass</title>
      </Helmet>

      {/* CORRECCIÓN: Contenedor oculto en móvil (hidden md:flex) para evitar espacios y título degradado visible solo en escritorio */}
      <div className="hidden md:flex items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary">
          Ajustes
        </h1>
      </div>

      {/* LAYOUT: Grid responsivo de 1, 2 o 3 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">

        {/* --- COLUMNA 1 --- */}
        <div className="flex flex-col gap-8">
          <GlassCard className={glassCardClass}>
            <SectionTitle icon={Palette} title="Apariencia" />

            <div className="mb-8">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Tema</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['system', 'light', 'dark', 'oled'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleThemeClick(mode)}
                    className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all ${theme === mode
                      ? 'bg-accent text-bg-secondary border-transparent shadow-lg shadow-accent/20'
                      : 'border-transparent dark:border-white/10 text-text-secondary hover:bg-bg-secondary bg-transparent dark:bg-white/5 [.oled-theme_&]:bg-transparent'
                      }`}
                  >
                    {mode === 'system' && <MonitorCog size={22} />}
                    {mode === 'light' && <Sun size={22} />}
                    {mode === 'dark' && <Moon size={22} />}
                    {mode === 'oled' && <Smartphone size={22} />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {mode === 'system' ? 'Sistema' :
                        mode === 'light' ? 'Claro' :
                          mode === 'dark' ? 'Oscuro' : 'OLED'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Acento</h3>
                {totalPages > 1 && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentColorPage(p => Math.max(0, p - 1))}
                      disabled={currentColorPage === 0}
                      className="p-1 rounded hover:bg-bg-secondary disabled:opacity-30"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setCurrentColorPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={currentColorPage === totalPages - 1}
                      className="p-1 rounded hover:bg-bg-secondary disabled:opacity-30"
                    >
                      <ChevronRight size={16} />
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
                      className="w-9 h-9 rounded-full border transition-transform hover:scale-110"
                      style={{
                        backgroundColor: opt.hex,
                        borderColor: accent === opt.id ? opt.hex : 'transparent',
                        boxShadow: accent === opt.id ? `0 0 0 2px var(--bg-primary), 0 0 0 4px ${opt.hex}` : 'none'
                      }}
                    />
                    {accent === opt.id && (
                      <span className="absolute inset-0 flex items-center justify-center text-white pointer-events-none shadow-sm">
                        <Check size={16} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[--glass-border]">
              <SwitchItem
                icon={Vibrate}
                title="Vibración"
                subtitle="Feedback táctil en acciones"
                checked={hapticsEnabled}
                onChange={() => {
                  const newValue = !hapticsEnabled;
                  setHapticsEnabled(newValue);
                  addToast(newValue ? 'Vibración activada' : 'Vibración desactivada', 'success');
                }}
              />
            </div>
          </GlassCard>

          <GlassCard className={glassCardClass}>
            <SectionTitle icon={BellRing} title="Notificaciones" />
            <div className="flex flex-col gap-3">
              <SwitchItem
                icon={BellRing}
                title="Push Notifications"
                subtitle={getPushSubtitle()}
                checked={isSubscribed}
                onChange={() => (isSubscribed ? unsubscribe() : subscribe())}
                disabled={!isPushSupported || pushPermission === 'denied'}
                loading={isPushLoading}
              />

              <SwitchItem
                icon={userProfile?.two_factor_enabled ? ShieldAlert : MailWarning}
                title="Alertas de Inicio"
                subtitle={userProfile?.two_factor_enabled ? 'Email al iniciar sesión' : 'Requiere 2FA'}
                checked={!!userProfile?.login_email_notifications}
                onChange={handleToggleLoginEmail}
                disabled={!userProfile?.two_factor_enabled || isUpdatingEmailPref}
              />
            </div>
          </GlassCard>

          {/* MOVIDO AQUI: Seguridad para que esté arriba en tablet */}
          <GlassCard className={glassCardClass}>
            <SectionTitle icon={Shield} title="Seguridad" />
            <div className="flex flex-col gap-1">
              
              <SettingsItem
                icon={Smartphone}
                title="Verificación en 2 pasos"
                onClick={() => setView('twoFactorSetup')}
                action={
                  <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest ${userProfile?.two_factor_enabled ? 'bg-green-500/20 text-green-500' : 'bg-text-muted/20 text-text-muted [.oled-theme_&]:bg-transparent'}`}>
                    {userProfile?.two_factor_enabled ? 'ACTIVADO' : 'DESACTIVADO'}
                  </div>
                }
              />

              <SettingsItem
                icon={Download}
                title="Exportar Datos"
                subtitle="Descarga tu historial"
                action={
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExport('json'); }}
                      className="px-2.5 py-1.5 rounded-lg bg-bg-secondary border border-transparent dark:border-white/10 text-[10px] font-bold hover:bg-accent hover:text-white transition-colors [.oled-theme_&]:bg-transparent"
                    >
                      JSON
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExport('csv'); }}
                      className="px-2.5 py-1.5 rounded-lg bg-bg-secondary border border-transparent dark:border-white/10 text-[10px] font-bold hover:bg-accent hover:text-white transition-colors [.oled-theme_&]:bg-transparent"
                    >
                      CSV
                    </button>
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
          </GlassCard>
        </div>

        {/* --- COLUMNA 2 --- */}
        <div className="flex flex-col gap-8">
          <GlassCard className={glassCardClass}>
            <SectionTitle icon={User} title="Perfil" />
            <div className="flex flex-col gap-1">
              <SettingsItem
                icon={User}
                title="Datos Físicos"
                subtitle="Editar peso, altura, objetivos..."
                onClick={() => setView('physicalProfileEditor')}
                action={<ChevronRight size={18} className="text-text-muted" />}
              />
            </div>
          </GlassCard>

          <GlassCard className={glassCardClass}>
            <SectionTitle icon={Globe} title="Región y Hora" />
            <div className="flex flex-col gap-5">
              <SwitchItem
                icon={MapPin}
                title="Ajuste Automático"
                subtitle="Usar ubicación del dispositivo"
                checked={autoTimezone}
                onChange={handleToggleAutoTimezone}
              />

              <div className={`flex flex-col gap-3 transition-opacity duration-300 ${autoTimezone ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <label className="text-sm font-bold text-text-secondary ml-1">
                  Zona Horaria Manual
                </label>
                <div className="flex gap-2 items-center">
                  <CustomSelect
                    value={userProfile?.timezone || 'Europe/Madrid'}
                    onChange={handleTimezoneChange}
                    options={timezoneOptions}
                    placeholder="Selecciona zona horaria"
                    className="flex-1"
                    disabled={autoTimezone}
                  />
                  <button
                    onClick={() => detectAndUpdateTimezone(false)}
                    disabled={isUpdatingTimezone || autoTimezone}
                    // CORRECCIÓN: Fondo transparente estricto para OLED
                    className="p-3 rounded-xl border border-transparent dark:border-white/10 text-accent hover:bg-accent/10 transition flex items-center justify-center min-w-[50px] h-[48px] bg-transparent dark:bg-white/5 [.oled-theme_&]:bg-transparent"
                    title="Detectar ahora"
                  >
                    {isUpdatingTimezone ? <Spinner size={20} /> : <Clock size={20} />}
                  </button>
                </div>
                {autoTimezone && (
                  <p className="text-xs text-accent ml-1 flex items-center gap-1 font-bold">
                    <Check size={12} /> Gestionado automáticamente
                  </p>
                )}
                {!autoTimezone && (
                  <p className="text-xs text-text-muted ml-1 leading-relaxed font-medium">
                    Afecta a la hora de reinicio de tus metas diarias.
                  </p>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className={glassCardClass}>
            <SectionTitle icon={Users} title="Privacidad Social" />
            <div className="flex flex-col gap-3">
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
          </GlassCard>

          {/* CORRECCIÓN: Usar GlassCard estándar sin lógica especial de transparencia */}
          <GlassCard className={glassCardClass}>
            <ActiveSessions />
          </GlassCard>
        </div>

        {/* --- COLUMNA 3 (Ahora solo Soporte) --- */}
        {/* Ajustado: span-2 en tablet para ocupar el ancho completo abajo, o normal en Desktop */}
        <div className="flex flex-col gap-8 md:col-span-2 lg:col-span-1">
          <GlassCard className={glassCardClass}>
            <SectionTitle icon={Info} title="Soporte y General" />
            <div className="flex flex-col gap-1">
              <a
                href={apkDownloadUrl || "https://github.com/Deathvks/Pro-Ftiness-Glass/releases/download/v5.1.0/app-release.apk"}
                className="no-underline"
              >
                <SettingsItem
                  icon={Smartphone}
                  title="Descargar App Android"
                  subtitle="Instalar APK nativo"
                  action={<Download size={18} className="text-accent" />}
                />
              </a>

              <SettingsItem
                icon={Bug}
                title="Reportar un problema"
                subtitle="¿Algo no funciona bien?"
                onClick={() => setShowBugModal(true)}
              />

              <a href="mailto:profitnessglass@gmail.com" className="no-underline">
                <SettingsItem icon={Mail} title="Contactar Soporte" subtitle="profitnessglass@gmail.com" />
              </a>

              <div className="my-3 h-px bg-[--glass-border]" />

              <SectionTitle icon={Share2} title="Síguenos" />
              <a href="https://www.instagram.com/pro_fitness_glass/" target="_blank" rel="noopener noreferrer" className="no-underline">
                <SettingsItem
                  icon={Instagram}
                  title="Instagram"
                  subtitle="@pro_fitness_glass"
                  action={<ChevronRight size={18} className="text-text-muted" />}
                />
              </a>
              <a href="https://www.tiktok.com/@pro_fitness_glass" target="_blank" rel="noopener noreferrer" className="no-underline">
                <SettingsItem
                  icon={TikTokIcon}
                  title="TikTok"
                  subtitle="@pro_fitness_glass"
                  action={<ChevronRight size={18} className="text-text-muted" />}
                />
              </a>
              <a href="https://www.youtube.com/@ProFitnessGlass" target="_blank" rel="noopener noreferrer" className="no-underline">
                <SettingsItem
                  icon={Youtube}
                  title="YouTube"
                  subtitle="@ProFitnessGlass"
                  action={<ChevronRight size={18} className="text-text-muted" />}
                />
              </a>

              <div className="my-3 h-px bg-[--glass-border]" />

              <a href="https://wger.de" target="_blank" rel="noopener noreferrer" className="no-underline">
                <SettingsItem icon={Info} title="Créditos" subtitle="Datos por wger" />
              </a>

              <div className="flex md:hidden items-center gap-3 w-full px-4 py-3 rounded-xl border border-transparent text-text-primary">
                <Binary size={22} className="text-accent" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold">Versión de App</div>
                  <div className="text-xs text-text-secondary font-medium">v{APP_VERSION}</div>
                </div>
              </div>

              <div className="my-3 h-px bg-[--glass-border]" />

              <SettingsItem
                icon={LogOut}
                title="Cerrar Sesión"
                onClick={onLogoutClick}
                danger
              />
            </div>
          </GlassCard>
        </div>
      </div>

      {showBugModal && (
        <BugReportModal onClose={() => setShowBugModal(false)} />
      )}

      {showThemeReloadModal && (
        <ConfirmationModal
          message="En iOS es necesario recargar la página para aplicar los cambios de tema en la interfaz del sistema. ¿Deseas continuar?"
          confirmText="Recargar"
          cancelText="Cancelar"
          onConfirm={confirmThemeReload}
          onCancel={() => setShowThemeReloadModal(false)}
        />
      )}
    </div>
  );
}