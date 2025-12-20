/* backend/controllers/bodyweightController.js */
import { validationResult } from 'express-validator';
import models from '../models/index.js';
import { Op } from 'sequelize';
// --- INICIO MODIFICACIÓN ---
import { addXp, checkStreak } from '../services/gamificationService.js';
// --- FIN MODIFICACIÓN ---

const { BodyWeightLog } = models;

// Obtener el historial de peso del usuario logueado
export const getBodyWeightHistory = async (req, res, next) => {
  try {
    const history = await BodyWeightLog.findAll({
      where: { user_id: req.user.userId },
      order: [['log_date', 'DESC']],
    });
    res.json(history);
  } catch (error) {
    next(error); // Pasar el error al middleware
  }
};

// Comprueba si ya existe un registro de peso para el día de hoy
const findTodayLog = (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Inicio del día
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Inicio del día siguiente

  return BodyWeightLog.findOne({
    where: {
      user_id: userId,
      log_date: {
        [Op.gte]: today,
        [Op.lt]: tomorrow,
      },
    },
  });
};

// Registrar un nuevo peso corporal (solo si no existe uno hoy)
export const logBodyWeight = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { weight } = req.body;
  const { userId } = req.user;

  try {
    const existingLog = await findTodayLog(userId);
    if (existingLog) {
      return res.status(409).json({ error: 'Ya existe un registro de peso para hoy. Por favor, edítalo.' });
    }

    const newLog = await BodyWeightLog.create({
      user_id: userId,
      weight_kg: weight,
      log_date: new Date(),
    });

    // --- INICIO MODIFICACIÓN: Gamificación ---
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      // AÑADIDO: motivo 'Peso registrado' (+10 XP)
      await addXp(userId, 10, 'Peso registrado');
      await checkStreak(userId, todayStr);
    } catch (gError) {
      console.error('Error gamificación en logBodyWeight:', gError);
    }
    // --- FIN MODIFICACIÓN ---

    res.status(201).json(newLog);
  } catch (error) {
    next(error); // Pasar el error al middleware
  }
};

// Actualizar el registro de peso del día de hoy
export const updateTodayBodyWeight = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { weight } = req.body;
  const { userId } = req.user;

  try {
    const logToUpdate = await findTodayLog(userId);
    if (!logToUpdate) {
      return res.status(404).json({ error: 'No se encontró un registro de peso para hoy.' });
    }

    logToUpdate.weight_kg = weight;
    await logToUpdate.save();

    res.json(logToUpdate);
  } catch (error) {
    next(error); // Pasar el error al middleware
  }
};

const bodyweightController = {
  getBodyWeightHistory,
  logBodyWeight,
  updateTodayBodyWeight
};

export default bodyweightController;