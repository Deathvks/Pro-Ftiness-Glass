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
const __dirname = path.dirname(__filename); // Esto será /app/backend/controllers

// Obtener modelos desde db
const { NutritionLog, WaterLog, sequelize } = db;

// Helper para asegurar que el directorio de subida existe
// La ruta es correcta: /app/backend/public/images/food
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
        ['id', 'ASC'],
      ],
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
    const result = uniqueMeals.slice(0, 20);
    res.json(result);

  } catch (error)
 {
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
      // Nuevos campos opcionales para datos por 100g
      calories_per_100g,
      protein_per_100g,
      carbs_per_100g,
      fat_per_100g, // Corregido: nombre de la columna en BD
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
      // Incluir los campos por 100g si existen
      calories_per_100g: calories_per_100g || null,
      protein_per_100g: protein_per_100g || null,
      carbs_per_100g: carbs_per_100g || null,
      fat_per_100g: fat_per_100g || null, // Corregido: nombre columna
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
      // Campos por 100g (pueden venir o no)
      calories_per_100g,
      protein_per_100g,
      carbs_per_100g,
      fat_per_100g, // Corregido: nombre columna
    } = req.body;

    const foodData = {
      description,
      calories: calories === null ? null : (parseFloat(calories) || 0),
      protein_g: protein_g === null ? null : (parseFloat(protein_g) || 0),
      carbs_g: carbs_g === null ? null : (parseFloat(carbs_g) || 0),
      fats_g: fats_g === null ? null : (parseFloat(fats_g) || 0),
      weight_g: weight_g === null ? null : (parseFloat(weight_g) || null), // Mantener null si es 0 o inválido
      image_url: image_url || null,
      // Incluir campos por 100g si se proporcionan en el body
      ...(calories_per_100g !== undefined && { calories_per_100g: parseFloat(calories_per_100g) || null }),
      ...(protein_per_100g !== undefined && { protein_per_100g: parseFloat(protein_per_100g) || null }),
      ...(carbs_per_100g !== undefined && { carbs_per_100g: parseFloat(carbs_per_100g) || null }),
      ...(fat_per_100g !== undefined && { fat_per_100g: parseFloat(fat_per_100g) || null }), // Corregido: nombre columna
    };

    // Filtrar undefined para no intentar actualizar con ellos
    Object.keys(foodData).forEach(key => foodData[key] === undefined && delete foodData[key]);


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

    if (!log_date || quantity_ml === undefined || quantity_ml < 0) { // Añadida validación quantity_ml >= 0
      return res
        .status(400)
        .json({ error: 'Fecha y cantidad (mayor o igual a 0) son requeridas.' });
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
  const { barcode } = req.params;
  // --- LOG 1: Código de barras recibido ---
  console.log(`[Barcode Search] Received barcode: ${barcode}`);

  try {
    // Usamos v2 y pedimos campos específicos
    const fields = [
        'product_name', 'product_name_es', 'generic_name', 'brands', // Nombres
        'nutriments', // Todos los nutrientes
        'serving_quantity', 'serving_size', // Información de ración
        'image_url', 'image_front_url', // Imágenes
    ].join(',');
    const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${fields}`;

    console.log(`[Barcode Search] Requesting URL: ${apiUrl}`); // Log de la URL

    const response = await axios.get(apiUrl);

    // --- LOG 2: Respuesta RAW de la API externa ---
    console.log(`[Barcode Search] Raw data received from external API for ${barcode}:`, JSON.stringify(response.data, null, 2));


    // Chequeo si el producto existe en la respuesta v2
    if (response.data.status === 0 || !response.data.product || Object.keys(response.data.product).length === 0) {
        console.log(`[Barcode Search] Product not found in OFF for barcode: ${barcode}`);
        return res.status(404).json({ error: 'Producto no encontrado en la base de datos externa.' });
    }

    const product = response.data.product;
    const nutriments = product.nutriments || {};

    // Construcción de productData con fallbacks y prioridades
    const productData = {
        name: product.product_name_es || product.product_name || product.generic_name || product.brands || 'Producto escaneado',
        // Datos por 100g (intentar varias claves)
        calories_per_100g: nutriments['energy-kcal_100g'] ?? (nutriments['energy-kj_100g'] ? nutriments['energy-kj_100g'] / 4.184 : null) ?? null,
        protein_per_100g: nutriments.proteins_100g ?? null,
        carbs_per_100g: nutriments.carbohydrates_100g ?? null,
        fat_per_100g: nutriments.fat_100g ?? nutriments.fats_100g ?? null, // Usar fat_100g o fats_100g
        // Datos por ración (intentar varias claves)
        calories_per_serving: nutriments['energy-kcal_serving'] ?? (nutriments['energy-kj_serving'] ? nutriments['energy-kj_serving'] / 4.184 : null) ?? null,
        protein_per_serving: nutriments.proteins_serving ?? null,
        carbs_per_serving: nutriments.carbohydrates_serving ?? null,
        fat_per_serving: nutriments.fat_serving ?? nutriments.fats_serving ?? null, // Usar fat_serving o fats_serving
        // Info de la ración
        serving_quantity: parseFloat(product.serving_quantity) || null,
        serving_size: product.serving_size || null, // Texto descriptivo
        // Imagen
        image_url: product.image_url || product.image_front_url || null,
        // Mantener acceso a nutriments completos por si acaso
        // nutriments: nutriments // Descomentar si el frontend necesita más datos
        status: response.data.status, // Incluir status original
        product: product // Incluir producto original por si acaso
    };

     // Redondeos opcionales (si prefieres redondear en backend)
     // Object.keys(productData).forEach(key => {
     //    if (key.startsWith('calories') && productData[key] !== null) productData[key] = Math.round(productData[key]);
     //    else if (typeof productData[key] === 'number' && key !== 'status' && key !== 'serving_quantity') productData[key] = parseFloat(productData[key].toFixed(1));
     // });


    // --- LOG 3: Datos a enviar al frontend ---
    console.log(`[Barcode Search] Data being sent to frontend for ${barcode}:`, JSON.stringify(productData, null, 2));

    res.json(productData);

  } catch (error) {
    // --- LOG (Error general) ---
    console.error(`[Barcode Search] Error processing barcode ${barcode}:`, error.message);
    if (error.stack) {
         console.error(error.stack);
    }
    // Si el error es de Axios y tiene una respuesta
    if (axios.isAxiosError(error) && error.response) {
        console.error(`[Barcode Search] Axios response status: ${error.response.status}`);
        console.error(`[Barcode Search] Axios response data:`, JSON.stringify(error.response.data, null, 2));
        if (error.response.status === 404) {
             return res.status(404).json({ error: 'Producto no encontrado en la base de datos externa (404).' });
        }
         return res.status(error.response.status || 500).json({ error: 'Error al contactar la base de datos externa.' });
    }
    // Otros errores (red, parsing, etc.)
    next(error); // Dejar que el middleware de errores general lo maneje
  }
};


/**
 * Sube una imagen de comida y devuelve la URL relativa.
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

    // Construir la URL relativa
    const imageUrl = `/images/food/${uniqueFilename}`;

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
    console.error("Error en uploadFoodImage:", error); // Log añadido
    next(error);
  }
};

// Agrupar todas las funciones en un 'export default'
export default {
  getNutritionLogsByDate,
  getRecentMeals,
  getNutritionSummary,
  addFoodLog,
  updateFoodLog,
  deleteFoodLog,
  upsertWaterLog,
  searchByBarcode,
  uploadFoodImage,
};