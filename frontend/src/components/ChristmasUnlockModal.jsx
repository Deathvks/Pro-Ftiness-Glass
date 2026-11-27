import React from 'react';
import { Gift, LockOpen, Palette, Snowflake, Sparkles, X } from 'lucide-react';
import ModalPortal from './ModalPortal';
import useModalLock from '../hooks/useModalLock';
import useAppStore from '../store/useAppStore';

const BACKDROP_FLAKES = Array.from({ length: 18 }).map((_, i) => ({
  id: `bg-${i}`,
  left: `${(i * 19 + 5) % 94}%`,
  size: 12 + (i % 4) * 4,
  duration: `${7 + (i % 5) * 2}s`,
  delay: `-${(i * 1.3).toFixed(1)}s`,
  opacity: 0.25 + (i % 4) * 0.14,
  frost: i % 2 === 0,
}));

const CARD_FLAKES = Array.from({ length: 14 }).map((_, i) => ({
  id: `card-${i}`,
  left: `${(i * 23 + 7) % 92}%`,
  size: 10 + (i % 3) * 3,
  duration: `${5.5 + (i % 4) * 1.7}s`,
  delay: `-${(i * 0.9).toFixed(1)}s`,
  opacity: 0.22 + (i % 3) * 0.14,
  frost: i % 3 === 0,
}));

export default function ChristmasUnlockModal() {
  const isOpen = useAppStore((state) => Boolean(state.showChristmasUnlockModal));
  const onClose = useAppStore((state) => state.closeChristmasUnlockModal);

  useModalLock(isOpen);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <style>{`
        @keyframes pfgModalSnowFall {
          0% {
            transform: translate3d(0, -32px, 0) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: var(--flake-opacity, 0.55);
          }
          50% {
            transform: translate3d(16px, 50vh, 0) rotate(180deg);
          }
          88% {
            opacity: var(--flake-opacity, 0.55);
          }
          100% {
            transform: translate3d(-12px, 105vh, 0) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes pfgCardSnowFall {
          0% {
            transform: translate3d(0, -24px, 0) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: var(--flake-opacity, 0.45);
          }
          50% {
            transform: translate3d(-12px, 210px, 0) rotate(180deg);
          }
          85% {
            opacity: var(--flake-opacity, 0.45);
          }
          100% {
            transform: translate3d(10px, 440px, 0) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-[#030a12]/80 backdrop-blur-md animate-[fade-in_0.25s_ease-out] overflow-hidden"
        onClick={onClose}
      >
        {/* Nieve cayendo por todo el fondo del modal */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {BACKDROP_FLAKES.map((flake) => (
            <div
              key={flake.id}
              style={{
                position: 'absolute',
                top: 0,
                left: flake.left,
                '--flake-opacity': flake.opacity,
                animation: `pfgModalSnowFall ${flake.duration} linear ${flake.delay} infinite`,
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

        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="christmas-unlock-title"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-[32px] p-6 sm:p-8 text-center text-white shadow-2xl border border-sky-200/20 overflow-hidden animate-[scale-in_0.28s_ease-out]"
          style={{
            background:
              'radial-gradient(circle at 18% 12%, rgba(16, 185, 129, 0.24), transparent 52%), radial-gradient(circle at 86% 18%, rgba(225, 29, 72, 0.26), transparent 52%), radial-gradient(circle at 50% 92%, rgba(56, 189, 248, 0.16), transparent 55%), linear-gradient(160deg, rgba(7, 19, 30, 0.97) 0%, rgba(10, 29, 43, 0.97) 58%, rgba(24, 12, 23, 0.96) 100%)',
          }}
        >
          {/* Copos de nieve cayendo dentro de la tarjeta del modal */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {CARD_FLAKES.map((flake) => (
              <div
                key={flake.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: flake.left,
                  '--flake-opacity': flake.opacity,
                  animation: `pfgCardSnowFall ${flake.duration} linear ${flake.delay} infinite`,
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

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-20 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>

          {/* Emblema central invernal */}
          <div className="relative z-10 flex justify-center mb-5 mt-1">
            <div className="relative flex items-center justify-center w-24 h-24 rounded-[28px] bg-gradient-to-br from-[#e11d48]/30 via-sky-400/20 to-emerald-400/20 border border-white/25 shadow-[0_12px_36px_rgba(225,29,72,0.35)]">
              <div className="absolute -inset-2 rounded-[34px] bg-gradient-to-tr from-[#e11d48]/25 via-sky-300/20 to-emerald-400/20 blur-xl pointer-events-none" />
              <Snowflake size={44} className="relative text-white drop-shadow-[0_2px_10px_rgba(186,230,253,0.75)]" strokeWidth={1.8} />
              <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-[#e11d48] to-[#f59e0b] flex items-center justify-center shadow-lg border border-white/30">
                <Gift size={15} className="text-white" />
              </span>
            </div>
          </div>

          <div className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e11d48]/25 border border-[#fda4af]/35 text-[11px] font-black uppercase tracking-wider text-[#ffe4e6] mb-3">
            <Sparkles size={11} className="text-[#fbbf24]" />
            <span>Edición Navidad 2026</span>
          </div>

          <h2
            id="christmas-unlock-title"
            className="relative z-10 text-2xl sm:text-[26px] font-black tracking-tight leading-tight mb-2.5 bg-gradient-to-r from-white via-sky-100 to-rose-200 bg-clip-text text-transparent"
          >
            ¡Tema Navidad Desbloqueado!
          </h2>

          <p className="relative z-10 text-sm text-slate-200/90 leading-relaxed mb-5">
            Has reclamado <strong className="text-white">Invierno Glass</strong> y desbloqueado la insignia <strong className="text-sky-200">Navidad 2026</strong> antes del 6 de enero. Queda guardado en tu cuenta <strong className="text-[#fda4af]">para siempre</strong>.
          </p>

          <div className="relative z-10 grid grid-cols-3 gap-2 mb-6">
            <div className="p-2.5 rounded-2xl bg-white/[0.07] border border-white/15 flex flex-col items-center gap-1.5">
              <Snowflake size={16} className="text-sky-200" />
              <span className="text-[11px] font-bold text-slate-100 leading-tight">Nieve cristalina</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/[0.07] border border-white/15 flex flex-col items-center gap-1.5">
              <Palette size={16} className="text-[#fb7185]" />
              <span className="text-[11px] font-bold text-slate-100 leading-tight">Rojo Navidad</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/[0.07] border border-white/15 flex flex-col items-center gap-1.5">
              <LockOpen size={16} className="text-emerald-300" />
              <span className="text-[11px] font-bold text-slate-100 leading-tight">Para siempre</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="relative z-10 w-full py-3.5 px-5 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#f59e0b] shadow-[0_10px_28px_rgba(225,29,72,0.4)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            ¡A disfrutarlo!
          </button>
        </section>
      </div>
    </ModalPortal>
  );
}
