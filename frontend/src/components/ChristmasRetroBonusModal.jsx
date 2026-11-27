import React, { useState } from 'react';
import { Gift, Snowflake, Sparkles, X, Zap } from 'lucide-react';
import ModalPortal from './ModalPortal';
import useModalLock from '../hooks/useModalLock';
import useAppStore from '../store/useAppStore';
import { claimChristmasXpBonus } from '../services/userService';
import { useToast } from '../hooks/useToast';
import { useAppTheme } from '../hooks/useAppTheme';

const BONUS_FLAKES = Array.from({ length: 12 }).map((_, i) => ({
  id: `bonus-flake-${i}`,
  left: `${(i * 21 + 6) % 92}%`,
  size: 10 + (i % 3) * 3,
  duration: `${5.8 + (i % 4) * 1.6}s`,
  delay: `-${(i * 0.85).toFixed(1)}s`,
  opacity: 0.22 + (i % 3) * 0.14,
  frost: i % 2 === 0,
}));

export default function ChristmasRetroBonusModal() {
  const userProfile = useAppStore((state) => state.userProfile);
  const showChristmasUnlockModal = useAppStore((state) => Boolean(state.showChristmasUnlockModal));
  const applyChristmasRewardResult = useAppStore((state) => state.applyChristmasRewardResult);
  const { addToast } = useToast();
  const { theme, activeTheme } = useAppTheme();

  const [claiming, setClaiming] = useState(false);

  const hasLocalChristmasActive = theme === 'christmas' || activeTheme === 'christmas';
  const isOpen = Boolean(
    !showChristmasUnlockModal &&
      userProfile?.id &&
      (userProfile.christmasXpBonusPending ||
        (hasLocalChristmasActive && userProfile.christmasXpBonusClaimed === false))
  );
  const bonusAmount = Number(userProfile?.christmasXpBonusAmount || 250);

  useModalLock(isOpen);

  if (!isOpen) return null;

  const handleClaimBonus = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const res = await claimChristmasXpBonus();
      applyChristmasRewardResult?.(res);
      if (res?.xpAdded > 0) {
        addToast(`🎄 +${res.xpAdded} XP sumados a tu cuenta por Edición Navidad 2026`, 'success');
        if (res.leveledUp && res.level) {
          addToast(`⚡ ¡Has subido al Nivel ${res.level}!`, 'success');
        }
      } else {
        addToast(res?.message || 'Regalo de XP ya acreditado en tu cuenta', 'info');
      }
    } catch (err) {
      addToast(err?.message || 'No se pudo reclamar el regalo de XP', 'error');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <ModalPortal>
      <style>{`
        @keyframes pfgRetroBonusSnow {
          0% { transform: translate3d(0, -24px, 0) rotate(0deg); opacity: 0; }
          15% { opacity: var(--flake-opacity, 0.4); }
          50% { transform: translate3d(-10px, 200px, 0) rotate(180deg); }
          85% { opacity: var(--flake-opacity, 0.4); }
          100% { transform: translate3d(10px, 430px, 0) rotate(360deg); opacity: 0; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#030a12]/80 backdrop-blur-md animate-[fade-in_0.25s_ease-out]"
        onClick={handleClaimBonus}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="christmas-retro-bonus-title"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md mt-auto sm:mt-0 rounded-t-[32px] rounded-b-none sm:rounded-[32px] p-6 sm:p-8 pb-[calc(1.75rem+var(--safe-bottom))] sm:pb-8 text-center text-white shadow-2xl border border-sky-200/20 overflow-hidden animate-[slide-up_0.3s_ease-out] sm:animate-[scale-in_0.28s_ease-out]"
          style={{
            background:
              'radial-gradient(circle at 18% 12%, rgba(16, 185, 129, 0.22), transparent 52%), radial-gradient(circle at 86% 18%, rgba(225, 29, 72, 0.24), transparent 52%), radial-gradient(circle at 50% 92%, rgba(56, 189, 248, 0.16), transparent 55%), linear-gradient(160deg, rgba(7, 19, 30, 0.98) 0%, rgba(10, 29, 43, 0.98) 58%, rgba(24, 12, 23, 0.97) 100%)',
          }}
        >
          {/* Copos sutiles dentro de la tarjeta */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {BONUS_FLAKES.map((flake) => (
              <div
                key={flake.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: flake.left,
                  '--flake-opacity': flake.opacity,
                  animation: `pfgRetroBonusSnow ${flake.duration} linear ${flake.delay} infinite`,
                }}
              >
                <Snowflake
                  size={flake.size}
                  className={flake.frost ? 'text-sky-200' : 'text-white'}
                  strokeWidth={1.7}
                />
              </div>
            ))}
          </div>

          {/* Drag handle en móvil */}
          <button
            type="button"
            onClick={handleClaimBonus}
            aria-label="Recibir regalo y cerrar"
            className="w-full py-1.5 -mt-2 mb-3 flex justify-center sm:hidden cursor-pointer relative z-20"
          >
            <span className="w-12 h-1.5 bg-white/30 rounded-full block" />
          </button>

          <button
            type="button"
            onClick={handleClaimBonus}
            aria-label="Cerrar"
            className="hidden sm:flex absolute right-4 top-4 z-20 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="relative z-10 flex justify-center mb-4">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-[24px] bg-gradient-to-br from-[#e11d48]/30 via-sky-400/20 to-amber-400/25 border border-white/25 shadow-[0_10px_30px_rgba(225,29,72,0.32)]">
              <Gift size={38} className="text-white drop-shadow-[0_2px_10px_rgba(253,164,175,0.65)]" strokeWidth={1.8} />
              <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shadow-lg">
                +{bonusAmount} XP
              </span>
            </div>
          </div>

          <div className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e11d48]/25 border border-[#fda4af]/35 text-[11px] font-black uppercase tracking-wider text-[#ffe4e6] mb-3">
            <Sparkles size={11} className="text-[#fbbf24]" />
            <span>Regalo Retroactivo</span>
          </div>

          <h2
            id="christmas-retro-bonus-title"
            className="relative z-10 text-2xl font-black tracking-tight leading-tight mb-2.5 bg-gradient-to-r from-white via-sky-100 to-amber-200 bg-clip-text text-transparent"
          >
            ¡+{bonusAmount} XP de Navidad para ti!
          </h2>

          <p className="relative z-10 text-sm text-slate-200/90 leading-relaxed mb-5">
            Como ya habías desbloqueado el tema <strong className="text-white">Edición Navidad 2026</strong> antes de esta actualización, te regalamos <strong className="text-amber-300">+{bonusAmount} XP</strong> por haberlo conseguido.
          </p>

          <div className="relative z-10 flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/[0.07] border border-white/15 mb-5 text-xs font-bold text-amber-200">
            <Zap size={16} className="text-amber-300 shrink-0" />
            <span>Se sumarán al instante a tu cuenta y nivel actual</span>
          </div>

          <button
            type="button"
            onClick={handleClaimBonus}
            disabled={claiming}
            className="relative z-10 w-full py-3.5 px-5 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#f59e0b] shadow-[0_10px_28px_rgba(225,29,72,0.4)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-65"
          >
            {claiming ? 'Sumando XP...' : `Recibir +${bonusAmount} XP`}
          </button>
        </section>
      </div>
    </ModalPortal>
  );
}
