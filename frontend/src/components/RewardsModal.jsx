import ModalPortal from './ModalPortal';
import React, { useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Snowflake, Sparkles } from 'lucide-react';
import {
  FaGift,
  FaTrophy,
  FaCheck,
  FaLock,
  FaLockOpen,
  FaXmark,
  FaMeteor,
  FaSun,
  FaUmbrellaBeach,
  FaShareNodes,
  FaCopy,
  FaBolt,
} from 'react-icons/fa6';
import useAppStore from '../store/useAppStore';
import { useAppTheme } from '../hooks/useAppTheme';
import useModalLock from '../hooks/useModalLock';
import { useToast } from '../hooks/useToast';
import { claimChristmasTheme } from '../services/userService';
import { hasChristmasThemeBadge, hasChristmasThemeUnlocked, isChristmasPromoActive } from '../utils/christmasTheme';

const REWARDS = [
  {
    id: 'christmas',
    name: 'Tema Navidad 2026',
    seasonalBadge: 'Edición Navidad 2026',
    previewCaption: 'Invierno Glass · Nieve',
    description: 'Azul noche invernal y cristal helado con nieve sutil y acento rojo navideño. Desbloquéalo directamente antes del 6 de enero y quédatelo para siempre (después, invitando a 1 amigo).',
    requiredReferrals: 1,
    icon: Snowflake,
    accentHex: '#e11d48',
    captionColorClass: 'text-[#e11d48] dark:text-[#fda4af]',
    variants: [{ id: 'christmas', label: 'Usar', testLabel: 'Probar 10s' }],
  },
  {
    id: 'galaxy',
    name: 'Tema Galaxia',
    previewCaption: 'Liquid Glass · Estelar',
    description: 'Un viaje al espacio con tonos púrpuras oscuros y fondo estelar inmersivo.',
    requiredReferrals: 3,
    icon: FaMeteor,
    accentHex: '#a855f7',
    captionColorClass: 'text-[#6d28d9] dark:text-[#d8b4fe]',
    variants: [{ id: 'galaxy', label: 'Usar tema', testLabel: 'Probar 10s' }],
  },
  {
    id: 'desert',
    name: 'Tema Desierto',
    previewCaption: 'Liquid Glass · Dunas (Claro / Oscuro)',
    description: 'Tonos cálidos de arena y atardecer con dunas del desierto en modo claro u oscuro.',
    requiredReferrals: 5,
    icon: FaSun,
    accentHex: '#f59e0b',
    captionColorClass: 'text-[#b45309] dark:text-[#fde68a]',
    imageUrl: '/assets/themes/desert.jpg',
    variants: [
      { id: 'desert', label: 'Claro', testLabel: 'Probar Claro' },
      { id: 'desert-dark', label: 'Oscuro', testLabel: 'Probar Oscuro' },
    ],
  },
  {
    id: 'ocean',
    name: 'Tema Océano',
    previewCaption: 'Liquid Glass · Océano (Claro / Oscuro)',
    description: 'Tonos profundos de agua y azules vibrantes con fondo de playa en claro u oscuro.',
    requiredReferrals: 7,
    icon: FaUmbrellaBeach,
    accentHex: '#0ea5e9',
    captionColorClass: 'text-[#0369a1] dark:text-[#bae6fd]',
    imageUrl: '/assets/themes/ocean.jpg',
    variants: [
      { id: 'ocean', label: 'Claro', testLabel: 'Probar Claro' },
      { id: 'ocean-dark', label: 'Oscuro', testLabel: 'Probar Oscuro' },
    ],
  },
];

