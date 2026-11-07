import { useEffect, useId, useState } from 'react';
import { BellRing, Mail } from 'lucide-react';
import { EMAIL_CONSENT_TEXT, EMAIL_CONSENT_VERSION } from '../config/emailConsent';
import { PUSH_OPTIONS, PUSH_CONSENT_VERSION } from '../config/pushConsent';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useToast } from '../hooks/useToast';
import { getPushPreferences, updatePushPreferences } from '../services/notificationService';
import { updateUserProfile } from '../services/userService';
import useAppStore from '../store/useAppStore';

const offers = {
  training: {
    field: 'email_marketing_consent',
    title: '¿Un recordatorio para retomar tu rutina?',
    description: 'Recibe un correo personalizado si pasan varios días sin actividad.',
    action: 'Activar recordatorios'
  },
  coaching: {
    field: 'email_coaching_consent',
    title: '¿Seguimiento de la asesoría por correo?',
    description: 'Recibe hasta tres correos si el chat queda inactivo, incluido el aviso previo al cierre.',
    action: 'Activar seguimiento'
  }
};

const trainingPushDetails = PUSH_OPTIONS.find(({ purpose }) => purpose === 'training').description;

function wasDismissed(key) {
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
}

export default function NotificationOffer({ purpose, offerPush = true, offerEmail = true }) {
  const profile = useAppStore(state => state.userProfile);
  if (!profile?.id) return null;

  const storageKey = `pfg_notification_offer:${profile.id}:${purpose}`;
  const emailKey = `pfg_email_reminder_offer:${profile.id}:${purpose}`;
  const emailAvailable = !!(offerEmail && profile.is_verified && profile.email && !profile.email.endsWith('@x-auth.local')
    && !profile[offers[purpose].field] && !wasDismissed(emailKey));
  return <OfferCard key={storageKey} purpose={purpose} userId={profile.id} storageKey={storageKey} offerPush={offerPush} emailAvailable={emailAvailable} />;
}

