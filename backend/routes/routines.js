/* backend/routes/routines.js */
import express from 'express';
import { body, validationResult } from 'express-validator';
import routineController from '../controllers/routineController.js';
import authenticateToken from '../middleware/authenticateToken.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp).'));
    }
});

const processAndSaveRoutineImage = async (req, res, next) => {
    if (!req.file) return next();

    try {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const webpFilename = `routine-${uniqueSuffix}.webp`;
        const outputDir = path.join(__dirname, '..', 'public', 'images', 'routines');
        const outputPath = path.join(outputDir, webpFilename);

        await fs.mkdir(outputDir, { recursive: true });

        await sharp(req.file.buffer)
            .rotate()
            .resize(800, 800, {
                fit: sharp.fit.inside,
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toFile(outputPath);

        req.file.processedPath = `/images/routines/${webpFilename}`;
        next();
    } catch (error) {
        return res.status(400).json({ error: 'Error al procesar la imagen de la rutina.' });
    }
};

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.file && req.file.processedPath) {
            const filePath = path.join(__dirname, '..', 'public', req.file.processedPath);
            fs.unlink(filePath).catch(() => {});
        }
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

router.use(authenticateToken);

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

router.post(
    '/upload-image',
    upload.single('image'),
    processAndSaveRoutineImage,
    (req, res) => {
        if (!req.file || !req.file.processedPath) {
            return res.status(400).json({ error: 'No se procesó ninguna imagen' });
        }
        res.json({ imageUrl: req.file.processedPath });
    }
);

router.get('/public', routineController.getPublicRoutines);
router.get('/public/:id', routineController.getPublicRoutineById);
router.post('/:id/download', routineController.downloadRoutine);
router.post('/:id/fork', routineController.downloadRoutine);
router.put('/:id/toggle-public', routineController.togglePublicStatus);

router.get('/', routineController.getAllRoutines);
router.post('/', routineValidationRules, handleValidationErrors, routineController.createRoutine);
router.get('/:id', routineController.getRoutineById);
router.put('/:id', routineValidationRules, handleValidationErrors, routineController.updateRoutine);
router.delete('/:id', routineController.deleteRoutine);

export default router;