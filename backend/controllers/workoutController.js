/* backend/controllers/workoutController.js */
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import models from '../models/index.js';
import { processWorkoutGamification } from '../services/gamificationService.js';
import { createNotification } from '../services/notificationService.js';

// --- Función para calcular 1RM ---
const calculate1RM = (weight, reps) => {
  const weightNum = parseFloat(weight);
  const repsNum = parseInt(reps, 10);
  if (isNaN(weightNum) || isNaN(repsNum) || weightNum <= 0 || repsNum <= 0) {
    return 0;
  }
  const estimated1RM = weightNum * (1 + repsNum / 30);
  return Math.round(estimated1RM * 100) / 100;
};

// AÑADIDO: RoutineExercise para guardar las metas/recordatorios
const { WorkoutLog, WorkoutLogDetail, WorkoutLogSet, PersonalRecord, User, Friendship, RoutineExercise, sequelize } = models;

export const getWorkoutHistory = async (req, res, next) => {
  try {
    const { date, startDate, endDate } = req.query;
    const whereCondition = { user_id: req.user.userId };

    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day);
      endOfDay.setHours(23, 59, 59, 999);

      whereCondition.workout_date = {
        [Op.between]: [startOfDay, endOfDay]
      };
    } else if (startDate && endDate) {
      whereCondition.workout_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const history = await WorkoutLog.findAll({
      where: whereCondition,
      include: [{
        model: WorkoutLogDetail,
        as: 'WorkoutLogDetails',
        include: [{
          model: WorkoutLogSet,
          as: 'WorkoutLogSets',
          order: [['set_number', 'ASC']],
        }],
        order: [['id', 'ASC']],
      }],
      order: [['workout_date', 'DESC']],
    });

    const plainHistory = history.map(log => log.get({ plain: true }));

    // Cálculo de 1RM bajo demanda
    plainHistory.forEach(log => {
      if (log.WorkoutLogDetails) {
        log.WorkoutLogDetails.forEach(detail => {
          if (!detail.estimated_1rm) {
            let bestSetWeight = 0;
            let bestSetFor1RM = null;

            if (detail.WorkoutLogSets && detail.WorkoutLogSets.length > 0) {
              detail.WorkoutLogSets.forEach(set => {
                const weight = parseFloat(set.weight_kg) || 0;
                const reps = parseInt(set.reps, 10) || 0;
                // Normalizamos is_warmup
                const isWarmup = set.is_warmup === true || set.is_warmup === 'true' || set.is_warmup === 1;

                if (weight > 0 && reps > 0 && !isWarmup) {
                  if (weight > bestSetWeight) {
                    bestSetWeight = weight;
                    bestSetFor1RM = set;
                  }
                  else if (weight === bestSetWeight && reps > (parseInt(bestSetFor1RM?.reps, 10) || 0)) {
                    bestSetFor1RM = set;
                  }
                }
              });
            }

            if (bestSetFor1RM) {
              detail.estimated_1rm = calculate1RM(bestSetFor1RM.weight_kg, bestSetFor1RM.reps);
            }
          }
        });
      }
    });

    res.json(plainHistory);

  } catch (error) {
    next(error);
  }
};

