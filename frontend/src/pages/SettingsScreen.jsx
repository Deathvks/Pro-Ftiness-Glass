/* frontend/src/pages/SettingsScreen.jsx */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Check, Palette, Sun, Moon, MonitorCog, User, Shield,
  LogOut, Info, ChevronRight, Cookie, Mail, BellRing, Smartphone,
  ShieldAlert, MailWarning, Instagram, Share2, Binary, Users, Trophy, Medal, Eye, ChevronLeft,
  Bug, Download, Vibrate, Globe, Clock, MapPin, Youtube, Play, LockOpen, Lock
} from 'lucide-react';
import { FaMeteor } from 'react-icons/fa6'; 
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
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
};

// Detección de Android Web o PWA
const isAndroidWebOrPWA = () => {
  if (typeof navigator === 'undefined') return false;
  const isAndroid = /android/i.test(navigator.userAgent);
  const isNative = window.Capacitor?.isNativePlatform?.() || false;
  return isAndroid && !isNative;
};

// --- Sub-componentes ---
const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 mb-6 relative z-10">
    <div className="p-2.5 rounded-[16px] bg-black/5 dark:bg-white/5 text-accent shrink-0">
      <Icon size={24} strokeWidth={2.5} />
    </div>
    <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">{title}</h2>
  </div>
);

const SettingsItem = ({ icon: Icon, title, subtitle, onClick, action, danger }) => {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`flex items-center gap-3 sm:gap-4 w-full p-4 rounded-[20px] transition-all duration-300 group text-left
      ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : ''}
      ${danger
          ? 'bg-red-500/5 hover:bg-red-500/10 text-red-500'
          : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary'}`}
    >
      {Icon && (
        <div className={`p-2.5 rounded-[14px] shrink-0 transition-transform ${onClick ? 'group-hover:scale-110' : ''} ${danger ? 'bg-red-500/10 text-red-500' : 'bg-black/5 dark:bg-white/5 text-text-secondary group-hover:text-accent'}`}>
          <Icon size={20} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold leading-tight">{title}</div>
        {subtitle && <div className={`text-[10px] sm:text-xs font-medium mt-0.5 ${danger ? 'text-red-500/70' : 'text-text-secondary'}`}>{subtitle}</div>}
      </div>
      {action && <div className="shrink-0 ml-1 sm:ml-2">{action}</div>}
    </Component>
  );
};

