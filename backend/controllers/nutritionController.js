import db from '../models/index.js';
import { Op } from 'sequelize';
import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
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
      order: [
        ['meal_type', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });

    const waterLog = await WaterLog.findOne({
      where: {
        user_id: userId, 
        log_date: date,
      },
    });

    // --- INICIO DE LA MODIFICACIÓN ---
    // Devolvemos el objeto 'waterLog' completo (o null) en lugar de 'waterLog.quantity_ml' o 0.
    // El dataSlice del frontend (nutrition.water || { quantity_ml: 0 }) gestionará el null.
    res.json({
      nutrition: nutritionLogs, // Renombrado de 'food' a 'nutrition' para coincidir con dataSlice
      water: waterLog,
    });
    // --- FIN DE LA MODIFICACIÓN ---

  } catch (error) {
    next(error);
  }
};

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

    // --- INICIO DE LA MODIFICACIÓN ---
    // Renombrado 'summary' a 'nutritionSummary' y añadido 'waterSummary' 
    // para coincidir con lo que espera el frontend (dataSlice).
    const nutritionSummary = await NutritionLog.findAll({
      where: {
        user_id: userId, 
        log_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        'log_date',
        [sequelize.fn('sum', sequelize.col('calories')), 'total_calories'],
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
    // --- FIN DE LA MODIFICACIÓN ---

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

    // --- INICIO DE LA MODIFICACIÓN ---
    // Sanitizamos el 'body' para coger solo los campos que el modelo 'NutritionLog' espera.
    // Esto evita errores 500 si el frontend envía campos extra (como 'tempId', 'isFavorite', etc.).
    const {
      log_date,
      meal_type,
      description,
      calories,
      protein_g,
      carbs_g,
      fats_g,
      weight_g,
      image_url, // Este es el nuevo campo
    } = req.body;

    // Construimos el objeto de datos explícitamente.
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
      image_url: image_url || null, // Permitir que image_url sea null
    };
    // --- FIN DE LA MODIFICACIÓN ---

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

    // --- INICIO DE LA MODIFICACIÓN ---
    // Sanitizamos el 'body' aquí también para la actualización.
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
    // --- FIN DE LA MODIFICACIÓN ---

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

    // --- INICIO DE LA MODIFICACIÓN ---
    // Renombrado de campos para coincidir con nuestro modelo (protein -> protein_g, etc.)
    const foodData = {
      name: product.product_name || 'Nombre no disponible', // 'name' es lo que espera el frontend
      calories: nutriments['energy-kcal_100g'] || 0,
      protein_g: nutriments.proteins_100g || 0,
      carbs_g: nutriments.carbohydrates_100g || 0,
      fats_g: nutriments.fat_100g || 0,
      weight_g: 100, // Por defecto, los valores son por 100g
    };
    // --- FIN DE LA MODIFICACIÓN ---

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

    // Asegurarse de que el directorio de subida existe
    await ensureUploadDirExists();

    // Generar un nombre de archivo único para evitar colisiones
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);

    // Guardar el buffer de la imagen en el sistema de archivos
    await fs.writeFile(filePath, req.file.buffer);

    // Construir la URL pública para acceder a la imagen
    // Esta URL depende de cómo se sirvan los archivos estáticos en Express
    // --- INICIO DE LA MODIFICACIÓN ---
    // Aseguramos que la URL devuelta sea relativa al servidor
    // El frontend ya tiene la API_BASE_URL (http://localhost:3001/api)
    // El servidor estático de express sirve '/images'
    // PERO, la API base ya incluye /api, y el servidor estático no.
    // Devolvemos la URL completa
    const imageUrl = `${req.protocol}://${req.get(
      'host'
    )}/images/food/${uniqueFilename}`;
    // --- FIN DE LA MODIFICACIÓN ---

    res.status(201).json({ imageUrl });
  } catch (error) {
    // Capturar errores específicos de Multer (ej: tamaño de archivo)
    if (error instanceof multer.MulterError) {
      return res
        .status(400)
        .json({ error: `Error de Multer: ${error.message}` });
    }
    // Capturar otros errores personalizados (ej: formato de archivo)
    if (error.message.includes('Formato de imagen no válido')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// Agrupar todas las funciones en un 'export default'
export default {
  getNutritionLogsByDate,
  getNutritionSummary,
  addFoodLog,
  updateFoodLog,
  deleteFoodLog,
  upsertWaterLog,
  searchByBarcode,
  uploadFoodImage,
};