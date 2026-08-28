import models from '../models/index.js';
const { SecurityLog, IpBlacklist } = models;
import { Op } from 'sequelize';

// Middleware global para bloquear IPs en lista negra
export const checkBlacklist = async (req, res, next) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    if (!ip) return next();

    const blocked = await IpBlacklist.findOne({
      where: {
        ipAddress: ip,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ]
      }
    });

    if (blocked) {
      // Registramos que intentó entrar estando bloqueado
      await SecurityLog.create({
        eventType: 'BLOCKED_ACCESS_ATTEMPT',
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || 'Unknown',
        details: `Intento de acceso a ${req.originalUrl} desde IP bloqueada.`
      });
      return res.status(403).json({ error: 'Tu dirección IP ha sido bloqueada temporalmente por motivos de seguridad.' });
    }

    next();
  } catch (error) {
    console.error('Error en checkBlacklist middleware:', error);
    next();
  }
};

// Función útil para registrar eventos manualmente en controladores
export const logSecurityEvent = async ({ eventType, ipAddress, userId, userAgent, details }) => {
  try {
    await SecurityLog.create({
      eventType,
      ipAddress,
      userId,
      userAgent,
      details
    });
  } catch (error) {
    console.error('Error guardando security log:', error);
  }
};
