import models from '../models/index.js';
const { SecurityLog, IpBlacklist } = models;
import { Op } from 'sequelize';
import { notifyAdminsOfIpBlock } from '../services/securityNotificationService.js';

// Helper universal para extraer la IP limpia del cliente (evita listas proxy y espacios)
export const getClientIp = (req) => {
  if (!req) return '127.0.0.1';
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
};

// Middleware global para bloquear IPs en lista negra
export const checkBlacklist = async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    
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
      console.log(`[SECURITY LOG] Intento de acceso de IP bloqueada: ${ip}`);
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

    let cleanIp = ipAddress;
    if (cleanIp && typeof cleanIp === 'string' && cleanIp.includes(',')) {
      cleanIp = cleanIp.split(',')[0].trim();
    }
    const targetIp = cleanIp || '127.0.0.1';

    // Obtener geolocalización de la IP (ignoramos localhost y rangos privados)
    if (targetIp && targetIp !== '127.0.0.1' && targetIp !== '::1' && !targetIp.startsWith('192.168.') && !targetIp.startsWith('10.') && !targetIp.startsWith('172.16.')) {
      try {
        // ip-api.com es gratuito para uso no comercial (límite 45 req/min)
        const response = await fetch(`http://ip-api.com/json/${targetIp}`);
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

    console.log(`[SECURITY LOG] Registrando evento: ${eventType} para el usuario: ${userId}, IP: ${targetIp}`);
    await SecurityLog.create({
      eventType,
      ipAddress: targetIp,
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
          ipAddress: targetIp,
          eventType: 'LOGIN_FAILED',
          createdAt: { [Op.gt]: oneMinuteAgo }
        }
      });

      if (failedCount >= 10) {
        // Bloquear por 24 horas
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        const [blockedIp, wasCreated] = await IpBlacklist.findOrCreate({
          where: { ipAddress: targetIp },
          defaults: {
            reason: 'Autobloqueo: Múltiples intentos de inicio de sesión fallidos (Fuerza Bruta)',
            expiresAt
          }
        });

        if (wasCreated) {
          void notifyAdminsOfIpBlock({ ipAddress: targetIp, reason: blockedIp.reason });
        }

        console.log(`[SECURITY LOG] Auto-banning IP por fuerza bruta: ${targetIp}`);
        await SecurityLog.create({
          eventType: 'AUTO_BAN',
          ipAddress: targetIp,
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

// Middleware para detectar y bloquear intentos de acceso a archivos sensibles (Sniffing/Honeypot)
export const sniffingDetector = async (req, res, next) => {
  const sensitivePaths = [
    '/.env', '/.git', '/.git/config', '/wp-config.php', '/wp-admin', 
    '/config.json', '/docker-compose.yml', '/package.json', 
    '/.aws/credentials', '/phpinfo.php', '/.htaccess'
  ];

  // Convert to lower case for case-insensitive check
  const url = req.originalUrl.toLowerCase();
  
  const isSensitive = sensitivePaths.some(path => url.includes(path));

  if (isSensitive) {
    const ip = getClientIp(req);
    if (!ip) return res.status(403).end();
    
    // Auto-ban IP permanently
    try {
      const [blockedIp, wasCreated] = await IpBlacklist.findOrCreate({
        where: { ipAddress: ip },
        defaults: {
          reason: 'Autobloqueo: Intento de Sniffing a archivo sensible (' + url + ')',
          expiresAt: null
        }
      });

      if (wasCreated) {
        void notifyAdminsOfIpBlock({ ipAddress: ip, reason: blockedIp.reason });
      }

      await logSecurityEvent({
        eventType: 'AUTO_BAN_SNIFFING',
        ipAddress: ip,
        userId: null,
        userAgent: req.headers['user-agent'] || 'Unknown',
        details: 'IP bloqueada automaticamente por intentar acceder a ruta restringida: ' + req.originalUrl
      });
      
      return res.status(403).json({ error: 'Acceso denegado. IP bloqueada por politicas de ciberseguridad.' });
    } catch (error) {
      console.error('Error in sniffingDetector:', error);
      return res.status(403).end();
    }
  }

  next();
};