const SwitchItem = ({ icon: Icon, title, subtitle, checked, onChange, disabled, loading }) => (
  <div className={`flex items-center justify-between p-4 rounded-[20px] transition-all duration-300 ${disabled ? 'opacity-50' : 'hover:-translate-y-1 hover:shadow-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'}`}>
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <div className={`
        p-2.5 rounded-[14px] shrink-0 transition-colors
        ${checked ? 'bg-accent/10 text-accent' : 'bg-black/5 dark:bg-white/5 text-text-muted'}
      `}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-text-primary leading-tight">{title}</div>
        <div className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">{subtitle}</div>
      </div>
    </div>
    {loading ? <Spinner size={20} className="mr-3" /> : (
      <button
        role="switch"
        aria-checked={checked}
        onChange={onChange}
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ml-3 shadow-inner
        ${checked ? 'bg-accent shadow-accent/20' : 'bg-gray-400 dark:bg-gray-600'} 
        ${disabled ? 'cursor-not-allowed' : ''}
        `}
      >
        <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    )}
  </div>
);

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
  setView,
  onLogoutClick,
  highlight
}) {

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
  
  const { 
    theme, activeTheme, setTheme, accent, setAccent, 
    startThemeTest, isTestingTheme, testTimeLeft 
  } = useAppTheme();

  const [currentColorPage, setCurrentColorPage] = useState(0);
  const [isUpdatingEmailPref, setIsUpdatingEmailPref] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isUpdatingTimezone, setIsUpdatingTimezone] = useState(false);

  const [apkDownloadUrl, setApkDownloadUrl] = useState(null);

  const [showThemeReloadModal, setShowThemeReloadModal] = useState(false);
  const [pendingThemeAction, setPendingThemeAction] = useState(null); // { type: 'apply', payload: 'dark' } o { type: 'test', payload: 10 }

  const [highlightedSection, setHighlightedSection] = useState(null);
  const socialPrivacyRef = useRef(null);

  const isGalaxyUnlocked = (userProfile?.referralCount || 0) >= 3;

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

  const showGooglePlayLink = isAndroidWebOrPWA();

  useEffect(() => {
    if (highlight === 'social_privacy' && socialPrivacyRef.current) {
      setTimeout(() => {
        socialPrivacyRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);

      setHighlightedSection('social_privacy');

      const timer = setTimeout(() => {
        setHighlightedSection(null);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [highlight]);

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
      setPendingThemeAction({ type: 'apply', payload: mode });
      setShowThemeReloadModal(true);
    } else {
      setTheme(mode);
    }
  };

  const confirmThemeReload = () => {
    if (pendingThemeAction?.type === 'apply') {
      setTheme(pendingThemeAction.payload);
      if (!window.Capacitor?.isNativePlatform?.()) window.location.reload();
    } else if (pendingThemeAction?.type === 'test') {
      startThemeTest(pendingThemeAction.payload);
      if (!window.Capacitor?.isNativePlatform?.()) window.location.reload();
    }
    setShowThemeReloadModal(false);
    setPendingThemeAction(null);
  };

  const glassCardClass = "glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 flex flex-col relative overflow-hidden transition-all duration-300";

  // Verificación de si Galaxia está activo para bloquear la cuadrícula de colores
  const isGalaxyActive = activeTheme === 'galaxy';

  const soporteCard = (
    <GlassCard className={glassCardClass}>
      <SectionTitle icon={Info} title="Soporte y General" />
      <div className="flex flex-col gap-3">

        {showGooglePlayLink && (
          <a href="https://play.google.com/store/apps/details?id=com.profitnessglass.app&hl=es_419" target="_blank" rel="noopener noreferrer" className="no-underline">
            <SettingsItem
              icon={Play}
              title="Google Play"
              subtitle="Consigue la App oficial"
              action={<ChevronRight size={18} className="text-text-muted" />}
            />
          </a>
        )}

        <a
          href={apkDownloadUrl || "https://github.com/Deathvks/Pro-Ftiness-Glass/releases/download/v5.1.0/app-release.apk"}
          className="no-underline"
        >
          <SettingsItem
            icon={Smartphone}
            title="Descargar App Android"
            subtitle="Instalar APK nativo"
            action={<Download size={18} className="text-accent shrink-0" />}
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

        <div className="my-2" />
        <SectionTitle icon={Share2} title="Síguenos" />
        
        <a href="https://www.instagram.com/pro_fitness_glass/" target="_blank" rel="noopener noreferrer" className="no-underline">
          <SettingsItem
            icon={Instagram}
            title="Instagram"
            subtitle="@pro_fitness_glass"
            action={<ChevronRight size={18} className="text-text-muted shrink-0" />}
          />
        </a>
        <a href="https://www.tiktok.com/@pro_fitness_glass" target="_blank" rel="noopener noreferrer" className="no-underline">
          <SettingsItem
            icon={TikTokIcon}
            title="TikTok"
            subtitle="@pro_fitness_glass"
            action={<ChevronRight size={18} className="text-text-muted shrink-0" />}
          />
        </a>
        <a href="https://www.youtube.com/@ProFitnessGlass" target="_blank" rel="noopener noreferrer" className="no-underline">
          <SettingsItem
            icon={Youtube}
            title="YouTube"
            subtitle="@ProFitnessGlass"
            action={<ChevronRight size={18} className="text-text-muted shrink-0" />}
          />
        </a>

        <div className="my-2" />

        <a href="https://wger.de" target="_blank" rel="noopener noreferrer" className="no-underline">
          <SettingsItem icon={Info} title="Créditos" subtitle="Datos por wger" />
        </a>

        <div className="flex md:hidden items-center gap-4 w-full p-4 rounded-[20px] bg-black/5 dark:bg-white/5 text-text-primary">
          <div className="p-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 text-accent shrink-0">
            <Binary size={20} />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-bold truncate">Versión de App</div>
            <div className="text-[10px] sm:text-xs text-text-secondary font-medium truncate mt-0.5">v{APP_VERSION}</div>
          </div>
        </div>

        <div className="my-2" />

        <SettingsItem
          icon={LogOut}
          title="Cerrar Sesión"
          onClick={onLogoutClick}
          danger
        />
      </div>
    </GlassCard>
  );

  return (
    <div className="px-4 pt-6 pb-28 md:pb-8 md:p-8 max-w-7xl mx-auto animate-[fade-in_0.3s_ease-out]">
      <Helmet>
        <title>Ajustes - Pro Fitness Glass</title>
      </Helmet>

      <div className="hidden md:flex items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight">
          Ajustes
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 items-start">

        {/* --- COLUMNA 1 --- */}
        <div className="flex flex-col gap-6 lg:gap-8">
          <GlassCard className={glassCardClass}>
            <SectionTitle icon={Palette} title="Apariencia" />

            <div className="mb-6">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 ml-1">Tema</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['system', 'light', 'dark', 'oled'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleThemeClick(mode)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[20px] transition-all duration-300 ${theme === mode && !isTestingTheme
                      ? 'bg-accent text-white shadow-lg shadow-accent/30 scale-105'
                      : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary'
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

            {/* --- SECCIÓN GALAXIA --- */}
            <div className="mb-8">
              <div className={`p-4 rounded-[20px] transition-all duration-500 border ${theme === 'galaxy' || isTestingTheme ? 'bg-[#a855f7]/10 border-[#a855f7]/30 shadow-lg shadow-[#a855f7]/20 scale-[1.02]' : 'bg-black/5 dark:bg-white/5 border-transparent'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-[14px] ${isGalaxyUnlocked ? 'bg-[#a855f7]/20 text-[#a855f7]' : 'bg-black/10 dark:bg-white/10 text-text-muted'}`}>
                       <FaMeteor size={22} />
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${isGalaxyUnlocked ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#a855f7] to-[#3b82f6]' : 'text-text-primary'}`}>
                        Tema Galaxia
                      </div>
                      <div className="text-[10px] sm:text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                        {isGalaxyUnlocked ? (
                          <><LockOpen size={12} className="text-green-500" /> Desbloqueado</>
                        ) : (
                          <><Lock size={12} className="text-text-muted" /> Invita a 3 amigos</>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    {isGalaxyUnlocked ? (
                       <button 
                         onClick={() => handleThemeClick('galaxy')} 
                         className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${theme === 'galaxy' ? 'bg-[#a855f7] text-white shadow-lg shadow-[#a855f7]/30' : 'bg-black/10 dark:bg-white/10 hover:bg-[#a855f7]/20 text-[#a855f7]'}`}
                       >
                         {theme === 'galaxy' ? 'Activo' : 'Aplicar'}
                       </button>
                    ) : (
                       <button 
                         onClick={() => {
                           if (isIOS()) {
                             setPendingThemeAction({ type: 'test', payload: 10 });
                             setShowThemeReloadModal(true);
                           } else {
                             startThemeTest(10);
                           }
                         }} 
                         disabled={isTestingTheme} 
                         className="px-4 py-2 rounded-full text-xs font-bold bg-[#a855f7]/20 text-[#a855f7] hover:bg-[#a855f7]/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-80 whitespace-nowrap min-w-[110px]"
                       >
                         {isTestingTheme ? `Probando ${testTimeLeft}s` : 'Probar 10s'}
                       </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* ---------------------- */}

            <div>
              <div className="flex justify-between items-center mb-4 ml-1">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Acento</h3>
                {totalPages > 1 && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setCurrentColorPage(p => Math.max(0, p - 1))}
                      disabled={currentColorPage === 0 || isGalaxyActive}
                      className="p-1.5 rounded-[10px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setCurrentColorPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={currentColorPage === totalPages - 1 || isGalaxyActive}
                      className="p-1.5 rounded-[10px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              {/* BLOQUEO DE ACENTOS SI GALAXIA ESTÁ ACTIVO */}
              <div className={`transition-all duration-300 ${isGalaxyActive ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                <div className="grid grid-cols-6 gap-3 sm:gap-4">
                  {currentColors.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setAccent(opt.id)}
                      title={opt.label}
                      className="group relative flex justify-center items-center w-full aspect-square"
                    >
                      <span
                        className="w-full h-full rounded-full transition-all duration-300 hover:scale-110 shrink-0"
                        style={{
                          backgroundColor: opt.hex,
                          boxShadow: accent === opt.id && !isGalaxyActive ? `0 0 0 3px var(--bg-primary), 0 0 0 5px ${opt.hex}, 0 4px 10px ${opt.hex}80` : 'none'
                        }}
                      />
                      {accent === opt.id && !isGalaxyActive && (
                        <span className="absolute inset-0 flex items-center justify-center text-white pointer-events-none drop-shadow-sm">
                          <Check size={16} strokeWidth={3} className="sm:w-[18px] sm:h-[18px]" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {isGalaxyActive && (
                  <p className="text-[10px] sm:text-xs text-[#a855f7] font-bold mt-4 ml-1 flex items-center gap-1.5">
                    <Info size={14} /> El Tema Galaxia usa su propio acento morado estelar.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8">
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

          <div className="block xl:hidden">
            {soporteCard}
          </div>

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

          <GlassCard className={glassCardClass}>
            <SectionTitle icon={Shield} title="Seguridad" />
            <div className="flex flex-col gap-3">

              <SettingsItem
                icon={Smartphone}
                title="Verificación en 2 pasos"
                onClick={() => setView('twoFactorSetup')}
                action={
                  <div className={`px-3 py-1.5 rounded-[10px] text-[10px] font-black tracking-widest shrink-0 ${userProfile?.two_factor_enabled ? 'bg-green-500/20 text-green-500' : 'bg-black/10 dark:bg-white/10 text-text-muted'}`}>
                    {userProfile?.two_factor_enabled ? 'ACTIVADO' : 'DESACTIVADO'}
                  </div>
                }
              />

              <SettingsItem
                icon={Download}
                title="Exportar Datos"
                subtitle="Descarga tu historial"
                action={
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExport('json'); }}
                      className="px-3 py-2 rounded-[12px] bg-black/5 dark:bg-white/5 text-text-secondary text-[10px] font-bold hover:bg-accent hover:text-white transition-all hover:scale-105 hover:shadow-md"
                    >
                      JSON
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExport('csv'); }}
                      className="px-3 py-2 rounded-[12px] bg-black/5 dark:bg-white/5 text-text-secondary text-[10px] font-bold hover:bg-accent hover:text-white transition-all hover:scale-105 hover:shadow-md"
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
        <div className="flex flex-col gap-6 lg:gap-8">
          <GlassCard className={glassCardClass}>
            <SectionTitle icon={User} title="Perfil" />
            <div className="flex flex-col gap-3">
              <SettingsItem
                icon={User}
                title="Datos Físicos"
                subtitle="Editar peso, altura, objetivos..."
                onClick={() => setView('physicalProfileEditor')}
                action={<ChevronRight size={18} className="text-text-muted shrink-0" />}
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
                <div className="flex gap-3 items-center">
                  <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-[20px] p-1">
                    <CustomSelect
                      value={userProfile?.timezone || 'Europe/Madrid'}
                      onChange={handleTimezoneChange}
                      options={timezoneOptions}
                      placeholder="Selecciona zona horaria"
                      disabled={autoTimezone}
                    />
                  </div>
                  <button
                    onClick={() => detectAndUpdateTimezone(false)}
                    disabled={isUpdatingTimezone || autoTimezone}
                    className="w-12 h-12 rounded-[20px] text-accent hover:bg-accent/10 transition-all flex items-center justify-center shrink-0 bg-black/5 dark:bg-white/5 hover:scale-105"
                    title="Detectar ahora"
                  >
                    {isUpdatingTimezone ? <Spinner size={20} /> : <Clock size={20} />}
                  </button>
                </div>
                {autoTimezone && (
                  <p className="text-xs text-accent ml-1 flex items-center gap-1.5 font-bold">
                    <Check size={14} /> Gestionado automáticamente
                  </p>
                )}
                {!autoTimezone && (
                  <p className="text-[10px] sm:text-xs text-text-muted ml-1 leading-relaxed font-medium">
                    Afecta a la hora de reinicio de tus metas diarias.
                  </p>
                )}
              </div>
            </div>
          </GlassCard>

          <div
            ref={socialPrivacyRef}
            className={`rounded-[32px] transition-all duration-500 ease-in-out ${highlightedSection === 'social_privacy' ? 'ring-2 ring-accent shadow-xl shadow-accent/20 scale-[1.02]' : ''}`}
          >
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
          </div>

          <GlassCard className={glassCardClass}>
            <ActiveSessions />
          </GlassCard>
        </div>

        {/* --- COLUMNA 3 (Solo Desktop 'xl') --- */}
        <div className="hidden xl:flex flex-col gap-8">
          {soporteCard}
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