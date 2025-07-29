import { validationResult } from 'express-validator';
import models from '../models/index.js';
import { Op } from 'sequelize';

const { BodyWeightLog } = models;

// Obtener el historial de peso del usuario logueado
export const getBodyWeightHistory = async (req, res) => {
  try {
    const history = await BodyWeightLog.findAll({
      where: { user_id: req.user.userId },
      order: [['log_date', 'DESC']],
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el historial de peso' });
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
export const logBodyWeight = async (req, res) => {
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
      weight_kg: weight, // Se guarda en la columna 'weight_kg' de la BBDD
      log_date: new Date(),
    });

    res.status(201).json(newLog);
  } catch (error) {
    console.error('Error al registrar el peso:', error);
    res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
  }
};

// Actualizar el registro de peso del día de hoy
export const updateTodayBodyWeight = async (req, res) => {
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
    console.error('Error al actualizar el peso:', error);
    res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
  }
};

const bodyweightController = {
  getBodyWeightHistory,
  logBodyWeight,
  updateTodayBodyWeight
};

export default bodyweightController;