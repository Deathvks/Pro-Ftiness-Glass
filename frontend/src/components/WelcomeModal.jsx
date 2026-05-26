/* frontend/src/components/WelcomeModal.jsx */
import React, { useEffect, useRef } from 'react';
import {
  ChevronRight, Users, Zap, LineChart
} from 'lucide-react';
import { FaMeteor } from 'react-icons/fa6';
import { APP_VERSION } from '../config/version';

const WelcomeModal = ({ onClose }) => {
  const appVersion = `v${APP_VERSION}`;
  const majorVersion = APP_VERSION.split('.')[0];

  const handleGetStarted = () => {
    if (onClose) onClose();
  };

  return (
    <>
      <style>{`
        @keyframes wm-fade-backdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes wm-slide-card {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes wm-spin-ring {
          to { transform: rotate(360deg); }
        }
        @keyframes wm-pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1);    }
          50%       { opacity: 1;   transform: scale(1.12); }
        }
        @keyframes wm-shimmer-text {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
        @keyframes wm-badge-pop {
          0%   { transform: scale(0.6) rotate(-6deg); opacity: 0; }
          70%  { transform: scale(1.1) rotate(2deg);  opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);  opacity: 1; }
        }
        @keyframes wm-card-in {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0);     }
        }
        @keyframes wm-count-tick {
          from { transform: translateY(6px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }

        .wm-backdrop {
          animation: wm-fade-backdrop 0.35s ease-out both;
        }
        .wm-card {
          animation: wm-slide-card 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both;
        }
        .wm-spin-ring {
          animation: wm-spin-ring 10s linear infinite;
        }
        .wm-glow-orb {
          animation: wm-pulse-glow 3s ease-in-out infinite;
        }
        .wm-badge {
          animation: wm-badge-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.45s both;
        }
        .wm-feature-1 { animation: wm-card-in 0.4s ease-out 0.25s both; }
        .wm-feature-2 { animation: wm-card-in 0.4s ease-out 0.35s both; }
        .wm-feature-3 { animation: wm-card-in 0.4s ease-out 0.45s both; }
        .wm-feature-4 { animation: wm-card-in 0.4s ease-out 0.55s both; }
        .wm-btn-in    { animation: wm-card-in 0.4s ease-out 0.65s both; }

        .wm-shimmer {
          background: linear-gradient(
            120deg,
            var(--text-primary) 0%,
            var(--color-accent) 35%,
            var(--text-primary) 55%,
            var(--color-accent) 80%,
            var(--text-primary) 100%
          );
          background-size: 300% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: wm-shimmer-text 5s linear infinite;
        }

        .wm-feature-card {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 20px;
          border-radius: 20px;
          border: 1px solid transparent;
          background-clip: padding-box;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          overflow: hidden;
        }
        .wm-feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: var(--glass-bg);
          z-index: 0;
        }
        .wm-feature-card:hover {
          transform: translateX(4px);
        }
        .wm-feature-card > * {
          position: relative;
          z-index: 1;
        }

        .wm-accent-line {
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 3px;
          border-radius: 0 3px 3px 0;
        }

        .wm-icon-wrap {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wm-num {
          position: absolute;
          top: 14px;
          right: 16px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          opacity: 0.18;
          font-variant-numeric: tabular-nums;
        }

        .wm-btn {
          width: 100%;
          padding: 16px 24px;
          border-radius: 18px;
          border: none;
          background: var(--color-accent);
          color: #fff;
          font-weight: 800;
          font-size: 15px;
          letter-spacing: 0.06em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
          box-shadow: 0 8px 32px -4px color-mix(in srgb, var(--color-accent) 50%, transparent);
          position: relative;
          overflow: hidden;
        }
        .wm-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
        }
        .wm-btn:hover  { transform: translateY(-2px); filter: brightness(1.08); }
        .wm-btn:active { transform: scale(0.97); }

        .wm-divider {
          height: 1px;
          background: linear-gradient(to right, transparent, var(--glass-border), transparent);
          margin: 4px 0;
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="wm-backdrop"
        style={{
          position: 'fixed', inset: 0, zIndex: 150,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Modal Card */}
        <div
          className="wm-card"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '440px',
            maxHeight: '90vh',
            borderRadius: '28px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-primary)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 40px 80px -10px rgba(0,0,0,0.5), 0 0 0 0.5px var(--glass-border)',
          }}
        >
          {/* Ambient glow layers */}
          <div style={{
            position: 'absolute', top: '-30%', left: '-20%',
            width: '70%', height: '70%',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 20%, transparent), transparent 70%)',
            pointerEvents: 'none', zIndex: 0,
          }} />
          <div style={{
            position: 'absolute', bottom: '-20%', right: '-15%',
            width: '55%', height: '55%',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent 70%)',
            pointerEvents: 'none', zIndex: 0,
          }} />

          {/* Scrollable content */}
          <div style={{
            overflowY: 'auto', padding: '32px 28px 28px',
            display: 'flex', flexDirection: 'column', gap: '0',
            position: 'relative', zIndex: 1,
          }}>

            {/* ── Hero ── */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>

              {/* Version medallion */}
              <div style={{ position: 'relative', display: 'inline-flex', marginBottom: '20px' }}>
                {/* Spinning ring */}
                <svg
                  className="wm-spin-ring"
                  width="104" height="104"
                  style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
                  viewBox="0 0 104 104"
                >
                  <circle cx="52" cy="52" r="48"
                    fill="none"
                    stroke="url(#ring-grad)"
                    strokeWidth="1.5"
                    strokeDasharray="60 240"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.9"/>
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>

                {/* Glow orb */}
                <div className="wm-glow-orb" style={{
                  position: 'absolute', inset: '-8px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 30%, transparent), transparent 70%)',
                  pointerEvents: 'none',
                }} />

                {/* Center medallion */}
                <div style={{
                  width: '80px', height: '80px',
                  borderRadius: '22px',
                  background: 'color-mix(in srgb, var(--color-accent) 12%, var(--bg-secondary))',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 40%, transparent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 20px -4px color-mix(in srgb, var(--color-accent) 30%, transparent)',
                }}>
                  <span style={{
                    fontSize: '32px', fontWeight: 900,
                    color: 'var(--color-accent)',
                    letterSpacing: '-2px',
                    lineHeight: 1,
                  }}>v{majorVersion}</span>
                </div>

                {/* Badge */}
                <div className="wm-badge" style={{
                  position: 'absolute', top: '-10px', right: '-22px',
                  background: 'var(--color-accent)',
                  color: '#fff',
                  fontSize: '9px', fontWeight: 900,
                  letterSpacing: '0.15em',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  boxShadow: '0 4px 16px -2px color-mix(in srgb, var(--color-accent) 60%, transparent)',
                  whiteSpace: 'nowrap',
                }}>NUEVA ERA</div>
              </div>

              {/* Title */}
              <h1 className="wm-shimmer" style={{
                fontSize: '26px', fontWeight: 900,
                margin: '0 0 10px',
                letterSpacing: '-0.5px',
                lineHeight: 1.15,
              }}>
                Potencia & Comunidad
              </h1>

              <p style={{
                fontSize: '13.5px',
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                margin: 0,
                maxWidth: '320px',
                marginInline: 'auto',
              }}>
                Descubre las nuevas herramientas de Pro Fitness Glass: comunidad, recompensas y analíticas avanzadas.
              </p>
            </div>

            {/* ── Divider ── */}
            <div className="wm-divider" style={{ marginBottom: '20px' }} />

            {/* ── Feature Cards ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>

              {/* Galaxia */}
              <div className="wm-feature-card wm-feature-1" style={{
                background: 'linear-gradient(135deg, #080814 0%, #121226 100%)',
                border: '1px solid rgba(168,85,247,0.35)',
                boxShadow: '0 4px 20px -8px rgba(168,85,247,0.3)',
              }}>
                {/* Textura de estrellas de fondo para la capa galáctica */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `
                    radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)),
                    radial-gradient(1.5px 1.5px at 70px 10px, #ffffff, rgba(0,0,0,0)),
                    radial-gradient(1px 1px at 140px 50px, #ffffff, rgba(0,0,0,0)),
                    url('https://www.transparenttextures.com/patterns/stardust.png')
                  `,
                  opacity: 0.4,
                  pointerEvents: 'none',
                  zIndex: 0
                }}></div>
                <div className="wm-accent-line" style={{ background: 'linear-gradient(to bottom, #a855f7, #6366f1)' }} />
                <div className="wm-icon-wrap" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)' }}>
                  <FaMeteor size={18} style={{ color: '#a855f7' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#a855f7', margin: '0 0 4px', textTransform: 'uppercase' }}>Tema Galaxia</p>
                  <p style={{ fontSize: '13px', color: 'rgba(203,213,225,0.9)', margin: 0, lineHeight: 1.55 }}>
                    Desbloquea el nuevo tema estelar animado. ¡Personaliza tu dashboard como nunca antes con cielos estrellados!
                  </p>
                </div>
                <span className="wm-num" style={{ color: '#a855f7' }}>01</span>
              </div>

              {/* Referidos */}
              <div className="wm-feature-card wm-feature-2" style={{ border: '1px solid var(--glass-border)' }}>
                <div className="wm-accent-line" style={{ background: 'var(--color-accent)' }} />
                <div className="wm-icon-wrap" style={{ background: 'var(--color-accent-transparent)', border: '1px solid var(--color-accent-border)' }}>
                  <Users size={18} style={{ color: 'var(--color-accent)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--color-accent)', margin: '0 0 4px', textTransform: 'uppercase' }}>Sistema de Referidos</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                    Invita a 3 amigos nuevos con tu enlace único. Cuando se registren, desbloquearás contenido exclusivo y recompensas especiales.
                  </p>
                </div>
                <span className="wm-num" style={{ color: 'var(--color-accent)' }}>02</span>
              </div>

              {/* Dashboard */}
              <div className="wm-feature-card wm-feature-3" style={{ border: '1px solid var(--glass-border)' }}>
                <div className="wm-accent-line" style={{ background: '#3b82f6' }} />
                <div className="wm-icon-wrap" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <LineChart size={18} style={{ color: '#3b82f6' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#3b82f6', margin: '0 0 4px', textTransform: 'uppercase' }}>Dashboard Insights</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                    Nuevas analíticas personalizadas para entender tu progreso y optimizar tu rendimiento semanal de forma automática.
                  </p>
                </div>
                <span className="wm-num" style={{ color: '#3b82f6' }}>03</span>
              </div>

              {/* Optimización */}
              <div className="wm-feature-card wm-feature-4" style={{ border: '1px solid var(--glass-border)' }}>
                <div className="wm-accent-line" style={{ background: '#f59e0b' }} />
                <div className="wm-icon-wrap" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Zap size={18} style={{ color: '#f59e0b' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#f59e0b', margin: '0 0 4px', textTransform: 'uppercase' }}>Optimización</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                    Hemos mejorado la estabilidad general, corregido errores de sincronización y optimizado los tiempos de carga.
                  </p>
                </div>
                <span className="wm-num" style={{ color: '#f59e0b' }}>04</span>
              </div>

            </div>

            {/* ── Footer ── */}
            <div className="wm-btn-in">
              <button className="wm-btn" onClick={handleGetStarted}>
                <span style={{ position: 'relative', zIndex: 1 }}>DESCUBRIR LA V{majorVersion}</span>
                <ChevronRight size={18} strokeWidth={2.5} style={{ position: 'relative', zIndex: 1 }} />
              </button>

              <p style={{
                textAlign: 'center',
                margin: '14px 0 0',
                fontSize: '10px',
                letterSpacing: '0.15em',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}>
                Build {appVersion}
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default WelcomeModal;