const isIOSWeb = () => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export default function RewardsModal({ isOpen, onClose }) {
  useModalLock(isOpen);

  const userProfile = useAppStore((state) => state.userProfile);
  const unlockedBadges = useAppStore((state) => state.gamification?.unlockedBadges || []);
  const applyUnlockedBadges = useAppStore((state) => state.applyUnlockedBadges);
  const applyChristmasRewardResult = useAppStore((state) => state.applyChristmasRewardResult);
  const openChristmasUnlockModal = useAppStore((state) => state.openChristmasUnlockModal);
  const { addToast } = useToast();
  const { theme, activeTheme, setTheme, startThemeTest, isTestingTheme, testTimeLeft } = useAppTheme();
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [claimingChristmas, setClaimingChristmas] = useState(false);
  const dragStartYRef = useRef(null);
  const didDragRef = useRef(false);

  if (!isOpen) return null;

  const referralCount = userProfile?.referralCount || 0;
  const isAdmin = userProfile?.role === 'admin';
  const isChristmasPromoOpen = isChristmasPromoActive();
  const baseShareUrl = Capacitor.isNativePlatform()
    ? (import.meta.env.VITE_WEB_URL || 'https://profitnessglass.es')
    : (typeof window !== 'undefined' ? window.location.origin : 'https://profitnessglass.es');
  const referralLink = `${baseShareUrl}/register?ref=${userProfile?.referral_code || ''}`;

  const nextReward = REWARDS.find((r) => r.id !== 'christmas' && referralCount < r.requiredReferrals);

  const handleClaimChristmas = async () => {
    if (claimingChristmas) return;
    setClaimingChristmas(true);
    try {
      const res = await claimChristmasTheme();
      if (applyChristmasRewardResult) {
        applyChristmasRewardResult(res);
      } else if (Array.isArray(res?.unlocked_badges)) {
        applyUnlockedBadges?.(res.unlocked_badges);
      }
      setTheme('christmas', false);
      if (res?.xpAdded > 0) {
        addToast(`🎄 +${res.xpAdded} XP añadidos a tu cuenta por Edición Navidad 2026`, 'success');
        if (res?.leveledUp && res?.level) {
          addToast(`🎉 ¡Has subido al Nivel ${res.level}!`, 'success');
        }
      }
      onClose();
      openChristmasUnlockModal?.({ xpAdded: res?.xpAdded ?? 0 });
    } catch (err) {
      addToast(err?.message || 'No se pudo reclamar el tema.', 'error');
    } finally {
      setClaimingChristmas(false);
    }
  };

  const handleApplyTheme = (themeId) => {
    if (
      themeId === 'christmas' &&
      (!hasChristmasThemeBadge(userProfile, unlockedBadges) ||
        userProfile?.christmasXpBonusClaimed === false)
    ) {
      void handleClaimChristmas();
      return;
    }
    setTheme(themeId, false);
    onClose();
  };

  const handleTestTheme = (themeId) => {
    if (isTestingTheme) return;
    startThemeTest(themeId, 10, isIOSWeb());
    addToast('Probando tema en vivo durante 10 segundos', 'info');
  };

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
        // Fallback a portapapeles si el usuario cancela o no está disponible
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

  const handleTouchStart = (e) => {
    dragStartYRef.current = e.touches?.[0]?.clientY ?? null;
    didDragRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (dragStartYRef.current === null) return;
    const delta = (e.touches?.[0]?.clientY ?? dragStartYRef.current) - dragStartYRef.current;
    if (delta > 6) {
      didDragRef.current = true;
      setDragOffsetY(delta);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffsetY > 75) {
      setDragOffsetY(0);
      dragStartYRef.current = null;
      onClose();
      return;
    }
    setDragOffsetY(0);
    dragStartYRef.current = null;
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 !pt-[calc(0.75rem+var(--safe-top,0px))]">
        <div
          className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div
          style={dragOffsetY > 0 ? { transform: `translateY(${dragOffsetY}px)`, transition: 'none' } : undefined}
          className="relative mt-auto sm:mt-0 w-full max-w-lg max-h-[90dvh] sm:max-h-[88vh] flex flex-col bg-bg-secondary border-t sm:border border-glass-border rounded-t-[32px] rounded-b-none sm:rounded-[30px] shadow-2xl px-5 pt-2.5 pb-[calc(1rem+var(--safe-bottom,env(safe-area-inset-bottom,0px)))] sm:p-7 animate-[slide-up_0.28s_cubic-bezier(0.32,0.72,0,1)] sm:animate-[scale-in_0.2s_ease-out] overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-accent/20 blur-[55px] rounded-full pointer-events-none" />

          {/* Barra gris superior (drag handle) en móvil para deslizar o pulsar y cerrar */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => {
              if (!didDragRef.current) onClose();
            }}
            role="button"
            tabIndex={0}
            aria-label="Deslizar hacia abajo o pulsar para cerrar"
            className="w-full py-2 -mt-1 mb-2 flex items-center justify-center sm:hidden cursor-grab active:cursor-grabbing shrink-0 relative z-20 touch-none"
          >
            <div className="w-12 h-1.5 rounded-full bg-black/20 dark:bg-white/25" />
          </div>

          {/* Header */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex justify-between items-center gap-3 mb-4 relative z-10 shrink-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                <FaGift size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary leading-tight">Recompensas</h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-black uppercase tracking-wider">
                    <FaBolt size={10} /> +1.000 XP para ambos
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
            >
              <FaXmark size={16} />
            </button>
          </div>

          <div className="overflow-y-auto hide-scrollbar space-y-4 pr-0.5 flex-1 relative z-10">
            <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">
              Cada amigo que se registre con tu enlace os suma <strong className="text-text-primary">+1.000 XP a los dos</strong> al instante y desbloquea estos temas inmersivos Liquid Glass.
            </p>

            {/* Contador de Invitados */}
            <div className="flex items-center justify-between gap-3 bg-black/5 dark:bg-white/5 p-4 rounded-[20px] border border-black/5 dark:border-white/10">
              <div>
                <p className="text-[10px] text-text-muted font-extrabold uppercase tracking-wider mb-1">Amigos invitados</p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-black text-text-primary">{referralCount}</span>
                  {isAdmin ? (
                    <span className="text-xs text-accent font-bold">Acceso Admin</span>
                  ) : nextReward ? (
                    <span className="text-xs text-text-secondary font-semibold">
                      · Faltan {nextReward.requiredReferrals - referralCount} para {nextReward.name.replace('Tema ', '')}
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-500 font-bold">· Todos desbloqueados</span>
                  )}
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                <FaTrophy size={20} />
              </div>
            </div>

            {/* Tarjetas de temas con vistas previas reales */}
            <div className="space-y-3.5 pb-1">
              {REWARDS.map((reward) => {
                const isChristmas = reward.id === 'christmas';
                const isUnlocked = isChristmas
                  ? hasChristmasThemeUnlocked(userProfile, unlockedBadges)
                  : isAdmin || referralCount >= reward.requiredReferrals;
                const isGroupActive = reward.variants.some((v) => v.id === activeTheme);
                const RewardIcon = reward.icon;
                const remaining = Math.max(0, reward.requiredReferrals - referralCount);
                const progressPct = Math.min(100, Math.round((referralCount / reward.requiredReferrals) * 100));

                return (
                  <div
                    key={reward.id}
                    className={`p-4 rounded-[22px] border transition-all duration-300 ${
                      isGroupActive
                        ? 'bg-accent/10 border-accent/35 shadow-md'
                        : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10'
                    }`}
                  >
                    {/* Preview real despejado */}
                    <div
                      className="relative h-28 sm:h-32 rounded-2xl overflow-hidden mb-3 ring-1 ring-white/15"
                      style={
                        reward.imageUrl
                          ? undefined
                          : isChristmas
                            ? {
                                background:
                                  'radial-gradient(circle at 20% 25%, rgba(16, 185, 129, 0.35), transparent 55%), radial-gradient(circle at 82% 28%, rgba(225, 29, 72, 0.42), transparent 55%), radial-gradient(circle at 55% 85%, rgba(56, 189, 248, 0.25), transparent 55%), linear-gradient(135deg, #06101a 0%, #0b2434 52%, #190d1a 100%)',
                              }
                            : {
                                background:
                                  'radial-gradient(circle at 20% 25%, rgba(168,85,247,0.45), transparent 55%), radial-gradient(circle at 80% 75%, rgba(59,130,246,0.35), transparent 55%), linear-gradient(135deg, #070314 0%, #1d0b3b 50%, #090d26 100%)',
                              }
                      }
                    >
                      {reward.imageUrl ? (
                        <>
                          <img
                            src={reward.imageUrl}
                            alt={`Vista previa ${reward.name}`}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/15" />
                        </>
                      ) : isChristmas ? (
                        <>
                          <Snowflake size={14} className="absolute top-3 left-7 text-white/75" />
                          <Snowflake size={11} className="absolute top-8 left-1/3 text-sky-200/80" />
                          <Snowflake size={13} className="absolute bottom-6 left-16 text-amber-100/75" />
                          <Snowflake size={15} className="absolute bottom-4 right-12 text-white/80" />
                        </>
                      ) : (
                        <>
                          <div className="absolute top-3 left-6 w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_8px_#fff]" />
                          <div className="absolute top-6 right-12 w-1 h-1 rounded-full bg-purple-200/90 shadow-[0_0_6px_#a855f7]" />
                          <div className="absolute bottom-6 left-1/2 w-1.5 h-1.5 rounded-full bg-sky-200/90 shadow-[0_0_8px_#38bdf8]" />
                        </>
                      )}

                      {reward.seasonalBadge && (
                        <span className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e11d48]/90 backdrop-blur-md text-[10px] font-black text-white border border-white/25">
                          <Sparkles size={9} /> {reward.seasonalBadge}
                        </span>
                      )}

                      <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-md text-[10px] font-extrabold text-white border border-white/15">
                        {isUnlocked ? (
                          <FaLockOpen size={9} className="text-emerald-400" />
                        ) : (
                          <FaLock size={9} className={isChristmas && isChristmasPromoOpen ? 'text-amber-300' : 'text-white/80'} />
                        )}
                        {isUnlocked ? 'Desbloqueado' : isChristmas && isChristmasPromoOpen ? 'Hasta el 6 ene' : `${referralCount}/${reward.requiredReferrals}`}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm sm:text-base text-text-primary antialiased">{reward.name}</h3>
                        <p className={`text-[11px] font-bold flex items-center gap-1.5 mt-0.5 antialiased ${reward.captionColorClass}`}>
                          <RewardIcon size={10} />
                          <span>{reward.previewCaption}</span>
                        </p>
                      </div>
                      {!isUnlocked && !(isChristmas && isChristmasPromoOpen) && (
                        <span className="text-[11px] font-bold text-text-muted shrink-0">
                          Faltan {remaining}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed mb-3">
                      {reward.description}
                    </p>

                    {!isUnlocked && !(isChristmas && isChristmasPromoOpen) && (
                      <div className="mb-3 w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%`, backgroundColor: reward.accentHex }}
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {isUnlocked
                        ? reward.variants.map((v) => {
                            const isVariantActive = theme === v.id;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => handleApplyTheme(v.id)}
                                disabled={isVariantActive}
                                className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl font-bold text-xs transition-all inline-flex items-center justify-center gap-1.5 ${
                                  isVariantActive
                                    ? 'bg-accent text-accent-contrast shadow-md cursor-default'
                                    : 'bg-black/5 dark:bg-white/10 text-text-primary hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer'
                                }`}
                              >
                                {isVariantActive && <FaCheck size={11} />}
                                <span>{isVariantActive ? 'Tema activo' : v.label}</span>
                              </button>
                            );
                          })
                        : (
                          <>
                            {reward.variants.map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => handleTestTheme(v.id)}
                                disabled={isTestingTheme}
                                className="flex-1 min-w-[110px] py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-75"
                                style={{
                                  backgroundColor: `${reward.accentHex}24`,
                                  color: reward.accentHex,
                                }}
                              >
                                {isTestingTheme ? `Probando ${testTimeLeft}s` : v.testLabel}
                              </button>
                            ))}
                            {isChristmas && isChristmasPromoOpen && (
                              <button
                                type="button"
                                onClick={handleClaimChristmas}
                                disabled={claimingChristmas}
                                className="flex-1 min-w-[140px] py-2 px-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#e11d48] to-[#f59e0b] hover:brightness-110 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-70"
                              >
                                <FaGift size={11} />
                                <span>{claimingChristmas ? 'Desbloqueando...' : 'Desbloquear'}</span>
                              </button>
                            )}
                          </>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Barra fija inferior de Compartir */}
          <div className="pt-3.5 mt-3 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center gap-2 relative z-10 shrink-0">
            <button
              type="button"
              onClick={handleShareReferral}
              className="flex-1 min-w-[190px] py-3 px-4 rounded-2xl bg-accent text-accent-contrast font-extrabold text-xs sm:text-sm shadow-lg shadow-accent/25 hover:brightness-110 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <FaShareNodes size={14} />
              <span>Compartir enlace (+1.000 XP)</span>
            </button>
            <button
              type="button"
              onClick={handleCopyReferral}
              className="py-3 px-4 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-text-primary font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <FaCopy size={13} />
              <span>Copiar</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}