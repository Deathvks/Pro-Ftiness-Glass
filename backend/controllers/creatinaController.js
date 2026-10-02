/* backend/controllers/creatinaController.js */
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import models from '../models/index.js';
import { processCreatinaGamification } from '../services/gamificationService.js';
import { createNotification } from '../services/notificationService.js';

const { CreatinaLog } = models;

export const getCreatinaLogs = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;
    const where = { user_id: req.user.userId };

    if (startDate && endDate) {
      where.log_date = { [Op.between]: [startDate, endDate] };
    }

    const logs = await CreatinaLog.findAll({
      where,
      order: [['log_date', 'DESC'], ['id', 'DESC']],
      limit: (startDate && endDate) ? undefined : parseInt(limit)
    });

    res.json({ data: logs });
  } catch (error) {
    next(error);
  }
};

export const createCreatinaLog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const userId = req.user.userId;
    const { log_date, grams, notes } = req.body;

    const count = await CreatinaLog.count({ where: { user_id: userId, log_date } });
    if (count >= 2) return res.status(400).json({ error: 'Límite diario alcanzado (2 registros).' });

    const log = await CreatinaLog.create({ user_id: userId, log_date, grams, notes });

    // --- GAMIFICACIÓN ---
    const gamificationEvents = [];
    try {
      const result = await processCreatinaGamification(userId, log_date);

      if (result.xpAdded > 0) {
        gamificationEvents.push({ type: 'xp', amount: result.xpAdded, reason: 'Creatina registrada' });
      } else if (result.reason === 'daily_limit_reached') {
        // --- CAMBIO: Toast informativo cuando ya se ha alcanzado el límite ---
        gamificationEvents.push({
          type: 'info',
          message: 'Límite diario de experiencia por creatina alcanzado (2/2).'
        });
      }

      // Notificación Persistente (Campanita) solo al llegar al límite
      if (result.limitReachedNow) {
        await createNotification(userId, {
          type: 'warning',
          title: 'Límite de XP alcanzado',
          message: 'Has completado el límite diario de XP por creatina (2/2).',
          data: { type: 'xp_limit', reason: 'daily_creatina_limit' }
        });
      }

    } catch (err) {
      console.error('Error gamificación:', err);
    }

    res.status(201).json({ message: 'Registrado', log, gamification: gamificationEvents });
  } catch (error) {
    next(error);
  }
};

export const updateCreatinaLog = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const log = await CreatinaLog.findOne({ where: { id: req.params.id, user_id: req.user.userId } });
    if (!log) return res.status(404).json({ error: 'No encontrado' });

    await log.update(req.body);
    res.json({ message: 'Actualizado', log });
  } catch (error) {
    next(error);
  }
};

export const deleteCreatinaLog = async (req, res, next) => {
  try {
    const log = await CreatinaLog.findOne({ where: { id: req.params.id, user_id: req.user.userId } });
    if (!log) return res.status(404).json({ error: 'No encontrado' });

    await log.destroy();
    res.json({ message: 'Eliminado' });
  } catch (error) {
    next(error);
  }
};

export const getCreatinaStats = async (req, res, next) => {
  try {
    const logs = await CreatinaLog.findAll({
      where: { user_id: req.user.userId },
      order: [['log_date', 'DESC']]
    });

    if (!logs.length) return res.json({ data: { totalDays: 0, currentStreak: 0, averageGrams: 0, thisWeekDays: 0 } });

    const dailyMap = new Map();
    logs.forEach(l => dailyMap.set(l.log_date, (dailyMap.get(l.log_date) || 0) + parseFloat(l.grams)));

    const uniqueDates = [...dailyMap.keys()].sort((a, b) => b.localeCompare(a));
    const totalDays = uniqueDates.length;
    const totalGrams = [...dailyMap.values()].reduce((a, b) => a + b, 0);
    const averageGrams = totalGrams / totalDays;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0];
    let currentStreak = 0;

    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const diff = (new Date(uniqueDates[i]) - new Date(uniqueDates[i + 1])) / 864e5;
        if (Math.round(diff) === 1) currentStreak++;
        else break;
      }
    }

    const now = new Date();
    const day = now.getUTCDay() || 7;
    now.setUTCDate(now.getUTCDate() - day + 1);
    const mondayStr = now.toISOString().split('T')[0];
    const thisWeekDays = uniqueDates.filter(d => d >= mondayStr).length;

    res.json({ data: { totalDays, currentStreak, averageGrams, thisWeekDays } });
  } catch (error) {
    next(error);
  }
};

export default { getCreatinaLogs, createCreatinaLog, updateCreatinaLog, deleteCreatinaLog, getCreatinaStats };