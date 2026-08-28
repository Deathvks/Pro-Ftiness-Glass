import models from '../models/index.js';
const { SecurityLog, IpBlacklist } = models;
import { Op } from 'sequelize';

export const getSecurityStats = async (req, res) => {
  try {
    const totalLogs = await SecurityLog.count();
    const blockedIps = await IpBlacklist.count();
    
    // Contar intentos fallidos hoy
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const failedLoginsToday = await SecurityLog.count({
      where: {
        eventType: 'LOGIN_FAILED',
        createdAt: {
          [Op.gte]: startOfToday
        }
      }
    });

    res.json({
      totalLogs,
      blockedIps,
      failedLoginsToday
    });
  } catch (error) {
    console.error('Error fetching security stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

export const getLogs = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const logs = await SecurityLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching security logs:', error);
    res.status(500).json({ error: 'Error al obtener logs' });
  }
};

export const getBlacklist = async (req, res) => {
  try {
    const blacklist = await IpBlacklist.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(blacklist);
  } catch (error) {
    console.error('Error fetching blacklist:', error);
    res.status(500).json({ error: 'Error al obtener lista negra' });
  }
};

export const blockIp = async (req, res) => {
  try {
    const { ipAddress, reason } = req.body;
    if (!ipAddress) return res.status(400).json({ error: 'IP requerida' });

    await IpBlacklist.findOrCreate({
      where: { ipAddress },
      defaults: { reason: reason || 'Bloqueo manual por admin', expiresAt: null }
    });

    // Registrar acción
    await SecurityLog.create({
      eventType: 'ADMIN_MANUAL_BLOCK',
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userId: req.user.id, // req.user debe ser seteado por middleware auth
      userAgent: req.headers['user-agent'],
      details: `Admin bloqueó la IP: ${ipAddress}`
    });

    res.json({ message: 'IP bloqueada con éxito' });
  } catch (error) {
    console.error('Error blocking IP:', error);
    res.status(500).json({ error: 'Error al bloquear IP' });
  }
};

export const unblockIp = async (req, res) => {
  try {
    const { ip } = req.params;
    await IpBlacklist.destroy({ where: { ipAddress: ip } });
    
    // Registrar acción
    await SecurityLog.create({
      eventType: 'ADMIN_MANUAL_UNBLOCK',
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userId: req.user.id,
      userAgent: req.headers['user-agent'],
      details: `Admin desbloqueó la IP: ${ip}`
    });

    res.json({ message: 'IP desbloqueada con éxito' });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    res.status(500).json({ error: 'Error al desbloquear IP' });
  }
};
