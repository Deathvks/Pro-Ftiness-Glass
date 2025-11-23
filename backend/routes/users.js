import express from 'express';
// --- INICIO MODIFICACIÓN: Importar userController como default ---
import userController from '../controllers/userController.js';
// --- FIN MODIFICACIÓN ---
import { body, validationResult } from 'express-validator'; // Import validationResult
import authenticateToken from '../middleware/authenticateToken.js';
import multer from 'multer';
import path from 'path';
// --- INICIO MODIFICACIÓN: Importar fs.promises y sharp ---
import fs from 'fs/promises'; // Usar promesas de fs
import sharp from 'sharp';
// --- FIN MODIFICACIÓN ---
import { fileURLToPath } from 'url';

const router = express.Router();

// Requerido en ESM para simular __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Esto será /app/backend/routes

// --- INICIO DE LA MODIFICACIÓN: Configuración de Multer con memoryStorage y Sharp ---

// Usamos memoryStorage para procesar con Sharp antes de guardar
const storage = multer.memoryStorage();

// Filtro de archivos para aceptar solo imágenes compatibles con Sharp
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/; // Añadido webp
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
    limits: {
        fileSize: 2 * 1024 * 1024 // Límite de 2MB (ajustado de 5MB)
    }
});

// Middleware para procesar la imagen con Sharp y guardarla como WebP
const processAndSaveProfileImage = async (req, res, next) => {
    if (!req.file) {
        return next(); // Si no hay archivo, continuar
    }
    // Asegurarse de que req.user existe (authenticateToken debe haber corrido antes)
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Usuario no autenticado para procesar imagen.' });
    }

    try {
        const uniqueSuffix = `user-${req.user.userId}-${Date.now()}`;
        const webpFilename = `profile-${uniqueSuffix}.webp`; // Nombre del archivo final será .webp
        const outputDir = path.join(__dirname, '..', 'public', 'images', 'profiles'); // Ruta de guardado corregida
        const outputPath = path.join(outputDir, webpFilename);

        // Asegurarse de que el directorio de uploads existe
        await fs.mkdir(outputDir, { recursive: true });

        // Procesar con Sharp: redimensionar a 300x300 y convertir a WebP
        await sharp(req.file.buffer)
            .resize(300, 300, {
                fit: sharp.fit.cover,
                position: sharp.strategy.entropy
            })
            .webp({ quality: 80 }) // Convertir a WebP con calidad 80
            .toFile(outputPath);

        // Guardar la URL relativa en req para el controlador
        req.file.processedPath = `/images/profiles/${webpFilename}`; // Ruta relativa desde 'public'

        next();
    } catch (error) {
        console.error('Error procesando imagen de perfil con Sharp:', error);
        return res.status(400).json({ error: 'Error al procesar la imagen de perfil.' });
    }
};
// --- FIN DE LA MODIFICACIÓN ---

// Middleware para manejar errores de validación y borrar imagen procesada si falla
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Si hay errores Y se procesó una imagen, la borramos
        if (req.file && req.file.processedPath) {
             const filePath = path.join(__dirname, '..', 'public', req.file.processedPath);
             fs.unlink(filePath).catch(err => console.error("Error al borrar imagen de perfil tras validación fallida:", err));
        }
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// --- SE ELIMINÓ passwordValidationRules ---
// La validación ahora es condicional dentro del controlador (userController)


// Aplicar autenticación a todas las rutas de /users
// Esto asegura que req.user.userId esté disponible ANTES de multer/sharp
router.use(authenticateToken);

// GET /api/users/me (Obtener perfil)
router.get('/me', userController.getMyProfile);

// PUT /api/users/me (Actualizar perfil físico)
router.put(
    '/me',
    [ // Validaciones primero
        body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Género inválido'),
        body('age').optional().isInt({ min: 10, max: 120 }).withMessage('Edad inválida'), // Ajustado min age
        body('weight').optional().isFloat({ min: 20, max: 500 }).withMessage('Peso inválido'),
        body('height').optional().isInt({ min: 100, max: 250 }).withMessage('Altura inválida'),
        body('activityLevel').optional().isFloat({ min: 1.1, max: 2.0 }).withMessage('Nivel de actividad inválido'), // Ajustado rango
        body('goal').optional().isIn(['lose', 'maintain', 'gain']).withMessage('Objetivo inválido'),
    ],
    handleValidationErrors, // Manejar errores de validación
    userController.updateMyProfile // Controlador al final
);

// PUT /api/users/me/account (Actualizar datos de la cuenta)
router.put(
    '/me/account',
    // 1. Middleware de Multer para capturar el archivo en memoria
    upload.single('profileImage'),
    // 2. Middleware de Sharp para procesar y guardar la imagen (si existe)
    processAndSaveProfileImage,
    // 3. Validaciones de los campos de texto
    [
        // Name: Opcional, longitud válida si se envía.
        body('name')
          .optional({ checkFalsy: true })
          .isLength({ min: 3, max: 50 })
          .withMessage('Si se proporciona, el nombre debe tener entre 3 y 50 caracteres.'),

        // Username: Opcional, longitud y formato válidos si se envía.
        body('username')
          .optional({ checkFalsy: true })
          .isLength({ min: 3, max: 30 })
          .withMessage('Si se proporciona, el nombre de usuario debe tener entre 3 y 30 caracteres.')
          .matches(/^[a-zA-Z0-9_.-]+$/)
          .withMessage('Nombre de usuario solo puede contener letras, números, _, . y -'),

        // Email: Opcional, formato válido si se envía.
        body('email')
          .optional({ checkFalsy: true })
          .isEmail()
          .normalizeEmail() // Normalizar email
          .withMessage('Si se proporciona, debe ser un email válido.'),

        // New Password: Opcional, longitud mínima si se envía.
        body('newPassword')
          .optional({ checkFalsy: true })
          .isLength({ min: 6 })
          .withMessage('La nueva contraseña debe tener al menos 6 caracteres.'),

        // Current Password: Requerida solo si se envía newPassword.
        body('currentPassword')
          .if(body('newPassword').exists({ checkFalsy: true })) // Condicional
          .notEmpty()
          .withMessage('La contraseña actual es requerida para cambiarla.')
    ],
    // 4. Manejar errores de validación (borra imagen si falla)
    handleValidationErrors,
    // 5. Controlador final (pasa req.file.processedPath si existe)
    (req, res, next) => {
        // Pasamos la ruta de la imagen procesada al controlador si existe
        if (req.file && req.file.processedPath) {
            req.processedImagePath = req.file.processedPath;
        }
        userController.updateMyAccount(req, res, next);
    }
);

// --- INICIO DE LA MODIFICACIÓN: Rutas de borrado (Sin validación obligatoria) ---

// DELETE /api/users/me/data (Limpiar datos del usuario)
router.delete(
    '/me/data',
    // Eliminada la validación de contraseña aquí
    userController.clearMyData // Controlador
);

// DELETE /api/users/me (Borrar cuenta de usuario)
router.delete(
    '/me',
    // Eliminada la validación de contraseña aquí
    userController.deleteMyAccount // Controlador
);
// --- FIN DE LA MODIFICACIÓN ---

export default router;