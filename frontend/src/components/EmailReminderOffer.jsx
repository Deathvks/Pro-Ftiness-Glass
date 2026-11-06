import { useId, useState } from 'react';
import { Mail } from 'lucide-react';
import { EMAIL_CONSENT_TEXT, EMAIL_CONSENT_VERSION } from '../config/emailConsent';
import { useToast } from '../hooks/useToast';
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

export default function EmailReminderOffer({ purpose }) {
  const profile = useAppStore(state => state.userProfile);

  if (!profile?.id || !profile.is_verified || !profile.email || profile.email.endsWith('@x-auth.local')) return null;
  if (profile[offers[purpose].field]) return null;

  const storageKey = `pfg_email_reminder_offer:${profile.id}:${purpose}`;
  return <ReminderOfferCard key={storageKey} purpose={purpose} userId={profile.id} storageKey={storageKey} />;
}

function ReminderOfferCard({ purpose, userId, storageKey }) {
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const detailsId = useId();
  const { addToast } = useToast();
  const { field, title, description, action } = offers[purpose];

  const hideOffer = () => {
    setHidden(true);
    try {
      localStorage.setItem(storageKey, '1');
    } catch { /* La tarjeta se oculta durante esta visita. */ }
  };

  const activate = async () => {
    if (saving || useAppStore.getState().userProfile?.id !== userId) return;
    setSaving(true);
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
      setSaving(false);
    }
  };

  if (hidden) return null;

  return (
    <aside className="mx-auto flex w-full max-w-sm items-start gap-2.5 rounded-2xl border border-glass-border bg-bg-secondary px-3 py-2.5 text-left">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Mail size={15} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-snug text-text-primary">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{description}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2">
          <button type="button" disabled={saving} aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded(!expanded)} className="min-h-9 rounded-lg pr-1 text-xs font-bold text-accent hover:underline">
            {expanded ? 'Ocultar detalles' : 'Ver opción'}
          </button>
          <button type="button" disabled={saving} onClick={hideOffer} className="min-h-9 rounded-lg px-1 text-xs font-semibold text-text-secondary hover:text-text-primary disabled:opacity-50">
            Ahora no
          </button>
        </div>
        <div id={detailsId} hidden={!expanded}>
          <p className="text-xs leading-relaxed text-text-secondary">{EMAIL_CONSENT_TEXT[purpose]}</p>
          {error && <p role="alert" className="mt-1 text-xs text-red">{error}</p>}
          <button type="button" disabled={saving} onClick={activate} className="mt-2 min-h-9 rounded-xl bg-accent px-3 text-xs font-bold text-accent-contrast disabled:opacity-50">
            {saving ? 'Guardando…' : action}
          </button>
        </div>
      </div>
    </aside>
  );
}
