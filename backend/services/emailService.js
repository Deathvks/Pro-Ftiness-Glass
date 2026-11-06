/* backend/services/emailService.js */
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import db from '../models/index.js';
import { createEmailUnsubscribeToken } from '../utils/emailUnsubscribeToken.js';
import { canSendPromotionalEmail } from './emailConsentService.js';
import { domainMailboxes, privacyContact, smtpHost, supportReplyTo } from '../config/mailContacts.js';

const promotionalSender = 'Dylan Jesús Suárez Falcón';

const smtpPort = Number(process.env.EMAIL_PORT?.trim() || 587);
const automaticEmailNotice = supportReplyTo
  ? 'Este correo es automático. Si necesitas ayuda técnica, puedes responder para contactar con soporte.'
  : 'Este es un correo automático, por favor no respondas a este mensaje.';

if (smtpHost && (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535)) {
  throw new Error('EMAIL_PORT debe ser un puerto SMTP válido.');
}

const transporter = nodemailer.createTransport({
  ...(smtpHost ? {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    requireTLS: smtpPort !== 465
  } : { service: 'gmail' }),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendMailAndLog = async (mailOptions) => {
  try {
    const result = await transporter.sendMail({ replyTo: supportReplyTo, ...mailOptions });
    if (db && db.EmailDeliveryLog) {
      await db.EmailDeliveryLog.create({
        recipient_email: mailOptions.to,
        subject: mailOptions.subject,
        status: 'sent'
      }).catch(e => console.error('Error logging email delivery:', e));
    }
    return result;
  } catch (err) {
    if (db && db.EmailDeliveryLog) {
      await db.EmailDeliveryLog.create({
        recipient_email: mailOptions.to,
        subject: mailOptions.subject,
        status: 'failed',
        error_message: err.message
      }).catch(e => console.error('Error logging email failure:', e));
    }
    throw err;
  }
};

export const sendDomainMailboxTest = async () => {
  const recipients = Object.values(domainMailboxes);
  const results = await Promise.allSettled(recipients.map(email => sendMailAndLog({
    from: domainMailboxes.notifications,
    to: email,
    subject: 'Prueba de entrega de Pro Fitness Glass',
    text: `Prueba de correo solicitada desde el panel de administración para ${email}. Si has recibido este mensaje, ese buzón admite correo enviado desde la aplicación.`
  })));

  return recipients.map((email, index) => ({
    email,
    accepted: results[index].status === 'fulfilled' && results[index].value.accepted?.includes(email) === true
  }));
};

const findOptionalEmailRecipient = (email, userId) => db.User.findOne({
  where: { email, ...(userId === undefined ? {} : { id: userId }) },
  attributes: ['id', 'email', 'is_verified', 'email_activity_notifications', 'email_marketing_consent', 'email_coaching_consent']
});

const sendOptionalMailAndLog = async (mailOptions, purpose, userId) => {
  const recipientEmail = Array.isArray(mailOptions.to) ? mailOptions.to[0]?.address : mailOptions.to;
  const user = recipientEmail ? await findOptionalEmailRecipient(recipientEmail, userId) : null;

  if (!user) return { success: true, skipped: true };

  const allowed = purpose
    ? await canSendPromotionalEmail(user, purpose)
    : user.email_activity_notifications;
  if (!allowed) return { success: true, skipped: true };

  const token = createEmailUnsubscribeToken({ userId: user.id, email: user.email, category: purpose ?? 'activity' });
  const baseUrl = (process.env.FRONTEND_URL || 'https://pro-fitness-glass.zeabur.app').replace(/\/+$/, '');
  const unsubscribeUrl = `${baseUrl}/api/email-preferences/unsubscribe?token=${encodeURIComponent(token)}`;
  const promotionalNotice = purpose ? `
    <div style="max-width:600px;margin:0 auto 16px;padding:12px 16px;box-sizing:border-box;background:#f3f4f6;border-radius:8px;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#1f2937;">
      <strong>Comunicación promocional de Pro Fitness Glass</strong><br>
      Enviada por ${promotionalSender}, titular de Pro Fitness Glass.
    </div>
  ` : '';
  const footerMessage = purpose
    ? 'Recibes este correo porque autorizaste esta categoría de recordatorios. Puedes retirar tu consentimiento en cualquier momento.'
    : 'Recibes este aviso según tus preferencias de actividad en Pro Fitness Glass.';
  const footer = `
    <div style="max-width:600px;margin:24px auto 0;padding:16px 20px;border-top:1px solid #e5e7eb;text-align:center;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b7280;">
      ${footerMessage}
      <a href="${unsubscribeUrl}" style="color:#4f46e5;text-decoration:underline;font-weight:bold;">Darse de baja de estos correos</a>
      ${purpose ? `<br>Contacto <a href="mailto:${privacyContact}" style="color:#4f46e5;">${privacyContact}</a> · <a href="${baseUrl}/privacy" style="color:#4f46e5;">Política de privacidad</a>` : ''}
    </div>
  `;

  return sendMailAndLog({
    ...mailOptions,
    ...(purpose && {
      from: { name: `${promotionalSender} · Pro Fitness Glass`, address: mailOptions.from },
      subject: `[Promocional] ${mailOptions.subject}`
    }),
    html: `${promotionalNotice}${mailOptions.html || ''}${footer}`,
    headers: {
      ...(mailOptions.headers || {}),
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    }
  });
};

// Generar código de verificación
export const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Enviar código de verificación
export const sendVerificationEmail = async (email, code) => {
  const resetUrl = `${process.env.FRONTEND_URL}/forgot-password`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Código de verificación - Pro Fitness Glass',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">¡Bienvenido a Pro Fitness Glass!</h2>
        <p>Tu código de verificación es:</p>
        <div style="background: #F3F4F6; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #1F2937; font-size: 32px; margin: 0;">${code}</h1>
        </div>
        <p>Este código expira en 10 minutos.</p>
        <p>Si no solicitaste este código, puedes ignorar este email.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="font-size: 14px; color: #555;">
          <strong>¿No has sido tú?</strong><br>
          Si no has intentado iniciar sesión, es posible que alguien esté usando tu correo. 
          <a href="${resetUrl}" style="color: #4F46E5; text-decoration: none; font-weight: bold;">
            Haz clic aquí para restablecer tu contraseña
          </a>.
        </p>
      </div>
    `
  };

  try {
    await sendMailAndLog(mailOptions);
    return { success: true, message: 'Código enviado correctamente' };
  } catch (error) {
    console.error('Error enviando email:', error);
    return { success: false, message: 'Error enviando código' };
  }
};

// Enviar email para resetear contraseña
export const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Restablecimiento de Contraseña - Pro Fitness Glass',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Restablecimiento de Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a 
            href="${resetUrl}" 
            style="background-color: #4F46E5; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;"
          >
            Restablecer Contraseña
          </a>
        </div>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste esto, puedes ignorar este email de forma segura.</p>
      </div>
    `
  };

  try {
    await sendMailAndLog(mailOptions);
    return { success: true, message: 'Email de restablecimiento enviado.' };
  } catch (error) {
    console.error('Error enviando email de reseteo:', error);
    return { success: false, message: 'Error al enviar el email.' };
  }
};

// --- NUEVA FUNCIÓN: Alerta de inicio de sesión ---
export const sendLoginAlertEmail = async (email, { ip, userAgent, token }) => {
  // Usamos el token generado para ir directo al reset
  const changePasswordUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Alerta de seguridad: Nuevo inicio de sesión - Pro Fitness Glass',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Nuevo inicio de sesión detectado</h2>
        <p>Se ha iniciado sesión correctamente en tu cuenta con Autenticación en Dos Pasos.</p>
        
        <div style="background: #F9FAFB; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Dispositivo/Navegador:</strong> ${userAgent}</p>
          <p style="margin: 5px 0;"><strong>Dirección IP:</strong> ${ip}</p>
          <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <p>Si has sido tú, puedes ignorar este mensaje.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="color: #DC2626; font-weight: bold;">¿No has sido tú?</p>
        <p>Alguien podría tener acceso a tu contraseña y a tus códigos de verificación.</p>
        <p>
          <a href="${changePasswordUrl}" style="background-color: #DC2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Cambiar contraseña ahora
          </a>
        </p>
      </div>
    `
  };

  try {
    await sendMailAndLog(mailOptions);
    return { success: true, message: 'Alerta de login enviada.' };
  } catch (error) {
    console.error('Error enviando alerta de login:', error);
    // No retornamos false para no bloquear el login si el email falla, solo logueamos
    return { success: false, message: 'Error al enviar alerta.' };
  }
};
export const sendChatReplyEmail = async (email, senderName) => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Nuevo mensaje de ${senderName} en Pro Fitness Glass`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #4F46E5;">¡Tienes una nueva respuesta!</h2>
        <p>Hola,</p>
        <p>Tu entrenador (<strong>${senderName}</strong>) te ha enviado un nuevo mensaje en el chat de asesoría.</p>
        <p>Por motivos de privacidad, entra en la aplicación para leerlo y responder.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background: #4F46E5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Abrir Pro Fitness Glass
          </a>
        </div>
        <p style="font-size: 12px; color: #888; text-align: center;">${automaticEmailNotice}</p>
      </div>
    `
  };

  try {
    const result = await sendOptionalMailAndLog(mailOptions);
    if (!result?.skipped) console.log('Correo de respuesta de chat enviado a:', email);
  } catch (error) {
    console.error('Error al enviar correo de respuesta de chat:', error);
    throw error;
  }
};

export const sendNewClientMessageEmail = async (email, clientName) => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Nuevo mensaje de ${clientName} en Pro Fitness Glass`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #4F46E5;">Nuevo mensaje de asesoría</h2>
        <p>Hola,</p>
        <p>El cliente <strong>${clientName}</strong> te ha enviado un nuevo mensaje.</p>
        <p>Entra en el panel de administración o entrenador para leerlo y responder.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background: #4F46E5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Abrir Pro Fitness Glass
          </a>
        </div>
        <p style="font-size: 12px; color: #888; text-align: center;">${automaticEmailNotice}</p>
      </div>
    `
  };

  try {
    const result = await sendOptionalMailAndLog(mailOptions);
    if (!result?.skipped) console.log('Correo de nuevo mensaje de cliente enviado a:', email);
  } catch (error) {
    console.error('Error enviando correo de nuevo mensaje de cliente:', error);
  }
};

export const sendCoachingLinkedEmail = async (email, trainerName) => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `¡Has sido añadido a una asesoría en Pro Fitness Glass!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #4F46E5;">Nueva Asesoría Asignada</h2>
        <p>Hola,</p>
        <p>El entrenador <strong>${trainerName}</strong> te ha añadido a su programa de asesoría en Pro Fitness Glass.</p>
        <p>A partir de ahora podrás ver tus rutinas, dietas y hablar con tu entrenador directamente en la app.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background: #4F46E5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Acceder a mi Asesoría
          </a>
        </div>
        <p style="font-size: 12px; color: #888; text-align: center;">${automaticEmailNotice}</p>
      </div>
    `
  };

  try {
    const result = await sendOptionalMailAndLog(mailOptions);
    if (!result?.skipped) console.log('Correo de asesoría vinculada enviado a:', email);
  } catch (error) {
    console.error('Error enviando correo de asesoría vinculada:', error);
  }
};

export const sendBotReminderEmail = async (email, userName, level) => {
  const titles = {
    1: '¿Continuamos con tu cambio?',
    2: 'Aún estás a tiempo de empezar 💪',
    3: 'Último aviso antes de cerrar el chat ⏳'
  };
  const texts = {
    1: 'He visto que dejaste el chat abierto. Si tienes cualquier duda sobre la asesoría o quieres empezar, ¡estoy disponible!',
    2: 'Solo te escribo para recordarte que sigo por aquí si necesitas ayuda para dar el primer paso. ¡Anímate!',
    3: 'Si no hay actividad en 1 día, el chat se cerrará por inactividad. Puedes volver a pedir asesoría cuando quieras.'
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6366f1;">${titles[level]}</h2>
      <p>Hola ${userName},</p>
      <p>${texts[level]}</p>
      <p style="margin-top: 30px;">
        <a href="https://pro-fitness-glass.zeabur.app/social" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Ir al chat
        </a>
      </p>
    </div>
  `;

    const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Aviso de asesoría: ' + titles[level],
    html: html
  };
  return sendOptionalMailAndLog(mailOptions, 'coaching');
};




