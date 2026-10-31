/* frontend/src/components/WelcomeModal.jsx */
import React from 'react';
import ModalPortal from './ModalPortal';
import {
  ChevronRight, Newspaper, Calculator, Dumbbell, Zap, Sparkles
} from 'lucide-react';
import { FaMeteor } from 'react-icons/fa6';
import { APP_VERSION } from '../config/version';
import useModalLock from '../hooks/useModalLock';
import useAppStore from '../store/useAppStore';

const WelcomeModal = ({ onClose }) => {
  // Bloquear scroll del fondo y swipe entre páginas
  useModalLock();

  const userProfile = useAppStore((state) => state.userProfile);
  const welcomeRemoteData = useAppStore((state) => state.welcomeRemoteData);

  const effectiveVersion = APP_VERSION;
  const appVersion = `v${effectiveVersion}`;
  const welcomeTitle = welcomeRemoteData?.welcome?.title || 'Portal de Noticias y Estabilidad';
  const welcomeSubtitle =
    welcomeRemoteData?.welcome?.subtitle ||
    'Estrenamos el portal de Noticias Fitness, calculadoras deportivas, enciclopedia visual de ejercicios y máxima estabilidad en toda la app.';
  const remoteFeatures = welcomeRemoteData?.welcome?.features;

  const handleGetStarted = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();

    try {
      localStorage.setItem('lastSeenVersion', effectiveVersion);
      localStorage.setItem('pfg_app_version', effectiveVersion);
      localStorage.setItem('pfg_cache_version', effectiveVersion);
      localStorage.removeItem('pfg_crash_loop_count');
      sessionStorage.removeItem('pfg_last_safe_reload_time');
      sessionStorage.removeItem('pfg_reload_count');
      sessionStorage.removeItem('pfg_last_chunk_autoreload');
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k?.startsWith('pfg_chunk_retry_') || k?.startsWith('pfg_reload_')) {
          sessionStorage.removeItem(k);
        }
      }
    } catch (err) {
      console.warn('[WelcomeModal] Error guardando estado de versión:', err);
    }

    // Cierre fluido e instantáneo (0ms) sin recargas
    if (onClose) {
      onClose();
    }
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
          70%  { transform: scale(1.08) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .wm-card-in {
          animation: wm-slide-card 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .wm-badge-in {
          animation: wm-badge-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
        }
        .wm-feature-card {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: all 0.25s ease;
          overflow: hidden;
        }
        .wm-feature-card:hover {
          background: rgba(255, 255, 255, 0.07);
          transform: translateY(-2px);
        }
        .wm-accent-line {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3.5px;
          border-radius: 4px 0 0 4px;
        }
        .wm-icon-wrap {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }
        .wm-num {
          flex-shrink: 0;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.05em;
          opacity: 0.35;
          align-self: center;
        }
        .wm-btn-in {
          animation: wm-slide-card 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
        }
        .wm-btn {
          width: 100%;
          padding: 15px 24px;
          border-radius: 18px;
          background: linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 75%, black) 100%);
          color: var(--accent-contrast, #ffffff);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 28px -4px color-mix(in srgb, var(--accent) 45%, transparent);
          transition: all 0.22s ease;
        }
        .wm-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px -4px color-mix(in srgb, var(--accent) 60%, transparent);
          filter: brightness(1.08);
        }
        .wm-btn:active {
          transform: translateY(0) scale(0.985);
        }
      `}</style>

      <ModalPortal><div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.85) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          animation: 'wm-fade-backdrop 0.3s ease forwards',
          paddingTop: 'max(12px, env(safe-area-inset-top, 0px))',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div 
          className="wm-card-in relative w-full max-w-lg rounded-[28px] overflow-hidden"
          style={{
            background: 'var(--bg-card, rgba(15, 23, 42, 0.88))',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
            boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255,255,255,0.06) inset',
            maxHeight: 'min(92vh, 720px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Luz ambiental de fondo */}
          <div 
            style={{
              position: 'absolute',
              top: '-80px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '280px',
              height: '200px',
              background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
              opacity: 0.18,
              filter: 'blur(40px)',
              pointerEvents: 'none',
              borderRadius: '50%',
            }}
          />

          <div style={{ overflowY: 'auto', padding: '24px 20px 20px', flex: 1 }} className="custom-scrollbar">

            {/*  Encabezado con Logo y Nivel  */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}>
                  <img src="/logo.webp" alt="Pro Fitness Glass" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                </div>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)', display: 'block', lineHeight: 1.2 }}>
                    Pro Fitness Glass
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Plataforma Oficial
                  </span>
                </div>
              </div>

              {/* Badge animado de la versión */}
              <div 
                className="wm-badge-in"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 13px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, transparent) 0%, rgba(255,255,255,0.04) 100%)',
                  border: '1px solid color-mix(in srgb, var(--accent) 50%, transparent)',
                  boxShadow: '0 2px 10px color-mix(in srgb, var(--accent) 20%, transparent)',
                }}
              >
                <Sparkles size={11} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
                  {appVersion}
                </span>
              </div>
            </div>

            {/*  Título y Bienvenida  */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h1 style={{
                fontSize: 'clamp(20px, 4.5vw, 24px)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.25,
                margin: '0 0 8px',
                color: 'var(--text-primary)',
              }}>
                {welcomeTitle}
              </h1>
              <p style={{
                fontSize: '13px',
                lineHeight: 1.55,
                color: 'var(--text-secondary)',
                margin: 0,
                maxWidth: '420px',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}>
                {welcomeSubtitle}
              </p>
            </div>

            {/*  Lista de Novedades  */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '22px' }}>

              {/* 01: Portal de Noticias */}
              <div className="wm-feature-card wm-feature-1" style={{ border: '1px solid var(--glass-border)' }}>
                <div className="wm-accent-line" style={{ background: 'linear-gradient(to bottom, #a855f7, #6366f1)' }} />
                <div className="wm-icon-wrap" style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
                  <Newspaper size={18} style={{ color: '#a855f7' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#a855f7', margin: '0 0 4px', textTransform: 'uppercase' }}>{remoteFeatures?.[0]?.title || 'Portal de Noticias y Ciencia Fitness'}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                    {remoteFeatures?.[0]?.description || 'Descubre artículos actualizados sobre hipertrofia, nutrición, suplementación y salud con modo de lectura adaptable y artículos recomendados.'}
                  </p>
                </div>
                <span className="wm-num" style={{ color: '#a855f7' }}>01</span>
              </div>

              {/* 02: Calculadoras 1RM y Macros */}
              <div className="wm-feature-card wm-feature-2" style={{ border: '1px solid var(--glass-border)' }}>
                <div className="wm-accent-line" style={{ background: 'linear-gradient(to bottom, #3b82f6, #06b6d4)' }} />
                <div className="wm-icon-wrap" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
                  <Calculator size={18} style={{ color: '#3b82f6' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#3b82f6', margin: '0 0 4px', textTransform: 'uppercase' }}>{remoteFeatures?.[1]?.title || 'Calculadoras 1RM, Macros y Ejercicios'}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                    {remoteFeatures?.[1]?.description || 'Calcula tu fuerza máxima (1RM), tus calorías y macronutrientes ideales, y explora la enciclopedia completa de ejercicios con vídeo y técnica.'}
                  </p>
                </div>
                <span className="wm-num" style={{ color: '#3b82f6' }}>02</span>
              </div>

              {/* 03: Asesoría y Seguimiento en Inicio */}
              <div className="wm-feature-card wm-feature-3" style={{ border: '1px solid var(--glass-border)' }}>
                <div className="wm-accent-line" style={{ background: 'linear-gradient(to bottom, #f97316, #eab308)' }} />
                <div className="wm-icon-wrap" style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
                  <Dumbbell size={18} style={{ color: '#f97316' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#f97316', margin: '0 0 4px', textTransform: 'uppercase' }}>{remoteFeatures?.[2]?.title || 'Asesorías y Progreso en Dashboard'}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                    {remoteFeatures?.[2]?.description || 'Recibe pautas de entrenamiento y dieta de tu entrenador en el inicio, controla tus series semanales por músculo y chatea en tiempo real.'}
                  </p>
                </div>
                <span className="wm-num" style={{ color: '#f97316' }}>03</span>
              </div>

              {/* 04: Velocidad Instantánea */}
              <div className="wm-feature-card wm-feature-4" style={{ border: '1px solid var(--glass-border)' }}>
                <div className="wm-accent-line" style={{ background: '#10b981' }} />
                <div className="wm-icon-wrap" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <Zap size={18} style={{ color: '#10b981' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#10b981', margin: '0 0 4px', textTransform: 'uppercase' }}>{remoteFeatures?.[3]?.title || 'Apertura Instantánea (0ms)'}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
                    {remoteFeatures?.[3]?.description || 'Noticias, calculadoras, sistema de créditos IA y vistas principales ahora se abren al instante sin tiempos de espera en web y móvil.'}
                  </p>
                </div>
                <span className="wm-num" style={{ color: '#10b981' }}>04</span>
              </div>

            </div>

            {/*  Footer  */}
            <div className="wm-btn-in">
              <button 
                className="wm-btn" 
                onClick={handleGetStarted}
              >
                <span style={{ position: 'relative', zIndex: 1 }}>
                  DESCUBRIR NOVEDADES
                </span>
                <ChevronRight size={18} strokeWidth={2.5} style={{ position: 'relative', zIndex: 1 }} />
              </button>

              <p style={{
                  textAlign: 'center',
                  margin: '14px 0 0',
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase'
                }}>
                Build {appVersion}
              </p>
            </div>

          </div>
        </div>
      </div></ModalPortal>
    </>
  );
};

export default WelcomeModal;
