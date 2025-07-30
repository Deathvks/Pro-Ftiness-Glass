import models from '../models/index.js';

const { PersonalRecord } = models;

// Obtener todos los récords personales del usuario con paginación
export const getPersonalRecords = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6; // Límite de 6 récords por página
    const offset = (page - 1) * limit;

    // Usamos findAndCountAll para obtener los registros y el conteo total
    const { count, rows } = await PersonalRecord.findAndCountAll({
      where: { user_id: req.user.userId },
      order: [['exercise_name', 'ASC']],
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
    console.error("Error al obtener los récords personales:", error);
    res.status(500).json({ error: 'Error al obtener los récords personales' });
  }
};

const personalRecordController = {
    getPersonalRecords
};

export default personalRecordController;