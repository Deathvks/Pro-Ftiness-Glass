import { validationResult } from 'express-validator';
import models from '../models/index.js';

const { WorkoutLog, WorkoutLogDetail, WorkoutLogSet, sequelize } = models;

// Obtener el historial de entrenamientos del usuario
export const getWorkoutHistory = async (req, res) => {
  try {
    const history = await WorkoutLog.findAll({
      where: { user_id: req.user.userId },
      include: [{
        model: WorkoutLogDetail,
        as: 'WorkoutLogDetails',
        include: [{
          model: WorkoutLogSet,
          as: 'WorkoutLogSets'
        }]
      }],
      order: [['workout_date', 'DESC']],
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el historial de entrenamientos' });
  }
};

// Guardar una sesión de entrenamiento
export const logWorkoutSession = async (req, res) => {
  // --- INICIO: Manejo de validación ---
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // --- FIN ---

  const { routineName, duration_seconds, calories_burned, details } = req.body;
  const t = await sequelize.transaction();
  try {
    const newWorkoutLog = await WorkoutLog.create({
      user_id: req.user.userId,
      routine_name: routineName,
      workout_date: new Date(),
      duration_seconds,
      calories_burned
    }, { transaction: t });

    for (const exercise of details) {
      const newLogDetail = await WorkoutLogDetail.create({
        workout_log_id: newWorkoutLog.id,
        exercise_name: exercise.exerciseName
      }, { transaction: t });

      if (exercise.setsDone && exercise.setsDone.length > 0) {
        const setsToCreate = exercise.setsDone.map(set => ({
          log_detail_id: newLogDetail.id,
          set_number: set.set_number,
          reps: set.reps,
          weight_kg: set.weight_kg
        }));
        await WorkoutLogSet.bulkCreate(setsToCreate, { transaction: t });
      }
    }

    await t.commit();
    res.status(201).json({ message: 'Entrenamiento guardado con éxito', workoutId: newWorkoutLog.id });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Error al guardar el entrenamiento' });
  }
};

// Actualizar un entrenamiento (Soporte añadido para el futuro)
export const updateWorkoutLog = async (req, res) => {
    res.status(501).json({ error: 'Funcionalidad de editar no implementada todavía.' });
};

// Eliminar un registro de entrenamiento
export const deleteWorkoutLog = async (req, res) => {
    const { workoutId } = req.params;
    const { userId } = req.user;

    try {
        const workoutLog = await WorkoutLog.findOne({
            where: {
                id: workoutId,
                user_id: userId
            }
        });

        if (!workoutLog) {
            return res.status(404).json({ error: 'Registro de entrenamiento no encontrado.' });
        }

        await workoutLog.destroy();

        res.json({ message: 'Entrenamiento eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar el entrenamiento:', error);
        res.status(500).json({ error: 'Error interno del servidor al eliminar el entrenamiento.' });
    }
};

const workoutController = {
  getWorkoutHistory,
  logWorkoutSession,
  updateWorkoutLog,
  deleteWorkoutLog
};

export default workoutController;