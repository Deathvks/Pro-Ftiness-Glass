import models from '../models/index.js';
const { SecurityLog, IpBlacklist } = models;
import { Op } from 'sequelize';
import sequelize from '../db.js';

export const getSecurityStats = async (req, res) => {
  try {
    const { range = 30 } = req.query; // días
    const days = parseInt(range, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Borrado automático de logs de ÉXITO antiguos (> 30 días) para no saturar DB
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await SecurityLog.destroy({
      where: {
        eventType: 'LOGIN_SUCCESS',
        createdAt: { [Op.lt]: thirtyDaysAgo }
      }
    });

    const totalLogs = await SecurityLog.count({ where: { createdAt: { [Op.gte]: startDate } } });
    const blockedIps = await IpBlacklist.count();
    
    // Contadores
    const failedLogins = await SecurityLog.count({
      where: { eventType: 'LOGIN_FAILED', createdAt: { [Op.gte]: startDate } }
    });
    
    const successfulLogins = await SecurityLog.count({
      where: { eventType: { [Op.in]: ['LOGIN_SUCCESS', 'REGISTER_SUCCESS'] }, createdAt: { [Op.gte]: startDate } }
    });

    const autoBans = await SecurityLog.count({
      where: { eventType: 'AUTO_BAN', createdAt: { [Op.gte]: startDate } }
    });

    // Gráfico de ataques vs accesos exitosos agrupados por fecha
    const chartDataRaw = await SecurityLog.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        'eventType',
        [sequelize.fn('COUNT', '*'), 'count']
      ],
      where: {
        createdAt: { [Op.gte]: startDate },
        eventType: { [Op.in]: ['LOGIN_FAILED', 'LOGIN_SUCCESS', 'REGISTER_SUCCESS'] }
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt')), 'eventType'],
      raw: true
    });

    // Procesar datos para Recharts: [{ date: '2023-10-01', success: 15, failure: 2 }]
    const chartMap = {};
    // Rellenar días vacíos
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      chartMap[dateStr] = { date: dateStr, success: 0, failure: 0 };
    }

    chartDataRaw.forEach(row => {
      const dateStr = row.date;
      if (!chartMap[dateStr]) chartMap[dateStr] = { date: dateStr, success: 0, failure: 0 };
      
      if (row.eventType === 'LOGIN_SUCCESS' || row.eventType === 'REGISTER_SUCCESS') {
        chartMap[dateStr].success += parseInt(row.count, 10);
      }
      else if (row.eventType === 'LOGIN_FAILED') {
        chartMap[dateStr].failure += parseInt(row.count, 10);
      }
    });

    // Ordenar cronológicamente
    const chartData = Object.values(chartMap).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      totalLogs,
      blockedIps,
      failedLogins,
      successfulLogins,
      autoBans,
      chartData
    });
  } catch (error) {
    console.error('Error fetching security stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

export const getLogs = async (req, res) => {
  try {
    const { limit = 50, offset = 0, range = 30, type = 'ALL' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(range, 10));
    
    const whereClause = { createdAt: { [Op.gte]: startDate } };
    
    if (type === 'SUCCESS') {
      whereClause.eventType = { [Op.in]: ['LOGIN_SUCCESS', 'REGISTER_SUCCESS'] };
    } else if (type === 'ALERTS') {
      whereClause.eventType = { [Op.notIn]: ['LOGIN_SUCCESS', 'REGISTER_SUCCESS'] };
    }

    const logs = await SecurityLog.findAll({
      where: whereClause,
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
