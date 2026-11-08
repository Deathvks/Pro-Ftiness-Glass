import models from '../models/index.js';
import { createNotification } from './notificationService.js';

const { User } = models;

/**
 * Envía una alerta directa a tu Telegram personal
 */
export const sendTelegramAlert = async (text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        parse_mode: 'HTML',
        text
      })
    });
  } catch (err) {
    console.error('[Telegram Alert] Error enviando alerta:', err.message);
  }
};

export const notifyAdminsOfIpBlock = async ({ ipAddress, reason }) => {
  try {
    // 1. Notificación interna en la base de datos
    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: ['id'],
    });

    await Promise.all(admins.map(({ id }) => createNotification(id, {
      type: 'security',
      title: 'IP bloqueada',
      message: `Se bloqueó la IP ${ipAddress}. Motivo: ${reason}`,
      data: { url: '/?view=securityDashboard', ipAddress, reason },
    })));

    // 2. Alerta inmediata a tu Telegram
    const fecha = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
    const telegramMsg = `🚨 <b>¡ALERTA DE SEGURIDAD (Backend Honeypot)!</b>\n\n🛑 <b>IP Bloqueada:</b> <code>${ipAddress}</code>\n⚠️ <b>Motivo:</b> ${reason}\n📅 <b>Fecha:</b> ${fecha}\n🛡️ <i>Acceso revocado automáticamente en base de datos.</i>`;
    
    await sendTelegramAlert(telegramMsg);

  } catch (error) {
    console.error('[Security] No se pudo notificar a los administradores del bloqueo:', error.message);
  }
};
