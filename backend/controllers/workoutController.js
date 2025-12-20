/* backend/controllers/workoutController.js */
import { validationResult } from 'express-validator';
import { Op } from 'sequelize'; // Importamos Op para los operadores de consulta
import models from '../models/index.js';
// --- INICIO MODIFICACIÓN: Importar servicios de gamificación ---
import { addXp, checkStreak, unlockBadge, WORKOUT_COMPLETION_XP } from '../services/gamificationService.js';
// --- FIN MODIFICACIÓN ---

// --- INICIO DE LA MODIFICACIÓN (Lógica 1RM) ---
// Importamos la función para calcular el 1RM desde el frontend (ajusta la ruta si es necesario)
// Asumimos que existe una forma de compartir/importar esta función en el backend.
// Si no es así, duplicaremos la función aquí.
const calculate1RM = (weight, reps) => {
  const weightNum = parseFloat(weight);
  const repsNum = parseInt(reps, 10);
  if (isNaN(weightNum) || isNaN(repsNum) || weightNum <= 0 || repsNum <= 0) {
    return 0;
  }
  const estimated1RM = weightNum * (1 + repsNum / 30);
  return Math.round(estimated1RM * 100) / 100;
};
// --- FIN DE LA MODIFICACIÓN ---

const { WorkoutLog, WorkoutLogDetail, WorkoutLogSet, PersonalRecord, sequelize } = models;

