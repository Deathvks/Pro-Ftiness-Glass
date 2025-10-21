/* backend/controllers/nutritionController.js */
import db from '../models/index.js';
import { Op } from 'sequelize';
import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer'; // Importación necesaria para 'instanceof multer.MulterError'
import { fileURLToPath } from 'url';

// Simulación de __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener modelos desde db
const { NutritionLog, WaterLog, sequelize } = db;

// Helper para asegurar que el directorio de subida existe
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'images', 'food');

const ensureUploadDirExists = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch (error) {
    // Si el directorio no existe, lo creamos recursivamente
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
};

/**
 * Obtiene todos los registros de nutrición y agua para una fecha específica.
 */
const getNutritionLogsByDate = async (req, res, next) => {
  try {
    const { date } = req.query;
    const { userId } = req.user;

    if (!date) {
      return res.status(400).json({
        error: 'La fecha es requerida.',
      });
    }

    const nutritionLogs = await NutritionLog.findAll({
      where: {
        user_id: userId,
        log_date: date,
      },
      // --- INICIO DE LA MODIFICACIÓN (YA APLICADA) ---
      // Usamos 'id' en lugar de 'created_at' para compatibilidad
      order: [
        ['meal_type', 'ASC'],
        ['id', 'ASC'],
      ],
      // --- FIN DE LA MODIFICACIÓN ---
    });

    const waterLog = await WaterLog.findOne({
      where: {
        user_id: userId,
        log_date: date,
      },
    });

    res.json({
      nutrition: nutritionLogs,
      water: waterLog,
    });

  } catch (error) {
    next(error);
  }
};

// --- INICIO DE LA MODIFICACIÓN (NUEVA FUNCIÓN) ---
/**
 * Obtiene las comidas registradas recientemente por el usuario.
 * Devuelve una lista de las últimas 20 comidas únicas (por descripción).
 */
const getRecentMeals = async (req, res, next) => {
  try {
    const { userId } = req.user;

    // 1. Obtenemos los últimos 50 registros (para tener variedad)
    const recentLogs = await NutritionLog.findAll({
      where: {
        user_id: userId,
      },
      limit: 50,
      order: [['id', 'DESC']], // Ordenamos por ID descendente (más recientes primero)
      attributes: [
        'id',
        'description',
        'calories',
        'protein_g',
        'carbs_g',
        'fats_g',
        'weight_g',
        'image_url',
      ],
    });

    // 2. Filtramos para obtener entradas únicas basadas en 'description' (ignorando may/min)
    const uniqueMeals = [];
    const descriptionsSeen = new Set();

    for (const log of recentLogs) {
      const lowerCaseDescription = log.description.toLowerCase();
      if (!descriptionsSeen.has(lowerCaseDescription)) {
        descriptionsSeen.add(lowerCaseDescription);
        uniqueMeals.push(log);
      }
    }

    // 3. Devolvemos las últimas 20 comidas únicas
    res.json(uniqueMeals.slice(0, 20));

  } catch (error) {
    next(error);
  }
};
// --- FIN DE LA MODIFICACIÓN ---


/**
 * Obtiene un resumen de datos de nutrición para un mes y año.
 */
const getNutritionSummary = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        error: 'El mes y el año son requeridos.',
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const nutritionSummary = await NutritionLog.findAll({
      where: {
        user_id: userId,
        log_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        ['log_date', 'date'],
        [sequelize.fn('sum', sequelize.col('calories')), 'total_calories'],
        [sequelize.fn('sum', sequelize.col('protein_g')), 'total_protein'],
        [sequelize.fn('sum', sequelize.col('carbs_g')), 'total_carbs'],
        [sequelize.fn('sum', sequelize.col('fats_g')), 'total_fats'],
      ],
      group: ['log_date'],
      order: [['log_date', 'ASC']],
    });

    const waterSummary = await WaterLog.findAll({
      where: {
        user_id: userId,
        log_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: ['log_date', 'quantity_ml'],
      order: [['log_date', 'ASC']],
    });

    res.json({ nutritionSummary, waterSummary });

  } catch (error) {
    next(error);
  }
};

/**
 * Añade un nuevo registro de comida.
 */
