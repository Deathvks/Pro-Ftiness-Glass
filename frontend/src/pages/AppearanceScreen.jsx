import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { 
  Palette, Sun, Moon, MonitorCog, Smartphone, Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Info, Sparkles, Battery, Gauge, X
} from 'lucide-react';
import {
  FaMeteor,
  FaGift,
  FaShareNodes,
  FaCopy,
  FaBolt,
  FaSun,
  FaUmbrellaBeach,
  FaLock,
  FaLockOpen,
} from 'react-icons/fa6'; 
import useAppStore from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { useAppTheme } from '../hooks/useAppTheme';
import GlassCard from '../components/GlassCard';
import { useToast } from '../hooks/useToast';
import LevelBadge from '../components/LevelBadge';
import ConfirmationModal from '../components/ConfirmationModal';
import ModalPortal from '../components/ModalPortal';
import useModalLock from '../hooks/useModalLock';

const GalaxyEffectsWarningModal = ({ onConfirm, onCancel }) => {
  useModalLock();

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 !pt-[calc(1rem+var(--safe-top))]" onClick={onCancel}>
        <section
          aria-labelledby="galaxy-effects-title"
          className="relative mt-auto w-full max-w-sm rounded-t-[32px] rounded-b-none border border-glass-border bg-bg-primary p-6 pt-3 pb-[calc(1.5rem+var(--safe-bottom))] text-center shadow-2xl animate-[slide-up_0.3s_ease-out] sm:mt-0 sm:rounded-[32px] sm:p-8 sm:animate-[scale-in_0.3s_ease-out]"
          onClick={event => event.stopPropagation()}
        >
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-black/10 dark:bg-white/20 sm:hidden" aria-hidden="true" />
          <button type="button" onClick={onCancel} aria-label="Cerrar" className="absolute right-4 top-4 rounded-full p-2 text-text-secondary transition hover:bg-black/5 hover:text-text-primary dark:hover:bg-white/5 sm:right-5 sm:top-5">
            <X size={20} />
          </button>
          <div className="mb-5 flex justify-center">
            <div className="rounded-[20px] bg-accent/10 p-4 text-accent ring-1 ring-accent/20">
              <Sparkles size={30} strokeWidth={1.8} />
            </div>
          </div>
          <h2 id="galaxy-effects-title" className="mb-3 text-xl font-extrabold tracking-tight text-text-primary">Efectos animados de Galaxia</h2>
          <p className="mb-5 text-sm leading-relaxed text-text-secondary">
            Las estrellas en movimiento y los meteoros pueden exigir más al dispositivo, aumentar el consumo de batería y reducir la fluidez en algunos móviles. Puedes desactivarlos cuando quieras desde Personalización.
          </p>
          <div className="mb-6 flex items-center justify-center gap-5 text-[11px] font-semibold text-text-muted">
            <span className="inline-flex items-center gap-1.5"><Gauge size={15} className="text-accent" /> Más carga gráfica</span>
            <span className="inline-flex items-center gap-1.5"><Battery size={15} className="text-accent" /> Consumo de batería</span>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button type="button" onClick={onCancel} className="w-full rounded-xl bg-black/5 px-5 py-3 text-sm font-bold text-text-secondary transition hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10">Ahora no</button>
            <button type="button" onClick={onConfirm} className="w-full rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-contrast shadow-lg shadow-accent/20 transition hover:brightness-110">Activar efectos</button>
          </div>
        </section>
      </div>
    </ModalPortal>
  );
};

