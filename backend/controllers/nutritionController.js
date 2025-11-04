/* backend/controllers/nutritionController.js */
import db from '../models/index.js';
import { Op } from 'sequelize';
import axios from 'axios'; // Necesario para descargar la imagen
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid'; // Para nombres de archivo únicos
import multer from 'multer';
import sharp from 'sharp'; // Necesario para la conversión
import { fileURLToPath } from 'url';

// Simulación de __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // /app/backend/controllers

// Directorio donde se guardarán las imágenes de comida (incluyendo las de códigos de barras)
const FOOD_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'food');

// --- INICIO DE LA MODIFICACIÓN ---
// Obtener modelos desde db (Añadido FavoriteMeal)
const { NutritionLog, WaterLog, FavoriteMeal, sequelize } = db;
// --- FIN DE LA MODIFICACIÓN ---

// Helper para asegurar que el directorio de subida existe
const ensureUploadDirExists = async (dirPath) => {
    try {
        await fs.access(dirPath);
    } catch (error) {
        await fs.mkdir(dirPath, { recursive: true });
    }
};

/**
 * Descarga una imagen desde una URL, la convierte a WebP y la guarda localmente.
 * @param {string} imageUrl URL de la imagen original.
 * @param {string} outputDir Directorio donde guardar la imagen WebP.
 * @returns {Promise<string|null>} La URL relativa de la imagen WebP guardada o null si falla.
 */
const downloadAndConvertToWebP = async (imageUrl, outputDir) => {
    if (!imageUrl) return null;

    try {
        // Asegurar que el directorio existe
        await ensureUploadDirExists(outputDir);

        // Descargar la imagen
        const response = await axios({
            url: imageUrl,
            responseType: 'arraybuffer' // Importante para obtener los datos binarios
        });
        const imageBuffer = Buffer.from(response.data);

        // Generar nombre de archivo único para WebP
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const webpFilename = `barcode-${uniqueSuffix}.webp`;
        const outputPath = path.join(outputDir, webpFilename);

        // Convertir a WebP usando Sharp
        await sharp(imageBuffer)
            .resize(800, 800, { // Opcional: Redimensionar como las otras imágenes
                fit: sharp.fit.inside,
                withoutEnlargement: true
            })
            .webp({ quality: 75 })
            .toFile(outputPath);

        // Devolver la URL relativa
        return `/images/food/${webpFilename}`;

    } catch (error) {
        console.error(`Error al descargar o convertir la imagen ${imageUrl}:`, error.message);
        // Si falla la descarga o conversión, simplemente no tendremos imagen local.
        return null; // Devolvemos null para que el frontend sepa que no hay imagen local
    }
};


