/* frontend/src/components/CookieConsentBanner.jsx */
import React, { useState, useEffect } from 'react';
import { ShieldCheck, SlidersHorizontal, Lock, Mail, BellRing } from 'lucide-react';
import { getPushPreferences } from '../services/notificationService';
import { PUSH_CONSENT_VERSION } from '../config/pushConsent';

const EMAIL_AND_ACCESS_ITEMS = [
  {
    key: 'googleSignIn',
    title: 'Inicio de sesión rápido con Google',
    description: 'Permite cargar Google Identity Services para acceder en un toque.',
    group: 'access',
  },
  {
    key: 'emailActivity',
    title: 'Notificaciones de actividad por correo',
    description: 'Avisos opcionales sobre actividad relevante en tu cuenta y comunidad.',
    group: 'email',
  },
  {
    key: 'emailMarketing',
    title: 'Recordatorios de entrenamiento por correo',
    description: 'Usa tu actividad, rutinas, marcas y comidas registradas para enviarte recordatorios y resumen semanal.',
    group: 'email',
  },
  {
    key: 'emailCoaching',
    title: 'Seguimiento promocional de asesoría por correo',
    description: 'Recordatorios por email sobre asesorías consultadas en el chat.',
    group: 'email',
  },
];

const PUSH_CONSENT_ITEMS = [
  {
    key: 'pushTraining',
    purpose: 'training',
    title: 'Recordatorios de entrenamiento por push',
    description: 'Avisos push a tu hora habitual de entreno, alertas de racha e inactividad.',
  },
  {
    key: 'pushCoaching',
    purpose: 'coaching',
    title: 'Seguimiento de asesoría por push',
    description: 'Recordatorios si queda pendiente tu consulta en el chat de asesoría.',
  },
  {
    key: 'pushNews',
    purpose: 'news',
    title: 'Novedades y promociones por push',
    description: 'Avisos sobre nuevas funciones y novedades en los dispositivos activos.',
  },
];

const hasLocalPushConsent = (consents, purpose) => {
  const entry = consents?.[purpose];
  return Boolean(entry && entry.version === PUSH_CONSENT_VERSION && entry.grantedAt && !entry.withdrawnAt);
};

const buildInitialPreferences = (userProfile, isAuthenticated) => {
  if (!isAuthenticated || !userProfile) {
    return {
      googleSignIn: false,
      emailActivity: false,
      emailMarketing: false,
      emailCoaching: false,
      pushTraining: false,
      pushCoaching: false,
      pushNews: false,
    };
  }
  const consents = userProfile.push_consents || {};
  return {
    googleSignIn: typeof localStorage !== 'undefined' ? localStorage.getItem('cookie_consent') !== 'declined' : true,
    emailActivity: userProfile.email_activity_notifications !== false,
    emailMarketing: Boolean(userProfile.email_marketing_consent),
    emailCoaching: Boolean(userProfile.email_coaching_consent),
    pushTraining: hasLocalPushConsent(consents, 'training'),
    pushCoaching: hasLocalPushConsent(consents, 'coaching'),
    pushNews: hasLocalPushConsent(consents, 'news'),
  };
};

