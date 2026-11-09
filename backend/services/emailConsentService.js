import { createHash } from 'node:crypto';
import { Op } from 'sequelize';
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

export const getPromotionalEmailConsentStatuses = async (users, purpose) => {
  const config = purposes[purpose];
  if (!config || !Array.isArray(users) || users.length === 0) return new Map();

  const statuses = new Map();
  const candidates = users.filter((user) => {
    const id = Number(user?.id);
    const valid = Number.isFinite(id)
      && Boolean(user?.is_verified)
      && Boolean(user?.email)
      && !user.email.endsWith('@x-auth.local')
      && Boolean(user[config.field]);
    if (!valid) statuses.set(id, { allowed: false, reason: 'consent_missing_or_invalid' });
    return valid;
  });

  if (candidates.length === 0) return statuses;

  const events = await EmailConsentEvent.findAll({
    where: {
      user_id: { [Op.in]: candidates.map(user => user.id) },
      purpose,
    },
    order: [['id', 'DESC']],
    attributes: ['user_id', 'granted', 'email_fingerprint', 'notice_version'],
    raw: true,
  });
  const latestEventByUser = new Map();
  for (const event of events) {
    const id = Number(event.user_id);
    if (!latestEventByUser.has(id)) latestEventByUser.set(id, event);
  }

  for (const user of candidates) {
    const event = latestEventByUser.get(Number(user.id));
    const allowed = Boolean(
      event?.granted
      && event.notice_version
      && event.email_fingerprint === fingerprint(user.email)
    );
    statuses.set(Number(user.id), {
      allowed,
      reason: allowed ? null : 'consent_missing_or_invalid',
    });
  }

  return statuses;
};

export const canSendPromotionalEmail = async (user, purpose) => {
  const statuses = await getPromotionalEmailConsentStatuses([user], purpose);
  return statuses.get(Number(user?.id))?.allowed === true;
};