export const getWorkoutHistory = async (req, res, next) => {
  try {
    // --- INICIO DE LA MODIFICACIÓN (Filtros Fecha) ---
    // Recibimos los parámetros de fecha del query string
    const { date, startDate, endDate } = req.query;

    // Construimos la condición base (siempre filtrar por usuario)
    const whereCondition = { user_id: req.user.userId };

    if (date) {
      // Si nos llega una fecha específica (YYYY-MM-DD), filtramos por ese día completo.
      // Parseamos los componentes manualmente para crear la fecha en hora local del servidor,
      // coincidiendo con la lógica de 'logWorkoutSession' que usa new Date(y, m, d).
      const [year, month, day] = date.split('-').map(Number);

      const startOfDay = new Date(year, month - 1, day);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(year, month - 1, day);
      endOfDay.setHours(23, 59, 59, 999);

      whereCondition.workout_date = {
        [Op.between]: [startOfDay, endOfDay]
      };
    } else if (startDate && endDate) {
      // Soporte retrocompatible para rangos
      whereCondition.workout_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    // Si no hay parámetros de fecha, devolverá todo el historial (comportamiento por defecto antiguo),
    // pero ahora el frontend siempre envía 'date'.

    const history = await WorkoutLog.findAll({
      where: whereCondition, // Aplicamos el filtro dinámico
      include: [{
        model: WorkoutLogDetail,
        as: 'WorkoutLogDetails',
        include: [{
          model: WorkoutLogSet,
          as: 'WorkoutLogSets',
          order: [['set_number', 'ASC']], // Asegura que las series se ordenen correctamente
        }],
        order: [['id', 'ASC']], // Asegura el orden de los ejercicios
      }],
      order: [['workout_date', 'DESC']],
    });
    // --- FIN DE LA MODIFICACIÓN ---

    // --- INICIO DE LA MODIFICACIÓN (LÓGICA 1RM EXISTENTE) ---
    // Convertir a JSON plano para poder modificarlo antes de enviarlo
    const plainHistory = history.map(log => log.get({ plain: true }));

    // Iterar sobre los resultados para calcular el 1RM si falta
    plainHistory.forEach(log => {
      if (log.WorkoutLogDetails) {
        log.WorkoutLogDetails.forEach(detail => {
          // Si estimated_1rm no existe o es 0/null, lo calculamos al vuelo
          if (!detail.estimated_1rm) {

            let bestSetWeight = 0;
            let bestSetFor1RM = null;

            if (detail.WorkoutLogSets && detail.WorkoutLogSets.length > 0) {
              detail.WorkoutLogSets.forEach(set => {
                const weight = parseFloat(set.weight_kg) || 0;
                const reps = parseInt(set.reps, 10) || 0;
                // --- CAMBIO: Ignorar series de calentamiento para el cálculo ---
                const isWarmup = set.is_warmup;

                if (weight > 0 && reps > 0 && !isWarmup) {
                  if (weight > bestSetWeight) {
                    bestSetWeight = weight;
                    bestSetFor1RM = set;
                  }
                  // Esta lógica es la misma que en logWorkoutSession
                  else if (weight === bestSetWeight && reps > (parseInt(bestSetFor1RM?.reps, 10) || 0)) {
                    bestSetFor1RM = set;
                  }
                }
              });
            }

            if (bestSetFor1RM) {
              // Asignamos el valor calculado al objeto que se enviará al frontend
              detail.estimated_1rm = calculate1RM(bestSetFor1RM.weight_kg, bestSetFor1RM.reps);
            }
            // Si no hay series válidas, se quedará como null (o 0 si calculate1RM lo devuelve)
          }
        });
      }
    });

    res.json(plainHistory); // Enviamos el historial modificado
    // --- FIN DE LA MODIFICACIÓN ---

  } catch (error) {
    next(error);
  }
};

export const logWorkoutSession = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { routineName, duration_seconds, calories_burned, details, notes, routineId } = req.body;
  const { userId } = req.user;
  const t = await sequelize.transaction();

  try {
    // Crear fecha local sin zona horaria para evitar problemas de conversión
    const today = new Date();
    const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const newWorkoutLog = await WorkoutLog.create({
      user_id: userId,
      routine_name: routineName,
      routine_id: routineId,
      workout_date: localDate, // Usar la fecha local
      duration_seconds,
      calories_burned,
      notes
    }, { transaction: t });

    let newPRs = [];

    for (const exercise of details) {
      let totalVolume = 0;
      let bestSetWeight = 0;
      // --- INICIO DE LA MODIFICACIÓN ---
      let bestSetFor1RM = null; // Variable para guardar la mejor serie para el cálculo de 1RM
      // --- FIN DE LA MODIFICACIÓN ---

      if (exercise.setsDone && exercise.setsDone.length > 0) {
        exercise.setsDone.forEach(set => {
          const weight = parseFloat(set.weight_kg) || 0;
          const reps = parseInt(set.reps, 10) || 0;
          // --- CAMBIO: Detectar si es calentamiento ---
          const isWarmup = set.is_warmup === true || set.is_warmup === 'true';

          if (weight > 0 && reps > 0) { // Solo consideramos series válidas
            totalVolume += weight * reps;

            // --- CAMBIO: Solo consideramos para PR y 1RM si NO es calentamiento ---
            if (!isWarmup) {
              if (weight > bestSetWeight) {
                bestSetWeight = weight;
                // --- INICIO DE LA MODIFICACIÓN ---
                // Si este peso es el mayor hasta ahora, esta es la mejor serie para 1RM
                bestSetFor1RM = set;
                // --- FIN DE LA MODIFICACIÓN ---
              }
              // --- INICIO DE LA MODIFICACIÓN ---
              // Si el peso es el mismo pero las repeticiones son más,
              // esta serie también podría ser candidata para el 1RM (aunque Epley da el mismo resultado).
              // Lo guardamos por si acaso quisiéramos usar otra fórmula en el futuro.
              else if (weight === bestSetWeight && reps > (parseInt(bestSetFor1RM?.reps, 10) || 0)) {
                bestSetFor1RM = set;
              }
              // --- FIN DE LA MODIFICACIÓN ---
            }
          }
        });
      }

      // --- INICIO DE LA MODIFICACIÓN ---
      // Calculamos el 1RM estimado si encontramos una mejor serie válida
      let estimated1RM = null;
      if (bestSetFor1RM) {
        estimated1RM = calculate1RM(bestSetFor1RM.weight_kg, bestSetFor1RM.reps);
      }
      // --- FIN DE LA MODIFICACIÓN ---

      const newLogDetail = await WorkoutLogDetail.create({
        workout_log_id: newWorkoutLog.id,
        exercise_name: exercise.exerciseName,
        total_volume: totalVolume,
        best_set_weight: bestSetWeight, // Nota: Esto ahora excluye series de calentamiento
        superset_group_id: exercise.superset_group_id,
        // --- INICIO DE LA MODIFICACIÓN ---
        estimated_1rm: estimated1RM, // Guardamos el valor calculado
        // --- FIN DE LA MODIFICACIÓN ---
      }, { transaction: t });

      if (exercise.setsDone && exercise.setsDone.length > 0) {
        // Filtramos para guardar solo series que tengan datos válidos
        const setsToCreate = exercise.setsDone
          .filter(set => (set.reps !== '' && set.reps !== null) || (set.weight_kg !== '' && set.weight_kg !== null))
          .map(set => ({
            log_detail_id: newLogDetail.id,
            set_number: set.set_number,
            reps: parseInt(set.reps, 10) || 0, // Asegurar que sea número
            weight_kg: parseFloat(set.weight_kg) || 0, // Asegurar que sea número
            is_dropset: set.is_dropset || false,
            // --- CAMBIO: Guardamos el estado de calentamiento ---
            is_warmup: set.is_warmup || false,
          }));
        if (setsToCreate.length > 0) {
          await WorkoutLogSet.bulkCreate(setsToCreate, { transaction: t });
        }
      }

      // Lógica de PR (basada en bestSetWeight, no cambia)
      // Como bestSetWeight ahora excluye calentamiento, los PRs también lo harán.
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
            date: localDate // Usar fecha local
          }, { transaction: t });
          newPRs.push({ exercise: exercise.exerciseName, weight: bestSetWeight });
        } else if (bestSetWeight > existingPR.weight_kg) {
          existingPR.weight_kg = bestSetWeight;
          existingPR.date = localDate; // Usar fecha local
          await existingPR.save({ transaction: t });
          newPRs.push({ exercise: exercise.exerciseName, weight: bestSetWeight });
        }
      }
    }

    await t.commit();

    // --- INICIO MODIFICACIÓN: Gamificación Workout ---
    // Se ejecuta fuera de la transacción principal para no bloquear si falla
    try {
      // Usamos fecha YYYY-MM-DD consistente
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      await addXp(userId, WORKOUT_COMPLETION_XP, 'Entrenamiento completado'); // AÑADIDO: motivo
      await checkStreak(userId, todayStr);
      await unlockBadge(userId, 'first_workout');
    } catch (gamificationError) {
      console.error('Error al actualizar gamificación en workout:', gamificationError);
    }
    // --- FIN MODIFICACIÓN ---

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


