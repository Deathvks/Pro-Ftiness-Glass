import express from 'express';
import { body } from 'express-validator';
import nutritionController from '../controllers/nutritionController.js';
import authenticateToken from '../middleware/authenticateToken.js';
// --- INICIO DE LA MODIFICACIÓN ---
import multer from 'multer';
import path from 'path';

// Configurar multer para almacenamiento en disco
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Esta ruta es relativa a la raíz del proyecto backend
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
// --- FIN DE LA MODIFICACIÓN ---

const router = express.Router();

// Todas las rutas en este fichero requieren que el usuario esté autenticado
router.use(authenticateToken);

// --- Reglas de Validación ---

const updateNutritionLogRules = [
    body('description').trim().notEmpty().withMessage('La descripción es requerida.'),
    body('calories').isInt({ min: 0 }).withMessage('Las calorías deben ser un número positivo.'),
    body('protein_g').optional().isFloat({ min: 0 }).withMessage('Las proteínas deben ser un número positivo.'),
    body('carbs_g').optional().isFloat({ min: 0 }).withMessage('Los carbohidratos deben ser un número positivo.'),
    body('fats_g').optional().isFloat({ min: 0 }).withMessage('Las grasas deben ser un número positivo.'),
];

const upsertWaterLogRules = [
    body('log_date').isISO8601().toDate().withMessage('La fecha no es válida.'),
    body('quantity_ml').isInt({ min: 0 }).withMessage('La cantidad de agua debe ser un número positivo.'),
];


// --- Rutas ---

// GET /api/nutrition?date=YYYY-MM-DD -> Obtener logs de un día
router.get('/nutrition', nutritionController.getLogsByDate);

// GET /api/nutrition/summary?month=M&year=YYYY -> Obtener resumen de un mes
router.get('/nutrition/summary', nutritionController.getNutritionSummary);

// GET /api/nutrition/barcode/:barcode -> Buscar producto por código de barras
router.get('/nutrition/barcode/:barcode', nutritionController.searchByBarcode);

// POST /api/nutrition/food -> Añadir una comida
router.post('/nutrition/food', nutritionController.addNutritionLog);

// --- INICIO DE LA MODIFICACIÓN ---
// POST /api/nutrition/food/image -> Subir una imagen para una comida
router.post('/nutrition/food/image', upload.single('foodImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: 'No se ha subido ningún archivo.' });
  }
  // Devolvemos la URL donde se ha guardado el archivo
  // La URL será relativa al servidor, ej: /uploads/foodImage-1678886400000.jpg
  res.status(201).json({ imageUrl: `/${req.file.path.replace(/\\/g, '/')}` });
});
// --- FIN DE LA MODIFICACIÓN ---

// PUT /api/nutrition/food/:logId -> Actualizar una comida
router.put('/nutrition/food/:logId', updateNutritionLogRules, nutritionController.updateNutritionLog);

// DELETE /api/nutrition/food/:logId -> Eliminar una comida
router.delete('/nutrition/food/:logId', nutritionController.deleteNutritionLog);

// POST /api/nutrition/water -> Añadir o actualizar el agua de un día
router.post('/nutrition/water', upsertWaterLogRules, nutritionController.upsertWaterLog);


export default router;