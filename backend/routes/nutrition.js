/* backend/routes/nutrition.js */
import express from 'express';
// --- INICIO MODIFICACIÓN: Importar validationResult y reglas de validación ---
import { body, query, param, validationResult } from 'express-validator';
// --- FIN MODIFICACIÓN ---
import nutritionController from '../controllers/nutritionController.js';
import authenticateToken from '../middleware/authenticateToken.js';
import multer from 'multer';
// --- INICIO MODIFICACIÓN: Importar Sharp, path, fs y fileURLToPath ---
import path from 'path';
import fs from 'fs/promises'; // Usar promesas de fs
import sharp from 'sharp';
import { fileURLToPath } from 'url'; // Necesario para __dirname en ESM
// --- FIN MODIFICACIÓN ---

const router = express.Router();

// --- INICIO MODIFICACIÓN: Calcular __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Esto será /app/backend/routes
// --- FIN MODIFICACIÓN ---

// --- INICIO DE LA MODIFICACIÓN (Sharp para WebP en fotos de comida) ---

// Configuración de Multer para guardar temporalmente en memoria
const storage = multer.memoryStorage(); // Usar memoryStorage

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB para fotos de comida
    fileFilter: (req, file, cb) => {
        // Permitir jpeg, jpg, png, webp
        const allowedTypes = /jpeg|jpg|png|webp/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: Solo se permiten imágenes (jpeg, jpg, png, webp)!'));
    }
});

// Middleware para procesar la imagen de comida con Sharp y guardarla como WebP
const processAndSaveFoodImage = async (req, res, next) => {
    if (!req.file) {
        // Permitir continuar si no hay archivo, ya que la imagen es opcional
        return next();
    }

    try {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const webpFilename = `food-${uniqueSuffix}.webp`; // Nombre del archivo final será .webp
        const outputDir = path.join(__dirname, '..', 'public', 'images', 'food'); // Ruta de guardado corregida
        const outputPath = path.join(outputDir, webpFilename);

        // Asegurarse de que el directorio de uploads existe
        await fs.mkdir(outputDir, { recursive: true });

        // Procesar con Sharp: redimensionar a máx 800px y convertir a WebP
        await sharp(req.file.buffer)
            .rotate() // <--- CORRECCIÓN: Autocorregir rotación basada en EXIF
            .resize(800, 800, {
                fit: sharp.fit.inside,
                withoutEnlargement: true
            })
            .webp({ quality: 75 })
            .toFile(outputPath);

        // Guardar la URL relativa en req para el controlador
        // El controlador (nutritionController) deberá buscar esta ruta
        req.file.processedPath = `/images/food/${webpFilename}`; // Ruta relativa desde 'public'

        next();
    } catch (error) {
        console.error('Error procesando imagen de comida con Sharp:', error);
        return res.status(400).json({ error: 'Error al procesar la imagen.' });
    }
};

// --- FIN DE LA MODIFICACIÓN ---


// --- INICIO MODIFICACIÓN: Validaciones ---
// Validaciones reutilizables para datos de comida
const foodLogValidationRules = [
    body('description').trim().notEmpty().withMessage('La descripción es obligatoria.'),
    body('calories').isFloat({ min: 0 }).withMessage('Las calorías deben ser un número positivo o cero.'),
    body('protein_g').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Las proteínas deben ser un número positivo.'),
    body('carbs_g').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Los carbohidratos deben ser un número positivo.'),
    body('fats_g').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Las grasas deben ser un número positivo.'),
    body('weight_g').optional({ nullable: true }).isFloat({ min: 0.1 }).withMessage('El peso debe ser un número positivo.'),
    body('meal_type').isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Tipo de comida inválido.'),
    body('log_date').isISO8601().toDate().withMessage('Fecha inválida.'),
    // No validamos image_url aquí porque se maneja en la subida y se pasa al crear/actualizar
    body('micronutrients').optional({ nullable: true }).isObject().withMessage('Micronutrientes debe ser un objeto JSON.'),

    // --- INICIO: Validaciones para campos por 100g ---
    body('calories_per_100g').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Las calorías por 100g deben ser un número positivo.'),
    body('protein_per_100g').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Las proteínas por 100g deben ser un número positivo.'),
    body('carbs_per_100g').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Los carbohidratos por 100g deben ser un número positivo.'),
    body('fat_per_100g').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Las grasas por 100g deben ser un número positivo.'),
    // --- FIN ---
];

