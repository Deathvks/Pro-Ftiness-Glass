/* backend/routes/users.js */
import express from 'express';
import userController from '../controllers/userController.js';
import { body, validationResult } from 'express-validator';
import authenticateToken from '../middleware/authenticateToken.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuración de Multer y Sharp ---
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Error: Solo se permiten imágenes (jpeg, jpg, png, webp)!'));
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
});

const processAndSaveProfileImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Usuario no autenticado para procesar imagen.' });
    }

    try {
        const uniqueSuffix = `user-${req.user.userId}-${Date.now()}`;
        const webpFilename = `profile-${uniqueSuffix}.webp`;
        const outputDir = path.join(__dirname, '..', 'public', 'images', 'profiles');
        const outputPath = path.join(outputDir, webpFilename);

        await fs.mkdir(outputDir, { recursive: true });

        await sharp(req.file.buffer)
            .resize(300, 300, {
                fit: sharp.fit.cover,
                position: sharp.strategy.entropy
            })
            .webp({ quality: 80 })
            .toFile(outputPath);

        req.file.processedPath = `/images/profiles/${webpFilename}`;
        next();
    } catch (error) {
        console.error('Error procesando imagen de perfil con Sharp:', error);
        return res.status(400).json({ error: 'Error al procesar la imagen de perfil.' });
    }
};

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.file && req.file.processedPath) {
            const filePath = path.join(__dirname, '..', 'public', req.file.processedPath);
            fs.unlink(filePath).catch(err => console.error("Error al borrar imagen de perfil tras validación fallida:", err));
        }
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

router.use(authenticateToken);

// GET /api/users/me (Obtener perfil)
router.get('/me', userController.getMyProfile);

// POST /api/users/me/gamification (Actualizar progreso - Admin/Dev o uso interno)
router.post(
    '/me/gamification',
    [
        body('xp').optional().isInt({ min: 0 }),
        body('level').optional().isInt({ min: 1 }),
        body('streak').optional().isInt({ min: 0 }),
        // Permitimos ambos formatos: camelCase (legacy) y snake_case (nuevo frontend)
        body('lastActivityDate').optional().isISO8601().toDate(),
        body('last_activity_date').optional().isISO8601().toDate(),

        body('unlockedBadges').optional().isArray(),
        body('unlocked_badges').optional().isArray()
    ],
    handleValidationErrors,
    userController.updateGamificationStats
);


// PUT /api/users/me (Actualizar perfil físico y PRIVACIDAD)
router.put(
    '/me',
    [
        body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Género inválido'),
        body('age').optional().isInt({ min: 10, max: 120 }).withMessage('Edad inválida'),
        body('weight').optional().isFloat({ min: 20, max: 500 }).withMessage('Peso inválido'),
        body('height').optional().isInt({ min: 100, max: 250 }).withMessage('Altura inválida'),
        body('activityLevel').optional().isFloat({ min: 1.1, max: 2.0 }).withMessage('Nivel de actividad inválido'),
        body('goal').optional().isIn(['lose', 'maintain', 'gain']).withMessage('Objetivo inválido'),
        // --- Nuevas validaciones de privacidad ---
        body('is_public_profile').optional().isBoolean(),
        body('show_level_xp').optional().isBoolean(),
        body('show_badges').optional().isBoolean()
    ],
    handleValidationErrors,
    userController.updateMyProfile
);

// PUT /api/users/me/account (Actualizar datos de la cuenta)
router.put(
    '/me/account',
    upload.single('profileImage'),
    processAndSaveProfileImage,
    [
        body('name')
            .optional({ checkFalsy: true })
            .isLength({ min: 3, max: 50 })
            .withMessage('Si se proporciona, el nombre debe tener entre 3 y 50 caracteres.'),

        body('username')
            .optional({ checkFalsy: true })
            .isLength({ min: 3, max: 30 })
            .withMessage('Si se proporciona, el nombre de usuario debe tener entre 3 y 30 caracteres.')
            .matches(/^[a-zA-Z0-9_.-]+$/)
            .withMessage('Nombre de usuario solo puede contener letras, números, _, . y -'),

        body('email')
            .optional({ checkFalsy: true })
            .isEmail()
            .normalizeEmail()
            .withMessage('Si se proporciona, debe ser un email válido.'),

        body('newPassword')
            .optional({ checkFalsy: true })
            .isLength({ min: 6 })
            .withMessage('La nueva contraseña debe tener al menos 6 caracteres.'),

        body('currentPassword')
            .if(body('newPassword').exists({ checkFalsy: true }))
            .notEmpty()
            .withMessage('La contraseña actual es requerida para cambiarla.')
    ],
    handleValidationErrors,
    (req, res, next) => {
        if (req.file && req.file.processedPath) {
            req.processedImagePath = req.file.processedPath;
        }
        userController.updateMyAccount(req, res, next);
    }
);

// DELETE /api/users/me/data (Limpiar datos del usuario)
router.delete(
    '/me/data',
    userController.clearMyData
);

// DELETE /api/users/me (Borrar cuenta de usuario)
router.delete(
    '/me',
    userController.deleteMyAccount
);

export default router;