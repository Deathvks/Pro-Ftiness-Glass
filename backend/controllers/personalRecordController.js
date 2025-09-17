import models from '../models/index.js';
import { Op } from 'sequelize';

const { PersonalRecord } = models;

// --- INICIO DE LA MODIFICACIÓN ---
// Obtener todos los récords personales del usuario con paginación y filtro
export const getPersonalRecords = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6;
    const offset = (page - 1) * limit;
    const { exerciseName } = req.query; // Nuevo filtro

    const whereClause = { user_id: req.user.userId };
    if (exerciseName && exerciseName !== 'all') {
      whereClause.exercise_name = exerciseName;
    }

    const { count, rows } = await PersonalRecord.findAndCountAll({
      where: whereClause,
      order: [['date', 'DESC']], // Ordenamos por fecha descendente
      limit,
      offset,
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      records: rows,
    });
  } catch (error) {
    next(error);
  }
};

// Nueva función para obtener solo los nombres de los ejercicios con PRs
export const getPersonalRecordExerciseNames = async (req, res, next) => {
  try {
    const exercises = await PersonalRecord.findAll({
      where: { user_id: req.user.userId },
      attributes: [
        [models.sequelize.fn('DISTINCT', models.sequelize.col('exercise_name')), 'exercise_name']
      ],
      order: [['exercise_name', 'ASC']],
    });
    // Extraemos solo el array de nombres de los objetos
    const names = exercises.map(e => e.exercise_name);
    res.json(names);
  } catch (error) {
    next(error);
  }
};

const personalRecordController = {
  getPersonalRecords,
  getPersonalRecordExerciseNames, // Exportamos la nueva función
};
// --- FIN DE LA MODIFICACIÓN ---

export default personalRecordController;