import db from '../models/index.js';
import { verifyEmailUnsubscribeToken } from '../utils/emailUnsubscribeToken.js';

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

const getTokenData = (req) => verifyEmailUnsubscribeToken(req.query.token || req.body?.token);

export const showUnsubscribeConfirmation = async (req, res) => {
  const tokenData = getTokenData(req);
  if (!tokenData) {
    return res.status(400).type('html').send(htmlPage(`
      <h1 style="font-size:22px">Enlace no válido</h1>
      <p style="color:#cbd5e1;line-height:1.6">Este enlace de preferencias no es válido. Puedes desactivar los correos opcionales desde Notificaciones en Ajustes.</p>
      <a href="${process.env.FRONTEND_URL || 'https://pro-fitness-glass.zeabur.app'}/login" style="color:#a5b4fc">Abrir Pro Fitness Glass</a>
    `));
  }

  return res.type('html').send(htmlPage(`
    <h1 style="font-size:22px">Darse de baja de correos opcionales</h1>
    <p style="color:#cbd5e1;line-height:1.6">Dejarás de recibir avisos de actividad y recordatorios promocionales. Los correos necesarios para verificar, proteger o recuperar tu cuenta seguirán activos.</p>
    <form method="post" action="/api/email-preferences/unsubscribe?token=${encodeURIComponent(req.query.token)}">
      <button type="submit" style="border:0;border-radius:12px;background:#6366f1;color:white;font-size:15px;font-weight:bold;padding:13px 22px;cursor:pointer">Confirmar baja</button>
    </form>
  `));
};

export const unsubscribeOptionalEmails = async (req, res) => {
  const tokenData = getTokenData(req);
  if (!tokenData) {
    return res.status(400).type('html').send(htmlPage(`
      <h1 style="font-size:22px">Enlace no válido</h1>
      <p style="color:#cbd5e1;line-height:1.6">No se pudo procesar la solicitud. Puedes cambiar esta preferencia desde Notificaciones en Ajustes.</p>
    `));
  }

  try {
    await db.User.update(
      {
        email_activity_notifications: false,
        email_marketing_consent: false,
        email_preferences_updated_at: new Date()
      },
      { where: { id: tokenData.userId, email: tokenData.email } }
    );
    return res.type('html').send(htmlPage(`
      <h1 style="font-size:22px">Baja confirmada</h1>
      <p style="color:#cbd5e1;line-height:1.6">Ya no recibirás avisos de actividad ni recordatorios promocionales por correo. Los mensajes necesarios para tu cuenta y seguridad seguirán activos.</p>
    `));
  } catch (error) {
    console.error('[EmailPreferences] Error al dar de baja correos opcionales:', error);
    return res.status(500).type('html').send(htmlPage(`
      <h1 style="font-size:22px">No se pudo completar la baja</h1>
      <p style="color:#cbd5e1;line-height:1.6">Inténtalo de nuevo o cambia esta preferencia desde Notificaciones en Ajustes.</p>
    `));
  }
};

export default { showUnsubscribeConfirmation, unsubscribeOptionalEmails };
