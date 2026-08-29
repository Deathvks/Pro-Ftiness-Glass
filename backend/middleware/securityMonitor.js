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
      console.log(`[SECURITY LOG] Registrando evento: ${eventType} para el usuario: ${userId}, IP: ${ipAddress}`);
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
    let country = null;
    let city = null;

    // Obtener geolocalización de la IP (ignoramos localhost)
    if (ipAddress && ipAddress !== '127.0.0.1' && ipAddress !== '::1' && !ipAddress.startsWith('192.168.')) {
      try {
        // ip-api.com es gratuito para uso no comercial (límite 45 req/min)
        const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            country = data.countryCode;
            city = data.city;
          }
        }
      } catch (geoError) {
        console.error('Error obteniendo geo IP:', geoError);
      }
    }

    console.log(`[SECURITY LOG] Registrando evento: ${eventType} para el usuario: ${userId}, IP: ${ipAddress}`);
    await SecurityLog.create({
      eventType,
      ipAddress,
      userId,
      userAgent,
      details,
      country,
      city
    });

    // AUTO-BAN LÓGICA (Si es LOGIN_FAILED)
    if (eventType === 'LOGIN_FAILED') {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const failedCount = await SecurityLog.count({
        where: {
          ipAddress,
          eventType: 'LOGIN_FAILED',
          createdAt: { [Op.gt]: oneMinuteAgo }
        }
      });

      if (failedCount >= 10) {
        // Bloquear por 24 horas
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        await IpBlacklist.findOrCreate({
          where: { ipAddress },
          defaults: {
            reason: 'Autobloqueo: Múltiples intentos de inicio de sesión fallidos (Fuerza Bruta)',
            expiresAt
          }
        });

        console.log(`[SECURITY LOG] Registrando evento: ${eventType} para el usuario: ${userId}, IP: ${ipAddress}`);
    await SecurityLog.create({
          eventType: 'AUTO_BAN',
          ipAddress,
          userId: null,
          userAgent: 'SYSTEM',
          details: `IP bloqueada automáticamente tras ${failedCount} intentos fallidos en menos de 1 minuto.`,
          country,
          city
        });
      }
    }

  } catch (error) {
    console.error('Error guardando security log:', error);
  }
};