const addFoodLog = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const {
      log_date,
      meal_type,
      description,
      calories,
      protein_g,
      carbs_g,
      fats_g,
      weight_g,
      image_url,
    } = req.body;

    const foodData = {
      user_id: userId,
      log_date,
      meal_type,
      description,
      calories: calories || null,
      protein_g: protein_g || null,
      carbs_g: carbs_g || null,
      fats_g: fats_g || null,
      weight_g: weight_g || null,
      image_url: image_url || null,
    };

    const newLog = await NutritionLog.create(foodData);
    res.status(201).json(newLog);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza un registro de comida existente.
 */
const updateFoodLog = async (req, res, next) => {
  try {
    const { logId } = req.params;
    const { userId } = req.user;

    const log = await NutritionLog.findOne({
      where: {
        id: logId,
        user_id: userId,
      },
    });
    if (!log) {
      return res
        .status(404)
        .json({ error: 'Registro de comida no encontrado.' });
    }

    const {
      description,
      calories,
      protein_g,
      carbs_g,
      fats_g,
      weight_g,
      image_url,
      meal_type,
      log_date,
    } = req.body;

    const foodData = {
      description,
      calories: calories || null,
      protein_g: protein_g || null,
      carbs_g: carbs_g || null,
      fats_g: fats_g || null,
      weight_g: weight_g || null,
      image_url: image_url || null,
      meal_type,
      log_date,
    };

    await log.update(foodData);
    res.json(log);
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina un registro de comida.
 */
const deleteFoodLog = async (req, res, next) => {
  try {
    const { logId } = req.params;
    const { userId } = req.user;

    const log = await NutritionLog.findOne({
      where: {
        id: logId,
        user_id: userId,
      },
    });
    if (!log) {
      return res
        .status(404)
        .json({ error: 'Registro de comida no encontrado.' });
    }

    await log.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Añade o actualiza la cantidad de agua para un día.
 */
const upsertWaterLog = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { log_date, quantity_ml } = req.body;

    if (!log_date || quantity_ml === undefined) {
      return res
        .status(400)
        .json({ error: 'Fecha y cantidad son requeridas.' });
    }

    let waterLog = await WaterLog.findOne({
      where: {
        user_id: userId,
        log_date,
      },
    });
    if (waterLog) {
      waterLog.quantity_ml = quantity_ml;
      await waterLog.save();
    } else {
      waterLog = await WaterLog.create({
        user_id: userId,
        log_date,
        quantity_ml,
      });
    }
    res.json(waterLog);
  } catch (error) {
    next(error);
  }
};

/**
 * Busca un producto por su código de barras usando la API de Open Food Facts.
 */
const searchByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    const apiUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

    const response = await axios.get(apiUrl);

    if (response.data.status === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    const product = response.data.product;
    const nutriments = product.nutriments;

    const foodData = {
      name: product.product_name || 'Nombre no disponible',
      calories: nutriments['energy-kcal_100g'] || 0,
      protein_g: nutriments.proteins_100g || 0,
      carbs_g: nutriments.carbohydrates_100g || 0,
      fats_g: nutriments.fat_100g || 0,
      weight_g: 100,
    };

    res.json(foodData);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        error: 'Producto no encontrado en la base de datos de Open Food Facts.',
      });
    }
    next(error);
  }
};

/**
 * Sube una imagen de comida y devuelve la URL.
 */
const uploadFoodImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
    }

    await ensureUploadDirExists();

    const fileExtension = path.extname(req.file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);

    await fs.writeFile(filePath, req.file.buffer);

    const imageUrl = `${req.protocol}://${req.get(
      'host'
    )}/images/food/${uniqueFilename}`;

    res.status(201).json({ imageUrl });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      return res
        .status(400)
        .json({ error: `Error de Multer: ${error.message}` });
    }
    if (error.message.includes('Formato de imagen no válido')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// --- INICIO DE LA MODIFICACIÓN ---
// Agrupar todas las funciones en un 'export default'
// Añadir 'getRecentMeals' a la exportación
export default {
  getNutritionLogsByDate,
  getRecentMeals, // <-- Añadido
  getNutritionSummary,
  addFoodLog,
  updateFoodLog,
  deleteFoodLog,
  upsertWaterLog,
  searchByBarcode,
  uploadFoodImage,
};
// --- FIN DE LA MODIFICACIÓN ---