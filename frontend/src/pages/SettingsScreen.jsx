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

// --- Constantes ---// --- TIMEZONES COMUNES ---
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
  <button
    type="button"
    onClick={disabled || loading ? undefined : onChange}
    disabled={disabled || loading}
    className={`w-full flex items-center justify-between p-4 rounded-[20px] transition-all duration-300 text-left group select-none [-webkit-tap-highlight-color:transparent]
    ${disabled ? 'opacity-50 cursor-not-allowed bg-black/5 dark:bg-white/5' : 'cursor-pointer hover:-translate-y-1 hover:shadow-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 active:translate-y-0 active:shadow-none'}`}
  >
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <div className={`
        p-2.5 rounded-[14px] shrink-0 transition-colors
        ${checked ? 'bg-accent/10 text-accent group-active:text-accent' : 'bg-black/5 dark:bg-white/5 text-text-muted group-active:text-text-muted'}
      `}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-text-primary leading-tight">{title}</div>
        <div className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">{subtitle}</div>
      </div>
    </div>
    {loading ? <Spinner size={20} className="mr-3" /> : (
      <div
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-all duration-300 ease-in-out ml-3 pointer-events-none
        ${checked ? 'bg-[var(--color-accent)] border-2 border-white/30 bg-gradient-to-br from-white/25 to-transparent backdrop-blur-[12px] shadow-[0_4px_15px_var(--color-accent-transparent),inset_0_2px_2px_rgba(255,255,255,0.4)]' : 'bg-gray-400 dark:bg-gray-600 border-2 border-transparent shadow-inner'} 
        `}
      >
        <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    )}
  </button>
);

export default function SettingsScreen({
  setView,
  onLogoutClick,
  highlight
}) {

  const {
    userProfile,
    resetCookieConsent,
    setUserProfile
  } = useAppStore(state => ({
    userProfile: state.userProfile,
    resetCookieConsent: state.resetCookieConsent,
    setUserProfile: state.setUserProfile
  }));

  const { addToast } = useToast();

  const [isUpdatingEmailPref, setIsUpdatingEmailPref] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isUpdatingTimezone, setIsUpdatingTimezone] = useState(false);

  const [activeTab, setActiveTab] = useState('profile');
  const [highlightedSection, setHighlightedSection] = useState(null);
  const socialPrivacyRef = useRef(null);

  const SETTINGS_TABS = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificaciones', icon: BellRing },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'region', label: 'Región y Hora', icon: Globe },
    { id: 'privacy', label: 'Privacidad Social', icon: Users },
    { id: 'session', label: 'Sesión', icon: LogOut, danger: true },
  ];

  const [autoTimezone, setAutoTimezone] = useState(() => {
    return localStorage.getItem('settings_auto_timezone') === 'true';
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
    if (highlight === 'social_privacy') {
      setActiveTab('privacy'); // Cambiar a la pestaña correcta
      
      setTimeout(() => {
        if (socialPrivacyRef.current) {
          socialPrivacyRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      setHighlightedSection('social_privacy');

      const timer = setTimeout(() => {
        setHighlightedSection(null);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [highlight]);


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
  const glassCardClass = "glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 flex flex-col relative overflow-hidden transition-all duration-300";

  return (
    <div className="px-4 pt-6 pb-32 sm:pb-36 md:pb-8 md:p-8 max-w-7xl mx-auto animate-[fade-in_0.3s_ease-out] min-h-screen">
      <Helmet>
        <title>Ajustes - Pro Fitness Glass</title>
      </Helmet>



      <div className="hidden md:flex mb-6 mt-4">
        <button 
          onClick={() => setView && setView('hub')} 
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-95 shadow-sm shrink-0"
        >
          <ChevronLeft size={20} />
          <span className="font-bold text-sm">Atrás</span>
        </button>
      </div>

      <div className="hidden md:flex items-center gap-4 md:gap-6 mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight">
          Ajustes
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
        {/* --- TABS LATERALES / HORIZONTALES --- */}
        <div className="w-full md:w-64 shrink-0 flex md:flex-col gap-3 md:gap-2 overflow-x-auto py-3 md:py-0 px-2 md:px-0 hide-scrollbar md:sticky md:top-4 md:z-20 mb-6 md:mb-0">
          {SETTINGS_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-5 py-3 md:p-4 rounded-[20px] transition-all duration-300 font-bold whitespace-nowrap outline-none shrink-0
                ${activeTab === tab.id
                  ? 'bg-accent text-white shadow-lg shadow-accent/20'
                  : 'glass-btn text-text-secondary hover:text-text-primary hover:bg-surface/50 border border-glass-border'
                }
                ${tab.danger && activeTab !== tab.id ? 'hover:text-red-500' : ''}
                ${tab.danger && activeTab === tab.id ? 'bg-red-500 shadow-red-500/30' : ''}
              `}
            >
              <tab.icon size={20} className={activeTab === tab.id ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''} />
              <span className="text-sm md:text-base">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* --- CONTENIDO --- */}
        <div className="flex-1 w-full flex flex-col gap-6 lg:gap-8">

          {activeTab === 'notifications' && (
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
          )}

          {activeTab === 'security' && (
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

              <SettingsItem
                icon={Shield}
                title="Política de Privacidad"
                subtitle="Cómo tratamos tus datos"
                onClick={() => setView('privacyPolicy')}
                action={<ChevronRight size={18} className="text-text-muted" />}
              />

              <SettingsItem
                icon={Info}
                title="Términos y Condiciones"
                subtitle="Reglas de uso de la app"
                onClick={() => setView('terms')}
                action={<ChevronRight size={18} className="text-text-muted" />}
              />

              <SettingsItem
                icon={Play}
                title="Tutoriales"
                subtitle="Volver a ver las guías interactivas"
                onClick={() => {
                  const state = useAppStore.getState();
                  if(state.resetTour) state.resetTour();
                  if(state.resetNutritionTour) state.resetNutritionTour();
                  if(state.resetRoutineTour) state.resetRoutineTour();
                  if(state.resetSocialTour) state.resetSocialTour();
                  if(state.resetHubTour) state.resetHubTour();
                  window.location.href = '/';
                }}
              />


            </div>
          </GlassCard>
          )}
          {activeTab === 'profile' && (
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
          )}
          {activeTab === 'region' && (
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
          )}

          {activeTab === 'privacy' && (
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
          )}

          {activeTab === 'session' && (
          <GlassCard className={glassCardClass}>
            <ActiveSessions />
          </GlassCard>
          )}

          {activeTab === 'session' && (
          <GlassCard className={glassCardClass}>
            <SectionTitle icon={LogOut} title="Sesión" />
            <SettingsItem
              icon={LogOut}
              title="Cerrar Sesión"
              onClick={onLogoutClick}
              danger
            />
          </GlassCard>
          )}
      </div>
      </div>
    </div>
  );
}