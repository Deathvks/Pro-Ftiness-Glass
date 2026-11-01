/* backend/controllers/workoutController.js */
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import models from '../models/index.js';
import { processWorkoutGamification, processProgressiveOverload } from '../services/gamificationService.js';
import { createNotification } from '../services/notificationService.js';
import { sanitizePlainText } from '../utils/sanitizer.js';

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
    const { date, startDate, endDate, tzOffset } = req.query;
    const whereCondition = { user_id: req.user.userId };

    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      let startOfDay, endOfDay;

      if (tzOffset !== undefined && !isNaN(parseInt(tzOffset, 10))) {
        // Offset en minutos enviado por el cliente (ej: -120 para España UTC+2)
        const offsetMin = parseInt(tzOffset, 10);
        startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) + offsetMin * 60 * 1000);
        endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) + offsetMin * 60 * 1000);
      } else {
        startOfDay = new Date(year, month - 1, day);
        startOfDay.setHours(0, 0, 0, 0);
        endOfDay = new Date(year, month - 1, day);
        endOfDay.setHours(23, 59, 59, 999);
      }

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

    const rawRoutineName = routineName || routine_name || 'Entrenamiento Sin Nombre';
    const finalRoutineName = sanitizePlainText(rawRoutineName) || 'Entrenamiento Sin Nombre';

    const newWorkoutLog = await WorkoutLog.create({
      user_id: userId,
      routine_name: finalRoutineName,
      routine_id: routineId || null,
      workout_date: finalDate,
      duration_seconds,
      calories_burned,
      notes: notes ? sanitizePlainText(notes) : null,
      visibility: visibility || 'friends' 
    }, { transaction: t });

    let newPRs = [];
    let progressiveOverloads = [];
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
        exercise_name: sanitizePlainText(exercise.exerciseName || exercise.name || 'Ejercicio'),
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
            // --- NUEVO CAMPO RIR ---
            rir: set.rir !== undefined && set.rir !== null && set.rir !== '' ? parseFloat(set.rir) : null,
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
    const gamificationEvents = [];
    let xpAdded = 0;
    let workoutStreak = null;

    try {
      const workoutGamification = await processWorkoutGamification(userId, finalDate, finalRoutineName);
      if (workoutGamification) {
        if (workoutGamification.xpAdded > 0) {
          xpAdded += workoutGamification.xpAdded;
        }
        if (workoutGamification.streak !== undefined) {
          workoutStreak = workoutGamification.streak;
        }
        gamificationEvents.push({
          type: 'workout_completed',
          message: `${finalRoutineName} completado`,
          xpAdded: workoutGamification.xpAdded || 0,
          leveledUp: workoutGamification.leveledUp,
          newLevel: workoutGamification.level,
          streak: workoutGamification.streak
        });
      }
    } catch (gamificationErr) {
      console.error('Error procesando workout gamification:', gamificationErr);
    }

    try {
      const { trackChallenge } = await import('../services/challengeService.js');
      
      
        if (progressiveOverloads.length > 0) {
            const overloadRes = await trackChallenge(userId, 'daily_progressive_overload', progressiveOverloads.length);
            // Ya hemos dado los XP, así que no sumamos a xpAdded desde el reto, solo marcamos progreso.
        }

        const dailyWorkoutRes = await trackChallenge(userId, 'daily_workout', 1);
      if (dailyWorkoutRes.completedNow && dailyWorkoutRes.xpResult) {
        xpAdded += dailyWorkoutRes.xpResult.xpAdded;
        gamificationEvents.push({ 
          type: 'challenge_completed', 
          message: '¡A sudar!', 
          xpAdded: dailyWorkoutRes.xpResult.xpAdded,
          leveledUp: dailyWorkoutRes.xpResult.leveledUp,
          newLevel: dailyWorkoutRes.xpResult.level
        });
      }

      const weeklyWorkoutRes = await trackChallenge(userId, 'train_3_workouts_week', 1);
      if (weeklyWorkoutRes.completedNow && weeklyWorkoutRes.xpResult) {
        xpAdded += weeklyWorkoutRes.xpResult.xpAdded;
        gamificationEvents.push({ 
          type: 'challenge_completed', 
          message: 'Constancia pura', 
          xpAdded: weeklyWorkoutRes.xpResult.xpAdded,
          leveledUp: weeklyWorkoutRes.xpResult.leveledUp,
          newLevel: weeklyWorkoutRes.xpResult.level
        });
      }

      if (newWorkoutLog.visibility !== 'private') {
        const shareRes = await trackChallenge(userId, 'social_share_workout', 1);
        if (shareRes.completedNow && shareRes.xpResult) {
          xpAdded += shareRes.xpResult.xpAdded;
          gamificationEvents.push({ 
            type: 'challenge_completed', 
            message: 'Presume tu esfuerzo', 
            xpAdded: shareRes.xpResult.xpAdded,
            leveledUp: shareRes.xpResult.leveledUp,
            newLevel: shareRes.xpResult.level
          });
        }
      }
    } catch (gError) {
      console.error('Error gamification workout:', gError);
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

    
      // --- NOTIFICAR Y REGISTRAR SOBRECARGAS PROGRESIVAS ---
      for (const overload of progressiveOverloads) {
          xpAdded += overload.xp;
          
          const titleMsg = 'Sobrecarga Progresiva';
          const bodyMsg = overload.xp > 0 
             ? `¡Felicidades! Mantuviste el peso y lograste más repeticiones en ${overload.exercise}. Has ganado ${overload.xp} XP.`
             : `¡Felicidades! Mantuviste el peso y lograste más repeticiones en ${overload.exercise}. Sigue así.`;

          gamificationEvents.push({
              type: 'progressive_overload',
              title: titleMsg,
              message: bodyMsg,
              xpAdded: overload.xp
          });

          // Notificación In-App + Push
          try {
            await createNotification(userId, {
                type: 'progressive_overload',
                title: titleMsg,
                message: bodyMsg,
                data: { exercise: overload.exercise, xpAdded: overload.xp }
            });
          } catch (e) {
            console.error('Error enviando notificación de sobrecarga:', e);
          }
      }

      res.status(201).json({
      message: 'Entrenamiento guardado con éxito',
      workoutId: newWorkoutLog.id,
      newPRs: newPRs,
      xpAdded: xpAdded,
      streak: workoutStreak,
      gamification: gamificationEvents,
        gamificationEvents: gamificationEvents
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

export const importWorkouts = async (req, res, next) => {
  const { workouts, skipDuplicates = true } = req.body;
  const { userId } = req.user;

  if (!Array.isArray(workouts) || workouts.length === 0) {
    return res.status(400).json({ error: 'No se enviaron entrenamientos válidos para importar.' });
  }

  const t = await sequelize.transaction();

  try {
    let importedCount = 0;
    let skippedCount = 0;
    let totalSetsImported = 0;
    const prCandidates = new Map();

    for (const w of workouts) {
      const routineName = sanitizePlainText(w.routine_name || 'Entrenamiento Importado') || 'Entrenamiento Importado';
      const workoutDate = w.workout_date ? new Date(w.workout_date) : new Date();
      const finalDate = isNaN(workoutDate.getTime()) ? new Date() : workoutDate;

      if (skipDuplicates) {
        const rangeStart = new Date(finalDate.getTime() - 15 * 60 * 1000);
        const rangeEnd = new Date(finalDate.getTime() + 15 * 60 * 1000);
        const existing = await WorkoutLog.findOne({
          where: {
            user_id: userId,
            routine_name: routineName,
            workout_date: {
              [Op.between]: [rangeStart, rangeEnd]
            }
          },
          transaction: t
        });

        if (existing) {
          skippedCount++;
          continue;
        }
      }

      const durationSeconds = parseInt(w.duration_seconds, 10) || 3600;
      const notes = w.notes ? sanitizePlainText(String(w.notes)) : null;

      const newLog = await WorkoutLog.create({
        user_id: userId,
        routine_name: routineName,
        routine_id: null,
        workout_date: finalDate,
        duration_seconds: durationSeconds,
        calories_burned: null,
        notes: notes,
        visibility: 'private'
      }, { transaction: t });

      const exercises = w.details || w.exercises || [];

      for (const ex of exercises) {
        const exerciseName = sanitizePlainText(ex.exercise_name || ex.name || 'Ejercicio');
        const sets = ex.setsDone || ex.sets || [];

        let totalVolume = 0;
        let bestSetWeight = 0;
        let bestSetFor1RM = null;

        sets.forEach(set => {
          const weight = parseFloat(set.weight_kg) || 0;
          const reps = parseInt(set.reps, 10) || 0;
          const isWarmup = set.is_warmup === true || set.is_warmup === 'true' || set.is_warmup === 1;

          if (weight > 0 && reps > 0) {
            totalVolume += weight * reps;

            if (!isWarmup) {
              if (weight > bestSetWeight) {
                bestSetWeight = weight;
                bestSetFor1RM = set;
              } else if (weight === bestSetWeight && reps > (parseInt(bestSetFor1RM?.reps, 10) || 0)) {
                bestSetFor1RM = set;
              }
            }
          }
        });

        let estimated1RM = null;
        if (bestSetFor1RM) {
          estimated1RM = calculate1RM(bestSetFor1RM.weight_kg, bestSetFor1RM.reps);
        }

        const newDetail = await WorkoutLogDetail.create({
          workout_log_id: newLog.id,
          exercise_name: exerciseName,
          total_volume: totalVolume,
          best_set_weight: bestSetWeight,
          superset_group_id: ex.superset_group_id || null,
          estimated_1rm: estimated1RM
        }, { transaction: t });

        if (sets.length > 0) {
          const setsToCreate = sets.map((set, sIdx) => ({
            log_detail_id: newDetail.id,
            set_number: parseInt(set.set_number, 10) || sIdx + 1,
            reps: parseInt(set.reps, 10) || 0,
            weight_kg: parseFloat(set.weight_kg) || 0,
            is_dropset: !!set.is_dropset,
            is_warmup: !!set.is_warmup,
            rir: set.rir !== undefined && set.rir !== null && set.rir !== '' ? parseFloat(set.rir) : null
          }));

          await WorkoutLogSet.bulkCreate(setsToCreate, { transaction: t });
          totalSetsImported += setsToCreate.length;
        }

        if (bestSetWeight > 0) {
          const currentCandidate = prCandidates.get(exerciseName);
          if (!currentCandidate || bestSetWeight > currentCandidate.maxWeight) {
            prCandidates.set(exerciseName, { maxWeight: bestSetWeight, date: finalDate });
          }
        }
      }

      importedCount++;
    }

    // Actualizar o crear Récords Personales (PRs)
    for (const [exerciseName, prData] of prCandidates.entries()) {
      const existingPR = await PersonalRecord.findOne({
        where: { user_id: userId, exercise_name: exerciseName },
        transaction: t
      });

      if (!existingPR) {
        await PersonalRecord.create({
          user_id: userId,
          exercise_name: exerciseName,
          weight_kg: prData.maxWeight,
          date: prData.date
        }, { transaction: t });
      } else if (prData.maxWeight > existingPR.weight_kg) {
        existingPR.weight_kg = prData.maxWeight;
        existingPR.date = prData.date;
        await existingPR.save({ transaction: t });
      }
    }

    await t.commit();

    return res.json({
      success: true,
      importedCount,
      skippedCount,
      totalSetsImported,
      message: `Se importaron ${importedCount} entrenamientos correctamente${skippedCount > 0 ? ` (${skippedCount} omitidos por estar duplicados)` : ''}.`
    });

  } catch (error) {
    await t.rollback();
    next(error);
  }
};

export const exportWorkoutsCSV = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const history = await WorkoutLog.findAll({
      where: { user_id: userId },
      include: [{
        model: WorkoutLogDetail,
        as: 'WorkoutLogDetails',
        include: [{
          model: WorkoutLogSet,
          as: 'WorkoutLogSets',
          order: [['set_number', 'ASC']]
        }],
        order: [['id', 'ASC']]
      }],
      order: [['workout_date', 'DESC']]
    });

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = [
      'Date,Workout Name,Duration (min),Exercise Name,Set Order,Set Type,Weight (kg),Reps,RIR,Notes'
    ];

    for (const log of history) {
      const rawDate = log.workout_date ? new Date(log.workout_date) : new Date();
      const dateStr = !isNaN(rawDate.getTime()) ? rawDate.toISOString().replace('T', ' ').slice(0, 19) : '';
      const routineName = log.routine_name || 'Entrenamiento';
      const durationMin = log.duration_seconds ? Math.round(log.duration_seconds / 60) : 0;
      const workoutNotes = log.notes || '';

      const details = log.WorkoutLogDetails || [];
      for (const detail of details) {
        const exerciseName = detail.exercise_name || 'Ejercicio';
        const sets = detail.WorkoutLogSets || [];

        for (let i = 0; i < sets.length; i++) {
          const set = sets[i];
          let setType = 'Normal';
          if (set.is_warmup) setType = 'Calentamiento';
          else if (set.is_dropset) setType = 'Dropset';

          const row = [
            escapeCSV(dateStr),
            escapeCSV(routineName),
            escapeCSV(durationMin),
            escapeCSV(exerciseName),
            escapeCSV(set.set_number || i + 1),
            escapeCSV(setType),
            escapeCSV(set.weight_kg !== undefined ? set.weight_kg : 0),
            escapeCSV(set.reps !== undefined ? set.reps : 0),
            escapeCSV(set.rir !== null && set.rir !== undefined ? set.rir : ''),
            escapeCSV(workoutNotes)
          ];
          rows.push(row.join(','));
        }
      }
    }

    const csvContent = '\uFEFF' + rows.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="pro_fitness_glass_historial_${new Date().toISOString().split('T')[0]}.csv"`);
    return res.send(csvContent);

  } catch (error) {
    next(error);
  }
};

const workoutController = {
  getWorkoutHistory,
  logWorkoutSession,
  updateWorkoutLog,
  deleteWorkoutLog,
  importWorkouts,
  exportWorkoutsCSV
};

export default workoutController;