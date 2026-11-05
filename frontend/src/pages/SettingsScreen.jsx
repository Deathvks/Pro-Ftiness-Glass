/* frontend/src/pages/SettingsScreen.jsx */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Check, Palette, Sun, Moon, MonitorCog, User, Shield,
  LogOut, Info, ChevronRight, Cookie, Mail, BellRing, Smartphone,
  ShieldAlert, MailWarning, Instagram, Share2, Binary, Users, Trophy, Medal, Eye, ChevronLeft,
  Bug, Download, Vibrate, Volume2, Timer, Sliders, Globe, Clock, MapPin, Youtube, Play, LockOpen, Lock,
  FileSpreadsheet, UploadCloud, Scale, WifiOff, HardDrive, Trash2, CheckCircle2, AlertCircle, RefreshCw, Sparkles
} from 'lucide-react';
import { FaMeteor } from 'react-icons/fa6'; 
import useAppStore from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
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
import WorkoutDataTransferModal from '../components/WorkoutDataTransferModal';
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
  highlight,
  returnView
}) {

  const {
    userProfile,
    resetCookieConsent,
    setUserProfile,
    hapticsEnabled,
    setHapticsEnabled,
    restSoundEnabled,
    setRestSoundEnabled
  } = useAppStore(useShallow(state => ({
    userProfile: state.userProfile,
    resetCookieConsent: state.resetCookieConsent,
    setUserProfile: state.setUserProfile,
    hapticsEnabled: state.hapticsEnabled,
    setHapticsEnabled: state.setHapticsEnabled,
    restSoundEnabled: state.restSoundEnabled,
    setRestSoundEnabled: state.setRestSoundEnabled
  })));

  const { addToast } = useToast();

  const [showDataTransferModal, setShowDataTransferModal] = useState(false);
  const [dataTransferTab, setDataTransferTab] = useState('import');

  const [isUpdatingEmailPref, setIsUpdatingEmailPref] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isUpdatingTimezone, setIsUpdatingTimezone] = useState(false);

  const [workoutVisibility, setWorkoutVisibility] = useState(() => localStorage.getItem('globalWorkoutVisibility') || 'friends');
  const [notifyFriendsOnWorkout, setNotifyFriendsOnWorkout] = useState(() => localStorage.getItem('globalNotifyFriends') !== 'false');
  const [defaultFeedScope, setDefaultFeedScope] = useState(() => {
    const saved = localStorage.getItem('pfg_social_feed_scope');
    return ['global', 'gym', 'friends'].includes(saved) ? saved : 'global';
  });

  const handleChangeWorkoutVisibility = (newVisibility) => {
    setWorkoutVisibility(newVisibility);
    localStorage.setItem('globalWorkoutVisibility', newVisibility);
    const labels = {
      public: 'Todo el mundo (Global, Mi Gimnasio y Amigos)',
      friends: 'Solo Amigos',
      private: 'Privado (No subir al muro)'
    };
    addToast(`Visibilidad de entrenos: ${labels[newVisibility] || newVisibility}`, 'success');
  };

  const handleToggleNotifyFriendsOnWorkout = () => {
    const next = !notifyFriendsOnWorkout;
    setNotifyFriendsOnWorkout(next);
    localStorage.setItem('globalNotifyFriends', String(next));
    addToast(next ? 'Aviso a amigos al terminar entreno activado' : 'Aviso a amigos desactivado', 'success');
  };

  const handleChangeDefaultFeedScope = (newScope) => {
    setDefaultFeedScope(newScope);
    localStorage.setItem('pfg_social_feed_scope', newScope);
    const scopeNames = {
      global: 'Global (Comunidad)',
      gym: 'Mi Gimnasio / Ciudad',
      friends: 'Amigos'
    };
    addToast(`Pestaña inicial del Muro: ${scopeNames[newScope] || newScope}`, 'success');
  };

  const [activeTab, setActiveTab] = useState(() => highlight === 'workout' ? 'workout' : 'profile');
  const [highlightedSection, setHighlightedSection] = useState(null);
  const socialPrivacyRef = useRef(null);

  const SETTINGS_TABS = [
    { id: 'workout', label: 'Entrenamiento', icon: Timer },
    { id: 'offline', label: 'Modo sin conexión', icon: WifiOff },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificaciones', icon: BellRing },
    { id: 'security', label: 'Seguridad', icon: Shield },
    
    { id: 'privacy', label: 'Privacidad Social', icon: Users },
    { id: 'session', label: 'Sesión', icon: LogOut, danger: true },
  ];

  const [offlineStats, setOfflineStats] = useState({
    isDownloaded: false,
    imageCount: 0,
    exerciseCount: 0,
    totalBytes: 0,
    formattedSize: '0 MB',
    lastDownloadedAt: null
  });
  const [isDownloadingOffline, setIsDownloadingOffline] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({
    current: 0,
    total: 0,
    percent: 0,
    bytesDownloaded: 0
  });
  const [showDeleteOfflineModal, setShowDeleteOfflineModal] = useState(false);
  const [isDeletingOffline, setIsDeletingOffline] = useState(false);
  const [catalogStats, setCatalogStats] = useState({ exerciseCount: 0, mediaCount: 0, estimatedSize: '0 MB' });
  const abortControllerRef = useRef(null);
  const isNativeAndroid = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

  useEffect(() => {
    let isMounted = true;
    let unsubscribeDownload = null;

    import('../services/offlineExerciseService').then(({
      getOfflineStorageStats,
      getAvailableExerciseCatalogStats,
      subscribeToOfflineDownload
    }) => {
      getOfflineStorageStats().then(stats => {
        if (isMounted && stats) setOfflineStats(stats);
      });
      if (typeof getAvailableExerciseCatalogStats === 'function') {
        getAvailableExerciseCatalogStats().then(cat => {
          if (isMounted && cat) setCatalogStats(cat);
        });
      }
      if (typeof subscribeToOfflineDownload === 'function') {
        unsubscribeDownload = subscribeToOfflineDownload((state) => {
          if (!isMounted) return;
          setIsDownloadingOffline(state.isDownloading);
          if (state.progress) {
            setDownloadProgress(state.progress);
          }
        });
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
      if (unsubscribeDownload) unsubscribeDownload();
    };
  }, [activeTab]);

  const handleStartOfflineDownload = async () => {
    if (isDownloadingOffline) return;
    try {
      const { startOfflineDownloadSession, getOfflineStorageStats } = await import('../services/offlineExerciseService');
      const result = await startOfflineDownloadSession();
      if (result) {
        const updatedStats = await getOfflineStorageStats();
        setOfflineStats(updatedStats);
        addToast(`Biblioteca offline lista: ${result.imagesCount} recursos guardados (${result.formattedSize})`, 'success');
      }
    } catch (err) {
      const isAborted =
        err?.name === 'AbortError' ||
        (err?.message && (
          err.message.toLowerCase().includes('abort') ||
          err.message.toLowerCase().includes('cancel') ||
          err.message.toLowerCase().includes('cancelada')
        ));

      if (isAborted) {
        addToast('Descarga cancelada', 'info');
      } else {
        console.error('Error descargando biblioteca offline:', err);
        addToast('Error al descargar ejercicios para modo offline', 'error');
      }
    }
  };

  const handleCancelOfflineDownload = async () => {
    try {
      const { cancelOfflineDownloadSession } = await import('../services/offlineExerciseService');
      cancelOfflineDownloadSession();
      addToast('Descarga cancelada', 'info');
    } catch {}
  };

  const handleDeleteOfflineCache = async () => {
    try {
      setIsDeletingOffline(true);
      const { deleteOfflineExercises, getOfflineStorageStats } = await import('../services/offlineExerciseService');
      await deleteOfflineExercises();
      const updatedStats = await getOfflineStorageStats();
      setOfflineStats(updatedStats);
      setShowDeleteOfflineModal(false);
      addToast('Almacenamiento offline liberado correctamente', 'success');
    } catch (err) {
      console.error('Error eliminando caché offline:', err);
      addToast('Error al liberar espacio', 'error');
    } finally {
      setIsDeletingOffline(false);
    }
  };

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
    const effectiveHighlight = highlight || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('highlight') : null);
    if (effectiveHighlight === 'workout') {
      setActiveTab('workout');
    } else if (effectiveHighlight === 'social_privacy') {
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

  const handleTogglePrivacy = async (key, label, defaultValue = false) => {
    if (isUpdatingPrivacy) return;
    setIsUpdatingPrivacy(true);
    const currentVal = userProfile?.[key] !== undefined ? !!userProfile[key] : defaultValue;
    const newValue = !currentVal;

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
    <div className="px-4 pt-2 md:pt-6 pb-32 sm:pb-36 md:pb-8 md:p-8 max-w-7xl mx-auto animate-[fade-in_0.3s_ease-out] min-h-screen">
      <Helmet>
        <title>Ajustes - Pro Fitness Glass</title>
      </Helmet>



      <div className="hidden md:flex items-center justify-between mb-6 mt-2">
        <button
          onClick={() => setView && setView(returnView || 'hub')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-95 shadow-sm shrink-0"
        >
          <ChevronLeft size={20} />
          <span className="font-bold text-sm">{returnView === 'workout' ? 'Volver a rutina' : 'Atrás'}</span>
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight">
          Ajustes
        </h1>
        <div className="w-12" />
      </div>

      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
        {/* --- TABS LATERALES / HORIZONTALES --- */}
        <div id="tutorial-settings-tabs" className="w-full md:w-64 shrink-0 flex md:flex-col gap-3 md:gap-2 overflow-x-auto md:overflow-visible py-3 md:py-1 px-2 md:px-1 hide-scrollbar md:sticky md:top-4 md:z-20 mb-6 md:mb-0">
          {SETTINGS_TABS.map(tab => (
            <button
              key={tab.id}
              data-tutorial={`settings-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-5 py-3 md:p-4 rounded-[20px] transition-all duration-300 font-bold whitespace-nowrap outline-none shrink-0
                ${activeTab === tab.id
                  ? 'bg-accent text-accent-contrast shadow-lg shadow-accent/20'
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
        <div id="tutorial-settings-content" className="flex-1 w-full flex flex-col gap-6 lg:gap-8">

          {activeTab === 'workout' && (
          <>
            <GlassCard className={glassCardClass}>
              <SectionTitle icon={Timer} title="Entrenamiento y Descanso" />
              <div className="flex flex-col gap-3">
                <SwitchItem
                  icon={Volume2}
                  title="Sonido de Fin de Descanso"
                  subtitle="Doble pitido suave al terminar la cuenta atrás entre series"
                  checked={restSoundEnabled}
                  onChange={() => {
                    const newValue = !restSoundEnabled;
                    setRestSoundEnabled(newValue);
                    addToast(newValue ? 'Sonido de descanso activado' : 'Sonido de descanso desactivado', 'success');
                  }}
                />

                <SwitchItem
                  icon={Vibrate}
                  title="Vibración Háptica"
                  subtitle="Vibración en el bolsillo al terminar el descanso y feedback al marcar series"
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
              <SectionTitle icon={FileSpreadsheet} title="Migración y Copias de Seguridad" />
              <div className="flex flex-col gap-3">
                <SettingsItem
                  icon={WifiOff}
                  title="Modo sin conexión y Búnker"
                  subtitle={offlineStats.isDownloaded ? `${offlineStats.imageCount} imágenes guardadas (${offlineStats.formattedSize})` : 'Descarga los ejercicios para entrenar sin cobertura'}
                  onClick={() => setActiveTab('offline')}
                  action={<ChevronRight size={18} className="text-text-muted" />}
                />
                <SettingsItem
                  icon={UploadCloud}
                  title="Importar desde Hevy o Strong (CSV)"
                  subtitle="Migra todos tus entrenamientos históricos sin perder tus datos"
                  onClick={() => {
                    setDataTransferTab('import');
                    setShowDataTransferModal(true);
                  }}
                  action={<ChevronRight size={18} className="text-text-muted" />}
                />
                <SettingsItem
                  icon={Download}
                  title="Exportar Historial Completo (Excel / CSV)"
                  subtitle="Descarga todas tus sesiones, series y notas en un archivo CSV para Excel"
                  onClick={() => {
                    setDataTransferTab('export');
                    setShowDataTransferModal(true);
                  }}
                  action={<ChevronRight size={18} className="text-text-muted" />}
                />
              </div>
            </GlassCard>
          </>
          )}

          {activeTab === 'offline' && (
          <div className="flex flex-col gap-6">
            <GlassCard className={glassCardClass}>
              <SectionTitle icon={WifiOff} title="Modo sin conexión y Búnker" />
              
              <p className="text-sm text-text-secondary leading-relaxed -mt-2 mb-4">
                Descarga la biblioteca completa de ejercicios y sus animaciones/GIFs en la memoria de tu dispositivo. Ideal para gimnasios en sótanos, zonas sin cobertura o para entrenar sin gastar datos móviles.
              </p>

              {/* Tarjeta de estado de almacenamiento */}
              <div className="p-5 rounded-[24px] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl shrink-0 ${offlineStats.isDownloaded ? 'bg-emerald-500/10 text-emerald-500' : isDownloadingOffline ? 'bg-accent/10 text-accent animate-pulse' : 'bg-amber-500/10 text-amber-500'}`}>
                      {offlineStats.isDownloaded ? (
                        <CheckCircle2 size={20} />
                      ) : isDownloadingOffline ? (
                        <RefreshCw size={20} className="animate-spin" />
                      ) : (
                        <AlertCircle size={20} />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text-primary">
                        {isDownloadingOffline
                          ? 'Descargando ejercicios e imágenes...'
                          : offlineStats.isDownloaded
                          ? 'Biblioteca offline lista'
                          : 'Sin descargar en este dispositivo'}
                      </div>
                      <div className="text-[11px] text-text-secondary">
                        {isNativeAndroid
                          ? 'Almacenamiento interno de la aplicación (Android WebView Storage)'
                          : 'Almacenamiento local persistente (IndexedDB + Cache Storage)'}
                      </div>
                    </div>
                  </div>

                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${offlineStats.isDownloaded ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20' : isDownloadingOffline ? 'bg-accent/15 text-accent border border-accent/20' : 'bg-amber-500/15 text-amber-500 border border-amber-500/20'}`}>
                    {offlineStats.isDownloaded ? 'Disponible' : isDownloadingOffline ? `${downloadProgress.percent}%` : 'No descargado'}
                  </span>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-black/5 dark:border-white/10 text-center">
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5">
                    <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">Ejercicios</span>
                    <span className="text-base sm:text-lg font-black text-text-primary">
                      {offlineStats.isDownloaded
                        ? offlineStats.exerciseCount
                        : (catalogStats.exerciseCount || '...')}
                    </span>
                    <span className="text-[10px] text-text-muted block mt-0.5">
                      {offlineStats.isDownloaded ? 'Guardados' : 'Disponibles'}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5">
                    <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">Imágenes / GIFs</span>
                    <span className="text-base sm:text-lg font-black text-text-primary">
                      {offlineStats.isDownloaded
                        ? offlineStats.imageCount
                        : (catalogStats.mediaCount || '...')}
                    </span>
                    <span className="text-[10px] text-text-muted block mt-0.5">
                      {offlineStats.isDownloaded ? 'En caché local' : 'Para descargar'}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5">
                    <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">Espacio {offlineStats.isDownloaded ? 'usado' : 'estimado'}</span>
                    <span className="text-base sm:text-lg font-black text-text-primary">
                      {offlineStats.isDownloaded
                        ? offlineStats.formattedSize
                        : (catalogStats.estimatedSize || '~45 MB')}
                    </span>
                    <span className="text-[10px] text-text-muted block mt-0.5">
                      {offlineStats.isDownloaded ? 'En almacenamiento' : 'Descarga WiFi'}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5">
                    <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">Estado</span>
                    <span className={`text-xs font-bold block mt-1 ${offlineStats.isDownloaded ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {offlineStats.isDownloaded
                        ? (offlineStats.lastDownloadedAt ? new Date(offlineStats.lastDownloadedAt).toLocaleDateString() : 'Activo')
                        : 'No descargado'}
                    </span>
                    <span className="text-[10px] text-text-muted block mt-0.5">
                      {offlineStats.isDownloaded ? 'Última sinc.' : 'Pendiente'}
                    </span>
                  </div>
                </div>

                {/* Banner informativo descriptivo */}
                {!offlineStats.isDownloaded && !isDownloadingOffline && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-text-primary text-xs leading-relaxed flex items-start gap-2.5">
                    <Sparkles size={16} className="shrink-0 text-amber-500 mt-0.5" />
                    <div>
                      <strong className="font-bold block text-amber-600 dark:text-amber-400">
                        {catalogStats.exerciseCount ? `${catalogStats.exerciseCount} ejercicios listos para guardar` : 'Biblioteca lista para descargar'}
                      </strong>
                      Al pulsar el botón inferior, se guardarán los {catalogStats.mediaCount ? `${catalogStats.mediaCount} recursos multimedia` : 'archivos de demostración'} ({catalogStats.estimatedSize || '~45 MB'}) en la memoria de tu dispositivo. Podrás consultar cualquier técnica y animación sin conexión a internet ni gastar datos móviles.
                    </div>
                  </div>
                )}

                {offlineStats.isDownloaded && !isDownloadingOffline && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-text-primary text-xs leading-relaxed flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-500 mt-0.5" />
                    <div>
                      <strong className="font-bold block text-emerald-600 dark:text-emerald-400">Modo sin conexión activo (0 ms de espera)</strong>
                      Tienes {offlineStats.exerciseCount} ejercicios y {offlineStats.imageCount} recursos multimedia guardados localmente ({offlineStats.formattedSize}). Funcionan con total fluidez incluso en sótanos sin cobertura o con modo avión activado.
                    </div>
                  </div>
                )}

                {/* Barra de progreso interactiva si está descargando */}
                {isDownloadingOffline && (
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex justify-between items-center text-xs font-semibold text-text-secondary">
                      <span>Descargando recursos ({downloadProgress.current} de {downloadProgress.total})...</span>
                      <span className="text-accent font-bold">{downloadProgress.percent}%</span>
                    </div>
                    <div className="w-full h-3 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-300 ease-out shadow-sm"
                        style={{ width: `${downloadProgress.percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1 text-[11px] text-text-muted">
                      <span>Memoria guardada: {((downloadProgress.bytesDownloaded || 0) / (1024 * 1024)).toFixed(1)} MB</span>
                      <button
                        type="button"
                        onClick={handleCancelOfflineDownload}
                        className="font-bold text-red-500 hover:underline cursor-pointer"
                      >
                        Cancelar descarga
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleStartOfflineDownload}
                  disabled={isDownloadingOffline}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 px-3 sm:px-6 rounded-[20px] font-extrabold text-xs sm:text-sm whitespace-nowrap transition-all duration-300 shadow-lg cursor-pointer
                    ${isDownloadingOffline
                      ? 'opacity-60 cursor-not-allowed bg-accent text-accent-contrast'
                      : 'bg-accent text-accent-contrast hover:scale-[1.02] active:scale-95 shadow-accent/20'}`}
                >
                  {isDownloadingOffline ? (
                    <>
                      <RefreshCw size={18} className="animate-spin shrink-0" />
                      <span className="truncate">Descargando ({downloadProgress.percent}%)</span>
                    </>
                  ) : offlineStats.isDownloaded ? (
                    <>
                      <RefreshCw size={18} className="shrink-0" />
                      <span className="hidden sm:inline truncate">Actualizar biblioteca offline</span>
                      <span className="sm:hidden truncate">Actualizar biblioteca</span>
                    </>
                  ) : (
                    <>
                      <Download size={18} className="shrink-0" />
                      <span className="hidden sm:inline truncate">Descargar biblioteca offline</span>
                      <span className="sm:hidden truncate">Descargar biblioteca</span>
                    </>
                  )}
                </button>

                {offlineStats.isDownloaded && !isDownloadingOffline && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteOfflineModal(true)}
                    className="flex items-center justify-center gap-2 py-3.5 sm:py-4 px-4 sm:px-5 rounded-[20px] font-bold text-xs sm:text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Trash2 size={18} className="shrink-0" />
                    <span>Liberar espacio</span>
                  </button>
                )}
              </div>
            </GlassCard>

            {/* Tarjeta explicativa sobre funcionamiento en Android vs Web */}
            <GlassCard className={glassCardClass}>
              <SectionTitle icon={HardDrive} title="¿Cómo funciona el modo sin conexión?" />
              <div className="flex flex-col gap-3 text-sm text-text-secondary leading-relaxed">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5">
                  <div className="p-2 rounded-xl bg-accent/10 text-accent shrink-0 mt-0.5">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <div>
                    <span className="font-bold text-text-primary block">Almacenamiento 100% local en tu dispositivo</span>
                    Tanto en la aplicación de Android como en la versión web (PWA), las imágenes y GIFs se guardan físicamente en la memoria de tu móvil mediante bases de datos indexadas y caché persistente.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5">
                  <div className="p-2 rounded-xl bg-accent/10 text-accent shrink-0 mt-0.5">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <div>
                    <span className="font-bold text-text-primary block">Respuesta instantánea sin red (0 ms)</span>
                    Cuando estás entrenando en sótanos o zonas sin cobertura, la app no espera a la conexión: extrae directamente las animaciones de la memoria del teléfono para que no te quedes colgado esperando a que cargue la técnica.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5">
                  <div className="p-2 rounded-xl bg-accent/10 text-accent shrink-0 mt-0.5">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <div>
                    <span className="font-bold text-text-primary block">Ahorro de datos móviles</span>
                    Al tener los ejercicios ya guardados en el móvil, no gastarás megas de tu tarifa repitiendo la descarga de las mismas imágenes en cada entrenamiento.
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
          )}

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
                title="Exportar Datos y Entrenamientos"
                subtitle="Copia de seguridad en JSON o Excel (CSV)"
                action={
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExport('json'); }}
                      className="px-3 py-2 rounded-[12px] bg-black/5 dark:bg-white/5 text-text-secondary text-[10px] font-bold hover:bg-accent hover:text-accent-contrast transition-all hover:scale-105 hover:shadow-md"
                      title="Exportar datos completos en JSON"
                    >
                      JSON
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDataTransferTab('export'); setShowDataTransferModal(true); }}
                      className="px-3 py-2 rounded-[12px] bg-black/5 dark:bg-white/5 text-text-secondary text-[10px] font-bold hover:bg-accent hover:text-accent-contrast transition-all hover:scale-105 hover:shadow-md"
                      title="Exportar entrenamientos en CSV para Excel"
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
                icon={Scale}
                title="Aviso Legal (LSSI-CE)"
                subtitle="Datos del prestador y titularidad"
                onClick={() => setView('legalNotice')}
                action={<ChevronRight size={18} className="text-text-muted" />}
              />

              <SettingsItem
                icon={Play}
                title="Tutoriales"
                subtitle="Guías visuales de cada sección"
                onClick={() => {
                  sessionStorage.setItem('open_tutorials_on_hub', 'true');
                  setView('hub');
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
          {activeTab === 'privacy' && (
          <div
            ref={socialPrivacyRef}
            className={`flex flex-col gap-6 rounded-[32px] transition-all duration-500 ease-in-out ${highlightedSection === 'social_privacy' ? 'ring-2 ring-accent shadow-xl shadow-accent/20 scale-[1.01]' : ''}`}
          >
            <GlassCard className={glassCardClass}>
              <SectionTitle icon={Users} title="Privacidad de tu Perfil Social" />
              <div className="flex flex-col gap-3">
                <SwitchItem
                  icon={Eye}
                  title="Perfil Público"
                  subtitle="Aparecer en el Muro Global, Mi Gimnasio, Ranking y búsquedas"
                  checked={!!userProfile?.is_public_profile}
                  onChange={() => handleTogglePrivacy('is_public_profile', 'Perfil público')}
                  disabled={isUpdatingPrivacy}
                />
                <SwitchItem
                  icon={Trophy}
                  title="Mostrar Nivel y XP"
                  subtitle="Visible en tu perfil y tarjetas del Muro para otros atletas"
                  checked={!!userProfile?.show_level_xp}
                  onChange={() => handleTogglePrivacy('show_level_xp', 'Nivel y XP')}
                  disabled={isUpdatingPrivacy || !userProfile?.is_public_profile}
                />
                <SwitchItem
                  icon={Medal}
                  title="Mostrar Insignias"
                  subtitle="Compartir tus logros y medallas desbloqueadas"
                  checked={!!userProfile?.show_badges}
                  onChange={() => handleTogglePrivacy('show_badges', 'Insignias')}
                  disabled={isUpdatingPrivacy || !userProfile?.is_public_profile}
                />
                <SwitchItem
                  icon={MapPin}
                  title="Aparecer en Mi Gimnasio y Ciudad"
                  subtitle="Mostrar tu gimnasio en tu perfil y en el radar de compañeros de tu centro o ciudad"
                  checked={userProfile?.show_gym !== false}
                  onChange={() => handleTogglePrivacy('show_gym', 'Visibilidad en Mi Gimnasio', true)}
                  disabled={isUpdatingPrivacy || !userProfile?.is_public_profile}
                />
              </div>
            </GlassCard>

            <GlassCard className={glassCardClass}>
              <SectionTitle icon={Globe} title="Muro de Comunidad (Global · Mi Gimnasio · Amigos)" />
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed -mt-2 mb-4">
                Elige en qué apartados del Muro se publican tus entrenamientos al finalizarlos y qué filtro quieres ver por defecto al entrar a Comunidad.
              </p>

              <div className="flex flex-col gap-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-text-muted px-1">
                  ¿Quién puede ver tus entrenamientos terminados?
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleChangeWorkoutVisibility('public')}
                    className={`flex flex-col items-start gap-1.5 p-4 rounded-[20px] text-left transition-all cursor-pointer border ${
                      workoutVisibility === 'public'
                        ? 'bg-accent/10 border-accent text-text-primary shadow-md shadow-accent/10'
                        : 'bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`p-2 rounded-xl ${workoutVisibility === 'public' ? 'bg-accent text-accent-contrast' : 'bg-black/5 dark:bg-white/5 text-text-secondary'}`}>
                        <Globe size={18} />
                      </span>
                      {workoutVisibility === 'public' && <CheckCircle2 size={18} className="text-accent shrink-0" />}
                    </div>
                    <span className={`text-sm font-extrabold mt-1 ${workoutVisibility === 'public' ? 'text-accent' : 'text-text-primary'}`}>
                      Todo el mundo
                    </span>
                    <span className="text-[11px] text-text-secondary leading-snug">
                      Aparece en <strong>Global</strong>, <strong>Mi Gimnasio</strong> y <strong>Amigos</strong>.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChangeWorkoutVisibility('friends')}
                    className={`flex flex-col items-start gap-1.5 p-4 rounded-[20px] text-left transition-all cursor-pointer border ${
                      workoutVisibility === 'friends'
                        ? 'bg-accent/10 border-accent text-text-primary shadow-md shadow-accent/10'
                        : 'bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`p-2 rounded-xl ${workoutVisibility === 'friends' ? 'bg-accent text-accent-contrast' : 'bg-black/5 dark:bg-white/5 text-text-secondary'}`}>
                        <Users size={18} />
                      </span>
                      {workoutVisibility === 'friends' && <CheckCircle2 size={18} className="text-accent shrink-0" />}
                    </div>
                    <span className={`text-sm font-extrabold mt-1 ${workoutVisibility === 'friends' ? 'text-accent' : 'text-text-primary'}`}>
                      Solo Amigos
                    </span>
                    <span className="text-[11px] text-text-secondary leading-snug">
                      Solo visible en la pestaña <strong>Amigos</strong> (nunca en Global).
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChangeWorkoutVisibility('private')}
                    className={`flex flex-col items-start gap-1.5 p-4 rounded-[20px] text-left transition-all cursor-pointer border ${
                      workoutVisibility === 'private'
                        ? 'bg-accent/10 border-accent text-text-primary shadow-md shadow-accent/10'
                        : 'bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`p-2 rounded-xl ${workoutVisibility === 'private' ? 'bg-accent text-accent-contrast' : 'bg-black/5 dark:bg-white/5 text-text-secondary'}`}>
                        <Lock size={18} />
                      </span>
                      {workoutVisibility === 'private' && <CheckCircle2 size={18} className="text-accent shrink-0" />}
                    </div>
                    <span className={`text-sm font-extrabold mt-1 ${workoutVisibility === 'private' ? 'text-accent' : 'text-text-primary'}`}>
                      No subir (Privado)
                    </span>
                    <span className="text-[11px] text-text-secondary leading-snug">
                      Se guarda en tu diario personal sin publicarse en ningún muro.
                    </span>
                  </button>
                </div>

                {workoutVisibility !== 'private' && (
                  <div className="mt-1">
                    <SwitchItem
                      icon={BellRing}
                      title="Notificar a mis amigos al terminar"
                      subtitle="Enviarles un aviso cuando publiques un nuevo entrenamiento en el muro"
                      checked={notifyFriendsOnWorkout}
                      onChange={handleToggleNotifyFriendsOnWorkout}
                    />
                  </div>
                )}

                <div className="text-xs font-extrabold uppercase tracking-wider text-text-muted px-1 mt-3">
                  Apartado inicial al abrir el Muro
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'global', label: 'Global (Comunidad)', desc: 'Entrenos públicos de toda la app', icon: Globe },
                    { id: 'gym', label: 'Mi Gimnasio / Ciudad', desc: 'Atletas de tu centro o ciudad', icon: MapPin },
                    { id: 'friends', label: 'Amigos', desc: 'Actividad de tus amigos', icon: Users }
                  ].map(opt => {
                    const IconComp = opt.icon;
                    const active = defaultFeedScope === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleChangeDefaultFeedScope(opt.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-[18px] text-left transition-all cursor-pointer border ${
                          active
                            ? 'bg-accent/10 border-accent text-text-primary shadow-sm'
                            : 'bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary'
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${active ? 'bg-accent text-accent-contrast' : 'bg-black/5 dark:bg-white/5 text-text-secondary'}`}>
                          <IconComp size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`text-xs font-extrabold truncate ${active ? 'text-accent' : 'text-text-primary'}`}>{opt.label}</div>
                          <div className="text-[10px] text-text-secondary truncate mt-0.5">{opt.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
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

      <WorkoutDataTransferModal
        isOpen={showDataTransferModal}
        onClose={() => setShowDataTransferModal(false)}
        initialTab={dataTransferTab}
      />

      {showDeleteOfflineModal && (
        <ConfirmationModal
          message="¿Seguro que deseas eliminar todos los ejercicios e imágenes descargadas sin conexión? Se liberará el espacio en tu dispositivo, pero necesitarás conexión a internet para ver las técnicas."
          onConfirm={handleDeleteOfflineCache}
          onCancel={() => setShowDeleteOfflineModal(false)}
          confirmText={isDeletingOffline ? "Borrando..." : "Eliminar y liberar espacio"}
          cancelText="Cancelar"
          isLoading={isDeletingOffline}
        />
      )}
    </div>
  );
}

