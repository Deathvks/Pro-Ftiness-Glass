/* backend/routes/routines.js */
import express from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import routineController from '../controllers/routineController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// --- CONFIGURACIÓN MULTER (SUBIDA DE IMÁGENES) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../public/uploads/routines');

// Asegurar que el directorio existe
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Nombre único: routine-timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `routine-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes.'));
        }
    }
});

router.use(authenticateToken);

// --- VALIDACIÓN ---
const routineValidationRules = [
    body('name').trim().notEmpty().withMessage('El nombre de la rutina es requerido.'),
    body('description').optional().trim(),
    body('folder').optional().trim(), 
    body('image_url').optional(),
    body('visibility').optional().isIn(['private', 'friends', 'public']).withMessage('Visibilidad no válida.'),
    
    body('exercises.*.name').trim().notEmpty().withMessage('El nombre del ejercicio es requerido.'),
    body('exercises.*.sets').isInt({ min: 1 }).withMessage('Las series deben ser un número positivo.'),
    body('exercises.*.reps').trim().notEmpty().withMessage('Las repeticiones son requeridas.')
];

// --- RUTAS DE UTILIDAD (Antes de /:id) ---

// Endpoint específico para subir imagen de rutina
router.post('/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }
        // Devolvemos la ruta relativa para guardarla en la BD
        const imageUrl = `/uploads/routines/${req.file.filename}`;
        res.json({ imageUrl });
    } catch (error) {
        res.status(500).json({ error: 'Error al subir la imagen' });
    }
});

// --- RUTAS DE COMUNIDAD (Orden importante: antes de /:id) ---

// Obtener todas las rutinas públicas (Buscador/Feed)
router.get('/public', routineController.getPublicRoutines);

// NUEVO: Obtener una rutina compartida para vista previa (Pública o Amigos)
router.get('/public/:id', routineController.getPublicRoutineById);

// Descargar (copiar) una rutina pública a tu colección
router.post('/:id/download', routineController.downloadRoutine);

// NUEVO: Alias para coincidir con la petición '/fork' del frontend
router.post('/:id/fork', routineController.downloadRoutine);

// Alternar estado público/privado de una rutina propia
router.put('/:id/toggle-public', routineController.togglePublicStatus);


// --- RUTAS CRUD ESTÁNDAR ---

// Obtener mis rutinas
router.get('/', routineController.getAllRoutines);

// Crear rutina
router.post('/', routineValidationRules, routineController.createRoutine);

// Obtener rutina por ID
router.get('/:id', routineController.getRoutineById);

// Actualizar rutina
router.put('/:id', routineValidationRules, routineController.updateRoutine);

// Eliminar rutina
router.delete('/:id', routineController.deleteRoutine);

export default router;