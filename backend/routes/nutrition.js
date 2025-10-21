import express from 'express';
import nutritionController from '../controllers/nutritionController.js';
import authenticateToken from '../middleware/authenticateToken.js';
import multer from 'multer'; // <-- IMPORTACIÓN MODIFICADA

const router = express.Router();

// --- INICIO DE LA MODIFICACIÓN ---

// Configuración de Multer para la subida de imágenes
// Usamos memoryStorage para procesar la imagen en el controlador antes de guardarla
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
    fileFilter: (req, file, cb) => {
        // Aceptar solo formatos de imagen comunes
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
            cb(null, true);
        } else {
            cb(new Error('Formato de imagen no válido. Solo se permite JPEG, PNG o GIF.'), false);
        }
    }
});
// --- FIN DE LA MODIFICACIÓN ---

// Middleware de autenticación para todas las rutas de nutrición
router.use(authenticateToken);

// Obtener registros de nutrición y agua para una fecha
router.get('/', nutritionController.getNutritionLogsByDate);

// Obtener resumen de nutrición para un mes
router.get('/summary', nutritionController.getNutritionSummary);

// --- INICIO DE LA MODIFICACIÓN ---
// Ruta para subir la imagen de una comida.
// Se usa upload.single('foodImage') donde 'foodImage' coincide con el nombre del campo en el FormData del frontend
router.post('/food/image', upload.single('foodImage'), nutritionController.uploadFoodImage);
// --- FIN DE LA MODIFICACIÓN ---

// Añadir un nuevo registro de comida
router.post('/food', nutritionController.addFoodLog);

// Actualizar un registro de comida
router.put('/food/:logId', nutritionController.updateFoodLog);

// Eliminar un registro de comida
router.delete('/food/:logId', nutritionController.deleteFoodLog);

// Añadir o actualizar un registro de agua
router.post('/water', nutritionController.upsertWaterLog);

// Buscar producto por código de barras
router.get('/barcode/:barcode', nutritionController.searchByBarcode);

export default router; // <-- EXPORTACIÓN MODIFICADA