// --- getNutritionLogsByDate, getRecentMeals, getNutritionSummary (sin cambios) ---
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
const getRecentMeals = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recentLogs = await NutritionLog.findAll({
      where: {
        user_id: userId,
      },
      limit: 50,
      order: [['id', 'DESC']],
      attributes: [
        'id',
        'description',
        'calories',
        'protein_g',
        'carbs_g',
        'fats_g',
        'weight_g',
        'image_url',
        'micronutrients',
      ],
    });
    const uniqueMeals = [];
    const descriptionsSeen = new Set();
    for (const log of recentLogs) {
      const lowerCaseDescription = log.description.toLowerCase();
      if (!descriptionsSeen.has(lowerCaseDescription)) {
        descriptionsSeen.add(lowerCaseDescription);
        uniqueMeals.push(log);
      }
    }
    const result = uniqueMeals.slice(0, 20);
    res.json(result);
  } catch (error)
 {
    next(error);
  }
};
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
// --- Fin de funciones sin cambios ---

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
      image_url, // URL de código de barras o subida separada
      micronutrients,
      // --- INICIO MODIFICACIÓN: Recibimos los campos _per_100g ---
      calories_per_100g,
      protein_per_100g,
      carbs_per_100g,
      fat_per_100g
      // --- FIN MODIFICACIÓN ---
    } = req.body;

    // --- INICIO MODIFICACIÓN ---
    // Priorizar la imagen recién subida y procesada (req.file)
    // Si no hay, usar la image_url del body (de barcode/separada)
    // Si no, null.
    const finalImageUrl = (req.file && req.file.processedPath)
        ? req.file.processedPath
        : (image_url || null);
    // --- FIN MODIFICACIÓN ---

    const foodData = {
      user_id: userId,
      log_date,
      meal_type,
      description,
      calories: calories || 0, // Default a 0 si es null/undefined
      protein_g: protein_g || null,
      carbs_g: carbs_g || null,
      fats_g: fats_g || null,
      weight_g: weight_g || null,
      image_url: finalImageUrl, // Usamos la URL final
      micronutrients: micronutrients || null,
      // --- INICIO MODIFICACIÓN: Guardamos los campos _per_100g ---
      // (Asumiendo que NutritionLogModel tiene estos campos. 
      // Si no, la migración 20250905200000-fix-nutrition-tables-production.js 
      // debería haberlos añadido)
      calories_per_100g: calories_per_100g || null,
      protein_per_100g: protein_per_100g || null,
      carbs_per_100g: carbs_per_100g || null,
      fat_per_100g: fat_per_100g || null,
      // --- FIN MODIFICACIÓN ---
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
      image_url, // La URL del body (puede ser null o de barcode)
      meal_type,
      log_date,
      micronutrients,
      // --- INICIO MODIFICACIÓN: Recibimos los campos _per_100g ---
      calories_per_100g,
      protein_per_100g,
      carbs_per_100g,
      fat_per_100g
      // --- FIN MODIFICACIÓN ---
    } = req.body;

    // --- INICIO MODIFICACIÓN: Determinar la nueva URL y borrar la antigua ---
    const oldImageUrl = log.image_url;
    let newImageUrl;

    if (req.file && req.file.processedPath) {
        // 1. Si se subió un archivo nuevo, esa es la URL
        newImageUrl = req.file.processedPath;
    } else if (image_url !== undefined) {
        // 2. Si se pasó 'image_url' en el body (incluso si es null para borrarla)
        newImageUrl = image_url;
    } else {
        // 3. Si no vino ni archivo ni 'image_url' en el body, se mantiene la antigua
        newImageUrl = oldImageUrl;
    }

    // Si la URL antigua existe Y es diferente de la nueva
    if (oldImageUrl && oldImageUrl !== newImageUrl) {
      const oldImagePath = path.join(__dirname, '..', 'public', oldImageUrl);
      fs.unlink(oldImagePath).catch(err => {
        // Ignorar error si el archivo no existe (ENOENT), loguear otros errores
        if (err.code !== 'ENOENT') {
          console.error(`Error al borrar imagen antigua ${oldImagePath}:`, err);
        }
      });
    }
    // --- FIN MODIFICACIÓN ---

    const foodData = {
      description: description !== undefined ? description : log.description,
      calories: calories !== undefined ? calories : log.calories,
      protein_g: protein_g !== undefined ? protein_g : log.protein_g,
      carbs_g: carbs_g !== undefined ? carbs_g : log.carbs_g,
      fats_g: fats_g !== undefined ? fats_g : log.fats_g,
      weight_g: weight_g !== undefined ? weight_g : log.weight_g,
      image_url: newImageUrl, // Usamos la URL nueva o la mantenida
      meal_type: meal_type !== undefined ? meal_type : log.meal_type,
      log_date: log_date !== undefined ? log_date : log.log_date,
      micronutrients: micronutrients !== undefined ? micronutrients : log.micronutrients,
      // --- INICIO MODIFICACIÓN: Actualizamos los campos _per_100g ---
      calories_per_100g: calories_per_100g !== undefined ? calories_per_100g : log.calories_per_100g,
      protein_per_100g: protein_per_100g !== undefined ? protein_per_100g : log.protein_per_100g,
      carbs_per_100g: carbs_per_100g !== undefined ? carbs_per_100g : log.carbs_per_100g,
      fat_per_100g: fat_per_100g !== undefined ? fat_per_100g : log.fat_per_100g,
      // --- FIN MODIFICACIÓN ---
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

    // --- INICIO MODIFICACIÓN: Borrar imagen asociada si existe ---
    if (log.image_url) {
      const imagePath = path.join(__dirname, '..', 'public', log.image_url);
      fs.unlink(imagePath).catch(err => {
            if (err.code !== 'ENOENT') {
              console.error(`Error al borrar imagen ${imagePath} al eliminar log:`, err);
            }
      });
    }
    // --- FIN MODIFICACIÓN ---

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

    // Usamos findOrCreate para simplificar la lógica
    const [waterLog, created] = await WaterLog.findOrCreate({
        where: { user_id: userId, log_date },
        defaults: { quantity_ml }
    });

    // Si no fue creado, significa que existía, así que lo actualizamos
    if (!created) {
        waterLog.quantity_ml = quantity_ml;
        await waterLog.save();
    }

    res.json(waterLog);
  } catch (error) {
    next(error);
  }
};


/**
 * Busca un producto por su código de barras usando la API de Open Food Facts,
 * descarga su imagen, la convierte a WebP y la guarda localmente.
 */
const searchByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    console.log(`[BACKEND] Buscando código de barras: ${barcode}`);

    const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_es,generic_name,brands,image_url,image_front_url,serving_quantity,nutriments`;

    const response = await axios.get(apiUrl);
    console.log(`[BACKEND] Respuesta de OpenFoodFacts para ${barcode}:`, JSON.stringify(response.data, null, 2));


    if (!response.data || response.data.status === 0 || !response.data.product || !response.data.product.product_name) {
        console.log(`[BACKEND] Producto no encontrado en OFF para ${barcode}`);
        // Devolvemos 404 pero con un objeto 'product' vacío o con info mínima para consistencia
        return res.status(404).json({ product: { product_name: 'Producto no encontrado', nutriments: {}, image_url: null, serving_quantity: null } });
    }

    const product = response.data.product;
    const nutriments = product.nutriments || {};

    // --- INICIO MODIFICACIÓN: Descargar y convertir imagen ---
    const originalImageUrl = product.image_url || product.image_front_url || null;
    let localImageUrl = null;
    if (originalImageUrl) {
         console.log(`[BACKEND] Descargando y convirtiendo imagen para ${barcode}: ${originalImageUrl}`);
         localImageUrl = await downloadAndConvertToWebP(originalImageUrl, FOOD_IMAGES_DIR);
         console.log(`[BACKEND] Imagen local generada para ${barcode}: ${localImageUrl}`);
    } else {
         console.log(`[BACKEND] Producto ${barcode} no tiene imagen en OFF.`);
    }
    // --- FIN MODIFICACIÓN ---

    const foodData = {
      product_name: product.product_name_es || product.product_name || product.generic_name || product.brands || 'Producto escaneado',
      nutriments: nutriments,
      image_url: localImageUrl, // <-- Usamos la URL local procesada (o null)
      serving_quantity: product.serving_quantity || null
    };

    console.log(`[BACKEND] Datos procesados enviados al frontend para ${barcode}:`, JSON.stringify(foodData, null, 2));
    res.json({ product: foodData }); // Enviar objeto con clave 'product'

  } catch (error) {
    console.error(`[BACKEND] Error en searchByBarcode para ${req.params.barcode}:`, error.message);
    if (error.response) {
       console.error('[BACKEND] Detalles del error de respuesta:', error.response.status, error.response.data);
       if (error.response.status === 404) {
           return res.status(404).json({ product: { product_name: 'Producto no encontrado', nutriments: {}, image_url: null, serving_quantity: null } });
       }
    }
    // Para otros errores, pasamos al manejador global
    next(error);
  }
};

// uploadFoodImage ahora no es necesario como controlador separado,
// la lógica está en la ruta POST /food/image y en downloadAndConvertToWebP.
// Mantenemos la exportación por si se usa en otro lado, pero debería estar vacía o eliminarse.
const uploadFoodImage = async (req, res, next) => {
    // Esta función ya no se usa directamente en la ruta /food/image
    // La URL se devuelve directamente en esa ruta tras procesar con Sharp.
    console.warn("Llamada a uploadFoodImage - esta función está obsoleta y no debería usarse.");
    if (req.imageUrl) {
        res.status(201).json({ imageUrl: req.imageUrl });
    } else {
        res.status(400).json({ error: "No se procesó ninguna imagen." });
    }
};

// --- INICIO DE LA MODIFICACIÓN ---
/**
 * Busca en las comidas favoritas (guardadas) del usuario.
 */
const searchFoods = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { q } = req.query; // 'q' ya está validado por el router

    // Busca en las comidas favoritas del usuario
    const favoriteResults = await FavoriteMeal.findAll({
      where: {
        user_id: userId,
        // Asumimos que el modelo FavoriteMeal tiene un campo 'name'
        name: {
          [Op.iLike]: `%${q}%` // Búsqueda 'like' (case-insensitive en Postgres)
        }
      },
      limit: 20 // Limita los resultados
    });
    
    // La tabla FavoriteMeal ya debería tener todos los campos que
    // espera SearchResults.jsx (id, name, image_url, ..._per_100g)
    // porque se guardan desde el FoodEntryForm.
    res.json(favoriteResults);

  } catch (error) {
    console.error("Error en searchFoods:", error);
    next(error);
  }
};
// --- FIN DE LA MODIFICACIÓN ---


export default {
  getNutritionLogsByDate,
  getRecentMeals,
  getNutritionSummary,
  addFoodLog,
  updateFoodLog,
  deleteFoodLog,
  upsertWaterLog,
  searchByBarcode,
  uploadFoodImage, // Aunque obsoleta, la mantenemos por ahora
  searchFoods, // <-- Añadido
};