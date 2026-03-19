/* backend/routes/routines.js */
import express from 'express';
import { body } from 'express-validator';
import routineController from '../controllers/routineController.js';
import authenticateToken from '../middleware/authenticateToken.js';
import { upload, processUploadedFile } from '../services/uploadService.js';

const router = express.Router();

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
router.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }
        
        const result = await processUploadedFile(req.file);
        res.json({ imageUrl: result.url });
    } catch (error) {
        console.error("Error al procesar la imagen de la rutina:", error);
        res.status(500).json({ error: 'Error al procesar la imagen' });
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