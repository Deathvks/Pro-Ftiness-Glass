import { validationResult } from 'express-validator';
import models from '../models/index.js';

const { WorkoutLog, WorkoutLogDetail, WorkoutLogSet, PersonalRecord, sequelize } = models;

export const getWorkoutHistory = async (req, res, next) => {
  try {
    const history = await WorkoutLog.findAll({
      where: { user_id: req.user.userId },
      include: [{
        model: WorkoutLogDetail,
        as: 'WorkoutLogDetails',
        // --- INICIO DE LA MODIFICACIÓN ---
        // Se comenta temporalmente la inclusión de WorkoutLogSet para depurar
        // include: [{
        //   model: WorkoutLogSet,
        //   as: 'WorkoutLogSets',
        //   order: [['set_number', 'ASC']],
        // }],
        // --- FIN DE LA MODIFICACIÓN ---
        order: [['id', 'ASC']], // Ordenar detalles por ID
      }],
      order: [['workout_date', 'DESC']], // Ordenar logs por fecha
    });
    // Añadir manualmente las series vacías si la inclusión está comentada
    const historyWithEmptySets = history.map(log => {
        const logJson = log.toJSON(); // Convertir a objeto plano
        if (logJson.WorkoutLogDetails) {
            logJson.WorkoutLogDetails = logJson.WorkoutLogDetails.map(detail => ({
                ...detail,
                WorkoutLogSets: detail.WorkoutLogSets || [], // Asegura que WorkoutLogSets exista, aunque esté vacío
            }));
        }
        return logJson;
    });

    // res.json(history); // Devolvemos la versión modificada
    res.json(historyWithEmptySets);
  } catch (error) {
    console.error("Error en getWorkoutHistory:", error); // Añadir log para ver el error específico en backend
    next(error);
  }
};


// --- logWorkoutSession ---
export const logWorkoutSession = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { routineName, duration_seconds, calories_burned, details, notes, routineId } = req.body;
  const { userId } = req.user;
  const t = await sequelize.transaction();

  try {
    const today = new Date();
    // Corrección: Usar la fecha local sin manipular horas para evitar problemas de zona horaria al guardar
    const localDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    const newWorkoutLog = await WorkoutLog.create({
      user_id: userId,
      routine_name: routineName,
      routine_id: routineId,
      workout_date: localDate, // Guardar solo la fecha
      duration_seconds,
      calories_burned,
      notes
    }, { transaction: t });

    let newPRs = [];

    // Validar que 'details' existe y es un array antes de iterar
    if (details && Array.isArray(details)) {
        for (const exercise of details) {
          let totalVolume = 0;
          let bestSetWeight = 0;

          // Validar que 'setsDone' existe y es un array
          if (exercise.setsDone && Array.isArray(exercise.setsDone)) {
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
            superset_group_id: exercise.superset_group_id,
          }, { transaction: t });

          // Validar que 'setsDone' existe y tiene elementos antes de bulkCreate
          if (exercise.setsDone && exercise.setsDone.length > 0) {
            const setsToCreate = exercise.setsDone.map(set => ({
              log_detail_id: newLogDetail.id,
              set_number: set.set_number,
              reps: set.reps,
              weight_kg: set.weight_kg,
              set_type: set.set_type || null,
            }));
            await WorkoutLogSet.bulkCreate(setsToCreate, { transaction: t });
          }

          // Lógica de PR (sin cambios, pero dentro del bucle validado)
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
                date: localDate // Usar la misma fecha local
              }, { transaction: t });
              newPRs.push({ exercise: exercise.exerciseName, weight: bestSetWeight });
            } else if (bestSetWeight > parseFloat(existingPR.weight_kg)) { // Comparar como números
              existingPR.weight_kg = bestSetWeight;
              existingPR.date = localDate; // Usar la misma fecha local
              await existingPR.save({ transaction: t });
              newPRs.push({ exercise: exercise.exerciseName, weight: bestSetWeight });
            }
          }
        } // Fin del bucle for
    } // Fin de la validación de 'details'

    await t.commit();
    res.status(201).json({
      message: 'Entrenamiento guardado con éxito',
      workoutId: newWorkoutLog.id,
      newPRs: newPRs
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};


// --- updateWorkoutLog (sin cambios) ---
export const updateWorkoutLog = async (req, res) => {
  res.status(501).json({ error: 'Funcionalidad de editar no implementada todavía.' });
};

// --- deleteWorkoutLog (sin cambios, ya fue corregido antes) ---
export const deleteWorkoutLog = async (req, res, next) => {
  const { workoutId } = req.params;
  const { userId } = req.user;
  const t = await sequelize.transaction();

  try {
    const workoutLog = await WorkoutLog.findOne({
      where: { id: workoutId, user_id: userId },
      include: [{ model: WorkoutLogDetail, as: 'WorkoutLogDetails' }],
      transaction: t
    });

    if (!workoutLog) {
      await t.rollback();
      return res.status(404).json({ error: 'Registro de entrenamiento no encontrado.' });
    }

    const exercisesInWorkout = [...workoutLog.WorkoutLogDetails];
    await workoutLog.destroy({ transaction: t });

    for (const deletedDetail of exercisesInWorkout) {
      const exerciseName = deletedDetail.exercise_name;
      const currentPR = await PersonalRecord.findOne({
        where: { user_id: userId, exercise_name: exerciseName },
        transaction: t
      });

      if (currentPR && parseFloat(currentPR.weight_kg) <= parseFloat(deletedDetail.best_set_weight)) {
        const newBestLogDetail = await WorkoutLogDetail.findOne({
          include: [{
            model: WorkoutLog,
            as: 'WorkoutLog',
            where: { user_id: userId },
            attributes: []
          }],
          where: { exercise_name: exerciseName },
          order: [['best_set_weight', 'DESC']],
          transaction: t
        });

        if (newBestLogDetail) {
          const newBestWorkout = await WorkoutLog.findByPk(newBestLogDetail.workout_log_id, { attributes: ['workout_date'], transaction: t });
          currentPR.weight_kg = newBestLogDetail.best_set_weight;
          currentPR.date = newBestWorkout.workout_date;
          await currentPR.save({ transaction: t });
        } else {
          await currentPR.destroy({ transaction: t });
        }
      }
    }

    await t.commit();
    res.json({ message: 'Entrenamiento eliminado y récords recalculados correctamente.' });

  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const workoutController = {
  getWorkoutHistory,
  logWorkoutSession,
  updateWorkoutLog,
  deleteWorkoutLog
};

export default workoutController;