export const logWorkoutSession = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    routineName, routine_name,
    workout_date, date,
    duration_seconds, calories_burned, details, exercises, notes, routineId,
    visibility, notifyFriends 
  } = req.body;

  const { userId } = req.user;
  
  // OPTIMIZACIÓN: Transacción para integridad de datos
  const t = await sequelize.transaction();

  try {
    let finalDate;
    const incomingDate = workout_date || date;

    if (incomingDate) {
      finalDate = new Date(incomingDate);
    } else {
      const today = new Date();
      finalDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    const finalRoutineName = routineName || routine_name || 'Entrenamiento Sin Nombre';

    const newWorkoutLog = await WorkoutLog.create({
      user_id: userId,
      routine_name: finalRoutineName,
      routine_id: routineId || null,
      workout_date: finalDate,
      duration_seconds,
      calories_burned,
      notes,
      visibility: visibility || 'friends' 
    }, { transaction: t });

    let newPRs = [];
    const exercisesToProcess = details || exercises || [];

    for (const exercise of exercisesToProcess) {
      let totalVolume = 0;
      let bestSetWeight = 0;
      let bestSetFor1RM = null;

      if (exercise.setsDone && exercise.setsDone.length > 0) {
        exercise.setsDone.forEach(set => {
          const weight = parseFloat(set.weight_kg) || 0;
          const reps = parseInt(set.reps, 10) || 0;
          const isWarmup = set.is_warmup === true || set.is_warmup === 'true' || set.is_warmup === 1;

          if (weight > 0 && reps > 0) {
            totalVolume += weight * reps;

            if (!isWarmup) {
              if (weight > bestSetWeight) {
                bestSetWeight = weight;
                bestSetFor1RM = set;
              }
              else if (weight === bestSetWeight && reps > (parseInt(bestSetFor1RM?.reps, 10) || 0)) {
                bestSetFor1RM = set;
              }
            }
          }
        });
      }

      let estimated1RM = null;
      if (bestSetFor1RM) {
        estimated1RM = calculate1RM(bestSetFor1RM.weight_kg, bestSetFor1RM.reps);
      }

      const newLogDetail = await WorkoutLogDetail.create({
        workout_log_id: newWorkoutLog.id,
        exercise_name: exercise.exerciseName || exercise.name, // Asegurar que pilla el nombre correcto
        total_volume: totalVolume,
        best_set_weight: bestSetWeight,
        superset_group_id: exercise.superset_group_id,
        estimated_1rm: estimated1RM,
      }, { transaction: t });

      if (exercise.setsDone && exercise.setsDone.length > 0) {
        const setsToCreate = exercise.setsDone
          .filter(set => (set.reps !== '' && set.reps !== null) || (set.weight_kg !== '' && set.weight_kg !== null))
          .map(set => ({
            log_detail_id: newLogDetail.id,
            set_number: set.set_number,
            reps: parseInt(set.reps, 10) || 0,
            weight_kg: parseFloat(set.weight_kg) || 0,
            is_dropset: set.is_dropset || false,
            is_warmup: set.is_warmup || false,
          }));
        
        if (setsToCreate.length > 0) {
          await WorkoutLogSet.bulkCreate(setsToCreate, { transaction: t });
        }
      }

      if (bestSetWeight > 0) {
        const exerciseNameSafe = exercise.exerciseName || exercise.name;
        const existingPR = await PersonalRecord.findOne({
          where: {
            user_id: userId,
            exercise_name: exerciseNameSafe
          },
          transaction: t
        });

        if (!existingPR) {
          await PersonalRecord.create({
            user_id: userId,
            exercise_name: exerciseNameSafe,
            weight_kg: bestSetWeight,
            date: finalDate
          }, { transaction: t });
          newPRs.push({ exercise: exerciseNameSafe, weight: bestSetWeight });
        } else if (bestSetWeight > existingPR.weight_kg) {
          existingPR.weight_kg = bestSetWeight;
          existingPR.date = finalDate;
          await existingPR.save({ transaction: t });
          newPRs.push({ exercise: exerciseNameSafe, weight: bestSetWeight });
        }
      }

      // --- GUARDAR RECORDATORIO/META (Actualizará a null si el frontend envía null) ---
      if (routineId && exercise.id && !isNaN(parseInt(exercise.id, 10))) {
        if (exercise.reminder !== undefined) {
          try {
            await RoutineExercise.update(
              { reminder: exercise.reminder || null },
              { 
                where: { 
                  id: exercise.id, 
                  routine_id: routineId 
                }, 
                transaction: t 
              }
            );
          } catch (err) {
            console.error(`Error al actualizar RoutineExercise:`, err);
          }
        }
      }
      // --------------------------------------------------------
    }

    // COMMIT TEMPRANO
    await t.commit();

    // Procesamos gamificación fuera de la transacción
    const gamificationResult = await processWorkoutGamification(userId, finalDate, finalRoutineName);

    const gamificationEvents = [];

    if (gamificationResult.xpAdded > 0) {
      gamificationEvents.push({
        type: 'xp',
        amount: gamificationResult.xpAdded,
        reason: `${finalRoutineName} completado`
      });
    }

    if (gamificationResult.limitReachedNow) {
      createNotification(userId, {
        type: 'warning',
        title: 'Límite de XP alcanzado',
        message: 'Has alcanzado el límite diario de XP por entrenamientos (2/2).',
        data: { type: 'xp_limit', reason: 'daily_workout_limit' }
      }).catch(err => console.error("Error notificando límite XP:", err));
    }

    if (gamificationResult.reason === 'daily_limit_reached') {
      gamificationEvents.push({
        type: 'info',
        message: 'Límite diario de experiencia alcanzado.'
      });
    }

    // Emitir actualización de muro por WebSocket solo si NO es privado
    if (newWorkoutLog.visibility !== 'private') {
      const io = req.app.get('io');
      if (io) {
          io.emit('feed_update');
      }

      // Lógica de notificaciones sociales
      try {
        await createNotification(userId, {
          type: 'success',
          title: '¡Entrenamiento publicado!',
          message: `Tu sesión "${finalRoutineName}" se ha subido al muro.`,
          data: { url: '/social?tab=feed' }
        });

        if (notifyFriends === true || notifyFriends === 'true') {
          const currentUser = await User.findByPk(userId, { attributes: ['username'] });
          if (currentUser) {
            const friendships = await Friendship.findAll({
              where: {
                status: 'accepted',
                [Op.or]: [{ requester_id: userId }, { addressee_id: userId }]
              }
            });

            const friendIds = friendships.map(f => f.requester_id === userId ? f.addressee_id : f.requester_id);
            
            const notificationPromises = friendIds.map(friendId => 
              createNotification(friendId, {
                type: 'info',
                title: 'Actividad de amigos',
                message: `${currentUser.username} ha completado: ${finalRoutineName}.`,
                data: { url: '/social?tab=feed' }
              })
            );
            
            await Promise.allSettled(notificationPromises);
          }
        }
      } catch (notifErr) {
        console.error("Error enviando notificaciones sociales de entrenamiento:", notifErr);
      }
    }

    res.status(201).json({
      message: 'Entrenamiento guardado con éxito',
      workoutId: newWorkoutLog.id,
      newPRs: newPRs,
      xpAdded: gamificationResult?.xpAdded || 0,
      gamification: gamificationEvents
    });

  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

export const updateWorkoutLog = async (req, res) => {
  res.status(501).json({ error: 'Funcionalidad de editar no implementada todavía.' });
};

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
      return res.status(404).json({ error: 'Registro no encontrado.' });
    }

    const exercisesInWorkout = [...workoutLog.WorkoutLogDetails];
    const routineIdToClear = workoutLog.routine_id; // Capturamos el ID de la rutina antes de destruirla

    await workoutLog.destroy({ transaction: t });

    for (const deletedDetail of exercisesInWorkout) {
      const exerciseName = deletedDetail.exercise_name;

      const currentPR = await PersonalRecord.findOne({
        where: {
          user_id: userId,
          exercise_name: exerciseName
        },
        transaction: t
      });

      if (currentPR && currentPR.weight_kg <= deletedDetail.best_set_weight) {
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
          const newBestWorkout = await WorkoutLog.findByPk(newBestLogDetail.workout_log_id, { 
            attributes: ['workout_date'], 
            transaction: t 
          });
          currentPR.weight_kg = newBestLogDetail.best_set_weight;
          currentPR.date = newBestWorkout.workout_date;
          await currentPR.save({ transaction: t });
        } else {
          await currentPR.destroy({ transaction: t });
        }
      }
    }

    // NUEVO: Si este entreno formaba parte de una rutina, limpiamos sus recordatorios
    if (routineIdToClear) {
      await RoutineExercise.update(
        { reminder: null },
        { 
          where: { routine_id: routineIdToClear }, 
          transaction: t 
        }
      );
    }

    await t.commit();

    const io = req.app.get('io');
    if (io) {
        io.emit('feed_update');
    }

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