export const updateWorkoutLog = async (req, res) => {
  // TODO: Si se implementa la edición, asegurarse de recalcular y guardar estimated_1rm.
  res.status(501).json({ error: 'Funcionalidad de editar no implementada todavía.' });
};

// --- INICIO DE LA CORRECCIÓN ---
// (La función deleteWorkoutLog ya fue corregida previamente y no necesita cambios adicionales para 1RM)
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

    // Guardamos una copia de los detalles antes de que sean borrados en cascada
    const exercisesInWorkout = [...workoutLog.WorkoutLogDetails];

    // Borramos el log (y sus detalles/series en cascada)
    await workoutLog.destroy({ transaction: t });

    // Ahora, recalculamos los PRs para los ejercicios afectados
    for (const deletedDetail of exercisesInWorkout) {
      const exerciseName = deletedDetail.exercise_name;

      // Buscamos si el récord actual fue establecido por el detalle que borramos
      const currentPR = await PersonalRecord.findOne({
        where: {
          user_id: userId,
          exercise_name: exerciseName
        },
        transaction: t
      });

      // Solo recalculamos si el PR actual podría haber sido el que acabamos de borrar.
      if (currentPR && currentPR.weight_kg <= deletedDetail.best_set_weight) {

        // Buscamos el nuevo mejor set en el resto de entrenamientos
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
          // Si encontramos un nuevo mejor, actualizamos el PR
          const newBestWorkout = await WorkoutLog.findByPk(newBestLogDetail.workout_log_id, { attributes: ['workout_date'], transaction: t });
          currentPR.weight_kg = newBestLogDetail.best_set_weight;
          currentPR.date = newBestWorkout.workout_date;
          await currentPR.save({ transaction: t });
        } else {
          // Si no quedan registros para ese ejercicio, borramos el PR
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
// --- FIN DE LA CORRECCIÓN ---


const workoutController = {
  getWorkoutHistory,
  logWorkoutSession,
  updateWorkoutLog,
  deleteWorkoutLog
};

export default workoutController;