/* backend/routes/reports.js */
import express from 'express';
import multer from 'multer';
import * as reportController from '../controllers/reportController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

const ALLOWED_REPORT_IMAGE_MIMES = new Set([
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif'
]);

// Usamos memoryStorage para procesar las imágenes con sharp en el controlador sin generar archivos temporales
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const mime = (file.mimetype || '').toLowerCase();
        ALLOWED_REPORT_IMAGE_MIMES.has(mime)
            ? cb(null, true)
            : cb(new Error('Solo se permiten imágenes JPG, PNG, WebP, GIF o HEIC'), false);
    }
});

// Soporte para hasta 3 imágenes
router.post('/', authenticateToken, upload.array('images', 3), reportController.createReport);

export default router;