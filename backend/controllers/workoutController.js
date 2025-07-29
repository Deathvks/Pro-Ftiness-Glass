import { validationResult } from 'express-validator';
import models from '../models/index.js';

const { WorkoutLog, WorkoutLogDetail, WorkoutLogSet, PersonalRecord, sequelize } = models;

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

export const logWorkoutSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { routineName, duration_seconds, calories_burned, details, notes } = req.body;
  const { userId } = req.user;
  const t = await sequelize.transaction();

  try {
    const newWorkoutLog = await WorkoutLog.create({
      user_id: userId,
      routine_name: routineName,
      workout_date: new Date(),
      duration_seconds,
      calories_burned,
      notes // <-- Campo de notas añadido
    }, { transaction: t });

    let newPRs = [];

    for (const exercise of details) {
      let totalVolume = 0;
      let bestSetWeight = 0;

      if (exercise.setsDone && exercise.setsDone.length > 0) {
        exercise.setsDone.forEach(set => {
          const weight = parseFloat(set.weight_kg) || 0;
          const reps = parseInt(set.reps, 10) || 0;
          totalVolume += weight * reps;
          if (weight > bestSetWeight) {
            bestSetWeight = weight;
          }
        });
      }

      const newLogDetail = await WorkoutLogDetail.create({
        workout_log_id: newWorkoutLog.id,
        exercise_name: exercise.exerciseName,
        total_volume: totalVolume,
        best_set_weight: bestSetWeight,
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

      if (bestSetWeight > 0) {
        const existingPR = await PersonalRecord.findOne({
          where: {
            user_id: userId,
            exercise_name: exercise.exerciseName
          },
          transaction: t
        });

        if (!existingPR) {
          await PersonalRecord.create({
            user_id: userId,
            exercise_name: exercise.exerciseName,
            weight_kg: bestSetWeight,
            date: new Date()
          }, { transaction: t });
          newPRs.push({ exercise: exercise.exerciseName, weight: bestSetWeight });
        } else if (bestSetWeight > existingPR.weight_kg) {
          existingPR.weight_kg = bestSetWeight;
          existingPR.date = new Date();
          await existingPR.save({ transaction: t });
          newPRs.push({ exercise: exercise.exerciseName, weight: bestSetWeight });
        }
      }
    }

    await t.commit();
    res.status(201).json({ 
        message: 'Entrenamiento guardado con éxito', 
        workoutId: newWorkoutLog.id,
        newPRs: newPRs
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al guardar el entrenamiento:", error);
    res.status(500).json({ error: 'Error al guardar el entrenamiento' });
  }
};

export const updateWorkoutLog = async (req, res) => {
    res.status(501).json({ error: 'Funcionalidad de editar no implementada todavía.' });
};

export const deleteWorkoutLog = async (req, res) => {
    const { workoutId } = req.params;
    const { userId } = req.user;
    try {
        const workoutLog = await WorkoutLog.findOne({ where: { id: workoutId, user_id: userId }});
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