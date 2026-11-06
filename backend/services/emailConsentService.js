import { createHash } from 'node:crypto';
import EmailConsentEvent from '../models/emailConsentEventModel.js';

// Al cambiar el aviso, actualizar también su versión en frontend/src/config/emailConsent.js.
export const EMAIL_CONSENT_VERSION = '2026-11-06';

const purposes = {
  training: {
    field: 'email_marketing_consent',
    text: 'Acepto que Pro Fitness Glass use mi actividad en la app, mis rutinas, mis marcas de entrenamiento y si he registrado comidas para enviarme recordatorios personalizados de entrenamiento por correo. Es opcional y puedo retirarlo en Ajustes o mediante el enlace de baja.'
  },
  coaching: {
    field: 'email_coaching_consent',
    text: 'Acepto recibir por correo recordatorios promocionales de Pro Fitness Glass sobre las asesorías que haya consultado en el chat. Es opcional y puedo retirarlo en Ajustes o mediante el enlace de baja.'
  }
};

const fingerprint = email => createHash('sha256').update(email.trim().toLowerCase()).digest('hex');

export const updateEmailConsents = async (user, choices, source, transaction) => {
  const occurredAt = new Date();
  const emailFingerprint = fingerprint(user.email);
  const updates = {};
  const events = [];

  for (const [purpose, { field, text }] of Object.entries(purposes)) {
    const granted = choices[field];
    if (typeof granted !== 'boolean' || (!granted && !user[field])) continue;

    updates[field] = granted;
    events.push({
      user_id: user.id,
      purpose,
      granted,
      source,
      email_fingerprint: emailFingerprint,
      notice_version: granted ? EMAIL_CONSENT_VERSION : null,
      notice_text: granted ? text : null,
      occurred_at: occurredAt
    });
  }

  if (events.length) {
    await user.update({ ...updates, email_preferences_updated_at: occurredAt }, { transaction });
    await EmailConsentEvent.bulkCreate(events, { transaction });
  }
};

export const canSendPromotionalEmail = async (user, purpose) => {
  if (!user.is_verified || user.email.endsWith('@x-auth.local') || !user[purposes[purpose].field]) return false;

  const event = await EmailConsentEvent.findOne({
    where: { user_id: user.id, purpose },
    order: [['id', 'DESC']],
    attributes: ['granted', 'email_fingerprint', 'notice_version']
  });
  return Boolean(event?.granted && event.notice_version && event.email_fingerprint === fingerprint(user.email));
};
