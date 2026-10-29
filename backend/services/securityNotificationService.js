import models from '../models/index.js';
import { createNotification } from './notificationService.js';

const { User } = models;

export const notifyAdminsOfIpBlock = async ({ ipAddress, reason }) => {
  try {
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
  } catch (error) {
    console.error('[Security] No se pudo notificar a los administradores del bloqueo:', error.message);
  }
};