const updateFoodLogValidationRules = [
    body('description').optional().trim().notEmpty().withMessage('La descripción es obligatoria.'),
    body('calories').optional().isFloat({ min: 0 }).withMessage('Las calorías deben ser un número positivo o cero.'),
    body('protein_g').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Las proteínas deben ser un número positivo.'),
    body('carbs_g').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Los carbohidratos deben ser un número positivo.'),
    body('fats_g').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Las grasas deben ser un número positivo.'),
    body('weight_g').optional({ nullable: true }).isFloat({ min: 0.1 }).withMessage('El peso debe ser un número positivo.'),
    // No validamos image_url aquí
    body('micronutrients').optional({ nullable: true }).isObject().withMessage('Micronutrientes debe ser un objeto JSON.'),

    // --- INICIO: Validaciones para campos por 100g ---
    body('calories_per_100g').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Las calorías por 100g deben ser un número positivo.'),
    body('protein_per_100g').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Las proteínas por 100g deben ser un número positivo.'),
    body('carbs_per_100g').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Los carbohidratos por 100g deben ser un número positivo.'),
    body('fat_per_100g').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Las grasas por 100g deben ser un número positivo.'),
    // --- FIN ---
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Borrar archivo si la validación falla después de procesarlo
        if (req.file && req.file.processedPath) {
            const filePath = path.join(__dirname, '..', 'public', req.file.processedPath);
            fs.unlink(filePath).catch(err => console.error("Error al borrar archivo tras validación fallida:", err));
        }
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
// --- FIN MODIFICACIÓN ---


// Middleware de autenticación para todas las rutas de nutrición
router.use(authenticateToken);

// Obtener registros de nutrición y agua para una fecha
// --- INICIO MODIFICACIÓN: Añadir validación y handleValidationErrors ---
router.get('/', [
    query('date').isISO8601().toDate().withMessage('Fecha inválida.'),
    handleValidationErrors
], nutritionController.getNutritionLogsByDate);
// --- FIN MODIFICACIÓN ---


// Obtener resumen de nutrición para un mes
// --- INICIO MODIFICACIÓN: Añadir validación y handleValidationErrors ---
router.get('/summary', [
    query('month').isInt({ min: 1, max: 12 }).withMessage('Mes inválido.'),
    query('year').isInt({ min: 2000, max: 2100 }).withMessage('Año inválido.'),
    handleValidationErrors
], nutritionController.getNutritionSummary);
// --- FIN MODIFICACIÓN ---

// Obtener comidas registradas recientemente
router.get('/recent', nutritionController.getRecentMeals);

// --- INICIO DE LA MODIFICACIÓN ---
// Nueva ruta para buscar alimentos (en favoritos y/o base de datos global)
router.get('/search', [
    query('q')
        .notEmpty().withMessage('El término de búsqueda es obligatorio.')
        .isString().withMessage('El término de búsqueda debe ser un texto.')
        .trim()
], handleValidationErrors, nutritionController.searchFoods);
// --- FIN DE LA MODIFICACIÓN ---


// Ruta para subir la imagen de una comida y obtener la URL
// (Esta ruta se mantiene por si el cliente quiere subir la imagen por separado)
router.post('/food/image',
    upload.single('foodImage'),     // Multer primero
    processAndSaveFoodImage,       // Sharp después
    (req, res, next) => {          // Controlador simple para devolver la URL
        if (!req.file || !req.file.processedPath) {
            // Si processAndSaveFoodImage falló, ya habrá enviado una respuesta de error
            // Si no hay archivo, es un error del cliente
            return res.status(400).json({ error: 'No se procesó ninguna imagen.' });
        }
        // Devuelve solo la URL relativa de la imagen procesada
        res.status(201).json({ imageUrl: req.file.processedPath });
    }
);


// Añadir un nuevo registro de comida
// --- INICIO MODIFICACIÓN: Añadir upload y processAndSaveFoodImage ---
// Ahora esta ruta acepta multipart/form-data (con imagen) O application/json (sin imagen)
router.post('/food',
    upload.single('image'),       // 1. Multer (opcional, campo 'image')
    processAndSaveFoodImage,      // 2. Sharp (si hay imagen)
    foodLogValidationRules,       // 3. Validación
    handleValidationErrors,       // 4. Manejo de errores
    nutritionController.addFoodLog // 5. Controlador
);
// --- FIN MODIFICACIÓN ---

// Actualizar un registro de comida
// --- INICIO MODIFICACIÓN: Añadir upload y processAndSaveFoodImage ---
router.put('/food/:logId',
    upload.single('image'),       // 1. Multer (opcional, campo 'image')
    processAndSaveFoodImage,      // 2. Sharp (si hay imagen)
    [ // 3. Array de validación
        param('logId').isInt().withMessage('ID de log inválido.'),
        ...updateFoodLogValidationRules,
    ],
    handleValidationErrors,       // 4. Manejo de errores
    nutritionController.updateFoodLog // 5. Controlador
);
// --- FIN MODIFICACIÓN ---

// Eliminar un registro de comida
// --- INICIO MODIFICACIÓN: Añadir validación y handleValidationErrors ---
router.delete('/food/:logId', [
    param('logId').isInt().withMessage('ID de log inválido.'),
    handleValidationErrors
], nutritionController.deleteFoodLog);
// --- FIN MODIFICACIÓN ---

// Añadir o actualizar un registro de agua
// --- INICIO MODIFICACIÓN: Añadir validación y handleValidationErrors ---
router.post('/water', [
    body('log_date').isISO8601().toDate().withMessage('Fecha inválida.'),
    body('quantity_ml').isInt({ min: 0 }).withMessage('Cantidad de agua inválida.'),
    handleValidationErrors
], nutritionController.upsertWaterLog);
// --- FIN MODIFICACIÓN ---

// Buscar producto por código de barras
router.get('/barcode/:barcode', nutritionController.searchByBarcode);

export default router;