// --- Constantes de Apariencia ---
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
  { id: 'mint', label: 'Menta Suave', hex: '#a8e6cf', reqLevel: 5 },
  { id: 'peach', label: 'Melocotón', hex: '#ffd3b6', reqLevel: 5 },
  { id: 'rose-water', label: 'Agua de Rosas', hex: '#ffaaa5', reqLevel: 5 },
  { id: 'lavender', label: 'Lavanda', hex: '#c5a3ff', reqLevel: 5 },
  { id: 'baby-blue', label: 'Azul Bebé', hex: '#a2cffe', reqLevel: 5 },
  { id: 'sunset-pink', label: 'Rosa Atardecer', hex: '#ff9a9e', reqLevel: 10 },
  { id: 'pistachio', label: 'Pistacho', hex: '#c5e1a5', reqLevel: 10 },
  { id: 'mango', label: 'Mango Pastel', hex: '#ffbe76', reqLevel: 10 },
  { id: 'lemonade', label: 'Limonada', hex: '#fdfd96', reqLevel: 10 },
  { id: 'cherry-blossom', label: 'Cerezo', hex: '#fccbcf', reqLevel: 10 },
  { id: 'aurora', label: 'Aurora Boreal', hex: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', reqLevel: 15 },
  { id: 'sunset', label: 'Sunset Glow', hex: '#f43f5e', gradient: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)', reqLevel: 15 },
  { id: 'cyberpunk', label: 'Cyberpunk', hex: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', reqLevel: 15 },
  { id: 'deep-ocean', label: 'Océano Profundo', hex: '#2563eb', gradient: 'linear-gradient(135deg, #2563eb 0%, #00f5d4 100%)', reqLevel: 15 },
  { id: 'imperial-gold', label: 'Oro Imperial', hex: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #fde047 100%)', reqLevel: 15 },
  { id: 'supernova', label: 'Supernova', hex: '#8b5cf6', gradient: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 35%, #3b82f6 70%, #7c3aed 100%)', reqLevel: 20, isAnimated: true },
  { id: 'plasma', label: 'Plasma Cuántico', hex: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 35%, #3b82f6 70%, #10b981 100%)', reqLevel: 20, isAnimated: true },
  { id: 'eternal-flame', label: 'Llama Eterna', hex: '#f97316', gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 35%, #facc15 70%, #ef4444 100%)', reqLevel: 20, isAnimated: true },
  { id: 'abyssal-vortex', label: 'Vórtice Abisal', hex: '#3b82f6', gradient: 'linear-gradient(135deg, #1d4ed8 0%, #6366f1 35%, #14b8a6 70%, #1d4ed8 100%)', reqLevel: 20, isAnimated: true },
  { id: 'cosmic-gold', label: 'Oro Cósmico', hex: '#f59e0b', gradient: 'linear-gradient(135deg, #d97706 0%, #fef08a 35%, #b45309 70%, #d97706 100%)', reqLevel: 20, isAnimated: true },
];

const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  return [
    'iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'
  ].includes(navigator.platform)
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
};

const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 mb-6 relative z-10">
    <div className="p-2.5 rounded-[16px] bg-black/5 dark:bg-white/5 text-accent shrink-0">
      <Icon size={24} strokeWidth={2.5} />
    </div>
    <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">{title}</h2>
  </div>
);

const SwitchItem = ({ icon: Icon, title, subtitle, checked, onChange, disabled }) => (
  <div className={`flex items-center justify-between p-4 rounded-[20px] transition-all duration-300 ${disabled ? 'opacity-50' : 'hover:-translate-y-1 hover:shadow-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'}`}>
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <div className={`p-2.5 rounded-[14px] shrink-0 transition-colors ${checked ? 'bg-accent/10 text-accent' : 'bg-black/5 dark:bg-white/5 text-text-muted'}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-text-primary leading-tight">{title}</div>
        <div className="text-[10px] sm:text-xs font-medium text-text-secondary mt-0.5">{subtitle}</div>
      </div>
    </div>
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-all duration-300 ease-in-out focus:outline-none ml-3
      ${checked ? 'bg-[var(--color-accent)] border-2 border-white/30 bg-gradient-to-br from-white/25 to-transparent backdrop-blur-[12px] shadow-[0_4px_15px_var(--color-accent-transparent),inset_0_2px_2px_rgba(255,255,255,0.4)]' : 'bg-gray-400 dark:bg-gray-600 border-2 border-transparent shadow-inner'} 
      ${disabled ? 'cursor-not-allowed' : ''}`}
    >
      <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

const AccentButton = ({ opt, isLocked, isSelected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={opt.label + (isLocked ? ` (Nivel ${opt.reqLevel})` : '')}
    className={`group flex flex-col items-center justify-start w-full focus:outline-none select-none transition-all ${
      isLocked ? 'opacity-40 grayscale-[0.3]' : ''
    }`}
  >
    <div className="relative flex justify-center items-center w-full aspect-square">
      <span
        className={`w-full h-full rounded-full transition-all duration-300 group-hover:scale-105 shrink-0 ${
          opt.isAnimated ? 'living-accent-preview' : ''
        }`}
        style={{
          background: opt.gradient || opt.hex,
          backgroundColor: opt.hex,
          boxShadow: isSelected
            ? `0 0 0 3px var(--bg-primary), 0 0 0 5px ${opt.hex}, 0 4px 10px ${opt.hex}80`
            : 'none',
        }}
      />
      {isSelected && (
        <span className="absolute inset-0 flex items-center justify-center text-white pointer-events-none drop-shadow-sm">
          <Check size={16} strokeWidth={3} className="sm:w-[18px] sm:h-[18px]" />
        </span>
      )}
      {isLocked && (
        <span className="absolute inset-0 flex items-center justify-center text-black/40 dark:text-black/60 pointer-events-none drop-shadow-sm">
          <Lock size={16} strokeWidth={2.5} />
        </span>
      )}
    </div>
    <span
      className={`h-7 sm:h-8 flex items-center justify-center text-center text-[10px] sm:text-[11px] leading-[1.15] mt-1.5 transition-colors line-clamp-2 w-full px-0.5 ${
        isSelected
          ? 'text-accent font-bold'
          : 'text-text-secondary group-hover:text-text-primary font-medium'
      }`}
    >
      {opt.label}
    </span>
  </button>
);

export default function AppearanceScreen({ setView }) {
  const { userProfile, galaxyEffectsEnabled, setGalaxyEffectsEnabled } = useAppStore(useShallow(state => ({ userProfile: state.userProfile, galaxyEffectsEnabled: state.galaxyEffectsEnabled, setGalaxyEffectsEnabled: state.setGalaxyEffectsEnabled })));
  const { addToast } = useToast();
  const { 
    theme, activeTheme, setTheme, accent, setAccent, 
    startThemeTest, isTestingTheme, testTimeLeft 
  } = useAppTheme();

  
  const [showThemeReloadModal, setShowThemeReloadModal] = useState(false);
  const [pendingThemeAction, setPendingThemeAction] = useState(null);
  const [showGalaxyEffectsWarning, setShowGalaxyEffectsWarning] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(() => typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: none), (pointer: coarse)');
    const updateTouchDevice = event => setIsTouchDevice(event.matches);
    setIsTouchDevice(mediaQuery.matches);
    mediaQuery.addEventListener?.('change', updateTouchDevice);
    return () => mediaQuery.removeEventListener?.('change', updateTouchDevice);
  }, []);

  const referralCount = userProfile?.referralCount || 0;
  const isAdmin = userProfile?.role === 'admin';
  const baseShareUrl = Capacitor.isNativePlatform()
    ? (import.meta.env.VITE_WEB_URL || 'https://profitnessglass.es')
    : (typeof window !== 'undefined' ? window.location.origin : 'https://profitnessglass.es');
  const referralLink = `${baseShareUrl}/register?ref=${userProfile?.referral_code || ''}`;

  const handleCopyReferral = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(referralLink).catch(() => {});
    }
    addToast('Enlace de invitación copiado (+1.000 XP por amigo)', 'success');
  };

  const handleShareReferral = async () => {
    const shareData = {
      title: 'Únete a Pro Fitness Glass',
      text: 'Entrena y lleva tu nutrición conmigo en Pro Fitness Glass. Regístrate gratis con mi enlace:',
      url: referralLink,
    };
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({ ...shareData, dialogTitle: 'Compartir invitación' });
        return;
      } catch {
        // Fallback a copia si el usuario cancela o no hay hoja nativa
      }
    } else if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    handleCopyReferral();
  };

  const isGalaxyUnlocked = referralCount >= 5 || isAdmin;
  const isGalaxyActive = activeTheme === 'galaxy';

  const isDesertUnlocked = referralCount >= 8 || isAdmin;
  const isDesertActive = activeTheme === 'desert' || activeTheme === 'desert-dark';

  const isOceanUnlocked = referralCount >= 11 || isAdmin;
  const isOceanActive = activeTheme === 'ocean' || activeTheme === 'ocean-dark';

  

  const handleThemeClick = (mode) => {
    setTheme(mode);
  };

  const confirmThemeReload = () => {
    if (pendingThemeAction?.type === 'apply') {
      setTheme(pendingThemeAction.payload, true);
    } else if (pendingThemeAction?.type === 'test') {
      const themeName = pendingThemeAction.payload.theme || 'galaxy';
      const duration = pendingThemeAction.payload.duration || 10;
      startThemeTest(themeName, duration, true);
    }
    setShowThemeReloadModal(false);
    setPendingThemeAction(null);
  };

  const [isMyThemesOpenMobile, setIsMyThemesOpenMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('my_themes_expanded_mobile');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const toggleMyThemesMobile = () => {
    setIsMyThemesOpenMobile(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('my_themes_expanded_mobile', String(next));
      }
      return next;
    });
  };

  const glassCardClass = "glass p-5 sm:p-7 lg:p-8 rounded-[28px] sm:rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 flex flex-col relative overflow-hidden transition-all duration-300";

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-2 pb-28 md:pb-8 max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto animate-[fade-in_0.3s_ease-out]">
      <Helmet>
        <title>Apariencia - Pro Fitness Glass</title>
      </Helmet>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 1) Apariencia de la App: a la izquierda en PC, abajo en móvil */}
        <GlassCard id="tutorial-appearance-panel" className={`${glassCardClass} order-2 lg:order-1 lg:col-span-7 xl:col-span-7`}>
          <SectionTitle icon={Palette} title="Apariencia de la App" />

          {/* Temas Base */}
          <div id="tutorial-appearance-base-themes" className="mb-8">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 ml-1">Tema Principal</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['system', 'light', 'dark', 'oled'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleThemeClick(mode)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[20px] transition-all duration-300 ${theme === mode && !isTestingTheme
                    ? 'bg-accent text-accent-contrast shadow-lg shadow-accent/30 scale-105'
                    : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary'
                    }`}
                >
                  {mode === 'system' && <MonitorCog size={22} />}
                  {mode === 'light' && <Sun size={22} />}
                  {mode === 'dark' && <Moon size={22} />}
                  {mode === 'oled' && <Smartphone size={22} />}
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {mode === 'system' ? 'Sistema' : mode === 'light' ? 'Claro' : mode === 'dark' ? 'Oscuro' : 'OLED'}
                  </span>
                </button>
              ))}
            </div>
          </div>

                    {/* Acentos */}
          <div id="tutorial-appearance-accents" className="mb-8">
            <div className={`transition-all duration-300 ${isGalaxyActive || isDesertActive || isOceanActive ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
              
              {/* Por defecto */}
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 ml-1">Acento de Color</h3>
              <div className="grid grid-cols-5 gap-y-4 gap-x-2.5 sm:gap-4 mb-6">
                {ACCENT_OPTIONS.filter(o => !o.reqLevel).map(opt => (
                  <AccentButton
                    key={opt.id}
                    opt={opt}
                    isLocked={false}
                    isSelected={accent === opt.id && !isGalaxyActive && !isDesertActive && !isOceanActive}
                    onClick={() => setAccent(opt.id)}
                  />
                ))}
              </div>

              {/* Por niveles */}
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 ml-1 mt-8">Acento de color por niveles</h3>
              
              {/* Nivel 5 */}
              <div className="flex items-center gap-2 mb-3 ml-1 mt-6">
                <div className="scale-[0.6] origin-left -my-3">
                  <LevelBadge level={5} size="sm" />
                </div>
                <h4 className="text-sm font-black text-text-primary tracking-tight">Nivel 5</h4>
              </div>
              <div className="grid grid-cols-5 gap-y-4 gap-x-2.5 sm:gap-4 mb-6">
                {ACCENT_OPTIONS.filter(o => o.reqLevel === 5).map(opt => {
                  const isLocked = (userProfile?.level || 1) < 5 && userProfile?.role !== 'admin';
                  return (
                    <AccentButton
                      key={opt.id}
                      opt={opt}
                      isLocked={isLocked}
                      isSelected={accent === opt.id && !isGalaxyActive && !isDesertActive && !isOceanActive && !isLocked}
                      onClick={() => {
                        if (isLocked) {
                          addToast(`Requiere nivel 5 para aplicarlo`, 'info', 'lock');
                        } else {
                          setAccent(opt.id);
                        }
                      }}
                    />
                  );
                })}
              </div>

              {/* Nivel 10 */}
              <div className="flex items-center gap-2 mb-3 ml-1 mt-6">
                <div className="scale-[0.6] origin-left -my-3">
                  <LevelBadge level={10} size="sm" />
                </div>
                <h4 className="text-sm font-black text-text-primary tracking-tight">Nivel 10</h4>
              </div>
              <div className="grid grid-cols-5 gap-y-4 gap-x-2.5 sm:gap-4 mb-6">
                {ACCENT_OPTIONS.filter(o => o.reqLevel === 10).map(opt => {
                  const isLocked = (userProfile?.level || 1) < 10 && userProfile?.role !== 'admin';
                  return (
                    <AccentButton
                      key={opt.id}
                      opt={opt}
                      isLocked={isLocked}
                      isSelected={accent === opt.id && !isGalaxyActive && !isDesertActive && !isOceanActive && !isLocked}
                      onClick={() => {
                        if (isLocked) {
                          addToast(`Requiere nivel 10 para aplicarlo`, 'info', 'lock');
                        } else {
                          setAccent(opt.id);
                        }
                      }}
                    />
                  );
                })}
              </div>

              {/* Nivel 15 · Degradados */}
              <div className="flex items-center gap-2 mb-3 ml-1 mt-6">
                <div className="scale-[0.6] origin-left -my-3">
                  <LevelBadge level={15} size="sm" />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-text-primary tracking-tight leading-none">Nivel 15</h4>
                  <span className="inline-flex items-center justify-center text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-accent/15 tracking-wider leading-none">
                    <span className="text-accent leading-none">Degradados</span>
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-y-4 gap-x-2.5 sm:gap-4 mb-6">
                {ACCENT_OPTIONS.filter(o => o.reqLevel === 15).map(opt => {
                  const isLocked = (userProfile?.level || 1) < 15 && userProfile?.role !== 'admin';
                  return (
                    <AccentButton
                      key={opt.id}
                      opt={opt}
                      isLocked={isLocked}
                      isSelected={accent === opt.id && !isGalaxyActive && !isDesertActive && !isOceanActive && !isLocked}
                      onClick={() => {
                        if (isLocked) {
                          addToast(`Requiere nivel 15 para aplicarlo`, 'info', 'lock');
                        } else {
                          setAccent(opt.id);
                        }
                      }}
                    />
                  );
                })}
              </div>

              {/* Nivel 20 · Dinámicos Animados */}
              <div className="flex items-center gap-2 mb-3 ml-1 mt-6">
                <div className="scale-[0.6] origin-left -my-3">
                  <LevelBadge level={20} size="sm" />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-text-primary tracking-tight leading-none">Nivel 20</h4>
                  <span className="inline-flex items-center justify-center text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-accent/15 tracking-wider leading-none">
                    <span className="text-accent leading-none">Animados</span>
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-y-4 gap-x-2.5 sm:gap-4 mb-2">
                {ACCENT_OPTIONS.filter(o => o.reqLevel === 20).map(opt => {
                  const isLocked = (userProfile?.level || 1) < 20 && userProfile?.role !== 'admin';
                  return (
                    <AccentButton
                      key={opt.id}
                      opt={opt}
                      isLocked={isLocked}
                      isSelected={accent === opt.id && !isGalaxyActive && !isDesertActive && !isOceanActive && !isLocked}
                      onClick={() => {
                        if (isLocked) {
                          addToast(`Requiere nivel 20 para aplicarlo`, 'info', 'lock');
                        } else {
                          setAccent(opt.id);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
          
          
        </GlassCard>

        {/* 2) Mis Temas: a la derecha en PC, arriba y desplegable/solapable en móvil */}
        <GlassCard id="tutorial-appearance-my-themes" className={`${glassCardClass} order-1 lg:order-2 lg:col-span-5 xl:col-span-5`}>
          {/* Cabecera / Trigger Móvil de Desplegar/Solapar */}
          <div 
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 1024) toggleMyThemesMobile();
            }}
            className="flex items-center justify-between cursor-pointer select-none lg:cursor-default"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[16px] bg-black/5 dark:bg-white/5 text-accent shrink-0">
                <FaMeteor size={24} strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">Mis Temas</h2>
                  {(isGalaxyActive || isDesertActive || isOceanActive) && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent tracking-wider">
                      {isGalaxyActive ? 'Galaxia' : isDesertActive ? 'Desierto' : 'Océano'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mt-0.5 hidden lg:block">
                  Invita amigos para ganar +1.000 XP cada uno y desbloquear estos 3 temas con vistas previas reales.
                </p>
                <p className="text-[11px] text-text-muted mt-0.5 lg:hidden block">
                  {isMyThemesOpenMobile ? 'Toca para solapar' : '3 temas exclusivos · +1.000 XP/amigo'}
                </p>
              </div>
            </div>

            {/* Controles móviles para desplegar/solapar */}
            <div className="flex items-center gap-2 lg:hidden">
              {!isMyThemesOpenMobile && (
                <div className="flex -space-x-1 items-center mr-1 opacity-90">
                  <span className="w-6 h-6 rounded-full bg-[#a855f7]/20 text-[#a855f7] flex items-center justify-center ring-1 ring-[#a855f7]/30" title="Galaxia">
                    <FaMeteor size={11} />
                  </span>
                  <span className="w-6 h-6 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] flex items-center justify-center ring-1 ring-[#f59e0b]/30" title="Desierto">
                    <FaSun size={11} />
                  </span>
                  <span className="w-6 h-6 rounded-full bg-[#0ea5e9]/20 text-[#0ea5e9] flex items-center justify-center ring-1 ring-[#0ea5e9]/30" title="Océano">
                    <FaUmbrellaBeach size={11} />
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMyThemesMobile();
                }}
                className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary transition-all active:scale-95"
                aria-label={isMyThemesOpenMobile ? "Solapar mis temas" : "Desplegar mis temas"}
              >
                <ChevronDown 
                  size={18} 
                  className={`transition-transform duration-300 ${isMyThemesOpenMobile ? 'rotate-180' : 'rotate-0'}`} 
                />
              </button>
            </div>
          </div>

          {/* Contenido: Desplegable en móvil, Siempre visible en PC */}
          <div className={`${isMyThemesOpenMobile ? 'block' : 'hidden'} lg:block transition-all duration-300 ${isMyThemesOpenMobile ? 'mt-5' : 'mt-4'}`}>

          {/* Banner de Progreso y Recompensa por Compartir */}
          <div className="mb-4 p-4 rounded-[22px] bg-accent/10 border border-accent/25 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-accent text-accent-contrast flex items-center justify-center shrink-0 shadow-sm">
                  <FaGift size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-text-primary">Consigue temas y +1.000 XP</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-black uppercase tracking-wider">
                      <FaBolt size={10} /> +1.000 XP / amigo
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-text-secondary mt-1 leading-relaxed">
                    Comparte tu enlace: cada amigo nuevo te suma <strong>1.000 XP</strong> y desbloquea los temas atmosféricos Liquid Glass.
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-bg-primary/80 ring-1 ring-black/5 dark:ring-white/10 text-[11px] font-black text-text-primary">
                  {referralCount} {referralCount === 1 ? 'amigo' : 'amigos'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleShareReferral}
                className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-contrast text-xs font-extrabold shadow-md shadow-accent/20 hover:brightness-110 transition-all cursor-pointer"
              >
                <FaShareNodes size={13} />
                <span>Invitar (+1.000 XP)</span>
              </button>
              <button
                type="button"
                onClick={handleCopyReferral}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-text-primary text-xs font-bold transition-all cursor-pointer"
              >
                <FaCopy size={12} />
                <span>Copiar enlace</span>
              </button>
            </div>
          </div>

          <div className={`p-4 rounded-[22px] transition-all duration-500 border ${theme === 'galaxy' || isTestingTheme ? 'bg-[#a855f7]/10 border-[#a855f7]/30 shadow-lg shadow-[#a855f7]/20' : 'bg-black/5 dark:bg-white/5 border-transparent'}`}>
            {/* Vista previa real Galaxia */}
            <div
              className="relative h-24 sm:h-28 rounded-2xl overflow-hidden mb-3.5 ring-1 ring-white/15 flex items-end p-3"
              style={{
                background: 'radial-gradient(circle at 20% 20%, rgba(168,85,247,0.45), transparent 55%), radial-gradient(circle at 80% 75%, rgba(59,130,246,0.35), transparent 55%), linear-gradient(135deg, #070314 0%, #1d0b3b 50%, #090d26 100%)'
              }}
            >
              <div className="absolute top-3 left-6 w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_8px_#fff]" />
              <div className="absolute top-6 right-12 w-1 h-1 rounded-full bg-purple-200/90 shadow-[0_0_6px_#a855f7]" />
              <div className="absolute bottom-8 left-1/2 w-1.5 h-1.5 rounded-full bg-sky-200/90 shadow-[0_0_8px_#38bdf8]" />
              <div className="relative z-10 w-full flex items-center justify-between gap-2">
                <div className="px-2.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold flex items-center gap-1.5">
                  <FaMeteor size={11} className="text-[#c084fc]" />
                  <span>Liquid Glass · Estelar</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-extrabold text-white border border-white/15">
                  {isGalaxyUnlocked ? 'Desbloqueado' : `${Math.min(referralCount, 5)}/5 amigos`}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2.5 rounded-[14px] shrink-0 ${isGalaxyUnlocked ? 'bg-[#a855f7]/20 text-[#a855f7]' : 'bg-black/10 dark:bg-white/10 text-text-muted'}`}>
                   <FaMeteor size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-bold ${isGalaxyUnlocked ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#a855f7] to-[#3b82f6]' : 'text-text-primary'}`}>
                    Tema Galaxia
                  </div>
                  <div className="text-[10px] sm:text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
                    {isGalaxyUnlocked ? (
                      <><FaLockOpen size={11} className="text-green-500" /> Desbloqueado</>
                    ) : (
                      <><FaLock size={11} className="text-text-muted" /> {Math.max(0, 5 - referralCount)} {5 - referralCount === 1 ? 'amigo más' : 'amigos más'} para desbloquear</>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {isGalaxyUnlocked ? (
                   <button 
                     onClick={() => handleThemeClick('galaxy')} 
                     className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${theme === 'galaxy' ? 'bg-[#a855f7] text-white shadow-lg shadow-[#a855f7]/30' : 'bg-black/10 dark:bg-white/10 hover:bg-[#a855f7]/20 text-[#a855f7]'}`}
                   >
                     {theme === 'galaxy' ? 'Activo' : 'Aplicar'}
                   </button>
                ) : (
                   <>
                     <button 
                       onClick={() => {
                         if (isIOS()) {
                           setPendingThemeAction({ type: 'test', payload: { theme: 'galaxy', duration: 10 } });
                           setShowThemeReloadModal(true);
                         } else {
                           startThemeTest('galaxy', 10);
                         }
                       }}  
                       disabled={isTestingTheme} 
                       className="px-3.5 py-2 rounded-full text-xs font-bold bg-[#a855f7]/20 text-[#a855f7] hover:bg-[#a855f7]/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-80 whitespace-nowrap cursor-pointer"
                     >
                       {isTestingTheme ? `Probando ${testTimeLeft}s` : 'Probar 10s'}
                     </button>
                     <button
                       type="button"
                       onClick={handleShareReferral}
                       className="px-3.5 py-2 rounded-full text-xs font-bold bg-accent text-accent-contrast hover:brightness-110 transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                     >
                       <FaShareNodes size={11} />
                       <span>Invitar</span>
                     </button>
                   </>
                )}
              </div>
            </div>
            {!isGalaxyUnlocked && (
              <div className="mt-3 w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#a855f7] to-[#3b82f6] transition-all duration-500" style={{ width: `${Math.min(100, Math.round((referralCount / 5) * 100))}%` }} />
              </div>
            )}
            {isGalaxyActive && (
              <p className="text-[10px] sm:text-xs text-[#a855f7] font-bold mt-4 ml-1 flex items-center gap-1.5">
                <Info size={14} /> El Tema Galaxia usa su propio acento estelar (desactiva el acento manual).
              </p>
            )}
            {isTouchDevice && isGalaxyActive && (
              <div className="mt-4 border-t border-[#a855f7]/15 pt-4">
                <SwitchItem
                  icon={FaMeteor}
                  title="Estrellas animadas y meteoros"
                  subtitle="Añade movimiento al fondo del tema Galaxia"
                  checked={galaxyEffectsEnabled}
                  onChange={() => {
                    if (galaxyEffectsEnabled) setGalaxyEffectsEnabled(false);
                    else setShowGalaxyEffectsWarning(true);
                  }}
                />
              </div>
            )}
          </div>

          <div className={`mt-4 p-4 rounded-[22px] transition-all duration-500 border ${isDesertActive ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30 shadow-lg shadow-[#f59e0b]/20' : 'bg-black/5 dark:bg-white/5 border-transparent'}`}>
            {/* Vista previa real Desierto */}
            <div className="relative h-24 sm:h-28 rounded-2xl overflow-hidden mb-3.5 ring-1 ring-white/15 flex items-end p-3 bg-[#7c2d12]">
              <img
                src="/assets/themes/desert.jpg"
                alt="Vista previa Tema Desierto"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-amber-500/15" />
              <div className="relative z-10 w-full flex items-center justify-between gap-2">
                <div className="px-2.5 py-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white text-[10px] font-bold flex items-center gap-1.5">
                  <FaSun size={11} className="text-[#fcd34d]" />
                  <span>Liquid Glass · Dunas (Claro / Oscuro)</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-extrabold text-white border border-white/15">
                  {isDesertUnlocked ? 'Desbloqueado' : `${Math.min(referralCount, 8)}/8 amigos`}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2.5 rounded-[14px] shrink-0 ${isDesertUnlocked ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : 'bg-black/10 dark:bg-white/10 text-text-muted'}`}>
                   <FaSun size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-bold ${isDesertUnlocked ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#f59e0b] to-[#ea580c]' : 'text-text-primary'}`}>
                    Tema Desierto
                  </div>
                  <div className="text-[10px] sm:text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
                    {isDesertUnlocked ? (
                      <><FaLockOpen size={11} className="text-green-500" /> Desbloqueado</>
                    ) : (
                      <><FaLock size={11} className="text-text-muted" /> {Math.max(0, 8 - referralCount)} {8 - referralCount === 1 ? 'amigo más' : 'amigos más'} para desbloquear</>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {isDesertUnlocked ? (
                   <div className="flex flex-wrap gap-2">
                     <button 
                       onClick={() => handleThemeClick('desert')} 
                       className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${theme === 'desert' ? 'bg-[#f59e0b] text-white shadow-lg shadow-[#f59e0b]/30' : 'bg-black/10 dark:bg-white/10 hover:bg-[#f59e0b]/20 text-[#b45309] dark:text-[#fcd34d]'}`}
                     >
                       Claro
                     </button>
                     <button 
                       onClick={() => handleThemeClick('desert-dark')} 
                       className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${theme === 'desert-dark' ? 'bg-[#f59e0b] text-white shadow-lg shadow-[#f59e0b]/30' : 'bg-black/10 dark:bg-white/10 hover:bg-[#f59e0b]/20 text-[#b45309] dark:text-[#fcd34d]'}`}
                     >
                       Oscuro
                     </button>
                   </div>
                ) : (
                   <div className="flex flex-wrap gap-2">
                     <button 
                       onClick={() => {
                         if (isIOS()) {
                           setPendingThemeAction({ type: 'test', payload: { theme: 'desert', duration: 10 } });
                           setShowThemeReloadModal(true);
                         } else {
                           startThemeTest('desert', 10);
                         }
                       }} 
                       disabled={isTestingTheme} 
                       className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all bg-[#f59e0b]/20 text-[#f59e0b] hover:bg-[#f59e0b]/30 disabled:opacity-80 cursor-pointer"
                     >
                       {isTestingTheme ? `Probando ${testTimeLeft}s` : 'Probar Claro'}
                     </button>
                     <button 
                       onClick={() => {
                         if (isIOS()) {
                           setPendingThemeAction({ type: 'test', payload: { theme: 'desert-dark', duration: 10 } });
                           setShowThemeReloadModal(true);
                         } else {
                           startThemeTest('desert-dark', 10);
                         }
                       }} 
                       disabled={isTestingTheme} 
                       className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all bg-[#f59e0b]/20 text-[#f59e0b] hover:bg-[#f59e0b]/30 disabled:opacity-80 cursor-pointer"
                     >
                       {isTestingTheme ? `Probando ${testTimeLeft}s` : 'Probar Oscuro'}
                     </button>
                     <button
                       type="button"
                       onClick={handleShareReferral}
                       className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-accent text-accent-contrast hover:brightness-110 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                     >
                       <FaShareNodes size={10} />
                       <span>Invitar</span>
                     </button>
                   </div>
                )}
              </div>
            </div>
            {!isDesertUnlocked && (
              <div className="mt-3 w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#f59e0b] to-[#ea580c] transition-all duration-500" style={{ width: `${Math.min(100, Math.round((referralCount / 8) * 100))}%` }} />
              </div>
            )}
            {isDesertActive && (
              <p className="text-[10px] sm:text-xs text-[#f59e0b] font-bold mt-4 ml-1 flex items-center gap-1.5">
                <Info size={14} /> El Tema Desierto usa su propio acento cálido (desactiva el acento manual).
              </p>
            )}
          </div>

          <div className={`mt-4 p-4 rounded-[22px] transition-all duration-500 border ${isOceanActive ? 'bg-[#0ea5e9]/10 border-[#0ea5e9]/30 shadow-lg shadow-[#0ea5e9]/20' : 'bg-black/5 dark:bg-white/5 border-transparent'}`}>
            {/* Vista previa real Océano */}
            <div className="relative h-24 sm:h-28 rounded-2xl overflow-hidden mb-3.5 ring-1 ring-white/15 flex items-end p-3 bg-[#0c4a6e]">
              <img
                src="/assets/themes/ocean.jpg"
                alt="Vista previa Tema Océano"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-sky-500/15" />
              <div className="relative z-10 w-full flex items-center justify-between gap-2">
                <div className="px-2.5 py-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white text-[10px] font-bold flex items-center gap-1.5">
                  <FaUmbrellaBeach size={11} className="text-[#7dd3fc]" />
                  <span>Liquid Glass · Océano (Claro / Oscuro)</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-extrabold text-white border border-white/15">
                  {isOceanUnlocked ? 'Desbloqueado' : `${Math.min(referralCount, 11)}/11 amigos`}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2.5 rounded-[14px] shrink-0 ${isOceanUnlocked ? 'bg-[#0ea5e9]/20 text-[#0ea5e9]' : 'bg-black/10 dark:bg-white/10 text-text-muted'}`}>
                   <FaUmbrellaBeach size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-bold ${isOceanUnlocked ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#0ea5e9] to-[#0284c7]' : 'text-text-primary'}`}>
                    Tema Océano
                  </div>
                  <div className="text-[10px] sm:text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
                    {isOceanUnlocked ? (
                      <><FaLockOpen size={11} className="text-green-500" /> Desbloqueado</>
                    ) : (
                      <><FaLock size={11} className="text-text-muted" /> {Math.max(0, 11 - referralCount)} {11 - referralCount === 1 ? 'amigo más' : 'amigos más'} para desbloquear</>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {isOceanUnlocked ? (
                   <div className="flex flex-wrap gap-2">
                     <button 
                       onClick={() => handleThemeClick('ocean')} 
                       className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${theme === 'ocean' ? 'bg-[#0ea5e9] text-white shadow-lg shadow-[#0ea5e9]/30' : 'bg-black/10 dark:bg-white/10 hover:bg-[#0ea5e9]/20 text-[#0369a1] dark:text-[#7dd3fc]'}`}
                     >
                       Claro
                     </button>
                     <button 
                       onClick={() => handleThemeClick('ocean-dark')} 
                       className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${theme === 'ocean-dark' ? 'bg-[#0ea5e9] text-white shadow-lg shadow-[#0ea5e9]/30' : 'bg-black/10 dark:bg-white/10 hover:bg-[#0ea5e9]/20 text-[#0369a1] dark:text-[#7dd3fc]'}`}
                     >
                       Oscuro
                     </button>
                   </div>
                ) : (
                   <div className="flex flex-wrap gap-2">
                     <button 
                       onClick={() => {
                         if (isIOS()) {
                           setPendingThemeAction({ type: 'test', payload: { theme: 'ocean', duration: 10 } });
                           setShowThemeReloadModal(true);
                         } else {
                           startThemeTest('ocean', 10);
                         }
                       }} 
                       disabled={isTestingTheme} 
                       className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all bg-[#0ea5e9]/20 text-[#0ea5e9] hover:bg-[#0ea5e9]/30 disabled:opacity-80 cursor-pointer"
                     >
                       {isTestingTheme ? `Probando ${testTimeLeft}s` : 'Probar Claro'}
                     </button>
                     <button 
                       onClick={() => {
                         if (isIOS()) {
                           setPendingThemeAction({ type: 'test', payload: { theme: 'ocean-dark', duration: 10 } });
                           setShowThemeReloadModal(true);
                         } else {
                           startThemeTest('ocean-dark', 10);
                         }
                       }} 
                       disabled={isTestingTheme} 
                       className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all bg-[#0ea5e9]/20 text-[#0ea5e9] hover:bg-[#0ea5e9]/30 disabled:opacity-80 cursor-pointer"
                     >
                       {isTestingTheme ? `Probando ${testTimeLeft}s` : 'Probar Oscuro'}
                     </button>
                     <button
                       type="button"
                       onClick={handleShareReferral}
                       className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-accent text-accent-contrast hover:brightness-110 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                     >
                       <FaShareNodes size={10} />
                       <span>Invitar</span>
                     </button>
                   </div>
                )}
              </div>
            </div>
            {!isOceanUnlocked && (
              <div className="mt-3 w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] transition-all duration-500" style={{ width: `${Math.min(100, Math.round((referralCount / 11) * 100))}%` }} />
              </div>
            )}
            {isOceanActive && (
              <p className="text-[10px] sm:text-xs text-[#0ea5e9] font-bold mt-4 ml-1 flex items-center gap-1.5">
                <Info size={14} /> El Tema Océano usa su propio acento vibrante (desactiva el acento manual).
              </p>
            )}
          </div>

          {/* Botón inferior móvil para solapar */}
          <div className="mt-5 pt-3 border-t border-black/5 dark:border-white/5 flex justify-center lg:hidden">
            <button
              type="button"
              onClick={toggleMyThemesMobile}
              className="text-xs font-bold text-text-muted hover:text-text-primary flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-black/5 dark:bg-white/5 active:scale-95 transition-all"
            >
              <ChevronUp size={14} /> Solapar Mis Temas
            </button>
          </div>
        </div>
      </GlassCard>

        {showThemeReloadModal && (
          <ConfirmationModal
            title="Recargar UI"
            message="En iOS es necesario recargar la interfaz para aplicar este tema correctamente. ¿Continuar?"
            onConfirm={confirmThemeReload}
            onCancel={() => {
              setShowThemeReloadModal(false);
              setPendingThemeAction(null);
            }}
            confirmText="Recargar"
          />
        )}
        {showGalaxyEffectsWarning && (
          <GalaxyEffectsWarningModal
            onConfirm={() => {
              setGalaxyEffectsEnabled(true);
              setShowGalaxyEffectsWarning(false);
            }}
            onCancel={() => setShowGalaxyEffectsWarning(false)}
          />
        )}
      </div>
    </div>
  );
}