const CookieConsentBanner = ({
  onAccept,
  onDecline,
  onSavePreferences,
  onShowPolicy,
  userProfile = null,
  isAuthenticated = false,
  forceConfig = false,
}) => {
  const [showConfig, setShowConfig] = useState(Boolean(forceConfig));
  const [preferences, setPreferences] = useState(() =>
    buildInitialPreferences(userProfile, isAuthenticated)
  );

  useEffect(() => {
    if (forceConfig) setShowConfig(true);
  }, [forceConfig]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    getPushPreferences()
      .then((prefs) => {
        if (!active || !prefs) return;
        setPreferences((prev) => ({
          ...prev,
          pushTraining: prefs.training === true,
          pushCoaching: prefs.coaching === true,
          pushNews: prefs.news === true,
        }));
      })
      .catch(() => { /* mantener valores del perfil si no hay red */ });
    return () => { active = false; };
  }, [isAuthenticated]);

  const togglePreference = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-3 sm:p-4 pb-24 md:pb-6 animate-[fade-in-up_0.5s_ease-out]">
      <div className="max-w-4xl mx-auto max-h-[82vh] overflow-y-auto custom-scrollbar rounded-2xl shadow-lg border backdrop-blur-glass bg-[--glass-bg] border-[--glass-border] p-4 sm:p-5 md:p-6">
        <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-5 md:gap-8">

          <div className="flex-shrink-0">
            <div className="p-3 bg-accent/10 rounded-full">
              <ShieldCheck size={32} className="text-accent" />
            </div>
          </div>

          <div className="flex-grow text-center md:text-left space-y-2">
            <h3 className="font-bold text-text-primary text-base sm:text-lg">Actualización de privacidad y consentimiento</h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed text-pretty">
              Usamos almacenamiento técnico y preferencias de interfaz (sesión, caché offline, tema y color de acento) para que la app funcione.{' '}
              <strong>Si pulsas «Aceptar todo», también autorizas el inicio rápido con Google y las notificaciones opcionales por correo electrónico y push</strong>{' '}
              (avisos de actividad, recordatorios de entrenamiento, asesoría y novedades).
            </p>
            <p className="text-xs text-text-secondary mt-2">
              Puedes configurar cada apartado por separado, rechazar los opcionales o cambiarlo luego desde <strong>Ajustes</strong>. Consulta nuestra{' '}
              <button
                type="button"
                onClick={() => onShowPolicy('privacy')}
                className="underline hover:text-accent transition font-medium outline-none focus:text-accent cursor-pointer"
              >
                Política de Privacidad
              </button>
              {' '}y nuestra{' '}
              <button
                type="button"
                onClick={() => onShowPolicy('cookies')}
                className="underline hover:text-accent transition font-medium outline-none focus:text-accent cursor-pointer"
              >
                Política de Cookies
              </button>.
            </p>
          </div>

          {!showConfig && (
            <div className="flex-shrink-0 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-2.5 w-full md:w-auto mt-1 md:mt-0">
              <button
                type="button"
                onClick={() => onDecline()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full font-semibold text-text-primary bg-white/5 hover:bg-white/10 border border-glass-border transition text-sm cursor-pointer"
              >
                Rechazar todo
              </button>
              <button
                type="button"
                onClick={() => setShowConfig(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full font-semibold text-text-primary bg-white/5 hover:bg-white/10 border border-glass-border transition text-sm inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal size={15} />
                Configurar
              </button>
              <button
                type="button"
                onClick={() => onAccept()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-accent text-bg-secondary font-semibold transition hover:scale-105 active:scale-95 shadow-lg shadow-accent/20 text-sm cursor-pointer"
              >
                Aceptar todo
              </button>
            </div>
          )}
        </div>

        {showConfig && (
          <div className="mt-5 pt-5 border-t border-glass-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/5 border border-glass-border">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                  <Lock size={14} className="text-accent shrink-0" />
                  <span>Obligatorio: almacenamiento técnico y seguridad</span>
                </div>
                <p className="text-xs text-text-secondary">
                  Necesario para mantener tu sesión, funcionamiento sin conexión, tu tema elegido y avisos esenciales de seguridad o cuenta.
                </p>
              </div>
              <span className="self-start sm:self-center shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-accent/15 text-accent">
                Siempre activo
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted px-1">
                <Mail size={13} className="text-accent" />
                <span>Acceso rápido y correo electrónico opcional</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {EMAIL_AND_ACCESS_ITEMS.map((item) => {
                  const enabled = preferences[item.key];
                  return (
                    <label
                      key={item.key}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-glass-border cursor-pointer transition"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <span className="block text-sm font-semibold text-text-primary">{item.title}</span>
                        <span className="block text-xs text-text-secondary leading-snug">{item.description}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => togglePreference(item.key)}
                        className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent-color)] cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted px-1">
                <BellRing size={13} className="text-accent" />
                <span>Notificaciones push opcionales</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {PUSH_CONSENT_ITEMS.map((item) => {
                  const enabled = preferences[item.key];
                  return (
                    <label
                      key={item.key}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-glass-border cursor-pointer transition"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <span className="block text-sm font-semibold text-text-primary">{item.title}</span>
                        <span className="block text-xs text-text-secondary leading-snug">{item.description}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => togglePreference(item.key)}
                        className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent-color)] cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full font-semibold text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/10 border border-glass-border transition text-sm cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => onDecline()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full font-semibold text-text-primary bg-white/5 hover:bg-white/10 border border-glass-border transition text-sm cursor-pointer"
              >
                Rechazar todo
              </button>
              <button
                type="button"
                onClick={() => onSavePreferences(preferences)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-accent text-bg-secondary font-semibold transition hover:scale-105 active:scale-95 shadow-lg shadow-accent/20 text-sm cursor-pointer"
              >
                Guardar selección
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsentBanner;
