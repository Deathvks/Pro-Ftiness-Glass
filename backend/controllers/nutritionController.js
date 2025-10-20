import db from '../models/index.js'; // CAMBIO: Importar db
import { Op } from 'sequelize'; // CAMBIO: Sintaxis import
import axios from 'axios'; // CAMBIO: Sintaxis import
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid'; // CAMBIO: Sintaxis import
import multer from 'multer';
import { fileURLToPath } from 'url'; // CAMBIO: Requerido para __dirname

// CAMBIO: Simulación de __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CAMBIO: Obtener modelos desde db
const { NutritionLog, WaterLog, sequelize } = db;

// --- INICIO DE LA MODIFICACIÓN ---
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
// --- FIN DE LA MODIFICACIÓN ---


/**
 * Obtiene todos los registros de nutrición y agua para una fecha específica.
 */
// CAMBIO: Quitar 'exports.' y definir como 'const'
const getNutritionLogsByDate = async (req, res, next) => {
    try {
        const {
            date
        } = req.query;
        const userId = req.user.id;

        if (!date) {
            return res.status(400).json({
                error: 'La fecha es requerida.'
            });
        }

        const nutritionLogs = await NutritionLog.findAll({
            where: {
                user_id: userId,
                log_date: date
            },
            order: [
                ['meal_type', 'ASC'],
                ['created_at', 'ASC']
            ],
        });

        const waterLog = await WaterLog.findOne({
            where: {
                user_id: userId,
                log_date: date
            }
        });

        res.json({
            food: nutritionLogs,
            water: waterLog ? waterLog.quantity_ml : 0
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtiene un resumen de datos de nutrición para un mes y año.
 */
// CAMBIO: Quitar 'exports.' y definir como 'const'
const getNutritionSummary = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const {
            month,
            year
        } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                error: "El mes y el año son requeridos."
            });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const summary = await NutritionLog.findAll({
            where: {
                user_id: userId,
                log_date: {
                    [Op.between]: [startDate, endDate],
                },
            },
            attributes: [
                'log_date', [sequelize.fn('sum', sequelize.col('calories')), 'total_calories'],
            ],
            group: ['log_date'],
            order: [
                ['log_date', 'ASC']
            ],
        });

        res.json(summary);
    } catch (error) {
        next(error);
    }
};


/**
 * Añade un nuevo registro de comida.
 */
// CAMBIO: Quitar 'exports.' y definir como 'const'
const addFoodLog = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const foodData = { ...req.body,
            user_id: userId
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
// CAMBIO: Quitar 'exports.' y definir como 'const'
const updateFoodLog = async (req, res, next) => {
    try {
        const {
            logId
        } = req.params;
        const userId = req.user.id;
        const foodData = req.body;

        const log = await NutritionLog.findOne({
            where: {
                id: logId,
                user_id: userId
            }
        });
        if (!log) {
            return res.status(404).json({
                error: 'Registro de comida no encontrado.'
            });
        }

        await log.update(foodData);
        res.json(log);
    } catch (error) {
        next(error);
    }
};

/**
 * Elimina un registro de comida.
 */
// CAMBIO: Quitar 'exports.' y definir como 'const'
const deleteFoodLog = async (req, res, next) => {
    try {
        const {
            logId
        } = req.params;
        const userId = req.user.id;

        const log = await NutritionLog.findOne({
            where: {
                id: logId,
                user_id: userId
            }
        });
        if (!log) {
            return res.status(404).json({
                error: 'Registro de comida no encontrado.'
            });
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
// CAMBIO: Quitar 'exports.' y definir como 'const'
const upsertWaterLog = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const {
            log_date,
            quantity_ml
        } = req.body;

        if (!log_date || quantity_ml === undefined) {
            return res.status(400).json({
                error: 'Fecha y cantidad son requeridas.'
            });
        }

        let waterLog = await WaterLog.findOne({
            where: {
                user_id: userId,
                log_date
            }
        });
        if (waterLog) {
            waterLog.quantity_ml = quantity_ml;
            await waterLog.save();
        } else {
            waterLog = await WaterLog.create({
                user_id: userId,
                log_date,
                quantity_ml
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
// CAMBIO: Quitar 'exports.' y definir como 'const'
const searchByBarcode = async (req, res, next) => {
    try {
        const {
            barcode
        } = req.params;
        const apiUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

        const response = await axios.get(apiUrl);

        if (response.data.status === 0) {
            return res.status(404).json({
                error: 'Producto no encontrado.'
            });
        }

        const product = response.data.product;
        const nutriments = product.nutriments;

        // Mapear los datos de la API a nuestro formato
        const foodData = {
            description: product.product_name || 'Nombre no disponible',
            calories: nutriments['energy-kcal_100g'] || 0,
            protein: nutriments.proteins_100g || 0,
            carbs: nutriments.carbohydrates_100g || 0,
            fats: nutriments.fat_100g || 0,
            weight_g: 100, // Por defecto, los valores son por 100g
        };

        res.json(foodData);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return res.status(404).json({
                error: 'Producto no encontrado en la base de datos de Open Food Facts.'
            });
        }
        next(error);
    }
};


// --- INICIO DE LA MODIFICACIÓN ---
/**
 * Sube una imagen de comida y devuelve la URL.
 */
// CAMBIO: Quitar 'exports.' y definir como 'const'
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
        const imageUrl = `${req.protocol}://${req.get('host')}/images/food/${uniqueFilename}`;

        res.status(201).json({ imageUrl });

    } catch (error) {
        // Capturar errores específicos de Multer (ej: tamaño de archivo)
        if (error instanceof multer.MulterError) {
             return res.status(400).json({ error: `Error de Multer: ${error.message}` });
        }
        // Capturar otros errores personalizados (ej: formato de archivo)
        if (error.message.includes('Formato de imagen no válido')) {
            return res.status(400).json({ error: error.message });
        }
        next(error);
    }
};
// --- FIN DE LA MODIFICACIÓN ---

// CAMBIO: Agrupar todas las funciones en un 'export default'
export default {
    getNutritionLogsByDate,
    getNutritionSummary,
    addFoodLog,
    updateFoodLog,
    deleteFoodLog,
    upsertWaterLog,
    searchByBarcode,
    uploadFoodImage
};