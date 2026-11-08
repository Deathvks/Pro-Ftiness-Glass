import db from '../models/index.js';
import { verifyEmailUnsubscribeToken } from '../utils/emailUnsubscribeToken.js';
import { updateEmailConsents } from '../services/emailConsentService.js';

const htmlPage = (content) => `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Preferencias de correo · Pro Fitness Glass</title>
</head>
<body style="margin:0;background:#0f172a;color:#f8fafc;font-family:Arial,sans-serif;min-height:100vh;display:grid;place-items:center;padding:20px;box-sizing:border-box">
  <main style="width:100%;max-width:480px;background:#1e293b;border:1px solid #334155;border-radius:24px;padding:28px;box-sizing:border-box;text-align:center">
    ${content}
  </main>
</body>
</html>`;

const categoryLabels = {
  activity: 'los avisos de actividad',
  training: 'los recordatorios de entrenamiento',
  coaching: 'los recordatorios de asesoría',
  all: 'todos los correos opcionales'
};

const accountNotice = 'Seguirás recibiendo los correos necesarios para verificar, proteger o recuperar tu cuenta.';
const getToken = req => req.query.token || req.body?.token;

const sendPage = (res, status, title, content) => res
  .set('Cache-Control', 'no-store')
  .set('Referrer-Policy', 'no-referrer')
  .status(status)
  .type('html')
  .send(htmlPage(`<h1 style="font-size:22px">${title}</h1>${content}`));

const settingsHelp = () => `
  <p>Puedes cambiar tus preferencias de correo desde Notificaciones en Ajustes.</p>
  <a href="${process.env.FRONTEND_URL || 'https://profitnessglass.es'}/login" style="color:#a5b4fc">Abrir Pro Fitness Glass</a>
`;

const invalidLink = res => sendPage(res, 400, 'Enlace no válido', settingsHelp());

const staleLink = res => sendPage(res, 410, 'Este enlace ya no está disponible', `
  <p>El enlace ya no corresponde a la dirección actual de la cuenta.</p>
  ${settingsHelp()}
`);

const reportError = (res, error) => {
  console.error('[EmailPreferences] Error al gestionar la baja:', error);
  return sendPage(res, 500, 'No se pudo completar la solicitud', `
    <p>Inténtalo de nuevo.</p>
    ${settingsHelp()}
  `);
};

export const showUnsubscribeConfirmation = async (req, res) => {
  const token = getToken(req);
  const tokenData = verifyEmailUnsubscribeToken(token);
  if (!tokenData) return invalidLink(res);

  try {
    const user = await db.User.findOne({
      where: { id: tokenData.userId, email: tokenData.email },
      attributes: ['email']
    });
    if (user?.email !== tokenData.email) return staleLink(res);

    const allButton = tokenData.category === 'all' ? '' : `
      <button type="submit" name="scope" value="all" style="padding:10px;border:1px solid #94a3b8;border-radius:12px;background:transparent;color:inherit;cursor:pointer">
        Darme de baja de todos los correos opcionales
      </button>
    `;
    return sendPage(res, 200, 'Preferencias de correo', `
      <p>Confirma que quieres dejar de recibir ${categoryLabels[tokenData.category]} por correo.</p>
      <p>${accountNotice}</p>
      <form method="post" action="/api/email-preferences/unsubscribe?token=${encodeURIComponent(token)}" style="display:grid;gap:12px">
        <button type="submit" style="border:0;border-radius:12px;background:#6366f1;color:white;font-size:15px;font-weight:bold;padding:13px 22px;cursor:pointer">
          Confirmar baja
        </button>
        ${allButton}
      </form>
    `);
  } catch (error) {
    return reportError(res, error);
  }
};

export const unsubscribeOptionalEmails = async (req, res) => {
  const tokenData = verifyEmailUnsubscribeToken(getToken(req));
  if (!tokenData) return invalidLink(res);

  const oneClick = req.body?.['List-Unsubscribe'] === 'One-Click';
  const category = !oneClick && req.body?.scope === 'all' ? 'all' : tokenData.category;

  try {
    const applied = await db.sequelize.transaction(async transaction => {
      const user = await db.User.findOne({
        where: { id: tokenData.userId, email: tokenData.email },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (user?.email !== tokenData.email) return false;

      if ((category === 'activity' || category === 'all') && user.email_activity_notifications) {
        await user.update({
          email_activity_notifications: false,
          email_preferences_updated_at: new Date()
        }, { transaction });
      }
      await updateEmailConsents(user, {
        email_marketing_consent: category === 'training' || category === 'all' ? false : undefined,
        email_coaching_consent: category === 'coaching' || category === 'all' ? false : undefined
      }, 'unsubscribe', transaction);
      return true;
    });
    if (!applied) return staleLink(res);

    return sendPage(res, 200, 'Baja confirmada', `
      <p>Has desactivado ${categoryLabels[category]}.</p>
      <p>${accountNotice}</p>
    `);
  } catch (error) {
    return reportError(res, error);
  }
};

export default { showUnsubscribeConfirmation, unsubscribeOptionalEmails };
