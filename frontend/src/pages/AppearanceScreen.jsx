import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Palette, Sun, Moon, MonitorCog, Smartphone, Check, ChevronLeft, ChevronRight, LockOpen, Lock, Info, Vibrate, Droplet
} from 'lucide-react';
import { FaMeteor } from 'react-icons/fa6'; 
import useAppStore from '../store/useAppStore';
import { useAppTheme } from '../hooks/useAppTheme';
import GlassCard from '../components/GlassCard';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from '../components/ConfirmationModal';

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
  { id: 'neutral', label: 'Neutral', hex: '#737373' }
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

export default function AppearanceScreen({ setView }) {
  const { userProfile, hapticsEnabled, setHapticsEnabled } = useAppStore();
  const { addToast } = useToast();
  const { 
    theme, activeTheme, setTheme, accent, setAccent, 
    startThemeTest, isTestingTheme, testTimeLeft 
  } = useAppTheme();

  const [currentColorPage, setCurrentColorPage] = useState(0);
  const [showThemeReloadModal, setShowThemeReloadModal] = useState(false);
  const [pendingThemeAction, setPendingThemeAction] = useState(null);

  const isGalaxyUnlocked = (userProfile?.referralCount || 0) >= 5 || userProfile?.role === 'admin';
  const isGalaxyActive = activeTheme === 'galaxy';

  const isDesertUnlocked = (userProfile?.referralCount || 0) >= 8 || userProfile?.role === 'admin';
  const isDesertActive = activeTheme === 'desert' || activeTheme === 'desert-dark';

  const isOceanUnlocked = (userProfile?.referralCount || 0) >= 11 || userProfile?.role === 'admin';
  const isOceanActive = activeTheme === 'ocean' || activeTheme === 'ocean-dark';

  const COLORS_PER_PAGE = 12;
  const totalPages = Math.ceil(ACCENT_OPTIONS.length / COLORS_PER_PAGE);
  const currentColors = ACCENT_OPTIONS.slice(
    currentColorPage * COLORS_PER_PAGE,
    (currentColorPage * COLORS_PER_PAGE) + COLORS_PER_PAGE
  );

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
      setTheme(pendingThemeAction.payload, true);
    } else if (pendingThemeAction?.type === 'test') {
      const themeName = pendingThemeAction.payload.theme || 'galaxy';
      const duration = pendingThemeAction.payload.duration || 10;
      startThemeTest(themeName, duration, true);
    }
    setShowThemeReloadModal(false);
    setPendingThemeAction(null);
  };

  const glassCardClass = "glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 flex flex-col relative overflow-hidden transition-all duration-300 mb-6";

  return (
    <div className="px-4 pt-6 pb-28 md:pb-8 md:p-8 max-w-4xl mx-auto animate-[fade-in_0.3s_ease-out]">
      <Helmet>
        <title>Apariencia - Pro Fitness Glass</title>
      </Helmet>
      


      <div className="w-full">
        
        <GlassCard className={glassCardClass}>
          <SectionTitle icon={Palette} title="Apariencia de la App" />

          {/* Temas Base */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 ml-1">Tema Principal</h3>
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
                    {mode === 'system' ? 'Sistema' : mode === 'light' ? 'Claro' : mode === 'dark' ? 'Oscuro' : 'OLED'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Acentos */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4 ml-1">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Acento de Color</h3>
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
            
            <div className={`transition-all duration-300 ${isGalaxyActive || isDesertActive || isOceanActive ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
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
                    {accent === opt.id && !isGalaxyActive && !isDesertActive && !isOceanActive && (
                      <span className="absolute inset-0 flex items-center justify-center text-white pointer-events-none drop-shadow-sm">
                        <Check size={16} strokeWidth={3} className="sm:w-[18px] sm:h-[18px]" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Vibración UI */}
          <div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 ml-1">Experiencia UX</h3>
            <SwitchItem
              icon={Vibrate}
              title="Vibración Háptica"
              subtitle="Feedback táctil al pulsar botones y completar series"
              checked={hapticsEnabled}
              onChange={() => {
                const newValue = !hapticsEnabled;
                setHapticsEnabled(newValue);
                addToast(newValue ? 'Vibración activada' : 'Vibración desactivada', 'success');
              }}
            />
          </div>
        </GlassCard>

        {/* Mis Temas (Desbloqueables) */}
        <GlassCard className={glassCardClass}>
          <SectionTitle icon={FaMeteor} title="Mis Temas" />
          <p className="text-sm text-text-secondary mb-6 ml-1">
            Temas exclusivos desbloqueados mediante retos y progreso en la aplicación.
          </p>

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
                      <><Lock size={12} className="text-text-muted" /> Invita a 5 amigos</>
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
                         setPendingThemeAction({ type: 'test', payload: { theme: 'galaxy', duration: 10 } });
                         setShowThemeReloadModal(true);
                       } else {
                         startThemeTest('galaxy', 10);
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
            {isGalaxyActive && (
              <p className="text-[10px] sm:text-xs text-[#a855f7] font-bold mt-4 ml-1 flex items-center gap-1.5">
                <Info size={14} /> El Tema Galaxia usa su propio acento estelar (desactiva el acento manual).
              </p>
            )}
          </div>

          <div className={`mt-4 p-4 rounded-[20px] transition-all duration-500 border ${isDesertActive ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30 shadow-lg shadow-[#f59e0b]/20 scale-[1.02]' : 'bg-black/5 dark:bg-white/5 border-transparent'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-[14px] ${isDesertUnlocked ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : 'bg-black/10 dark:bg-white/10 text-text-muted'}`}>
                   <Sun size={22} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${isDesertUnlocked ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#f59e0b] to-[#ea580c]' : 'text-text-primary'}`}>
                    Tema Desierto
                  </div>
                  <div className="text-[10px] sm:text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                    {isDesertUnlocked ? (
                      <><LockOpen size={12} className="text-green-500" /> Desbloqueado</>
                    ) : (
                      <><Lock size={12} className="text-text-muted" /> Invita a 8 amigos</>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                {isDesertUnlocked ? (
                   <div className="flex flex-col sm:flex-row gap-2">
                     <button 
                       onClick={() => handleThemeClick('desert')} 
                       className={`px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all ${theme === 'desert' ? 'bg-[#f59e0b] text-white shadow-lg shadow-[#f59e0b]/30' : 'bg-black/10 dark:bg-white/10 hover:bg-[#f59e0b]/20 text-[#b45309] dark:text-[#fcd34d]'}`}
                     >
                       Claro
                     </button>
                     <button 
                       onClick={() => handleThemeClick('desert-dark')} 
                       className={`px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all ${theme === 'desert-dark' ? 'bg-[#f59e0b] text-white shadow-lg shadow-[#f59e0b]/30' : 'bg-black/10 dark:bg-white/10 hover:bg-[#f59e0b]/20 text-[#b45309] dark:text-[#fcd34d]'}`}
                     >
                       Oscuro
                     </button>
                   </div>
                ) : (
                   <div className="flex flex-col sm:flex-row gap-2">
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
                       className="px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all bg-[#f59e0b]/20 text-[#f59e0b] hover:bg-[#f59e0b]/30 disabled:opacity-80"
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
                       className="px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all bg-[#f59e0b]/20 text-[#f59e0b] hover:bg-[#f59e0b]/30 disabled:opacity-80"
                     >
                       {isTestingTheme ? `Probando ${testTimeLeft}s` : 'Probar Oscuro'}
                     </button>
                   </div>
                )}
              </div>
            </div>
            {isDesertActive && (
              <p className="text-[10px] sm:text-xs text-[#f59e0b] font-bold mt-4 ml-1 flex items-center gap-1.5">
                <Info size={14} /> El Tema Desierto usa su propio acento cálido (desactiva el acento manual).
              </p>
            )}
          </div>

          <div className={`mt-4 p-4 rounded-[20px] transition-all duration-500 border ${isOceanActive ? 'bg-[#0ea5e9]/10 border-[#0ea5e9]/30 shadow-lg shadow-[#0ea5e9]/20 scale-[1.02]' : 'bg-black/5 dark:bg-white/5 border-transparent'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-[14px] ${isOceanUnlocked ? 'bg-[#0ea5e9]/20 text-[#0ea5e9]' : 'bg-black/10 dark:bg-white/10 text-text-muted'}`}>
                   <Droplet size={22} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${isOceanUnlocked ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#0ea5e9] to-[#0284c7]' : 'text-text-primary'}`}>
                    Tema Océano
                  </div>
                  <div className="text-[10px] sm:text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                    {isOceanUnlocked ? (
                      <><LockOpen size={12} className="text-green-500" /> Desbloqueado</>
                    ) : (
                      <><Lock size={12} className="text-text-muted" /> Invita a 11 amigos</>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                {isOceanUnlocked ? (
                   <div className="flex flex-col sm:flex-row gap-2">
                     <button 
                       onClick={() => handleThemeClick('ocean')} 
                       className={`px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all ${theme === 'ocean' ? 'bg-[#0ea5e9] text-white shadow-lg shadow-[#0ea5e9]/30' : 'bg-black/10 dark:bg-white/10 hover:bg-[#0ea5e9]/20 text-[#0369a1] dark:text-[#7dd3fc]'}`}
                     >
                       Claro
                     </button>
                     <button 
                       onClick={() => handleThemeClick('ocean-dark')} 
                       className={`px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all ${theme === 'ocean-dark' ? 'bg-[#0ea5e9] text-white shadow-lg shadow-[#0ea5e9]/30' : 'bg-black/10 dark:bg-white/10 hover:bg-[#0ea5e9]/20 text-[#0369a1] dark:text-[#7dd3fc]'}`}
                     >
                       Oscuro
                     </button>
                   </div>
                ) : (
                   <div className="flex flex-col sm:flex-row gap-2">
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
                       className="px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all bg-[#0ea5e9]/20 text-[#0ea5e9] hover:bg-[#0ea5e9]/30 disabled:opacity-80"
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
                       className="px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all bg-[#0ea5e9]/20 text-[#0ea5e9] hover:bg-[#0ea5e9]/30 disabled:opacity-80"
                     >
                       {isTestingTheme ? `Probando ${testTimeLeft}s` : 'Probar Oscuro'}
                     </button>
                   </div>
                )}
              </div>
            </div>
            {isOceanActive && (
              <p className="text-[10px] sm:text-xs text-[#0ea5e9] font-bold mt-4 ml-1 flex items-center gap-1.5">
                <Info size={14} /> El Tema Océano usa su propio acento vibrante (desactiva el acento manual).
              </p>
            )}
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
      </div>
    </div>
  );
}
