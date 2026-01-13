/* backend/controllers/bodyMeasurementController.js */
import { validationResult } from 'express-validator';
import models from '../models/index.js';
import { Op } from 'sequelize';
import { addXp } from '../services/gamificationService.js';

const { BodyMeasurementLog } = models;

// Helper: Buscar log de un tipo específico para hoy (usado solo para update)
const findTodayLog = (userId, measureType) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return BodyMeasurementLog.findOne({
        where: {
            user_id: userId,
            measure_type: measureType,
            log_date: {
                [Op.gte]: today,
                [Op.lt]: tomorrow,
            },
        },
    });
};

export const getMeasurementHistory = async (req, res, next) => {
    try {
        const { type } = req.query;
        const whereClause = { user_id: req.user.userId };

        if (type) {
            whereClause.measure_type = type;
        }

        const history = await BodyMeasurementLog.findAll({
            where: whereClause,
            order: [['log_date', 'DESC']],
        });
        res.json(history);
    } catch (error) {
        next(error);
    }
};

export const logMeasurement = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { measure_type, value, unit } = req.body;
    const { userId } = req.user;

    try {
        // 1. Crear SIEMPRE un nuevo registro (Historial completo)
        const newLog = await BodyMeasurementLog.create({
            user_id: userId,
            measure_type,
            value,
            unit: unit || 'cm',
            log_date: new Date(),
        });

        // 2. Gamificación: 5 XP por MÚSCULO al día
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const previousLogsOfMuscleToday = await BodyMeasurementLog.count({
            where: {
                user_id: userId,
                measure_type: measure_type,
                log_date: {
                    [Op.between]: [startOfDay, endOfDay]
                },
                id: { [Op.ne]: newLog.id }
            }
        });

        let xpAdded = 0;

        if (previousLogsOfMuscleToday === 0) {
            try {
                await addXp(userId, 5, `Medida registrada: ${measure_type}`);
                xpAdded = 5;
            } catch (gError) {
                console.error('Error gamificación measurement:', gError);
            }
        }

        // Devolvemos el objeto del log Y la cantidad de XP añadida
        res.status(201).json({ ...newLog.toJSON(), xpAdded });
    } catch (error) {
        next(error);
    }
};

export const updateTodayMeasurement = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { measure_type, value } = req.body;
    const { userId } = req.user;

    try {
        const logToUpdate = await BodyMeasurementLog.findOne({
            where: {
                user_id: userId,
                measure_type: measure_type,
                log_date: {
                    [Op.gte]: new Date().setHours(0, 0, 0, 0)
                }
            },
            order: [['log_date', 'DESC']]
        });

        if (!logToUpdate) {
            return res.status(404).json({ error: `No hay registro de ${measure_type} hoy para editar.` });
        }

        logToUpdate.value = value;
        await logToUpdate.save();

        res.json(logToUpdate);
    } catch (error) {
        next(error);
    }
};

export const deleteMeasurement = async (req, res, next) => {
    const { id } = req.params;
    const { userId } = req.user;

    try {
        const log = await BodyMeasurementLog.findOne({ where: { id, user_id: userId } });
        if (!log) return res.status(404).json({ error: 'Medida no encontrada' });

        await log.destroy();
        res.json({ message: 'Medida eliminada' });
    } catch (error) {
        next(error);
    }
};

const bodyMeasurementController = {
    getMeasurementHistory,
    logMeasurement,
    updateTodayMeasurement,
    deleteMeasurement
};

export default bodyMeasurementController;