function OfferCard({ purpose, userId, storageKey, offerPush, emailAvailable }) {
  const isTraining = purpose === 'training';
  const [hidden, setHidden] = useState(() => wasDismissed(storageKey));
  const [channel, setChannel] = useState(null);
  const [saving, setSaving] = useState(null);
  const [waitingForDevice, setWaitingForDevice] = useState(false);
  const [trainingPushEnabled, setTrainingPushEnabled] = useState(null);
  const [error, setError] = useState('');
  const detailsId = useId();
  const { addToast } = useToast();
  const { field, title, description, action } = offers[purpose];
  const { isSubscribed, isSupported, isLoading, permission, subscribe } = usePushNotifications(!hidden && (offerPush || waitingForDevice));
  const canCheckTrainingPush = offerPush && isTraining && !hidden && isSupported && permission !== 'denied';
  const pushAvailable = offerPush && isSupported && permission !== 'denied'
    && (isTraining ? trainingPushEnabled !== null && (!trainingPushEnabled || !isSubscribed) : !isSubscribed);
  const showPush = pushAvailable || saving === 'push' || waitingForDevice;

  useEffect(() => {
    if (!canCheckTrainingPush) return;
    let active = true;
    getPushPreferences().then(preferences => {
      if (active) setTrainingPushEnabled(preferences.training === true);
    }).catch(() => {});
    return () => { active = false; };
  }, [canCheckTrainingPush]);

  const hideOffer = () => {
    setHidden(true);
    try {
      localStorage.setItem(storageKey, '1');
    } catch { /* La tarjeta se oculta durante esta visita. */ }
  };

  const activateEmail = async () => {
    if (saving || waitingForDevice || useAppStore.getState().userProfile?.id !== userId) return;
    setSaving('email');
    setError('');
    try {
      const updated = await updateUserProfile({ [field]: true, emailConsentVersion: EMAIL_CONSENT_VERSION }, {
        queueWhenOffline: false
      });
      if (updated?.[field] !== true) throw new Error('El servidor no confirmó el cambio.');
      if (useAppStore.getState().userProfile?.id !== userId) return;

      hideOffer();
      useAppStore.setState(state => ({ userProfile: { ...state.userProfile, [field]: true } }));
      addToast('Preferencia de correo activada.', 'success');
    } catch {
      setError('No pudimos guardar la preferencia. Vuelve a intentarlo.');
    } finally {
      setSaving(null);
    }
  };

  useEffect(() => {
    if (!waitingForDevice || isLoading) return;
    setWaitingForDevice(false);
    if (!isSubscribed) return;
    if (!isTraining || trainingPushEnabled) setHidden(true);
    else setSaving('push');
  }, [waitingForDevice, isLoading, isSubscribed, isTraining, trainingPushEnabled]);

  useEffect(() => {
    if (saving !== 'push' || useAppStore.getState().userProfile?.id !== userId) return;
    let active = true;
    updatePushPreferences('training', true, PUSH_CONSENT_VERSION).then(preferences => {
      if (preferences?.training !== true) throw new Error('El servidor no confirmó el cambio.');
      if (!active || useAppStore.getState().userProfile?.id !== userId) return;
      setTrainingPushEnabled(true);
      setHidden(true);
      addToast('Recordatorios de entrenamiento por push activados.', 'success');
    }).catch(() => {
      if (active) setError('No pudimos guardar los recordatorios push. Vuelve a intentarlo.');
    }).finally(() => {
      if (active) setSaving(null);
    });
    return () => { active = false; };
  }, [saving, userId, addToast]);

  const activatePush = () => {
    if (saving || waitingForDevice || isLoading || !pushAvailable || useAppStore.getState().userProfile?.id !== userId) return;
    setError('');
    if (isSubscribed) {
      setSaving('push');
      return;
    }
    setWaitingForDevice(true);
    void subscribe();
  };

  const isBusy = !!saving || waitingForDevice;
  const coachingPush = !isTraining && showPush;
  const showEmailDetails = channel === 'email' && emailAvailable;
  const showPushDetails = isTraining && channel === 'push' && showPush;
  const toggleChannel = next => {
    setChannel(channel === next ? null : next);
    setError('');
  };

  if (hidden || (!showPush && !emailAvailable)) return null;
  if (offerPush && isLoading && isSupported && permission !== 'denied' && !isBusy) return null;

  const Icon = showPush ? BellRing : Mail;
  const choiceClass = 'min-h-11 rounded-lg px-2 text-xs font-bold text-accent hover:bg-accent/10 disabled:opacity-50';
  const primaryClass = 'min-h-11 rounded-xl bg-accent px-3 text-xs font-bold text-accent-contrast disabled:opacity-50';

  return (
    <aside className="glass mx-auto flex w-full max-w-sm items-start gap-2.5 rounded-2xl px-3 pb-1.5 pt-3 text-left sm:px-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-snug text-text-primary">{coachingPush ? '¿Te avisamos cuando te responda tu entrenador?' : title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
          {coachingPush ? 'Recibe un aviso en este dispositivo aunque tengas la app cerrada. La respuesta se lee dentro del chat.'
            : isTraining && showPush && emailAvailable ? 'Elige cómo recibir un recordatorio si pasan varios días sin entrenar.'
            : isTraining && showPush ? 'Recibe un aviso en este dispositivo si pasan varios días sin entrenar.' : description}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2">
          {coachingPush && <button type="button" disabled={isBusy || isLoading} onClick={activatePush} className={primaryClass}>{waitingForDevice ? 'Activando…' : 'Activar avisos'}</button>}
          {isTraining && showPush && <button type="button" disabled={isBusy} aria-expanded={showPushDetails} aria-controls={detailsId} onClick={() => toggleChannel('push')} className={choiceClass}>Push</button>}
          {emailAvailable && <button type="button" disabled={isBusy} aria-expanded={showEmailDetails} aria-controls={detailsId} onClick={() => toggleChannel('email')} className={choiceClass}>{coachingPush ? 'Seguimiento por correo' : 'Correo electrónico'}</button>}
          <button type="button" disabled={isBusy} onClick={hideOffer} className="min-h-11 rounded-lg px-2 text-xs font-semibold text-text-secondary hover:text-text-primary disabled:opacity-50">Ahora no</button>
        </div>
        <div id={detailsId} hidden={!showEmailDetails && !showPushDetails} className="space-y-2 pb-2">
          <p className="text-xs leading-relaxed text-text-secondary">
            {showPushDetails ? `${trainingPushDetails} Puedes retirarlos en Ajustes.${isSubscribed ? '' : ' También se activarán los avisos de servicio de este dispositivo.'}` : EMAIL_CONSENT_TEXT[purpose]}
          </p>
          {error && <p role="alert" className="mt-1 text-xs text-red">{error}</p>}
          <button type="button" disabled={isBusy || (showPushDetails && isLoading)} onClick={showPushDetails ? activatePush : activateEmail} className={primaryClass}>
            {isBusy ? 'Activando…' : showPushDetails ? 'Activar recordatorios push' : action}
          </button>
        </div>
      </div>
    </aside>
  );
}
