/* frontend/src/components/WelcomeModal.jsx */
import React from 'react';
import ModalPortal from './ModalPortal';
import {
  ChevronRight, Newspaper, Calculator, Dumbbell, Zap, Sparkles, RefreshCw } from
'lucide-react';

const isNewerVersion = (current, remote) => {
  if (!current || !remote) return false;
  const cParts = String(current).split('.').map(Number);
  const rParts = String(remote).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((rParts[i] || 0) > (cParts[i] || 0)) return true;
    if ((rParts[i] || 0) < (cParts[i] || 0)) return false;
  }
  return false;
};
import { FaMeteor } from 'react-icons/fa6';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION } from '../config/version';
import useModalLock from '../hooks/useModalLock';
import useAppStore from '../store/useAppStore';

const WelcomeModal = ({ onClose }) => {

  // --- Bloquear scroll del fondo y swipe entre páginas ---
  useModalLock();

  const [isUpdating, setIsUpdating] = React.useState(false);
  const userProfile = useAppStore((state) => state.userProfile);
  const welcomeRemoteVersion = useAppStore((state) => state.welcomeRemoteVersion);
  const welcomeRemoteData = useAppStore((state) => state.welcomeRemoteData);

  const effectiveVersion = welcomeRemoteVersion || APP_VERSION;
  const appVersion = `v${effectiveVersion}`;
  const welcomeTitle = welcomeRemoteData?.welcome?.title || 'Noticias y Herramientas';
  const welcomeSubtitle =
    welcomeRemoteData?.welcome?.subtitle ||
    'Estrenamos el portal de Noticias Fitness, calculadoras deportivas, enciclopedia visual de ejercicios y velocidad instantánea en toda la app.';
  const remoteFeatures = welcomeRemoteData?.welcome?.features;

  const handleGetStarted = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (isUpdating) return;

    try {
      localStorage.setItem('lastSeenVersion', effectiveVersion);
      localStorage.setItem('pfg_app_version', effectiveVersion);
      localStorage.setItem('pfg_cache_version', effectiveVersion);
      localStorage.removeItem('pfg_crash_loop_count');
      sessionStorage.removeItem('pfg_last_safe_reload_time');
      sessionStorage.removeItem('pfg_reload_count');
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('pfg_chunk_retry_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (err) {
      console.warn('[WelcomeModal] Error guardando estado de versión:', err);
    }

    // Solo recargar si verdaderamente hay una versión remota MÁS NUEVA que la que corre en memoria
    const needsReload = Boolean(
      welcomeRemoteVersion &&
      isNewerVersion(APP_VERSION, welcomeRemoteVersion) &&
      typeof window !== 'undefined' &&
      !Capacitor.isNativePlatform()
    );

    if (!needsReload) {
      // Si ya tenemos la versión actual o no hay actualización remota pendiente,
      // cerramos el modal al instante SIN recargar ni congelar la pantalla.
      if (onClose) {
        onClose();
      }
      return;
    }

    // Si realmente hay una nueva versión remota pendiente de activar:
    setIsUpdating(true);
    sessionStorage.setItem('pfg_auto_reloaded_version', welcomeRemoteVersion);

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await Promise.race([
          navigator.serviceWorker.getRegistration(),
          new Promise((resolve) => setTimeout(() => resolve(null), 800)),
        ]);

        if (registration?.waiting) {
          const controllerChanged = new Promise((resolve) => {
            let timeoutId;
            const finish = () => {
              clearTimeout(timeoutId);
              navigator.serviceWorker.removeEventListener('controllerchange', finish);
              resolve();
            };
            navigator.serviceWorker.addEventListener('controllerchange', finish, { once: true });
            timeoutId = setTimeout(finish, 1500);
          });

          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          await controllerChanged;
        }
      } catch (err) {
        console.warn('[WelcomeModal] Error activando nuevo service worker:', err);
      }
    }

    if (onClose) {
      onClose();
    }
    window.location.reload();
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
          color: var(--btn-accent-text, #fff);
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
      <ModalPortal disableSwipeToClose={true}><div
          className="wm-backdrop fixed inset-0"
          style={{
            zIndex: 150,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
            paddingTop: 'calc(16px + var(--safe-top, env(safe-area-inset-top, 0px)))',
            paddingBottom: 'calc(16px + var(--safe-bottom, env(safe-area-inset-bottom, 0px)))',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
          onClick={handleGetStarted}
        >
        {/* Modal Container */}
        <div
            className="wm-card"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '380px',
              maxHeight: '100%',
              background: 'var(--bg-primary)',
              borderRadius: '32px',
              boxShadow: '0 24px 64px -12px rgba(0,0,0,0.4)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >

          {/* Glow / Light effect top */}
          <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: '200px', height: '100px',
              background: 'var(--color-accent)',
              opacity: 0.15,
              filter: 'blur(40px)',
              pointerEvents: 'none',
              zIndex: 0
            }} />

          {/* Scrollable Body */}
          <div style={{
              padding: '32px 24px 24px',
              overflowY: 'auto',
              flex: 1,
              position: 'relative',
              zIndex: 1
            }}
            className="hide-scrollbar"
          >

            {/*  Header Section  */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              
              {/* Icon / Avatar with spinning ring */}
              <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 20px' }}>
                <div className="wm-spin-ring" style={{
                    position: 'absolute', inset: -6,
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, transparent 0%, transparent 40%, var(--color-accent) 80%, transparent 100%)',
                    maskImage: 'radial-gradient(transparent 65%, black 66%)',
                    WebkitMaskImage: 'radial-gradient(transparent 65%, black 66%)'
                  }} />
                <div className="wm-glow-orb" style={{
                    position: 'absolute', inset: 0,
                    borderRadius: '50%',
                    background: 'var(--color-accent)',
                    filter: 'blur(12px)',
                  }} />
                <div style={{
                    position: 'relative', width: '100%', height: '100%',
                    background: 'var(--bg-secondary)',
                    borderRadius: '50%',
                    border: '2px solid var(--glass-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                  <FaMeteor size={32} style={{ color: 'var(--text-primary)' }} />
                  <span style={{
                      position: 'absolute', bottom: '-4px',
                      fontSize: '10px', fontWeight: 900,
                      background: 'var(--text-primary)', color: 'var(--bg-primary)',
                      padding: '2px 6px', borderRadius: '6px',
                      letterSpacing: '0.05em',
                      lineHeight: 1
                    }}>v{effectiveVersion}</span>
                </div>

                {/* Badge */}
                <div className="wm-badge" style={{
                    position: 'absolute', top: '-10px', right: '-22px',
                    background: 'var(--color-accent)',
                    color: 'var(--btn-accent-text, #fff)',
                    fontSize: '9px', fontWeight: 900,
                    letterSpacing: '0.15em',
                    padding: '4px 10px',
                    borderRadius: '99px',
                    boxShadow: '0 4px 16px -2px color-mix(in srgb, var(--color-accent) 60%, transparent)',
                    whiteSpace: 'nowrap'
                  }}>NOVEDADES V{effectiveVersion}</div>
              </div>

              {/* Title */}
              <h1 className="wm-shimmer" style={{
                  fontSize: '26px', fontWeight: 900,
                  margin: '0 0 10px',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.15
                }}>
                {welcomeTitle}
              </h1>

              <p style={{
                  fontSize: '13.5px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.65,
                  margin: 0,
                  maxWidth: '320px',
                  marginInline: 'auto'
                }}>
                {welcomeSubtitle}
              </p>
            </div>

            {/*  Divider  */}
            <div className="wm-divider" style={{ marginBottom: '20px' }} />

            {/*  Feature Cards  */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>

              {/* 01: Portal de Noticias Fitness */}
              <div className="wm-feature-card wm-feature-1" style={{
                  background: 'linear-gradient(135deg, #080814 0%, #121226 100%)',
                  border: '1px solid rgba(168,85,247,0.35)',
                  boxShadow: '0 4px 20px -8px rgba(168,85,247,0.3)'
                }}>
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
                  <Newspaper size={18} style={{ color: '#a855f7' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#a855f7', margin: '0 0 4px', textTransform: 'uppercase' }}>{remoteFeatures?.[0]?.title || 'Portal de Noticias y Ciencia Fitness'}</p>
                  <p style={{ fontSize: '13px', color: 'rgba(203,213,225,0.9)', margin: 0, lineHeight: 1.55 }}>
                    {remoteFeatures?.[0]?.description || 'Descubre artículos actualizados sobre hipertrofia, nutrición, suplementación y salud con modo de lectura adaptable y artículos recomendados.'}
                  </p>
                </div>
                <span className="wm-num" style={{ color: '#a855f7' }}>01</span>
              </div>

              {/* 02: Calculadoras y Enciclopedia */}
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
                disabled={isUpdating}
                style={isUpdating ? { opacity: 0.8, cursor: 'wait' } : undefined}
              >
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {isUpdating ? 'ACTUALIZANDO...' : 'DESCUBRIR NOVEDADES'}
                </span>
                {isUpdating ? (
                  <RefreshCw size={18} className="animate-spin" style={{ position: 'relative', zIndex: 1 }} />
                ) : (
                  <ChevronRight size={18} strokeWidth={2.5} style={{ position: 'relative', zIndex: 1 }} />
                )}
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