export const sendBugReportResolvedEmail = async (email, userName, reportSubject) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Tu reporte ha sido resuelto - Pro Fitness Glass`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #4F46E5;">Reporte Resuelto ✅</h2>
        <p>Hola ${userName},</p>
        <p>Te escribimos para informarte que el problema que nos reportaste (<strong>${reportSubject}</strong>) ha sido analizado y resuelto por nuestro equipo técnico.</p>
        <p>Muchas gracias por ayudarnos a mejorar la aplicación.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}" style="background: #4F46E5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Volver a la App
          </a>
        </div>
        <p style="font-size: 12px; color: #888; text-align: center;">${automaticEmailNotice}</p>
      </div>
    `
  };

  try {
    await sendMailAndLog(mailOptions);
    console.log('Correo de reporte resuelto enviado a:', email);
  } catch (error) {
    console.error('Error enviando correo de reporte resuelto:', error);
  }
};


export const sendRetentionRescueEmail = async ({ userId, email, userName, loadPayload }) => {
  const recipient = await findOptionalEmailRecipient(email, userId);
  if (!recipient || !(await canSendPromotionalEmail(recipient, 'training'))) {
    return { success: true, skipped: true };
  }

  const {
    title,
    message,
    contextLabel,
    ctaUrl = '/routines',
    ctaText = 'Ir a mi entrenamiento'
  } = await loadPayload(recipient.id);
  const baseUrl = process.env.FRONTEND_URL || 'https://pro-fitness-glass.zeabur.app';
  const targetUrl = ctaUrl.startsWith('http') ? ctaUrl : `${baseUrl}${ctaUrl}`;
  const safeName = userName || 'Atleta';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
      <div style="padding: 32px 28px;">
        <div style="display: inline-block; padding: 6px 14px; border-radius: 999px; background-color: rgba(34, 197, 94, 0.15); color: #22c55e; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px;">
          PRO FITNESS GLASS · ${contextLabel || 'TU PROGRESO'}
        </div>
        <h2 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 14px; line-height: 1.3;">
          ${title}
        </h2>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin: 0 0 12px;">
          Hola <strong>${safeName}</strong>,
        </p>
        <p style="color: #f1f5f9; font-size: 16px; line-height: 1.6; margin: 0 0 28px; background: rgba(255,255,255,0.05); padding: 18px 20px; border-radius: 16px; border-left: 4px solid #22c55e;">
          ${message}
        </p>
        <div style="text-align: center; margin: 28px 0 12px;">
          <a href="${targetUrl}" style="background-color: #22c55e; color: #0f172a; padding: 14px 28px; text-decoration: none; border-radius: 999px; font-weight: 800; font-size: 15px; display: inline-block;">
            ${ctaText}
          </a>
        </div>
      </div>
      <div style="padding: 16px 28px; background-color: rgba(0,0,0,0.25); text-align: center; font-size: 12px; color: #64748b;">
        Este recordatorio personalizado se envía para ayudarte a mantener la constancia en Pro Fitness Glass.
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `${title} - Pro Fitness Glass`,
    html
  };

  // La autorización puede cambiar mientras se consulta la actividad.
  return sendOptionalMailAndLog(mailOptions, 'training', recipient.id);
};
